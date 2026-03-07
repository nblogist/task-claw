use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "bid_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum BidStatus {
    Pending,
    Accepted,
    Rejected,
    Withdrawn,
}

#[derive(Debug, FromRow, Serialize)]
pub struct Bid {
    pub id: Uuid,
    pub task_id: Uuid,
    pub seller_id: Uuid,
    pub price: Decimal,
    pub currency: String,
    pub estimated_delivery_days: i32,
    pub pitch: String,
    pub status: BidStatus,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct BidWithSeller {
    #[serde(flatten)]
    pub bid: Bid,
    pub seller: Option<super::user::PublicUser>,
}

#[derive(Debug, Deserialize)]
pub struct CreateBidRequest {
    pub price: Decimal,
    #[serde(default = "default_currency")]
    pub currency: String,
    pub estimated_delivery_days: i32,
    pub pitch: String,
}

fn default_currency() -> String {
    "CKB".to_string()
}

#[derive(Debug, Deserialize)]
pub struct UpdateBidRequest {
    pub price: Option<Decimal>,
    pub estimated_delivery_days: Option<i32>,
    pub pitch: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct BatchBidItem {
    pub task_id: Uuid,
    pub price: Decimal,
    #[serde(default = "default_currency")]
    pub currency: String,
    pub estimated_delivery_days: i32,
    pub pitch: String,
}

#[derive(Debug, Deserialize)]
pub struct BatchBidRequest {
    pub bids: Vec<BatchBidItem>,
}

#[derive(Debug, Serialize)]
pub struct BatchBidResult {
    pub task_id: Uuid,
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bid: Option<Bid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}
