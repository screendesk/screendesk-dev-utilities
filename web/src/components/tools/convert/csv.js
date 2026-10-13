// CSV parsing and writing (RFC 4180) plus JSON <-> CSV conversion. Pure functions, no DOM, so they
// run the same in the browser and in node tests.

export const DELIMITERS = [
  { value: ',', label: 'Comma' },
  { value: ';', label: 'Semicolon' },
  { value: '\t', label: 'Tab' },
]

const CANDIDATES = [',', ';', '\t', '|']

const stripBom = (text) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text)

// Counts each candidate per line (outside quotes) over the first lines and prefers the delimiter that
// appears the same number of times on every line, then the most frequent one.
export function detectDelimiter(text, sampleLines = 20) {
  const source = stripBom(text)
  const counts = CANDIDATES.map(() => [])
  let current = CANDIDATES.map(() => 0)
  let inQuotes = false
  let lines = 0
  for (let i = 0; i < source.length && lines < sampleLines; i++) {
    const ch = source[i]
    if (ch === '"') {
      if (inQuotes && source[i + 1] === '"') i++
      else inQuotes = !inQuotes
    } else if (!inQuotes && (ch === '\n' || ch === '\r')) {
      if (ch === '\r' && source[i + 1] === '\n') i++
      counts.forEach((list, index) => list.push(current[index]))
      current = CANDIDATES.map(() => 0)
      lines++
    } else if (!inQuotes) {
      const index = CANDIDATES.indexOf(ch)
      if (index !== -1) current[index]++
    }
  }
  if (lines < sampleLines && current.some((n) => n > 0)) counts.forEach((list, index) => list.push(current[index]))
  let best = ','
  let bestScore = -1
  CANDIDATES.forEach((candidate, index) => {
    const list = counts[index]
    if (!list.length || list[0] === 0) return
    const consistent = list.every((n) => n === list[0])
    const total = list.reduce((sum, n) => sum + n, 0)
    const score = (consistent ? 1e6 : 0) + total
    if (score > bestScore) {
      best = candidate
      bestScore = score
    }
  })
  return best
}

// Returns { rows, delimiter, error }. Handles quoted fields, "" escapes, delimiters and line breaks
// inside quotes, CRLF/LF/CR line endings, a leading BOM and a trailing newline.
export function parseCsv(text, { delimiter = 'auto' } = {}) {
  const source = stripBom(String(text ?? ''))
  const sep = delimiter === 'auto' ? detectDelimiter(source) : delimiter
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let quotedStartLine = 0
  let line = 1
  let error = null
  let i = 0
  const n = source.length
  const endField = () => {
    row.push(field)
    field = ''
  }
  const endRow = () => {
    endField()
    rows.push(row)
    row = []
  }
  while (i < n) {
    const ch = source[i]
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i++
        continue
      }
      if (ch === '\n') line++
      field += ch
      i++
      continue
    }
    if (ch === '"' && field === '') {
      inQuotes = true
      quotedStartLine = line
      i++
      continue
    }
    if (ch === sep) {
      endField()
      i++
      continue
    }
    if (ch === '\r' || ch === '\n') {
      endRow()
      i += ch === '\r' && source[i + 1] === '\n' ? 2 : 1
      line++
      continue
    }
    // A quote in the middle of an unquoted field is kept literally (lenient, like most spreadsheets).
    field += ch
    i++
  }
  if (inQuotes) error = { message: `Unclosed quote starting on line ${quotedStartLine}. Every opening " needs a closing ".`, line: quotedStartLine }
  if (field !== '' || row.length > 0) endRow()
  return { rows, delimiter: sep, error }
}

const needsQuotes = (value, sep) => value.includes(sep) || value.includes('"') || value.includes('\n') || value.includes('\r') || /^\s|\s$/.test(value)

export function escapeCsvField(value, sep = ',') {
  const text = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
  return needsQuotes(text, sep) ? `"${text.replace(/"/g, '""')}"` : text
}

export function toCsv(rows, { delimiter = ',', newline = '\r\n' } = {}) {
  return rows.map((row) => row.map((cell) => escapeCsvField(cell, delimiter)).join(delimiter)).join(newline)
}

// { user: { name: 'Ada' }, tags: ['a', 'b'] } -> { 'user.name': 'Ada', 'tags.0': 'a', 'tags.1': 'b' }
export function flattenObject(value, prefix = '', out = {}) {
  if (value === null || typeof value !== 'object') {
    out[prefix || 'value'] = value
    return out
  }
  const entries = Array.isArray(value) ? value.map((child, index) => [String(index), child]) : Object.entries(value)
  if (entries.length === 0) {
    if (prefix) out[prefix] = Array.isArray(value) ? '[]' : '{}'
    return out
  }
  for (const [key, child] of entries) {
    const path = prefix ? `${prefix}.${key}` : key
    if (child !== null && typeof child === 'object') flattenObject(child, path, out)
    else out[path] = child
  }
  return out
}

// Reverse of flattenObject for CSV -> JSON: "user.name" becomes nested objects. Numeric segments stay
// object keys unless every key at that level is 0..n-1, in which case the level becomes an array.
export function unflattenObject(flat) {
  const root = {}
  for (const [path, value] of Object.entries(flat)) {
    const parts = path.split('.')
    let node = root
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        node[part] = value
      } else {
        if (node[part] === null || typeof node[part] !== 'object') node[part] = {}
        node = node[part]
      }
    })
  }
  const toArrays = (node) => {
    if (node === null || typeof node !== 'object') return node
    const keys = Object.keys(node)
    for (const key of keys) node[key] = toArrays(node[key])
    if (keys.length && keys.every((key, index) => key === String(index))) return keys.map((key) => node[key])
    return node
  }
  return toArrays(root)
}

