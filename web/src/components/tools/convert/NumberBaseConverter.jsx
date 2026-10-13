import { useMemo, useState } from 'react'
import { ArrowsUpDownIcon } from '@heroicons/react/24/outline'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { DevPane, ErrorBox, PrivacyNote, Segmented, Toggle } from '@/components/tools/dev/DevToolShell'
import { baseName, bitLength, formatGrouped, groupDigits, parseInBase, toBase, twosComplement } from './numberBase'

const BASES = Array.from({ length: 35 }, (_, index) => index + 2)
const COMMON = [2, 8, 10, 16]
const WIDTHS = [8, 16, 32, 64]

const baseLabel = (base) => (COMMON.includes(base) ? `${baseName(base)} (base ${base})` : `Base ${base}`)

function BaseSelect({ id, label, value, onChange }) {
  return (
    <div>
      <label htmlFor={id} className={ui.label}>{label}</label>
      <select id={id} className={ui.select} value={value} onChange={(event) => onChange(Number(event.target.value))}>
        <optgroup label="Common">
          {COMMON.map((base) => <option key={base} value={base}>{baseLabel(base)}</option>)}
        </optgroup>
        <optgroup label="Any base">
          {BASES.filter((base) => !COMMON.includes(base)).map((base) => <option key={base} value={base}>{baseLabel(base)}</option>)}
        </optgroup>
      </select>
    </div>
  )
}

function ResultRow({ label, display, copy }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <div className="min-w-0">
        <p className="text-xs text-zinc-500">{label}</p>
        <p className="mt-0.5 font-mono text-sm break-all text-zinc-900">{display}</p>
      </div>
      <CopyButton text={copy} className="shrink-0" />
    </div>
  )
}

const fmt = (big) => big.toLocaleString('en-US')

