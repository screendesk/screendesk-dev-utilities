import { useCallback, useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ExclamationTriangleIcon, LockClosedIcon, LockOpenIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ui } from '@/components/tools/toolUi'
import { PrivacyNote, Segmented } from '@/components/tools/dev/DevToolShell'
import { MAX_FILE, detectWebpSupport, extensionForMime, formatBytes, formats, isSvgFile, loadImageFile, loadSvgImage, renderImage, replaceExtension, triggerDownload } from './imageUtils'

// Shared converter for the image tools: drop or pick images (batch), choose an output format,
// quality, background and size, then download each file or all of them. Everything happens on a
// canvas in the browser. The resizer, the format converters and SVG to PNG are this component with
// different props.

const checker = 'bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:12px_12px]'
const formatLabels = { ...Object.fromEntries(Object.entries(formats).map(([key, { label }]) => [key, label])), original: 'Keep format' }

function outputFormatFor(item, format) {
  if (format !== 'original') return format
  return { 'image/jpeg': 'jpeg', 'image/webp': 'webp' }[item.type] || 'png'
}

function targetSize(item, settings) {
  let w = item.width
  let h = item.height
  if (item.svg) {
    if (settings.svgScale === 'width') {
      const sw = Number(settings.svgWidth)
      if (sw > 0) { h = (h * sw) / w; w = sw }
    } else {
      w *= settings.svgScale
      h *= settings.svgScale
    }
  }
  if (settings.resizeMode === 'percent') {
    const p = Math.min(1000, Math.max(1, Number(settings.percent) || 100)) / 100
    w *= p
    h *= p
  } else if (settings.resizeMode === 'dimensions') {
    const W = Number(settings.width) > 0 ? Number(settings.width) : null
    const H = Number(settings.height) > 0 ? Number(settings.height) : null
    if (W && H) {
      if (settings.lock) {
        const scale = Math.min(W / w, H / h)
        w *= scale
        h *= scale
      } else {
        w = W
        h = H
      }
    } else if (W) {
      h = (h * W) / w
      w = W
    } else if (H) {
      w = (w * H) / h
      h = H
    }
  }
  return { width: Math.max(1, Math.round(w)), height: Math.max(1, Math.round(h)) }
}

function sizeChange(before, after) {
  if (!before) return null
  const change = Math.round(((after - before) / before) * 100)
  if (change === 0) return { text: 'same size', tone: 'text-zinc-500' }
  return change < 0 ? { text: `${Math.abs(change)}% smaller`, tone: 'text-emerald-700' } : { text: `${change}% larger`, tone: 'text-zinc-500' }
}

