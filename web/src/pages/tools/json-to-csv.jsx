import { JsonCsvConverter } from '@/components/tools/convert/JsonCsvConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/json-to-csv',
  title: 'JSON to CSV Converter (and CSV to JSON) — Free Online | Screendesk',
  description: 'Convert JSON to CSV or CSV to JSON online. Flattens nested objects into dot-path columns, handles quoted fields and line breaks, detects comma, semicolon, or tab delimiters, and downloads .csv or .json. Runs in your browser.',
  keywords: 'json to csv, csv to json, convert json to csv, json to csv converter, csv to json converter, nested json to csv, json array to csv, csv to json online',
}

const flattening = [
  ['Nested object', '{"user": {"name": "Ada"}}', 'user.name → Ada'],
  ['Array of values', '{"tags": ["billing", "safari"]}', 'tags.0 → billing, tags.1 → safari'],
  ['Array of objects', '{"items": [{"sku": "KB-01"}]}', 'items.0.sku → KB-01'],
  ['Missing key', '[{"a": 1}, {"b": 2}]', 'Columns a and b; each row leaves the other cell empty'],
  ['Empty object or array', '{"meta": {}, "tags": []}', 'meta → {} and tags → [] so the column is kept'],
  ['null', '{"closed_at": null}', 'closed_at → empty cell'],
  ['Wrapped array', '{"data": [{...}, {...}]}', 'The first array of objects becomes the rows'],
]

const rules = [
  ['Delimiter', 'Fields are separated by a comma. Many European spreadsheets use a semicolon because the comma is the decimal separator.'],
  ['Quoting', 'A field containing the delimiter, a double quote, or a line break must be wrapped in double quotes: "Paris, France".'],
  ['Escaped quotes', 'A double quote inside a quoted field is written twice: "She said ""hi""" reads as She said "hi".'],
  ['Line breaks', 'Rows end with CRLF in the spec; LF and CR alone are accepted too. Quoted fields may contain line breaks.'],
  ['Header', 'The first row may name the columns. Every row should have the same number of fields.'],
  ['Encoding', 'Use UTF-8. Downloads here include a byte-order mark so Excel opens accented characters correctly.'],
]

const faqs = [
  { question: 'How do I convert JSON to CSV?', answer: 'Paste a JSON array of objects (or open a .json file) with JSON → CSV selected. Each object becomes a row and each key becomes a column. Nested objects and arrays are flattened into dot-path columns such as customer.name or tags.0. Choose comma, semicolon, or tab, then copy the result or download a .csv file.' },
  { question: 'How do I convert CSV to JSON?', answer: 'Switch to CSV → JSON and paste your CSV or open a file. The delimiter is detected automatically. With "First row is header" on, each row becomes an object keyed by the header; turn it off to get an array of arrays. "Detect numbers & booleans" turns 42 and true into JSON numbers and booleans, while values such as 00123 and very long IDs stay strings so nothing is lost.' },
  { question: 'Can I turn dot-path columns back into nested JSON?', answer: 'Yes. In CSV → JSON, turn on "Nest dot-path columns". A header such as user.name becomes {"user": {"name": ...}}, and columns like tags.0 and tags.1 become an array. This reverses the flattening done by JSON → CSV.' },
  { question: 'Why does my CSV open in one column in Excel?', answer: 'Excel uses your system’s list separator. In regions where the comma is the decimal separator, it expects semicolons. Pick Semicolon as the delimiter before downloading, or use Data → From Text/CSV in Excel and choose the delimiter yourself.' },
  { question: 'Is my data uploaded?', answer: 'No. Parsing and conversion run in your browser with JavaScript, and downloads are generated locally. Nothing is sent to a server, so you can convert exports that contain customer data.' },
]

export default function JsonToCsvPage() {
  return (
    <ToolPageLayout meta={meta} current="json-to-csv" breadcrumb={{ name: 'JSON to CSV', href: meta.path }} faqs={faqs}>
      <ToolHero title="JSON to CSV Converter" description="Convert JSON to CSV and CSV to JSON, with nested objects flattened into columns and proper CSV quoting. Everything runs in your browser." />
      <ToolFrame><JsonCsvConverter defaultDirection="json-csv" /></ToolFrame>
      <ToolSection id="flattening" pill="Nested JSON" title="How nested JSON becomes columns." subtitle="Every path to a value becomes one CSV column.">
        <ToolTable caption="How JSON structures map to CSV columns" columns={['JSON shape', 'Example', 'CSV result']} rows={flattening} />
      </ToolSection>
      <ToolSection id="csv-rules" pill="Reference" title="CSV format rules." subtitle="What RFC 4180 says, and what spreadsheets expect.">
        <ToolTable caption="CSV format rules from RFC 4180" columns={['Rule', 'Details']} rows={rules} />
      </ToolSection>
    </ToolPageLayout>
  )
}
