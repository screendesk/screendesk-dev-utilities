// px ⇄ rem/em/pt/vw math. Pure functions, safe during render and in Node tests.

// Up to `decimals` places with trailing zeros dropped: 0.875, 1.5, 0.0625.
export function formatUnit(value, decimals = 4) {
  if (!Number.isFinite(value)) return ''
  const rounded = Number(value.toFixed(decimals))
  return String(Object.is(rounded, -0) ? 0 : rounded)
}

// Parse a user-typed number, tolerating a trailing unit ("24px", "1.5rem") and a comma decimal.
export function parseNumber(text) {
  const cleaned = String(text ?? '').trim().replace(',', '.').replace(/(px|rem|em|pt|vw|%)$/i, '').trim()
  if (cleaned === '' || !/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(cleaned)) return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

export const pxToRem = (px, base) => px / base
export const remToPx = (rem, base) => rem * base
// CSS defines 1in = 96px = 72pt, so 1px = 0.75pt.
export const pxToPt = (px) => px * 0.75
export const pxToVw = (px, viewport) => (px / viewport) * 100

export function conversionTable(base, from = 1, to = 96) {
  const rows = []
  for (let px = from; px <= to; px++) rows.push({ px, rem: formatUnit(pxToRem(px, base)), pt: formatUnit(pxToPt(px), 2) })
  return rows
}
