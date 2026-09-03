import 'server-only'

import { getPublishedReviewFeedPage } from '@/lib/reviewFeed'
import { createEmptyReviewFeedPage } from '@/lib/reviewFeedShared'
import { getReviewPreviewRequirements, type ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'
import { getPublishedReviewRatingDistribution } from '@/lib/reviewRatingSummary'
import type { Page } from '@/payload-types'

export async function loadReviewPreviewSnapshot(
  layout?: Page['layout'] | null,
): Promise<ReviewPreviewSnapshot> {
  const requirements = getReviewPreviewRequirements(layout)
  const feedEntriesPromise = Promise.all(
    requirements.pageSizes.map(async (pageSize) => {
      const page = await getPublishedReviewFeedPage(1, pageSize).catch(() =>
        createEmptyReviewFeedPage(),
      )

      return [String(pageSize), page] as const
    }),
  )
  const distributionPromise = requirements.needsRatingDistribution
    ? getPublishedReviewRatingDistribution().catch(() => null)
    : Promise.resolve(null)
  const [feedEntries, ratingDistribution] = await Promise.all([
    feedEntriesPromise,
    distributionPromise,
  ])

  return {
    feedPagesBySize: Object.fromEntries(feedEntries),
    ratingDistribution,
  }
}
