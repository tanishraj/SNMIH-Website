import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { searchPublishedContent, type SearchResponse } from '@/lib/search'
export type { SearchResultItem, SearchResponse } from '@/lib/search'

// In-memory rate limiter: 20 requests / IP / 10 s.
// Expired entries are evicted on each request to prevent unbounded growth
// in long-lived Node.js processes (e.g. self-hosted next start).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20
const RATE_WINDOW_MS = 10_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()

  // Evict expired entries so the map does not grow unboundedly
  for (const [key, entry] of rateLimitMap) {
    if (now >= entry.resetAt) rateLimitMap.delete(key)
  }

  const entry = rateLimitMap.get(ip)
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT
}

const MIN_QUERY_LENGTH = 2
// Dialog shows 6 per type — enough for a compact list without overwhelming the UI.
// The SSR /search page uses 8 per type for the expanded view.
const PER_TYPE_LIMIT = 6

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''

  if (query.length < MIN_QUERY_LENGTH) {
    return NextResponse.json<SearchResponse>({ results: [], query, total: 0 })
  }

  const payload = await getPayload({ config: configPromise })
  const results = await searchPublishedContent(payload, query, PER_TYPE_LIMIT)

  return NextResponse.json<SearchResponse>({ results, query, total: results.length })
}
