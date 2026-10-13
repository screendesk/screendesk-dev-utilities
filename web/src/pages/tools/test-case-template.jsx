import { CheckBadgeIcon, ListBulletIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { TestCaseTemplate } from '@/components/tools/qa/TestCaseTemplate'
import { ToolFrame, ToolHero, ToolPageLayout, ToolPoints, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/test-case-template',
  title: 'Test Case Template, Test Plan Template & User Story Template - Screendesk',
  description: 'Free test case template, test plan template, and user story template with Given/When/Then acceptance criteria. Fill the form, then copy as Markdown, plain text, or CSV for import.',
  keywords: 'test case template, test plan template, user story template, acceptance criteria template, test scenario examples, test case format, given when then, test case csv import',
}

const qualities = [
  { icon: CheckBadgeIcon, title: 'One clear outcome', copy: 'Each test case checks one behavior with an expected result specific enough that two testers would agree on pass or fail.' },
  { icon: ListBulletIcon, title: 'Repeatable steps', copy: 'Steps are short actions anyone on the team can follow, with preconditions and test data stated up front instead of assumed.' },
  { icon: ArrowsRightLeftIcon, title: 'Traceable', copy: 'An ID, a feature or section, and a link back to the user story or requirement make coverage and regressions easy to track.' },
]

const fields = [
  ['ID', 'Unique reference used in test runs and bug reports', 'TC-101'],
  ['Title', 'What is being verified, in one line', 'Log in with valid email and password'],
  ['Section / feature', 'Where the test lives in your suite', 'Authentication'],
  ['Priority', 'How important the test is to run', 'High'],
  ['Type', 'Kind of testing', 'Functional, regression, smoke'],
  ['Preconditions', 'State the system must be in before step 1', 'A verified account exists'],
  ['Test data', 'Inputs used by the steps', 'qa.user@example.com'],
  ['Steps', 'Numbered actions, each with its own expected result', 'Click “Log in”'],
  ['Expected result', 'The overall outcome that means pass', 'The dashboard loads'],
  ['Postconditions', 'Cleanup or resulting state after the test', 'Log out'],
]

const scenarios = [
  ['Test scenario', 'A high-level situation to test, often one line', 'User pays with a saved card'],
  ['Test case', 'Detailed steps, data, and expected results for one path through a scenario', 'TC-210: Pay with a saved Visa card'],
  ['Acceptance criteria', 'Conditions a user story must meet to be accepted, often written as Given/When/Then', 'Given I have a saved card, when I pay, then the order is confirmed'],
  ['Test plan', 'The scope, approach, environments, schedule, and exit criteria for a test effort', 'Checkout redesign test plan, v2.4'],
]

const faqs = [
  { question: 'What should a test case template include?', answer: 'At minimum: an ID, a title, preconditions, test data, numbered steps with expected results, and an overall expected result. Priority, type, and the section or feature help you organize and filter cases in larger suites.' },
  { question: 'What is the difference between a test plan and a test case?', answer: 'A test plan describes the whole testing effort: what is in and out of scope, the approach, environments, schedule, roles, risks, and entry and exit criteria. A test case is a single, specific check with steps and an expected result. One test plan usually covers many test cases.' },
  { question: 'How do I write acceptance criteria for a user story?', answer: 'Use the Given/When/Then format: Given describes the starting context, When the action the user takes, and Then the observable outcome. Write one scenario per behavior, including failure paths, and keep each outcome testable.' },
  { question: 'Can I import these test cases into a test management tool?', answer: 'Download the CSV. It has one row per test case with columns for ID, title, section, priority, type, preconditions, test data, steps, and expected result. Most test management tools let you map CSV columns to their own fields during import; check your tool’s import guide for required columns.' },
  { question: 'What happens when a test case fails?', answer: 'Record the actual result, then file a bug report that references the test case ID, the steps, and the environment. A screen recording with console logs and network requests makes the failure much easier for a developer to reproduce.' },
]

export default function TestCaseTemplatePage() {
  return (
    <ToolPageLayout meta={meta} current="test-case-template" breadcrumb={{ name: 'Test Case Template', href: meta.path }} faqs={faqs}>
      <ToolHero title="Test Case, Test Plan & User Story Template" description="Fill in a test case, test plan, or user story with Given/When/Then acceptance criteria. Copy as Markdown or plain text, or export CSV for import." />
      <ToolFrame><TestCaseTemplate /></ToolFrame>
      <ToolSection id="good" pill="Best practice" title="What makes a good test case." subtitle="Clear enough that anyone on the team gets the same result.">
        <ToolPoints items={qualities} />
      </ToolSection>
      <ToolSection id="fields" pill="Fields" title="Test case fields explained." subtitle="What each column in the template is for.">
        <ToolTable caption="Test case template fields" columns={['Field', 'Purpose', 'Example']} rows={fields} />
      </ToolSection>
      <ToolSection id="terms" pill="Terms" title="Scenarios, cases, criteria, and plans." subtitle="How the documents fit together.">
        <ToolTable caption="Test scenario, test case, acceptance criteria, and test plan compared" columns={['Document', 'What it is', 'Example']} rows={scenarios} />
      </ToolSection>
    </ToolPageLayout>
  )
}
