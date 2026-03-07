use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::PgPool;
use uuid::Uuid;

use crate::constants::sanitize_html;
use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::rating::*;
use crate::models::task::{Task, TaskStatus};
use crate::routes::notifications::create_notification;

#[rocket::post("/api/tasks/<id>/rate", data = "<body>")]
pub async fn submit_rating(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
    body: Json<CreateRatingRequest>,
) -> Result<Json<Rating>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let body = body.into_inner();

    if body.score < 1 || body.score > 5 {
        return Err(ApiError::bad_request("Score must be between 1 and 5"));
    }
    if let Some(ref comment) = body.comment {
        if comment.len() > 1000 {
            return Err(ApiError::bad_request("Comment must be 1000 characters or less"));
        }
    }

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if task.status != TaskStatus::Completed {
        return Err(ApiError::bad_request("Can only rate completed tasks"));
    }

    // Determine who the ratee is
    let escrow = sqlx::query_as::<_, crate::models::escrow::Escrow>(
        "SELECT * FROM escrow WHERE task_id = $1"
    )
    .bind(task_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Check rating window (7 days from escrow release, not task update)
    let completion_time = escrow.released_at.unwrap_or(task.updated_at);
    let days_since = (chrono::Utc::now() - completion_time).num_days();
    if days_since > 7 {
        return Err(ApiError::bad_request("Rating window has closed (7 days)"));
    }

    let ratee_id = if auth.user_id == task.buyer_id {
        escrow.seller_id
    } else if auth.user_id == escrow.seller_id {
        task.buyer_id
    } else {
        return Err(ApiError::forbidden("Only buyer and seller can rate"));
    };

    // Check for existing rating
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM ratings WHERE task_id = $1 AND rater_id = $2"
    )
    .bind(task_id)
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    if existing > 0 {
        return Err(ApiError::conflict("You already rated this task"));
    }

    let rating = sqlx::query_as::<_, Rating>(
        r#"INSERT INTO ratings (task_id, rater_id, ratee_id, score, comment)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *"#,
    )
    .bind(task_id)
    .bind(auth.user_id)
    .bind(ratee_id)
    .bind(body.score)
    .bind(&body.comment.as_ref().map(|c| sanitize_html(c)))
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Update ratee's average rating
    sqlx::query(
        r#"UPDATE users SET
           total_ratings = total_ratings + 1,
           avg_rating = (SELECT AVG(score)::numeric(3,2) FROM ratings WHERE ratee_id = $1)
           WHERE id = $1"#,
    )
    .bind(ratee_id)
    .execute(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Notify ratee about the rating
    create_notification(pool.inner(), ratee_id, "rating_received", &format!("You received a {}-star rating on \"{}\"", body.score, task.title), Some(task.id)).await;

    Ok(Json(rating))
}

#[derive(serde::Serialize, sqlx::FromRow)]
pub struct RatingWithContext {
    pub id: uuid::Uuid,
    pub task_id: uuid::Uuid,
    pub score: i16,
    pub comment: Option<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub rater_name: String,
    pub task_title: String,
}

#[derive(serde::Serialize)]
pub struct RatingListResponse {
    pub ratings: Vec<RatingWithContext>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
}

#[rocket::get("/api/users/<user_id>/ratings?<page>&<per_page>")]
pub async fn list_user_ratings(
    pool: &State<PgPool>,
    user_id: &str,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<RatingListResponse>, (Status, Json<ApiError>)> {
    let uid = Uuid::parse_str(user_id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM ratings WHERE ratee_id = $1"
    )
    .bind(uid)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let ratings = sqlx::query_as::<_, RatingWithContext>(
        r#"SELECT r.id, r.task_id, r.score, r.comment, r.created_at,
                  u.display_name AS rater_name, t.title AS task_title
           FROM ratings r
           JOIN users u ON u.id = r.rater_id
           JOIN tasks t ON t.id = r.task_id
           WHERE r.ratee_id = $1
           ORDER BY r.created_at DESC
           LIMIT $2 OFFSET $3"#
    )
    .bind(uid)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(RatingListResponse { ratings, total, page, per_page }))
}
