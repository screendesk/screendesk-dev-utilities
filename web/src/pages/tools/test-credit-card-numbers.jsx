import { DocumentMagnifyingGlassIcon, KeyIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import { TestCardNumbers } from '@/components/tools/qa/TestCardNumbers'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/test-credit-card-numbers',
  title: 'Test Credit Card Numbers for Stripe, Braintree & Adyen - Screendesk',
  description: 'Stripe test cards, Braintree and Adyen sandbox card numbers for success, decline, insufficient funds, and 3D Secure scenarios. Copy test numbers and validate with a free Luhn checker.',
  keywords: 'stripe test cards, test credit card numbers, stripe test card numbers, braintree test cards, adyen test cards, test card numbers, luhn validator, credit card generator for testing, sandbox credit card',
}

const tips = [
  { icon: KeyIcon, title: 'Use test-mode keys', copy: 'Test cards only work with the provider’s sandbox or test-mode API keys. In live mode they are declined, and real cards never belong in test mode.' },
  { icon: ShieldCheckIcon, title: 'Cover the unhappy paths', copy: 'Run declines, insufficient funds, expired cards, and 3D Secure challenges, not just the success card. Most checkout bugs sit in error handling.' },
  { icon: DocumentMagnifyingGlassIcon, title: 'Capture what failed', copy: 'When a payment test fails, record the error message, the network response from your server, and the provider’s request ID so a developer can reproduce it.' },
]

const rules = [
  ['Stripe', 'Any future date', 'Any 3 digits (4 for Amex)', 'Test-mode API keys', <a key="s" href="https://docs.stripe.com/testing" target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-300 underline-offset-4">docs.stripe.com/testing</a>],
  ['Braintree', 'A future date', 'Any; 200 and 201 trigger CVV responses when rules are on', 'Sandbox account', <a key="b" href="https://developer.paypal.com/braintree/docs/reference/general/testing" target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-300 underline-offset-4">Braintree testing reference</a>],
  ['Adyen', '03/30', '737 (7373 for Amex); optional on some cards', 'Test environment', <a key="a" href="https://docs.adyen.com/development-resources/test-cards-and-credentials/test-card-numbers" target="_blank" rel="noopener noreferrer" className="underline decoration-zinc-300 underline-offset-4">Adyen test card numbers</a>],
]

const faqs = [
  { question: 'What is the Stripe test card number?', answer: 'The most used Stripe test card is 4242 4242 4242 4242 (Visa), which simulates a successful payment. Use any future expiry date and any 3-digit CVC. Stripe also publishes cards that simulate declines, such as 4000 0000 0000 0002 for a generic decline and 4000 0000 0000 9995 for insufficient funds.' },
  { question: 'Can I use these test credit card numbers to buy things?', answer: 'No. Test card numbers only work in a payment provider’s sandbox or test mode. They are not linked to any account, carry no funds, and are declined in live mode.' },
  { question: 'Do the generated Luhn-valid numbers work in Stripe or Braintree?', answer: 'No. The generator creates synthetic numbers that pass the Luhn checksum, which is useful for testing form validation, input masks, and brand detection. Payment sandboxes only accept their own published test numbers, listed in the tables above.' },
  { question: 'How do I test a 3D Secure payment?', answer: 'Use a card the provider marks as requiring authentication, for example Stripe’s 4000 0027 6000 3184 or Adyen’s 3D Secure 2 test card. The sandbox shows a test challenge page where you can approve or fail the authentication.' },
  { question: 'Why did my test card stop working?', answer: 'Providers occasionally change or retire test numbers and scenarios. Check the provider’s testing docs for the current list, confirm you are using test-mode keys, and check that your integration isn’t blocking the card through its own validation or fraud rules.' },
]

export default function TestCreditCardNumbersPage() {
  return (
    <ToolPageLayout meta={meta} current="test-credit-card-numbers" breadcrumb={{ name: 'Test Credit Card Numbers', href: meta.path }} faqs={faqs}>
      <ToolHero title="Test Credit Card Numbers" description="Stripe, Braintree, and Adyen test cards for successful payments, declines, and 3D Secure, with a Luhn validator and a generator for form testing." />
      <ToolFrame><TestCardNumbers /></ToolFrame>
      <ToolSection id="rules" pill="Expiry and CVC" title="Expiry and CVC by provider." subtitle="What to enter alongside the test card number.">
        <ToolTable caption="Test card expiry date and CVC rules by payment provider" columns={['Provider', 'Expiry date', 'CVC', 'Environment', 'Source']} rows={rules} />
      </ToolSection>
      <ToolSection id="tips" pill="Testing payments" title="How to test a checkout." subtitle="Success is one card. The bugs live in the other scenarios.">
        <ToolPoints items={tips} />
      </ToolSection>
    </ToolPageLayout>
  )
}
