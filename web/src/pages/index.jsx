import Head from 'next/head'
import { useEffect, useRef, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { SiteFooter, SiteHeader, ToolGroups, repoUrl } from '@/components/tools/ToolLayout'
import { tools } from '@/components/tools/toolsData'

const title = 'Screendesk Dev Utilities: free, open-source browser tools'
const description = `${tools.length} free tools for developers, QA, and support teams: HAR analyzer, JSON formatter, JWT decoder, device tests, test data, and more. Open source, no ads, nothing uploaded.`

export default function Home() {
  const [query, setQuery] = useState('')
  const input = useRef(null)

  // ⌘K / Ctrl+K or "/" focuses search.
  useEffect(() => {
    const onKey = (event) => {
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      if (((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') || (event.key === '/' && !typing)) {
        event.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const matches = (tool) => terms.every((term) => `${tool.name} ${tool.summary} ${tool.category}`.toLowerCase().includes(term))
  const count = tools.filter(matches).length

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://screendesk.io/tools" />
      </Head>
      <SiteHeader />
      <main className="pb-16">
        <section className="mx-auto max-w-3xl px-4 pt-14 text-center sm:px-6">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">Free tools for developers, QA, and support</h1>
          <p className="mt-4 text-lg text-pretty text-zinc-500">
            {tools.length} fast, ad-free utilities. Everything runs in your browser, so your data stays on your device.{' '}
            <a href={repoUrl} className="text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-500">Open source on GitHub</a>.
          </p>
          <label className="relative mx-auto mt-8 block max-w-xl">
            <span className="sr-only">Search tools</span>
            <MagnifyingGlassIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              ref={input}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools"
              className="block h-11 w-full rounded-lg border border-zinc-200 bg-white pr-14 pl-9 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            <kbd className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded border border-zinc-200 px-1.5 text-xs text-zinc-400">⌘K</kbd>
          </label>
        </section>
        <ToolGroups filter={matches} />
        {count === 0 && <p className="mx-auto mt-12 max-w-6xl px-4 text-center text-sm text-zinc-500 sm:px-6">No tools match “{query}”.</p>}
      </main>
      <SiteFooter />
    </>
  )
}
