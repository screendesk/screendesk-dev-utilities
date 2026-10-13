import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Toggle } from '@/components/tools/dev/DevToolShell'
import { FLAG_INFO, createRegexRunner, highlightSegments } from './regexRun'

const SAMPLE = `[2026-10-13T09:41:07Z] ERROR checkout failed for ada@example.com (order 3f2b9c1e-8d4a-4c6b-9f1e-2a7d5b8c0e14)
[2026-10-13T09:41:09Z] WARN retrying POST https://api.example.com/v2/checkout from 192.168.1.24
[2026-10-13T09:42:30Z] INFO support ticket opened by grace.hopper@example.org
[2026-10-14T11:05:00+02:00] ERROR timeout after 30000ms calling https://status.example.com/health from 10.0.0.255`

const PRESETS = [
  { id: 'email', label: 'Email', source: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}', flags: 'g' },
  { id: 'url', label: 'URL', source: 'https?:\\/\\/[^\\s/$.?#][^\\s]*', flags: 'gi' },
  { id: 'ipv4', label: 'IPv4', source: '\\b(?:(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)\\b', flags: 'g' },
  { id: 'uuid', label: 'UUID', source: '\\b[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\\b', flags: 'gi' },
  { id: 'iso', label: 'ISO date', source: '(?<year>\\d{4})-(?<month>0[1-9]|1[0-2])-(?<day>0[1-9]|[12]\\d|3[01])(?:T(?<time>\\d{2}:\\d{2}(?::\\d{2})?)(?<tz>Z|[+-]\\d{2}:\\d{2})?)?', flags: 'g' },
  { id: 'errors', label: 'Error log lines', source: '^\\[(?<at>[^\\]]+)\\] (?<level>ERROR|WARN) (?<message>.*)$', flags: 'gm' },
]

const FLAG_ORDER = 'gimsuy'
const MAX_LIST = 200
const MAX_HIGHLIGHT_CHARS = 100000

// Accepts a pasted literal like /abc/gi and splits it into source and flags.
function parseLiteral(value) {
  const literal = /^\/([\s\S]+)\/([a-z]*)$/.exec(value)
  if (!literal) return null
  const flags = literal[2]
  if (![...flags].every((flag) => FLAG_ORDER.includes(flag)) || new Set(flags).size !== flags.length) return null
  return { source: literal[1], flags }
}

function sortFlags(flags) {
  return [...FLAG_ORDER].filter((flag) => flags.includes(flag)).join('')
}

function Visible({ value }) {
  if (value === null) return <span className="text-zinc-400">undefined</span>
  if (value === '') return <span className="text-zinc-400">empty</span>
  return <span className="whitespace-pre-wrap break-all text-zinc-900">{value}</span>
}

function Highlighted({ text, matches }) {
  const segments = useMemo(() => highlightSegments(text, matches), [text, matches])
  return (
    <pre aria-label="Test string with matches highlighted" className={clsx(ui.codeOutput, 'max-h-80 min-h-32 whitespace-pre-wrap break-words')}>
      {segments.map((segment, index) =>
        segment.match === -1 ? (
          <span key={index}>{segment.text}</span>
        ) : segment.empty ? (
          <span key={index} title={`Match ${segment.match + 1} (empty)`} className="mx-px inline-block h-4 w-px translate-y-0.5 bg-rose-500" />
        ) : (
          <mark key={index} title={`Match ${segment.match + 1}`} className={clsx('rounded-sm text-zinc-900', segment.match % 2 ? 'bg-rose-200' : 'bg-rose-100')}>
            {segment.text}
          </mark>
        ),
      )}
    </pre>
  )
}

