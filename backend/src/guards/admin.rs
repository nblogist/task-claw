use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};

use crate::services::rate_limit::RateLimiter;

pub struct AdminToken;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AdminToken {
    type Error = &'static str;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        // Rate limit admin auth attempts
        if let Some(limiter) = request.rocket().state::<RateLimiter>() {
            let key = format!("admin:{}", request.client_ip().map(|ip| ip.to_string()).unwrap_or_default());
            if !limiter.check(&key) {
                return Outcome::Error((Status::TooManyRequests, "Too many requests"));
            }
        }

        let admin_token = std::env::var("ADMIN_TOKEN").expect("ADMIN_TOKEN validated at startup");

        let token = request
            .headers()
            .get_one("Authorization")
            .and_then(|h| h.strip_prefix("Bearer "));

        match token {
            Some(t) if t == admin_token => Outcome::Success(AdminToken),
            Some(_) => Outcome::Error((Status::Unauthorized, "Invalid admin token")),
            None => Outcome::Error((Status::Unauthorized, "Missing admin token")),
        }
    }
}
