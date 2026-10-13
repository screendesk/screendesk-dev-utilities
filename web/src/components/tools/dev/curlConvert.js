// Parses a curl command into a request description and renders it as code in other languages.
// Pure functions, no dependencies, so it runs in the browser and in node tests.

// Split a shell command into words: single quotes, double quotes, $'…' ANSI-C quotes,
// backslash escapes and line continuations (\ + newline, and ^ + newline from Windows cmd copies).
export function tokenize(input) {
  const src = input.replace(/\\\r?\n/g, ' ').replace(/\^\r?\n/g, ' ')
  const words = []
  let word = ''
  let inWord = false
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if (/\s/.test(ch)) {
      if (inWord) { words.push(word); word = ''; inWord = false }
      i++
      continue
    }
    inWord = true
    if (ch === "'") {
      const end = src.indexOf("'", i + 1)
      if (end === -1) throw new Error('Unclosed single quote.')
      word += src.slice(i + 1, end)
      i = end + 1
    } else if (ch === '$' && src[i + 1] === "'") {
      i += 2
      while (i < src.length && src[i] !== "'") {
        if (src[i] === '\\' && i + 1 < src.length) {
          const next = src[i + 1]
          const map = { n: '\n', t: '\t', r: '\r', '\\': '\\', "'": "'", '"': '"', '0': '\0', e: '\x1b', a: '\x07', b: '\b', f: '\f', v: '\v' }
          if (next === 'x' && /^[0-9a-fA-F]{1,2}/.test(src.slice(i + 2))) {
            const hex = src.slice(i + 2).match(/^[0-9a-fA-F]{1,2}/)[0]
            word += String.fromCharCode(parseInt(hex, 16))
            i += 2 + hex.length
          } else if (next === 'u' && /^[0-9a-fA-F]{4}/.test(src.slice(i + 2))) {
            word += String.fromCharCode(parseInt(src.slice(i + 2, i + 6), 16))
            i += 6
          } else {
            word += next in map ? map[next] : '\\' + next
            i += 2
          }
        } else {
          word += src[i]
          i++
        }
      }
      if (i >= src.length) throw new Error('Unclosed $\'…\' quote.')
      i++
    } else if (ch === '"') {
      i++
      while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < src.length && '"\\$`\n'.includes(src[i + 1])) {
          word += src[i + 1]
          i += 2
        } else {
          word += src[i]
          i++
        }
      }
      if (i >= src.length) throw new Error('Unclosed double quote.')
      i++
    } else if (ch === '\\' && i + 1 < src.length) {
      word += src[i + 1]
      i += 2
    } else {
      word += ch
      i++
    }
  }
  if (inWord) words.push(word)
  return words
}

// Options that take a value, by long name. Short aliases map onto these.
const shortToLong = {
  X: 'request', H: 'header', d: 'data', u: 'user', b: 'cookie', F: 'form', A: 'user-agent', e: 'referer',
  o: 'output', m: 'max-time', x: 'proxy', T: 'upload-file', c: 'cookie-jar', E: 'cert', r: 'range', w: 'write-out', K: 'config', U: 'proxy-user', Y: 'speed-limit', y: 'speed-time', z: 'time-cond', C: 'continue-at', D: 'dump-header', P: 'ftp-port', Q: 'quote', t: 'telnet-option',
}
const shortFlags = {
  G: 'get', I: 'head', L: 'location', k: 'insecure', s: 'silent', S: 'show-error', v: 'verbose', i: 'include', f: 'fail', N: 'no-buffer', O: 'remote-name', J: 'remote-header-name', g: 'globoff', 4: 'ipv4', 6: 'ipv6', 0: 'http1.0', 2: 'sslv2', 3: 'sslv3', 1: 'tlsv1', '#': 'progress-bar', q: 'disable', Z: 'parallel', l: 'list-only', n: 'netrc', a: 'append', B: 'use-ascii', j: 'junk-session-cookies', M: 'manual', p: 'proxytunnel', R: 'remote-time', V: 'version', h: 'help',
}
const longWithValue = new Set([
  'request', 'header', 'data', 'data-raw', 'data-binary', 'data-ascii', 'data-urlencode', 'json', 'user', 'cookie', 'form', 'form-string', 'user-agent', 'referer', 'url',
  'output', 'max-time', 'connect-timeout', 'proxy', 'upload-file', 'cookie-jar', 'cert', 'key', 'cacert', 'capath', 'range', 'write-out', 'config', 'proxy-user', 'retry', 'retry-delay', 'retry-max-time',
  'resolve', 'connect-to', 'interface', 'limit-rate', 'max-redirs', 'oauth2-bearer', 'aws-sigv4', 'unix-socket', 'abstract-unix-socket', 'dns-servers', 'ciphers', 'cert-type', 'key-type', 'pass',
  'speed-limit', 'speed-time', 'time-cond', 'continue-at', 'dump-header', 'trace', 'trace-ascii', 'stderr', 'local-port', 'keepalive-time', 'expect100-timeout', 'happy-eyeballs-timeout-ms', 'tls-max', 'variable', 'url-query', 'request-target', 'preproxy', 'socks5', 'socks5-hostname', 'noproxy', 'netrc-file', 'output-dir', 'parallel-max', 'header-file',
])

