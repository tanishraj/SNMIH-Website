import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/review-feed/route'

const { getPublishedReviewFeedPageMock } = vi.hoisted(() => ({
  getPublishedReviewFeedPageMock: vi.fn(),
}))

vi.mock('@/lib/reviewFeed', async () => {
  const actual = await vi.importActual<typeof import('@/lib/reviewFeed')>('@/lib/reviewFeed')

  return {
    ...actual,
    getPublishedReviewFeedPage: getPublishedReviewFeedPageMock,
  }
})

describe('Review Feed route', () => {
  beforeEach(() => {
    getPublishedReviewFeedPageMock.mockReset()
  })

  it('returns a requested published review page', async () => {
    const page = {
      docs: [],
      hasNextPage: true,
      page: 2,
      totalPages: 3,
    }
    getPublishedReviewFeedPageMock.mockResolvedValue(page)

    const response = await GET(new Request('http://localhost/api/review-feed?page=2&limit=4'))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)
    expect(getPublishedReviewFeedPageMock).toHaveBeenCalledWith(2, 4)
  })

  it('rejects invalid pagination without querying Payload', async () => {
    const response = await GET(new Request('http://localhost/api/review-feed?page=0&limit=20'))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Page must be a positive integer.' })
    expect(getPublishedReviewFeedPageMock).not.toHaveBeenCalled()
  })

  it('returns a generic error when the published review query fails', async () => {
    getPublishedReviewFeedPageMock.mockRejectedValue(new Error('database unavailable'))

    const response = await GET(new Request('http://localhost/api/review-feed?page=1&limit=4'))

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Unable to load reviews.' })
  })
})
