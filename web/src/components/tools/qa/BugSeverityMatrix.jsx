import { useState } from 'react'
import clsx from 'clsx'
import { ui, Badge, CopyButton } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'

const SLUG = 'bug-severity-matrix'

export const impacts = [
  { id: 'blocker', name: 'Blocker', severity: 'S1', copy: 'The product or a core flow can’t be used at all: crash on launch, login down, checkout fails for everyone, data loss, or a security hole.' },
  { id: 'critical', name: 'Critical', severity: 'S2', copy: 'A major feature is broken or produces wrong results, with no reasonable way around it for most people.' },
  { id: 'major', name: 'Major', severity: 'S3', copy: 'A feature works incorrectly or partially; users can get their task done, but with real friction.' },
  { id: 'minor', name: 'Minor', severity: 'S4', copy: 'Small functional issue or confusing behavior that rarely gets in the way.' },
  { id: 'trivial', name: 'Trivial', severity: 'S5', copy: 'Cosmetic: typo, misalignment, or a color off-brand, with no effect on function.' },
]

export const reaches = [
  { id: 'all', name: 'All users', short: 'All', copy: 'Every user or every session hits it.' },
  { id: 'most', name: 'Most users', short: 'Most', copy: 'A common path, browser, or plan.' },
  { id: 'some', name: 'Some users', short: 'Some', copy: 'A specific segment, setting, or device.' },
  { id: 'few', name: 'Edge case', short: 'Few', copy: 'Rare conditions or hard-to-reach states.' },
]

// Base priority by impact (rows) and reach (columns); a workaround lowers it one step.
const matrix = [
  [0, 0, 1, 2],
  [0, 1, 1, 2],
  [1, 2, 2, 3],
  [2, 3, 3, 4],
  [3, 4, 4, 4],
]

export const priorities = [
  { id: 'P0', name: 'Urgent', copy: 'Drop other work; fix or roll back now, hotfix if needed.', tone: 'negative' },
  { id: 'P1', name: 'High', copy: 'Fix in the current sprint or before the next release.', tone: 'negative' },
  { id: 'P2', name: 'Medium', copy: 'Schedule in an upcoming sprint.', tone: 'warning' },
  { id: 'P3', name: 'Low', copy: 'Fix when there is capacity; group with related work.', tone: 'neutral' },
  { id: 'P4', name: 'Backlog', copy: 'Nice to fix; revisit during backlog grooming.', tone: 'neutral' },
]

const cellTones = ['bg-red-50 text-red-700', 'bg-orange-50 text-orange-700', 'bg-amber-50 text-amber-700', 'bg-zinc-50 text-zinc-600', 'bg-white text-zinc-500']

