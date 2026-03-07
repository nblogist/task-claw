use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::PgPool;
use uuid::Uuid;

use crate::constants::sanitize_html;
use crate::errors::ApiError;
use crate::guards::admin::AdminToken;
use crate::guards::auth::AuthUser;
use crate::models::message::*;
use crate::models::task::Task;
use crate::services::rate_limit::RateLimiter;
use crate::routes::notifications::create_notification;

#[rocket::post("/api/tasks/<task_id>/messages", data = "<body>")]
pub async fn send_message(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    auth: AuthUser,
    task_id: &str,
    body: Json<CreateMessageRequest>,
) -> Result<Json<Message>, (Status, Json<ApiError>)> {
    if !limiter.check_with_limit(&format!("message:{}", auth.user_id), 30).allowed {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }

    let task_id = Uuid::parse_str(task_id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let body = body.into_inner();
    if body.content.is_empty() || body.content.len() > 2000 {
        return Err(ApiError::bad_request("Message content must be 1-2000 characters"));
    }

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    // Authorization: buyer, accepted seller, or any authenticated user on open/bidding tasks
    let is_buyer = task.buyer_id == auth.user_id;
    let is_accepted_seller = if let Some(bid_id) = task.accepted_bid_id {
        sqlx::query_scalar::<_, Uuid>("SELECT seller_id FROM bids WHERE id = $1")
            .bind(bid_id)
            .fetch_optional(pool.inner())
            .await
            .ok()
            .flatten()
            .map(|sid| sid == auth.user_id)
            .unwrap_or(false)
    } else {
        false
    };
    let is_open_or_bidding = task.status == crate::models::task::TaskStatus::Open
        || task.status == crate::models::task::TaskStatus::Bidding;

    let can_message = is_buyer || is_accepted_seller || is_open_or_bidding;

    if !can_message {
        return Err(ApiError::forbidden("You are not a participant in this task"));
    }

    let message = sqlx::query_as::<_, Message>(
        r#"INSERT INTO messages (task_id, sender_id, content)
           VALUES ($1, $2, $3) RETURNING *"#,
    )
    .bind(task_id)
    .bind(auth.user_id)
    .bind(&sanitize_html(&body.content))
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Notify the other party
    if is_buyer {
        // Notify accepted seller (if any)
        if let Some(bid_id) = task.accepted_bid_id {
            if let Ok(Some(seller_id)) = sqlx::query_scalar::<_, Uuid>("SELECT seller_id FROM bids WHERE id = $1")
                .bind(bid_id).fetch_optional(pool.inner()).await {
                create_notification(pool.inner(), seller_id, "new_message", &format!("New message on \"{}\"", task.title), Some(task.id)).await;
            }
        }
    } else {
        // Notify buyer
        create_notification(pool.inner(), task.buyer_id, "new_message", &format!("New message on \"{}\"", task.title), Some(task.id)).await;
    }

    Ok(Json(message))
}

#[rocket::get("/api/tasks/<task_id>/messages?<page>&<per_page>")]
pub async fn list_messages(
    pool: &State<PgPool>,
    auth: AuthUser,
    task_id: &str,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<MessageListResponse>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(task_id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    // Same auth check as send_message
    let is_buyer = task.buyer_id == auth.user_id;
    let is_accepted_seller = if let Some(bid_id) = task.accepted_bid_id {
        sqlx::query_scalar::<_, Uuid>("SELECT seller_id FROM bids WHERE id = $1")
            .bind(bid_id).fetch_optional(pool.inner()).await.ok().flatten()
            .map(|sid| sid == auth.user_id).unwrap_or(false)
    } else { false };
    let is_bidder = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM bids WHERE task_id = $1 AND seller_id = $2"
    ).bind(task_id).bind(auth.user_id).fetch_one(pool.inner()).await.unwrap_or(0) > 0;

    if !is_buyer && !is_accepted_seller && !is_bidder {
        return Err(ApiError::forbidden("You are not a participant in this task"));
    }

    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(50).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM messages WHERE task_id = $1")
        .bind(task_id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, chrono::DateTime<chrono::Utc>, String)>(
        r#"SELECT m.id, m.task_id, m.sender_id, m.content, m.created_at, u.display_name
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE m.task_id = $1
           ORDER BY m.created_at ASC
           LIMIT $2 OFFSET $3"#
    )
    .bind(task_id)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let messages: Vec<MessageWithSender> = rows.into_iter().map(|(id, tid, sid, content, created_at, sender_name)| {
        MessageWithSender {
            message: Message { id, task_id: tid, sender_id: sid, content, created_at },
            sender_name,
        }
    }).collect();

    Ok(Json(MessageListResponse { messages, total, page, per_page }))
}

#[rocket::get("/api/admin/tasks/<task_id>/messages")]
pub async fn admin_list_messages(
    _admin: AdminToken,
    pool: &State<PgPool>,
    task_id: &str,
) -> Result<Json<Vec<MessageWithSender>>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(task_id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let rows = sqlx::query_as::<_, (Uuid, Uuid, Uuid, String, chrono::DateTime<chrono::Utc>, String)>(
        r#"SELECT m.id, m.task_id, m.sender_id, m.content, m.created_at, u.display_name
           FROM messages m
           JOIN users u ON u.id = m.sender_id
           WHERE m.task_id = $1
           ORDER BY m.created_at ASC"#
    )
    .bind(task_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let messages: Vec<MessageWithSender> = rows.into_iter().map(|(id, tid, sid, content, created_at, sender_name)| {
        MessageWithSender {
            message: Message { id, task_id: tid, sender_id: sid, content, created_at },
            sender_name,
        }
    }).collect();

    Ok(Json(messages))
}