function headerIndex(headers, name) {
  return headers.findIndex(([key]) => key.toLowerCase() === name.toLowerCase())
}

function setHeader(headers, name, value) {
  const index = headerIndex(headers, name)
  if (index === -1) headers.push([name, value])
  else headers[index] = [headers[index][0], value]
}

export function getHeader(headers, name) {
  const index = headerIndex(headers, name)
  return index === -1 ? undefined : headers[index][1]
}

function encodeFormPart(value) {
  // --data-urlencode: "content", "=content", "name=content", "@file", "name@file".
  const eq = value.indexOf('=')
  if (eq === -1) return encodeURIComponent(value)
  const name = value.slice(0, eq)
  return (name ? name + '=' : '') + encodeURIComponent(value.slice(eq + 1))
}

export function parseCurl(input) {
  const trimmed = (input || '').trim()
  if (!trimmed) throw new Error('Paste a curl command to convert.')
  const words = tokenize(trimmed)
  if (!words.length) throw new Error('Paste a curl command to convert.')
  if (words[0] !== 'curl' && !/(^|[/\\])curl(\.exe)?$/.test(words[0])) throw new Error('The command should start with "curl".')

  const request = {
    method: null, url: null, headers: [], data: [], dataIsJson: false, form: [], user: null, cookie: null,
    compressed: false, get: false, head: false, insecure: false, location: false, warnings: [],
  }

  const take = (name, value) => {
    switch (name) {
      case 'request': request.method = value.toUpperCase(); break
      case 'header': {
        const colon = value.indexOf(':')
        if (colon === -1) { request.warnings.push(`Ignored header without a colon: ${value}`); break }
        const key = value.slice(0, colon).trim()
        const val = value.slice(colon + 1).trim()
        if (val === '' && value.trim().endsWith(':')) {
          // "-H 'X-Foo:'" removes a header in curl.
          const index = headerIndex(request.headers, key)
          if (index !== -1) request.headers.splice(index, 1)
        } else request.headers.push([key, val])
        break
      }
      case 'data': case 'data-ascii': case 'data-binary':
        if (value.startsWith('@')) request.warnings.push(`Body is read from the file ${value.slice(1)} — replace the placeholder with the file contents.`)
        request.data.push(value)
        break
      case 'data-raw': request.data.push(value); break
      case 'data-urlencode':
        if (value.includes('@')) request.warnings.push(`--data-urlencode reads ${value} from a file; the value is used as written.`)
        request.data.push(encodeFormPart(value))
        break
      case 'json':
        if (value.startsWith('@')) request.warnings.push(`Body is read from the file ${value.slice(1)} — replace the placeholder with the file contents.`)
        request.data.push(value)
        request.dataIsJson = true
        break
      case 'form': case 'form-string': {
        const eq = value.indexOf('=')
        if (eq === -1) { request.warnings.push(`Ignored form field without "=": ${value}`); break }
        const fieldName = value.slice(0, eq)
        let fieldValue = value.slice(eq + 1)
        if (name === 'form' && (fieldValue.startsWith('@') || fieldValue.startsWith('<'))) {
          const isFile = fieldValue.startsWith('@')
          fieldValue = fieldValue.slice(1).split(';')[0]
          request.form.push({ name: fieldName, value: fieldValue, file: isFile, contents: !isFile })
        } else request.form.push({ name: fieldName, value: fieldValue, file: false })
        break
      }
      case 'user': {
        const colon = value.indexOf(':')
        request.user = colon === -1 ? { username: value, password: '' } : { username: value.slice(0, colon), password: value.slice(colon + 1) }
        break
      }
      case 'cookie':
        if (!value.includes('=')) request.warnings.push(`-b ${value} reads cookies from a file; it was skipped.`)
        else request.cookie = request.cookie ? `${request.cookie}; ${value}` : value
        break
      case 'user-agent': setHeader(request.headers, 'User-Agent', value); break
      case 'referer': setHeader(request.headers, 'Referer', value); break
      case 'oauth2-bearer': setHeader(request.headers, 'Authorization', `Bearer ${value}`); break
      case 'url': request.url = value; break
      case 'upload-file': request.warnings.push(`-T uploads the file ${value}; not converted.`); break
      default: break
    }
  }

  const flag = (name) => {
    switch (name) {
      case 'get': request.get = true; break
      case 'head': request.head = true; break
      case 'compressed': request.compressed = true; break
      case 'insecure': request.insecure = true; break
      case 'location': request.location = true; break
      default: break
    }
  }

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    if (word.startsWith('--') && word.length > 2) {
      let name = word.slice(2)
      let value
      const eq = name.indexOf('=')
      if (eq !== -1) { value = name.slice(eq + 1); name = name.slice(0, eq) }
      if (longWithValue.has(name)) {
        if (value === undefined) {
          if (i + 1 >= words.length) throw new Error(`--${name} needs a value.`)
          value = words[++i]
        }
        take(name, value)
      } else flag(name)
    } else if (word.startsWith('-') && word.length > 1) {
      // Short options can be combined (-sSL) and take attached values (-XPOST).
      for (let j = 1; j < word.length; j++) {
        const letter = word[j]
        if (shortToLong[letter]) {
          let value = word.slice(j + 1)
          if (!value) {
            if (i + 1 >= words.length) throw new Error(`-${letter} needs a value.`)
            value = words[++i]
          }
          take(shortToLong[letter], value)
          break
        }
        if (shortFlags[letter]) flag(shortFlags[letter])
      }
    } else if (!request.url) {
      request.url = word
    }
  }

  if (!request.url) throw new Error('No URL found in the curl command.')
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(request.url)) request.url = `http://${request.url}`

  let body = request.data.length ? request.data.join('&') : null
  if (request.dataIsJson) {
    body = request.data.join('')
    if (!getHeader(request.headers, 'Content-Type')) request.headers.push(['Content-Type', 'application/json'])
    if (!getHeader(request.headers, 'Accept')) request.headers.push(['Accept', 'application/json'])
  }

  let method = request.method
  if (request.get && body !== null) {
    request.url += (request.url.includes('?') ? '&' : '?') + body
    body = null
    method = method || 'GET'
  }
  if (!method) method = request.head ? 'HEAD' : body !== null || request.form.length ? 'POST' : 'GET'
  if (body !== null && !request.dataIsJson && !getHeader(request.headers, 'Content-Type')) {
    request.headers.push(['Content-Type', 'application/x-www-form-urlencoded'])
  }
  if (request.form.length && body !== null) request.warnings.push('-F and -d were both used; curl rejects that combination. The form fields are used.')
  if (request.form.length) body = null

  const contentType = (getHeader(request.headers, 'Content-Type') || '').toLowerCase()
  let json
  if (body !== null && contentType.includes('json')) {
    try { json = JSON.parse(body) } catch (_) { json = undefined }
  }

  return {
    method, url: request.url, headers: request.headers, body, json, form: request.form, user: request.user, cookie: request.cookie,
    compressed: request.compressed, insecure: request.insecure, location: request.location, warnings: request.warnings,
  }
}

