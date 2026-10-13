import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal, flushSync } from 'react-dom'
import clsx from 'clsx'
import { ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ui } from '@/components/tools/toolUi'

const colors = [
  { name: 'Black', value: '#000000', look: 'Bright dots are stuck or hot pixels.', hintDark: false },
  { name: 'White', value: '#ffffff', look: 'Black dots are dead pixels.', hintDark: true },
  { name: 'Red', value: '#ff0000', look: 'Dots of another color are stuck subpixels.', hintDark: false },
  { name: 'Green', value: '#00ff00', look: 'Dots of another color are stuck subpixels.', hintDark: true },
  { name: 'Blue', value: '#0000ff', look: 'Dots of another color are stuck subpixels.', hintDark: false },
  { name: 'Gray', value: '#808080', look: 'Uneven patches show backlight bleed or banding.', hintDark: false },
]

const noopSubscribe = () => () => {}

function fullscreenElement() {
  return document.fullscreenElement || document.webkitFullscreenElement || null
}

function requestFullscreen(element) {
  const request = element.requestFullscreen || element.webkitRequestFullscreen
  if (!request) return Promise.reject(new Error('unsupported'))
  try {
    return Promise.resolve(request.call(element))
  } catch (err) {
    return Promise.reject(err)
  }
}

function exitFullscreen() {
  const exit = document.exitFullscreen || document.webkitExitFullscreen
  if (exit && fullscreenElement()) exit.call(document)
}

export function DeadPixelTestTool() {
  const overlayRef = useRef(null)
  const [active, setActive] = useState(false)
  const [index, setIndex] = useState(0)
  const [showHint, setShowHint] = useState(true)
  const [fallback, setFallback] = useState(false)
  const [used, setUsed] = useState(false)
  // False during server render and hydration, true on the client: gates the body portal.
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false)

  const start = (startIndex = 0) => {
    flushSync(() => {
      setIndex(startIndex)
      setShowHint(true)
      setActive(true)
    })
    setUsed(true)
    trackToolUse('dead-pixel-test', 'result')
    const overlay = overlayRef.current
    if (!overlay) return
    // iOS Safari has no element fullscreen; the fixed overlay still covers the page.
    requestFullscreen(overlay).then(() => setFallback(false), () => setFallback(true))
    overlay.focus()
  }

  const close = useCallback(() => {
    exitFullscreen()
    setActive(false)
  }, [])

  const step = useCallback((delta) => {
    setShowHint(false)
    setIndex((i) => (i + delta + colors.length) % colors.length)
  }, [])

  // Keyboard controls while the test is showing. The browser handles Esc in real fullscreen;
  // fullscreenchange below closes the overlay when that happens.
  useEffect(() => {
    if (!active) return undefined
    const onKey = (event) => {
      if (event.repeat) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown' || event.key === ' ' || event.key === 'Enter') { event.preventDefault(); step(1) }
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); step(-1) }
      else if (event.key === 'Escape') close()
    }
    const onFullscreenChange = () => { if (!fullscreenElement()) setActive(false) }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
    }
  }, [active, close, step])

  // The overlay is portalled to <body> so no ancestor style can clip or offset it.
  useEffect(() => () => exitFullscreen(), [])

  const color = colors[index]

  return (
    <div className={ui.stack}>
      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Full-screen color test</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <p className="text-sm text-zinc-500">The screen fills with one solid color at a time. Look closely across the whole display for dots that don’t match.</p>
            <div className={ui.rows}>
              <div className={ui.row}><span className={ui.rowLabel}>Next color</span><span className={ui.rowValue}>Click, Space or →</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>Previous color</span><span className={ui.rowValue}>←</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>Exit</span><span className={ui.rowValue}>Esc</span></div>
            </div>
            <button type="button" onClick={() => start(0)} className={ui.primaryButton}>
              <ArrowsPointingOutIcon aria-hidden="true" className="size-4" />
              Start full-screen test
            </button>
            <p className={ui.hint}>Clean your screen first so dust isn’t mistaken for a dead pixel. On phones, tap to change color and use the Exit button.</p>
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Start from a color</h2></div>
          <div className={ui.cardBody}>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="list">
              {colors.map((c, i) => (
                <li key={c.name}>
                  <button type="button" onClick={() => start(i)} className="flex w-full items-center gap-2.5 rounded-md border border-zinc-200 bg-white p-2 text-left text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500">
                    <span className="size-6 shrink-0 rounded border border-zinc-200" style={{ backgroundColor: c.value }} aria-hidden="true" />
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
            <div className={`${ui.rows} mt-4`}>
              {colors.map((c) => (
                <div key={c.name} className={ui.row}><span className={ui.rowLabel}>{c.name}</span><span className="text-right text-zinc-900">{c.look}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {used && !active && (
        <ToolCta
          title="Found a screen issue? Show support exactly what you see."
          copy="Screendesk lets customers record their screen and voice in one click, with device details attached."
        />
      )}

      {mounted && createPortal(
      <div
        ref={overlayRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Dead pixel test: ${color.name}`}
        onClick={() => step(1)}
        className={clsx('fixed inset-0 z-[1000] cursor-none outline-none', active ? 'block' : 'hidden')}
        style={{ backgroundColor: color.value }}
      >
        {showHint && (
          <div className={clsx('pointer-events-none absolute inset-x-0 bottom-10 text-center text-sm', color.hintDark ? 'text-zinc-700' : 'text-zinc-300')}>
            {color.name}. Click or press → for the next color, Esc to exit.
          </div>
        )}
        {(fallback || showHint) && (
          <button
            type="button"
            onClick={(event) => { event.stopPropagation(); close() }}
            className={clsx('absolute right-4 top-4 cursor-pointer', ui.smallButton)}
          >
            Exit
          </button>
        )}
      </div>,
      document.body,
      )}
    </div>
  )
}
