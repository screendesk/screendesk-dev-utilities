import Link from 'next/link'
import { SiteFooter, SiteHeader } from '@/components/tools/ToolLayout'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Page not found</h1>
        <p className="mt-3 text-zinc-500">That tool doesn’t exist here.</p>
        <Link href="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">See all tools</Link>
      </main>
      <SiteFooter />
    </>
  )
}
