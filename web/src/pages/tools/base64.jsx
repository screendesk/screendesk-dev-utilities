import { Base64Tool } from '@/components/tools/dev/Base64Tool'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/base64',
  title: 'Base64 Decode & Encode — Free Online Converter | Screendesk',
  description: 'Decode and encode Base64 online with full UTF-8 support. Convert files and images to Base64 data URLs, use URL-safe base64url, and preview decoded images. Nothing is uploaded.',
  keywords: 'base64 decode, base64 encode, base64 decoder, base64 encoder, base64 to text, base64 to image, image to base64, base64url, data url converter',
}

const variants = [
  ['Standard (RFC 4648 §4)', 'A–Z a–z 0–9 + /', 'Required (=)', 'MIME email, PEM certificates, most APIs'],
  ['URL-safe base64url (RFC 4648 §5)', 'A–Z a–z 0–9 - _', 'Usually omitted', 'JWTs, URLs, filenames, WebAuthn'],
  ['Data URL', 'Standard alphabet after data:<type>;base64,', 'Required', 'Inline images and fonts in HTML and CSS'],
  ['MIME (RFC 2045)', 'Standard alphabet, lines wrapped at 76 characters', 'Required', 'Email attachments'],
]

const howItWorks = [
  ['1. Bytes', 'Text is first turned into bytes. This tool uses UTF-8, so “é” becomes 2 bytes and most emoji become 4.'],
  ['2. Groups of 3', 'The bytes are split into groups of 3 (24 bits).'],
  ['3. Four 6-bit values', 'Each 24-bit group is read as four 6-bit numbers from 0 to 63.'],
  ['4. Alphabet', 'Each number maps to one of 64 characters: A–Z, a–z, 0–9, then + and / (or - and _ in base64url).'],
  ['5. Padding', 'If the last group has 1 or 2 bytes, the output ends with “==” or “=” so its length is a multiple of 4.'],
]

const faqs = [
  { question: 'What is Base64 encoding?', answer: 'Base64 is a way to represent binary data as plain text using 64 safe characters. Every 3 bytes become 4 characters, so the output is about 33% larger than the input. It is used wherever binary data must travel through text-only channels: email attachments, JSON payloads, data URLs, HTTP Basic auth headers, and JWTs.' },
  { question: 'Is Base64 encryption?', answer: 'No. Base64 is an encoding, not encryption. Anyone can decode it without a key, so never use it to hide passwords, API keys, or personal data. Use real encryption (for example AES-GCM) or hashing where secrecy matters.' },
  { question: 'Why does my decoded Base64 show strange characters?', answer: 'Either the data is binary (an image, PDF, or compressed file) rather than text, or it was encoded with a different character set. This tool decodes as UTF-8 and switches to a hex view with a download button when the bytes are not valid text. Images are detected from their file signature and previewed.' },
  { question: 'What is the difference between Base64 and base64url?', answer: 'base64url replaces + with - and / with _, and usually drops the = padding, so the result can be used in URLs and filenames without escaping. JWTs use base64url. This decoder accepts both alphabets, with or without padding.' },
  { question: 'How do I convert an image to Base64?', answer: 'Choose “File to base64” and pick the image. The tool reads it in your browser and outputs a data URL such as data:image/png;base64,iVBOR…, which you can paste into an <img src> attribute or a CSS url(). Turn off the data URL prefix to get only the raw Base64. Files never leave your device.' },
]

export default function Base64Page() {
  return (
    <ToolPageLayout meta={meta} current="base64" breadcrumb={{ name: 'Base64 Encode & Decode', href: meta.path }} faqs={faqs}>
      <ToolHero title="Base64 Decode and Encode" description="Decode Base64 to text or images and encode text or files to Base64, with UTF-8, URL-safe base64url, and data URLs. Everything runs in your browser." />
      <ToolFrame><Base64Tool /></ToolFrame>
      <ToolSection id="how" pill="How it works" title="How Base64 encoding works." subtitle="Three bytes in, four characters out.">
        <ToolTable caption="Base64 encoding steps" columns={['Step', 'What happens']} rows={howItWorks} />
      </ToolSection>
      <ToolSection id="variants" pill="Reference" title="Base64 variants." subtitle="Which alphabet and padding each format uses.">
        <ToolTable caption="Base64 variants compared" columns={['Variant', 'Alphabet', 'Padding', 'Used in']} rows={variants} />
      </ToolSection>
    </ToolPageLayout>
  )
}
