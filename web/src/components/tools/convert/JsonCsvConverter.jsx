import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from '@/components/tools/dev/DevToolShell'
import { csvToJson, jsonToCsv } from './csv'
import { downloadText, formatBytes, previewText } from './textDownload'

const MAX_FILE = 25 * 1024 * 1024

const SAMPLES = {
  'json-csv': JSON.stringify(
    [
      { id: 'T-1042', subject: 'Checkout fails on Safari', status: 'open', customer: { name: 'Ada Lovelace', plan: 'pro' }, tags: ['billing', 'safari'] },
      { id: 'T-1043', subject: 'Export button, no response', status: 'pending', customer: { name: 'Grace Hopper', plan: 'team' }, tags: ['export'] },
      { id: 'T-1044', subject: 'Says "session expired" on login', status: 'solved', customer: { name: 'Alan Turing', plan: 'free' }, tags: [] },
    ],
    null,
    2
  ),
  'csv-json': 'id,subject,status,priority,created\nT-1042,Checkout fails on Safari,open,1,2026-10-02\nT-1043,"Export button, no response",pending,2,2026-10-03\nT-1044,"Says ""session expired"" on login",solved,3,2026-10-05',
}

const directions = [
  { value: 'json-csv', label: 'JSON → CSV' },
  { value: 'csv-json', label: 'CSV → JSON' },
]

const outputDelimiters = [
  { value: ',', label: 'Comma' },
  { value: ';', label: 'Semicolon' },
  { value: '\t', label: 'Tab' },
]

const inputDelimiters = [{ value: 'auto', label: 'Auto' }, ...outputDelimiters]

const delimiterName = { ',': 'comma', ';': 'semicolon', '\t': 'tab', '|': 'pipe' }

