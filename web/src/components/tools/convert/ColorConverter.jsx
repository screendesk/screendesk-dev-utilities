import { useEffect, useMemo, useState } from 'react'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { DevPane, DevToolShell, ErrorBox } from '@/components/tools/dev/DevToolShell'
import { contrastRatio, flatten, formatColor, parseColor, wcagLevels } from './color'

const WHITE = { r: 255, g: 255, b: 255 }
const BLACK = { r: 0, g: 0, b: 0 }
const DEFAULT_COLOR = '#e11d48'

const examples = ['#0ea5e9', 'rgb(34 197 94)', 'hsl(38, 92%, 50%)', 'oklch(0.55 0.2 260)', 'rgba(0, 0, 0, 0.6)']

const formats = [
  { key: 'hex', label: 'HEX' },
  { key: 'rgb', label: 'RGB' },
  { key: 'rgbModern', label: 'RGB (CSS Color 4)' },
  { key: 'hsl', label: 'HSL' },
  { key: 'hsv', label: 'HSV / HSB' },
  { key: 'oklch', label: 'OKLCH' },
]

function Level({ pass, children }) {
  return <Badge tone={pass ? 'positive' : 'negative'}>{children} {pass ? 'pass' : 'fail'}</Badge>
}

function ContrastCard({ name, background, color }) {
  const fg = flatten(color, background)
  const ratio = contrastRatio(fg, background)
  const levels = wcagLevels(ratio)
  const fgCss = `rgb(${fg.r} ${fg.g} ${fg.b})`
  const bgCss = `rgb(${background.r} ${background.g} ${background.b})`
  return (
    <div className={ui.card}>
      <div className="rounded-t-lg border-b border-zinc-200 px-4 py-5" style={{ background: bgCss }}>
        <p className="text-lg font-semibold" style={{ color: fgCss }}>Text on {name}</p>
        <p className="text-sm" style={{ color: fgCss }}>The quick brown fox jumps over the lazy dog.</p>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-zinc-500">Contrast vs {name}</span>
          <span className="text-xl font-semibold tabular-nums text-zinc-900">{ratio.toFixed(2)}:1</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Level pass={levels.aaNormal}>AA</Level>
          <Level pass={levels.aaLarge}>AA large</Level>
          <Level pass={levels.aaaNormal}>AAA</Level>
          <Level pass={levels.aaaLarge}>AAA large</Level>
        </div>
      </div>
    </div>
  )
}

export function ColorConverter() {
  const [input, setInput] = useState(DEFAULT_COLOR)
  const [touched, setTouched] = useState(false)

  const parsed = useMemo(() => parseColor(input), [input])
  const color = parsed.color
  const out = useMemo(() => (color ? formatColor(color) : null), [color])

  const update = (value) => {
    setInput(value)
    setTouched(true)
  }

  const hasResult = touched && Boolean(color)
  useEffect(() => {
    if (hasResult) trackToolUse('color-converter', 'result')
  }, [hasResult])

  return (
    <DevToolShell
      left={
        <DevPane title="Color" actions={<button type="button" className={ui.smallButton} onClick={() => update(DEFAULT_COLOR)}>Reset</button>}>
          <div className="space-y-4">
            <div>
              <label htmlFor="color-input" className={ui.label}>Any color value</label>
              <div className="flex gap-2">
                <input
                  id="color-input"
                  className={`${ui.input} font-mono`}
                  value={input}
                  onChange={(event) => update(event.target.value)}
                  placeholder="#e11d48, rgb(225 29 72), hsl(347 77% 50%)…"
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                />
                <label className="relative size-10 shrink-0 cursor-pointer overflow-hidden rounded-md border border-zinc-200" title="Pick a color">
                  <span className="sr-only">Pick a color</span>
                  <input
                    type="color"
                    value={out ? out.hexOpaque : '#000000'}
                    onChange={(event) => update(event.target.value)}
                    className="absolute inset-0 size-full cursor-pointer opacity-0"
                  />
                  <span aria-hidden="true" className="block size-full" style={{ background: out ? out.hexOpaque : 'transparent' }} />
                </label>
              </div>
              <p className={ui.hint}>Accepts HEX (3, 4, 6 or 8 digits), rgb()/rgba(), hsl()/hsla(), hsv() and oklch(), with commas or spaces.</p>
            </div>
            {parsed.error && <ErrorBox>{parsed.error}</ErrorBox>}
            {parsed.outOfGamut && <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">This OKLCH color is outside the sRGB gamut, so the other formats show the nearest displayable color.</p>}
            <div
              aria-hidden="true"
              className="h-32 rounded-lg border border-zinc-200"
              style={{
                backgroundImage: 'linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)',
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
              }}
            >
              <div className="size-full rounded-lg" style={{ background: out ? out.rgbModern : 'transparent' }} />
            </div>
            <div>
              <p className={ui.label}>Try</p>
              <div className="flex flex-wrap gap-2">
                {examples.map((example) => (
                  <button key={example} type="button" className={`${ui.smallButton} font-mono`} onClick={() => update(example)}>{example}</button>
                ))}
              </div>
            </div>
          </div>
        </DevPane>
      }
      right={
        <DevPane title="Converted">
          {out ? (
            <ul className={ui.rows}>
              {formats.map(({ key, label }) => (
                <li key={key} className={ui.row}>
                  <div className="min-w-0">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="truncate font-mono text-sm text-zinc-900">{out[key]}</p>
                  </div>
                  <CopyButton text={out[key]} />
                </li>
              ))}
            </ul>
          ) : (
            <div className={ui.empty}>Enter a valid color to see every format.</div>
          )}
        </DevPane>
      }
      below={
        <>
          {color && (
            <div className="grid gap-4 sm:grid-cols-2">
              <ContrastCard name="white" background={WHITE} color={color} />
              <ContrastCard name="black" background={BLACK} color={color} />
            </div>
          )}
          {hasResult && (
            <ToolCta
              title="Spotted a color that looks wrong in production?"
              copy="Screendesk bug reports include a screen recording plus the browser, device and console logs, so design bugs come with the context to fix them."
            />
          )}
        </>
      }
    />
  )
}