// ---------- Generators ----------

const js = (value) => JSON.stringify(value)
const indent = (text, spaces) => text.split('\n').map((line, index) => (index === 0 ? line : ' '.repeat(spaces) + line)).join('\n')

function basicAuth(user) {
  const raw = `${user.username}:${user.password}`
  try {
    // UTF-8 safe base64 in both browser and node.
    const bytes = new TextEncoder().encode(raw)
    let binary = ''
    bytes.forEach((b) => { binary += String.fromCharCode(b) })
    return typeof btoa === 'function' ? btoa(binary) : Buffer.from(raw).toString('base64')
  } catch (_) {
    return ''
  }
}

function headersWithCookie(req) {
  const headers = req.headers.slice()
  if (req.cookie) headers.push(['Cookie', req.cookie])
  return headers
}

function jsObject(entries, spaces = 2) {
  if (!entries.length) return '{}'
  const pad = ' '.repeat(spaces)
  return `{\n${entries.map(([k, v]) => `${pad}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : js(k)}: ${v}`).join(',\n')}\n}`
}

function jsFormData(req, nodeStyle) {
  const lines = ['const form = new FormData()']
  req.form.forEach(({ name, value, file, contents }) => {
    if (file) {
      lines.push(nodeStyle
        ? `form.append(${js(name)}, new Blob([fs.readFileSync(${js(value)})]), ${js(value.split(/[\\/]/).pop())})`
        : `form.append(${js(name)}, fileInput.files[0]) // ${value}`)
    } else if (contents) {
      lines.push(nodeStyle ? `form.append(${js(name)}, fs.readFileSync(${js(value)}, 'utf8'))` : `form.append(${js(name)}, '<contents of ${value}>')`)
    } else lines.push(`form.append(${js(name)}, ${js(value)})`)
  })
  return lines.join('\n')
}

