import { useState } from 'react'
import { ArrowDownTrayIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { ui, CopyButton } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { downloadText, toCsv } from './qaUtils'

const SLUG = 'test-case-template'

const modes = [
  { id: 'case', name: 'Test case' },
  { id: 'plan', name: 'Test plan' },
  { id: 'story', name: 'User story' },
]

const examples = {
  case: {
    id: 'TC-101',
    title: 'Log in with valid email and password',
    section: 'Authentication',
    priority: 'High',
    type: 'Functional',
    preconditions: 'A verified user account exists\nThe user is logged out',
    testData: 'Email: qa.user@example.com\nPassword: (from the test vault)',
    steps: [
      { action: 'Open the login page', expected: 'The login form is shown with email and password fields' },
      { action: 'Enter a valid email and password', expected: 'Both fields accept the input; the password is masked' },
      { action: 'Click “Log in”', expected: 'The user lands on the dashboard within 3 seconds' },
    ],
    expected: 'The user is logged in and sees their dashboard. A session cookie is set.',
    postconditions: 'Log out to reset the session',
  },
  plan: {
    project: 'Checkout redesign',
    release: 'v2.4',
    objective: 'Verify the redesigned checkout handles payments, errors, and saved cards without regressions before the v2.4 release.',
    scopeIn: 'Cart and checkout pages\nCard payments and 3D Secure\nSaved payment methods\nOrder confirmation email',
    scopeOut: 'Admin refund tools\nLegacy mobile app',
    approach: 'Functional testing of new flows\nRegression suite on existing checkout paths\nCross-browser checks on the latest Chrome, Safari, Firefox, and Edge\nExploratory sessions on error handling',
    environments: 'Staging with payment provider test mode\nDesktop: macOS and Windows\nMobile: iOS Safari and Android Chrome',
    entry: 'Feature complete on staging\nUnit tests passing\nTest data and test cards ready',
    exit: 'All high-priority test cases passed\nNo open blocker or critical bugs\nRegression suite pass rate agreed with the team',
    roles: 'QA lead: owns the plan and sign-off\nQA engineers: execute and report bugs\nDevelopers: fix and verify bugs',
    schedule: 'Test design: week 1\nExecution: week 2\nRegression and sign-off: week 3',
    risks: 'Payment provider sandbox downtime: retry and log affected runs\nLate design changes: re-prioritize test cases daily',
    deliverables: 'Test cases\nBug reports with recordings\nTest summary report',
  },
  story: {
    title: 'Save a card at checkout',
    role: 'returning customer',
    goal: 'save my card during checkout',
    benefit: 'I can pay faster next time',
    scenarios: [
      { name: 'Save card on successful payment', given: 'I am logged in and on the payment step', when: 'I tick “Save this card” and the payment succeeds', then: 'the card appears in my saved payment methods' },
      { name: 'Do not save card on failed payment', given: 'I am logged in and on the payment step', when: 'I tick “Save this card” and the payment is declined', then: 'the card is not saved and I see the decline reason' },
    ],
    notes: 'Card storage is handled by the payment provider; we store only a token.',
  },
}

const blanks = {
  case: { id: '', title: '', section: '', priority: 'Medium', type: 'Functional', preconditions: '', testData: '', steps: [{ action: '', expected: '' }], expected: '', postconditions: '' },
  plan: { project: '', release: '', objective: '', scopeIn: '', scopeOut: '', approach: '', environments: '', entry: '', exit: '', roles: '', schedule: '', risks: '', deliverables: '' },
  story: { title: '', role: '', goal: '', benefit: '', scenarios: [{ name: '', given: '', when: '', then: '' }], notes: '' },
}

const planSections = [
  ['objective', 'Objective', false],
  ['scopeIn', 'In scope', true],
  ['scopeOut', 'Out of scope', true],
  ['approach', 'Test approach', true],
  ['environments', 'Test environments', true],
  ['entry', 'Entry criteria', true],
  ['exit', 'Exit criteria', true],
  ['roles', 'Roles and responsibilities', true],
  ['schedule', 'Schedule', true],
  ['risks', 'Risks and mitigation', true],
  ['deliverables', 'Deliverables', true],
]

const lines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean)
const or = (value, fallback) => value.trim() || fallback

