'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import type { SearchResponse, SearchResultItem } from '@/app/api/search/route'

const DEBOUNCE_MS = 220
const MIN_QUERY = 2

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

type Status = 'idle' | 'loading' | 'done' | 'error'

type ResultGroup = {
  type: string
  label: string
  items: SearchResultItem[]
}

const TYPE_ORDER = ['page', 'article', 'news-event', 'review'] as const
const TYPE_LABELS: Record<string, string> = {
  page: 'Pages',
  article: 'Articles',
  'news-event': 'News & Events',
  review: 'Reviews',
}

function groupResults(results: SearchResultItem[]): ResultGroup[] {
  const map = new Map<string, SearchResultItem[]>()
  for (const item of results) {
    const list = map.get(item.type) ?? []
    list.push(item)
    map.set(item.type, list)
  }
  return TYPE_ORDER.filter((t) => map.has(t)).map((t) => ({
    type: t,
    label: TYPE_LABELS[t] ?? t,
    items: map.get(t)!,
  }))
}

export function SearchDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResultItem[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const latestQueryRef = useRef('')
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)

  const openDialog = useCallback(() => {
    setOpen(true)
    setQuery('')
    setResults([])
    setStatus('idle')
    setActiveIndex(-1)
    latestQueryRef.current = ''
  }, [])

  const closeDialog = useCallback(() => setOpen(false), [])

  // Cmd+K / Ctrl+K toggle and Escape close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) closeDialog()
        else openDialog()
      }
      if (e.key === 'Escape' && open) closeDialog()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, openDialog, closeDialog])

  // Header button trigger
  useEffect(() => {
    const handler = () => openDialog()
    window.addEventListener('open-search-dialog', handler)
    return () => window.removeEventListener('open-search-dialog', handler)
  }, [openDialog])

  // Auto-focus input on open
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  // Fetch results on debounced query change
  useEffect(() => {
    if (debouncedQuery.length < MIN_QUERY) {
      return
    }
    let cancelled = false
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json() as Promise<SearchResponse>)
      .then((data) => {
        if (!cancelled && latestQueryRef.current === debouncedQuery) {
          setResults(data.results)
          setStatus('done')
          setActiveIndex(-1)
        }
      })
      .catch(() => {
        if (!cancelled && latestQueryRef.current === debouncedQuery) {
          setStatus('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery])

  const handleQueryChange = (nextQuery: string) => {
    latestQueryRef.current = nextQuery
    setQuery(nextQuery)
    setActiveIndex(-1)

    if (nextQuery.length < MIN_QUERY) {
      setResults([])
      setStatus('idle')
    } else {
      setStatus('loading')
    }
  }

  // Arrow-key / Enter keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      const item = results[activeIndex]
      if (item) {
        closeDialog()
        router.push(item.href)
      }
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0) return
    document.getElementById(`search-result-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const groups = useMemo(() => groupResults(results), [results])

  if (!open) return null

  return (
    <>
      {/* Backdrop — separate element so onClick reliably fires when clicking outside the panel */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={closeDialog}
      />

      {/* Positioning shell — pointer-events-none so clicks outside the panel fall through to the backdrop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Site search"
        className="pointer-events-none fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      >
        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-card border border-border bg-background shadow-2xl"
        >
          {/* Search input row */}
          <div className="flex items-center gap-4 border-b border-border px-5 py-4 sm:px-6">
            <svg
              aria-hidden="true"
              className="size-5 shrink-0 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              role="combobox"
              aria-expanded={query.length >= MIN_QUERY}
              aria-autocomplete="list"
              aria-controls="search-dialog-listbox"
              aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
              value={query}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages, articles, news, reviews…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground sm:text-lg"
            />
            <kbd className="hidden rounded-compact border border-border px-2 py-1 text-sm text-muted-foreground sm:block">
              Esc
            </kbd>
            <button
              type="button"
              onClick={closeDialog}
              aria-label="Close search"
              className="flex size-9 shrink-0 items-center justify-center rounded-control text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <svg
                aria-hidden="true"
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Results body */}
          <div
            aria-live="polite"
            aria-atomic="false"
            className="max-h-[min(60vh,420px)] overflow-y-auto"
          >
            {query.length >= MIN_QUERY && status === 'loading' ? (
              <div className="flex items-center gap-2.5 px-5 py-6 text-sm text-muted-foreground sm:px-6">
                <svg
                  aria-hidden="true"
                  className="size-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Searching…
              </div>
            ) : status === 'error' ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground sm:px-6">
                Search unavailable. Please try again.
              </p>
            ) : status === 'done' && results.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground sm:px-6">
                No results for <strong>&ldquo;{query}&rdquo;</strong>
              </p>
            ) : results.length > 0 ? (
              <ul
                id="search-dialog-listbox"
                role="listbox"
                aria-label="Search results"
                className="pb-1 pt-1"
              >
                {groups.map(({ type, label, items }) => (
                  <li key={type} role="presentation">
                    {/* Section header */}
                    <p className="px-5 pb-1 pt-4 font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground/70 sm:px-6">
                      {label}
                    </p>
                    <ul role="group" aria-label={label}>
                      {items.map((item) => {
                        const idx = results.indexOf(item)
                        return (
                          <li
                            key={item.id}
                            id={`search-result-${idx}`}
                            role="option"
                            aria-selected={idx === activeIndex}
                          >
                            <Link
                              href={item.href}
                              onClick={closeDialog}
                              className={`mx-2 flex items-center gap-3 rounded-control px-4 py-3 transition-colors ${
                                idx === activeIndex ? 'bg-accent' : 'hover:bg-accent'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-base font-medium text-foreground">
                                  {item.title}
                                </p>
                                {item.excerpt && item.excerpt !== item.title ? (
                                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                                    {item.excerpt}
                                  </p>
                                ) : null}
                              </div>
                              <svg
                                aria-hidden="true"
                                className="size-4 shrink-0 text-muted-foreground/40"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path d="m9 18 6-6-6-6" />
                              </svg>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            ) : (
              /* Idle: keyboard hint */
              <div className="flex items-center justify-between px-5 py-4 text-sm text-muted-foreground sm:px-6">
                <span>Type to search the site</span>
                <span className="hidden items-center gap-4 sm:flex">
                  <span className="inline-flex items-center gap-2">
                    <kbd className="rounded-compact border border-border px-2 py-1">↑↓</kbd>
                    <span>navigate</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <kbd className="rounded-compact border border-border px-2 py-1">↵</kbd>
                    <span>open</span>
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Footer: always visible once query is long enough */}
          {query.length >= MIN_QUERY && (
            <div className="border-t border-border px-5 py-3 sm:px-6">
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={closeDialog}
                className="text-sm text-muted-foreground hover:text-foreground hover:underline"
              >
                View all results for &ldquo;{query}&rdquo; →
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </>
  )
}
