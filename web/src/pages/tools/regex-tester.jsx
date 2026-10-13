import { RegexTester } from '@/components/tools/convert/RegexTester'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/regex-tester',
  title: 'Regex Tester — Test JavaScript Regular Expressions Online | Screendesk',
  description: 'Test regular expressions online with live match highlighting, capture groups, named groups, match indices, and a replace preview. JavaScript flags g i m s u y. Runs in your browser.',
  keywords: 'regex tester, regular expression tester, regex test online, javascript regex tester, regex checker, regex match, regex replace, test regex',
}

const syntax = [
  ['.', 'Any character except a line break (any character with the s flag)', 'a.c matches abc, a-c'],
  ['\\d  \\w  \\s', 'Digit, word character [A-Za-z0-9_], whitespace', '\\d{3} matches 404'],
  ['\\D  \\W  \\S', 'The opposite of \\d, \\w, \\s', '\\S+ matches a run of non-spaces'],
  ['[abc]  [^abc]  [a-z]', 'Character class, negated class, range', '[^,]+ matches up to a comma'],
  ['^  $', 'Start and end of the input (of each line with the m flag)', '^ERROR matches lines starting with ERROR'],
  ['\\b  \\B', 'Word boundary, not a word boundary', '\\bid\\b matches id but not user_id'],
  ['*  +  ?', 'Zero or more, one or more, zero or one', 'colou?r matches color and colour'],
  ['{n}  {n,}  {n,m}', 'Exactly n, at least n, between n and m', '\\d{2,4}'],
  ['*?  +?  ??', 'Lazy versions: match as little as possible', '<.+?> matches one tag at a time'],
  ['(…)  (?:…)', 'Capturing group, non-capturing group', '(\\d+)ms captures the number'],
  ['(?<name>…)  \\k<name>', 'Named group and a backreference to it', '(?<q>["\']).*?\\k<q>'],
  ['a|b', 'Alternation: a or b', 'ERROR|WARN'],
  ['(?=…)  (?!…)', 'Lookahead, negative lookahead', '\\d+(?=px) matches 12 in 12px'],
  ['(?<=…)  (?<!…)', 'Lookbehind, negative lookbehind', '(?<=\\$)\\d+ matches 5 in $5'],
  ['\\p{L}  \\p{Emoji}', 'Unicode property escapes (need the u flag)', '\\p{L}+ matches café'],
]

const replacements = [
  ['$1, $2 …', 'The text of capture group 1, 2, …'],
  ['$<name>', 'The text of a named group'],
  ['$&', 'The whole match'],
  ['$`', 'The text before the match'],
  ["$'", 'The text after the match'],
  ['$$', 'A literal dollar sign'],
]

const faqs = [
  { question: 'How do I test a regular expression?', answer: 'Type the pattern between the slashes, choose the flags, and paste your test string. Matches are highlighted as you type, and the list on the right shows each match with its position and every capture group. Turn on Replace to preview the result of String.replace with your replacement pattern.' },
  { question: 'Which regex flavor does this tester use?', answer: 'It uses your browser’s JavaScript (ECMAScript) engine, the same one your front-end code runs on. Most syntax is shared with PCRE, Python, and Java, but there are differences: JavaScript has no possessive quantifiers, atomic groups, or inline modifiers like (?i), and lookbehind and named groups need a modern browser.' },
  { question: 'What do the g, i, m, s, u, and y flags do?', answer: 'g finds all matches instead of the first, i ignores case, m makes ^ and $ match at line breaks, s lets . match line breaks, u enables full Unicode mode including \\p{…} property escapes, and y (sticky) only matches at the exact position where the last match ended.' },
  { question: 'Why does my regex freeze or time out?', answer: 'Patterns with nested or overlapping quantifiers, such as (a+)+ or (.*,)*, can backtrack exponentially on text that almost matches. This tester runs your pattern in a background worker and stops it after one second so the page stays responsive. Make the pattern more specific, for example [^,]* instead of .*, to fix it.' },
  { question: 'Is my test string sent anywhere?', answer: 'No. Matching happens in your browser in a Web Worker. Nothing you type is uploaded or stored, so you can test against real log lines, but avoid pasting secrets anyway.' },
]

export default function RegexTesterPage() {
  return (
    <ToolPageLayout meta={meta} current="regex-tester" breadcrumb={{ name: 'Regex Tester', href: meta.path }} faqs={faqs}>
      <ToolHero title="Regex Tester" description="Test JavaScript regular expressions with live highlighting, capture groups, and a replace preview. Slow patterns are stopped before they freeze the page." />
      <ToolFrame><RegexTester /></ToolFrame>
      <ToolSection id="syntax" pill="Cheat sheet" title="Regex syntax." subtitle="The tokens you’ll use most in JavaScript regular expressions.">
        <ToolTable caption="Regular expression syntax cheat sheet" columns={['Token', 'Meaning', 'Example']} rows={syntax} />
      </ToolSection>
      <ToolSection id="replace" pill="Reference" title="Replacement patterns." subtitle="Special sequences you can use in the replace field.">
        <ToolTable caption="Replacement patterns for String.replace" columns={['Pattern', 'Inserts']} rows={replacements} />
      </ToolSection>
    </ToolPageLayout>
  )
}
