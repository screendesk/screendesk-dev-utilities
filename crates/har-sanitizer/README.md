<p align="center">
  <a href="https://screendesk.io/tools/har-file-analyzer">
    <img src="https://screendesk.io/images/og/tools.png" alt="Screendesk free tools" width="720">
  </a>
</p>

<h1 align="center">har-sanitizer</h1>

<p align="center">
  Remove cookies, tokens, and secrets from HAR files before you share them.<br>
  Fast CLI, Rust library, and WebAssembly build. Runs locally. Nothing is uploaded.
</p>

<p align="center">
  <a href="https://screendesk.io/tools/har-file-analyzer"><strong>Try it in your browser</strong></a> ·
  <a href="#install"><strong>Install</strong></a> ·
  <a href="#use-it-in-ci"><strong>Use it in CI</strong></a> ·
  <a href="https://screendesk.io/tools"><strong>More free tools</strong></a> ·
  <a href="https://screendesk.io"><strong>Screendesk</strong></a>
</p>

---

## Why

Support teams ask customers for HAR files to debug network problems. A HAR file records every request the browser made, **including session cookies, `Authorization` headers, and API keys**. Anyone who gets the file can replay those sessions. In 2023, attackers used session tokens taken from HAR files in a vendor's support system to hijack customer sessions.

`har-sanitizer` replaces those values with `[REDACTED]` and keeps everything you need to debug: URLs, methods, status codes, header and cookie names, timings, and non-sensitive bodies. The result is still a valid HAR that opens in Chrome DevTools or any HAR viewer.

## What it redacts

| Where | What | Example result |
| --- | --- | --- |
| `Cookie` header and `request.cookies` | Every cookie value | `sessionid=[REDACTED]; theme=[REDACTED]` |
| `Set-Cookie` header and `response.cookies` | Values; names and attributes stay | `sid=[REDACTED]; Path=/; HttpOnly` |
| `Authorization`, `Proxy-Authorization` | Credentials; the scheme stays | `Bearer [REDACTED]` |
| Headers like `X-Api-Key`, `X-CSRF-Token`, `X-Amz-Security-Token` | Values | `[REDACTED]` |
| URLs, `queryString`, `Referer`, `Location`, `redirectURL` | Sensitive query and fragment parameters, `user:pass@` | `?api_key=%5BREDACTED%5D` |
| JSON and form-encoded bodies | Fields named like secrets | `{"password":"[REDACTED]"}` |
| Anywhere | Strings shaped like JSON Web Tokens | `[REDACTED]` |
| WebSocket frames (`_webSocketMessages`) | Same rules as bodies | |

Names count as secret when they contain `token`, `secret`, `password`, `session`, `cookie`, `api_key`, `credential`, `signature`, `csrf`, and similar, or are exactly `key`, `code`, `sig`, `sid`, `otp`, `auth`, and a few others. Add your own with `--redact` and exempt names with `--allow`. Base64 (binary) bodies are left alone. Use `--strip-bodies` to drop all bodies.

The report lists **names and locations, never values**, so it's safe to paste into a ticket.

## Install

```sh
cargo install har-sanitizer
```

Or build from source:

```sh
git clone https://github.com/screendesk/screendesk-dev-utilities
cd screendesk-dev-utilities/crates/har-sanitizer
cargo build --release   # target/release/har-sanitizer
```

Don't want to install anything? Use the [HAR File Analyzer](https://screendesk.io/tools/har-file-analyzer). It runs in your browser and downloads a sanitized copy.

## Usage

```sh
# Write capture-sanitized.har next to the input
har-sanitizer sanitize capture.har

# Choose the output, drop all bodies, and list every redaction
har-sanitizer sanitize capture.har -o clean.har --strip-bodies --verbose

# Pipe it
cat capture.har | har-sanitizer sanitize - > clean.har

# Check a file without changing it (exits 1 if it finds secrets)
har-sanitizer scan capture.har

# Requests, failures, transfer size, slowest request
har-sanitizer summary capture.har
```

