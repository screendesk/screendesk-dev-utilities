import { useEffect, useMemo, useState } from 'react'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { DevPane, ErrorBox, PrivacyNote, Segmented } from './DevToolShell'
import { useMounted, useNow } from './useClientClock'
import { UNITS, formatInZone, isoInZone, parseDateString, parseTimestamp, relativeTime, toLocalInputValue } from './timestamp'

const unitOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 's', label: 's' },
  { value: 'ms', label: 'ms' },
  { value: 'us', label: 'µs' },
  { value: 'ns', label: 'ns' },
]

function Row({ label, value, copy = true }) {
  return (
    <div className={ui.row}>
      <span className={ui.rowLabel}>{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span className={`${ui.rowValue} truncate font-mono text-[13px]`}>{value}</span>
        {copy && <CopyButton text={String(value)} />}
      </span>
    </div>
  )
}

export function TimestampConverter() {
  const mounted = useMounted()
  const now = useNow(1000)
  const [zoneChoice, setZoneChoice] = useState('local')
  const [tsInput, setTsInput] = useState('')
  const [unit, setUnit] = useState('auto')
  const [dateInput, setDateInput] = useState('')

  const localZone = mounted ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' : 'UTC'
  const timeZone = zoneChoice === 'local' ? localZone : zoneChoice
  const zones = useMemo(() => {
    if (!mounted || typeof Intl.supportedValuesOf !== 'function') return []
    return Intl.supportedValuesOf('timeZone').filter((zone) => zone !== 'UTC')
  }, [mounted])

  const tsResult = useMemo(() => parseTimestamp(tsInput, unit), [tsInput, unit])
  const dateResult = useMemo(() => parseDateString(dateInput, timeZone), [dateInput, timeZone])
  const tsValid = tsResult && !tsResult.error
  const dateValid = dateResult && !dateResult.error && Number.isFinite(dateResult.ms)
  const hasResult = tsValid || dateValid

  useEffect(() => {
    if (hasResult) trackToolUse('timestamp-converter', 'result')
  }, [hasResult])

  const nowSeconds = now === null ? null : Math.floor(now / 1000)

  return (
    <div className="space-y-4">
      <div className={`${ui.card} flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between`}>
        <div className="min-w-0">
          <p className={ui.metricLabel}>Current Unix timestamp</p>
          <p className="font-mono text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums" aria-live="off">{nowSeconds ?? '—'}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500 tabular-nums">{now === null ? '—' : `${now} ms`}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopyButton text={nowSeconds === null ? '' : String(nowSeconds)} label="Copy seconds" />
          <CopyButton text={now === null ? '' : String(now)} label="Copy ms" />
          <button type="button" className={ui.smallButton} disabled={now === null} onClick={() => setTsInput(String(nowSeconds))}>Convert now</button>
        </div>
        <div className="sm:w-64">
          <label htmlFor="ts-zone" className={ui.label}>Time zone</label>
          <select id="ts-zone" className={ui.select} value={zoneChoice} onChange={(event) => setZoneChoice(event.target.value)}>
            <option value="local">{mounted ? `Local (${localZone})` : 'Local'}</option>
            <option value="UTC">UTC</option>
            {zones.map((zone) => <option key={zone} value={zone}>{zone.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      <div className={ui.grid}>
        <DevPane title="Timestamp to date">
          <div className="space-y-4">
            <div>
              <label htmlFor="ts-input" className={ui.label}>Unix timestamp</label>
              <div className="flex flex-wrap gap-2">
                <input id="ts-input" inputMode="numeric" autoComplete="off" spellCheck={false} className={`${ui.input} min-w-0 flex-1 font-mono`} placeholder="1760000000" value={tsInput} onChange={(event) => setTsInput(event.target.value)} />
                <Segmented label="Timestamp unit" options={unitOptions} value={unit} onChange={setUnit} />
              </div>
              <p className={ui.hint}>Auto-detects seconds (10 digits), milliseconds (13), microseconds (16) and nanoseconds (19).</p>
            </div>
            {tsResult?.error && <ErrorBox>{tsResult.error}</ErrorBox>}
            {tsValid && (
              <div className={ui.rows}>
                <div className={ui.row}>
                  <span className={ui.rowLabel}>Detected unit</span>
                  <Badge>{UNITS[tsResult.unit].label}</Badge>
                </div>
                <Row label={`Local (${timeZone})`} value={formatInZone(tsResult.ms, timeZone)} />
                <Row label="ISO 8601 (UTC)" value={new Date(tsResult.ms).toISOString()} />
                <Row label="ISO 8601 (zone)" value={isoInZone(tsResult.ms, timeZone)} />
                <Row label="RFC 7231 (HTTP)" value={new Date(tsResult.ms).toUTCString()} />
                <Row label="Relative" value={now === null ? '—' : relativeTime(tsResult.ms, now)} copy={false} />
                <Row label="Seconds" value={Math.floor(tsResult.ms / 1000)} />
                <Row label="Milliseconds" value={Math.trunc(tsResult.ms)} />
              </div>
            )}
            {!tsInput.trim() && <p className="text-sm text-zinc-500">Paste a timestamp from a log line, API response, or database row.</p>}
          </div>
        </DevPane>

        <DevPane title="Date to timestamp">
          <div className="space-y-4">
            <div>
              <label htmlFor="date-picker" className={ui.label}>Date and time in {timeZone}</label>
              <div className="flex gap-2">
                <input
                  id="date-picker"
                  type="datetime-local"
                  step="1"
                  className={`${ui.input} min-w-0 flex-1`}
                  value={/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(dateInput) ? dateInput : ''}
                  onChange={(event) => setDateInput(event.target.value)}
                />
                <button type="button" className={ui.secondaryButton} disabled={now === null} onClick={() => setDateInput(toLocalInputValue(now, timeZone))}>Now</button>
              </div>
            </div>
            <div>
              <label htmlFor="date-text" className={ui.label}>Or paste a date string</label>
              <input id="date-text" autoComplete="off" spellCheck={false} className={`${ui.input} font-mono`} placeholder="2026-10-13T14:05:00Z" value={dateInput} onChange={(event) => setDateInput(event.target.value)} />
              <p className={ui.hint}>ISO 8601, RFC 2822, or HTTP dates. Values without an offset are read in the selected time zone.</p>
            </div>
            {dateResult?.error && <ErrorBox>{dateResult.error}</ErrorBox>}
            {dateValid && (
              <div className={ui.rows}>
                <Row label="Unix seconds" value={Math.floor(dateResult.ms / 1000)} />
                <Row label="Milliseconds" value={dateResult.ms} />
                <Row label="ISO 8601 (UTC)" value={new Date(dateResult.ms).toISOString()} />
                <Row label="Relative" value={now === null ? '—' : relativeTime(dateResult.ms, now)} copy={false} />
              </div>
            )}
          </div>
        </DevPane>
      </div>

      {hasResult && (
        <ToolCta
          title="Matching a customer’s report to your logs?"
          copy="Screendesk recordings carry timestamped console logs and network requests, so you can line up what the customer saw with what your servers did."
          label="Try Screendesk free"
        />
      )}
      <PrivacyNote>Runs entirely in your browser using your device’s clock. Nothing is uploaded.</PrivacyNote>
    </div>
  )
}
