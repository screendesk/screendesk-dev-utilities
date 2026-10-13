// XML <-> JSON. xmlToJson takes a parsed DOM Document (the browser's DOMParser), so this module never
// touches window itself. Convention: attributes become "@name", text next to attributes or child
// elements becomes "#text", and repeated child elements become arrays.

const ELEMENT = 1
const TEXT = 3
const CDATA = 4

export function inferScalar(text) {
  if (text === 'true') return true
  if (text === 'false') return false
  if (/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?$/.test(text)) {
    const number = Number(text)
    if (Number.isFinite(number) && (!/^-?\d+$/.test(text) || Number.isSafeInteger(number))) return number
  }
  return text
}

function elementToJson(element, options) {
  const { inferTypes, trimText } = options
  const result = {}
  const attributes = element.attributes ? Array.from(element.attributes) : []
  for (const attribute of attributes) result[`@${attribute.name}`] = inferTypes ? inferScalar(attribute.value) : attribute.value

  let text = ''
  let hasElements = false
  const arrays = new Set()
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === ELEMENT) {
      hasElements = true
      const value = elementToJson(child, options)
      const key = child.nodeName
      if (Object.prototype.hasOwnProperty.call(result, key)) {
        if (!arrays.has(key)) {
          result[key] = [result[key]]
          arrays.add(key)
        }
        result[key].push(value)
      } else {
        result[key] = value
      }
    } else if (child.nodeType === TEXT || child.nodeType === CDATA) {
      text += child.nodeValue
    }
  }

  const cleaned = trimText ? text.trim() : text
  const textValue = inferTypes ? inferScalar(cleaned) : cleaned
  const hasText = trimText ? cleaned !== '' : /\S/.test(text)
  if (!attributes.length && !hasElements) return hasText ? textValue : null
  if (hasText) result['#text'] = textValue
  return result
}

// Error text from the browser's <parsererror> document, without the boilerplate around it.
export function parserErrorMessage(doc) {
  const nodes = doc.getElementsByTagName('parsererror')
  for (const node of Array.from(nodes)) {
    const ns = node.namespaceURI || ''
    // Chrome/Safari use the XHTML namespace, Firefox its own; a real <parsererror> in the input has neither.
    if (ns === 'http://www.w3.org/1999/xhtml' || ns.includes('mozilla.org') || doc.documentElement === node) {
      const raw = (node.textContent || '').replace('This page contains the following errors:', '').replace(/Below is a rendering of the page up to the first error\.?/, '')
      const line = raw.split('\n').map((part) => part.trim()).filter(Boolean)
      return line.slice(0, 2).join(' ') || 'The XML is not well-formed.'
    }
  }
  return null
}

export function xmlDocumentToJson(doc, { inferTypes = false, trimText = true, indent = 2 } = {}) {
  const error = parserErrorMessage(doc)
  if (error) return { ok: false, error }
  const root = doc.documentElement
  if (!root) return { ok: false, error: 'No root element found.' }
  const value = { [root.nodeName]: elementToJson(root, { inferTypes, trimText }) }
  return { ok: true, value, output: JSON.stringify(value, null, indent === 'tab' ? '\t' : indent) }
}

// Browser-only helper. Call from effects or event handlers, never during render on the server.
export function xmlToJson(text, options) {
  if (typeof DOMParser === 'undefined') return { ok: false, error: 'XML parsing needs a browser.' }
  const doc = new DOMParser().parseFromString(text.replace(/^\uFEFF/, ''), 'application/xml')
  return xmlDocumentToJson(doc, options)
}

export const escapeXmlText = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
export const escapeXmlAttribute = (value) => escapeXmlText(value).replace(/"/g, '&quot;')

// Turns any JSON key into a valid XML element name.
export function toXmlName(key) {
  let name = String(key).replace(/[^A-Za-z0-9_.:-]/g, '_')
  if (!/^[A-Za-z_]/.test(name)) name = `_${name}`
  if (/^xml/i.test(name)) name = `_${name}`
  return name
}

export function jsonToXml(input, { rootName = 'root', indent = 2, declaration = true, useTopKey = true, itemName = 'item' } = {}) {
  let data
  try {
    data = JSON.parse(input)
  } catch (error) {
    return { ok: false, error: `Invalid JSON: ${error.message}` }
  }
  const pad = indent === 'tab' ? '\t' : indent === 0 ? '' : ' '.repeat(indent)
  const newline = indent === 0 ? '' : '\n'
  const lines = []

  const write = (name, value, depth) => {
    const prefix = pad.repeat(depth)
    const tag = toXmlName(name)
    if (Array.isArray(value)) {
      // Arrays repeat the element; an array inside an array needs a wrapper element per item.
      for (const item of value) {
        if (Array.isArray(item)) {
          lines.push(`${prefix}<${tag}>`)
          for (const inner of item) write(itemName, inner, depth + 1)
          lines.push(`${prefix}</${tag}>`)
        } else write(name, item, depth)
      }
      return
    }
    if (value === null || value === undefined) {
      lines.push(`${prefix}<${tag}/>`)
      return
    }
    if (typeof value !== 'object') {
      lines.push(`${prefix}<${tag}>${escapeXmlText(value)}</${tag}>`)
      return
    }
    const entries = Object.entries(value)
    const attributes = entries.filter(([key]) => key.startsWith('@')).map(([key, attributeValue]) => ` ${toXmlName(key.slice(1))}="${escapeXmlAttribute(attributeValue === null ? '' : typeof attributeValue === 'object' ? JSON.stringify(attributeValue) : attributeValue)}"`).join('')
    const text = entries.find(([key]) => key === '#text')
    const children = entries.filter(([key]) => !key.startsWith('@') && key !== '#text')
    if (!children.length) {
      if (text && text[1] !== null && text[1] !== '') lines.push(`${prefix}<${tag}${attributes}>${escapeXmlText(text[1])}</${tag}>`)
      else lines.push(`${prefix}<${tag}${attributes}/>`)
      return
    }
    lines.push(`${prefix}<${tag}${attributes}>`)
    if (text && text[1] !== null && text[1] !== '') lines.push(`${prefix}${pad}${escapeXmlText(text[1])}`)
    for (const [key, child] of children) write(key, child, depth + 1)
    lines.push(`${prefix}</${tag}>`)
  }

  const keys = data !== null && typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : []
  if (useTopKey && keys.length === 1 && !keys[0].startsWith('@') && keys[0] !== '#text' && !Array.isArray(data[keys[0]])) {
    write(keys[0], data[keys[0]], 0)
  } else if (Array.isArray(data)) {
    lines.push(`<${toXmlName(rootName)}>`)
    for (const item of data) write(itemName, item, 1)
    lines.push(`</${toXmlName(rootName)}>`)
  } else {
    write(rootName || 'root', data, 0)
  }
  const body = lines.join(newline)
  return { ok: true, output: declaration ? `<?xml version="1.0" encoding="UTF-8"?>${newline || '\n'}${body}` : body }
}
