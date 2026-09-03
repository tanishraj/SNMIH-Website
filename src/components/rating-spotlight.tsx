import { Star } from 'lucide-react'
import type { ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import type { PublishedReviewRatingSummary } from '@/lib/reviewRatingSummary'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { cn } from '@/lib/utils'

export type RatingSpotlightAlignment = 'center' | 'left' | 'right'
export type RatingSpotlightSize = 'none' | 'comfortable' | 'compact' | 'default'

export type RatingSpotlightPresentationProps = {
  actions?: ReactNode
  alignment?: RatingSpotlightAlignment
  appearance?: BlockAppearance | null
  description?: string | null
  eyebrow?: string | null
  size?: RatingSpotlightSize
  summary?: PublishedReviewRatingSummary | null
  title?: string | null
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const numberFormatter = new Intl.NumberFormat('en-US')
const starIndexes = [0, 1, 2, 3, 4] as const

function RatingSummary({ summary }: { summary: PublishedReviewRatingSummary }) {
  const average = Math.min(5, Math.max(0, summary.average))
  const averageLabel = average.toFixed(1)
  const countLabel = numberFormatter.format(summary.count)
  const reviewLabel = summary.count === 1 ? 'review' : 'reviews'
  const filledStarCount = Math.round(average)

  return (
    <div
      aria-label={`${averageLabel} out of 5 from ${countLabel} ${reviewLabel}`}
      className="flex flex-wrap items-center gap-3"
      data-rating-summary="true"
    >
      <span aria-hidden="true" className="flex items-center gap-1">
        {starIndexes.map((index) => (
          <Star
            className={cn(
              'size-4',
              index < filledStarCount ? 'fill-current text-primary' : 'text-current/20',
            )}
            data-rating-star={index + 1}
            key={index}
          />
        ))}
      </span>
      <span className="text-sm text-current/70">
        <strong className="font-semibold text-current">{averageLabel} / 5</strong>
        {' · '}
        {countLabel} {reviewLabel}
      </span>
    </div>
  )
}

export function RatingSpotlight({
  actions,
  alignment = 'left',
  appearance,
  description,
  eyebrow,
  size = 'default',
  summary,
  title,
}: RatingSpotlightPresentationProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className)}
      data-rating-spotlight="true"
      data-rating-spotlight-alignment={alignment}
      data-rating-spotlight-background={appearance?.background ?? 'none'}
      data-rating-spotlight-data={summary ? 'resolved' : 'empty'}
      data-rating-spotlight-size={size}
    >
      <div
        className={cn(
          regularBlockContainerClasses,
          'grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12',
        )}
      >
        <div className={cn('flex max-w-3xl flex-col gap-6', alignmentClasses[alignment])}>
          <div className="flex flex-col gap-4">
            {eyebrow ? (
              <SectionEyebrow surface={appearance?.background ?? 'none'}>
                {eyebrow}
              </SectionEyebrow>
            ) : null}
            <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
              {title}
            </h2>
            {description ? (
              <p className="text-base leading-7 text-balance text-current/70">{description}</p>
            ) : null}
          </div>
          {summary ? <RatingSummary summary={summary} /> : null}
        </div>
        {actions}
      </div>
    </section>
  )
}
