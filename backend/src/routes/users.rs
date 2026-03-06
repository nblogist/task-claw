use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::user::*;
use crate::services::auth::{create_token, hash_password, verify_password};
use crate::services::rate_limit::RateLimiter;
use serde_json::json;

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

#[rocket::post("/api/auth/register", data = "<body>")]
pub async fn register(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    body: Json<RegisterRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {
    if !limiter.check("register:global") {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }
    let body = body.into_inner();

    if body.email.is_empty() || body.password.is_empty() || body.display_name.is_empty() {
        return Err(ApiError::bad_request("Email, password, and display_name are required"));
    }
    if body.email.len() > 255 {
        return Err(ApiError::bad_request("Email must be 255 characters or fewer"));
    }
    if body.password.len() < 8 {
        return Err(ApiError::bad_request("Password must be at least 8 characters"));
    }

    let existing = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE email = $1")
        .bind(&body.email)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if existing > 0 {
        return Err(ApiError::conflict("Email already registered"));
    }

    let password_hash = hash_password(&body.password)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let user = sqlx::query_as::<_, User>(
        r#"INSERT INTO users (email, password_hash, display_name, is_agent, agent_type)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *"#,
    )
    .bind(&body.email)
    .bind(&password_hash)
    .bind(&body.display_name)
    .bind(body.is_agent)
    .bind(&body.agent_type)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let token = create_token(user.id, &user.email, user.is_agent)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let api_key = if user.is_agent { user.api_key } else { None };

    Ok(Json(AuthResponse {
        token,
        user: PublicUser::from(&user),
        api_key,
    }))
}

#[rocket::post("/api/auth/login", data = "<body>")]
pub async fn login(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    body: Json<LoginRequest>,
) -> Result<Json<AuthResponse>, (Status, Json<ApiError>)> {
    if !limiter.check(&format!("login:{}", body.email)) {
        return Err(ApiError::new(Status::TooManyRequests, "Too many login attempts. Try again later."));
    }
    let body = body.into_inner();

    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE email = $1"
    )
    .bind(&body.email)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::unauthorized("Invalid email or password"))?;

    if user.is_banned {
        return Err(ApiError::forbidden("Account is banned"));
    }

    let valid = verify_password(&body.password, &user.password_hash)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if !valid {
        return Err(ApiError::unauthorized("Invalid email or password"));
    }

    let token = create_token(user.id, &user.email, user.is_agent)
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let api_key = if user.is_agent { user.api_key } else { None };

    Ok(Json(AuthResponse {
        token,
        user: PublicUser::from(&user),
        api_key,
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

    let display_name = body.display_name.unwrap_or(user.display_name);
    let bio = body.bio.or(user.bio);

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
    pub api_key: Uuid,
}

#[rocket::post("/api/auth/rotate-key")]
pub async fn rotate_api_key(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<RotateKeyResponse>, (Status, Json<ApiError>)> {
    if !auth.is_agent {
        return Err(ApiError::bad_request("Only agent accounts can rotate API keys"));
    }

    let new_key = Uuid::new_v4();

    sqlx::query("UPDATE users SET api_key = $1, updated_at = now() WHERE id = $2")
        .bind(new_key)
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
