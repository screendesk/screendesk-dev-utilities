import { useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CopyButton, ui } from '@/components/tools/toolUi'
import { CodeArea, CodeBlock, DevPane, ErrorBox, PrivacyNote, Segmented } from '@/components/tools/dev/DevToolShell'
import { base64ToBytes, bytesToBase64, formatBytes, sniffMime } from '@/components/tools/dev/base64'
import { extensionForMime } from './imageUtils'

// Image ⇄ Base64: encode an image as a data URL, raw base64, CSS or an <img> tag, or decode
// base64 / a data URL back to a previewable, downloadable image. All in the browser.

const SLUG = 'image-to-base64'
const MAX_FILE = 10 * 1024 * 1024
const MAX_DISPLAY = 100000
const checker = 'bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px]'

const outputTypes = [
  { value: 'dataUrl', label: 'Data URL' },
  { value: 'raw', label: 'Base64' },
  { value: 'css', label: 'CSS' },
  { value: 'html', label: 'HTML' },
]

function escapeAttr(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function buildOutput(type, file) {
  const dataUrl = `data:${file.mime};base64,${file.b64}`
  if (type === 'raw') return file.b64
  if (type === 'css') return `background-image: url("${dataUrl}");`
  if (type === 'html') return `<img src="${dataUrl}" alt="${escapeAttr(file.name.replace(/\.[^.]+$/, ''))}"${file.width ? ` width="${file.width}" height="${file.height}"` : ''} />`
  return dataUrl
}

// Decodes base64 or a data URL (base64 or URL-encoded) to bytes and a mime type.
function decodeImageInput(input) {
  const value = input.trim()
  const plainDataUrl = value.match(/^data:([^;,]+)((?:;[^;,=]+=[^;,]+)*),/i)
  if (plainDataUrl) {
    let text
    try {
      text = decodeURIComponent(value.slice(plainDataUrl[0].length))
    } catch (_) {
      throw new Error('This data URL is not base64 and could not be URL-decoded.')
    }
    return { bytes: new TextEncoder().encode(text), mime: plainDataUrl[1].toLowerCase() }
  }
  const { bytes, mime: declared } = base64ToBytes(value)
  if (!bytes.length) throw new Error('There is no data after the prefix.')
  const sniffed = sniffMime(bytes)
  const mime = sniffed && sniffed.startsWith('image/') ? sniffed : declared
  if (!mime || !mime.startsWith('image/')) throw new Error(sniffed ? `This decodes to ${sniffed}, not an image.` : 'This base64 decodes fine but isn’t a recognised image (PNG, JPEG, GIF, WebP, BMP, ICO or SVG). Add a data:image/… prefix if you know the type.')
  return { bytes, mime, declared, sniffed }
}

export function ImageBase64Tool() {
  const [mode, setMode] = useState('encode')
  const [file, setFile] = useState(null) // { name, size, mime, b64, width, height }
  const [fileError, setFileError] = useState('')
  const [outputType, setOutputType] = useState('dataUrl')
  const [input, setInput] = useState('')
  const [decodedDims, setDecodedDims] = useState(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef(null)

  const pickFile = async (picked) => {
    if (!picked) return
    if (!(picked.type.startsWith('image/') || /\.svg$/i.test(picked.name))) {
      setFileError(`${picked.name} is not an image.`)
      return
    }
    if (picked.size > MAX_FILE) {
      setFileError(`That image is ${formatBytes(picked.size)}. Images up to ${formatBytes(MAX_FILE)} can be encoded here, and anything over a few KB is usually better served as a file.`)
      return
    }
    setFileError('')
    const bytes = new Uint8Array(await picked.arrayBuffer())
    const mime = picked.type || sniffMime(bytes) || 'application/octet-stream'
    const b64 = bytesToBase64(bytes)
    setMode('encode')
    setFile({ name: picked.name || 'image', size: picked.size, mime, b64, width: null, height: null })
  }

  const output = file ? buildOutput(outputType, file) : ''

  const decoded = useMemo(() => {
    if (mode !== 'decode' || !input.trim()) return null
    try {
      return decodeImageInput(input)
    } catch (error) {
      return { error: error.message }
    }
  }, [mode, input])

  // Blob URL for the decoded preview and download; revoked when the input changes.
  const decodedUrl = useMemo(() => {
    if (!decoded || decoded.error || typeof URL === 'undefined') return null
    return URL.createObjectURL(new Blob([decoded.bytes], { type: decoded.mime }))
  }, [decoded])
  useEffect(() => () => decodedUrl && URL.revokeObjectURL(decodedUrl), [decodedUrl])
  const dims = decodedDims?.url === decodedUrl ? decodedDims : null

  const hasResult = Boolean(file) || Boolean(dims)
  useEffect(() => { if (hasResult) trackToolUse(SLUG, 'result') }, [hasResult])

  const changeMode = (next) => {
    setMode(next)
    setFileError('')
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    pickFile(event.dataTransfer?.files?.[0])
  }

  const encodePane = (
    <div className={ui.grid}>
      <DevPane
        title="Image"
        actions={
          <>
            <input ref={fileInput} type="file" accept="image/*,.svg" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(event) => { pickFile(event.target.files?.[0]); event.target.value = '' }} />
            <button type="button" className={ui.smallButton} onClick={() => fileInput.current?.click()}><ArrowUpTrayIcon aria-hidden="true" className="size-3.5" />Choose image</button>
            {file && <button type="button" className={ui.smallButton} onClick={() => setFile(null)}>Clear</button>}
          </>
        }
      >
        <div
          onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={clsx('flex min-h-[18.5rem] flex-col items-center justify-center gap-3 rounded-md border border-dashed p-6 text-center text-sm', dragging ? 'border-rose-400 bg-rose-50/40' : 'border-zinc-300 bg-zinc-50')}
        >
          {file ? (
            <>
              <div className={clsx('rounded border border-zinc-200 p-2', checker)}>
                <img
                  src={`data:${file.mime};base64,${file.b64}`}
                  alt={`Preview of ${file.name}`}
                  onLoad={(event) => { const { naturalWidth: width, naturalHeight: height } = event.currentTarget; if (width && !file.width) setFile((current) => current && { ...current, width, height }) }}
                  className="max-h-40 max-w-full object-contain"
                />
              </div>
              <p className="font-medium break-all text-zinc-900">{file.name}</p>
              <p className="text-zinc-500 tabular-nums">{file.mime}{file.width ? ` · ${file.width}×${file.height}px` : ''} · {formatBytes(file.size)}</p>
            </>
          ) : (
            <>
              <PhotoIcon aria-hidden="true" className={ui.emptyIcon} />
              <p className="font-medium text-zinc-900">Drop an image here</p>
              <p className="text-zinc-500">PNG, JPEG, GIF, WebP, SVG, ICO. Up to {formatBytes(MAX_FILE)}.</p>
              <button type="button" className={ui.secondaryButton} onClick={() => fileInput.current?.click()}>Choose image</button>
            </>
          )}
        </div>
        <div className="mt-3"><ErrorBox>{fileError}</ErrorBox></div>
      </DevPane>
      <DevPane title="Base64 output" actions={<CopyButton text={output} />}>
        <div className="space-y-3">
          <Segmented label="Output type" value={outputType} onChange={setOutputType} options={outputTypes} />
          {file ? (
            <>
              <CodeBlock label="Base64 output" className="whitespace-pre-wrap break-all">{output.length > MAX_DISPLAY ? `${output.slice(0, MAX_DISPLAY)}\n\n… ${(output.length - MAX_DISPLAY).toLocaleString('en-US')} more characters. Use Copy for the full output.` : output}</CodeBlock>
              <p className="text-xs text-zinc-500 tabular-nums">{formatBytes(file.size)} image → {file.b64.length.toLocaleString('en-US')} base64 characters ({Math.round(((file.b64.length - file.size) / file.size) * 100)}% larger)</p>
            </>
          ) : (
            <div className={ui.empty}>Choose an image to get its data URL, raw base64, a CSS background rule, or an HTML img tag.</div>
          )}
        </div>
      </DevPane>
    </div>
  )

  const decodePane = (
    <div className={ui.grid}>
      <DevPane title="Base64 or data URL" actions={<button type="button" className={ui.smallButton} onClick={() => setInput('')}>Clear</button>}>
        <CodeArea label="Base64 or data URL to decode" value={input} onChange={setInput} placeholder="Paste data:image/png;base64,iVBOR… or raw base64 like /9j/4AAQ…" />
        <p className={ui.hint}>Raw base64 without a prefix works too: the image type is detected from its first bytes.</p>
      </DevPane>
      <DevPane
        title="Image preview"
        actions={decodedUrl && (
          <a href={decodedUrl} download={`image.${extensionForMime(decoded.mime)}`} onClick={() => trackToolUse(SLUG, 'download')} className={ui.smallButton}>
            <ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />Download
          </a>
        )}
      >
        {decoded?.error ? (
          <ErrorBox hint="Tip: strings copied from JSON or logs can include quotes or escaped characters (\n, \/). Remove them and try again.">{decoded.error}</ErrorBox>
        ) : decodedUrl ? (
          <div className="space-y-3">
            <div className={clsx('flex min-h-64 items-center justify-center rounded-md border border-zinc-200 p-3', checker)}>
              <img
                src={decodedUrl}
                alt="Decoded image preview"
                onLoad={(event) => setDecodedDims({ url: decodedUrl, width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
                                className="max-h-80 max-w-full object-contain"
              />
            </div>
            <p className="text-xs text-zinc-500 tabular-nums">
              {decoded.mime}{dims?.width ? ` · ${dims.width}×${dims.height}px` : ''} · {formatBytes(decoded.bytes.length)}
              {decoded.declared && decoded.sniffed && decoded.declared !== decoded.sniffed && ` · prefix said ${decoded.declared}, the bytes are ${decoded.sniffed}`}
            </p>
          </div>
        ) : (
          <div className={ui.empty}>The decoded image appears here, ready to download.</div>
        )}
      </DevPane>
    </div>
  )

  return (
    <div className="space-y-4">
      <Segmented label="Mode" value={mode} onChange={changeMode} options={[{ value: 'encode', label: 'Image to Base64' }, { value: 'decode', label: 'Base64 to image' }]} />
      {mode === 'encode' ? encodePane : decodePane}
      {hasResult && (
        <ToolCta title="Need screenshots from customers?" copy="Screendesk captures annotated screenshots and screen recordings with device details, straight into your helpdesk." />
      )}
      <PrivacyNote>Runs entirely in your browser. Images and base64 you paste are never uploaded.</PrivacyNote>
    </div>
  )
}
