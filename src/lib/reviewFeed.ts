import 'server-only'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import {
  REVIEW_FEED_DEFAULT_PAGE_SIZE,
  REVIEW_FEED_MAX_PAGE_SIZE,
  type PublicReviewFeedItem,
  type PublicReviewFeedPage,
} from '@/lib/reviewFeedShared'
import { getReviewDisplayName } from '@/lib/reviews'
import type { Review } from '@/payload-types'

export {
  REVIEW_FEED_DEFAULT_PAGE_SIZE,
  REVIEW_FEED_MAX_PAGE_SIZE,
  type PublicReviewFeedItem,
  type PublicReviewFeedPage,
} from '@/lib/reviewFeedShared'

export type ReviewFeedPayload = Pick<Payload, 'find' | 'logger'>

type ReviewFeedRecord = Pick<
  Review,
  | 'displayName'
  | 'id'
  | 'isGenuineExperience'
  | 'publishedAt'
  | 'rating'
  | 'reviewBody'
  | 'reviewerName'
  | 'reviewTitle'
  | 'title'
  | 'updatedAt'
>

const positiveIntegerPattern = /^[1-9]\d*$/
const reviewDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

const parsePositiveInteger = ({
  fallback,
  label,
  maximum,
  value,
}: {
  fallback: number
  label: string
  maximum?: number
  value: string | null
}): number | string => {
  if (value == null || value === '') {
    return fallback
  }

  if (!positiveIntegerPattern.test(value)) {
    return `${label} must be a positive integer.`
  }

  const parsed = Number(value)

  if (maximum != null && parsed > maximum) {
    return `${label} must not exceed ${maximum}.`
  }

  return parsed
}

export function parseReviewFeedPagination(
  searchParams: URLSearchParams,
): { limit: number; ok: true; page: number } | { message: string; ok: false } {
  const page = parsePositiveInteger({
    fallback: 1,
    label: 'Page',
    value: searchParams.get('page'),
  })

  if (typeof page === 'string') {
    return { message: page, ok: false }
  }

  const limit = parsePositiveInteger({
    fallback: REVIEW_FEED_DEFAULT_PAGE_SIZE,
    label: 'Limit',
    maximum: REVIEW_FEED_MAX_PAGE_SIZE,
    value: searchParams.get('limit'),
  })

  if (typeof limit === 'string') {
    return { message: limit, ok: false }
  }

  return { limit, ok: true, page }
}

const formatPublishedDate = (value: string | null | undefined): string => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? '' : reviewDateFormatter.format(date)
}

const normalizeRating = (value: ReviewFeedRecord['rating']): number => {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) {
    return 1
  }

  return Math.min(5, Math.max(1, Math.round(parsed)))
}

export const toPublicReviewFeedItem = (review: ReviewFeedRecord): PublicReviewFeedItem => ({
  authorName: getReviewDisplayName({
    displayName: review.displayName,
    reviewerName: review.reviewerName || '',
  }),
  content: review.reviewBody?.trim() || '',
  date: formatPublishedDate(review.publishedAt || review.updatedAt),
  id: String(review.id),
  rating: normalizeRating(review.rating),
  title: review.reviewTitle?.trim() || review.title?.trim() || 'Review',
  verified: review.isGenuineExperience === true,
})

export async function fetchPublishedReviewFeedPage(
  payload: Pick<ReviewFeedPayload, 'find'>,
  { limit, page }: { limit: number; page: number },
): Promise<PublicReviewFeedPage> {
  const result = await payload.find({
    collection: 'reviews',
    limit,
    overrideAccess: true,
    page,
    select: {
      displayName: true,
      isGenuineExperience: true,
      publishedAt: true,
      rating: true,
      reviewBody: true,
      reviewerName: true,
      reviewTitle: true,
      title: true,
      updatedAt: true,
    },
    sort: ['-publishedAt', '-id'],
    where: {
      _status: {
        equals: 'published',
      },
    },
  })

  return {
    docs: (result.docs as ReviewFeedRecord[]).map(toPublicReviewFeedItem),
    hasNextPage: result.hasNextPage,
    page: result.page ?? page,
    totalPages: result.totalPages,
  }
}

export const getPublishedReviewFeedPage = cache(async (page: number, limit: number) => {
  const payload = await getPayload({ config: configPromise })

  try {
    return await fetchPublishedReviewFeedPage(payload, { limit, page })
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: 'Failed to load published review feed.',
    })
    throw error
  }
})
