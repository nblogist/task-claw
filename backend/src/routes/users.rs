use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::PgPool;
use uuid::Uuid;

use chrono::{Duration, Utc};
use rand::Rng;

use std::collections::HashMap;
use crate::constants::sanitize_html;
use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::user::*;
use crate::services::auth::{create_token_with_version, hash_api_key, hash_password, verify_password};
use crate::services::email::EmailService;
use crate::services::rate_limit::RateLimiter;
use serde_json::json;

fn generate_token() -> String {
    let mut rng = rand::thread_rng();
    (0..48).map(|_| {
        let idx = rng.gen_range(0..36u8);
        if idx < 10 { (b'0' + idx) as char } else { (b'a' + idx - 10) as char }
    }).collect()
}

#[derive(serde::Serialize)]
pub struct AgentCountResponse {
    pub count: i64,
}

#[rocket::get("/api/agents/count")]
pub async fn agent_count(
    pool: &State<PgPool>,
) -> Result<Json<AgentCountResponse>, (Status, Json<ApiError>)> {
    let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE is_agent = true")
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(AgentCountResponse { count }))
}

#[derive(serde::Serialize)]
pub struct AgentListResponse {
    pub agents: Vec<PublicUser>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

#[rocket::get("/api/agents?<agent_type>&<min_rating>&<sort>&<page>&<per_page>")]
pub async fn list_agents(
    pool: &State<PgPool>,
    agent_type: Option<String>,
    min_rating: Option<f64>,
    sort: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<AgentListResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let agent_type_filter = agent_type.as_deref().unwrap_or("");
    let min_rating_val = min_rating.unwrap_or(0.0);

    let order_by = match sort.as_deref() {
        Some("rating") => "u.avg_rating DESC NULLS LAST",
        Some("tasks_completed") => "u.tasks_completed DESC",
        Some("oldest") => "u.created_at ASC",
        _ => "u.created_at DESC",
    };

    let total = sqlx::query_scalar::<_, i64>(
        r#"SELECT COUNT(*) FROM users u
           WHERE u.is_agent = true AND u.is_banned = false
           AND ($1 = '' OR u.agent_type = $1)
           AND (COALESCE(u.avg_rating, 0) >= $2)"#,
    )
    .bind(agent_type_filter)
    .bind(min_rating_val)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let rows = sqlx::query_as::<_, User>(
        &format!(
            r#"SELECT * FROM users u
               WHERE u.is_agent = true AND u.is_banned = false
               AND ($1 = '' OR u.agent_type = $1)
               AND (COALESCE(u.avg_rating, 0) >= $2)
               ORDER BY {}
               LIMIT $3 OFFSET $4"#,
            order_by
        ),
    )
    .bind(agent_type_filter)
    .bind(min_rating_val)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let agents: Vec<PublicUser> = rows.iter().map(PublicUser::from).collect();

    Ok(Json(AgentListResponse {
        agents,
        total,
        page,
        per_page,
    }))
}

#[rocket::post("/api/auth/register", data = "<body>")]
pub async fn register(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    remote_addr: Option<std::net::SocketAddr>,
    body: Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {
    let ip = remote_addr.map(|a| a.ip().to_string()).unwrap_or_else(|| "unknown".to_string());
    if !limiter.check_with_limit(&format!("register:{}", ip), 10).allowed {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }
    let body = body.into_inner();

    let mut errs: HashMap<String, String> = HashMap::new();
    let email = match body.email {
        Some(ref e) if !e.is_empty() => e.clone(),
        _ => { errs.insert("email".into(), "Required".into()); String::new() }
    };
    let password = match body.password {
        Some(ref p) if !p.is_empty() => p.clone(),
        _ => { errs.insert("password".into(), "Required".into()); String::new() }
    };
    let display_name = match body.display_name {
        Some(ref d) if !d.is_empty() => d.clone(),
        _ => { errs.insert("display_name".into(), "Required".into()); String::new() }
    };

    // Field-level format/length checks (only if field was provided)
    if !errs.contains_key("email") {
        if email.len() > 255 {
            errs.insert("email".into(), "Must be 255 characters or fewer".into());
        } else if !email.contains('@') || email.len() < 5 {
            errs.insert("email".into(), "Invalid email format".into());
        }
    }
    if !errs.contains_key("password") {
        if password.len() < 8 {
            errs.insert("password".into(), "Must be at least 8 characters".into());
        } else if password.len() > 128 {
            errs.insert("password".into(), "Must be 128 characters or fewer".into());
        }
    }
    if !errs.contains_key("display_name") {
        if display_name.len() > 100 {
            errs.insert("display_name".into(), "Must be 100 characters or fewer".into());
        }
    }
    if let Some(ref agent_type) = body.agent_type {
        if agent_type.len() > 100 {
            errs.insert("agent_type".into(), "Must be 100 characters or fewer".into());
        }
    }

    if !errs.is_empty() {
        return Err(ApiError::validation(errs));
    }

    // Sanitize user-supplied text fields
    let display_name = sanitize_html(&display_name);

    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE email = $1")
        .bind(&email)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if existing > 0 {
        return Err(ApiError::conflict("Email already registered"));
    }

    let password_hash = hash_password(&password)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    // Generate API key only for agent accounts, store SHA-256 hash
    let plaintext_key = if body.is_agent {
        Some(Uuid::new_v4().to_string())
    } else {
        None
    };
    let key_hash = plaintext_key.as_ref().map(|k| hash_api_key(k));

    let user = sqlx::query_as::<_, User>(
        r#"INSERT INTO users (email, password_hash, display_name, is_agent, agent_type, api_key_hash)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(&email)
    .bind(&password_hash)
    .bind(&display_name)
    .bind(body.is_agent)
    .bind(&body.agent_type)
    .bind(&key_hash)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let token = create_token_with_version(user.id, &user.email, user.is_agent, user.token_version)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    // Send verification email asynchronously
    let verify_token = generate_token();
    let expires = Utc::now() + Duration::hours(24);
    let _ = sqlx::query(
        "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)"
    )
    .bind(user.id)
    .bind(&verify_token)
    .bind(expires)
    .execute(pool.inner())
    .await;

    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
    let mut email_sent = false;
    if let Some(mailer) = EmailService::new() {
        match mailer.send_verification(&user.email, &verify_token, &frontend_url).await {
            Ok(()) => { email_sent = true; }
            Err(e) => { eprintln!("[WARN] Failed to send verification email: {}", e); }
        }
    }

    Ok(Json(AuthResponse {
        token,
        user: PublicUser::from(&user),
        api_key: plaintext_key,
        email_sent: Some(email_sent),
    }))
}

#[rocket::post("/api/auth/login", data = "<body>")]
pub async fn login(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    body: Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    let mut errs: HashMap<String, String> = HashMap::new();
    let email = match body.email {
        Some(ref e) if !e.is_empty() => e.clone(),
        _ => { errs.insert("email".into(), "Required".into()); String::new() }
    };
    let password = match body.password {
        Some(ref p) if !p.is_empty() => p.clone(),
        _ => { errs.insert("password".into(), "Required".into()); String::new() }
    };

    if !errs.is_empty() {
        return Err(ApiError::validation(errs));
    }

    if !limiter.check(&format!("login:{}", email)) {
        return Err(ApiError::new(Status::TooManyRequests, "Too many login attempts. Try again later."));
    }

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&email)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::unauthorized("Invalid email or password"))?;

    if user.is_banned {
        return Err(ApiError::forbidden("Account is banned"));
    }

    let valid = verify_password(&password, &user.password_hash)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if !valid {
        return Err(ApiError::unauthorized("Invalid email or password"));
    }

    let token = create_token_with_version(user.id, &user.email, user.is_agent, user.token_version)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(AuthResponse {
        token,
        user: PublicUser::from(&user),
        api_key: None,
        email_sent: None,
    }))
}

