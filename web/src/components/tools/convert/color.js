// Color parsing and conversion: HEX, RGB(A), HSL, HSV and OKLCH, plus WCAG contrast.
// Internally a color is { r, g, b, a } with r/g/b in 0–255 (may be fractional) and a in 0–1.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const round = (value, digits = 0) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

// ---------- sRGB <-> HSL / HSV ----------

export function rgbToHsl({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  if (d === 0) return { h: 0, s: 0, l: l * 100 }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h
  if (max === rn) h = ((gn - bn) / d) % 6
  else if (max === gn) h = (bn - rn) / d + 2
  else h = (rn - gn) / d + 4
  h = (h * 60 + 360) % 360
  return { h, s: s * 100, l: l * 100 }
}

export function hslToRgb({ h, s, l }) {
  const sn = clamp(s, 0, 100) / 100, ln = clamp(l, 0, 100) / 100
  const hh = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * ln - 1)) * sn
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ln - c / 2
  const [r1, g1, b1] = hh < 60 ? [c, x, 0] : hh < 120 ? [x, c, 0] : hh < 180 ? [0, c, x] : hh < 240 ? [0, x, c] : hh < 300 ? [x, 0, c] : [c, 0, x]
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 }
}

export function rgbToHsv({ r, g, b }) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const d = max - min
  const { h } = rgbToHsl({ r, g, b })
  return { h: d === 0 ? 0 : h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 }
}

export function hsvToRgb({ h, s, v }) {
  const sn = clamp(s, 0, 100) / 100, vn = clamp(v, 0, 100) / 100
  const l = vn * (1 - sn / 2)
  const sl = l === 0 || l === 1 ? 0 : (vn - l) / Math.min(l, 1 - l)
  return hslToRgb({ h, s: sl * 100, l: l * 100 })
}

// ---------- sRGB <-> OKLab / OKLCH (Björn Ottosson's matrices) ----------

const toLinear = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
}
const fromLinear = (v) => 255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)

export function rgbToOklch({ r, g, b }) {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  const C = Math.sqrt(A * A + B * B)
  let H = (Math.atan2(B, A) * 180) / Math.PI
  if (H < 0) H += 360
  // Greys have no meaningful hue.
  return { l: L, c: C < 0.0001 ? 0 : C, h: C < 0.0001 ? 0 : H }
}

