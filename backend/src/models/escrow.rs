use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

use super::decimal_format;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "escrow_status", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum EscrowStatus {
    Locked,
    Released,
    Refunded,
    Disputed,
}

#[derive(Debug, FromRow, Serialize)]
pub struct Escrow {
    pub id: Uuid,
    pub task_id: Uuid,
    pub bid_id: Uuid,
    pub buyer_id: Uuid,
    pub seller_id: Uuid,
    #[serde(serialize_with = "decimal_format::serialize")]
    pub amount: Decimal,
    pub currency: String,
    pub status: EscrowStatus,
    pub locked_at: DateTime<Utc>,
    pub released_at: Option<DateTime<Utc>>,
    pub tx_hash: Option<String>,
    /// Always true for v1 — escrow is simulated (DB ledger only, no real funds)
    #[sqlx(skip)]
    #[serde(default = "default_simulated")]
    pub simulated: bool,
}

fn default_simulated() -> bool {
    true
}
