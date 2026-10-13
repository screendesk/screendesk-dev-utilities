import Head from 'next/head'
import Link from 'next/link'
import { ArrowRightIcon, ArrowTopRightOnSquareIcon, PlusIcon } from '@heroicons/react/24/outline'
import JsonLd, { faqSchema } from '@/components/JsonLd'
import { toolGroups, tools } from './toolsData'

// Open-source page shell. Same exports as the screendesk.io layout (src/components/tools/ToolLayout.jsx in
// the marketing repo), so the synced tool pages work unchanged. This file is not overwritten by the sync.

export const repoUrl = 'https://github.com/screendesk/screendesk-dev-utilities'
const siteUrl = 'https://screendesk.io'

// Canonical URLs point at screendesk.io, where every tool lives at the same path.
const canonical = (path) => `${siteUrl}${path}`
const hrefFor = (tool) => tool.href

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <img src="/screendesk-logo.svg" alt="Screendesk" width={116} height={20} className="h-5 w-auto" />
          <span className="hidden text-sm text-zinc-500 sm:inline">Dev Utilities</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">All tools</Link>
          <a href={repoUrl} className="rounded-md px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">GitHub</a>
          <a href={`${siteUrl}/tools`} className="hidden items-center gap-1 rounded-md border border-zinc-200 px-3 py-1.5 font-medium text-zinc-900 hover:bg-zinc-50 sm:inline-flex">
            screendesk.io <ArrowTopRightOnSquareIcon aria-hidden="true" className="size-3.5" />
          </a>
        </nav>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-10 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          Open source, ad-free, and client-side: your data never leaves the browser.{' '}
          <a href={repoUrl} className="text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-500">Source on GitHub</a>
        </p>
        <p>
          Made by <a href={siteUrl} className="text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-500">Screendesk</a>, visual support for customer support teams.
        </p>
      </div>
    </footer>
  )
}

export function ToolPageLayout({ meta, breadcrumb, faqs, current, children }) {
  const url = canonical(meta.path)
  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:image" content={`${siteUrl}/images/og/tools.png`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <SiteHeader />
      <main>
        {breadcrumb && (
          <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-6 text-sm text-zinc-500 sm:px-6">
            <Link href="/" className="hover:text-zinc-900">All tools</Link>
            <span className="px-2 text-zinc-300">/</span>
            <span className="text-zinc-900">{breadcrumb.name}</span>
          </nav>
        )}
        {children}
        <MoreTools current={current} />
        {faqs?.length > 0 && <ToolFaq faqs={faqs} />}
      </main>
      <SiteFooter />
      {faqs?.length > 0 && <JsonLd data={faqSchema({ questions: faqs.map(({ question, answer }) => ({ name: question, text: answer })) })} />}
    </>
  )
}

export function ToolHero({ pill = 'Free tool', title, description }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-12 pb-10 text-center sm:px-6" aria-labelledby="tool-heading">
      <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">{pill}</span>
      <h1 id="tool-heading" className="mt-5 text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">{title}</h1>
      <p className="mt-4 text-lg text-pretty text-zinc-500">{description}</p>
    </section>
  )
}

export function ToolFrame({ children }) {
  return (
    <section aria-label="Tool" className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:16px_16px] p-4 sm:p-8">
        {children}
      </div>
    </section>
  )
}

export function ToolSection({ id, pill, title, subtitle, children }) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <header className="mb-6">
        <span className="text-sm font-medium text-rose-600">{pill}</span>
        <h2 id={`${id}-heading`} className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
          {title}{subtitle && <> <span className="text-zinc-400">{subtitle}</span></>}
        </h2>
      </header>
      {children}
    </section>
  )
}

