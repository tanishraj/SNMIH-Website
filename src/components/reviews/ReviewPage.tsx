import Image from 'next/image'
import Link from 'next/link'

import { getMediaImageProps } from '@/lib/media'
import { getReviewDisplayName } from '@/lib/reviews'
import { getTaxonomyTerm, getTaxonomyTerms } from '@/lib/taxonomy'
import type { Review } from '@/payload-types'

export function ReviewPage({
  review,
  relatedReviews,
}: {
  review: Review
  relatedReviews: Review[]
}) {
  const featuredImage = getMediaImageProps({
    media: review.featuredImage,
    preset: 'generic',
    fallbackAlt: review.reviewTitle,
  })
  const primaryCategory = getTaxonomyTerm(review.primaryCategory)
  const tags = getTaxonomyTerms(review.tags)

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
          {primaryCategory ? (
            <Link
              href={`/reviews/category/${primaryCategory.slug}`}
              className="font-mono text-xs font-semibold uppercase tracking-[0.24em]"
            >
              {primaryCategory.title}
            </Link>
          ) : null}
          {review.subjectLabel ? (
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.24em]">{review.subjectLabel}</span>
          ) : null}
          <span className="font-medium text-foreground">{review.rating}/5</span>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
            {review.reviewTitle}
          </h1>
          <p className="text-base text-muted-foreground">
            Reviewed by {getReviewDisplayName(review)}
          </p>
        </div>
        {featuredImage ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-card border">
            <Image fill alt={featuredImage.alt} className="object-cover" src={featuredImage.src} sizes="(max-width: 768px) 100vw, 80vw" />
          </div>
        ) : null}
        {tags.length ? (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border px-3 py-1 text-sm text-muted-foreground"
              >
                {tag.title}
              </span>
            ))}
          </div>
        ) : null}
      </header>
      <div className="rounded-card border bg-background p-6">
        <p className="text-base leading-8 text-foreground">{review.reviewBody}</p>
      </div>
      {relatedReviews.length ? (
        <section className="space-y-4 rounded-card border bg-background p-6">
          <h2 className="text-2xl font-semibold text-foreground">Related reviews</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedReviews.map((relatedReview) => (
              <Link
                key={relatedReview.id}
                href={`/reviews/${relatedReview.slug}`}
                className="rounded-card border p-4 transition-colors hover:border-foreground/30"
              >
                <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                  <span>{getReviewDisplayName(relatedReview)}</span>
                  <span className="font-medium text-foreground">{relatedReview.rating}/5</span>
                </div>
                <h3 className="mt-2 font-semibold text-foreground">{relatedReview.reviewTitle}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {relatedReview.reviewBody}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </article>
  )
}
