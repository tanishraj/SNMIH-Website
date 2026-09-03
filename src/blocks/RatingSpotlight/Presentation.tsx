import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { ContentActions } from '@/components/ContentActions'
import {
  RatingSpotlight,
  type RatingSpotlightAlignment,
  type RatingSpotlightPresentationProps,
  type RatingSpotlightSize,
} from '@/components/rating-spotlight'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import type { PublishedReviewRatingSummary } from '@/lib/reviewRatingShared'

export type RatingSpotlightBlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: RatingSpotlightAlignment | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  ratingData?: {
    dataMode?: 'live' | 'manual' | null
    manualRating?: number | null
    manualReviewCount?: number | null
  } | null
  size?: RatingSpotlightSize | null
  title?: string | null
}

export type RatingSpotlightBlockPresentationProps = RatingSpotlightBlockLike & {
  liveSummary: PublishedReviewRatingSummary | null
}

const resolveManualSummary = (
  ratingData: RatingSpotlightBlockLike['ratingData'],
): PublishedReviewRatingSummary | null => {
  const average = ratingData?.manualRating
  const count = ratingData?.manualReviewCount

  if (
    typeof average !== 'number' ||
    !Number.isFinite(average) ||
    average < 0 ||
    average > 5 ||
    typeof count !== 'number' ||
    !Number.isInteger(count) ||
    count < 0
  ) {
    return null
  }

  return { average, count }
}

export function RatingSpotlightBlockPresentation({
  actions,
  appearance,
  contentAlignment = 'left',
  description,
  eyebrow,
  footerActions,
  liveSummary,
  ratingData,
  size = 'default',
  title,
}: RatingSpotlightBlockPresentationProps) {
  const resolvedTitle = title?.trim()

  if (!resolvedTitle) {
    return null
  }

  const resolvedAlignment = contentAlignment ?? 'left'
  const resolvedActions = resolveCmsActions(actions)
  const summary = ratingData?.dataMode === 'manual' ? resolveManualSummary(ratingData) : liveSummary
  const presentationProps: RatingSpotlightPresentationProps = {
    actions: resolvedActions.length ? (
      <ContentActions
        actions={resolvedActions}
        alignment={resolvedAlignment}
        className="lg:w-auto lg:justify-end"
      />
    ) : undefined,
    alignment: resolvedAlignment,
    appearance,
    description: description?.trim(),
    eyebrow: eyebrow?.trim(),
    size: size ?? 'default',
    summary,
    title: resolvedTitle,
  }

  return (
    <>
      <RatingSpotlight {...presentationProps} />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}
