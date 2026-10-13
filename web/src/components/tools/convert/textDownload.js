// Browser-only file helpers for the converters. Call from event handlers, never during render.

export function downloadText(text, filename, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: `${type};charset=utf-8` }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Large outputs are shown truncated so the page stays responsive; copy and download use the full text.
export const PREVIEW_LIMIT = 200000

export function previewText(text) {
  if (text.length <= PREVIEW_LIMIT) return { text, truncated: false }
  return { text: `${text.slice(0, PREVIEW_LIMIT)}\n…`, truncated: true }
}
