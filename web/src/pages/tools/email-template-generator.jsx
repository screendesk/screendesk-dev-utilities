import { ClockIcon, FaceSmileIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { EmailTemplateGenerator } from '@/components/EmailTemplateGenerator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/email-template-generator',
  title: 'Free Customer Support Email Templates Generator | 50+ Professional Templates - Screendesk',
  description: 'Generate professional customer support email templates instantly. Free templates for refunds, bug reports, apologies, follow-ups, and more. Copy-paste ready responses for support teams.',
  keywords: 'customer service email templates, support email templates, customer support responses, email templates for customer service, help desk email templates, support ticket responses, customer service reply templates',
}

const reasons = [
  { icon: ClockIcon, title: 'Save time', copy: 'Respond to common issues in seconds instead of writing from scratch every time. Reduce average response time by 60%.' },
  { icon: UserGroupIcon, title: 'Stay consistent', copy: 'Ensure your entire team communicates with the same professional tone and includes all necessary information.' },
  { icon: FaceSmileIcon, title: 'Improve satisfaction', copy: 'Well-crafted responses lead to happier customers. Professional templates help maintain quality under pressure.' },
]

const faqs = [
  { question: 'Can I customize these templates for my brand?', answer: 'Absolutely! These templates are designed as starting points. You can (and should) customize them with your brand voice, company policies, and specific details. Add your logo, adjust the tone, and make them your own.' },
  { question: 'How do I choose the right tone?', answer: 'Consider your brand personality and the situation. Use “Friendly” for most everyday interactions, “Formal” for enterprise customers or serious issues, “Empathetic” when customers are frustrated or upset, and “Concise” when customers prefer quick, direct communication.' },
  { question: 'Should I use templates for every response?', answer: 'Templates work best for common, repetitive scenarios. For unique or complex issues, use templates as a framework but personalize heavily. The key is to sound human, not robotic. Always read through and adjust before sending.' },
  { question: 'How can I make templates feel more personal?', answer: 'Always use the customer’s name, reference specific details from their message, add a personal touch or observation, and adjust the language to match their communication style. Templates should be a starting point, not a copy-paste solution.' },
  { question: 'What if my issue doesn’t fit these scenarios?', answer: 'Mix and match! Take the greeting from one template, the body from another, and the closing from a third. Or use the structure and tone as inspiration to write your own. These templates cover 80% of common scenarios, but you can adapt them for anything.' },
  { question: 'When should I use video instead of email?', answer: 'Use video for complex technical issues, visual bugs, step-by-step tutorials, or when you’ve gone back-and-forth multiple times via email. Video can resolve in one message what might take 5–10 emails. Screendesk makes it easy to send quick screen recordings directly from your helpdesk.' },
]

export default function EmailTemplateGeneratorPage() {
  return (
    <ToolPageLayout meta={meta} current="email-template-generator" breadcrumb={{ name: 'Email Template Generator', href: meta.path }} faqs={faqs}>
      <ToolHero title="Customer Support Email Template Generator" description="Generate professional, customizable email templates for common customer support scenarios. Save time and stay consistent across your support team." />
      <ToolFrame><EmailTemplateGenerator /></ToolFrame>
      <ToolSection id="why" pill="Why it matters" title="Why use email templates." subtitle="Faster replies, one voice across the team.">
        <ToolPoints items={reasons} />
      </ToolSection>
    </ToolPageLayout>
  )
}
