#!/usr/bin/env node
// Copies the tool code from the screendesk.io marketing repo, which is the source of truth, into web/.
// Usage: node scripts/sync-from-marketing.mjs [path-to-screendesk-marketing]
//
// Everything listed here is overwritten. Files that only exist in this repo (the page shell in
// web/src/components/tools/ToolLayout.jsx, web/src/pages/index.jsx, web/src/pages/webcam-mic-test.jsx,
// _app, _document, styles) are never touched.
import { cpSync, existsSync, readdirSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(process.argv[2] ?? join(root, '..', 'screendesk-marketing'))
const web = join(root, 'web')

if (!existsSync(join(source, 'src/components/tools/toolsData.js'))) {
  console.error(`Not a screendesk-marketing checkout: ${source}`)
  process.exit(1)
}

// Whole folders, mirrored (files deleted upstream are deleted here too).
const folders = ['dev', 'qa', 'image', 'convert'].map((name) => `src/components/tools/${name}`)

const files = [
  'src/components/JsonLd.jsx',
  'src/components/tools/toolUi.js',
  'src/components/tools/toolsData.js',
  'src/components/tools/toolTracking.js',
  'src/components/tools/ToolCta.jsx',
  'src/components/tools/HarAnalyzer.jsx',
  'src/components/tools/SurveyScoreCalculator.jsx',
  ...[
    'BrowserInfoTool', 'BurnoutCalculator', 'DeadPixelTestTool', 'DeviceSelector', 'EmailTemplateGenerator',
    'FRTCalculator', 'KeyboardTestTool', 'MicTestTool', 'MicrophoneTest', 'MouseTestTool', 'PermissionRequest',
    'SLACalculator', 'SpeakerTestTool', 'TouchScreenTestTool', 'WebcamTest',
  ].map((name) => `src/components/${name}.jsx`),
]

for (const folder of folders) {
  rmSync(join(web, folder), { recursive: true, force: true })
  cpSync(join(source, folder), join(web, folder), { recursive: true })
}
for (const file of files) cpSync(join(source, file), join(web, file))

// Tool pages: every page in src/pages/tools except the marketing index.
const pagesFrom = join(source, 'src/pages/tools')
const pagesTo = join(web, 'src/pages/tools')
rmSync(pagesTo, { recursive: true, force: true })
const pages = readdirSync(pagesFrom).filter((name) => name.endsWith('.jsx') && name !== 'index.jsx')
for (const page of pages) cpSync(join(pagesFrom, page), join(pagesTo, page))

console.log(`Synced ${folders.length} folders, ${files.length} files and ${pages.length} tool pages from ${source}`)
