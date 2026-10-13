import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CopyButton, ui } from '@/components/tools/toolUi'
import { CodeArea, DevPane, ErrorBox, PrivacyNote, Segmented } from '@/components/tools/dev/DevToolShell'
import { MAX_SIDE, formatBytes, loadSvgImage, minifySvg, parseSvgInfo, renderImage, triggerDownload } from './imageUtils'

// SVG viewer: paste or upload SVG markup and preview it on different backgrounds with zoom.
// The preview is an <img> pointing at a blob URL, never innerHTML, so scripts inside the SVG don't run.

const SLUG = 'svg-viewer'
const MAX_FILE = 5 * 1024 * 1024
const SAMPLE = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#e11d48" stroke-width="1.5">
  <!-- A sample icon: replace it with your own SVG -->
  <rect x="3" y="4" width="18" height="14" rx="2" />
  <path d="M7 21h10M12 18v3" stroke-linecap="round" />
  <circle cx="12" cy="11" r="3" fill="#ffe4e6" />
</svg>`

const backgrounds = {
  checker: 'bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px]',
  white: 'bg-white',
  dark: 'bg-zinc-900',
}
const zoomSteps = [0.25, 0.5, 1, 2, 4, 8]

function byteLength(text) {
  return new TextEncoder().encode(text).length
}

export function SvgViewer() {
  const [code, setCode] = useState('')
  const [parsed, setParsed] = useState(null) // { url, info } | { error }
  const [background, setBackground] = useState('checker')
  const [zoom, setZoom] = useState('fit')
  const [pngScale, setPngScale] = useState(2)
  const [pngError, setPngError] = useState('')
  const [fileError, setFileError] = useState('')
  const [dragging, setDragging] = useState(false)
  const [minified, setMinified] = useState(null) // { before, after } after the last minify
  const fileInput = useRef(null)

  // Parse and build the preview URL after typing pauses. DOMParser and object URLs are client-only.
  useEffect(() => {
    if (!code.trim()) return undefined
    let url = null
    const timer = setTimeout(() => {
      try {
        const info = parseSvgInfo(code)
        url = URL.createObjectURL(new Blob([code], { type: 'image/svg+xml' }))
        setParsed({ url, info })
      } catch (error) {
        setParsed({ error: error.message })
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      if (url) URL.revokeObjectURL(url)
    }
  }, [code])

  const preview = code.trim() ? parsed : null
  const isUserContent = Boolean(preview?.url) && code !== SAMPLE
  useEffect(() => { if (isUserContent) trackToolUse(SLUG, 'result') }, [isUserContent])

  const pickFile = async (picked) => {
    if (!picked) return
    if (picked.size > MAX_FILE) {
      setFileError(`That file is ${formatBytes(picked.size)}. SVGs up to ${formatBytes(MAX_FILE)} can be opened here.`)
      return
    }
    const text = await picked.text()
    if (!/<svg[\s>]/i.test(text)) {
      setFileError(`${picked.name} doesn’t contain SVG markup.`)
      return
    }
    setFileError('')
    setMinified(null)
    setCode(text)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    pickFile(event.dataTransfer?.files?.[0])
  }

  const minify = () => {
    const before = byteLength(code)
    const next = minifySvg(code)
    setMinified({ before, after: byteLength(next) })
    setCode(next)
  }

  const info = preview?.info
  const baseWidth = info?.width || 300
  const baseHeight = info?.height || 150

  const downloadSvg = () => {
    if (!preview?.url) return
    trackToolUse(SLUG, 'download')
    triggerDownload(preview.url, 'image.svg')
  }

  const downloadPng = async () => {
    if (!preview?.url) return
    setPngError('')
    try {
      const width = Math.round(baseWidth * pngScale)
      const height = Math.round(baseHeight * pngScale)
      const img = await loadSvgImage(code, width, height)
      const { blob } = await renderImage({ img, width, height, mime: 'image/png' })
      const url = URL.createObjectURL(blob)
      trackToolUse(SLUG, 'download')
      triggerDownload(url, 'image.png')
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setPngError(error.message)
    }
  }

  const zoomIndex = zoom === 'fit' ? -1 : zoomSteps.indexOf(zoom)
  const zoomBy = (direction) => {
    const current = zoom === 'fit' ? 2 : zoomIndex
    const next = Math.min(zoomSteps.length - 1, Math.max(0, current + direction))
    setZoom(zoomSteps[next])
  }

  const size = byteLength(code)
  const pngTooLarge = baseWidth * pngScale > MAX_SIDE || baseHeight * pngScale > MAX_SIDE

  return (
    <div className="space-y-4">
      <div className={ui.grid}>
        <DevPane
          title="SVG code"
          actions={
            <>
              <input ref={fileInput} type="file" accept=".svg,image/svg+xml" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { pickFile(event.target.files?.[0]); event.target.value = '' }} />
              <button type="button" className={ui.smallButton} onClick={() => fileInput.current?.click()}><ArrowUpTrayIcon aria-hidden="true" className="size-3.5" />Open SVG</button>
              {!code && <button type="button" className={ui.smallButton} onClick={() => setCode(SAMPLE)}>Sample</button>}
              {code && <button type="button" className={ui.smallButton} onClick={minify}>Minify</button>}
              {code && <CopyButton text={code} />}
              {code && <button type="button" className={ui.smallButton} onClick={() => { setCode(''); setMinified(null) }}>Clear</button>}
            </>
          }
        >
          <div onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop} className={clsx('rounded-md', dragging && 'ring-2 ring-rose-400')}>
            <CodeArea label="SVG code" value={code} onChange={(value) => { setCode(value); setMinified(null) }} rows={18} placeholder={'Paste <svg …>…</svg> code here, or drop an .svg file'} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 tabular-nums">
            {code && <span>{formatBytes(size)}</span>}
            {minified && <span className="text-emerald-700">Minified: {formatBytes(minified.before)} → {formatBytes(minified.after)} ({Math.round(((minified.before - minified.after) / Math.max(1, minified.before)) * 100)}% smaller)</span>}
          </div>
          <div className="mt-3"><ErrorBox>{fileError}</ErrorBox></div>
        </DevPane>

        <DevPane
          title="Preview"
          actions={
            <>
              <Segmented label="Preview background" value={background} onChange={setBackground} options={[{ value: 'checker', label: 'Grid' }, { value: 'white', label: 'White' }, { value: 'dark', label: 'Dark' }]} />
            </>
          }
        >
          {preview?.error ? (
            <ErrorBox hint="The preview updates as soon as the markup parses. Check for unclosed tags or a missing closing </svg>.">{preview.error}</ErrorBox>
          ) : preview?.url ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => zoomBy(-1)} disabled={zoomIndex === 0} className={clsx(ui.smallButton, 'w-8 px-0 disabled:opacity-50')}><MagnifyingGlassMinusIcon aria-hidden="true" className="size-4" /><span className="sr-only">Zoom out</span></button>
                <button type="button" onClick={() => zoomBy(1)} disabled={zoomIndex === zoomSteps.length - 1} className={clsx(ui.smallButton, 'w-8 px-0 disabled:opacity-50')}><MagnifyingGlassPlusIcon aria-hidden="true" className="size-4" /><span className="sr-only">Zoom in</span></button>
                <button type="button" onClick={() => setZoom('fit')} aria-pressed={zoom === 'fit'} className={clsx(ui.smallButton, zoom === 'fit' && 'border-rose-300 bg-rose-50')}>Fit</button>
                <button type="button" onClick={() => setZoom(1)} aria-pressed={zoom === 1} className={clsx(ui.smallButton, zoom === 1 && 'border-rose-300 bg-rose-50')}>100%</button>
                <span className="text-xs text-zinc-500 tabular-nums">{zoom === 'fit' ? 'Fit to panel' : `${Math.round(zoom * 100)}%`}</span>
              </div>
              <div className={clsx('flex h-[22rem] overflow-auto rounded-md border border-zinc-200 p-4', backgrounds[background])}>
                <img
                  src={preview.url}
                  alt="SVG preview"
                  className={clsx('m-auto block', zoom === 'fit' ? 'h-full w-full object-contain' : 'max-w-none')}
                  style={zoom === 'fit' ? undefined : { width: baseWidth * zoom, height: baseHeight * zoom }}
                />
              </div>
              <dl className={ui.rows}>
                <div className={ui.row}><dt className={ui.rowLabel}>Rendered size</dt><dd className={ui.rowValue}>{info.width && info.height ? `${info.width}×${info.height}px` : 'Not set (defaults to 300×150px)'}</dd></div>
                <div className={ui.row}><dt className={ui.rowLabel}>width / height attributes</dt><dd className={clsx(ui.rowValue, 'font-mono text-xs')}>{info.widthAttr || '—'} / {info.heightAttr || '—'}</dd></div>
                <div className={ui.row}><dt className={ui.rowLabel}>viewBox</dt><dd className={clsx(ui.rowValue, 'font-mono text-xs')}>{info.viewBox || 'None (won’t scale cleanly)'}</dd></div>
                <div className={ui.row}><dt className={ui.rowLabel}>Elements</dt><dd className={ui.rowValue}>{info.elements}</dd></div>
              </dl>
            </div>
          ) : (
            <div className={ui.empty}>Paste SVG code or open a file to preview it here.</div>
          )}
        </DevPane>
      </div>

      {preview?.url && (
        <div className={clsx(ui.card, 'flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center')}>
          <button type="button" onClick={downloadSvg} className={ui.secondaryButton}><ArrowDownTrayIcon aria-hidden="true" className="size-4" />Download SVG</button>
          <div className="flex flex-wrap items-center gap-2">
            <Segmented label="PNG scale" value={pngScale} onChange={setPngScale} options={[{ value: 1, label: '1x' }, { value: 2, label: '2x' }, { value: 4, label: '4x' }]} />
            <button type="button" onClick={downloadPng} disabled={pngTooLarge} className={ui.primaryButton}><ArrowDownTrayIcon aria-hidden="true" className="size-4" />Download PNG ({Math.round(baseWidth * pngScale)}×{Math.round(baseHeight * pngScale)})</button>
          </div>
          {pngTooLarge && <p className="text-xs text-zinc-500">Too large at this scale; keep each side at or under {MAX_SIDE}px.</p>}
          {pngError && <div className="w-full"><ErrorBox>{pngError}</ErrorBox></div>}
        </div>
      )}

      {isUserContent && (
        <ToolCta title="Need screenshots from customers?" copy="Screendesk captures annotated screenshots and screen recordings with device details, straight into your helpdesk." />
      )}
      <PrivacyNote>Runs entirely in your browser. SVG code is previewed as an image, so scripts inside it never run, and nothing is uploaded.</PrivacyNote>
    </div>
  )
}
