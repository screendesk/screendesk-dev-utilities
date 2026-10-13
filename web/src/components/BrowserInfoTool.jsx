import { useCallback, useEffect, useState } from 'react'
import { ArrowPathIcon, ComputerDesktopIcon, LinkIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'

const SHARE_BASE = 'https://screendesk.io/tools/browser-info'

// Every field the tool shows, in display order. Shared links may only carry these keys.
const FIELDS = [
  ['browser', 'Browser'],
  ['os', 'Operating system'],
  ['device', 'Device type'],
  ['screen', 'Screen resolution'],
  ['viewport', 'Viewport size'],
  ['pixelRatio', 'Device pixel ratio'],
  ['colorDepth', 'Color depth'],
  ['languages', 'Languages'],
  ['timezone', 'Time zone'],
  ['cookies', 'Cookies'],
  ['javascript', 'JavaScript'],
  ['doNotTrack', 'Do Not Track'],
  ['online', 'Online status'],
  ['touch', 'Touch support'],
  ['cores', 'CPU threads'],
  ['memory', 'Device memory'],
  ['connection', 'Connection'],
  ['userAgent', 'User agent'],
]

const FIELD_KEYS = new Set(FIELDS.map(([key]) => key))

// --- User agent parsing -------------------------------------------------------------------------

function match(ua, regex) {
  const m = ua.match(regex)
  return m ? m[1] : null
}

function shortVersion(version) {
  if (!version) return ''
  return version.split('.').slice(0, 2).join('.')
}

function parseBrowser(ua) {
  const checks = [
    ['Microsoft Edge', /Edg(?:e|A|iOS)?\/([\d.]+)/],
    ['Opera', /(?:OPR|OPT)\/([\d.]+)/],
    ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
    ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
    ['Chrome', /CriOS\/([\d.]+)/],
    ['Chrome', /Chrome\/([\d.]+)/],
    ['Safari', /Version\/([\d.]+).*Safari/],
  ]
  for (const [name, regex] of checks) {
    const version = match(ua, regex)
    if (version) return { name, version }
  }
  return { name: 'Unknown browser', version: '' }
}

function parseOs(ua, maxTouchPoints) {
  const win = match(ua, /Windows NT ([\d.]+)/)
  if (win) {
    const names = { '10.0': '10', '6.3': '8.1', '6.2': '8', '6.1': '7' }
    return { name: 'Windows', version: names[win] || win }
  }
  const ios = match(ua, /(?:iPhone|iPod) OS ([\d_]+)/)
  if (ios) return { name: 'iOS', version: ios.replace(/_/g, '.') }
  const ipad = match(ua, /iPad.*OS ([\d_]+)/)
  if (ipad) return { name: 'iPadOS', version: ipad.replace(/_/g, '.') }
  const android = match(ua, /Android ([\d.]+)/)
  if (android) return { name: 'Android', version: android }
  if (/CrOS/.test(ua)) return { name: 'ChromeOS', version: '' }
  const mac = match(ua, /Mac OS X ([\d_.]+)/)
  if (mac) {
    // iPads in desktop mode report as a Mac; only touch support gives them away.
    if (maxTouchPoints > 1) return { name: 'iPadOS', version: match(ua, /Version\/([\d.]+)/) || '' }
    return { name: 'macOS', version: mac.replace(/_/g, '.') }
  }
  if (/Linux/.test(ua)) return { name: 'Linux', version: '' }
  return { name: 'Unknown OS', version: '' }
}

function parseDevice(ua, maxTouchPoints, uaMobile) {
  if (/iPad|Tablet/i.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua)) || (/Macintosh/.test(ua) && maxTouchPoints > 1)) return 'Tablet'
  if (uaMobile || /Mobi|iPhone|iPod|Android/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

// Client hints give real versions where the user agent string is frozen (Windows 11, macOS > 10.15).
async function readClientHints() {
  const data = navigator.userAgentData
  if (!data?.getHighEntropyValues) return null
  try {
    return await data.getHighEntropyValues(['platformVersion', 'fullVersionList', 'model'])
  } catch (_) {
    return null
  }
}

function brandFromHints(hints) {
  const list = hints?.fullVersionList || []
  const preferred = ['Microsoft Edge', 'Opera', 'Google Chrome', 'Brave', 'Chromium']
  for (const name of preferred) {
    const brand = list.find((item) => item.brand === name)
    if (brand) return { name: name === 'Google Chrome' ? 'Chrome' : name, version: brand.version }
  }
  return null
}

function osFromHints(hints, os) {
  const version = hints?.platformVersion
  if (!version) return os
  const major = parseInt(version.split('.')[0], 10)
  if (hints.platform === 'Windows') return { name: 'Windows', version: major >= 13 ? '11' : major > 0 ? '10' : os.version }
  if (hints.platform === 'macOS') return { name: 'macOS', version: shortVersion(version) }
  if (hints.platform === 'Android') return { name: 'Android', version }
  return os
}

function viewportSize() {
  return `${window.innerWidth} × ${window.innerHeight} px`
}

function screenSize() {
  const dpr = window.devicePixelRatio || 1
  const { width, height } = window.screen
  const physical = dpr === 1 ? '' : ` (${Math.round(width * dpr)} × ${Math.round(height * dpr)} physical)`
  return `${width} × ${height}${physical}`
}

async function collectDetails() {
  const ua = navigator.userAgent
  const maxTouchPoints = navigator.maxTouchPoints || 0
  const hints = await readClientHints()
  const browser = brandFromHints(hints) || parseBrowser(ua)
  const os = osFromHints(hints, parseOs(ua, maxTouchPoints))
  const connection = navigator.connection
  const languages = navigator.languages?.length ? navigator.languages.join(', ') : navigator.language
  let timezone = 'Unknown'
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown'
  } catch (_) {}
  const offset = -new Date().getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const utc = `UTC${sign}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0')}:${String(Math.abs(offset) % 60).padStart(2, '0')}`
  const dnt = navigator.doNotTrack || window.doNotTrack

  return {
    browser: `${browser.name} ${shortVersion(browser.version)}`.trim(),
    os: `${os.name} ${os.version}`.trim(),
    device: parseDevice(ua, maxTouchPoints, navigator.userAgentData?.mobile) + (hints?.model ? ` (${hints.model})` : ''),
    screen: screenSize(),
    viewport: viewportSize(),
    pixelRatio: String(Math.round((window.devicePixelRatio || 1) * 100) / 100),
    colorDepth: `${window.screen.colorDepth}-bit`,
    languages: languages || 'Unknown',
    timezone: `${timezone} (${utc})`,
    cookies: navigator.cookieEnabled ? 'Enabled' : 'Disabled',
    javascript: 'Enabled',
    doNotTrack: dnt === '1' || dnt === 'yes' ? 'On' : 'Off',
    online: navigator.onLine ? 'Online' : 'Offline',
    touch: maxTouchPoints > 0 ? `Yes (up to ${maxTouchPoints} points)` : 'No',
    cores: navigator.hardwareConcurrency ? String(navigator.hardwareConcurrency) : 'Not reported',
    memory: navigator.deviceMemory ? `${navigator.deviceMemory} GB or more` : 'Not reported',
    connection: connection?.effectiveType
      ? `${connection.effectiveType.toUpperCase()}${connection.downlink ? `, ~${connection.downlink} Mbps` : ''}`
      : 'Not reported',
    userAgent: ua,
  }
}

