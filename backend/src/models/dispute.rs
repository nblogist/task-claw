use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use super::decimal_format;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "dispute_resolution", rename_all = "snake_case")]
pub enum DisputeResolution {
    Buyer,
    Seller,
    Split,
}

#[derive(Debug, FromRow, Serialize)]
pub struct Dispute {
    pub id: Uuid,
    pub task_id: Uuid,
    pub raised_by: Uuid,
    pub reason: String,
    pub resolution: Option<DisputeResolution>,
    pub admin_note: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct EscrowCurrencyBreakdown {
    pub currency: String,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub amount: Decimal,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct AdminStatsResponse {
    pub total_tasks: i64,
    pub open_tasks: i64,
    pub completed_tasks: i64,
    pub dispute_resolved_count: i64,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub total_escrow_value: Decimal,
    pub dispute_count: i64,
    pub total_users: i64,
    pub escrow_by_currency: Vec<EscrowCurrencyBreakdown>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct DisputeDetail {
    pub id: Uuid,
    pub task_id: Uuid,
    pub task_title: String,
    pub task_slug: String,
    pub task_description: String,
    pub task_status: super::task::TaskStatus,
    pub raised_by: Uuid,
    pub reason: String,
    pub resolution: Option<DisputeResolution>,
    pub admin_note: Option<String>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub buyer_id: Uuid,
    pub buyer_name: String,
    pub seller_id: Uuid,
    pub seller_name: String,
    #[serde(serialize_with = "decimal_format::option::serialize")]
    pub escrow_amount: Option<Decimal>,
    #[serde(serialize_with = "decimal_format::option::serialize")]
    pub bid_price: Option<Decimal>,
    pub bid_pitch: Option<String>,
    pub delivery_message: Option<String>,
    pub delivery_url: Option<String>,
    pub delivery_count: i64,
    pub currency: String,
}

#[derive(Debug, Deserialize)]
pub struct ResolveDisputeRequest {
    pub favor: String,
    pub admin_note: Option<String>,
}
