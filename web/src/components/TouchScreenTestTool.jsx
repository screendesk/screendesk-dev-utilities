import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import clsx from 'clsx'
import { ArrowsPointingInIcon, ArrowsPointingOutIcon, HandRaisedIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ui } from '@/components/tools/toolUi'

const COLS = 10
const noopSubscribe = () => () => {}

function gridFor(width, height) {
  if (!width || !height) return { cols: COLS, rows: 6 }
  return { cols: COLS, rows: Math.max(4, Math.min(20, Math.round((COLS * height) / width))) }
}

export function TouchScreenTestTool() {
  const wrapperRef = useRef(null)
  const areaRef = useRef(null)
  const canvasRef = useRef(null)
  const pointersRef = useRef(new Map()) // pointerId -> { x, y }
  const dotRefs = useRef(new Map()) // pointerId -> element
  const gridRef = useRef({ cols: COLS, rows: 6 })
  const touchedRef = useRef(new Set())

  const [grid, setGrid] = useState({ cols: COLS, rows: 6 })
  const [touched, setTouched] = useState(() => new Set())
  const [active, setActive] = useState([])
  const [maxPoints, setMaxPoints] = useState(0)
  const [pointerType, setPointerType] = useState('')
  // Client-only values read without a hydration mismatch (null / false on the server).
  const supported = useSyncExternalStore(noopSubscribe, () => navigator.maxTouchPoints || 0, () => null)
  const canFullscreen = useSyncExternalStore(noopSubscribe, () => Boolean(document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen), () => false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [used, setUsed] = useState(false)

  // Keep the canvas at device resolution and the grid matched to the area's shape.
  useEffect(() => {
    const area = areaRef.current
    const canvas = canvasRef.current
    if (!area || !canvas) return undefined
    const resize = () => {
      const { width, height } = area.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      const ctx = canvas.getContext('2d')
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const next = gridFor(width, height)
      if (next.rows !== gridRef.current.rows) {
        gridRef.current = next
        touchedRef.current = new Set()
        setTouched(new Set())
        setGrid(next)
      }
    }
    resize()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null
    observer?.observe(area)
    return () => observer?.disconnect()
  }, [])

  // Stop Safari pinch-zoom and long-press menus inside the drawing area.
  useEffect(() => {
    const area = areaRef.current
    if (!area) return undefined
    const block = (event) => event.preventDefault()
    area.addEventListener('gesturestart', block)
    area.addEventListener('contextmenu', block)
    area.addEventListener('touchmove', block, { passive: false })
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement || document.webkitFullscreenElement))
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      area.removeEventListener('gesturestart', block)
      area.removeEventListener('contextmenu', block)
      area.removeEventListener('touchmove', block)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      if (exit && (document.fullscreenElement || document.webkitFullscreenElement)) exit.call(document)
    }
  }, [])

  const localPoint = (event) => {
    const rect = areaRef.current.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top, width: rect.width, height: rect.height }
  }

  const markCell = useCallback((x, y, width, height) => {
    const { cols, rows } = gridRef.current
    const col = Math.min(cols - 1, Math.max(0, Math.floor((x / width) * cols)))
    const row = Math.min(rows - 1, Math.max(0, Math.floor((y / height) * rows)))
    const key = row * cols + col
    if (touchedRef.current.has(key)) return
    touchedRef.current.add(key)
    setTouched(new Set(touchedRef.current))
  }, [])

  const moveDot = (id, x, y) => {
    const dot = dotRefs.current.get(id)
    if (dot) dot.style.transform = `translate(${x}px, ${y}px)`
  }

  const onPointerDown = (event) => {
    event.preventDefault()
    areaRef.current.setPointerCapture?.(event.pointerId)
    const p = localPoint(event)
    pointersRef.current.set(event.pointerId, { x: p.x, y: p.y })
    const ctx = canvasRef.current.getContext('2d')
    ctx.fillStyle = '#18181b'
    ctx.beginPath()
    ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
    ctx.fill()
    markCell(p.x, p.y, p.width, p.height)
    const ids = [...pointersRef.current.keys()]
    setActive(ids)
    setMaxPoints((m) => Math.max(m, ids.length))
    setPointerType(event.pointerType)
    setUsed(true)
    trackToolUse('touch-screen-test', 'result')
    requestAnimationFrame(() => moveDot(event.pointerId, p.x, p.y))
  }

  const onPointerMove = (event) => {
    const last = pointersRef.current.get(event.pointerId)
    if (!last) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.strokeStyle = '#18181b'
    ctx.lineWidth = event.pointerType === 'mouse' ? 2 : 4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    const events = event.nativeEvent.getCoalescedEvents?.() || [event.nativeEvent]
    let prev = last
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    for (const e of events.length ? events : [event.nativeEvent]) {
      const p = localPoint(e)
      ctx.lineTo(p.x, p.y)
      markCell(p.x, p.y, p.width, p.height)
      prev = p
    }
    ctx.stroke()
    pointersRef.current.set(event.pointerId, { x: prev.x, y: prev.y })
    moveDot(event.pointerId, prev.x, prev.y)
  }

  const onPointerEnd = (event) => {
    if (!pointersRef.current.delete(event.pointerId)) return
    setActive([...pointersRef.current.keys()])
  }

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    touchedRef.current = new Set()
    setTouched(new Set())
    setMaxPoints(active.length)
  }

  const toggleFullscreen = () => {
    const wrapper = wrapperRef.current
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen
      exit?.call(document)
      return
    }
    const request = wrapper.requestFullscreen || wrapper.webkitRequestFullscreen
    try { request?.call(wrapper)?.catch?.(() => {}) } catch (_) {}
  }

  const total = grid.cols * grid.rows
  const coverage = Math.round((touched.size / total) * 100)

  return (
    <div className={ui.stack}>
      <div ref={wrapperRef} className={clsx(ui.card, isFullscreen && 'flex h-full flex-col rounded-none border-0')}>
        <div className={ui.cardHeader}>
          <h2 className={ui.cardTitle}>Touch area</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={clear} className={ui.smallButton}>Clear</button>
            {canFullscreen && (
              <button type="button" onClick={toggleFullscreen} className={ui.smallButton}>
                {isFullscreen ? <ArrowsPointingInIcon aria-hidden="true" className="size-3.5" /> : <ArrowsPointingOutIcon aria-hidden="true" className="size-3.5" />}
                {isFullscreen ? 'Exit full screen' : 'Full screen'}
              </button>
            )}
          </div>
        </div>
        <div className={clsx(ui.cardBody, isFullscreen && 'flex-1')}>
          <div
            ref={areaRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onLostPointerCapture={onPointerEnd}
            className={clsx('relative w-full select-none overflow-hidden rounded-md border border-zinc-200 bg-white', isFullscreen ? 'h-full' : 'h-[60vh] min-h-80')}
            style={{ touchAction: 'none' }}
          >
            <div
              className="pointer-events-none absolute inset-0 grid"
              style={{ gridTemplateColumns: `repeat(${grid.cols}, 1fr)`, gridTemplateRows: `repeat(${grid.rows}, 1fr)` }}
              aria-hidden="true"
            >
              {Array.from({ length: total }, (_, i) => (
                <div key={i} className={clsx('border-b border-r border-zinc-100', touched.has(i) && 'bg-zinc-100')} />
              ))}
            </div>
            <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full" />
            {active.map((id, index) => (
              <div
                key={id}
                ref={(el) => { if (el) dotRefs.current.set(id, el); else dotRefs.current.delete(id) }}
                className="pointer-events-none absolute left-0 top-0"
                aria-hidden="true"
              >
                <span className="-ml-5 -mt-5 flex size-10 items-center justify-center rounded-full border-2 border-rose-500 bg-rose-500/10 text-xs font-semibold text-rose-600">{index + 1}</span>
              </div>
            ))}
            {!used && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center text-sm text-zinc-500">
                <HandRaisedIcon aria-hidden="true" className={ui.emptyIcon} />
                Draw here with one or more fingers. Cover the whole area to find dead zones.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Touching now" value={active.length} />
        <Stat label="Max at once" value={maxPoints} />
        <Stat label="Area covered" value={`${coverage}%`} />
        <Stat label="Device reports" value={supported === null ? '—' : supported ? `${supported} points` : 'No touch'} />
      </div>
      {pointerType && <p className={ui.hint}>Last input: {pointerType}. Grey cells have been touched; any cell you can’t fill may be a dead zone.</p>}

      {used && (
        <ToolCta
          title="Touch screen acting up? Show support what happens."
          copy="Screendesk lets customers record their screen and voice in one click, with device details attached."
        />
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className={`${ui.card} p-4`}>
      <p className={ui.metricLabel}>{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 tabular-nums">{value}</p>
    </div>
  )
}
