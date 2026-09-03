import configPromise from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload, type Where } from 'payload'

import { resolveNewsEventClassificationRecord } from '@/lib/newsEventClassifications'
import { resolveSearchPageHrefs } from '@/lib/searchPagePaths'

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

export type SearchResultItem = {
  id: string
  title: string
  excerpt: string
  href: string
  type: 'article' | 'news-event' | 'page' | 'review'
  label: string
}

export type SearchResponse = {
  results: SearchResultItem[]
  query: string
  total: number
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
  const textLike = { like: query }
  const publishedFilter: Where[] = [{ _status: { equals: 'published' } }]

  const [pagesResult, articlesResult, newsEventsResult, reviewsResult] = await Promise.allSettled([
    payload.find({
      collection: 'pages',
      depth: 0,
      limit: PER_TYPE_LIMIT,
      select: { id: true, title: true, slug: true, parent: true, metaDescription: true },
      where: {
        and: [...publishedFilter, { or: [{ title: textLike }, { metaDescription: textLike }] }],
      },
    }),
    payload.find({
      collection: 'articles',
      depth: 0,
      limit: PER_TYPE_LIMIT,
      select: { id: true, title: true, slug: true, excerpt: true, authorName: true },
      where: {
        and: [
          ...publishedFilter,
          { or: [{ title: textLike }, { excerpt: textLike }, { authorName: textLike }] },
        ],
      },
    }),
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit: PER_TYPE_LIMIT,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        classification: true,
        contentType: true,
        authorName: true,
      },
      where: {
        and: [
          ...publishedFilter,
          { or: [{ title: textLike }, { excerpt: textLike }, { authorName: textLike }] },
        ],
      },
    }),
    payload.find({
      collection: 'reviews',
      depth: 0,
      limit: PER_TYPE_LIMIT,
      select: { id: true, title: true, slug: true, reviewTitle: true, reviewerName: true },
      where: {
        and: [
          ...publishedFilter,
          { or: [{ title: textLike }, { reviewTitle: textLike }, { reviewerName: textLike }] },
        ],
      },
    }),
  ])

  const results: SearchResultItem[] = []

  if (pagesResult.status === 'fulfilled') {
    const pageHrefs = await resolveSearchPageHrefs(pagesResult.value.docs, payload)
    for (const page of pagesResult.value.docs) {
      const href = pageHrefs.get(String(page.id))
      if (!href) continue
      results.push({
        id: String(page.id),
        title: page.title,
        excerpt: page.metaDescription ?? '',
        href,
        type: 'page',
        label: 'Page',
      })
    }
  }

  if (articlesResult.status === 'fulfilled') {
    for (const article of articlesResult.value.docs) {
      results.push({
        id: String(article.id),
        title: article.title,
        excerpt: article.excerpt ?? '',
        href: `/articles/${article.slug}`,
        type: 'article',
        label: 'Article',
      })
    }
  }

  if (newsEventsResult.status === 'fulfilled') {
    for (const entry of newsEventsResult.value.docs) {
      const classification = resolveNewsEventClassificationRecord(
        entry.classification,
        entry.contentType,
      )

      results.push({
        id: String(entry.id),
        title: entry.title,
        excerpt: entry.excerpt ?? '',
        href: `/news-events/${entry.slug}`,
        type: 'news-event',
        label: classification?.badgeLabel ?? 'News & Events',
      })
    }
  }

  if (reviewsResult.status === 'fulfilled') {
    for (const review of reviewsResult.value.docs) {
      results.push({
        id: String(review.id),
        title: review.title,
        excerpt: review.reviewTitle ?? '',
        href: `/reviews/${review.slug}`,
        type: 'review',
        label: 'Review',
      })
    }
  }

  return NextResponse.json<SearchResponse>({ results, query, total: results.length })
}
