// A small tokenizer-based SQL formatter and minifier. It never rewrites strings, quoted identifiers,
// or comments: only keyword case and whitespace between tokens change.

const KEYWORDS = new Set(`
ADD ALL ALTER AND ANY AS ASC BETWEEN BY CASCADE CASE CAST CHECK COLLATE COLUMN CONFLICT CONSTRAINT CREATE CROSS CURRENT_DATE
CURRENT_TIME CURRENT_TIMESTAMP DATABASE DEFAULT DELETE DESC DISTINCT DO DROP ELSE END ESCAPE EXCEPT EXISTS EXPLAIN FALSE FETCH FIRST
FOREIGN FROM FULL GROUP HAVING IF ILIKE IN INDEX INNER INSERT INTERSECT INTERVAL INTO IS JOIN KEY LATERAL LEFT LIKE LIMIT NATURAL
NEXT NOT NOTHING NULL NULLS OFFSET ON ONLY OR ORDER OUTER OVER PARTITION PRIMARY RECURSIVE REFERENCES REPLACE RETURNING RIGHT ROW
ROWS SELECT SET TABLE THEN TO TOP TRUE TRUNCATE UNION UNIQUE UPDATE USING VALUES VIEW WHEN WHERE WINDOW WITH
`.trim().split(/\s+/))

// Functions get their case normalised too, and never get a space before their parenthesis.
const FUNCTIONS = new Set(`
ABS AVG CEIL CEILING COALESCE CONCAT COUNT DATE DATE_TRUNC DENSE_RANK EXTRACT FLOOR GREATEST IFNULL LAG LEAD LEAST LENGTH LOWER
MAX MIN NOW NULLIF RANK ROUND ROW_NUMBER STRING_AGG SUBSTRING SUM TRIM UPPER JSON_AGG ARRAY_AGG
`.trim().split(/\s+/))

// Multi-word keywords, matched greedily on consecutive words.
const PHRASES = [
  'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'INNER JOIN', 'CROSS JOIN',
  'NATURAL JOIN', 'GROUP BY', 'ORDER BY', 'PARTITION BY', 'INSERT INTO', 'DELETE FROM', 'UNION ALL', 'ON CONFLICT', 'DO UPDATE SET',
  'DO NOTHING', 'IS NOT', 'NOT IN', 'NOT EXISTS', 'NOT LIKE', 'INSERT IGNORE INTO', 'REPLACE INTO', 'WITH RECURSIVE',
].map((phrase) => phrase.split(' '))

// Clauses that start a new line. "list" clauses put their items on indented lines, one per comma;
// "inline" clauses keep their content on the same line.
const CLAUSES = {
  SELECT: 'list', FROM: 'list', WHERE: 'list', 'GROUP BY': 'list', 'ORDER BY': 'list', HAVING: 'list', SET: 'list', VALUES: 'list',
  RETURNING: 'list', WINDOW: 'list', 'DO UPDATE SET': 'list',
  LIMIT: 'inline', OFFSET: 'inline', FETCH: 'inline', UNION: 'inline', 'UNION ALL': 'inline', INTERSECT: 'inline', EXCEPT: 'inline',
  'INSERT INTO': 'inline', 'INSERT IGNORE INTO': 'inline', 'REPLACE INTO': 'inline', UPDATE: 'inline', 'DELETE FROM': 'inline',
  WITH: 'inline', 'WITH RECURSIVE': 'inline', 'ON CONFLICT': 'inline', 'DO NOTHING': 'inline',
  JOIN: 'inline', 'LEFT JOIN': 'inline', 'RIGHT JOIN': 'inline', 'FULL JOIN': 'inline', 'INNER JOIN': 'inline', 'CROSS JOIN': 'inline',
  'NATURAL JOIN': 'inline', 'LEFT OUTER JOIN': 'inline', 'RIGHT OUTER JOIN': 'inline', 'FULL OUTER JOIN': 'inline',
}

