// Standard 5-field cron (Vixie cron / crontab) parsing, plain-English descriptions and next run times.
// Pure functions, no dependencies.

export const macros = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
export const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const fieldSpecs = [
  { key: 'minute', label: 'Minute', min: 0, max: 59, allowed: '0–59' },
  { key: 'hour', label: 'Hour', min: 0, max: 23, allowed: '0–23' },
  { key: 'dom', label: 'Day of month', min: 1, max: 31, allowed: '1–31' },
  { key: 'month', label: 'Month', min: 1, max: 12, allowed: '1–12 or JAN–DEC', names: MONTHS, nameOffset: 1 },
  { key: 'dow', label: 'Day of week', min: 0, max: 7, allowed: '0–7 or SUN–SAT; 0 and 7 are Sunday', names: DAYS, nameOffset: 0 },
]

function parseValue(token, spec) {
  if (/^\d+$/.test(token)) {
    const value = Number(token)
    if (value < spec.min || value > spec.max) throw new Error(`${spec.label}: ${value} is out of range (${spec.allowed}).`)
    return value
  }
  if (spec.names) {
    const index = spec.names.indexOf(token.toUpperCase())
    if (index !== -1) return index + spec.nameOffset
  }
  throw new Error(`${spec.label}: "${token}" is not a valid value (${spec.allowed}).`)
}

function parseField(raw, spec) {
  if (raw === '') throw new Error(`${spec.label} is empty.`)
  const values = new Set()
  for (const part of raw.split(',')) {
    if (part === '') throw new Error(`${spec.label}: empty item in list "${raw}".`)
    const [rangePart, stepPart, extra] = part.split('/')
    if (extra !== undefined) throw new Error(`${spec.label}: "${part}" has more than one "/".`)
    let step = 1
    if (stepPart !== undefined) {
      if (!/^\d+$/.test(stepPart) || Number(stepPart) === 0) throw new Error(`${spec.label}: step "${stepPart}" must be a positive number.`)
      step = Number(stepPart)
    }
    let start
    let end
    if (rangePart === '*' || rangePart === '?') {
      start = spec.min
      end = spec.key === 'dow' ? 6 : spec.max
    } else if (rangePart.includes('-')) {
      const [a, b, more] = rangePart.split('-')
      if (more !== undefined || a === '' || b === '') throw new Error(`${spec.label}: "${rangePart}" is not a valid range.`)
      start = parseValue(a, spec)
      end = parseValue(b, spec)
      if (start > end) throw new Error(`${spec.label}: range ${a}-${b} runs backwards.`)
    } else {
      start = parseValue(rangePart, spec)
      // "5/15" means "from 5 to the end, every 15".
      end = stepPart !== undefined ? (spec.key === 'dow' ? 6 : spec.max) : start
    }
    for (let v = start; v <= end; v += step) values.add(spec.key === 'dow' && v === 7 ? 0 : v)
  }
  return [...values].sort((a, b) => a - b)
}

// Returns { expression, macro, fields: { minute: { raw, values, star } … } } or throws with a readable message.
export function parseCron(input) {
  const trimmed = (input || '').trim().replace(/\s+/g, ' ')
  if (!trimmed) throw new Error('Enter a cron expression, e.g. "*/15 * * * *".')
  let expression = trimmed
  let macro = null
  if (trimmed.startsWith('@')) {
    const key = trimmed.toLowerCase()
    if (key === '@reboot') throw new Error('@reboot runs once when the cron daemon starts, so it has no schedule to show.')
    if (!macros[key]) throw new Error(`Unknown shortcut "${trimmed}". Try @yearly, @monthly, @weekly, @daily or @hourly.`)
    macro = key
    expression = macros[key]
  }
  const parts = expression.split(' ')
  if (parts.length === 6 || parts.length === 7) throw new Error(`This has ${parts.length} fields. Standard cron uses 5 (minute hour day-of-month month day-of-week); 6–7 fields usually means a Quartz or Spring expression with seconds or years.`)
  if (parts.length !== 5) throw new Error(`Expected 5 fields (minute hour day-of-month month day-of-week), found ${parts.length}.`)
  const fields = {}
  fieldSpecs.forEach((spec, index) => {
    const raw = parts[index]
    // Like Vixie cron, a field starting with "*" counts as unrestricted for the day-of-month/day-of-week rule.
    fields[spec.key] = { raw, values: parseField(raw, spec), star: raw.startsWith('*') || raw === '?' }
  })
  return { expression, macro, fields }
}

// ---------- Description ----------

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function listJoin(items, conj = 'and') {
  if (items.length <= 1) return items.join('')
  if (items.length === 2) return `${items[0]} ${conj} ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, ${conj} ${items[items.length - 1]}`
}

function valueName(token, spec) {
  const value = parseValue(token, spec)
  if (spec.key === 'month') return monthNames[value - 1]
  if (spec.key === 'dow') return dayNames[value % 7]
  return String(value)
}

const units = { minute: 'minute', hour: 'hour', dom: 'day-of-month', month: 'month', dow: 'day-of-week' }

