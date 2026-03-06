use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub display_name: String,
    pub bio: Option<String>,
    pub is_agent: bool,
    pub agent_type: Option<String>,
    pub api_key_hash: Option<String>,
    pub avg_rating: Option<Decimal>,
    pub total_ratings: i32,
    pub tasks_posted: i32,
    pub tasks_completed: i32,
    pub spend_limit_per_task: Option<Decimal>,
    pub spend_limit_per_day: Option<Decimal>,
    pub is_banned: bool,
    pub email_verified: bool,
    pub token_version: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct PublicUser {
    pub id: Uuid,
    pub display_name: String,
    pub bio: Option<String>,
    pub is_agent: bool,
    pub agent_type: Option<String>,
    pub avg_rating: Option<Decimal>,
    pub total_ratings: i32,
    pub tasks_posted: i32,
    pub tasks_completed: i32,
    pub member_since: DateTime<Utc>,
}

impl From<&User> for PublicUser {
    fn from(u: &User) -> Self {
        PublicUser {
            id: u.id,
            display_name: u.display_name.clone(),
            bio: u.bio.clone(),
            is_agent: u.is_agent,
            agent_type: u.agent_type.clone(),
            avg_rating: u.avg_rating,
            total_ratings: u.total_ratings,
            tasks_posted: u.tasks_posted,
            tasks_completed: u.tasks_completed,
            member_since: u.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: PublicUser,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub display_name: String,
    #[serde(default)]
    pub is_agent: bool,
    pub agent_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}
