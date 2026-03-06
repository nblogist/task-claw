use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};

pub struct AdminToken;

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AdminToken {
    type Error = &'static str;

    async fn from_request(request: &'r Request<'_>) -> Outcome<Self, Self::Error> {
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
