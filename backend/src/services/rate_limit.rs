use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;

pub struct RateLimitResult {
    pub allowed: bool,
    pub limit: usize,
    pub remaining: usize,
    pub retry_after_secs: Option<u64>,
}

pub struct RateLimiter {
    requests: Mutex<HashMap<String, Vec<Instant>>>,
    max_requests: usize,
    window_secs: u64,
    cleanup_counter: Mutex<u64>,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            window_secs,
            cleanup_counter: Mutex::new(0),
        }
    }

    /// Returns true if the request is allowed, false if rate limited.
    /// Simple boolean check for backward compatibility.
    pub fn check(&self, key: &str) -> bool {
        self.check_with_limit(key, self.max_requests).allowed
    }

    /// Check with a custom limit (e.g. 60 for authenticated, 10 for anonymous).
    /// Returns detailed rate limit info for headers.
    pub fn check_with_limit(&self, key: &str, limit: usize) -> RateLimitResult {
        let mut map = self.requests.lock().unwrap();
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);

        // Periodic cleanup every 500 calls to prevent memory leak
        {
            let mut counter = self.cleanup_counter.lock().unwrap();
            *counter += 1;
            if *counter % 500 == 0 {
                map.retain(|_, entries| {
                    entries.retain(|t| now.duration_since(*t) < window);
                    !entries.is_empty()
                });
            }
        }

        let entries = map.entry(key.to_string()).or_default();

        // Remove expired entries
        entries.retain(|t| now.duration_since(*t) < window);

        if entries.len() >= limit {
            // Calculate retry_after from oldest entry in window
            let retry_after = entries.first().map(|oldest| {
                let elapsed = now.duration_since(*oldest).as_secs();
                self.window_secs.saturating_sub(elapsed)
            }).unwrap_or(self.window_secs);

            RateLimitResult {
                allowed: false,
                limit,
                remaining: 0,
                retry_after_secs: Some(retry_after),
            }
        } else {
            let remaining = limit - entries.len() - 1; // -1 because we're about to add one
            entries.push(now);
            RateLimitResult {
                allowed: true,
                limit,
                remaining,
                retry_after_secs: None,
            }
        }
    }
}
