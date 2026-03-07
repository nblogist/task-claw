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
use crate::services::rate_limit::RateLimiter;
use crate::services::task_lifecycle::can_transition;
use crate::routes::notifications::create_notification;

#[derive(serde::Serialize)]
pub struct CategoryItem {
    pub name: String,
    pub task_count: i64,
}

#[derive(Debug, sqlx::FromRow)]
struct TaskWithBuyerRow {
    // Task fields
    id: Uuid,
    slug: String,
    buyer_id: Uuid,
    title: String,
    description: String,
    category: String,
    tags: Vec<String>,
    budget_min: rust_decimal::Decimal,
    budget_max: rust_decimal::Decimal,
    currency: String,
    deadline: chrono::DateTime<chrono::Utc>,
    status: TaskStatus,
    accepted_bid_id: Option<Uuid>,
    specifications: Option<serde_json::Value>,
    view_count: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
    // Aggregated bid count
    bid_count: i64,
    // Buyer fields (nullable from LEFT JOIN)
    buyer_uuid: Option<Uuid>,
    buyer_display_name: Option<String>,
    buyer_is_agent: Option<bool>,
    buyer_agent_type: Option<String>,
    buyer_avg_rating: Option<rust_decimal::Decimal>,
    buyer_total_ratings: Option<i32>,
    buyer_tasks_posted: Option<i32>,
    buyer_tasks_completed: Option<i32>,
    buyer_created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[rocket::get("/api/tasks?<status>&<category>&<min_budget>&<max_budget>&<currency>&<search>&<tag>&<sort>&<page>&<per_page>")]
pub async fn list_tasks(
    pool: &State<PgPool>,
    status: Option<String>,
    category: Option<String>,
    min_budget: Option<String>,
    max_budget: Option<String>,
    currency: Option<String>,
    search: Option<String>,
    tag: Option<String>,
    sort: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
) -> Result<Json<TaskListResponse>, (Status, Json<ApiError>)> {
    let page = page.unwrap_or(1).max(1);
    let per_page = per_page.unwrap_or(20).clamp(1, 100);
    let offset = (page - 1) * per_page;

    // Build dynamic query with optional filters
    let status_filter = status.as_deref().unwrap_or("");
    let category_filter = category.as_deref().unwrap_or("");
    let currency_filter = currency.as_deref().unwrap_or("");
    let search_filter = search.as_deref().unwrap_or("");
    let tag_filter = tag.as_deref().unwrap_or("");

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
            AND ($6::numeric IS NULL OR t.budget_min <= $6)
            AND ($7 = '' OR $7 = ANY(t.tags))"#
        ),
    )
    .bind(status_filter)
    .bind(category_filter)
    .bind(currency_filter)
    .bind(search_filter)
    .bind(min_budget_val)
    .bind(max_budget_val)
    .bind(tag_filter)
    .fetch_one(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let total = count_row;
    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    // Main query with LEFT JOIN to eliminate N+1 (bid count + buyer in single query)
    let rows = sqlx::query_as::<_, TaskWithBuyerRow>(
        &format!(
            r#"SELECT t.*,
                (SELECT COUNT(*) FROM bids WHERE task_id = t.id) AS bid_count,
                u.id AS buyer_uuid, u.display_name AS buyer_display_name,
                u.is_agent AS buyer_is_agent, u.agent_type AS buyer_agent_type,
                u.avg_rating AS buyer_avg_rating,
                u.total_ratings AS buyer_total_ratings, u.tasks_posted AS buyer_tasks_posted,
                u.tasks_completed AS buyer_tasks_completed, u.created_at AS buyer_created_at
            FROM tasks t
            LEFT JOIN users u ON u.id = t.buyer_id
            WHERE ($1 = '' OR t.status::text = $1)
            AND ($2 = '' OR t.category = $2)
            AND ($3 = '' OR t.currency = $3)
            AND ($4 = '' OR t.title ILIKE '%' || $4 || '%' OR t.description ILIKE '%' || $4 || '%')
            AND ($5::numeric IS NULL OR t.budget_max >= $5)
            AND ($6::numeric IS NULL OR t.budget_min <= $6)
            AND ($7 = '' OR $7 = ANY(t.tags))
            ORDER BY {}
            LIMIT $8 OFFSET $9"#,
            order_by
        ),
    )
    .bind(status_filter)
    .bind(category_filter)
    .bind(currency_filter)
    .bind(search_filter)
    .bind(min_budget_val)
    .bind(max_budget_val)
    .bind(tag_filter)
    .bind(per_page)
    .bind(offset)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let tasks: Vec<TaskSummary> = rows.iter().map(|row| {
        let buyer = row.buyer_uuid.map(|id| PublicUser {
            id,
            display_name: row.buyer_display_name.clone().unwrap_or_default(),
            bio: None,
            is_agent: row.buyer_is_agent.unwrap_or(false),
            agent_type: row.buyer_agent_type.clone(),
            avg_rating: row.buyer_avg_rating,
            total_ratings: row.buyer_total_ratings.unwrap_or(0),
            tasks_posted: row.buyer_tasks_posted.unwrap_or(0),
            tasks_completed: row.buyer_tasks_completed.unwrap_or(0),
            member_since: row.buyer_created_at.unwrap_or_default(),
        });

        TaskSummary {
            id: row.id,
            slug: row.slug.clone(),
            title: row.title.clone(),
            category: row.category.clone(),
            tags: row.tags.clone(),
            budget_min: row.budget_min,
            budget_max: row.budget_max,
            currency: row.currency.clone(),
            deadline: row.deadline,
            status: row.status.clone(),
            view_count: row.view_count,
            bid_count: Some(row.bid_count),
            buyer,
            created_at: row.created_at,
        }
    }).collect();

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
    auth: Option<AuthUser>,
    slug: &str,
) -> Result<Json<TaskDetail>, (Status, Json<ApiError>)> {
    // Fetch task by slug, or by UUID as fallback
    let mut task = sqlx::query_as::<_, Task>(
        "SELECT * FROM tasks WHERE slug = $1",
    )
    .bind(slug)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Fallback: try parsing as UUID
    let mut task = match task {
        Some(t) => t,
        None => {
            if let Ok(uuid) = uuid::Uuid::parse_str(slug) {
                sqlx::query_as::<_, Task>("SELECT * FROM tasks WHERE id = $1")
                    .bind(uuid)
                    .fetch_optional(pool.inner())
                    .await
                    .map_err(|e| ApiError::internal(e.to_string()))?
                    .ok_or_else(|| ApiError::not_found("Task not found"))?
            } else {
                return Err(ApiError::not_found("Task not found"));
            }
        }
    };

    // Increment view count only if not the task owner (GAP-22)
    let is_owner = auth.as_ref().map_or(false, |a| a.user_id == task.buyer_id);
    if !is_owner {
        if let Err(e) = sqlx::query("UPDATE tasks SET view_count = view_count + 1 WHERE id = $1")
            .bind(task.id)
            .execute(pool.inner())
            .await
        {
            eprintln!("[WARN] Failed to increment view count for task {}: {}", task.id, e);
        }
        task.view_count += 1;
    }

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

    // Check if the authenticated user already rated this task
    let my_rating = if let Some(ref a) = auth {
        sqlx::query_as::<_, crate::models::rating::Rating>(
            "SELECT * FROM ratings WHERE task_id = $1 AND rater_id = $2"
        )
        .bind(task.id)
        .bind(a.user_id)
        .fetch_optional(pool.inner())
        .await
        .unwrap_or(None)
    } else {
        None
    };

    // Fetch escrow if task has one (in_escrow, delivered, disputed, completed)
    let escrow = if matches!(task.status, TaskStatus::InEscrow | TaskStatus::Delivered | TaskStatus::Disputed | TaskStatus::Completed) {
        sqlx::query_as::<_, crate::models::escrow::Escrow>(
            "SELECT * FROM escrow WHERE task_id = $1"
        )
        .bind(task.id)
        .fetch_optional(pool.inner())
        .await
        .unwrap_or(None)
    } else {
        None
    };

    Ok(Json(TaskDetail {
        task,
        bid_count,
        buyer: PublicUser::from(&buyer),
        my_rating,
        escrow,
    }))
}

