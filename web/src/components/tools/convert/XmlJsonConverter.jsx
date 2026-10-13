import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Segmented, Toggle } from '@/components/tools/dev/DevToolShell'
import { jsonToXml, xmlToJson } from './xml'
import { downloadText, formatBytes, previewText } from './textDownload'

const MAX_FILE = 25 * 1024 * 1024

const SAMPLES = {
  'xml-json': `<?xml version="1.0" encoding="UTF-8"?>
<order id="SO-7781" currency="EUR">
  <customer type="business">
    <name>Northwind Traders</name>
    <email>ops@northwind.example</email>
  </customer>
  <items>
    <item sku="KB-01" qty="2">Mechanical keyboard</item>
    <item sku="MS-04" qty="1">Wireless mouse</item>
  </items>
  <total>189.90</total>
  <notes><![CDATA[Deliver after 2pm & ring twice]]></notes>
</order>`,
  'json-xml': JSON.stringify(
    {
      ticket: {
        '@id': 'T-1042',
        '@priority': 'high',
        subject: 'Checkout fails on Safari',
        requester: { name: 'Ada Lovelace', email: 'ada@example.com' },
        tags: ['billing', 'safari'],
        attachments: null,
      },
    },
    null,
    2
  ),
}

const directions = [
  { value: 'xml-json', label: 'XML → JSON' },
  { value: 'json-xml', label: 'JSON → XML' },
]

const indents = [
  { value: 2, label: '2 spaces' },
  { value: 4, label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
]

export function XmlJsonConverter({ defaultDirection = 'xml-json' }) {
  const [direction, setDirection] = useState(defaultDirection)
  const [inputs, setInputs] = useState({ 'xml-json': '', 'json-xml': '' })
  const [indent, setIndent] = useState(2)
  const [inferTypes, setInferTypes] = useState(false)
  const [rootName, setRootName] = useState('root')
  const [declaration, setDeclaration] = useState(true)
  const [fileError, setFileError] = useState('')
  const fileInput = useRef(null)

  const toJson = direction === 'xml-json'
  const input = inputs[direction]
  const setInput = (value) => setInputs((current) => ({ ...current, [direction]: value }))

  // Input starts empty, so DOMParser is only reached in the browser after the user types or loads a file.
  const result = useMemo(() => {
    if (!input.trim()) return null
    return toJson ? xmlToJson(input, { inferTypes, indent }) : jsonToXml(input, { rootName: rootName.trim() || 'root', indent, declaration })
  }, [input, toJson, inferTypes, indent, rootName, declaration])

  const ok = Boolean(result?.ok)
  useEffect(() => {
    if (ok) trackToolUse('xml-to-json', 'result')
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
    const next = /^\s*</.test(text.replace(/^\uFEFF/, '')) ? 'xml-json' : 'json-xml'
    setDirection(next)
    setInputs((current) => ({ ...current, [next]: text }))
  }

  const swap = () => {
    if (!ok) return
    const next = toJson ? 'json-xml' : 'xml-json'
    setInputs((current) => ({ ...current, [next]: result.output }))
    setDirection(next)
  }

  const download = () => {
    if (!ok) return
    if (toJson) downloadText(result.output, 'converted.json', 'application/json')
    else downloadText(result.output, 'converted.xml', 'application/xml')
  }

  return (
    <DevToolShell
      toolbar={
        <>
          <Segmented label="Conversion direction" value={direction} onChange={setDirection} options={directions} />
          <Segmented label="Indentation" value={indent} onChange={setIndent} options={indents} />
          {toJson ? (
            <Toggle label="Convert numbers & booleans" checked={inferTypes} onChange={setInferTypes} />
          ) : (
            <>
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700">
                Root element
                <input type="text" value={rootName} onChange={(event) => setRootName(event.target.value)} spellCheck={false} className={`${ui.input} h-8 w-32 font-mono text-[13px]`} />
              </label>
              <Toggle label="XML declaration" checked={declaration} onChange={setDeclaration} />
            </>
          )}
        </>
      }
      left={
        <DevPane
          title={toJson ? 'XML input' : 'JSON input'}
          actions={
            <>
              <input ref={fileInput} type="file" accept=".xml,.json,.txt,application/xml,text/xml,application/json" className="sr-only" tabIndex={-1} onChange={pickFile} />
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
              label={toJson ? 'XML input' : 'JSON input'}
              value={input}
              onChange={setInput}
              placeholder={toJson ? 'Paste XML, e.g. <user id="1"><name>Ada</name></user>' : 'Paste JSON, e.g. {"user": {"@id": 1, "name": "Ada"}}'}
            />
            <ErrorBox>{fileError}</ErrorBox>
            {result && !result.ok && <ErrorBox hint={toJson ? 'Check for unclosed tags, a missing root element, or an unescaped & or <.' : undefined}>{result.error}</ErrorBox>}
            {ok && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <Badge tone="positive">{toJson ? 'Well-formed XML' : 'Valid JSON'}</Badge>
              </div>
            )}
          </div>
        </DevPane>
      }
      right={
        <DevPane
          title={toJson ? 'JSON output' : 'XML output'}
          actions={
            <>
              <button type="button" className={`${ui.smallButton} disabled:opacity-50`} onClick={swap} disabled={!ok}>
                <ArrowsRightLeftIcon aria-hidden="true" className="size-3.5" />
                Use as input
              </button>
              <button type="button" className={`${ui.smallButton} disabled:opacity-50`} onClick={download} disabled={!ok}>
                <ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />
                {toJson ? '.json' : '.xml'}
              </button>
              <CopyButton text={ok ? result.output : ''} />
            </>
          }
        >
          {!ok ? (
            <div className={`${ui.empty} min-h-[18.5rem]`}>
              {result ? 'Fix the error on the left to see the converted output.' : toJson ? 'JSON appears here as you paste XML.' : 'XML appears here as you paste JSON.'}
            </div>
          ) : (
            <div className="space-y-2">
              <CodeBlock label={toJson ? 'JSON output' : 'XML output'}>{preview.text}</CodeBlock>
              {preview.truncated && <p className={ui.hint}>Showing the first 200,000 characters. Copy or download for the full output.</p>}
            </div>
          )}
        </DevPane>
      }
      below={
        ok && (
          <ToolCta
            title="Debugging an XML or SOAP response from a bug report?"
            copy="Screendesk captures the network requests and responses behind a bug, along with console logs and device details, so you get the real payload without asking."
          />
        )
      }
    />
  )
}
