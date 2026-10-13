use crate::Options;

/// Names that are secret when they appear anywhere in a header, cookie, parameter, or field name.
const CONTAINS: &[&str] = &[
    "token",
    "secret",
    "passw",
    "apikey",
    "api_key",
    "api-key",
    "access_key",
    "accesskey",
    "session",
    "cookie",
    "credential",
    "signature",
    "private_key",
    "privatekey",
    "authorization",
    "bearer",
    "csrf",
    "xsrf",
    "card_number",
    "cardnumber",
    "credit_card",
    "creditcard",
];

/// Short names that are secret only as the whole name ("key" but not "monkey").
const EXACT: &[&str] = &[
    "key",
    "code",
    "sig",
    "sid",
    "pin",
    "otp",
    "auth",
    "pass",
    "pwd",
    "jwt",
    "cvv",
    "cvc",
    "ssn",
    "client_assertion",
];

/// Decides which names hold secrets, honoring the caller's extra and allowed names.
pub(crate) struct Matcher {
    extra: Vec<String>,
    allow: Vec<String>,
}

impl Matcher {
    pub(crate) fn new(options: &Options) -> Self {
        let lower = |names: &[String]| {
            names
                .iter()
                .map(|n| n.trim().to_ascii_lowercase())
                .collect()
        };
        Self {
            extra: lower(&options.redact_names),
            allow: lower(&options.allow_names),
        }
    }

    pub(crate) fn allowed(&self, lower: &str) -> bool {
        self.allow.iter().any(|name| name == lower)
    }

    /// `lower` must already be lowercase.
    pub(crate) fn sensitive(&self, lower: &str) -> bool {
        if lower.is_empty() || self.allowed(lower) {
            return false;
        }
        self.extra.iter().any(|name| name == lower)
            || EXACT.contains(&lower)
            || CONTAINS.iter().any(|part| lower.contains(part))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn matches_common_secret_names() {
        let matcher = Matcher::new(&Options::default());
        for name in [
            "access_token",
            "x-api-key",
            "client_secret",
            "password",
            "sessionid",
            "x-csrf-token",
            "key",
            "code",
        ] {
            assert!(matcher.sensitive(name), "{name} should be sensitive");
        }
        for name in [
            "monkey",
            "page",
            "limit",
            "content-type",
            "user-agent",
            "accept",
            "q",
            "author",
            "classname",
        ] {
            assert!(!matcher.sensitive(name), "{name} should not be sensitive");
        }
    }

    #[test]
    fn honors_extra_and_allowed_names() {
        let options = Options {
            redact_names: vec!["X-Tenant".into()],
            allow_names: vec!["code".into()],
            ..Options::default()
        };
        let matcher = Matcher::new(&options);
        assert!(matcher.sensitive("x-tenant"));
        assert!(!matcher.sensitive("code"));
    }
}
