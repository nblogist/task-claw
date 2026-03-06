use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use sqlx::PgPool;
use uuid::Uuid;

use crate::services::auth::{hash_api_key, verify_token};

pub struct AuthUser {
    pub user_id: Uuid,
    pub email: String,
    pub is_agent: bool,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthUser {
    type Error = &'static str;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Try X-API-Key header first (agent auth)
        if let Some(api_key) = request.headers().get_one("X-API-Key") {
            let pool = match request.rocket().state::<PgPool>() {
                Some(p) => p,
                None => return Outcome::Error((Status::InternalServerError, "Database not configured")),
            };

            // Hash the incoming key and look up by hash
            let key_hash = hash_api_key(api_key);
            let result = sqlx::query_as::<_, (Uuid, String, bool)>(
                "SELECT id, email, is_agent FROM users WHERE api_key_hash = $1 AND is_banned = false"
            )
            .bind(&key_hash)
            .fetch_optional(pool)
            .await;

            if let Ok(Some((id, email, is_agent))) = result {
                return Outcome::Success(AuthUser {
                    user_id: id,
                    email,
                    is_agent,
                });
            }
            return Outcome::Error((Status::Unauthorized, "Invalid API key"));
        }

        // Try Bearer JWT token
        let token = request
            .headers()
            .get_one("Authorization")
            .and_then(|h| h.strip_prefix("Bearer "));

        match token {
            Some(token) => match verify_token(token) {
                Ok(claims) => {
                    let user_id = match Uuid::parse_str(&claims.sub) {
                        Ok(id) => id,
                        Err(_) => return Outcome::Error((Status::Unauthorized, "Invalid token")),
                    };

                    // Verify user is not banned and check token_version
                    let pool = match request.rocket().state::<PgPool>() {
                        Some(p) => p,
                        None => return Outcome::Error((Status::InternalServerError, "Database not configured")),
                    };
                    let user_check: Option<(bool, i32)> = match sqlx::query_as(
                        "SELECT is_banned, token_version FROM users WHERE id = $1"
                    )
                    .bind(user_id)
                    .fetch_optional(pool)
                    .await {
                        Ok(result) => result,
                        Err(_) => return Outcome::Error((Status::InternalServerError, "Database error")),
                    };

                    match user_check {
                        Some((true, _)) => {
                            return Outcome::Error((Status::Forbidden, "Account is banned"));
                        }
                        Some((_, db_version)) if claims.tv < db_version => {
                            return Outcome::Error((Status::Unauthorized, "Token has been invalidated"));
                        }
                        None => {
                            return Outcome::Error((Status::Unauthorized, "User not found"));
                        }
                        _ => {}
                    }

                    Outcome::Success(AuthUser {
                        user_id,
                        email: claims.email,
                        is_agent: claims.is_agent,
                    })
                }
                Err(_) => Outcome::Error((Status::Unauthorized, "Invalid token")),
            },
            None => Outcome::Error((Status::Unauthorized, "Missing authentication")),
        }
    }
}
