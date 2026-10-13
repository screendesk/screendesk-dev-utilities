// Small helpers shared by the QA tools: downloads, escaping, Luhn, and a seeded PRNG.

export function downloadText(filename, text, mime = 'text/plain') {
  if (typeof window === 'undefined') return
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

export function sqlValue(value) {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE'
  return `'${String(value).replace(/'/g, "''")}'`
}

export function digitsOnly(value) {
  return String(value).replace(/\D/g, '')
}

// Luhn (mod 10) check used by card numbers.
export function luhnCheck(value) {
  const digits = digitsOnly(value)
  if (digits.length < 2) return false
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

// The digit to append to `partial` so the full number passes Luhn.
export function luhnCheckDigit(partial) {
  const digits = digitsOnly(partial)
  let sum = 0
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i])
    if (i % 2 === 0) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return (10 - (sum % 10)) % 10
}

// Deterministic PRNG (mulberry32) so a seed reproduces the same data set.
export function seededRandom(seed) {
  let state = hashSeed(seed)
  return function random() {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(seed) {
  const text = String(seed)
  let hash = 2166136261
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

export function formatCardNumber(value) {
  const digits = digitsOnly(value)
  if (digits.length === 15) return `${digits.slice(0, 4)} ${digits.slice(4, 10)} ${digits.slice(10)}`
  return digits.replace(/(.{4})/g, '$1 ').trim()
}
