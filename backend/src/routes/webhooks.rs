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

/// Fire webhooks for a given user and event. Records delivery attempts and retries on failure.
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

            let result = client
                .post(&wh.url)
                .header("Content-Type", "application/json")
                .header("X-TaskClaw-Signature", &signature)
                .header("X-TaskClaw-Event", &event)
                .body(body_str)
                .send()
                .await;

            match result {
                Ok(resp) if resp.status().is_success() => {
                    let _ = sqlx::query(
                        r#"INSERT INTO webhook_deliveries (webhook_id, event, payload, status, attempts, delivered_at)
                           VALUES ($1, $2, $3, 'delivered', 1, now())"#
                    ).bind(wh.id).bind(&event).bind(&payload).execute(&pool).await;
                }
                Ok(resp) => {
                    let error_msg = format!("HTTP {}", resp.status());
                    let _ = sqlx::query(
                        r#"INSERT INTO webhook_deliveries (webhook_id, event, payload, status, attempts, last_error, next_retry_at)
                           VALUES ($1, $2, $3, 'pending', 1, $4, now() + interval '10 seconds')"#
                    ).bind(wh.id).bind(&event).bind(&payload).bind(&error_msg).execute(&pool).await;
                }
                Err(e) => {
                    let error_msg = e.to_string();
                    let _ = sqlx::query(
                        r#"INSERT INTO webhook_deliveries (webhook_id, event, payload, status, attempts, last_error, next_retry_at)
                           VALUES ($1, $2, $3, 'pending', 1, $4, now() + interval '10 seconds')"#
                    ).bind(wh.id).bind(&event).bind(&payload).bind(&error_msg).execute(&pool).await;
                }
            }
        }
    });
}

/// Background retry loop for failed webhook deliveries. Call once at startup.
pub fn start_webhook_retry_loop(pool: PgPool) {
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(10)).await;
            retry_pending_deliveries(&pool).await;
        }
    });
}

async fn retry_pending_deliveries(pool: &PgPool) {
    let deliveries = sqlx::query_as::<_, (Uuid, Uuid, String, serde_json::Value, i32, i32)>(
        r#"SELECT id, webhook_id, event, payload, attempts, max_attempts
           FROM webhook_deliveries
           WHERE status = 'pending' AND next_retry_at <= now()
           LIMIT 50"#
    ).fetch_all(pool).await;

    let deliveries = match deliveries {
        Ok(d) => d,
        Err(_) => return,
    };

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_default();

    for (delivery_id, webhook_id, event, payload, attempts, max_attempts) in deliveries {
        let wh = match sqlx::query_as::<_, Webhook>("SELECT * FROM webhooks WHERE id = $1")
            .bind(webhook_id).fetch_optional(pool).await {
            Ok(Some(w)) => w,
            _ => {
                let _ = sqlx::query("UPDATE webhook_deliveries SET status = 'failed' WHERE id = $1")
                    .bind(delivery_id).execute(pool).await;
                continue;
            }
        };

        let body = json!({
            "event": event, "data": payload,
            "timestamp": chrono::Utc::now().to_rfc3339(),
            "webhook_id": wh.id.to_string(),
        });
        let body_str = body.to_string();
        let signature = compute_hmac(&wh.secret, &body_str);

        let result = client.post(&wh.url)
            .header("Content-Type", "application/json")
            .header("X-TaskClaw-Signature", &signature)
            .header("X-TaskClaw-Event", &event)
            .body(body_str).send().await;

        let new_attempts = attempts + 1;
        match result {
            Ok(resp) if resp.status().is_success() => {
                let _ = sqlx::query("UPDATE webhook_deliveries SET status = 'delivered', attempts = $1, delivered_at = now() WHERE id = $2")
                    .bind(new_attempts).bind(delivery_id).execute(pool).await;
            }
            _ => {
                let error_msg = match &result {
                    Ok(resp) => format!("HTTP {}", resp.status()),
                    Err(e) => e.to_string(),
                };
                if new_attempts >= max_attempts {
                    let _ = sqlx::query("UPDATE webhook_deliveries SET status = 'failed', attempts = $1, last_error = $2 WHERE id = $3")
                        .bind(new_attempts).bind(&error_msg).bind(delivery_id).execute(pool).await;
                } else {
                    let backoff_secs: i32 = match new_attempts { 1 => 10, 2 => 60, _ => 300 };
                    let _ = sqlx::query("UPDATE webhook_deliveries SET attempts = $1, last_error = $2, next_retry_at = now() + make_interval(secs => $4::double precision) WHERE id = $3")
                        .bind(new_attempts).bind(&error_msg).bind(delivery_id).bind(backoff_secs).execute(pool).await;
                }
            }
        }
    }
}

#[rocket::get("/api/webhooks/<id>/deliveries?<page>&<per_page>")]
pub async fn list_webhook_deliveries(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let webhook_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid webhook ID"))?;

    let _ = sqlx::query_as::<_, Webhook>("SELECT * FROM webhooks WHERE id = $1 AND user_id = $2")
        .bind(webhook_id).bind(auth.user_id)
        .fetch_optional(pool.inner()).await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Webhook not found"))?;

    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let rows = sqlx::query_as::<_, (Uuid, String, String, i32, Option<String>, Option<chrono::DateTime<chrono::Utc>>, chrono::DateTime<chrono::Utc>)>(
        r#"SELECT id, event, status, attempts, last_error, delivered_at, created_at
           FROM webhook_deliveries WHERE webhook_id = $1
           ORDER BY created_at DESC LIMIT $2 OFFSET $3"#
    ).bind(webhook_id).bind(per_page).bind(offset)
    .fetch_all(pool.inner()).await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let items: Vec<serde_json::Value> = rows.into_iter().map(|(id, event, status, attempts, last_error, delivered_at, created_at)| {
        json!({ "id": id, "event": event, "status": status, "attempts": attempts, "last_error": last_error, "delivered_at": delivered_at, "created_at": created_at })
    }).collect();

    Ok(Json(json!({ "deliveries": items, "page": page, "per_page": per_page })))
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
