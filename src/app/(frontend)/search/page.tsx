import type { Metadata } from 'next'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import Link from 'next/link'
import { CalendarDays, FileText, Newspaper, Star, type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { searchPublishedContent } from '@/lib/search'
import { normalizeSuggestedSearchTerms } from '@/lib/searchSuggestions'
import { SearchInput } from './SearchInput'
import type { SearchSetting } from '@/payload-types'

const MIN_QUERY_LENGTH = 2
const PER_TYPE_LIMIT = 8

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false },
}

type SearchItem = {
  id: string
  title: string
  excerpt: string
  href: string
  label: string
}

type SearchGroup = {
  type: string
  label: string
  items: SearchItem[]
}

const SEARCH_RESULT_ICONS: Record<string, LucideIcon> = {
  page: FileText,
  article: Newspaper,
  'news-event': CalendarDays,
  review: Star,
}

const getSearchResultIcon = (type: string): LucideIcon => SEARCH_RESULT_ICONS[type] ?? FileText

type PageProps = {
  searchParams: Promise<{ q?: string }>
}

async function getSearchSettings(): Promise<SearchSetting> {
  const payload = await getPayload({ config: configPromise })
  return payload.findGlobal({ slug: 'search-settings' })
}

async function runSearch(query: string): Promise<SearchGroup[]> {
  const payload = await getPayload({ config: configPromise })
  const results = await searchPublishedContent(payload, query, PER_TYPE_LIMIT)
  const labels: Record<string, string> = {
    page: 'Pages', article: 'Articles', 'news-event': 'News & Events', review: 'Reviews',
  }
  return Object.entries(labels).flatMap(([type, label]) => {
    const items = results.filter((item) => item.type === type)
    return items.length ? [{ type, label, items }] : []
  })
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const hasQuery = query.length >= MIN_QUERY_LENGTH

  const [groups, settings] = await Promise.all([
    hasQuery ? runSearch(query) : Promise.resolve([]),
    getSearchSettings(),
  ])

  const suggestedTerms = normalizeSuggestedSearchTerms(settings.suggestedSearches)

  const totalResults = groups.reduce((sum, g) => sum + g.items.length, 0)

  return (
    <>
      {/* ── Hero band: heading + input + popular chips ─────────────────── */}
      <div className="border-b border-border bg-muted/40">
        <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="mb-1 text-2xl font-semibold tracking-tight">Search</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Find pages, articles, news &amp; events, and reviews.
          </p>

          <form
            method="GET"
            action="/search"
            role="search"
            aria-label="Site search"
            className="max-w-2xl"
          >
            <div className="flex gap-2">
              <SearchInput defaultValue={query} />
              <Button type="submit" size="lg">
                Search
              </Button>
            </div>
          </form>

          {/* Popular search chips */}
          {suggestedTerms.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">Popular:</span>
              {suggestedTerms.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  data-search-suggestion="true"
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-foreground/30 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${
                    query === term
                      ? 'border-foreground/30 bg-background text-foreground'
                      : 'border-border bg-background/60 text-muted-foreground'
                  }`}
                >
                  {term}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results body ───────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8">
        {!hasQuery ? (
          /* Empty / idle state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-compact border border-border bg-muted">
              <svg
                aria-hidden="true"
                className="size-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-base font-medium text-foreground">What are you looking for?</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Type at least {MIN_QUERY_LENGTH} characters to search across pages, articles, news
              &amp; events, and reviews.
            </p>
          </div>
        ) : groups.length === 0 ? (
          /* No results state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-compact border border-border bg-muted">
              <svg
                aria-hidden="true"
                className="size-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M9.172 16.172a4 4 0 0 1 5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
              </svg>
            </div>
            <p className="text-base font-medium text-foreground">
              No results for &ldquo;{query}&rdquo;
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try a different search term or browse the popular searches above.
            </p>
          </div>
        ) : (
          /* Results */
          <div>
            <p className="mb-8 text-sm text-muted-foreground">
              {totalResults} result{totalResults !== 1 ? 's' : ''} for{' '}
              <strong className="text-foreground">&ldquo;{query}&rdquo;</strong>
            </p>

            <div className="flex flex-col gap-10" aria-live="polite">
              {groups.map((group) => {
                const ResultIcon = getSearchResultIcon(group.type)

                return (
                  <section key={group.type} aria-label={group.label}>
                    {/* Section header */}
                    <div className="mb-3 flex items-center gap-3">
                      <h2 className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                        {group.label}
                      </h2>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {group.items.length}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    {/* Result cards */}
                    <ul className="flex flex-col gap-2" role="list">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className="group flex flex-col items-start gap-3 rounded-card border border-border bg-background p-4 transition-colors hover:bg-muted sm:flex-row sm:justify-between sm:gap-6"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-foreground group-hover:underline group-hover:underline-offset-2">
                                {item.title}
                              </p>
                              {item.excerpt && item.excerpt !== item.title ? (
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                  {item.excerpt}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex shrink-0 items-center gap-2 self-end sm:self-start sm:pt-0.5">
                              <span className="inline-flex max-w-48 items-center gap-1.5 rounded-compact border border-primary/20 bg-primary/10 px-2 py-0.5 text-right text-xs leading-4 font-semibold whitespace-normal text-primary">
                                <ResultIcon aria-hidden="true" className="size-3.5 shrink-0" />
                                {item.label}
                              </span>
                              <svg
                                aria-hidden="true"
                                className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