export function toFetch(req) {
  const headers = headersWithCookie(req)
  if (req.user) headers.push(['Authorization', `Basic ${basicAuth(req.user)}`])
  const opts = []
  const pre = []
  if (req.method !== 'GET') opts.push(['method', js(req.method)])
  if (headers.length) opts.push(['headers', indent(jsObject(headers.map(([k, v]) => [k, js(v)])), 2)])
  if (req.form.length) {
    pre.push(jsFormData(req, false))
    opts.push(['body', 'form'])
  } else if (req.json !== undefined) {
    opts.push(['body', `JSON.stringify(${indent(JSON.stringify(req.json, null, 2), 2)})`])
  } else if (req.body !== null) opts.push(['body', js(req.body)])
  const call = opts.length ? `fetch(${js(req.url)}, ${jsObject(opts)})` : `fetch(${js(req.url)})`
  return [
    ...pre, pre.length ? '' : null,
    `const response = await ${call}`,
    '',
    'const data = await response.text()',
    'console.log(response.status, data)',
  ].filter((line) => line !== null).join('\n')
}

export function toAxios(req) {
  const headers = headersWithCookie(req)
  const lines = ["import axios from 'axios'"]
  const usesFs = req.form.some((f) => f.file || f.contents)
  if (usesFs) lines.push("import fs from 'node:fs'")
  if (req.insecure) lines.push("import https from 'node:https'")
  lines.push('')
  const opts = [['method', js(req.method.toLowerCase())], ['url', js(req.url)]]
  if (headers.length) opts.push(['headers', indent(jsObject(headers.map(([k, v]) => [k, js(v)])), 2)])
  if (req.form.length) {
    lines.push(jsFormData(req, true), '')
    opts.push(['data', 'form'])
  } else if (req.json !== undefined) opts.push(['data', indent(JSON.stringify(req.json, null, 2), 2)])
  else if (req.body !== null) opts.push(['data', js(req.body)])
  if (req.user) opts.push(['auth', `{ username: ${js(req.user.username)}, password: ${js(req.user.password)} }`])
  if (req.compressed) opts.push(['decompress', 'true'])
  if (req.insecure) opts.push(['httpsAgent', 'new https.Agent({ rejectUnauthorized: false })'])
  lines.push(`const response = await axios(${jsObject(opts)})`, '', 'console.log(response.status, response.data)')
  return lines.join('\n')
}

// Python literal for parsed JSON values.
function py(value, level = 0) {
  const pad = '    '.repeat(level + 1)
  const end = '    '.repeat(level)
  if (value === null) return 'None'
  if (value === true) return 'True'
  if (value === false) return 'False'
  if (typeof value === 'number') return String(value)
  if (typeof value === 'string') return js(value)
  if (Array.isArray(value)) return value.length ? `[\n${value.map((v) => pad + py(v, level + 1)).join(',\n')},\n${end}]` : '[]'
  const keys = Object.keys(value)
  return keys.length ? `{\n${keys.map((k) => `${pad}${js(k)}: ${py(value[k], level + 1)}`).join(',\n')},\n${end}}` : '{}'
}

function pyDict(entries) {
  if (!entries.length) return '{}'
  return `{\n${entries.map(([k, v]) => `    ${js(k)}: ${v}`).join(',\n')},\n}`
}

