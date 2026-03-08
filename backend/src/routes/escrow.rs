use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use rust_decimal::Decimal;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::decimal_format;

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct DashboardBid {
    pub id: uuid::Uuid,
    pub task_id: uuid::Uuid,
    pub seller_id: uuid::Uuid,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub price: Decimal,
    pub currency: String,
    pub estimated_delivery_days: i32,
    pub pitch: String,
    pub status: crate::models::bid::BidStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub updated_at: chrono::DateTime<chrono::Utc>,
    pub task_slug: String,
    pub task_title: String,
}

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct DashboardCurrencyBreakdown {
    pub currency: String,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub earned: Decimal,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub spent: Decimal,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub in_escrow: Decimal,
}

#[derive(serde::Serialize)]
pub struct DashboardResponse {
    pub tasks_posted: Vec<crate::models::task::Task>,
    pub tasks_working: Vec<crate::models::task::Task>,
    pub my_bids: Vec<DashboardBid>,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub total_earned: Decimal,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub total_spent: Decimal,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub active_escrow: Decimal,
    pub currency_breakdown: Vec<DashboardCurrencyBreakdown>,
    pub page: i64,
    pub per_page: i64,
    pub generated_at: chrono::DateTime<chrono::Utc>,
}

