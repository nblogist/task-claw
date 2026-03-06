use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::bid::*;
use crate::models::escrow::Escrow;
use crate::models::task::{Task, TaskStatus};
use crate::models::user::{PublicUser, User};
use crate::services::rate_limit::RateLimiter;
use crate::services::task_lifecycle::can_transition;
use crate::routes::notifications::create_notification;

#[derive(Debug, sqlx::FromRow)]
struct BidWithSellerRow {
    // Bid fields
    id: Uuid,
    task_id: Uuid,
    seller_id: Uuid,
    price: rust_decimal::Decimal,
    currency: String,
    estimated_delivery_days: i32,
    pitch: String,
    status: BidStatus,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    // Seller fields (nullable from LEFT JOIN)
    seller_uuid: Option<Uuid>,
    seller_display_name: Option<String>,
    seller_is_agent: Option<bool>,
    seller_agent_type: Option<String>,
    seller_avg_rating: Option<rust_decimal::Decimal>,
    seller_total_ratings: Option<i32>,
    seller_tasks_posted: Option<i32>,
    seller_tasks_completed: Option<i32>,
    seller_created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[rocket::get("/api/tasks/<slug>/bids")]
pub async fn list_bids(
    pool: &State<PgPool>,
    slug: &str,
) -> Result<Json<Vec<BidWithSeller>>, (Status, Json<ApiError>)> {
    let task_id = sqlx::query_scalar::<_, Uuid>(
        "SELECT id FROM tasks WHERE slug = $1"
    )
    .bind(slug)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Task not found"))?;

    // Single query with LEFT JOIN to eliminate N+1
    let rows = sqlx::query_as::<_, BidWithSellerRow>(
        r#"SELECT b.*,
            u.id AS seller_uuid, u.display_name AS seller_display_name,
            u.is_agent AS seller_is_agent, u.agent_type AS seller_agent_type,
            u.avg_rating AS seller_avg_rating, u.total_ratings AS seller_total_ratings,
            u.tasks_posted AS seller_tasks_posted, u.tasks_completed AS seller_tasks_completed,
            u.created_at AS seller_created_at
        FROM bids b
        LEFT JOIN users u ON u.id = b.seller_id
        WHERE b.task_id = $1
        ORDER BY b.created_at DESC"#
    )
    .bind(task_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let result: Vec<BidWithSeller> = rows.into_iter().map(|row| {
        let seller = row.seller_uuid.map(|id| PublicUser {
            id,
            display_name: row.seller_display_name.unwrap_or_default(),
            bio: None,
            is_agent: row.seller_is_agent.unwrap_or(false),
            agent_type: row.seller_agent_type,
            avg_rating: row.seller_avg_rating,
            total_ratings: row.seller_total_ratings.unwrap_or(0),
            tasks_posted: row.seller_tasks_posted.unwrap_or(0),
            tasks_completed: row.seller_tasks_completed.unwrap_or(0),
            member_since: row.seller_created_at.unwrap_or_default(),
        });

        BidWithSeller {
            bid: Bid {
                id: row.id,
                task_id: row.task_id,
                seller_id: row.seller_id,
                price: row.price,
                currency: row.currency,
                estimated_delivery_days: row.estimated_delivery_days,
                pitch: row.pitch,
                status: row.status,
                created_at: row.created_at,
                updated_at: row.updated_at,
            },
            seller,
        }
    }).collect();

    Ok(Json(result))
}

#[rocket::post("/api/tasks/<id>/bids", data = "<body>")]
pub async fn create_bid(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    auth: AuthUser,
    id: &str,
    body: Json<CreateBidRequest>,
) -> Result<Json<Bid>, (Status, Json<ApiError>)> {
    if !limiter.check(&format!("create_bid:{}", auth.user_id)) {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let body = body.into_inner();

    // Validate pitch length
    if body.pitch.is_empty() || body.pitch.len() > 500 {
        return Err(ApiError::bad_request("Pitch must be 1-500 characters"));
    }
    if body.estimated_delivery_days < 1 || body.estimated_delivery_days > 365 {
        return Err(ApiError::bad_request("Estimated delivery days must be between 1 and 365"));
    }

    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1"
    )
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Task not found"))?;

    // Cannot bid on own task
    if task.buyer_id == auth.user_id {
        return Err(ApiError::forbidden("Cannot bid on your own task"));
    }

    // Task must be open or bidding
    if task.status != TaskStatus::Open && task.status != TaskStatus::Bidding {
        return Err(ApiError::bad_request("Task is not accepting bids"));
    }

    // Price must be within budget range
    if body.price < task.budget_min || body.price > task.budget_max {
        return Err(ApiError::bad_request(format!(
            "Price must be between {} and {}",
            task.budget_min, task.budget_max
        )));
    }

    // Check if seller already bid on this task
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM bids WHERE task_id = $1 AND seller_id = $2"
    )
    .bind(task_id)
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    if existing > 0 {
        return Err(ApiError::conflict("You already bid on this task"));
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    let bid = sqlx::query_as::<_, Bid>(
        r#"INSERT INTO bids (task_id, seller_id, price, currency, estimated_delivery_days, pitch)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(task_id)
    .bind(auth.user_id)
    .bind(body.price)
    .bind(&body.currency)
    .bind(body.estimated_delivery_days)
    .bind(&body.pitch)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Transition task from open -> bidding if first bid
    if task.status == TaskStatus::Open {
        if !can_transition(&task.status, &TaskStatus::Bidding) {
            return Err(ApiError::bad_request(format!(
                "Cannot transition task from {:?} to bidding", task.status
            )));
        }
        sqlx::query("UPDATE tasks SET status = 'bidding', updated_at = now() WHERE id = $1")
            .bind(task_id)
            .execute(&mut *tx)
            .await
            .map_err(|e| ApiError::internal(e.to_string()))?;
    }

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // Notify buyer about new bid
    create_notification(pool.inner(), task.buyer_id, "bid_received", &format!("New bid received on \"{}\"", task.title), Some(task.id)).await;

    Ok(Json(bid))
}

#[rocket::post("/api/tasks/<task_id>/bids/<bid_id>/accept")]
pub async fn accept_bid(
    pool: &State<PgPool>,
    auth: AuthUser,
    task_id: &str,
    bid_id: &str,
) -> Result<Json<Escrow>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(task_id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;
    let bid_id = Uuid::parse_str(bid_id)
        .map_err(|_| ApiError::bad_request("Invalid bid ID"))?;

    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1"
    )
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if task.buyer_id != auth.user_id {
        return Err(ApiError::forbidden("Only the buyer can accept bids"));
    }

    if !can_transition(&task.status, &TaskStatus::InEscrow) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to in_escrow", task.status
        )));
    }

    let bid = sqlx::query_as::<_, Bid>(
        "SELECT * FROM bids WHERE id = $1 AND task_id = $2"
    )
    .bind(bid_id)
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Bid not found"))?;

    if bid.status != BidStatus::Pending {
        return Err(ApiError::bad_request("Bid is not pending"));
    }

    // Check spend limits
    let buyer = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = $1")
        .bind(auth.user_id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    if let Some(limit) = buyer.spend_limit_per_task {
        if bid.price > limit {
            return Err(ApiError::bad_request("Bid price exceeds your per-task spend limit"));
        }
    }

    if let Some(day_limit) = buyer.spend_limit_per_day {
        let today_spend = sqlx::query_scalar::<_, rust_decimal::Decimal>(
            r#"SELECT COALESCE(SUM(amount), 0) FROM escrow
               WHERE buyer_id = $1 AND locked_at >= CURRENT_DATE"#,
        )
        .bind(auth.user_id)
        .fetch_one(pool.inner())
        .await
        .unwrap_or_default();

        if today_spend + bid.price > day_limit {
            return Err(ApiError::bad_request("Accepting this bid would exceed your daily spend limit"));
        }
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // Accept the bid
    sqlx::query("UPDATE bids SET status = 'accepted', updated_at = now() WHERE id = $1")
        .bind(bid_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    // Reject all other bids
    sqlx::query("UPDATE bids SET status = 'rejected', updated_at = now() WHERE task_id = $1 AND id != $2 AND status = 'pending'")
        .bind(task_id)
        .bind(bid_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    // Update task status to in_escrow
    sqlx::query("UPDATE tasks SET status = 'in_escrow', accepted_bid_id = $1, updated_at = now() WHERE id = $2")
        .bind(bid_id)
        .bind(task_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    // Create escrow record
    let escrow = sqlx::query_as::<_, Escrow>(
        r#"INSERT INTO escrow (task_id, bid_id, buyer_id, seller_id, amount, currency)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *"#,
    )
    .bind(task_id)
    .bind(bid_id)
    .bind(auth.user_id)
    .bind(bid.seller_id)
    .bind(bid.price)
    .bind(&bid.currency)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

    // Notify seller their bid was accepted
    create_notification(pool.inner(), bid.seller_id, "bid_accepted", &format!("Your bid on \"{}\" was accepted!", task.title), Some(task.id)).await;

    Ok(Json(escrow))
}

#[rocket::post("/api/tasks/<task_id>/bids/<bid_id>/reject")]
pub async fn reject_bid(
    pool: &State<PgPool>,
    auth: AuthUser,
    task_id: &str,
    bid_id: &str,
) -> Result<Json<Bid>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(task_id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;
    let bid_id = Uuid::parse_str(bid_id)
        .map_err(|_| ApiError::bad_request("Invalid bid ID"))?;

    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1"
    )
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if task.buyer_id != auth.user_id {
        return Err(ApiError::forbidden("Only the buyer can reject bids"));
    }

    let bid = sqlx::query_as::<_, Bid>(
        "SELECT * FROM bids WHERE id = $1 AND task_id = $2 AND status = 'pending'"
    )
    .bind(bid_id)
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Pending bid not found"))?;

    let updated = sqlx::query_as::<_, Bid>(
        "UPDATE bids SET status = 'rejected', updated_at = now() WHERE id = $1 RETURNING *"
    )
    .bind(bid_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Notify seller their bid was rejected
    create_notification(pool.inner(), bid.seller_id, "bid_rejected", &format!("Your bid on \"{}\" was rejected", task.title), Some(task.id)).await;

    Ok(Json(updated))
}

#[rocket::delete("/api/tasks/<task_id>/bids/<bid_id>")]
pub async fn withdraw_bid(
    pool: &State<PgPool>,
    auth: AuthUser,
    task_id: &str,
    bid_id: &str,
) -> Result<Json<Bid>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(task_id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;
    let bid_id = Uuid::parse_str(bid_id)
        .map_err(|_| ApiError::bad_request("Invalid bid ID"))?;

    let bid = sqlx::query_as::<_, Bid>(
        "SELECT * FROM bids WHERE id = $1 AND task_id = $2 AND status = 'pending'"
    )
    .bind(bid_id)
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Pending bid not found"))?;

    if bid.seller_id != auth.user_id {
        return Err(ApiError::forbidden("Only the bidder can withdraw their bid"));
    }

    let updated = sqlx::query_as::<_, Bid>(
        "UPDATE bids SET status = 'withdrawn', updated_at = now() WHERE id = $1 RETURNING *"
    )
    .bind(bid_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(updated))
}
