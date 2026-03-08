use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;
use rust_decimal::Decimal;

use crate::errors::ApiError;
use crate::guards::admin::AdminToken;
use crate::models::dispute::{AdminStatsResponse, DisputeDetail, EscrowCurrencyBreakdown, ResolveDisputeRequest};
use crate::models::task::{TaskStatus, TaskListResponse, TaskSummary};
use crate::models::user::PublicUser;
use crate::services::task_lifecycle::can_transition;
use crate::routes::notifications::create_notification;

async fn audit_log(pool: &PgPool, action: &str, target_type: &str, target_id: Uuid, details: Option<serde_json::Value>) {
    let _ = sqlx::query(
        "INSERT INTO admin_audit_log (action, target_type, target_id, details) VALUES ($1, $2, $3, $4)"
    )
    .bind(action)
    .bind(target_type)
    .bind(target_id)
    .bind(details)
    .execute(pool)
    .await;
}

#[derive(Debug, sqlx::FromRow)]
struct AdminStatsRow {
    total_tasks: i64,
    open_tasks: i64,
    completed_tasks: i64,
    dispute_resolved_count: i64,
    total_escrow_value: Option<Decimal>,
    dispute_count: i64,
    total_users: i64,
}

#[get("/api/admin/stats")]
pub async fn admin_stats(
    _admin: AdminToken,
    pool: &State<PgPool>,
) -> Result<Json<AdminStatsResponse>, (Status, Json<ApiError>)> {
    let row = sqlx::query_as::<_, AdminStatsRow>(
        r#"SELECT
            (SELECT COUNT(*) FROM tasks) AS total_tasks,
            (SELECT COUNT(*) FROM tasks WHERE status IN ('open', 'bidding')) AS open_tasks,
            (SELECT COUNT(*) FROM tasks WHERE status = 'completed') AS completed_tasks,
            (SELECT COUNT(*) FROM tasks WHERE status = 'dispute_resolved') AS dispute_resolved_count,
            (SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE status IN ('locked', 'disputed')) AS total_escrow_value,
            (SELECT COUNT(*) FROM disputes WHERE resolution IS NULL) AS dispute_count,
            (SELECT COUNT(*) FROM users) AS total_users"#,
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let escrow_by_currency = sqlx::query_as::<_, EscrowCurrencyBreakdown>(
        r#"SELECT currency, COALESCE(SUM(amount), 0) AS amount, COUNT(*) AS count
           FROM escrow WHERE status IN ('locked', 'disputed')
           GROUP BY currency ORDER BY amount DESC"#,
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(AdminStatsResponse {
        total_tasks: row.total_tasks,
        open_tasks: row.open_tasks,
        completed_tasks: row.completed_tasks,
        dispute_resolved_count: row.dispute_resolved_count,
        total_escrow_value: row.total_escrow_value.unwrap_or(Decimal::ZERO),
        dispute_count: row.dispute_count,
        total_users: row.total_users,
        escrow_by_currency,
    }))
}

#[derive(Debug, sqlx::FromRow)]
struct AdminTaskRow {
    id: Uuid,
    slug: String,
    title: String,
    category: String,
    tags: Vec<String>,
    budget_min: Decimal,
    budget_max: Decimal,
    currency: String,
    deadline: chrono::DateTime<chrono::Utc>,
    status: TaskStatus,
    priority: String,
    view_count: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    bid_count: i64,
    buyer_uuid: Option<Uuid>,
    buyer_display_name: Option<String>,
    buyer_is_agent: Option<bool>,
    buyer_agent_type: Option<String>,
    buyer_avg_rating: Option<Decimal>,
    buyer_total_ratings: Option<i32>,
    buyer_tasks_posted: Option<i32>,
    buyer_tasks_completed: Option<i32>,
    buyer_created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[get("/api/admin/tasks?<status>&<search>&<page>&<per_page>")]
pub async fn admin_list_tasks(
    _admin: AdminToken,
    pool: &State<PgPool>,
    status: Option<String>,
    search: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<TaskListResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(50).clamp(1, 200);
    let offset = (page - 1) * per_page;
    let status_filter = status.as_deref().unwrap_or("");
    let search_term = search.as_deref().unwrap_or("").trim();
    let search_pattern = if search_term.is_empty() { String::new() } else { format!("%{}%", search_term.to_lowercase()) };

    let total = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(DISTINCT t.id) FROM tasks t
            LEFT JOIN users u ON u.id = t.buyer_id
            LEFT JOIN bids ab ON ab.id = t.accepted_bid_id
            LEFT JOIN users s ON s.id = ab.seller_id
            WHERE ($1 = '' OR t.status::text = $1)
              AND ($2 = '' OR LOWER(t.title) LIKE $2
                           OR LOWER(t.slug) LIKE $2
                           OR LOWER(t.category) LIKE $2
                           OR t.id::text LIKE $2
                           OR LOWER(u.display_name) LIKE $2
                           OR LOWER(u.email) LIKE $2
                           OR LOWER(s.display_name) LIKE $2
                           OR LOWER(s.email) LIKE $2)"#
    )
    .bind(status_filter)
    .bind(&search_pattern)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    let rows = sqlx::query_as::<_, AdminTaskRow>(
        r#"SELECT t.id, t.slug, t.title, t.category, t.tags,
                t.budget_min, t.budget_max, t.currency, t.deadline,
                t.status, t.priority, t.view_count, t.created_at,
                (SELECT COUNT(*) FROM bids WHERE task_id = t.id) AS bid_count,
                u.id AS buyer_uuid, u.display_name AS buyer_display_name,
                u.is_agent AS buyer_is_agent, u.agent_type AS buyer_agent_type,
                u.avg_rating AS buyer_avg_rating, u.total_ratings AS buyer_total_ratings,
                u.tasks_posted AS buyer_tasks_posted, u.tasks_completed AS buyer_tasks_completed,
                u.created_at AS buyer_created_at
            FROM tasks t
            LEFT JOIN users u ON u.id = t.buyer_id
            LEFT JOIN bids ab ON ab.id = t.accepted_bid_id
            LEFT JOIN users s ON s.id = ab.seller_id
            WHERE ($1 = '' OR t.status::text = $1)
              AND ($2 = '' OR LOWER(t.title) LIKE $2
                           OR LOWER(t.slug) LIKE $2
                           OR LOWER(t.category) LIKE $2
                           OR t.id::text LIKE $2
                           OR LOWER(u.display_name) LIKE $2
                           OR LOWER(u.email) LIKE $2
                           OR LOWER(s.display_name) LIKE $2
                           OR LOWER(s.email) LIKE $2)
            ORDER BY t.created_at DESC
            LIMIT $3 OFFSET $4"#,
    )
    .bind(status_filter)
    .bind(&search_pattern)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let tasks: Vec<TaskSummary> = rows.into_iter().map(|row| {
        let buyer = row.buyer_uuid.map(|id| PublicUser {
            id,
            display_name: row.buyer_display_name.unwrap_or_default(),
            bio: None,
            is_agent: row.buyer_is_agent.unwrap_or(false),
            agent_type: row.buyer_agent_type,
            avg_rating: row.buyer_avg_rating,
            total_ratings: row.buyer_total_ratings.unwrap_or(0),
            tasks_posted: row.buyer_tasks_posted.unwrap_or(0),
            tasks_completed: row.buyer_tasks_completed.unwrap_or(0),
            member_since: row.buyer_created_at.unwrap_or_default(),
        });
        TaskSummary {
            id: row.id,
            slug: row.slug,
            title: row.title,
            category: row.category,
            tags: row.tags,
            budget_min: row.budget_min,
            budget_max: row.budget_max,
            currency: row.currency,
            deadline: row.deadline,
            status: row.status,
            priority: row.priority,
            view_count: row.view_count,
            bid_count: Some(row.bid_count),
            buyer,
            is_mine: None,
            created_at: row.created_at,
        }
    }).collect();

    Ok(Json(TaskListResponse {
        tasks,
        total,
        page,
        per_page,
        total_pages,
    }))
}

#[get("/api/admin/disputes")]
pub async fn list_disputes(
    _admin: AdminToken,
    pool: &State<PgPool>,
) -> Result<Json<Vec<DisputeDetail>>, (Status, Json<ApiError>)> {
    let disputes = sqlx::query_as::<_, DisputeDetail>(
        r#"SELECT
            d.id, d.task_id, t.title AS task_title, t.slug AS task_slug,
            t.description AS task_description, t.status AS task_status,
            d.raised_by, d.reason, d.resolution, d.admin_note, d.resolved_at, d.created_at,
            t.buyer_id, buyer.display_name AS buyer_name,
            e.seller_id, seller.display_name AS seller_name,
            e.amount AS escrow_amount,
            b.price AS bid_price, b.pitch AS bid_pitch,
            latest_delivery.message AS delivery_message,
            latest_delivery.url AS delivery_url,
            COALESCE(dc.cnt, 0) AS delivery_count,
            t.currency
        FROM disputes d
        JOIN tasks t ON d.task_id = t.id
        JOIN users buyer ON t.buyer_id = buyer.id
        JOIN escrow e ON e.task_id = t.id
        JOIN users seller ON e.seller_id = seller.id
        LEFT JOIN bids b ON b.id = t.accepted_bid_id
        LEFT JOIN LATERAL (
            SELECT message, url FROM deliveries
            WHERE task_id = t.id ORDER BY created_at DESC LIMIT 1
        ) latest_delivery ON true
        LEFT JOIN LATERAL (
            SELECT COUNT(*) AS cnt FROM deliveries WHERE task_id = t.id
        ) dc ON true
        ORDER BY d.created_at DESC"#,
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(disputes))
}

#[post("/api/admin/disputes/<id>/resolve", data = "<body>")]
pub async fn resolve_dispute(
    _admin: AdminToken,
    pool: &State<PgPool>,
    id: &str,
    body: Json<ResolveDisputeRequest>,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let dispute_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid dispute ID"))?;

    let body = body.into_inner();

    let favor: String = match body.favor {
        Some(ref f) if !f.is_empty() => f.clone(),
        Some(_) => return Err(ApiError::validation(std::collections::HashMap::from([("favor".into(), "Required (cannot be empty)".into())]))),
        None => return Err(ApiError::validation(std::collections::HashMap::from([("favor".into(), "Required".into())]))),
    };
    if favor != "buyer" && favor != "seller" {
        return Err(ApiError::bad_request("favor must be 'buyer' or 'seller'"));
    }

    // Fetch dispute with task status
    let dispute_row = sqlx::query(
        r#"SELECT d.id, d.resolution::text, d.task_id, t.status AS task_status
           FROM disputes d JOIN tasks t ON d.task_id = t.id
           WHERE d.id = $1"#,
    )
    .bind(dispute_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Dispute not found"))?;

    let resolution_text: Option<String> = sqlx::Row::get(&dispute_row, "resolution");
    let task_id: Uuid = sqlx::Row::get(&dispute_row, "task_id");
    let task_status: TaskStatus = sqlx::Row::get(&dispute_row, "task_status");

    if resolution_text.is_some() {
        return Err(ApiError::new(Status::Conflict, "Dispute already resolved"));
    }

    let target_status = TaskStatus::DisputeResolved;

    if !can_transition(&task_status, &target_status) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to {:?}", task_status, target_status
        )));
    }

    let escrow_status = if favor == "buyer" { "refunded" } else { "released" };

    // Fetch buyer_id and seller_id for notifications + tasks_completed
    let escrow_row = sqlx::query_as::<_, (Uuid, Uuid, String)>(
        "SELECT buyer_id, seller_id, (SELECT title FROM tasks WHERE id = $1) FROM escrow WHERE task_id = $1"
    )
    .bind(task_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;
    let (buyer_id, seller_id, task_title) = escrow_row;

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query(
        "UPDATE disputes SET resolution = $1::dispute_resolution, admin_note = $2, resolved_at = now() WHERE id = $3"
    )
    .bind(&favor)
    .bind(&body.admin_note)
    .bind(dispute_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query(
        "UPDATE escrow SET status = $1::escrow_status, released_at = now() WHERE task_id = $2"
    )
    .bind(escrow_status)
    .bind(task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query(
        "UPDATE tasks SET status = 'dispute_resolved'::task_status, dispute_resolved_in_favor_of = $1, updated_at = now() WHERE id = $2"
    )
    .bind(&favor)
    .bind(task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // X02: Increment tasks_completed when dispute resolved in seller's favor
    if favor == "seller" {
        sqlx::query("UPDATE users SET tasks_completed = tasks_completed + 1 WHERE id = $1")
            .bind(seller_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| ApiError::internal(e.to_string()))?;
    }

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // X01: Notify both buyer and seller about dispute resolution
    let outcome = if favor == "buyer" { "in your favor (refund)" } else { "in seller's favor (payment released)" };
    create_notification(pool.inner(), buyer_id, "dispute_resolved", &format!("Dispute on \"{}\" resolved {}", task_title, outcome), Some(task_id)).await;
    let outcome_seller = if favor == "seller" { "in your favor (payment released)" } else { "in buyer's favor (refund)" };
    create_notification(pool.inner(), seller_id, "dispute_resolved", &format!("Dispute on \"{}\" resolved {}", task_title, outcome_seller), Some(task_id)).await;

    audit_log(pool.inner(), "resolve_dispute", "dispute", dispute_id,
        Some(json!({"favor": favor, "admin_note": body.admin_note, "task_id": task_id.to_string()}))).await;

    Ok(Json(json!({"message": "Dispute resolved", "favor": favor})))
}

#[delete("/api/admin/tasks/<id>")]
pub async fn remove_task(
    _admin: AdminToken,
    pool: &State<PgPool>,
    id: &str,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    // Check task exists first
    let exists = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tasks WHERE id = $1"
    )
    .bind(task_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if exists == 0 {
        return Err(ApiError::not_found("Task not found"));
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // Delete dependent records in FK order
    sqlx::query("DELETE FROM ratings WHERE task_id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("DELETE FROM deliveries WHERE task_id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("DELETE FROM disputes WHERE task_id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("DELETE FROM escrow WHERE task_id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("DELETE FROM bids WHERE task_id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("DELETE FROM tasks WHERE id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    audit_log(pool.inner(), "remove_task", "task", task_id, None).await;

    Ok(Json(json!({"message": "Task removed"})))
}

#[post("/api/admin/users/<id>/ban")]
pub async fn ban_user(
    _admin: AdminToken,
    pool: &State<PgPool>,
    id: &str,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let user_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let result = sqlx::query(
        "UPDATE users SET is_banned = true, updated_at = now() WHERE id = $1"
    )
    .bind(user_id)
    .execute(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::not_found("User not found"));
    }

    audit_log(pool.inner(), "ban_user", "user", user_id, None).await;

    Ok(Json(json!({"message": "User banned"})))
}

#[post("/api/admin/users/<id>/unban")]
pub async fn unban_user(
    _admin: AdminToken,
    pool: &State<PgPool>,
    id: &str,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let user_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let result = sqlx::query(
        "UPDATE users SET is_banned = false, updated_at = now() WHERE id = $1"
    )
    .bind(user_id)
    .execute(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::not_found("User not found"));
    }

    audit_log(pool.inner(), "unban_user", "user", user_id, None).await;

    Ok(Json(json!({"message": "User unbanned"})))
}

// --- Admin Users List ---

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
struct AdminUserRow {
    id: Uuid,
    email: String,
    display_name: String,
    bio: Option<String>,
    is_agent: bool,
    agent_type: Option<String>,
    is_banned: bool,
    avg_rating: Option<Decimal>,
    total_ratings: i32,
    tasks_posted: i32,
    tasks_completed: i32,
    total_spent: Decimal,
    total_earned: Decimal,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, serde::Serialize)]
pub struct AdminUserListResponse {
    pub users: Vec<AdminUserRow>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

#[get("/api/admin/users?<search>&<role>&<page>&<per_page>")]
pub async fn admin_list_users(
    _admin: AdminToken,
    pool: &State<PgPool>,
    search: Option<String>,
    role: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<AdminUserListResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(50).clamp(1, 200);
    let offset = (page - 1) * per_page;
    let search_term = search.as_deref().unwrap_or("").trim();
    let search_pattern = if search_term.is_empty() { String::new() } else { format!("%{}%", search_term.to_lowercase()) };
    let role_filter = role.as_deref().unwrap_or("");

    let total = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*) FROM users
            WHERE ($1 = '' OR LOWER(display_name) LIKE $1
                           OR LOWER(email) LIKE $1
                           OR id::text LIKE $1)
              AND ($2 = '' OR ($2 = 'agent' AND is_agent = true)
                           OR ($2 = 'human' AND is_agent = false)
                           OR ($2 = 'banned' AND is_banned = true))"#
    )
    .bind(&search_pattern)
    .bind(role_filter)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    let users = sqlx::query_as::<_, AdminUserRow>(
        r#"SELECT u.id, u.email, u.display_name, u.bio, u.is_agent, u.agent_type, u.is_banned,
                  u.avg_rating, u.total_ratings, u.tasks_posted, u.tasks_completed,
                  COALESCE(e.total_spent, 0) AS total_spent,
                  COALESCE(e.total_earned, 0) AS total_earned,
                  u.created_at
           FROM users u
           LEFT JOIN LATERAL (
               SELECT
                   COALESCE(SUM(CASE WHEN buyer_id = u.id AND status = 'released' THEN amount ELSE 0 END), 0) AS total_spent,
                   COALESCE(SUM(CASE WHEN seller_id = u.id AND status = 'released' THEN amount ELSE 0 END), 0) AS total_earned
               FROM escrow
               WHERE buyer_id = u.id OR seller_id = u.id
           ) e ON true
           WHERE ($1 = '' OR LOWER(u.display_name) LIKE $1
                          OR LOWER(u.email) LIKE $1
                          OR u.id::text LIKE $1)
             AND ($2 = '' OR ($2 = 'agent' AND u.is_agent = true)
                          OR ($2 = 'human' AND u.is_agent = false)
                          OR ($2 = 'banned' AND u.is_banned = true))
           ORDER BY u.created_at DESC
           LIMIT $3 OFFSET $4"#
    )
    .bind(&search_pattern)
    .bind(role_filter)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(AdminUserListResponse {
        users,
        total,
        page,
        per_page,
        total_pages,
    }))
}
