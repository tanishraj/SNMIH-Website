import { normalizeReviewFeedPageSize, type PublicReviewFeedPage } from '@/lib/reviewFeedShared'
import type { PublishedReviewRatingDistribution } from '@/lib/reviewRatingShared'
import type { Page } from '@/payload-types'

export type ReviewPreviewSnapshot = {
  feedPagesBySize: Record<string, PublicReviewFeedPage>
  ratingDistribution: PublishedReviewRatingDistribution | null
}

export type ReviewPreviewRequirements = {
  needsRatingDistribution: boolean
  pageSizes: number[]
}

export const EMPTY_REVIEW_PREVIEW_SNAPSHOT: ReviewPreviewSnapshot = {
  feedPagesBySize: {},
  ratingDistribution: null,
}

export function getReviewPreviewRequirements(
  layout?: Page['layout'] | null,
): ReviewPreviewRequirements {
  const pageSizes = new Set<number>()
  let needsRatingDistribution = false

  for (const block of layout ?? []) {
    if (block.blockType === 'reviewFeed') {
      pageSizes.add(normalizeReviewFeedPageSize(block.pageSize))
      needsRatingDistribution = true
      continue
    }

    if (block.blockType === 'ratingSpotlight' && block.ratingData?.dataMode !== 'manual') {
      needsRatingDistribution = true
    }
  }

  return {
    needsRatingDistribution,
    pageSizes: [...pageSizes].sort((left, right) => left - right),
  }
}
