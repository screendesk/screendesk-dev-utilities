import { UrlEncoder } from '@/components/tools/dev/UrlEncoder'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/url-encoder',
  title: 'URL Decode & Encode — Online URL Encoder and Parser | Screendesk',
  description: 'URL decode and encode text online with encodeURIComponent or encodeURI, handle + as space, and parse any URL into protocol, host, path, and decoded query parameters. Free and private.',
  keywords: 'url decode, url encode, url decoder, url encoder, percent encoding, encodeURIComponent, decode url online, url parser, query string parser',
}

const characters = [
  ['Space', '%20', '+ in form data (application/x-www-form-urlencoded)'],
  ['!', '%21', 'Not escaped by encodeURIComponent'],
  ['#', '%23', 'Starts the fragment'],
  ['$', '%24', 'Reserved sub-delimiter'],
  ['%', '%25', 'Escape character itself'],
  ['&', '%26', 'Separates query parameters'],
  ['+', '%2B', 'Means space in form data, so encode it in values'],
  [',', '%2C', 'Reserved sub-delimiter'],
  ['/', '%2F', 'Separates path segments'],
  [':', '%3A', 'Separates scheme, port, and credentials'],
  ['=', '%3D', 'Separates a query key from its value'],
  ['?', '%3F', 'Starts the query string'],
  ['@', '%40', 'Separates credentials from host'],
  ['é', '%C3%A9', 'Non-ASCII characters are encoded as UTF-8 bytes'],
]

const functions = [
  ['encodeURIComponent', 'Everything except A–Z a–z 0–9 - _ . ! ~ * \' ( )', 'A single query value, path segment, or redirect URL passed as a parameter'],
  ['encodeURI', 'Same, but keeps ; , / ? : @ & = + $ #', 'A complete URL that only needs spaces and non-ASCII characters escaped'],
  ['URLSearchParams', 'Like encodeURIComponent, but spaces become + and ! \' ( ) ~ are also escaped', 'Building form-encoded query strings and POST bodies'],
]

const faqs = [
  { question: 'What is URL encoding?', answer: 'URL encoding, or percent-encoding, replaces characters that are not allowed or have special meaning in a URL with a % followed by two hex digits. A space becomes %20, & becomes %26, and non-ASCII characters are encoded as their UTF-8 bytes, so “é” becomes %C3%A9.' },
  { question: 'Should I use encodeURIComponent or encodeURI?', answer: 'Use encodeURIComponent for pieces of a URL: a query value, a path segment, or a whole URL you pass as a parameter (like redirect_uri). Use encodeURI only on a complete URL, because it leaves delimiters such as / ? & = # intact. Using encodeURI on a query value is a common bug: an & inside the value will split it into two parameters.' },
  { question: 'Why is a space sometimes + and sometimes %20?', answer: 'In the query string of HTML form submissions (application/x-www-form-urlencoded), a space is written as +. Everywhere else in a URL, a space is %20. When decoding form data, turn on “Treat + as space”; otherwise a literal + is kept.' },
  { question: 'Why does my decoded URL still contain %20 or %2F?', answer: 'The value was probably encoded twice, for example %2520 instead of %20 (%25 is the encoded % sign). This happens when a framework encodes a value that was already encoded. The tool flags still-encoded output and lets you decode again, but the real fix is to encode exactly once.' },
  { question: 'What causes “URI malformed” errors?', answer: 'decodeURIComponent throws when a % is not followed by two hex digits, or when the bytes do not form valid UTF-8, for example a literal “100%” or text encoded as Latin-1 (%E9 for é). This tool shows the position of the first bad sequence.' },
]

export default function UrlEncoderPage() {
  return (
    <ToolPageLayout meta={meta} current="url-encoder" breadcrumb={{ name: 'URL Encoder & Decoder', href: meta.path }} faqs={faqs}>
      <ToolHero title="URL Decode and Encode" description="Percent-encode or decode text, choose between encodeURIComponent and encodeURI, and parse any URL into its parts and decoded query parameters." />
      <ToolFrame><UrlEncoder /></ToolFrame>
      <ToolSection id="functions" pill="Reference" title="Which encoding function to use." subtitle="What each JavaScript function escapes.">
        <ToolTable caption="JavaScript URL encoding functions compared" columns={['Function', 'Escapes', 'Use for']} rows={functions} />
      </ToolSection>
      <ToolSection id="characters" pill="Cheat sheet" title="Common percent-encoded characters." subtitle="Reserved characters and how they are encoded.">
        <ToolTable caption="Percent-encoding reference" columns={['Character', 'Encoded', 'Notes']} rows={characters} />
      </ToolSection>
    </ToolPageLayout>
  )
}
