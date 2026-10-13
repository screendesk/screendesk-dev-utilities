import { useState } from 'react'
import clsx from 'clsx'

// Shared Tailwind classes for the free tools' controls: neutral surfaces, thin borders, 6–8px radii,
// rose only for focus and the selected state. Use these instead of per-tool styling so every tool matches.
export const ui = {
  // Two-column tool body: inputs on the left, results on the right.
  // min-w-0 on the columns lets wide tables and code scroll inside them instead of widening the page.
  grid: 'grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start [&>*]:min-w-0',
  card: 'rounded-lg border border-zinc-200 bg-white',
  cardHeader: 'flex items-center justify-between gap-4 border-b border-zinc-200 px-5 py-4',
  cardTitle: 'text-sm font-medium text-zinc-900',
  cardBody: 'p-5',
  stack: 'space-y-5',
  label: 'mb-1.5 block text-sm font-medium text-zinc-900',
  hint: 'mt-1.5 text-xs text-zinc-500',
  input: 'block h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20',
  select: 'block h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20',
  textarea: 'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20',
  range: 'w-full accent-rose-500',
  // Segmented control: a muted track with a white selected segment.
  segmented: 'inline-flex rounded-lg bg-zinc-100 p-1',
  segment: (active) => clsx('h-8 rounded-md px-3 text-sm font-medium transition-colors', active ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-900'),
  primaryButton: 'inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:opacity-50',
  secondaryButton: 'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
  // A large figure with its label.
  metric: 'text-4xl font-semibold tracking-tight text-zinc-900 tabular-nums',
  metricLabel: 'text-sm text-zinc-500',
  // Label/value rows separated by thin rules.
  rows: 'divide-y divide-zinc-100 text-sm',
  row: 'flex items-center justify-between gap-4 py-2.5',
  rowLabel: 'text-zinc-500',
  rowValue: 'font-medium text-zinc-900 tabular-nums',
  empty: 'flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500',
  emptyIcon: 'mb-3 size-6 text-zinc-400',
  listIcon: 'size-4 shrink-0 text-rose-500',
  // Developer and QA utilities: monospace input/output surfaces and inline errors.
  code: 'block w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[13px] leading-5 text-zinc-900 placeholder:text-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20',
  codeOutput: 'block w-full overflow-auto rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-[13px] leading-5 text-zinc-900 whitespace-pre',
  error: 'rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700',
  smallButton: 'inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500',
}

// Copies text and briefly confirms. Use for every tool output so copy behaves the same everywhere.
export function CopyButton({ text, label = 'Copy', className }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (_) {}
  }
  return (
    <button type="button" onClick={copy} disabled={!text} className={clsx(ui.smallButton, 'disabled:opacity-50', className)}>
      {copied ? 'Copied' : label}
    </button>
  )
}

// Status badges use full class names (Tailwind can't see interpolated ones like `bg-${color}-100`).
const tones = {
  positive: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-500/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  negative: 'bg-red-50 text-red-700 ring-red-600/20',
}

export function Badge({ tone = 'neutral', children }) {
  return <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tones[tone])}>{children}</span>
}
