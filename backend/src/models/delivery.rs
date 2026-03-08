use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
pub struct Delivery {
    pub id: Uuid,
    pub task_id: Uuid,
    pub seller_id: Uuid,
    pub message: String,
    pub url: Option<String>,
    pub file_url: Option<String>,
    pub revision_of: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateDeliveryRequest {
    #[serde(default)]
    pub message: Option<String>,
    pub url: Option<String>,
    pub file_url: Option<String>,
}
