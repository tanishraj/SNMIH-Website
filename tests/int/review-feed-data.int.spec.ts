import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

import {
  fetchPublishedReviewFeedPage,
  parseReviewFeedPagination,
  type ReviewFeedPayload,
} from '@/lib/reviewFeed'
import { createEmptyReviewFeedPage, normalizeReviewFeedPageSize } from '@/lib/reviewFeedShared'

describe('Review Feed data', () => {
  it('normalizes block page sizes and creates deterministic empty pages', () => {
    expect(normalizeReviewFeedPageSize(undefined)).toBe(4)
    expect(normalizeReviewFeedPageSize(0)).toBe(1)
    expect(normalizeReviewFeedPageSize(20)).toBe(12)
    expect(normalizeReviewFeedPageSize(2.5)).toBe(4)
    expect(createEmptyReviewFeedPage()).toEqual({
      docs: [],
      hasNextPage: false,
      page: 1,
      totalPages: 0,
    })
    expect(createEmptyReviewFeedPage()).not.toBe(createEmptyReviewFeedPage())
  })

  it('marks the Payload-backed feed module as server-only', () => {
    expect(readFileSync('src/lib/reviewFeed.ts', 'utf8')).toContain("import 'server-only'")
  })

  it('defaults and validates server pagination parameters', () => {
    expect(parseReviewFeedPagination(new URLSearchParams())).toEqual({
      limit: 4,
      ok: true,
      page: 1,
    })
    expect(parseReviewFeedPagination(new URLSearchParams('page=2&limit=6'))).toEqual({
      limit: 6,
      ok: true,
      page: 2,
    })

    for (const query of ['page=0&limit=4', 'page=1.5&limit=4', 'page=1&limit=13']) {
      expect(parseReviewFeedPagination(new URLSearchParams(query)).ok).toBe(false)
    }
  })

  it('queries only published reviews and maps a public-safe DTO', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        {
          _status: 'published',
          displayName: '',
          id: 'review-1',
          internalModerationNotes: 'Never expose this',
          isGenuineExperience: true,
          publishedAt: '2026-07-18T14:30:00.000Z',
          rating: '5',
          reviewerEmail: 'private@example.com',
          reviewerName: 'Alex Morgan',
          reviewBody: 'A thoughtful and supportive experience.',
          reviewTitle: 'Outstanding support',
          sourceSubmission: 'submission-1',
          title: 'Fallback title',
          updatedAt: '2026-07-18T15:00:00.000Z',
          workflowState: 'published',
        },
      ],
      hasNextPage: true,
      page: 2,
      totalPages: 3,
    })
    const payload = { find } as unknown as ReviewFeedPayload

    const result = await fetchPublishedReviewFeedPage(payload, { limit: 4, page: 2 })

    expect(find).toHaveBeenCalledWith({
      collection: 'reviews',
      limit: 4,
      overrideAccess: true,
      page: 2,
      select: {
        displayName: true,
        isGenuineExperience: true,
        publishedAt: true,
        rating: true,
        reviewBody: true,
        reviewerName: true,
        reviewTitle: true,
        title: true,
        updatedAt: true,
      },
      sort: ['-publishedAt', '-id'],
      where: {
        _status: {
          equals: 'published',
        },
      },
    })
    expect(result).toEqual({
      docs: [
        {
          authorName: 'Alex M.',
          content: 'A thoughtful and supportive experience.',
          date: 'Jul 18, 2026',
          id: 'review-1',
          rating: 5,
          title: 'Outstanding support',
          verified: true,
        },
      ],
      hasNextPage: true,
      page: 2,
      totalPages: 3,
    })
    expect(Object.keys(result.docs[0] ?? {}).sort()).toEqual(
      ['authorName', 'content', 'date', 'id', 'rating', 'title', 'verified'].sort(),
    )
    expect(result.docs[0]).not.toHaveProperty('reviewerEmail')
    expect(result.docs[0]).not.toHaveProperty('internalModerationNotes')
    expect(result.docs[0]).not.toHaveProperty('sourceSubmission')
    expect(result.docs[0]).not.toHaveProperty('_status')
    expect(result.docs[0]).not.toHaveProperty('workflowState')
  })

  it('normalizes malformed stored display values defensively', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        {
          displayName: 'Public Name',
          id: 9,
          isGenuineExperience: false,
          publishedAt: null,
          rating: '9',
          reviewerName: 'Private Name',
          reviewBody: 'Body',
          reviewTitle: '',
          title: 'Fallback title',
          updatedAt: '2026-07-01T00:00:00.000Z',
        },
      ],
      hasNextPage: false,
      page: 1,
      totalPages: 1,
    })

    const result = await fetchPublishedReviewFeedPage({ find } as unknown as ReviewFeedPayload, {
      limit: 4,
      page: 1,
    })

    expect(result.docs[0]).toMatchObject({
      authorName: 'Public Name',
      date: 'Jul 1, 2026',
      id: '9',
      rating: 5,
      title: 'Fallback title',
      verified: false,
    })
  })
})
