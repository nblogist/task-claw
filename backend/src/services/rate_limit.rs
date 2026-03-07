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

    pub fn check(&self, key: &str) -> bool {
        self.check_with_limit(key, self.max_requests).allowed
    }

    pub fn check_with_limit(&self, key: &str, limit: usize) -> RateLimitResult {
        let now = Instant::now();
        let window = std::time::Duration::from_secs(self.window_secs);
        let mut requests = self.requests.lock().unwrap_or_else(|e| e.into_inner());
        {
            let mut counter = self.cleanup_counter.lock().unwrap_or_else(|e| e.into_inner());
            *counter += 1;
            if *counter % 100 == 0 {
                requests.retain(|_, timestamps| {
                    timestamps.retain(|t| now.duration_since(*t) < window);
                    !timestamps.is_empty()
                });
            }
        }
        let timestamps = requests.entry(key.to_string()).or_insert_with(Vec::new);
        timestamps.retain(|t| now.duration_since(*t) < window);
        if timestamps.len() >= limit {
            let oldest = timestamps[0];
            let retry_after = window.as_secs().saturating_sub(now.duration_since(oldest).as_secs());
            RateLimitResult { allowed: false, limit, remaining: 0, retry_after_secs: Some(retry_after.max(1)) }
        } else {
            timestamps.push(now);
            RateLimitResult { allowed: true, limit, remaining: limit - timestamps.len(), retry_after_secs: None }
        }
    }
}
