import { ArrowPathIcon, LockClosedIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'
import { EdgeCaseStrings, TestDataGenerator } from '@/components/tools/qa/TestDataGenerator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/test-data-generator',
  title: 'Free Test Data Generator: Fake Names, Emails & Addresses - Screendesk',
  description: 'Generate up to 1,000 rows of fake test data: random names, fake email addresses, fake US addresses, phone numbers, UUIDs, and more. Export mock data as JSON, CSV, or SQL INSERT.',
  keywords: 'test data generator, fake address generator, mock data generator, random name generator, fake email generator, fake data generator, sample data generator, sql test data, qa edge case strings',
}

const reasons = [
  { icon: LockClosedIcon, title: 'Keep real data out of test', copy: 'Synthetic records let you fill staging databases and demo accounts without copying customer data into environments with weaker access controls.' },
  { icon: ArrowPathIcon, title: 'Reproduce with a seed', copy: 'The same seed and settings produce the same rows, so a teammate can regenerate the exact data set behind a bug report.' },
  { icon: ShieldExclamationIcon, title: 'Break forms on purpose', copy: 'Edge-case strings catch truncation, encoding, escaping, and validation bugs that clean sample data never triggers.' },
]

const safeValues = [
  ['Email', 'example.com, example.org', 'Reserved for documentation and testing (RFC 2606), so mail never reaches a real inbox.'],
  ['Phone', '555-0100 to 555-0199', 'The North American range set aside for fictional use.'],
  ['IP address', '192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24', 'Documentation ranges (RFC 5737) that are not routed on the public internet.'],
  ['URL', 'https://example.com/…', 'Reserved domain; links resolve to a placeholder page.'],
  ['Address', 'Random street number and name, real city and state', 'Looks plausible for form testing but does not target a specific real address.'],
]

const faqs = [
  { question: 'Is this fake data safe to use in tests?', answer: 'Yes. Names and addresses are randomly combined, emails use the reserved example.com and example.org domains, phone numbers use the fictional 555-01xx range, and IP addresses come from documentation ranges. The data is generated in your browser and is not sent anywhere.' },
  { question: 'Can I generate the same test data again?', answer: 'Yes. Keep “Same seed, same data” on and use the same seed, fields, row count, and number range. The generator is deterministic for a given seed, so you can share the seed in a bug report instead of the data file.' },
  { question: 'How do I import the data into a database?', answer: 'Choose SQL, set your table name, and run the INSERT statements, or download the CSV and use your database’s import tool. Column names match the field names shown in the output, so create the table with matching columns first.' },
  { question: 'Are the fake addresses real?', answer: 'The cities and states are real so that address forms and validation behave realistically, but street numbers, street names, and ZIP code endings are random. Don’t use them to send mail or to test address verification services that charge per lookup.' },
  { question: 'What are edge-case strings for?', answer: 'They are inputs that commonly break forms and APIs: empty and whitespace-only values, very long text, emoji, right-to-left scripts, zero-width characters, quotes, and HTML-like tags. Paste them into each field and check that the app saves, displays, and escapes them correctly.' },
]

export default function TestDataGeneratorPage() {
  return (
    <ToolPageLayout meta={meta} current="test-data-generator" breadcrumb={{ name: 'Test Data Generator', href: meta.path }} faqs={faqs}>
      <ToolHero title="Test Data Generator" description="Generate fake names, emails, addresses, and more for testing. Up to 1,000 rows as JSON, CSV, or SQL, reproducible with a seed." />
      <ToolFrame><TestDataGenerator /></ToolFrame>
      <ToolSection id="edge-cases" pill="Edge cases" title="QA edge-case strings." subtitle="Inputs that find validation, encoding, and escaping bugs.">
        <div className="border-t border-zinc-200 bg-zinc-50 p-5 sm:px-[calc(100%/24)] sm:py-10"><EdgeCaseStrings /></div>
      </ToolSection>
      <ToolSection id="safe-values" pill="Safe by design" title="Values reserved for testing." subtitle="Why the generated data won’t reach real people.">
        <ToolTable caption="Reserved values used by the test data generator" columns={['Field', 'Values used', 'Why it is safe']} rows={safeValues} />
      </ToolSection>
      <ToolSection id="why" pill="Why it matters" title="Why use synthetic test data." subtitle="Realistic enough to test with, never a real person.">
        <ToolPoints items={reasons} />
      </ToolSection>
    </ToolPageLayout>
  )
}
