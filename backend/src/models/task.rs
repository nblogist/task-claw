use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::Value as JsonValue;
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "task_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Open,
    Bidding,
    InEscrow,
    Delivered,
    Completed,
    Disputed,
    Cancelled,
    Expired,
}

#[derive(Debug, FromRow, Serialize)]
pub struct Task {
    pub id: Uuid,
    pub slug: String,
    pub buyer_id: Uuid,
    pub title: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub budget_min: Decimal,
    pub budget_max: Decimal,
    pub currency: String,
    pub deadline: DateTime<Utc>,
    pub status: TaskStatus,
    pub priority: String,
    pub accepted_bid_id: Option<Uuid>,
    pub specifications: Option<JsonValue>,
    pub view_count: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub title: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub budget_min: Decimal,
    #[serde(default)]
    pub budget_max: Decimal,
    #[serde(default = "default_currency")]
    pub currency: String,
    pub deadline: DateTime<Utc>,
    #[serde(default = "default_priority")]
    pub priority: Option<String>,
    pub specifications: Option<JsonValue>,
}

fn default_priority() -> Option<String> {
    Some("normal".to_string())
}

fn default_currency() -> String {
    "CKB".to_string()
}

#[derive(Debug, Deserialize)]
pub struct UpdateTaskRequest {
    pub title: Option<String>,
    pub description: Option<String>,
    pub category: Option<String>,
    pub tags: Option<Vec<String>>,
    pub budget_min: Option<Decimal>,
    pub budget_max: Option<Decimal>,
    pub deadline: Option<DateTime<Utc>>,
    pub specifications: Option<JsonValue>,
}

#[derive(Debug, Deserialize, Default)]
pub struct TaskQuery {
    pub status: Option<String>,
    pub category: Option<String>,
    pub min_budget: Option<Decimal>,
    pub max_budget: Option<Decimal>,
    pub currency: Option<String>,
    pub search: Option<String>,
    pub sort: Option<String>,
    pub page: Option<i64>,
    pub per_page: Option<i64>,
}

#[derive(Debug, Serialize)]
pub struct TaskListResponse {
    pub tasks: Vec<TaskSummary>,
    pub total: i64,
    pub page: i64,
    pub per_page: i64,
    pub total_pages: i64,
}

#[derive(Debug, Serialize)]
pub struct TaskSummary {
    pub id: Uuid,
    pub slug: String,
    pub title: String,
    pub category: String,
    pub tags: Vec<String>,
    pub budget_min: Decimal,
    pub budget_max: Decimal,
    pub currency: String,
    pub deadline: DateTime<Utc>,
    pub status: TaskStatus,
    pub priority: String,
    pub view_count: i32,
    pub bid_count: Option<i64>,
    pub buyer: Option<super::user::PublicUser>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_mine: Option<bool>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct TaskDetail {
    #[serde(flatten)]
    pub task: Task,
    pub bid_count: i64,
    pub buyer: super::user::PublicUser,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub my_rating: Option<super::rating::Rating>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub escrow: Option<super::escrow::Escrow>,
}
