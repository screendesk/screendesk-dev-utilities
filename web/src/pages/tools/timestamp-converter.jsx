import { TimestampConverter } from '@/components/tools/dev/TimestampConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/timestamp-converter',
  title: 'Unix Timestamp Converter (Epoch to Date) — Free Online Tool | Screendesk',
  description: 'Convert Unix epoch timestamps to human-readable dates and back. Auto-detects seconds and milliseconds, shows ISO 8601, UTC, local time in any time zone, and relative time.',
  keywords: 'unix timestamp converter, epoch converter, timestamp to date, epoch to date, unix time, date to timestamp, milliseconds to date, iso 8601 converter',
}

const code = (text) => <code className="font-mono text-[13px]">{text}</code>

const languages = [
  ['JavaScript', code('Math.floor(Date.now() / 1000)'), code('Date.now()'), code('new Date(ts * 1000)')],
  ['Python', code('int(time.time())'), code('time.time_ns() // 1_000_000'), code('datetime.fromtimestamp(ts, tz=timezone.utc)')],
  ['Go', code('time.Now().Unix()'), code('time.Now().UnixMilli()'), code('time.Unix(ts, 0).UTC()')],
  ['Java', code('Instant.now().getEpochSecond()'), code('System.currentTimeMillis()'), code('Instant.ofEpochSecond(ts)')],
  ['PHP', code('time()'), code('(int) (microtime(true) * 1000)'), code("date('c', $ts)")],
  ['Ruby', code('Time.now.to_i'), code("Process.clock_gettime(Process::CLOCK_REALTIME, :millisecond)"), code('Time.at(ts).utc')],
  ['PostgreSQL', code('extract(epoch from now())::bigint'), code('(extract(epoch from now()) * 1000)::bigint'), code('to_timestamp(ts)')],
  ['MySQL', code('UNIX_TIMESTAMP()'), code('ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)'), code('FROM_UNIXTIME(ts)')],
  ['Bash (GNU date)', code('date +%s'), code('date +%s%3N'), code('date -u -d @ts')],
]

const units = [
  ['Seconds', '10', '1760000000', 'Unix time, JWT exp/iat, most server logs, PostgreSQL epoch'],
  ['Milliseconds', '13', '1760000000000', 'JavaScript Date.now(), Java currentTimeMillis, many JSON APIs'],
  ['Microseconds', '16', '1760000000000000', 'Python time_ns() / 1000, PostgreSQL internal timestamps, tracing spans'],
  ['Nanoseconds', '19', '1760000000000000000', 'Go UnixNano, OpenTelemetry, Prometheus exports'],
]

const faqs = [
  { question: 'What is a Unix timestamp?', answer: 'A Unix timestamp (also called epoch time or POSIX time) is the number of seconds that have elapsed since 00:00:00 UTC on 1 January 1970, not counting leap seconds. Because it is a single number with no time zone, it is the most common way to store and exchange points in time in logs, databases, and APIs.' },
  { question: 'How do I tell if a timestamp is in seconds or milliseconds?', answer: 'Count the digits. A current timestamp in seconds has 10 digits (for example 1760000000), while milliseconds have 13, microseconds 16, and nanoseconds 19. This converter auto-detects the unit from the digit count, and you can override it if your value is unusual, such as a date before 2001 in seconds.' },
  { question: 'Does a Unix timestamp depend on the time zone?', answer: 'No. A Unix timestamp always counts from midnight UTC, so the same instant has the same timestamp everywhere. Time zones only matter when you display it as a calendar date and time. Pick a time zone above to see how the same timestamp reads in a given location.' },
  { question: 'What is the Year 2038 problem?', answer: 'Systems that store Unix time as a signed 32-bit integer overflow at 03:14:07 UTC on 19 January 2038 (timestamp 2147483647) and wrap around to 1901. Modern operating systems, languages, and databases use 64-bit timestamps, but older embedded devices, file formats, and database columns can still be affected.' },
  { question: 'Why does my converted date look a few hours off?', answer: 'Usually the timestamp is being displayed in a different time zone than you expect, or a local date string was parsed as UTC (or the other way round). Compare the UTC and local rows above. If the difference is exactly 1,000 times too large or small, the value was read in the wrong unit, seconds versus milliseconds.' },
]

export default function TimestampConverterPage() {
  return (
    <ToolPageLayout meta={meta} current="timestamp-converter" breadcrumb={{ name: 'Unix Timestamp Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="Unix Timestamp Converter" description="Convert epoch timestamps to readable dates and dates back to timestamps. Seconds or milliseconds, ISO 8601, UTC, and any time zone." />
      <ToolFrame><TimestampConverter /></ToolFrame>
      <ToolSection id="units" pill="Units" title="Seconds, milliseconds, and beyond." subtitle="Read the unit from the number of digits.">
        <ToolTable caption="Unix timestamp units by digit count" columns={['Unit', 'Digits', 'Example', 'Commonly used by']} rows={units} />
      </ToolSection>
      <ToolSection id="languages" pill="Code" title="Get the current timestamp in your language." subtitle="And turn a timestamp back into a date.">
        <ToolTable caption="Current Unix timestamp and conversion by programming language" columns={['Language', 'Seconds', 'Milliseconds', 'Timestamp to date']} rows={languages} />
      </ToolSection>
    </ToolPageLayout>
  )
}
