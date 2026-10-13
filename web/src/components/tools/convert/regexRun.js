// Regex matching for the regex tester. The core is kept as a plain-JavaScript string so the exact same
// code runs inside a Blob Web Worker (where a runaway pattern can be terminated) without depending on
// how the bundler transpiles module code. Written in ES5-style syntax on purpose.

export const MAX_MATCHES = 5000

export const REGEX_CORE = `
function runRegex(data) {
  var source = data.source, flags = data.flags, text = data.text;
  var maxMatches = data.maxMatches || 5000;
  var re;
  try {
    re = new RegExp(source, flags);
  } catch (error) {
    return { id: data.id, error: String(error && error.message || error) };
  }
  // Ask for group indices with the d flag when the engine supports it.
  var indexed = re;
  if (flags.indexOf('d') === -1) {
    try { indexed = new RegExp(source, flags + 'd'); } catch (e) { indexed = re; }
  }
  var unicode = flags.indexOf('u') !== -1 || flags.indexOf('v') !== -1;
  var loop = flags.indexOf('g') !== -1;
  var matches = [];
  var truncated = false;
  indexed.lastIndex = 0;
  while (true) {
    var m = indexed.exec(text);
    if (!m) break;
    var groups = [];
    for (var i = 1; i < m.length; i++) {
      var span = m.indices && m.indices[i] ? [m.indices[i][0], m.indices[i][1]] : null;
      groups.push({ index: i, value: m[i] === undefined ? null : m[i], span: span });
    }
    var named = null;
    if (m.groups) {
      named = [];
      for (var key in m.groups) {
        if (Object.prototype.hasOwnProperty.call(m.groups, key)) {
          var nspan = m.indices && m.indices.groups && m.indices.groups[key] ? [m.indices.groups[key][0], m.indices.groups[key][1]] : null;
          named.push({ name: key, value: m.groups[key] === undefined ? null : m.groups[key], span: nspan });
        }
      }
    }
    matches.push({ value: m[0], start: m.index, end: m.index + m[0].length, groups: groups, named: named });
    if (!loop) break;
    if (matches.length >= maxMatches) { truncated = true; break; }
    // Zero-width match: step past it (by a whole code point in unicode mode) to avoid an endless loop.
    if (m[0].length === 0) {
      var next = indexed.lastIndex + 1;
      if (unicode && next < text.length) {
        var code = text.charCodeAt(indexed.lastIndex);
        if (code >= 0xd800 && code <= 0xdbff) next++;
      }
      indexed.lastIndex = next;
      if (indexed.lastIndex > text.length) break;
    }
  }
  var replaced = null;
  if (typeof data.replacement === 'string') {
    re.lastIndex = 0;
    replaced = text.replace(re, data.replacement);
  }
  return { id: data.id, matches: matches, truncated: truncated, replaced: replaced };
}
`

export const WORKER_SOURCE = `${REGEX_CORE}
self.onmessage = function (event) {
  var result;
  try { result = runRegex(event.data); } catch (error) { result = { id: event.data.id, error: String(error && error.message || error) }; }
  self.postMessage(result);
};
`

// Synchronous version of the same core, for unit tests and browsers without Worker support.
export function runRegexSync(data) {
  // eslint-disable-next-line no-new-func
  const fn = new Function(`${REGEX_CORE}\nreturn runRegex;`)()
  return fn(data)
}

// Runs patterns in a worker with a time limit. A pattern that exceeds it (catastrophic backtracking)
// gets the worker terminated and recreated on the next run, so the page never freezes.
export function createRegexRunner({ timeoutMs = 1000 } = {}) {
  let worker = null
  let url = null
  let seq = 0
  let pending = null

  const ensureWorker = () => {
    if (worker) return worker
    if (!url) url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))
    worker = new Worker(url)
    worker.onmessage = (event) => {
      if (pending && event.data.id === pending.id) {
        clearTimeout(pending.timer)
        const { resolve } = pending
        pending = null
        resolve(event.data)
      }
    }
    return worker
  }

  const kill = () => {
    if (worker) worker.terminate()
    worker = null
  }

  return {
    run(data) {
      if (typeof Worker === 'undefined') return Promise.resolve(runRegexSync(data))
      // A newer run supersedes an unfinished one.
      if (pending) {
        clearTimeout(pending.timer)
        pending.resolve({ id: pending.id, stale: true })
        pending = null
        kill()
      }
      const id = ++seq
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          pending = null
          kill()
          resolve({ id, timeout: true })
        }, timeoutMs)
        pending = { id, resolve, timer }
        ensureWorker().postMessage({ ...data, id, maxMatches: data.maxMatches || MAX_MATCHES })
      })
    },
    dispose() {
      if (pending) clearTimeout(pending.timer)
      pending = null
      kill()
      if (url) URL.revokeObjectURL(url)
      url = null
    },
  }
}

// Splits the text into plain and matched segments for highlighting (rendered as React spans).
export function highlightSegments(text, matches) {
  const segments = []
  let cursor = 0
  matches.forEach((match, index) => {
    if (match.start < cursor) return
    if (match.start > cursor) segments.push({ text: text.slice(cursor, match.start), match: -1 })
    if (match.end > match.start) segments.push({ text: text.slice(match.start, match.end), match: index })
    else segments.push({ text: '', match: index, empty: true })
    cursor = match.end
  })
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: -1 })
  return segments
}

export const FLAG_INFO = [
  { flag: 'g', name: 'global', copy: 'Find every match instead of stopping at the first.' },
  { flag: 'i', name: 'ignore case', copy: 'Letters match regardless of case.' },
  { flag: 'm', name: 'multiline', copy: '^ and $ match at the start and end of each line.' },
  { flag: 's', name: 'dotAll', copy: '. also matches line breaks.' },
  { flag: 'u', name: 'unicode', copy: 'Treat the pattern as code points; enables \\p{…} and \\u{…}.' },
  { flag: 'y', name: 'sticky', copy: 'Only match starting exactly at lastIndex.' },
]
