use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use rust_decimal::Decimal;
use sqlx::PgPool;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct DashboardBid {
    pub id: uuid::Uuid,
    pub task_id: uuid::Uuid,
    pub seller_id: uuid::Uuid,
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

#[derive(serde::Serialize)]
pub struct DashboardResponse {
    pub tasks_posted: Vec<crate::models::task::Task>,
    pub tasks_working: Vec<crate::models::task::Task>,
    pub my_bids: Vec<DashboardBid>,
    pub total_earned: Decimal,
    pub total_spent: Decimal,
    pub active_escrow: Decimal,
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

    Ok(Json(DashboardResponse {
        tasks_posted,
        tasks_working,
        my_bids,
        total_earned,
        total_spent,
        active_escrow,
        page,
        per_page,
        generated_at: chrono::Utc::now(),
    }))
}
