use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::State;
use sqlx::PgPool;
use uuid::Uuid;

use crate::constants::CATEGORIES;
use crate::errors::ApiError;
use crate::guards::auth::AuthUser;
use crate::models::task::*;
use crate::models::user::{PublicUser, User};
use crate::services::task_lifecycle::can_transition;

#[derive(serde::Serialize)]
pub struct CategoryItem {
    pub name: String,
    pub task_count: i64,
}

#[rocket::get("/api/tasks?<status>&<category>&<min_budget>&<max_budget>&<currency>&<search>&<sort>&<page>&<per_page>")]
pub async fn list_tasks(
    pool: &State<PgPool>,
    status: Option<String>,
    category: Option<String>,
    min_budget: Option<String>,
    max_budget: Option<String>,
    currency: Option<String>,
    search: Option<String>,
    sort: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<TaskListResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    let mut where_clauses = vec!["1=1".to_string()];
    let mut param_idx = 0u32;

    // Build dynamic query with string concatenation
    // We'll use a simpler approach with optional filters
    let status_filter = status.as_deref().unwrap_or("");
    let category_filter = category.as_deref().unwrap_or("");
    let currency_filter = currency.as_deref().unwrap_or("");
    let search_filter = search.as_deref().unwrap_or("");

    let min_budget_val: Option<rust_decimal::Decimal> = min_budget.as_ref().and_then(|v| v.parse().ok());
    let max_budget_val: Option<rust_decimal::Decimal> = max_budget.as_ref().and_then(|v| v.parse().ok());

    let order_by = match sort.as_deref() {
        Some("budget_asc") => "t.budget_max ASC",
        Some("budget_desc") => "t.budget_max DESC",
        Some("deadline") => "t.deadline ASC",
        Some("oldest") => "t.created_at ASC",
        _ => "t.created_at DESC",
    };

    // Count query
    let count_row = sqlx::query_scalar::<_, i64>(
        &format!(
            r#"SELECT COUNT(*) FROM tasks t
            WHERE ($1 = '' OR t.status::text = $1)
            AND ($2 = '' OR t.category = $2)
            AND ($3 = '' OR t.currency = $3)
            AND ($4 = '' OR t.title ILIKE '%' || $4 || '%' OR t.description ILIKE '%' || $4 || '%')
            AND ($5::numeric IS NULL OR t.budget_max >= $5)
            AND ($6::numeric IS NULL OR t.budget_min <= $6)"#
        ),
    )
    .bind(status_filter)
    .bind(category_filter)
    .bind(currency_filter)
    .bind(search_filter)
    .bind(min_budget_val)
    .bind(max_budget_val)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let total = count_row;
    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    // Main query
    let rows = sqlx::query_as::<_, Task>(
        &format!(
            r#"SELECT t.* FROM tasks t
            WHERE ($1 = '' OR t.status::text = $1)
            AND ($2 = '' OR t.category = $2)
            AND ($3 = '' OR t.currency = $3)
            AND ($4 = '' OR t.title ILIKE '%' || $4 || '%' OR t.description ILIKE '%' || $4 || '%')
            AND ($5::numeric IS NULL OR t.budget_max >= $5)
            AND ($6::numeric IS NULL OR t.budget_min <= $6)
            ORDER BY {}
            LIMIT $7 OFFSET $8"#,
            order_by
        ),
    )
    .bind(status_filter)
    .bind(category_filter)
    .bind(currency_filter)
    .bind(search_filter)
    .bind(min_budget_val)
    .bind(max_budget_val)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let mut tasks = Vec::new();
    for task in &rows {
        let bid_count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM bids WHERE task_id = $1"
        )
        .bind(task.id)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);

        let buyer = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1"
        )
        .bind(task.buyer_id)
        .fetch_optional(pool.inner())
        .await
        .ok()
        .flatten()
        .map(|u| PublicUser::from(&u));

        tasks.push(TaskSummary {
            id: task.id,
            slug: task.slug.clone(),
            title: task.title.clone(),
            category: task.category.clone(),
            tags: task.tags.clone(),
            budget_min: task.budget_min,
            budget_max: task.budget_max,
            currency: task.currency.clone(),
            deadline: task.deadline,
            status: task.status.clone(),
            view_count: task.view_count,
            bid_count: Some(bid_count),
            buyer,
            created_at: task.created_at,
        });
    }

    Ok(Json(TaskListResponse {
        tasks,
        total,
        page,
        per_page,
        total_pages,
    }))
}

