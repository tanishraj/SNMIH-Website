export const REVIEW_FEED_DEFAULT_PAGE_SIZE = 4
export const REVIEW_FEED_MAX_PAGE_SIZE = 12

export type PublicReviewFeedItem = {
  authorName: string
  content: string
  date: string
  id: string
  rating: number
  title: string
  verified: boolean
}

export type PublicReviewFeedPage = {
  docs: PublicReviewFeedItem[]
  hasNextPage: boolean
  page: number
  totalPages: number
}

export const normalizeReviewFeedPageSize = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isInteger(value)
    ? Math.min(REVIEW_FEED_MAX_PAGE_SIZE, Math.max(1, value))
    : REVIEW_FEED_DEFAULT_PAGE_SIZE

export const createEmptyReviewFeedPage = (): PublicReviewFeedPage => ({
  docs: [],
  hasNextPage: false,
  page: 1,
  totalPages: 0,
})
