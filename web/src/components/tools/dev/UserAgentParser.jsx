import { useMemo, useState, useSyncExternalStore } from 'react'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { CodeArea, DevPane, DevToolShell } from './DevToolShell'
import { parseUserAgent } from './parseUserAgent'

const samples = [
  { label: 'Chrome on macOS', ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36' },
  { label: 'Edge on Windows', ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Edg/129.0.2792.79' },
  { label: 'Safari on iPhone', ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1' },
  { label: 'Samsung Internet on Android', ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/25.0 Chrome/121.0.0.0 Mobile Safari/537.36' },
  { label: 'Firefox on Linux', ua: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:130.0) Gecko/20100101 Firefox/130.0' },
  { label: 'Googlebot', ua: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
  { label: 'curl', ua: 'curl/8.7.1' },
]

const subscribe = () => () => {}
const getUserAgent = () => navigator.userAgent
const getServerUserAgent = () => ''

const join = (...parts) => parts.filter(Boolean).join(' ') || null

export function UserAgentParser() {
  const detected = useSyncExternalStore(subscribe, getUserAgent, getServerUserAgent)
  const [input, setRawInput] = useState(null) // null = show the visitor's own user agent
  const value = input ?? detected
  const isOwn = input === null || input === detected
  const result = useMemo(() => (value.trim() ? parseUserAgent(value) : null), [value])

  const setInput = (next) => {
    setRawInput(next)
    if (next?.trim()) trackToolUse('user-agent-parser', 'result')
  }

  const rows = result && [
    ['Browser', join(result.browser.name, result.browser.version)],
    ['Engine', join(result.engine.name, result.engine.version)],
    ['Operating system', join(result.os.name, result.os.version)],
    ['Device type', result.device.type],
    ['Device vendor', result.device.vendor],
    ['Device model', result.device.model],
    ['Bot or crawler', result.bot.isBot ? join(result.bot.name, result.bot.version) : 'No'],
  ]
  const json = result ? JSON.stringify(result, null, 2) : ''

  return (
    <DevToolShell
      toolbar={
        <>
          <button type="button" className={ui.smallButton} onClick={() => setInput(null)} disabled={isOwn}>Use my user agent</button>
          <label className="sr-only" htmlFor="ua-sample">Load a sample user agent</label>
          <select id="ua-sample" className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20" value="" onChange={(event) => event.target.value && setInput(event.target.value)}>
            <option value="">Load a sample…</option>
            {samples.map(({ label, ua }) => <option key={label} value={ua}>{label}</option>)}
          </select>
        </>
      }
      left={
        <DevPane title={isOwn && value ? 'Your user agent' : 'User agent string'} actions={<><CopyButton text={value} /><button type="button" className={ui.smallButton} onClick={() => setInput('')}>Clear</button></>}>
          <CodeArea label="User agent string" value={value} onChange={setInput} rows={6} placeholder="Paste a User-Agent header, e.g. from a bug report or server log" className="break-all" />
          <p className={ui.hint}>Paste a User-Agent header from a log, a bug report, or a request in your browser’s network tab.</p>
        </DevPane>
      }
      right={
        <DevPane title="Parsed result" actions={result && <><Badge tone={result.bot.isBot ? 'warning' : 'positive'}>{result.bot.isBot ? 'Bot' : 'Human browser'}</Badge><CopyButton text={json} label="Copy JSON" /></>}>
          {result ? (
            <dl className={ui.rows}>
              {rows.map(([label, cell]) => (
                <div key={label} className={ui.row}>
                  <dt className={ui.rowLabel}>{label}</dt>
                  <dd className={`${ui.rowValue} text-right first-letter:uppercase`}>{cell || <span className="font-normal text-zinc-400">Unknown</span>}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className={ui.empty}>Paste a user agent string to see the browser, OS, and device.</div>
          )}
        </DevPane>
      }
      below={result && (
        <ToolCta title="Tired of asking customers which browser they use?" copy="Screendesk captures the browser, OS, and device with every recording, along with console logs and network requests." />
      )}
    />
  )
}
