import { useEffect, useMemo, useState } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { CodeArea, CodeBlock, DevPane, DevToolShell, ErrorBox, Toggle } from './DevToolShell'
import { useNow } from './useClientClock'
import { TIME_CLAIMS, canVerify, decodeJwt, tokenStatus, verifyHmac } from './jwt'
import { relativeTime } from './timestamp'

// Signed with the HS256 secret "your-256-bit-secret"; expires in 2035.
export const SAMPLE_TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiZW1haWwiOiJqYW5lQGV4YW1wbGUuY29tIiwicm9sZSI6InN1cHBvcnQiLCJpYXQiOjE3NjAwMDAwMDAsIm5iZiI6MTc2MDAwMDAwMCwiZXhwIjoyMDc1MDAwMDAwfQ.oawPHqbvxA977uw1t2lSgAvDNz1YYusP98zh-BH9SY8'

const claimNames = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expires',
  nbf: 'Not before',
  iat: 'Issued at',
  jti: 'JWT ID',
  auth_time: 'Authenticated at',
  azp: 'Authorized party',
  scope: 'Scope',
}

const pretty = (value) => JSON.stringify(value, null, 2)

function ClaimValue({ name, value, now }) {
  if (TIME_CLAIMS.includes(name) && typeof value === 'number') {
    const ms = value * 1000
    return (
      <span className="flex flex-col items-end text-right">
        <span className="font-mono text-[13px] text-zinc-900">{new Date(ms).toISOString().replace('.000Z', 'Z')}</span>
        <span className="text-xs text-zinc-500">{value}{now !== null && ` · ${relativeTime(ms, now)}`}</span>
      </span>
    )
  }
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return <span className={`${ui.rowValue} break-all text-right font-mono text-[13px]`}>{text}</span>
}

export function JwtDecoder() {
  const now = useNow(1000)
  const [token, setToken] = useState(SAMPLE_TOKEN)
  const [secret, setSecret] = useState('')
  const [secretIsBase64, setSecretIsBase64] = useState(false)
  const [verification, setVerification] = useState(null)

  const decoded = useMemo(() => decodeJwt(token), [token])
  const valid = decoded && !decoded.error
  const alg = valid ? decoded.header.alg : null
  const verifyKey = `${token}\n${secret}\n${secretIsBase64}`

  useEffect(() => {
    if (valid && token !== SAMPLE_TOKEN) trackToolUse('jwt-decoder', 'result')
  }, [valid, token])

  useEffect(() => {
    if (!valid || !canVerify(alg) || !secret) return undefined
    let cancelled = false
    verifyHmac(decoded, secret, secretIsBase64)
      .then((ok) => !cancelled && setVerification({ key: verifyKey, ok }))
      .catch((error) => !cancelled && setVerification({ key: verifyKey, error: error.message || 'Could not verify with this secret.' }))
    return () => {
      cancelled = true
    }
  }, [valid, alg, decoded, secret, secretIsBase64, verifyKey])

  const result = verification?.key === verifyKey && secret ? verification : null
  const status = valid && now !== null ? tokenStatus(decoded.payload, now / 1000) : null
  const payloadIsObject = valid && decoded.payload && typeof decoded.payload === 'object' && !Array.isArray(decoded.payload)

  return (
    <DevToolShell
      left={
        <div className="space-y-4">
          <DevPane
            title="Encoded token"
            actions={
              <>
                <button type="button" className={ui.smallButton} onClick={() => setToken(SAMPLE_TOKEN)}>Sample</button>
                <button type="button" className={ui.smallButton} onClick={() => setToken('')}>Clear</button>
              </>
            }
          >
            <div className="space-y-3">
              <CodeArea label="JWT" value={token} onChange={setToken} rows={10} placeholder="Paste a JWT (eyJhbGciOi…). A leading “Bearer ” is fine." className="break-all" />
              {decoded?.error && <ErrorBox>{decoded.error}</ErrorBox>}
              <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <ExclamationTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <p>Decoding does not verify the signature. Treat tokens as passwords: this page decodes them locally and sends nothing, but avoid pasting live production tokens anywhere you would not paste a password.</p>
              </div>
            </div>
          </DevPane>

          <DevPane title="Verify signature">
            {!valid && <p className="text-sm text-zinc-500">Paste a valid token to verify its signature.</p>}
            {valid && !canVerify(alg) && (
              <p className="text-sm text-zinc-500">
                {alg === 'none'
                  ? 'This token uses alg "none" and has no signature. Never accept unsigned tokens on a server.'
                  : `${alg} tokens are signed with a private key and verified with the issuer’s public key (often published at a JWKS URL). Only HS256, HS384 and HS512 shared-secret verification is supported here.`}
              </p>
            )}
            {valid && canVerify(alg) && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="jwt-secret" className={ui.label}>{alg} secret</label>
                  <input id="jwt-secret" type="password" autoComplete="off" spellCheck={false} className={`${ui.input} font-mono`} placeholder={token === SAMPLE_TOKEN ? 'your-256-bit-secret' : 'Shared secret'} value={secret} onChange={(event) => setSecret(event.target.value)} />
                  <p className={ui.hint}>Verified with the browser’s WebCrypto API. The secret never leaves this page.</p>
                </div>
                <Toggle label="Secret is base64 encoded" checked={secretIsBase64} onChange={setSecretIsBase64} />
                {result && (result.error ? <ErrorBox>{result.error}</ErrorBox> : <Badge tone={result.ok ? 'positive' : 'negative'}>{result.ok ? 'Signature verified' : 'Invalid signature'}</Badge>)}
              </div>
            )}
          </DevPane>
        </div>
      }
      right={
        <DevPane
          title="Decoded"
          actions={valid && (
            <>
              {alg && <Badge>{alg}</Badge>}
              {status && <Badge tone={status.tone}>{status.label}</Badge>}
            </>
          )}
        >
          {!valid ? (
            <div className={ui.empty}>Paste a JWT to see its header, payload, and claims.</div>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Header</span>
                  <CopyButton text={pretty(decoded.header)} />
                </div>
                <CodeBlock label="Decoded header" className="min-h-0">{pretty(decoded.header)}</CodeBlock>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Payload</span>
                  <CopyButton text={pretty(decoded.payload)} />
                </div>
                <CodeBlock label="Decoded payload" className="min-h-0">{pretty(decoded.payload)}</CodeBlock>
              </div>
              {payloadIsObject && Object.keys(decoded.payload).length > 0 && (
                <div>
                  <span className="text-xs font-medium tracking-wide text-zinc-500 uppercase">Claims</span>
                  <div className={ui.rows}>
                    {Object.entries(decoded.payload).map(([name, value]) => (
                      <div key={name} className={ui.row}>
                        <span className={ui.rowLabel}>
                          <span className="font-mono text-[13px] text-zinc-900">{name}</span>
                          {claimNames[name] && <span className="ml-2 text-xs">{claimNames[name]}</span>}
                        </span>
                        <ClaimValue name={name} value={value} now={now} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DevPane>
      }
      below={
        valid && (
          <ToolCta
            title="Debugging auth for a customer?"
            copy="Screendesk records the customer’s screen with console logs and network requests, so you can see the failing call instead of asking for it."
            label="Try Screendesk free"
          />
        )
      }
    />
  )
}
