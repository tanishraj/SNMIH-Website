import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  findGlobal: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('next/og', () => ({
  ImageResponse: class {
    element: unknown
    options: unknown

    constructor(element: unknown, options: unknown) {
      this.element = element
      this.options = options
    }
  },
}))

import ArticleOgImage from '@/app/(frontend)/articles/[slug]/opengraph-image'
import NewsEventOgImage from '@/app/(frontend)/news-events/[slug]/opengraph-image'
import DefaultOgImage from '@/app/(frontend)/opengraph-image'
import ReviewOgImage from '@/app/(frontend)/reviews/[slug]/opengraph-image'

type CapturedImageResponse = {
  element: ReactNode
  options: unknown
}

describe('OpenGraph route fallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPayload.mockResolvedValue({
      find: mocks.find,
      findGlobal: mocks.findGlobal,
    })
    mocks.find.mockResolvedValue({
      docs: [
        {
          authorName: 'SNMIH',
          classification: null,
          contentType: 'news',
          displayName: 'SNMIH',
          excerpt: 'Published detail record.',
          rating: '5',
          reviewerName: 'SNMIH',
          reviewTitle: 'Published review',
          subjectLabel: 'Hospital',
          title: 'Published detail',
        },
      ],
    })
    mocks.findGlobal.mockImplementation(({ slug }: { slug: string }) => {
      if (slug === 'seo-settings') {
        return Promise.resolve({ defaultDescription: '' })
      }

      return Promise.resolve({ logo: null, siteDescription: '', siteName: 'SNMIH' })
    })
  })

  it.each([
    ['root', () => DefaultOgImage()],
    [
      'article',
      () => ArticleOgImage({ params: Promise.resolve({ slug: 'published-article' }) }),
    ],
    [
      'review',
      () => ReviewOgImage({ params: Promise.resolve({ slug: 'published-review' }) }),
    ],
    [
      'news-event',
      () => NewsEventOgImage({ params: Promise.resolve({ slug: 'published-event' }) }),
    ],
  ])('returns the local preview from the %s route when the logo is missing', async (_label, run) => {
    const response = (await run()) as unknown as CapturedImageResponse
    const markup = renderToStaticMarkup(response.element)

    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).not.toContain('https://assets.snmih.tanish.im')
    expect(response.options).toEqual({ height: 630, width: 1200 })
  })
})
