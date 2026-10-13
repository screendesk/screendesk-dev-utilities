import { ArrowTrendingDownIcon, BanknotesIcon, BoltSlashIcon, FaceFrownIcon, HeartIcon, NoSymbolIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { BurnoutCalculator } from '@/components/BurnoutCalculator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/burnout-calculator',
  title: 'Support Team Burnout Risk Calculator - Prevent Agent Burnout | Screendesk',
  description: 'Calculate your support team’s burnout risk score. Analyze workload, ticket complexity, and team health to prevent agent burnout and reduce turnover. Free tool with actionable recommendations.',
  keywords: 'support team burnout, agent burnout calculator, customer service burnout, help desk burnout, support team wellness, agent turnover, support team health, burnout prevention, customer service stress',
}

const reasons = [
  { icon: BanknotesIcon, title: 'Costly turnover', copy: 'Replacing a support agent costs 6–9 months of their salary. Burnout is the #1 cause of support team turnover.' },
  { icon: ArrowTrendingDownIcon, title: 'Quality decline', copy: 'Burned-out agents provide 38% lower quality support, leading to decreased customer satisfaction and retention.' },
  { icon: UserGroupIcon, title: 'Team morale', copy: 'Burnout is contagious. One burned-out team member can negatively impact the entire team’s morale and productivity.' },
]

const warningSigns = [
  { icon: FaceFrownIcon, title: 'Emotional exhaustion', copy: 'Increased irritability or frustration. Feeling drained at the end of the day. Lack of enthusiasm for work.' },
  { icon: BoltSlashIcon, title: 'Decreased performance', copy: 'Slower response times. More errors or oversights. Difficulty concentrating.' },
  { icon: NoSymbolIcon, title: 'Disengagement', copy: 'Avoiding team meetings or collaboration. Cynicism about work or customers. Talking about leaving or job hunting.' },
  { icon: HeartIcon, title: 'Physical symptoms', copy: 'Increased sick days. Headaches or sleep issues. Stress-related health problems.' },
]

const faqs = [
  { question: 'What causes support team burnout?', answer: 'Burnout typically results from a combination of factors: excessive workload, dealing with difficult customers, lack of control or autonomy, insufficient support from management, poor tools that make work harder, and lack of recognition. Repetitive, emotionally draining work without adequate breaks or support is a recipe for burnout.' },
  { question: 'How accurate is this burnout calculator?', answer: 'This calculator uses research-backed factors that correlate with burnout risk, including workload metrics, complexity indicators, support levels, and environmental factors. While it provides a useful assessment, it should be combined with direct feedback from your team through surveys, one-on-ones, and observation of behavioral changes.' },
  { question: 'What’s a healthy tickets-per-agent ratio?', answer: 'It depends on ticket complexity and handle time, but generally 20–30 tickets per agent per day is sustainable for most support teams. Above 35–40 tickets per day, quality and agent wellbeing typically suffer. The key is ensuring agents have time for breaks, training, and aren’t constantly in reactive mode.' },
  { question: 'How can video support reduce burnout?', answer: 'Video support reduces burnout in several ways: it cuts down on repetitive back-and-forth emails (reducing workload), helps resolve complex issues faster (reducing frustration), makes communication more human and less draining, and gives agents more control over how they communicate.' },
  { question: 'What should I do if my team scores high risk?', answer: 'Take immediate action: 1) Talk to your team to understand their biggest pain points, 2) Identify quick wins (better tools, reduced workload, more breaks), 3) Create a plan to address systemic issues, 4) Communicate changes clearly, 5) Monitor progress weekly. Don’t wait — high burnout leads to costly turnover and poor customer experience.' },
  { question: 'How often should I assess burnout risk?', answer: 'Assess burnout risk quarterly at minimum, or monthly if you’re in a high-stress period (product launch, seasonal spike, etc.). Track key metrics continuously (tickets per agent, overtime, turnover) and conduct regular pulse surveys. The earlier you catch warning signs, the easier they are to address.' },
]

export default function BurnoutCalculatorPage() {
  return (
    <ToolPageLayout meta={meta} current="burnout-calculator" breadcrumb={{ name: 'Burnout Risk Calculator', href: meta.path }} faqs={faqs}>
      <ToolHero title="Support Team Burnout Risk Calculator" description="Assess your team’s burnout risk across workload, complexity, support, and environment. Get a risk score and recommendations to improve team health and reduce turnover." />
      <ToolFrame><BurnoutCalculator /></ToolFrame>
      <ToolSection id="why" pill="Why it matters" title="Why burnout prevention matters." subtitle="Burnout costs you agents, quality, and morale.">
        <ToolPoints items={reasons} />
      </ToolSection>
      <ToolSection id="warning-signs" pill="Warning signs" title="Warning signs of burnout." subtitle="Watch for these indicators in your support team.">
        <ToolPoints items={warningSigns} />
      </ToolSection>
    </ToolPageLayout>
  )
}
