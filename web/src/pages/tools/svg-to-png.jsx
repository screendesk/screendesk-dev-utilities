import { ImageConverter } from '@/components/tools/image/ImageConverter'
import { formatColumns, formatComparison } from '@/components/tools/image/imageUtils'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/svg-to-png',
  title: 'SVG to PNG Converter — High Resolution, Free | Screendesk',
  description: 'Convert SVG to PNG online at 1x, 2x, 4x or any width. Keep the transparent background, batch convert multiple SVG files, and download instantly. Nothing is uploaded.',
  keywords: 'svg to png, convert svg to png, svg to png converter, svg to png high resolution, svg to png transparent, export svg as png',
}

const sizes = [
  ['1x', 'The SVG’s own width and height', 'Standard displays, email, documents'],
  ['2x', 'Twice the width and height (4× the pixels)', 'Retina and high-DPI screens; the safe default for the web'],
  ['4x', 'Four times the width and height', 'Print, slides, zoomable images'],
  ['Custom width', 'Exactly the width you enter; height follows the aspect ratio', 'App store assets, favicons, fixed layout slots'],
]

const faqs = [
  { question: 'How do I convert SVG to PNG?', answer: 'Drop one or more .svg files on the converter. Pick a scale (1x, 2x, 4x) or type an exact width, then click Download. The PNG is drawn from the vector, so it is sharp at any size you choose.' },
  { question: 'Does the PNG keep a transparent background?', answer: 'Yes. Anything the SVG doesn’t paint stays transparent in the PNG. If you need a solid background, switch the output to JPEG and choose a background color.' },
  { question: 'What size will the PNG be?', answer: 'At 1x the PNG uses the SVG’s width and height attributes. If those are missing, the converter uses the viewBox size. 2x and 4x multiply both sides. Each side is capped at 8192px, which is the largest canvas every major browser can encode reliably.' },
  { question: 'Why do fonts or images look different in the PNG?', answer: 'An SVG drawn as an image can’t load external files. Fonts that aren’t installed on your device fall back to a default font, and linked images are skipped. Convert text to outlines and embed images in the SVG before converting.' },
  { question: 'Is it safe to convert SVG files here?', answer: 'Yes. SVGs are rendered as images in your browser, which means scripts inside them don’t run, and the files are never uploaded to a server.' },
]

export default function SvgToPngPage() {
  return (
    <ToolPageLayout meta={meta} current="svg-to-png" breadcrumb={{ name: 'SVG to PNG Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="SVG to PNG Converter" description="Turn SVG files into crisp PNGs at 1x, 2x, 4x or an exact width, with the transparent background kept. Batch convert in your browser; nothing is uploaded." />
      <ToolFrame>
        <ImageConverter slug="svg-to-png" inputAccept="image/svg+xml,.svg" defaultFormat="png" showResize={false} defaultSvgScale={2} dropTitle="Drop SVG files here" dropHint="or choose files. Each SVG is rendered to a PNG at the scale you pick." />
      </ToolFrame>
      <ToolSection id="sizes" pill="Output size" title="Which scale to choose." subtitle="Vectors stay sharp; pick the pixels you need.">
        <ToolTable caption="SVG to PNG output scales" columns={['Scale', 'Output size', 'Use it for']} rows={sizes} />
      </ToolSection>
      <ToolSection id="formats" pill="Reference" title="PNG vs JPEG vs WebP vs SVG." subtitle="What each image format is good at.">
        <ToolTable caption="Image formats compared" columns={formatColumns} rows={formatComparison} />
      </ToolSection>
    </ToolPageLayout>
  )
}
