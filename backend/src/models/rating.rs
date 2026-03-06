use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize)]
pub struct Rating {
    pub id: Uuid,
    pub task_id: Uuid,
    pub rater_id: Uuid,
    pub ratee_id: Uuid,
    pub score: i16,
    pub comment: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRatingRequest {
    pub score: i16,
    pub comment: Option<String>,
}