export function jsonToCsv(input, { delimiter = ',', header = true, flatten = true } = {}) {
  let data
  try {
    data = JSON.parse(input)
  } catch (error) {
    return { ok: false, error: `Invalid JSON: ${error.message}` }
  }
  let records
  if (Array.isArray(data)) records = data
  else if (data !== null && typeof data === 'object') {
    // An object wrapping the array ({ "data": [...] }) is common in API responses: use the first array of objects.
    const nested = Object.values(data).find((value) => Array.isArray(value) && value.length && value.every((item) => item !== null && typeof item === 'object'))
    records = nested || [data]
  } else return { ok: false, error: 'Expected a JSON array of objects (or a single object).' }
  if (!records.length) return { ok: false, error: 'The array is empty, so there are no rows to convert.' }

  const flat = records.map((record) => {
    if (record === null || typeof record !== 'object') return { value: record }
    if (flatten) return flattenObject(record)
    if (Array.isArray(record)) return Object.fromEntries(record.map((value, index) => [String(index), value]))
    return record
  })
  const columns = []
  const seen = new Set()
  for (const record of flat) for (const key of Object.keys(record)) if (!seen.has(key)) {
    seen.add(key)
    columns.push(key)
  }
  const body = flat.map((record) => columns.map((column) => (record[column] === undefined ? '' : record[column])))
  const rows = header ? [columns, ...body] : body
  return { ok: true, output: toCsv(rows, { delimiter }), columns, rowCount: body.length }
}

const NUMBER = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/

export function inferValue(text) {
  if (text === '') return null
  if (text === 'true') return true
  if (text === 'false') return false
  if (text === 'null') return null
  // Keep values like 00123 (IDs, ZIP codes) and long integers as strings so nothing is lost.
  if (NUMBER.test(text)) {
    const number = Number(text)
    if (Number.isFinite(number) && (!/^-?\d+$/.test(text) || Number.isSafeInteger(number))) return number
  }
  return text
}

export function csvToJson(text, { delimiter = 'auto', header = true, inferTypes = true, nest = false, indent = 2 } = {}) {
  const parsed = parseCsv(text, { delimiter })
  if (parsed.error) return { ok: false, error: parsed.error.message }
  const rows = parsed.rows.filter((row) => !(row.length === 1 && row[0] === ''))
  if (!rows.length) return { ok: false, error: 'No rows found.' }
  const convert = (value) => (inferTypes ? inferValue(value) : value)
  let data
  let columns
  if (header) {
    const used = new Map()
    columns = rows[0].map((name, index) => {
      const base = name.trim() || `column${index + 1}`
      const count = used.get(base) || 0
      used.set(base, count + 1)
      return count ? `${base}_${count + 1}` : base
    })
    data = rows.slice(1).map((row) => {
      const record = {}
      columns.forEach((column, index) => {
        record[column] = convert(row[index] ?? '')
      })
      // Extra cells beyond the header are kept rather than silently dropped.
      for (let index = columns.length; index < row.length; index++) record[`column${index + 1}`] = convert(row[index])
      return nest ? unflattenObject(record) : record
    })
  } else {
    columns = []
    data = rows.map((row) => row.map(convert))
  }
  return { ok: true, value: data, output: JSON.stringify(data, null, indent === 'tab' ? '\t' : indent), delimiter: parsed.delimiter, rowCount: data.length, columns }
}

// Per-column stats for the viewer: filled/empty counts, unique values, numeric min/max when every
// non-empty value is a number.
export function columnStats(rows, columnIndex) {
  let empty = 0
  let numeric = 0
  let min = Infinity
  let max = -Infinity
  let sum = 0
  const unique = new Set()
  for (const row of rows) {
    const raw = row[columnIndex] ?? ''
    const value = raw.trim()
    if (value === '') {
      empty++
      continue
    }
    unique.add(value)
    const number = parseNumber(value)
    if (number !== null) {
      numeric++
      sum += number
      if (number < min) min = number
      if (number > max) max = number
    }
  }
  const filled = rows.length - empty
  const isNumeric = filled > 0 && numeric === filled
  return { count: rows.length, filled, empty, unique: unique.size, isNumeric, min: isNumeric ? min : null, max: isNumeric ? max : null, mean: isNumeric ? sum / filled : null }
}

// Accepts plain numbers, thousands separators (1,234.5) and a leading currency sign or trailing %.
export function parseNumber(text) {
  const cleaned = text.replace(/^[$€£¥]/, '').replace(/%$/, '').replace(/,(?=\d{3}(\D|$))/g, '')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(cleaned)) return null
  const number = Number(cleaned)
  return Number.isFinite(number) ? number : null
}

const collator = typeof Intl !== 'undefined' ? new Intl.Collator('en', { numeric: true, sensitivity: 'base' }) : null

// Numbers sort numerically, everything else with a natural-order collator; empty cells always last.
export function compareCells(a = '', b = '') {
  const aEmpty = a.trim() === ''
  const bEmpty = b.trim() === ''
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1
  const an = parseNumber(a.trim())
  const bn = parseNumber(b.trim())
  if (an !== null && bn !== null) return an - bn
  return collator ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0
}
