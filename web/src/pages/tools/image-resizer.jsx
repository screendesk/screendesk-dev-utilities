import { ImageConverter } from '@/components/tools/image/ImageConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/image-resizer',
  title: 'Image Resizer — Resize Images Online in Pixels or Percent | Screendesk',
  description: 'Resize images online for free. Set exact pixels or a percentage, lock the aspect ratio, use presets for 1920×1080, Open Graph and Instagram, and batch resize. Nothing is uploaded.',
  keywords: 'image resizer, resize image, resize image online, photo resizer, resize png, resize jpg, resize screenshot, change image size',
}

const presets = [
  { label: 'Full HD', width: 1920, height: 1080 },
  { label: 'HD', width: 1280, height: 720 },
  { label: 'Open Graph', width: 1200, height: 630 },
  { label: 'Square post', width: 1080, height: 1080 },
  { label: 'Web width', width: 800 },
]

const sizeGuide = [
  ['1920×1080', '16:9', 'Full HD screenshots, slides, video thumbnails, desktop wallpapers'],
  ['1280×720', '16:9', 'HD screenshots for docs and help-center articles; YouTube thumbnails'],
  ['1200×630', '1.91:1', 'Open Graph link previews on LinkedIn, Facebook, Slack and X'],
  ['1080×1080', '1:1', 'Square social posts (Instagram feed, LinkedIn)'],
  ['800px wide', 'Original', 'Inline images in blog posts, emails and knowledge-base articles'],
]

const faqs = [
  { question: 'How do I resize an image?', answer: 'Drop one or more images on the resizer. Type a width or height in pixels (the other side follows when the lock is on), drag the percentage slider, or click a preset. Each image shows its new size; click Download, or Download all for a batch.' },
  { question: 'How do I resize without stretching the image?', answer: 'Keep the aspect-ratio lock on. Each image is then scaled to fit inside the width and height you set and keeps its proportions. Unlock it only when you want the exact dimensions and don’t mind the image being stretched.' },
  { question: 'Does resizing reduce image quality?', answer: 'Making an image smaller keeps it sharp and usually shrinks the file a lot. Making it larger can’t add detail, so enlarged photos and screenshots look soft. For JPEG and WebP output, the quality slider also affects the result.' },
  { question: 'Which format is the resized image saved in?', answer: '“Keep format” saves JPEG as JPEG and WebP as WebP. PNG, GIF and other formats are saved as PNG. You can also pick PNG, JPEG or WebP for every file.' },
  { question: 'What is the best size for a screenshot in a help article?', answer: 'Around 1280–1600px wide is a good balance: sharp on retina screens when displayed at half size, without heavy files. Crop to the relevant part of the screen first, and save UI screenshots as PNG or WebP so text stays crisp.' },
]

export default function ImageResizerPage() {
  return (
    <ToolPageLayout meta={meta} current="image-resizer" breadcrumb={{ name: 'Image Resizer', href: meta.path }} faqs={faqs}>
      <ToolHero title="Image Resizer" description="Resize images to exact pixels or a percentage, with the aspect ratio locked and presets for common screen and social sizes. Batch resize in your browser; nothing is uploaded." />
      <ToolFrame>
        <ImageConverter slug="image-resizer" defaultFormat="original" formatOptions={['original', 'png', 'jpeg', 'webp']} resizeFocus presets={presets} defaultSvgScale={1} dropTitle="Drop images to resize" dropHint="or choose files. PNG, JPEG, WebP, GIF, SVG and more." />
      </ToolFrame>
      <ToolSection id="sizes" pill="Common sizes" title="Image sizes for screens and social." subtitle="The presets above, and where each is used.">
        <ToolTable caption="Common image sizes" columns={['Size', 'Aspect ratio', 'Used for']} rows={sizeGuide} />
      </ToolSection>
    </ToolPageLayout>
  )
}