// Set operators sit on their own line between the two queries.
const SET_OPERATORS = new Set(['UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT'])

export function tokenize(sql) {
  const tokens = []
  let i = 0
  const n = sql.length
  const push = (type, value) => tokens.push({ type, value })
  while (i < n) {
    const ch = sql[i]
    const next = sql[i + 1]
    if (/\s/.test(ch)) {
      let j = i + 1
      while (j < n && /\s/.test(sql[j])) j++
      push('space', sql.slice(i, j))
      i = j
    } else if (ch === '-' && next === '-') {
      let j = sql.indexOf('\n', i)
      if (j === -1) j = n
      push('line-comment', sql.slice(i, j).replace(/\s+$/, ''))
      i = j
    } else if (ch === '#' && (i === 0 || /\s/.test(sql[i - 1])) && next !== '{') {
      // MySQL-style # comment.
      let j = sql.indexOf('\n', i)
      if (j === -1) j = n
      push('line-comment', sql.slice(i, j).replace(/\s+$/, ''))
      i = j
    } else if (ch === '/' && next === '*') {
      let j = sql.indexOf('*/', i + 2)
      j = j === -1 ? n : j + 2
      push('block-comment', sql.slice(i, j))
      i = j
    } else if (ch === "'" || ((ch === 'E' || ch === 'e' || ch === 'N' || ch === 'n' || ch === 'X' || ch === 'x') && next === "'" && !/[\w$]/.test(sql[i - 1] || ''))) {
      // String literal; '' and backslash escapes stay inside it.
      let j = ch === "'" ? i + 1 : i + 2
      while (j < n) {
        if (sql[j] === '\\') j += 2
        else if (sql[j] === "'" && sql[j + 1] === "'") j += 2
        else if (sql[j] === "'") { j++; break }
        else j++
      }
      push('string', sql.slice(i, Math.min(j, n)))
      i = Math.min(j, n)
    } else if (ch === '"' || ch === '`') {
      let j = i + 1
      while (j < n) {
        if (sql[j] === ch && sql[j + 1] === ch) j += 2
        else if (sql[j] === ch) { j++; break }
        else j++
      }
      push('identifier', sql.slice(i, Math.min(j, n)))
      i = Math.min(j, n)
    } else if (ch === '[' && /^\[[^\]\s,()]+(?: [^\]\s,()]+)*\]/.test(sql.slice(i, i + 130))) {
      // SQL Server [bracketed identifier].
      const j = sql.indexOf(']', i) + 1
      push('identifier', sql.slice(i, j))
      i = j
    } else if (ch === '$' && /^\$(\w*)\$/.test(sql.slice(i))) {
      // PostgreSQL dollar-quoted string: $$…$$ or $tag$…$tag$.
      const tag = /^\$(\w*)\$/.exec(sql.slice(i))[0]
      if (/^\$\d+\$/.test(tag)) {
        push('word', tag.slice(0, -1))
        i += tag.length - 1
      } else {
        let j = sql.indexOf(tag, i + tag.length)
        j = j === -1 ? n : j + tag.length
        push('string', sql.slice(i, j))
        i = j
      }
    } else if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(next || ''))) {
      const match = /^(?:0x[0-9a-f]+|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)/i.exec(sql.slice(i))
      push('number', match[0])
      i += match[0].length
    } else if (/[A-Za-z_\u0080-￿@$]/.test(ch) || (ch === ':' && /[A-Za-z_]/.test(next || '') && sql[i - 1] !== ':')) {
      // Words, @variables, $1 / :name placeholders.
      let j = i + 1
      while (j < n && /[\w$@#\u0080-￿]/.test(sql[j])) j++
      push('word', sql.slice(i, j))
      i = j
    } else if ('(),;.'.includes(ch)) {
      push(ch, ch)
      i++
    } else if (ch === '?') {
      push('word', ch)
      i++
    } else {
      // Operators: a run of operator characters, split so -- and /* never form inside it.
      let j = i + 1
      while (j < n && /[<>=!|&+\-*/%^~:]/.test(sql[j]) && !(sql[j] === '-' && sql[j + 1] === '-') && !(sql[j] === '/' && sql[j + 1] === '*')) j++
      push('operator', sql.slice(i, j))
      i = j
    }
  }
  return tokens
}


