import { CurlConverter } from '@/components/tools/dev/CurlConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/curl-converter',
  title: 'curl Converter — curl to Python, fetch, Go & PHP | Screendesk',
  description: 'Convert curl commands to JavaScript fetch, Node axios, Python requests, Go net/http and PHP cURL. Handles headers, JSON bodies, forms, auth and cookies. Free, runs in your browser.',
  keywords: 'curl converter, curl to python, curl to fetch, curl to axios, curl to go, curl to php, convert curl command, curl to requests',
}

const flags = [
  ['-X, --request', 'Sets the HTTP method (GET, POST, PUT, PATCH, DELETE…).', 'method'],
  ['-H, --header', 'Adds a request header, e.g. -H "Authorization: Bearer …". Repeatable.', 'headers'],
  ['-d, --data', 'Sends a body and switches the method to POST. Defaults to Content-Type: application/x-www-form-urlencoded. With @file it reads the file and strips newlines.', 'body'],
  ['--data-raw', 'Like -d, but a leading @ is sent literally instead of reading a file.', 'body'],
  ['--data-binary', 'Like -d, but keeps newlines and bytes exactly as given.', 'body'],
  ['--data-urlencode', 'URL-encodes the value before sending it (name=value encodes only the value).', 'body'],
  ['--json', 'Sends a JSON body and sets Content-Type and Accept to application/json (curl 7.82+).', 'json'],
  ['-F, --form', 'Sends multipart/form-data. name=@path uploads a file, name=<path sends file contents as text.', 'multipart'],
  ['-u, --user', 'HTTP Basic authentication as user:password.', 'auth'],
  ['-b, --cookie', 'Sends cookies, e.g. -b "session=abc; theme=dark".', 'Cookie header'],
  ['-G, --get', 'Appends the -d data to the URL as a query string and sends a GET.', 'query string'],
  ['--compressed', 'Asks for a compressed response and decompresses it.', 'Accept-Encoding'],
  ['-L, --location', 'Follows redirects. Most HTTP libraries do this by default; curl does not.', 'redirects'],
  ['-k, --insecure', 'Skips TLS certificate verification. Only use against local or test servers.', 'TLS'],
]

const faqs = [
  { question: 'How do I get a curl command for a request in my browser?', answer: 'Open DevTools, go to the Network tab, right-click the request and choose Copy → Copy as cURL (bash). In Chrome on Windows, pick the bash variant rather than cmd so quotes paste cleanly. Paste the result here to turn it into code.' },
  { question: 'Which curl options does the converter support?', answer: 'Method (-X), headers (-H, -A, -e), every data flag (-d, --data-raw, --data-binary, --data-urlencode, --json), multipart forms (-F), Basic auth (-u), cookies (-b), -G, --compressed, -L and -k, plus combined short flags like -sSL and line continuations with a backslash. Options that only affect curl’s own output, such as -s or -v, are ignored.' },
  { question: 'Is it safe to paste commands with tokens or cookies?', answer: 'The conversion happens entirely in your browser and nothing is sent to a server. Copied curl commands often include session cookies and bearer tokens, though, so remove them before sharing the converted code with anyone.' },
  { question: 'Why does the Python output use json= instead of data=?', answer: 'When the request has a JSON Content-Type and a valid JSON body, the converter passes it as a Python dict with json=, which serializes it and sets the header for you. Bodies that are not valid JSON are sent unchanged with data=.' },
  { question: 'Why is the response different from what curl returns?', answer: 'Common causes are redirects (curl does not follow them without -L, most libraries do), compression, cookies that have expired since you copied the command, and browser-only headers. Comparing the failing request with the network log from the user’s session is usually the fastest way to spot the difference.' },
]

export default function CurlConverterPage() {
  return (
    <ToolPageLayout meta={meta} current="curl-converter" breadcrumb={{ name: 'curl Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="curl Converter" description="Paste a curl command and get the same request as JavaScript fetch, Node axios, Python requests, Go net/http or PHP cURL. Nothing leaves your browser." />
      <ToolFrame><CurlConverter /></ToolFrame>
      <ToolSection id="flags" pill="Reference" title="curl flags, explained." subtitle="What each option means and how it maps to code.">
        <ToolTable caption="Common curl options and what they do" columns={['Option', 'What it does', 'Maps to']} rows={flags} />
      </ToolSection>
    </ToolPageLayout>
  )
}
