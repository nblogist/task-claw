use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
pub struct PortfolioItem {
    pub id: Uuid,
    pub user_id: Uuid,
    pub task_id: Option<Uuid>,
    pub title: String,
    pub description: String,
    pub url: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct PortfolioItemWithRating {
    #[serde(flatten)]
    pub item: PortfolioItem,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_rating: Option<rust_decimal::Decimal>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub task_title: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PortfolioListResponse {
    pub items: Vec<PortfolioItemWithRating>,
    pub total: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreatePortfolioRequest {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub description: String,
    pub task_id: Option<Uuid>,
    pub url: Option<String>,
}