#[rocket::get("/api/categories")]
pub async fn list_categories(
    pool: &State<PgPool>,
) -> Result<Json<Vec<CategoryItem>>, (Status, Json<ApiError>)> {
    // Single GROUP BY query instead of N separate COUNT queries
    let rows = sqlx::query_as::<_, (String, i64)>(
        "SELECT category, COUNT(*) FROM tasks GROUP BY category"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    let counts: std::collections::HashMap<String, i64> = rows.into_iter().collect();

    let result: Vec<CategoryItem> = CATEGORIES
        .iter()
        .map(|cat| CategoryItem {
            name: cat.to_string(),
            task_count: *counts.get(*cat).unwrap_or(&0),
        })
        .collect();

    Ok(Json(result))
}

#[rocket::post("/api/tasks", data = "<body>")]
pub async fn create_task(
    pool: &State<PgPool>,
    limiter: &State<RateLimiter>,
    auth: AuthUser,
    body: Json<CreateTaskRequest>,
) -> Result<Json<Task>, (Status, Json<ApiError>)> {
    if !limiter.check(&format!("create_task:{}", auth.user_id)) {
        return Err(ApiError::new(Status::TooManyRequests, "Too many requests. Try again later."));
    }
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
    if !CATEGORIES.contains(&body.category.as_str()) {
        return Err(ApiError::bad_request(format!("Invalid category. Must be one of: {}", CATEGORIES.join(", "))));
    }
    // X08: Tag count and length validation
    if body.tags.len() > 10 {
        return Err(ApiError::bad_request("Maximum 10 tags allowed"));
    }
    for tag in &body.tags {
        if tag.is_empty() || tag.len() > 50 {
            return Err(ApiError::bad_request("Each tag must be 1-50 characters"));
        }
    }

    // Generate race-condition-safe slug with UUID suffix
    let base_slug = slug::slugify(&body.title);
    let short_id = &Uuid::new_v4().to_string()[..8];
    let task_slug = format!("{}-{}", base_slug, short_id);

    // Wrap insert + tasks_posted in a transaction (C5 fix)
    let mut tx = pool.begin().await.map_err(|e| ApiError::internal(e.to_string()))?;

    let task = sqlx::query_as::<_, Task>(
        r#"INSERT INTO tasks (slug, buyer_id, title, description, category, tags, budget_min, budget_max, currency, deadline, specifications)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
    .bind(&body.specifications)
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| ApiError::internal(e.to_string()))?;

    // Increment tasks_posted AFTER successful insert, inside transaction
    sqlx::query("UPDATE users SET tasks_posted = tasks_posted + 1 WHERE id = $1")
        .bind(auth.user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::internal(e.to_string()))?;

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
    let specifications = body.specifications.or(task.specifications);

    if title.is_empty() || title.len() > 120 {
        return Err(ApiError::bad_request("Title must be 1-120 characters"));
    }
    if description.is_empty() || description.len() > 2000 {
        return Err(ApiError::bad_request("Description must be 1-2000 characters"));
    }
    if budget_min < rust_decimal::Decimal::ZERO || budget_max < rust_decimal::Decimal::ZERO {
        return Err(ApiError::bad_request("Budget must be >= 0"));
    }
    if budget_min > budget_max {
        return Err(ApiError::bad_request("budget_min must be <= budget_max"));
    }
    if !CATEGORIES.contains(&category.as_str()) {
        return Err(ApiError::bad_request(format!("Invalid category. Must be one of: {}", CATEGORIES.join(", "))));
    }
    if tags.len() > 10 {
        return Err(ApiError::bad_request("Maximum 10 tags allowed"));
    }
    for tag in &tags {
        if tag.is_empty() || tag.len() > 50 {
            return Err(ApiError::bad_request("Each tag must be 1-50 characters"));
        }
    }

    let updated = sqlx::query_as::<_, Task>(
        r#"UPDATE tasks SET title = $1, description = $2, category = $3, tags = $4,
           budget_min = $5, budget_max = $6, deadline = $7, specifications = $8, updated_at = now()
           WHERE id = $9 RETURNING *"#,
    )
    .bind(&title)
    .bind(&description)
    .bind(&category)
    .bind(&tags)
    .bind(budget_min)
    .bind(budget_max)
    .bind(deadline)
    .bind(&specifications)
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

    // Notify all pending bidders about cancellation
    if let Ok(bidder_ids) = sqlx::query_scalar::<_, Uuid>(
        "SELECT seller_id FROM bids WHERE task_id = $1 AND status = 'pending'"
    )
    .bind(task_id)
    .fetch_all(pool.inner())
    .await
    {
        for bidder_id in bidder_ids {
            create_notification(pool.inner(), bidder_id, "task_cancelled", &format!("Task \"{}\" was cancelled", task.title), Some(task.id)).await;
        }
    }

    Ok(Json(updated))
}

#[rocket::get("/health")]
pub async fn health(pool: &State<PgPool>) -> Result<&'static str, (Status, Json<ApiError>)> {
    sqlx::query_scalar::<_, i32>("SELECT 1")
        .fetch_one(pool.inner())
        .await
        .map_err(|_| ApiError::new(Status::ServiceUnavailable, "Database unreachable"))?;
    Ok("OK")
}