// Returns the sRGB color plus whether it had to be clipped into the sRGB gamut.
export function oklchToRgb({ l, c, h }) {
  const hr = (h * Math.PI) / 180
  const A = c * Math.cos(hr), B = c * Math.sin(hr)
  const l_ = (l + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m_ = (l - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s_ = (l - 0.0894841775 * A - 1.291485548 * B) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  const outOfGamut = lin.some((v) => v < -0.0005 || v > 1.0005)
  const [r, g, b] = lin.map((v) => clamp(fromLinear(clamp(v, 0, 1)), 0, 255))
  return { r, g, b, outOfGamut }
}

// ---------- Parsing ----------

const NUM = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?'

function parseNumberList(body) {
  // Accepts "1, 2, 3", "1 2 3", "1 2 3 / 0.5", "1, 2, 3, 0.5".
  const [main, slashAlpha] = body.split('/')
  const parts = main.trim().split(/\s*,\s*|\s+/).filter(Boolean)
  if (slashAlpha !== undefined) parts.push(slashAlpha.trim())
  const re = new RegExp(`^(${NUM})(%|deg|turn|rad)?$`, 'i')
  const values = []
  for (const part of parts) {
    if (part.toLowerCase() === 'none') { values.push({ value: 0, unit: '' }); continue }
    const match = part.match(re)
    if (!match) return null
    values.push({ value: Number(match[1]), unit: (match[2] || '').toLowerCase() })
  }
  return values
}

const alphaOf = (item) => (item ? clamp(item.unit === '%' ? item.value / 100 : item.value, 0, 1) : 1)
const hueOf = ({ value, unit }) => (unit === 'turn' ? value * 360 : unit === 'rad' ? (value * 180) / Math.PI : value)

export function parseHex(text) {
  const hex = text.trim().replace(/^#/, '')
  if (!/^[0-9a-f]+$/i.test(hex) || ![3, 4, 6, 8].includes(hex.length)) return null
  const full = hex.length <= 4 ? hex.split('').map((ch) => ch + ch).join('') : hex
  const n = (i) => parseInt(full.slice(i, i + 2), 16)
  return { r: n(0), g: n(2), b: n(4), a: full.length === 8 ? round(n(6) / 255, 3) : 1 }
}

// Parse any supported CSS-like color string. Returns { color, format } or { error }.
export function parseColor(input) {
  const text = String(input || '').trim().toLowerCase()
  if (!text) return { error: 'Enter a color.' }
  if (/^#?[0-9a-f]+$/.test(text)) {
    const color = parseHex(text)
    return color ? { color, format: 'hex' } : { error: 'A hex color has 3, 4, 6 or 8 digits, e.g. #e11d48.' }
  }
  const fn = text.match(/^([a-z]+)\(\s*(.*?)\s*\)$/)
  if (!fn) {
    // Bare "255, 0, 128" is treated as RGB.
    const bare = parseNumberList(text)
    if (bare && (bare.length === 3 || bare.length === 4)) return parseColor(`rgb(${text})`)
    return { error: 'Try a format like #e11d48, rgb(225 29 72), hsl(347 77% 50%) or oklch(0.59 0.22 11).' }
  }
  const [, name, body] = fn
  const values = parseNumberList(body)
  if (!values || values.length < 3 || values.length > 4) return { error: `Could not read the values in ${name}().` }
  const [x, y, z, alpha] = values
  const a = alphaOf(alpha)
  if (name === 'rgb' || name === 'rgba') {
    const ch = ({ value, unit }) => clamp(unit === '%' ? (value / 100) * 255 : value, 0, 255)
    return { color: { r: ch(x), g: ch(y), b: ch(z), a }, format: 'rgb' }
  }
  if (name === 'hsl' || name === 'hsla') return { color: { ...hslToRgb({ h: hueOf(x), s: y.value, l: z.value }), a }, format: 'hsl' }
  if (name === 'hsv' || name === 'hsb') return { color: { ...hsvToRgb({ h: hueOf(x), s: y.value, v: z.value }), a }, format: 'hsv' }
  if (name === 'oklch') {
    const l = x.unit === '%' ? x.value / 100 : x.value
    const c = y.unit === '%' ? (y.value / 100) * 0.4 : y.value
    const { outOfGamut, ...rgb } = oklchToRgb({ l: clamp(l, 0, 1), c: Math.max(0, c), h: hueOf(z) })
    return { color: { ...rgb, a }, format: 'oklch', outOfGamut }
  }
  return { error: `${name}() is not supported here. Use hex, rgb, hsl, hsv or oklch.` }
}

// ---------- Formatting ----------

const hex2 = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
const alphaSuffix = (a) => (a < 1 ? ` / ${round(a, 3)}` : '')

export function formatColor(color) {
  const { r, g, b, a = 1 } = color
  const R = Math.round(r), G = Math.round(g), B = Math.round(b)
  const hsl = rgbToHsl({ r, g, b })
  const hsv = rgbToHsv({ r, g, b })
  const ok = rgbToOklch({ r, g, b })
  return {
    hex: `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`,
    rgb: a < 1 ? `rgba(${R}, ${G}, ${B}, ${round(a, 3)})` : `rgb(${R}, ${G}, ${B})`,
    rgbModern: `rgb(${R} ${G} ${B}${alphaSuffix(a)})`,
    hsl: a < 1
      ? `hsla(${round(hsl.h, 1)}, ${round(hsl.s, 1)}%, ${round(hsl.l, 1)}%, ${round(a, 3)})`
      : `hsl(${round(hsl.h, 1)}, ${round(hsl.s, 1)}%, ${round(hsl.l, 1)}%)`,
    hsv: `hsv(${round(hsv.h, 1)}, ${round(hsv.s, 1)}%, ${round(hsv.v, 1)}%)`,
    oklch: `oklch(${round(ok.l * 100, 2)}% ${round(ok.c, 4)} ${round(ok.h, 2)}${alphaSuffix(a)})`,
    hexOpaque: `#${hex2(r)}${hex2(g)}${hex2(b)}`,
  }
}

// ---------- WCAG contrast ----------

export function relativeLuminance({ r, g, b }) {
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

export function contrastRatio(c1, c2) {
  const l1 = relativeLuminance(c1), l2 = relativeLuminance(c2)
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

// WCAG 2.x thresholds: AA 4.5 (normal) / 3 (large), AAA 7 / 4.5.
export function wcagLevels(ratio) {
  return {
    aaNormal: ratio >= 4.5,
    aaLarge: ratio >= 3,
    aaaNormal: ratio >= 7,
    aaaLarge: ratio >= 4.5,
  }
}

// Alpha is composited over a backdrop before measuring contrast.
export function flatten({ r, g, b, a = 1 }, backdrop) {
  return { r: r * a + backdrop.r * (1 - a), g: g * a + backdrop.g * (1 - a), b: b * a + backdrop.b * (1 - a) }
}
