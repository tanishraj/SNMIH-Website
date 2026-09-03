import { Star, StarHalf } from 'lucide-react'

import { cn } from '@/lib/utils'

const MAX_STARS = 5

interface RatingProps {
  rate: number
  className?: string
  showScore?: boolean
  description?: string
}

const Rating = ({ rate, className, showScore, description }: RatingProps) => {
  if (!rate) return null

  const normalizedRate = Math.min(MAX_STARS, Math.max(0, rate))

  const renderStars = () => {
    const fullStars = Math.floor(normalizedRate)
    const hasHalfStar = normalizedRate % 1 >= 0.5
    const emptyStars = MAX_STARS - fullStars - (hasHalfStar ? 1 : 0)

    const stars = []

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          aria-hidden="true"
          key={`rating-star-full-${i}`}
          className="fill-current stroke-current"
        />,
      )
    }

    if (hasHalfStar) {
      stars.push(
        <div aria-hidden="true" key="rating-half-star" className="relative">
          <StarHalf className="absolute top-0 right-0 fill-current stroke-current" />
          <StarHalf className="absolute top-0 left-0 -scale-x-100 fill-current/15 stroke-current/15" />
        </div>,
      )
    }

    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Star
          aria-hidden="true"
          key={`rating-star-empty-${i}`}
          className="fill-current/15 stroke-current/15"
        />,
      )
    }

    return stars
  }

  // If only score is shown (no description), use horizontal layout
  if (showScore && !description) {
    return (
      <div
        aria-label={`${normalizedRate.toFixed(1)} out of 5`}
        className={cn('flex items-center gap-2 [&_svg]:size-5 [&>div]:size-5', className)}
        role="img"
      >
        <span aria-hidden="true" className="contents">
          {renderStars()}
        </span>
        <span className="text-sm font-semibold">{normalizedRate.toFixed(1)}</span>
      </div>
    )
  }

  // If description is provided, use vertical layout
  if (description) {
    return (
      <div
        aria-label={`${normalizedRate.toFixed(1)} out of 5`}
        className={cn('flex flex-col gap-1', className)}
        role="img"
      >
        <div aria-hidden="true" className="flex items-center gap-2 [&_svg]:size-5 [&>div]:size-5">
          {renderStars()}
          {showScore && <span className="text-sm font-semibold">{normalizedRate.toFixed(1)}</span>}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    )
  }

  // Default: just stars
  return (
    <div
      aria-label={`${normalizedRate.toFixed(1)} out of 5`}
      className={cn('flex items-center gap-1 [&_svg]:size-5 [&>div]:size-5', className)}
      role="img"
    >
      <span aria-hidden="true" className="contents">
        {renderStars()}
      </span>
    </div>
  )
}

export { Rating }
