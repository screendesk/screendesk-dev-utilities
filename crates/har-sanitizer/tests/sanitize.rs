use har_sanitizer::{sanitize, sanitize_str, scan, summarize, Kind, Options};
use serde_json::Value;

const SAMPLE: &str = include_str!("fixtures/sample.har");

const SECRETS: &[&str] = &[
    "s3cr3t-session",
    "csrf-abc",
    "hunter2",
    "new-session-value",
    "rt-999",
    "key-live-123",
    "frag-token",
    "pa55",
    "cs-777",
    "oauth-code-1",
    "c2lnbmF0dXJlLXZhbHVl",
    "eyJzdWIi",
];

fn sample() -> Value {
    serde_json::from_str(SAMPLE).unwrap()
}

#[test]
fn removes_every_secret() {
    let (clean, report) = sanitize_str(SAMPLE, &Options::default()).unwrap();
    for secret in SECRETS {
        assert!(!clean.contains(secret), "{secret} survived sanitizing");
    }
    assert!(report.total() > 0);
    // Still a valid HAR with the same number of entries.
    let har: Value = serde_json::from_str(&clean).unwrap();
    assert_eq!(har["log"]["entries"].as_array().unwrap().len(), 4);
}

#[test]
fn keeps_what_is_needed_to_debug() {
    let mut har = sample();
    sanitize(&mut har, &Options::default()).unwrap();
    let first = &har["log"]["entries"][0];
    assert_eq!(
        first["request"]["headers"][1]["value"],
        "sessionid=[REDACTED]; theme=[REDACTED]"
    );
    assert_eq!(
        first["response"]["headers"][0]["value"],
        "sessionid=[REDACTED]; Path=/; HttpOnly; SameSite=Lax\nprefs=[REDACTED]; Path=/"
    );
    let body: Value =
        serde_json::from_str(first["request"]["postData"]["text"].as_str().unwrap()).unwrap();
    assert_eq!(body["email"], "ana@example.com");
    assert_eq!(body["password"], "[REDACTED]");
    assert_eq!(body["remember"], true);

    let second = &har["log"]["entries"][1];
    assert_eq!(
        second["request"]["headers"][0]["value"],
        "Bearer [REDACTED]"
    );
    assert_eq!(
        second["request"]["url"],
        "https://api.example.com/v1/orders?page=2&api_key=%5BREDACTED%5D&limit=20"
    );
    assert_eq!(second["request"]["queryString"][0]["value"], "2");
    assert_eq!(second["response"]["status"], 500);
    assert!(second["response"]["content"]["text"]
        .as_str()
        .unwrap()
        .contains("upstream timeout"));

    let third = &har["log"]["entries"][2];
    assert_eq!(
        third["request"]["postData"]["text"],
        "username=bob&client_secret=%5BREDACTED%5D&note=hello+world"
    );
    assert_eq!(
        third["request"]["url"],
        "https://%5BREDACTED%5D@legacy.example.com/form"
    );
    // Binary bodies are untouched.
    assert_eq!(
        har["log"]["entries"][3]["response"]["content"]["text"],
        "iVBORw0KGgo="
    );
}

#[test]
fn reports_names_not_values() {
    let report = scan(&sample(), &Options::default()).unwrap();
    let json = serde_json::to_string(&report).unwrap();
    for secret in SECRETS {
        assert!(!json.contains(secret), "report leaked {secret}");
    }
    let counts = report.counts();
    assert_eq!(counts[&Kind::Authorization], 1);
    assert_eq!(counts[&Kind::UrlCredentials], 1);
    // sessionid appears in the Cookie header and request.cookies, but is reported once.
    let session_cookies = report
        .findings
        .iter()
        .filter(|f| f.kind == Kind::Cookie && f.name == "sessionid")
        .count();
    assert_eq!(session_cookies, 1);
}

#[test]
fn scan_does_not_modify() {
    let har = sample();
    scan(&har, &Options::default()).unwrap();
    assert_eq!(har, sample());
}

#[test]
fn sanitizing_twice_finds_nothing_new_to_leak() {
    let (once, _) = sanitize_str(SAMPLE, &Options::default()).unwrap();
    let (twice, _) = sanitize_str(&once, &Options::default()).unwrap();
    assert_eq!(once, twice);
}

#[test]
fn sanitized_output_scans_clean() {
    let (clean, _) = sanitize_str(SAMPLE, &Options::default()).unwrap();
    let report = scan(&serde_json::from_str(&clean).unwrap(), &Options::default()).unwrap();
    assert!(report.is_clean(), "re-scan found: {:?}", report.findings);
}

#[test]
fn strip_bodies_removes_bodies() {
    let options = Options {
        strip_bodies: true,
        ..Options::default()
    };
    let (clean, report) = sanitize_str(SAMPLE, &options).unwrap();
    assert!(!clean.contains("upstream timeout"));
    assert!(report.counts()[&Kind::Body] >= 3);
}

#[test]
fn allow_and_extra_names() {
    let options = Options {
        allow_names: vec!["code".into()],
        redact_names: vec!["username".into()],
        ..Options::default()
    };
    let (clean, _) = sanitize_str(SAMPLE, &options).unwrap();
    assert!(clean.contains("oauth-code-1"));
    assert!(clean.contains("username=%5BREDACTED%5D"));
}

#[test]
fn rejects_non_har() {
    assert!(sanitize_str(r#"{"hello":"world"}"#, &Options::default()).is_err());
    assert!(sanitize_str("not json", &Options::default()).is_err());
}

#[test]
fn summary_counts_failures() {
    let summary = summarize(&sample()).unwrap();
    assert_eq!(summary.requests, 4);
    assert_eq!(summary.status_5xx, 1);
    assert_eq!(summary.status_0, 1);
    assert_eq!(summary.failed, 2);
    assert_eq!(summary.domains, 4);
    let slowest = summary.slowest.unwrap();
    assert_eq!(slowest.time_ms, 2400.0);
    assert_eq!(slowest.url, "https://api.example.com/v1/orders");
}