function parseCookies(cookie) {
  return cookie.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const eq = part.indexOf('=')
    return eq === -1 ? [part, ''] : [part.slice(0, eq), part.slice(eq + 1)]
  })
}

export function toPython(req) {
  const lines = ['import requests', '']
  const args = [js(req.url)]
  let headers = req.headers.slice()
  if (req.json !== undefined) headers = headers.filter(([k]) => k.toLowerCase() !== 'content-type')
  if (req.form.length) headers = headers.filter(([k]) => k.toLowerCase() !== 'content-type')
  if (headers.length) { lines.push(`headers = ${pyDict(headers.map(([k, v]) => [k, js(v)]))}`, ''); args.push('headers=headers') }
  if (req.cookie) { lines.push(`cookies = ${pyDict(parseCookies(req.cookie).map(([k, v]) => [k, js(v)]))}`, ''); args.push('cookies=cookies') }
  if (req.form.length) {
    const files = req.form.filter((f) => f.file)
    const fields = req.form.filter((f) => !f.file)
    if (fields.length) {
      lines.push(`data = ${pyDict(fields.map((f) => [f.name, f.contents ? `open(${js(f.value)}).read()` : js(f.value)]))}`, '')
      args.push('data=data')
    }
    if (files.length) {
      lines.push(`files = ${pyDict(files.map((f) => [f.name, `open(${js(f.value)}, "rb")`]))}`, '')
      args.push('files=files')
    }
  } else if (req.json !== undefined) {
    lines.push(`json_data = ${py(req.json)}`, '')
    args.push('json=json_data')
  } else if (req.body !== null) {
    lines.push(`data = ${js(req.body)}`, '')
    args.push('data=data')
  }
  if (req.user) args.push(`auth=(${js(req.user.username)}, ${js(req.user.password)})`)
  if (req.insecure) args.push('verify=False')
  const method = req.method.toLowerCase()
  const simple = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(method)
  const call = simple ? `requests.${method}(` : `requests.request(${js(req.method)}, `
  const joined = args.join(', ')
  lines.push(joined.length > 60 ? `response = ${call}\n    ${args.join(',\n    ')},\n)` : `response = ${call}${joined})`)
  lines.push('', 'print(response.status_code)', 'print(response.text)')
  return lines.join('\n')
}

function goString(value) {
  if (value.includes('\n') && !value.includes('`')) return '`' + value + '`'
  return js(value)
}

export function toGo(req) {
  const headers = headersWithCookie(req)
  const imports = new Set(['fmt', 'io', 'net/http'])
  const body = []
  let bodyVar = 'nil'
  if (req.form.length) {
    imports.add('bytes'); imports.add('mime/multipart')
    body.push('\tvar body bytes.Buffer', '\twriter := multipart.NewWriter(&body)')
    req.form.forEach(({ name, value, file, contents }) => {
      if (file) {
        imports.add('os')
        // A block per file keeps variable names from clashing when several files are attached.
        body.push(
          '\t{',
          `\t\tfile, err := os.Open(${js(value)})`, '\t\tif err != nil {', '\t\t\tpanic(err)', '\t\t}', '\t\tdefer file.Close()',
          `\t\tpart, err := writer.CreateFormFile(${js(name)}, ${js(value.split(/[\\/]/).pop())})`, '\t\tif err != nil {', '\t\t\tpanic(err)', '\t\t}',
          '\t\tif _, err := io.Copy(part, file); err != nil {', '\t\t\tpanic(err)', '\t\t}',
          '\t}',
        )
      } else if (contents) {
        imports.add('os')
        body.push(`\t{\n\t\tcontents, _ := os.ReadFile(${js(value)})\n\t\twriter.WriteField(${js(name)}, string(contents))\n\t}`)
      } else body.push(`\twriter.WriteField(${js(name)}, ${goString(value)})`)
    })
    body.push('\twriter.Close()', '')
    bodyVar = '&body'
  } else if (req.body !== null) {
    imports.add('strings')
    const payload = req.json !== undefined ? JSON.stringify(req.json, null, 2) : req.body
    body.push(`\tbody := strings.NewReader(${goString(payload)})`, '')
    bodyVar = 'body'
  }
  const lines = [...body, `\treq, err := http.NewRequest(${js(req.method)}, ${js(req.url)}, ${bodyVar})`, '\tif err != nil {', '\t\tpanic(err)', '\t}']
  headers.forEach(([k, v]) => {
    if (req.form.length && k.toLowerCase() === 'content-type') return
    lines.push(`\treq.Header.Set(${js(k)}, ${js(v)})`)
  })
  if (req.form.length) lines.push('\treq.Header.Set("Content-Type", writer.FormDataContentType())')
  if (req.user) lines.push(`\treq.SetBasicAuth(${js(req.user.username)}, ${js(req.user.password)})`)
  lines.push('')
  const clientOpts = []
  if (req.insecure) {
    imports.add('crypto/tls')
    clientOpts.push('\t\tTransport: &http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify: true}},')
  }
  lines.push(clientOpts.length ? `\tclient := &http.Client{\n${clientOpts.join('\n')}\n\t}` : '\tclient := &http.Client{}')
  lines.push(
    '\tresp, err := client.Do(req)', '\tif err != nil {', '\t\tpanic(err)', '\t}', '\tdefer resp.Body.Close()', '',
    '\tdata, err := io.ReadAll(resp.Body)', '\tif err != nil {', '\t\tpanic(err)', '\t}', '\tfmt.Println(resp.StatusCode, string(data))',
  )
  const sorted = [...imports].sort()
  return `package main\n\nimport (\n${sorted.map((name) => `\t"${name}"`).join('\n')}\n)\n\nfunc main() {\n${lines.join('\n')}\n}`
}

