import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from '@/components/tools/dev/DevToolShell'
import { collapseUnchanged, diffLines, toSplitRows, toUnifiedText } from '@/components/tools/dev/textDiff'
import { parseJson, sortKeysDeep } from '@/components/tools/dev/jsonFormat'

const SAMPLE_LEFT = `{
  "name": "checkout-service",
  "version": "2.3.0",
  "timeout": 3000,
  "retries": 2,
  "features": ["apple-pay", "coupons"],
  "logLevel": "info"
}`

const SAMPLE_RIGHT = `{
  "name": "checkout-service",
  "version": "2.4.0",
  "timeout": 10000,
  "retries": 2,
  "features": ["apple-pay", "coupons", "gift-cards"],
  "logLevel": "debug"
}`

const tone = {
  delete: 'bg-red-50 text-red-900',
  insert: 'bg-emerald-50 text-emerald-900',
  empty: 'bg-zinc-50',
  equal: 'text-zinc-700',
}
const gutter = 'w-10 select-none px-2 text-right align-top text-zinc-400 tabular-nums'
const cell = 'px-2 align-top whitespace-pre-wrap break-all'

function prepare(text, asJson, side) {
  if (!asJson || !text.trim()) return { text }
  const parsed = parseJson(text)
  if (!parsed.ok) {
    const where = parsed.error.line ? ` (line ${parsed.error.line}, column ${parsed.error.column})` : ''
    return { error: `${side} is not valid JSON${where}: ${parsed.error.message}` }
  }
  return { text: JSON.stringify(sortKeysDeep(parsed.value), null, 2) }
}

function SkipRow({ count, colSpan, onExpand }) {
  return (
    <tr>
      <td colSpan={colSpan} className="border-y border-zinc-100 bg-zinc-50 px-2 py-1 text-center text-xs text-zinc-500">
        <button type="button" onClick={onExpand} className="hover:text-zinc-900 hover:underline">
          {count.toLocaleString('en-US')} unchanged {count === 1 ? 'line' : 'lines'}
        </button>
      </td>
    </tr>
  )
}

