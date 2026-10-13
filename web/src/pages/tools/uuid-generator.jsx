import { UuidGenerator } from '@/components/tools/dev/UuidGenerator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/uuid-generator',
  title: 'UUID Generator (v4 & v7) and GUID Generator — Free Online Tool | Screendesk',
  description: 'Generate random v4 or time-ordered v7 UUIDs in bulk, up to 500 at once, with uppercase, brace, and no-hyphen formats. Validate any UUID or GUID and read its version, variant, and timestamp.',
  keywords: 'uuid generator, guid generator, uuid v4 generator, uuid v7 generator, random uuid, bulk uuid generator, uuid validator, guid validator',
}

const versions = [
  ['v1', 'Timestamp (100 ns since 1582) + clock sequence + node ID, often the MAC address', 'Legacy systems. Leaks the generating host and time.'],
  ['v3', 'MD5 hash of a namespace UUID and a name', 'Deterministic IDs from names. Prefer v5.'],
  ['v4', '122 random bits', 'The default for most applications and APIs.'],
  ['v5', 'SHA-1 hash of a namespace UUID and a name', 'Deterministic IDs, e.g. the same URL always maps to the same UUID.'],
  ['v6', 'v1 fields reordered so the timestamp sorts first', 'Migrating v1 systems to sortable IDs.'],
  ['v7', '48-bit Unix millisecond timestamp + 74 random bits', 'Database primary keys: sortable by creation time, index-friendly.'],
  ['v8', 'Custom, vendor-defined layout', 'Experimental or application-specific formats.'],
  ['Nil / Max', 'All zeros (00000000-…) or all ones (ffffffff-…)', 'Sentinel values meaning “no UUID” or “upper bound”.'],
]

const anatomy = [
  ['time_low / unix_ts_ms', '8 hex', 'First 32 bits. In v7, the first 48 bits (8 + 4 hex) are the Unix time in milliseconds.'],
  ['time_mid', '4 hex', 'Next 16 bits.'],
  ['version + time_hi', '4 hex', 'The first hex digit is the version: 4 in …-4xxx-…, 7 in …-7xxx-….'],
  ['variant + clock_seq', '4 hex', 'The first hex digit is 8, 9, a, or b for standard (RFC 9562) UUIDs.'],
  ['node', '12 hex', 'Final 48 bits: random in v4 and v7, a node ID in v1.'],
]

const faqs = [
  { question: 'What is the difference between a UUID and a GUID?', answer: 'They are the same thing. GUID (globally unique identifier) is Microsoft’s name for the 128-bit identifier standardised as a UUID (universally unique identifier) in RFC 4122, now RFC 9562. Microsoft tools often display GUIDs in uppercase and wrapped in braces, which you can switch on above.' },
  { question: 'Should I use UUID v4 or v7?', answer: 'Use v7 for database primary keys and anything you want sorted by creation time: its leading timestamp keeps B-tree indexes compact and inserts sequential. Use v4 when an ID must not reveal when it was created, such as public tokens or URLs. Both are 128 bits and work in any UUID column.' },
  { question: 'Can two generated UUIDs collide?', answer: 'In practice, no. A v4 UUID has 122 random bits, so you would need to generate about 2.7 quintillion UUIDs to have a 50% chance of a single duplicate. v7 UUIDs combine a millisecond timestamp with 74 random bits, and this generator increments a counter within the same millisecond so a batch stays unique and in order.' },
  { question: 'Are these UUIDs generated securely?', answer: 'Yes. v4 UUIDs come from crypto.randomUUID() and the random parts of v7 UUIDs from crypto.getRandomValues(), the browser’s cryptographically secure random number generator. They are created on your device and never sent anywhere. Even so, a UUID is an identifier, not a secret: do not use one as a password or API key.' },
  { question: 'How do I check which version a UUID is?', answer: 'Look at the first character of the third group: in 3f2b8c1e-9d4a-4e6f-…, the 4 means version 4. The first character of the fourth group shows the variant: 8, 9, a, or b means a standard RFC 9562 UUID. Paste any UUID into the inspector above to see its version, variant, and, for v1, v6, and v7, the time it was created.' },
]

export default function UuidGeneratorPage() {
  return (
    <ToolPageLayout meta={meta} current="uuid-generator" breadcrumb={{ name: 'UUID Generator', href: meta.path }} faqs={faqs}>
      <ToolHero title="UUID Generator" description="Generate random v4 or time-ordered v7 UUIDs and GUIDs, up to 500 at a time. Validate and inspect any UUID you paste." />
      <ToolFrame><UuidGenerator /></ToolFrame>
      <ToolSection id="versions" pill="Versions" title="UUID versions compared." subtitle="What each version encodes and when to use it.">
        <ToolTable caption="UUID versions defined in RFC 9562" columns={['Version', 'Built from', 'Use it for']} rows={versions} />
      </ToolSection>
      <ToolSection id="anatomy" pill="Format" title="Anatomy of a UUID." subtitle="32 hex digits in five groups: 8-4-4-4-12.">
        <ToolTable caption="UUID field layout" columns={['Field', 'Length', 'What it holds']} rows={anatomy} />
      </ToolSection>
    </ToolPageLayout>
  )
}
