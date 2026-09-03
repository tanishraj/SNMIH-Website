import {
  ReviewFeedBlockPresentation,
  type ReviewFeedBlockLike,
} from '@/blocks/ReviewFeed/Presentation'
import { createEmptyReviewFeedPage, normalizeReviewFeedPageSize } from '@/lib/reviewFeedShared'
import type { ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'

export type ReviewFeedPreviewBlockProps = ReviewFeedBlockLike & {
  snapshot: ReviewPreviewSnapshot
}

export function ReviewFeedPreviewBlockComponent({
  pageSize,
  snapshot,
  ...props
}: ReviewFeedPreviewBlockProps) {
  const resolvedPageSize = normalizeReviewFeedPageSize(pageSize)

  return (
    <ReviewFeedBlockPresentation
      {...props}
      initialPage={
        snapshot.feedPagesBySize[String(resolvedPageSize)] ?? createEmptyReviewFeedPage()
      }
      pageSize={resolvedPageSize}
      summary={snapshot.ratingDistribution}
    />
  )
}
