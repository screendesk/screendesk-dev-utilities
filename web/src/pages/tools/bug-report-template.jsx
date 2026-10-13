import { ClipboardDocumentListIcon, ComputerDesktopIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { BugReportTemplate } from '@/components/tools/qa/BugReportTemplate'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/bug-report-template',
  title: 'Free Bug Report Template Generator for Jira & GitHub - Screendesk',
  description: 'Fill in a software bug report template with steps to reproduce, expected and actual results, and auto-detected browser details. Copy it as Markdown, Jira wiki markup, a GitHub issue, or plain text.',
  keywords: 'bug report template, software bug report template, bug report template jira, github issue template, bug report format, how to write a bug report, defect report template',
}

const link = 'font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-500'

const principles = [
  { icon: ClipboardDocumentListIcon, title: 'Steps anyone can follow', copy: 'Start from a known state, number each action, and include the test data used. If a developer can’t reproduce it, they can’t fix it.' },
  { icon: ComputerDesktopIcon, title: 'The exact environment', copy: 'Browser, version, operating system, viewport, and app build. Many bugs only appear in one browser or at one screen size.' },
  { icon: VideoCameraIcon, title: 'Evidence, not just words', copy: 'A screen recording, console errors, and failed network requests show what happened faster than a paragraph describing it.' },
]

const sections = [
  ['Title', 'Where it happens, what goes wrong, and the trigger', '“Pay now” does nothing after applying a discount code'],
  ['Environment', 'URL, browser and version, OS, viewport, app build', 'Chrome 130, macOS 15, 1440 × 900, v2.4.0'],
  ['Steps to reproduce', 'Numbered actions from a known starting point', '1. Add a product 2. Apply SAVE10 3. Click “Pay now”'],
  ['Expected result', 'What should happen', 'The order confirmation page loads'],
  ['Actual result', 'What happens instead', 'Nothing happens; no request is sent'],
  ['Severity and frequency', 'How bad it is and how often it happens', 'Critical, every time'],
  ['Console errors', 'Errors from the browser console, pasted as text', 'TypeError at checkout.js:214'],
  ['Attachments', 'Recording, screenshot, logs, HAR file', 'Screen recording, console logs'],
]

const faqs = [
  { question: 'What should a bug report include?', answer: 'A specific title, the environment (browser, OS, viewport, app version), numbered steps to reproduce, the expected result, the actual result, severity, how often it happens, and evidence such as a screen recording, console errors, and network requests.' },
  { question: 'How do I paste a bug report into Jira?', answer: 'Choose the Jira format to get wiki markup with headings, a numbered step list, an environment table, and a noformat block for console errors. Wiki markup renders in Jira Data Center and in wiki-rendered fields; in the Jira Cloud editor, try pasting the Markdown version instead.' },
  { question: 'How is the browser and OS detected?', answer: 'The tool reads your browser’s user agent and window size when the page loads, entirely in your browser. Nothing is sent to Screendesk. Edit the fields if you reproduced the bug on a different device.' },
  { question: 'Can I use this as a GitHub issue template?', answer: 'Yes. The GitHub format uses Markdown headings, an environment table, a fenced code block for console errors, and task-list checkboxes for attachments. Paste it into a new issue, or save the blank version as an issue template in your repository.' },
  { question: 'How do I capture console logs and network requests for a bug report?', answer: 'Open your browser’s developer tools, reproduce the bug, then copy errors from the Console tab and export a HAR file from the Network tab. Screendesk captures both automatically alongside a screen recording, so you don’t need to do it by hand.' },
]

export default function BugReportTemplatePage() {
  return (
    <ToolPageLayout meta={meta} current="bug-report-template" breadcrumb={{ name: 'Bug Report Template', href: meta.path }} faqs={faqs}>
      <ToolHero title="Bug Report Template" description="Fill in a structured bug report with steps to reproduce and auto-detected environment details, then copy it as Markdown, Jira, GitHub, or plain text." />
      <ToolFrame><BugReportTemplate /></ToolFrame>
      <ToolSection id="principles" pill="Best practice" title="What makes a bug report reproducible." subtitle="Three things developers ask for first.">
        <ToolPoints items={principles} />
      </ToolSection>
      <ToolSection id="sections" pill="Template fields" title="Bug report template fields." subtitle="What to write in each section.">
        <ToolTable caption="Bug report template sections with examples" columns={['Section', 'What to include', 'Example']} rows={sections} />
        <p className="border-t border-zinc-200 px-5 py-6 text-sm text-zinc-600 sm:px-[calc(100%/24)]">
          More examples on the blog: <a href="https://blog.screendesk.io/bug-report-templates/" className={link}>bug report templates</a> for different teams and tools, and a <a href="https://blog.screendesk.io/bug-report-example/" className={link}>bug report example</a> walked through field by field.
        </p>
      </ToolSection>
    </ToolPageLayout>
  )
}
