use crate::names::Matcher;
use crate::Kind;
use percent_encoding::{percent_decode_str, utf8_percent_encode, NON_ALPHANUMERIC};

/// Redact credentials (`user:pass@`) and sensitive query or fragment parameters in a URL.
/// Returns the clean URL and what was found, as (kind, name) pairs.
pub(crate) fn sanitize(
    url: &str,
    names: &Matcher,
    placeholder: &str,
) -> (String, Vec<(Kind, String)>) {
    let mut found = Vec::new();
    let (rest, fragment) = url
        .split_once('#')
        .map_or((url, None), |(r, f)| (r, Some(f)));
    let (base, query) = rest
        .split_once('?')
        .map_or((rest, None), |(b, q)| (b, Some(q)));

    let mut out = strip_credentials(base, placeholder, &mut found);
    if let Some(query) = query {
        let (clean, params) = sanitize_pairs(query, names, placeholder);
        found.extend(params.into_iter().map(|name| (Kind::UrlParam, name)));
        out.push('?');
        out.push_str(&clean);
    }
    if let Some(fragment) = fragment {
        out.push('#');
        // OAuth implicit flows put tokens in the fragment: #access_token=…&token_type=bearer
        if fragment.contains('=') {
            let (clean, params) = sanitize_pairs(fragment, names, placeholder);
            found.extend(params.into_iter().map(|name| (Kind::UrlParam, name)));
            out.push_str(&clean);
        } else {
            out.push_str(fragment);
        }
    }
    (out, found)
}

fn strip_credentials(base: &str, placeholder: &str, found: &mut Vec<(Kind, String)>) -> String {
    let Some(scheme_end) = base.find("://") else {
        return base.to_owned();
    };
    let authority_start = scheme_end + 3;
    let authority_end = base[authority_start..]
        .find('/')
        .map_or(base.len(), |i| authority_start + i);
    match base[authority_start..authority_end].rfind('@') {
        Some(at) => {
            let encoded = utf8_percent_encode(placeholder, NON_ALPHANUMERIC).to_string();
            if base[authority_start..authority_start + at] != encoded {
                found.push((Kind::UrlCredentials, "userinfo".into()));
            }
            format!(
                "{}{}@{}",
                &base[..authority_start],
                encoded,
                &base[authority_start + at + 1..]
            )
        }
        None => base.to_owned(),
    }
}

/// Redact sensitive `name=value` pairs in a query string or form-encoded body.
/// Returns the clean string and the (decoded) names that were redacted.
pub(crate) fn sanitize_pairs(
    pairs: &str,
    names: &Matcher,
    placeholder: &str,
) -> (String, Vec<String>) {
    let encoded = utf8_percent_encode(placeholder, NON_ALPHANUMERIC).to_string();
    let mut found = Vec::new();
    let clean = pairs
        .split('&')
        .map(|pair| match pair.split_once('=') {
            Some((raw_name, value)) if !value.is_empty() => {
                let name = decode(raw_name);
                if names.sensitive(&name.to_ascii_lowercase()) {
                    if value != encoded {
                        found.push(name);
                    }
                    format!("{raw_name}={encoded}")
                } else {
                    pair.to_owned()
                }
            }
            _ => pair.to_owned(),
        })
        .collect::<Vec<_>>()
        .join("&");
    (clean, found)
}

fn decode(value: &str) -> String {
    percent_decode_str(&value.replace('+', " "))
        .decode_utf8_lossy()
        .into_owned()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Options;

    fn run(url: &str) -> (String, Vec<(Kind, String)>) {
        sanitize(url, &Matcher::new(&Options::default()), "[REDACTED]")
    }

    #[test]
    fn redacts_query_fragment_and_credentials() {
        let (clean, found) =
            run("https://bob:hunter2@example.com/cb?page=2&access_token=abc#id_token=xyz&state=s1");
        assert_eq!(clean, "https://%5BREDACTED%5D@example.com/cb?page=2&access_token=%5BREDACTED%5D#id_token=%5BREDACTED%5D&state=s1");
        assert_eq!(found.len(), 3);
    }

    #[test]
    fn leaves_clean_urls_alone() {
        let url = "https://example.com/search?q=har+file&page=1#results";
        assert_eq!(run(url).0, url);
    }
}
