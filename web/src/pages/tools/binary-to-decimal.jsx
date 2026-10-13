import { NumberBaseConverter } from '@/components/tools/convert/NumberBaseConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/binary-to-decimal',
  title: 'Binary to Decimal Converter (and Decimal to Binary) | Screendesk',
  description: 'Convert binary to decimal and decimal to binary instantly. Groups bits into nibbles, handles numbers of any size, and shows 8, 16, 32, and 64-bit two’s complement for negative values.',
  keywords: 'binary to decimal, decimal to binary, binary to decimal converter, decimal to binary converter, binary converter, convert binary to decimal, binary calculator',
}

const toDecimal = [
  ['1 (bit 5)', '1 × 2⁵', '32'],
  ['0 (bit 4)', '0 × 2⁴', '0'],
  ['1 (bit 3)', '1 × 2³', '8'],
  ['1 (bit 2)', '1 × 2²', '4'],
  ['0 (bit 1)', '0 × 2¹', '0'],
  ['1 (bit 0)', '1 × 2⁰', '1'],
  ['Sum', '32 + 8 + 4 + 1', '101101 = 45'],
]

const toBinary = [
  ['156 ÷ 2', '78', '0'],
  ['78 ÷ 2', '39', '0'],
  ['39 ÷ 2', '19', '1'],
  ['19 ÷ 2', '9', '1'],
  ['9 ÷ 2', '4', '1'],
  ['4 ÷ 2', '2', '0'],
  ['2 ÷ 2', '1', '0'],
  ['1 ÷ 2', '0', '1'],
  ['Read remainders bottom to top', '', '156 = 1001 1100'],
]

const powers = [
  ['2⁰', '1', 'Lowest bit'],
  ['2⁴', '16', 'One nibble holds 0–15'],
  ['2⁷', '128', 'Top bit of a byte; sign bit in 8-bit signed values'],
  ['2⁸', '256', 'Values in one byte'],
  ['2¹⁰', '1,024', 'One kibibyte (KiB)'],
  ['2¹⁶', '65,536', 'Values in 16 bits'],
  ['2³¹', '2,147,483,648', 'One past the largest signed 32-bit integer'],
  ['2³²', '4,294,967,296', 'Values in 32 bits; IPv4 address space'],
  ['2⁵³', '9,007,199,254,740,992', 'JavaScript numbers lose integer precision above this'],
  ['2⁶⁴', '18,446,744,073,709,551,616', 'Values in 64 bits'],
]

const signed = [
  ['0', '0000 0000', '0x00'],
  ['1', '0000 0001', '0x01'],
  ['100', '0110 0100', '0x64'],
  ['127', '0111 1111', '0x7F (largest 8-bit signed)'],
  ['−1', '1111 1111', '0xFF'],
  ['−100', '1001 1100', '0x9C'],
  ['−127', '1000 0001', '0x81'],
  ['−128', '1000 0000', '0x80 (smallest 8-bit signed)'],
]

const faqs = [
  { question: 'How do I convert binary to decimal?', answer: 'Number the bits from 0 on the right. Each 1 bit is worth 2 raised to its position; add those values together. For 101101 the 1 bits are at positions 5, 3, 2, and 0, so the value is 32 + 8 + 4 + 1 = 45. Type a binary number above and the decimal value updates as you type.' },
  { question: 'How do I convert decimal to binary?', answer: 'Divide the number by 2 and write down the remainder (0 or 1), then keep dividing the quotient by 2 until it reaches 0. The remainders read from the last one to the first are the binary digits: 156 becomes 10011100. Press Swap above, or set From to Decimal and To to Binary.' },
  { question: 'How are negative numbers written in binary?', answer: 'Computers use two’s complement: invert every bit of the positive value and add 1. In 8 bits, 100 is 0110 0100, so −100 is 1001 1011 + 1 = 1001 1100. The leftmost bit is the sign bit. Enter a negative decimal number and pick a width in the two’s complement panel to see the stored pattern.' },
  { question: 'Why are binary digits grouped in fours?', answer: 'Four bits (a nibble) map to exactly one hexadecimal digit, and eight bits make a byte, so grouping by four makes long values easier to read and to check against hex. Spaces and underscores in your input are ignored, so you can paste 1001_1100 or 1001 1100.' },
  { question: 'How many bits do I need for a number?', answer: 'An unsigned value n needs ⌊log₂ n⌋ + 1 bits, so 255 needs 8 bits and 256 needs 9. Signed values need one extra bit for the sign. The converter shows the bit length of every result and flags an overflow when the value does not fit in the width you choose.' },
]

export default function BinaryToDecimalPage() {
  return (
    <ToolPageLayout meta={meta} current="binary-to-decimal" breadcrumb={{ name: 'Binary to Decimal Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="Binary to Decimal Converter" description="Convert binary to decimal, or decimal to binary, as you type. Bits grouped into nibbles, any size, and two’s complement for negative numbers." />
      <ToolFrame><NumberBaseConverter slug="binary-to-decimal" defaultFrom={2} defaultTo={10} defaultValue="101101" /></ToolFrame>
      <ToolSection id="to-decimal" pill="Binary to decimal" title="101101 to decimal, bit by bit." subtitle="Add the place value of every 1 bit.">
        <ToolTable caption="Converting binary 101101 to decimal" columns={['Bit', 'Place value', 'Decimal']} rows={toDecimal} />
      </ToolSection>
      <ToolSection id="to-binary" pill="Decimal to binary" title="156 to binary, by repeated division." subtitle="The remainders are the bits, lowest first.">
        <ToolTable caption="Converting decimal 156 to binary" columns={['Division', 'Quotient', 'Remainder (bit)']} rows={toBinary} />
      </ToolSection>
      <ToolSection id="reference" pill="Reference" title="Powers of two and 8-bit signed values." subtitle="The numbers behind byte sizes and integer limits.">
        <ToolTable caption="Powers of two" columns={['Power', 'Decimal', 'Why it matters']} rows={powers} />
        <ToolTable caption="8-bit two’s complement examples" columns={['Decimal', 'Binary (8-bit)', 'Hex']} rows={signed} />
      </ToolSection>
    </ToolPageLayout>
  )
}