// Merges multi-word keywords into single tokens and tags keywords and functions.
function classify(tokens, keywordCase) {
  const out = []
  const meaningful = tokens.filter((token) => token.type !== 'space')
  const caseOf = (value) => (keywordCase === 'upper' ? value.toUpperCase() : keywordCase === 'lower' ? value.toLowerCase() : value)
  for (let i = 0; i < meaningful.length; i++) {
    const token = meaningful[i]
    if (token.type === 'word') {
      const upper = token.value.toUpperCase()
      const prev = out[out.length - 1]
      // A word right after a dot is a column or table name (t.order), never a keyword.
      if (prev?.type === '.') {
        out.push(token)
        continue
      }
      let phrase = null
      for (const candidate of PHRASES) {
        if (candidate.every((part, k) => meaningful[i + k]?.type === 'word' && meaningful[i + k].value.toUpperCase() === part)) {
          phrase = candidate
          break
        }
      }
      if (phrase) {
        const original = meaningful.slice(i, i + phrase.length).map((part) => part.value).join(' ')
        out.push({ type: 'keyword', key: phrase.join(' '), value: caseOf(original) })
        i += phrase.length - 1
      } else if (KEYWORDS.has(upper) && meaningful[i + 1]?.type !== '.') {
        out.push({ type: 'keyword', key: upper, value: caseOf(token.value) })
      } else if (FUNCTIONS.has(upper) && meaningful[i + 1]?.type === '(') {
        out.push({ type: 'function', key: upper, value: caseOf(token.value) })
      } else {
        out.push(token)
      }
    } else {
      out.push(token)
    }
  }
  return out
}

