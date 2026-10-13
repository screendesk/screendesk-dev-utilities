import { JsonFormatter } from '@/components/tools/dev/JsonFormatter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/json-formatter',
  title: 'JSON Formatter & Validator — Free Online Tool | Screendesk',
  description: 'Format, beautify, minify, and validate JSON online. See the exact line and column of syntax errors, fix trailing commas and quotes, sort keys, and browse a tree view. Runs in your browser.',
  keywords: 'json formatter, json validator, json viewer, json beautifier, json pretty print, format json online, json minify, json lint, validate json',
}

const errors = [
  ['Trailing comma', '{"a": 1, "b": 2,}', 'Remove the comma after the last item in an object or array.'],
  ['Single quotes', "{'name': 'Ada'}", 'Use double quotes for every string and property name: {"name": "Ada"}.'],
  ['Unquoted keys', '{name: "Ada"}', 'Wrap property names in double quotes. JSON is stricter than JavaScript object literals.'],
  ['Comments', '{"a": 1 // note}', 'JSON has no comment syntax. Remove // and /* */ comments, or use a "_comment" field.'],
  ['Non-JSON values', '{"a": undefined, "b": NaN}', 'Use null, a number, or remove the property. Python’s True/False/None become true/false/null.'],
  ['Raw line breaks', '{"msg": "line one\n line two"}', 'Escape line breaks inside strings as \\n.'],
  ['Several documents', '{"a": 1}\n{"b": 2}', 'Newline-delimited JSON (NDJSON) is one document per line. Wrap them in an array to validate together.'],
]

const types = [
  ['String', '"text"', 'Double quotes only. Escape " \\ and control characters.'],
  ['Number', '42, -3.5, 1e9', 'No leading zeros, no leading +, no hex, no NaN or Infinity.'],
  ['Boolean', 'true, false', 'Lowercase only.'],
  ['Null', 'null', 'Lowercase only. There is no undefined in JSON.'],
  ['Object', '{"key": value}', 'Keys must be strings. Duplicate keys are allowed by the spec but the last one wins in most parsers.'],
  ['Array', '[1, "two", null]', 'Ordered values of any type, separated by commas.'],
]

const faqs = [
  { question: 'How do I format JSON?', answer: 'Paste your JSON into the input box. It is validated and pretty-printed as you type with 2 spaces, 4 spaces, or tabs. Switch to Minify to remove all whitespace, and turn on Sort keys to order object keys alphabetically, which makes two payloads easier to compare.' },
  { question: 'How does the JSON validator find errors?', answer: 'The validator follows the JSON standard (RFC 8259) strictly and reports the line and column of the first problem, with the offending line shown and a caret under the error. It also explains common causes such as trailing commas, single quotes, unquoted keys, comments, and values like undefined or NaN.' },
  { question: 'Is my JSON uploaded anywhere?', answer: 'No. Formatting and validation run entirely in your browser with JavaScript. Nothing you paste is sent to a server or stored, so it is safe to use with API responses that contain customer data, though you should still avoid sharing secrets.' },
  { question: 'Why did a large number change after formatting?', answer: 'JavaScript stores numbers as 64-bit floating point, so integers larger than 9,007,199,254,740,991 (2^53 − 1) lose precision when parsed. If your payload contains big IDs, have the API send them as strings.' },
  { question: 'What is the difference between JSON and a JavaScript object?', answer: 'JSON is a text format based on JavaScript object syntax but stricter: keys and strings need double quotes, trailing commas and comments are not allowed, and only strings, numbers, booleans, null, objects, and arrays are valid values. Functions, undefined, dates, and NaN are not.' },
]

export default function JsonFormatterPage() {
  return (
    <ToolPageLayout meta={meta} current="json-formatter" breadcrumb={{ name: 'JSON Formatter', href: meta.path }} faqs={faqs}>
      <ToolHero title="JSON Formatter & Validator" description="Format, minify, and validate JSON with exact error positions and plain-English fixes. Everything runs in your browser." />
      <ToolFrame><JsonFormatter /></ToolFrame>
      <ToolSection id="errors" pill="Common errors" title="Why your JSON is invalid." subtitle="The mistakes behind most parse errors, and how to fix them.">
        <ToolTable caption="Common JSON syntax errors" columns={['Error', 'Example', 'Fix']} rows={errors} />
      </ToolSection>
      <ToolSection id="types" pill="Reference" title="JSON data types." subtitle="The six value types the format allows.">
        <ToolTable caption="JSON data types" columns={['Type', 'Example', 'Rules']} rows={types} />
      </ToolSection>
    </ToolPageLayout>
  )
}