#[rocket::get("/api/tasks/<slug>")]
pub async fn get_task(
    pool: &State<PgPool>,
    slug: &str,
) -> Result<Json<TaskDetail>, (Status, Json<ApiError>)> {
    // Increment view count and fetch
    let mut task = sqlx::query_as::<_, Task>(
        r#"UPDATE tasks SET view_count = view_count + 1
           WHERE slug = $1
           RETURNING *"#,
    )
    .bind(slug)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Task not found"))?;

    // Lazy deadline check: auto-expire open/bidding tasks past deadline
    if matches!(task.status, TaskStatus::Open | TaskStatus::Bidding) && task.deadline < chrono::Utc::now() {
        task = sqlx::query_as::<_, Task>(
            "UPDATE tasks SET status = 'expired', updated_at = now() WHERE id = $1 RETURNING *"
        )
        .bind(task.id)
        .fetch_one(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;
    }

    let bid_count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM bids WHERE task_id = $1"
    )
    .bind(task.id)
    .fetch_one(pool.inner())
    .await
    .unwrap_or(0);

    let buyer = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1"
    )
    .bind(task.buyer_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(TaskDetail {
        task,
        bid_count,
        buyer: PublicUser::from(&buyer),
    }))
}

#[rocket::get("/api/categories")]
pub async fn list_categories(
    pool: &State<PgPool>,
) -> Result<Json<Vec<CategoryItem>>, (Status, Json<ApiError>)> {
    let mut result = Vec::new();

    for cat in CATEGORIES {
        let count = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tasks WHERE category = $1"
        )
        .bind(cat)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);

        result.push(CategoryItem {
            name: cat.to_string(),
            task_count: count,
        });
    }

    Ok(Json(result))
}

#[rocket::post("/api/tasks", data = "<body>")]
pub async fn create_task(
    pool: &State<PgPool>,
    auth: AuthUser,
    body: Json<CreateTaskRequest>,
) -> Result<Json<Task>, (Status, Json<ApiError>)> {
    let body = body.into_inner();

    // Validate
    if body.title.is_empty() || body.title.len() > 120 {
        return Err(ApiError::bad_request("Title must be 1-120 characters"));
    }
    if body.description.is_empty() || body.description.len() > 2000 {
        return Err(ApiError::bad_request("Description must be 1-2000 characters"));
    }
    if body.budget_min < rust_decimal::Decimal::ZERO {
        return Err(ApiError::bad_request("budget_min must be >= 0"));
    }
    if body.budget_max < rust_decimal::Decimal::ZERO {
        return Err(ApiError::bad_request("budget_max must be >= 0"));
    }
    if body.budget_min > body.budget_max {
        return Err(ApiError::bad_request("budget_min must be <= budget_max"));
    }
    if body.deadline <= chrono::Utc::now() {
        return Err(ApiError::bad_request("Deadline must be in the future"));
    }

    // Generate unique slug
    let base_slug = slug::slugify(&body.title);
    let mut task_slug = base_slug.clone();
    let mut attempt = 0;
    loop {
        let exists = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM tasks WHERE slug = $1"
        )
        .bind(&task_slug)
        .fetch_one(pool.inner())
        .await
        .unwrap_or(0);

        if exists == 0 {
            break;
        }
        attempt += 1;
        task_slug = format!("{}-{}", base_slug, attempt);
    }

    // Increment tasks_posted
    sqlx::query("UPDATE users SET tasks_posted = tasks_posted + 1 WHERE id = $1")
        .bind(auth.user_id)
        .execute(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    let task = sqlx::query_as::<_, Task>(
        r#"INSERT INTO tasks (slug, buyer_id, title, description, category, tags, budget_min, budget_max, currency, deadline)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *"#,
    )
    .bind(&task_slug)
    .bind(auth.user_id)
    .bind(&body.title)
    .bind(&body.description)
    .bind(&body.category)
    .bind(&body.tags)
    .bind(body.budget_min)
    .bind(body.budget_max)
    .bind(&body.currency)
    .bind(body.deadline)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(task))
}

