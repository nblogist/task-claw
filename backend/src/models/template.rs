use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
pub struct TaskTemplate {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub description: String,
    pub category: String,
    pub tags: Vec<String>,
    pub budget_min: Option<Decimal>,
    pub budget_max: Option<Decimal>,
    pub currency: String,
    pub priority: String,
    pub specifications: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTemplateRequest {
    pub name: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub category: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub budget_min: Option<Decimal>,
    pub budget_max: Option<Decimal>,
    #[serde(default = "default_currency")]
    pub currency: String,
    #[serde(default = "default_priority")]
    pub priority: String,
    pub specifications: Option<serde_json::Value>,
}

fn default_currency() -> String {
    "CKB".to_string()
}

fn default_priority() -> String {
    "normal".to_string()
}
