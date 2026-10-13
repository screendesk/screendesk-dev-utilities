// Random strings from crypto.getRandomValues, with rejection sampling so every character is equally
// likely (no modulo bias), plus the entropy the settings give.

export const CHARSETS = {
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lower: 'abcdefghijklmnopqrstuvwxyz',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>/?~',
}

// Characters that are easy to confuse when read aloud or typed from a screen.
export const AMBIGUOUS = 'Il1O0o|`\'"5S2Z8B'

export function buildAlphabet({ upper, lower, digits, symbols, custom = '', excludeAmbiguous = false }) {
  let chars = ''
  if (upper) chars += CHARSETS.upper
  if (lower) chars += CHARSETS.lower
  if (digits) chars += CHARSETS.digits
  if (symbols) chars += CHARSETS.symbols
  chars += custom
  // Deduplicate (by code point) so a repeated character doesn't become more likely.
  let unique = Array.from(new Set(Array.from(chars)))
  if (excludeAmbiguous) unique = unique.filter((ch) => !AMBIGUOUS.includes(ch))
  return unique
}

// Uniform integer in [0, n) using 32-bit draws; values in the incomplete top range are rejected.
export function makeRandomIndex(getRandomValues) {
  const buffer = new Uint32Array(64)
  let position = buffer.length
  const next = () => {
    if (position >= buffer.length) {
      getRandomValues(buffer)
      position = 0
    }
    return buffer[position++]
  }
  return (n) => {
    if (n <= 0) throw new Error('Empty alphabet')
    const limit = 2 ** 32 - (2 ** 32 % n)
    let value
    do value = next()
    while (value >= limit)
    return value % n
  }
}

export function generateStrings({ alphabet, length, count, getRandomValues, unique = false }) {
  const index = makeRandomIndex(getRandomValues)
  const out = []
  const seen = new Set()
  let attempts = 0
  while (out.length < count && attempts < count * 20) {
    attempts++
    let value = ''
    for (let i = 0; i < length; i++) value += alphabet[index(alphabet.length)]
    if (unique) {
      if (seen.has(value)) continue
      seen.add(value)
    }
    out.push(value)
  }
  return out
}

export const entropyBits = (alphabetSize, length) => (alphabetSize > 1 ? length * Math.log2(alphabetSize) : 0)

export function strengthLabel(bits) {
  if (bits < 40) return { label: 'Weak', tone: 'negative' }
  if (bits < 64) return { label: 'Fair', tone: 'warning' }
  if (bits < 100) return { label: 'Strong', tone: 'positive' }
  return { label: 'Very strong', tone: 'positive' }
}
