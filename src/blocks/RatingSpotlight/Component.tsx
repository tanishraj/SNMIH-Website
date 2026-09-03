import {
  RatingSpotlightBlockPresentation,
  type RatingSpotlightBlockLike,
} from '@/blocks/RatingSpotlight/Presentation'
import {
  RatingSpotlight,
  type RatingSpotlightPresentationProps,
} from '@/components/rating-spotlight'
import { getPublishedReviewRatingSummary } from '@/lib/reviewRatingSummary'

export type { RatingSpotlightBlockLike } from '@/blocks/RatingSpotlight/Presentation'

export async function LiveRatingSpotlight(
  props: Omit<RatingSpotlightPresentationProps, 'summary'>,
) {
  const summary = await getPublishedReviewRatingSummary()

  return <RatingSpotlight {...props} summary={summary} />
}

async function LiveRatingSpotlightBlock(props: RatingSpotlightBlockLike) {
  const liveSummary = await getPublishedReviewRatingSummary()

  return <RatingSpotlightBlockPresentation {...props} liveSummary={liveSummary} />
}

export function RatingSpotlightBlockComponent(props: RatingSpotlightBlockLike) {
  if (!props.title?.trim()) {
    return null
  }

  if (props.ratingData?.dataMode === 'manual') {
    return <RatingSpotlightBlockPresentation {...props} liveSummary={null} />
  }

  return <LiveRatingSpotlightBlock {...props} />
}
