import { useEffect, useMemo, useState } from 'react'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, CodeBlock, DevPane, DevToolShell, Segmented } from '@/components/tools/dev/DevToolShell'
import { formatSql, minifySql, sqlStats } from './sqlFormat'

const SAMPLE = `-- Tickets reopened after a failed checkout
select t.id, t.subject, u.email, count(e.id) as events, max(e.created_at) last_event from tickets t inner join users u on u.id = t.user_id left join events e on e.ticket_id = t.id and e.type in ('error', 'network_failure') where t.status = 'reopened' and t.created_at >= now() - interval '7 days' and u.id in (select user_id from payments where status = 'failed') group by t.id, t.subject, u.email having count(e.id) > 2 order by last_event desc limit 25;`

const INDENTS = { 2: '  ', 4: '    ', tab: '\t' }

export function SqlFormatter() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState('format')
  const [indent, setIndent] = useState(2)
  const [keywordCase, setKeywordCase] = useState('upper')

  const output = useMemo(() => {
    if (!input.trim()) return ''
    return mode === 'minify' ? minifySql(input, { keywordCase }) : formatSql(input, { indent: INDENTS[indent], keywordCase })
  }, [input, mode, indent, keywordCase])

  const stats = useMemo(() => (output ? sqlStats(input) : null), [input, output])
  const hasOutput = Boolean(output)

  useEffect(() => {
    if (hasOutput) trackToolUse('sql-formatter', 'result')
  }, [hasOutput])

  return (
    <DevToolShell
      toolbar={
        <>
          <Segmented label="Output mode" value={mode} onChange={setMode} options={[{ value: 'format', label: 'Format' }, { value: 'minify', label: 'Minify' }]} />
          {mode === 'format' && (
            <Segmented label="Indentation" value={indent} onChange={setIndent} options={[{ value: 2, label: '2 spaces' }, { value: 4, label: '4 spaces' }, { value: 'tab', label: 'Tab' }]} />
          )}
          <Segmented label="Keyword case" value={keywordCase} onChange={setKeywordCase} options={[{ value: 'upper', label: 'UPPER' }, { value: 'lower', label: 'lower' }, { value: 'preserve', label: 'Keep' }]} />
        </>
      }
      left={
        <DevPane
          title="SQL input"
          actions={
            <>
              <button type="button" className={ui.smallButton} onClick={() => setInput(SAMPLE)}>Sample</button>
              <button type="button" className={ui.smallButton} onClick={() => setInput('')} disabled={!input}>Clear</button>
            </>
          }
        >
          <div className="space-y-3">
            <CodeArea label="SQL input" value={input} onChange={setInput} placeholder="Paste a query, e.g. select id, email from users where plan = 'pro'" />
            {stats && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Badge tone="neutral">{stats.statements} {stats.statements === 1 ? 'statement' : 'statements'}</Badge>
                {stats.comments > 0 && <span>{stats.comments} {stats.comments === 1 ? 'comment' : 'comments'}{mode === 'minify' ? ' removed' : ' kept'}</span>}
                <span aria-hidden="true">·</span>
                <span>{input.length.toLocaleString('en-US')} → {output.length.toLocaleString('en-US')} characters</span>
              </div>
            )}
          </div>
        </DevPane>
      }
      right={
        <DevPane title={mode === 'minify' ? 'Minified SQL' : 'Formatted SQL'} actions={<CopyButton text={output} />}>
          {!hasOutput ? (
            <div className={`${ui.empty} min-h-[18.5rem]`}>Formatted SQL appears here as you type.</div>
          ) : (
            <CodeBlock label={mode === 'minify' ? 'Minified SQL' : 'Formatted SQL'} className={mode === 'minify' ? 'whitespace-pre-wrap break-all' : ''}>{output}</CodeBlock>
          )}
        </DevPane>
      }
      below={
        hasOutput && (
          <ToolCta
            title="Tracking down the query behind a customer’s error?"
            copy="Screendesk bug reports arrive with the console logs, network requests, and device details attached, so you can see the failing API call before you open the database."
            label="Try Screendesk free"
          />
        )
      }
    />
  )
}