const php = (value) => `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`

export function toPhp(req) {
  const opts = [
    ['CURLOPT_URL', php(req.url)],
    ['CURLOPT_RETURNTRANSFER', 'true'],
  ]
  if (req.method === 'HEAD') opts.push(['CURLOPT_NOBODY', 'true'])
  else if (req.method !== 'GET' && !(req.method === 'POST' && (req.body !== null || req.form.length))) opts.push(['CURLOPT_CUSTOMREQUEST', php(req.method)])
  if (req.method === 'POST' && (req.body !== null || req.form.length)) opts.push(['CURLOPT_POST', 'true'])
  const headers = req.headers.filter(([k]) => !(req.form.length && k.toLowerCase() === 'content-type'))
  if (headers.length) opts.push(['CURLOPT_HTTPHEADER', `[\n${headers.map(([k, v]) => `        ${php(`${k}: ${v}`)},`).join('\n')}\n    ]`])
  if (req.form.length) {
    opts.push(['CURLOPT_POSTFIELDS', `[\n${req.form.map(({ name, value, file, contents }) => `        ${php(name)} => ${file ? `new CURLFile(${php(value)})` : contents ? `file_get_contents(${php(value)})` : php(value)},`).join('\n')}\n    ]`])
  } else if (req.body !== null) {
    opts.push(['CURLOPT_POSTFIELDS', php(req.json !== undefined ? JSON.stringify(req.json) : req.body)])
  }
  if (req.user) opts.push(['CURLOPT_USERPWD', php(`${req.user.username}:${req.user.password}`)])
  if (req.cookie) opts.push(['CURLOPT_COOKIE', php(req.cookie)])
  if (req.compressed) opts.push(['CURLOPT_ENCODING', "''"])
  if (req.location) opts.push(['CURLOPT_FOLLOWLOCATION', 'true'])
  if (req.insecure) opts.push(['CURLOPT_SSL_VERIFYPEER', 'false'], ['CURLOPT_SSL_VERIFYHOST', '0'])
  return [
    '<?php',
    '',
    '$ch = curl_init();',
    'curl_setopt_array($ch, [',
    ...opts.map(([k, v]) => `    ${k} => ${v},`),
    ']);',
    '',
    '$response = curl_exec($ch);',
    'if ($response === false) {',
    "    echo 'Error: ' . curl_error($ch);",
    '} else {',
    '    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);',
    '    echo $status . PHP_EOL . $response;',
    '}',
    'curl_close($ch);',
  ].join('\n')
}

export const languages = [
  { id: 'fetch', label: 'JavaScript fetch', convert: toFetch },
  { id: 'axios', label: 'Node axios', convert: toAxios },
  { id: 'python', label: 'Python requests', convert: toPython },
  { id: 'go', label: 'Go net/http', convert: toGo },
  { id: 'php', label: 'PHP cURL', convert: toPhp },
]

export function convertCurl(input, language) {
  const request = parseCurl(input)
  const target = languages.find(({ id }) => id === language) || languages[0]
  return { request, code: target.convert(request) }
}