#[rocket::get("/api/auth/me")]
pub async fn me(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<PublicUser>, (Status, Json<ApiError>)> {
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(PublicUser::from(&user)))
}

#[rocket::get("/api/users/<id>")]
pub async fn get_user(
    pool: &State<PgPool>,
    id: &str,
) -> Result<Json<PublicUser>, (Status, Json<ApiError>)> {
    let user_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(user_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("User not found"))?;

    Ok(Json(PublicUser::from(&user)))
}

#[derive(serde::Deserialize)]
pub struct UpdateProfileRequest {
    pub display_name: Option<String>,
    pub bio: Option<String>,
}

#[rocket::put("/api/auth/me", data = "<body>")]
pub async fn update_profile(
    pool: &State<PgPool>,
    auth: AuthUser,
    body: Json<UpdateProfileRequest>,
) -> Result<Json<PublicUser>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    if let Some(ref name) = body.display_name {
        if name.is_empty() || name.len() > 100 {
            return Err(ApiError::bad_request("Display name must be 1-100 characters"));
        }
    }
    if let Some(ref bio) = body.bio {
        if bio.len() > 500 {
            return Err(ApiError::bad_request("Bio must be 500 characters or fewer"));
        }
    }

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let display_name = body.display_name.map(|n| sanitize_html(&n)).unwrap_or(user.display_name);
    let bio = body.bio.map(|b| sanitize_html(&b)).or(user.bio);

    let updated = sqlx::query_as::<_, User>(
        "UPDATE users SET display_name = $1, bio = $2, updated_at = now() WHERE id = $3 RETURNING *"
    )
    .bind(&display_name)
    .bind(&bio)
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(PublicUser::from(&updated)))
}

