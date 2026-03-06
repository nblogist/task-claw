use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::webhook::*;

#[rocket::get("/api/webhooks")]
pub async fn list_webhooks(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<Vec<Webhook>>, (Status, Json<ApiError>)> {
    let webhooks = sqlx::query_as::<_, Webhook>(
        "SELECT * FROM webhooks WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(webhooks))
}

#[rocket::post("/api/webhooks", data = "<body>")]
pub async fn create_webhook(
    pool: &State<PgPool>,
    auth: AuthUser,
    body: Json<CreateWebhookRequest>,
) -> Result<Json<WebhookCreatedResponse>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    if body.url.is_empty() || body.url.len() > 2048 {
        return Err(ApiError::bad_request("URL must be 1-2048 characters"));
    }
    if !body.url.starts_with("https://") && !body.url.starts_with("http://localhost") {
        return Err(ApiError::bad_request("Webhook URL must use HTTPS (http://localhost allowed for development)"));
    }
    if body.events.is_empty() {
        return Err(ApiError::bad_request("At least one event is required"));
    }
    for event in &body.events {
        if !WEBHOOK_EVENTS.contains(&event.as_str()) {
            return Err(ApiError::bad_request(format!(
                "Invalid event '{}'. Valid events: {}", event, WEBHOOK_EVENTS.join(", ")
            )));
        }
    }

    // Limit webhooks per user
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM webhooks WHERE user_id = $1"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if count >= 5 {
        return Err(ApiError::bad_request("Maximum 5 webhooks per account"));
    }

    // Generate a signing secret
    let secret = generate_webhook_secret();

    let webhook = sqlx::query_as::<_, Webhook>(
        r#"INSERT INTO webhooks (user_id, url, secret, events)
           VALUES ($1, $2, $3, $4)
           RETURNING *"#,
    )
    .bind(auth.user_id)
    .bind(&body.url)
    .bind(&secret)
    .bind(&body.events)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(WebhookCreatedResponse {
        webhook,
        secret,
    }))
}

#[rocket::put("/api/webhooks/<id>", data = "<body>")]
pub async fn update_webhook(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
    body: Json<UpdateWebhookRequest>,
) -> Result<Json<Webhook>, (Status, Json<ApiError>)> {
    let webhook_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid webhook ID"))?;

    let existing = sqlx::query_as::<_, Webhook>(
        "SELECT * FROM webhooks WHERE id = $1 AND user_id = $2"
    )
    .bind(webhook_id)
    .bind(auth.user_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Webhook not found"))?;

    let body = body.into_inner();
    let url = body.url.unwrap_or(existing.url);
    let events = body.events.unwrap_or(existing.events);
    let active = body.active.unwrap_or(existing.active);

    if url.is_empty() || url.len() > 2048 {
        return Err(ApiError::bad_request("URL must be 1-2048 characters"));
    }
    if !url.starts_with("https://") && !url.starts_with("http://localhost") {
        return Err(ApiError::bad_request("Webhook URL must use HTTPS (http://localhost allowed for development)"));
    }
    for event in &events {
        if !WEBHOOK_EVENTS.contains(&event.as_str()) {
            return Err(ApiError::bad_request(format!(
                "Invalid event '{}'. Valid events: {}", event, WEBHOOK_EVENTS.join(", ")
            )));
        }
    }

    let updated = sqlx::query_as::<_, Webhook>(
        "UPDATE webhooks SET url = $1, events = $2, active = $3, updated_at = now() WHERE id = $4 RETURNING *"
    )
    .bind(&url)
    .bind(&events)
    .bind(active)
    .bind(webhook_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(updated))
}

#[rocket::delete("/api/webhooks/<id>")]
pub async fn delete_webhook(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let webhook_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid webhook ID"))?;

    let result = sqlx::query(
        "DELETE FROM webhooks WHERE id = $1 AND user_id = $2"
    )
    .bind(webhook_id)
    .bind(auth.user_id)
    .execute(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::not_found("Webhook not found"));
    }

    Ok(Json(json!({"message": "Webhook deleted"})))
}

fn generate_webhook_secret() -> String {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    let bytes: Vec<u8> = (0..32).map(|_| rng.gen()).collect();
    format!("whsec_{}", hex::encode(bytes))
}

/// Fire webhooks for a given user and event. Called from notification creation.
/// Runs asynchronously via tokio::spawn — fire and forget.
pub fn fire_webhooks(pool: PgPool, user_id: Uuid, event: String, payload: serde_json::Value) {
    tokio::spawn(async move {
        let webhooks = sqlx::query_as::<_, Webhook>(
            "SELECT * FROM webhooks WHERE user_id = $1 AND active = true AND $2 = ANY(events)"
        )
        .bind(user_id)
        .bind(&event)
        .fetch_all(&pool)
        .await;

        let webhooks = match webhooks {
            Ok(w) => w,
            Err(_) => return,
        };

        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(10))
            .build()
            .unwrap_or_default();

        for wh in webhooks {
            let body = json!({
                "event": event,
                "data": payload,
                "timestamp": chrono::Utc::now().to_rfc3339(),
                "webhook_id": wh.id.to_string(),
            });

            let body_str = body.to_string();
            let signature = compute_hmac(&wh.secret, &body_str);

            let _ = client
                .post(&wh.url)
                .header("Content-Type", "application/json")
                .header("X-TaskClaw-Signature", &signature)
                .header("X-TaskClaw-Event", &event)
                .body(body_str)
                .send()
                .await;
        }
    });
}

fn compute_hmac(secret: &str, body: &str) -> String {
    use hmac::{Hmac, Mac};
    use sha2::Sha256;

    type HmacSha256 = Hmac<Sha256>;
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .expect("HMAC accepts any key length");
    mac.update(body.as_bytes());
    let result = mac.finalize();
    format!("sha256={}", hex::encode(result.into_bytes()))
}
