import { NumberBaseConverter } from '@/components/tools/convert/NumberBaseConverter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/hex-to-decimal',
  title: 'Hex to Decimal Converter — Free & Exact | Screendesk',
  description: 'Convert hexadecimal to decimal (and decimal to hex) instantly. Accepts 0x prefixes, any length, and negative values, and shows the signed 32-bit and 64-bit reading of error codes.',
  keywords: 'hex to decimal, hex to decimal converter, hexadecimal to decimal, convert hex to decimal, 0x to decimal, decimal to hex, hex converter',
}

const digits = [
  ['0', '0', '0000'],
  ['1', '1', '0001'],
  ['2', '2', '0010'],
  ['3', '3', '0011'],
  ['4', '4', '0100'],
  ['5', '5', '0101'],
  ['6', '6', '0110'],
  ['7', '7', '0111'],
  ['8', '8', '1000'],
  ['9', '9', '1001'],
  ['A', '10', '1010'],
  ['B', '11', '1011'],
  ['C', '12', '1100'],
  ['D', '13', '1101'],
  ['E', '14', '1110'],
  ['F', '15', '1111'],
]

const worked = [
  ['1', '1 × 16² = 1 × 256', '256'],
  ['F', '15 × 16¹ = 15 × 16', '240'],
  ['4', '4 × 16⁰ = 4 × 1', '4'],
  ['Sum', '256 + 240 + 4', '0x1F4 = 500'],
]

const common = [
  ['0xFF', '255', 'Largest unsigned byte; one RGB color channel at full intensity'],
  ['0x100', '256', 'One more than a byte can hold'],
  ['0x3E8', '1,000', 'A round decimal number in hex'],
  ['0xFFFF', '65,535', 'Largest unsigned 16-bit value; highest TCP/UDP port number'],
  ['0x7FFFFFFF', '2,147,483,647', 'Largest signed 32-bit integer (INT_MAX)'],
  ['0xFFFFFFFF', '4,294,967,295', 'Largest unsigned 32-bit value; −1 when read as a signed 32-bit integer'],
  ['0x80070005', '2,147,942,405', 'Windows HRESULT for “access denied”. Signed 32-bit reading: −2,147,024,891'],
  ['0xDEADBEEF', '3,735,928,559', 'A classic debug fill value for uninitialized memory'],
]

const faqs = [
  { question: 'How do I convert hex to decimal?', answer: 'Multiply each hex digit by 16 raised to its position, counting from 0 on the right, and add the results. Letters stand for 10 to 15 (A = 10, F = 15). For 0x1F4: 1 × 256 + 15 × 16 + 4 × 1 = 500. Paste any hex value above and the decimal result appears as you type.' },
  { question: 'How do I convert decimal to hex?', answer: 'Divide the decimal number by 16 and note the remainder, then divide the quotient by 16 again until it reaches 0. The remainders read from bottom to top, with 10–15 written as A–F, are the hex digits. 500 ÷ 16 = 31 r 4, 31 ÷ 16 = 1 r 15 (F), 1 ÷ 16 = 0 r 1, so 500 = 0x1F4. Press Swap to convert in that direction.' },
  { question: 'What does 0x mean in front of a number?', answer: '0x is the prefix most programming languages use to mark a hexadecimal literal, so 0x10 means sixteen rather than ten. It is not part of the value. This converter accepts hex with or without 0x, and also with a leading # as in CSS colors.' },
  { question: 'Why does a hex error code show as a negative number in my logs?', answer: 'Many error codes are 32-bit values with the top bit set, such as Windows HRESULTs starting with 0x8. When a program prints them as a signed 32-bit integer, they come out negative: 0x80070005 becomes −2,147,024,891. Choose 32-bit in the two’s complement panel to see both readings side by side.' },
  { question: 'Is there a limit to how long the hex value can be?', answer: 'No practical limit. The converter uses BigInt, so 64-bit hashes, 128-bit UUIDs written as hex, and longer values convert exactly. Regular JavaScript numbers lose precision above 0x1FFFFFFFFFFFFF (2^53 − 1).' },
]

export default function HexToDecimalPage() {
  return (
    <ToolPageLayout meta={meta} current="hex-to-decimal" breadcrumb={{ name: 'Hex to Decimal Converter', href: meta.path }} faqs={faqs}>
      <ToolHero title="Hex to Decimal Converter" description="Convert hexadecimal to decimal, or decimal to hex, as you type. Exact for any length, with the signed reading of 32-bit and 64-bit error codes." />
      <ToolFrame><NumberBaseConverter slug="hex-to-decimal" defaultFrom={16} defaultTo={10} defaultValue="1F4" /></ToolFrame>
      <ToolSection id="worked" pill="How it works" title="0x1F4 to decimal, digit by digit." subtitle="Each position is worth 16 times the one to its right.">
        <ToolTable caption="Converting hexadecimal 1F4 to decimal" columns={['Hex digit', 'Place value', 'Decimal']} rows={worked} />
      </ToolSection>
      <ToolSection id="common" pill="Reference" title="Hex values you will meet while debugging." subtitle="Limits, colors, and error codes.">
        <ToolTable caption="Common hexadecimal values and their decimal equivalents" columns={['Hex', 'Decimal', 'Where you see it']} rows={common} />
      </ToolSection>
      <ToolSection id="digits" pill="Chart" title="Hex digit chart." subtitle="Sixteen digits, each exactly four bits.">
        <ToolTable caption="Hexadecimal digits in decimal and binary" columns={['Hex', 'Decimal', 'Binary']} rows={digits} />
      </ToolSection>
    </ToolPageLayout>
  )
}
