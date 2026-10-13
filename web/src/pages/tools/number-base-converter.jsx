import { NumberBaseConverter } from '@/components/tools/convert/NumberBaseConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/number-base-converter',
  title: 'Number Base Converter — Binary, Octal, Decimal, Hex | Screendesk',
  description: 'Convert numbers between binary, octal, decimal, hexadecimal, and any base from 2 to 36. Exact for huge values, handles negative numbers, and shows the two’s complement bit pattern.',
  keywords: 'number base converter, base converter, radix converter, binary octal decimal hex converter, base 36 converter, convert number base, two’s complement calculator',
}

const counting = [
  ['0', '0000', '0', '0'],
  ['1', '0001', '1', '1'],
  ['2', '0010', '2', '2'],
  ['3', '0011', '3', '3'],
  ['4', '0100', '4', '4'],
  ['5', '0101', '5', '5'],
  ['6', '0110', '6', '6'],
  ['7', '0111', '7', '7'],
  ['8', '1000', '10', '8'],
  ['9', '1001', '11', '9'],
  ['10', '1010', '12', 'A'],
  ['11', '1011', '13', 'B'],
  ['12', '1100', '14', 'C'],
  ['13', '1101', '15', 'D'],
  ['14', '1110', '16', 'E'],
  ['15', '1111', '17', 'F'],
  ['16', '1 0000', '20', '10'],
]

const worked = [
  ['1. Divide by the target base', '2024 ÷ 16 = 126, remainder 8', 'Lowest digit: 8'],
  ['2. Divide the quotient again', '126 ÷ 16 = 7, remainder 14', 'Next digit: E (14)'],
  ['3. Repeat until the quotient is 0', '7 ÷ 16 = 0, remainder 7', 'Highest digit: 7'],
  ['4. Read remainders bottom to top', '7, E, 8', '2024 = 0x7E8'],
  ['5. Check by expanding', '7 × 16² + 14 × 16 + 8 = 1792 + 224 + 8', '2024 ✓'],
]

const prefixes = [
  ['Binary (2)', '0b1010', 'JavaScript, Python, Java 7+, C23, C++14, Rust, Go, Swift'],
  ['Octal (8)', '0o12', 'JavaScript, Python 3, Rust, Swift, Go 1.13+. C, Java, and older code use a bare leading 0 (012), a common source of bugs.'],
  ['Hexadecimal (16)', '0xA', 'Almost every language. CSS colors use # (#0A0A0A); assembly listings often use a trailing h (0Ah).'],
  ['Any base', 'parseInt("z", 36)', 'JavaScript parseInt(text, radix) and Number.prototype.toString(radix) accept bases 2–36; Python has int(text, base).'],
]

const faqs = [
  { question: 'How do I convert a number from one base to another?', answer: 'Divide the number by the target base again and again, writing down each remainder, until the quotient reaches 0. The remainders read from last to first are the digits in the new base. To go the other way, multiply each digit by the base raised to its position and add the results. This converter does both instantly for any base from 2 to 36.' },
  { question: 'Why do bases stop at 36?', answer: 'Base 36 uses all ten digits plus the 26 letters A–Z, so it is the largest base you can write with ordinary alphanumeric characters. It is used for short IDs and URL shorteners. Letters are case-insensitive here, so ff and FF are the same hex value.' },
  { question: 'Can it convert very large or negative numbers?', answer: 'Yes. Values are stored as JavaScript BigInt, so a 40-digit decimal number converts without the rounding you get above 2^53 with regular numbers. Negative numbers keep their minus sign in every base, and the two’s complement panel shows how a computer stores them in 8, 16, 32, or 64 bits.' },
  { question: 'What is two’s complement?', answer: 'Two’s complement is how computers store signed integers. A negative number −n is stored as 2^bits − n, so −1 in 8 bits is 11111111 (0xFF) and −128 is 10000000. The same bit pattern can be read as signed or unsigned, which is why the panel shows both. If a value needs more bits than the width you choose, it is flagged as an overflow.' },
  { question: 'Does it convert fractions?', answer: 'No, this converter handles whole numbers only. Fractions such as 0.1 often have no exact representation in binary, so converting them means choosing a precision. Most bug-hunting uses of base conversion, such as error codes, flags, and IDs, are integers.' },
]

export default function NumberBaseConverterPage() {
  return (
    <ToolPageLayout meta={meta} current="number-base-converter" breadcrumb={{ name: 'Number Base Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="Number Base Converter" description="Convert between binary, octal, decimal, hexadecimal, and any base from 2 to 36. Exact for huge values, with negative numbers and two’s complement." />
      <ToolFrame><NumberBaseConverter slug="number-base-converter" defaultFrom={10} defaultTo={16} defaultValue="2024" /></ToolFrame>
      <ToolSection id="worked" pill="How it works" title="Converting 2024 to hex, step by step." subtitle="Repeated division works for any target base.">
        <ToolTable caption="Converting decimal 2024 to hexadecimal" columns={['Step', 'Calculation', 'Result']} rows={worked} />
      </ToolSection>
      <ToolSection id="counting" pill="Reference" title="Counting from 0 to 16 in four bases." subtitle="Each hex digit maps to exactly four binary digits.">
        <ToolTable caption="0 to 16 in decimal, binary, octal, and hexadecimal" columns={['Decimal', 'Binary', 'Octal', 'Hex']} rows={counting} />
      </ToolSection>
      <ToolSection id="prefixes" pill="In code" title="How to write each base in code." subtitle="Literal prefixes by language.">
        <ToolTable caption="Number literal prefixes" columns={['Base', 'Literal', 'Where it works']} rows={prefixes} />
      </ToolSection>
    </ToolPageLayout>
  )
}
