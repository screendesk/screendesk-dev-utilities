// Browser-only image helpers for the image tools. Call these from effects and event handlers, never
// during render: they touch the DOM, canvas and object URLs.

export { formatBytes } from '@/components/tools/dev/base64'

export const MAX_SIDE = 8192 // larger canvases fail silently (null blob) in some browsers
export const MAX_FILE = 50 * 1024 * 1024

export const formats = {
  png: { label: 'PNG', mime: 'image/png', ext: 'png', lossy: false },
  jpeg: { label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', lossy: true },
  webp: { label: 'WebP', mime: 'image/webp', ext: 'webp', lossy: true },
}

export function isSvgFile(file) {
  return file.type === 'image/svg+xml' || /\.svg$/i.test(file.name)
}

// Encoding support: browsers that can't encode a type fall back to PNG.
export function detectWebpSupport() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch (_) {
    return false
  }
}

function waitForImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This file could not be read as an image by your browser.'))
    img.src = src
  })
}

// Reads width/height/viewBox from SVG markup without rendering it.
export function parseSvgInfo(text) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const svg = doc.documentElement
  if (!svg || svg.nodeName.toLowerCase() !== 'svg' || doc.getElementsByTagName('parsererror').length) {
    const message = doc.getElementsByTagName('parsererror')[0]?.textContent?.split('\n').find(Boolean)
    throw new Error(message ? `Invalid SVG: ${message.trim()}` : 'This is not valid SVG markup.')
  }
  const viewBox = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number)
  const hasViewBox = viewBox.length === 4 && viewBox.every(Number.isFinite)
  const length = (value) => {
    if (!value || /%$/.test(value.trim())) return null
    const number = parseFloat(value)
    if (!Number.isFinite(number) || number <= 0) return null
    const unit = value.trim().replace(/^[\d.\-+e]+/i, '')
    const factor = { '': 1, px: 1, pt: 4 / 3, pc: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, em: 16, rem: 16 }[unit] ?? 1
    return number * factor
  }
  let width = length(svg.getAttribute('width'))
  let height = length(svg.getAttribute('height'))
  if (hasViewBox) {
    const [, , vbWidth, vbHeight] = viewBox
    if (!width && !height) { width = vbWidth; height = vbHeight }
    else if (!width) width = height * (vbWidth / vbHeight)
    else if (!height) height = width * (vbHeight / vbWidth)
  }
  return {
    width: width ? Math.round(width) : null,
    height: height ? Math.round(height) : null,
    viewBox: hasViewBox ? viewBox.join(' ') : null,
    widthAttr: svg.getAttribute('width'),
    heightAttr: svg.getAttribute('height'),
    elements: doc.getElementsByTagName('*').length,
  }
}

// SVGs with only a viewBox (or % sizes) have no intrinsic size, and browsers draw them
// inconsistently on a canvas. Give the root element explicit pixel dimensions before loading.
export function withPixelSize(text, width, height) {
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
  const svg = doc.documentElement
  svg.setAttribute('width', String(width))
  svg.setAttribute('height', String(height))
  if (!svg.getAttribute('xmlns')) svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  return new XMLSerializer().serializeToString(doc)
}

export async function loadSvgImage(text, width, height) {
  const url = URL.createObjectURL(new Blob([withPixelSize(text, width, height)], { type: 'image/svg+xml' }))
  try {
    return await waitForImage(url)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Loads a File as a drawable image. SVGs get explicit dimensions so they draw at a known size
// (an SVG without width/height reports 0×0 in some browsers).
export async function loadImageFile(file) {
  const url = URL.createObjectURL(file)
  try {
    if (isSvgFile(file)) {
      const text = await file.text()
      const info = parseSvgInfo(text)
      const width = info.width || 300
      const height = info.height || 150
      const img = await loadSvgImage(text, width, height)
      return { img, width, height, svg: true, svgText: text }
    }
    const img = await waitForImage(url)
    if (!img.naturalWidth) throw new Error('This image has no readable dimensions.')
    return { img, width: img.naturalWidth, height: img.naturalHeight, svg: false }
  } finally {
    // The decoded Image keeps its pixels; the URL is no longer needed once loaded.
    URL.revokeObjectURL(url)
  }
}

export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The browser could not encode this image. Try a smaller size.'))), mime, quality)
  })
}

// Draws an image at the target size and encodes it. Returns the blob and the type actually produced.
export async function renderImage({ img, width, height, mime, quality, background }) {
  if (width > MAX_SIDE || height > MAX_SIDE) throw new Error(`Output would be ${width}×${height}px. Keep each side at or under ${MAX_SIDE}px.`)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')
  if (mime === 'image/jpeg') {
    ctx.fillStyle = background || '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await canvasToBlob(canvas, mime, quality)
  return { blob, width: canvas.width, height: canvas.height }
}

export function replaceExtension(name, ext) {
  const base = name.replace(/\.[^./\\]+$/, '') || 'image'
  return `${base}.${ext}`
}

export function extensionForMime(mime) {
  return { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/bmp': 'bmp', 'image/x-icon': 'ico', 'image/avif': 'avif' }[mime] || 'bin'
}

export function triggerDownload(href, filename) {
  const link = document.createElement('a')
  link.href = href
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
}

// Light SVG minifier: removes comments, XML prolog, doctype, metadata and editor namespaces' noise,
// and collapses whitespace between tags. CDATA (inline CSS/JS) is left untouched.
export function minifySvg(text) {
  const blocks = []
  const keep = text.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, (match) => `__svgcdata${blocks.push(match) - 1}__`)
  const out = keep
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<metadata[\s\S]*?<\/metadata>/gi, '')
    .replace(/<metadata[^>]*\/>/gi, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return out.replace(/__svgcdata(\d+)__/g, (_, index) => blocks[Number(index)])
}

// Shared reference content for the image tool pages.
export const formatComparison = [
  ['PNG', 'Lossless', 'Yes', 'No (APNG: yes)', 'All browsers', 'Screenshots, UI, text, logos with transparency'],
  ['JPEG', 'Lossy', 'No', 'No', 'All browsers', 'Photos where small size matters more than sharp edges'],
  ['WebP', 'Lossy or lossless', 'Yes', 'Yes', 'All current browsers (Safari 14+ on macOS Big Sur and later)', 'Web images: usually smaller than PNG or JPEG at similar quality'],
  ['SVG', 'Vector (no pixels)', 'Yes', 'Yes (CSS/SMIL)', 'All browsers', 'Icons, logos and illustrations that must stay sharp at any size'],
]
export const formatColumns = ['Format', 'Compression', 'Transparency', 'Animation', 'Browser support', 'Best for']