function describePart(part, spec) {
  const [rangePart, stepPart] = part.split('/')
  const unit = units[spec.key]
  if (stepPart !== undefined) {
    const n = Number(stepPart)
    const clock = spec.key === 'minute' || spec.key === 'hour'
    if ((rangePart === '*' || rangePart === '?') && clock) return n === 1 ? `every ${unit}` : `every ${n} ${unit}s`
    const every = `every ${n === 1 ? '' : ordinal(n) + ' '}${unit}`
    if (rangePart === '*' || rangePart === '?') return every
    if (rangePart.includes('-')) {
      const [a, b] = rangePart.split('-')
      return `${every} from ${valueName(a, spec)} through ${valueName(b, spec)}`
    }
    const last = spec.key === 'dow' ? 'Saturday' : spec.key === 'month' ? 'December' : String(spec.max)
    return `${every} from ${valueName(rangePart, spec)} through ${last}`
  }
  if (rangePart.includes('-')) {
    const [a, b] = rangePart.split('-')
    if (spec.key === 'minute' || spec.key === 'hour') return `every ${unit} from ${valueName(a, spec)} through ${valueName(b, spec)}`
    return `${valueName(a, spec)} through ${valueName(b, spec)}`
  }
  return valueName(rangePart, spec)
}

function describeField(field, spec, prefix) {
  const parts = field.raw.split(',').map((part) => describePart(part, spec))
  const simple = parts.every((p) => !p.startsWith('every') && !p.includes('through'))
  if (simple && (spec.key === 'month' || spec.key === 'dow')) return listJoin(parts)
  if (simple) return `${prefix} ${listJoin(parts)}`
  return listJoin(parts.map((p) => (p.startsWith('every') ? p : /^\d/.test(p) ? `${prefix} ${p}` : p)))
}

const pad = (n) => String(n).padStart(2, '0')

export function describeCron(parsed) {
  const { minute, hour, dom, month, dow } = parsed.fields
  const [mSpec, hSpec, domSpec, monSpec, dowSpec] = fieldSpecs
  const isNumberList = (raw) => /^\d+(,\d+)*$/.test(raw)
  let time
  if (isNumberList(minute.raw) && isNumberList(hour.raw) && minute.values.length * hour.values.length <= 6) {
    const times = []
    hour.values.forEach((h) => minute.values.forEach((m) => times.push(`${pad(h)}:${pad(m)}`)))
    time = `At ${listJoin(times)}`
  } else {
    const minuteText = minute.raw === '*' ? 'every minute' : describeField(minute, mSpec, 'minute')
    const hourText = hour.raw === '*' ? '' : describeField(hour, hSpec, 'hour')
    if (minute.raw === '*') time = hourText ? `Every minute past ${hourText}` : 'Every minute'
    else if (minuteText.startsWith('every')) time = `${minuteText[0].toUpperCase()}${minuteText.slice(1)}${hourText ? ` past ${hourText}` : ''}`
    else time = `At ${minuteText}${hourText ? ` past ${hourText}` : ''}`
  }
  const days = []
  if (dom.raw !== '*' && dom.raw !== '?') days.push(`on ${describeField(dom, domSpec, 'day-of-month')}`)
  if (dow.raw !== '*' && dow.raw !== '?') days.push(`on ${describeField(dow, dowSpec, 'day-of-week')}`)
  // Vixie rule: when both day fields are restricted, a day matches if EITHER matches.
  const dayText = days.length === 2 && !dom.star && !dow.star ? `${days[0]} or ${days[1]}` : days.join(' and ')
  const monthText = month.raw !== '*' && month.raw !== '?' ? `in ${describeField(month, monSpec, 'month')}` : ''
  return [time, dayText, monthText].filter(Boolean).join(' ') + '.'
}

// ---------- Next runs ----------

function dayMatches(fields, dayOfMonth, weekday) {
  const domMatch = fields.dom.values.includes(dayOfMonth)
  const dowMatch = fields.dow.values.includes(weekday)
  if (fields.dom.star || fields.dow.star) return domMatch && dowMatch
  return domMatch || dowMatch
}

// Next `count` run times strictly after `from`, evaluated in UTC or the browser's local time zone.
// Walks day by day (up to ~8 years, enough for Feb 29), so impossible dates (e.g. 30 Feb) return [].
export function nextRuns(parsed, from = new Date(), count = 5, zone = 'local') {
  const utc = zone === 'utc'
  const { fields } = parsed
  const make = (y, mo, d, h = 0, mi = 0) => (utc ? new Date(Date.UTC(y, mo, d, h, mi)) : new Date(y, mo, d, h, mi))
  const get = (date) => (utc
    ? { y: date.getUTCFullYear(), mo: date.getUTCMonth(), d: date.getUTCDate(), wd: date.getUTCDay(), h: date.getUTCHours(), mi: date.getUTCMinutes() }
    : { y: date.getFullYear(), mo: date.getMonth(), d: date.getDate(), wd: date.getDay(), h: date.getHours(), mi: date.getMinutes() })
  const runs = []
  const start = get(from)
  let day = make(start.y, start.mo, start.d)
  for (let i = 0; i < 366 * 8 && runs.length < count; i++) {
    const t = get(day)
    if (fields.month.values.includes(t.mo + 1) && dayMatches(fields, t.d, t.wd)) {
      for (const h of fields.hour.values) {
        for (const mi of fields.minute.values) {
          const candidate = make(t.y, t.mo, t.d, h, mi)
          const c = get(candidate)
          // Skip wall-clock times that don't exist on DST change days.
          if (c.h !== h || c.mi !== mi || c.d !== t.d) continue
          if (candidate.getTime() <= from.getTime()) continue
          runs.push(candidate)
          if (runs.length >= count) break
        }
        if (runs.length >= count) break
      }
    }
    day = make(t.y, t.mo, t.d + 1)
  }
  return runs
}

export const presets = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Weekdays at 9:00', value: '0 9 * * 1-5' },
  { label: 'Every Sunday', value: '0 0 * * 0' },
  { label: '1st of the month', value: '0 0 1 * *' },
  { label: 'Every quarter', value: '0 0 1 */3 *' },
  { label: 'Once a year', value: '0 0 1 1 *' },
]
