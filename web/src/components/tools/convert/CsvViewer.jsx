import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, ChevronDownIcon, ChevronUpDownIcon, ChevronUpIcon, MagnifyingGlassIcon, TableCellsIcon } from '@heroicons/react/24/outline'
import { Badge, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeArea, ErrorBox, PrivacyNote, Segmented, Toggle } from '@/components/tools/dev/DevToolShell'
import { columnStats, compareCells, parseCsv, toCsv } from './csv'
import { downloadText, formatBytes } from './textDownload'

const MAX_FILE = 100 * 1024 * 1024
const PAGE_SIZES = [50, 100, 250]

const SAMPLE = `ticket_id,created,channel,priority,first_response_min,csat,agent
T-2001,2026-09-01,email,high,42,5,Maya
T-2002,2026-09-01,chat,low,3,4,Leo
T-2003,2026-09-02,email,medium,128,,Maya
T-2004,2026-09-02,phone,high,0,5,Ines
T-2005,2026-09-03,chat,medium,6,3,Leo
T-2006,2026-09-03,email,low,315,2,Ines
T-2007,2026-09-04,chat,high,2,5,Maya
T-2008,2026-09-04,email,medium,57,4,"Ng, Tom"`

const delimiterOptions = [
  { value: 'auto', label: 'Auto' },
  { value: ',', label: ',' },
  { value: ';', label: ';' },
  { value: '\t', label: 'Tab' },
]

const formatNumber = (value) => (value === null ? '—' : Number.isInteger(value) ? value.toLocaleString('en-US') : value.toLocaleString('en-US', { maximumFractionDigits: 4 }))

function SortIcon({ direction }) {
  const Icon = direction === 'asc' ? ChevronUpIcon : direction === 'desc' ? ChevronDownIcon : ChevronUpDownIcon
  return <Icon aria-hidden="true" className={clsx('size-3.5 shrink-0', direction ? 'text-rose-600' : 'text-zinc-400')} />
}

