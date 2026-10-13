// Pure helpers for the UUID generator: v4 and v7 generation, formatting, and inspection.

const hex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

function randomBytes(length) {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

function toUuid(bytes) {
  const h = hex(bytes)
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export function uuidV4() {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  const bytes = randomBytes(16)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return toUuid(bytes)
}

// UUIDv7 (RFC 9562): 48-bit Unix ms timestamp, version 7, 12-bit rand_a, variant 10, 62 random bits.
// rand_a doubles as a counter within the same millisecond so IDs from one call stay sortable.
let lastMs = -1
let sequence = 0

export function uuidV7(now = Date.now()) {
  let ms = now
  if (ms <= lastMs) {
    ms = lastMs
    sequence += 1
    if (sequence > 0xfff) {
      ms += 1
      sequence = randomBytes(2).reduce((acc, byte) => (acc << 8) | byte, 0) & 0x7ff
    }
  } else {
    sequence = randomBytes(2).reduce((acc, byte) => (acc << 8) | byte, 0) & 0x7ff
  }
  lastMs = ms
  const bytes = randomBytes(16)
  let time = ms
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = time % 256
    time = Math.floor(time / 256)
  }
  bytes[6] = 0x70 | ((sequence >> 8) & 0x0f)
  bytes[7] = sequence & 0xff
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  return toUuid(bytes)
}

export function generate(version, count) {
  const n = Math.min(500, Math.max(1, Math.floor(Number(count)) || 1))
  return Array.from({ length: n }, () => (version === 'v7' ? uuidV7() : uuidV4()))
}

export function formatUuid(uuid, { uppercase = false, braces = false, hyphens = true } = {}) {
  let out = hyphens ? uuid : uuid.replace(/-/g, '')
  if (uppercase) out = out.toUpperCase()
  return braces ? `{${out}}` : out
}

const versionNames = {
  1: 'Version 1 (time-based, MAC address)',
  2: 'Version 2 (DCE security)',
  3: 'Version 3 (name-based, MD5)',
  4: 'Version 4 (random)',
  5: 'Version 5 (name-based, SHA-1)',
  6: 'Version 6 (reordered time-based)',
  7: 'Version 7 (Unix time-ordered)',
  8: 'Version 8 (custom)',
}

// Accepts hyphenated, braced, urn:uuid: or 32-hex forms. Returns details or { error }.
export function inspectUuid(input) {
  const text = String(input ?? '').trim()
  if (!text) return null
  const compact = text.replace(/^urn:uuid:/i, '').replace(/^\{|\}$/g, '').replace(/-/g, '').toLowerCase()
  if (!/^[0-9a-f]{32}$/.test(compact)) return { error: 'Not a valid UUID. Expected 32 hexadecimal characters, usually grouped 8-4-4-4-12.' }
  const canonical = `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`
  if (/^0+$/.test(compact)) return { canonical, version: null, versionName: 'Nil UUID (all zeros)', variant: 'Nil', special: true }
  if (/^f+$/.test(compact)) return { canonical, version: null, versionName: 'Max UUID (all ones)', variant: 'Max', special: true }

  const version = parseInt(compact[12], 16)
  const variantNibble = parseInt(compact[16], 16)
  let variant
  if ((variantNibble & 0x8) === 0) variant = 'NCS (reserved, backward compatibility)'
  else if ((variantNibble & 0xc) === 0x8) variant = 'RFC 9562 / RFC 4122'
  else if ((variantNibble & 0xe) === 0xc) variant = 'Microsoft (reserved)'
  else variant = 'Reserved (future)'
  const isRfc = variant.startsWith('RFC')

  const result = { canonical, version, versionName: isRfc ? versionNames[version] || `Unknown version (${version})` : 'Not an RFC 9562 UUID', variant }
  if (isRfc && version === 7) {
    result.timestamp = parseInt(compact.slice(0, 12), 16)
  } else if (isRfc && (version === 1 || version === 6)) {
    // 60-bit count of 100 ns intervals since 1582-10-15.
    const timeHex = version === 1 ? compact.slice(13, 16) + compact.slice(8, 12) + compact.slice(0, 8) : compact.slice(0, 12) + compact.slice(13, 16)
    const ticks = BigInt(`0x${timeHex}`)
    result.timestamp = Number((ticks - 122192928000000000n) / 10000n)
  }
  return result
}
