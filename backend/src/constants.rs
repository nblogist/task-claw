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

/// Normalize a tag: lowercase, trim, spaces→dashes, strip special chars, collapse dashes.
/// " MY New-app!!!!!! " → "my-new-app"
pub fn normalize_tag(input: &str) -> String {
    let s: String = input
        .trim()
        .to_lowercase()
        .chars()
        .map(|c| if c == ' ' { '-' } else { c })
        .filter(|c| c.is_ascii_alphanumeric() || *c == '-')
        .collect();
    // Collapse multiple dashes and strip leading/trailing dashes
    let mut result = String::new();
    let mut prev_dash = true; // treat start as dash to strip leading
    for c in s.chars() {
        if c == '-' {
            if !prev_dash {
                result.push('-');
            }
            prev_dash = true;
        } else {
            result.push(c);
            prev_dash = false;
        }
    }
    result.trim_end_matches('-').to_string()
}