function SplitView({ items, onExpand }) {
  return (
    <table className="w-full table-fixed border-collapse font-mono text-[13px] leading-5">
      <colgroup><col className="w-10" /><col /><col className="w-10" /><col /></colgroup>
      <tbody>
        {items.map((row, index) => {
          if (row.type === 'skip') return <SkipRow key={`skip-${index}`} count={row.count} colSpan={4} onExpand={onExpand} />
          const leftTone = row.type === 'equal' ? tone.equal : row.left ? tone.delete : tone.empty
          const rightTone = row.type === 'equal' ? tone.equal : row.right ? tone.insert : tone.empty
          return (
            <tr key={index}>
              <td className={clsx(gutter, leftTone)}>{row.left?.line}</td>
              <td className={clsx(cell, leftTone, 'border-r border-zinc-200')}>
                {row.left && row.type !== 'equal' && <span className="sr-only">Removed: </span>}
                {row.left?.text}
              </td>
              <td className={clsx(gutter, rightTone)}>{row.right?.line}</td>
              <td className={clsx(cell, rightTone)}>
                {row.right && row.type !== 'equal' && <span className="sr-only">Added: </span>}
                {row.right?.text}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

function UnifiedView({ items, onExpand }) {
  return (
    <table className="w-full table-fixed border-collapse font-mono text-[13px] leading-5">
      <colgroup><col className="w-10" /><col className="w-10" /><col className="w-5" /><col /></colgroup>
      <tbody>
        {items.map((op, index) => {
          if (op.type === 'skip') return <SkipRow key={`skip-${index}`} count={op.count} colSpan={4} onExpand={onExpand} />
          const rowTone = tone[op.type]
          return (
            <tr key={index} className={rowTone}>
              <td className={gutter}>{op.aLine}</td>
              <td className={gutter}>{op.bLine}</td>
              <td className="select-none text-center align-top text-zinc-500">
                {op.type === 'insert' ? '+' : op.type === 'delete' ? '−' : ''}
                <span className="sr-only">{op.type === 'insert' ? 'Added' : op.type === 'delete' ? 'Removed' : ''}</span>
              </td>
              <td className={cell}>{op.type === 'equal' ? op.aText ?? op.text : op.text}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function DiffChecker() {
  const [left, setLeft] = useState('')
  const [right, setRight] = useState('')
  const [view, setView] = useState('split')
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [asJson, setAsJson] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const deferredLeft = useDeferredValue(left)
  const deferredRight = useDeferredValue(right)

  const result = useMemo(() => {
    if (!deferredLeft && !deferredRight) return null
    const a = prepare(deferredLeft, asJson, 'Original')
    const b = prepare(deferredRight, asJson, 'Changed')
    if (a.error || b.error) return { ok: false, error: a.error || b.error }
    return diffLines(a.text, b.text, { ignoreWhitespace, ignoreCase })
  }, [deferredLeft, deferredRight, asJson, ignoreWhitespace, ignoreCase])

  const ok = Boolean(result?.ok)
  const identical = ok && result.added === 0 && result.removed === 0

  const items = useMemo(() => {
    if (!ok) return []
    const base = view === 'split' ? toSplitRows(result.ops) : result.ops
    return expanded ? base : collapseUnchanged(base)
  }, [ok, result, view, expanded])

  const unifiedText = useMemo(() => (ok ? toUnifiedText(result.ops) : ''), [ok, result])

  useEffect(() => {
    if (ok && deferredLeft && deferredRight) trackToolUse('diff-checker', 'result')
  }, [ok, deferredLeft, deferredRight])

  const swap = () => {
    setLeft(right)
    setRight(left)
  }

  const clearActions = (value, setValue) => (
    <button type="button" className={ui.smallButton} onClick={() => setValue('')} disabled={!value}>Clear</button>
  )

  return (
    <DevToolShell
      toolbar={
        <>
          <Toggle label="Ignore whitespace" checked={ignoreWhitespace} onChange={setIgnoreWhitespace} />
          <Toggle label="Ignore case" checked={ignoreCase} onChange={setIgnoreCase} />
          <Toggle label="Format as JSON first" checked={asJson} onChange={setAsJson} />
          <div className="flex gap-2 sm:ml-auto">
            <button type="button" className={ui.smallButton} onClick={() => { setLeft(SAMPLE_LEFT); setRight(SAMPLE_RIGHT) }}>Sample</button>
            <button type="button" className={ui.smallButton} onClick={swap} disabled={!left && !right}>Swap sides</button>
          </div>
        </>
      }
      left={
        <DevPane title="Original text" actions={clearActions(left, setLeft)}>
          <CodeArea label="Original text" value={left} onChange={setLeft} placeholder="Paste the original text, config, or log here" />
        </DevPane>
      }
      right={
        <DevPane title="Changed text" actions={clearActions(right, setRight)}>
          <CodeArea label="Changed text" value={right} onChange={setRight} placeholder="Paste the changed version here" />
        </DevPane>
      }
      below={
        <>
          {result && !result.ok && <ErrorBox>{result.error}</ErrorBox>}
          {ok && (
            <div className={ui.card}>
              <div className={clsx(ui.cardHeader, 'flex-wrap py-3')}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={ui.cardTitle}>Differences</h2>
                  {identical ? (
                    <Badge tone="positive">{ignoreWhitespace || ignoreCase ? 'No differences (with options)' : 'Identical'}</Badge>
                  ) : (
                    <>
                      <Badge tone="positive">+{result.added.toLocaleString('en-US')} added</Badge>
                      <Badge tone="negative">−{result.removed.toLocaleString('en-US')} removed</Badge>
                      <Badge>{result.unchanged.toLocaleString('en-US')} unchanged</Badge>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Segmented label="Diff view" value={view} onChange={setView} options={[{ value: 'split', label: 'Side by side' }, { value: 'unified', label: 'Unified' }]} />
                  {!identical && (
                    <button type="button" className={ui.smallButton} onClick={() => setExpanded((value) => !value)}>
                      {expanded ? 'Collapse unchanged' : 'Show all lines'}
                    </button>
                  )}
                  <CopyButton text={unifiedText} label="Copy diff" />
                </div>
              </div>
              <div className="max-h-[40rem] overflow-auto">
                {identical ? (
                  <p className="p-5 text-sm text-zinc-500">Both sides match line for line{ignoreWhitespace || ignoreCase ? ' with the selected options' : ''}.</p>
                ) : view === 'split' ? (
                  <SplitView items={items} onExpand={() => setExpanded(true)} />
                ) : (
                  <UnifiedView items={items} onExpand={() => setExpanded(true)} />
                )}
              </div>
            </div>
          )}
          {ok && deferredLeft && deferredRight && (
            <ToolCta
              title="Comparing what changed between a working and a broken setup?"
              copy="Screendesk records the screen with console logs and network requests, so you can see what actually happened on the customer’s side."
              label="Try Screendesk free"
            />
          )}
        </>
      }
    />
  )
}