export function ToolPoints({ items }) {
  return (
    <ul role="list" className="grid gap-px overflow-hidden rounded-lg border border-zinc-200 bg-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ icon: Icon, title, copy }) => (
        <li key={title} className="bg-white p-6">
          {Icon && <span className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-rose-500"><Icon aria-hidden="true" className="size-[18px]" /></span>}
          <h3 className="mt-5 font-medium text-zinc-900">{title}</h3>
          <p className="mt-1.5 text-[15px] text-pretty text-zinc-500">{copy}</p>
        </li>
      ))}
    </ul>
  )
}

export function ToolTable({ caption, columns, rows }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-zinc-50 text-zinc-500">
          <tr>{columns.map((column) => <th key={column} scope="col" className="border-b border-zinc-200 px-4 py-3 font-medium">{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map(([label, ...cells]) => (
            <tr key={label} className="border-b border-zinc-100 last:border-0">
              <th scope="row" className="px-4 py-3 font-medium text-zinc-900">{label}</th>
              {cells.map((cell, index) => <td key={index} className="px-4 py-3 text-zinc-600 tabular-nums">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ToolCard({ tool }) {
  const { name, icon: Icon, summary, category } = tool
  return (
    <Link href={hrefFor(tool)} className="group relative flex h-full flex-col rounded-lg border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-rose-500">
      <div className="flex items-center justify-between">
        <span className="grid size-9 place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-rose-500"><Icon aria-hidden="true" className="size-[18px]" /></span>
        <small className="text-xs text-zinc-400">{category}</small>
      </div>
      <strong className="mt-4 font-medium text-zinc-900">{name}</strong>
      <span className="mt-1 pr-6 text-sm text-pretty text-zinc-500">{summary}</span>
      <ArrowRightIcon aria-hidden="true" className="absolute right-5 bottom-5 size-4 text-zinc-300 transition-colors group-hover:text-rose-500" />
    </Link>
  )
}

export function ToolGrid({ group, items }) {
  const list = items ?? (group ? tools.filter((tool) => tool.group === group) : tools)
  return (
    <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {list.map((tool) => <li key={tool.slug}><ToolCard tool={tool} /></li>)}
    </ul>
  )
}

export function ToolGroups({ filter }) {
  return toolGroups.map(({ id, name, subtitle }) => {
    const items = tools.filter((tool) => tool.group === id && (!filter || filter(tool)))
    if (items.length === 0) return null
    return (
      <section key={id} aria-labelledby={`group-${id}`} className="mx-auto max-w-6xl px-4 pt-12 sm:px-6">
        <h2 id={`group-${id}`} className="text-lg font-semibold text-zinc-900">{name} <span className="font-normal text-zinc-400">{subtitle}</span></h2>
        <div className="mt-4"><ToolGrid items={items} /></div>
      </section>
    )
  })
}

function MoreTools({ current }) {
  if (!current) return null
  const group = tools.find(({ slug }) => slug === current)?.group
  const others = tools.filter(({ slug }) => slug !== current)
  const suggestions = [...others.filter((tool) => tool.group === group), ...others.filter((tool) => tool.group !== group)].slice(0, 6)
  return (
    <section aria-labelledby="more-tools-heading" className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <h2 id="more-tools-heading" className="text-2xl font-semibold tracking-tight text-zinc-900">
        More free tools. <Link href="/" className="text-zinc-400 hover:text-zinc-600">See all</Link>
      </h2>
      <div className="mt-6"><ToolGrid items={suggestions} /></div>
    </section>
  )
}

function ToolFaq({ faqs }) {
  return (
    <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h2 id="faq-heading" className="text-2xl font-semibold tracking-tight text-zinc-900">Frequently asked questions</h2>
      <div className="mt-6 divide-y divide-zinc-200 border-y border-zinc-200">
        {faqs.map(({ question, answer }) => (
          <details key={question} className="group py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-zinc-900">
              {question}
              <PlusIcon aria-hidden="true" className="size-4 shrink-0 text-zinc-400 transition-transform group-open:rotate-45" />
            </summary>
            <p className="mt-3 text-[15px] text-pretty text-zinc-600">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