#[derive(serde::Serialize)]
pub struct RotateKeyResponse {
    pub api_key: String,
}

#[rocket::post("/api/auth/rotate-key")]
pub async fn rotate_api_key(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<RotateKeyResponse>, (Status, Json<ApiError>)> {
    if !auth.is_agent {
        return Err(ApiError::bad_request("Only agent accounts can rotate API keys"));
    }

    let new_key = Uuid::new_v4().to_string();
    let key_hash = hash_api_key(&new_key);

    sqlx::query("UPDATE users SET api_key_hash = $1, updated_at = now() WHERE id = $2")
        .bind(&key_hash)
        .bind(auth.user_id)
        .execute(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(RotateKeyResponse { api_key: new_key }))
}

#[derive(serde::Deserialize)]
pub struct DeleteAccountRequest {
    pub password: String,
}

#[rocket::delete("/api/auth/me", data = "<body>")]
pub async fn delete_account(
    pool: &State<PgPool>,
    auth: AuthUser,
    body: Json<DeleteAccountRequest>,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    // Verify password
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(auth.user_id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let valid = verify_password(&body.password, &user.password_hash)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if !valid {
        return Err(ApiError::unauthorized("Incorrect password"));
    }

    // Check for active escrows
    let active_escrow = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM escrow WHERE (buyer_id = $1 OR seller_id = $1) AND status IN ('locked', 'disputed')"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if active_escrow > 0 {
        return Err(ApiError::bad_request("Cannot delete account with active escrow. Resolve all active tasks first."));
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // Delete dependent records in FK order
    sqlx::query("DELETE FROM ratings WHERE rater_id = $1 OR ratee_id = $1")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM deliveries WHERE seller_id = $1")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM disputes WHERE raised_by = $1")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM escrow WHERE buyer_id = $1 OR seller_id = $1")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM bids WHERE seller_id = $1")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    // Delete tasks owned by this user (and their dependent records)
    sqlx::query("DELETE FROM ratings WHERE task_id IN (SELECT id FROM tasks WHERE buyer_id = $1)")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM deliveries WHERE task_id IN (SELECT id FROM tasks WHERE buyer_id = $1)")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM disputes WHERE task_id IN (SELECT id FROM tasks WHERE buyer_id = $1)")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM escrow WHERE task_id IN (SELECT id FROM tasks WHERE buyer_id = $1)")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM bids WHERE task_id IN (SELECT id FROM tasks WHERE buyer_id = $1)")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM tasks WHERE buyer_id = $1")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;
    sqlx::query("DELETE FROM users WHERE id = $1")
        .bind(auth.user_id).execute(&mut *tx).await.map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(json!({"message": "Account deleted"})))
}

// ── Password Reset ──────────────────────────────────────────────────

#[derive(serde::Deserialize)]
pub struct ForgotPasswordRequest {
    pub email: String,
}

#[rocket::post("/api/auth/forgot-password", data = "<body>")]
pub async fn forgot_password(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    body: Json<ForgotPasswordRequest>,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    if !limiter.check_with_limit(&format!("forgot:{}", body.email), 5).allowed {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }

    let email = body.into_inner().email;
    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());

    // Always return success to prevent email enumeration
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&email)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if let Some(user) = user {
        let token = generate_token();
        let expires = Utc::now() + Duration::hours(1);

        sqlx::query(
            "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)"
        )
        .bind(user.id)
        .bind(&token)
        .bind(expires)
        .execute(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

        if let Some(mailer) = EmailService::new() {
            if let Err(e) = mailer.send_password_reset(&email, &token, &frontend_url).await {
                eprintln!("[WARN] Failed to send password reset email: {}", e);
                return Err(ApiError::new(Status::ServiceUnavailable, "Unable to send reset email. Try again later."));
            }
        } else {
            eprintln!("[WARN] RESEND_API_KEY not set - password reset email not sent");
            return Err(ApiError::new(Status::ServiceUnavailable, "Email service not configured."));
        }
    }

    Ok(Json(json!({"message": "If that email exists, a reset link has been sent."})))
}

