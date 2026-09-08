import 'server-only'

import type { Payload, Where } from 'payload'
import { resolveNewsEventClassificationRecord } from '@/lib/newsEventClassifications'
import { resolveSearchPageHrefs } from '@/lib/searchPagePaths'
import { findRankedSearchDocuments, SEARCH_BATCH_SIZE } from '@/lib/searchRanking'

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

export async function searchPublishedContent(
  payload: Pick<Payload, 'find' | 'findByID'>,
  query: string,
  limit: number,
): Promise<SearchResultItem[]> {
  const textLike = { like: query }
  const publishedFilter: Where[] = [{ _status: { equals: 'published' } }]

  const [pagesResult, articlesResult, newsEventsResult, reviewsResult] = await Promise.allSettled([
    findRankedSearchDocuments(query, limit, (page) =>
      payload.find({
        collection: 'pages',
        depth: 0,
        limit: SEARCH_BATCH_SIZE,
        page,
        sort: 'id',
        select: { id: true, title: true, slug: true, parent: true, metaDescription: true },
        where: {
          and: [...publishedFilter, { or: [{ title: textLike }, { metaDescription: textLike }] }],
        },
      }),
    ),
    findRankedSearchDocuments(query, limit, (page) =>
      payload.find({
        collection: 'articles',
        depth: 0,
        limit: SEARCH_BATCH_SIZE,
        page,
        sort: 'id',
        select: { id: true, title: true, slug: true, excerpt: true, authorName: true },
        where: {
          and: [
            ...publishedFilter,
            { or: [{ title: textLike }, { excerpt: textLike }, { authorName: textLike }] },
          ],
        },
      }),
    ),
    findRankedSearchDocuments(query, limit, (page) =>
      payload.find({
        collection: 'news-events',
        depth: 1,
        limit: SEARCH_BATCH_SIZE,
        page,
        sort: 'id',
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
    ),
    findRankedSearchDocuments(query, limit, (page) =>
      payload.find({
        collection: 'reviews',
        depth: 0,
        limit: SEARCH_BATCH_SIZE,
        page,
        sort: 'id',
        select: { id: true, title: true, slug: true, reviewTitle: true, reviewerName: true },
        where: {
          and: [
            ...publishedFilter,
            { or: [{ title: textLike }, { reviewTitle: textLike }, { reviewerName: textLike }] },
          ],
        },
      }),
    ),
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

  return results
}
