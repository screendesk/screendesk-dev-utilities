// Pure helpers for the JWT decoder: base64url decoding, claim inspection, and HMAC verification
// with WebCrypto. Nothing leaves the browser.

export function base64UrlToBytes(segment) {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function decodeJsonSegment(segment, name) {
  if (!/^[A-Za-z0-9_-]*$/.test(segment)) throw new Error(`The ${name} contains characters that are not valid base64url.`)
  let text
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(base64UrlToBytes(segment))
  } catch (_) {
    throw new Error(`The ${name} is not valid base64url-encoded UTF-8.`)
  }
  try {
    return { json: JSON.parse(text), raw: text }
  } catch (_) {
    throw new Error(`The ${name} decodes, but it is not valid JSON.`)
  }
}

// Returns { header, payload, signature, parts } or { error }.
export function decodeJwt(input) {
  const token = String(input ?? '').trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '')
  if (!token) return null
  const parts = token.split('.')
  if (parts.length === 5) return { error: 'This looks like an encrypted JWT (JWE, five parts). Its payload can only be read with the decryption key.' }
  if (parts.length !== 3) return { error: `A JWT has three parts separated by dots (header.payload.signature). This value has ${parts.length}.` }
  try {
    const header = decodeJsonSegment(parts[0], 'header')
    const payload = decodeJsonSegment(parts[1], 'payload')
    return { header: header.json, payload: payload.json, signature: parts[2], parts, token }
  } catch (error) {
    return { error: error.message }
  }
}

export const TIME_CLAIMS = ['exp', 'nbf', 'iat', 'auth_time']

// Token status relative to `nowSeconds`: expired, not yet valid, or valid.
export function tokenStatus(payload, nowSeconds) {
  if (!payload || typeof payload !== 'object') return null
  if (typeof payload.exp === 'number' && payload.exp <= nowSeconds) return { tone: 'negative', label: 'Expired' }
  if (typeof payload.nbf === 'number' && payload.nbf > nowSeconds) return { tone: 'warning', label: 'Not yet valid' }
  if (typeof payload.exp === 'number') return { tone: 'positive', label: 'Not expired' }
  return { tone: 'neutral', label: 'No expiry (exp) claim' }
}

const hmacHashes = { HS256: 'SHA-256', HS384: 'SHA-384', HS512: 'SHA-512' }

export function canVerify(alg) {
  return Boolean(hmacHashes[alg])
}

// Verifies an HS256/384/512 signature. `secretIsBase64` treats the secret as base64 or base64url.
export async function verifyHmac(decoded, secret, secretIsBase64 = false) {
  const hash = hmacHashes[decoded?.header?.alg]
  if (!hash) throw new Error('Only HS256, HS384 and HS512 can be verified with a shared secret.')
  const subtle = globalThis.crypto?.subtle
  if (!subtle) throw new Error('WebCrypto is not available in this browser context.')
  const keyBytes = secretIsBase64 ? base64UrlToBytes(secret.trim().replace(/=+$/, '')) : new TextEncoder().encode(secret)
  const key = await subtle.importKey('raw', keyBytes, { name: 'HMAC', hash }, false, ['verify'])
  const [header, payload, signature] = decoded.parts
  return subtle.verify('HMAC', key, base64UrlToBytes(signature), new TextEncoder().encode(`${header}.${payload}`))
}
