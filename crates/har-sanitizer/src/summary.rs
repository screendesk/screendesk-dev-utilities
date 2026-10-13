use serde::Serialize;
use serde_json::Value;
use std::collections::HashSet;

/// A quick health check of the captured traffic.
#[derive(Clone, Debug, Default, Serialize)]
pub struct Summary {
    pub requests: usize,
    /// Responses with status 4xx, 5xx, or 0 (blocked, cancelled, or CORS failures).
    pub failed: usize,
    pub status_4xx: usize,
    pub status_5xx: usize,
    pub status_0: usize,
    pub domains: usize,
    /// Bytes transferred, using the most accurate size each entry records.
    pub bytes: u64,
    pub slowest: Option<Slowest>,
}

#[derive(Clone, Debug, Serialize)]
pub struct Slowest {
    /// URL without its query string or fragment, so the summary never shows secrets.
    pub url: String,
    pub method: String,
    pub status: i64,
    pub time_ms: f64,
}

/// Summarize a HAR's requests. Returns `None` if it has no `log.entries` array.
pub fn summarize(har: &Value) -> Option<Summary> {
    let entries = har.pointer("/log/entries")?.as_array()?;
    let mut summary = Summary {
        requests: entries.len(),
        ..Summary::default()
    };
    let mut domains = HashSet::new();
    for entry in entries {
        let url = entry
            .pointer("/request/url")
            .and_then(Value::as_str)
            .unwrap_or_default();
        if let Some(host) = url
            .split("://")
            .nth(1)
            .and_then(|rest| rest.split(['/', '?', '#']).next())
        {
            domains.insert(host.to_ascii_lowercase());
        }
        let status = entry
            .pointer("/response/status")
            .and_then(Value::as_i64)
            .unwrap_or(0);
        match status {
            0 => summary.status_0 += 1,
            400..=499 => summary.status_4xx += 1,
            500..=599 => summary.status_5xx += 1,
            _ => {}
        }
        summary.bytes += size(entry);
        let time = entry.get("time").and_then(Value::as_f64).unwrap_or(0.0);
        if summary
            .slowest
            .as_ref()
            .is_none_or(|slowest| time > slowest.time_ms)
        {
            let method = entry
                .pointer("/request/method")
                .and_then(Value::as_str)
                .unwrap_or_default();
            let bare = url.split(['?', '#']).next().unwrap_or_default();
            summary.slowest = Some(Slowest {
                url: bare.into(),
                method: method.into(),
                status,
                time_ms: time,
            });
        }
    }
    summary.failed = summary.status_0 + summary.status_4xx + summary.status_5xx;
    summary.domains = domains.len();
    Some(summary)
}

fn size(entry: &Value) -> u64 {
    let positive = |pointer: &str| {
        entry
            .pointer(pointer)
            .and_then(Value::as_i64)
            .filter(|n| *n > 0)
    };
    positive("/response/_transferSize")
        .or_else(|| {
            let body = positive("/response/bodySize")?;
            Some(body + positive("/response/headersSize").unwrap_or(0))
        })
        .or_else(|| positive("/response/content/size"))
        .unwrap_or(0) as u64
}
