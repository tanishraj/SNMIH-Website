import 'server-only'

import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import {
  calculatePublishedReviewRatingDistribution,
  type PublishedReviewRatingDistribution,
  type PublishedReviewRatingSummary,
} from '@/lib/reviewRatingShared'

export {
  calculatePublishedReviewRatingDistribution,
  calculatePublishedReviewRatingSummary,
  type PublishedReviewRatingDistribution,
  type PublishedReviewRatingSummary,
} from '@/lib/reviewRatingShared'

export type ReviewRatingPayload = Pick<Payload, 'count' | 'logger'>

const ratingValues = ['1', '2', '3', '4', '5'] as const

export async function fetchPublishedReviewRatingDistribution(
  payload: ReviewRatingPayload,
): Promise<PublishedReviewRatingDistribution | null> {
  try {
    const buckets = await Promise.all(
      ratingValues.map((rating) =>
        payload.count({
          collection: 'reviews',
          overrideAccess: true,
          where: {
            and: [{ _status: { equals: 'published' } }, { rating: { equals: rating } }],
          },
        }),
      ),
    )

    return calculatePublishedReviewRatingDistribution(buckets.map(({ totalDocs }) => totalDocs))
  } catch (error) {
    payload.logger.error({
      err: error,
      msg: 'Failed to aggregate published review ratings.',
    })
    return null
  }
}

export async function fetchPublishedReviewRatingSummary(
  payload: ReviewRatingPayload,
): Promise<PublishedReviewRatingSummary | null> {
  const distribution = await fetchPublishedReviewRatingDistribution(payload)

  return distribution ? { average: distribution.average, count: distribution.count } : null
}

export const getPublishedReviewRatingDistribution = cache(async () => {
  const payload = await getPayload({ config: configPromise })

  return fetchPublishedReviewRatingDistribution(payload)
})

export const getPublishedReviewRatingSummary = cache(async () => {
  const distribution = await getPublishedReviewRatingDistribution()

  return distribution ? { average: distribution.average, count: distribution.count } : null
})
