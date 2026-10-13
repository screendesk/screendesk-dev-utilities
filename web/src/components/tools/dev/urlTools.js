// URL encoding, decoding, and parsing helpers.

// mode: 'component' (encodeURIComponent) or 'uri' (encodeURI). plusForSpace gives
// application/x-www-form-urlencoded style output (spaces as +).
export function urlEncode(text, { mode = 'component', plusForSpace = false } = {}) {
  const encoded = mode === 'uri' ? encodeURI(text) : encodeURIComponent(text)
  return plusForSpace ? encoded.replace(/%20/g, '+') : encoded
}

// Throws a readable error pointing at the first malformed % sequence.
export function urlDecode(text, { plusAsSpace = false } = {}) {
  const source = plusAsSpace ? text.replace(/\+/g, ' ') : text
  try {
    return decodeURIComponent(source)
  } catch (_) {
    const bad = findMalformed(source)
    throw new Error(bad ? `Malformed escape “${bad.sequence}” at position ${bad.index + 1}. A % must be followed by two hex digits that form valid UTF-8.` : 'This text contains a malformed % escape sequence.')
  }
}

function findMalformed(text) {
  const re = /%/g
  let m
  while ((m = re.exec(text))) {
    const rest = text.slice(m.index)
    const run = rest.match(/^(?:%[0-9a-fA-F]{2})+/)
    if (!run) return { index: m.index, sequence: rest.slice(0, 3) }
    try {
      decodeURIComponent(run[0])
      re.lastIndex = m.index + run[0].length
    } catch (_) {
      return { index: m.index, sequence: run[0].slice(0, 12) }
    }
  }
  return null
}

// True when text still looks percent-encoded (so it may have been encoded twice).
export function looksEncoded(text) {
  return /%[0-9a-fA-F]{2}/.test(text)
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch (_) {
    return value
  }
}

const KNOWN_SCHEMES = new Set(['http:', 'https:', 'ws:', 'wss:', 'ftp:', 'file:', 'data:', 'mailto:', 'tel:', 'blob:', 'javascript:'])

export function parseUrl(input) {
  const raw = input.trim()
  if (!raw) return null
  let url
  let assumedScheme = false
  try {
    url = new URL(raw)
    // "localhost:3000/api" parses with "localhost:" as the scheme; treat it as a host instead.
    if (!KNOWN_SCHEMES.has(url.protocol) && !url.hostname && /^[\w.-]+:\d/.test(raw)) throw new Error('host without scheme')
  } catch (_) {
    try {
      url = new URL(`https://${raw}`)
      assumedScheme = true
    } catch (error) {
      throw new Error('This is not a valid URL. Include the scheme, e.g. https://example.com/path?x=1.')
    }
  }
  const params = []
  url.searchParams.forEach((value, key) => params.push([key, value]))
  const hashQuery = url.hash.includes('?') ? url.hash.slice(url.hash.indexOf('?') + 1) : ''
  const hashParams = []
  if (hashQuery) new URLSearchParams(hashQuery).forEach((value, key) => hashParams.push([key, value]))
  return {
    assumedScheme,
    href: url.href,
    protocol: url.protocol,
    username: safeDecode(url.username),
    password: url.password ? '••••••' : '',
    hostname: url.hostname,
    port: url.port,
    origin: url.origin,
    pathname: safeDecode(url.pathname),
    segments: url.pathname.split('/').filter(Boolean).map(safeDecode),
    search: url.search,
    hash: safeDecode(url.hash),
    params,
    hashParams,
  }
}