#[rocket::put("/api/tasks/<id>", data = "<body>")]
pub async fn update_task(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
    body: Json<crate::models::task::UpdateTaskRequest>,
) -> Result<Json<Task>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let task = sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
        .bind(task_id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?
        .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if task.buyer_id != auth.user_id {
        return Err(ApiError::forbidden("Only the buyer can edit this task"));
    }

    if !matches!(task.status, TaskStatus::Open | TaskStatus::Bidding) {
        return Err(ApiError::bad_request("Can only edit tasks in open or bidding status"));
    }

    let body = body.into_inner();
    let title = body.title.unwrap_or(task.title);
    let description = body.description.unwrap_or(task.description);
    let category = body.category.unwrap_or(task.category);
    let tags = body.tags.unwrap_or(task.tags);
    let budget_min = body.budget_min.unwrap_or(task.budget_min);
    let budget_max = body.budget_max.unwrap_or(task.budget_max);
    let deadline = body.deadline.unwrap_or(task.deadline);

    if title.is_empty() || title.len() > 120 {
        return Err(ApiError::bad_request("Title must be 1-120 characters"));
    }
    if budget_min < rust_decimal::Decimal::ZERO || budget_max < rust_decimal::Decimal::ZERO {
        return Err(ApiError::bad_request("Budget must be >= 0"));
    }
    if budget_min > budget_max {
        return Err(ApiError::bad_request("budget_min must be <= budget_max"));
    }

    let updated = sqlx::query_as::<_, Task>(
        r#"UPDATE tasks SET title = $1, description = $2, category = $3, tags = $4,
           budget_min = $5, budget_max = $6, deadline = $7, updated_at = now()
           WHERE id = $8 RETURNING *"#,
    )
    .bind(&title)
    .bind(&description)
    .bind(&category)
    .bind(&tags)
    .bind(budget_min)
    .bind(budget_max)
    .bind(deadline)
    .bind(task_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(updated))
}

#[rocket::delete("/api/tasks/<id>")]
pub async fn cancel_task(
    pool: &State<PgPool>,
    auth: AuthUser,
    id: &str,
) -> Result<Json<Task>, (Status, Json<ApiError>)> {
    let task_id = Uuid::parse_str(id)
        .map_err(|_| ApiError::bad_request("Invalid task ID"))?;

    let task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE id = $1"
    )
    .bind(task_id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?
    .ok_or_else(|| ApiError::not_found("Task not found"))?;

    if task.buyer_id != auth.user_id {
        return Err(ApiError::forbidden("Only the buyer can cancel this task"));
    }

    if !can_transition(&task.status, &TaskStatus::Cancelled) {
        return Err(ApiError::bad_request(format!(
            "Cannot transition task from {:?} to cancelled", task.status
        )));
    }

    let updated = sqlx::query_as::<_, Task>(
        r#"UPDATE tasks SET status = 'cancelled', updated_at = now()
           WHERE id = $1 RETURNING *"#,
    )
    .bind(task_id)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    Ok(Json(updated))
}

#[rocket::get("/health")]
pub async fn health() -> &'static str {
    "OK"
}