#[rocket::get("/api/dashboard?<page>&<per_page>")]
pub async fn dashboard(
    pool: &State<PgPool>,
    auth: AuthUser,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<DashboardResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let tasks_posted = sqlx::query_as::<_, crate::models::task::Task>(
        "SELECT * FROM tasks WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3"
    )
    .bind(auth.user_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Tasks where I'm the seller (accepted bid)
    let tasks_working = sqlx::query_as::<_, crate::models::task::Task>(
        r#"SELECT t.* FROM tasks t
           JOIN bids b ON t.accepted_bid_id = b.id
           WHERE b.seller_id = $1
           ORDER BY t.updated_at DESC LIMIT $2 OFFSET $3"#,
    )
    .bind(auth.user_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let my_bids = sqlx::query_as::<_, DashboardBid>(
        r#"SELECT b.*, t.slug AS task_slug, t.title AS task_title
           FROM bids b JOIN tasks t ON b.task_id = t.id
           WHERE b.seller_id = $1 ORDER BY b.created_at DESC LIMIT $2 OFFSET $3"#,
    )
    .bind(auth.user_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let total_earned = sqlx::query_scalar::<_, Decimal>(
        "SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE seller_id = $1 AND status = 'released'"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or_default();

    let total_spent = sqlx::query_scalar::<_, Decimal>(
        "SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE buyer_id = $1 AND status = 'released'"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or_default();

    let active_escrow = sqlx::query_scalar::<_, Decimal>(
        "SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE (buyer_id = $1 OR seller_id = $1) AND status = 'locked'"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or_default();

    // Per-currency breakdown
    let currency_breakdown = sqlx::query_as::<_, DashboardCurrencyBreakdown>(
        r#"SELECT currency,
                  COALESCE(SUM(CASE WHEN seller_id = $1 AND status = 'released' THEN amount ELSE 0 END), 0) AS earned,
                  COALESCE(SUM(CASE WHEN buyer_id = $1 AND status = 'released' THEN amount ELSE 0 END), 0) AS spent,
                  COALESCE(SUM(CASE WHEN (buyer_id = $1 OR seller_id = $1) AND status = 'locked' THEN amount ELSE 0 END), 0) AS in_escrow
           FROM escrow
           WHERE buyer_id = $1 OR seller_id = $1
           GROUP BY currency
           ORDER BY currency"#
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .unwrap_or_default();

    // Non-lazy auto-approve warnings: check buyer's delivered tasks for 48h+ pending review
    {
        let delivered_tasks = sqlx::query_as::<_, (Uuid, String, chrono::DateTime<chrono::Utc>)>(
            r#"SELECT t.id, t.title, d.created_at
               FROM tasks t
               JOIN LATERAL (SELECT created_at FROM deliveries WHERE task_id = t.id ORDER BY created_at DESC LIMIT 1) d ON true
               WHERE t.buyer_id = $1 AND t.status = 'delivered'"#
        )
        .bind(auth.user_id)
        .fetch_all(pool.inner())
        .await
        .unwrap_or_default();

        let warn_threshold = chrono::Duration::hours(crate::constants::AUTO_APPROVE_HOURS - 24);
        let approve_threshold = chrono::Duration::hours(crate::constants::AUTO_APPROVE_HOURS);

        for (task_id, title, delivered_at) in &delivered_tasks {
            let elapsed = chrono::Utc::now() - *delivered_at;
            if elapsed >= warn_threshold && elapsed < approve_threshold {
                let already_warned = sqlx::query_scalar::<_, i64>(
                    "SELECT COUNT(*) FROM notifications WHERE task_id = $1 AND kind = 'auto_approve_warning'::notification_kind"
                )
                .bind(task_id)
                .fetch_one(pool.inner())
                .await
                .unwrap_or(0);
                if already_warned == 0 {
                    let hours_left = crate::constants::AUTO_APPROVE_HOURS - elapsed.num_hours();
                    crate::routes::notifications::create_notification(
                        pool.inner(), auth.user_id, "auto_approve_warning",
                        &format!("Delivery for \"{}\" will be auto-approved in ~{} hours. Review it now or it will be automatically completed.", title, hours_left),
                        Some(*task_id)
                    ).await;
                }
            }
        }
    }

    Ok(Json(DashboardResponse {
        tasks_posted,
        tasks_working,
        my_bids,
        total_earned,
        total_spent,
        active_escrow,
        currency_breakdown,
        page,
        per_page,
        generated_at: chrono::Utc::now(),
    }))
}

// --- Earnings / Transaction History ---

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct EarningsTransaction {
    pub id: Uuid,
    pub task_id: Uuid,
    pub task_title: String,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub amount: Decimal,
    pub currency: String,
    pub status: String,
    pub role: String, // "seller" or "buyer"
    pub counterparty_name: String,
    pub locked_at: chrono::DateTime<chrono::Utc>,
    pub released_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(serde::Serialize)]
pub struct CurrencySummary {
    pub currency: String,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub total_earned: Decimal,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub total_spent: Decimal,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub in_escrow: Decimal,
}

#[derive(serde::Serialize)]
pub struct EarningsResponse {
    pub transactions: Vec<EarningsTransaction>,
    pub summary: Vec<CurrencySummary>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

#[rocket::get("/api/earnings?<page>&<per_page>&<role>&<currency>")]
pub async fn earnings(
    pool: &State<PgPool>,
    auth: AuthUser,
    page: Option<i64>,
    per_page: Option<i64>,
    role: Option<String>,
    currency: Option<String>,
) -> Result<Json<EarningsResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    // Build filter conditions
    let role_filter = role.as_deref().unwrap_or("all");
    let role_clause = match role_filter {
        "seller" => "AND e.seller_id = $1 AND e.buyer_id != $1",
        "buyer" => "AND e.buyer_id = $1 AND e.seller_id != $1",
        _ => "AND (e.seller_id = $1 OR e.buyer_id = $1)",
    };

    let currency_clause = if currency.is_some() { "AND e.currency = $4" } else { "" };

    let count_query = format!(
        "SELECT COUNT(*) FROM escrow e WHERE 1=1 {} {} {}",
        role_clause,
        currency_clause,
        ""
    );

    let total = if let Some(ref curr) = currency {
        sqlx::query_scalar::<_, i64>(&count_query)
            .bind(auth.user_id)
            .bind(auth.user_id)
            .bind(auth.user_id)
            .bind(curr)
            .fetch_one(pool.inner())
            .await
            .unwrap_or(0)
    } else {
        let count_query_no_curr = format!(
            "SELECT COUNT(*) FROM escrow e WHERE 1=1 {}",
            role_clause
        );
        sqlx::query_scalar::<_, i64>(&count_query_no_curr)
            .bind(auth.user_id)
            .fetch_one(pool.inner())
            .await
            .unwrap_or(0)
    };

    // Fetch transactions with task title and counterparty name
    let base_query = format!(
        r#"SELECT e.id, e.task_id, t.title AS task_title, e.amount, e.currency,
                  e.status::text AS status,
                  CASE WHEN e.seller_id = $1 THEN 'seller' ELSE 'buyer' END AS role,
                  CASE WHEN e.seller_id = $1 THEN bu.display_name ELSE su.display_name END AS counterparty_name,
                  e.locked_at, e.released_at
           FROM escrow e
           JOIN tasks t ON t.id = e.task_id
           JOIN users bu ON bu.id = e.buyer_id
           JOIN users su ON su.id = e.seller_id
           WHERE 1=1 {} {}
           ORDER BY e.locked_at DESC
           LIMIT $2 OFFSET $3"#,
        role_clause, currency_clause
    );

    let transactions: Vec<EarningsTransaction> = if let Some(ref curr) = currency {
        sqlx::query_as::<_, EarningsTransaction>(&base_query)
            .bind(auth.user_id)
            .bind(per_page)
            .bind(offset)
            .bind(curr)
            .fetch_all(pool.inner())
            .await
            .map_err(|e| ApiError::internal(e.to_string()))?
    } else {
        let query_no_curr = format!(
            r#"SELECT e.id, e.task_id, t.title AS task_title, e.amount, e.currency,
                      e.status::text AS status,
                      CASE WHEN e.seller_id = $1 THEN 'seller' ELSE 'buyer' END AS role,
                      CASE WHEN e.seller_id = $1 THEN bu.display_name ELSE su.display_name END AS counterparty_name,
                      e.locked_at, e.released_at
               FROM escrow e
               JOIN tasks t ON t.id = e.task_id
               JOIN users bu ON bu.id = e.buyer_id
               JOIN users su ON su.id = e.seller_id
               WHERE 1=1 {}
               ORDER BY e.locked_at DESC
               LIMIT $2 OFFSET $3"#,
            role_clause
        );
        sqlx::query_as::<_, EarningsTransaction>(&query_no_curr)
            .bind(auth.user_id)
            .bind(per_page)
            .bind(offset)
            .fetch_all(pool.inner())
            .await
            .map_err(|e| ApiError::internal(e.to_string()))?
    };

    // Per-currency summary
    let summary_rows = sqlx::query_as::<_, (String, Decimal, Decimal, Decimal)>(
        r#"SELECT currency,
                  COALESCE(SUM(CASE WHEN seller_id = $1 AND status = 'released' THEN amount ELSE 0 END), 0) AS total_earned,
                  COALESCE(SUM(CASE WHEN buyer_id = $1 AND status = 'released' THEN amount ELSE 0 END), 0) AS total_spent,
                  COALESCE(SUM(CASE WHEN (buyer_id = $1 OR seller_id = $1) AND status = 'locked' THEN amount ELSE 0 END), 0) AS in_escrow
           FROM escrow
           WHERE buyer_id = $1 OR seller_id = $1
           GROUP BY currency
           ORDER BY currency"#
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let summary: Vec<CurrencySummary> = summary_rows.into_iter().map(|(currency, total_earned, total_spent, in_escrow)| {
        CurrencySummary { currency, total_earned, total_spent, in_escrow }
    }).collect();

    Ok(Json(EarningsResponse {
        transactions,
        summary,
        total,
        page,
        per_page,
    }))
}
