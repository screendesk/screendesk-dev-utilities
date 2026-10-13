// Line diff for the diff checker: Myers' O(ND) algorithm over line ids, after trimming the common
// prefix and suffix. Inputs are capped so a paste of two unrelated large files can't freeze the tab.

export const MAX_LINES = 20000
export const MAX_EDITS = 3000

export function splitLines(text) {
  if (text === '') return []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  // A trailing newline doesn't add an empty last line.
  if (lines[lines.length - 1] === '') lines.pop()
  return lines
}

function normalizer({ ignoreWhitespace, ignoreCase }) {
  return (line) => {
    let key = line
    if (ignoreWhitespace) key = key.replace(/\s+/g, '')
    if (ignoreCase) key = key.toLowerCase()
    return key
  }
}

// Myers shortest edit script between two arrays of integers. Returns ops of 'equal' | 'delete' | 'insert'
// with indexes into a and b, or null when the edit distance exceeds maxEdits.
function myers(a, b, maxEdits) {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max + 1
  const v = new Int32Array(2 * max + 3)
  const trace = []
  let found = -1

  outer: for (let d = 0; d <= max; d++) {
    if (d > maxEdits) return null
    // Snapshot of k in [-(d+1), d+1] before this round, for backtracking.
    trace.push(v.slice(offset - d - 1, offset + d + 2))
    for (let k = -d; k <= d; k += 2) {
      let x = k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1]) ? v[offset + k + 1] : v[offset + k - 1] + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[offset + k] = x
      if (x >= n && y >= m) {
        found = d
        break outer
      }
    }
  }

  const ops = []
  let x = n
  let y = m
  for (let d = found; d >= 0; d--) {
    const snapshot = trace[d]
    const get = (k) => snapshot[k + d + 1]
    const k = x - y
    const prevK = k === -d || (k !== d && get(k - 1) < get(k + 1)) ? k + 1 : k - 1
    const prevX = get(prevK)
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', a: x - 1, b: y - 1 })
      x--
      y--
    }
    if (d > 0) {
      if (x === prevX) ops.push({ type: 'insert', b: y - 1 })
      else ops.push({ type: 'delete', a: x - 1 })
    }
    x = prevX
    y = prevY
  }
  return ops.reverse()
}

// Diff two texts line by line. Returns { ok, ops, added, removed, unchanged } where each op is
// { type, aLine?, bLine?, text } with 1-based line numbers, or { ok: false, error }.
export function diffLines(original, changed, options = {}) {
  const left = splitLines(original)
  const right = splitLines(changed)
  if (left.length > MAX_LINES || right.length > MAX_LINES) {
    return { ok: false, error: `Each side is limited to ${MAX_LINES.toLocaleString('en-US')} lines.` }
  }
  const key = normalizer(options)
  const ids = new Map()
  const toId = (line) => {
    const k = key(line)
    let id = ids.get(k)
    if (id === undefined) {
      id = ids.size
      ids.set(k, id)
    }
    return id
  }
  const a = left.map(toId)
  const b = right.map(toId)

  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length
  let endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }

  const middle = myers(a.slice(start, endA), b.slice(start, endB), MAX_EDITS)
  if (!middle) return { ok: false, error: 'These texts are too different to compare line by line here. Try comparing smaller sections.' }

  const ops = []
  for (let i = 0; i < start; i++) ops.push({ type: 'equal', aLine: i + 1, bLine: i + 1, text: right[i], aText: left[i] })
  for (const op of middle) {
    if (op.type === 'equal') ops.push({ type: 'equal', aLine: start + op.a + 1, bLine: start + op.b + 1, text: right[start + op.b], aText: left[start + op.a] })
    else if (op.type === 'delete') ops.push({ type: 'delete', aLine: start + op.a + 1, text: left[start + op.a] })
    else ops.push({ type: 'insert', bLine: start + op.b + 1, text: right[start + op.b] })
  }
  for (let i = 0; i < a.length - endA; i++) {
    ops.push({ type: 'equal', aLine: endA + i + 1, bLine: endB + i + 1, text: right[endB + i], aText: left[endA + i] })
  }

  let added = 0
  let removed = 0
  for (const op of ops) {
    if (op.type === 'insert') added++
    else if (op.type === 'delete') removed++
  }
  return { ok: true, ops, added, removed, unchanged: ops.length - added - removed }
}

