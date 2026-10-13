import { ArrowPathIcon, ClockIcon, DocumentMagnifyingGlassIcon, ExclamationTriangleIcon, ShieldExclamationIcon, SignalSlashIcon } from '@heroicons/react/24/outline'
import JsonLd, { softwareApplicationSchema } from '@/components/JsonLd'
import { HarAnalyzer } from '@/components/tools/HarAnalyzer'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/har-file-analyzer',
  title: 'Free HAR File Analyzer & Viewer (Online, Private) - Screendesk',
  description: 'Open, view and analyze HAR files in your browser. See failed requests, slow responses, headers and timings, find cookies and tokens, and download a sanitized HAR. Nothing is uploaded.',
  keywords: 'har file analyzer, har file viewer, har file reader, how to open har file, what is a har file, har file, how to capture har file, how to get har file in chrome, har analyzer, sanitize har file',
}

const contents = [
  { icon: DocumentMagnifyingGlassIcon, title: 'Every request', copy: 'The URL, method, status code, request and response headers, query parameters, and often the request payload and response body of each request the page made.' },
  { icon: ClockIcon, title: 'Timings', copy: 'When each request started and how long it spent queued, resolving DNS, connecting, negotiating TLS, waiting for the server and downloading the response.' },
  { icon: ShieldExclamationIcon, title: 'Credentials', copy: 'Cookies, Authorization headers, session IDs and tokens in URLs are usually in the file too. Treat a HAR like a password and sanitize it before sharing.' },
]

const captureSteps = [
  ['Chrome', 'Press F12 (Cmd+Option+I on Mac) and open the Network tab', 'Check “Preserve log”, and “Disable cache” if the issue involves stale content', 'Reload the page and reproduce the problem', 'Click the download arrow (Export HAR) in the Network toolbar. Recent Chrome versions leave cookies and authorization headers out by default, which is usually what support needs'],
  ['Edge', 'Press F12 (Cmd+Option+I on Mac) and open the Network tab', 'Check “Preserve log”', 'Reload the page and reproduce the problem', 'Click the Export HAR button in the Network toolbar, or right-click a request and choose “Save all as HAR with content”'],
  ['Firefox', 'Press F12 (Cmd+Option+I on Mac) and open the Network tab', 'Open the gear menu and enable “Persist Logs”', 'Reload the page and reproduce the problem', 'Right-click any request (or use the gear menu) and choose “Save All As HAR”'],
  ['Safari', 'Enable the Develop menu: Safari → Settings → Advanced → “Show features for web developers”', 'Choose Develop → Show Web Inspector and open the Network tab; check “Preserve Log”', 'Reload the page and reproduce the problem', 'Click Export in the Network tab toolbar to save a .har file'],
]

const lookFor = [
  { icon: ExclamationTriangleIcon, title: 'Failed requests', copy: 'Filter by errors. A 401 or 403 points to auth or permissions, 404 to a wrong URL or missing resource, 5xx to a server-side failure. Open the response body: APIs often explain the error there.' },
  { icon: ClockIcon, title: 'Slow server waits', copy: 'Sort by slowest. If most of a request is “Waiting (TTFB)”, the server is slow to respond. Long “Blocked” or “Connect” phases point to the browser, network or too many parallel connections instead.' },
  { icon: SignalSlashIcon, title: 'CORS and blocked requests', copy: 'Requests with status 0 never got a usable response. Common causes are CORS rejections, ad blockers or extensions, mixed content, a dropped connection, or the user navigating away.' },
  { icon: ArrowPathIcon, title: 'Redirects', copy: 'Check 301, 302 and 307 responses and their Location header. Redirect loops, a redirect to a login page, or a switch from HTTPS to HTTP often explain a broken flow.' },
]

const faqs = [
  { question: 'What is a HAR file?', answer: 'A HAR (HTTP Archive) file is a JSON log of the network activity a browser recorded while a page was open. It lists every request with its URL, headers, status, timings and often the response body. Support and engineering teams ask for HAR files to debug errors, slow pages and failed logins they cannot reproduce themselves.' },
  { question: 'Is it safe to upload my HAR file here?', answer: 'Your file is never uploaded. This analyzer reads and parses the HAR entirely in your browser with JavaScript; nothing is sent to Screendesk or anyone else. The sanitized copy is also generated locally and saved straight to your device.' },
  { question: 'What sensitive data can a HAR file contain?', answer: 'Cookies, Set-Cookie headers, Authorization and API key headers, session IDs, OAuth codes and access tokens in URLs, form fields such as passwords, and anything in request or response bodies, including personal data. Anyone holding a HAR with a live session cookie may be able to act as that user until the session expires.' },
  { question: 'How do I open a HAR file?', answer: 'Drop it into the analyzer on this page to see a filterable request list, summary metrics and per-request details. You can also import it into the Network tab of Chrome, Edge or Firefox DevTools, or open it in any text editor, since it is plain JSON.' },
  { question: 'How should I send a HAR file to a support team?', answer: 'Capture the HAR while reproducing the problem, run it through “Download sanitized HAR” here, check the result, then attach the sanitized file to your ticket rather than pasting it into chat. Mention the time you reproduced the issue and what you expected to happen so support can find the right requests.' },
  { question: 'Is there a file size limit?', answer: 'There is no upload limit because nothing is uploaded, but the whole file is read into your browser’s memory. Files of tens of megabytes open in a few seconds; files over 500 MB are refused because a browser tab may run out of memory. The request table shows 500 rows at a time, with filters to narrow large captures.' },
]

const appSchema = {
  ...softwareApplicationSchema({
    name: 'HAR File Analyzer',
    description: 'Free online HAR file viewer and analyzer that runs in your browser. Inspect requests, timings and errors, detect cookies and tokens, and download a sanitized HAR.',
    applicationCategory: 'DeveloperApplication',
    price: 0,
  }),
  url: `https://screendesk.io${meta.path}`,
}

export default function HarFileAnalyzerPage() {
  return (
    <ToolPageLayout meta={meta} current="har-file-analyzer" breadcrumb={{ name: 'HAR File Analyzer', href: meta.path }} faqs={faqs}>
      <ToolHero title="HAR File Analyzer" description="Open a HAR file to see failed requests, slow responses, headers and timings at a glance. Find cookies and tokens, and download a sanitized copy before you share it. Everything runs in your browser." />
      <ToolFrame><HarAnalyzer /></ToolFrame>
      <ToolSection id="what" pill="What is a HAR file" title="What is a HAR file?" subtitle="A JSON recording of everything a page loaded, and how long each request took.">
        <ToolPoints items={contents} />
      </ToolSection>
      <ToolSection id="capture" pill="How to capture" title="How to capture a HAR file." subtitle="Open DevTools before you reproduce the problem, so every request is recorded.">
        <ToolTable caption="Steps to capture a HAR file in Chrome, Edge, Firefox and Safari" columns={['Browser', '1. Open DevTools', '2. Keep the log', '3. Reproduce', '4. Export']} rows={captureSteps} />
      </ToolSection>
      <ToolSection id="look-for" pill="What to look for" title="What to look for in a HAR file." subtitle="Most support issues show up in one of four places.">
        <ToolPoints items={lookFor} />
      </ToolSection>
      <JsonLd data={appSchema} />
    </ToolPageLayout>
  )
}
