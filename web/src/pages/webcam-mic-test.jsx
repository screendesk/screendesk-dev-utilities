import { useEffect, useState } from 'react'
import { MicrophoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { WebcamTest } from '@/components/WebcamTest'
import { MicrophoneTest } from '@/components/MicrophoneTest'
import { Badge, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { ToolFrame, ToolHero, ToolPageLayout } from '@/components/tools/ToolLayout'

// Open-source version of screendesk.io/webcam-mic-test: the same device test without the marketing sections.
// The DeviceTest body is copied from the marketing page; this file is not overwritten by the sync.

const meta = {
  path: '/webcam-mic-test',
  title: 'Webcam & Microphone Test | Screendesk Dev Utilities',
  description: 'Test your webcam and microphone in your browser. Nothing is recorded or uploaded.',
}

const faqs = [
  { question: 'How do I allow camera and microphone access in my browser?', answer: 'When you first visit this page, your browser should show a permission prompt asking for access to your camera and microphone. Click "Allow" to grant permission. If you accidentally denied permission, click the camera/microphone icon in your browser\'s address bar to change the settings. You may need to refresh the page after changing permissions.' },
  { question: 'Why can\'t I see my webcam feed?', answer: 'There could be several reasons: 1) Your browser doesn\'t have permission to access your camera, 2) Another application is currently using your camera, 3) Your camera is disabled in your system settings, 4) Your camera drivers need updating, or 5) Your camera hardware is malfunctioning. Try refreshing the page, checking your browser permissions, closing other applications that might be using your camera, and ensuring your camera is properly connected and enabled in your system settings.' },
  { question: 'How do I switch between multiple cameras or microphones?', answer: 'If you have multiple cameras or microphones connected to your device, you\'ll see a dropdown menu in each test section. Click on the dropdown to see all available devices, then select the one you want to use. If your device isn\'t listed, it might not be properly connected or recognized by your system.' },
  { question: 'Why is my microphone not picking up sound?', answer: 'Check if your microphone is muted in your system settings or physically muted if it has a mute button. Ensure the correct microphone is selected in the dropdown menu. Verify that no other applications are using your microphone. Try speaking louder or moving closer to the microphone. If you\'re using a headset, make sure it\'s properly connected and selected as the input device.' },
  { question: 'Is this webcam test secure?', answer: 'Yes, this test runs entirely in your browser. No video or audio data is sent to our servers or stored anywhere. Your privacy is protected. The test uses the MediaDevices API, which is a standard browser feature that requires your explicit permission to access your camera and microphone.' },
  { question: 'Which browsers are supported for this webcam and microphone test?', answer: 'This test works best on modern browsers including Google Chrome, Mozilla Firefox, Microsoft Edge, and Safari. Make sure your browser is updated to the latest version for the best experience. Some older browsers may not support the required Web APIs for accessing camera and microphone devices.' },
  { question: 'Why do I need to test my webcam and microphone before recording?', answer: 'Testing your devices before starting a recording or joining a video call helps ensure everything is working properly. This prevents frustrating situations where you discover mid-recording that your camera is showing a black screen or your microphone isn\'t picking up audio. It also allows you to select the best quality devices if you have multiple options available.' },
  { question: 'How can I improve my webcam video quality?', answer: 'To improve video quality: 1) Ensure you have good lighting - natural light from windows works well, or use a desk lamp positioned in front of you, 2) Clean your camera lens with a microfiber cloth, 3) Position your camera at eye level for the most flattering angle, 4) Use a higher quality external webcam if your built-in camera is low resolution, 5) Check if your camera has software settings that allow you to adjust brightness, contrast, or resolution.' },
  { question: 'How can I improve my microphone audio quality?', answer: 'To improve audio quality: 1) Reduce background noise by finding a quiet location, 2) Use a headset with a built-in microphone rather than your computer\'s built-in mic, 3) Position the microphone close to your mouth but not directly in front (to avoid breathing sounds), 4) Speak clearly and at a consistent volume, 5) Consider using a dedicated USB microphone for professional-quality audio, 6) Check your system\'s sound settings to ensure the microphone input level is properly adjusted.' },
  { question: 'What should I do if my devices work here but not in other applications?', answer: 'If your devices work in this test but not in other applications, the issue might be with those specific applications. Check the application\'s settings to ensure it\'s using the correct camera and microphone. Some applications have their own device selection settings. Also, check if the application has the necessary permissions to access your devices. Restarting the problematic application or your computer might also help resolve the issue.' },
]

const statusBadge = (state) => state === 'granted'
  ? <Badge tone="positive">Active</Badge>
  : state === 'denied' ? <Badge tone="negative">Access denied</Badge> : <Badge>Offline</Badge>

function DeviceTest() {
  const [permissions, setPermissions] = useState({ camera: 'prompt', microphone: 'prompt' })
  const cameraGranted = permissions.camera === 'granted'
  const microphoneGranted = permissions.microphone === 'granted'
  const deviceWorking = cameraGranted || microphoneGranted

  useEffect(() => {
    if (cameraGranted) trackToolUse('webcam-mic-test', 'camera')
    if (microphoneGranted) trackToolUse('webcam-mic-test', 'microphone')
  }, [cameraGranted, microphoneGranted])

  const requestTest = () => {
    // Ask for whichever device still needs access; once both are granted, restart both.
    if (!cameraGranted || microphoneGranted) window.dispatchEvent(new CustomEvent('webcam-test-request'))
    if (!microphoneGranted || cameraGranted) window.dispatchEvent(new CustomEvent('microphone-test-request'))
  }

  const actionLabel = cameraGranted && microphoneGranted
    ? 'Start device test'
    : cameraGranted ? 'Allow microphone access' : microphoneGranted ? 'Allow camera access' : 'Allow device access'

  return (
    <div className="space-y-6">
    <div className={ui.grid}>
      <div className={ui.card}>
        <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Your devices</h2></div>
        <div className={`${ui.cardBody} ${ui.stack}`}>
          <div>
            <label htmlFor="camera-selector" className={ui.label}>Camera</label>
            <select id="camera-selector" className={`${ui.select} disabled:bg-zinc-50 disabled:text-zinc-400`} disabled={!cameraGranted}>
              <option>Select camera</option>
              {/* Options are populated by WebcamTest */}
            </select>
          </div>
          <div>
            <label htmlFor="microphone-selector" className={ui.label}>Microphone</label>
            <select id="microphone-selector" className={`${ui.select} disabled:bg-zinc-50 disabled:text-zinc-400`} disabled={!microphoneGranted}>
              <option>Select microphone</option>
              {/* Options are populated by MicrophoneTest */}
            </select>
          </div>
          <button type="button" className={`${ui.primaryButton} w-full`} onClick={requestTest}>{actionLabel}</button>
          <div className={ui.rows}>
            <div className={ui.row}><span className={`${ui.rowLabel} flex items-center gap-2`}><VideoCameraIcon aria-hidden="true" className="size-4" />Camera</span>{statusBadge(permissions.camera)}</div>
            <div className={ui.row}><span className={`${ui.rowLabel} flex items-center gap-2`}><MicrophoneIcon aria-hidden="true" className="size-4" />Microphone</span>{statusBadge(permissions.microphone)}</div>
          </div>
          <p className={ui.hint}>The test runs entirely in your browser. No video or audio is sent to our servers or stored.</p>
        </div>
      </div>

      <div className="relative aspect-4/3 overflow-hidden rounded-lg bg-zinc-900">
        <div id="combined-device-test" className="absolute inset-0">
          <WebcamTest permissions={permissions} setPermissions={setPermissions} combined={true} />
        </div>
        {/* Always rendered so it can handle events; visible once the microphone is allowed. */}
        <div className={`absolute inset-x-0 bottom-0 p-4 ${microphoneGranted ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <MicrophoneTest permissions={permissions} setPermissions={setPermissions} combined={true} visualOnly={false} />
        </div>
        {!cameraGranted && !microphoneGranted && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 p-6 text-center">
            <div>
              <div className="flex justify-center gap-2">
                <span className="grid size-10 place-items-center rounded-lg border border-zinc-700 bg-zinc-800"><VideoCameraIcon aria-hidden="true" className="size-5 text-zinc-300" /></span>
                <span className="grid size-10 place-items-center rounded-lg border border-zinc-700 bg-zinc-800"><MicrophoneIcon aria-hidden="true" className="size-5 text-zinc-300" /></span>
              </div>
              <h3 className="mt-4 text-sm font-medium text-white">Devices offline</h3>
              <p className="mt-1 text-sm text-zinc-400">Select “{actionLabel}” to begin testing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
    {deviceWorking && (
      <ToolCta
        title="Devices working? Record your screen with them."
        copy="Screendesk records your screen, camera, and voice in one click and gives you a link to share with support. No download needed."
        label="Record your screen free"
      />
    )}
    </div>
  )
}

export default function WebcamMicTest() {
  return (
    <ToolPageLayout meta={meta} current="webcam-mic-test" breadcrumb={{ name: 'Webcam & Microphone Test', href: '/webcam-mic-test' }} faqs={faqs}>
      <ToolHero title="Webcam & Microphone Test" description="Make sure your devices work before you start a recording or video call. Test your webcam and microphone right in your browser." />
      <ToolFrame><DeviceTest /></ToolFrame>
    </ToolPageLayout>
  )
}
