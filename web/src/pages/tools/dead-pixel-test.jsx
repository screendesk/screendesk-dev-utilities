import { ArrowsPointingOutIcon, EyeIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { DeadPixelTestTool } from '@/components/DeadPixelTestTool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/dead-pixel-test',
  title: 'Dead Pixel Test: Check Your Screen for Dead & Stuck Pixels - Screendesk',
  description: 'Free full-screen dead pixel test. Cycle through black, white, red, green, blue and gray to find dead pixels, stuck pixels and backlight bleed on any monitor, laptop or phone.',
  keywords: 'dead pixel test, stuck pixel test, dead pixel checker, monitor test, screen test, backlight bleed test, pixel test',
}

const steps = [
  { icon: ArrowsPointingOutIcon, title: 'Go full screen', copy: 'Start the test and the display fills with one color. Turn brightness up and clean the screen so dust isn’t mistaken for a fault.' },
  { icon: MagnifyingGlassIcon, title: 'Scan each color', copy: 'Look slowly across the whole screen, including corners and edges, then press → for the next color. Each color reveals a different kind of fault.' },
  { icon: EyeIcon, title: 'Note what you find', copy: 'Write down the position and which colors show the dot. A dot that is wrong on every color is dead; one that only shows on some is stuck.' },
]

const types = [
  ['Dead pixel', 'Black on every color, most visible on white', 'Transistor failure. Permanent; usually a warranty case if you have more than the maker’s allowance.'],
  ['Stuck pixel', 'Always red, green or blue, most visible on black', 'A subpixel stuck on. Sometimes recovers with time or gentle pressure through a cloth with the screen off.'],
  ['Hot pixel', 'Always white, most visible on black', 'All subpixels stuck on. Same options as a stuck pixel.'],
  ['Backlight bleed', 'Bright patches near edges on black or gray', 'Uneven panel pressure. Common on IPS panels at some level; severe bleed may qualify for a return.'],
  ['Dust or debris', 'Dot that moves or wipes away', 'Not a pixel fault. Clean the screen with a microfiber cloth.'],
]

const faqs = [
  { question: 'How do I check for dead pixels?', answer: 'Click “Start full-screen test”, then step through each color with a click or the arrow keys. Look across the entire screen for dots that don’t match the background. Press Esc to exit.' },
  { question: 'What is the difference between a dead pixel and a stuck pixel?', answer: 'A dead pixel stays black because it gets no power. A stuck pixel stays lit in one color (red, green or blue) because a subpixel is stuck on. Stuck pixels sometimes recover; dead pixels usually don’t.' },
  { question: 'Can a stuck pixel be fixed?', answer: 'Sometimes. Leaving the display off for a while, or gently massaging the spot through a soft cloth with the screen off, occasionally frees it. Avoid pressing hard, which can create more damage.' },
  { question: 'Does this work on phones and tablets?', answer: 'Yes. Tap to change color. Some phone browsers, including Safari on iPhone, can’t go true full screen, so the test fills the browser window and shows an Exit button instead.' },
  { question: 'How many dead pixels are acceptable?', answer: 'It depends on the manufacturer. Most publish a pixel policy that sets how many dead or stuck pixels a panel can have before it qualifies for replacement. Check yours before you contact support.' },
]

export default function DeadPixelTestPage() {
  return (
    <ToolPageLayout meta={meta} current="dead-pixel-test" breadcrumb={{ name: 'Dead Pixel Test', href: meta.path }} faqs={faqs}>
      <ToolHero title="Dead Pixel Test" description="Fill your screen with solid colors to spot dead pixels, stuck pixels and backlight bleed on any monitor, laptop or phone." />
      <ToolFrame><DeadPixelTestTool /></ToolFrame>
      <ToolSection id="how" pill="How to test" title="Find dead pixels in three steps." subtitle="Takes about a minute.">
        <ToolPoints items={steps} />
      </ToolSection>
      <ToolSection id="types" pill="What you might see" title="Dead, stuck or something else?" subtitle="How to tell screen faults apart.">
        <ToolTable caption="Types of screen pixel faults" columns={['Fault', 'How it looks', 'What it means']} rows={types} />
      </ToolSection>
    </ToolPageLayout>
  )
}
