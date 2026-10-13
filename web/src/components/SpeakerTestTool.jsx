import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { SpeakerWaveIcon, StopIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ui } from '@/components/tools/toolUi'

const SWEEP_SECONDS = 20
const SWEEP_FROM = 20
const SWEEP_TO = 20000
const RAMP = 0.02 // seconds of fade in/out so tones start and stop without clicks

const tones = [
  { value: 100, label: '100 Hz (bass)' },
  { value: 440, label: '440 Hz (A4)' },
  { value: 1000, label: '1 kHz' },
  { value: 8000, label: '8 kHz (treble)' },
]

const channels = [
  { id: 'left', label: 'Left', pan: -1 },
  { id: 'both', label: 'Both', pan: 0 },
  { id: 'right', label: 'Right', pan: 1 },
]

function formatHz(hz) {
  return hz >= 1000 ? `${(hz / 1000).toFixed(hz >= 10000 ? 1 : 2)} kHz` : `${Math.round(hz)} Hz`
}

export function SpeakerTestTool() {
  const [playing, setPlaying] = useState(null) // null | left | both | right | sweep
  const [volume, setVolume] = useState(30)
  const [frequency, setFrequency] = useState(440)
  const [used, setUsed] = useState(false)
  const [error, setError] = useState('')

  const contextRef = useRef(null)
  const masterRef = useRef(null)
  const nodesRef = useRef(null) // { osc, env }
  const rafRef = useRef(0)
  const lastPaintRef = useRef(0)
  const sweepStartRef = useRef(0)
  const freqTextRef = useRef(null)
  const progressRef = useRef(null)

  const ensureContext = () => {
    if (contextRef.current) return contextRef.current
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) throw new Error('unsupported')
    const context = new AudioContext()
    const master = context.createGain()
    master.gain.value = (volume / 100) ** 2
    master.connect(context.destination)
    contextRef.current = context
    masterRef.current = master
    return context
  }

  const resetSweepDisplay = () => {
    cancelAnimationFrame(rafRef.current)
    if (freqTextRef.current) freqTextRef.current.textContent = '—'
    if (progressRef.current) progressRef.current.style.width = '0%'
  }

  const stopNodes = () => {
    const nodes = nodesRef.current
    nodesRef.current = null
    if (!nodes || !contextRef.current) return
    const t = contextRef.current.currentTime
    nodes.osc.onended = null
    nodes.env.gain.cancelScheduledValues(t)
    nodes.env.gain.setValueAtTime(nodes.env.gain.value, t)
    nodes.env.gain.linearRampToValueAtTime(0, t + RAMP)
    try { nodes.osc.stop(t + RAMP + 0.01) } catch (_) {}
  }

  const stop = () => {
    stopNodes()
    resetSweepDisplay()
    setPlaying(null)
  }

  // Route a mono source to the left, right or both channels.
  const connectToChannel = (context, env, pan) => {
    if (context.createStereoPanner) {
      const panner = context.createStereoPanner()
      panner.pan.value = pan
      env.connect(panner)
      panner.connect(masterRef.current)
      return
    }
    const merger = context.createChannelMerger(2)
    if (pan <= 0) env.connect(merger, 0, 0)
    if (pan >= 0) env.connect(merger, 0, 1)
    merger.connect(masterRef.current)
  }

  const play = async (mode) => {
    let context
    try {
      context = ensureContext()
      await context.resume()
    } catch (_) {
      setError('Web Audio is not supported in this browser. Try the latest Chrome, Edge, Firefox or Safari.')
      return
    }
    setError('')
    stopNodes()
    resetSweepDisplay()

    const t = context.currentTime
    const osc = context.createOscillator()
    const env = context.createGain()
    osc.type = 'sine'
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(1, t + RAMP)
    osc.connect(env)

    if (mode === 'sweep') {
      osc.frequency.setValueAtTime(SWEEP_FROM, t)
      osc.frequency.exponentialRampToValueAtTime(SWEEP_TO, t + SWEEP_SECONDS)
      env.gain.setValueAtTime(1, t + SWEEP_SECONDS - RAMP)
      env.gain.linearRampToValueAtTime(0, t + SWEEP_SECONDS)
      connectToChannel(context, env, 0)
      osc.start(t)
      osc.stop(t + SWEEP_SECONDS + 0.01)
      osc.onended = () => {
        if (nodesRef.current?.osc !== osc) return
        nodesRef.current = null
        resetSweepDisplay()
        setPlaying(null)
      }
      sweepStartRef.current = t
      lastPaintRef.current = 0
      // Readout follows the same exponential curve as the oscillator, repainted about ten times a second.
      const paint = (now) => {
        if (now - lastPaintRef.current >= 100) {
          lastPaintRef.current = now
          const elapsed = Math.min(SWEEP_SECONDS, context.currentTime - sweepStartRef.current)
          const hz = SWEEP_FROM * (SWEEP_TO / SWEEP_FROM) ** (elapsed / SWEEP_SECONDS)
          if (freqTextRef.current) freqTextRef.current.textContent = formatHz(hz)
          if (progressRef.current) progressRef.current.style.width = `${(elapsed / SWEEP_SECONDS) * 100}%`
        }
        rafRef.current = requestAnimationFrame(paint)
      }
      rafRef.current = requestAnimationFrame(paint)
    } else {
      osc.frequency.setValueAtTime(frequency, t)
      connectToChannel(context, env, channels.find((c) => c.id === mode).pan)
      osc.start(t)
    }

    nodesRef.current = { osc, env }
    setPlaying(mode)
    setUsed(true)
    trackToolUse('speaker-test', 'result')
  }

  const changeVolume = (event) => {
    const next = Number(event.target.value)
    setVolume(next)
    const context = contextRef.current
    if (context && masterRef.current) masterRef.current.gain.setTargetAtTime((next / 100) ** 2, context.currentTime, 0.02)
  }

  const changeFrequency = (event) => {
    const next = Number(event.target.value)
    setFrequency(next)
    const nodes = nodesRef.current
    if (nodes && playing && playing !== 'sweep') nodes.osc.frequency.setTargetAtTime(next, contextRef.current.currentTime, 0.01)
  }

  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current)
    try { nodesRef.current?.osc.stop() } catch (_) {}
    contextRef.current?.close()
  }, [])

  return (
    <div className={ui.stack}>
      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>Left / right test</h2>
            {playing && playing !== 'sweep' && <span className="text-xs text-zinc-500">Playing: {channels.find((c) => c.id === playing).label.toLowerCase()}</span>}
          </div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <div className="grid grid-cols-3 gap-2">
              {channels.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => (playing === id ? stop() : play(id))}
                  aria-pressed={playing === id}
                  className={clsx(
                    'flex h-20 flex-col items-center justify-center gap-1 rounded-md border text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
                    playing === id ? 'border-rose-400 bg-rose-50 text-zinc-900' : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  )}
                >
                  <SpeakerWaveIcon aria-hidden="true" className={clsx('size-5', playing === id ? 'text-rose-500' : 'text-zinc-400', id === 'left' && '-scale-x-100')} />
                  {label}
                </button>
              ))}
            </div>
            <p className={ui.hint}>Left should only come from your left speaker or ear, right only from the right. Click again to stop.</p>
            <div>
              <label htmlFor="tone-frequency" className={ui.label}>Tone</label>
              <select id="tone-frequency" value={frequency} onChange={changeFrequency} className={ui.select}>
                {tones.map((tone) => <option key={tone.value} value={tone.value}>{tone.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Frequency sweep</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <div>
              <p className={ui.metricLabel}>Current frequency</p>
              <p ref={freqTextRef} className={ui.metric} aria-live="off">—</p>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
                <div ref={progressRef} className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: '0%' }} />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-zinc-500 tabular-nums"><span>20 Hz</span><span>20 kHz</span></div>
            </div>
            <p className="text-sm text-zinc-500">Plays a tone rising from 20 Hz to 20 kHz over {SWEEP_SECONDS} seconds. Note where you first hear it and where it fades out.</p>
            <button type="button" onClick={() => (playing === 'sweep' ? stop() : play('sweep'))} className={ui.primaryButton}>
              {playing === 'sweep' ? 'Stop sweep' : 'Play sweep'}
            </button>
          </div>
        </div>
      </div>

      <div className={ui.card}>
        <div className={`${ui.cardBody} flex flex-col gap-4 sm:flex-row sm:items-center`}>
          <label htmlFor="speaker-volume" className="shrink-0 text-sm font-medium text-zinc-900">Test volume</label>
          <input id="speaker-volume" type="range" min="0" max="100" value={volume} onChange={changeVolume} className={ui.range} />
          <span className="w-10 shrink-0 text-right text-sm text-zinc-500 tabular-nums">{volume}%</span>
          <button type="button" onClick={stop} disabled={!playing} className={clsx(ui.secondaryButton, 'shrink-0 disabled:opacity-50')}>
            <StopIcon aria-hidden="true" className="size-4" />
            Stop
          </button>
        </div>
        <p className="border-t border-zinc-200 px-5 py-3 text-xs text-zinc-500">Start with your system volume low, especially with headphones. High frequencies can be uncomfortable at full volume.</p>
      </div>

      {error && <p className={ui.error} role="alert">{error}</p>}

      {used && (
        <ToolCta
          title="Audio working? Record your screen and send it to support."
          copy="Screendesk lets customers record their screen and voice in one click, with device details attached."
        />
      )}
    </div>
  )
}
