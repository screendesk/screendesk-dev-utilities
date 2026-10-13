// Hashing helpers. SHA-1/256/384/512 and HMAC use the browser's WebCrypto (crypto.subtle).
// WebCrypto has no MD5, so MD5 is implemented here (RFC 1321) over raw bytes.

const S = [7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]
const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0)

export function md5(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(String(bytes))
  const length = input.length
  // Pad to 56 mod 64 bytes, then append the bit length as a 64-bit little-endian integer.
  const padded = new Uint8Array((((length + 8) >>> 6) + 1) * 64)
  padded.set(input)
  padded[length] = 0x80
  const view = new DataView(padded.buffer)
  const bitLength = length * 8
  view.setUint32(padded.length - 8, bitLength >>> 0, true)
  view.setUint32(padded.length - 4, Math.floor(bitLength / 2 ** 32) >>> 0, true)

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476
  const M = new Uint32Array(16)
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) M[i] = view.getUint32(offset + i * 4, true)
    let A = a0, B = b0, C = c0, D = d0
    for (let i = 0; i < 64; i++) {
      let F, g
      if (i < 16) { F = (B & C) | (~B & D); g = i }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * i) % 16 }
      F = (F + A + K[i] + M[g]) >>> 0
      A = D
      D = C
      C = B
      B = (B + ((F << S[i]) | (F >>> (32 - S[i])))) >>> 0
    }
    a0 = (a0 + A) >>> 0
    b0 = (b0 + B) >>> 0
    c0 = (c0 + C) >>> 0
    d0 = (d0 + D) >>> 0
  }
  const out = new Uint8Array(16)
  const outView = new DataView(out.buffer)
  ;[a0, b0, c0, d0].forEach((word, i) => outView.setUint32(i * 4, word, true))
  return out
}

export function toHex(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

export function toBase64(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

export const ALGORITHMS = [
  { id: 'MD5', bits: 128, webCrypto: null, note: 'Broken for security. Fine for non-adversarial checksums.' },
  { id: 'SHA-1', bits: 160, webCrypto: 'SHA-1', note: 'Collisions demonstrated in 2017. Avoid for new signatures.' },
  { id: 'SHA-256', bits: 256, webCrypto: 'SHA-256', note: 'The common default for checksums and signatures.' },
  { id: 'SHA-384', bits: 384, webCrypto: 'SHA-384', note: 'Truncated SHA-512; used in TLS and Subresource Integrity.' },
  { id: 'SHA-512', bits: 512, webCrypto: 'SHA-512', note: 'Faster than SHA-256 on 64-bit CPUs.' },
]

// Digest bytes with every algorithm. Returns { [id]: Uint8Array }.
export async function hashAll(bytes, subtle) {
  const entries = await Promise.all(ALGORITHMS.map(async ({ id, webCrypto }) => {
    if (!webCrypto) return [id, md5(bytes)]
    return [id, new Uint8Array(await subtle.digest(webCrypto, bytes))]
  }))
  return Object.fromEntries(entries)
}

// HMAC with the SHA family (MD5 HMAC isn't offered: WebCrypto doesn't support it).
export async function hmacAll(bytes, keyBytes, subtle) {
  const entries = await Promise.all(ALGORITHMS.filter((a) => a.webCrypto).map(async ({ id, webCrypto }) => {
    // A zero-length HMAC key is rejected by some browsers; HMAC pads keys with zeros, so one zero byte is equivalent.
    const key = await subtle.importKey('raw', keyBytes.length ? keyBytes : new Uint8Array(1), { name: 'HMAC', hash: webCrypto }, false, ['sign'])
    return [id, new Uint8Array(await subtle.sign('HMAC', key, bytes))]
  }))
  return Object.fromEntries(entries)
}

// Normalise a pasted checksum: strip whitespace, a trailing "  filename" (sha256sum output), and case.
export function normalizeChecksum(text) {
  const first = String(text || '').trim().split(/\s+/)[0] || ''
  return first.replace(/^(?:md5|sha-?\d+)[:=]/i, '').toLowerCase()
}

// Which algorithm (if any) produced the expected value, in hex or base64.
export function findMatch(expected, digests) {
  const raw = String(expected || '').trim().split(/\s+/)[0] || ''
  if (!raw) return null
  const hex = normalizeChecksum(raw)
  const b64 = raw.replace(/^(?:sha\d+-)/i, '')
  for (const [id, bytes] of Object.entries(digests || {})) {
    if (toHex(bytes) === hex) return { id, encoding: 'hex' }
    try { if (toBase64(bytes) === b64) return { id, encoding: 'base64' } } catch (_) { /* not Base64-encodable */ }
  }
  return { id: null }
}
