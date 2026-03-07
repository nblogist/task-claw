use reqwest::Client;
use serde_json::json;
use std::sync::Mutex;
use std::time::Instant;

static LAST_SEND: Mutex<Option<Instant>> = Mutex::new(None);

pub struct EmailService {
    client: Client,
    api_key: String,
    from_email: String,
}

impl EmailService {
    pub fn new() -> Option<Self> {
        let api_key = std::env::var("RESEND_API_KEY").ok()?;
        if api_key.is_empty() {
            return None;
        }
        let from_email = std::env::var("FROM_EMAIL")
            .unwrap_or_else(|_| "noreply@taskclaw.com".to_string());
        Some(Self {
            client: Client::new(),
            api_key,
            from_email,
        })
    }

    pub async fn send(&self, to: &str, subject: &str, html: &str) -> Result<(), String> {
        // Rate limit: max 2 emails/sec (Resend free tier limit)
        let wait_duration = {
            let mut last = LAST_SEND.lock().unwrap_or_else(|e| e.into_inner());
            if let Some(prev) = *last {
                let elapsed = prev.elapsed();
                if elapsed < std::time::Duration::from_millis(550) {
                    Some(std::time::Duration::from_millis(550) - elapsed)
                } else {
                    *last = Some(Instant::now());
                    None
                }
            } else {
                *last = Some(Instant::now());
                None
            }
        };
        if let Some(wait) = wait_duration {
            tokio::time::sleep(wait).await;
            let mut last = LAST_SEND.lock().unwrap_or_else(|e| e.into_inner());
            *last = Some(Instant::now());
        }

        let res = self.client
            .post("https://api.resend.com/emails")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(&json!({
                "from": self.from_email,
                "to": [to],
                "subject": subject,
                "html": html,
            }))
            .send()
            .await
            .map_err(|e| format!("Failed to send email: {}", e))?;

        let status = res.status();
        let body = res.text().await.unwrap_or_default();
        if !status.is_success() {
            return Err(format!("Resend API error ({}): {}", status, body));
        }
        if !body.contains("\"id\"") {
            eprintln!("[EMAIL WARNING] Resend returned {} but no id in response: {}", status, body);
        }
        Ok(())
    }

    pub async fn send_password_reset(&self, to: &str, reset_token: &str, frontend_url: &str) -> Result<(), String> {
        let reset_link = format!("{}/reset-password?token={}", frontend_url, reset_token);
        let html = format!(
            r#"<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested a password reset for your TaskClaw account.</p>
            <p><a href="{}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a></p>
            <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
            </div>"#,
            reset_link
        );
        self.send(to, "Reset your TaskClaw password", &html).await
    }

    pub async fn send_verification(&self, to: &str, verify_token: &str, frontend_url: &str) -> Result<(), String> {
        let verify_link = format!("{}/verify-email?token={}", frontend_url, verify_token);
        let html = format!(
            r#"<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #333;">Verify Your Email</h2>
            <p>Welcome to TaskClaw! Please verify your email address.</p>
            <p><a href="{}" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a></p>
            <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
            </div>"#,
            verify_link
        );
        self.send(to, "Verify your TaskClaw email", &html).await
    }

    pub async fn send_notification(&self, to: &str, kind: &str, message: &str, task_title: Option<&str>) -> Result<(), String> {
        let (subject, body_text) = match kind {
            "bid_received" => (
                format!("New bid on your task{}", task_title.map(|t| format!(" \"{}\"", t)).unwrap_or_default()),
                format!("<p>{}</p><p>Log in to TaskClaw to review the bid and respond.</p>", message),
            ),
            "bid_accepted" => (
                "Your bid was accepted!".to_string(),
                format!("<p>{}</p><p>Escrow has been created. You can now start working on the task.</p>", message),
            ),
            "bid_rejected" => (
                format!("Bid update{}", task_title.map(|t| format!(" for \"{}\"", t)).unwrap_or_default()),
                format!("<p>{}</p><p>The buyer chose a different bid. You can continue bidding on other tasks.</p>", message),
            ),
            "delivery_submitted" => (
                "Delivery received — please review".to_string(),
                format!("<p>{}</p><p>Log in to TaskClaw to review the delivery and approve or request revisions.</p>", message),
            ),
            "delivery_approved" => (
                "Payment released!".to_string(),
                format!("<p>{}</p><p>The buyer approved your delivery and payment has been released from escrow.</p>", message),
            ),
            "revision_requested" => (
                format!("Revision requested{}", task_title.map(|t| format!(" for \"{}\"", t)).unwrap_or_default()),
                format!("<p>{}</p><p>The buyer has requested changes to your delivery. Please review and submit a revised delivery.</p>", message),
            ),
            "dispute_raised" => (
                "Dispute filed on your task".to_string(),
                format!("<p>{}</p><p>A dispute has been raised. An admin will review and resolve it.</p>", message),
            ),
            "dispute_resolved" => (
                "Dispute resolved".to_string(),
                format!("<p>{}</p><p>The dispute has been resolved by an admin. Check your dashboard for details.</p>", message),
            ),
            "rating_received" => (
                "You received a new rating".to_string(),
                format!("<p>{}</p><p>Check your profile to see the rating.</p>", message),
            ),
            "new_message" => (
                format!("New message{}", task_title.map(|t| format!(" on \"{}\"", t)).unwrap_or_default()),
                format!("<p>{}</p><p>Log in to TaskClaw to view and reply to the message.</p>", message),
            ),
            "auto_approve_warning" => (
                format!("Action needed: delivery auto-approves in 24 hours{}", task_title.map(|t| format!(" for \"{}\"", t)).unwrap_or_default()),
                format!("<p>{}</p><p><strong>If you don't approve, request a revision, or raise a dispute within 24 hours, the delivery will be automatically approved and payment released.</strong></p>", message),
            ),
            _ => return Ok(()), // Don't email for other notification types
        };

        let frontend_url = std::env::var("FRONTEND_URL").unwrap_or_else(|_| "http://localhost:5173".to_string());
        let html = format!(
            r#"<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #333;">TaskClaw Notification</h2>
            {}
            <p><a href="{}/dashboard" style="display: inline-block; padding: 12px 24px; background: #3B82F6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Go to Dashboard</a></p>
            <p style="color: #999; font-size: 12px;">You're receiving this because you have an active task on TaskClaw.</p>
            </div>"#,
            body_text, frontend_url
        );

        self.send(to, &subject, &html).await
    }
}
