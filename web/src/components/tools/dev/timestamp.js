// Pure helpers for the Unix timestamp converter. No React, so they can be tested in Node.

export const UNITS = {
  s: { label: 'Seconds', factor: 1000 },
  ms: { label: 'Milliseconds', factor: 1 },
  us: { label: 'Microseconds', factor: 0.001 },
  ns: { label: 'Nanoseconds', factor: 0.000001 },
}

// Guess the unit from the number of integer digits: 10 → seconds, 13 → ms, 16 → µs, 19 → ns.
// Anything up to 11 digits is treated as seconds (covers dates up to the year 5138).
export function detectUnit(value) {
  const digits = String(Math.trunc(Math.abs(value))).length
  if (digits <= 11) return 's'
  if (digits <= 14) return 'ms'
  if (digits <= 17) return 'us'
  return 'ns'
}

// Parse a pasted timestamp. Returns { ms, unit } or { error }.
export function parseTimestamp(input, unit = 'auto') {
  const text = String(input ?? '').trim().replace(/[_,\s]/g, '')
  if (!text) return null
  if (!/^-?\d+(\.\d+)?$/.test(text)) return { error: 'Enter a number of seconds or milliseconds since 1 January 1970 (UTC).' }
  const value = Number(text)
  const resolved = unit === 'auto' ? detectUnit(value) : unit
  const ms = value * UNITS[resolved].factor
  if (!Number.isFinite(ms) || Math.abs(ms) > 8.64e15) return { error: 'That timestamp is outside the range a JavaScript date can represent (±273,790 years).' }
  return { ms, unit: resolved }
}

const relativeSteps = [
  ['year', 365.25 * 24 * 3600],
  ['month', 30.44 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

// "3 hours ago" / "in 2 days", relative to `now` (ms).
export function relativeTime(ms, now, locale = 'en') {
  const diff = (ms - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 1) return 'now'
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, seconds] of relativeSteps) {
    if (abs >= seconds || unit === 'second') return rtf.format(Math.round(diff / seconds), unit)
  }
  return ''
}

// The zone's UTC offset (ms) at a given instant.
export function zoneOffset(ms, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(ms))
  const get = (type) => Number(parts.find((part) => part.type === type)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'))
  return asUtc - Math.floor(ms / 1000) * 1000
}

export function formatOffset(offsetMs) {
  const sign = offsetMs < 0 ? '-' : '+'
  const total = Math.round(Math.abs(offsetMs) / 60000)
  return `${sign}${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// ISO 8601 with the zone's offset, e.g. 2026-10-13T14:05:00+02:00.
export function isoInZone(ms, timeZone) {
  const offset = zoneOffset(ms, timeZone)
  const local = new Date(ms + offset).toISOString().replace(/\.000Z$|Z$/, '')
  return `${local}${offset === 0 && timeZone === 'UTC' ? 'Z' : formatOffset(offset)}`
}

export function formatInZone(ms, timeZone, locale = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(ms))
}

// Interpret a wall-clock time ("2026-10-13T14:05" or with seconds) in a time zone and return epoch ms.
export function zonedToEpoch(localValue, timeZone) {
  const match = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/.exec(String(localValue).trim())
  if (!match) return null
  const [, y, mo, d, h, mi, s = '0', frac = '0'] = match
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s, Number(frac.padEnd(3, '0')))
  let result = guess - zoneOffset(guess, timeZone)
  // Re-check once in case the guess crossed a DST transition.
  const second = guess - zoneOffset(result, timeZone)
  if (second !== result) result = second
  return result
}

// Parse any date string (ISO 8601, RFC 2822…) the browser understands. Strings without a zone
// are read in `timeZone` rather than the browser's zone.
export function parseDateString(input, timeZone) {
  const text = String(input ?? '').trim()
  if (!text) return null
  const zoned = zonedToEpoch(text, timeZone)
  if (zoned !== null) return { ms: zoned }
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return { ms: zonedToEpoch(`${text}T00:00`, timeZone) }
  const parsed = Date.parse(text)
  if (Number.isNaN(parsed)) return { error: 'Could not read that date. Try ISO 8601, e.g. 2026-10-13T14:05:00Z.' }
  return { ms: parsed }
}

// "2026-10-13T14:05:09" for a datetime-local input, in the given zone.
export function toLocalInputValue(ms, timeZone) {
  return new Date(Math.floor(ms / 1000) * 1000 + zoneOffset(ms, timeZone)).toISOString().slice(0, 19)
}
