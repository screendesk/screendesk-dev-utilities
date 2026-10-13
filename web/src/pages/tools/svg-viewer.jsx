import { SvgViewer } from '@/components/tools/image/SvgViewer'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/svg-viewer',
  title: 'SVG Viewer — Preview, Inspect & Minify SVG Online | Screendesk',
  description: 'View SVG files and code online. Live preview on light, dark or transparent backgrounds, zoom in, check width, height and viewBox, minify the markup, and download SVG or PNG.',
  keywords: 'svg viewer, view svg online, svg preview, svg code viewer, open svg file, svg minify, svg to png, svg viewbox',
}

const attributes = [
  ['viewBox', 'The coordinate system: min-x, min-y, width and height of the drawing', 'Without it the SVG can’t scale cleanly; keep it'],
  ['width / height', 'The default display size', 'Optional when CSS sets the size; without both, browsers use 300×150px'],
  ['xmlns', 'Marks the file as SVG', 'Required when the SVG is used as an image file or data URL'],
  ['preserveAspectRatio', 'How the drawing fits when the box has a different ratio', 'Default xMidYMid meet centers and fits the whole drawing'],
]

const minifyRemoves = [
  ['Comments', '<!-- Generator: … -->', 'Removed'],
  ['XML prolog and doctype', '<?xml version="1.0"?> <!DOCTYPE svg …>', 'Removed (not needed in browsers)'],
  ['Metadata', '<metadata>…</metadata>', 'Removed'],
  ['Whitespace between tags', 'Indentation and line breaks', 'Collapsed'],
  ['Inline CSS and scripts in CDATA', '<![CDATA[ … ]]>', 'Kept unchanged'],
]

const faqs = [
  { question: 'How do I view an SVG file?', answer: 'Click Open SVG and pick the file, drop it on the code panel, or paste the SVG markup. The preview updates as you type, and you can switch between a transparent grid, white and dark backgrounds to check how it looks in light and dark themes.' },
  { question: 'Is it safe to open an untrusted SVG here?', answer: 'Yes. SVG files can contain scripts, so this viewer never injects the markup into the page. It renders the SVG as an image from a local blob URL, and browsers don’t run scripts or load external resources in SVGs shown as images.' },
  { question: 'Why does my SVG show at 300×150?', answer: 'An SVG without width and height attributes, and without a viewBox to infer them from, gets the browser default size of 300×150 pixels. Add a viewBox (and width and height if you want a default display size).' },
  { question: 'What does Minify remove?', answer: 'Comments, the XML prolog, doctype, metadata blocks and whitespace between tags. It doesn’t rewrite paths or remove attributes, so the drawing looks the same. For deeper optimisation, use a dedicated tool such as SVGO.' },
  { question: 'Can I convert the SVG to PNG?', answer: 'Yes. Pick 1x, 2x or 4x below the preview and click Download PNG. The PNG keeps transparent areas. For batch conversion, use the SVG to PNG converter.' },
]

export default function SvgViewerPage() {
  return (
    <ToolPageLayout meta={meta} current="svg-viewer" breadcrumb={{ name: 'SVG Viewer', href: meta.path }} faqs={faqs}>
      <ToolHero title="SVG Viewer" description="Paste SVG code or open a file to preview it on light, dark or transparent backgrounds. Zoom in, inspect the viewBox, minify, and download as SVG or PNG." />
      <ToolFrame><SvgViewer /></ToolFrame>
      <ToolSection id="attributes" pill="Reference" title="SVG size attributes." subtitle="What controls how an SVG is sized and scaled.">
        <ToolTable caption="SVG sizing attributes" columns={['Attribute', 'What it does', 'Notes']} rows={attributes} />
      </ToolSection>
      <ToolSection id="minify" pill="Minify" title="What minifying removes." subtitle="Safe cleanups that don’t change the drawing.">
        <ToolTable caption="What the SVG minifier removes" columns={['Part', 'Example', 'Result']} rows={minifyRemoves} />
      </ToolSection>
    </ToolPageLayout>
  )
}
