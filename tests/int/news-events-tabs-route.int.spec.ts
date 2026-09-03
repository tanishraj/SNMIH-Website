import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GET } from '@/app/api/news-events-tabs/route'
import { NewsEventsTabsRequestError } from '@/lib/newsEvents'

const { getNewsEventPageMock } = vi.hoisted(() => ({
  getNewsEventPageMock: vi.fn(),
}))

vi.mock('@/lib/newsEvents', async () => {
  const actual = await vi.importActual<typeof import('@/lib/newsEvents')>('@/lib/newsEvents')

  return {
    ...actual,
    getNewsEventPage: getNewsEventPageMock,
  }
})

describe('News & Events Tabs route', () => {
  beforeEach(() => {
    getNewsEventPageMock.mockReset()
  })

  it('returns a page from the requested selected-classification scope', async () => {
    const page = { docs: [], hasNextPage: true, page: 2 }
    getNewsEventPageMock.mockResolvedValue(page)

    const response = await GET(
      new Request(
        'http://localhost/api/news-events-tabs?classification=classification-campus&classifications=classification-campus%2Cclassification-cme&page=2&limit=6',
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)
    expect(getNewsEventPageMock).toHaveBeenCalledWith(
      'classification-campus',
      ['classification-campus', 'classification-cme'],
      2,
      6,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    )
  })

  it('loads every active classification when the All-only block has no selected scope', async () => {
    const page = { docs: [], hasNextPage: false, page: 2 }
    getNewsEventPageMock.mockResolvedValue(page)

    const response = await GET(
      new Request('http://localhost/api/news-events-tabs?classification=all&page=2&limit=6'),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual(page)
    expect(getNewsEventPageMock).toHaveBeenCalledWith(
      'all',
      [],
      2,
      6,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    )
  })

  it.each([
    ['', 'Classification is invalid.'],
    [
      'classification=outside&classifications=inside&page=1&limit=6',
      'Classification must be included in the selected scope.',
    ],
    [
      'classification=inside&classifications=inside&page=0&limit=6',
      'Page must be a positive integer.',
    ],
    [
      'classification=inside&classifications=inside&page=1.5&limit=6',
      'Page must be a positive integer.',
    ],
    [
      'classification=inside&classifications=inside&page=1&limit=5',
      'Limit must be one of 3, 6, 9, or 12.',
    ],
    ['classification=inside&classifications=inside&page=1', 'Limit must be one of 3, 6, 9, or 12.'],
  ])('rejects invalid query %s without querying Payload', async (query, message) => {
    const response = await GET(new Request(`http://localhost/api/news-events-tabs?${query}`))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message })
    expect(getNewsEventPageMock).not.toHaveBeenCalled()
  })

  it('returns a generic invalid-scope error for unknown or inactive records', async () => {
    getNewsEventPageMock.mockRejectedValue(
      new NewsEventsTabsRequestError('Classification scope is invalid.'),
    )

    const response = await GET(
      new Request(
        'http://localhost/api/news-events-tabs?classification=missing&classifications=missing&page=1&limit=6',
      ),
    )

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ message: 'Classification scope is invalid.' })
  })

  it('returns a generic error when loading fails', async () => {
    getNewsEventPageMock.mockRejectedValue(new Error('database unavailable'))

    const response = await GET(
      new Request(
        'http://localhost/api/news-events-tabs?classification=all&classifications=classification-campus&page=1&limit=6',
      ),
    )

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ message: 'Unable to load News & Events.' })
  })
})
