use serde::Serialize;
use std::collections::{BTreeMap, HashSet};
use std::fmt;

/// The kind of secret that was redacted.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, PartialOrd, Ord, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Kind {
    /// A cookie sent by the browser (`Cookie` header or `request.cookies`).
    Cookie,
    /// A cookie set by the server (`Set-Cookie` header or `response.cookies`).
    SetCookie,
    /// An `Authorization` or `Proxy-Authorization` header.
    Authorization,
    /// Another header with a secret-looking name, such as `X-Api-Key`.
    Header,
    /// A query or fragment parameter, such as `access_token`.
    UrlParam,
    /// Credentials embedded in a URL (`https://user:pass@host`).
    UrlCredentials,
    /// A field in a form-encoded or multipart body.
    FormField,
    /// A field in a JSON body.
    JsonField,
    /// A JSON Web Token found in any text.
    Jwt,
    /// A request or response body removed by `strip_bodies`.
    Body,
}

impl Kind {
    /// A short label for summaries, singular or plural to match `count` ("1 cookie", "3 JWTs").
    pub fn label(self, count: usize) -> &'static str {
        let (one, many) = match self {
            Kind::Cookie => ("cookie", "cookies"),
            Kind::SetCookie => ("Set-Cookie value", "Set-Cookie values"),
            Kind::Authorization => ("authorization header", "authorization headers"),
            Kind::Header => ("secret header", "secret headers"),
            Kind::UrlParam => ("URL parameter", "URL parameters"),
            Kind::UrlCredentials => ("URL credential", "URL credentials"),
            Kind::FormField => ("form field", "form fields"),
            Kind::JsonField => ("JSON field", "JSON fields"),
            Kind::Jwt => ("JWT", "JWTs"),
            Kind::Body => ("body removed", "bodies removed"),
        };
        if count == 1 {
            one
        } else {
            many
        }
    }
}

/// One redacted value. Holds where it was and its name, never the value itself.
#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct Finding {
    /// Index of the entry in `log.entries`.
    pub entry: usize,
    pub kind: Kind,
    /// Where in the entry, e.g. `request.headers`.
    pub location: String,
    /// The header, cookie, parameter, or field name.
    pub name: String,
}

/// Everything that was redacted. The same name in the same entry is reported once, even when the
/// HAR repeats it (a cookie appears in both the `Cookie` header and `request.cookies`).
#[derive(Clone, Debug, Default, Serialize)]
pub struct Report {
    /// Number of entries (requests) in the HAR.
    pub entries: usize,
    pub findings: Vec<Finding>,
    #[serde(skip)]
    seen: HashSet<(usize, Kind, String)>,
}

impl Report {
    pub(crate) fn new(entries: usize) -> Self {
        Self {
            entries,
            ..Self::default()
        }
    }

    pub(crate) fn push(&mut self, entry: usize, kind: Kind, location: &str, name: &str) {
        // JWTs have no name, so count each occurrence.
        if kind != Kind::Jwt && !self.seen.insert((entry, kind, name.to_ascii_lowercase())) {
            return;
        }
        self.findings.push(Finding {
            entry,
            kind,
            location: location.into(),
            name: name.into(),
        });
    }

    /// Number of redacted values.
    pub fn total(&self) -> usize {
        self.findings.len()
    }

    pub fn is_clean(&self) -> bool {
        self.findings.is_empty()
    }

    /// Count of findings per kind.
    pub fn counts(&self) -> BTreeMap<Kind, usize> {
        let mut counts = BTreeMap::new();
        for finding in &self.findings {
            *counts.entry(finding.kind).or_insert(0) += 1;
        }
        counts
    }
}

impl fmt::Display for Report {
    /// One line, e.g. "Redacted 9 values in 42 requests: 4 cookies, 2 authorization headers, 3 JWTs".
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let requests = if self.entries == 1 {
            "request"
        } else {
            "requests"
        };
        if self.is_clean() {
            return write!(f, "No secrets found in {} {requests}", self.entries);
        }
        let parts: Vec<String> = self
            .counts()
            .into_iter()
            .map(|(kind, n)| format!("{n} {}", kind.label(n)))
            .collect();
        let values = if self.total() == 1 { "value" } else { "values" };
        write!(
            f,
            "Redacted {} {values} in {} {requests}: {}",
            self.total(),
            self.entries,
            parts.join(", ")
        )
    }
}
