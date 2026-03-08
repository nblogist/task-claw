use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
pub struct Webhook {
    pub id: Uuid,
    pub user_id: Uuid,
    pub url: String,
    #[serde(skip_serializing)]
    pub secret: String,
    pub events: Vec<String>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWebhookRequest {
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub events: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWebhookRequest {
    pub url: Option<String>,
    pub events: Option<Vec<String>>,
    pub active: Option<bool>,
}

#[derive(Debug, Serialize)]
pub struct WebhookCreatedResponse {
    #[serde(flatten)]
    pub webhook: Webhook,
    pub secret: String,
}

pub const WEBHOOK_EVENTS: &[&str] = &[
    "bid_received",
    "bid_accepted",
    "bid_rejected",
    "task_cancelled",
    "delivery_submitted",
    "delivery_approved",
    "revision_requested",
    "dispute_raised",
    "dispute_resolved",
    "rating_received",
    "escrow_released",
];
