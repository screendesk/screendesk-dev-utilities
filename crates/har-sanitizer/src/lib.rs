//! Redact cookies, tokens, and other secrets from HAR (HTTP Archive) files.
//!
//! HAR files exported from browser DevTools contain every header, cookie, query string, and body of
//! the captured requests, including session cookies and bearer tokens. Anyone holding the file can
//! replay those sessions. This crate removes the secret values and keeps everything needed to debug:
//! URLs, header and cookie names, status codes, timings, and non-sensitive bodies.
//!
//! ```
//! use har_sanitizer::{sanitize_str, Options};
//!
//! let har = r#"{"log":{"version":"1.2","entries":[{"request":{"method":"GET",
//!   "url":"https://api.example.com/me?access_token=abc123","headers":[
//!   {"name":"Authorization","value":"Bearer abc123"}]},"response":{"status":200}}]}}"#;
//! let (clean, report) = sanitize_str(har, &Options::default()).unwrap();
//! assert!(!clean.contains("abc123"));
//! assert_eq!(report.total(), 2);
//! ```
//!
//! Built by [Screendesk](https://screendesk.io). Try it in the browser:
//! <https://screendesk.io/tools/har-file-analyzer>

mod names;
mod report;
mod summary;
mod url;
#[cfg(feature = "wasm")]
mod wasm;

use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fmt;
use std::sync::OnceLock;

pub use report::{Finding, Kind, Report};
pub use summary::{summarize, Slowest, Summary};

/// What to redact and how.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct Options {
    /// Text that replaces each secret value.
    pub placeholder: String,
    /// Remove request and response bodies entirely.
    pub strip_bodies: bool,
    /// Look inside JSON and form-encoded bodies for sensitive fields.
    pub scan_bodies: bool,
    /// Replace anything shaped like a JSON Web Token, wherever it appears.
    pub redact_jwts: bool,
    /// Extra header, cookie, parameter, or JSON field names to treat as secret (case-insensitive).
    pub redact_names: Vec<String>,
    /// Names to never redact, even if they look sensitive (case-insensitive).
    pub allow_names: Vec<String>,
}

impl Default for Options {
    fn default() -> Self {
        Self {
            placeholder: "[REDACTED]".into(),
            strip_bodies: false,
            scan_bodies: true,
            redact_jwts: true,
            redact_names: Vec::new(),
            allow_names: Vec::new(),
        }
    }
}

/// Why a HAR could not be processed.
#[derive(Debug)]
pub enum Error {
    /// The input is not valid JSON.
    Json(serde_json::Error),
    /// The input is JSON but not a HAR (no `log.entries` array).
    NotHar,
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::Json(error) => write!(f, "not valid JSON: {error}"),
            Error::NotHar => write!(f, "not a HAR file: missing log.entries array"),
        }
    }
}

impl std::error::Error for Error {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            Error::Json(error) => Some(error),
            Error::NotHar => None,
        }
    }
}

impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Error::Json(error)
    }
}

/// Parse a HAR string, sanitize it, and return it pretty-printed with the report.
pub fn sanitize_str(input: &str, options: &Options) -> Result<(String, Report), Error> {
    let mut har: Value = serde_json::from_str(input)?;
    let report = sanitize(&mut har, options)?;
    Ok((serde_json::to_string_pretty(&har)?, report))
}

/// Report what [`sanitize`] would redact, without changing anything.
pub fn scan(har: &Value, options: &Options) -> Result<Report, Error> {
    sanitize(&mut har.clone(), options)
}

/// Redact secrets in place and report what was removed. The report never contains secret values.
pub fn sanitize(har: &mut Value, options: &Options) -> Result<Report, Error> {
    let entries = har
        .pointer_mut("/log/entries")
        .and_then(Value::as_array_mut)
        .ok_or(Error::NotHar)?;
    let mut ctx = Context {
        options,
        names: names::Matcher::new(options),
        report: Report::new(entries.len()),
    };
    for (index, entry) in entries.iter_mut().enumerate() {
        ctx.entry(index, entry);
    }
    Ok(ctx.report)
}

struct Context<'a> {
    options: &'a Options,
    names: names::Matcher,
    report: Report,
}