export function BugSeverityMatrix() {
  const [impact, setImpact] = useState('major')
  const [reach, setReach] = useState('some')
  const [workaround, setWorkaround] = useState(false)
  const [touched, setTouched] = useState(false)

  const row = impacts.findIndex((item) => item.id === impact)
  const col = reaches.findIndex((item) => item.id === reach)
  const base = matrix[row][col]
  const level = Math.min(base + (workaround ? 1 : 0), 4)
  const impactDef = impacts[row]
  const reachDef = reaches[col]
  const priority = priorities[level]

  const choose = (setter) => (value) => {
    setter(value)
    setTouched(true)
    trackToolUse(SLUG, 'result')
  }

  const rationale = `${impactDef.name} impact affecting ${reachDef.name.toLowerCase()} gives a base priority of P${base}${workaround ? `; an available workaround lowers it to ${priority.id}` : '; no workaround is available'}.`
  const snippet = [
    `Severity: ${impactDef.severity} - ${impactDef.name}`,
    `Priority: ${priority.id} - ${priority.name}`,
    `Reach: ${reachDef.name}`,
    `Workaround: ${workaround ? 'Yes' : 'No'}`,
    `Rationale: ${rationale}`,
  ].join('\n')

  return (
    <div className="space-y-6">
      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Classify the bug</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <fieldset>
              <legend className={ui.label}>Impact</legend>
              <div className="space-y-2">
                {impacts.map((item) => (
                  <label key={item.id} className={clsx('flex cursor-pointer gap-3 rounded-md border px-3 py-2.5 transition-colors', impact === item.id ? 'border-rose-300 bg-rose-50/50' : 'border-zinc-200 hover:bg-zinc-50')}>
                    <input type="radio" name="impact" value={item.id} checked={impact === item.id} onChange={() => choose(setImpact)(item.id)} className="mt-0.5 accent-rose-500" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-zinc-900">{item.name} <span className="font-normal text-zinc-400">· {item.severity}</span></span>
                      <span className="block text-xs text-zinc-500">{item.copy}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <span className={ui.label}>Reach</span>
              <div className={`${ui.segmented} flex w-full`} role="group" aria-label="Reach">
                {reaches.map((item) => (
                  <button key={item.id} type="button" aria-pressed={reach === item.id} onClick={() => choose(setReach)(item.id)} className={clsx(ui.segment(reach === item.id), 'flex-1 px-2')}>{item.name}</button>
                ))}
              </div>
              <p className={ui.hint}>{reachDef.copy}</p>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-900">
              <input type="checkbox" checked={workaround} onChange={(e) => choose(setWorkaround)(e.target.checked)} className="size-4 accent-rose-500" />
              A reasonable workaround exists
            </label>
          </div>
        </div>

        <div className="space-y-6" aria-live="polite">
          <div className={ui.card}>
            <div className={ui.cardHeader}>
              <h2 className={ui.cardTitle}>Suggested classification</h2>
              <span onClickCapture={() => { setTouched(true); trackToolUse(SLUG, 'result'); trackToolUse(SLUG, 'copy') }}><CopyButton text={snippet} label="Copy for ticket" /></span>
            </div>
            <div className={ui.cardBody}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={ui.metricLabel}>Severity</p>
                  <p className={ui.metric}>{impactDef.severity}</p>
                  <p className="mt-1 text-sm text-zinc-700">{impactDef.name}</p>
                </div>
                <div>
                  <p className={ui.metricLabel}>Priority</p>
                  <p className={ui.metric}>{priority.id}</p>
                  <div className="mt-1"><Badge tone={priority.tone}>{priority.name}</Badge></div>
                </div>
              </div>
              <p className="mt-4 text-sm text-zinc-600">{rationale} {priority.copy}</p>

              <div className="mt-5 relative overflow-x-auto">
                <table className="w-full min-w-[320px] border-separate border-spacing-1 text-center text-xs">
                  <caption className="sr-only">Severity and priority matrix: impact by reach</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="text-left font-medium text-zinc-400">Impact / reach</th>
                      {reaches.map((item) => <th key={item.id} scope="col" className="font-medium text-zinc-500">{item.short}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {impacts.map((item, r) => (
                      <tr key={item.id}>
                        <th scope="row" className="pr-2 text-left font-medium text-zinc-700">{item.name}</th>
                        {reaches.map((reachItem, c) => {
                          const value = Math.min(matrix[r][c] + (workaround ? 1 : 0), 4)
                          const selected = r === row && c === col
                          return (
                            <td key={reachItem.id} aria-current={selected ? 'true' : undefined} className={clsx('h-9 rounded-md font-medium tabular-nums ring-1 ring-inset', cellTones[value], selected ? 'ring-2 ring-rose-500' : 'ring-zinc-200')}>
                              P{value}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {workaround && <p className={ui.hint}>Matrix shown with the workaround adjustment applied.</p>}
              </div>
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-500">Ticket snippet</p>
            <pre className={`${ui.codeOutput} whitespace-pre-wrap`}>{snippet}</pre>
          </div>
        </div>
      </div>
      {touched && (
        <ToolCta title="Give every bug the evidence to triage it fast" copy="Screendesk records the screen with console logs, network requests, and device details, and files it in Jira or Linear." />
      )}
    </div>
  )
}
