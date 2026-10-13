import { HandRaisedIcon, Squares2X2Icon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline'
import { TouchScreenTestTool } from '@/components/TouchScreenTestTool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/touch-screen-test',
  title: 'Touch Screen Test: Check Multi-Touch & Dead Zones Online - Screendesk',
  description: 'Free online touch screen test. Draw with several fingers to check multi-touch, see how many touch points your screen supports, and fill a grid to find dead zones.',
  keywords: 'touch screen test, touchscreen test, multi touch test, touch screen dead zone test, digitizer test, touch test online',
}

const steps = [
  { icon: ArrowsPointingOutIcon, title: 'Go full screen', copy: 'Use “Full screen” so you can reach the edges and corners, where digitizer faults often start. Switch before you start drawing, since resizing clears the area.' },
  { icon: Squares2X2Icon, title: 'Fill the grid', copy: 'Draw slow lines across the whole area until every cell turns grey. A cell that won’t fill, or a line that breaks in the same place, marks a dead zone.' },
  { icon: HandRaisedIcon, title: 'Test multi-touch', copy: 'Put several fingers down at once. Each touch gets a numbered ring and “Max at once” shows how many your screen tracked together.' },
]

const fixes = [
  ['Lines break in one area', 'Possible digitizer damage. Remove the screen protector and test again; a cracked or lifted protector often causes this.'],
  ['Touches register in the wrong place', 'Recalibrate if your OS offers it (Windows: Control Panel → Tablet PC Settings → Calibrate). Restart the device.'],
  ['Phantom touches with no finger', 'Clean the screen, unplug the charger (cheap chargers cause noise), and remove cases that press on the edges.'],
  ['Fewer touch points than expected', 'Some screens track only 2–5 points. Compare with “Device reports” to see what the hardware claims.'],
  ['No response at all', 'Check that touch input is enabled in device settings or Device Manager (Windows: HID-compliant touch screen).'],
]

const faqs = [
  { question: 'How do I test my touch screen?', answer: 'Draw across the touch area with your finger until every grid cell turns grey. Cells that won’t fill point to dead zones. Use full screen to test the edges too.' },
  { question: 'How many touch points does my screen support?', answer: 'Put as many fingers on the screen as you can. “Max at once” shows how many were tracked together, and “Device reports” shows the number your browser says the hardware supports.' },
  { question: 'Can I test with a stylus or mouse?', answer: 'Yes. The test uses pointer events, so a stylus, pen or mouse also draws. The last input type is shown under the stats.' },
  { question: 'Why does the page not scroll inside the test area?', answer: 'Scrolling and pinch-zoom are disabled inside the area so every touch is drawn. Scroll the page from outside the area.' },
  { question: 'Is anything recorded or uploaded?', answer: 'No. Drawing happens on a canvas in your browser and is cleared when you leave the page.' },
]

export default function TouchScreenTestPage() {
  return (
    <ToolPageLayout meta={meta} current="touch-screen-test" breadcrumb={{ name: 'Touch Screen Test', href: meta.path }} faqs={faqs}>
      <ToolHero title="Touch Screen Test" description="Draw with one or more fingers to check multi-touch, count touch points, and find dead zones on your phone, tablet or touchscreen laptop." />
      <ToolFrame><TouchScreenTestTool /></ToolFrame>
      <ToolSection id="how" pill="How to test" title="Check your touch screen in three steps." subtitle="Works on phones, tablets and touch laptops.">
        <ToolPoints items={steps} />
      </ToolSection>
      <ToolSection id="troubleshooting" pill="Troubleshooting" title="Touch problems and fixes." subtitle="Match what you see to what to try.">
        <ToolTable caption="Touch screen problems and fixes" columns={['Symptom', 'What to try']} rows={fixes} />
      </ToolSection>
    </ToolPageLayout>
  )
}
