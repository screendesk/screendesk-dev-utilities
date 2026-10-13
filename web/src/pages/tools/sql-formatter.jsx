import { SqlFormatter } from '@/components/tools/convert/SqlFormatter'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/sql-formatter',
  title: 'SQL Formatter & Minifier — Beautify SQL Online | Screendesk',
  description: 'Format and beautify SQL queries online: uppercase keywords, one clause per line, indented column lists and subqueries. Minify SQL to one line. Strings and comments are never changed. Runs in your browser.',
  keywords: 'sql formatter, sql beautifier, format sql online, sql pretty print, sql minifier, minify sql, sql query formatter, sql indent',
}

const rules = [
  ['Clauses', 'SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, LIMIT, INSERT INTO, VALUES, UPDATE, SET, DELETE FROM, and RETURNING each start a new line.'],
  ['Lists', 'Columns, GROUP BY and ORDER BY items, SET assignments, and VALUES rows go one per line, indented under their clause.'],
  ['Joins', 'Every JOIN variant (INNER, LEFT, RIGHT, FULL, CROSS, NATURAL, with or without OUTER) starts a line with its ON or USING condition.'],
  ['Conditions', 'AND and OR in WHERE, HAVING, and ON start a new indented line. The AND inside BETWEEN … AND … stays inline.'],
  ['Subqueries', 'A parenthesis followed by SELECT or WITH opens an indented block; function calls and IN lists stay on one line.'],
  ['Set operators', 'UNION, UNION ALL, INTERSECT, and EXCEPT sit on their own line between the two queries.'],
  ['Untouched', 'String literals, quoted identifiers ("x", `x`, [x]), dollar-quoted strings, and comments are kept exactly as written.'],
]

const order = [
  ['1. FROM / JOIN', 'Pick the source tables and combine them.'],
  ['2. WHERE', 'Filter rows. Column aliases from SELECT aren’t available yet.'],
  ['3. GROUP BY', 'Collapse rows into groups.'],
  ['4. HAVING', 'Filter groups, usually on aggregates like COUNT(*) > 5.'],
  ['5. SELECT', 'Compute the output columns and aliases; window functions run here.'],
  ['6. DISTINCT', 'Remove duplicate rows.'],
  ['7. ORDER BY', 'Sort. Aliases from SELECT can be used here.'],
  ['8. LIMIT / OFFSET', 'Return a slice of the sorted rows.'],
]

const faqs = [
  { question: 'How do I format a SQL query?', answer: 'Paste your query into the input box. It is formatted as you type: keywords are uppercased, each major clause starts on a new line, column lists and conditions are indented, and subqueries get their own indented block. Choose 2 spaces, 4 spaces, or tabs, and whether keywords should be uppercase, lowercase, or left as written.' },
  { question: 'Which SQL dialects does the formatter support?', answer: 'It handles standard SQL plus the common syntax of PostgreSQL, MySQL, SQL Server, SQLite, and BigQuery: double-quoted, backtick, and bracketed identifiers, dollar-quoted strings, :: casts, $1, ? and :name placeholders, and --, #, and /* */ comments. It only changes whitespace and keyword case, so dialect-specific syntax passes through unchanged.' },
  { question: 'What does the SQL minifier do?', answer: 'Minify removes comments and collapses the query onto one line with only the spaces it needs, which is handy for logging, embedding a query in a string, or comparing two queries. Optimizer hints written as /*+ … */ or /*! … */ are kept.' },
  { question: 'Will formatting change what my query does?', answer: 'No. The formatter tokenizes the query so it never edits text inside string literals, quoted identifiers, or comments. Only the whitespace between tokens and the case of keywords and built-in function names change. Quoted identifiers keep their case, so "Order" stays "Order".' },
  { question: 'Is my SQL sent to a server?', answer: 'No. Formatting runs entirely in your browser. Your queries, table names, and any values in them are not uploaded or stored.' },
]

export default function SqlFormatterPage() {
  return (
    <ToolPageLayout meta={meta} current="sql-formatter" breadcrumb={{ name: 'SQL Formatter', href: meta.path }} faqs={faqs}>
      <ToolHero title="SQL Formatter & Minifier" description="Beautify SQL with one clause per line and indented subqueries, or minify it to a single line. Strings and comments stay exactly as written." />
      <ToolFrame><SqlFormatter /></ToolFrame>
      <ToolSection id="rules" pill="How it formats" title="Formatting rules." subtitle="What changes when you format a query, and what never does.">
        <ToolTable caption="SQL formatting rules" columns={['Part', 'Rule']} rows={rules} />
      </ToolSection>
      <ToolSection id="order" pill="Reference" title="Logical order of a SELECT." subtitle="The order the database evaluates clauses, which explains most alias and aggregate errors.">
        <ToolTable caption="Logical query processing order" columns={['Step', 'What happens']} rows={order} />
      </ToolSection>
    </ToolPageLayout>
  )
}
