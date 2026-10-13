import { useMemo, useState } from 'react'
import { CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { DevPane, ErrorBox, PrivacyNote } from '@/components/tools/dev/DevToolShell'
import { conversionTable, formatUnit, parseNumber, pxToPt, pxToRem, pxToVw, remToPx } from './pxRem'

const SLUG = 'px-to-rem'

function UnitField({ id, label, unit, value, onChange, hint }) {
  return (
    <div>
      <label htmlFor={id} className={ui.label}>{label}</label>
      <div className="relative">
        <input id={id} inputMode="decimal" autoComplete="off" className={`${ui.input} pr-12 tabular-nums`} value={value} onChange={(event) => onChange(event.target.value)} />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-500">{unit}</span>
      </div>
      {hint && <p className={ui.hint}>{hint}</p>}
    </div>
  )
}

function OutputRow({ label, value, copy }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className="flex items-center gap-3">
        <span className="font-mono text-sm text-zinc-900">{value}</span>
        <CopyButton text={copy ?? value} />
      </span>
    </div>
  )
}

export function PxRemConverter() {
  const [base, setBase] = useState('16')
  const [viewport, setViewport] = useState('1440')
  const [px, setPx] = useState('24')
  const [rem, setRem] = useState('1.5')
  const [touched, setTouched] = useState(false)

  const baseValue = parseNumber(base)
  const baseOk = baseValue !== null && baseValue > 0
  const viewportValue = parseNumber(viewport)
  const viewportOk = viewportValue !== null && viewportValue > 0
  const pxValue = parseNumber(px)

  const markUsed = (ok) => {
    setTouched(true)
    if (ok) trackToolUse(SLUG, 'result')
  }

  const changePx = (next) => {
    setPx(next)
    const value = parseNumber(next)
    if (value !== null && baseOk) setRem(formatUnit(pxToRem(value, baseValue)))
    markUsed(value !== null && baseOk)
  }
  const changeRem = (next) => {
    setRem(next)
    const value = parseNumber(next)
    if (value !== null && baseOk) setPx(formatUnit(remToPx(value, baseValue)))
    markUsed(value !== null && baseOk)
  }
  // A new root size keeps the pixel value and recalculates rem.
  const changeBase = (next) => {
    setBase(next)
    const value = parseNumber(next)
    const ok = value !== null && value > 0
    if (ok && pxValue !== null) setRem(formatUnit(pxToRem(pxValue, value)))
    markUsed(ok && pxValue !== null)
  }

  const table = useMemo(() => (baseOk ? conversionTable(baseValue) : []), [baseOk, baseValue])
  const result = baseOk && pxValue !== null
  const remText = result ? formatUnit(pxToRem(pxValue, baseValue)) : ''

  return (
    <div className="space-y-4">
      <div className={ui.grid}>
        <DevPane title="Convert">
          <div className="space-y-4">
            <UnitField id="px-rem-base" label="Root font size" unit="px" value={base} onChange={changeBase} hint="Browsers default to 16px. Change it if your html element sets another font-size." />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <UnitField id="px-rem-px" label="Pixels" unit="px" value={px} onChange={changePx} />
              <UnitField id="px-rem-rem" label="Rem" unit="rem" value={rem} onChange={changeRem} />
            </div>
            <UnitField id="px-rem-viewport" label="Viewport width (for vw)" unit="px" value={viewport} onChange={setViewport} />
            {!baseOk && <ErrorBox>Enter a root font size greater than 0.</ErrorBox>}
            {baseOk && px.trim() !== '' && pxValue === null && <ErrorBox>Enter a number of pixels, like 24 or 13.5.</ErrorBox>}
          </div>
        </DevPane>

        <DevPane title="Result" actions={<CopyButton text={result ? `font-size: ${remText}rem; /* ${formatUnit(pxValue)}px */` : ''} label="Copy CSS" />}>
          {!result ? (
            <div className={ui.empty}>Enter a pixel or rem value to convert it.</div>
          ) : (
            <div>
              <p className="text-xs text-zinc-500">{formatUnit(pxValue)}px at a {formatUnit(baseValue)}px root</p>
              <p className="mt-1 font-mono text-2xl font-semibold tracking-tight text-zinc-900">{remText}rem</p>
              <div className="mt-4 divide-y divide-zinc-100 border-t border-zinc-100">
                <OutputRow label="rem" value={`${remText}rem`} />
                <OutputRow label="em (parent at root size)" value={`${remText}em`} />
                <OutputRow label="pt" value={`${formatUnit(pxToPt(pxValue), 2)}pt`} />
                <OutputRow label="% of root" value={`${formatUnit(pxToRem(pxValue, baseValue) * 100, 2)}%`} />
                {viewportOk && <OutputRow label={`vw at ${formatUnit(viewportValue)}px wide`} value={`${formatUnit(pxToVw(pxValue, viewportValue))}vw`} />}
              </div>
            </div>
          )}
        </DevPane>
      </div>

      {table.length > 0 && (
        <div className={ui.card}>
          <div className={`${ui.cardHeader} min-h-14 py-3`}>
            <h2 className={ui.cardTitle}>1–96px at a {formatUnit(baseValue)}px root</h2>
            <CopyButton text={table.map((row) => `${row.px}px = ${row.rem}rem`).join('\n')} label="Copy table" />
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-sm tabular-nums">
              <caption className="sr-only">Pixels to rem conversion table</caption>
              <thead className="sticky top-0 bg-zinc-50 text-left text-xs text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">px</th>
                  <th scope="col" className="px-4 py-2 font-medium">rem</th>
                  <th scope="col" className="px-4 py-2 font-medium">pt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {table.map((row) => (
                  <tr key={row.px} className={row.px === pxValue ? 'bg-rose-50' : undefined}>
                    <td className="px-4 py-1.5 font-mono text-zinc-900">{row.px}px</td>
                    <td className="px-4 py-1.5 font-mono text-zinc-700">{row.rem}rem</td>
                    <td className="px-4 py-1.5 font-mono text-zinc-500">{row.pt}pt</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {touched && result && (
        <ToolCta
          title="Layout breaking on someone else’s screen?"
          copy="Screendesk bug recordings attach the browser, screen size, and device details automatically, along with console logs and network requests."
        />
      )}
      <PrivacyNote>Runs entirely in your browser. Nothing you type here is uploaded or stored.</PrivacyNote>
    </div>
  )
}
