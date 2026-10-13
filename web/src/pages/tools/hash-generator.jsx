import { HashGenerator } from '@/components/tools/convert/HashGenerator'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/hash-generator',
  title: 'Hash Generator: MD5, SHA-256 & SHA-512 Checksum Calculator | Screendesk',
  description: 'Generate MD5, SHA-1, SHA-256, SHA-384 and SHA-512 hashes from text or files, compute HMACs, and compare against an expected checksum. Free, files never leave your browser.',
  keywords: 'hash generator, md5 hash, md5 generator, sha256 checksum, sha256 hash generator, checksum calculator, sha512 hash, hmac generator, file checksum',
}

const algorithms = [
  ['MD5', '128 bits, 32 hex chars', 'Broken: collisions can be made on a laptop. Still used for cache keys, ETags and spotting accidental corruption.'],
  ['SHA-1', '160 bits, 40 hex chars', 'Practical collisions since 2017. Git object IDs historically use it; avoid it for signatures.'],
  ['SHA-256', '256 bits, 64 hex chars', 'The standard choice for download checksums, code signing, and JWT HS256/RS256 signatures.'],
  ['SHA-384', '384 bits, 96 hex chars', 'Common in Subresource Integrity (integrity="sha384-…") and TLS cipher suites.'],
  ['SHA-512', '512 bits, 128 hex chars', 'Same family as SHA-256 with a larger state; often faster on 64-bit machines.'],
]

const vectors = [
  ['"" (empty)', 'd41d8cd98f00b204e9800998ecf8427e', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
  ['"abc"', '900150983cd24fb0d6963f7d28e17f72', 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'],
  ['"The quick brown fox jumps over the lazy dog"', '9e107d9d372bb6826bd81d3542a419d6', 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592'],
]

const cli = [
  ['macOS', 'shasum -a 256 file.zip', 'md5 file.zip'],
  ['Linux', 'sha256sum file.zip', 'md5sum file.zip'],
  ['Windows PowerShell', 'Get-FileHash file.zip -Algorithm SHA256', 'Get-FileHash file.zip -Algorithm MD5'],
]

const faqs = [
  { question: 'How do I verify a SHA-256 checksum?', answer: 'Switch the input to File, choose the file you downloaded, and paste the checksum from the publisher into Compare with expected checksum. A green Match badge means the file is byte-for-byte identical to the one that was published. Output from sha256sum, including the filename after the hash, is accepted as is.' },
  { question: 'How do I generate an MD5 hash?', answer: 'Type or paste text and the MD5 hash appears instantly alongside SHA-1, SHA-256, SHA-384 and SHA-512. Text is hashed as UTF-8 bytes, so a trailing space or newline produces a completely different hash. MD5 is implemented in JavaScript because browsers do not offer it natively.' },
  { question: 'What is HMAC and when do I need it?', answer: 'HMAC combines a secret key with a hash function so only someone with the key can produce the same value. Webhook providers use HMAC-SHA256 to sign payloads; turn on HMAC, enter the signing secret and the raw request body, and compare the result with the signature header to debug a failing webhook.' },
  { question: 'Can MD5 or SHA-1 be used for passwords?', answer: 'No. Plain hashes are fast by design, which makes guessing passwords cheap, and MD5 and SHA-1 are also broken against collisions. Store passwords with a slow, salted algorithm such as Argon2id, scrypt or bcrypt.' },
  { question: 'Is my file uploaded?', answer: 'No. Files are read into memory and hashed in your browser with the WebCrypto API, up to 512 MB. Nothing is sent to a server, so it is safe for internal builds and logs.' },
]

export default function HashGeneratorPage() {
  return (
    <ToolPageLayout meta={meta} current="hash-generator" breadcrumb={{ name: 'Hash Generator', href: meta.path }} faqs={faqs}>
      <ToolHero title="Hash Generator & Checksum Calculator" description="MD5, SHA-1, SHA-256, SHA-384 and SHA-512 for text or files, with HMAC and checksum comparison. Files stay on your device." />
      <ToolFrame><HashGenerator /></ToolFrame>
      <ToolSection id="algorithms" pill="Reference" title="Which hash should you use?" subtitle="Output size and security status of each algorithm.">
        <ToolTable caption="Hash algorithms" columns={['Algorithm', 'Output', 'Use it for']} rows={algorithms} />
      </ToolSection>
      <ToolSection id="vectors" pill="Test vectors" title="Known hashes to check against." subtitle="Plus the command-line equivalents.">
        <ToolTable caption="MD5 and SHA-256 test vectors" columns={['Input', 'MD5', 'SHA-256']} rows={vectors} />
        <ToolTable caption="Checksum commands by operating system" columns={['System', 'SHA-256', 'MD5']} rows={cli} />
      </ToolSection>
    </ToolPageLayout>
  )
}
