import { JwtDecoder } from '@/components/tools/dev/JwtDecoder'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/jwt-decoder',
  title: 'JWT Decoder — Decode JSON Web Tokens Online | Screendesk',
  description: 'Decode a JWT to read its header, payload, and claims. See exp, iat, and nbf as dates with an expired or valid status, and verify HS256, HS384, and HS512 signatures. Runs locally in your browser.',
  keywords: 'jwt decoder, jwt decode, decode jwt, json web token decoder, jwt parser, jwt debugger, jwt expiration checker, verify jwt signature',
}

const claims = [
  ['iss', 'Issuer', 'Who created and signed the token, e.g. your auth server URL.'],
  ['sub', 'Subject', 'Who the token is about, usually a user ID.'],
  ['aud', 'Audience', 'Who the token is intended for. APIs should reject tokens with a different audience.'],
  ['exp', 'Expiration time', 'Unix time (seconds) after which the token must be rejected.'],
  ['nbf', 'Not before', 'Unix time before which the token must not be accepted.'],
  ['iat', 'Issued at', 'Unix time when the token was issued.'],
  ['jti', 'JWT ID', 'A unique identifier, used to prevent replay or to revoke a token.'],
]

const algorithms = [
  ['HS256 / HS384 / HS512', 'HMAC with SHA-2', 'One shared secret signs and verifies. Every verifier can also issue tokens.'],
  ['RS256 / RS384 / RS512', 'RSA PKCS#1 v1.5', 'Private key signs, public key verifies. Common with OAuth and OpenID Connect providers.'],
  ['PS256 / PS384 / PS512', 'RSA-PSS', 'Like RS256 with a more robust padding scheme.'],
  ['ES256 / ES384 / ES512', 'ECDSA (P-256, P-384, P-521)', 'Public-key signatures with much smaller keys and tokens than RSA.'],
  ['EdDSA', 'Ed25519 / Ed448', 'Fast, modern public-key signatures.'],
  ['none', 'No signature', 'Unsecured token. Servers should always reject it.'],
]

const faqs = [
  { question: 'What is a JWT?', answer: 'A JSON Web Token (JWT, RFC 7519) is a compact, URL-safe token made of three base64url-encoded parts separated by dots: a header that names the signing algorithm, a payload of claims such as the user ID and expiry, and a signature. APIs use JWTs as bearer tokens to prove who is calling without a database lookup on every request.' },
  { question: 'Is it safe to paste my JWT here?', answer: 'This decoder runs entirely in your browser: the token and any secret you enter are never uploaded, logged, or stored. Still, a JWT is a credential, and anyone who has a valid one can act as that user until it expires. Prefer test or expired tokens, and rotate any production token you have shared in a ticket or chat.' },
  { question: 'Does decoding a JWT verify it?', answer: 'No. The header and payload are only base64url-encoded, not encrypted, so anyone can read them. Only the signature proves the token was issued by someone holding the key and has not been modified. Enter the shared secret above to verify HS256, HS384, or HS512 tokens; RS, ES, and PS tokens must be verified with the issuer’s public key on your server.' },
  { question: 'Why does my API reject a token that looks valid?', answer: 'Check the exp and nbf claims against the current time (clock skew between servers is a common cause), the aud claim against what your API expects, the iss claim against your configured issuer, and the alg header against the algorithms your library allows. Also make sure the token was not truncated when it was copied from a header or log.' },
  { question: 'What are the exp, iat, and nbf claims?', answer: 'They are Unix timestamps in seconds. exp (expiration time) is when the token stops being valid, iat (issued at) is when it was created, and nbf (not before) is the earliest time it may be used. This decoder shows each one as an ISO 8601 date with the relative time, and marks the token as expired or not yet valid.' },
]

export default function JwtDecoderPage() {
  return (
    <ToolPageLayout meta={meta} current="jwt-decoder" breadcrumb={{ name: 'JWT Decoder', href: meta.path }} faqs={faqs}>
      <ToolHero title="JWT Decoder" description="Paste a JSON Web Token to read its header, payload, and claims, check whether it has expired, and verify HMAC signatures. Nothing leaves your browser." />
      <ToolFrame><JwtDecoder /></ToolFrame>
      <ToolSection id="claims" pill="Claims" title="Registered JWT claims." subtitle="The standard claims defined in RFC 7519.">
        <ToolTable caption="Registered JWT claims" columns={['Claim', 'Name', 'Meaning']} rows={claims} />
      </ToolSection>
      <ToolSection id="algorithms" pill="Algorithms" title="JWT signing algorithms." subtitle="What the alg header means.">
        <ToolTable caption="JWT signing algorithms" columns={['alg', 'Algorithm', 'How it works']} rows={algorithms} />
      </ToolSection>
    </ToolPageLayout>
  )
}
