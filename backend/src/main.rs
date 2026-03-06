#[macro_use]
extern crate rocket;

mod constants;
mod db;
mod errors;
mod guards;
mod models;
mod routes;
mod services;

use rocket::http::Method;
use rocket_cors::{AllowedHeaders, AllowedOrigins, CorsOptions};
use services::rate_limit::RateLimiter;

#[launch]
async fn rocket() -> _ {
    dotenvy::dotenv().ok();

    let pool = db::pool::init_pool().await;

    if std::env::var("ADMIN_TOKEN").unwrap_or_default().is_empty() {
        panic!("ADMIN_TOKEN environment variable must be set to a non-empty value");
    }

    if std::env::var("JWT_SECRET").unwrap_or_default().is_empty() {
        panic!("JWT_SECRET environment variable must be set to a non-empty value");
    }

    let allowed_origins = std::env::var("CORS_ALLOWED_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:5173".to_string());

    let cors = CorsOptions {
        allowed_origins: AllowedOrigins::some_exact(&[&allowed_origins]),
        allowed_methods: vec![Method::Get, Method::Post, Method::Put, Method::Delete, Method::Options]
            .into_iter()
            .map(From::from)
            .collect(),
        allowed_headers: AllowedHeaders::some(&[
            "Authorization",
            "Accept",
            "Content-Type",
            "X-API-Key",
        ]),
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()
    .expect("CORS configuration failed");

    // Rate limiter: 10 requests per 60 seconds per IP on auth endpoints
    let rate_limiter = RateLimiter::new(10, 60);

    rocket::build()
        .manage(pool)
        .manage(rate_limiter)
        .attach(cors)
        .mount("/", routes![
            routes::tasks::health,
            routes::tasks::list_tasks,
            routes::tasks::get_task,
            routes::tasks::list_categories,
            routes::tasks::create_task,
            routes::tasks::cancel_task,
            routes::users::register,
            routes::users::login,
            routes::users::me,
            routes::users::get_user,
            routes::users::agent_count,
            routes::users::list_agents,
            routes::users::update_profile,
            routes::users::rotate_api_key,
            routes::users::delete_account,
            routes::tasks::update_task,
            routes::bids::list_bids,
            routes::bids::create_bid,
            routes::bids::accept_bid,
            routes::bids::reject_bid,
            routes::bids::withdraw_bid,
            routes::deliveries::submit_delivery,
            routes::deliveries::approve_delivery,
            routes::deliveries::request_revision,
            routes::deliveries::raise_dispute,
            routes::deliveries::list_deliveries,
            routes::ratings::submit_rating,
            routes::escrow::dashboard,
            routes::admin::admin_stats,
            routes::admin::admin_list_tasks,
            routes::admin::list_disputes,
            routes::admin::resolve_dispute,
            routes::admin::remove_task,
            routes::admin::ban_user,
            routes::users::forgot_password,
            routes::users::reset_password,
            routes::users::send_verification,
            routes::users::verify_email,
            routes::notifications::list_notifications,
            routes::notifications::unread_count,
            routes::notifications::mark_all_read,
            routes::notifications::mark_read,
            routes::webhooks::list_webhooks,
            routes::webhooks::create_webhook,
            routes::webhooks::update_webhook,
            routes::webhooks::delete_webhook,
        ])
}
