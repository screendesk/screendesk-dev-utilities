import { CommandLineIcon, CursorArrowRaysIcon, Squares2X2Icon } from '@heroicons/react/24/outline'
import { KeyboardTestTool } from '@/components/KeyboardTestTool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/keyboard-test',
  title: 'Keyboard Tester: Test Every Key Online - Screendesk',
  description: 'Free online keyboard tester. Press each key to see it light up on a full US keyboard layout, find dead or stuck keys, and read event.key and event.code values. No download.',
  keywords: 'keyboard tester, keyboard test, key tester, test keyboard online, keyboard checker, stuck key test, event.code, keycode',
}

const steps = [
  { icon: CursorArrowRaysIcon, title: 'Focus the test area', copy: 'Click the keyboard. While it is focused, Tab, Space, arrows and F-keys are captured so they don’t scroll the page or move focus.' },
  { icon: Squares2X2Icon, title: 'Press every key', copy: 'Each key turns rose while held and grey once tested. Work row by row; any key that stays white did not register.' },
  { icon: CommandLineIcon, title: 'Check the details', copy: 'The last key panel shows event.key, event.code and location, useful for telling left from right modifiers or debugging shortcuts.' },
]

const fixes = [
  ['A key never lights up', 'Debris under the keycap, a failed switch, or a remapping tool. Clean with compressed air and check apps like Karabiner, PowerToys or vendor software.'],
  ['A key stays rose after release', 'The key is stuck or the keyup was lost (common with Cmd on macOS). Press it again; if it persists, the switch may be sticking.'],
  ['One press registers twice', 'Key chatter from a worn switch. Mechanical keyboards can often have that switch cleaned or replaced.'],
  ['Several keys fail together', 'Often a row or column fault in the keyboard matrix, or a loose internal ribbon cable on laptops.'],
  ['Wireless keyboard misses keys', 'Low battery or interference. Replace batteries and move the receiver closer with a USB extension.'],
  ['Fn, media or brightness keys missing', 'Many of these are handled by the keyboard or OS and never reach the browser. That is expected.'],
]

const faqs = [
  { question: 'How do I test my keyboard?', answer: 'Click the keyboard on this page, then press each key. Keys turn grey once they register and rose while held down. Any key that stays white has not been detected.' },
  { question: 'Why doesn’t the Fn key show up?', answer: 'The Fn key is usually handled inside the keyboard itself and never sent to the computer, so no browser-based tester can detect it. The same is true for many media and brightness keys.' },
  { question: 'Can I test keys like Cmd+W or Ctrl+T?', answer: 'Browser shortcuts that use Ctrl or Cmd are not blocked, so pressing them still triggers the browser. Press Ctrl or Cmd on its own to test the key without the shortcut.' },
  { question: 'What is the difference between event.key and event.code?', answer: 'event.key is the character or action the key produces with your current layout and modifiers, like “a” or “A”. event.code is the physical key position, like “KeyA”, regardless of layout. This tester highlights keys by event.code.' },
  { question: 'Does this work with non-US keyboards?', answer: 'Yes. Keys are matched by physical position, so a UK, German or French keyboard lights up the key in the same place. Extra keys such as the ISO key next to left Shift appear under “Other keys detected”.' },
]

export default function KeyboardTestPage() {
  return (
    <ToolPageLayout meta={meta} current="keyboard-test" breadcrumb={{ name: 'Keyboard Tester', href: meta.path }} faqs={faqs}>
      <ToolHero title="Keyboard Tester" description="Press each key to see it light up on a full keyboard layout and find dead, stuck or double-typing keys." />
      <ToolFrame><KeyboardTestTool /></ToolFrame>
      <ToolSection id="how" pill="How to test" title="Test every key in a minute." subtitle="Works with any physical keyboard.">
        <ToolPoints items={steps} />
      </ToolSection>
      <ToolSection id="troubleshooting" pill="Troubleshooting" title="What the results mean." subtitle="Common keyboard faults and fixes.">
        <ToolTable caption="Keyboard problems and fixes" columns={['Result', 'Likely cause and fix']} rows={fixes} />
      </ToolSection>
    </ToolPageLayout>
  )
}
