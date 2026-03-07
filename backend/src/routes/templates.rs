use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::constants::{VALID_CURRENCIES, sanitize_html};
use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::template::*;

#[rocket::post("/api/templates", data = "<body>")]
pub async fn create_template(
    pool: &State<PgPool>,
    auth: AuthUser,
    body: Json<CreateTemplateRequest>,
) -> Result<Json<TaskTemplate>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    if body.name.is_empty() || body.name.len() > 120 {
        return Err(ApiError::bad_request("Template name must be 1-120 characters"));
    }

    if !VALID_CURRENCIES.contains(&body.currency.as_str()) {
        return Err(ApiError::bad_request(format!(
            "Invalid currency. Valid: {}", VALID_CURRENCIES.join(", ")
        )));
    }

    let valid_priorities = ["low", "normal", "high", "urgent"];
    if !valid_priorities.contains(&body.priority.as_str()) {
        return Err(ApiError::bad_request("Priority must be: low, normal, high, or urgent"));
    }

    // Limit templates per user
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM task_templates WHERE user_id = $1"
    )
    .bind(auth.user_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if count >= 20 {
        return Err(ApiError::bad_request("Maximum 20 templates per account"));
    }

    let template = sqlx::query_as::<_, TaskTemplate>(
        r#"INSERT INTO task_templates (user_id, name, description, category, tags, budget_min, budget_max, currency, priority, specifications)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *"#,
    )
    .bind(auth.user_id)
    .bind(&sanitize_html(&body.name))
    .bind(&sanitize_html(&body.description))
    .bind(&body.category)
    .bind(&body.tags)
    .bind(body.budget_min)
    .bind(body.budget_max)
    .bind(&body.currency)
    .bind(&body.priority)
    .bind(&body.specifications)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(template))
}

#[rocket::get("/api/templates")]
pub async fn list_templates(
    pool: &State<PgPool>,
    auth: AuthUser,
) -> Result<Json<Vec<TaskTemplate>>, (Status, Json<ApiError>)> {
    let templates = sqlx::query_as::<_, TaskTemplate>(
        "SELECT * FROM task_templates WHERE user_id = $1 ORDER BY created_at DESC"
    )
    .bind(auth.user_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(templates))
}

#[rocket::delete("/api/templates/<id>")]
pub async fn delete_template(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
) -> Result<Json<serde_json::Value>, (Status, Json<ApiError>)> {
    let template_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid template ID"))?;

    let result = sqlx::query(
        "DELETE FROM task_templates WHERE id = $1 AND user_id = $2"
    )
    .bind(template_id)
    .bind(auth.user_id)
    .execute(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err(ApiError::not_found("Template not found"));
    }

    Ok(Json(json!({"message": "Template deleted"})))
}