function render(mode, data, format) {
  const md = format === 'markdown'
  const heading = (text, level = 2) => (md ? `${'#'.repeat(level)} ${text}` : text.toUpperCase())
  const bullets = (text, fallback = '-') => {
    const items = lines(text)
    return items.length ? items.map((item) => `- ${item}`).join('\n') : fallback
  }

  if (mode === 'case') {
    const steps = data.steps.filter((step) => step.action.trim() || step.expected.trim())
    if (format === 'csv') {
      return toCsv(
        ['ID', 'Title', 'Section', 'Priority', 'Type', 'Preconditions', 'Test Data', 'Steps', 'Expected Result', 'Postconditions'],
        [[data.id, data.title, data.section, data.priority, data.type, lines(data.preconditions).join('\n'), lines(data.testData).join('\n'),
          steps.map((step, index) => `${index + 1}. ${step.action}${step.expected ? ` -> ${step.expected}` : ''}`).join('\n'), data.expected, data.postconditions]],
      )
    }
    const stepText = steps.length
      ? md
        ? ['| # | Step | Expected result |', '|---|------|-----------------|', ...steps.map((step, index) => `| ${index + 1} | ${step.action.replace(/\|/g, '\\|')} | ${step.expected.replace(/\|/g, '\\|')} |`)].join('\n')
        : steps.map((step, index) => `${index + 1}. ${step.action}${step.expected ? `\n   Expected: ${step.expected}` : ''}`).join('\n')
      : '-'
    const fields = md
      ? [`**ID:** ${or(data.id, '-')}  `, `**Section:** ${or(data.section, '-')}  `, `**Priority:** ${data.priority}  `, `**Type:** ${data.type}`]
      : [`ID: ${or(data.id, '-')}`, `Section: ${or(data.section, '-')}`, `Priority: ${data.priority}`, `Type: ${data.type}`]
    return [
      md ? `# ${or(data.title, 'Test case title')}` : or(data.title, 'Test case title'),
      '',
      ...fields,
      '',
      heading('Preconditions'), bullets(data.preconditions), '',
      heading('Test data'), bullets(data.testData), '',
      heading('Steps'), stepText, '',
      heading('Expected result'), or(data.expected, '-'), '',
      heading('Postconditions'), bullets(data.postconditions),
    ].join('\n')
  }

  if (mode === 'plan') {
    const title = `Test plan: ${or(data.project, 'Project')}${data.release.trim() ? ` (${data.release.trim()})` : ''}`
    return [
      md ? `# ${title}` : title,
      ...planSections.flatMap(([key, label, list]) => ['', heading(label), list ? bullets(data[key]) : or(data[key], '-')]),
    ].join('\n')
  }

  const scenarios = data.scenarios.filter((item) => item.given.trim() || item.when.trim() || item.then.trim() || item.name.trim())
  const statement = `As a ${or(data.role, '[role]')}, I want to ${or(data.goal, '[goal]')}, so that ${or(data.benefit, '[benefit]')}.`
  if (format === 'csv') {
    return toCsv(['Story', 'User story', 'Scenario', 'Given', 'When', 'Then'], (scenarios.length ? scenarios : [{ name: '', given: '', when: '', then: '' }]).map((item) => [data.title, statement, item.name, item.given, item.when, item.then]))
  }
  return [
    md ? `# ${or(data.title, 'User story')}` : or(data.title, 'User story'),
    '',
    md ? `**${statement}**` : statement,
    '',
    heading('Acceptance criteria'),
    ...(scenarios.length ? scenarios.flatMap((item, index) => [
      '',
      md ? `### Scenario ${index + 1}: ${or(item.name, 'Untitled')}` : `Scenario ${index + 1}: ${or(item.name, 'Untitled')}`,
      `${md ? '**Given** ' : 'Given '}${or(item.given, '[context]')}${md ? '  ' : ''}`,
      `${md ? '**When** ' : 'When '}${or(item.when, '[action]')}${md ? '  ' : ''}`,
      `${md ? '**Then** ' : 'Then '}${or(item.then, '[outcome]')}`,
    ]) : ['', '-']),
    ...(data.notes.trim() ? ['', heading('Notes'), data.notes.trim()] : []),
  ].join('\n')
}

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className={ui.label}>{label}</label>
      {children}
      {hint && <p className={ui.hint}>{hint}</p>}
    </div>
  )
}

