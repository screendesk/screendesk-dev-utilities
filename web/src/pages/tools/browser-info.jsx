import { ChatBubbleLeftRightIcon, ClipboardDocumentIcon, LinkIcon } from '@heroicons/react/24/outline'
import { BrowserInfoTool } from '@/components/BrowserInfoTool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/browser-info',
  title: 'What Is My Browser? Check Browser, User Agent & Screen Resolution - Screendesk',
  description: 'See what browser you are using, its version, your operating system, user agent, screen resolution and viewport size. Copy the details or share a link with support. Free, nothing uploaded.',
  keywords: 'what is my browser, what browser am i using, what is my user agent, what is my browser agent, user agent, what is my screen resolution, what is my viewport, screen size tester, browser version check',
}

const agentSteps = [
  { icon: LinkIcon, title: 'Send the link', copy: 'Paste screendesk.io/tools/browser-info into your reply. The customer opens it and their browser, OS, screen and viewport are detected instantly.' },
  { icon: ClipboardDocumentIcon, title: 'They share it back', copy: 'The customer clicks “Create share link” and pastes it into the conversation, or uses “Copy all” to paste plain text. No account or install needed.' },
  { icon: ChatBubbleLeftRightIcon, title: 'You read the details', copy: 'Opening their link shows a read-only “Shared details” view with exactly what their browser reported, so you can reproduce the issue.' },
]

const glossary = [
  ['User agent', 'A text string your browser sends to websites that names the browser, engine and operating system.', 'Identifies the exact browser build when a bug only affects one version.'],
  ['Screen resolution', 'The size of your display in CSS pixels. Physical pixels are this multiplied by the pixel ratio.', 'Explains layout issues that only appear on small or very large screens.'],
  ['Viewport', 'The visible area of the page inside the browser window. It changes when you resize the window.', 'Responsive layouts switch based on viewport width, not screen size.'],
  ['Device pixel ratio', 'How many physical pixels make up one CSS pixel. Retina and most phone screens are 2 or 3.', 'Blurry images or icons usually point to pixel ratio issues.'],
  ['Client hints', 'A newer way for Chromium browsers to report OS and browser versions accurately.', 'The user agent string is frozen in some browsers (macOS always shows 10.15.7), so hints give the real version.'],
]

const faqs = [
  { question: 'What browser am I using?', answer: 'The tool reads your browser’s name and version as soon as the page loads. It recognizes Chrome, Edge, Firefox, Safari, Opera, Samsung Internet and other Chromium-based browsers, and uses client hints where available for exact versions.' },
  { question: 'What is my user agent?', answer: 'Your user agent is the string your browser sends with every request, describing the browser, rendering engine and operating system. It is shown in full at the bottom of the details list and can be copied with the rest.' },
  { question: 'Why does my Mac show macOS 10.15.7?', answer: 'Safari and Firefox freeze the macOS version in the user agent at 10.15.7 for privacy, regardless of your real version. Chromium browsers expose the real version through client hints, which this tool uses when they are available.' },
  { question: 'What is the difference between screen resolution and viewport?', answer: 'Screen resolution is the size of your whole display. The viewport is the part of the page you can see inside the browser window. Resize the window and the viewport value updates live.' },
  { question: 'Is my information sent anywhere?', answer: 'No. Everything is detected in your browser. A share link stores the details after the # in the URL, and browsers never send that part of a link to a server. Only the person you give the link to can see them.' },
  { question: 'How do I use this as a support agent?', answer: 'Send your customer the link screendesk.io/tools/browser-info. They click “Create share link” and paste the result back, and you open it to see their browser, OS, screen size and user agent in a read-only view.' },
]

export default function BrowserInfoPage() {
  return (
    <ToolPageLayout meta={meta} current="browser-info" breadcrumb={{ name: 'What Is My Browser', href: meta.path }} faqs={faqs}>
      <ToolHero title="What Is My Browser?" description="See your browser and version, operating system, user agent, screen resolution and viewport, then copy them or share a link with support." />
      <ToolFrame><BrowserInfoTool /></ToolFrame>
      <ToolSection id="support-agents" pill="For support agents" title="Get a customer’s browser details in one reply." subtitle="Send your customer this link: screendesk.io/tools/browser-info">
        <ToolPoints items={agentSteps} />
      </ToolSection>
      <ToolSection id="glossary" pill="Glossary" title="What each detail means." subtitle="And why support teams ask for it.">
        <ToolTable caption="Browser details explained" columns={['Detail', 'What it is', 'Why it matters']} rows={glossary} />
      </ToolSection>
    </ToolPageLayout>
  )
}
