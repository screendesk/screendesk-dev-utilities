import { useEffect, useMemo, useState } from 'react'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from '@/components/tools/dev/DevToolShell'
import { formatJson, jsonStats, jsonType } from '@/components/tools/dev/jsonFormat'

const SAMPLE = '{"id":4821,"status":"error","request":{"method":"POST","url":"/api/v2/checkout","headers":{"content-type":"application/json"}},"response":{"status":502,"body":null},"retries":[120,480,1920],"user":{"plan":"pro","beta":true}}'

const MAX_TREE_CHILDREN = 200

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

const byteLength = (text) => new TextEncoder().encode(text).length

// The line with the error and a caret under the column.
function ErrorContext({ input, line, column }) {
  if (!line) return null
  const text = input.replace(/^\uFEFF/, '').split(/\r?\n/)[line - 1] ?? ''
  // Keep long minified lines readable: show up to 60 characters either side of the error.
  const from = Math.max(0, column - 61)
  const snippet = text.slice(from, column + 60)
  const prefix = from > 0 ? '…' : ''
  return (
    <pre className="mt-2 overflow-x-auto rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs leading-5 text-zinc-700">
      {`${prefix}${snippet}\n${' '.repeat(prefix.length + column - 1 - from)}^`}
    </pre>
  )
}

function Primitive({ value }) {
  if (value === null) return <span className="text-zinc-500">null</span>
  if (typeof value === 'string') return <span className="break-all text-emerald-700">{JSON.stringify(value)}</span>
  if (typeof value === 'number') return <span className="text-amber-700">{String(value)}</span>
  return <span className="text-rose-600">{String(value)}</span>
}

function TreeNode({ name, value, depth }) {
  const label = name !== undefined && <span className="text-zinc-900">{name}: </span>
  if (value === null || typeof value !== 'object') {
    return (
      <li className="py-0.5 pl-4">
        {label}
        <Primitive value={value} />
      </li>
    )
  }
  const isArray = Array.isArray(value)
  const entries = isArray ? value.map((child, index) => [index, child]) : Object.entries(value)
  const shown = entries.slice(0, MAX_TREE_CHILDREN)
  const summary = isArray ? `[${entries.length} ${entries.length === 1 ? 'item' : 'items'}]` : `{${entries.length} ${entries.length === 1 ? 'key' : 'keys'}}`
  return (
    <li className="py-0.5">
      <details open={depth < 2} className="group">
        <summary className="cursor-pointer list-none rounded pl-4 hover:bg-zinc-100 [&::-webkit-details-marker]:hidden">
          <span className="-ml-4 inline-block w-4 text-zinc-400 group-open:rotate-90">›</span>
          {label}
          <span className="text-zinc-500">{summary}</span>
        </summary>
        <ul className="ml-2 border-l border-zinc-200 pl-2">
          {shown.map(([key, child]) => (
            <TreeNode key={key} name={isArray ? key : JSON.stringify(key)} value={child} depth={depth + 1} />
          ))}
          {entries.length > shown.length && <li className="py-0.5 pl-4 text-zinc-500">… {entries.length - shown.length} more (switch to text view to see all)</li>}
        </ul>
      </details>
    </li>
  )
}

export function JsonFormatter() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('format')
  const [indent, setIndent] = useState(2)
  const [sortKeys, setSortKeys] = useState(false)
  const [view, setView] = useState('text')

  const result = useMemo(() => {
    if (!input.trim()) return null
    return formatJson(input, { indent, sortKeys, minify: mode === 'minify' })
  }, [input, indent, sortKeys, mode])

  const stats = useMemo(() => (result?.ok ? jsonStats(result.value) : null), [result])
  const valid = Boolean(result?.ok)

  useEffect(() => {
    if (valid) trackToolUse('json-formatter', 'result')
  }, [valid])

  return (
    <DevToolShell
      toolbar={
        <>
          <Segmented label="Output mode" value={mode} onChange={setMode} options={[{ value: 'format', label: 'Format' }, { value: 'minify', label: 'Minify' }]} />
          {mode === 'format' && (
            <Segmented label="Indentation" value={indent} onChange={setIndent} options={[{ value: 2, label: '2 spaces' }, { value: 4, label: '4 spaces' }, { value: 'tab', label: 'Tab' }]} />
          )}
          <Toggle label="Sort keys" checked={sortKeys} onChange={setSortKeys} />
        </>
      }
      left={
        <DevPane
          title="Input"
          actions={
            <>
              <button type="button" className={ui.smallButton} onClick={() => setInput(SAMPLE)}>Sample</button>
              <button type="button" className={ui.smallButton} onClick={() => setInput('')} disabled={!input}>Clear</button>
            </>
          }
        >
          <div className="space-y-3">
            <CodeArea label="JSON input" value={input} onChange={setInput} placeholder='Paste JSON here, e.g. {"status": "ok"}' />
            {result && !result.ok && (
              <div>
                <ErrorBox hint={result.error.hint}>
                  {result.error.line ? `Line ${result.error.line}, column ${result.error.column}: ` : ''}
                  {result.error.message}
                </ErrorBox>
                <ErrorContext input={input} line={result.error.line} column={result.error.column} />
              </div>
            )}
            {valid && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Badge tone="positive">Valid JSON</Badge>
                <span>Root: {jsonType(result.value)}</span>
                <span aria-hidden="true">·</span>
                <span>{stats.keys.toLocaleString('en-US')} keys</span>
                <span aria-hidden="true">·</span>
                <span>Depth {stats.depth}</span>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(byteLength(input))} in, {formatBytes(byteLength(result.output))} out</span>
              </div>
            )}
          </div>
        </DevPane>
      }
      right={
        <DevPane
          title="Output"
          actions={
            <>
              <Segmented label="Output view" value={view} onChange={setView} options={[{ value: 'text', label: 'Text' }, { value: 'tree', label: 'Tree' }]} />
              <CopyButton text={valid ? result.output : ''} />
            </>
          }
        >
          {!valid ? (
            <div className={`${ui.empty} min-h-[18.5rem]`}>
              {result ? 'Fix the error on the left to see formatted output.' : 'Formatted JSON appears here as you type.'}
            </div>
          ) : view === 'tree' ? (
            <ul aria-label="JSON tree" className="max-h-[32rem] min-h-[18.5rem] overflow-auto rounded-md border border-zinc-200 bg-zinc-50 py-2 pr-3 font-mono text-[13px] leading-5">
              <TreeNode value={result.value} depth={0} />
            </ul>
          ) : (
            <CodeBlock label="Formatted JSON" className={mode === 'minify' ? 'whitespace-pre-wrap break-all' : ''}>{result.output}</CodeBlock>
          )}
        </DevPane>
      }
      below={
        valid && (
          <ToolCta
            title="Got this JSON from a customer’s bug report?"
            copy="Screendesk captures the network requests and responses behind a bug, so you get the failing payload without asking for it."
            label="Try Screendesk free"
          />
        )
      }
    />
  )
}
