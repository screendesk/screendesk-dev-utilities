import { useCallback, useEffect, useRef, useState } from 'react'
import { MicrophoneIcon, StopIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, ui } from '@/components/tools/toolUi'

const RECORD_SECONDS = 5

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function errorMessage(err) {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') return 'Microphone access was blocked. Allow it from the icon in your address bar, then try again. The steps below cover each browser and OS.'
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'No microphone was found. Connect one, check it is not muted with a hardware switch, then try again.'
  if (err?.name === 'NotReadableError') return 'Your microphone is in use by another app or blocked by the system. Close apps like Zoom or Teams and try again.'
  return 'The microphone could not be started in this browser.'
}

export function MicTestTool() {
  const [status, setStatus] = useState('idle') // idle | starting | live | error
  const [error, setError] = useState('')
  const [devices, setDevices] = useState([])
  const [deviceId, setDeviceId] = useState('')
  const [heard, setHeard] = useState(false)
  const [recording, setRecording] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(RECORD_SECONDS)
  const [recordingUrl, setRecordingUrl] = useState('')
  const [canRecord, setCanRecord] = useState(true)

  const streamRef = useRef(null)
  const contextRef = useRef(null)
  const sourceRef = useRef(null)
  const analyserRef = useRef(null)
  const rafRef = useRef(0)
  const meterRef = useRef(null)
  const levelTextRef = useRef(null)
  const heardRef = useRef(false)
  const recorderRef = useRef(null)
  const timersRef = useRef([])
  const urlRef = useRef('')

  const listDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      setDevices(all.filter((device) => device.kind === 'audioinput' && device.deviceId))
    } catch (_) {}
  }, [])

  const stopStream = () => {
    cancelAnimationFrame(rafRef.current)
    sourceRef.current?.disconnect()
    sourceRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  // Meter: RMS of the waveform mapped from -60 dB to 0 dB, written straight to the DOM each frame.
  const loop = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return
    const data = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(data)
    let sum = 0
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i]
    const rms = Math.sqrt(sum / data.length)
    const db = rms > 0 ? 20 * Math.log10(rms) : -100
    const level = Math.max(0, Math.min(1, (db + 60) / 60))
    if (meterRef.current) meterRef.current.style.width = `${Math.round(level * 100)}%`
    if (levelTextRef.current) levelTextRef.current.textContent = db > -100 ? `${Math.round(db)} dB` : '—'
    if (level > 0.35 && !heardRef.current) {
      heardRef.current = true
      setHeard(true)
    }
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const start = async (id = deviceId) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setError('This browser does not support microphone access. Try the latest Chrome, Edge, Firefox or Safari over HTTPS.')
      return
    }
    if (recorderRef.current?.state === 'recording') return
    setStatus('starting')
    setError('')
    try {
      // Created inside the click so autoplay rules allow it.
      if (!contextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        contextRef.current = new AudioContext()
        analyserRef.current = contextRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
      }
      await contextRef.current.resume()
      const stream = await navigator.mediaDevices.getUserMedia({ audio: id ? { deviceId: { exact: id } } : true })
      stopStream()
      streamRef.current = stream
      sourceRef.current = contextRef.current.createMediaStreamSource(stream)
      sourceRef.current.connect(analyserRef.current)
      const activeId = stream.getAudioTracks()[0]?.getSettings?.().deviceId
      if (activeId) setDeviceId(activeId)
      setStatus('live')
      setCanRecord(typeof MediaRecorder !== 'undefined')
      trackToolUse('mic-test', 'result')
      listDevices()
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      stopStream()
      setStatus('error')
      setError(errorMessage(err))
    }
  }

  const stop = () => {
    stopStream()
    if (meterRef.current) meterRef.current.style.width = '0%'
    setStatus('idle')
  }

  const clearTimers = () => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current = []
  }

  const record = () => {
    const stream = streamRef.current
    if (!stream || typeof MediaRecorder === 'undefined') return
    const mimeType = pickMimeType()
    let recorder
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    } catch (_) {
      setCanRecord(false)
      return
    }
    const chunks = []
    recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data) }
    recorder.onstop = () => {
      clearTimers()
      setRecording(false)
      if (!chunks.length) return
      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType || 'audio/webm' })
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = URL.createObjectURL(blob)
      setRecordingUrl(urlRef.current)
      trackToolUse('mic-test', 'record')
    }
    recorderRef.current = recorder
    recorder.start()
    setRecording(true)
    setSecondsLeft(RECORD_SECONDS)
    for (let i = 1; i < RECORD_SECONDS; i++) {
      timersRef.current.push(setTimeout(() => setSecondsLeft(RECORD_SECONDS - i), i * 1000))
    }
    timersRef.current.push(setTimeout(() => { if (recorder.state === 'recording') recorder.stop() }, RECORD_SECONDS * 1000))
  }

  const changeDevice = (event) => {
    setDeviceId(event.target.value)
    if (status === 'live') start(event.target.value)
  }

  useEffect(() => {
    listDevices()
    const mediaDevices = navigator.mediaDevices
    mediaDevices?.addEventListener?.('devicechange', listDevices)
    return () => {
      mediaDevices?.removeEventListener?.('devicechange', listDevices)
      clearTimers()
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.onstop = null
        recorderRef.current.stop()
      }
      cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
      contextRef.current?.close()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [listDevices])

  const live = status === 'live'

  return (
    <div className={ui.stack}>
      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>Microphone</h2>
            {live ? <Badge tone={heard ? 'positive' : 'neutral'}>{heard ? 'Sound detected' : 'Listening'}</Badge> : status === 'error' ? <Badge tone="negative">Not working</Badge> : null}
          </div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <div>
              <label htmlFor="mic-device" className={ui.label}>Input device</label>
              <select id="mic-device" value={deviceId} onChange={changeDevice} disabled={recording} className={ui.select}>
                {devices.length === 0 && <option value="">Default microphone</option>}
                {devices.map((device, index) => (
                  <option key={device.deviceId} value={device.deviceId}>{device.label || `Microphone ${index + 1}`}</option>
                ))}
              </select>
              {!live && <p className={ui.hint}>Device names appear after you allow microphone access.</p>}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-900">Input level</span>
                <span ref={levelTextRef} className="text-zinc-500 tabular-nums">—</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100" role="presentation">
                <div ref={meterRef} className="h-full rounded-full bg-gradient-to-r from-rose-500 to-orange-400" style={{ width: '0%' }} />
              </div>
              <p className={ui.hint}>{live ? 'Speak normally. The bar should move with your voice and fall back when you stop.' : 'Start the test, then speak to see the level move.'}</p>
            </div>

            {error && <p className={ui.error} role="alert">{error}</p>}

            <div className="flex flex-wrap gap-2">
              {live ? (
                <button type="button" onClick={stop} disabled={recording} className={ui.secondaryButton}>
                  <StopIcon aria-hidden="true" className="size-4" />
                  Stop microphone
                </button>
              ) : (
                <button type="button" onClick={() => start()} disabled={status === 'starting'} className={ui.primaryButton}>
                  <MicrophoneIcon aria-hidden="true" className="size-4" />
                  {status === 'starting' ? 'Starting…' : status === 'error' ? 'Try again' : 'Start mic test'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Record and play back</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <p className="text-sm text-zinc-500">Record a {RECORD_SECONDS}-second clip and listen to how you actually sound to others. The clip stays in your browser.</p>
            {!canRecord && <p className={ui.error}>Recording is not supported in this browser. The live level meter still shows whether your mic works.</p>}
            <button type="button" onClick={record} disabled={!live || recording || !canRecord} className={ui.primaryButton}>
              <span className={recording ? 'size-2 rounded-full bg-rose-500' : 'size-2 rounded-full bg-white/70'} aria-hidden="true" />
              {recording ? `Recording… ${secondsLeft}s` : recordingUrl ? 'Record again' : `Record ${RECORD_SECONDS} seconds`}
            </button>
            {!live && !recordingUrl && <p className={ui.hint}>Start the mic test first.</p>}
            {recordingUrl && (
              <div>
                <p className={ui.label}>Your recording</p>
                <audio key={recordingUrl} src={recordingUrl} controls className="w-full" />
                <p className={ui.hint}>Listen for hiss, echo, distortion or a very quiet voice. Try the troubleshooting tips below if something sounds off.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {(live || recordingUrl) && (
        <ToolCta
          title="Mic working? Record your screen and send it to support."
          copy="Screendesk lets customers record their screen and voice in one click, with device details attached."
        />
      )}
    </div>
  )
}
