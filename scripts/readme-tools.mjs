#!/usr/bin/env node
// Rewrites the tool list in README.md (between the TOOLS markers) from web/src/components/tools/toolsData.js,
// linking each tool to its page on screendesk.io. Run after a sync: node scripts/readme-tools.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = readFileSync(join(root, 'web/src/components/tools/toolsData.js'), 'utf8')
const field = (block, name) => block.match(new RegExp(`${name}: '((?:[^'\\\\]|\\\\.)*)'`))?.[1].replace(/\\'/g, "'")

const groups = [...data.matchAll(/\{ id: '([^']+)', name: '([^']+)'/g)].map(([, id, name]) => ({ id, name }))
const tools = [...data.matchAll(/\{\s*slug: '[^']+',[\s\S]*?\n  \}/g)].map(([block]) => ({
  group: field(block, 'group'), name: field(block, 'name'), summary: field(block, 'summary'), href: field(block, 'href'),
}))

const sections = groups.map(({ id, name }) => {
  const items = tools.filter((tool) => tool.group === id)
  if (!items.length) return ''
  return `### ${name}\n\n| Tool | What it does |\n| --- | --- |\n${items.map((t) => `| [${t.name}](https://screendesk.io${t.href}) | ${t.summary} |`).join('\n')}\n`
}).filter(Boolean)

const readmePath = join(root, 'README.md')
const readme = readFileSync(readmePath, 'utf8')
const start = '<!-- TOOLS:START -->'
const end = '<!-- TOOLS:END -->'
const updated = readme.replace(new RegExp(`${start}[\\s\\S]*${end}`), `${start}\n\n${sections.join('\n')}\n${end}`)
  .replace(/\b\d+ free tools\b/g, `${tools.length} free tools`)
writeFileSync(readmePath, updated)
console.log(`README lists ${tools.length} tools in ${sections.length} groups`)