```text
$ har-sanitizer scan capture.har
Found 14 values in 4 requests: 2 cookies, 2 Set-Cookie values, 1 authorization header, 1 secret header, 3 URL parameters, 1 URL credential, 1 form field, 3 JSON fields
  entry    0  request.headers          Cookie           sessionid
  entry    0  request.postData.text    JsonField        password
  entry    1  request.headers          Authorization    Authorization
  ...
```

| Option | Applies to | Effect |
| --- | --- | --- |
| `-o, --output <PATH>` | sanitize | Output path, `-` for stdout |
| `--report <PATH>` | sanitize | Write the JSON report (`-` for stderr) |
| `--strip-bodies` | sanitize, scan | Remove request and response bodies |
| `--no-body-scan` | sanitize, scan | Don't look inside JSON and form bodies |
| `--keep-jwts` | sanitize, scan | Don't replace JWT-shaped strings |
| `--redact <NAME>` | sanitize, scan | Also treat this name as secret (repeatable) |
| `--allow <NAME>` | sanitize, scan | Never redact this name (repeatable) |
| `--placeholder <TEXT>` | sanitize, scan | Replacement text, default `[REDACTED]` |
| `--json` | scan, summary | Machine-readable output |
| `--exit-zero` | scan | Exit 0 even when secrets are found |

## Use it in CI

Stop HAR fixtures with live credentials from reaching your repository:

```yaml
- run: cargo install har-sanitizer
- run: find . -name '*.har' -print0 | xargs -0 -n1 har-sanitizer scan
```

## Library

```rust
use har_sanitizer::{sanitize_str, Options};

let (clean, report) = sanitize_str(&std::fs::read_to_string("capture.har")?, &Options::default())?;
println!("{report}"); // Redacted 14 values in 4 requests: …
std::fs::write("clean.har", clean)?;
```

`sanitize` works on a `serde_json::Value` in place, `scan` reports without changing anything, and `summarize` returns request statistics. Docs: [docs.rs/har-sanitizer](https://docs.rs/har-sanitizer).

## WebAssembly

```sh
wasm-pack build --target web --scope screendesk --release -- --no-default-features --features wasm
```

```js
import init, { sanitize } from '@screendesk/har-sanitizer'

await init()
const { har, report, summary } = JSON.parse(sanitize(harText, JSON.stringify({ stripBodies: false })))
```

Options use camelCase: `placeholder`, `stripBodies`, `scanBodies`, `redactJwts`, `redactNames`, `allowNames`.

## Free tools by Screendesk

`har-sanitizer` lives in [screendesk-dev-utilities](https://github.com/screendesk/screendesk-dev-utilities), next to 48 free, client-side tools for developers, QA, and support teams at **[screendesk.io/tools](https://screendesk.io/tools)**: a [HAR File Analyzer](https://screendesk.io/tools/har-file-analyzer), [JSON Formatter](https://screendesk.io/tools/json-formatter), [JWT Decoder](https://screendesk.io/tools/jwt-decoder), [curl Converter](https://screendesk.io/tools/curl-converter), [Test Credit Card Numbers](https://screendesk.io/tools/test-credit-card-numbers), [What Is My Browser](https://screendesk.io/tools/browser-info), device tests, and more. No sign-up, no ads, and your data stays in your browser.

## Stop asking customers for HAR files

[Screendesk](https://screendesk.io) lets customers record their screen in one click from your helpdesk. Console logs, network requests, and device details come attached automatically, and you choose which on-screen fields get blurred, so nobody has to export a HAR file again.

## Contributing

Issues and pull requests are welcome, especially new secret patterns with a test case. Run `cargo fmt`, `cargo clippy --all-targets`, and `cargo test` before opening a PR. Please report security problems privately through [GitHub security advisories](https://github.com/screendesk/screendesk-dev-utilities/security/advisories/new) rather than in a public issue.

## License

Licensed under either of [Apache License, Version 2.0](LICENSE-APACHE) or [MIT license](LICENSE-MIT) at your option.
