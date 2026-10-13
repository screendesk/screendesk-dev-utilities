//! WebAssembly bindings. Build with `wasm-pack build --target web --no-default-features --features wasm`.

use crate::{sanitize, scan, summarize, Options};
use serde_json::{json, Value};
use wasm_bindgen::prelude::*;

fn parse(har: &str, options: &str) -> Result<(Value, Options), JsError> {
    let har: Value =
        serde_json::from_str(har).map_err(|e| JsError::new(&format!("not valid JSON: {e}")))?;
    let options = if options.trim().is_empty() {
        Options::default()
    } else {
        serde_json::from_str(options).map_err(|e| JsError::new(&format!("invalid options: {e}")))?
    };
    Ok((har, options))
}

/// Sanitize a HAR. `options` is a JSON string (camelCase fields of `Options`) or empty for defaults.
/// Returns a JSON string: `{ "har": <sanitized HAR>, "report": { entries, findings, summary } }`.
#[wasm_bindgen(js_name = sanitize)]
pub fn sanitize_js(har: &str, options: &str) -> Result<String, JsError> {
    let (mut har, options) = parse(har, options)?;
    let report = sanitize(&mut har, &options).map_err(|e| JsError::new(&e.to_string()))?;
    let output = json!({ "har": har, "report": report, "summary": report.to_string() });
    Ok(output.to_string())
}

/// Report what would be redacted, without returning the HAR. Returns a JSON string.
#[wasm_bindgen(js_name = scan)]
pub fn scan_js(har: &str, options: &str) -> Result<String, JsError> {
    let (har, options) = parse(har, options)?;
    let report = scan(&har, &options).map_err(|e| JsError::new(&e.to_string()))?;
    Ok(json!({ "report": report, "summary": report.to_string() }).to_string())
}

/// Request counts, failures, bytes, and the slowest request. Returns a JSON string.
#[wasm_bindgen(js_name = summarize)]
pub fn summarize_js(har: &str) -> Result<String, JsError> {
    let (har, _) = parse(har, "")?;
    let summary =
        summarize(&har).ok_or_else(|| JsError::new("not a HAR file: missing log.entries array"))?;
    Ok(serde_json::to_string(&summary)?)
}
