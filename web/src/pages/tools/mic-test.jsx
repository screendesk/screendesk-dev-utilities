import { AdjustmentsHorizontalIcon, MicrophoneIcon, PlayIcon } from '@heroicons/react/24/outline'
import { MicTestTool } from '@/components/MicTestTool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/mic-test',
  title: 'Mic Test: Online Microphone Test with Recording & Playback - Screendesk',
  description: 'Test your microphone online. See a live input level, pick the right mic, and record 5 seconds to play back how you sound. Free, private, works in Chrome, Edge, Firefox and Safari.',
  keywords: 'mic test, microphone test, online mic test, test my mic, mic test playback, mic test recording, microphone check, is my mic working',
}

const steps = [
  { icon: MicrophoneIcon, title: 'Allow access', copy: 'Click “Start mic test” and allow microphone access when your browser asks. Device names appear in the list once access is granted.' },
  { icon: AdjustmentsHorizontalIcon, title: 'Watch the level', copy: 'Speak at a normal volume. A working mic moves the bar with your voice. Most speech sits between -30 dB and -10 dB.' },
  { icon: PlayIcon, title: 'Record and listen', copy: 'Record 5 seconds and play it back. This is how you sound to others, so listen for echo, hiss, clipping or a muffled voice.' },
]

const permissions = [
  ['Chrome / Edge', 'Click the icon left of the address bar → Site settings → Microphone → Allow. Or open chrome://settings/content/microphone (edge://settings/content/microphone) and pick the right default device.'],
  ['Firefox', 'Click the permissions icon in the address bar and remove the “Blocked” microphone permission, then reload and allow again.'],
  ['Safari (Mac)', 'Safari → Settings → Websites → Microphone, and set this site to Allow or Ask.'],
  ['Windows 11 / 10', 'Settings → Privacy & security → Microphone: turn on “Microphone access” and “Let desktop apps access your microphone”. Then Settings → System → Sound → Input to choose the device and check its volume.'],
  ['macOS', 'System Settings → Privacy & Security → Microphone and turn on your browser. Then System Settings → Sound → Input to pick the device and raise the input level. Restart the browser after changing permissions.'],
  ['iPhone / iPad', 'Settings → Safari → Microphone → Ask or Allow. For Chrome on iOS: Settings → Chrome → Microphone.'],
  ['Android', 'Settings → Apps → your browser → Permissions → Microphone → Allow while using the app.'],
]

const problems = [
  ['Bar does not move', 'Wrong input selected, hardware mute switch on, or input volume at zero. Pick another device in the list and check the mute button on your headset.'],
  ['“In use by another app”', 'Close Zoom, Teams, Discord or other apps holding the mic, then click Try again.'],
  ['Playback is very quiet', 'Raise the input level in your OS sound settings and move closer to the mic.'],
  ['Playback sounds distorted', 'Input level is too high. Lower it until loud speech stays below about -6 dB.'],
  ['Echo or background noise', 'Use headphones, turn off speaker playback, and enable noise suppression in your OS or headset app.'],
]

const faqs = [
  { question: 'How do I test my mic?', answer: 'Click “Start mic test”, allow microphone access, and speak. If the level bar moves with your voice, your mic works. Then record 5 seconds and play it back to hear how you sound.' },
  { question: 'Can I hear my mic playback?', answer: 'Yes. Use “Record 5 seconds” and play the clip back. Recording first avoids the echo and feedback you get from live monitoring through speakers.' },
  { question: 'Is my recording uploaded?', answer: 'No. Audio is processed in your browser and the clip lives in memory only until you leave the page. Nothing is sent to Screendesk or anyone else.' },
  { question: 'Why does the browser say my microphone is blocked?', answer: 'Microphone access was denied for this site, or your operating system blocks the browser from using the mic. Follow the steps for your browser and OS above, then reload the page.' },
  { question: 'Why is my microphone not listed?', answer: 'Browsers only show device names after you grant access, and only list mics the system can see. Check the cable or Bluetooth connection, then look for the device in your OS sound settings.' },
]

export default function MicTestPage() {
  return (
    <ToolPageLayout meta={meta} current="mic-test" breadcrumb={{ name: 'Mic Test', href: meta.path }} faqs={faqs}>
      <ToolHero title="Mic Test" description="Check your microphone in seconds: see the live input level, choose the right device, and record a short clip to play back." />
      <ToolFrame><MicTestTool /></ToolFrame>
      <ToolSection id="how" pill="How it works" title="Test your microphone in three steps." subtitle="No download or sign-up.">
        <ToolPoints items={steps} />
      </ToolSection>
      <ToolSection id="permissions" pill="Permissions" title="Allow microphone access." subtitle="Steps for each browser and operating system.">
        <ToolTable caption="How to allow microphone access by browser and OS" columns={['Where', 'What to do']} rows={permissions} />
      </ToolSection>
      <ToolSection id="troubleshooting" pill="Troubleshooting" title="Mic not working?" subtitle="Match the symptom to the fix.">
        <ToolTable caption="Microphone problems and fixes" columns={['Symptom', 'What to try']} rows={problems} />
      </ToolSection>
    </ToolPageLayout>
  )
}
