import { BugSeverityMatrix, impacts, priorities } from '@/components/tools/qa/BugSeverityMatrix'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/bug-severity-matrix',
  title: 'Bug Severity vs Priority Matrix: Severity Levels & Bug Life Cycle - Screendesk',
  description: 'Classify bugs with a free severity vs priority matrix. Pick impact, reach, and workaround to get a suggested severity level and P0–P4 priority, plus bug severity definitions and the bug life cycle.',
  keywords: 'severity vs priority, bug severity levels, bug life cycle, defect severity and priority, bug priority matrix, p0 p1 p2 bug priority, defect life cycle, bug triage',
}

const severityExamples = {
  blocker: 'App crashes on launch; payments fail for all users',
  critical: 'Search returns wrong results; export produces a corrupt file',
  major: 'Filter resets after each page load; slow report generation',
  minor: 'Tooltip shows on the wrong element; sort order inconsistent',
  trivial: 'Typo in the footer; icon misaligned by a few pixels',
}

const severityRows = impacts.map((item) => [`${item.severity} · ${item.name}`, item.copy, severityExamples[item.id]])
const priorityRows = priorities.map((item) => [`${item.id} · ${item.name}`, item.copy])

const comparison = [
  ['Question it answers', 'How bad is the impact on the product?', 'How soon should we fix it?'],
  ['Set by', 'Usually QA or the reporter', 'Usually the product owner or triage lead'],
  ['Based on', 'Technical and user impact', 'Business value, reach, deadlines, and capacity'],
  ['Changes over time', 'Rarely; the impact stays the same', 'Often, as releases and priorities shift'],
  ['High severity, low priority', 'Crash in a feature almost no one uses', 'Fix later; the reach is tiny'],
  ['Low severity, high priority', 'Typo in the company name on the homepage', 'Fix now; it is highly visible'],
]

const lifecycle = [
  ['New', 'The bug is reported with steps, environment, and evidence.', 'Reporter (QA, support, or user)'],
  ['Assigned', 'Triage confirms it, sets severity and priority, and assigns an owner.', 'Triage lead or product owner'],
  ['In progress', 'The developer reproduces the bug and works on a fix.', 'Developer'],
  ['Fixed', 'The fix is merged and deployed to a test environment.', 'Developer'],
  ['In verification', 'QA retests with the original steps and checks for regressions.', 'QA'],
  ['Closed', 'The fix is verified and the bug is done.', 'QA'],
  ['Reopened', 'Verification failed or the bug came back; it returns to the developer.', 'QA'],
  ['Deferred', 'Valid, but postponed to a later release.', 'Product owner'],
  ['Rejected', 'Not a bug, a duplicate, or can’t be reproduced.', 'Triage lead'],
]

const faqs = [
  { question: 'What is the difference between severity and priority?', answer: 'Severity describes how much a bug hurts the product or its users. Priority describes how soon the team should fix it. They usually move together, but not always: a crash in a rarely used admin screen can be high severity and low priority, while a typo in your brand name on the homepage is low severity and high priority.' },
  { question: 'What are the bug severity levels?', answer: 'A common scale has five levels: Blocker (S1), Critical (S2), Major (S3), Minor (S4), and Trivial (S5). Some teams use four, merging Blocker and Critical. What matters is that everyone on the team uses the same definitions.' },
  { question: 'What do P0, P1, P2, P3, and P4 mean?', answer: 'They are priority levels. P0 means drop everything and fix now, P1 means fix in the current sprint or before release, P2 means schedule it soon, P3 means fix when there is capacity, and P4 is backlog. Map them to your own response targets.' },
  { question: 'How does this matrix decide priority?', answer: 'It combines impact (rows) with how many users are affected (columns) to get a base priority, then lowers it one step if a reasonable workaround exists. Treat the result as a starting point for triage; deadlines, customer commitments, and security concerns can justify moving it.' },
  { question: 'What are the stages of the bug life cycle?', answer: 'A typical bug life cycle is New, Assigned, In progress, Fixed, In verification, and Closed. Along the way a bug can also be Reopened when the fix fails verification, Deferred to a later release, or Rejected as a duplicate, not a bug, or not reproducible.' },
]

export default function BugSeverityMatrixPage() {
  return (
    <ToolPageLayout meta={meta} current="bug-severity-matrix" breadcrumb={{ name: 'Bug Severity Matrix', href: meta.path }} faqs={faqs}>
      <ToolHero title="Bug Severity vs Priority Matrix" description="Pick the impact, reach, and workaround to get a suggested severity level and P0–P4 priority, then copy it straight into the bug ticket." />
      <ToolFrame><BugSeverityMatrix /></ToolFrame>
      <ToolSection id="severity-vs-priority" pill="Severity vs priority" title="Severity vs priority." subtitle="Impact is not the same as urgency.">
        <ToolTable caption="Severity versus priority compared" columns={['', 'Severity', 'Priority']} rows={comparison} />
      </ToolSection>
      <ToolSection id="severity-levels" pill="Severity levels" title="Bug severity levels." subtitle="Definitions and examples for each level.">
        <ToolTable caption="Bug severity levels with definitions and examples" columns={['Severity', 'Definition', 'Example']} rows={severityRows} />
      </ToolSection>
      <ToolSection id="priority-levels" pill="Priority levels" title="Priority levels P0 to P4." subtitle="What each priority means for the team.">
        <ToolTable caption="Bug priority levels P0 to P4" columns={['Priority', 'Typical response']} rows={priorityRows} />
      </ToolSection>
      <ToolSection id="life-cycle" pill="Bug life cycle" title="The bug life cycle." subtitle="From report to closed, and the detours in between.">
        <ToolTable caption="Bug life cycle stages" columns={['Stage', 'What happens', 'Owner']} rows={lifecycle} />
      </ToolSection>
    </ToolPageLayout>
  )
}
