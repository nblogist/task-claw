use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;
use rust_decimal::Decimal;

use crate::errors::ApiError;
use crate::guards::admin::AdminToken;
use crate::models::dispute::{AdminStatsResponse, DisputeDetail, ResolveDisputeRequest};
use crate::models::task::TaskStatus;
use crate::services::task_lifecycle::can_transition;

#[get("/api/admin/stats")]
pub async fn admin_stats(
    _admin: AdminToken,
    pool: &State<PgPool>,
) -> Result<Json<AdminStatsResponse>, (Status, Json<ApiError>)> {
    let total_tasks = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM tasks")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let open_tasks = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tasks WHERE status = 'open' OR status = 'bidding'"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let completed_tasks = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM tasks WHERE status = 'completed'"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let total_escrow_value = sqlx::query_scalar::<_, Option<Decimal>>(
        "SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE status = 'locked' OR status = 'disputed'"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .unwrap_or(Decimal::ZERO);

    let dispute_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM disputes WHERE resolution IS NULL"
    )
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(AdminStatsResponse {
        total_tasks,
        open_tasks,
        completed_tasks,
        total_escrow_value,
        dispute_count,
    }))
}

#[get("/api/admin/disputes")]
pub async fn list_disputes(
    _admin: AdminToken,
    pool: &State<PgPool>,
) -> Result<Json<Vec<DisputeDetail>>, (Status, Json<ApiError>)> {
    let disputes = sqlx::query_as::<_, DisputeDetail>(
        r#"SELECT
            d.id, d.task_id, t.title AS task_title, t.slug AS task_slug, t.status AS task_status,
            d.raised_by, d.reason, d.resolution, d.admin_note, d.resolved_at, d.created_at,
            t.buyer_id, buyer.display_name AS buyer_name,
            e.seller_id, seller.display_name AS seller_name,
            e.amount AS escrow_amount
        FROM disputes d
        JOIN tasks t ON d.task_id = t.id
        JOIN users buyer ON t.buyer_id = buyer.id
        JOIN escrow e ON e.task_id = t.id
        JOIN users seller ON e.seller_id = seller.id
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

    if body.favor != "buyer" && body.favor != "seller" {
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

    let target_status = if body.favor == "buyer" {
        TaskStatus::Cancelled
    } else {
        TaskStatus::Completed
    };

    if !can_transition(&task_status, &target_status) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to {:?}", task_status, target_status
        )));
    }

    let escrow_status = if body.favor == "buyer" { "refunded" } else { "released" };
    let task_status_str = if body.favor == "buyer" { "cancelled" } else { "completed" };

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query(
        "UPDATE disputes SET resolution = $1::dispute_resolution, admin_note = $2, resolved_at = now() WHERE id = $3"
    )
    .bind(&body.favor)
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
        "UPDATE tasks SET status = $1::task_status, updated_at = now() WHERE id = $2"
    )
    .bind(task_status_str)
    .bind(task_id)
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(json!({"message": "Dispute resolved", "favor": body.favor})))
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

    Ok(Json(json!({"message": "User banned"})))
}
