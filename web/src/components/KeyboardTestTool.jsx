import { useRef, useState } from 'react'
import clsx from 'clsx'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ui } from '@/components/tools/toolUi'

// US ANSI layout. Each key is [event.code, label, width in key units]; [null, width] is a gap.
// The main block is 15 units wide, the navigation cluster 3 units.
const fnKeys = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => [`F${from + i}`, `F${from + i}`])
const letters = (chars) => chars.split('').map((c) => [`Key${c}`, c])

const layout = [
  {
    main: [['Escape', 'Esc'], [null, 1], ...fnKeys(1, 4), [null, 0.5], ...fnKeys(5, 8), [null, 0.5], ...fnKeys(9, 12)],
    nav: [['PrintScreen', 'PrtSc'], ['ScrollLock', 'ScrLk'], ['Pause', 'Pause']],
  },
  {
    main: [['Backquote', '`'], ...'1234567890'.split('').map((d) => [`Digit${d}`, d]), ['Minus', '-'], ['Equal', '='], ['Backspace', 'Backspace', 2]],
    nav: [['Insert', 'Ins'], ['Home', 'Home'], ['PageUp', 'PgUp']],
  },
  {
    main: [['Tab', 'Tab', 1.5], ...letters('QWERTYUIOP'), ['BracketLeft', '['], ['BracketRight', ']'], ['Backslash', '\\', 1.5]],
    nav: [['Delete', 'Del'], ['End', 'End'], ['PageDown', 'PgDn']],
  },
  {
    main: [['CapsLock', 'Caps Lock', 1.75], ...letters('ASDFGHJKL'), ['Semicolon', ';'], ['Quote', "'"], ['Enter', 'Enter', 2.25]],
    nav: [],
  },
  {
    main: [['ShiftLeft', 'Shift', 2.25], ...letters('ZXCVBNM'), ['Comma', ','], ['Period', '.'], ['Slash', '/'], ['ShiftRight', 'Shift', 2.75]],
    nav: [[null, 1], ['ArrowUp', '↑'], [null, 1]],
  },
  {
    main: [['ControlLeft', 'Ctrl', 1.25], ['MetaLeft', 'Win / ⌘', 1.25], ['AltLeft', 'Alt / ⌥', 1.25], ['Space', 'Space', 6.25], ['AltRight', 'Alt / ⌥', 1.25], ['MetaRight', 'Win / ⌘', 1.25], ['ContextMenu', 'Menu', 1.25], ['ControlRight', 'Ctrl', 1.25]],
    nav: [['ArrowLeft', '←'], ['ArrowDown', '↓'], ['ArrowRight', '→']],
  },
]

const layoutCodes = new Set(layout.flatMap((row) => [...row.main, ...row.nav]).filter(([code]) => code).map(([code]) => code))
const locations = ['Standard', 'Left', 'Right', 'Numpad']

