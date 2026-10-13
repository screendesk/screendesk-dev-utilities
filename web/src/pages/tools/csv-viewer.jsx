import { CsvViewer } from '@/components/tools/convert/CsvViewer'
import { ToolFrame, ToolHero, ToolPageLayout, ToolSection, ToolTable } from '@/components/tools/ToolLayout'

const meta = {
  path: '/tools/csv-viewer',
  title: 'CSV Viewer — Open CSV Files Online as a Table | Screendesk',
  description: 'Open and view CSV files online as a sortable, searchable table. See column stats (empty cells, unique values, min and max), page through large files, and export the filtered view. Nothing is uploaded.',
  keywords: 'csv viewer, csv file viewer, open csv file online, view csv online, csv reader, csv table viewer, csv viewer online',
}

const problems = [
  ['Everything in one column', 'The file uses a semicolon or tab, not a comma.', 'Leave the delimiter on Auto, or pick ; or Tab.'],
  ['Header looks like data', 'The file has no header row.', 'Turn off “First row is header”; columns are named Column 1, 2, 3.'],
  ['Rows merged together', 'A quoted field is missing its closing quote.', 'Fix the quote on the line the error names. Quotes inside fields must be doubled ("").'],
  ['Uneven row lengths', 'Some rows have more or fewer fields than the header.', 'Usually an unquoted comma inside a value. Quote that field.'],
  ['Numbers sorted as text', 'Values contain units or mixed formats.', 'Plain numbers, 1,234.5, $12, and 15% sort numerically here; other text sorts naturally.'],
  ['Garbled accents', 'The file is not UTF-8 (often Windows-1252 from older Excel).', 'Re-save as “CSV UTF-8” in Excel or convert the encoding first.'],
]

const stats = [
  ['Filled / Empty', 'How many rows have a value in the column, and how many are blank. Blank IDs or emails usually point to an export problem.'],
  ['Unique', 'Distinct non-empty values. If Unique equals Filled, the column can work as a key.'],
  ['Type', 'Number when every non-empty value parses as a number, otherwise Text.'],
  ['Min / Max / Mean', 'Shown for number columns. Useful for spotting negative durations, zero prices, or outliers.'],
]

const faqs = [
  { question: 'How do I open a CSV file online?', answer: 'Click Open CSV file and choose a .csv, .tsv, or .txt file, or paste CSV text into the box. The file is read in your browser and shown as a table you can sort by clicking a column header, search across every column, and page through.' },
  { question: 'How large a CSV file can I view?', answer: 'Files up to 100 MB can be opened. The table shows 50, 100, or 250 rows per page, so files with tens of thousands of rows stay responsive. Very large files depend on your device’s memory, since everything stays in the browser.' },
  { question: 'Can I sort and filter the CSV?', answer: 'Yes. Click a header to sort ascending, again for descending, and a third time to restore the original order. Numbers sort numerically and text sorts naturally (item2 before item10), with empty cells kept at the bottom. The search box filters rows that contain your text in any column, and Export view downloads exactly the rows you see, in that order.' },
  { question: 'Does it handle semicolons, tabs, and quoted fields?', answer: 'Yes. The parser follows RFC 4180: quoted fields can contain commas, line breaks, and doubled quotes. The delimiter (comma, semicolon, tab, or pipe) is detected from the first lines, and you can override it.' },
  { question: 'Is my CSV file uploaded?', answer: 'No. The file never leaves your device. Parsing, sorting, searching, and stats all run with JavaScript in the browser, so it is safe for exports that contain customer data.' },
]

export default function CsvViewerPage() {
  return (
    <ToolPageLayout meta={meta} current="csv-viewer" breadcrumb={{ name: 'CSV Viewer', href: meta.path }} faqs={faqs}>
      <ToolHero title="CSV Viewer" description="Open a CSV file as a sortable, searchable table with column stats. Large files are paged, and nothing leaves your browser." />
      <ToolFrame><CsvViewer /></ToolFrame>
      <ToolSection id="problems" pill="Troubleshooting" title="When a CSV file looks wrong." subtitle="The usual causes, and how to fix them.">
        <ToolTable caption="Common CSV problems and fixes" columns={['Symptom', 'Cause', 'Fix']} rows={problems} />
      </ToolSection>
      <ToolSection id="stats" pill="Column stats" title="Reading the column stats." subtitle="A quick data-quality check before you import.">
        <ToolTable caption="What each column statistic means" columns={['Stat', 'What it tells you']} rows={stats} />
      </ToolSection>
    </ToolPageLayout>
  )
}
