import { DiffChecker } from '@/components/tools/dev/DiffChecker'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/diff-checker',
  title: 'Diff Checker — Compare Text & JSON Online Free | Screendesk',
  description: 'Compare two texts, configs, or JSON files and see every added and removed line side by side or as a unified diff. Ignore whitespace or case. Free, private, runs in your browser.',
  keywords: 'diff checker, text compare, compare text online, json diff, diff tool, compare two files, text difference, online diff, unified diff',
}

const options = [
  ['Ignore whitespace', 'Treats lines as equal when they differ only in spaces, tabs, or indentation.', 'Re-indented code, copied logs, or files edited on different machines.'],
  ['Ignore case', 'Treats lines as equal when they differ only in upper or lower case.', 'SQL, headers, or config keys where case does not matter.'],
  ['Format as JSON first', 'Parses both sides, sorts object keys, and pretty-prints them before comparing.', 'Comparing API responses or JSON configs where key order and formatting differ.'],
  ['Side by side', 'Original on the left, changed on the right, with changed lines paired up.', 'Reviewing edits to prose, configs, or short files.'],
  ['Unified', 'One column with − for removed and + for added lines, like git diff.', 'Pasting into a ticket, pull request, or chat. Copy diff exports this format.'],
]

const uses = [
  ['Working vs broken config', 'Paste the config from a healthy environment and the failing one to spot the setting that differs.'],
  ['API response regressions', 'Compare yesterday’s response with today’s, with Format as JSON first on, to see exactly which fields changed.'],
  ['Log comparison', 'Diff a passing and failing run to find where the output first diverges.'],
  ['Copy and content edits', 'Check what a teammate changed in a help-center article, email template, or release note.'],
]

const faqs = [
  { question: 'How do I compare two texts?', answer: 'Paste the original text on the left and the changed version on the right. The differences appear below as you type: removed lines in red, added lines in green, and unchanged lines collapsed so you can focus on what changed. Switch between side-by-side and unified views at any time.' },
  { question: 'How do I compare two JSON files?', answer: 'Turn on “Format as JSON first”. Both sides are parsed, object keys are sorted, and the JSON is pretty-printed before the comparison, so differences in key order or whitespace disappear and only real value changes remain. If either side is invalid JSON, you will see the line and column of the error.' },
  { question: 'Which diff algorithm does this use?', answer: 'It uses the Myers diff algorithm, the same approach behind git diff and GNU diff, to find the smallest set of line insertions and deletions that turns the original into the changed text. Comparison is line by line.' },
  { question: 'Is there a size limit?', answer: 'Each side can be up to 20,000 lines. Very different large inputs may be too expensive to compare in the browser; in that case, compare smaller sections. Nothing is uploaded, so the limit depends only on your device.' },
  { question: 'Is my text uploaded?', answer: 'No. The comparison runs entirely in your browser. Nothing you paste is sent to a server or stored.' },
]

export default function DiffCheckerPage() {
  return (
    <ToolPageLayout meta={meta} current="diff-checker" breadcrumb={{ name: 'Diff Checker', href: meta.path }} faqs={faqs}>
      <ToolHero title="Diff Checker" description="Compare two texts or JSON documents and see every added and removed line, side by side or as a unified diff. Private and instant." />
      <ToolFrame><DiffChecker /></ToolFrame>
      <ToolSection id="options" pill="Options" title="Read the diff your way." subtitle="What each option does and when to use it.">
        <ToolTable caption="Diff checker options" columns={['Option', 'What it does', 'Use it for']} rows={options} />
      </ToolSection>
      <ToolSection id="uses" pill="Debugging" title="Where a diff saves time." subtitle="Common comparisons when tracking down a bug.">
        <ToolTable caption="Common uses for a diff checker" columns={['Comparison', 'How to use it']} rows={uses} />
      </ToolSection>
    </ToolPageLayout>
  )
}
