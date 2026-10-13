import { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { Badge, CopyButton, ui } from '@/components/tools/toolUi'
import { ToolCta } from '@/components/tools/ToolCta'
import { trackToolUse } from '@/components/tools/toolTracking'
import { CodeBlock, DevPane, DevToolShell, ErrorBox, Toggle } from '@/components/tools/dev/DevToolShell'
import { AMBIGUOUS, buildAlphabet, entropyBits, generateStrings, strengthLabel } from './randomString'

const MAX_LENGTH = 1024
const MAX_COUNT = 1000

const presets = [
  { label: 'API key', settings: { length: '32', upper: true, lower: true, digits: true, symbols: false, custom: '', excludeAmbiguous: false } },
  { label: 'Password', settings: { length: '20', upper: true, lower: true, digits: true, symbols: true, custom: '', excludeAmbiguous: false } },
  { label: 'Readable code', settings: { length: '8', upper: true, lower: false, digits: true, symbols: false, custom: '', excludeAmbiguous: true } },
  { label: 'Hex token', settings: { length: '64', upper: false, lower: false, digits: true, symbols: false, custom: 'abcdef', excludeAmbiguous: false } },
  { label: 'PIN', settings: { length: '6', upper: false, lower: false, digits: true, symbols: false, custom: '', excludeAmbiguous: false } },
]

const getRandomValues = (array) => crypto.getRandomValues(array)

export function RandomStringGenerator() {
  const [length, setLength] = useState('16')
  const [count, setCount] = useState('5')
  const [upper, setUpper] = useState(true)
  const [lower, setLower] = useState(true)
  const [digits, setDigits] = useState(true)
  const [symbols, setSymbols] = useState(false)
  const [custom, setCustom] = useState('')
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [unique, setUnique] = useState(true)
  const [strings, setStrings] = useState([])
  const [generated, setGenerated] = useState(false)

  const alphabet = useMemo(() => buildAlphabet({ upper, lower, digits, symbols, custom, excludeAmbiguous }), [upper, lower, digits, symbols, custom, excludeAmbiguous])
  const lengthNumber = Number(length)
  const countNumber = Number(count)
  const lengthError = !Number.isInteger(lengthNumber) || lengthNumber < 1 || lengthNumber > MAX_LENGTH ? `Length must be 1–${MAX_LENGTH}.` : ''
  const countError = !Number.isInteger(countNumber) || countNumber < 1 || countNumber > MAX_COUNT ? `Count must be 1–${MAX_COUNT}.` : ''
  const alphabetError = alphabet.length < 2 ? 'Pick at least two different characters.' : ''
  const error = lengthError || countError || alphabetError

  const bits = error ? 0 : entropyBits(alphabet.length, lengthNumber)
  const strength = strengthLabel(bits)
  // With fewer possible strings than requested, "unique" can't be satisfied.
  const uniqueImpossible = unique && !error && bits < Math.log2(countNumber)

  const make = (settings) => generateStrings({ alphabet: settings.alphabet, length: settings.length, count: settings.count, unique: settings.unique, getRandomValues })

  const generate = () => {
    if (error) return
    setStrings(make({ alphabet, length: lengthNumber, count: countNumber, unique }))
    setGenerated(true)
    trackToolUse('random-string-generator', 'result')
  }

  // Random output is created on the client after mount so server and client markup match.
  useEffect(() => {
    const id = setTimeout(() => setStrings(generateStrings({ alphabet: buildAlphabet({ upper: true, lower: true, digits: true }), length: 16, count: 5, unique: true, getRandomValues })), 0)
    return () => clearTimeout(id)
  }, [])

  const applyPreset = ({ settings }) => {
    setLength(settings.length)
    setUpper(settings.upper)
    setLower(settings.lower)
    setDigits(settings.digits)
    setSymbols(settings.symbols)
    setCustom(settings.custom)
    setExcludeAmbiguous(settings.excludeAmbiguous)
    const next = buildAlphabet(settings)
    setStrings(make({ alphabet: next, length: Number(settings.length), count: countError ? 5 : countNumber, unique }))
    setGenerated(true)
    trackToolUse('random-string-generator', 'result')
  }

  const output = strings.join('\n')

  return (
    <DevToolShell
      left={
        <DevPane title="Settings">
          <div className="space-y-5">
            <div>
              <p className={ui.label}>Presets</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button key={preset.label} type="button" className={ui.smallButton} onClick={() => applyPreset(preset)}>{preset.label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="rs-length" className={ui.label}>Length</label>
                <input id="rs-length" type="number" min="1" max={MAX_LENGTH} inputMode="numeric" className={ui.input} value={length} onChange={(event) => setLength(event.target.value)} />
              </div>
              <div>
                <label htmlFor="rs-count" className={ui.label}>How many</label>
                <input id="rs-count" type="number" min="1" max={MAX_COUNT} inputMode="numeric" className={ui.input} value={count} onChange={(event) => setCount(event.target.value)} />
              </div>
            </div>
            <fieldset>
              <legend className={ui.label}>Characters</legend>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                <Toggle label="Uppercase A–Z" checked={upper} onChange={setUpper} />
                <Toggle label="Lowercase a–z" checked={lower} onChange={setLower} />
                <Toggle label="Digits 0–9" checked={digits} onChange={setDigits} />
                <Toggle label="Symbols !@#$…" checked={symbols} onChange={setSymbols} />
              </div>
            </fieldset>
            <div>
              <label htmlFor="rs-custom" className={ui.label}>Custom characters</label>
              <input id="rs-custom" className={`${ui.input} font-mono`} value={custom} onChange={(event) => setCustom(event.target.value)} placeholder="Added to the set, e.g. -_" spellCheck={false} autoComplete="off" />
            </div>
            <div className="flex flex-col gap-2">
              <Toggle label={`Exclude ambiguous characters (${AMBIGUOUS.slice(0, 6)}…)`} checked={excludeAmbiguous} onChange={setExcludeAmbiguous} />
              <Toggle label="No duplicate strings" checked={unique} onChange={setUnique} />
            </div>
            <ErrorBox>{error}</ErrorBox>
            {uniqueImpossible && <ErrorBox>There are fewer possible strings than you asked for, so some will repeat or be left out.</ErrorBox>}
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className={ui.primaryButton} onClick={generate} disabled={Boolean(error)}>
                <ArrowPathIcon aria-hidden="true" className="size-4" />
                Generate
              </button>
            </div>
            {!error && (
              <div className={ui.rows}>
                <div className={ui.row}><span className={ui.rowLabel}>Character set size</span><span className={ui.rowValue}>{alphabet.length}</span></div>
                <div className={ui.row}><span className={ui.rowLabel}>Entropy per string</span><span className={ui.rowValue}>{bits.toFixed(1)} bits</span></div>
                <div className={ui.row}><span className={ui.rowLabel}>Strength</span><Badge tone={strength.tone}>{strength.label}</Badge></div>
              </div>
            )}
          </div>
        </DevPane>
      }
      right={
        <DevPane title="Random strings" actions={<CopyButton text={output} label={strings.length > 1 ? 'Copy all' : 'Copy'} />}>
          {strings.length ? (
            <CodeBlock label="Generated strings" className="whitespace-pre-wrap break-all">{output}</CodeBlock>
          ) : (
            <div className={`${ui.empty} min-h-[18.5rem]`}>Press Generate to create strings.</div>
          )}
        </DevPane>
      }
      below={
        generated && (
        <ToolCta
          title="Generating test tokens to reproduce a bug?"
          copy="Screendesk bug reports capture console logs, network requests and device details automatically, so you can see what the customer actually sent."
        />
        )
      }
    />
  )
}
