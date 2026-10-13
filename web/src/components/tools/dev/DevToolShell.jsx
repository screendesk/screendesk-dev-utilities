import clsx from 'clsx'
import { LockClosedIcon } from '@heroicons/react/24/outline'
import { ui } from '@/components/tools/toolUi'

// Shared building blocks for the developer utilities: a toolbar row, two panes (input / output)
// side by side on large screens and stacked on mobile, inline errors, and a privacy note.

export function DevToolShell({ toolbar, left, right, below, note = true }) {
  return (
    <div className="space-y-4">
      {toolbar && <div className="flex flex-wrap items-center gap-3">{toolbar}</div>}
      <div className={ui.grid}>
        <div className="min-w-0">{left}</div>
        <div className="min-w-0">{right}</div>
      </div>
      {below}
      {note && <PrivacyNote />}
    </div>
  )
}

// A titled card. `actions` sit on the right of the header (copy, clear, sample…).
export function DevPane({ title, actions, children, bodyClassName }) {
  return (
    <div className={ui.card}>
      <div className={clsx(ui.cardHeader, 'min-h-14 py-3')}>
        <h2 className={ui.cardTitle}>{title}</h2>
        {actions && <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
      <div className={clsx('p-4', bodyClassName)}>{children}</div>
    </div>
  )
}

export function CodeArea({ value, onChange, rows = 14, placeholder, label, id, readOnly = false, className }) {
  return (
    <textarea
      id={id}
      aria-label={label}
      value={value}
      onChange={onChange ? (event) => onChange(event.target.value) : undefined}
      readOnly={readOnly}
      rows={rows}
      placeholder={placeholder}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      className={clsx(ui.code, 'resize-y', readOnly && 'bg-zinc-50', className)}
    />
  )
}

// Read-only monospace output. Keeps the same height as a 14-row textarea by default.
export function CodeBlock({ children, className, label }) {
  return (
    <pre aria-label={label} className={clsx(ui.codeOutput, 'max-h-[32rem] min-h-[18.5rem]', className)}>
      {children}
    </pre>
  )
}

export function ErrorBox({ children, hint }) {
  if (!children) return null
  return (
    <div role="alert" className={ui.error}>
      <p>{children}</p>
      {hint && <p className="mt-1 text-xs text-red-600">{hint}</p>}
    </div>
  )
}

export function Segmented({ label, options, value, onChange }) {
  return (
    <div className={ui.segmented} role="group" aria-label={label}>
      {options.map((option) => {
        const { value: optionValue, label: optionLabel } = typeof option === 'string' ? { value: option, label: option } : option
        return (
          <button key={optionValue} type="button" aria-pressed={value === optionValue} onClick={() => onChange(optionValue)} className={ui.segment(value === optionValue)}>
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 rounded border-zinc-300 accent-rose-500" />
      {label}
    </label>
  )
}

export function PrivacyNote({ children = 'Runs entirely in your browser. Nothing you paste here is uploaded or stored.' }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
      <LockClosedIcon aria-hidden="true" className="size-3.5 shrink-0" />
      {children}
    </p>
  )
}
