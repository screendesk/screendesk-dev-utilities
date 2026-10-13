import { ImageConverter } from '@/components/tools/image/ImageConverter'
import { formatColumns, formatComparison } from '@/components/tools/image/imageUtils'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/png-to-webp',
  title: 'PNG & JPG to WebP Converter — Free, Batch, No Upload | Screendesk',
  description: 'Convert PNG and JPG to WebP online for free. Batch convert images, set WebP quality, resize, and compare file sizes before you download. Runs in your browser.',
  keywords: 'png to webp, jpg to webp, webp converter, convert png to webp, convert jpg to webp, jpeg to webp, image to webp',
}

const qualityGuide = [
  ['90–100', 'Close to the original; noticeably larger files', 'Product shots, screenshots with fine text'],
  ['75–85', 'Hard to tell apart from the original at normal size', 'Most web images and screenshots'],
  ['50–70', 'Visible softening on edges and gradients when you zoom in', 'Thumbnails, background images'],
  ['Below 50', 'Blocky artifacts around text and lines', 'Tiny previews only'],
]

const faqs = [
  { question: 'How do I convert PNG or JPG to WebP?', answer: 'Drop your PNG, JPG or GIF files on the converter, keep the output format on WebP, and adjust the quality slider. Each file shows its original and WebP size side by side. Download them one by one or with Download all.' },
  { question: 'Is WebP smaller than PNG and JPG?', answer: 'Usually, yes. Google reports lossy WebP files as roughly 25–34% smaller than comparable JPEGs, and lossless WebP as about 26% smaller than PNG. The saving depends on the image, so the converter shows the actual before and after size of each file.' },
  { question: 'Does WebP support transparency?', answer: 'Yes. Unlike JPEG, WebP keeps the alpha channel, so transparent PNGs such as logos and UI cut-outs stay transparent after conversion.' },
  { question: 'Why is my output saved as PNG instead of WebP?', answer: 'Your browser can display WebP but can’t create it from a canvas. This is the case in Safari. The converter tells you and saves PNG instead. Open the page in Chrome, Edge or Firefox to produce WebP files.' },
  { question: 'Can every browser show WebP images?', answer: 'All current versions of Chrome, Edge, Firefox, Opera and Safari display WebP. Safari added support in version 14 (macOS Big Sur and iOS 14). For very old browsers, serve a PNG or JPEG fallback with the <picture> element.' },
]

export default function PngToWebpPage() {
  return (
    <ToolPageLayout meta={meta} current="png-to-webp" breadcrumb={{ name: 'PNG & JPG to WebP Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="PNG & JPG to WebP Converter" description="Convert PNG, JPG and GIF images to WebP in your browser. Set the quality, resize, and see how much smaller each file gets. Nothing is uploaded." />
      <ToolFrame>
        <ImageConverter slug="png-to-webp" inputAccept="image/png,image/jpeg,image/gif,.png,.jpg,.jpeg,.gif,image/*" defaultFormat="webp" dropTitle="Drop PNG or JPG images here" dropHint="or choose files. PNG, JPG and GIF convert to WebP." />
      </ToolFrame>
      <ToolSection id="quality" pill="Quality setting" title="Choosing a WebP quality." subtitle="Start at 80 and compare.">
        <ToolTable caption="WebP quality guide" columns={['Quality', 'What you get', 'Good for']} rows={qualityGuide} />
      </ToolSection>
      <ToolSection id="formats" pill="Reference" title="PNG vs JPEG vs WebP vs SVG." subtitle="What each image format is good at.">
        <ToolTable caption="Image formats compared" columns={formatColumns} rows={formatComparison} />
      </ToolSection>
    </ToolPageLayout>
  )
}
