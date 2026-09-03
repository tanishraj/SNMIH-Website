import Link from 'next/link'

import { getReviewDisplayName } from '@/lib/reviews'
import type { Review } from '@/payload-types'

export function ReviewArchivePage({
  archiveLabel,
  reviews,
}: {
  archiveLabel: string
  reviews: Review[]
}) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Review category
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
          {archiveLabel}
        </h1>
      </header>
      {reviews.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <Link
              key={review.id}
              href={`/reviews/${review.slug}`}
              className="flex flex-col gap-3 rounded-card border bg-background p-6 transition-colors hover:border-foreground/30"
            >
              <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <span>{getReviewDisplayName(review)}</span>
                <span className="font-medium text-foreground">{review.rating}/5</span>
              </div>
              <h2 className="text-xl font-semibold text-foreground">{review.reviewTitle}</h2>
              <p className="line-clamp-4 text-sm leading-7 text-muted-foreground">
                {review.reviewBody}
              </p>
              <span className="text-sm font-medium text-foreground">Read review</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-card border border-dashed bg-background/70 p-8 text-sm text-muted-foreground">
          No published reviews are assigned to this category yet.
        </div>
      )}
    </section>
  )
}
