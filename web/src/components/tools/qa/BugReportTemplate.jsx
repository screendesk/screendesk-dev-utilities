import { useEffect, useState } from 'react'
import { ArrowDownTrayIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ui, CopyButton } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { downloadText } from './qaUtils'

const SLUG = 'bug-report-template'

const formats = [
  { id: 'markdown', name: 'Markdown', ext: 'md' },
  { id: 'jira', name: 'Jira', ext: 'txt' },
  { id: 'github', name: 'GitHub', ext: 'md' },
  { id: 'text', name: 'Plain text', ext: 'txt' },
]

const attachmentOptions = ['Screen recording', 'Screenshot', 'Console logs', 'Network requests (HAR)', 'Test account or data used', 'Link to failing test case']

const severities = ['Blocker', 'Critical', 'Major', 'Minor', 'Trivial']
const frequencies = ['Every time', 'Intermittent', 'Happened once']

const example = {
  title: 'Checkout “Pay now” button does nothing after applying a discount code',
  url: 'https://example.com/checkout',
  browser: 'Chrome 130',
  os: 'macOS 15',
  viewport: '1440 × 900',
  appVersion: 'v2.4.0 (staging)',
  steps: ['Add any product to the cart', 'Go to checkout and apply discount code SAVE10', 'Enter test card 4242 4242 4242 4242 with any future date and CVC', 'Click “Pay now”'],
  expected: 'The payment is processed and the order confirmation page loads.',
  actual: 'Nothing happens. The button stays enabled and no request is sent.',
  severity: 'Critical',
  frequency: 'Every time',
  attachments: ['Screen recording', 'Console logs'],
  console: 'Uncaught TypeError: Cannot read properties of undefined (reading \'total\')\n    at applyDiscount (checkout.js:214:31)',
  notes: 'Works without a discount code.',
}

const blank = { title: '', url: '', browser: '', os: '', viewport: '', appVersion: '', steps: [''], expected: '', actual: '', severity: 'Major', frequency: 'Every time', attachments: [], console: '', notes: '' }

