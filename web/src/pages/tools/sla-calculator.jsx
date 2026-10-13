import { ArrowTrendingUpIcon, ClockIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { SLACalculator } from '@/components/SLACalculator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/sla-calculator',
  title: 'Support SLA Calculator & SLA Formulas for Help Desks | Screendesk',
  description: 'Calculate the support team size you need to meet your SLA response times, and use the SLA formulas for compliance, staffing, and first response time.',
  keywords: 'support sla calculator, sla formula, service level agreement formula, sla calculation, help desk sla, customer support sla, sla compliance formula, support staffing calculator',
}

const reasons = [
  { icon: UserGroupIcon, title: 'Right-size your team', copy: 'Determine exactly how many support agents you need to meet your SLA targets based on ticket volume and business hours.' },
  { icon: ClockIcon, title: 'Meet SLA targets', copy: 'Calculate if your current team can meet response time commitments and identify gaps before they impact customers.' },
  { icon: ArrowTrendingUpIcon, title: 'Optimize performance', copy: 'Plan coverage schedules and identify opportunities to improve efficiency without adding headcount.' },
]

const formulas = [
  ['SLA compliance', '(Tickets answered within target ÷ total tickets) × 100', '182 of 200 within 1 hour = 91%'],
  ['Required agents', 'Tickets per day × handle time ÷ (hours per day × 60 × efficiency)', '400 × 12 min ÷ (8 × 60 × 0.8) = 12.5 → 13 agents'],
  ['Tickets per hour', 'Tickets per day ÷ support hours per day', '400 ÷ 10 h = 40 per hour'],
  ['Average first response time', 'Total time to first reply ÷ tickets with a reply', '3,000 min ÷ 200 = 15 min'],
  ['SLA breach rate', '(Tickets breaching target ÷ total tickets) × 100', '18 of 200 = 9%'],
]

const faqs = [
  { question: 'What is the SLA formula for customer support?', answer: 'The most common support SLA calculation is compliance: tickets answered within the target time divided by all tickets, times 100. If 182 of 200 tickets got a first reply within 1 hour, SLA compliance is 91%. Track it separately per priority level, since each usually has its own target.' },
  { question: 'What is an SLA in customer support?', answer: 'A Service Level Agreement (SLA) is a commitment between a service provider and customer that defines the expected level of service, including response times, resolution times, and availability. In customer support, SLAs typically specify how quickly tickets must be acknowledged and resolved.' },
  { question: 'How is average handle time calculated?', answer: 'Average Handle Time (AHT) is the total time spent on a ticket from first response to resolution, including research, communication, and follow-up. Calculate it by dividing total handling time by number of tickets over a specific period. Most support teams have AHT between 10–30 minutes depending on complexity.' },
  { question: 'Why does the calculator use an 80% efficiency factor?', answer: 'Support agents aren’t working on tickets 100% of the time. They need breaks, attend meetings, handle administrative tasks, and deal with system issues. The 80% efficiency factor accounts for this reality and provides more accurate staffing recommendations.' },
  { question: 'How can I reduce my required team size?', answer: 'You can reduce required team size by: 1) Decreasing average handle time through better tools (like video support), 2) Implementing self-service options to reduce ticket volume, 3) Using automation for common issues, 4) Improving first-contact resolution rates, and 5) Better agent training and knowledge management.' },
  { question: 'What’s a realistic SLA response time target?', answer: 'Common SLA targets vary by industry and support tier: Priority/Critical issues: 15–30 minutes, High priority: 1–4 hours, Normal priority: 8–24 hours, Low priority: 24–48 hours. B2B SaaS companies typically aim for 1-hour response times for paid customers during business hours.' },
  { question: 'How does video support affect these metrics?', answer: 'Video lets agents see the issue directly instead of trading messages to understand it, which usually shortens handle time and cuts follow-ups. A lower handle time means the same team can handle more tickets or meet tighter SLAs. Measure your own average handle time before and after, then enter it here to see the effect on staffing.' },
]

export default function SLACalculatorPage() {
  return (
    <ToolPageLayout meta={meta} current="sla-calculator" breadcrumb={{ name: 'SLA Calculator', href: meta.path }} faqs={faqs}>
      <ToolHero title="Support SLA Calculator" description="Calculate the team size, coverage, and response times your support team needs to meet its service level agreements." />
      <ToolFrame><SLACalculator /></ToolFrame>
      <ToolSection id="why" pill="Why use it" title="Plan your team around your SLAs." subtitle="Know your staffing needs before tickets pile up.">
        <ToolPoints items={reasons} />
      </ToolSection>
      <ToolSection id="formulas" pill="SLA formulas" title="Support SLA formulas." subtitle="The calculations behind help desk service levels.">
        <ToolTable caption="Support SLA formulas with worked examples" columns={['Metric', 'Formula', 'Example']} rows={formulas} />
      </ToolSection>
    </ToolPageLayout>
  )
}
