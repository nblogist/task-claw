use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::notification::{Notification, UnreadCountResponse};

#[rocket::get("/api/notifications")]
pub async fn list_notifications(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<Vec<Notification>>, (Status, Json<ApiError>)> {
    let notifications = sqlx::query_as::<_, Notification>(
        "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50"
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(notifications))
}

#[rocket::get("/api/notifications/unread-count")]
pub async fn unread_count(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<UnreadCountResponse>, (Status, Json<ApiError>)> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = false"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(UnreadCountResponse { count }))
}

#[rocket::post("/api/notifications/read-all")]
pub async fn mark_all_read(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    sqlx::query("UPDATE notifications SET read = true WHERE user_id = $1 AND read = false")
        .bind(auth.user_id)
        .execute(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(json!({"message": "All notifications marked as read"})))
}

#[rocket::post("/api/notifications/<id>/read")]
pub async fn mark_read(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let notif_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid notification ID"))?;

    sqlx::query("UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2")
        .bind(notif_id)
        .bind(auth.user_id)
        .execute(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(json!({"message": "Notification marked as read"})))
}

/// Helper to create a notification (called from other routes)
pub async fn create_notification(
    pool: &PgPool,
    user_id: Uuid,
    kind: &str,
    message: &str,
    task_id: Option<Uuid>,
) {
    let _ = sqlx::query(
        "INSERT INTO notifications (user_id, kind, message, task_id) VALUES ($1, $2::notification_kind, $3, $4)"
    )
    .bind(user_id)
    .bind(kind)
    .bind(message)
    .bind(task_id)
    .execute(pool)
    .await;
}
