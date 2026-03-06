use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Instant;

pub struct RateLimiter {
    requests: Mutex<HashMap<String, Vec<Instant>>>,
    max_requests: usize,
    window_secs: u64,
}

impl RateLimiter {
    pub fn new(max_requests: usize, window_secs: u64) -> Self {
        Self {
            requests: Mutex::new(HashMap::new()),
            max_requests,
            window_secs,
        }
    }

    /// Returns true if the request is allowed, false if rate limited
    pub fn check(&self, key: &str) -> bool {
        let mut map = self.requests.lock().unwrap();
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);

        // Periodic cleanup: purge empty entries every 100 calls to prevent memory leak
        if map.len() > 1000 {
            map.retain(|_, entries| {
                entries.retain(|t| now.duration_since(*t) < window);
                !entries.is_empty()
            });
        }

        let entries = map.entry(key.to_string()).or_default();

        // Remove expired entries
        entries.retain(|t| now.duration_since(*t) < window);

        if entries.len() >= self.max_requests {
            false
        } else {
            entries.push(now);
            true
        }
    }
}
