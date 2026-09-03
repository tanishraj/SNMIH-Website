import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'

import {
  fetchPublishedReviewRatingSummary,
  type ReviewRatingPayload,
} from '@/lib/reviewRatingSummary'
import {
  calculatePublishedReviewRatingDistribution,
  calculatePublishedReviewRatingSummary,
} from '@/lib/reviewRatingShared'

describe('published review rating summary', () => {
  it('marks the Payload-backed rating module as server-only', () => {
    expect(readFileSync('src/lib/reviewRatingSummary.ts', 'utf8')).toContain("import 'server-only'")
  })

  it('calculates a five-bucket distribution without changing the summary contract', () => {
    expect(calculatePublishedReviewRatingDistribution([1, 2, 3, 4, 10])).toEqual({
      average: 4,
      count: 20,
      counts: [1, 2, 3, 4, 10],
    })
    expect(calculatePublishedReviewRatingDistribution([0, 0, 0, 0, 0])).toBeNull()
  })

  it('calculates a weighted average and total from five rating buckets', () => {
    expect(calculatePublishedReviewRatingSummary([1, 2, 3, 4, 10])).toEqual({
      average: 4,
      count: 20,
    })
    expect(calculatePublishedReviewRatingSummary([0, 0, 0, 0, 0])).toBeNull()
  })

  it('counts all five published rating buckets concurrently', async () => {
    const resolvers: Array<(value: { totalDocs: number }) => void> = []
    const count = vi.fn(
      (_request: { where: unknown }) =>
        new Promise<{ totalDocs: number }>((resolve) => {
          resolvers.push(resolve)
        }),
    )
    const logger = { error: vi.fn() }
    const payload = { count, logger } as unknown as ReviewRatingPayload
    const summaryPromise = fetchPublishedReviewRatingSummary(payload)

    expect(count).toHaveBeenCalledTimes(5)
    expect(count.mock.calls.map(([request]) => request.where)).toEqual(
      ['1', '2', '3', '4', '5'].map((rating) => ({
        and: [{ _status: { equals: 'published' } }, { rating: { equals: rating } }],
      })),
    )

    ;[1, 2, 3, 4, 10].forEach((totalDocs, index) => resolvers[index]?.({ totalDocs }))

    await expect(summaryPromise).resolves.toEqual({ average: 4, count: 20 })
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('returns null and logs when a count query fails', async () => {
    const failure = new Error('database unavailable')
    const logger = { error: vi.fn() }
    const count = vi.fn().mockRejectedValue(failure)
    const payload = { count, logger } as unknown as ReviewRatingPayload

    await expect(fetchPublishedReviewRatingSummary(payload)).resolves.toBeNull()
    expect(logger.error).toHaveBeenCalledWith({
      err: failure,
      msg: 'Failed to aggregate published review ratings.',
    })
  })
})
