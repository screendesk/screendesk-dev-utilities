// Base64 helpers with real UTF-8 handling (btoa/atob alone only cope with Latin-1).

export function bytesToBase64(bytes, urlSafe = false) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  const b64 = btoa(binary)
  return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64
}

export function encodeText(text, urlSafe = false) {
  return bytesToBase64(new TextEncoder().encode(text), urlSafe)
}

// Accepts standard or URL-safe alphabets, missing padding, whitespace and line breaks,
// and a leading data URL prefix. Throws an Error with a readable message when invalid.
export function base64ToBytes(input) {
  let value = String(input).trim()
  let mime = null
  const dataUrl = value.match(/^data:([^;,]*)(?:;[^,]*)?,/i)
  if (dataUrl) {
    if (!/;base64,/i.test(value.slice(0, dataUrl[0].length))) throw new Error('This data URL is not base64-encoded (it has no “;base64” marker).')
    mime = dataUrl[1] || null
    value = value.slice(dataUrl[0].length)
  }
  value = value.replace(/\s+/g, '')
  if (!value) return { bytes: new Uint8Array(0), mime }
  const bad = value.search(/[^A-Za-z0-9+/\-_=]/)
  if (bad !== -1) throw new Error(`Invalid character “${value[bad]}” at position ${bad + 1}. Base64 only uses A–Z, a–z, 0–9, + and / (or - and _ for URL-safe), with = padding.`)
  if (/=[^=]/.test(value) || /={3,}$/.test(value)) throw new Error('Padding “=” can only appear at the end, at most twice.')
  value = value.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '')
  if (value.length % 4 === 1) throw new Error('The input length is not valid base64 (one character too many or missing). It may be truncated.')
  value += '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return { bytes, mime }
}

// Sniffs common file signatures so decoded binaries can be previewed or downloaded.
export function sniffMime(bytes) {
  const starts = (...sig) => sig.every((byte, i) => bytes[i] === byte)
  if (starts(0x89, 0x50, 0x4e, 0x47)) return 'image/png'
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg'
  if (starts(0x47, 0x49, 0x46, 0x38)) return 'image/gif'
  if (starts(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp'
  if (starts(0x42, 0x4d)) return 'image/bmp'
  if (starts(0x00, 0x00, 0x01, 0x00)) return 'image/x-icon'
  if (starts(0x25, 0x50, 0x44, 0x46)) return 'application/pdf'
  if (starts(0x50, 0x4b, 0x03, 0x04)) return 'application/zip'
  if (starts(0x1f, 0x8b)) return 'application/gzip'
  const head = new TextDecoder().decode(bytes.subarray(0, 256)).trimStart()
  if (/^(<\?xml[^>]*>\s*)?<svg[\s>]/i.test(head)) return 'image/svg+xml'
  return null
}

export function decodeBase64(input) {
  const { bytes, mime: declared } = base64ToBytes(input)
  const mime = declared || sniffMime(bytes)
  let text = null
  if (!mime || /^text\/|json|xml|svg|javascript/.test(mime)) {
    try {
      text = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      // Mostly control characters means binary data that happens to be valid UTF-8.
      // eslint-disable-next-line no-control-regex
      const control = (text.match(/[\x00-\x08\x0E-\x1F]/g) || []).length
      if (text.length && control / text.length > 0.1) text = null
    } catch (_) {
      text = null
    }
  }
  return { bytes, mime, text }
}

export function hexPreview(bytes, limit = 256) {
  const lines = []
  for (let offset = 0; offset < Math.min(bytes.length, limit); offset += 16) {
    const row = Array.from(bytes.subarray(offset, Math.min(offset + 16, limit)))
    const hex = row.map((b) => b.toString(16).padStart(2, '0')).join(' ')
    const ascii = row.map((b) => (b >= 32 && b < 127 ? String.fromCharCode(b) : '.')).join('')
    lines.push(`${offset.toString(16).padStart(8, '0')}  ${hex.padEnd(47)}  ${ascii}`)
  }
  if (bytes.length > limit) lines.push(`… ${bytes.length - limit} more bytes`)
  return lines.join('\n')
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}
