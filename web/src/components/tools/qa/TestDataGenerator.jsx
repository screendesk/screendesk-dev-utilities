import { useState } from 'react'
import { ArrowDownTrayIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import { ui, Badge, CopyButton } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { downloadText, seededRandom, sqlValue, toCsv } from './qaUtils'

const SLUG = 'test-data-generator'
const PREVIEW_ROWS = 100

const firstNames = ['James', 'Mary', 'Olivia', 'Liam', 'Emma', 'Noah', 'Ava', 'Sophia', 'Lucas', 'Mia', 'Ethan', 'Amelia', 'Mateo', 'Harper', 'Elijah', 'Aria', 'Daniel', 'Chloe', 'Henry', 'Layla', 'Samuel', 'Zoe', 'Leo', 'Nora', 'Owen', 'Priya', 'Arjun', 'Mei', 'Kenji', 'Fatima', 'Omar', 'Ana', 'Diego', 'Ingrid', 'Tomás', 'Aisha', 'Kwame', 'Yuki', 'Sofia', 'Gabriel']
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Lee', 'Walker', 'Hall', 'Young', 'King', 'Wright', 'Lopez', 'Hill', 'Green', 'Adams', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Patel', 'Nguyen', 'Kim', 'Chen', 'Singh', 'Okafor', 'Haddad', 'Novak', 'Rossi', 'Schmidt', 'Silva', 'Tanaka']
const streetNames = ['Maple', 'Oak', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lake', 'Hill', 'Park', 'Main', 'Sunset', 'Highland', 'River', 'Church', 'Mill', 'Willow', 'Spring', 'Meadow', 'Ridge', 'Forest']
const streetTypes = ['St', 'Ave', 'Rd', 'Blvd', 'Ln', 'Dr', 'Ct', 'Way', 'Pl']
const cities = [
  ['Springfield', 'IL', '627'], ['Portland', 'OR', '972'], ['Austin', 'TX', '787'], ['Denver', 'CO', '802'], ['Columbus', 'OH', '432'],
  ['Madison', 'WI', '537'], ['Raleigh', 'NC', '276'], ['Boise', 'ID', '837'], ['Richmond', 'VA', '232'], ['Albany', 'NY', '122'],
  ['Sacramento', 'CA', '958'], ['Tucson', 'AZ', '857'], ['Omaha', 'NE', '681'], ['Burlington', 'VT', '054'], ['Savannah', 'GA', '314'],
  ['Spokane', 'WA', '992'], ['Des Moines', 'IA', '503'], ['Tampa', 'FL', '336'], ['Providence', 'RI', '029'], ['Salt Lake City', 'UT', '841'],
]
const areaCodes = ['202', '212', '303', '312', '404', '415', '503', '512', '617', '702', '720', '801', '919', '971']
const companyWords = ['Northwind', 'Bluefield', 'Brightline', 'Harbor', 'Summit', 'Ironwood', 'Silverleaf', 'Clearwater', 'Redstone', 'Lumen', 'Granite', 'Oakridge', 'Pinecrest', 'Driftwood', 'Keystone', 'Evergreen']
const companySuffixes = ['Labs', 'Systems', 'Analytics', 'Logistics', 'Health', 'Software', 'Partners', 'Studio', 'Industries', 'Group', 'Inc.', 'LLC']
const jobTitles = ['QA Engineer', 'Software Engineer', 'Product Manager', 'Support Specialist', 'Customer Success Manager', 'Data Analyst', 'Engineering Manager', 'UX Designer', 'Account Executive', 'DevOps Engineer', 'Technical Writer', 'Operations Manager', 'Test Automation Engineer', 'Support Team Lead', 'Frontend Developer']
const loremWords = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo', 'consequat']
const docRanges = ['192.0.2', '198.51.100', '203.0.113']

export const fieldDefs = [
  { id: 'first_name', label: 'First name' },
  { id: 'last_name', label: 'Last name' },
  { id: 'full_name', label: 'Full name' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'street', label: 'Street address' },
  { id: 'city', label: 'City' },
  { id: 'state', label: 'State' },
  { id: 'zip', label: 'ZIP code' },
  { id: 'country', label: 'Country' },
  { id: 'company', label: 'Company' },
  { id: 'job_title', label: 'Job title' },
  { id: 'uuid', label: 'UUID' },
  { id: 'date_of_birth', label: 'Date of birth' },
  { id: 'ip_address', label: 'IP address' },
  { id: 'url', label: 'URL' },
  { id: 'active', label: 'Boolean' },
  { id: 'number', label: 'Number' },
  { id: 'sentence', label: 'Lorem sentence' },
]

const defaultFields = ['full_name', 'email', 'phone', 'street', 'city', 'state', 'zip']

function slugify(text) {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function makeRow(random, index, numberMin, numberMax) {
  const pick = (list) => list[Math.floor(random() * list.length)]
  const int = (min, max) => min + Math.floor(random() * (max - min + 1))
  const pad = (value, length) => String(value).padStart(length, '0')
  const first = pick(firstNames)
  const last = pick(lastNames)
  const [city, state, zipPrefix] = pick(cities)
  const company = `${pick(companyWords)} ${pick(companySuffixes)}`
  const hex = () => Math.floor(random() * 16).toString(16)
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => (char === 'x' ? hex() : (8 + Math.floor(random() * 4)).toString(16)))
  const words = Array.from({ length: int(6, 12) }, () => pick(loremWords))
  const sentence = `${words.join(' ')}.`.replace(/^./, (char) => char.toUpperCase())
  return {
    first_name: first,
    last_name: last,
    full_name: `${first} ${last}`,
    email: `${slugify(first)}.${slugify(last)}${index + 1}@${random() < 0.5 ? 'example.com' : 'example.org'}`,
    phone: `+1 (${pick(areaCodes)}) 555-01${pad(int(0, 99), 2)}`,
    street: `${int(1, 9999)} ${pick(streetNames)} ${pick(streetTypes)}`,
    city,
    state,
    zip: `${zipPrefix}${pad(int(1, 99), 2)}`,
    country: 'United States',
    company,
    job_title: pick(jobTitles),
    uuid,
    date_of_birth: `${int(1950, 2006)}-${pad(int(1, 12), 2)}-${pad(int(1, 28), 2)}`,
    ip_address: `${pick(docRanges)}.${int(1, 254)}`,
    url: `https://example.com/${slugify(company)}/${slugify(first)}-${slugify(last)}`,
    active: random() < 0.5,
    number: int(numberMin, numberMax),
    sentence,
  }
}

function formatOutput(rows, fields, format, tableName) {
  if (format === 'json') return JSON.stringify(rows.map((row) => Object.fromEntries(fields.map((field) => [field, row[field]]))), null, 2)
  if (format === 'csv') return toCsv(fields, rows.map((row) => fields.map((field) => row[field])))
  const table = tableName.trim().replace(/[^A-Za-z0-9_.]/g, '_') || 'test_users'
  return rows.map((row) => `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${fields.map((field) => sqlValue(row[field])).join(', ')});`).join('\n')
}

const formats = [
  { id: 'json', name: 'JSON', ext: 'json', mime: 'application/json' },
  { id: 'csv', name: 'CSV', ext: 'csv', mime: 'text/csv' },
  { id: 'sql', name: 'SQL', ext: 'sql', mime: 'application/sql' },
]

export function TestDataGenerator() {
  const [fields, setFields] = useState(defaultFields)
  const [count, setCount] = useState(25)
  const [format, setFormat] = useState('json')
  const [tableName, setTableName] = useState('test_users')
  const [useSeed, setUseSeed] = useState(true)
  const [seed, setSeed] = useState('screendesk')
  const [numberMin, setNumberMin] = useState(1)
  const [numberMax, setNumberMax] = useState(100)
  const [rows, setRows] = useState(null)

  const orderedFields = fieldDefs.map((field) => field.id).filter((id) => fields.includes(id))
  const toggleField = (id) => setFields((current) => (current.includes(id) ? current.filter((field) => field !== id) : [...current, id]))

  const generate = () => {
    const total = Math.min(Math.max(Math.round(Number(count)) || 1, 1), 1000)
    const random = useSeed ? seededRandom(seed) : Math.random
    let min = Math.round(Number(numberMin))
    let max = Math.round(Number(numberMax))
    if (!Number.isFinite(min)) min = 0
    if (!Number.isFinite(max)) max = 100
    if (min > max) [min, max] = [max, min]
    setCount(total)
    setRows(Array.from({ length: total }, (_, index) => makeRow(random, index, min, max)))
    trackToolUse(SLUG, 'result')
  }

  const output = rows && orderedFields.length ? formatOutput(rows, orderedFields, format, tableName) : ''
  const preview = rows && rows.length > PREVIEW_ROWS ? formatOutput(rows.slice(0, PREVIEW_ROWS), orderedFields, format, tableName) : output
  const formatDef = formats.find((item) => item.id === format)

  const download = () => {
    downloadText(`test-data.${formatDef.ext}`, output, formatDef.mime)
    trackToolUse(SLUG, 'download')
  }

  return (
    <div className={ui.grid}>
      <div className={ui.card}>
        <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Fields and options</h2></div>
        <div className={`${ui.cardBody} ${ui.stack}`}>
          <fieldset>
            <legend className={ui.label}>Fields</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
              {fieldDefs.map((field) => (
                <label key={field.id} className="flex items-center gap-2 text-sm text-zinc-700">
                  <input type="checkbox" checked={fields.includes(field.id)} onChange={() => toggleField(field.id)} className="size-4 rounded border-zinc-300 accent-rose-500" />
                  {field.label}
                </label>
              ))}
            </div>
          </fieldset>
          {fields.includes('number') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="num-min" className={ui.label}>Number min</label>
                <input id="num-min" type="number" value={numberMin} onChange={(e) => setNumberMin(e.target.value)} className={ui.input} />
              </div>
              <div>
                <label htmlFor="num-max" className={ui.label}>Number max</label>
                <input id="num-max" type="number" value={numberMax} onChange={(e) => setNumberMax(e.target.value)} className={ui.input} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="row-count" className={ui.label}>Rows</label>
              <input id="row-count" type="number" min="1" max="1000" value={count} onChange={(e) => setCount(e.target.value)} className={ui.input} />
              <p className={ui.hint}>1 to 1,000</p>
            </div>
            <div>
              <label htmlFor="seed" className={ui.label}>Seed</label>
              <input id="seed" value={seed} disabled={!useSeed} onChange={(e) => setSeed(e.target.value)} className={`${ui.input} disabled:bg-zinc-50 disabled:text-zinc-400`} />
              <label className="mt-1.5 flex items-center gap-2 text-xs text-zinc-500">
                <input type="checkbox" checked={useSeed} onChange={(e) => setUseSeed(e.target.checked)} className="size-3.5 accent-rose-500" />
                Same seed, same data
              </label>
            </div>
          </div>
          <div>
            <span className={ui.label}>Output format</span>
            <div className={ui.segmented} role="group" aria-label="Output format">
              {formats.map((item) => (
                <button key={item.id} type="button" aria-pressed={format === item.id} onClick={() => setFormat(item.id)} className={ui.segment(format === item.id)}>{item.name}</button>
              ))}
            </div>
          </div>
          {format === 'sql' && (
            <div>
              <label htmlFor="table-name" className={ui.label}>Table name</label>
              <input id="table-name" value={tableName} onChange={(e) => setTableName(e.target.value)} className={`${ui.input} font-mono`} />
            </div>
          )}
          <button type="button" onClick={generate} disabled={orderedFields.length === 0} className={`${ui.primaryButton} w-full`}>Generate test data</button>
          <p className={ui.hint}>Emails use example.com and example.org, phone numbers use the fictional 555-0100 to 555-0199 range, and IP addresses come from the documentation ranges (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24).</p>
        </div>
      </div>

      <div className="space-y-6" aria-live="polite">
        {rows ? (
          <>
            <div className={ui.card}>
              <div className={ui.cardHeader}>
                <div className="flex items-center gap-2"><h2 className={ui.cardTitle}>{rows.length} rows</h2><Badge tone="warning">Synthetic test data</Badge></div>
                <div className="flex gap-2">
                  <span onClickCapture={() => trackToolUse(SLUG, 'copy')}><CopyButton text={output} /></span>
                  <button type="button" onClick={download} disabled={!output} className={`${ui.smallButton} disabled:opacity-50`}><ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />Download</button>
                </div>
              </div>
              <div className={ui.cardBody}>
                {orderedFields.length ? (
                  <>
                    <pre className={`${ui.codeOutput} max-h-[28rem]`}>{preview}</pre>
                    {rows.length > PREVIEW_ROWS && <p className={ui.hint}>Showing the first {PREVIEW_ROWS} rows. Copy and download include all {rows.length}.</p>}
                  </>
                ) : (
                  <p className="text-sm text-zinc-500">Select at least one field.</p>
                )}
              </div>
            </div>
            <ToolCta title="Turn test failures into reproducible bug reports" copy="Screendesk records the screen with console logs, network requests, and device details, and files it in Jira or Linear." />
          </>
        ) : (
          <div className={ui.empty}>
            <TableCellsIcon aria-hidden="true" className={ui.emptyIcon} />
            <p className="font-medium text-zinc-900">No data yet</p>
            <p className="mt-1">Pick fields and generate up to 1,000 rows of fake names, emails, and addresses.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export const edgeCases = [
  { label: 'Empty string', value: '' },
  { label: 'Single space', value: ' ' },
  { label: 'Whitespace only (spaces and tab)', value: '  \t  ' },
  { label: 'Leading and trailing spaces', value: '  Jane Doe  ' },
  { label: 'Line break inside value', value: 'First line\nSecond line' },
  { label: '256 characters', value: 'a'.repeat(256) },
  { label: '5,000 characters', value: 'Lorem ipsum '.repeat(417).slice(0, 5000) },
  { label: 'Accented Latin', value: 'Zoë Ångström-Øresund' },
  { label: 'Emoji with skin tone and ZWJ', value: '👩🏽‍💻 Test 🚀' },
  { label: 'CJK characters', value: '测试用户 テスト 테스트' },
  { label: 'Right-to-left (Arabic)', value: 'مرحبا بالعالم' },
  { label: 'Right-to-left (Hebrew)', value: 'שלום עולם' },
  { label: 'RTL override character', value: 'invoice‮fdp.exe' },
  { label: 'Zero-width space inside word', value: 'zero​width' },
  { label: 'Zero-width joiner and non-joiner', value: 'a‍b‌c' },
  { label: 'Byte order mark prefix', value: '﻿text' },
  { label: 'Apostrophe in name', value: "O'Brien" },
  { label: 'SQL-style quote', value: "' OR '1'='1" },
  { label: 'SQL-style statement', value: "Robert'); DROP TABLE students;--" },
  { label: 'Double quotes and backslash', value: 'say "hi" \\ path\\to\\file' },
  { label: 'HTML tags', value: '<b>bold</b> <i>italic</i>' },
  { label: 'Script-like tag', value: '<script>alert(1)</script>' },
  { label: 'Attribute injection', value: '"><img src=x onerror=alert(1)>' },
  { label: 'Template placeholders', value: '{{7*7}} ${7*7} <%= 7*7 %>' },
  { label: 'Null-like words', value: 'null' },
  { label: 'Undefined', value: 'undefined' },
  { label: 'Negative number', value: '-1' },
  { label: 'Huge number', value: '1e308' },
  { label: 'Beyond JS safe integer', value: '9007199254740993' },
  { label: 'Plus-addressed email', value: 'qa+signup-test@example.com' },
]

function visible(value) {
  const shown = JSON.stringify(value).slice(1, -1)
    .replace(/\u200b/g, '\\u200B').replace(/\u200c/g, '\\u200C').replace(/\u200d/g, '\\u200D').replace(/\ufeff/g, '\\uFEFF').replace(/\u202e/g, '\\u202E')
  return shown.length > 64 ? `${shown.slice(0, 64)}…` : shown || '(empty)'
}

export function EdgeCaseStrings() {
  return (
    <div className={ui.card}>
      <div className={ui.cardHeader}>
        <div>
          <h2 className={ui.cardTitle}>QA edge-case strings</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Invisible characters are shown escaped; Copy puts the raw string on your clipboard.</p>
        </div>
        <span onClickCapture={() => trackToolUse(SLUG, 'copy')}><CopyButton text={JSON.stringify(edgeCases.map((item) => item.value), null, 2)} label="Copy all as JSON" /></span>
      </div>
      <ul className="divide-y divide-zinc-100" role="list">
        {edgeCases.map((item) => (
          <li key={item.label} className="flex items-center gap-4 px-5 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-900">{item.label}</p>
              <p className="truncate font-mono text-xs text-zinc-500" dir="ltr">{visible(item.value)}</p>
            </div>
            <span className="hidden shrink-0 text-xs text-zinc-400 tabular-nums sm:inline">{[...item.value].length} chars</span>
            {item.value ? <span onClickCapture={() => trackToolUse(SLUG, 'copy')}><CopyButton text={item.value} /></span> : <span className="w-[52px] shrink-0 text-center text-xs text-zinc-400">Clear field</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
