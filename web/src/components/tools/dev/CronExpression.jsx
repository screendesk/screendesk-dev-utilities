import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import clsx from 'clsx'
import { CopyButton, ui } from '@/components/tools/toolUi'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ToolCta } from '@/components/tools/ToolCta'
import { DevPane, DevToolShell, ErrorBox, Segmented } from '@/components/tools/dev/DevToolShell'
import { describeCron, fieldSpecs, macros, nextRuns, parseCron, presets } from '@/components/tools/dev/cronParse'

// A minute-resolution clock that only exists in the browser, so the server render and
// hydration agree (null) and next runs are computed client-side.
function subscribeClock(callback) {
  const id = setInterval(callback, 15000)
  return () => clearInterval(id)
}
const getMinute = () => Math.floor(Date.now() / 60000)
const getServerMinute = () => null

const localFormat = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }

function relative(ms) {
  const minutes = Math.round(ms / 60000)
  if (minutes < 1) return 'in under a minute'
  if (minutes < 60) return `in ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 48) return `in ${hours} h ${minutes % 60} min`
  return `in ${Math.round(hours / 24)} days`
}

function splitFields(expression) {
  const trimmed = expression.trim().replace(/\s+/g, ' ')
  const expanded = macros[trimmed.toLowerCase()] || trimmed
  const parts = expanded ? expanded.split(' ') : []
  return fieldSpecs.map((_, index) => parts[index] ?? '*')
}

export function CronExpression() {
  const [expression, setExpression] = useState('*/15 9-17 * * 1-5')
  const [zone, setZone] = useState('local')
  // The field being typed in, so clearing a field doesn't collapse the expression mid-edit.
  const [draft, setDraft] = useState(null)
  const minute = useSyncExternalStore(subscribeClock, getMinute, getServerMinute)

  const parsed = useMemo(() => {
    try {
      const value = parseCron(expression)
      return { value, description: describeCron(value) }
    } catch (error) {
      return { error: error.message }
    }
  }, [expression])

  const runs = useMemo(() => {
    if (minute === null || !parsed.value) return null
    return nextRuns(parsed.value, new Date(minute * 60000 + 59999), 5, zone)
  }, [minute, parsed, zone])

  const ok = Boolean(parsed.value)
  const edited = expression !== '*/15 9-17 * * 1-5'
  useEffect(() => {
    if (ok && edited) trackToolUse('cron-expression', 'result')
  }, [ok, edited])

  const fields = splitFields(expression)
  const setField = (index, raw) => {
    const value = raw.replace(/\s+/g, '')
    setDraft({ index, value })
    if (!value) return
    const next = fields.slice()
    next[index] = value
    setExpression(next.join(' '))
  }
  const timeZone = minute === null ? '' : Intl.DateTimeFormat().resolvedOptions().timeZone

  return (
    <DevToolShell
      left={
        <DevPane title="Cron expression" actions={<CopyButton text={expression.trim()} />}>
          <div className="space-y-5">
            <div>
              <label htmlFor="cron-input" className="sr-only">Cron expression</label>
              <input
                id="cron-input"
                value={expression}
                onChange={(event) => setExpression(event.target.value)}
                spellCheck={false}
                autoComplete="off"
                autoCapitalize="off"
                className={clsx(ui.input, 'h-12 text-center font-mono text-lg tracking-wide')}
                placeholder="* * * * *"
              />
            </div>
            <div className="grid grid-cols-5 gap-2">
              {fieldSpecs.map((spec, index) => (
                <div key={spec.key} className="min-w-0">
                  <input
                    aria-label={spec.label}
                    value={draft?.index === index ? draft.value : fields[index]}
                    onChange={(event) => setField(index, event.target.value)}
                    onBlur={() => setDraft(null)}
                    spellCheck={false}
                    autoComplete="off"
                    className={clsx(ui.input, 'h-9 px-2 text-center font-mono')}
                  />
                  <p className="mt-1 truncate text-center text-[11px] text-zinc-500" title={spec.allowed}>{spec.label}</p>
                </div>
              ))}
            </div>
            <div>
              <p className={ui.label}>Presets</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setExpression(preset.value)}
                    className={clsx(ui.smallButton, expression.trim() === preset.value && 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-50')}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DevPane>
      }
      right={
        <DevPane
          title="Schedule"
          actions={<Segmented label="Evaluate in time zone" options={[{ value: 'local', label: 'Local' }, { value: 'utc', label: 'UTC' }]} value={zone} onChange={setZone} />}
        >
          {parsed.error ? (
            <ErrorBox hint="Format: minute hour day-of-month month day-of-week, e.g. 0 9 * * 1-5">{parsed.error}</ErrorBox>
          ) : (
            <div className="space-y-5">
              <p className="text-lg font-medium leading-snug text-zinc-900">“{parsed.description.replace(/\.$/, '')}”</p>
              {parsed.value.macro && <p className={ui.hint}>{parsed.value.macro} is shorthand for <code className="font-mono">{parsed.value.expression}</code>.</p>}
              <div>
                <p className={ui.label}>Next 5 runs <span className="font-normal text-zinc-500">({zone === 'utc' ? 'cron running in UTC' : `cron running in ${timeZone || 'your time zone'}`})</span></p>
                {runs === null ? (
                  <p className={ui.hint}>Calculating…</p>
                ) : runs.length === 0 ? (
                  <p className="text-sm text-amber-700">This expression never matches a real date (for example 30 February), so it never runs.</p>
                ) : (
                  <div className="relative overflow-x-auto rounded-md border border-zinc-200">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-xs text-zinc-500">
                        <tr><th scope="col" className="px-3 py-2 font-medium">Local</th><th scope="col" className="px-3 py-2 font-medium">UTC</th><th scope="col" className="px-3 py-2 font-medium"><span className="sr-only">Relative</span></th></tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {runs.map((run) => (
                          <tr key={run.getTime()}>
                            <td className="whitespace-nowrap px-3 py-2 tabular-nums text-zinc-900">{run.toLocaleString(undefined, localFormat)}</td>
                            <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-600">{run.toISOString().slice(0, 16).replace('T', ' ')}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">{relative(run.getTime() - minute * 60000)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2 border-t border-zinc-100 pt-4 text-center">
                {fieldSpecs.map((spec) => (
                  <div key={spec.key} className="min-w-0">
                    <p className="truncate font-mono text-sm text-zinc-900">{parsed.value.fields[spec.key].raw}</p>
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">{spec.allowed.split(' or ')[0].split(';')[0]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DevPane>
      }
      below={ok && edited && (
        <ToolCta
          title="Scheduled job failing silently?"
          copy="When a customer reports that a report or sync never ran, Screendesk captures their screen with console logs and network requests, so the bug report arrives with evidence."
        />
      )}
    />
  )
}