function detectEnvironment() {
  const ua = navigator.userAgent
  const browser = (() => {
    const match = (re) => ua.match(re)?.[1]
    if (/Edg\//.test(ua)) return `Edge ${match(/Edg\/(\d+)/) || ''}`.trim()
    if (/OPR\//.test(ua)) return `Opera ${match(/OPR\/(\d+)/) || ''}`.trim()
    if (/Firefox\//.test(ua)) return `Firefox ${match(/Firefox\/(\d+)/) || ''}`.trim()
    if (/CriOS\//.test(ua)) return `Chrome iOS ${match(/CriOS\/(\d+)/) || ''}`.trim()
    if (/Chrome\//.test(ua)) return `Chrome ${match(/Chrome\/(\d+)/) || ''}`.trim()
    if (/Safari\//.test(ua)) return `Safari ${match(/Version\/(\d+(?:\.\d+)?)/) || ''}`.trim()
    return 'Unknown browser'
  })()
  const os = (() => {
    if (/iPhone|iPad|iPod/.test(ua)) return `iOS ${(ua.match(/OS (\d+[_.]\d+)/)?.[1] || '').replace('_', '.')}`.trim()
    if (/Android/.test(ua)) return `Android ${ua.match(/Android (\d+(?:\.\d+)?)/)?.[1] || ''}`.trim()
    if (/Windows NT/.test(ua)) return 'Windows'
    if (/Mac OS X/.test(ua)) return 'macOS'
    if (/CrOS/.test(ua)) return 'ChromeOS'
    if (/Linux/.test(ua)) return 'Linux'
    return 'Unknown OS'
  })()
  const ratio = window.devicePixelRatio && window.devicePixelRatio !== 1 ? ` @${window.devicePixelRatio}x` : ''
  return { browser, os, viewport: `${window.innerWidth} × ${window.innerHeight}${ratio}` }
}

function render(data, format) {
  const steps = data.steps.map((step) => step.trim()).filter(Boolean)
  const env = [['URL', data.url], ['Browser', data.browser], ['OS', data.os], ['Viewport', data.viewport], ['App version', data.appVersion]].filter(([, value]) => value.trim())
  const title = data.title.trim() || 'Bug title'
  const consoleText = data.console.trim()
  const notes = data.notes.trim()
  const or = (value) => value.trim() || '-'

  if (format === 'jira') {
    return [
      `h2. ${title}`,
      '',
      `*Severity:* ${data.severity}    *Frequency:* ${data.frequency}`,
      '',
      'h3. Environment',
      ...(env.length ? env.map(([key, value]) => `||${key}|${value}|`) : ['-']),
      '',
      'h3. Steps to reproduce',
      ...(steps.length ? steps.map((step) => `# ${step}`) : ['-']),
      '',
      'h3. Expected result', or(data.expected),
      '',
      'h3. Actual result', or(data.actual),
      ...(consoleText ? ['', 'h3. Console errors', '{noformat}', consoleText, '{noformat}'] : []),
      '',
      'h3. Attachments',
      ...attachmentOptions.map((item) => `* ${data.attachments.includes(item) ? '(/)' : '(x)'} ${item}`),
      ...(notes ? ['', 'h3. Notes', notes] : []),
    ].join('\n')
  }

  if (format === 'text') {
    return [
      title,
      '',
      `Severity: ${data.severity}`,
      `Frequency: ${data.frequency}`,
      '',
      'ENVIRONMENT',
      ...(env.length ? env.map(([key, value]) => `${key}: ${value}`) : ['-']),
      '',
      'STEPS TO REPRODUCE',
      ...(steps.length ? steps.map((step, index) => `${index + 1}. ${step}`) : ['-']),
      '',
      'EXPECTED RESULT', or(data.expected),
      '',
      'ACTUAL RESULT', or(data.actual),
      ...(consoleText ? ['', 'CONSOLE ERRORS', consoleText] : []),
      '',
      'ATTACHMENTS',
      ...attachmentOptions.map((item) => `[${data.attachments.includes(item) ? 'x' : ' '}] ${item}`),
      ...(notes ? ['', 'NOTES', notes] : []),
    ].join('\n')
  }

  const github = format === 'github'
  const h = github ? '###' : '##'
  return [
    github ? `**${title}**` : `# ${title}`,
    '',
    `**Severity:** ${data.severity}  `,
    `**Frequency:** ${data.frequency}`,
    '',
    `${h} Environment`,
    ...(env.length
      ? github
        ? ['| | |', '|---|---|', ...env.map(([key, value]) => `| ${key} | ${value.replace(/\|/g, '\\|')} |`)]
        : env.map(([key, value]) => `- **${key}:** ${value}`)
      : ['-']),
    '',
    `${h} Steps to reproduce`,
    ...(steps.length ? steps.map((step, index) => `${index + 1}. ${step}`) : ['-']),
    '',
    `${h} Expected result`, or(data.expected),
    '',
    `${h} Actual result`, or(data.actual),
    ...(consoleText ? ['', `${h} Console errors`, '```text', consoleText, '```'] : []),
    '',
    `${h} Attachments`,
    ...attachmentOptions.map((item) => `- [${data.attachments.includes(item) ? 'x' : ' '}] ${item}`),
    ...(notes ? ['', `${h} Notes`, notes] : []),
  ].join('\n')
}

export function BugReportTemplate() {
  const [data, setData] = useState(example)
  const [format, setFormat] = useState('markdown')
  const [touched, setTouched] = useState(false)

  const touch = () => {
    setTouched(true)
    trackToolUse(SLUG, 'result')
  }
  const update = (patch) => {
    setData((current) => ({ ...current, ...patch }))
    touch()
  }
  const setField = (key) => (e) => update({ [key]: e.target.value })
  const fillEnvironment = () => update(detectEnvironment())

  // Read the visitor's browser details after mount (never during render) so server and client markup match.
  useEffect(() => {
    setData((current) => ({ ...current, ...detectEnvironment() }))
  }, [])

  const toggleAttachment = (item) => update({ attachments: data.attachments.includes(item) ? data.attachments.filter((value) => value !== item) : [...data.attachments, item] })
  const setStep = (index, value) => update({ steps: data.steps.map((step, i) => (i === index ? value : step)) })

  const output = render(data, format)
  const formatDef = formats.find((item) => item.id === format)
  const download = () => {
    downloadText(`bug-report.${formatDef.ext}`, output, formatDef.ext === 'md' ? 'text/markdown' : 'text/plain')
    touch()
    trackToolUse(SLUG, 'download')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => update({ ...example, ...detectEnvironment(), steps: [...example.steps], attachments: [...example.attachments] })} className={ui.smallButton}>Load example</button>
        <button type="button" onClick={() => update({ ...blank, ...detectEnvironment(), steps: [''], attachments: [] })} className={ui.smallButton}>Clear</button>
      </div>
      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Bug details</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <div>
              <label htmlFor="br-title" className={ui.label}>Title</label>
              <input id="br-title" value={data.title} onChange={setField('title')} className={ui.input} placeholder="Where, what, and when it happens" />
              <p className={ui.hint}>Be specific: the page or feature, what goes wrong, and the trigger.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="br-severity" className={ui.label}>Severity</label>
                <select id="br-severity" value={data.severity} onChange={setField('severity')} className={ui.select}>
                  {severities.map((value) => <option key={value}>{value}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="br-frequency" className={ui.label}>Frequency</label>
                <select id="br-frequency" value={data.frequency} onChange={setField('frequency')} className={ui.select}>
                  {frequencies.map((value) => <option key={value}>{value}</option>)}
                </select>
              </div>
            </div>
            <fieldset className="space-y-3">
              <div className="flex items-center justify-between">
                <legend className="text-sm font-medium text-zinc-900">Environment</legend>
                <button type="button" onClick={fillEnvironment} className={ui.smallButton}>Detect my browser</button>
              </div>
              <input aria-label="Page URL" value={data.url} onChange={setField('url')} className={ui.input} placeholder="Page URL" />
              <div className="grid grid-cols-2 gap-3">
                <input aria-label="Browser" value={data.browser} onChange={setField('browser')} className={ui.input} placeholder="Browser and version" />
                <input aria-label="Operating system" value={data.os} onChange={setField('os')} className={ui.input} placeholder="Operating system" />
                <input aria-label="Viewport" value={data.viewport} onChange={setField('viewport')} className={ui.input} placeholder="Viewport" />
                <input aria-label="App version" value={data.appVersion} onChange={setField('appVersion')} className={ui.input} placeholder="App version / build" />
              </div>
              <p className={ui.hint}>Detected from this browser; edit if you reproduced the bug somewhere else. Nothing leaves your device.</p>
            </fieldset>
            <fieldset className="space-y-2">
              <legend className={ui.label}>Steps to reproduce</legend>
              {data.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-right text-xs text-zinc-400 tabular-nums">{index + 1}.</span>
                  <input aria-label={`Step ${index + 1}`} value={step} onChange={(e) => setStep(index, e.target.value)} className={ui.input} placeholder="Action" />
                  <button type="button" onClick={() => update({ steps: data.steps.filter((_, i) => i !== index) })} disabled={data.steps.length === 1} aria-label={`Remove step ${index + 1}`} className={`${ui.smallButton} disabled:opacity-40`}><TrashIcon aria-hidden="true" className="size-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => update({ steps: [...data.steps, ''] })} className={ui.smallButton}><PlusIcon aria-hidden="true" className="size-3.5" />Add step</button>
            </fieldset>
            <div>
              <label htmlFor="br-expected" className={ui.label}>Expected result</label>
              <textarea id="br-expected" rows={2} value={data.expected} onChange={setField('expected')} className={ui.textarea} />
            </div>
            <div>
              <label htmlFor="br-actual" className={ui.label}>Actual result</label>
              <textarea id="br-actual" rows={2} value={data.actual} onChange={setField('actual')} className={ui.textarea} />
            </div>
            <div>
              <label htmlFor="br-console" className={ui.label}>Console errors</label>
              <textarea id="br-console" rows={3} value={data.console} onChange={setField('console')} className={ui.code} placeholder="Paste errors from the browser console" />
            </div>
            <fieldset>
              <legend className={ui.label}>Attachments</legend>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {attachmentOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm text-zinc-700">
                    <input type="checkbox" checked={data.attachments.includes(item)} onChange={() => toggleAttachment(item)} className="size-4 accent-rose-500" />
                    {item}
                  </label>
                ))}
              </div>
            </fieldset>
            <div>
              <label htmlFor="br-notes" className={ui.label}>Notes</label>
              <textarea id="br-notes" rows={2} value={data.notes} onChange={setField('notes')} className={ui.textarea} placeholder="Workarounds, related tickets, when it started" />
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <div className={ui.card}>
            <div className={`${ui.cardHeader} flex-wrap`}>
              <div className={ui.segmented} role="group" aria-label="Output format">
                {formats.map((item) => (
                  <button key={item.id} type="button" aria-pressed={format === item.id} onClick={() => setFormat(item.id)} className={ui.segment(format === item.id)}>{item.name}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <span onClickCapture={() => { touch(); trackToolUse(SLUG, 'copy') }}><CopyButton text={output} /></span>
                <button type="button" onClick={download} className={ui.smallButton}><ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />Download</button>
              </div>
            </div>
            <div className={ui.cardBody}>
              <pre className={`${ui.codeOutput} max-h-[36rem] whitespace-pre-wrap`}>{output}</pre>
              {format === 'github' && <p className={ui.hint}>Put the first line in the issue title field and paste the rest as the description.</p>}
              {format === 'jira' && <p className={ui.hint}>Jira wiki markup renders in Jira Data Center and in fields that use the wiki renderer. The Jira Cloud editor converts some Markdown on paste, so try the Markdown version there.</p>}
            </div>
          </div>
          {touched && (
            <ToolCta title="Skip the template: record the bug instead" copy="Screendesk records the screen with console logs, network requests, and device details, and files the report in Jira, Linear, or Zendesk." />
          )}
        </div>
      </div>
    </div>
  )
}
