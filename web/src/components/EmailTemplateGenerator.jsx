import { useState } from 'react'
import { ArrowRightIcon, CheckIcon, ClipboardDocumentIcon, VideoCameraIcon } from '@heroicons/react/24/outline'
import { ui } from '@/components/tools/toolUi'

export function EmailTemplateGenerator() {
  const [scenario, setScenario] = useState('refund-request')
  const [tone, setTone] = useState('friendly')
  const [customerName, setCustomerName] = useState('')
  const [customDetails, setCustomDetails] = useState('')
  const [copied, setCopied] = useState(false)

  const scenarios = [
    { id: 'refund-request', name: 'Refund Request' },
    { id: 'bug-report', name: 'Bug Report' },
    { id: 'feature-request', name: 'Feature Request' },
    { id: 'apology', name: 'Apology / Service Issue' },
    { id: 'follow-up', name: 'Follow-up' },
    { id: 'account-issue', name: 'Account Issue' },
    { id: 'billing-question', name: 'Billing Question' },
    { id: 'how-to', name: 'How-to / Tutorial' },
    { id: 'feedback-request', name: 'Feedback Request' },
    { id: 'escalation', name: 'Escalation' },
    { id: 'cancellation', name: 'Cancellation Request' },
    { id: 'thank-you', name: 'Thank You' },
  ]

  const tones = [
    { id: 'friendly', name: 'Friendly', description: 'Warm and approachable' },
    { id: 'formal', name: 'Formal', description: 'Professional and polished' },
    { id: 'empathetic', name: 'Empathetic', description: 'Understanding and caring' },
    { id: 'concise', name: 'Concise', description: 'Brief and to the point' },
  ]

  const generateTemplate = () => {
    const name = customerName || '[Customer Name]'
    const details = customDetails || '[specific details]'
    
    // Template library - organized by scenario and tone
    const templates = {
      'refund-request': {
        friendly: `Hi ${name},

Thanks for reaching out about your refund request.

I completely understand your situation, and I'm happy to help! I've processed your refund of [amount] and you should see it back in your account within 5-7 business days.

${details ? `Regarding ${details}, ` : ''}I want to make sure you had the best experience possible. If there's anything we could have done better, I'd love to hear your feedback.

Is there anything else I can help you with today?

Best regards,
[Your Name]`,
        formal: `Dear ${name},

Thank you for contacting us regarding your refund request.

I have reviewed your account and processed a refund of [amount] as requested. The refund will be credited to your original payment method within 5-7 business days.

${details ? `In reference to ${details}, ` : ''}We value your feedback and would appreciate any insights you can share about your experience.

Should you require any further assistance, please do not hesitate to contact us.

Sincerely,
[Your Name]`,
        empathetic: `Hi ${name},

I'm so sorry to hear that things didn't work out as expected.

I completely understand how frustrating this must be, and I want to make this right for you. I've immediately processed your refund of [amount], and you'll see it back in your account within 5-7 business days.

${details ? `I really appreciate you sharing ${details} with me. ` : ''}Your experience matters to us, and I'm genuinely sorry we didn't meet your expectations this time.

If there's anything else I can do to help, please don't hesitate to reach out.

Warmly,
[Your Name]`,
        concise: `Hi ${name},

Your refund of [amount] has been processed and will appear in your account within 5-7 business days.

${details ? `Re: ${details} - ` : ''}Thank you for your feedback.

Let me know if you need anything else.

Best,
[Your Name]`
      },
      'bug-report': {
        friendly: `Hi ${name},

Thanks so much for reporting this issue! 🐛

I really appreciate you taking the time to let us know about ${details || 'this bug'}. Our engineering team is already looking into it, and I've added your report to the ticket.

Here's what happens next:
• Our team will investigate the issue
• We'll keep you updated on progress
• You'll be notified when it's fixed

In the meantime, ${details ? 'here\'s a workaround you can try: [workaround steps]' : 'let me know if you need a temporary workaround'}.

Thanks for helping us improve!

Best,
[Your Name]`,
        formal: `Dear ${name},

Thank you for bringing this technical issue to our attention.

We have received your bug report regarding ${details || 'the reported issue'} and have escalated it to our engineering team for immediate investigation.

Our team will:
1. Analyze the issue thoroughly
2. Develop and test a fix
3. Deploy the solution
4. Notify you upon resolution

We appreciate your patience and will keep you informed of our progress.

Best regards,
[Your Name]`,
        empathetic: `Hi ${name},

I'm really sorry you're experiencing this issue - I know how frustrating bugs can be!

Thank you for the detailed report about ${details || 'this problem'}. I've immediately flagged this with our engineering team, and they're treating it as a priority.

I understand this is impacting your work, so ${details ? 'in the meantime, here\'s what you can try: [workaround]' : 'please let me know if you need an immediate workaround'}.

I'll personally keep you updated on the progress and make sure you're the first to know when it's fixed.

Hang in there!
[Your Name]`,
        concise: `Hi ${name},

Bug confirmed: ${details || '[issue description]'}

Status: Escalated to engineering team
ETA: Will update within 24-48 hours
Workaround: [if available]

Thanks for reporting this.

[Your Name]`
      },
      'feature-request': {
        friendly: `Hi ${name},

Thanks for this awesome suggestion! ✨

I love the idea of ${details || '[feature description]'}. It sounds like it would really improve your workflow, and I can see how other customers would benefit too.

I've added your request to our product roadmap and made sure our product team sees it. While I can't promise a timeline, I can tell you that customer feedback like yours directly influences what we build next.

Want to stay in the loop? I can add you to our beta program so you'll be first to try new features when they launch.

Thanks for helping us build a better product!

Best,
[Your Name]`,
        formal: `Dear ${name},

Thank you for your feature request.

We have received your suggestion regarding ${details || '[feature description]'} and have forwarded it to our product development team for consideration.

All feature requests are evaluated based on:
• Customer demand and impact
• Technical feasibility  
• Alignment with product strategy

While we cannot guarantee implementation, your feedback is valuable and will be considered in our product planning process.

Thank you for your continued support.

Sincerely,
[Your Name]`,
        empathetic: `Hi ${name},

Thank you so much for sharing this idea with us!

I can really see how ${details || '[feature description]'} would make your life easier, and I appreciate you taking the time to explain your use case.

I've personally passed this along to our product team with all the context you provided. While I can't make any promises about timing, I want you to know that requests from engaged customers like you carry a lot of weight in our planning discussions.

Would you be interested in being part of our beta program? That way, if we do build this, you'd be among the first to try it out.

Thanks for being such an engaged user!

[Your Name]`,
        concise: `Hi ${name},

Feature request received: ${details || '[feature description]'}

• Logged in product roadmap
• Shared with product team
• Will notify if/when prioritized

Thanks for the suggestion!

[Your Name]`
      },
      'apology': {
        friendly: `Hi ${name},

I'm really sorry about ${details || 'the issue you experienced'}.

This isn't the experience we want you to have, and I take full responsibility for the inconvenience this has caused. Here's what happened and what we're doing about it:

[Brief explanation of what went wrong]

To make this right, I've [action taken - e.g., issued a credit, expedited your request, etc.].

I really appreciate your patience and understanding. If there's anything else I can do to help, please let me know - I'm here for you.

Thanks for giving us the chance to make this better.

Best,
[Your Name]`,
        formal: `Dear ${name},

Please accept our sincere apologies for ${details || 'the inconvenience you have experienced'}.

We understand the impact this has had on you, and we take full responsibility for this service failure. Upon investigation, we have identified the root cause and have taken the following corrective actions:

[Explanation and resolution steps]

As a gesture of goodwill, we have [compensation/remedy].

We value your business and are committed to ensuring this does not happen again. Thank you for your patience and understanding.

Sincerely,
[Your Name]`,
        empathetic: `Hi ${name},

I'm so sorry about ${details || 'what happened'}.

I can only imagine how frustrating and disappointing this must have been for you. You trusted us, and we let you down - there's no excuse for that.

Here's what I've done immediately:
• [Action 1]
• [Action 2]
• [Compensation/remedy]

But more importantly, I want you to know that I've personally escalated this to make sure it never happens to you (or anyone else) again.

Thank you for your patience and for giving us another chance. I'm here if you need anything at all.

With sincere apologies,
[Your Name]`,
        concise: `Hi ${name},

I apologize for ${details || 'the issue'}.

What happened: [Brief explanation]
What we've done: [Resolution]
Compensation: [If applicable]

This won't happen again. Thank you for your patience.

[Your Name]`
      },
      'follow-up': {
        friendly: `Hi ${name},

Just checking in! 👋

I wanted to follow up on ${details || 'your recent ticket'} to make sure everything is working smoothly now.

Did the solution I provided work for you? If you're still experiencing any issues or have any questions, just let me know - I'm happy to help!

If everything's good, no need to reply. But I'm here if you need me.

Have a great day!
[Your Name]`,
        formal: `Dear ${name},

I am writing to follow up on ${details || 'your recent support request'}.

I wanted to ensure that the resolution provided has fully addressed your concern and that you are satisfied with the outcome.

Should you require any additional assistance or have further questions, please do not hesitate to contact us.

Thank you for your time.

Best regards,
[Your Name]`,
        empathetic: `Hi ${name},

I hope this message finds you well!

I've been thinking about ${details || 'your issue'} and wanted to make sure everything is working perfectly for you now.

Sometimes solutions that seem good in the moment don't quite work out in practice, so I wanted to check in personally. If anything isn't quite right, or if you have any questions at all, please reach out - I'm here to help.

I really appreciate your patience through this!

Warmly,
[Your Name]`,
        concise: `Hi ${name},

Following up on: ${details || '[previous issue]'}

Status: Resolved?
Need anything else?

Let me know!
[Your Name]`
      },
      'account-issue': {
        friendly: `Hi ${name},

Thanks for reaching out about your account!

I've looked into ${details || 'the issue you mentioned'} and here's what I found:

[Explanation of the issue]

I've gone ahead and [action taken - e.g., reset your password, updated your permissions, etc.]. You should be all set now!

To get back in:
1. [Step 1]
2. [Step 2]
3. [Step 3]

If you run into any trouble, just reply to this email and I'll help you out right away.

Best,
[Your Name]`,
        formal: `Dear ${name},

Thank you for contacting us regarding your account.

We have investigated ${details || 'the reported issue'} and have taken the necessary steps to resolve it. Your account has been [action taken].

To access your account:
1. [Step 1]
2. [Step 2]
3. [Step 3]

For security purposes, we recommend [security recommendation].

Should you encounter any difficulties, please contact us immediately.

Best regards,
[Your Name]`,
        empathetic: `Hi ${name},

I'm sorry you're having trouble accessing your account - I know how stressful that can be!

I've personally looked into ${details || 'your account'} and I've got good news: I was able to [action taken]. Everything should be working now.

Here's how to get back in:
1. [Step 1]
2. [Step 2]

If you have any trouble at all, please reach out immediately - I'll be monitoring my email and will help you right away.

You're all set!
[Your Name]`,
        concise: `Hi ${name},

Account issue: ${details || '[description]'}
Resolution: [Action taken]

Access steps:
1. [Step 1]
2. [Step 2]

You're all set. Let me know if you need help.

[Your Name]`
      },
      'billing-question': {
        friendly: `Hi ${name},

Thanks for reaching out about your billing!

I'd be happy to explain ${details || 'the charge you asked about'}:

[Explanation of the charge/billing question]

Your current plan: [Plan details]
Next billing date: [Date]
Amount: [Amount]

Does this make sense? If you have any other questions about your billing or want to make any changes to your plan, just let me know!

Best,
[Your Name]`,
        formal: `Dear ${name},

Thank you for your inquiry regarding ${details || 'your billing'}.

Please find the requested information below:

Charge Description: [Details]
Billing Period: [Period]
Amount: [Amount]
Payment Method: [Method]

If you require any adjustments to your billing or have additional questions, please let us know and we will be happy to assist.

Best regards,
[Your Name]`,
        empathetic: `Hi ${name},

I completely understand wanting clarity on your billing - let me help explain!

Regarding ${details || 'the charge you mentioned'}, here's what happened:

[Clear explanation]

I want to make sure you feel comfortable with your billing, so if anything seems off or if you'd like to discuss your plan options, I'm here to help. No question is too small!

What would be most helpful for you?

Best,
[Your Name]`,
        concise: `Hi ${name},

Billing question: ${details || '[question]'}

Answer:
• Charge: [Description]
• Amount: [Amount]
• Date: [Date]

Need changes? Let me know.

[Your Name]`
      },
      'how-to': {
        friendly: `Hi ${name},

Great question! I'd be happy to show you how to ${details || 'do that'}.

Here's a step-by-step guide:

1. [Step 1 with details]
2. [Step 2 with details]
3. [Step 3 with details]

Pro tip: [Helpful tip]

I've also attached a quick video walkthrough that might be helpful!

Did this answer your question? If you get stuck on any step, just let me know and I'll help you through it.

Happy to help!
[Your Name]`,
        formal: `Dear ${name},

Thank you for your inquiry regarding ${details || 'this feature'}.

Please follow these instructions:

Step 1: [Detailed instruction]
Step 2: [Detailed instruction]
Step 3: [Detailed instruction]

Additional resources:
• Documentation: [Link]
• Video tutorial: [Link]

Should you require further assistance, please do not hesitate to contact us.

Best regards,
[Your Name]`,
        empathetic: `Hi ${name},

I'm so glad you asked! ${details || 'This'} can be a bit tricky at first, but I'll walk you through it step by step.

Here's the easiest way to do it:

1. [Step 1 - explained simply]
2. [Step 2 - explained simply]
3. [Step 3 - explained simply]

Don't worry if it feels confusing at first - it gets easier with practice! And I'm here if you get stuck at any point.

Would a quick video call be helpful? I can show you in real-time!

You've got this!
[Your Name]`,
        concise: `Hi ${name},

How to ${details || '[task]'}:

1. [Step 1]
2. [Step 2]
3. [Step 3]

Video: [Link if available]
Docs: [Link if available]

Questions? Reply here.

[Your Name]`
      },
      'feedback-request': {
        friendly: `Hi ${name},

I hope you're doing well!

I wanted to reach out because your opinion really matters to us. You've been using ${details || 'our product'} for a while now, and I'd love to hear your thoughts.

Would you mind taking 2 minutes to share your feedback? Specifically:
• What do you love about it?
• What could be better?
• Any features you wish we had?

Your insights help us build a better product for everyone. As a thank you, I'd like to [incentive - e.g., give you early access to new features, enter you in a drawing, etc.].

Thanks so much for being an awesome customer!

Best,
[Your Name]`,
        formal: `Dear ${name},

We value your opinion and would appreciate your feedback on ${details || 'your recent experience'}.

Your insights are instrumental in helping us improve our products and services. We would be grateful if you could take a few moments to complete our brief survey:

[Survey link]

As a token of our appreciation, [incentive if applicable].

Thank you for your time and continued support.

Sincerely,
[Your Name]`,
        empathetic: `Hi ${name},

I hope this isn't a bad time!

I'm reaching out because I genuinely value your perspective. You've been using ${details || 'our product'}, and I'd really love to know: are we meeting your needs?

I'm not looking for a formal review - just honest thoughts:
• What's working well for you?
• What's frustrating?
• What would make your life easier?

Your feedback directly influences what we build next, and I want to make sure we're solving the right problems for you.

Would you be open to a quick chat? Or if you prefer, just reply to this email with your thoughts.

Thank you for helping us improve!

[Your Name]`,
        concise: `Hi ${name},

Quick favor: We'd love your feedback on ${details || 'your experience'}.

2-minute survey: [Link]

Your input shapes our roadmap.

Thanks!
[Your Name]`
      },
      'escalation': {
        friendly: `Hi ${name},

I want to make sure we get this resolved for you as quickly as possible.

I've escalated ${details || 'your issue'} to our senior support team, and here's what's happening next:

• Your ticket has been marked as high priority
• [Senior team member name] will be taking over
• You'll hear back within [timeframe]
• I'm staying involved to make sure this gets resolved

I know this has been frustrating, and I really appreciate your patience. We're going to get this sorted out for you.

I'll check in tomorrow to make sure you're getting the help you need.

Best,
[Your Name]`,
        formal: `Dear ${name},

Your case regarding ${details || 'the reported issue'} has been escalated to our senior support team for immediate attention.

Escalation Details:
• Priority Level: High
• Assigned To: [Team/Person]
• Expected Response: Within [timeframe]
• Case Number: [Number]

Our senior team has been fully briefed on your situation and will contact you shortly with a resolution plan.

We apologize for any inconvenience and appreciate your patience.

Best regards,
[Your Name]`,
        empathetic: `Hi ${name},

I want you to know that I hear you, and I'm taking this seriously.

I've personally escalated ${details || 'your case'} to our senior team because you deserve better than what you've experienced so far. Here's what I've done:

• Briefed our senior team on everything that's happened
• Marked your case as urgent priority
• Asked [senior team member] to personally handle this
• Set up a follow-up to ensure resolution

I'm genuinely sorry this has been such a frustrating experience. You shouldn't have to go through this, and I'm committed to making sure we fix it.

I'll be checking in regularly, and please don't hesitate to reach out to me directly if you need anything.

You have my word we'll make this right.

[Your Name]`,
        concise: `Hi ${name},

Issue escalated: ${details || '[description]'}

Status: High priority
Assigned to: [Senior team/person]
Response time: [Timeframe]

You'll hear from them soon.

[Your Name]`
      },
      'cancellation': {
        friendly: `Hi ${name},

I'm sorry to see you go! 😢

I've processed your cancellation request for ${details || 'your account'}. Your subscription will remain active until [end date], and you won't be charged again.

Before you go, I'd love to know: is there anything we could have done better? Your feedback helps us improve for everyone.

Also, just so you know:
• Your data will be available until [date]
• You can export your data anytime before then
• You're welcome back anytime - no penalties!

If you change your mind or if there's anything I can help with, just let me know.

Thanks for being a customer, and I wish you all the best!

[Your Name]`,
        formal: `Dear ${name},

We have processed your cancellation request for ${details || 'your subscription'}.

Cancellation Details:
• Effective Date: [Date]
• Final Billing: [Date/Amount]
• Data Retention: Until [Date]

To export your data before account closure, please visit [link].

We regret to see you go and would appreciate any feedback you can provide about your experience.

Should you wish to reactivate your account in the future, please contact us.

Best regards,
[Your Name]`,
        empathetic: `Hi ${name},

I'm really sorry to see you go, but I completely understand.

I've processed your cancellation for ${details || 'your account'}, and everything is taken care of. You'll have access until [date], and there won't be any further charges.

I want to be honest - it's always hard to see a customer leave, especially when we feel like we could have done better. If you're open to it, I'd really appreciate knowing what led to this decision. Even just a sentence or two would help us improve.

A few things to know:
• Your data is safe until [date]
• You can export everything at [link]
• If you ever want to come back, we'd love to have you

Thank you for giving us a try. I genuinely wish you the best with whatever you're moving to.

Take care,
[Your Name]`,
        concise: `Hi ${name},

Cancellation confirmed: ${details || '[account/subscription]'}

• Active until: [Date]
• Final charge: [Date/Amount]
• Data export: [Link]

Feedback welcome. Thanks for being a customer.

[Your Name]`
      },
      'thank-you': {
        friendly: `Hi ${name},

I just wanted to say thank you! 🎉

${details || 'Your recent interaction with us'} really made my day, and I wanted you to know how much we appreciate customers like you.

It's people like you who make this job rewarding, and I'm grateful to have you as a customer.

If there's ever anything I can do for you, please don't hesitate to reach out!

Thanks again!
[Your Name]`,
        formal: `Dear ${name},

Thank you for ${details || 'your recent interaction with us'}.

We greatly appreciate your business and the opportunity to serve you. Your satisfaction is our top priority, and we are pleased to have met your expectations.

Should you require any assistance in the future, please do not hesitate to contact us.

With appreciation,
[Your Name]`,
        empathetic: `Hi ${name},

I wanted to take a moment to say thank you.

${details || 'Your kindness and patience'} really meant a lot to me personally. In customer support, we don't always get to hear when things go well, so when someone like you takes the time to share positive feedback, it truly makes our day.

Thank you for being such a wonderful customer. It's a privilege to work with you!

Warmly,
[Your Name]`,
        concise: `Hi ${name},

Thank you for ${details || 'being a great customer'}!

We appreciate you.

[Your Name]`
      }
    }

    // Return the template or a default message
    return templates[scenario]?.[tone] || `Template for ${scenario} with ${tone} tone coming soon!`
  }

  const copyToClipboard = () => {
    const template = generateTemplate()
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeTone = tones.find(({ id }) => id === tone)

  return (
    <div className={ui.grid}>
      <div className={ui.card}>
        <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Your email</h2></div>
        <div className={`${ui.cardBody} ${ui.stack}`}>
          <div>
            <label htmlFor="scenario" className={ui.label}>Scenario</label>
            <select id="scenario" value={scenario} onChange={(e) => setScenario(e.target.value)} className={ui.select}>
              {scenarios.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <span id="tone-label" className={ui.label}>Tone</span>
            <div className={`${ui.segmented} flex w-full flex-wrap`} role="group" aria-labelledby="tone-label">
              {tones.map((t) => (
                <button key={t.id} type="button" aria-pressed={tone === t.id} onClick={() => setTone(t.id)} className={`${ui.segment(tone === t.id)} flex-1`}>{t.name}</button>
              ))}
            </div>
            <p className={ui.hint}>{activeTone.description}</p>
          </div>
          <div>
            <label htmlFor="customerName" className={ui.label}>Customer name <span className="font-normal text-zinc-500">(optional)</span></label>
            <input type="text" id="customerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={ui.input} placeholder="e.g., Sarah" />
          </div>
          <div>
            <label htmlFor="customDetails" className={ui.label}>Specific details <span className="font-normal text-zinc-500">(optional)</span></label>
            <textarea id="customDetails" value={customDetails} onChange={(e) => setCustomDetails(e.target.value)} rows={3} className={ui.textarea} placeholder="e.g., the login issue on mobile app" />
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:sticky lg:top-32">
        <div className={ui.card}>
          <div className={ui.cardHeader}>
            <h2 className={ui.cardTitle}>Your template</h2>
            <button type="button" onClick={copyToClipboard} className={`${ui.secondaryButton} h-8 px-3`}>
              {copied ? <><CheckIcon aria-hidden="true" className="size-4 text-emerald-600" />Copied</> : <><ClipboardDocumentIcon aria-hidden="true" className="size-4" />Copy</>}
            </button>
          </div>
          <pre className={`${ui.cardBody} max-h-[560px] overflow-y-auto whitespace-pre-wrap font-sans text-sm leading-relaxed text-zinc-700`} aria-live="polite">
            {generateTemplate()}
          </pre>
        </div>

        <div className={`${ui.card} flex gap-3 p-5`}>
          <VideoCameraIcon aria-hidden="true" className={`${ui.listIcon} mt-0.5`} />
          <div>
            <h3 className="text-sm font-medium text-zinc-900">Complex issue? Send a video instead.</h3>
            <p className="mt-0.5 text-sm text-zinc-500">Reply with a screen recording when words aren’t enough.</p>
            <a href="https://app.screendesk.io/users/sign_up" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-900 hover:text-rose-600">
              Try Screendesk free<ArrowRightIcon aria-hidden="true" className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
