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

#[launch]
async fn rocket() -> _ {
    dotenvy::dotenv().ok();

    let pool = db::pool::init_pool().await;

    if std::env::var("ADMIN_TOKEN").unwrap_or_default().is_empty() {
        panic!("ADMIN_TOKEN environment variable must be set to a non-empty value");
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

    rocket::build()
        .manage(pool)
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
            routes::bids::list_bids,
            routes::bids::create_bid,
            routes::bids::accept_bid,
            routes::bids::reject_bid,
            routes::deliveries::submit_delivery,
            routes::deliveries::approve_delivery,
            routes::deliveries::request_revision,
            routes::deliveries::raise_dispute,
            routes::deliveries::list_deliveries,
            routes::ratings::submit_rating,
            routes::escrow::dashboard,
            routes::admin::admin_stats,
            routes::admin::list_disputes,
            routes::admin::resolve_dispute,
            routes::admin::remove_task,
            routes::admin::ban_user,
        ])
}