// Side-by-side rows: runs of deletions are paired with the insertions that follow them.
// Row: { type: 'equal' | 'change' | 'delete' | 'insert', left?: { line, text }, right?: { line, text } }
export function toSplitRows(ops) {
  const rows = []
  let i = 0
  while (i < ops.length) {
    const op = ops[i]
    if (op.type === 'equal') {
      rows.push({ type: 'equal', left: { line: op.aLine, text: op.aText ?? op.text }, right: { line: op.bLine, text: op.text } })
      i++
      continue
    }
    const deletes = []
    const inserts = []
    while (i < ops.length && ops[i].type === 'delete') deletes.push(ops[i++])
    while (i < ops.length && ops[i].type === 'insert') inserts.push(ops[i++])
    const count = Math.max(deletes.length, inserts.length)
    for (let j = 0; j < count; j++) {
      const del = deletes[j]
      const ins = inserts[j]
      rows.push({
        type: del && ins ? 'change' : del ? 'delete' : 'insert',
        left: del ? { line: del.aLine, text: del.text } : null,
        right: ins ? { line: ins.bLine, text: ins.text } : null,
      })
    }
  }
  return rows
}

// Collapse long runs of unchanged items, keeping `context` items around each change.
// Returns items plus { type: 'skip', count } markers.
export function collapseUnchanged(items, context = 3) {
  const changed = items.map((item) => item.type !== 'equal')
  const keep = new Array(items.length).fill(false)
  changed.forEach((isChanged, index) => {
    if (!isChanged) return
    for (let j = Math.max(0, index - context); j <= Math.min(items.length - 1, index + context); j++) keep[j] = true
  })
  const result = []
  let skipped = 0
  items.forEach((item, index) => {
    if (keep[index]) {
      if (skipped) result.push({ type: 'skip', count: skipped })
      skipped = 0
      result.push(item)
    } else skipped++
  })
  if (skipped) result.push({ type: 'skip', count: skipped })
  return result
}

// A standard unified diff (like `diff -u`), for copying into a ticket or PR comment.
export function toUnifiedText(ops, { context = 3, fromName = 'original', toName = 'changed' } = {}) {
  if (!ops.some((op) => op.type !== 'equal')) return ''
  const lines = [`--- ${fromName}`, `+++ ${toName}`]
  // Group changes into hunks separated by more than 2 * context unchanged lines.
  let i = 0
  while (i < ops.length) {
    while (i < ops.length && ops[i].type === 'equal') i++
    if (i >= ops.length) break
    const hunkStart = Math.max(0, i - context)
    let end = i
    for (;;) {
      while (end < ops.length && ops[end].type !== 'equal') end++
      let run = 0
      while (end + run < ops.length && ops[end + run].type === 'equal') run++
      if (end + run >= ops.length || run > context * 2) {
        end = Math.min(ops.length, end + Math.min(run, context))
        break
      }
      end += run
    }
    const hunk = ops.slice(hunkStart, end)
    // Line numbers in each file at the start of the hunk.
    let aStart = 1
    let bStart = 1
    for (let j = 0; j < hunkStart; j++) {
      if (ops[j].type !== 'insert') aStart++
      if (ops[j].type !== 'delete') bStart++
    }
    const aCount = hunk.filter((op) => op.type !== 'insert').length
    const bCount = hunk.filter((op) => op.type !== 'delete').length
    lines.push(`@@ -${aCount ? aStart : aStart - 1},${aCount} +${bCount ? bStart : bStart - 1},${bCount} @@`)
    for (const op of hunk) lines.push(`${op.type === 'insert' ? '+' : op.type === 'delete' ? '-' : ' '}${op.type === 'equal' ? op.aText ?? op.text : op.text}`)
    i = end
  }
  return lines.join('\n')
}
