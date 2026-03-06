use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::delivery::*;
use crate::models::task::{Task, TaskStatus};
use crate::services::task_lifecycle::can_transition;

#[rocket::post("/api/tasks/<id>/deliver", data = "<body>")]
pub async fn submit_delivery(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
    body: Json<CreateDeliveryRequest>,
) -> Result<Json<Delivery>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if !can_transition(&task.status, &TaskStatus::Delivered) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to delivered", task.status
        )));
    }

    // Verify the seller is the accepted bidder
    let accepted_bid = sqlx::query_as::<_, crate::models::bid::Bid>(
        "SELECT * FROM bids WHERE id = $1"
    )
    .bind(task.accepted_bid_id.ok_or_else(|| ApiError::internal("No accepted bid"))?)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if accepted_bid.seller_id != auth.user_id {
        return Err(ApiError::forbidden("Only the accepted seller can deliver"));
    }

    let body = body.into_inner();
    if body.message.is_empty() || body.message.len() > 1000 {
        return Err(ApiError::bad_request("Message must be 1-1000 characters"));
    }

    // Validate delivery URL — reject non-http(s) schemes (DEF-002: XSS prevention)
    if let Some(ref url) = body.url {
        let trimmed = url.trim();
        if !trimmed.is_empty()
            && !trimmed.starts_with("http://")
            && !trimmed.starts_with("https://")
        {
            return Err(ApiError::bad_request("Delivery URL must start with http:// or https://"));
        }
    }

    // Check if this is a revision
    let previous_delivery = sqlx::query_as::<_, Delivery>(
        "SELECT * FROM deliveries WHERE task_id = $1 ORDER BY created_at DESC LIMIT 1"
    )
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let revision_of = previous_delivery.map(|d| d.id);

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    let delivery = sqlx::query_as::<_, Delivery>(
        r#"INSERT INTO deliveries (task_id, seller_id, message, url, file_url, revision_of)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(task_id)
    .bind(auth.user_id)
    .bind(&body.message)
    .bind(&body.url)
    .bind(&body.file_url)
    .bind(revision_of)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Update task status to delivered
    sqlx::query("UPDATE tasks SET status = 'delivered', updated_at = now() WHERE id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(delivery))
}

#[rocket::post("/api/tasks/<id>/approve")]
pub async fn approve_delivery(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
) -> Result<Json<Task>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if task.buyer_id != auth.user_id {
        return Err(ApiError::forbidden("Only the buyer can approve delivery"));
    }

    if !can_transition(&task.status, &TaskStatus::Completed) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to completed", task.status
        )));
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // Release escrow
    sqlx::query("UPDATE escrow SET status = 'released', released_at = now() WHERE task_id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    // Update task to completed
    let updated = sqlx::query_as::<_, Task>(
        "UPDATE tasks SET status = 'completed', updated_at = now() WHERE id = $1 RETURNING *"
    )
    .bind(task_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Increment seller's tasks_completed
    let escrow = sqlx::query_as::<_, crate::models::escrow::Escrow>(
        "SELECT * FROM escrow WHERE task_id = $1"
    )
    .bind(task_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("UPDATE users SET tasks_completed = tasks_completed + 1 WHERE id = $1")
        .bind(escrow.seller_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(updated))
}

#[derive(serde::Deserialize)]
pub struct RevisionRequest {
    pub message: Option<String>,
}

#[rocket::post("/api/tasks/<id>/revision", data = "<body>")]
pub async fn request_revision(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
    body: Option<Json<RevisionRequest>>,
) -> Result<Json<Task>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if task.buyer_id != auth.user_id {
        return Err(ApiError::forbidden("Only the buyer can request revision"));
    }

    if !can_transition(&task.status, &TaskStatus::InEscrow) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to in_escrow (revision)", task.status
        )));
    }

    // Check if revision already requested (max 1 revision)
    let delivery_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM deliveries WHERE task_id = $1"
    )
    .bind(task_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    if delivery_count > 1 {
        return Err(ApiError::bad_request("Only one revision is allowed"));
    }

    let revision_msg = body.and_then(|b| b.into_inner().message).unwrap_or_default();

    // Store revision message as a delivery note from buyer
    if !revision_msg.is_empty() {
        sqlx::query(
            "INSERT INTO deliveries (task_id, seller_id, message, revision_of) VALUES ($1, $2, $3, (SELECT id FROM deliveries WHERE task_id = $1 ORDER BY created_at DESC LIMIT 1))"
        )
        .bind(task_id)
        .bind(auth.user_id)
        .bind(&format!("[Revision Request] {}", revision_msg))
        .execute(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;
    }

    // Return to in_escrow for resubmission
    let updated = sqlx::query_as::<_, Task>(
        "UPDATE tasks SET status = 'in_escrow', updated_at = now() WHERE id = $1 RETURNING *"
    )
    .bind(task_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(updated))
}

#[derive(serde::Deserialize)]
pub struct DisputeRequest {
    pub reason: String,
}

#[rocket::post("/api/tasks/<id>/dispute", data = "<body>")]
pub async fn raise_dispute(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
    body: Json<DisputeRequest>,
) -> Result<Json<crate::models::task::Task>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    // Allow buyer or accepted seller to raise dispute
    let is_buyer = task.buyer_id == auth.user_id;
    let is_seller = if let Some(accepted_bid_id) = task.accepted_bid_id {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM bids WHERE id = $1 AND seller_id = $2"
        )
        .bind(accepted_bid_id)
        .bind(auth.user_id)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0) > 0
    } else {
        false
    };

    if !is_buyer && !is_seller {
        return Err(ApiError::forbidden("Only the buyer or accepted seller can raise a dispute"));
    }

    if !can_transition(&task.status, &TaskStatus::Disputed) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to disputed", task.status
        )));
    }

    let body = body.into_inner();

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // Create dispute record
    sqlx::query(
        r#"INSERT INTO disputes (task_id, raised_by, reason)
           VALUES ($1, $2, $3)"#,
    )
    .bind(task_id)
    .bind(auth.user_id)
    .bind(&body.reason)
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Update escrow to disputed
    sqlx::query("UPDATE escrow SET status = 'disputed' WHERE task_id = $1")
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    // Update task to disputed
    let updated = sqlx::query_as::<_, Task>(
        "UPDATE tasks SET status = 'disputed', updated_at = now() WHERE id = $1 RETURNING *"
    )
    .bind(task_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(updated))
}

#[rocket::get("/api/tasks/<id>/deliveries")]
pub async fn list_deliveries(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
) -> Result<Json<Vec<Delivery>>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    // Verify requester is buyer or accepted seller
    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    let is_buyer = task.buyer_id == auth.user_id;
    let is_seller = if let Some(accepted_bid_id) = task.accepted_bid_id {
        sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM bids WHERE id = $1 AND seller_id = $2"
        )
        .bind(accepted_bid_id)
        .bind(auth.user_id)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0) > 0
    } else {
        false
    };

    if !is_buyer && !is_seller {
        return Err(ApiError::forbidden("Only the buyer or accepted seller can view deliveries"));
    }

    let deliveries = sqlx::query_as::<_, Delivery>(
        "SELECT * FROM deliveries WHERE task_id = $1 ORDER BY created_at DESC"
    )
    .bind(task_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(deliveries))
}
