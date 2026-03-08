use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::constants::sanitize_html;
use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::portfolio::*;

#[rocket::post("/api/portfolio", data = "<body>")]
pub async fn create_portfolio_item(
    pool: &State<PgPool>,
    auth: AuthUser,
    body: Json<CreatePortfolioRequest>,
) -> Result<Json<PortfolioItem>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    let title = match body.title {
        Some(ref t) if !t.is_empty() => t.clone(),
        Some(_) => return Err(ApiError::validation(std::collections::HashMap::from([("title".into(), "Required (cannot be empty)".into())]))),
        None => return Err(ApiError::validation(std::collections::HashMap::from([("title".into(), "Required".into())]))),
    };
    if title.len() > 120 {
        return Err(ApiError::bad_request("Title must be 1-120 characters"));
    }
    if body.description.len() > 2000 {
        return Err(ApiError::bad_request("Description must be under 2000 characters"));
    }
    if let Some(ref url) = body.url {
        if url.len() > 2048 {
            return Err(ApiError::bad_request("URL must be under 2048 characters"));
        }
    }

    // If linking to a task, verify user was a participant and task is completed
    if let Some(task_id) = body.task_id {
        let task = sqlx::query_as::<_, (Uuid, String, String)>(
            "SELECT buyer_id, status::text, title FROM tasks WHERE id = $1"
        )
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::bad_request("Linked task not found"))?;

        if task.1 != "completed" {
            return Err(ApiError::bad_request("Can only link to completed tasks"));
        }

        // Verify user was buyer or accepted seller
        let is_participant = task.0 == auth.user_id || sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM bids WHERE task_id = $1 AND seller_id = $2 AND status = 'accepted')"
        )
        .bind(task_id)
        .bind(auth.user_id)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(false);

        if !is_participant {
            return Err(ApiError::forbidden("You must be a participant in the linked task"));
        }
    }

    // Limit portfolio items per user
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM portfolio_items WHERE user_id = $1"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if count >= 50 {
        return Err(ApiError::bad_request("Maximum 50 portfolio items"));
    }

    let item = sqlx::query_as::<_, PortfolioItem>(
        r#"INSERT INTO portfolio_items (user_id, task_id, title, description, url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *"#,
    )
    .bind(auth.user_id)
    .bind(body.task_id)
    .bind(&sanitize_html(&title))
    .bind(&sanitize_html(&body.description))
    .bind(&body.url)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(item))
}

#[rocket::get("/api/users/<user_id>/portfolio")]
pub async fn list_portfolio(
    pool: &State<PgPool>,
    user_id: &str,
) -> Result<Json<PortfolioListResponse>, (Status, Json<ApiError>)> {
    let uid = Uuid::parse_str(user_id)
        .map_err(|_| ApiError::bad_request("Invalid user ID"))?;

    let rows = sqlx::query_as::<_, (Uuid, Uuid, Option<Uuid>, String, String, Option<String>, chrono::DateTime<chrono::Utc>, Option<rust_decimal::Decimal>, Option<String>)>(
        r#"SELECT p.id, p.user_id, p.task_id, p.title, p.description, p.url, p.created_at,
                  r.score, t.title AS task_title
           FROM portfolio_items p
           LEFT JOIN tasks t ON t.id = p.task_id
           LEFT JOIN ratings r ON r.task_id = p.task_id AND r.ratee_id = p.user_id
           WHERE p.user_id = $1
           ORDER BY p.created_at DESC"#,
    )
    .bind(uid)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let items: Vec<PortfolioItemWithRating> = rows.into_iter().map(|(id, user_id, task_id, title, description, url, created_at, score, task_title)| {
        PortfolioItemWithRating {
            item: PortfolioItem { id, user_id, task_id, title, description, url, created_at },
            task_rating: score,
            task_title,
        }
    }).collect();

    let total = items.len() as i64;
    Ok(Json(PortfolioListResponse { items, total }))
}

#[rocket::delete("/api/portfolio/<id>")]
pub async fn delete_portfolio_item(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let item_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid portfolio item ID"))?;

    let result = sqlx::query(
        "DELETE FROM portfolio_items WHERE id = $1 AND user_id = $2"
    )
    .bind(item_id)
    .bind(auth.user_id)
    .execute(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::not_found("Portfolio item not found"));
    }

    Ok(Json(json!({"message": "Portfolio item deleted"})))
}
