import { AdjustmentsHorizontalIcon, ArrowsRightLeftIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline'
import { SpeakerTestTool } from '@/components/SpeakerTestTool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/speaker-test',
  title: 'Speaker & Headphone Test (Left/Right Audio Test) - Screendesk',
  description: 'Free online speaker and headphone test. Play left, right and both channel tones, run a 20 Hz to 20 kHz frequency sweep, and check your audio output in your browser.',
  keywords: 'speaker test, audio test, headphone test, left right audio test, left right speaker test, stereo test, frequency sweep test, sound test',
}

const checks = [
  { icon: ArrowsRightLeftIcon, title: 'Left and right', copy: 'Play the left tone, then the right. Each should come only from its own side. If both play from the same side, the channels are swapped or the output is mono.' },
  { icon: AdjustmentsHorizontalIcon, title: 'Frequency range', copy: 'Run the sweep and note where the tone becomes audible and where it disappears. Small laptop speakers often start around 150–200 Hz.' },
  { icon: SpeakerWaveIcon, title: 'Rattles and distortion', copy: 'Play the 100 Hz tone at moderate volume. Buzzing or rattling points to a loose speaker, damaged driver or something vibrating nearby.' },
]

const fixes = [
  ['No sound at all', 'Check the system volume and mute, then the output device. Windows: Settings → System → Sound → Output. macOS: System Settings → Sound → Output. Also check the tab is not muted (right-click the tab).'],
  ['Sound plays from the wrong device', 'Pick the right output in your OS sound settings. Bluetooth headphones sometimes connect in a “hands-free” mode with poor quality; choose the stereo profile instead.'],
  ['Left and right are swapped', 'Check headphones are worn the right way round (L/R marks). On Windows and macOS, look for a balance slider in sound settings and centre it.'],
  ['Only one side plays', 'Re-seat or replace the cable, test the other device with the same headphones, and turn off “Mono audio” in accessibility settings.'],
  ['Crackling or distortion', 'Lower the volume, disable audio enhancements (Windows: device properties → Advanced), and update audio drivers.'],
]

const faqs = [
  { question: 'How do I test my speakers?', answer: 'Click “Both” to play a steady tone through both speakers, then “Left” and “Right” to check each channel separately. Use the frequency sweep to hear how low and how high your speakers can play.' },
  { question: 'How do I do a left/right headphone test?', answer: 'Put your headphones on and click “Left”. The tone should only be in your left ear. Then click “Right”. If the sides are reversed, check the L and R marks on the headphones and the balance setting on your device.' },
  { question: 'What frequencies can humans hear?', answer: 'Roughly 20 Hz to 20 kHz, though the upper limit drops with age and many adults stop hearing tones above 15–17 kHz. If the sweep fades out early it may be your hearing, not your speakers.' },
  { question: 'Why do I hear nothing at the start of the sweep?', answer: 'Very low frequencies need large drivers. Laptop, phone and small desktop speakers usually cannot reproduce anything below about 100–200 Hz, so the tone appears partway through.' },
  { question: 'Is the test safe for my headphones and ears?', answer: 'Start with your system volume low and raise it slowly. Pure tones, especially high ones, can sound louder than music at the same volume. The test volume slider defaults to 30%.' },
]

export default function SpeakerTestPage() {
  return (
    <ToolPageLayout meta={meta} current="speaker-test" breadcrumb={{ name: 'Speaker & Headphone Test', href: meta.path }} faqs={faqs}>
      <ToolHero title="Speaker & Headphone Test" description="Play left, right and stereo test tones, run a 20 Hz–20 kHz frequency sweep, and check your speakers or headphones in seconds." />
      <ToolFrame><SpeakerTestTool /></ToolFrame>
      <ToolSection id="checks" pill="What to listen for" title="Three checks for speakers and headphones." subtitle="Use the tones above.">
        <ToolPoints items={checks} />
      </ToolSection>
      <ToolSection id="troubleshooting" pill="Troubleshooting" title="No sound or wrong side?" subtitle="Fixes for Windows, macOS and headphones.">
        <ToolTable caption="Speaker and headphone problems and fixes" columns={['Problem', 'What to try']} rows={fixes} />
      </ToolSection>
    </ToolPageLayout>
  )
}
