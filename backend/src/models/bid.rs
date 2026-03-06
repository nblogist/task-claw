use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "bid_status", rename_all = "snake_case")]
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
    "USD".to_string()
}
