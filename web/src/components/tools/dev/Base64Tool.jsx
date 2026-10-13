import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowsUpDownIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from './DevToolShell'
import { bytesToBase64, decodeBase64, encodeText, formatBytes, hexPreview } from './base64'

const MAX_FILE = 10 * 1024 * 1024
const MAX_DISPLAY = 100000 // characters rendered; Copy still gets the full output

export function Base64Tool() {
  const [mode, setMode] = useState('encode')
  const [input, setInput] = useState('')
  const [urlSafe, setUrlSafe] = useState(false)
  const [dataUrlPrefix, setDataUrlPrefix] = useState(true)
  const [file, setFile] = useState(null) // { name, size, type, bytes }
  const [fileError, setFileError] = useState('')
  const fileInput = useRef(null)

  const result = useMemo(() => {
    if (mode === 'encode') {
      if (file) {
        const b64 = bytesToBase64(file.bytes, urlSafe)
        const type = file.type || 'application/octet-stream'
        return { output: dataUrlPrefix && !urlSafe ? `data:${type};base64,${b64}` : b64, image: /^image\//.test(type) ? `data:${type};base64,${bytesToBase64(file.bytes)}` : null, meta: `${file.name} · ${formatBytes(file.size)}` }
      }
      if (!input) return null
      const output = encodeText(input, urlSafe)
      return { output, meta: `${formatBytes(new TextEncoder().encode(input).length)} → ${output.length} characters` }
    }
    if (!input.trim()) return null
    try {
      const { bytes, mime, text } = decodeBase64(input)
      const image = mime && /^image\//.test(mime) ? `data:${mime};base64,${bytesToBase64(bytes)}` : null
      return { output: text ?? hexPreview(bytes), binary: text === null, bytes, mime, image, meta: `${formatBytes(bytes.length)}${mime ? ` · ${mime}` : text === null ? ' · binary' : ' · UTF-8 text'}` }
    } catch (error) {
      return { error: error.message }
    }
  }, [mode, input, urlSafe, dataUrlPrefix, file])

  const ok = result && !result.error
  useEffect(() => {
    if (ok) trackToolUse('base64', 'result')
  }, [ok])

  const download = useMemo(() => {
    if (!ok || !result.binary || typeof URL === 'undefined') return null
    return URL.createObjectURL(new Blob([result.bytes], { type: result.mime || 'application/octet-stream' }))
  }, [ok, result])
  useEffect(() => () => download && URL.revokeObjectURL(download), [download])

  const changeMode = (next) => {
    setMode(next)
    setFile(null)
  }

  const swap = () => {
    if (!ok || result.binary) return
    setFile(null)
    setInput(result.output)
    setMode(mode === 'encode' ? 'decode' : 'encode')
  }

  const pickFile = async (event) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    if (picked.size > MAX_FILE) {
      setFileError(`That file is ${formatBytes(picked.size)}. Files up to ${formatBytes(MAX_FILE)} can be encoded here.`)
      return
    }
    setFileError('')
    const bytes = new Uint8Array(await picked.arrayBuffer())
    setMode('encode')
    setFile({ name: picked.name, size: picked.size, type: picked.type, bytes })
  }

  const extension = result?.mime?.split('/')[1]?.replace('+xml', '').replace('x-icon', 'ico') || 'bin'

  return (
    <DevToolShell
      toolbar={
        <>
          <Segmented label="Mode" value={mode} onChange={changeMode} options={[{ value: 'encode', label: 'Encode' }, { value: 'decode', label: 'Decode' }]} />
          <Toggle label="URL-safe (base64url)" checked={urlSafe} onChange={setUrlSafe} />
          {mode === 'encode' && file && <Toggle label="Data URL prefix" checked={dataUrlPrefix && !urlSafe} onChange={setDataUrlPrefix} />}
        </>
      }
      left={
        <DevPane
          title={mode === 'encode' ? 'Text or file to encode' : 'Base64 to decode'}
          actions={
            <>
              <input ref={fileInput} type="file" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={pickFile} />
              <button type="button" className={ui.smallButton} onClick={() => fileInput.current?.click()}><ArrowUpTrayIcon aria-hidden="true" className="size-3.5" />File to base64</button>
              <button type="button" className={ui.smallButton} onClick={() => { setInput(''); setFile(null); setFileError('') }}>Clear</button>
            </>
          }
        >
          {file ? (
            <div className="flex min-h-[18.5rem] flex-col items-center justify-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-6 text-center text-sm">
              {result?.image && <img src={result.image} alt={`Preview of ${file.name}`} className="max-h-40 max-w-full rounded border border-zinc-200 bg-white object-contain" />}
              <p className="font-medium text-zinc-900 break-all">{file.name}</p>
              <p className="text-zinc-500">{formatBytes(file.size)}{file.type ? ` · ${file.type}` : ''}</p>
              <button type="button" className={ui.smallButton} onClick={() => setFile(null)}>Encode text instead</button>
            </div>
          ) : (
            <CodeArea label={mode === 'encode' ? 'Text to encode' : 'Base64 to decode'} value={input} onChange={setInput} placeholder={mode === 'encode' ? 'Type or paste text. Emoji and accents are encoded as UTF-8.' : 'Paste base64, base64url, or a data: URL'} />
          )}
          <div className="mt-3"><ErrorBox>{fileError}</ErrorBox></div>
        </DevPane>
      }
      right={
        <DevPane
          title={mode === 'encode' ? 'Base64 output' : result?.binary ? 'Decoded bytes (hex)' : 'Decoded text'}
          actions={
            <>
              {ok && !result.binary && <button type="button" className={ui.smallButton} onClick={swap} title="Use the output as input and switch mode"><ArrowsUpDownIcon aria-hidden="true" className="size-3.5" />Swap</button>}
              {download && <a href={download} download={`decoded.${extension}`} className={ui.smallButton}>Download</a>}
              <CopyButton text={ok && !result.binary ? result.output : ''} />
            </>
          }
        >
          {result?.error ? (
            <ErrorBox hint="Tip: base64 strings copied from JSON or logs sometimes include quotes or escaped characters (\n, \/). Remove them and try again.">{result.error}</ErrorBox>
          ) : ok ? (
            <div className="space-y-3">
              <CodeBlock label="Output" className="whitespace-pre-wrap break-all">{result.output.length > MAX_DISPLAY ? `${result.output.slice(0, MAX_DISPLAY)}\n\n… ${(result.output.length - MAX_DISPLAY).toLocaleString('en-US')} more characters. Use Copy for the full output.` : result.output}</CodeBlock>
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                {result.meta}
                {result.binary && <Badge tone="neutral">Binary, not valid UTF-8 text</Badge>}
              </div>
              {mode === 'decode' && result.image && (
                <div className="rounded-md border border-zinc-200 bg-[repeating-conic-gradient(#f4f4f5_0_25%,#fff_0_50%)] bg-[length:16px_16px] p-3">
                  <img src={result.image} alt="Decoded image preview" className="mx-auto max-h-64 max-w-full object-contain" />
                </div>
              )}
            </div>
          ) : (
            <div className={ui.empty}>{mode === 'encode' ? 'Your base64 output appears here as you type.' : 'Decoded text, or an image preview, appears here.'}</div>
          )}
        </DevPane>
      }
      below={ok && (
        <ToolCta title="Decoding a payload from a bug report?" copy="Screendesk captures network requests and console logs with every recording, so you see the exact request and response instead of a pasted snippet." />
      )}
    />
  )
}
