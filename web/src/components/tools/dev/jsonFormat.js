// JSON formatting and validation helpers for the JSON formatter and the diff checker.
// JSON.parse does the parsing; when it fails, a small strict scanner finds the error position,
// because browsers word (and position) parse errors differently.

const WHITESPACE = ' \t\n\r'

function describe(char) {
  if (char === undefined) return 'end of input'
  if (char === '\n') return 'a line break'
  if (char === '\t') return 'a tab'
  return `"${char}"`
}

// Returns null when the text is valid JSON, otherwise { message, position, hint }.
export function locateJsonError(text) {
  let i = 0
  const n = text.length
  const fail = (message, position = i, hint) => {
    throw { message, position, hint }
  }

  const ws = () => {
    while (i < n && WHITESPACE.includes(text[i])) i++
  }

  const unexpected = () => {
    const c = text[i]
    if (c === undefined) fail('Unexpected end of input', i, 'The JSON is incomplete. Check for a missing closing bracket, brace, or quote.')
    if (c === "'") fail('Unexpected single quote', i, 'JSON strings and property names must use double quotes, not single quotes.')
    if (c === '/') fail('Unexpected "/"', i, 'JSON does not allow comments. Remove // and /* */ comments.')
    if (/[A-Za-z_$]/.test(c)) {
      const word = /[A-Za-z_$][\w$]*/y
      word.lastIndex = i
      const token = word.exec(text)[0]
      const hints = {
        True: 'JSON booleans are lowercase: true / false.',
        False: 'JSON booleans are lowercase: true / false.',
        None: 'Use null instead of None.',
        NULL: 'Use lowercase null.',
        Null: 'Use lowercase null.',
        undefined: 'undefined is not valid JSON. Use null or remove the property.',
        NaN: 'NaN is not valid JSON. Use null or a number.',
        Infinity: 'Infinity is not valid JSON. Use null or a number.',
      }
      fail(`Unexpected token "${token}"`, i, hints[token] || 'Values must be strings in double quotes, numbers, true, false, null, objects, or arrays.')
    }
    fail(`Unexpected character ${describe(c)}`)
  }

  const string = () => {
    const start = i
    i++
    while (i < n) {
      const c = text[i]
      if (c === '"') {
        i++
        return
      }
      if (c === '\\') {
        const next = text[i + 1]
        if (next === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail('Invalid unicode escape', i, 'Use \\u followed by exactly four hex digits.')
          i += 6
          continue
        }
        if (next === undefined || !'"\\/bfnrt'.includes(next)) fail(`Invalid escape sequence "\\${next ?? ''}"`, i, 'Valid escapes are \\" \\\\ \\/ \\b \\f \\n \\r \\t and \\uXXXX.')
        i += 2
        continue
      }
      if (c.charCodeAt(0) < 0x20) fail(`Unescaped ${c === '\n' ? 'line break' : 'control character'} in string`, i, 'Strings cannot span lines. Escape line breaks as \\n and tabs as \\t.')
      i++
    }
    fail('Unterminated string', start, 'A string is missing its closing double quote.')
  }

  const number = () => {
    const re = /-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/y
    re.lastIndex = i
    const match = re.exec(text)
    if (!match) fail('Invalid number', i, 'Numbers cannot have a leading +, a leading or trailing decimal point, or be hex.')
    i += match[0].length
    if (/[0-9.xXeE]/.test(text[i] || '')) fail('Invalid number', i, 'Numbers cannot have leading zeros, a trailing decimal point, or be hex.')
  }

  const literal = (word) => {
    if (text.startsWith(word, i)) i += word.length
    else unexpected()
  }

  const container = (close, isObject) => {
    i++
    ws()
    if (text[i] === close) {
      i++
      return
    }
    for (;;) {
      ws()
      if (isObject) {
        if (text[i] !== '"') {
          if (text[i] === "'") unexpected()
          if (text[i] !== undefined && /[A-Za-z_$]/.test(text[i])) fail('Expected a double-quoted property name', i, 'Property names must be wrapped in double quotes, e.g. {"name": 1}.')
          if (text[i] === undefined) unexpected()
          fail(`Expected a double-quoted property name but found ${describe(text[i])}`)
        }
        string()
        ws()
        if (text[i] !== ':') fail(`Expected ":" after property name but found ${describe(text[i])}`)
        i++
      }
      value()
      ws()
      if (text[i] === ',') {
        const comma = i
        i++
        ws()
        if (text[i] === close) fail(`Trailing comma before "${close}"`, comma, 'JSON does not allow a comma after the last item. Remove it.')
        continue
      }
      if (text[i] === close) {
        i++
        return
      }
      if (text[i] === undefined) fail(`Unexpected end of input, missing "${close}"`, i, 'The JSON is incomplete. Check for a missing closing bracket or brace.')
      fail(`Expected "," or "${close}" but found ${describe(text[i])}`, i, 'Check for a missing comma between items or a missing closing bracket.')
    }
  }

  function value() {
    ws()
    const c = text[i]
    if (c === '{') return container('}', true)
    if (c === '[') return container(']', false)
    if (c === '"') return string()
    if (c === '-' || (c >= '0' && c <= '9')) return number()
    if (c === 't') return literal('true')
    if (c === 'f') return literal('false')
    if (c === 'n') return literal('null')
    return unexpected()
  }

  try {
    ws()
    if (i >= n) fail('Input is empty')
    value()
    ws()
    if (i < n) fail(`Unexpected ${describe(text[i])} after the JSON value`, i, 'There is extra content after the end of the JSON. Check for a stray bracket, or several JSON documents pasted together.')
    return null
  } catch (error) {
    if (error && typeof error.position === 'number') return error
    throw error
  }
}

export function positionToLineColumn(text, position) {
  const before = text.slice(0, position)
  const line = before.split('\n').length
  const column = position - before.lastIndexOf('\n')
  return { line, column }
}

export function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
      .reduce((sorted, key) => {
        sorted[key] = sortKeysDeep(value[key])
        return sorted
      }, {})
  }
  return value
}

export function jsonStats(value) {
  let keys = 0
  let nodes = 0
  let depth = 0
  const walk = (node, level) => {
    nodes++
    depth = Math.max(depth, level)
    if (Array.isArray(node)) node.forEach((child) => walk(child, level + 1))
    else if (node && typeof node === 'object') {
      for (const key of Object.keys(node)) {
        keys++
        walk(node[key], level + 1)
      }
    }
  }
  walk(value, 0)
  return { keys, nodes, depth }
}

export function jsonType(value) {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

// Parse JSON. Returns { ok: true, value } or { ok: false, error: { message, line, column, position, hint } }.
export function parseJson(input) {
  const text = input.replace(/^\uFEFF/, '')
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (parseError) {
    const located = locateJsonError(text)
    if (!located) return { ok: false, error: { message: parseError.message, line: null, column: null, position: null } }
    return { ok: false, error: { ...located, ...positionToLineColumn(text, located.position) } }
  }
}

// indent: 2 | 4 | 'tab'. minify ignores indent.
export function formatJson(input, { indent = 2, sortKeys = false, minify = false } = {}) {
  const parsed = parseJson(input)
  if (!parsed.ok) return parsed
  const value = sortKeys ? sortKeysDeep(parsed.value) : parsed.value
  const space = minify ? undefined : indent === 'tab' ? '\t' : Number(indent)
  return { ok: true, value, output: JSON.stringify(value, null, space) }
}
