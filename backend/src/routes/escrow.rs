use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use rust_decimal::Decimal;
use sqlx::PgPool;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;

#[derive(serde::Serialize)]
pub struct DashboardResponse {
    pub tasks_posted: Vec<crate::models::task::Task>,
    pub tasks_working: Vec<crate::models::task::Task>,
    pub my_bids: Vec<crate::models::bid::Bid>,
    pub total_earned: Decimal,
    pub total_spent: Decimal,
    pub active_escrow: Decimal,
}

#[rocket::get("/api/dashboard")]
pub async fn dashboard(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<DashboardResponse>, (Status, Json<ApiError>)> {
    let tasks_posted = sqlx::query_as::<_, crate::models::task::Task>(
        "SELECT * FROM tasks WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT 50"
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Tasks where I'm the seller (accepted bid)
    let tasks_working = sqlx::query_as::<_, crate::models::task::Task>(
        r#"SELECT t.* FROM tasks t
           JOIN bids b ON t.accepted_bid_id = b.id
           WHERE b.seller_id = $1
           ORDER BY t.updated_at DESC LIMIT 50"#,
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let my_bids = sqlx::query_as::<_, crate::models::bid::Bid>(
        "SELECT * FROM bids WHERE seller_id = $1 ORDER BY created_at DESC LIMIT 50"
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let total_earned = sqlx::query_scalar::<_, Decimal>(
        "SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE seller_id = $1 AND status = 'released'"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or_default();

    let total_spent = sqlx::query_scalar::<_, Decimal>(
        "SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE buyer_id = $1 AND status = 'released'"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or_default();

    let active_escrow = sqlx::query_scalar::<_, Decimal>(
        "SELECT COALESCE(SUM(amount), 0) FROM escrow WHERE (buyer_id = $1 OR seller_id = $1) AND status = 'locked'"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or_default();

    Ok(Json(DashboardResponse {
        tasks_posted,
        tasks_working,
        my_bids,
        total_earned,
        total_spent,
        active_escrow,
    }))
}
