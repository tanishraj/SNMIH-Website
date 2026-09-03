import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { Rating } from '@/components/shadcnblocks/rating'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ReviewFeedList } from '@/components/review-feed-list'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import type { PublicReviewFeedPage } from '@/lib/reviewFeedShared'
import type { PublishedReviewRatingDistribution } from '@/lib/reviewRatingShared'
import { cn } from '@/lib/utils'

export type ReviewFeedSize = 'none' | 'comfortable' | 'compact' | 'default'

export type ReviewFeedPresentationProps = {
  accentTitle?: string | null
  actions?: React.ReactNode
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | null
  description?: string | null
  emptyStateMessage: string
  eyebrow?: string | null
  initialPage: PublicReviewFeedPage
  loadMoreLabel: string
  pageSize: number
  size?: ReviewFeedSize
  summary: PublishedReviewRatingDistribution | null
  title?: string | null
}

const ratingValues = [5, 4, 3, 2, 1] as const

function ReviewFeedSummary({ summary }: { summary: PublishedReviewRatingDistribution }) {
  return (
    <div
      className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
      data-review-feed-summary="true"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-current">{summary.average.toFixed(1)}</span>
          <span className="text-sm text-current/60">/ 5</span>
        </div>
        <Rating className="[&_svg]:size-4 [&>span]:size-4" rate={summary.average} />
        <span className="text-sm text-current/60">({summary.count.toLocaleString('en-US')})</span>
      </div>
      <div className="flex gap-2 sm:w-48" aria-label="Rating distribution">
        <div className="flex flex-col gap-1.5 text-xs text-current/60">
          {ratingValues.map((rating) => (
            <span className="h-2 leading-none" key={rating}>
              {rating}
            </span>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          {ratingValues.map((rating) => (
            <Progress
              aria-label={`${rating} star reviews`}
              className="h-2 bg-current/15 **:data-[slot=progress-indicator]:bg-current"
              key={rating}
              value={(summary.counts[rating - 1] / summary.count) * 100}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function ReviewFeed({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'center',
  description,
  emptyStateMessage,
  eyebrow,
  initialPage,
  loadMoreLabel,
  pageSize,
  size = 'default',
  summary,
  title,
}: ReviewFeedPresentationProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const isCenter = (contentAlignment ?? 'center') === 'center'
  const resolvedAccentTitle = accentTitle?.trim() || undefined

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className)}
      data-review-feed="true"
      data-review-feed-size={size}
    >
      <div className={regularBlockContainerClasses}>
        <div className="flex w-full flex-col gap-6">
          <header
            className={cn(
              'flex flex-col gap-4',
              isCenter ? 'mx-auto max-w-3xl items-center text-center' : 'items-start',
            )}
          >
            {eyebrow ? (
              <SectionEyebrow surface={appearance?.background ?? 'none'}>
                {eyebrow}
              </SectionEyebrow>
            ) : null}
            <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
              {resolvedAccentTitle ? (
                <>
                  <span className="block font-[inherit]">{title}</span>
                  <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                </>
              ) : (
                title
              )}
            </h2>
            {description ? (
              <p className="text-base leading-7 text-balance text-current/70">{description}</p>
            ) : null}
            {actions ? <div className="mt-2">{actions}</div> : null}
          </header>
          {summary ? <ReviewFeedSummary summary={summary} /> : null}
          <Separator className="bg-current/15" />
          <ReviewFeedList
            emptyStateMessage={emptyStateMessage}
            initialPage={initialPage}
            loadMoreLabel={loadMoreLabel}
            pageSize={pageSize}
          />
        </div>
      </div>
    </section>
  )
}