export function CsvViewer() {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState('')
  const [delimiter, setDelimiter] = useState('auto')
  const [header, setHeader] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ column: null, direction: null })
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage] = useState(0)
  const [view, setView] = useState('table')
  const [loading, setLoading] = useState(false)
  const fileInput = useRef(null)
  const deferredQuery = useDeferredValue(query)

  const parsed = useMemo(() => {
    if (!text.trim()) return null
    const { rows, delimiter: used, error } = parseCsv(text, { delimiter })
    const clean = rows.filter((row) => !(row.length === 1 && row[0] === ''))
    if (!clean.length) return { error: error?.message || 'No rows found.', rows: [], columns: [], delimiter: used }
    const width = clean.reduce((max, row) => Math.max(max, row.length), 0)
    const columns = header
      ? Array.from({ length: width }, (_, index) => clean[0][index]?.trim() || `Column ${index + 1}`)
      : Array.from({ length: width }, (_, index) => `Column ${index + 1}`)
    const body = header ? clean.slice(1) : clean
    return { rows: body, columns, delimiter: used, error: error?.message || null, ragged: body.some((row) => row.length !== width) }
  }, [text, delimiter, header])

  const hasData = Boolean(parsed?.rows.length)
  useEffect(() => {
    if (hasData) trackToolUse('csv-viewer', 'result')
  }, [hasData])

  // Row indices that match the search, then sorted. Indices keep the original row number for display.
  const filtered = useMemo(() => {
    if (!parsed) return []
    const needle = deferredQuery.trim().toLowerCase()
    const indices = []
    for (let index = 0; index < parsed.rows.length; index++) {
      if (!needle || parsed.rows[index].some((cell) => cell.toLowerCase().includes(needle))) indices.push(index)
    }
    return indices
  }, [parsed, deferredQuery])

  const sorted = useMemo(() => {
    if (!parsed || sort.column === null) return filtered
    const { column, direction } = sort
    const factor = direction === 'desc' ? -1 : 1
    return [...filtered].sort((a, b) => {
      const left = parsed.rows[a][column] ?? ''
      const right = parsed.rows[b][column] ?? ''
      const leftEmpty = left.trim() === ''
      const rightEmpty = right.trim() === ''
      // Empty cells stay at the bottom in both directions.
      if (leftEmpty || rightEmpty) return leftEmpty === rightEmpty ? a - b : leftEmpty ? 1 : -1
      return factor * compareCells(left, right) || a - b
    })
  }, [parsed, filtered, sort])

  const stats = useMemo(() => (parsed && view === 'columns' ? parsed.columns.map((name, index) => ({ name, ...columnStats(parsed.rows, index) })) : null), [parsed, view])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const pageRows = sorted.slice(currentPage * pageSize, currentPage * pageSize + pageSize)

  const load = (value, name = '') => {
    setText(value)
    setFileName(name)
    setQuery('')
    setSort({ column: null, direction: null })
    setPage(0)
  }

  const pickFile = async (event) => {
    const picked = event.target.files?.[0]
    event.target.value = ''
    if (!picked) return
    if (picked.size > MAX_FILE) {
      setFileError(`That file is ${formatBytes(picked.size)}. Files up to ${formatBytes(MAX_FILE)} can be opened here.`)
      return
    }
    setFileError('')
    setLoading(true)
    try {
      load(await picked.text(), `${picked.name} · ${formatBytes(picked.size)}`)
    } finally {
      setLoading(false)
    }
  }

  const toggleSort = (column) => {
    setPage(0)
    setSort((current) => {
      if (current.column !== column) return { column, direction: 'asc' }
      if (current.direction === 'asc') return { column, direction: 'desc' }
      return { column: null, direction: null }
    })
  }

  const exportFiltered = () => {
    if (!parsed) return
    const rows = sorted.map((index) => parsed.rows[index])
    downloadText(`\uFEFF${toCsv(header ? [parsed.columns, ...rows] : rows)}`, 'filtered.csv', 'text/csv')
  }

  return (
    <div className="space-y-4">
      <div className={ui.card}>
        <div className={clsx(ui.cardHeader, 'min-h-14 flex-wrap py-3')}>
          <h2 className={ui.cardTitle}>CSV file</h2>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <input ref={fileInput} type="file" accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values" className="sr-only" tabIndex={-1} onChange={pickFile} />
            <button type="button" className={ui.smallButton} onClick={() => fileInput.current?.click()}>
              <ArrowUpTrayIcon aria-hidden="true" className="size-3.5" />
              Open CSV file
            </button>
            <button type="button" className={ui.smallButton} onClick={() => load(SAMPLE, 'Sample tickets')}>Sample</button>
            <button type="button" className={ui.smallButton} onClick={() => load('')} disabled={!text}>Clear</button>
          </div>
        </div>
        <div className="space-y-3 p-4">
          {fileName && text ? (
            <p className="text-sm text-zinc-700">
              Loaded <span className="font-medium text-zinc-900">{fileName}</span>
            </p>
          ) : (
            <CodeArea label="CSV input" rows={6} value={text} onChange={(value) => load(value)} placeholder={'Paste CSV here or open a .csv file\nname,email,plan\nAda,ada@example.com,pro'} />
          )}
          {loading && <p className={ui.hint}>Reading file…</p>}
          <ErrorBox>{fileError}</ErrorBox>
          {parsed?.error && <ErrorBox hint="Rows after the unclosed quote may be merged into one cell.">{parsed.error}</ErrorBox>}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-500">Delimiter</span>
            <Segmented label="Delimiter" value={delimiter} onChange={setDelimiter} options={delimiterOptions} />
            <Toggle label="First row is header" checked={header} onChange={setHeader} />
            {fileName && text && (
              <button type="button" className={ui.smallButton} onClick={() => setFileName('')}>Edit as text</button>
            )}
          </div>
        </div>
      </div>

      {hasData ? (
        <div className={ui.card}>
          <div className={clsx(ui.cardHeader, 'flex-wrap py-3')}>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <Badge tone="positive">{parsed.rows.length.toLocaleString('en-US')} rows</Badge>
              <span>{parsed.columns.length} columns</span>
              {deferredQuery.trim() && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{filtered.length.toLocaleString('en-US')} match</span>
                </>
              )}
              {parsed.ragged && <Badge tone="warning">Uneven row lengths</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Segmented label="View" value={view} onChange={setView} options={[{ value: 'table', label: 'Table' }, { value: 'columns', label: 'Column stats' }]} />
              <button type="button" className={ui.smallButton} onClick={exportFiltered}>
                <ArrowDownTrayIcon aria-hidden="true" className="size-3.5" />
                Export view
              </button>
            </div>
          </div>

          {view === 'table' ? (
            <div className="space-y-3 p-4">
              <div className="relative max-w-sm">
                <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  aria-label="Search rows"
                  placeholder="Search all columns"
                  className={clsx(ui.input, 'pl-9')}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(0)
                  }}
                />
              </div>
              <div className="max-h-[36rem] overflow-auto rounded-md border border-zinc-200">
                <table className="min-w-full border-collapse text-left text-[13px]">
                  <thead className="sticky top-0 z-10 bg-zinc-50">
                    <tr>
                      <th scope="col" className="border-b border-zinc-200 px-3 py-2 text-right font-medium text-zinc-400 tabular-nums">#</th>
                      {parsed.columns.map((name, index) => {
                        const direction = sort.column === index ? sort.direction : null
                        return (
                          <th key={index} scope="col" aria-sort={direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none'} className="border-b border-zinc-200 p-0 font-medium text-zinc-900">
                            <button type="button" onClick={() => toggleSort(index)} className="flex w-full items-center gap-1 px-3 py-2 text-left whitespace-nowrap hover:bg-zinc-100 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-rose-500">
                              <span className="max-w-[16rem] truncate">{name}</span>
                              <SortIcon direction={direction} />
                            </button>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {pageRows.map((rowIndex) => {
                      const row = parsed.rows[rowIndex]
                      return (
                        <tr key={rowIndex} className="hover:bg-zinc-50">
                          <td className="px-3 py-1.5 text-right text-zinc-400 tabular-nums">{rowIndex + 1}</td>
                          {parsed.columns.map((_, column) => {
                            const cell = row[column] ?? ''
                            return (
                              <td key={column} title={cell.length > 60 ? cell : undefined} className="max-w-[20rem] truncate px-3 py-1.5 whitespace-nowrap text-zinc-700">
                                {cell}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {!pageRows.length && <p className="p-6 text-center text-sm text-zinc-500">No rows match “{deferredQuery}”.</p>}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-500">
                <div className="flex items-center gap-2">
                  <label htmlFor="csv-page-size">Rows per page</label>
                  <select
                    id="csv-page-size"
                    className={clsx(ui.select, 'h-8 w-20')}
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(Number(event.target.value))
                      setPage(0)
                    }}
                  >
                    {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tabular-nums">
                    {sorted.length ? `${(currentPage * pageSize + 1).toLocaleString('en-US')}–${Math.min(sorted.length, (currentPage + 1) * pageSize).toLocaleString('en-US')} of ${sorted.length.toLocaleString('en-US')}` : '0 rows'}
                  </span>
                  <button type="button" className={`${ui.smallButton} disabled:opacity-50`} onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0}>Previous</button>
                  <button type="button" className={`${ui.smallButton} disabled:opacity-50`} onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}>Next</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative overflow-x-auto p-4">
              <table className="min-w-full border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    {['Column', 'Type', 'Filled', 'Empty', 'Unique', 'Min', 'Max', 'Mean'].map((label) => (
                      <th key={label} scope="col" className="px-3 py-2 font-medium whitespace-nowrap">{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 tabular-nums">
                  {stats.map((column, index) => (
                    <tr key={index}>
                      <th scope="row" className="max-w-[16rem] truncate px-3 py-2 font-medium text-zinc-900">{column.name}</th>
                      <td className="px-3 py-2"><Badge tone={column.isNumeric ? 'positive' : 'neutral'}>{column.isNumeric ? 'Number' : column.filled ? 'Text' : 'Empty'}</Badge></td>
                      <td className="px-3 py-2 text-zinc-700">{column.filled.toLocaleString('en-US')}</td>
                      <td className={clsx('px-3 py-2', column.empty ? 'text-amber-700' : 'text-zinc-700')}>{column.empty.toLocaleString('en-US')}</td>
                      <td className="px-3 py-2 text-zinc-700">{column.unique.toLocaleString('en-US')}</td>
                      <td className="px-3 py-2 text-zinc-700">{formatNumber(column.min)}</td>
                      <td className="px-3 py-2 text-zinc-700">{formatNumber(column.max)}</td>
                      <td className="px-3 py-2 text-zinc-700">{formatNumber(column.mean)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className={ui.empty}>
          <TableCellsIcon aria-hidden="true" className={ui.emptyIcon} />
          Open a CSV file or paste CSV above to see it as a sortable, searchable table.
        </div>
      )}

      {hasData && (
        <ToolCta
          title="Digging through exports to find what broke?"
          copy="Screendesk bug reports come with console logs, network requests, and device details attached, so you start from the error instead of a spreadsheet."
        />
      )}
      <PrivacyNote>Runs entirely in your browser. Your CSV file is never uploaded or stored.</PrivacyNote>
    </div>
  )
}