// One converter, three landing pages: each page passes its own default bases and starting value.
export function NumberBaseConverter({ slug = 'number-base-converter', defaultFrom = 10, defaultTo = 16, defaultValue = '' }) {
  const [input, setInput] = useState(defaultValue)
  const [from, setFrom] = useState(defaultFrom)
  const [to, setTo] = useState(defaultTo)
  const [grouped, setGrouped] = useState(true)
  const [bits, setBits] = useState(32)
  // The starting value is an example; only the visitor's own edits count as a result.
  const [touched, setTouched] = useState(false)

  const parsed = useMemo(() => parseInBase(input, from), [input, from])
  const value = parsed.ok ? parsed.value : null

  const markUsed = (nextInput, nextFrom) => {
    setTouched(true)
    if (parseInBase(nextInput, nextFrom).ok) trackToolUse(slug, 'result')
  }

  const changeInput = (next) => {
    setInput(next)
    markUsed(next, from)
  }
  const changeFrom = (next) => {
    setFrom(next)
    markUsed(input, next)
  }
  const changeTo = (next) => {
    setTo(next)
    markUsed(input, from)
  }
  const swap = () => {
    const nextInput = value === null ? input : toBase(value, to)
    setInput(nextInput)
    setFrom(to)
    setTo(from)
    markUsed(nextInput, to)
  }

  const twos = useMemo(() => (value === null ? null : twosComplement(value, bits)), [value, bits])
  const rows = useMemo(() => {
    if (value === null) return []
    const bases = [...COMMON]
    if (!bases.includes(from)) bases.push(from)
    if (!bases.includes(to)) bases.push(to)
    return bases.filter((base) => base !== to).map((base) => ({ base, raw: toBase(value, base), display: formatGrouped(value, base, grouped) }))
  }, [value, from, to, grouped])

  return (
    <div className="space-y-4">
      <div className={ui.grid}>
        <DevPane
          title="Number"
          actions={
            <>
              <button type="button" className={ui.smallButton} onClick={swap} aria-label="Swap from and to bases">
                <ArrowsUpDownIcon aria-hidden="true" className="size-3.5" />
                Swap
              </button>
              <button type="button" className={ui.smallButton} onClick={() => changeInput('')} disabled={!input}>Clear</button>
            </>
          }
        >
          <div className="space-y-4">
            <div>
              <label htmlFor={`${slug}-input`} className={ui.label}>{baseName(from)} value</label>
              <input
                id={`${slug}-input`}
                className={`${ui.input} font-mono`}
                value={input}
                onChange={(event) => changeInput(event.target.value)}
                placeholder={from === 16 ? 'e.g. 1F4 or 0x1F4' : from === 2 ? 'e.g. 1011 0110' : 'e.g. 2024'}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
              />
              <p className={ui.hint}>Whole numbers of any size. A leading minus sign, 0x / 0b / 0o prefixes, and spaces or underscores between digits are fine.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BaseSelect id={`${slug}-from`} label="From" value={from} onChange={changeFrom} />
              <BaseSelect id={`${slug}-to`} label="To" value={to} onChange={changeTo} />
            </div>
            <Toggle label="Group digits (nibbles, bytes, thousands)" checked={grouped} onChange={setGrouped} />
            {!parsed.ok && !parsed.empty && <ErrorBox>{parsed.error}</ErrorBox>}
          </div>
        </DevPane>

        <DevPane title="Result" actions={<CopyButton text={value === null ? '' : toBase(value, to)} />}>
          {value === null ? (
            <div className={ui.empty}>{parsed.empty ? 'Type a number to convert it.' : 'Fix the input to see the result.'}</div>
          ) : (
            <div>
              <p className="text-xs text-zinc-500">{baseLabel(to)}</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-tight break-all text-zinc-900">{formatGrouped(value, to, grouped)}</p>
              <div className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
                {rows.map(({ base, raw, display }) => <ResultRow key={base} label={baseLabel(base)} display={display} copy={raw} />)}
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                {bitLength(value)} {bitLength(value) === 1 ? 'bit' : 'bits'} · {toBase(value < 0n ? -value : value, 10).length} decimal digits
              </p>
            </div>
          )}
        </DevPane>
      </div>

      {twos && (
        <div className={ui.card}>
          <div className={`${ui.cardHeader} min-h-14 flex-wrap py-3`}>
            <h2 className={ui.cardTitle}>Two’s complement</h2>
            <Segmented label="Bit width" value={bits} onChange={setBits} options={WIDTHS.map((width) => ({ value: width, label: `${width}-bit` }))} />
          </div>
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              {twos.overflow ? (
                <Badge tone="warning">Overflow: doesn’t fit in {bits} bits</Badge>
              ) : (
                <Badge tone="positive">Fits in {bits} bits</Badge>
              )}
              <span>Signed range {fmt(twos.signedRange[0])} to {fmt(twos.signedRange[1])}, unsigned 0 to {fmt(twos.unsignedMax)}</span>
            </div>
            {twos.overflow && <p className="text-xs text-zinc-500">Showing the low {bits} bits only, which is what a {bits}-bit register would keep.</p>}
            <div className={ui.rows}>
              <ResultRow label="Bit pattern" display={groupDigits(twos.binary, 4)} copy={twos.binary} />
              <ResultRow label="Hex" display={`0x${groupDigits(twos.hex, 2)}`} copy={`0x${twos.hex}`} />
              <ResultRow label="As signed integer" display={fmt(twos.signed)} copy={twos.signed.toString()} />
              <ResultRow label="As unsigned integer" display={fmt(twos.unsigned)} copy={twos.unsigned.toString()} />
            </div>
          </div>
        </div>
      )}

      {touched && value !== null && (
        <ToolCta
          title="Decoding an error code from a bug report?"
          copy="Screendesk attaches console logs, network requests, and device details to every bug recording, so the codes arrive with the context that explains them."
        />
      )}
      <PrivacyNote>Runs entirely in your browser. Nothing you type here is uploaded or stored.</PrivacyNote>
    </div>
  )
}