export function JsonCsvConverter({ defaultDirection = 'json-csv' }) {
  const [direction, setDirection] = useState(defaultDirection)
  const [inputs, setInputs] = useState({ 'json-csv': '', 'csv-json': '' })
  const [outDelimiter, setOutDelimiter] = useState(',')
  const [inDelimiter, setInDelimiter] = useState('auto')
  const [header, setHeader] = useState(true)
  const [flatten, setFlatten] = useState(true)
  const [inferTypes, setInferTypes] = useState(true)
  const [nest, setNest] = useState(false)
  const [fileError, setFileError] = useState('')
  const fileInput = useRef(null)

  const toCsv = direction === 'json-csv'
  const input = inputs[direction]
  const setInput = (value) => setInputs((current) => ({ ...current, [direction]: value }))

  const result = useMemo(() => {
    if (!input.trim()) return null
    return toCsv ? jsonToCsv(input, { delimiter: outDelimiter, header, flatten }) : csvToJson(input, { delimiter: inDelimiter, header, inferTypes, nest })
  }, [input, toCsv, outDelimiter, header, flatten, inDelimiter, inferTypes, nest])

  const ok = Boolean(result?.ok)
  useEffect(() => {
    if (ok) trackToolUse('json-to-csv', 'result')
  }, [ok])

  const preview = useMemo(() => (ok ? previewText(result.output) : null), [ok, result])

  const pickFile = async (event) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    if (picked.size > MAX_FILE) {
      setFileError(`That file is ${formatBytes(picked.size)}. Files up to ${formatBytes(MAX_FILE)} can be converted here.`)
      return
    }
    setFileError('')
    const text = await picked.text()
    const looksJson = /^\s*[[{]/.test(text)
    const next = looksJson ? 'json-csv' : 'csv-json'
    setDirection(next)
    setInputs((current) => ({ ...current, [next]: text }))
  }

  const swap = () => {
    if (!ok) return
    const next = toCsv ? 'csv-json' : 'json-csv'
    setInputs((current) => ({ ...current, [next]: result.output }))
    setDirection(next)
  }

  const download = () => {
    if (!ok) return
    if (toCsv) downloadText(`\uFEFF${result.output}`, 'converted.csv', 'text/csv')
    else downloadText(result.output, 'converted.json', 'application/json')
  }

  return (
    <DevToolShell
      toolbar={
        <>
          <Segmented label="Conversion direction" value={direction} onChange={setDirection} options={directions} />
          {toCsv ? (
            <Segmented label="CSV delimiter" value={outDelimiter} onChange={setOutDelimiter} options={outputDelimiters} />
          ) : (
            <Segmented label="CSV delimiter" value={inDelimiter} onChange={setInDelimiter} options={inputDelimiters} />
          )}
          <Toggle label={toCsv ? 'Header row' : 'First row is header'} checked={header} onChange={setHeader} />
          {toCsv ? (
            <Toggle label="Flatten nested (dot paths)" checked={flatten} onChange={setFlatten} />
          ) : (
            <>
              <Toggle label="Detect numbers & booleans" checked={inferTypes} onChange={setInferTypes} />
              {header && <Toggle label="Nest dot-path columns" checked={nest} onChange={setNest} />}
            </>
          )}
        </>
      }
      left={
        <DevPane
          title={toCsv ? 'JSON input' : 'CSV input'}
          actions={
            <>
              <input ref={fileInput} type="file" accept=".json,.csv,.tsv,.txt,application/json,text/csv" className="sr-only" tabIndex={-1} onChange={pickFile} />
              <button type="button" className={ui.smallButton} onClick={() => fileInput.current?.click()}>
                <ArrowUpTrayIcon aria-hidden="true" className="size-3.5" />
                Open file
              </button>
              <button type="button" className={ui.smallButton} onClick={() => setInput(SAMPLES[direction])}>Sample</button>
              <button type="button" className={ui.smallButton} onClick={() => setInput('')} disabled={!input}>Clear</button>
            </>
          }
        >
          <div className="space-y-3">
            <CodeArea
              label={toCsv ? 'JSON input' : 'CSV input'}
              value={input}
              onChange={setInput}
              placeholder={toCsv ? 'Paste a JSON array of objects, e.g. [{"id": 1, "name": "Ada"}]' : 'Paste CSV, e.g.\nid,name\n1,Ada'}
            />
            <ErrorBox>{fileError}</ErrorBox>
            {result && !result.ok && <ErrorBox>{result.error}</ErrorBox>}
            {ok && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Badge tone="positive">Converted</Badge>
                <span>{result.rowCount.toLocaleString('en-US')} {result.rowCount === 1 ? 'row' : 'rows'}</span>
                {result.columns.length > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{result.columns.length} {result.columns.length === 1 ? 'column' : 'columns'}</span>
                  </>
                )}
                {!toCsv && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Delimiter: {delimiterName[result.delimiter] || result.delimiter}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </DevPane>
      }
      right={
        <DevPane
          title={toCsv ? 'CSV output' : 'JSON output'}
          actions={
            <>
              <button type="button" className={`${ui.smallButton} disabled:opacity-50`} onClick={swap} disabled={!ok}>
                <ArrowsRightLeftIcon aria-hidden="true" className="size-3.5" />
                Use as input
              </button>
              <button type="button" className={`${ui.smallButton} disabled:opacity-50`} onClick={download} disabled={!ok}>
                <ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />
                {toCsv ? '.csv' : '.json'}
              </button>
              <CopyButton text={ok ? result.output : ''} />
            </>
          }
        >
          {!ok ? (
            <div className={`${ui.empty} min-h-[18.5rem]`}>
              {result ? 'Fix the error on the left to see the converted output.' : toCsv ? 'CSV appears here as you paste JSON.' : 'JSON appears here as you paste CSV.'}
            </div>
          ) : (
            <div className="space-y-2">
              <CodeBlock label={toCsv ? 'CSV output' : 'JSON output'}>{preview.text}</CodeBlock>
              {preview.truncated && <p className={ui.hint}>Showing the first 200,000 characters. Copy or download for the full output.</p>}
            </div>
          )}
        </DevPane>
      }
      below={
        ok && (
          <ToolCta
            title="Exporting data to reproduce a customer bug?"
            copy="Screendesk bug reports attach console logs, network requests, and device details automatically, so you see the failing request instead of a spreadsheet of guesses."
          />
        )
      }
    />
  )
}
