import {
  ReviewFeedBlockPresentation,
  type ReviewFeedBlockLike,
} from '@/blocks/ReviewFeed/Presentation'
import { getPublishedReviewFeedPage } from '@/lib/reviewFeed'
import { createEmptyReviewFeedPage, normalizeReviewFeedPageSize } from '@/lib/reviewFeedShared'
import { getPublishedReviewRatingDistribution } from '@/lib/reviewRatingSummary'

export type { ReviewFeedBlockLike } from '@/blocks/ReviewFeed/Presentation'

export async function ReviewFeedBlockComponent({
  accentTitle,
  appearance,
  description,
  emptyStateMessage,
  eyebrow,
  footerActions,
  loadMoreLabel,
  pageSize,
  size,
  title,
}: ReviewFeedBlockLike) {
  const resolvedTitle = title?.trim()

  if (!resolvedTitle) {
    return null
  }

  const resolvedPageSize = normalizeReviewFeedPageSize(pageSize)
  const pagePromise = getPublishedReviewFeedPage(1, resolvedPageSize).catch(() =>
    createEmptyReviewFeedPage(),
  )
  const summaryPromise = getPublishedReviewRatingDistribution()
  const [initialPage, summary] = await Promise.all([pagePromise, summaryPromise])

  return (
    <ReviewFeedBlockPresentation
      accentTitle={accentTitle}
      appearance={appearance}
      description={description}
      emptyStateMessage={emptyStateMessage}
      eyebrow={eyebrow}
      footerActions={footerActions}
      initialPage={initialPage}
      loadMoreLabel={loadMoreLabel}
      pageSize={resolvedPageSize}
      size={size}
      summary={summary}
      title={resolvedTitle}
    />
  )
}