// --- Share links: the details live in the URL fragment, which browsers never send to a server. ---

function encodeShare(details) {
  const json = JSON.stringify({ v: 1, t: new Date().toISOString(), d: details })
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeShare(encoded) {
  try {
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const binary = atob(padded)
    const json = new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
    const parsed = JSON.parse(json)
    if (!parsed || typeof parsed.d !== 'object') return null
    const details = {}
    for (const [key, value] of Object.entries(parsed.d)) {
      if (FIELD_KEYS.has(key) && value != null) details[key] = String(value).slice(0, 600)
    }
    if (!Object.keys(details).length) return null
    const time = typeof parsed.t === 'string' && !Number.isNaN(Date.parse(parsed.t)) ? new Date(parsed.t) : null
    return { details, time }
  } catch (_) {
    return null
  }
}

function readHash() {
  const hash = window.location.hash
  return hash.startsWith('#d=') ? hash.slice(3) : null
}

function asText(details, heading) {
  const lines = FIELDS.filter(([key]) => details[key]).map(([key, label]) => `${label}: ${details[key]}`)
  return [heading, ...lines].filter(Boolean).join('\n')
}

// --- Component ----------------------------------------------------------------------------------

export function BrowserInfoTool() {
  const [mode, setMode] = useState('loading') // loading | local | shared | invalid
  const [details, setDetails] = useState(null)
  const [shared, setShared] = useState(null)
  const [shareLink, setShareLink] = useState('')

  const detect = useCallback(async () => {
    const result = await collectDetails()
    setDetails(result)
    setMode('local')
    trackToolUse('browser-info', 'result')
  }, [])

  // Choose the view from the URL: a #d= fragment shows shared details, otherwise detect locally.
  useEffect(() => {
    const route = () => {
      const encoded = readHash()
      if (encoded) {
        const decoded = decodeShare(encoded)
        setShared(decoded)
        setMode(decoded ? 'shared' : 'invalid')
      } else {
        detect()
      }
    }
    route()
    window.addEventListener('hashchange', route)
    return () => window.removeEventListener('hashchange', route)
  }, [detect])

  // Keep the live values current while the visitor looks at their own details.
  useEffect(() => {
    if (mode !== 'local') return undefined
    const onResize = () => setDetails((prev) => prev && ({
      ...prev,
      viewport: viewportSize(),
      screen: screenSize(),
      pixelRatio: String(Math.round((window.devicePixelRatio || 1) * 100) / 100),
    }))
    const onNetwork = () => setDetails((prev) => prev && ({ ...prev, online: navigator.onLine ? 'Online' : 'Offline' }))
    window.addEventListener('resize', onResize)
    window.addEventListener('online', onNetwork)
    window.addEventListener('offline', onNetwork)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('online', onNetwork)
      window.removeEventListener('offline', onNetwork)
    }
  }, [mode])

  const checkOwn = () => {
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    setShared(null)
    setShareLink('')
    setMode('loading')
    detect()
  }

  const createShareLink = () => {
    if (!details) return
    setShareLink(`${SHARE_BASE}#d=${encodeShare(details)}`)
    trackToolUse('browser-info', 'share')
  }

  if (mode === 'loading') {
    return (
      <div className={ui.empty}>
        <ComputerDesktopIcon aria-hidden="true" className={ui.emptyIcon} />
        Detecting your browser…
      </div>
    )
  }

  if (mode === 'invalid') {
    return (
      <div className={ui.empty}>
        <LinkIcon aria-hidden="true" className={ui.emptyIcon} />
        <p className="font-medium text-zinc-900">This shared link could not be read.</p>
        <p className="mt-1">It may have been cut off when it was copied. Ask for the link again, or check your own browser.</p>
        <button type="button" onClick={checkOwn} className={`${ui.secondaryButton} mt-4`}>Check my own browser</button>
      </div>
    )
  }

  if (mode === 'shared' && shared) {
    const sharedText = asText(shared.details, shared.time ? `Shared browser details (captured ${shared.time.toLocaleString()})` : 'Shared browser details')
    return (
      <div className={ui.stack}>
        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <div className="flex items-center gap-2">
              <h2 className={ui.cardTitle}>Shared details</h2>
              <Badge tone="warning">Not your device</Badge>
            </div>
            <CopyButton text={sharedText} label="Copy all" />
          </div>
          <div className={ui.cardBody}>
            <p className="mb-4 text-sm text-zinc-500">
              Someone shared these browser details with you{shared.time ? `, captured ${shared.time.toLocaleString()}` : ''}. They describe their device, not the one you are using now.
            </p>
            <DetailRows details={shared.details} />
            <div className="mt-5 flex flex-wrap gap-2">
              <button type="button" onClick={checkOwn} className={ui.primaryButton}>
                <ArrowPathIcon aria-hidden="true" className="size-4" />
                Check my own browser
              </button>
            </div>
          </div>
        </div>
        <ToolCta
          title="Get these details automatically"
          copy="Screendesk attaches browser, OS and console logs to every customer recording, so you never have to ask for them."
        />
      </div>
    )
  }

  return (
    <div className={ui.stack}>
      <div className={ui.grid}>
        <div className={ui.stack}>
          <div className={ui.card}>
            <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Your browser</h2><Badge tone="positive">Detected</Badge></div>
            <div className={`${ui.cardBody} grid grid-cols-2 gap-5`}>
              <Summary label="Browser" value={details.browser} />
              <Summary label="Operating system" value={details.os} />
              <Summary label="Screen resolution" value={details.screen.split(' (')[0]} />
              <Summary label="Viewport" value={details.viewport.replace(' px', '')} />
            </div>
          </div>

          <div className={ui.card}>
            <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Share with support</h2></div>
            <div className={`${ui.cardBody} ${ui.stack}`}>
              <p className="text-sm text-zinc-500">Create a link that contains these details and paste it into your support conversation. The details are stored in the link itself, nothing is uploaded.</p>
              {shareLink ? (
                <div>
                  <label htmlFor="share-link" className={ui.label}>Share link</label>
                  <div className="flex gap-2">
                    <input id="share-link" readOnly value={shareLink} onFocus={(event) => event.target.select()} className={ui.input} />
                    <CopyButton text={shareLink} className="h-10" />
                  </div>
                </div>
              ) : (
                <button type="button" onClick={createShareLink} className={ui.primaryButton}>
                  <LinkIcon aria-hidden="true" className="size-4" />
                  Create share link
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>All details</h2>
            <CopyButton text={asText(details, 'Browser details')} label="Copy all" />
          </div>
          <div className={ui.cardBody}><DetailRows details={details} /></div>
        </div>
      </div>
      <ToolCta
        title="Get these details automatically"
        copy="Screendesk attaches browser, OS and console logs to every customer recording, so nobody has to copy them by hand."
      />
    </div>
  )
}

function Summary({ label, value }) {
  return (
    <div className="min-w-0">
      <p className={ui.metricLabel}>{label}</p>
      <p className="mt-1 truncate text-lg font-semibold tracking-tight text-zinc-900 tabular-nums" title={value}>{value}</p>
    </div>
  )
}

function DetailRows({ details }) {
  return (
    <dl className={ui.rows}>
      {FIELDS.filter(([key]) => details[key]).map(([key, label]) => (
        <div key={key} className={key === 'userAgent' ? 'py-2.5' : ui.row}>
          <dt className={ui.rowLabel}>{label}</dt>
          <dd className={key === 'userAgent' ? 'mt-1.5 break-all font-mono text-xs text-zinc-900' : `${ui.rowValue} text-right`}>{details[key]}</dd>
        </div>
      ))}
    </dl>
  )
}
