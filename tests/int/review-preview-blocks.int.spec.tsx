import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { RatingSpotlightPreviewBlockComponent } from '@/blocks/RatingSpotlight/PreviewComponent'
import { ReviewFeedPreviewBlockComponent } from '@/blocks/ReviewFeed/PreviewComponent'
import { EMPTY_REVIEW_PREVIEW_SNAPSHOT } from '@/lib/reviewPreviewShared'
import type { PublishedReviewRatingDistribution } from '@/lib/reviewRatingShared'

const distribution: PublishedReviewRatingDistribution = {
  average: 4.5,
  count: 2,
  counts: [0, 0, 0, 1, 1],
}

describe('review live-preview block adapters', () => {
  it('renders the feed page matching the normalized configured size', () => {
    const html = renderToStaticMarkup(
      <ReviewFeedPreviewBlockComponent
        pageSize={8}
        snapshot={{
          feedPagesBySize: {
            '8': {
              docs: [
                {
                  authorName: 'Alex M.',
                  content: 'Review loaded for page size eight',
                  date: 'Jul 19, 2026',
                  id: 'review-8',
                  rating: 5,
                  title: 'Matching snapshot page',
                  verified: true,
                },
              ],
              hasNextPage: false,
              page: 1,
              totalPages: 1,
            },
          },
          ratingDistribution: distribution,
        }}
        title="Published reviews"
      />,
    )

    expect(html).toContain('Review loaded for page size eight')
    expect(html).toContain('4.5')
  })

  it('keeps manual ratings independent of the live snapshot', () => {
    const html = renderToStaticMarkup(
      <RatingSpotlightPreviewBlockComponent
        ratingData={{ dataMode: 'manual', manualRating: 4.7, manualReviewCount: 52 }}
        snapshot={EMPTY_REVIEW_PREVIEW_SNAPSHOT}
        title="Manual rating"
      />,
    )

    expect(html).toContain('4.7 / 5')
    expect(html).toContain('52 reviews')
  })

  it('renders live ratings from the read-only snapshot', () => {
    const html = renderToStaticMarkup(
      <RatingSpotlightPreviewBlockComponent
        snapshot={{ feedPagesBySize: {}, ratingDistribution: distribution }}
        title="Live rating"
      />,
    )

    expect(html).toContain('4.5 / 5')
    expect(html).toContain('2 reviews')
    expect(html).not.toMatch(/<(form|input|textarea)\b/)
  })

  it('uses deterministic empty states when snapshot data is unavailable', () => {
    const feed = renderToStaticMarkup(
      <ReviewFeedPreviewBlockComponent
        emptyStateMessage="No published reviews yet."
        pageSize={6}
        snapshot={EMPTY_REVIEW_PREVIEW_SNAPSHOT}
        title="Published reviews"
      />,
    )
    const rating = renderToStaticMarkup(
      <RatingSpotlightPreviewBlockComponent
        snapshot={EMPTY_REVIEW_PREVIEW_SNAPSHOT}
        title="Live rating"
      />,
    )

    expect(feed).toContain('No published reviews yet.')
    expect(rating).toContain('data-rating-spotlight-data="empty"')
  })

  it('keeps presentation and preview adapters free of server review imports', () => {
    for (const path of [
      'src/blocks/ReviewFeed/Presentation.tsx',
      'src/blocks/ReviewFeed/PreviewComponent.tsx',
      'src/blocks/RatingSpotlight/Presentation.tsx',
      'src/blocks/RatingSpotlight/PreviewComponent.tsx',
    ]) {
      const source = readFileSync(path, 'utf8')

      expect(source).not.toContain('@payload-config')
      expect(source).not.toContain("from 'payload'")
      expect(source).not.toContain("from '@/lib/reviewFeed'")
      expect(source).not.toContain("from '@/lib/reviewRatingSummary'")
    }
  })
})
