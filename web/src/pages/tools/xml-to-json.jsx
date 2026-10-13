import { XmlJsonConverter } from '@/components/tools/convert/XmlJsonConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/xml-to-json',
  title: 'XML to JSON Converter (and JSON to XML) — Free Online | Screendesk',
  description: 'Convert XML to JSON or JSON to XML online. Attributes become @keys, repeated elements become arrays, and parse errors show the line and column. Pretty-print, copy, or download. Runs in your browser.',
  keywords: 'xml to json, json to xml, xml to json converter, convert xml to json, json to xml converter, xml to json online, xml parser',
}

const mapping = [
  ['Element with text', '<name>Ada</name>', '"name": "Ada"'],
  ['Attribute', '<user id="7">…</user>', '"user": { "@id": "7", … }'],
  ['Text next to attributes', '<price currency="EUR">9.50</price>', '"price": { "@currency": "EUR", "#text": "9.50" }'],
  ['Repeated elements', '<tag>a</tag><tag>b</tag>', '"tag": ["a", "b"]'],
  ['Empty element', '<notes/>', '"notes": null'],
  ['CDATA', '<![CDATA[a & b]]>', 'Read as plain text: "a & b"'],
  ['Comments, processing instructions', '<!-- note -->', 'Dropped'],
]

const differences = [
  ['Root', 'Exactly one root element is required.', 'Any value can be the top level. JSON → XML wraps arrays and multi-key objects in the root element you name.'],
  ['Attributes', 'Elements carry attributes and child elements.', 'Only keys and values. Attributes use the @ prefix here.'],
  ['Order', 'Element order is significant.', 'Object key order is not guaranteed by the spec. Repeated elements keep their order inside an array.'],
  ['Types', 'Everything is text unless a schema says otherwise.', 'Strings, numbers, booleans, and null. Turn on “Convert numbers & booleans” to infer them.'],
  ['Names', 'Element names cannot start with a digit or contain spaces.', 'Any string is a valid key. Invalid characters become _ when converting to XML.'],
  ['Escaping', '& < > " and \' must be escaped as entities.', 'Only " \\ and control characters are escaped.'],
]

const faqs = [
  { question: 'How do I convert XML to JSON?', answer: 'Paste XML or open an .xml file with XML → JSON selected. The XML is parsed by your browser’s built-in XML parser, and the JSON appears as you type. Attributes become keys starting with @, text that sits next to attributes or child elements goes in #text, and repeated elements with the same name become an array.' },
  { question: 'How do I convert JSON to XML?', answer: 'Switch to JSON → XML and paste your JSON. Keys become element names, arrays become repeated elements, keys starting with @ become attributes, and a #text key becomes the element’s text. If the JSON has a single top-level key, it becomes the root element; otherwise the output is wrapped in the root element name you choose.' },
  { question: 'Why does my XML fail to parse?', answer: 'XML must be well-formed: one root element, every tag closed and properly nested, attribute values in quotes, and & or < inside text escaped as &amp; and &lt;. The error message shows the browser’s description of the first problem, usually with a line and column.' },
  { question: 'Why are numbers strings in the JSON output?', answer: 'XML has no data types, so every value is text by default. Turn on “Convert numbers & booleans” to turn values like 42, 9.50, and true into JSON numbers and booleans. Values with leading zeros and very long integers stay strings to avoid losing digits.' },
  { question: 'Is my XML uploaded anywhere?', answer: 'No. Parsing and conversion happen in your browser, and downloads are created locally. Nothing is sent to a server.' },
]

export default function XmlToJsonPage() {
  return (
    <ToolPageLayout meta={meta} current="xml-to-json" breadcrumb={{ name: 'XML to JSON', href: meta.path }} faqs={faqs}>
      <ToolHero title="XML to JSON Converter" description="Convert XML to JSON and JSON to XML, with attributes, repeated elements, and parse errors handled. Everything runs in your browser." />
      <ToolFrame><XmlJsonConverter defaultDirection="xml-json" /></ToolFrame>
      <ToolSection id="mapping" pill="Conversion rules" title="How XML maps to JSON." subtitle="The same rules apply in reverse for JSON to XML.">
        <ToolTable caption="How XML constructs map to JSON" columns={['XML', 'Example', 'JSON']} rows={mapping} />
      </ToolSection>
      <ToolSection id="differences" pill="Reference" title="XML vs JSON." subtitle="Why the conversion needs conventions at all.">
        <ToolTable caption="Differences between XML and JSON" columns={['Topic', 'XML', 'JSON']} rows={differences} />
      </ToolSection>
    </ToolPageLayout>
  )
}