export function formatSql(sql, { indent = '  ', keywordCase = 'upper' } = {}) {
  const tokens = classify(tokenize(sql), keywordCase)
  const lines = []
  let line = ''
  let lineIndent = 0
  // Each block is one query level: `base` is the indent of its clause keywords.
  let block = { base: 0, clause: null, parens: [], list: false }
  const blocks = []
  let prev = null
  let afterInsertTarget = false
  let betweenPending = false

  const newline = (level) => {
    if (line.trim()) lines.push(indent.repeat(lineIndent) + line.trim())
    line = ''
    lineIndent = Math.max(0, level)
  }
  const write = (text, space) => {
    if (line && space && !/\s$/.test(line)) line += ' '
    line += text
  }
  const contentLevel = () => block.base + 1
  // Inline paren depth inside the current block (function calls, IN lists, VALUES rows).
  const inlineDepth = () => block.parens.length

  const needsSpace = (token) => {
    if (!prev || !line) return false
    if (prev.type === '(' || prev.type === '.') return false
    if (token.type === ',' || token.type === ')' || token.type === '.' || token.type === ';') return false
    if (token.type === '(') {
      if (prev.type === 'function') return false
      if (prev.type === 'word' || prev.type === 'identifier') return afterInsertTarget
      return true
    }
    if (prev.type === 'operator' && prev.value === '::') return false
    if (token.type === 'operator' && token.value === '::') return false
    return true
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    const nextToken = tokens[i + 1]

    if (token.type === 'line-comment') {
      write(token.value, true)
      newline(block.clause ? contentLevel() : block.base)
      prev = null
      continue
    }
    if (token.type === 'block-comment') {
      write(token.value, true)
      prev = token
      continue
    }

    if (token.type === 'keyword' && CLAUSES[token.key] && inlineDepth() === 0) {
      const kind = CLAUSES[token.key]
      if (SET_OPERATORS.has(token.key)) {
        newline(block.base)
        write(token.value)
        newline(block.base)
        block.clause = null
        block.list = false
        prev = null
        continue
      }
      newline(block.base)
      write(token.value)
      block.clause = token.key
      block.list = kind === 'list'
      afterInsertTarget = token.key.endsWith('INTO')
      if (block.list) newline(contentLevel())
      prev = token
      continue
    }

    if (token.type === 'keyword' && (token.key === 'AND' || token.key === 'OR') && inlineDepth() === 0 && !betweenPending && block.clause && block.clause !== 'SELECT') {
      newline(contentLevel())
      write(token.value)
      prev = token
      continue
    }
    if (token.type === 'keyword' && token.key === 'BETWEEN') betweenPending = true
    else if (token.type === 'keyword' && token.key === 'AND' && betweenPending) betweenPending = false

    if (token.type === '(') {
      const subquery = nextToken?.type === 'keyword' && (nextToken.key === 'SELECT' || nextToken.key === 'WITH' || nextToken.key === 'WITH RECURSIVE')
      write('(', needsSpace(token))
      afterInsertTarget = false
      if (subquery) {
        blocks.push(block)
        block = { base: lineIndent + 1, clause: null, parens: [], list: false }
        newline(block.base)
      } else {
        block.parens.push('(')
      }
      prev = token
      continue
    }

    if (token.type === ')') {
      if (block.parens.length) {
        block.parens.pop()
        write(')')
      } else if (blocks.length) {
        const closingLevel = block.base - 1
        block = blocks.pop()
        newline(closingLevel)
        write(')')
      } else {
        write(')')
      }
      prev = token
      continue
    }

    if (token.type === ',') {
      write(',')
      if (block.list && inlineDepth() === 0) newline(contentLevel())
      prev = token
      continue
    }

    if (token.type === ';') {
      write(';')
      newline(0)
      lines.push('')
      blocks.length = 0
      block = { base: 0, clause: null, parens: [], list: false }
      prev = null
      continue
    }

    write(token.value, needsSpace(token))
    prev = token
  }
  newline(0)
  while (lines.length && lines[lines.length - 1] === '') lines.pop()
  return lines.join('\n')
}

// Collapses whitespace and drops comments (keeping /*! … */ and /*+ … */ optimizer hints).
export function minifySql(sql, { keywordCase = 'preserve' } = {}) {
  const tokens = classify(tokenize(sql), keywordCase).filter((token) => token.type !== 'line-comment' && !(token.type === 'block-comment' && !/^\/\*[!+]/.test(token.value)))
  const tight = (token) => ['(', ')', ',', ';', '.'].includes(token.type) || (token.type === 'operator' && token.value === '::')
  let out = ''
  let prev = null
  for (const token of tokens) {
    // One space between tokens, none around punctuation. Two operators always keep a space so
    // "a - -1" can never become the comment opener "--".
    let space = Boolean(prev) && !tight(token) && !tight(prev)
    if (prev) {
      const wordy = (t) => ['word', 'number', 'string', 'identifier', 'keyword', 'function', 'block-comment'].includes(t.type)
      if (prev.type === 'operator' || token.type === 'operator') {
        space = (prev.type === 'operator' && token.type === 'operator') || (prev.type === 'operator' && token.value.startsWith(':')) || prev.type === 'keyword' || token.type === 'keyword'
      }
      if (prev.type === ')' && wordy(token)) space = true
      if (token.type === '(') space = prev.type === 'keyword'
    }
    out += (space ? ' ' : '') + token.value
    prev = token
  }
  return out
}

export function sqlStats(sql) {
  let statements = 0
  let comments = 0
  let content = false
  for (const token of tokenize(sql)) {
    if (token.type.endsWith('comment')) comments++
    else if (token.type === ';') {
      if (content) statements++
      content = false
    } else if (token.type !== 'space') content = true
  }
  if (content) statements++
  return { statements, comments }
}
