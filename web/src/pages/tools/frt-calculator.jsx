import { ChartBarIcon, FaceSmileIcon, BanknotesIcon } from '@heroicons/react/24/outline'
import { FRTCalculator } from '@/components/FRTCalculator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/frt-calculator',
  title: 'Free First Response Time (FRT) Calculator for Support Teams - Screendesk',
  description: 'Calculate your support team’s First Response Time (FRT) and get actionable insights to improve customer satisfaction. Free FRT calculator with benchmarks and recommendations.',
  keywords: 'first response time calculator, FRT calculator, support response time, customer service metrics, help desk FRT, support team performance, response time benchmarks, customer support KPIs',
}

const reasons = [
  { icon: FaceSmileIcon, title: 'Customer satisfaction', copy: '90% of customers rate an “immediate” response as important or very important when they have a support question.' },
  { icon: BanknotesIcon, title: 'Revenue impact', copy: 'Companies with faster response times see 15–20% higher customer retention and increased lifetime value.' },
  { icon: ChartBarIcon, title: 'Competitive advantage', copy: 'Fast response times differentiate your brand. 66% of customers switch companies due to poor service.' },
]

const benchmarks = [
  ['SaaS / Software', '< 1 hour', '< 3 hours', '< 6 hours', '> 12 hours'],
  ['E-commerce / Retail', '< 30 min', '< 2 hours', '< 4 hours', '> 8 hours'],
  ['Finance / Banking', '< 15 min', '< 1 hour', '< 2 hours', '> 4 hours'],
  ['Healthcare', '< 30 min', '< 90 min', '< 3 hours', '> 6 hours'],
  ['General / Other', '< 2 hours', '< 4 hours', '< 8 hours', '> 16 hours'],
]

const faqs = [
  { question: 'What is First Response Time (FRT)?', answer: 'First Response Time (FRT) is the average time it takes for your support team to send the first response to a customer inquiry. It’s measured from when the ticket is created to when the first reply is sent. FRT is one of the most important customer service metrics because it directly impacts customer satisfaction.' },
  { question: 'How do I calculate FRT?', answer: 'To calculate FRT, add up the time it took to send the first response for all tickets, then divide by the total number of tickets. For example: if you responded to 100 tickets and the total response time was 500 minutes, your FRT is 5 minutes (500 ÷ 100 = 5).' },
  { question: 'What’s a good First Response Time?', answer: 'It depends on your industry. For SaaS companies, under 1 hour is excellent, while e-commerce should aim for under 30 minutes. Finance and healthcare require even faster responses (under 15–30 minutes). The key is to set realistic targets based on your industry benchmarks and customer expectations.' },
  { question: 'How can I improve my FRT?', answer: 'Key strategies include: using canned responses for common questions, implementing auto-acknowledgment emails, ensuring adequate team coverage during peak hours, using video responses for complex issues, and optimizing your ticket routing and prioritization.' },
  { question: 'Should I count auto-responses in FRT?', answer: 'No. FRT should measure the time to the first meaningful human response, not automated acknowledgments. While auto-responses are helpful for setting expectations, they don’t solve the customer’s problem. Track them separately as “acknowledgment time” if needed.' },
  { question: 'What’s the difference between FRT and resolution time?', answer: 'FRT measures how quickly you send the first response, while resolution time measures how long it takes to fully solve the customer’s issue. Both are important: FRT shows responsiveness and sets expectations, while resolution time shows efficiency. A fast FRT with slow resolution can still frustrate customers.' },
]

export default function FRTCalculatorPage() {
  return (
    <ToolPageLayout meta={meta} current="frt-calculator" breadcrumb={{ name: 'FRT Calculator', href: meta.path }} faqs={faqs}>
      <ToolHero title="First Response Time Calculator" description="Calculate your team’s First Response Time, compare it with industry benchmarks, and get recommendations to improve customer satisfaction." />
      <ToolFrame><FRTCalculator /></ToolFrame>
      <ToolSection id="why" pill="Why it matters" title="Why first response time matters." subtitle="The first reply sets the tone for the whole conversation.">
        <ToolPoints items={reasons} />
      </ToolSection>
      <ToolSection id="benchmarks" pill="Benchmarks" title="Industry benchmarks." subtitle="Compare your first response time with industry standards.">
        <ToolTable caption="First response time benchmarks by industry" columns={['Industry', 'Excellent', 'Good', 'Average', 'Poor']} rows={benchmarks} />
      </ToolSection>
    </ToolPageLayout>
  )
}
