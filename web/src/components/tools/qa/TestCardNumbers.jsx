import { useMemo, useState } from 'react'
import { ArrowTopRightOnSquareIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { ui, Badge, CopyButton } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { digitsOnly, formatCardNumber, luhnCheck, luhnCheckDigit } from './qaUtils'

const SLUG = 'test-credit-card-numbers'

export const providers = [
  {
    id: 'stripe',
    name: 'Stripe',
    docs: 'https://docs.stripe.com/testing',
    guidance: 'Use any future expiry date and any 3-digit CVC (4 digits for American Express). Test mode keys only.',
    cards: [
      { number: '4242424242424242', brand: 'Visa', scenario: 'Successful payment', tone: 'positive' },
      { number: '4000056655665556', brand: 'Visa', scenario: 'Successful payment (debit)', tone: 'positive' },
      { number: '5555555555554444', brand: 'Mastercard', scenario: 'Successful payment', tone: 'positive' },
      { number: '5200828282828210', brand: 'Mastercard', scenario: 'Successful payment (debit)', tone: 'positive' },
      { number: '2223003122003222', brand: 'Mastercard', scenario: 'Successful payment (2-series)', tone: 'positive' },
      { number: '378282246310005', brand: 'American Express', scenario: 'Successful payment', tone: 'positive' },
      { number: '6011111111111117', brand: 'Discover', scenario: 'Successful payment', tone: 'positive' },
      { number: '3566002020360505', brand: 'JCB', scenario: 'Successful payment', tone: 'positive' },
      { number: '4000000000000002', brand: 'Visa', scenario: 'Generic decline', tone: 'negative' },
      { number: '4000000000009995', brand: 'Visa', scenario: 'Insufficient funds', tone: 'negative' },
      { number: '4000000000009987', brand: 'Visa', scenario: 'Lost card', tone: 'negative' },
      { number: '4000000000009979', brand: 'Visa', scenario: 'Stolen card', tone: 'negative' },
      { number: '4000000000000069', brand: 'Visa', scenario: 'Expired card', tone: 'negative' },
      { number: '4000000000000127', brand: 'Visa', scenario: 'Incorrect CVC', tone: 'negative' },
      { number: '4000000000000119', brand: 'Visa', scenario: 'Processing error', tone: 'negative' },
      { number: '4000002500003155', brand: 'Visa', scenario: '3D Secure: authenticate unless set up for future payments', tone: 'warning' },
      { number: '4000002760003184', brand: 'Visa', scenario: '3D Secure: always authenticate', tone: 'warning' },
    ],
  },
  {
    id: 'braintree',
    name: 'Braintree',
    docs: 'https://developer.paypal.com/braintree/docs/reference/general/testing',
    guidance: 'Sandbox only. Use a future expiry date. With AVS/CVV rules enabled, CVV 200 and 201 trigger N and U responses. Transaction outcome depends on amount: 2000.00–2999.99 simulates a processor decline.',
    cards: [
      { number: '4111111111111111', brand: 'Visa', scenario: 'Successful payment', tone: 'positive' },
      { number: '4005519200000004', brand: 'Visa', scenario: 'Successful payment', tone: 'positive' },
      { number: '5555555555554444', brand: 'Mastercard', scenario: 'Successful payment', tone: 'positive' },
      { number: '2223000048400011', brand: 'Mastercard', scenario: 'Successful payment (2-series)', tone: 'positive' },
      { number: '378282246310005', brand: 'American Express', scenario: 'Successful payment', tone: 'positive' },
      { number: '6011000991300009', brand: 'Discover', scenario: 'Successful payment', tone: 'positive' },
      { number: '3530111333300000', brand: 'JCB', scenario: 'Successful payment', tone: 'positive' },
      { number: '4000111111111115', brand: 'Visa', scenario: 'Unsuccessful verification (processor declined)', tone: 'negative' },
      { number: '5105105105105100', brand: 'Mastercard', scenario: 'Unsuccessful verification (processor declined)', tone: 'negative' },
      { number: '6011000990139424', brand: 'Discover', scenario: 'Unsuccessful verification (processor declined)', tone: 'negative' },
    ],
  },
  {
    id: 'adyen',
    name: 'Adyen',
    docs: 'https://docs.adyen.com/development-resources/test-cards-and-credentials/test-card-numbers',
    guidance: 'Test environment only. Use expiry 03/30 and CVC 737 (CVC 7373 for American Express) unless the docs list a different value.',
    cards: [
      { number: '4111111145551142', brand: 'Visa', scenario: 'Successful payment · 03/30 · CVC 737', tone: 'positive' },
      { number: '5555341244441115', brand: 'Mastercard', scenario: 'Successful payment · 03/30 · CVC 737', tone: 'positive' },
      { number: '370000000000002', brand: 'American Express', scenario: 'Successful payment · 03/30 · CVC 7373', tone: 'positive' },
      { number: '4917610000000000', brand: 'Visa', scenario: '3D Secure 2 authentication · 03/30 · CVC 737', tone: 'warning' },
    ],
  },
]

const generatorBrands = [
  { id: 'visa', name: 'Visa', prefixes: ['4'], length: 16 },
  { id: 'mastercard', name: 'Mastercard', prefixes: ['51', '52', '53', '54', '55'], length: 16 },
  { id: 'amex', name: 'American Express', prefixes: ['34', '37'], length: 15 },
  { id: 'discover', name: 'Discover', prefixes: ['6011'], length: 16 },
]

function detectBrand(digits) {
  if (/^4/.test(digits)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard'
  if (/^3[47]/.test(digits)) return 'American Express'
  if (/^6(011|5)/.test(digits)) return 'Discover'
  if (/^35/.test(digits)) return 'JCB'
  return 'Unknown'
}

function generateNumber(brand) {
  const prefix = brand.prefixes[Math.floor(Math.random() * brand.prefixes.length)]
  let body = prefix
  while (body.length < brand.length - 1) body += Math.floor(Math.random() * 10)
  return body + luhnCheckDigit(body)
}

export function TestCardNumbers() {
  const [providerId, setProviderId] = useState('stripe')
  const [brandFilter, setBrandFilter] = useState('all')
  const [outcome, setOutcome] = useState('all')
  const [validateInput, setValidateInput] = useState('')
  const [genBrand, setGenBrand] = useState('visa')
  const [genCount, setGenCount] = useState(5)
  const [generated, setGenerated] = useState([])
  const [used, setUsed] = useState(false)

  const provider = providers.find((item) => item.id === providerId)
  const brands = useMemo(() => [...new Set(provider.cards.map((card) => card.brand))], [provider])
  const cards = provider.cards.filter((card) => (brandFilter === 'all' || card.brand === brandFilter) && (outcome === 'all' || card.tone === outcome))

  const digits = digitsOnly(validateInput)
  const validation = digits.length >= 12 ? { valid: luhnCheck(digits), brand: detectBrand(digits), length: digits.length } : null

  const selectProvider = (id) => {
    setProviderId(id)
    setBrandFilter('all')
  }

  const generate = () => {
    const brand = generatorBrands.find((item) => item.id === genBrand)
    const count = Math.min(Math.max(Number(genCount) || 1, 1), 50)
    setGenerated(Array.from({ length: count }, () => generateNumber(brand)))
    setUsed(true)
    trackToolUse(SLUG, 'result')
  }

  const trackCopy = () => {
    setUsed(true)
    trackToolUse(SLUG, 'result')
    trackToolUse(SLUG, 'copy')
  }

  return (
    <div className="space-y-6">
      <div className={ui.card}>
        <div className={`${ui.cardHeader} flex-wrap`}>
          <div className={ui.segmented} role="group" aria-label="Payment provider">
            {providers.map((item) => (
              <button key={item.id} type="button" aria-pressed={providerId === item.id} onClick={() => selectProvider(item.id)} className={ui.segment(providerId === item.id)}>{item.name}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Card brand" value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className={`${ui.select} h-9 w-auto`}>
              <option value="all">All brands</option>
              {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
            </select>
            <select aria-label="Scenario" value={outcome} onChange={(e) => setOutcome(e.target.value)} className={`${ui.select} h-9 w-auto`}>
              <option value="all">All scenarios</option>
              <option value="positive">Success</option>
              <option value="negative">Declines and errors</option>
              <option value="warning">Authentication (3DS)</option>
            </select>
          </div>
        </div>
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-sm text-zinc-600">
          <p>{provider.guidance}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Test card numbers change; check the provider’s docs. List checked October 2026.{' '}
            <a href={provider.docs} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-500">
              {provider.name} testing docs<ArrowTopRightOnSquareIcon aria-hidden="true" className="size-3.5" />
            </a>
          </p>
        </div>
        <div className="relative overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="sr-only">{provider.name} test card numbers</caption>
            <thead className="text-xs text-zinc-500">
              <tr className="border-b border-zinc-200">
                <th scope="col" className="px-5 py-2.5 font-medium">Card number</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Brand</th>
                <th scope="col" className="px-3 py-2.5 font-medium">Scenario</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium"><span className="sr-only">Copy</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {cards.map((card) => (
                <tr key={card.number + card.scenario}>
                  <td className="px-5 py-2.5 font-mono text-[13px] text-zinc-900 tabular-nums whitespace-nowrap">{formatCardNumber(card.number)}</td>
                  <td className="px-3 py-2.5 text-zinc-600 whitespace-nowrap">{card.brand}</td>
                  <td className="px-3 py-2.5"><Badge tone={card.tone}>{card.scenario}</Badge></td>
                  <td className="px-5 py-2.5 text-right" onClickCapture={trackCopy}><CopyButton text={card.number} /></td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-500">No {provider.name} cards match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className={ui.grid}>
        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Luhn validator</h2></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <div>
              <label htmlFor="luhn-input" className={ui.label}>Card number</label>
              <input id="luhn-input" inputMode="numeric" autoComplete="off" value={validateInput} onChange={(e) => setValidateInput(e.target.value)} className={`${ui.input} font-mono`} placeholder="4242 4242 4242 4242" />
              <p className={ui.hint}>Checks the mod 10 checksum and brand prefix. Runs in your browser; nothing is sent anywhere. Don’t paste real card numbers.</p>
            </div>
            {validation ? (
              <div className={ui.rows}>
                <div className={ui.row}>
                  <span className={ui.rowLabel}>Luhn checksum</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                    {validation.valid ? <CheckCircleIcon aria-hidden="true" className="size-4 text-emerald-600" /> : <XCircleIcon aria-hidden="true" className="size-4 text-red-600" />}
                    {validation.valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
                <div className={ui.row}><span className={ui.rowLabel}>Brand (by prefix)</span><span className={ui.rowValue}>{validation.brand}</span></div>
                <div className={ui.row}><span className={ui.rowLabel}>Length</span><span className={ui.rowValue}>{validation.length} digits</span></div>
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Enter at least 12 digits to check.</p>
            )}
          </div>
        </div>

        <div className={ui.card}>
          <div className={ui.cardHeader}><h2 className={ui.cardTitle}>Luhn-valid number generator</h2><Badge tone="warning">Testing only</Badge></div>
          <div className={`${ui.cardBody} ${ui.stack}`}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gen-brand" className={ui.label}>Brand prefix</label>
                <select id="gen-brand" value={genBrand} onChange={(e) => setGenBrand(e.target.value)} className={ui.select}>
                  {generatorBrands.map((brand) => <option key={brand.id} value={brand.id}>{brand.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="gen-count" className={ui.label}>How many</label>
                <input id="gen-count" type="number" min="1" max="50" value={genCount} onChange={(e) => setGenCount(e.target.value)} className={ui.input} />
              </div>
            </div>
            <button type="button" onClick={generate} className={ui.primaryButton}>Generate numbers</button>
            <p className={ui.hint}>Synthetic numbers that pass the Luhn check, for form validation and input-mask testing. They are not real cards and will not work in Stripe, Braintree, or Adyen sandboxes. Use the provider tables above for payment flows.</p>
            {generated.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{generated.length} synthetic numbers</span>
                  <span onClickCapture={() => trackToolUse(SLUG, 'copy')}><CopyButton text={generated.join('\n')} label="Copy all" /></span>
                </div>
                <pre className={`${ui.codeOutput} max-h-56`}>{generated.map(formatCardNumber).join('\n')}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {used && (
        <ToolCta title="Turn failed checkout tests into reproducible bug reports" copy="Screendesk records the screen with console logs, network requests, and device details, and files it in Jira or Linear." />
      )}
    </div>
  )
}
