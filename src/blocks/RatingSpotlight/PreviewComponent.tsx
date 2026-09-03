import {
  RatingSpotlightBlockPresentation,
  type RatingSpotlightBlockLike,
} from '@/blocks/RatingSpotlight/Presentation'
import type { ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'

export type RatingSpotlightPreviewBlockProps = RatingSpotlightBlockLike & {
  snapshot: ReviewPreviewSnapshot
}

export function RatingSpotlightPreviewBlockComponent({
  snapshot,
  ...props
}: RatingSpotlightPreviewBlockProps) {
  const liveSummary = snapshot.ratingDistribution
    ? {
        average: snapshot.ratingDistribution.average,
        count: snapshot.ratingDistribution.count,
      }
    : null

  return <RatingSpotlightBlockPresentation {...props} liveSummary={liveSummary} />
}
