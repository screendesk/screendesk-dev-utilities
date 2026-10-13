import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { CursorArrowRaysIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ui } from '@/components/tools/toolUi'

// MouseEvent.button values: 0 left, 1 middle (wheel), 2 right, 3 back, 4 forward.
const buttons = [
  { id: 0, name: 'Left' },
  { id: 1, name: 'Middle' },
  { id: 2, name: 'Right' },
  { id: 3, name: 'Back' },
  { id: 4, name: 'Forward' },
]

const emptyCounts = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }

export function MouseTestTool() {
  const areaRef = useRef(null)
  const [pressed, setPressed] = useState({})
  const [counts, setCounts] = useState(emptyCounts)
  const [doubleClicks, setDoubleClicks] = useState(0)
  const [scroll, setScroll] = useState({ up: 0, down: 0, left: 0, right: 0 })
  const [last, setLast] = useState(null)
  const [used, setUsed] = useState(false)

  const markUsed = () => {
    if (!used) setUsed(true)
    trackToolUse('mouse-test', 'result')
  }

  // React attaches wheel listeners as passive, so preventDefault needs a native listener.
  useEffect(() => {
    const area = areaRef.current
    if (!area) return undefined
    const onWheel = (event) => {
      event.preventDefault()
      setScroll((prev) => ({
        up: prev.up + (event.deltaY < 0 ? 1 : 0),
        down: prev.down + (event.deltaY > 0 ? 1 : 0),
        left: prev.left + (event.deltaX < 0 ? 1 : 0),
        right: prev.right + (event.deltaX > 0 ? 1 : 0),
      }))
      setLast(event.deltaY < 0 ? 'Scroll up' : event.deltaY > 0 ? 'Scroll down' : event.deltaX < 0 ? 'Scroll left' : 'Scroll right')
      setUsed(true)
      trackToolUse('mouse-test', 'result')
    }
    area.addEventListener('wheel', onWheel, { passive: false })
    return () => area.removeEventListener('wheel', onWheel)
  }, [])

  // Release any held state if the button goes up outside the area.
  useEffect(() => {
    const onUp = (event) => setPressed((prev) => ({ ...prev, [event.button]: false }))
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  const onMouseDown = (event) => {
    // Stops middle-click autoscroll and back/forward navigation inside the test area.
    if (event.button !== 0) event.preventDefault()
    setPressed((prev) => ({ ...prev, [event.button]: true }))
    setCounts((prev) => ({ ...prev, [event.button]: (prev[event.button] || 0) + 1 }))
    setLast(buttons.find((b) => b.id === event.button)?.name.concat(' button') || `Button ${event.button}`)
    markUsed()
  }

  const onMouseUp = (event) => {
    if (event.button !== 0) event.preventDefault()
    setPressed((prev) => ({ ...prev, [event.button]: false }))
  }

  const onDoubleClick = () => {
    setDoubleClicks((n) => n + 1)
    setLast('Double-click')
  }

  const reset = () => {
    setPressed({})
    setCounts(emptyCounts)
    setDoubleClicks(0)
    setScroll({ up: 0, down: 0, left: 0, right: 0 })
    setLast(null)
  }

  return (
    <div className={ui.stack}>
      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>Click test area</h2>
            <button type="button" onClick={reset} className={ui.smallButton}>Reset</button>
          </div>
          <div className={ui.cardBody}>
            <div
              ref={areaRef}
              onMouseDown={onMouseDown}
              onMouseUp={onMouseUp}
              onAuxClick={(event) => event.preventDefault()}
              onContextMenu={(event) => event.preventDefault()}
              onDoubleClick={onDoubleClick}
              className="flex min-h-72 cursor-crosshair select-none flex-col items-center justify-center rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center"
            >
              <CursorArrowRaysIcon aria-hidden="true" className={ui.emptyIcon} />
              <p className="text-sm font-medium text-zinc-900">Click, double-click and scroll here</p>
              <p className="mt-1 text-xs text-zinc-500">Right-click menu and back/forward navigation are disabled inside this box.</p>
              <p className="mt-4 h-5 text-sm text-zinc-700 tabular-nums" aria-live="polite">{last ? `Last: ${last}` : ''}</p>
            </div>
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Buttons</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <div className="grid grid-cols-5 gap-2">
              {buttons.map(({ id, name }) => (
                <div
                  key={id}
                  className={clsx(
                    'flex flex-col items-center rounded-md border px-1 py-3 text-center transition-colors',
                    pressed[id] ? 'border-rose-400 bg-rose-50' : counts[id] > 0 ? 'border-zinc-300 bg-zinc-100' : 'border-zinc-200 bg-white',
                  )}
                >
                  <span className="text-xs text-zinc-500">{name}</span>
                  <span className="mt-1 text-lg font-semibold text-zinc-900 tabular-nums">{counts[id]}</span>
                </div>
              ))}
            </div>
            <div className={ui.rows}>
              <div className={ui.row}><span className={ui.rowLabel}>Double-clicks</span><span className={ui.rowValue}>{doubleClicks}</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>Scroll up</span><span className={ui.rowValue}>{scroll.up}</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>Scroll down</span><span className={ui.rowValue}>{scroll.down}</span></div>
              <div className={ui.row}><span className={ui.rowLabel}>Horizontal scroll (left / right)</span><span className={ui.rowValue}>{scroll.left} / {scroll.right}</span></div>
            </div>
            <p className={ui.hint}>Grey means the button registered at least once; rose means it is held down right now. Some mouse drivers remap the side buttons, so back/forward may not reach the browser.</p>
          </div>
        </div>
      </div>
      {used && (
        <ToolCta
          title="Mouse working? Show support what you see."
          copy="Screendesk lets customers record their screen and voice in one click, with device details attached."
        />
      )}
    </div>
  )
}
