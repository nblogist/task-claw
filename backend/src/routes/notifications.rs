use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::notification::{Notification, UnreadCountResponse};

#[derive(serde::Serialize)]
pub struct NotificationListResponse {
    pub notifications: Vec<Notification>,
    pub page: i64,
    pub per_page: i64,
}

#[rocket::get("/api/notifications?<page>&<per_page>&<since>&<kind>")]
pub async fn list_notifications(
    pool: &State<PgPool>,
    auth: AuthUser,
    page: Option<i64>,
    per_page: Option<i64>,
    since: Option<String>,
    kind: Option<String>,
) -> Result<Json<NotificationListResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(50).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let since_dt: Option<chrono::DateTime<chrono::Utc>> = since.as_ref().and_then(|s| s.parse().ok());
    let kind_filter = kind.as_deref().unwrap_or("");

    let notifications = sqlx::query_as::<_, Notification>(
        r#"SELECT n.id, n.user_id, n.kind, n.message, n.task_id, t.slug AS task_slug, n.read, n.created_at
           FROM notifications n
           LEFT JOIN tasks t ON t.id = n.task_id
           WHERE n.user_id = $1
           AND ($2::timestamptz IS NULL OR n.created_at > $2)
           AND ($3 = '' OR n.kind::text = $3)
           ORDER BY n.created_at DESC
           LIMIT $4 OFFSET $5"#
    )
    .bind(auth.user_id)
    .bind(since_dt)
    .bind(kind_filter)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(NotificationListResponse { notifications, page, per_page }))
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

/// Notification kinds that should also trigger an email.
const EMAIL_WORTHY_KINDS: &[&str] = &[
    "bid_received",
    "bid_accepted",
    "delivery_submitted",
    "delivery_approved",
    "dispute_raised",
    "dispute_resolved",
    "rating_received",
    "auto_approve_warning",
];

/// Helper to create a notification (called from other routes).
/// Also fires any matching webhooks for the user asynchronously.
/// For important events (financial, delivery, disputes), also sends an email.
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

    // Fire webhooks asynchronously
    let payload = json!({
        "kind": kind,
        "message": message,
        "task_id": task_id,
        "user_id": user_id,
    });
    crate::routes::webhooks::fire_webhooks(pool.clone(), user_id, kind.to_string(), payload);

    // Send email for important notification types
    if EMAIL_WORTHY_KINDS.contains(&kind) {
        let pool = pool.clone();
        let kind = kind.to_string();
        let message = message.to_string();
        let task_id = task_id;
        tokio::spawn(async move {
            // Look up user email
            let email: Option<String> = sqlx::query_scalar("SELECT email FROM users WHERE id = $1")
                .bind(user_id)
                .fetch_optional(&pool)
                .await
                .ok()
                .flatten();

            if let Some(email) = email {
                // Get task title for email context
                let task_title: Option<String> = if let Some(tid) = task_id {
                    sqlx::query_scalar("SELECT title FROM tasks WHERE id = $1")
                        .bind(tid)
                        .fetch_optional(&pool)
                        .await
                        .ok()
                        .flatten()
                } else {
                    None
                };

                if let Some(mailer) = crate::services::email::EmailService::new() {
                    if let Err(e) = mailer.send_notification(&email, &kind, &message, task_title.as_deref()).await {
                        eprintln!("[WARN] Failed to send notification email ({}): {}", kind, e);
                    }
                }
            }
        });
    }
}
