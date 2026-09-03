import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ReviewFeed, type ReviewFeedSize } from '@/components/review-feed'
import { ContentActions } from '@/components/ContentActions'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { normalizeReviewFeedPageSize, type PublicReviewFeedPage } from '@/lib/reviewFeedShared'
import type { PublishedReviewRatingDistribution } from '@/lib/reviewRatingShared'

export type ReviewFeedBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  emptyStateMessage?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  loadMoreLabel?: string | null
  pageSize?: number | null
  size?: ReviewFeedSize | null
  title?: string | null
}

export type ReviewFeedBlockPresentationProps = ReviewFeedBlockLike & {
  initialPage: PublicReviewFeedPage
  summary: PublishedReviewRatingDistribution | null
}

export function ReviewFeedBlockPresentation({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  emptyStateMessage,
  eyebrow,
  footerActions,
  initialPage,
  loadMoreLabel,
  pageSize,
  size,
  summary,
  title,
}: ReviewFeedBlockPresentationProps) {
  const resolvedTitle = title?.trim()

  if (!resolvedTitle) {
    return null
  }

  const resolvedActions = resolveCmsActions(actions)

  return (
    <>
      <ReviewFeed
        accentTitle={accentTitle}
        actions={resolvedActions.length > 0 ? <ContentActions actions={resolvedActions} /> : undefined}
        appearance={appearance}
        contentAlignment={contentAlignment}
        description={description?.trim()}
        emptyStateMessage={emptyStateMessage?.trim() || 'No published reviews yet.'}
        eyebrow={eyebrow?.trim()}
        initialPage={initialPage}
        loadMoreLabel={loadMoreLabel?.trim() || 'Load More Reviews'}
        pageSize={normalizeReviewFeedPageSize(pageSize)}
        size={size ?? 'default'}
        summary={summary}
        title={resolvedTitle}
      />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}
