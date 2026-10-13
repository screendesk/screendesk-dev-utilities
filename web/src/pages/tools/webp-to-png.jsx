import { ImageConverter } from '@/components/tools/image/ImageConverter'
import { formatColumns, formatComparison } from '@/components/tools/image/imageUtils'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/webp-to-png',
  title: 'WebP to PNG Converter — Free, Batch, No Upload | Screendesk',
  description: 'Convert WebP to PNG online for free. Batch convert multiple WebP images, keep transparency, and optionally resize. Runs in your browser, so nothing is uploaded.',
  keywords: 'webp to png, convert webp to png, webp to png converter, webp converter, save webp as png, webp to png batch',
}

const whenToConvert = [
  ['Editing in older software', 'Some image editors, office suites and design tools still can’t open WebP. PNG opens everywhere.'],
  ['Attaching to tickets and docs', 'Helpdesks, issue trackers and wikis sometimes reject WebP uploads or don’t show an inline preview.'],
  ['Keeping transparency', 'PNG keeps the alpha channel, so logos and cut-outs stay transparent. JPEG would fill it with a solid color.'],
  ['Lossless edits', 'PNG is lossless, so repeated saves don’t add compression artifacts the way JPEG does.'],
]

const faqs = [
  { question: 'How do I convert WebP to PNG?', answer: 'Drop one or more .webp files on the converter above, or click Choose images. Each file is converted to PNG straight away. Click Download next to a file, or Download all to save every PNG one after another.' },
  { question: 'Does converting WebP to PNG lose quality?', answer: 'No further quality is lost: PNG is lossless, so the PNG holds exactly the pixels the WebP decodes to. If the WebP was saved with lossy compression, those artifacts were already in the file and stay in the PNG.' },
  { question: 'Why is the PNG bigger than the WebP?', answer: 'WebP compresses much more efficiently, especially lossy WebP. PNG stores every pixel losslessly, so a PNG is often two to five times larger. That is expected. If size matters more than compatibility, keep the WebP or convert to JPEG instead.' },
  { question: 'Is transparency kept when converting WebP to PNG?', answer: 'Yes. PNG supports a full alpha channel, so transparent and semi-transparent areas in the WebP stay transparent in the PNG.' },
  { question: 'Are my images uploaded?', answer: 'No. The conversion happens on a canvas in your browser. Your WebP files never leave your device, which also means it works offline once the page has loaded.' },
]

export default function WebpToPngPage() {
  return (
    <ToolPageLayout meta={meta} current="webp-to-png" breadcrumb={{ name: 'WebP to PNG Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="WebP to PNG Converter" description="Convert WebP images to PNG in your browser. Batch convert, keep transparency, and resize if you need to. Nothing is uploaded." />
      <ToolFrame>
        <ImageConverter slug="webp-to-png" inputAccept="image/webp,.webp,image/*" defaultFormat="png" dropTitle="Drop WebP images here" dropHint="or choose files. Converts to PNG; other image formats work too." />
      </ToolFrame>
      <ToolSection id="when" pill="Why convert" title="When to convert WebP to PNG." subtitle="Compatibility, transparency and lossless editing.">
        <ToolTable caption="Reasons to convert WebP to PNG" columns={['Situation', 'Why PNG helps']} rows={whenToConvert} />
      </ToolSection>
      <ToolSection id="formats" pill="Reference" title="PNG vs JPEG vs WebP vs SVG." subtitle="What each image format is good at.">
        <ToolTable caption="Image formats compared" columns={formatColumns} rows={formatComparison} />
      </ToolSection>
    </ToolPageLayout>
  )
}
