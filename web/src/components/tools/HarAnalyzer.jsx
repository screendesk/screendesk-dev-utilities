import { useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, DocumentTextIcon, LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'

const TOOL = 'har-file-analyzer'
const REDACTED = '[REDACTED]'
const PAGE_SIZE = 500
const BODY_PREVIEW = 20000
const MAX_FILE_BYTES = 500 * 1024 * 1024

const stat = 'text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums'
const cell = 'px-3 py-2 align-top'

const TYPES = [
  { id: 'all', label: 'All types' },
  { id: 'xhr', label: 'XHR / fetch' },
  { id: 'js', label: 'JavaScript' },
  { id: 'css', label: 'CSS' },
  { id: 'img', label: 'Images' },
  { id: 'doc', label: 'Documents' },
  { id: 'other', label: 'Other' },
]
const TYPE_LABELS = { xhr: 'Fetch/XHR', js: 'JS', css: 'CSS', img: 'Image', doc: 'Document', other: 'Other' }

const STATUSES = [
  { id: 'all', label: 'All' },
  { id: 'errors', label: 'Errors' },
  { id: '3xx', label: '3xx' },
  { id: '4xx', label: '4xx' },
  { id: '5xx', label: '5xx' },
]

const SORTS = [
  { id: 'order', label: 'Request order' },
  { id: 'time', label: 'Slowest first' },
  { id: 'size', label: 'Largest first' },
]

const PHASES = [
  { id: 'blocked', label: 'Blocked / queued', color: 'bg-zinc-300' },
  { id: 'dns', label: 'DNS lookup', color: 'bg-zinc-400' },
  { id: 'connect', label: 'Connect', color: 'bg-zinc-500' },
  { id: 'ssl', label: 'TLS handshake', color: 'bg-zinc-600' },
  { id: 'send', label: 'Request sent', color: 'bg-zinc-800' },
  { id: 'wait', label: 'Waiting (TTFB)', color: 'bg-rose-500' },
  { id: 'receive', label: 'Content download', color: 'bg-orange-400' },
]

// Headers whose whole value is a credential.
const AUTH_HEADERS = new Set(['authorization', 'proxy-authorization', 'x-api-key', 'x-auth-token', 'x-access-token', 'x-csrf-token', 'x-xsrf-token'])
const SENSITIVE_PARAMS = new Set(['token', 'access_token', 'refresh_token', 'id_token', 'api_key', 'apikey', 'key', 'password', 'passwd', 'pwd', 'session', 'sessionid', 'session_id', 'sid', 'code', 'secret', 'client_secret', 'auth', 'signature', 'sig'])

function isSensitiveParam(name) {
  const n = String(name || '').toLowerCase()
  return SENSITIVE_PARAMS.has(n) || /token|password|secret|session|api[-_]?key/.test(n)
}

function decodeName(raw) {
  try { return decodeURIComponent(raw.replace(/\+/g, ' ')) } catch (_) { return raw }
}

// Redacts sensitive `name=value` pairs in a query-style string. Returns [string, redactedCount].
function redactPairs(text) {
  let count = 0
  const out = text.split('&').map((pair) => {
    const eq = pair.indexOf('=')
    if (eq < 0) return pair
    const key = pair.slice(0, eq)
    if (!isSensitiveParam(decodeName(key)) || pair.slice(eq + 1) === REDACTED) return pair
    count += 1
    return `${key}=${REDACTED}`
  }).join('&')
  return [out, count]
}

function redactUrl(url) {
  if (typeof url !== 'string' || !/[?#]/.test(url)) return [url, 0]
  const hashAt = url.indexOf('#')
  let base = hashAt >= 0 ? url.slice(0, hashAt) : url
  let hash = hashAt >= 0 ? url.slice(hashAt + 1) : null
  let count = 0
  const q = base.indexOf('?')
  if (q >= 0) {
    const [query, n] = redactPairs(base.slice(q + 1))
    base = `${base.slice(0, q)}?${query}`
    count += n
  }
  if (hash && hash.includes('=')) {
    const [fragment, n] = redactPairs(hash)
    hash = fragment
    count += n
  }
  return [hash != null ? `${base}#${hash}` : base, count]
}

const redactCookieHeader = (value) => String(value).split(/;\s*/).map((part) => (part.includes('=') ? `${part.slice(0, part.indexOf('='))}=${REDACTED}` : part)).join('; ')
const redactSetCookie = (value) => String(value).split('\n').map((line) => line.replace(/^([^=;]*)=[^;]*/, `$1=${REDACTED}`)).join('\n')
const redactAuth = (value) => (/^\w+\s+\S/.test(String(value)) ? String(value).replace(/^(\w+\s+).*$/, `$1${REDACTED}`) : REDACTED)

// One walker for both scanning and sanitizing, so the counts always match what gets redacted.
function walkSensitive(log, redact) {
  const counts = { cookies: 0, setCookies: 0, auth: 0, params: 0, bodies: 0, requests: 0 }
  for (const entry of log.entries || []) {
    const req = entry.request || {}
    const res = entry.response || {}
    const before = counts.cookies + counts.setCookies + counts.auth + counts.params

    const [url, urlHits] = redactUrl(req.url)
    counts.params += urlHits
    if (redact) req.url = url
    for (const p of req.queryString || []) {
      if (isSensitiveParam(p.name) && redact) p.value = REDACTED
    }
    for (const h of req.headers || []) {
      const name = String(h.name || '').toLowerCase()
      if (name === 'cookie') {
        counts.cookies += 1
        if (redact) h.value = redactCookieHeader(h.value)
      } else if (AUTH_HEADERS.has(name)) {
        counts.auth += 1
        if (redact) h.value = redactAuth(h.value)
      } else if (name === 'referer' || name === 'origin') {
        const [ref, n] = redactUrl(h.value)
        counts.params += n
        if (redact) h.value = ref
      }
    }
    if (redact) for (const c of req.cookies || []) c.value = REDACTED
    const post = req.postData
    if (post) {
      for (const p of post.params || []) {
        if (isSensitiveParam(p.name)) {
          counts.params += 1
          if (redact) p.value = REDACTED
        }
      }
      if (typeof post.text === 'string' && /x-www-form-urlencoded/i.test(post.mimeType || '') && !(post.params || []).length) {
        const [text, n] = redactPairs(post.text)
        counts.params += n
        if (redact) post.text = text
      }
    }

    for (const h of res.headers || []) {
      const name = String(h.name || '').toLowerCase()
      if (name === 'set-cookie') {
        counts.setCookies += 1
        if (redact) h.value = redactSetCookie(h.value)
      } else if (name === 'location') {
        const [loc, n] = redactUrl(h.value)
        counts.params += n
        if (redact) h.value = loc
      }
    }
    if (redact) for (const c of res.cookies || []) c.value = REDACTED
    const [redirect, redirectHits] = redactUrl(res.redirectURL)
    counts.params += redirectHits
    if (redact && res.redirectURL) res.redirectURL = redirect

    if (res.content?.text || post?.text) counts.bodies += 1
    if (counts.cookies + counts.setCookies + counts.auth + counts.params > before) counts.requests += 1
  }
  return counts
}

function sanitizeHar(raw, stripBodies) {
  const copy = JSON.parse(JSON.stringify(raw))
  walkSensitive(copy.log, true)
  for (const page of copy.log.pages || []) {
    if (typeof page.title === 'string') page.title = redactUrl(page.title)[0]
  }
  if (stripBodies) {
    for (const entry of copy.log.entries || []) {
      if (entry.response?.content) {
        delete entry.response.content.text
        delete entry.response.content.encoding
      }
      if (entry.request?.postData?.text) entry.request.postData.text = REDACTED
    }
  }
  return copy
}

function classify(resourceType, mime, url) {
  const rt = String(resourceType || '').toLowerCase()
  if (rt === 'xhr' || rt === 'fetch') return 'xhr'
  if (rt === 'script') return 'js'
  if (rt === 'stylesheet') return 'css'
  if (rt === 'image') return 'img'
  if (rt === 'document') return 'doc'
  if (rt) return 'other'
  if (/javascript|ecmascript/.test(mime)) return 'js'
  if (mime === 'text/css') return 'css'
  if (mime.startsWith('image/')) return 'img'
  if (mime === 'text/html') return 'doc'
  if (/json|xml|text\/plain|event-stream/.test(mime)) return 'xhr'
  const ext = (url.split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i) || [])[1]?.toLowerCase()
  if (ext === 'js' || ext === 'mjs') return 'js'
  if (ext === 'css') return 'css'
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif', 'ico'].includes(ext)) return 'img'
  return 'other'
}

function transferSize(res) {
  if (typeof res._transferSize === 'number' && res._transferSize >= 0) return res._transferSize
  if (typeof res.bodySize === 'number' && res.bodySize >= 0) return res.bodySize + Math.max(Number(res.headersSize) || 0, 0)
  const size = Number(res.content?.size)
  return size > 0 ? size : 0
}

function phaseValue(timings, id) {
  const value = Number(timings?.[id])
  if (!(value > 0)) return 0
  // HAR includes the TLS time inside `connect`; show it as its own segment.
  if (id === 'connect') return Math.max(0, value - Math.max(Number(timings.ssl) || 0, 0))
  return value
}

function normalize(entry, index) {
  const req = entry.request || {}
  const res = entry.response || {}
  const url = String(req.url || '')
  let host = ''
  let path = url
  try {
    const parsed = new URL(url)
    host = parsed.host
    path = `${parsed.pathname}${parsed.search}` || '/'
  } catch (_) {}
  const mime = String(res.content?.mimeType || '').split(';')[0].trim().toLowerCase()
  const started = Date.parse(entry.startedDateTime)
  const summed = PHASES.reduce((sum, { id }) => sum + phaseValue(entry.timings, id), 0)
  const time = Number(entry.time) > 0 ? Number(entry.time) : summed
  return {
    index,
    method: String(req.method || 'GET').toUpperCase(),
    url,
    host,
    path,
    status: Number(res.status) || 0,
    statusText: res.statusText || '',
    error: res._error || '',
    mime,
    type: classify(entry._resourceType, mime, url),
    size: transferSize(res),
    time,
    wait: Number(entry.timings?.wait) > 0 ? Number(entry.timings.wait) : 0,
    start: Number.isFinite(started) ? started : null,
    entry,
    search: `${req.method} ${url} ${res.status} ${mime}`.toLowerCase(),
  }
}

function parseHar(text) {
  let data
  try {
    data = JSON.parse(text)
  } catch (_) {
    throw new Error('This file is not valid JSON. A HAR file is a JSON document; make sure you exported it with “Export HAR” or “Save all as HAR with content”.')
  }
  if (!data || typeof data !== 'object' || !data.log || !Array.isArray(data.log.entries)) {
    throw new Error('This JSON file is not a HAR file. A HAR file has a top-level “log” object with an “entries” array.')
  }
  return data
}

function formatBytes(bytes) {
  if (!(bytes > 0)) return '0 B'
  if (bytes < 1024) return `${Math.round(bytes)} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatMs(ms) {
  if (!(ms > 0)) return '0 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(2)} s`
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`
}

function statusTone(status) {
  if (status === 0 || status >= 500) return 'negative'
  if (status >= 400) return 'warning'
  if (status >= 300) return 'neutral'
  return 'positive'
}

function matchesStatus(status, filter) {
  if (filter === 'errors') return status === 0 || status >= 400
  if (filter === '3xx') return status >= 300 && status < 400
  if (filter === '4xx') return status >= 400 && status < 500
  if (filter === '5xx') return status >= 500
  return true
}

function decodeBody(content) {
  if (!content || typeof content.text !== 'string' || !content.text) return null
  let text = content.text
  if (content.encoding === 'base64') {
    const mime = String(content.mimeType || '')
    if (!/json|text|xml|javascript|html|css|svg|urlencoded/.test(mime)) return `[Binary content, ${formatBytes(content.size)}, base64 encoded]`
    try {
      const bytes = Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
      text = new TextDecoder().decode(bytes)
    } catch (_) {
      return '[Could not decode this base64 body]'
    }
  }
  return text
}

function preview(text) {
  if (text == null) return null
  let out = text
  if (out.length < 200000 && /^\s*[[{]/.test(out)) {
    try { out = JSON.stringify(JSON.parse(out), null, 2) } catch (_) {}
  }
  return out.length > BODY_PREVIEW ? `${out.slice(0, BODY_PREVIEW)}\n\n… truncated (${out.length.toLocaleString()} characters in total)` : out
}

// A small built-in example so people without a file can see what the analyzer shows.
function sampleHar() {
  const t0 = Date.parse('2026-01-15T10:00:00.000Z')
  const make = ({ offset, method = 'GET', url, status, type, mime, size, timings, reqHeaders = [], resHeaders = [], body, postData, error }) => ({
    startedDateTime: new Date(t0 + offset).toISOString(),
    time: Object.values(timings).filter((v) => v > 0).reduce((a, b) => a + b, 0) - (timings.ssl > 0 ? timings.ssl : 0),
    _resourceType: type,
    request: {
      method,
      url,
      httpVersion: 'h2',
      headers: [{ name: 'user-agent', value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0 Safari/537.36' }, ...reqHeaders],
      queryString: [...new URL(url).searchParams].map(([name, value]) => ({ name, value })),
      cookies: [],
      headersSize: -1,
      bodySize: postData ? postData.text.length : 0,
      ...(postData && { postData }),
    },
    response: {
      status,
      statusText: '',
      httpVersion: 'h2',
      headers: [{ name: 'content-type', value: mime }, ...resHeaders],
      cookies: [],
      content: { size, mimeType: mime, ...(body && { text: body }) },
      redirectURL: '',
      headersSize: -1,
      bodySize: size,
      _transferSize: size ? size + 300 : 0,
      ...(error && { _error: error }),
    },
    cache: {},
    timings,
  })
  const cookie = { name: 'cookie', value: 'session_id=6f1c2a9e0b; theme=light' }
  return {
    log: {
      version: '1.2',
      creator: { name: 'Screendesk sample', version: '1.0' },
      pages: [{ startedDateTime: new Date(t0).toISOString(), id: 'page_1', title: 'https://app.example.com/dashboard', pageTimings: { onContentLoad: 640, onLoad: 1180 } }],
      entries: [
        make({ offset: 0, url: 'https://app.example.com/dashboard', status: 200, type: 'document', mime: 'text/html', size: 18400, timings: { blocked: 2, dns: 18, connect: 42, ssl: 24, send: 1, wait: 168, receive: 21 }, reqHeaders: [cookie] }),
        make({ offset: 210, url: 'https://app.example.com/assets/app.3f9a.js', status: 200, type: 'script', mime: 'application/javascript', size: 412000, timings: { blocked: 4, dns: -1, connect: -1, ssl: -1, send: 0, wait: 58, receive: 136 } }),
        make({ offset: 212, url: 'https://app.example.com/assets/app.81c2.css', status: 200, type: 'stylesheet', mime: 'text/css', size: 46200, timings: { blocked: 5, dns: -1, connect: -1, ssl: -1, send: 0, wait: 44, receive: 18 } }),
        make({ offset: 230, url: 'https://cdn.example.com/img/logo.svg', status: 304, type: 'image', mime: 'image/svg+xml', size: 0, timings: { blocked: 3, dns: 14, connect: 30, ssl: 18, send: 0, wait: 26, receive: 1 } }),
        make({ offset: 520, method: 'POST', url: 'https://api.example.com/v1/session', status: 200, type: 'fetch', mime: 'application/json', size: 210, timings: { blocked: 1, dns: 12, connect: 35, ssl: 20, send: 1, wait: 142, receive: 2 }, reqHeaders: [cookie], resHeaders: [{ name: 'set-cookie', value: 'session_id=9d2b7c11e4; Path=/; Secure; HttpOnly; SameSite=Lax' }], postData: { mimeType: 'application/json', text: '{"remember":true}' }, body: '{"ok":true,"user":{"id":4182,"plan":"pro"}}' }),
        make({ offset: 690, url: 'https://api.example.com/v1/projects?limit=20&access_token=eyJhbGciOiJIUzI1NiJ9.sample', status: 200, type: 'fetch', mime: 'application/json', size: 5400, timings: { blocked: 1, dns: -1, connect: -1, ssl: -1, send: 0, wait: 1840, receive: 12 }, reqHeaders: [{ name: 'authorization', value: 'Bearer eyJhbGciOiJIUzI1NiJ9.sample' }], body: '{"projects":[{"id":1,"name":"Website"},{"id":2,"name":"Mobile app"}],"total":2}' }),
        make({ offset: 720, url: 'https://api.example.com/v1/billing/invoices', status: 403, type: 'fetch', mime: 'application/json', size: 96, timings: { blocked: 1, dns: -1, connect: -1, ssl: -1, send: 0, wait: 88, receive: 1 }, reqHeaders: [{ name: 'authorization', value: 'Bearer eyJhbGciOiJIUzI1NiJ9.sample' }], body: '{"error":"forbidden","message":"Your role cannot view invoices."}' }),
        make({ offset: 760, method: 'POST', url: 'https://api.example.com/v1/reports/export', status: 500, type: 'fetch', mime: 'application/json', size: 74, timings: { blocked: 1, dns: -1, connect: -1, ssl: -1, send: 1, wait: 2410, receive: 1 }, postData: { mimeType: 'application/json', text: '{"format":"csv","range":"last_30_days"}' }, body: '{"error":"internal_error","request_id":"req_8c1f"}' }),
        make({ offset: 800, url: 'https://widgets.partner-example.com/embed.json', status: 0, type: 'fetch', mime: '', size: 0, timings: { blocked: 2, dns: 20, connect: -1, ssl: -1, send: 0, wait: 0, receive: 0 }, error: 'net::ERR_FAILED (CORS)' }),
      ],
    },
  }
}

export function HarAnalyzer() {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [har, setHar] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sort, setSort] = useState('order')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('headers')
  const [stripBodies, setStripBodies] = useState(false)

  const rows = useMemo(() => (har ? har.log.entries.map(normalize) : []), [har])

  const summary = useMemo(() => {
    if (!rows.length) return null
    const failed = rows.filter((r) => r.status === 0 || r.status >= 400).length
    const bytes = rows.reduce((sum, r) => sum + r.size, 0)
    const timed = rows.filter((r) => r.start != null)
    const first = timed.length ? Math.min(...timed.map((r) => r.start)) : 0
    const last = timed.length ? Math.max(...timed.map((r) => r.start + r.time)) : 0
    const slowest = rows.reduce((max, r) => (r.time > max.time ? r : max), rows[0])
    const onLoad = Number(har.log.pages?.[0]?.pageTimings?.onLoad)
    const hosts = new Set(rows.map((r) => r.host).filter(Boolean)).size
    return {
      total: rows.length,
      failed,
      bytes,
      span: last - first,
      onLoad: onLoad > 0 ? onLoad : null,
      slowest,
      hosts,
      c4: rows.filter((r) => r.status >= 400 && r.status < 500).length,
      c5: rows.filter((r) => r.status >= 500).length,
      c0: rows.filter((r) => r.status === 0).length,
      c3: rows.filter((r) => r.status >= 300 && r.status < 400).length,
      slowWaits: rows.filter((r) => r.wait > 1000).length,
      large: rows.filter((r) => r.size > 1024 * 1024).length,
    }
  }, [rows, har])

  const sensitive = useMemo(() => (har ? walkSensitive(har.log, false) : null), [har])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = rows.filter((r) => matchesStatus(r.status, statusFilter) && (typeFilter === 'all' || r.type === typeFilter) && (!q || r.search.includes(q)))
    if (sort === 'time') return [...list].sort((a, b) => b.time - a.time)
    if (sort === 'size') return [...list].sort((a, b) => b.size - a.size)
    return list
  }, [rows, query, statusFilter, typeFilter, sort])

  const visible = filtered.slice(0, limit)
  const active = selected != null ? rows[selected] : null

  const resetView = () => {
    setQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setSort('order')
    setLimit(PAGE_SIZE)
    setSelected(null)
  }

  const loadData = (data, name, size) => {
    resetView()
    setHar(data)
    setFileName(name)
    setFileSize(size)
    setError('')
  }

  const readFile = async (file) => {
    if (!file) return
    if (file.size > MAX_FILE_BYTES) {
      setError(`This file is ${formatBytes(file.size)}. Files over 500 MB are too large to open reliably in a browser tab; record a shorter session and export again.`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const text = await file.text()
      // Let the "Reading" state paint before the synchronous parse of a large file.
      await new Promise((resolve) => setTimeout(resolve, 0))
      const data = parseHar(text)
      loadData(data, file.name, file.size)
      trackToolUse(TOOL, 'result')
    } catch (err) {
      setError(err?.message || 'Could not read this file.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const loadSample = () => {
    const data = sampleHar()
    loadData(data, 'sample.har', JSON.stringify(data).length)
    trackToolUse(TOOL, 'sample')
  }

  const clear = () => {
    resetView()
    setHar(null)
    setFileName('')
    setFileSize(0)
    setError('')
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    readFile(event.dataTransfer.files?.[0])
  }

  const downloadSanitized = () => {
    const clean = sanitizeHar(har, stripBodies)
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileName.replace(/\.(har|json)$/i, '') || 'capture'}-sanitized.har`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    trackToolUse(TOOL, 'download')
  }

  const setFilter = (setter) => (value) => {
    setter(value)
    setLimit(PAGE_SIZE)
  }

  const findings = summary ? [
    { label: 'Client errors (4xx)', hint: 'Auth, permissions, missing resources, bad input.', count: summary.c4, tone: 'warning', action: () => setFilter(setStatusFilter)('4xx') },
    { label: 'Server errors (5xx)', hint: 'The server failed to handle the request.', count: summary.c5, tone: 'negative', action: () => setFilter(setStatusFilter)('5xx') },
    { label: 'No response (status 0)', hint: 'Blocked by CORS, an extension or the network, or cancelled.', count: summary.c0, tone: 'negative', action: () => setFilter(setStatusFilter)('errors') },
    { label: 'Redirects (3xx)', hint: 'Includes 304 Not Modified cache hits.', count: summary.c3, tone: 'neutral', action: () => setFilter(setStatusFilter)('3xx') },
    { label: 'Slow server waits (> 1 s)', hint: 'Time to first byte above one second.', count: summary.slowWaits, tone: 'warning', action: () => { setFilter(setStatusFilter)('all'); setSort('time') } },
    { label: 'Large responses (> 1 MB)', hint: 'Transferred size above 1 MB.', count: summary.large, tone: 'warning', action: () => { setFilter(setStatusFilter)('all'); setSort('size') } },
  ] : []

  const sensitiveRows = sensitive ? [
    { label: 'Cookie headers', count: sensitive.cookies },
    { label: 'Set-Cookie headers', count: sensitive.setCookies },
    { label: 'Authorization and API key headers', count: sensitive.auth },
    { label: 'Tokens and secrets in URLs or form fields', count: sensitive.params },
  ] : []
  const sensitiveTotal = sensitiveRows.reduce((sum, r) => sum + r.count, 0)

  return (
    <div className="space-y-6">
      <input ref={inputRef} id="har-file" type="file" accept=".har,.json,application/json" className="sr-only" tabIndex={-1} onChange={(e) => readFile(e.target.files?.[0])} />

      <div className={`${ui.card} flex gap-3 p-4 text-sm text-zinc-600`}>
        <LockClosedIcon aria-hidden="true" className={`${ui.listIcon} mt-0.5`} />
        <p><span className="font-medium text-zinc-900">HAR files can contain cookies, session tokens and personal data.</span> This tool reads your file only in your browser. Nothing is uploaded, sent or stored.</p>
      </div>

      {!har && (
        <>
          <label
            htmlFor="har-file"
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={clsx(ui.empty, 'cursor-pointer transition-colors hover:border-zinc-400', dragging && 'border-rose-400 bg-rose-50/40')}
          >
            <ArrowUpTrayIcon aria-hidden="true" className={ui.emptyIcon} />
            <span className="font-medium text-zinc-900">{loading ? 'Reading your HAR file…' : 'Drop a .har file here, or click to choose one'}</span>
            <span className="mt-1">Exported from Chrome, Edge, Firefox or Safari DevTools.</span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className={ui.primaryButton} onClick={() => inputRef.current?.click()} disabled={loading}>Choose HAR file</button>
            <button type="button" className={ui.secondaryButton} onClick={loadSample} disabled={loading}>Try a sample HAR</button>
          </div>
        </>
      )}

      {error && <p role="alert" className={ui.error}>{error}</p>}

      {har && summary && (
        <>
          <div className={`${ui.card} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}>
            <div className="flex min-w-0 items-center gap-3">
              <DocumentTextIcon aria-hidden="true" className="size-5 shrink-0 text-zinc-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">{fileName}</p>
                <p className="text-xs text-zinc-500">{formatBytes(fileSize)} · {summary.total.toLocaleString()} requests · {har.log.creator?.name ? `exported by ${har.log.creator.name}` : 'HAR'}{har.log.version ? ` ${har.log.version}` : ''}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" className={ui.smallButton} onClick={() => inputRef.current?.click()} disabled={loading}><ArrowUpTrayIcon aria-hidden="true" className="size-3.5" />{loading ? 'Reading…' : 'Open another file'}</button>
              <button type="button" className={ui.smallButton} onClick={clear}><XMarkIcon aria-hidden="true" className="size-3.5" />Clear</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-live="polite">
            <Metric label="Requests" value={summary.total.toLocaleString()} note={`${summary.hosts} ${summary.hosts === 1 ? 'domain' : 'domains'}`} />
            <Metric label="Failed" value={summary.failed.toLocaleString()} note="Status 4xx, 5xx or no response" tone={summary.failed ? 'text-red-600' : ''} />
            <Metric label="Transferred" value={formatBytes(summary.bytes)} note="Over the network" />
            <Metric label="Load span" value={formatMs(summary.span)} note={summary.onLoad ? `Page load event at ${formatMs(summary.onLoad)}` : 'First request to last response'} />
            <Metric label="Slowest request" value={formatMs(summary.slowest.time)} note={summary.slowest.path} title={summary.slowest.url} className="col-span-2 lg:col-span-1" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-5 xl:items-start">
            <div className={`${ui.card} min-w-0 xl:col-span-3`}>
              <div className="space-y-3 border-b border-zinc-200 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label htmlFor="har-search" className="sr-only">Search requests</label>
                    <input id="har-search" type="search" value={query} onChange={(e) => setFilter(setQuery)(e.target.value)} placeholder="Filter by URL, method, status or type" className={ui.input} />
                  </div>
                  <div>
                    <label htmlFor="har-type" className="sr-only">Request type</label>
                    <select id="har-type" value={typeFilter} onChange={(e) => setFilter(setTypeFilter)(e.target.value)} className={ui.select}>
                      {TYPES.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="har-sort" className="sr-only">Sort</label>
                    <select id="har-sort" value={sort} onChange={(e) => setSort(e.target.value)} className={ui.select}>
                      {SORTS.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
                    </select>
                  </div>
                  <div className={`${ui.segmented} w-full justify-between sm:col-span-2 sm:w-fit`} role="group" aria-label="Status filter">
                    {STATUSES.map(({ id, label }) => (
                      <button key={id} type="button" aria-pressed={statusFilter === id} onClick={() => setFilter(setStatusFilter)(id)} className={ui.segment(statusFilter === id)}>{label}</button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  {filtered.length === rows.length ? `${rows.length.toLocaleString()} requests` : `${filtered.length.toLocaleString()} of ${rows.length.toLocaleString()} requests`}
                  {filtered.length > visible.length && ` · showing the first ${visible.length.toLocaleString()}`}
                  {' · '}Select a request to see its details.
                </p>
              </div>
              {filtered.length === 0 ? (
                <p className="p-8 text-center text-sm text-zinc-500">No requests match these filters.</p>
              ) : (
                <div className="max-h-[600px] overflow-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="sticky top-0 z-10 bg-zinc-50 text-xs font-medium text-zinc-500">
                      <tr>
                        <th scope="col" className={cell}>Method</th>
                        <th scope="col" className={cell}>Status</th>
                        <th scope="col" className={cell}>URL</th>
                        <th scope="col" className={cell}>Type</th>
                        <th scope="col" className={`${cell} text-right`}>Size</th>
                        <th scope="col" className={`${cell} text-right`}>Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {visible.map((r) => (
                        <tr key={r.index} onClick={() => setSelected(r.index)} className={clsx('cursor-pointer', selected === r.index ? 'bg-rose-50/60' : 'hover:bg-zinc-50')}>
                          <td className={`${cell} font-mono text-xs text-zinc-700`}>{r.method}</td>
                          <td className={cell}><Badge tone={statusTone(r.status)}>{r.status || 'Failed'}</Badge></td>
                          <td className={`${cell} w-full max-w-0`}>
                            <button type="button" title={r.url} onClick={(e) => { e.stopPropagation(); setSelected(r.index) }} className="block w-full truncate text-left text-zinc-900 focus-visible:outline-2 focus-visible:outline-rose-500">{r.path}</button>
                            <span className="block truncate text-xs text-zinc-400">{r.host}</span>
                          </td>
                          <td className={`${cell} whitespace-nowrap text-xs text-zinc-500`}>{TYPE_LABELS[r.type]}</td>
                          <td className={`${cell} whitespace-nowrap text-right tabular-nums text-zinc-700`}>{formatBytes(r.size)}</td>
                          <td className={`${cell} whitespace-nowrap text-right tabular-nums text-zinc-700`}>{formatMs(r.time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > visible.length && (
                    <div className="border-t border-zinc-200 p-3 text-center">
                      <button type="button" className={ui.smallButton} onClick={() => setLimit((n) => n + PAGE_SIZE)}>Show {Math.min(PAGE_SIZE, filtered.length - visible.length).toLocaleString()} more</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="min-w-0 xl:col-span-2 xl:sticky xl:top-24">
              {active ? (
                <RequestDetails row={active} tab={tab} setTab={setTab} onClose={() => setSelected(null)} />
              ) : (
                <div className={ui.empty}>
                  <DocumentTextIcon aria-hidden="true" className={ui.emptyIcon} />
                  Select a request to see its headers, query parameters, timing breakdown and response body.
                </div>
              )}
            </div>
          </div>

          <div className={ui.grid}>
            <div className={ui.card}>
              <div className={ui.cardHeader}><h2 className={ui.cardTitle}>What to look at first</h2></div>
              <ul className={`${ui.cardBody} divide-y divide-zinc-100 py-2`}>
                {findings.map(({ label, hint, count, tone, action }) => (
                  <li key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm text-zinc-900">{label}</p>
                      <p className="text-xs text-zinc-500">{hint}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={count ? tone : 'neutral'}>{count.toLocaleString()}</Badge>
                      {count > 0 && <button type="button" className={ui.smallButton} onClick={action}>Show</button>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className={ui.card}>
              <div className={ui.cardHeader}>
                <h2 className={ui.cardTitle}>Sensitive data</h2>
                <Badge tone={sensitiveTotal ? 'warning' : 'positive'}>{sensitiveTotal ? `${sensitiveTotal.toLocaleString()} found` : 'None detected'}</Badge>
              </div>
              <div className={`${ui.cardBody} ${ui.stack}`}>
                <div className={ui.rows}>
                  {sensitiveRows.map(({ label, count }) => (
                    <div key={label} className={ui.row}><span className={ui.rowLabel}>{label}</span><span className={ui.rowValue}>{count.toLocaleString()}</span></div>
                  ))}
                  <div className={ui.row}><span className={ui.rowLabel}>Requests or responses with a body</span><span className={ui.rowValue}>{sensitive.bodies.toLocaleString()}</span></div>
                </div>
                <label className="flex items-start gap-2 text-sm text-zinc-700">
                  <input type="checkbox" checked={stripBodies} onChange={(e) => setStripBodies(e.target.checked)} className="mt-0.5 size-4 rounded border-zinc-300 accent-rose-500" />
                  <span>Also remove request and response bodies. Bodies are not scanned and can contain personal data.</span>
                </label>
                <div>
                  <button type="button" className={ui.primaryButton} onClick={downloadSanitized}><ArrowDownTrayIcon aria-hidden="true" className="size-4" />Download sanitized HAR</button>
                  <p className={ui.hint}>Cookie, Set-Cookie and Authorization values, API key headers, and token, key, password, session and code parameters are replaced with {REDACTED}. Header and cookie names are kept so the file stays useful for debugging. Review the file before you share it.</p>
                </div>
              </div>
            </div>
          </div>

          <ToolCta title="Stop asking customers for HAR files." copy="Screendesk captures network requests, console logs and device details automatically with every customer screen recording, and attaches them to the ticket." />
        </>
      )}
    </div>
  )
}

function Metric({ label, value, note, title, tone = '', className = '' }) {
  return (
    <div className={`${ui.card} min-w-0 p-4 ${className}`}>
      <p className={ui.metricLabel}>{label}</p>
      <p className={clsx(stat, 'mt-1', tone)}>{value}</p>
      {note && <p className="mt-1 truncate text-xs text-zinc-500" title={title || note}>{note}</p>}
    </div>
  )
}

const DETAIL_TABS = [
  { id: 'headers', label: 'Headers' },
  { id: 'query', label: 'Query' },
  { id: 'timing', label: 'Timing' },
  { id: 'body', label: 'Body' },
]

function RequestDetails({ row, tab, setTab, onClose }) {
  const { entry } = row
  const req = entry.request || {}
  const res = entry.response || {}
  const params = req.queryString?.length ? req.queryString : (() => {
    try { return [...new URL(row.url).searchParams].map(([name, value]) => ({ name, value })) } catch (_) { return [] }
  })()
  const phases = PHASES.map((p) => ({ ...p, value: phaseValue(entry.timings, p.id) }))
  const phaseTotal = phases.reduce((sum, p) => sum + p.value, 0)
  const responseBody = preview(decodeBody(res.content))
  const requestBody = preview(typeof req.postData?.text === 'string' && req.postData.text ? req.postData.text : null)

  return (
    <div className={ui.card}>
      <div className={ui.cardHeader}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-xs text-zinc-700">{row.method}</span>
          <Badge tone={statusTone(row.status)}>{row.status ? `${row.status}${row.statusText ? ` ${row.statusText}` : ''}` : 'No response'}</Badge>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CopyButton text={row.url} label="Copy URL" />
          <button type="button" className={ui.smallButton} onClick={onClose} aria-label="Close request details"><XMarkIcon aria-hidden="true" className="size-3.5" /></button>
        </div>
      </div>
      <div className={`${ui.cardBody} space-y-4`}>
        <p className="break-all font-mono text-xs leading-5 text-zinc-700">{row.url}</p>
        {row.error && <p className={ui.error}>{row.error}</p>}
        <div className={`${ui.segmented} flex w-full`} role="tablist" aria-label="Request details">
          {DETAIL_TABS.map(({ id, label }) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={clsx(ui.segment(tab === id), 'flex-1')}>{label}</button>
          ))}
        </div>

        <div role="tabpanel" className="max-h-[440px] overflow-auto">
          {tab === 'headers' && (
            <div className="space-y-5">
              <DetailGroup title="General">
                <NameValueList items={[
                  { name: 'Request URL', value: row.url },
                  { name: 'Method', value: row.method },
                  { name: 'Status', value: row.status ? `${row.status} ${row.statusText}`.trim() : 'No response' },
                  { name: 'Protocol', value: res.httpVersion || req.httpVersion || '' },
                  { name: 'Content type', value: row.mime },
                  { name: 'Server IP', value: entry.serverIPAddress || '' },
                  { name: 'Started', value: entry.startedDateTime || '' },
                ].filter((item) => item.value)} />
              </DetailGroup>
              <DetailGroup title={`Response headers (${res.headers?.length || 0})`}><NameValueList items={res.headers} empty="No response headers recorded." /></DetailGroup>
              <DetailGroup title={`Request headers (${req.headers?.length || 0})`}><NameValueList items={req.headers} empty="No request headers recorded." /></DetailGroup>
            </div>
          )}

          {tab === 'query' && (
            <div className="space-y-5">
              <DetailGroup title={`Query parameters (${params.length})`}><NameValueList items={params} empty="This request has no query string." /></DetailGroup>
              {req.postData?.params?.length > 0 && <DetailGroup title={`Form fields (${req.postData.params.length})`}><NameValueList items={req.postData.params} /></DetailGroup>}
            </div>
          )}

          {tab === 'timing' && (
            <div className="space-y-4">
              {phaseTotal > 0 ? (
                <>
                  <div className="flex h-3 w-full overflow-hidden rounded-sm bg-zinc-100" aria-hidden="true">
                    {phases.filter((p) => p.value > 0).map((p) => (
                      <div key={p.id} className={p.color} style={{ width: `${(p.value / phaseTotal) * 100}%`, minWidth: '2px' }} />
                    ))}
                  </div>
                  <div className={ui.rows}>
                    {phases.map((p) => (
                      <div key={p.id} className={ui.row}>
                        <span className={`${ui.rowLabel} flex items-center gap-2`}><span aria-hidden="true" className={`size-2.5 rounded-sm ${p.color}`} />{p.label}</span>
                        <span className={ui.rowValue}>{p.value > 0 ? formatMs(p.value) : '—'}</span>
                      </div>
                    ))}
                    <div className={ui.row}><span className="font-medium text-zinc-900">Total</span><span className={ui.rowValue}>{formatMs(row.time)}</span></div>
                  </div>
                  {row.wait > 1000 && <p className="text-xs text-zinc-500">Most of this request was spent waiting for the server to respond. That usually points to slow backend work rather than the network.</p>}
                </>
              ) : (
                <p className="text-sm text-zinc-500">No timing data was recorded for this request.</p>
              )}
            </div>
          )}

          {tab === 'body' && (
            <div className="space-y-5">
              {requestBody != null && (
                <DetailGroup title="Request payload" action={<CopyButton text={req.postData.text} />}>
                  <pre className={`${ui.codeOutput} max-h-60 whitespace-pre-wrap break-all`}>{requestBody}</pre>
                </DetailGroup>
              )}
              <DetailGroup title={`Response body${res.content?.size > 0 ? ` (${formatBytes(res.content.size)})` : ''}`} action={responseBody != null ? <CopyButton text={decodeBody(res.content) || ''} /> : null}>
                {responseBody != null ? (
                  <pre className={`${ui.codeOutput} max-h-80 whitespace-pre-wrap break-all`}>{responseBody}</pre>
                ) : (
                  <p className="text-sm text-zinc-500">No response body was recorded for this request. Redirects, cached responses, failed requests and some binary or very large responses are often exported without one.</p>
                )}
              </DetailGroup>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailGroup({ title, action, children }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-medium uppercase tracking-wide text-zinc-500">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function NameValueList({ items, empty = 'None.' }) {
  if (!items?.length) return <p className="text-sm text-zinc-500">{empty}</p>
  return (
    <dl className="divide-y divide-zinc-100 rounded-md border border-zinc-200 text-xs">
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`} className="grid grid-cols-1 gap-0.5 px-3 py-2 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-3">
          <dt className="break-all font-mono text-zinc-500">{item.name}</dt>
          <dd className="break-all font-mono text-zinc-900">{String(item.value ?? '')}</dd>
        </div>
      ))}
    </dl>
  )
}