impl Context<'_> {
    fn entry(&mut self, index: usize, entry: &mut Value) {
        if let Some(request) = entry.get_mut("request") {
            self.url_field(index, request, "url", "request.url");
            self.headers(index, request, "request.headers");
            self.cookies(index, request, Kind::Cookie, "request.cookies");
            self.query_string(index, request);
            if let Some(post) = request.get_mut("postData") {
                self.post_data(index, post);
            }
        }
        if let Some(response) = entry.get_mut("response") {
            self.url_field(index, response, "redirectURL", "response.redirectURL");
            self.headers(index, response, "response.headers");
            self.cookies(index, response, Kind::SetCookie, "response.cookies");
            if let Some(content) = response.get_mut("content") {
                self.response_content(index, content);
            }
        }
        // Chrome stores WebSocket frames here; they often carry auth messages.
        if let Some(messages) = entry
            .get_mut("_webSocketMessages")
            .and_then(Value::as_array_mut)
        {
            for message in messages {
                if let Some(Value::String(data)) = message.get_mut("data") {
                    self.text_body(index, data, "", "websocket.data");
                }
            }
        }
    }

    fn redacted(&self) -> Value {
        Value::String(self.options.placeholder.clone())
    }

    fn url_field(&mut self, index: usize, object: &mut Value, field: &str, location: &str) {
        if let Some(Value::String(value)) = object.get_mut(field) {
            let (clean, found) = url::sanitize(value, &self.names, &self.options.placeholder);
            for (kind, name) in found {
                self.report.push(index, kind, location, &name);
            }
            *value = self.jwts(index, &clean, location);
        }
    }

    fn headers(&mut self, index: usize, object: &mut Value, location: &str) {
        let Some(headers) = object.get_mut("headers").and_then(Value::as_array_mut) else {
            return;
        };
        let placeholder = self.options.placeholder.clone();
        for header in headers {
            let name = header
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned();
            let lower = name.to_ascii_lowercase();
            let Some(Value::String(value)) = header.get_mut("value") else {
                continue;
            };
            if value.is_empty() || self.names.allowed(&lower) {
                continue;
            }
            match lower.as_str() {
                "cookie" => {
                    let mut parts = Vec::new();
                    for pair in value.split(';') {
                        let pair = pair.trim();
                        if pair.is_empty() {
                            continue;
                        }
                        let (cookie_name, cookie_value) =
                            pair.split_once('=').unwrap_or((pair, ""));
                        if cookie_value != placeholder {
                            self.report.push(index, Kind::Cookie, location, cookie_name);
                        }
                        parts.push(format!("{cookie_name}={placeholder}"));
                    }
                    *value = parts.join("; ");
                }
                "set-cookie" => {
                    // Keep the cookie name and its attributes (Path, SameSite, HttpOnly…), drop the value.
                    // Chrome joins several Set-Cookie headers with newlines.
                    let lines: Vec<String> = value
                        .split('\n')
                        .map(|line| {
                            let (pair, attributes) = line
                                .split_once(';')
                                .map_or((line, None), |(p, a)| (p, Some(a)));
                            let (cookie_name, cookie_value) =
                                pair.split_once('=').unwrap_or((pair, ""));
                            let cookie_name = cookie_name.trim().to_owned();
                            if cookie_value.trim() != placeholder {
                                self.report
                                    .push(index, Kind::SetCookie, location, &cookie_name);
                            }
                            match attributes {
                                Some(attributes) => {
                                    format!("{cookie_name}={placeholder};{attributes}")
                                }
                                None => format!("{cookie_name}={placeholder}"),
                            }
                        })
                        .collect();
                    *value = lines.join("\n");
                }
                "authorization" | "proxy-authorization" => {
                    if !value.ends_with(placeholder.as_str()) {
                        self.report
                            .push(index, Kind::Authorization, location, &name);
                    }
                    // Keep the scheme ("Bearer", "Basic") so the reader knows what kind of auth was sent.
                    *value = match value.split_once(' ') {
                        Some((scheme, _))
                            if scheme
                                .chars()
                                .all(|c| c.is_ascii_alphanumeric() || c == '-') =>
                        {
                            format!("{scheme} {placeholder}")
                        }
                        _ => placeholder.clone(),
                    };
                }
                "referer" | "location" | "content-location" => {
                    let (clean, found) = url::sanitize(value, &self.names, &placeholder);
                    for (kind, param) in found {
                        self.report.push(index, kind, location, &param);
                    }
                    *value = clean;
                }
                _ if self.names.sensitive(&lower) => {
                    if *value != placeholder {
                        self.report.push(index, Kind::Header, location, &name);
                    }
                    *value = placeholder.clone();
                }
                _ => {
                    let clean = self.jwts(index, value, location);
                    *value = clean;
                }
            }
        }
    }

    fn cookies(&mut self, index: usize, object: &mut Value, kind: Kind, location: &str) {
        let Some(cookies) = object.get_mut("cookies").and_then(Value::as_array_mut) else {
            return;
        };
        let redacted = self.redacted();
        for cookie in cookies {
            let name = cookie
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned();
            if self.names.allowed(&name.to_ascii_lowercase()) {
                continue;
            }
            if let Some(value) = cookie.get_mut("value") {
                if value
                    .as_str()
                    .is_some_and(|v| !v.is_empty() && v != self.options.placeholder)
                {
                    self.report.push(index, kind, location, &name);
                    *value = redacted.clone();
                }
            }
        }
    }

    fn query_string(&mut self, index: usize, request: &mut Value) {
        let Some(params) = request.get_mut("queryString").and_then(Value::as_array_mut) else {
            return;
        };
        let redacted = self.redacted();
        for param in params {
            let name = param
                .get("name")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_owned();
            if self.names.sensitive(&name.to_ascii_lowercase()) {
                if param.get("value") != Some(&redacted) {
                    self.report
                        .push(index, Kind::UrlParam, "request.queryString", &name);
                }
                param["value"] = redacted.clone();
            } else if let Some(Value::String(value)) = param.get_mut("value") {
                let clean = self.jwts(index, value, "request.queryString");
                *value = clean;
            }
        }
    }

    fn post_data(&mut self, index: usize, post: &mut Value) {
        if self.options.strip_bodies {
            let had_body = post
                .get("text")
                .and_then(Value::as_str)
                .is_some_and(|t| !t.is_empty())
                || post
                    .get("params")
                    .and_then(Value::as_array)
                    .is_some_and(|p| !p.is_empty());
            if had_body {
                self.report
                    .push(index, Kind::Body, "request.postData", "request body");
            }
            if let Some(object) = post.as_object_mut() {
                object.insert("text".into(), Value::String(String::new()));
                object.remove("params");
            }
            return;
        }
        let redacted = self.redacted();
        if let Some(params) = post.get_mut("params").and_then(Value::as_array_mut) {
            for param in params {
                let name = param
                    .get("name")
                    .and_then(Value::as_str)
                    .unwrap_or_default()
                    .to_owned();
                if self.names.sensitive(&name.to_ascii_lowercase())
                    && param.get("value").is_some_and(|v| *v != redacted)
                {
                    self.report
                        .push(index, Kind::FormField, "request.postData.params", &name);
                    param["value"] = redacted.clone();
                }
            }
        }
        let mime = post
            .get("mimeType")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_ascii_lowercase();
        if let Some(Value::String(text)) = post.get_mut("text") {
            self.text_body(index, text, &mime, "request.postData.text");
        }
    }

    fn response_content(&mut self, index: usize, content: &mut Value) {
        if self.options.strip_bodies {
            if content
                .get("text")
                .and_then(Value::as_str)
                .is_some_and(|t| !t.is_empty())
            {
                self.report
                    .push(index, Kind::Body, "response.content", "response body");
            }
            if let Some(object) = content.as_object_mut() {
                object.remove("text");
                object.remove("encoding");
            }
            return;
        }
        // Base64 bodies are binary (images, fonts, compressed data); leave them alone.
        if content.get("encoding").and_then(Value::as_str) == Some("base64") {
            return;
        }
        let mime = content
            .get("mimeType")
            .and_then(Value::as_str)
            .unwrap_or_default()
            .to_ascii_lowercase();
        if let Some(Value::String(text)) = content.get_mut("text") {
            self.text_body(index, text, &mime, "response.content.text");
        }
    }

    /// Redact sensitive fields in a JSON or form-encoded body, then any JWTs left in it.
    fn text_body(&mut self, index: usize, text: &mut String, mime: &str, location: &str) {
        if text.is_empty() {
            return;
        }
        if self.options.scan_bodies {
            let trimmed = text.trim_start();
            let looks_json = trimmed.starts_with('{') || trimmed.starts_with('[');
            if mime.contains("json") || (mime.is_empty() && looks_json) {
                if let Ok(mut json) = serde_json::from_str::<Value>(text) {
                    let before = self.report.total();
                    self.json(index, &mut json, location);
                    if self.report.total() != before {
                        *text = serde_json::to_string(&json).unwrap_or_default();
                    }
                    return;
                }
            } else if mime.contains("x-www-form-urlencoded") {
                let (clean, found) =
                    url::sanitize_pairs(text, &self.names, &self.options.placeholder);
                for name in found {
                    self.report.push(index, Kind::FormField, location, &name);
                }
                *text = clean;
            }
        }
        let clean = self.jwts(index, text, location);
        *text = clean;
    }

    fn json(&mut self, index: usize, value: &mut Value, location: &str) {
        match value {
            Value::Object(object) => {
                for (key, field) in object.iter_mut() {
                    let sensitive = self.names.sensitive(&key.to_ascii_lowercase());
                    if sensitive
                        && !field.is_null()
                        && field.as_str() != Some(self.options.placeholder.as_str())
                    {
                        self.report.push(index, Kind::JsonField, location, key);
                        *field = Value::String(self.options.placeholder.clone());
                    } else if !sensitive {
                        self.json(index, field, location);
                    }
                }
            }
            Value::Array(items) => {
                for item in items {
                    self.json(index, item, location);
                }
            }
            Value::String(text) => {
                let clean = self.jwts(index, text, location);
                *text = clean;
            }
            _ => {}
        }
    }

    fn jwts(&mut self, index: usize, text: &str, location: &str) -> String {
        if !self.options.redact_jwts || !text.contains("eyJ") {
            return text.to_owned();
        }
        let mut found = 0;
        let clean = jwt_pattern().replace_all(text, |_: &regex::Captures| {
            found += 1;
            self.options.placeholder.clone()
        });
        for _ in 0..found {
            self.report.push(index, Kind::Jwt, location, "JWT");
        }
        clean.into_owned()
    }
}

fn jwt_pattern() -> &'static Regex {
    static PATTERN: OnceLock<Regex> = OnceLock::new();
    // header.payload.signature, where header and payload are base64url JSON objects ("eyJ" = `{"`).
    PATTERN.get_or_init(|| {
        Regex::new(r"eyJ[A-Za-z0-9_-]{5,}\.eyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]*").unwrap()
    })
}
