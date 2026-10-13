import { CalculatorIcon, ChatBubbleLeftRightIcon, ClockIcon } from '@heroicons/react/24/outline'
import { SurveyScoreCalculator } from '@/components/tools/SurveyScoreCalculator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/csat-calculator',
  title: 'CSAT Calculator: Customer Satisfaction Score | Screendesk',
  description: 'Free CSAT calculator. Enter ratings or paste raw 1–5 scores to calculate your customer satisfaction score and its margin of error.',
  keywords: 'csat calculator, customer satisfaction score calculator, how to calculate csat, csat formula, csat score, customer satisfaction calculator',
}

const points = [
  { icon: ChatBubbleLeftRightIcon, title: 'Ask one question', copy: '“How satisfied were you with the support you received?” on a 1–5 scale, right after the conversation.' },
  { icon: CalculatorIcon, title: 'Count the 4s and 5s', copy: 'CSAT = satisfied responses (4–5) ÷ total responses × 100.' },
  { icon: ClockIcon, title: 'Track it per period', copy: 'Compare weekly or monthly, by agent or by topic, to find where satisfaction drops.' },
]

const ranges = [
  ['90% and above', 'Excellent', 'Look at the remaining low ratings one by one'],
  ['80–89%', 'Good', 'Group low ratings by topic to find patterns'],
  ['70–79%', 'Fair', 'Check response times and repeat contacts'],
  ['Below 70%', 'Needs work', 'Review recent low-rated conversations with the team'],
]

const faqs = [
  { question: 'How do you calculate CSAT?', answer: 'Divide the number of satisfied responses (4 or 5 on a 1–5 scale) by the total number of responses, then multiply by 100. For example, 170 satisfied out of 200 responses is a CSAT of 85%.' },
  { question: 'What is a good CSAT score?', answer: 'Many support teams aim for 80% or higher, and 90%+ is strong. What counts as good depends on your industry, channel, and when the survey is sent, so trend against your own baseline.' },
  { question: 'Should I use a 1–5 or 1–10 scale?', answer: 'A 1–5 scale is the most common for support CSAT and is what this calculator uses. If you use another scale, decide which answers count as satisfied (typically the top two options) and enter those counts as Satisfied.' },
  { question: 'What is the difference between CSAT and NPS?', answer: 'CSAT measures satisfaction with a specific interaction, such as a support conversation. NPS measures overall loyalty: how likely someone is to recommend you. Support teams usually track CSAT per ticket and NPS at the company level.' },
  { question: 'How many responses do I need?', answer: 'More is better. With 100 responses and an 85% score, the 95% margin of error is about ±7 points. The calculator shows the margin for your numbers so you know how much a change needs to move before it means something.' },
]

export default function CsatCalculatorPage() {
  return (
    <ToolPageLayout meta={meta} current="csat-calculator" breadcrumb={{ name: 'CSAT Calculator', href: meta.path }} faqs={faqs}>
      <ToolHero title="CSAT Calculator" description="Calculate your customer satisfaction score from rating counts or raw 1–5 scores, with the margin of error for your sample size." />
      <ToolFrame><SurveyScoreCalculator type="csat" /></ToolFrame>
      <ToolSection id="formula" pill="How it works" title="The CSAT formula." subtitle="Satisfied responses over all responses.">
        <ToolPoints items={points} />
      </ToolSection>
      <ToolSection id="ranges" pill="Reading your score" title="What your CSAT means." subtitle="General ranges; compare against your own history first.">
        <ToolTable caption="CSAT score ranges" columns={['CSAT', 'Rating', 'Next step']} rows={ranges} />
      </ToolSection>
    </ToolPageLayout>
  )
}
