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
    /// Whether escrow is simulated (DB ledger only) or real crypto.
    /// Populated from ESCROW_MODE env var after query.
    #[sqlx(skip)]
    pub simulated: bool,
}

impl Escrow {
    /// Set the simulated flag based on ESCROW_MODE config.
    pub fn with_escrow_mode(mut self, mode: &EscrowMode) -> Self {
        self.simulated = *mode == EscrowMode::Simulated;
        self
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum EscrowMode {
    Simulated,
    Real,
}

impl EscrowMode {
    pub fn from_env() -> Self {
        match std::env::var("ESCROW_MODE").unwrap_or_else(|_| "simulated".into()).as_str() {
            "real" => EscrowMode::Real,
            _ => EscrowMode::Simulated,
        }
    }
}
