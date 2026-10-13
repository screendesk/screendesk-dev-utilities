import { RandomStringGenerator } from '@/components/tools/convert/RandomStringGenerator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/random-string-generator',
  title: 'Random String Generator: Secure Tokens, Keys & Passwords | Screendesk',
  description: 'Generate cryptographically secure random strings in bulk. Choose length, character sets, custom characters, and exclude ambiguous characters. See the entropy in bits. Runs in your browser.',
  keywords: 'random string generator, random token generator, random alphanumeric string, api key generator, secure random string, random password string',
}

const entropy = [
  ['Digits only (10)', '3.32', '20 chars → 66 bits', '6-digit PINs (19.9 bits) only work with rate limiting.'],
  ['Hex (16)', '4.00', '32 chars → 128 bits', 'Session IDs, secrets stored as hex.'],
  ['Lowercase + digits (36)', '5.17', '25 chars → 129 bits', 'Case-insensitive identifiers and URLs.'],
  ['Alphanumeric (62)', '5.95', '22 chars → 131 bits', 'API keys and tokens.'],
  ['Alphanumeric + symbols (89)', '6.48', '20 chars → 130 bits', 'Passwords stored in a password manager.'],
]

const strength = [
  ['Under 40 bits', 'Weak', 'Guessable offline in seconds to hours. Fine only for short-lived codes behind rate limits.'],
  ['40–63 bits', 'Fair', 'Resists online guessing, not a determined offline attack.'],
  ['64–99 bits', 'Strong', 'Good for most passwords and invite codes.'],
  ['100+ bits', 'Very strong', 'Recommended for API keys, tokens and secrets (128 bits is a common target).'],
]

const faqs = [
  { question: 'Are these random strings secure?', answer: 'Yes. Characters are chosen with crypto.getRandomValues, the browser’s cryptographically secure random number generator, not Math.random. Strings are generated on your device and never sent anywhere.' },
  { question: 'What is modulo bias and how is it avoided?', answer: 'Mapping a random 32-bit number onto, say, 62 characters with the remainder operator makes the first few characters slightly more likely, because 2^32 does not divide evenly by 62. This generator uses rejection sampling: it discards random values from the uneven top of the range and draws again, so every character is exactly equally likely.' },
  { question: 'How is entropy calculated?', answer: 'Entropy in bits is length × log2(character set size). A 16-character alphanumeric string has 16 × log2(62) ≈ 95 bits. Each extra bit doubles the number of guesses an attacker needs. Duplicate custom characters are removed first, so they don’t inflate the number.' },
  { question: 'Which characters count as ambiguous?', answer: 'Characters that are easy to misread or mistype: I, l, 1, O, 0, o, the pipe and backtick, quotes, and look-alike pairs such as 5/S, 2/Z and 8/B. Excluding them is useful for codes people read from a screen or type by hand. It slightly lowers entropy per character, which the strength meter shows.' },
  { question: 'How many strings can I generate at once?', answer: 'Up to 1,000 strings of up to 1,024 characters each. Turn on No duplicate strings to guarantee every string in the batch is unique.' },
]

export default function RandomStringGeneratorPage() {
  return (
    <ToolPageLayout meta={meta} current="random-string-generator" breadcrumb={{ name: 'Random String Generator', href: meta.path }} faqs={faqs}>
      <ToolHero title="Random String Generator" description="Cryptographically secure random strings for API keys, tokens, passwords and test data, with the entropy shown in bits." />
      <ToolFrame><RandomStringGenerator /></ToolFrame>
      <ToolSection id="entropy" pill="Reference" title="Entropy by character set." subtitle="Bits per character, and the length you need for about 128 bits.">
        <ToolTable caption="Entropy per character set" columns={['Character set', 'Bits per char', 'Length for ~128 bits', 'Typical use']} rows={entropy} />
      </ToolSection>
      <ToolSection id="strength" pill="Strength" title="How many bits is enough?" subtitle="How the strength label maps to entropy.">
        <ToolTable caption="Strength by entropy" columns={['Entropy', 'Label', 'What it means']} rows={strength} />
      </ToolSection>
    </ToolPageLayout>
  )
}
