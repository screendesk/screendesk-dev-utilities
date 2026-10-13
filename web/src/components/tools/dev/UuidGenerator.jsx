import { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { CodeBlock, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from './DevToolShell'
import { formatUuid, generate, inspectUuid } from './uuid'

const versions = [
  { value: 'v4', label: 'v4 random' },
  { value: 'v7', label: 'v7 time-ordered' },
]

export function UuidGenerator() {
  const [version, setVersion] = useState('v4')
  const [count, setCount] = useState('10')
  const [uppercase, setUppercase] = useState(false)
  const [braces, setBraces] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [uuids, setUuids] = useState([])
  const [inspectInput, setInspectInput] = useState('')

  // User-triggered generation counts as a result; the initial batch on load does not.
  const regenerate = (nextVersion = version, nextCount = count) => {
    setUuids(generate(nextVersion, nextCount))
    trackToolUse('uuid-generator', 'result')
  }

  // UUIDs are random, so generate them on the client only (server markup stays empty and matches).
  useEffect(() => {
    const id = setTimeout(() => setUuids(generate('v4', 10)), 0)
    return () => clearTimeout(id)
  }, [])

  const output = useMemo(() => uuids.map((uuid) => formatUuid(uuid, { uppercase, braces, hyphens })).join('\n'), [uuids, uppercase, braces, hyphens])
  const inspected = useMemo(() => inspectUuid(inspectInput), [inspectInput])

  const countNumber = Number(count)
  const countError = count !== '' && (!Number.isInteger(countNumber) || countNumber < 1 || countNumber > 500)

  return (
    <DevToolShell
      left={
        <DevPane
          title="Generate UUIDs"
          actions={<CopyButton text={output} label={uuids.length > 1 ? 'Copy all' : 'Copy'} />}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <span className={ui.label}>Version</span>
                <Segmented
                  label="UUID version"
                  options={versions}
                  value={version}
                  onChange={(next) => {
                    setVersion(next)
                    regenerate(next)
                  }}
                />
              </div>
              <div className="w-24">
                <label htmlFor="uuid-count" className={ui.label}>How many</label>
                <input id="uuid-count" type="number" min="1" max="500" inputMode="numeric" className={ui.input} value={count} onChange={(event) => setCount(event.target.value)} />
              </div>
              <button
                type="button"
                className={ui.primaryButton}
                disabled={countError}
                onClick={() => regenerate()}
              >
                <ArrowPathIcon aria-hidden="true" className="size-4" />
                Generate
              </button>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <Toggle label="Uppercase" checked={uppercase} onChange={setUppercase} />
              <Toggle label="Hyphens" checked={hyphens} onChange={setHyphens} />
              <Toggle label="Braces { }" checked={braces} onChange={setBraces} />
            </div>
            {countError && <ErrorBox>Enter a number from 1 to 500.</ErrorBox>}
            <CodeBlock label="Generated UUIDs" className="min-h-[14rem]">{output || ' '}</CodeBlock>
            <p className={ui.hint}>
              {version === 'v7'
                ? 'v7 UUIDs start with a millisecond Unix timestamp, so they sort by creation time and index well as database keys.'
                : 'v4 UUIDs carry 122 random bits from your browser’s cryptographic random number generator.'}
            </p>
          </div>
        </DevPane>
      }
      right={
        <DevPane title="Validate and inspect">
          <div className="space-y-4">
            <div>
              <label htmlFor="uuid-inspect" className={ui.label}>UUID or GUID</label>
              <input
                id="uuid-inspect"
                autoComplete="off"
                spellCheck={false}
                className={`${ui.input} font-mono`}
                placeholder="018f3a3e-6b1c-7d2e-9a4b-3c5d6e7f8a9b"
                value={inspectInput}
                onChange={(event) => setInspectInput(event.target.value)}
              />
              <p className={ui.hint}>Accepts hyphenated, braced, urn:uuid: or 32-character forms.</p>
              {uuids[0] && !inspectInput && (
                <button type="button" className={`${ui.smallButton} mt-2`} onClick={() => setInspectInput(uuids[0])}>Inspect the first generated UUID</button>
              )}
            </div>
            {inspected?.error && <ErrorBox>{inspected.error}</ErrorBox>}
            {inspected && !inspected.error && (
              <div className={ui.rows}>
                <div className={ui.row}>
                  <span className={ui.rowLabel}>Status</span>
                  <Badge tone={inspected.special || inspected.variant.startsWith('RFC') ? 'positive' : 'warning'}>
                    {inspected.special || inspected.variant.startsWith('RFC') ? 'Valid UUID' : 'Valid format, non-standard variant'}
                  </Badge>
                </div>
                <div className={ui.row}>
                  <span className={ui.rowLabel}>Canonical</span>
                  <span className={`${ui.rowValue} truncate font-mono text-[13px]`}>{inspected.canonical}</span>
                </div>
                <div className={ui.row}>
                  <span className={ui.rowLabel}>Version</span>
                  <span className={`${ui.rowValue} text-right`}>{inspected.versionName}</span>
                </div>
                <div className={ui.row}>
                  <span className={ui.rowLabel}>Variant</span>
                  <span className={`${ui.rowValue} text-right`}>{inspected.variant}</span>
                </div>
                {Number.isFinite(inspected.timestamp) && (
                  <div className={ui.row}>
                    <span className={ui.rowLabel}>Embedded time</span>
                    <span className={`${ui.rowValue} font-mono text-[13px]`}>{new Date(inspected.timestamp).toISOString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </DevPane>
      }
      below={
        uuids.length > 0 && (
          <ToolCta
            title="Tracing one request ID through a bug report?"
            copy="Screendesk captures the network requests behind a customer’s recording, so the IDs your API returned are already in the ticket."
            label="Try Screendesk free"
          />
        )
      }
    />
  )
}
