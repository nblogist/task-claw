#[macro_use]
extern crate rocket;

mod constants;
mod db;
mod errors;
mod guards;
mod models;
mod routes;
mod services;

use rocket::http::{Method, Status};
use rocket::serde::json::Json;
use rocket::Request;
use rocket_cors::{AllowedHeaders, AllowedOrigins, CorsOptions};
use serde_json::json;
use services::rate_limit::RateLimiter;

/// Root URL: return JSON discovery so agents can find the API
#[get("/")]
fn root_discovery() -> Json<serde_json::Value> {
    Json(json!({
        "name": "TaskClaw",
        "description": "Agent-first task marketplace. Post tasks, bid, deliver, get paid.",
        "api": "/api",
        "openapi": "/api/openapi.json",
        "agent_protocol": "/.well-known/agent.json",
        "ai_plugin": "/.well-known/ai-plugin.json",
        "health": "/health"
    }))
}

#[catch(400)]
fn catch_bad_request(_req: &Request) -> (Status, Json<serde_json::Value>) {
    (Status::BadRequest, Json(json!({
        "error": "Bad request — the JSON body could not be parsed or is missing required fields. Check field names and types carefully (e.g. register requires: email, password, display_name). See GET /api/openapi.json for the full schema. Shell tip: use single quotes around JSON in curl to avoid bash expansion issues with characters like !",
        "status": 400
    })))
}

#[catch(401)]
fn catch_unauthorized(_req: &Request) -> (Status, Json<serde_json::Value>) {
    (Status::Unauthorized, Json(json!({"error": "Unauthorized", "status": 401})))
}

#[catch(403)]
fn catch_forbidden(_req: &Request) -> (Status, Json<serde_json::Value>) {
    (Status::Forbidden, Json(json!({"error": "Forbidden", "status": 403})))
}

#[catch(404)]
fn catch_not_found(_req: &Request) -> (Status, Json<serde_json::Value>) {
    (Status::NotFound, Json(json!({"error": "Not found", "status": 404})))
}

#[catch(422)]
fn catch_unprocessable(_req: &Request) -> (Status, Json<serde_json::Value>) {
    (Status::UnprocessableEntity, Json(json!({
        "error": "Unprocessable entity — the request body could not be parsed. Ensure all required fields are present with correct types (strings as \"...\", numbers without quotes, booleans as true/false). See GET /api/openapi.json for the full schema. Shell tip: use single quotes around JSON in curl to avoid bash expansion issues with characters like !",
        "status": 422
    })))
}

#[catch(429)]
fn catch_too_many_requests(_req: &Request) -> (Status, Json<serde_json::Value>) {
    (Status::TooManyRequests, Json(json!({"error": "Too many requests. Try again later.", "status": 429})))
}

#[catch(500)]
fn catch_internal_error(_req: &Request) -> (Status, Json<serde_json::Value>) {
    (Status::InternalServerError, Json(json!({"error": "Internal server error", "status": 500})))
}

#[launch]
async fn rocket() -> _ {
    dotenvy::dotenv().ok();

    // Railway injects PORT; Rocket reads ROCKET_PORT
    if let Ok(port) = std::env::var("PORT") {
        if std::env::var("ROCKET_PORT").is_err() {
            std::env::set_var("ROCKET_PORT", &port);
        }
    }

    let pool = db::pool::init_pool().await;

    if std::env::var("ADMIN_TOKEN").unwrap_or_default().is_empty() {
        panic!("ADMIN_TOKEN environment variable must be set to a non-empty value");
    }

    if std::env::var("JWT_SECRET").unwrap_or_default().is_empty() {
        panic!("JWT_SECRET environment variable must be set to a non-empty value");
    }

    let allowed_origins = std::env::var("CORS_ALLOWED_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:5173".to_string());

    // Validate CORS origin has a scheme (https:// or http://)
    if !allowed_origins.starts_with("http://") && !allowed_origins.starts_with("https://") {
        panic!(
            "CORS_ALLOWED_ORIGIN must start with http:// or https:// (got: '{}')",
            allowed_origins
        );
    }

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

    // Escrow mode: "simulated" (DB ledger only) or "real" (crypto payments)
    let escrow_mode = models::escrow::EscrowMode::from_env();
    eprintln!("[INFO] Escrow mode: {:?}", escrow_mode);

    // Start background webhook retry loop
    routes::webhooks::start_webhook_retry_loop(pool.clone());

    rocket::build()
        .manage(pool)
        .manage(rate_limiter)
        .manage(escrow_mode)
        .attach(cors)
        .register("/", catchers![
            catch_bad_request,
            catch_unauthorized,
            catch_forbidden,
            catch_not_found,
            catch_unprocessable,
            catch_too_many_requests,
            catch_internal_error,
        ])
        .mount("/", routes![
            root_discovery,
            routes::tasks::health,
            routes::tasks::api_discovery,
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
            routes::bids::update_bid,
            routes::bids::batch_bid,
            routes::bids::accept_bid,
            routes::bids::reject_bid,
            routes::bids::withdraw_bid,
            routes::bids::my_bids,
            routes::bids::received_bids,
            routes::bids::batch_accept,
            routes::deliveries::submit_delivery,
            routes::deliveries::approve_delivery,
            routes::deliveries::request_revision,
            routes::deliveries::raise_dispute,
            routes::deliveries::list_deliveries,
            routes::deliveries::batch_approve,
            routes::ratings::submit_rating,
            routes::ratings::list_user_ratings,
            routes::ratings::batch_rate,
            routes::escrow::dashboard,
            routes::escrow::earnings,
            routes::admin::admin_stats,
            routes::admin::admin_list_tasks,
            routes::admin::list_disputes,
            routes::admin::resolve_dispute,
            routes::admin::remove_task,
            routes::admin::ban_user,
            routes::admin::unban_user,
            routes::admin::admin_list_users,
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
            routes::webhooks::list_webhook_deliveries,
            routes::messages::send_message,
            routes::messages::list_messages,
            routes::messages::admin_list_messages,
            routes::portfolio::create_portfolio_item,
            routes::portfolio::list_portfolio,
            routes::portfolio::delete_portfolio_item,
            routes::openapi::openapi_spec,
            routes::well_known::agent_json,
            routes::well_known::ai_plugin_json,
        ])
}
