import { renderToStaticMarkup } from 'react-dom/server'
import type { ReactNode } from 'react'
import sharp from 'sharp'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
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

import NewsEventOgImage from '@/app/(frontend)/news-events/[slug]/opengraph-image'

let avifLogo: Buffer

const renderImage = async () => {
  const response = await NewsEventOgImage({
    params: Promise.resolve({ slug: 'clinical-learning-symposium' }),
  })

  return renderToStaticMarkup((response as unknown as { element: ReactNode }).element)
}

describe('News & Events detail OpenGraph image', () => {
  beforeAll(async () => {
    avifLogo = await sharp({
      create: {
        background: { alpha: 1, b: 86, g: 52, r: 24 },
        channels: 4,
        height: 8,
        width: 8,
      },
    })
      .avif()
      .toBuffer()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', mocks.fetch)
    mocks.fetch.mockResolvedValue(
      new Response(avifLogo, { headers: { 'content-type': 'image/avif' } }),
    )
    mocks.getPayload.mockResolvedValue({
      find: mocks.find,
      findGlobal: mocks.findGlobal,
    })
    mocks.find.mockResolvedValue({
      docs: [
        {
          classification: {
            active: true,
            badgeLabel: 'CME',
            behavior: 'event',
            id: 'classification-cme',
            legacyValue: null,
            slug: 'continuing-medical-education',
            title: 'Continuing Medical Education',
          },
          excerpt: 'A specialist learning event.',
          title: 'Clinical learning symposium',
        },
      ],
    })
    mocks.findGlobal.mockResolvedValue({
      logo: {
        height: 512,
        url: 'https://assets.snmih.tanish.im/Logo.avif',
        width: 512,
      },
      siteName: 'SNMIH',
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('populates and renders the resolved classification badge label', async () => {
    const markup = await renderImage()

    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        depth: 1,
        select: expect.objectContaining({ classification: true }),
      }),
    )
    expect(markup).toContain('CME')
    expect(markup).toContain('Clinical learning symposium')
  })

  it('renders fetched AVIF data as PNG with intrinsic dimensions', async () => {
    const markup = await renderImage()

    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).toContain('width="512"')
    expect(markup).toContain('height="512"')
  })

  it('returns the local preview when logo dimensions are incomplete', async () => {
    mocks.findGlobal.mockResolvedValue({
      logo: {
        height: null,
        url: 'https://assets.snmih.tanish.im/Logo.avif',
        width: 512,
      },
      siteName: 'SNMIH',
    })

    const markup = await renderImage()

    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).not.toContain('Clinical learning symposium')
  })

  it('returns the local preview when the remote logo request fails', async () => {
    mocks.fetch.mockResolvedValue(
      new Response('unavailable', {
        headers: { 'content-type': 'text/plain' },
        status: 503,
      }),
    )

    const markup = await renderImage()

    expect(markup).toContain('src="data:image/png;base64,')
    expect(markup).not.toContain('Clinical learning symposium')
  })

  it('returns the local preview without fetching the logo when the record is missing', async () => {
    mocks.find.mockResolvedValue({ docs: [] })

    const markup = await renderImage()

    expect(markup).toContain('src="data:image/png;base64,')
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
})
