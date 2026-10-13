import { useEffect, useMemo, useState } from 'react'
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from './DevToolShell'
import { looksEncoded, parseUrl, urlDecode, urlEncode } from './urlTools'

const placeholders = {
  encode: 'Type or paste text to encode, e.g. a query value like name=Jane Doe & Co',
  decode: 'Paste percent-encoded text, e.g. redirect_uri=https%3A%2F%2Fexample.com%2Fcallback',
  parse: 'Paste a full URL, e.g. https://app.example.com/search?q=hello%20world&page=2#results',
}

function transform(text, mode, { encodeMode, plus, perLine }) {
  const apply = (value) => (mode === 'encode' ? urlEncode(value, { mode: encodeMode, plusForSpace: plus }) : urlDecode(value, { plusAsSpace: plus }))
  return perLine ? text.split('\n').map(apply).join('\n') : apply(text)
}

export function UrlEncoder() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState('')
  const [encodeMode, setEncodeMode] = useState('component')
  const [plus, setPlus] = useState(false)
  const [perLine, setPerLine] = useState(false)

  const result = useMemo(() => {
    if (!input) return null
    try {
      if (mode === 'parse') return { parsed: parseUrl(input) }
      const output = transform(input, mode, { encodeMode, plus, perLine })
      return { output, stillEncoded: mode === 'decode' && looksEncoded(output) }
    } catch (error) {
      return { error: error.message }
    }
  }, [input, mode, encodeMode, plus, perLine])

  const ok = Boolean(result && !result.error && (result.output !== undefined || result.parsed))
  useEffect(() => {
    if (ok) trackToolUse('url-encoder', 'result')
  }, [ok])

  const swap = () => {
    if (!ok || mode === 'parse') return
    setInput(result.output)
    setMode(mode === 'encode' ? 'decode' : 'encode')
  }

  const parsed = result?.parsed
  const queryString = parsed ? parsed.params.map(([k, v]) => `${k}=${v}`).join('\n') : ''

  return (
    <DevToolShell
      toolbar={
        <>
          <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }, { value: 'parse', label: 'Parse URL' }]} />
          {mode === 'encode' && <Segmented label="Encoding function" value={encodeMode} onChange={setEncodeMode} options={[{ value: 'component', label: 'Component' }, { value: 'uri', label: 'Full URL' }]} />}
          {mode !== 'parse' && <Toggle label={mode === 'encode' ? 'Spaces as +' : 'Treat + as space'} checked={plus} onChange={setPlus} />}
          {mode !== 'parse' && <Toggle label="Each line separately" checked={perLine} onChange={setPerLine} />}
        </>
      }
      left={
        <DevPane title={mode === 'encode' ? 'Text to encode' : mode === 'decode' ? 'Encoded text' : 'URL to parse'} actions={<button type="button" className={ui.smallButton} onClick={() => setInput('')}>Clear</button>}>
          <CodeArea label="Input" value={input} onChange={setInput} placeholder={placeholders[mode]} />
          {mode === 'encode' && (
            <p className={ui.hint}>
              {encodeMode === 'component'
                ? 'Component (encodeURIComponent) escapes everything except A–Z a–z 0–9 - _ . ! ~ * \' ( ). Use it for a single query value or path segment.'
                : 'Full URL (encodeURI) keeps : / ? # & = and other URL delimiters. Use it on a whole URL that only needs spaces and non-ASCII characters escaped.'}
            </p>
          )}
        </DevPane>
      }
      right={
        mode === 'parse' ? (
          <DevPane title="URL parts" actions={parsed && <CopyButton text={queryString} label="Copy params" />}>
            {result?.error ? <ErrorBox>{result.error}</ErrorBox> : parsed ? (
              <div className="space-y-4">
                {parsed.assumedScheme && <p className="text-xs text-amber-700">No scheme found, so https:// was assumed.</p>}
                <dl className={ui.rows}>
                  {[
                    ['Protocol', parsed.protocol],
                    ['Host', parsed.hostname],
                    ['Port', parsed.port || <span className="font-normal text-zinc-400">default</span>],
                    ['Origin', parsed.origin],
                    ['Path', parsed.pathname],
                    ['Fragment', parsed.hash],
                    ['Username', parsed.username],
                    ['Password', parsed.password && 'set (hidden)'],
                  ].filter(([, value]) => value).map(([label, value]) => (
                    <div key={label} className={ui.row}>
                      <dt className={ui.rowLabel}>{label}</dt>
                      <dd className={`${ui.rowValue} min-w-0 break-all text-right font-mono text-[13px]`}>{value}</dd>
                    </div>
                  ))}
                </dl>
                <ParamTable title="Query parameters" params={parsed.params} />
                {parsed.hashParams.length > 0 && <ParamTable title="Parameters in the fragment" params={parsed.hashParams} />}
              </div>
            ) : <div className={ui.empty}>Paste a URL to see its protocol, host, path, and decoded query parameters.</div>}
          </DevPane>
        ) : (
          <DevPane
            title={mode === 'encode' ? 'Encoded' : 'Decoded'}
            actions={
              <>
                {ok && <button type="button" className={ui.smallButton} onClick={swap}><ArrowsUpDownIcon aria-hidden="true" className="size-3.5" />Swap</button>}
                <CopyButton text={ok ? result.output : ''} />
              </>
            }
          >
            {result?.error ? (
              <ErrorBox hint="If this is a literal % sign (e.g. “100%”), it should be encoded as %25.">{result.error}</ErrorBox>
            ) : ok ? (
              <div className="space-y-3">
                <CodeBlock label="Output" className="whitespace-pre-wrap break-all">{result.output}</CodeBlock>
                {result.stillEncoded && (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-600">
                    <Badge tone="warning">Still encoded</Badge>
                    The result still contains % escapes, so the input was probably encoded twice.
                    <button type="button" className={ui.smallButton} onClick={() => setInput(result.output)}>Decode again</button>
                  </div>
                )}
              </div>
            ) : <div className={ui.empty}>{mode === 'encode' ? 'The percent-encoded result appears here as you type.' : 'The decoded text appears here as you type.'}</div>}
          </DevPane>
        )
      }
      below={ok && (
        <ToolCta title="Chasing a broken redirect or query string?" copy="Screendesk records the customer’s screen with every network request and URL, so you can see exactly what the browser sent." />
      )}
    />
  )
}

function ParamTable({ title, params }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{title} ({params.length})</p>
      {params.length ? (
        <div className="overflow-x-auto rounded-md border border-zinc-200">
          <table className="w-full text-left font-mono text-[13px]">
            <thead className="bg-zinc-50 text-xs text-zinc-500">
              <tr><th scope="col" className="px-3 py-2 font-medium">Key</th><th scope="col" className="px-3 py-2 font-medium">Value (decoded)</th></tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {params.map(([key, value], index) => (
                <tr key={`${key}-${index}`}>
                  <td className="px-3 py-2 align-top text-zinc-900 break-all">{key}</td>
                  <td className="px-3 py-2 align-top text-zinc-700 break-all">{value || <span className="text-zinc-400">(empty)</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="text-sm text-zinc-500">No query parameters.</p>}
    </div>
  )
}
