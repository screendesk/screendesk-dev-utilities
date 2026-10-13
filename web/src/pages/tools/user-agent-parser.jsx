import { UserAgentParser } from '@/components/tools/dev/UserAgentParser'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/user-agent-parser',
  title: 'User Agent Parser — What Is My User Agent? | Screendesk',
  description: 'See your browser’s user agent and parse any User-Agent string into browser, version, rendering engine, operating system, device type, and bot. Free, runs in your browser.',
  keywords: 'user agent parser, my user agent, what is my user agent, user agent string, user agent lookup, browser user agent, detect bot user agent, parse user agent',
}

const tokens = [
  ['Mozilla/5.0', 'A historical compatibility token. Almost every browser sends it; it says nothing about Firefox.'],
  ['(Macintosh; Intel Mac OS X 10_15_7)', 'Platform details: OS and CPU. Browsers freeze macOS at 10.15.7 and Windows at “NT 10.0”, so newer releases look the same.'],
  ['AppleWebKit/537.36 (KHTML, like Gecko)', 'Rendering engine compatibility tokens. Chromium browsers keep the WebKit token from before they forked to Blink.'],
  ['Chrome/129.0.0.0', 'Browser and version. Chrome reduces the minor, build, and patch numbers to zeros.'],
  ['Safari/537.36', 'Another compatibility token. Present in Chrome and Edge as well as Safari.'],
  ['Edg/129.0.2792.79', 'A brand token appended by a Chromium-based browser (here Microsoft Edge). Parsers must check these before “Chrome”.'],
  ['Mobile', 'Sent by phone browsers. An Android user agent without it is usually a tablet.'],
]

const bots = [
  ['Googlebot', 'Google Search crawler', 'Googlebot/2.1'],
  ['Bingbot', 'Microsoft Bing crawler', 'bingbot/2.0'],
  ['GPTBot / OAI-SearchBot', 'OpenAI crawlers', 'GPTBot/1.1'],
  ['ClaudeBot', 'Anthropic crawler', 'ClaudeBot/1.0'],
  ['PerplexityBot', 'Perplexity crawler', 'PerplexityBot/1.0'],
  ['facebookexternalhit', 'Link previews on Facebook and Messenger', 'facebookexternalhit/1.1'],
  ['Slackbot', 'Link unfurling in Slack', 'Slackbot-LinkExpanding 1.0'],
  ['AhrefsBot / SemrushBot', 'SEO tool crawlers', 'AhrefsBot/7.0'],
  ['curl / python-requests', 'Command-line and script HTTP clients', 'curl/8.7.1'],
]

const faqs = [
  { question: 'What is a user agent?', answer: 'A user agent is the string a browser or HTTP client sends in the User-Agent request header to identify itself. It usually names the browser and version, the rendering engine, and the operating system. Servers, analytics, and support tools use it to work out which environment a request came from.' },
  { question: 'What is my user agent?', answer: 'The box at the top of this page shows the user agent your browser sends right now, read from navigator.userAgent. You can copy it into a bug report, or switch to another browser and reload the page to compare.' },
  { question: 'How accurate is user agent parsing?', answer: 'Good for browser, engine, and device type, but not perfect. Browsers now freeze parts of the string (macOS shows 10.15.7, Windows 11 shows Windows NT 10.0, Android often shows a generic “K” model), and any client can send any string. For exact OS versions in Chromium browsers, use User-Agent Client Hints (navigator.userAgentData) instead.' },
  { question: 'Why does Chrome’s user agent mention Safari, WebKit, and Mozilla?', answer: 'Compatibility. Early sites served features based on user agent sniffing, so each new browser copied the tokens of the browsers sites already supported. Chrome inherited WebKit and Safari tokens from its WebKit days and still sends them after moving to the Blink engine.' },
  { question: 'Can I trust the user agent to detect bots?', answer: 'Only as a first filter. Well-behaved crawlers like Googlebot identify themselves, but bad bots often send a normal browser user agent, and anyone can fake Googlebot. To verify a crawler, do a reverse DNS lookup on the request IP and confirm it resolves back to the crawler’s domain.' },
]

export default function UserAgentParserPage() {
  return (
    <ToolPageLayout meta={meta} current="user-agent-parser" breadcrumb={{ name: 'User Agent Parser', href: meta.path }} faqs={faqs}>
      <ToolHero title="User Agent Parser" description="See your own user agent, or paste any User-Agent string to break it down into browser, engine, operating system, device type, and bot." />
      <ToolFrame><UserAgentParser /></ToolFrame>
      <ToolSection id="anatomy" pill="Reference" title="Anatomy of a user agent string." subtitle="What each token in a typical Chrome user agent means.">
        <ToolTable caption="User agent tokens and their meaning" columns={['Token', 'What it means']} rows={tokens} />
      </ToolSection>
      <ToolSection id="bots" pill="Bots" title="Common crawlers and clients." subtitle="User agents the parser flags as bots or scripts.">
        <ToolTable caption="Common bot user agents" columns={['Bot', 'Operator or purpose', 'Example token']} rows={bots} />
      </ToolSection>
    </ToolPageLayout>
  )
}
