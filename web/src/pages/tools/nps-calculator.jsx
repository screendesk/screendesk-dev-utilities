import { ArrowTrendingUpIcon, ScaleIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { SurveyScoreCalculator } from '@/components/tools/SurveyScoreCalculator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/nps-calculator',
  title: 'NPS Calculator: Calculate Your Net Promoter Score | Screendesk',
  description: 'Free NPS calculator. Enter promoters, passives, and detractors or paste raw 0–10 scores to get your Net Promoter Score with its margin of error.',
  keywords: 'nps calculator, net promoter score calculator, calculate nps, nps formula, nps score, promoters passives detractors',
}

const points = [
  { icon: UserGroupIcon, title: 'Group the answers', copy: 'Scores of 9–10 are promoters, 7–8 are passives, and 0–6 are detractors.' },
  { icon: ScaleIcon, title: 'Subtract the percentages', copy: 'NPS = % promoters − % detractors. Passives count toward the total but not the score.' },
  { icon: ArrowTrendingUpIcon, title: 'Read it as a range', copy: 'NPS runs from −100 to +100. Check the margin of error before calling a change real.' },
]

const ranges = [
  ['Below 0', 'More detractors than promoters', 'Find the common complaint first'],
  ['0 to 29', 'More promoters than detractors', 'Follow up with detractors to find fixable issues'],
  ['30 to 49', 'Strong loyalty for most industries', 'Ask promoters for reviews and referrals'],
  ['50 and above', 'Excellent', 'Protect what works; watch for drops'],
]

const faqs = [
  { question: 'How do you calculate NPS?', answer: 'Ask “How likely are you to recommend us to a friend or colleague?” on a 0–10 scale. Count respondents scoring 9–10 (promoters) and 0–6 (detractors). NPS is the percentage of promoters minus the percentage of detractors. For example, 60% promoters and 15% detractors gives an NPS of 45.' },
  { question: 'What is a good NPS?', answer: 'Any score above 0 means you have more promoters than detractors. Scores above 30 are commonly treated as good and above 50 as excellent, but averages vary widely by industry and survey method. The most useful comparison is your own score over time.' },
  { question: 'Why does the calculator show a margin of error?', answer: 'NPS from a sample is an estimate. The margin shown is a 95% confidence interval based on your number of responses and the split between promoters and detractors. If two periods differ by less than the margin, the change may be noise.' },
  { question: 'Do passives affect NPS?', answer: 'Passives (7–8) are not added or subtracted, but they count in the total number of responses. More passives therefore pull both promoter and detractor percentages toward zero.' },
  { question: 'Can NPS be negative?', answer: 'Yes. NPS ranges from −100 (every respondent is a detractor) to +100 (every respondent is a promoter).' },
]

export default function NpsCalculatorPage() {
  return (
    <ToolPageLayout meta={meta} current="nps-calculator" breadcrumb={{ name: 'NPS Calculator', href: meta.path }} faqs={faqs}>
      <ToolHero title="NPS Calculator" description="Calculate your Net Promoter Score from response counts or raw 0–10 scores, with the margin of error for your sample size." />
      <ToolFrame><SurveyScoreCalculator type="nps" /></ToolFrame>
      <ToolSection id="formula" pill="How it works" title="The NPS formula." subtitle="Three groups, one subtraction.">
        <ToolPoints items={points} />
      </ToolSection>
      <ToolSection id="ranges" pill="Reading your score" title="What your NPS means." subtitle="General ranges; compare against your own history first.">
        <ToolTable caption="NPS score ranges" columns={['NPS', 'What it means', 'Next step']} rows={ranges} />
      </ToolSection>
    </ToolPageLayout>
  )
}