export function RegexTester() {
  const [source, setSource] = useState('')
  const [flags, setFlags] = useState('g')
  const [text, setText] = useState('')
  const [replaceOn, setReplaceOn] = useState(false)
  const [replacement, setReplacement] = useState('')
  const [result, setResult] = useState(null)
  const runner = useRef(null)

  useEffect(() => {
    runner.current = createRegexRunner({ timeoutMs: 1000 })
    return () => runner.current?.dispose()
  }, [])

  // Debounced run in the worker; results arrive asynchronously.
  useEffect(() => {
    if (!source) return undefined
    let cancelled = false
    const key = `${source}\u0000${flags}\u0000${text}\u0000${replaceOn ? replacement : ''}`
    const timer = setTimeout(() => {
      runner.current
        ?.run({ source, flags, text, replacement: replaceOn ? replacement : undefined })
        .then((next) => {
          if (!cancelled && !next.stale) setResult({ ...next, key })
        })
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [source, flags, text, replaceOn, replacement])

  const shown = source ? result : null
  const matches = useMemo(() => shown?.matches || [], [shown])
  const hasMatches = matches.length > 0

  useEffect(() => {
    if (hasMatches) trackToolUse('regex-tester', 'result')
  }, [hasMatches])

  const onPatternChange = (value) => {
    const literal = parseLiteral(value)
    if (literal) {
      setSource(literal.source)
      setFlags(sortFlags(literal.flags))
    } else {
      setSource(value)
    }
  }

  const toggleFlag = (flag) => setFlags((current) => sortFlags(current.includes(flag) ? current.replace(flag, '') : current + flag))

  const applyPreset = (preset) => {
    setSource(preset.source)
    setFlags(preset.flags)
    if (!text.trim()) setText(SAMPLE)
  }

  const matchList = useMemo(() => matches.map((match) => match.value).join('\n'), [matches])

  return (
    <DevToolShell
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500">Common patterns:</span>
          {PRESETS.map((preset) => (
            <button key={preset.id} type="button" className={ui.smallButton} onClick={() => applyPreset(preset)}>
              {preset.label}
            </button>
          ))}
        </div>
      }
      left={
        <DevPane
          title="Pattern and test string"
          actions={
            <>
              <button type="button" className={ui.smallButton} onClick={() => setText(SAMPLE)}>Sample text</button>
              <button
                type="button"
                className={ui.smallButton}
                disabled={!source && !text}
                onClick={() => {
                  setSource('')
                  setText('')
                  setReplacement('')
                }}
              >
                Clear
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="regex-pattern" className={ui.label}>Regular expression</label>
              <div className="flex items-center rounded-md border border-zinc-200 bg-white font-mono text-[13px] focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/20">
                <span aria-hidden="true" className="pl-3 text-zinc-400">/</span>
                <input
                  id="regex-pattern"
                  value={source}
                  onChange={(event) => onPatternChange(event.target.value)}
                  placeholder="\b\w+@\w+\.\w+\b"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  autoCorrect="off"
                  className="h-10 min-w-0 flex-1 bg-transparent px-1 text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
                <span aria-hidden="true" className="pr-3 text-zinc-400">/{flags}</span>
              </div>
              <p className={ui.hint}>JavaScript (ECMAScript) syntax. You can also paste a literal like /abc/gi.</p>
            </div>
            <div>
              <span className={ui.label}>Flags</span>
              <div className={ui.segmented} role="group" aria-label="Regex flags">
                {FLAG_INFO.map(({ flag, name, copy }) => (
                  <button key={flag} type="button" title={`${name}: ${copy}`} aria-pressed={flags.includes(flag)} onClick={() => toggleFlag(flag)} className={clsx(ui.segment(flags.includes(flag)), 'font-mono')}>
                    {flag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="regex-text" className={ui.label}>Test string</label>
              <CodeArea id="regex-text" value={text} onChange={setText} rows={9} placeholder="Paste text to test against, such as log lines or an API response." />
            </div>
            <div className="space-y-2">
              <Toggle label="Replace" checked={replaceOn} onChange={setReplaceOn} />
              {replaceOn && (
                <div>
                  <label htmlFor="regex-replacement" className="sr-only">Replacement</label>
                  <input
                    id="regex-replacement"
                    value={replacement}
                    onChange={(event) => setReplacement(event.target.value)}
                    placeholder="$1, $<name>, $& (whole match)"
                    spellCheck={false}
                    className={clsx(ui.input, 'font-mono text-[13px]')}
                  />
                </div>
              )}
            </div>
          </div>
        </DevPane>
      }
      right={
        <DevPane title="Matches" actions={<CopyButton text={matchList} label="Copy matches" />}>
          {!shown ? (
            <div className={`${ui.empty} min-h-[18.5rem]`}>{source ? 'Testing…' : 'Enter a pattern, or pick a common one above, to see matches here.'}</div>
          ) : shown.timeout ? (
            <ErrorBox hint="Nested quantifiers such as (a+)+ or (.*)* can take exponential time on text that almost matches. Make the pattern more specific, for example [^,]* instead of .*">
              Stopped after 1 second: this pattern is too slow on this text (catastrophic backtracking).
            </ErrorBox>
          ) : shown.error ? (
            <ErrorBox>{shown.error}</ErrorBox>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Badge tone={hasMatches ? 'positive' : 'neutral'}>
                  {matches.length.toLocaleString('en-US')}{shown.truncated ? '+' : ''} {matches.length === 1 ? 'match' : 'matches'}
                </Badge>
                {shown.truncated && <span>Stopped listing at {matches.length.toLocaleString('en-US')} matches.</span>}
                {!flags.includes('g') && <span>Without the g flag only the first match is found.</span>}
              </div>
              {text.length > MAX_HIGHLIGHT_CHARS ? (
                <p className="text-sm text-zinc-500">The text is too long to highlight; see the match list below.</p>
              ) : (
                <Highlighted text={text} matches={matches} />
              )}
              {hasMatches && (
                <ol className="max-h-80 divide-y divide-zinc-100 overflow-auto rounded-md border border-zinc-200 text-[13px]" aria-label="Match list">
                  {matches.slice(0, MAX_LIST).map((match, index) => (
                    <li key={index} className="space-y-1 px-3 py-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-mono"><span className="mr-2 text-zinc-400">{index + 1}</span><Visible value={match.value} /></span>
                        <span className="shrink-0 font-mono text-xs text-zinc-400 tabular-nums">{match.start}–{match.end}</span>
                      </div>
                      {match.groups.length > 0 && (
                        <dl className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0.5 pl-5 font-mono text-xs">
                          {match.groups.map((group) => {
                            const name = match.named?.find((named) => named.span && group.span && named.span[0] === group.span[0] && named.span[1] === group.span[1] && named.value === group.value)?.name
                            return (
                              <div key={group.index} className="contents">
                                <dt className="text-zinc-500">{group.index}{name ? ` ${name}` : ''}</dt>
                                <dd><Visible value={group.value} /></dd>
                                <dd className="text-zinc-400 tabular-nums">{group.span ? `${group.span[0]}–${group.span[1]}` : ''}</dd>
                              </div>
                            )
                          })}
                        </dl>
                      )}
                    </li>
                  ))}
                  {matches.length > MAX_LIST && <li className="px-3 py-2 text-zinc-500">… {(matches.length - MAX_LIST).toLocaleString('en-US')} more (use Copy matches to get all)</li>}
                </ol>
              )}
              {replaceOn && typeof shown.replaced === 'string' && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={ui.label}>Replace preview</span>
                    <CopyButton text={shown.replaced} />
                  </div>
                  <CodeBlock label="Text after replacement" className="min-h-24 whitespace-pre-wrap break-words">{shown.replaced}</CodeBlock>
                </div>
              )}
            </div>
          )}
        </DevPane>
      }
      below={
        hasMatches && (
          <ToolCta
            title="Grepping a customer’s logs for the error?"
            copy="Screendesk bug reports come with the console logs, network requests, and device details attached, so the line you’re matching is already there."
            label="Try Screendesk free"
          />
        )
      }
    />
  )
}