export function KeyboardTestTool() {
  const areaRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const [pressed, setPressed] = useState(() => new Set())
  const [tested, setTested] = useState(() => new Set())
  const [last, setLast] = useState(null)

  const markTested = (code) => {
    setTested((prev) => (prev.has(code) ? prev : new Set(prev).add(code)))
  }

  const onKeyDown = (event) => {
    // Leave browser and OS shortcuts (Cmd+W, Ctrl+T, Ctrl+R…) alone; block everything else
    // so Tab, Space, arrows and F-keys don't move focus or scroll while testing.
    if (!event.metaKey && !event.ctrlKey) event.preventDefault()
    const code = event.code || event.key
    setLast({ key: event.key === ' ' ? 'Space' : event.key, code, location: locations[event.location] || String(event.location), keyCode: event.keyCode })
    if (event.repeat) return
    setPressed((prev) => new Set(prev).add(code))
    markTested(code)
    trackToolUse('keyboard-test', 'result')
  }

  const onKeyUp = (event) => {
    if (!event.metaKey && !event.ctrlKey) event.preventDefault()
    const code = event.code || event.key
    // Some keys (Print Screen on Windows) only fire keyup.
    markTested(code)
    // macOS swallows keyups for other keys while Cmd is held, so clear everything when Cmd is released.
    if (code === 'MetaLeft' || code === 'MetaRight') setPressed(new Set())
    else setPressed((prev) => {
      if (!prev.has(code)) return prev
      const next = new Set(prev)
      next.delete(code)
      return next
    })
  }

  const reset = () => {
    setPressed(new Set())
    setTested(new Set())
    setLast(null)
    areaRef.current?.focus()
  }

  const testedOnLayout = [...tested].filter((code) => layoutCodes.has(code)).length
  const extraKeys = [...tested].filter((code) => !layoutCodes.has(code))

  const renderKeys = (keys) => keys.map(([code, label, width = 1], index) => {
    if (!code) return <div key={`gap-${index}`} aria-hidden="true" style={{ flex: `${label} 0 0` }} />
    const isPressed = pressed.has(code)
    const isTested = tested.has(code)
    return (
      <div key={code} className="p-[2px]" style={{ flex: `${width} 0 0` }}>
        <div
          className={clsx(
            'flex h-10 items-center justify-center rounded-md border px-1 text-[11px] font-medium leading-none transition-colors duration-75',
            isPressed ? 'border-rose-500 bg-rose-500 text-white' : isTested ? 'border-zinc-300 bg-zinc-200 text-zinc-900' : 'border-zinc-200 bg-white text-zinc-500',
          )}
        >
          <span className="truncate">{label}</span>
        </div>
      </div>
    )
  })

  return (
    <div className={ui.stack}>
      <div className={ui.card}>
        <div className={ui.cardHeader}>
          <h2 className={ui.cardTitle}>Keyboard</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 tabular-nums">{testedOnLayout} / {layoutCodes.size} keys tested</span>
            <button type="button" onClick={reset} className={ui.smallButton}>Reset</button>
          </div>
        </div>
        <div className={ui.cardBody}>
          <div
            ref={areaRef}
            tabIndex={0}
            role="application"
            aria-label="Keyboard test area. Press keys to test them."
            onKeyDown={onKeyDown}
            onKeyUp={onKeyUp}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setPressed(new Set()) }}
            className={clsx(
              'relative rounded-md border bg-zinc-50 p-3 outline-none transition-colors',
              focused ? 'border-rose-400 ring-2 ring-rose-500/20' : 'border-zinc-200',
            )}
          >
            <div className="overflow-x-auto">
              <div className="min-w-[760px] select-none">
                {layout.map((row, rowIndex) => (
                  <div key={rowIndex} className={clsx('flex', rowIndex === 0 && 'mb-3')}>
                    <div className="flex" style={{ flex: '15 0 0' }}>{renderKeys(row.main)}</div>
                    <div aria-hidden="true" style={{ flex: '0.4 0 0' }} />
                    <div className="flex" style={{ flex: '3 0 0' }}>{renderKeys(row.nav)}</div>
                  </div>
                ))}
              </div>
            </div>
            {!focused && (
              // Not focusable on purpose: a click here focuses the test area itself.
              <div className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-md bg-white/70 text-sm font-medium text-zinc-900 backdrop-blur-[1px]">
                <span className={ui.secondaryButton}>Click here, then press any key</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm bg-rose-500" aria-hidden="true" />Pressed now</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-zinc-300 bg-zinc-200" aria-hidden="true" />Tested</span>
            <span className="flex items-center gap-1.5"><span className="size-3 rounded-sm border border-zinc-200 bg-white" aria-hidden="true" />Not tested yet</span>
            <span>Browser shortcuts with Ctrl or ⌘ still work. Needs a physical keyboard.</span>
          </div>
        </div>
      </div>

      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Last key</h2></div>
          <div className={ui.cardBody}>
            <div className={ui.rows}>
              <div className={ui.row}><span className={ui.rowLabel}>event.key</span><span className={`${ui.rowValue} font-mono`}>{last ? last.key : '—'}</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>event.code</span><span className={`${ui.rowValue} font-mono`}>{last ? last.code : '—'}</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>Location</span><span className={ui.rowValue}>{last ? last.location : '—'}</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>keyCode (legacy)</span><span className={`${ui.rowValue} font-mono`}>{last ? last.keyCode : '—'}</span></div>
            </div>
          </div>
        </div>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Other keys detected</h2></div>
          <div className={ui.cardBody}>
            {extraKeys.length ? (
              <div className="flex flex-wrap gap-1.5">
                {extraKeys.map((code) => <span key={code} className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 font-mono text-xs text-zinc-700">{code}</span>)}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Numpad, media and other keys that are not on the layout above appear here.</p>
            )}
          </div>
        </div>
      </div>

      {tested.size > 0 && (
        <ToolCta
          title="Keyboard working? Show support what happens on screen."
          copy="Screendesk lets customers record their screen and voice in one click, with device details attached."
        />
      )}
    </div>
  )
}
