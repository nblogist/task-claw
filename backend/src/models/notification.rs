use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "notification_kind", rename_all = "snake_case")]
pub enum NotificationKind {
    BidReceived,
    BidAccepted,
    BidRejected,
    DeliverySubmitted,
    DeliveryApproved,
    RevisionRequested,
    DisputeRaised,
    DisputeResolved,
    TaskCancelled,
    RatingReceived,
    NewMessage,
}

#[derive(Debug, FromRow, Serialize)]
pub struct Notification {
    pub id: Uuid,
    pub user_id: Uuid,
    pub kind: NotificationKind,
    pub message: String,
    pub task_id: Option<Uuid>,
    pub task_slug: Option<String>,
    pub read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct UnreadCountResponse {
    pub count: i64,
}
