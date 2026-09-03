'use client'

import { BadgeCheck } from 'lucide-react'
import { Fragment, useState, useTransition } from 'react'

import { Rating } from '@/components/shadcnblocks/rating'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { PublicReviewFeedItem, PublicReviewFeedPage } from '@/lib/reviewFeedShared'

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A'

function ReviewFeedItem({ review }: { review: PublicReviewFeedItem }) {
  return (
    <article className="flex flex-col gap-2.5" data-review-feed-item={review.id}>
      <div className="flex flex-wrap items-center gap-2">
        <Avatar size="sm">
          <AvatarFallback>{getInitials(review.authorName)}</AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-current">{review.authorName}</span>
        {review.verified ? (
          <span aria-label="Verified experience" className="inline-flex text-current/80">
            <BadgeCheck aria-hidden="true" className="size-4" />
          </span>
        ) : null}
        {review.date ? (
          <time className="ml-auto text-xs text-current/60">{review.date}</time>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Rating className="[&_svg]:size-3.5 [&>span]:size-3.5" rate={review.rating} />
        <span className="font-medium text-current">{review.title}</span>
      </div>
      <p className="text-sm leading-6 text-current/70">{review.content}</p>
    </article>
  )
}

export function ReviewFeedList({
  emptyStateMessage,
  initialPage,
  loadMoreLabel,
  pageSize,
}: {
  emptyStateMessage: string
  initialPage: PublicReviewFeedPage
  loadMoreLabel: string
  pageSize: number
}) {
  const [reviews, setReviews] = useState(initialPage.docs)
  const [page, setPage] = useState(initialPage.page)
  const [hasNextPage, setHasNextPage] = useState(initialPage.hasNextPage)
  const [hasError, setHasError] = useState(false)
  const [isPending, startTransition] = useTransition()

  const loadNextPage = () => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/review-feed?page=${page + 1}&limit=${pageSize}`, {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Unable to load reviews.')
        }

        const nextPage = (await response.json()) as PublicReviewFeedPage
        setReviews((current) => {
          const ids = new Set(current.map(({ id }) => id))
          return [...current, ...nextPage.docs.filter(({ id }) => !ids.has(id))]
        })
        setPage(nextPage.page)
        setHasNextPage(nextPage.hasNextPage)
        setHasError(false)
      } catch {
        setHasError(true)
      }
    })
  }

  if (!reviews.length) {
    return (
      <div className="rounded-card border border-dashed border-current/20 p-6 text-sm text-current/70">
        {emptyStateMessage}
      </div>
    )
  }

  return (
    <div className="flex flex-col" data-review-feed-list="true">
      <div>
        {reviews.map((review, index) => (
          <Fragment key={review.id}>
            {index > 0 ? <Separator className="my-5 bg-current/15" /> : null}
            <ReviewFeedItem review={review} />
          </Fragment>
        ))}
      </div>
      {hasNextPage || hasError ? (
        <div className="mt-6 flex justify-center">
          <Button disabled={isPending} onClick={loadNextPage} type="button" variant="outline">
            {isPending ? 'Loading…' : hasError ? 'Retry' : loadMoreLabel}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