export function ImageConverter({
  slug,
  inputAccept = 'image/*',
  defaultFormat = 'png',
  formatOptions = ['png', 'jpeg', 'webp'],
  showResize = true,
  resizeFocus = false,
  presets = [],
  defaultSvgScale = 2,
  dropTitle = 'Drop images here',
  dropHint = 'or choose files. PNG, JPEG, WebP, GIF, SVG and more.',
  cta = {
    title: 'Need screenshots from customers?',
    copy: 'Screendesk captures annotated screenshots and screen recordings with device details, straight into your helpdesk.',
  },
}) {
  const [items, setItems] = useState([]) // { id, name, size, type, preview, status, img, width, height, svg, error }
  const [outputs, setOutputs] = useState({}) // id → { url, size, width, height, mime, name, fallback } | { error }
  const [format, setFormat] = useState(defaultFormat)
  const [quality, setQuality] = useState(85)
  const [background, setBackground] = useState('#ffffff')
  const [backgroundDraft, setBackgroundDraft] = useState('#ffffff')
  const [resizeMode, setResizeMode] = useState(resizeFocus ? 'dimensions' : 'none')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [lock, setLock] = useState(true)
  const [percent, setPercent] = useState('50')
  const [svgScale, setSvgScale] = useState(defaultSvgScale)
  const [svgWidth, setSvgWidth] = useState('')
  const [webpSupported, setWebpSupported] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState('')
  const [downloadingAll, setDownloadingAll] = useState(false)
  const fileInput = useRef(null)
  const nextId = useRef(1)
  const itemsRef = useRef(items)
  const outputsRef = useRef(outputs)
  itemsRef.current = items

  useEffect(() => { setWebpSupported(detectWebpSupport()) }, [])

  // Revoke every object URL this component created when it unmounts.
  useEffect(() => () => {
    itemsRef.current.forEach((item) => item.preview && URL.revokeObjectURL(item.preview))
    Object.values(outputsRef.current).forEach((output) => output.url && URL.revokeObjectURL(output.url))
  }, [])

  const firstReady = items.find((item) => item.img)
  const ratio = firstReady ? firstReady.width / firstReady.height : null

  const addFiles = useCallback(async (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    const accepted = []
    const skipped = []
    files.forEach((file) => {
      if (!(file.type.startsWith('image/') || isSvgFile(file))) skipped.push(`${file.name} is not an image`)
      else if (file.size > MAX_FILE) skipped.push(`${file.name} is over ${formatBytes(MAX_FILE)}`)
      else accepted.push(file)
    })
    setNotice(skipped.length ? `Skipped: ${skipped.join('; ')}.` : '')
    const added = accepted.map((file) => ({ id: nextId.current++, file, name: file.name || 'pasted-image.png', size: file.size, type: file.type, preview: URL.createObjectURL(file), status: 'loading' }))
    if (!added.length) return
    setItems((previous) => [...previous, ...added])
    for (const item of added) {
      try {
        const loaded = await loadImageFile(item.file)
        setItems((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, ...loaded, status: 'ready' } : entry)))
        // Seed the width/height fields from the first image so they start at its real size.
        if (resizeFocus) {
          setWidth((current) => current || String(loaded.svg ? loaded.width * defaultSvgScale : loaded.width))
          setHeight((current) => current || String(loaded.svg ? loaded.height * defaultSvgScale : loaded.height))
        }
      } catch (error) {
        setItems((previous) => previous.map((entry) => (entry.id === item.id ? { ...entry, status: 'error', error: error.message } : entry)))
      }
    }
  }, [resizeFocus, defaultSvgScale])

  // Paste a screenshot straight from the clipboard.
  useEffect(() => {
    const onPaste = (event) => {
      const files = Array.from(event.clipboardData?.files || []).filter((file) => file.type.startsWith('image/'))
      if (files.length) {
        event.preventDefault()
        addFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [addFiles])

  // Re-encode every ready image whenever the files or settings change (debounced for the sliders).
  useEffect(() => {
    const ready = items.filter((item) => item.img)
    if (!ready.length) return undefined
    let cancelled = false
    const settings = { svgScale, svgWidth, resizeMode, percent, width, height, lock }
    const timer = setTimeout(async () => {
      const next = {}
      for (const item of ready) {
        if (cancelled) break
        const key = outputFormatFor(item, format)
        const requested = key === 'webp' && webpSupported === false ? formats.png : formats[key]
        try {
          const size = targetSize(item, settings)
          // Re-rasterise SVGs at the output size so they stay sharp instead of being scaled up.
          const img = item.svg ? await loadSvgImage(item.svgText, size.width, size.height) : item.img
          const { blob, width: w, height: h } = await renderImage({ img, ...size, mime: requested.mime, quality: requested.lossy ? quality / 100 : undefined, background })
          next[item.id] = { url: URL.createObjectURL(blob), size: blob.size, width: w, height: h, mime: blob.type, name: replaceExtension(item.name, extensionForMime(blob.type)), fallback: blob.type !== formats[key].mime }
        } catch (error) {
          next[item.id] = { error: error.message }
        }
      }
      if (cancelled) {
        Object.values(next).forEach((output) => output.url && URL.revokeObjectURL(output.url))
        return
      }
      const old = outputsRef.current
      outputsRef.current = next
      setOutputs(next)
      Object.values(old).forEach((output) => output.url && URL.revokeObjectURL(output.url))
    }, 200)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [items, format, quality, background, resizeMode, width, height, lock, percent, svgScale, svgWidth, webpSupported])

  const readyOutputs = items.map((item) => ({ item, output: outputs[item.id] })).filter(({ output }) => output?.url)
  const hasResult = readyOutputs.length > 0
  useEffect(() => { if (hasResult) trackToolUse(slug, 'result') }, [hasResult, slug])

  const removeItem = (id) => {
    const item = items.find((entry) => entry.id === id)
    if (item?.preview) URL.revokeObjectURL(item.preview)
    setItems((previous) => previous.filter((entry) => entry.id !== id))
    if (outputsRef.current[id]?.url) URL.revokeObjectURL(outputsRef.current[id].url)
    const rest = { ...outputsRef.current }
    delete rest[id]
    outputsRef.current = rest
    setOutputs(rest)
  }

  const clearAll = () => {
    items.forEach((item) => item.preview && URL.revokeObjectURL(item.preview))
    Object.values(outputsRef.current).forEach((output) => output.url && URL.revokeObjectURL(output.url))
    outputsRef.current = {}
    setOutputs({})
    setItems([])
    setNotice('')
    if (resizeFocus) { setWidth(''); setHeight('') }
  }

  const downloadAll = async () => {
    setDownloadingAll(true)
    trackToolUse(slug, 'download')
    // Sequential, spaced clicks: browsers block bursts of downloads.
    for (const { output } of readyOutputs) {
      triggerDownload(output.url, output.name)
      await new Promise((resolve) => setTimeout(resolve, 350))
    }
    setDownloadingAll(false)
  }

  const onWidth = (value) => {
    setWidth(value)
    if (lock && ratio && resizeMode === 'dimensions') setHeight(Number(value) > 0 ? String(Math.round(Number(value) / ratio)) : '')
  }
  const onHeight = (value) => {
    setHeight(value)
    if (lock && ratio && resizeMode === 'dimensions') setWidth(Number(value) > 0 ? String(Math.round(Number(value) * ratio)) : '')
  }
  const applyPreset = (preset) => {
    // Presets keep proportions: each image fits inside the preset box. Unlock to stretch to it exactly.
    setResizeMode('dimensions')
    setLock(true)
    setWidth(String(preset.width))
    setHeight(preset.height ? String(preset.height) : ratio ? String(Math.round(preset.width / ratio)) : '')
  }

  const effectiveKeys = new Set(items.filter((item) => item.img).map((item) => outputFormatFor(item, format)))
  if (!items.some((item) => item.img)) effectiveKeys.add(format === 'original' ? 'png' : format)
  const showQuality = [...effectiveKeys].some((key) => formats[key]?.lossy)
  const showBackground = effectiveKeys.has('jpeg')
  const hasSvg = items.some((item) => item.svg) || /svg/.test(inputAccept)
  const hasGif = items.some((item) => item.type === 'image/gif')
  const webpBlocked = webpSupported === false && effectiveKeys.has('webp')

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    addFiles(event.dataTransfer?.files)
  }

  const resizeControls = (
    <div className={ui.stack}>
      <div>
        <span className={ui.label}>{resizeFocus ? 'Resize by' : 'Size'}</span>
        <Segmented
          label="Resize mode"
          value={resizeMode}
          onChange={setResizeMode}
          options={[...(resizeFocus ? [] : [{ value: 'none', label: 'Original' }]), { value: 'dimensions', label: 'Pixels' }, { value: 'percent', label: 'Percent' }]}
        />
      </div>
      {presets.length > 0 && (
        <div>
          <span className={ui.label}>Presets</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const active = resizeMode === 'dimensions' && String(preset.width) === width && (!preset.height || String(preset.height) === height)
              return (
                <button key={preset.label} type="button" onClick={() => applyPreset(preset)} aria-pressed={active} className={clsx(ui.smallButton, 'h-auto flex-col items-start gap-0 py-1.5 text-left', active && 'border-rose-300 bg-rose-50 text-zinc-900')}>
                  <span>{preset.label}</span>
                  <span className="font-normal text-zinc-500">{preset.height ? `${preset.width}×${preset.height}` : `${preset.width}px wide`}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
      {resizeMode === 'dimensions' && (
        <div>
          <div className="flex items-end gap-2">
            <label className="min-w-0 flex-1">
              <span className={ui.label}>Width (px)</span>
              <input type="number" min="1" max="8192" inputMode="numeric" value={width} onChange={(event) => onWidth(event.target.value)} placeholder="Auto" className={ui.input} />
            </label>
            <button type="button" onClick={() => setLock(!lock)} aria-pressed={lock} title={lock ? 'Aspect ratio locked' : 'Aspect ratio unlocked'} className={clsx(ui.secondaryButton, 'w-10 shrink-0 px-0', lock && 'border-rose-300 text-rose-600')}>
              {lock ? <LockClosedIcon aria-hidden="true" className="size-4" /> : <LockOpenIcon aria-hidden="true" className="size-4" />}
              <span className="sr-only">{lock ? 'Unlock aspect ratio' : 'Lock aspect ratio'}</span>
            </button>
            <label className="min-w-0 flex-1">
              <span className={ui.label}>Height (px)</span>
              <input type="number" min="1" max="8192" inputMode="numeric" value={height} onChange={(event) => onHeight(event.target.value)} placeholder="Auto" className={ui.input} />
            </label>
          </div>
          <p className={ui.hint}>{lock ? 'Aspect ratio locked: each image fits inside this box and keeps its proportions.' : 'Unlocked: images are stretched to exactly this size.'} Leave one side empty to scale the other automatically.</p>
        </div>
      )}
      {resizeMode === 'percent' && (
        <label className="block">
          <span className={ui.label}>Scale: {percent || 100}%</span>
          <input type="range" min="5" max="200" step="5" value={Number(percent) || 100} onChange={(event) => setPercent(event.target.value)} className={ui.range} />
          <span className={ui.hint}>Applied to each image. Above 100% enlarges, which can look soft on photos.</span>
        </label>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div
            onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={clsx('flex flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center transition-colors', items.length ? 'min-h-32' : 'min-h-64', dragging ? 'border-rose-400 bg-rose-50/40' : 'border-zinc-300')}
          >
            <PhotoIcon aria-hidden="true" className={ui.emptyIcon} />
            <p className="text-sm font-medium text-zinc-900">{dropTitle}</p>
            <p className="mt-1 text-sm text-zinc-500">{dropHint} You can also paste a screenshot.</p>
            <input ref={fileInput} type="file" accept={inputAccept} multiple className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { addFiles(event.target.files); event.target.value = '' }} />
            <button type="button" onClick={() => fileInput.current?.click()} className={clsx(ui.secondaryButton, 'mt-4')}>
              <ArrowUpTrayIcon aria-hidden="true" className="size-4" />
              Choose images
            </button>
          </div>

          {notice && <p role="status" className={ui.error}>{notice}</p>}

          {items.length > 0 && (
            <div className={ui.card}>
              <div className={clsx(ui.cardHeader, 'py-3')}>
                <h2 className={ui.cardTitle}>{items.length} {items.length === 1 ? 'image' : 'images'}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={clearAll} className={ui.smallButton}>Clear</button>
                  {readyOutputs.length > 1 && (
                    <button type="button" onClick={downloadAll} disabled={downloadingAll} className={clsx(ui.smallButton, 'border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-700 hover:text-white disabled:opacity-50')}>
                      <ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />
                      {downloadingAll ? 'Downloading…' : `Download all (${readyOutputs.length})`}
                    </button>
                  )}
                </div>
              </div>
              <ul role="list" className="divide-y divide-zinc-100">
                {items.map((item) => {
                  const output = outputs[item.id]
                  const change = output?.url ? sizeChange(item.size, output.size) : null
                  return (
                    <li key={item.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                      <div className={clsx('flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200 sm:w-32', checker)}>
                        <img src={output?.url || item.preview} alt={`Preview of ${item.name}`} className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-medium text-zinc-900" title={item.name}>{item.name}</p>
                        {item.status === 'error' ? (
                          <p className="mt-1 text-red-700">{item.error}</p>
                        ) : (
                          <dl className="mt-1.5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-xs">
                            <dt className="text-zinc-500">Original</dt>
                            <dd className="text-zinc-700 tabular-nums">{item.img ? `${item.width}×${item.height}px · ` : ''}{formatBytes(item.size)}{item.svg ? ' · SVG' : ''}</dd>
                            <dt className="text-zinc-500">Output</dt>
                            <dd className="text-zinc-900 tabular-nums">
                              {output?.error ? <span className="text-red-700">{output.error}</span> : output?.url ? (
                                <>
                                  {output.width}×{output.height}px · {formatBytes(output.size)} · {extensionForMime(output.mime).toUpperCase()}
                                  {change && <span className={clsx('ml-1.5', change.tone)}>({change.text})</span>}
                                  {output.fallback && <span className="ml-1.5 text-amber-700">saved as PNG</span>}
                                </>
                              ) : <span className="text-zinc-500">Converting…</span>}
                            </dd>
                          </dl>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {output?.url && (
                          <a href={output.url} download={output.name} onClick={() => trackToolUse(slug, 'download')} className={ui.smallButton}>
                            <ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />
                            Download
                          </a>
                        )}
                        <button type="button" onClick={() => removeItem(item.id)} className={clsx(ui.smallButton, 'w-8 px-0')}>
                          <XMarkIcon aria-hidden="true" className="size-4" />
                          <span className="sr-only">Remove {item.name}</span>
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>

        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Settings</h2></div>
          <div className={clsx(ui.cardBody, ui.stack)}>
            {resizeFocus && resizeControls}
            <div>
              <span className={ui.label}>Output format</span>
              <Segmented label="Output format" value={format} onChange={setFormat} options={formatOptions.map((key) => ({ value: key, label: formatLabels[key] }))} />
              {format === 'original' && <p className={ui.hint}>JPEG and WebP stay as they are; PNG, GIF, SVG and other formats are saved as PNG.</p>}
            </div>
            {webpBlocked && (
              <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <ExclamationTriangleIcon aria-hidden="true" className="size-4 shrink-0" />
                This browser can show WebP but can’t create it, so WebP output is saved as PNG. Chrome, Edge and Firefox can encode WebP.
              </p>
            )}
            {showQuality && (
              <label className="block">
                <span className={ui.label}>Quality: {quality}</span>
                <input type="range" min="10" max="100" step="1" value={quality} onChange={(event) => setQuality(Number(event.target.value))} className={ui.range} />
                <span className={ui.hint}>For JPEG and WebP. 75–85 is a good balance for screenshots and photos. PNG is always lossless.</span>
              </label>
            )}
            {showBackground && (
              <div>
                <label htmlFor={`${slug}-background`} className={ui.label}>Background for transparent areas</label>
                <div className="flex items-center gap-2">
                  <input id={`${slug}-background`} type="color" value={background} onChange={(event) => { setBackground(event.target.value); setBackgroundDraft(event.target.value) }} className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-zinc-200 bg-white p-1" />
                  <input type="text" value={backgroundDraft} onChange={(event) => { const value = event.target.value.trim(); setBackgroundDraft(value); if (/^#[0-9a-f]{6}$/i.test(value)) setBackground(value.toLowerCase()) }} aria-label="Background hex color" className={clsx(ui.input, 'font-mono')} />
                </div>
                <p className={ui.hint}>JPEG has no transparency, so transparent pixels are filled with this color.</p>
              </div>
            )}
            {hasSvg && (
              <div>
                <span className={ui.label}>SVG output scale</span>
                <Segmented label="SVG output scale" value={svgScale} onChange={setSvgScale} options={[{ value: 1, label: '1x' }, { value: 2, label: '2x' }, { value: 4, label: '4x' }, { value: 'width', label: 'Width' }]} />
                {svgScale === 'width' && (
                  <input type="number" min="1" max="8192" inputMode="numeric" value={svgWidth} onChange={(event) => setSvgWidth(event.target.value)} placeholder="Width in px, e.g. 1024" aria-label="SVG output width in pixels" className={clsx(ui.input, 'mt-2')} />
                )}
                <p className={ui.hint}>SVGs are vectors, so they render sharp at any size. 2x suits retina screens.</p>
              </div>
            )}
            {showResize && !resizeFocus && resizeControls}
            {hasGif && <p className={ui.hint}>Animated GIFs: only the first frame is converted.</p>}
          </div>
        </div>
      </div>

      {hasResult && <ToolCta title={cta.title} copy={cta.copy} />}
      <PrivacyNote>Runs entirely in your browser. Images are converted on your device and never uploaded.</PrivacyNote>
    </div>
  )
}