export function TestCaseTemplate() {
  const [mode, setMode] = useState('case')
  const [data, setData] = useState(examples)
  const [format, setFormat] = useState('markdown')
  const [touched, setTouched] = useState(false)

  const current = data[mode]
  const touch = () => {
    setTouched(true)
    trackToolUse(SLUG, 'result')
  }
  const update = (patch) => {
    setData((all) => ({ ...all, [mode]: { ...all[mode], ...patch } }))
    touch()
  }
  const setField = (key) => (e) => update({ [key]: e.target.value })
  const updateItem = (listKey, index, key, value) => update({ [listKey]: current[listKey].map((item, i) => (i === index ? { ...item, [key]: value } : item)) })
  const removeItem = (listKey, index) => update({ [listKey]: current[listKey].filter((_, i) => i !== index) })
  const addItem = (listKey) => update({ [listKey]: [...current[listKey], { ...blanks[mode][listKey][0] }] })

  const formats = mode === 'plan' ? ['markdown', 'text'] : ['markdown', 'text', 'csv']
  const activeFormat = formats.includes(format) ? format : 'markdown'
  const output = render(mode, current, activeFormat)
  const ext = { markdown: 'md', text: 'txt', csv: 'csv' }[activeFormat]
  const fileBase = { case: 'test-case', plan: 'test-plan', story: 'user-story' }[mode]

  const download = () => {
    downloadText(`${fileBase}.${ext}`, output, activeFormat === 'csv' ? 'text/csv' : activeFormat === 'markdown' ? 'text/markdown' : 'text/plain')
    touch()
    trackToolUse(SLUG, 'download')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className={ui.segmented} role="group" aria-label="Template type">
          {modes.map((item) => (
            <button key={item.id} type="button" aria-pressed={mode === item.id} onClick={() => setMode(item.id)} className={ui.segment(mode === item.id)}>{item.name}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => update(structuredClone(examples[mode]))} className={ui.smallButton}>Load example</button>
          <button type="button" onClick={() => update(structuredClone(blanks[mode]))} className={ui.smallButton}>Clear</button>
        </div>
      </div>

      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>{modes.find((item) => item.id === mode).name} details</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            {mode === 'case' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <Field id="tc-id" label="ID"><input id="tc-id" value={current.id} onChange={setField('id')} className={ui.input} placeholder="TC-001" /></Field>
                  <div className="col-span-2"><Field id="tc-section" label="Section / feature"><input id="tc-section" value={current.section} onChange={setField('section')} className={ui.input} placeholder="Checkout" /></Field></div>
                </div>
                <Field id="tc-title" label="Title"><input id="tc-title" value={current.title} onChange={setField('title')} className={ui.input} placeholder="Verify that…" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="tc-priority" label="Priority">
                    <select id="tc-priority" value={current.priority} onChange={setField('priority')} className={ui.select}>
                      {['Critical', 'High', 'Medium', 'Low'].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </Field>
                  <Field id="tc-type" label="Type">
                    <select id="tc-type" value={current.type} onChange={setField('type')} className={ui.select}>
                      {['Functional', 'Regression', 'Smoke', 'Integration', 'UI', 'Accessibility', 'Performance', 'Security'].map((value) => <option key={value}>{value}</option>)}
                    </select>
                  </Field>
                </div>
                <Field id="tc-pre" label="Preconditions" hint="One per line."><textarea id="tc-pre" rows={2} value={current.preconditions} onChange={setField('preconditions')} className={ui.textarea} /></Field>
                <Field id="tc-data" label="Test data" hint="One per line."><textarea id="tc-data" rows={2} value={current.testData} onChange={setField('testData')} className={ui.textarea} /></Field>
                <fieldset className="space-y-3">
                  <legend className={ui.label}>Steps</legend>
                  {current.steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <span className="mt-2.5 w-5 shrink-0 text-right text-xs text-zinc-400 tabular-nums">{index + 1}.</span>
                      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                        <input aria-label={`Step ${index + 1} action`} value={step.action} onChange={(e) => updateItem('steps', index, 'action', e.target.value)} className={ui.input} placeholder="Action" />
                        <input aria-label={`Step ${index + 1} expected result`} value={step.expected} onChange={(e) => updateItem('steps', index, 'expected', e.target.value)} className={ui.input} placeholder="Expected result" />
                      </div>
                      <button type="button" onClick={() => removeItem('steps', index)} disabled={current.steps.length === 1} aria-label={`Remove step ${index + 1}`} className={`${ui.smallButton} mt-1 disabled:opacity-40`}><TrashIcon aria-hidden="true" className="size-3.5" /></button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addItem('steps')} className={ui.smallButton}><PlusIcon aria-hidden="true" className="size-3.5" />Add step</button>
                </fieldset>
                <Field id="tc-expected" label="Overall expected result"><textarea id="tc-expected" rows={2} value={current.expected} onChange={setField('expected')} className={ui.textarea} /></Field>
                <Field id="tc-post" label="Postconditions" hint="One per line."><textarea id="tc-post" rows={2} value={current.postconditions} onChange={setField('postconditions')} className={ui.textarea} /></Field>
              </>
            )}

            {mode === 'plan' && (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2"><Field id="tp-project" label="Project / feature"><input id="tp-project" value={current.project} onChange={setField('project')} className={ui.input} /></Field></div>
                  <Field id="tp-release" label="Release"><input id="tp-release" value={current.release} onChange={setField('release')} className={ui.input} placeholder="v1.0" /></Field>
                </div>
                {planSections.map(([key, label, list]) => (
                  <Field key={key} id={`tp-${key}`} label={label} hint={list ? 'One item per line.' : undefined}>
                    <textarea id={`tp-${key}`} rows={key === 'objective' ? 3 : 2} value={current[key]} onChange={setField(key)} className={ui.textarea} />
                  </Field>
                ))}
              </>
            )}

            {mode === 'story' && (
              <>
                <Field id="us-title" label="Story title"><input id="us-title" value={current.title} onChange={setField('title')} className={ui.input} /></Field>
                <Field id="us-role" label="As a…"><input id="us-role" value={current.role} onChange={setField('role')} className={ui.input} placeholder="role or persona" /></Field>
                <Field id="us-goal" label="I want to…"><input id="us-goal" value={current.goal} onChange={setField('goal')} className={ui.input} placeholder="goal" /></Field>
                <Field id="us-benefit" label="So that…"><input id="us-benefit" value={current.benefit} onChange={setField('benefit')} className={ui.input} placeholder="benefit" /></Field>
                <fieldset className="space-y-3">
                  <legend className={ui.label}>Acceptance criteria (Given / When / Then)</legend>
                  {current.scenarios.map((item, index) => (
                    <div key={index} className="space-y-2 rounded-md border border-zinc-200 p-3">
                      <div className="flex items-center gap-2">
                        <input aria-label={`Scenario ${index + 1} name`} value={item.name} onChange={(e) => updateItem('scenarios', index, 'name', e.target.value)} className={ui.input} placeholder={`Scenario ${index + 1} name`} />
                        <button type="button" onClick={() => removeItem('scenarios', index)} disabled={current.scenarios.length === 1} aria-label={`Remove scenario ${index + 1}`} className={`${ui.smallButton} disabled:opacity-40`}><TrashIcon aria-hidden="true" className="size-3.5" /></button>
                      </div>
                      {['given', 'when', 'then'].map((key) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="w-12 shrink-0 text-xs font-medium text-zinc-500 capitalize">{key}</span>
                          <input aria-label={`Scenario ${index + 1} ${key}`} value={item[key]} onChange={(e) => updateItem('scenarios', index, key, e.target.value)} className={ui.input} />
                        </div>
                      ))}
                    </div>
                  ))}
                  <button type="button" onClick={() => addItem('scenarios')} className={ui.smallButton}><PlusIcon aria-hidden="true" className="size-3.5" />Add scenario</button>
                </fieldset>
                <Field id="us-notes" label="Notes"><textarea id="us-notes" rows={2} value={current.notes} onChange={setField('notes')} className={ui.textarea} /></Field>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <div className={ui.card}>
            <div className={`${ui.cardHeader} flex-wrap`}>
              <div className={ui.segmented} role="group" aria-label="Output format">
                {formats.map((item) => (
                  <button key={item} type="button" aria-pressed={activeFormat === item} onClick={() => setFormat(item)} className={ui.segment(activeFormat === item)}>{{ markdown: 'Markdown', text: 'Plain text', csv: 'CSV' }[item]}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <span onClickCapture={() => { touch(); trackToolUse(SLUG, 'copy') }}><CopyButton text={output} /></span>
                <button type="button" onClick={download} className={ui.smallButton}><ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />Download</button>
              </div>
            </div>
            <div className={ui.cardBody}>
              <pre className={`${ui.codeOutput} max-h-[36rem] whitespace-pre-wrap`}>{output}</pre>
              {activeFormat === 'csv' && <p className={ui.hint}>{mode === 'case' ? 'One row per test case with steps in a single cell; map the columns in your test management tool’s CSV import.' : 'One row per acceptance criteria scenario.'}</p>}
            </div>
          </div>
          {touched && (
            <ToolCta title="When a test fails, send a bug report developers can replay" copy="Screendesk records the screen with console logs, network requests, and device details, and files it in Jira or Linear." />
          )}
        </div>
      </div>
    </div>
  )
}