#[derive(serde::Deserialize)]
pub struct ResetPasswordRequest {
    pub token: String,
    pub new_password: String,
}

#[rocket::post("/api/auth/reset-password", data = "<body>")]
pub async fn reset_password(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    remote_addr: Option<std::net::SocketAddr>,
    body: Json<ResetPasswordRequest>,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let ip = remote_addr.map(|a| a.ip().to_string()).unwrap_or_else(|| "unknown".to_string());
    if !limiter.check_with_limit(&format!("reset:{}", ip), 10).allowed {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }

    let body = body.into_inner();

    if body.new_password.len() < 8 {
        return Err(ApiError::bad_request("Password must be at least 8 characters"));
    }
    if body.new_password.len() > 128 {
        return Err(ApiError::bad_request("Password must be at most 128 characters"));
    }

    let row = sqlx::query_as::<_, (Uuid, Uuid, bool, chrono::DateTime<Utc>)>(
        "SELECT id, user_id, used, expires_at FROM password_reset_tokens WHERE token = $1"
    )
    .bind(&body.token)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::bad_request("Invalid or expired token"))?;

    let (token_id, user_id, used, expires_at) = row;

    if used || expires_at < Utc::now() {
        return Err(ApiError::bad_request("Invalid or expired token"));
    }

    let password_hash = hash_password(&body.new_password)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("UPDATE users SET password_hash = $1, token_version = token_version + 1, updated_at = now() WHERE id = $2")
        .bind(&password_hash)
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("UPDATE password_reset_tokens SET used = true WHERE id = $1")
        .bind(token_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(json!({"message": "Password has been reset successfully."})))
}

// ── Email Verification ──────────────────────────────────────────────

#[rocket::post("/api/auth/send-verification")]
pub async fn send_verification(
    pool: &State<PgPool>,
    auth: AuthUser,
    limiter: &State<RateLimiter>,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    if !limiter.check_with_limit(&format!("verify:{}", auth.user_id), 5).allowed {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }

    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(auth.user_id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if user.email_verified {
        return Err(ApiError::bad_request("Email already verified"));
    }

    let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
    let token = generate_token();
    let expires = Utc::now() + Duration::hours(24);

    sqlx::query(
        "INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)"
    )
    .bind(auth.user_id)
    .bind(&token)
    .bind(expires)
    .execute(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let email_sent = if let Some(mailer) = EmailService::new() {
        match mailer.send_verification(&user.email, &token, &frontend_url).await {
            Ok(()) => true,
            Err(e) => {
                eprintln!("[WARN] Failed to send verification email: {}", e);
                false
            }
        }
    } else {
        eprintln!("[WARN] RESEND_API_KEY not set - verification email not sent");
        false
    };

    if email_sent {
        Ok(Json(json!({"message": "Verification email sent."})))
    } else {
        Ok(Json(json!({"message": "Verification email could not be sent. Try again later.", "email_sent": false})))
    }
}

#[derive(serde::Deserialize)]
pub struct VerifyEmailRequest {
    pub token: String,
}

#[rocket::post("/api/auth/verify-email", data = "<body>")]
pub async fn verify_email(
    pool: &State<PgPool>,
    body: Json<VerifyEmailRequest>,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    let row = sqlx::query_as::<_, (Uuid, Uuid, bool, chrono::DateTime<Utc>)>(
        "SELECT id, user_id, used, expires_at FROM email_verification_tokens WHERE token = $1"
    )
    .bind(&body.token)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::bad_request("Invalid or expired token"))?;

    let (token_id, user_id, used, expires_at) = row;

    if used || expires_at < Utc::now() {
        return Err(ApiError::bad_request("Invalid or expired token"));
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("UPDATE users SET email_verified = true, updated_at = now() WHERE id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    sqlx::query("UPDATE email_verification_tokens SET used = true WHERE id = $1")
        .bind(token_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(json!({"message": "Email verified successfully."})))
}
