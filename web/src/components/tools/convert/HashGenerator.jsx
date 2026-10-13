import { useEffect, useMemo, useState } from 'react'
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from '@/components/tools/dev/DevToolShell'
import { ALGORITHMS, findMatch, hashAll, hmacAll, toBase64, toHex } from './hash'

const MAX_FILE_BYTES = 512 * 1024 * 1024
const encoder = new TextEncoder()

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export function HashGenerator() {
  const [source, setSource] = useState('text')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null) // { name, size, bytes }
  const [fileError, setFileError] = useState('')
  const [reading, setReading] = useState(false)
  const [useHmac, setUseHmac] = useState(false)
  const [hmacKey, setHmacKey] = useState('')
  const [encoding, setEncoding] = useState('hex')
  const [uppercase, setUppercase] = useState(false)
  const [expected, setExpected] = useState('')
  const [state, setState] = useState({ digests: null, error: '', pending: false })

  const bytes = useMemo(() => (source === 'text' ? encoder.encode(text) : file?.bytes ?? null), [source, text, file])
  const hasInput = source === 'text' ? text.length > 0 : Boolean(file)

  useEffect(() => {
    let cancelled = false
    if (!bytes || typeof crypto === 'undefined' || !crypto.subtle) {
      const id = setTimeout(() => {
        if (!cancelled) setState({ digests: null, error: bytes && !globalThis.crypto?.subtle ? 'Your browser blocks WebCrypto on this page (it needs HTTPS).' : '', pending: false })
      }, 0)
      return () => { cancelled = true; clearTimeout(id) }
    }
    const run = useHmac ? hmacAll(bytes, encoder.encode(hmacKey), crypto.subtle) : hashAll(bytes, crypto.subtle)
    run.then(
      (digests) => { if (!cancelled) setState({ digests, error: '', pending: false }) },
      (error) => { if (!cancelled) setState({ digests: null, error: error?.message || 'Hashing failed.', pending: false }) },
    )
    return () => { cancelled = true }
  }, [bytes, useHmac, hmacKey])

  const ready = hasInput && Boolean(state.digests)
  useEffect(() => {
    if (ready) trackToolUse('hash-generator', 'result')
  }, [ready])

  const onFile = async (event) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    setFileError('')
    if (picked.size > MAX_FILE_BYTES) {
      setFileError(`That file is ${formatBytes(picked.size)}. This tool reads files into memory, so the limit is ${formatBytes(MAX_FILE_BYTES)}. For bigger files use sha256sum or Get-FileHash.`)
      return
    }
    setReading(true)
    try {
      const buffer = await picked.arrayBuffer()
      setFile({ name: picked.name, size: picked.size, bytes: new Uint8Array(buffer) })
    } catch (_) {
      setFileError('Could not read that file.')
    } finally {
      setReading(false)
    }
  }

  const display = (digest) => {
    if (!digest) return ''
    if (encoding === 'base64') return toBase64(digest)
    const hex = toHex(digest)
    return uppercase ? hex.toUpperCase() : hex
  }

  const rows = ALGORITHMS.filter((algorithm) => !useHmac || algorithm.webCrypto)
  const match = useMemo(() => (state.digests && expected.trim() ? findMatch(expected, state.digests) : null), [expected, state.digests])

  return (
    <DevToolShell
      toolbar={
        <>
          <Segmented label="Input source" value={source} onChange={setSource} options={[{ value: 'text', label: 'Text' }, { value: 'file', label: 'File' }]} />
          <Segmented label="Output encoding" value={encoding} onChange={setEncoding} options={[{ value: 'hex', label: 'Hex' }, { value: 'base64', label: 'Base64' }]} />
          {encoding === 'hex' && <Toggle label="Uppercase" checked={uppercase} onChange={setUppercase} />}
          <Toggle label="HMAC" checked={useHmac} onChange={setUseHmac} />
        </>
      }
      left={
        <DevPane
          title={source === 'text' ? 'Text' : 'File'}
          actions={source === 'text'
            ? <button type="button" className={ui.smallButton} onClick={() => setText('')} disabled={!text}>Clear</button>
            : file && <button type="button" className={ui.smallButton} onClick={() => setFile(null)}>Remove</button>}
        >
          <div className="space-y-4">
            {source === 'text' ? (
              <div>
                <CodeArea label="Text to hash" value={text} onChange={setText} rows={8} placeholder="Type or paste text. It is hashed as UTF-8 bytes." />
                <p className={ui.hint}>{encoder.encode(text).length.toLocaleString('en-US')} bytes (UTF-8). A trailing newline or space changes the hash.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className={`${ui.empty} min-h-44 cursor-pointer hover:border-zinc-400`}>
                  <DocumentArrowUpIcon aria-hidden="true" className={ui.emptyIcon} />
                  <span className="font-medium text-zinc-900">{reading ? 'Reading file…' : 'Choose a file to checksum'}</span>
                  <span className="mt-1">Any type, up to {formatBytes(MAX_FILE_BYTES)}. It never leaves your device.</span>
                  <input type="file" className="sr-only" onChange={onFile} />
                </label>
                {file && (
                  <p className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
                    <span className="truncate font-medium text-zinc-900">{file.name}</span>
                    <span className="text-zinc-500">{formatBytes(file.size)}</span>
                  </p>
                )}
                <ErrorBox>{fileError}</ErrorBox>
              </div>
            )}
            {useHmac && (
              <div>
                <label htmlFor="hmac-key" className={ui.label}>Secret key</label>
                <input id="hmac-key" className={`${ui.input} font-mono`} value={hmacKey} onChange={(event) => setHmacKey(event.target.value)} placeholder="HMAC secret (UTF-8)" spellCheck={false} autoComplete="off" />
                <p className={ui.hint}>HMAC is computed with SHA-1/256/384/512. WebCrypto has no HMAC-MD5.</p>
              </div>
            )}
            <div>
              <label htmlFor="expected-hash" className={ui.label}>Compare with expected checksum</label>
              <input id="expected-hash" className={`${ui.input} font-mono`} value={expected} onChange={(event) => setExpected(event.target.value)} placeholder="Paste a hex or Base64 checksum" spellCheck={false} autoComplete="off" />
              <div className="mt-2 min-h-6" aria-live="polite">
                {match && (match.id
                  ? <Badge tone="positive">Match: {match.id} ({match.encoding})</Badge>
                  : <Badge tone="negative">No match with any algorithm</Badge>)}
              </div>
            </div>
          </div>
        </DevPane>
      }
      right={
        <DevPane title={useHmac ? 'HMAC' : 'Hashes'}>
          <ErrorBox>{state.error}</ErrorBox>
          {!hasInput && !state.error ? (
            <div className={ui.empty}>{source === 'text' ? 'Hashes appear here as you type.' : 'Choose a file to see its checksums.'}</div>
          ) : (
            <ul className={ui.rows}>
              {rows.map(({ id, bits }) => {
                const value = display(state.digests?.[id])
                const matched = match?.id === id
                return (
                  <li key={id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-900">{useHmac ? `HMAC-${id}` : id}</span>
                        <span>{bits} bits</span>
                        {matched && <Badge tone="positive">Match</Badge>}
                      </p>
                      <p className="mt-1 break-all font-mono text-[13px] leading-5 text-zinc-900">{value || '…'}</p>
                    </div>
                    <CopyButton text={value} />
                  </li>
                )
              })}
            </ul>
          )}
        </DevPane>
      }
      below={
        ready && (
          <ToolCta
            title="Verifying a build a customer says is broken?"
            copy="Screendesk bug reports attach console logs, network requests and device details automatically, so you know exactly what the customer was running."
          />
        )
      }
    />
  )
}
