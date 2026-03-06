use rocket::http::Status;
use rocket::serde::json::Json;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub error: String,
    pub status: u16,
}

impl ApiError {
    pub fn new(status: Status, message: impl Into<String>) -> (Status, Json<ApiError>) {
        let s = status;
        (s, Json(ApiError {
            error: message.into(),
            status: s.code,
        }))
    }

    pub fn bad_request(msg: impl Into<String>) -> (Status, Json<ApiError>) {
        Self::new(Status::BadRequest, msg)
    }

    pub fn unauthorized(msg: impl Into<String>) -> (Status, Json<ApiError>) {
        Self::new(Status::Unauthorized, msg)
    }

    pub fn forbidden(msg: impl Into<String>) -> (Status, Json<ApiError>) {
        Self::new(Status::Forbidden, msg)
    }

    pub fn not_found(msg: impl Into<String>) -> (Status, Json<ApiError>) {
        Self::new(Status::NotFound, msg)
    }

    pub fn conflict(msg: impl Into<String>) -> (Status, Json<ApiError>) {
        Self::new(Status::Conflict, msg)
    }

    pub fn internal(msg: impl Into<String>) -> (Status, Json<ApiError>) {
        let raw = msg.into();
        // Log the actual error for debugging but don't leak DB details to client
        eprintln!("[ERROR] Internal: {}", raw);
        Self::new(Status::InternalServerError, "Internal server error")
    }
}
