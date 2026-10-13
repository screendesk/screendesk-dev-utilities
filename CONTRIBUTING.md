# Contributing

Thanks for helping. Issues and pull requests are welcome.

## Reporting a problem

Open an issue with the tool's URL, what you did, what you expected, and your browser and OS. A screen recording helps a lot.

Security issues, especially anything where a tool or `har-sanitizer` leaks data, go through [GitHub security advisories](https://github.com/screendesk/screendesk-dev-utilities/security/advisories/new), not public issues.

## How the code is organized

The tools also run on [screendesk.io/tools](https://screendesk.io/tools). The screendesk.io codebase is the source of truth for the tool code, and `scripts/sync-from-marketing.mjs` copies it here. Pull requests to this repo are reviewed and applied there, then synced back, so your change ships on both.

Files that belong only to this repo, and are never overwritten by the sync:

- `web/src/components/tools/ToolLayout.jsx` (page shell)
- `web/src/pages/index.jsx`, `web/src/pages/webcam-mic-test.jsx`, `_app.jsx`, `_document.jsx`, `404.jsx`
- `web/src/styles/`, `web/public/`
- `crates/`

## Rules for tools

- **Client-side only.** No network requests with user data, no backend, no analytics beyond the optional `trackToolUse` hook (a no-op here).
- **No new runtime dependencies** unless there's no reasonable alternative. Write the parser.
- **Server-render safe.** Don't read `window`, `navigator`, `Date.now()` or `Math.random()` during render; do it in an effect or an event handler.
- **Use the shared controls** in `web/src/components/tools/toolUi.js` (`ui.*`, `Badge`, `CopyButton`) so every tool looks the same.
- **Accurate content.** Reference tables and FAQs must be correct. Cite sources for anything a reader would want to check (for example, the test card numbers link to each provider's docs).

## Checks

```sh
cd web && npm install && npm run build
cd crates/har-sanitizer && cargo fmt --check && cargo clippy --all-targets -- -D warnings && cargo test
```

CI runs both on every pull request.
