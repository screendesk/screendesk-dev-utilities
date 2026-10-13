import { CronExpression } from '@/components/tools/dev/CronExpression'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/cron-expression',
  title: 'Cron Expression Generator & Explainer — Next Run Times | Screendesk',
  description: 'Build, validate and explain cron expressions in plain English. See the next 5 run times in local time and UTC, with presets and per-field editing. Free crontab helper.',
  keywords: 'cron expression, cron expression generator, crontab guru, cron schedule, crontab generator, cron syntax, cron next run, cron job every 5 minutes',
}

const fieldsTable = [
  ['Minute', '0–59', '* , - /'],
  ['Hour', '0–23', '* , - /'],
  ['Day of month', '1–31', '* , - /'],
  ['Month', '1–12 or JAN–DEC', '* , - /'],
  ['Day of week', '0–7 or SUN–SAT (0 and 7 are Sunday)', '* , - /'],
]

const syntax = [
  ['*', 'Every value', '* * * * * runs every minute'],
  [',', 'A list of values', '0 9,17 * * * runs at 09:00 and 17:00'],
  ['-', 'A range of values', '0 9 * * 1-5 runs at 09:00 Monday to Friday'],
  ['/', 'A step', '*/15 * * * * runs every 15 minutes; 0-30/10 means 0, 10, 20, 30'],
  ['@hourly', 'Same as 0 * * * *', 'At minute 0 of every hour'],
  ['@daily / @midnight', 'Same as 0 0 * * *', 'Every day at 00:00'],
  ['@weekly', 'Same as 0 0 * * 0', 'Every Sunday at 00:00'],
  ['@monthly', 'Same as 0 0 1 * *', 'The 1st of every month at 00:00'],
  ['@yearly / @annually', 'Same as 0 0 1 1 *', '1 January at 00:00'],
]

const faqs = [
  { question: 'What are the five fields in a cron expression?', answer: 'In order: minute (0–59), hour (0–23), day of month (1–31), month (1–12 or JAN–DEC) and day of week (0–7 or SUN–SAT, where both 0 and 7 mean Sunday). A job runs whenever the current time matches every field.' },
  { question: 'How do day of month and day of week work together?', answer: 'This trips up a lot of people. If both fields are restricted (neither starts with *), standard cron runs the job when either one matches. So 0 0 13 * 5 runs on the 13th of every month and on every Friday, not only on Friday the 13th. If one of them is *, only the other one applies.' },
  { question: 'Which time zone does cron use?', answer: 'Classic cron uses the server’s system time zone. Many hosted schedulers (GitHub Actions, Vercel cron jobs and AWS EventBridge, for example) evaluate schedules in UTC. Use the Local / UTC switch to see when the job will actually fire in each case.' },
  { question: 'Why does my expression have six or seven fields?', answer: 'Quartz, Spring and some cloud schedulers add a seconds field at the start and sometimes a year at the end, and support extra characters like ? L W and #. This tool follows standard 5-field crontab syntax, so drop the seconds field to check those schedules here.' },
  { question: 'How do I run a job every 5 minutes?', answer: 'Use */5 * * * *. The step value divides the field’s full range, so it runs at :00, :05, :10 and so on. Steps restart each hour, which is why */7 runs at :56 and then again at :00.' },
]

export default function CronExpressionPage() {
  return (
    <ToolPageLayout meta={meta} current="cron-expression" breadcrumb={{ name: 'Cron Expression Generator', href: meta.path }} faqs={faqs}>
      <ToolHero title="Cron Expression Generator" description="Write or build a cron schedule, read it back in plain English, and check the next run times in your time zone and UTC before you deploy it." />
      <ToolFrame><CronExpression /></ToolFrame>
      <ToolSection id="fields" pill="Syntax" title="The five cron fields." subtitle="Minute, hour, day of month, month and day of week.">
        <ToolTable caption="Cron fields and allowed values" columns={['Field', 'Allowed values', 'Special characters']} rows={fieldsTable} />
      </ToolSection>
      <ToolSection id="syntax" pill="Reference" title="Special characters and shortcuts." subtitle="What each symbol means, with examples.">
        <ToolTable caption="Cron special characters and shortcuts" columns={['Syntax', 'Meaning', 'Example']} rows={syntax} />
      </ToolSection>
    </ToolPageLayout>
  )
}
