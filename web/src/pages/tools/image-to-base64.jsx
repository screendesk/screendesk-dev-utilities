import { ImageBase64Tool } from '@/components/tools/image/ImageBase64Tool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/image-to-base64',
  title: 'Image to Base64 Converter & Base64 to Image | Screendesk',
  description: 'Convert an image to Base64 as a data URL, raw string, CSS background or HTML img tag, or decode Base64 back to an image you can preview and download. Nothing is uploaded.',
  keywords: 'image to base64, base64 to image, convert image to base64, png to base64, jpg to base64, base64 image decoder, data url, base64 to png',
}

const outputs = [
  ['Data URL', 'data:image/png;base64,iVBOR…', 'An <img src>, a JSON field, or anywhere a URL is expected'],
  ['Base64', 'iVBORw0KGgoAAAANSUhEUg…', 'APIs that take the file content and the type separately'],
  ['CSS', 'background-image: url("data:image/png;base64,…");', 'Small icons and patterns in a stylesheet'],
  ['HTML', '<img src="data:image/png;base64,…" alt="…" width="…" height="…" />', 'Email templates and self-contained HTML files'],
]

const whenToInline = [
  ['Inline it', 'Tiny icons and placeholders (a few KB), single-file HTML exports, email signatures, test fixtures'],
  ['Keep it a file', 'Photos, screenshots and anything over roughly 10 KB: Base64 adds about 33% and the browser can’t cache it separately'],
]

const faqs = [
  { question: 'How do I convert an image to Base64?', answer: 'Choose Image to Base64, then drop or pick an image. The tool reads it in your browser and shows the result as a data URL, a raw Base64 string, a CSS background rule or an HTML img tag. Click Copy to take the full output.' },
  { question: 'How do I convert Base64 to an image?', answer: 'Choose Base64 to image and paste either a full data URL (data:image/png;base64,…) or just the Base64 string. The tool detects the image type from its first bytes, shows a preview with the dimensions, and lets you download the file.' },
  { question: 'Why is the Base64 string bigger than the image?', answer: 'Base64 represents every 3 bytes as 4 text characters, so the encoded image is about 33% larger than the file. That is why inlining only pays off for very small images.' },
  { question: 'Which image types are detected when there’s no data: prefix?', answer: 'PNG, JPEG, GIF, WebP, BMP, ICO and SVG are recognised from their file signature. For other formats, add a prefix such as data:image/avif;base64, so the browser knows how to display it.' },
  { question: 'Is my image uploaded anywhere?', answer: 'No. Encoding and decoding happen entirely in your browser. The image and the Base64 you paste never leave your device.' },
]

export default function ImageToBase64Page() {
  return (
    <ToolPageLayout meta={meta} current="image-to-base64" breadcrumb={{ name: 'Image to Base64 Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="Image to Base64 Converter" description="Encode images as Base64 data URLs, CSS or HTML, or decode Base64 back to an image you can preview and download. Everything runs in your browser." />
      <ToolFrame><ImageBase64Tool /></ToolFrame>
      <ToolSection id="outputs" pill="Output types" title="Four ways to use a Base64 image." subtitle="Pick the one that matches where it goes.">
        <ToolTable caption="Base64 image output types" columns={['Output', 'Looks like', 'Use it in']} rows={outputs} />
      </ToolSection>
      <ToolSection id="inline" pill="When to inline" title="Base64 or a regular file?" subtitle="Inlining trades caching for one fewer request.">
        <ToolTable caption="When to inline images as Base64" columns={['Choice', 'When']} rows={whenToInline} />
      </ToolSection>
    </ToolPageLayout>
  )
}
