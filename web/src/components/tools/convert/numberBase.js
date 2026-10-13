// Integer conversion between bases 2–36 with BigInt, so values of any size stay exact.
// Pure functions: no DOM, safe to run during render and in Node tests.

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export const BASE_NAMES = { 2: 'Binary', 8: 'Octal', 10: 'Decimal', 16: 'Hexadecimal' }

export function baseName(base) {
  return BASE_NAMES[base] || `Base ${base}`
}

const PREFIXES = { 2: /^0b/i, 8: /^0o/i, 16: /^0x/i }

// Parse a string in `base`. Accepts a leading sign, a matching 0b/0o/0x prefix (or # for hex),
// and spaces, underscores, or commas as digit separators.
export function parseInBase(input, base) {
  if (!Number.isInteger(base) || base < 2 || base > 36) return { ok: false, error: 'Base must be a whole number from 2 to 36.' }
  let text = String(input ?? '').trim()
  if (!text) return { ok: false, empty: true, error: 'Enter a number.' }
  let negative = false
  if (text[0] === '-' || text[0] === '+') {
    negative = text[0] === '-'
    text = text.slice(1).trim()
  }
  if (PREFIXES[base]) text = text.replace(PREFIXES[base], '')
  if (base === 16) text = text.replace(/^#/, '')
  text = text.replace(/[\s_,]/g, '').toLowerCase()
  if (!text) return { ok: false, error: 'Enter at least one digit.' }
  const bigBase = BigInt(base)
  let value = 0n
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    const digit = DIGITS.indexOf(char)
    if (digit === -1 || digit >= base) {
      const allowed = base <= 10 ? `0–${base - 1}` : `0–9 and A–${DIGITS[base - 1].toUpperCase()}`
      return { ok: false, error: `“${char.toUpperCase()}” is not a valid ${baseName(base).toLowerCase()} digit. Use ${allowed}.`, position: index }
    }
    value = value * bigBase + BigInt(digit)
  }
  return { ok: true, value: negative ? -value : value }
}

// Format a BigInt in `base`. Uppercase letters by default, which is how hex is usually written.
export function toBase(value, base, { uppercase = true } = {}) {
  if (value === 0n) return '0'
  const negative = value < 0n
  let rest = negative ? -value : value
  const bigBase = BigInt(base)
  let out = ''
  while (rest > 0n) {
    out = DIGITS[Number(rest % bigBase)] + out
    rest /= bigBase
  }
  if (uppercase) out = out.toUpperCase()
  return negative ? `-${out}` : out
}

// Insert a separator every `size` digits counted from the right. Keeps a leading minus sign.
export function groupDigits(text, size, separator = ' ') {
  if (!size || size < 1) return text
  const negative = text.startsWith('-')
  const digits = negative ? text.slice(1) : text
  const groups = []
  for (let end = digits.length; end > 0; end -= size) groups.unshift(digits.slice(Math.max(0, end - size), end))
  return (negative ? '-' : '') + groups.join(separator)
}

// The natural grouping per base: nibbles for binary, 3 bits for octal, thousands for decimal, bytes for hex.
export function defaultGroupSize(base) {
  if (base === 2) return 4
  if (base === 8) return 3
  if (base === 10) return 3
  if (base === 16) return 2
  return 0
}

export function formatGrouped(value, base, grouped) {
  const text = toBase(value, base)
  if (!grouped) return text
  return groupDigits(text, defaultGroupSize(base), base === 10 ? ',' : ' ')
}

// Two's complement view at a fixed width. Values from −2^(bits−1) to 2^bits − 1 fit (signed or unsigned);
// anything else overflows and is shown truncated to the low bits.
export function twosComplement(value, bits) {
  const width = BigInt(bits)
  const modulus = 1n << width
  const min = -(1n << (width - 1n))
  const max = modulus - 1n
  const overflow = value < min || value > max
  const pattern = ((value % modulus) + modulus) % modulus
  const signed = pattern >= 1n << (width - 1n) ? pattern - modulus : pattern
  return {
    bits,
    overflow,
    pattern,
    binary: pattern.toString(2).padStart(bits, '0'),
    hex: pattern.toString(16).toUpperCase().padStart(bits / 4, '0'),
    signed,
    unsigned: pattern,
    signedRange: [min, (1n << (width - 1n)) - 1n],
    unsignedMax: max,
  }
}

// Number of bits needed to write |value| in binary.
export function bitLength(value) {
  const abs = value < 0n ? -value : value
  return abs === 0n ? 1 : abs.toString(2).length
}
