import { useEffect, useState } from 'react'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'

// NPS and CSAT share one calculator: enter counts per answer, or paste raw scores, and get the score
// with its 95% margin of error. Both modes reduce to a count per possible answer.

const surveys = {
  nps: {
    slug: 'nps-calculator',
    scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    groups: [
      { id: 'promoters', label: 'Promoters', range: '9–10', match: (s) => s >= 9, bar: 'bg-emerald-500' },
      { id: 'passives', label: 'Passives', range: '7–8', match: (s) => s >= 7 && s <= 8, bar: 'bg-zinc-300' },
      { id: 'detractors', label: 'Detractors', range: '0–6', match: (s) => s <= 6, bar: 'bg-rose-500' },
    ],
    placeholder: '10, 9, 7, 3, 8, 10, 6…',
  },
  csat: {
    slug: 'csat-calculator',
    scale: [1, 2, 3, 4, 5],
    groups: [
      { id: 'satisfied', label: 'Satisfied', range: '4–5', match: (s) => s >= 4, bar: 'bg-emerald-500' },
      { id: 'neutral', label: 'Neutral', range: '3', match: (s) => s === 3, bar: 'bg-zinc-300' },
      { id: 'unsatisfied', label: 'Unsatisfied', range: '1–2', match: (s) => s <= 2, bar: 'bg-rose-500' },
    ],
    placeholder: '5, 4, 4, 2, 5, 3…',
  },
}

function parseScores(text, scale) {
  const values = text.split(/[^0-9]+/).filter(Boolean).map(Number)
  const valid = values.filter((value) => scale.includes(value))
  return { valid, ignored: values.length - valid.length }
}

function npsResult(counts, total) {
  const p = counts.promoters / total
  const d = counts.detractors / total
  const score = (p - d) * 100
  // Variance of the per-response value (+1 promoter, 0 passive, −1 detractor).
  const margin = 1.96 * Math.sqrt(Math.max(0, p + d - (p - d) ** 2) / total) * 100
  const band = score >= 50 ? ['Excellent', 'positive'] : score >= 30 ? ['Good', 'positive'] : score >= 0 ? ['Positive', 'neutral'] : ['Negative', 'negative']
  return { score: Math.round(score), display: `${Math.round(score)}`, margin, band }
}

function csatResult(counts, total) {
  const p = counts.satisfied / total
  const score = p * 100
  const margin = 1.96 * Math.sqrt((p * (1 - p)) / total) * 100
  const band = score >= 90 ? ['Excellent', 'positive'] : score >= 80 ? ['Good', 'positive'] : score >= 70 ? ['Fair', 'warning'] : ['Needs work', 'negative']
  return { score, display: `${score.toFixed(1)}%`, margin, band }
}

export function SurveyScoreCalculator({ type }) {
  const survey = surveys[type]
  const [mode, setMode] = useState('counts')
  const [counts, setCounts] = useState(() => Object.fromEntries(survey.groups.map(({ id }) => [id, ''])))
  const [raw, setRaw] = useState('')

  let groupCounts
  let ignored = 0
  if (mode === 'counts') {
    groupCounts = Object.fromEntries(survey.groups.map(({ id }) => [id, Math.max(0, Math.floor(Number(counts[id]) || 0))]))
  } else {
    const parsed = parseScores(raw, survey.scale)
    ignored = parsed.ignored
    groupCounts = Object.fromEntries(survey.groups.map(({ id, match }) => [id, parsed.valid.filter(match).length]))
  }
  const total = Object.values(groupCounts).reduce((sum, value) => sum + value, 0)
  const result = total > 0 ? (type === 'nps' ? npsResult(groupCounts, total) : csatResult(groupCounts, total)) : null

  const hasResult = Boolean(result)
  useEffect(() => { if (hasResult) trackToolUse(survey.slug) }, [hasResult, survey.slug])

  const label = type === 'nps' ? 'Net Promoter Score' : 'CSAT score'
  const summary = result
    ? `${label}: ${result.display} (±${result.margin.toFixed(1)} at 95% confidence, ${total} responses). ${survey.groups.map(({ id, label: name }) => `${name}: ${groupCounts[id]}`).join(', ')}.`
    : ''

  return (
    <div className={ui.grid}>
      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <h2 className={ui.cardTitle}>Survey responses</h2>
          <div className={ui.segmented} role="group" aria-label="Input mode">
            <button type="button" className={ui.segment(mode === 'counts')} aria-pressed={mode === 'counts'} onClick={() => setMode('counts')}>Counts</button>
            <button type="button" className={ui.segment(mode === 'raw')} aria-pressed={mode === 'raw'} onClick={() => setMode('raw')}>Raw scores</button>
          </div>
        </div>
        <div className={`${ui.cardBody} ${ui.stack}`}>
          {mode === 'counts' ? survey.groups.map(({ id, label: name, range }) => (
            <div key={id}>
              <label htmlFor={`${type}-${id}`} className={ui.label}>{name} <span className="font-normal text-zinc-500">(scored {range})</span></label>
              <input id={`${type}-${id}`} type="number" min="0" inputMode="numeric" className={ui.input} placeholder="0" value={counts[id]} onChange={(event) => setCounts({ ...counts, [id]: event.target.value })} />
            </div>
          )) : (
            <div>
              <label htmlFor={`${type}-raw`} className={ui.label}>Paste scores ({survey.scale[0]}–{survey.scale[survey.scale.length - 1]})</label>
              <textarea id={`${type}-raw`} rows={8} className={ui.code} placeholder={survey.placeholder} value={raw} onChange={(event) => setRaw(event.target.value)} />
              <p className={ui.hint}>Separate scores with commas, spaces, or new lines. Paste a spreadsheet column directly.{ignored > 0 && ` ${ignored} value${ignored === 1 ? '' : 's'} outside the scale ignored.`}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {result ? (
          <div className={ui.card}>
            <div className={ui.cardHeader}>
              <h2 className={ui.cardTitle}>{label}</h2>
              <Badge tone={result.band[1]}>{result.band[0]}</Badge>
            </div>
            <div className={`${ui.cardBody} ${ui.stack}`}>
              <div>
                <p className={ui.metric}>{result.display}</p>
                <p className={ui.metricLabel}>±{result.margin.toFixed(1)} points at 95% confidence · {total} responses</p>
              </div>
              <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
                {survey.groups.map(({ id, bar }) => <span key={id} className={bar} style={{ width: `${(groupCounts[id] / total) * 100}%` }} />)}
              </div>
              <div className={ui.rows}>
                {survey.groups.map(({ id, label: name, range }) => (
                  <div key={id} className={ui.row}>
                    <span className={ui.rowLabel}>{name} ({range})</span>
                    <span className={ui.rowValue}>{groupCounts[id]} · {((groupCounts[id] / total) * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
              {total < 100 && <p className={ui.hint}>With fewer than 100 responses the margin of error is wide. Compare periods only when the difference is larger than the margin.</p>}
              <div className="flex justify-end"><CopyButton text={summary} label="Copy summary" /></div>
            </div>
          </div>
        ) : (
          <div className={ui.empty}>
            <ChartBarIcon aria-hidden="true" className={ui.emptyIcon} />
            Enter your survey responses to see your {label}.
          </div>
        )}
        {result && (
          <ToolCta
            title={type === 'nps' ? 'Find out why detractors scored low.' : 'See what unsatisfied customers saw.'}
            copy="With Screendesk, customers record their screen and voice in one click, so support sees the problem instead of reading about it."
          />
        )}
      </div>
    </div>
  )
}
