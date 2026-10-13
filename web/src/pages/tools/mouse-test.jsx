import { ArrowsUpDownIcon, CursorArrowRaysIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import { MouseTestTool } from '@/components/MouseTestTool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/mouse-test',
  title: 'Mouse Test: Check Mouse Buttons, Double-Click and Scroll Wheel Online - Screendesk',
  description: 'Free online mouse test. Check left, right, middle, back and forward buttons, detect double-click problems, and test the scroll wheel in your browser. No download.',
  keywords: 'mouse test, mouse button test, mouse click test, double click test, scroll wheel test, mouse tester online, right click test',
}

const checks = [
  { icon: CursorArrowRaysIcon, title: 'Buttons', copy: 'Press each button once inside the test area. Each one should add exactly one to its counter. If a single press adds two, the switch is bouncing.' },
  { icon: ArrowsUpDownIcon, title: 'Scroll wheel', copy: 'Roll the wheel slowly one notch at a time. Scrolling down should never add to the up counter. Jumps in the wrong direction point to a dirty or worn encoder.' },
  { icon: WrenchScrewdriverIcon, title: 'Double-click', copy: 'Single-click slowly ten times. If the double-click counter goes up, your mouse is sending accidental double-clicks, a common fault on worn switches.' },
]

const fixes = [
  ['Clicks register twice', 'Worn switch or double-click speed set too fast', 'Lower double-click speed in OS settings; try another USB port; replace the mouse if it persists'],
  ['Right-click does nothing', 'Button remapped by driver or OS', 'Check the vendor app (Logitech Options+, Razer Synapse) and swap-buttons setting'],
  ['Back/forward not detected', 'Driver intercepts side buttons', 'Set the side buttons to “Back/Forward” or “Generic button” in the vendor app'],
  ['Scroll jumps the wrong way', 'Dust in the wheel encoder', 'Blow out the wheel with compressed air; check “natural scrolling” settings'],
  ['Wireless mouse lags', 'Low battery or interference', 'Replace batteries, move the receiver closer with a USB extender'],
]

const faqs = [
  { question: 'How do I test my mouse buttons?', answer: 'Move your pointer into the click test area and press each button. The counters show left, middle, right, back and forward presses. A button that is held down is highlighted, and buttons that have registered at least once turn grey.' },
  { question: 'How can I tell if my mouse double-clicks by itself?', answer: 'Click slowly and deliberately in the test area. Every slow single click should only raise the left counter. If the double-click counter rises too, the switch is sending two clicks for one press.' },
  { question: 'Why are my back and forward buttons not detected?', answer: 'Some mouse software remaps the side buttons to keyboard shortcuts or other actions, so the browser never sees them as mouse buttons. Reset them to their default back/forward function in the vendor app and test again.' },
  { question: 'Does right-click open a menu on this page?', answer: 'Not inside the test area. The context menu and middle-click autoscroll are disabled there, and back/forward navigation is blocked where the browser allows it, so every press can be counted. Outside the area your browser works as usual.' },
  { question: 'Is anything sent to a server?', answer: 'No. The test runs entirely in your browser and nothing about your clicks is stored or uploaded.' },
]

export default function MouseTestPage() {
  return (
    <ToolPageLayout meta={meta} current="mouse-test" breadcrumb={{ name: 'Mouse Test', href: meta.path }} faqs={faqs}>
      <ToolHero title="Mouse Test" description="Check every mouse button, catch accidental double-clicks and test the scroll wheel in your browser." />
      <ToolFrame><MouseTestTool /></ToolFrame>
      <ToolSection id="how" pill="How to test" title="Three checks for a healthy mouse." subtitle="Takes under a minute.">
        <ToolPoints items={checks} />
      </ToolSection>
      <ToolSection id="fixes" pill="Troubleshooting" title="Common mouse problems." subtitle="What the test shows and what to try.">
        <ToolTable caption="Common mouse problems and fixes" columns={['Symptom', 'Likely cause', 'What to try']} rows={fixes} />
      </ToolSection>
    </ToolPageLayout>
  )
}
