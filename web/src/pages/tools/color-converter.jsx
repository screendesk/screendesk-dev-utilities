import { ColorConverter } from '@/components/tools/convert/ColorConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/color-converter',
  title: 'Color Converter: RGB to HEX, HEX to RGB, HSL, OKLCH | Screendesk',
  description: 'Convert colors between HEX, RGB, RGBA, HSL, HSV and OKLCH instantly. Pick a color, copy any format, and check WCAG contrast against white and black. Free, runs in your browser.',
  keywords: 'color converter, rgb to hex, hex to rgb, hex to hsl, rgb to hsl, oklch converter, rgba to hex, color contrast checker',
}

const formats = [
  ['HEX', '#e11d48, #e11d4880', 'Two hex digits each for red, green, blue (and optionally alpha). #rgb is shorthand for #rrggbb.'],
  ['RGB / RGBA', 'rgb(225, 29, 72), rgb(225 29 72 / 50%)', 'Each channel 0–255. CSS Color 4 allows spaces and a slash before alpha; rgba() is an alias of rgb().'],
  ['HSL', 'hsl(347, 77%, 50%)', 'Hue angle 0–360, saturation and lightness as percentages. Easy to make tints by changing lightness.'],
  ['HSV / HSB', 'hsv(347, 87%, 88%)', 'Used by design tools such as Figma and Photoshop color pickers. Not a CSS function.'],
  ['OKLCH', 'oklch(58.58% 0.222 17.58)', 'Perceptual lightness, chroma and hue. Equal steps in lightness look equal, which makes palettes and dark modes predictable.'],
]

const howTo = [
  ['RGB to HEX', 'rgb(225, 29, 72)', '225 → E1, 29 → 1D, 72 → 48, so #E11D48. Divide each channel by 16: the quotient and remainder are the two hex digits.'],
  ['HEX to RGB', '#3B82F6', '3B → 3×16 + 11 = 59, 82 → 130, F6 → 246, so rgb(59, 130, 246).'],
  ['HEX alpha', '#00000080', '80 hex = 128, and 128 / 255 ≈ 0.5, so rgba(0, 0, 0, 0.5).'],
  ['Shorthand HEX', '#0af', 'Each digit is doubled: #00aaff, which is rgb(0, 170, 255).'],
]

const contrast = [
  ['AA, normal text', '4.5:1', 'Body copy under 18pt (24px), or under 14pt (about 18.7px) bold.'],
  ['AA, large text', '3:1', 'Text at least 18pt, or 14pt bold. Also the minimum for icons and UI components.'],
  ['AAA, normal text', '7:1', 'Enhanced contrast for body copy.'],
  ['AAA, large text', '4.5:1', 'Enhanced contrast for large text.'],
]

const faqs = [
  { question: 'How do I convert RGB to HEX?', answer: 'Convert each of the red, green and blue values (0–255) to a two-digit hexadecimal number and join them after a #. For example rgb(225, 29, 72) becomes E1, 1D and 48, so #E11D48. Paste any rgb() value above and the HEX code appears instantly, ready to copy.' },
  { question: 'How do I convert HEX to RGB?', answer: 'Split the code into pairs and read each pair as a base-16 number: #3B82F6 is 3B = 59, 82 = 130, F6 = 246, so rgb(59, 130, 246). An 8-digit HEX code adds an alpha pair, where 00 is transparent and FF is opaque.' },
  { question: 'What is OKLCH and why use it?', answer: 'OKLCH is a perceptual color space in CSS Color 4: L is lightness, C is chroma (colorfulness) and H is hue. Unlike HSL, two colors with the same L look equally light, so it is better for generating palettes and accessible color scales. Some OKLCH colors fall outside the sRGB range screens show by default; the converter warns you and shows the nearest sRGB color.' },
  { question: 'How is the contrast ratio calculated?', answer: 'The tool uses the WCAG 2 formula: (L1 + 0.05) / (L2 + 0.05), where L1 and L2 are the relative luminance of the lighter and darker color. Ratios run from 1:1 to 21:1. Semi-transparent colors are blended over the background first, which is how they appear on screen.' },
  { question: 'Is anything uploaded?', answer: 'No. Every conversion and contrast check runs in your browser with JavaScript. Nothing you enter is sent to a server.' },
]

export default function ColorConverterPage() {
  return (
    <ToolPageLayout meta={meta} current="color-converter" breadcrumb={{ name: 'Color Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="Color Converter" description="Convert RGB to HEX, HEX to RGB, and any color to HSL, HSV and OKLCH. Check WCAG contrast as you go." />
      <ToolFrame><ColorConverter /></ToolFrame>
      <ToolSection id="formats" pill="Reference" title="CSS color formats." subtitle="What each notation means and when to use it.">
        <ToolTable caption="Color formats" columns={['Format', 'Example', 'Notes']} rows={formats} />
      </ToolSection>
      <ToolSection id="how-to" pill="By hand" title="Converting HEX and RGB manually." subtitle="Worked examples, plus the WCAG contrast thresholds.">
        <ToolTable caption="HEX and RGB conversion examples" columns={['Conversion', 'Input', 'How it works']} rows={howTo} />
        <ToolTable caption="WCAG 2 contrast requirements" columns={['Level', 'Minimum ratio', 'Applies to']} rows={contrast} />
      </ToolSection>
    </ToolPageLayout>
  )
}
