import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReviewFeedBlockComponent } from '@/blocks/ReviewFeed/Component'
import { ReviewFeedBlock } from '@/blocks/ReviewFeed/config'
import { ReviewFeed } from '@/components/review-feed'
import { ReviewFeedList } from '@/components/review-feed-list'
import type { PublicReviewFeedItem, PublicReviewFeedPage } from '@/lib/reviewFeed'

const { getPublishedReviewFeedPageMock, getPublishedReviewRatingDistributionMock } = vi.hoisted(
  () => ({
    getPublishedReviewFeedPageMock: vi.fn(),
    getPublishedReviewRatingDistributionMock: vi.fn(),
  }),
)

vi.mock('@/lib/reviewFeed', async () => {
  const actual = await vi.importActual<typeof import('@/lib/reviewFeed')>('@/lib/reviewFeed')
  return { ...actual, getPublishedReviewFeedPage: getPublishedReviewFeedPageMock }
})

vi.mock('@/lib/reviewRatingSummary', async () => {
  const actual = await vi.importActual<typeof import('@/lib/reviewRatingSummary')>(
    '@/lib/reviewRatingSummary',
  )
  return {
    ...actual,
    getPublishedReviewRatingDistribution: getPublishedReviewRatingDistributionMock,
  }
})

type TestField = {
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  max?: number
  min?: number
  name?: string
  options?: Array<{ value: string }>
  required?: boolean
  type?: string
  validate?: (value: unknown) => string | true
}

type TestTab = { fields: TestField[]; label: string }

const reviewOne: PublicReviewFeedItem = {
  authorName: 'Alex M.',
  content: 'A thoughtful and supportive experience.',
  date: 'Jul 18, 2026',
  id: 'review-1',
  rating: 5,
  title: 'Outstanding support',
  verified: true,
}

const reviewTwo: PublicReviewFeedItem = {
  authorName: 'Jordan K.',
  content: 'The whole process was clear and welcoming.',
  date: 'Jul 17, 2026',
  id: 'review-2',
  rating: 4,
  title: 'A welcoming experience',
  verified: false,
}

const initialPage: PublicReviewFeedPage = {
  docs: [reviewOne],
  hasNextPage: true,
  page: 1,
  totalPages: 2,
}

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

