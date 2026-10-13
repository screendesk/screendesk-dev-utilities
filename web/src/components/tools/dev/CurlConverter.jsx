import { useEffect, useMemo, useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { CopyButton, ui } from '@/components/tools/toolUi'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ToolCta } from '@/components/tools/ToolCta'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Segmented } from '@/components/tools/dev/DevToolShell'
import { languages, parseCurl } from '@/components/tools/dev/curlConvert'

const sample = `curl 'https://api.example.com/v1/tickets?status=open' \\
  -X POST \\
  -H 'Authorization: Bearer YOUR_TOKEN' \\
  -H 'Content-Type: application/json' \\
  --data-raw '{"subject":"Checkout button does nothing","priority":"high"}' \\
  --compressed`

export function CurlConverter() {
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState('fetch')

  const result = useMemo(() => {
    if (!input.trim()) return null
    try {
      const request = parseCurl(input)
      const target = languages.find(({ id }) => id === language) || languages[0]
      return { request, code: target.convert(request) }
    } catch (error) {
      return { error: error.message }
    }
  }, [input, language])

  const ok = Boolean(result && !result.error)
  useEffect(() => {
    if (ok) trackToolUse('curl-converter', 'result')
  }, [ok])

  const request = ok ? result.request : null

  return (
    <DevToolShell
      toolbar={
        <div className="-mx-1 max-w-full overflow-x-auto px-1">
          <Segmented label="Output language" options={languages.map(({ id, label }) => ({ value: id, label }))} value={language} onChange={setLanguage} />
        </div>
      }
      left={
        <DevPane
          title="curl command"
          actions={<>
            <button type="button" className={ui.smallButton} onClick={() => setInput(sample)}>Load example</button>
            <button type="button" className={ui.smallButton} onClick={() => setInput('')}>Clear</button>
          </>}
        >
          <div className="space-y-3">
            <CodeArea label="curl command" value={input} onChange={setInput} placeholder={"curl https://api.example.com/users \\\n  -H 'Authorization: Bearer …'"} />
            <p className={ui.hint}>Tip: in Chrome or Firefox DevTools, right-click a request in the Network tab and choose Copy → Copy as cURL (bash).</p>
          </div>
        </DevPane>
      }
      right={
        <DevPane title={languages.find(({ id }) => id === language)?.label || 'Code'} actions={<CopyButton text={ok ? result.code : ''} />}>
          <div className="space-y-3">
            {result?.error ? (
              <ErrorBox hint="Check that quotes are balanced and the command starts with curl.">{result.error}</ErrorBox>
            ) : null}
            {ok ? (
              <CodeBlock label="Converted code">{result.code}</CodeBlock>
            ) : (
              !result?.error && <div className={ui.empty}>Paste a curl command to convert it to code.</div>
            )}
          </div>
        </DevPane>
      }
      below={request && (
        <div className="space-y-4">
          <div className={ui.card}>
            <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Parsed request</h2></div>
            <div className="px-5 py-2">
              <div className={ui.rows}>
                <div className={ui.row}><span className={ui.rowLabel}>Method</span><span className={ui.rowValue}>{request.method}</span></div>
                <div className={ui.row}><span className={ui.rowLabel}>URL</span><span className={`${ui.rowValue} min-w-0 truncate font-mono text-xs`} title={request.url}>{request.url}</span></div>
                <div className={ui.row}><span className={ui.rowLabel}>Headers</span><span className={ui.rowValue}>{request.headers.length + (request.cookie ? 1 : 0)}</span></div>
                <div className={ui.row}>
                  <span className={ui.rowLabel}>Body</span>
                  <span className={ui.rowValue}>{request.form.length ? `Multipart form (${request.form.length} fields)` : request.json !== undefined ? 'JSON' : request.body !== null ? `${request.body.length} characters` : 'None'}</span>
                </div>
                {request.user && <div className={ui.row}><span className={ui.rowLabel}>Auth</span><span className={ui.rowValue}>Basic ({request.user.username})</span></div>}
              </div>
            </div>
          </div>
          {request.warnings.length > 0 && (
            <ul className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {request.warnings.map((warning) => (
                <li key={warning} className="flex gap-2"><ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{warning}</li>
              ))}
            </ul>
          )}
          <ToolCta
            title="Need the exact request that failed for a customer?"
            copy="Screendesk records the customer’s screen together with console logs and network requests, so you can replay the failing call instead of asking for a curl."
          />
        </div>
      )}
    />
  )
}
