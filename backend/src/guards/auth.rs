use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use sqlx::PgPool;
use uuid::Uuid;

use crate::services::auth::verify_token;

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
            if let Ok(key_uuid) = Uuid::parse_str(api_key) {
                let pool = request.rocket().state::<PgPool>().unwrap();
                let result = sqlx::query_as::<_, (Uuid, String, bool)>(
                    "SELECT id, email, is_agent FROM users WHERE api_key = $1 AND is_banned = false"
                )
                .bind(key_uuid)
                .fetch_optional(pool)
                .await;

                if let Ok(Some((id, email, is_agent))) = result {
                    return Outcome::Success(AuthUser {
                        user_id: id,
                        email,
                        is_agent,
                    });
                }
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
                    let user_id = Uuid::parse_str(&claims.sub)
                        .map_err(|_| (Status::Unauthorized, "Invalid token"))
                        .unwrap();

                    // Verify user is not banned
                    let pool = request.rocket().state::<PgPool>().unwrap();
                    let banned: Option<(bool,)> = sqlx::query_as(
                        "SELECT is_banned FROM users WHERE id = $1"
                    )
                    .bind(user_id)
                    .fetch_optional(pool)
                    .await
                    .unwrap_or(None);

                    if let Some((true,)) = banned {
                        return Outcome::Error((Status::Forbidden, "Account is banned"));
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