describe('Review Feed', () => {
  beforeEach(() => {
    getPublishedReviewFeedPageMock.mockReset()
    getPublishedReviewRatingDistributionMock.mockReset()
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('defines the approved two-tab Payload schema and page-size validation', () => {
    expect(ReviewFeedBlock.slug).toBe('reviewFeed')
    expect(ReviewFeedBlock.interfaceName).toBe('ReviewFeedBlock')
    expect(ReviewFeedBlock.labels).toEqual({ plural: 'Review Feeds', singular: 'Review Feed' })

    const tabsField = ReviewFeedBlock.fields[0] as unknown as { tabs: TestTab[]; type: string }
    const content = tabsField.tabs.find(({ label }) => label === 'Content')
    const layout = tabsField.tabs.find(({ label }) => label === 'Theme Settings')
    const pageSize = getField(content?.fields ?? [], 'pageSize')

    expect(tabsField.type).toBe('tabs')
    expect(content?.fields.map(({ name }) => name)).toEqual([
      'eyebrow',
      'title',
      'accentTitle',
      'description',
      'actions',
      'pageSize',
      'loadMoreLabel',
      'emptyStateMessage',
      'footerActions',
    ])
    expect(getField(content?.fields ?? [], 'title')).toMatchObject({ type: 'text' })
    expect(pageSize).toMatchObject({ defaultValue: 4, max: 12, min: 1, required: true })
    expect(pageSize?.validate?.(0)).toBeTypeOf('string')
    expect(pageSize?.validate?.(2.5)).toBeTypeOf('string')
    expect(pageSize?.validate?.(13)).toBeTypeOf('string')
    expect(pageSize?.validate?.(1)).toBe(true)
    expect(pageSize?.validate?.(4)).toBe(true)
    expect(pageSize?.validate?.(12)).toBe(true)
    expect(getField(content?.fields ?? [], 'loadMoreLabel')?.defaultValue).toBe('Load More Reviews')
    expect(getField(content?.fields ?? [], 'emptyStateMessage')?.defaultValue).toBe(
      'No published reviews yet.',
    )
    expect(getField(layout?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(getField(layout?.fields ?? [], 'size')?.defaultValue).toBe('default')
  })

  it('renders the upstream summary and public review cards without the removed row', () => {
    const html = renderToStaticMarkup(
      createElement(ReviewFeed, {
        appearance: { background: 'subtle', border: 'topAndBottom' },
        description: 'Read what our community has shared.',
        emptyStateMessage: 'No published reviews yet.',
        eyebrow: 'Community voices',
        initialPage,
        loadMoreLabel: 'Load More Reviews',
        pageSize: 4,
        size: 'compact',
        summary: { average: 4.5, count: 4, counts: [0, 0, 1, 1, 2] },
        title: 'What people are saying',
      }),
    )

    expect(html).toContain('data-review-feed="true"')
    expect(html).toContain('max-w-screen-2xl')
    expect(html).toContain('4.5')
    expect(html.match(/data-slot="progress"/g)).toHaveLength(5)
    expect(html).toContain('Alex M.')
    expect(html).toContain('AM')
    expect(html).toContain('Verified experience')
    expect(html).toContain('Jul 18, 2026')
    expect(html).toContain('Outstanding support')
    expect(html).toContain('A thoughtful and supportive experience.')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-y border-border')
    expect(html).not.toContain('Sort:')
    expect(html).not.toContain('Most Helpful')
    expect(html).not.toContain('people found this helpful')
  })

  it('keeps configured content visible when no published reviews exist', () => {
    const html = renderToStaticMarkup(
      createElement(ReviewFeed, {
        emptyStateMessage: 'Be the first to share an experience.',
        initialPage: { docs: [], hasNextPage: false, page: 1, totalPages: 0 },
        loadMoreLabel: 'Load More Reviews',
        pageSize: 4,
        summary: null,
        title: 'Community reviews',
      }),
    )

    expect(html).toContain('Community reviews')
    expect(html).toContain('Be the first to share an experience.')
    expect(html).not.toContain('data-review-feed-summary="true"')
  })

  it('loads, appends, de-duplicates, and completes server pagination', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          docs: [reviewOne, reviewTwo],
          hasNextPage: false,
          page: 2,
          totalPages: 2,
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ReviewFeedList
        emptyStateMessage="No reviews"
        initialPage={initialPage}
        loadMoreLabel="Load More Reviews"
        pageSize={4}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Load More Reviews' }))

    await screen.findByText('A welcoming experience')
    expect(screen.getAllByText('Outstanding support')).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledWith('/api/review-feed?page=2&limit=4', {
      headers: { Accept: 'application/json' },
    })
    expect(screen.queryByRole('button', { name: 'Load More Reviews' })).toBeNull()
  })

  it('preserves existing cards and retries after a pagination failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ docs: [reviewTwo], hasNextPage: false, page: 2, totalPages: 2 }),
          { status: 200 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <ReviewFeedList
        emptyStateMessage="No reviews"
        initialPage={initialPage}
        loadMoreLabel="Load More Reviews"
        pageSize={4}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Load More Reviews' }))

    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.getByText('Outstanding support')).toBeTruthy()
    fireEvent.click(retry)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await screen.findByText('A welcoming experience')
  })

  it('fetches initial page and aggregate in parallel through the server adapter', async () => {
    getPublishedReviewFeedPageMock.mockResolvedValue(initialPage)
    getPublishedReviewRatingDistributionMock.mockResolvedValue({
      average: 5,
      count: 1,
      counts: [0, 0, 0, 0, 1],
    })

    const element = await ReviewFeedBlockComponent({
      emptyStateMessage: 'No published reviews yet.',
      loadMoreLabel: 'Load More Reviews',
      pageSize: 4,
      title: 'Published reviews',
    })
    const html = renderToStaticMarkup(element)

    expect(getPublishedReviewFeedPageMock).toHaveBeenCalledWith(1, 4)
    expect(getPublishedReviewRatingDistributionMock).toHaveBeenCalledTimes(1)
    expect(html).toContain('Published reviews')
    expect(html).toContain('Outstanding support')
  })
})
