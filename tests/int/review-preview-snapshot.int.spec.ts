import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getReviewPreviewRequirements, type ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'
import { loadReviewPreviewSnapshot } from '@/lib/reviewPreviewSnapshot'
import type { PublicReviewFeedPage } from '@/lib/reviewFeedShared'
import type { Page } from '@/payload-types'

const { getPublishedReviewFeedPageMock, getPublishedReviewRatingDistributionMock } = vi.hoisted(
  () => ({
    getPublishedReviewFeedPageMock: vi.fn(),
    getPublishedReviewRatingDistributionMock: vi.fn(),
  }),
)

vi.mock('@/lib/reviewFeed', () => ({
  getPublishedReviewFeedPage: getPublishedReviewFeedPageMock,
}))

vi.mock('@/lib/reviewRatingSummary', () => ({
  getPublishedReviewRatingDistribution: getPublishedReviewRatingDistributionMock,
}))

const asLayout = (layout: unknown[]) => layout as NonNullable<Page['layout']>

const pageFor = (pageSize: number): PublicReviewFeedPage => ({
  docs: [
    {
      authorName: 'Alex M.',
      content: `Review loaded for page size ${pageSize}`,
      date: 'Jul 19, 2026',
      id: `review-${pageSize}`,
      rating: 5,
      title: `Page size ${pageSize}`,
      verified: true,
    },
  ],
  hasNextPage: false,
  page: 1,
  totalPages: 1,
})

describe('review preview snapshot', () => {
  beforeEach(() => {
    getPublishedReviewFeedPageMock.mockReset()
    getPublishedReviewRatingDistributionMock.mockReset()
  })

  it('collects unique normalized feed sizes and only required live ratings', () => {
    expect(
      getReviewPreviewRequirements(
        asLayout([
          { blockType: 'reviewFeed', pageSize: 4 },
          { blockType: 'reviewFeed', pageSize: 4 },
          { blockType: 'reviewFeed', pageSize: 20 },
          { blockType: 'ratingSpotlight', ratingData: { dataMode: 'manual' } },
        ]),
      ),
    ).toEqual({ needsRatingDistribution: true, pageSizes: [4, 12] })

    expect(
      getReviewPreviewRequirements(
        asLayout([{ blockType: 'ratingSpotlight', ratingData: { dataMode: 'live' } }]),
      ),
    ).toEqual({ needsRatingDistribution: true, pageSizes: [] })

    expect(
      getReviewPreviewRequirements(
        asLayout([
          { blockType: 'ratingSpotlight', ratingData: { dataMode: 'manual' } },
          { blockType: 'heroBanner' },
        ]),
      ),
    ).toEqual({ needsRatingDistribution: false, pageSizes: [] })
  })

  it('loads each unique feed page and rating distribution', async () => {
    const distribution = { average: 4.5, count: 2, counts: [0, 0, 0, 1, 1] } as const
    getPublishedReviewFeedPageMock.mockImplementation((_page: number, pageSize: number) =>
      Promise.resolve(pageFor(pageSize)),
    )
    getPublishedReviewRatingDistributionMock.mockResolvedValue(distribution)

    const snapshot = await loadReviewPreviewSnapshot(
      asLayout([
        { blockType: 'reviewFeed', pageSize: 8 },
        { blockType: 'reviewFeed', pageSize: 4 },
        { blockType: 'reviewFeed', pageSize: 8 },
      ]),
    )

    expect(getPublishedReviewFeedPageMock).toHaveBeenCalledTimes(2)
    expect(getPublishedReviewFeedPageMock).toHaveBeenCalledWith(1, 4)
    expect(getPublishedReviewFeedPageMock).toHaveBeenCalledWith(1, 8)
    expect(getPublishedReviewRatingDistributionMock).toHaveBeenCalledTimes(1)
    expect(snapshot).toEqual<ReviewPreviewSnapshot>({
      feedPagesBySize: { '4': pageFor(4), '8': pageFor(8) },
      ratingDistribution: distribution,
    })
  })

  it('does not query when the layout has no live review data', async () => {
    const snapshot = await loadReviewPreviewSnapshot(
      asLayout([
        { blockType: 'heroBanner' },
        { blockType: 'ratingSpotlight', ratingData: { dataMode: 'manual' } },
      ]),
    )

    expect(snapshot).toEqual({ feedPagesBySize: {}, ratingDistribution: null })
    expect(getPublishedReviewFeedPageMock).not.toHaveBeenCalled()
    expect(getPublishedReviewRatingDistributionMock).not.toHaveBeenCalled()
  })

  it('falls back per query without failing the preview', async () => {
    getPublishedReviewFeedPageMock.mockRejectedValue(new Error('feed unavailable'))
    getPublishedReviewRatingDistributionMock.mockRejectedValue(new Error('ratings unavailable'))

    await expect(
      loadReviewPreviewSnapshot(asLayout([{ blockType: 'reviewFeed', pageSize: 6 }])),
    ).resolves.toEqual({
      feedPagesBySize: {
        '6': { docs: [], hasNextPage: false, page: 1, totalPages: 0 },
      },
      ratingDistribution: null,
    })
  })
})
