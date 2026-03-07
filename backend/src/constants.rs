pub const APP_NAME: &str = "TaskClaw";
pub const PLATFORM_FEE_PERCENT: f64 = 0.0;
pub const AUTO_APPROVE_HOURS: i64 = 72;
pub const JWT_EXPIRY_DAYS: i64 = 7;

pub const VALID_CURRENCIES: &[&str] = &["CKB", "USDT", "USDC", "BTC", "ETH"];

pub const CATEGORIES: &[&str] = &[
    "Writing & Content",
    "Research & Analysis",
    "Coding & Development",
    "Data Processing",
    "Design & Creative",
    "Agent Operations",
    "Other",
];

/// Escape HTML special characters to prevent stored XSS.
/// Applied to all user-supplied text fields before database storage.
pub fn sanitize_html(input: &str) -> String {
    input
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
        .replace('\'', "&#x27;")
}
