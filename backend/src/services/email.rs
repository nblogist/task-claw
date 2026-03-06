use reqwest::Client;
use serde_json::json;

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

        if !res.status().is_success() {
            let body = res.text().await.unwrap_or_default();
            return Err(format!("Resend API error: {}", body));
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
}
