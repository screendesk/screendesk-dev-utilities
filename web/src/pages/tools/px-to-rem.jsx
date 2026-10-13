import { PxRemConverter } from '@/components/tools/convert/PxRemConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/px-to-rem',
  title: 'PX to REM Converter (and REM to PX) — Free CSS Tool | Screendesk',
  description: 'Convert px to rem and rem to px with any root font size. Includes a 1–96px conversion table, plus em, pt, vw, and percent equivalents for CSS. Runs in your browser.',
  keywords: 'px to rem, rem to px, px to rem converter, rem to px converter, pixel to rem, css rem calculator, px to em, px to pt, px to vw',
}

const units = [
  ['px', 'A CSS pixel, 1/96 of an inch', 'Borders, shadows, and details that should not scale with text.'],
  ['rem', 'Multiple of the root (html) font size', 'Font sizes, spacing, and layout. Respects the visitor’s browser font-size setting.'],
  ['em', 'Multiple of the parent element’s font size', 'Padding that should scale with a component’s own text. Compounds when nested: 1.2em inside 1.2em is 1.44× the root.'],
  ['pt', 'A point, 1/72 of an inch (1px = 0.75pt)', 'Print stylesheets and handing values to designers who work in points.'],
  ['vw', '1% of the viewport width', 'Fluid type and full-bleed layouts. Combine with rem in clamp() so text never gets too small to read.'],
  ['%', 'Relative to the parent (font-size: % uses the parent font size)', 'Widths in fluid layouts; font-size: 62.5% on html makes 1rem = 10px.'],
]

const scale = [
  ['text-xs', '0.75rem', '12px'],
  ['text-sm', '0.875rem', '14px'],
  ['text-base', '1rem', '16px'],
  ['text-lg', '1.125rem', '18px'],
  ['text-xl', '1.25rem', '20px'],
  ['text-2xl', '1.5rem', '24px'],
  ['text-3xl', '1.875rem', '30px'],
  ['text-4xl', '2.25rem', '36px'],
  ['text-5xl', '3rem', '48px'],
  ['text-6xl', '3.75rem', '60px'],
]

const faqs = [
  { question: 'How do I convert px to rem?', answer: 'Divide the pixel value by the root font size. With the browser default of 16px, 24px ÷ 16 = 1.5rem and 14px ÷ 16 = 0.875rem. If your stylesheet sets a different font-size on the html element, enter it as the root font size above and every value, including the 1–96px table, updates.' },
  { question: 'How do I convert rem to px?', answer: 'Multiply the rem value by the root font size: 1.5rem × 16 = 24px, and 2.25rem × 16 = 36px. Type into the Rem field above to convert in that direction.' },
  { question: 'What is the difference between rem and em?', answer: 'rem is always relative to the root html element’s font size, so 1rem is the same everywhere on the page. em is relative to the font size of the element’s parent, so it compounds when elements are nested. Use rem for predictable sizing and em when spacing should scale with a component’s own text.' },
  { question: 'Why use rem instead of px for font sizes?', answer: 'Visitors can change the default font size in their browser settings, and rem values follow that choice while px values ignore it. Using rem for type and spacing keeps your layout readable for people who need larger text, which also helps you meet WCAG text-resize guidance.' },
  { question: 'Should I set html { font-size: 62.5% }?', answer: 'It makes 1rem equal 10px at the default browser setting, so mental math is easier (1.4rem = 14px). It still respects the visitor’s font-size setting because it is a percentage. The trade-off is that third-party components expecting 1rem = 16px will render smaller, so set the root font size to 10 here if you use it.' },
]

export default function PxToRemPage() {
  return (
    <ToolPageLayout meta={meta} current="px-to-rem" breadcrumb={{ name: 'PX to REM Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="PX to REM Converter" description="Convert px to rem and rem to px at any root font size, with em, pt, and vw equivalents and a full 1–96px table." />
      <ToolFrame><PxRemConverter /></ToolFrame>
      <ToolSection id="units" pill="CSS units" title="px, rem, em, pt, and vw compared." subtitle="What each unit is relative to, and when to use it.">
        <ToolTable caption="CSS length units" columns={['Unit', 'Relative to', 'Use it for']} rows={units} />
      </ToolSection>
      <ToolSection id="scale" pill="Reference" title="A common type scale in rem and px." subtitle="Tailwind CSS font sizes at a 16px root.">
        <ToolTable caption="Tailwind CSS font sizes in rem and px" columns={['Class', 'rem', 'px']} rows={scale} />
      </ToolSection>
    </ToolPageLayout>
  )
}
