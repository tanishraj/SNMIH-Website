import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Reviews } from '@/collections/Reviews'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  findGlobal: vi.fn(),
}))

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()

  return {
    ...actual,
    getPayload: vi.fn(async () => ({
      find: payloadMocks.find,
      findGlobal: payloadMocks.findGlobal,
    })),
  }
})

vi.mock('@payload-config', () => ({
  default: {},
}))

const loadContentEntries = async () => {
  vi.resetModules()
  return import('@/lib/contentEntries')
}

describe('reviews collection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMocks.findGlobal.mockResolvedValue({
      defaultDescription: 'Global SEO description',
      defaultImage: null,
      defaultTitle: 'Global SEO title',
      robots: 'index,follow',
    })
  })

  it('includes structured rating fields without legacy blocks', () => {
    const serializedFields = JSON.stringify(Reviews.fields)

    expect(Reviews.admin?.defaultColumns).toContain('primaryCategory')
    expect(serializedFields).toContain('"name":"rating"')
    expect(serializedFields).toContain('"value":"5"')
    expect(serializedFields).toContain('"name":"primaryCategory"')
    expect(serializedFields).toContain('"relationTo":"categories"')
    expect(serializedFields).toContain('"name":"tags"')
    expect(serializedFields).toContain('"relationTo":"tags"')
    expect(serializedFields).toContain('"name":"categories"')
    expect(serializedFields).not.toContain('"type":"blocks"')
    expect(serializedFields).not.toContain('"slug":"contentSpotlight"')
    expect(serializedFields).toContain('"name":"metaTitle"')
    expect(serializedFields).toContain('"name":"robotsMode"')
    expect(serializedFields).toContain('"name":"includeInSitemap"')
    expect(serializedFields).toContain('"name":"sourceSubmission"')
    expect(serializedFields).toContain('"name":"moderationStatus"')
    expect(serializedFields).toContain('"name":"publishedAt"')
    expect(serializedFields).not.toContain('"name":"workflowState"')
  })

  it('queries only published reviews by slug', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [{ id: 8, slug: 'great-service', title: 'Great Service' }],
    })

    const { getReviewBySlug } = await loadContentEntries()
    const review = await getReviewBySlug('great-service')

    expect(review?.slug).toBe('great-service')
    expect(payloadMocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'reviews',
        where: expect.objectContaining({
          and: expect.arrayContaining([
            { slug: { equals: 'great-service' } },
            { _status: { equals: 'published' } },
          ]),
        }),
      }),
    )
  })
})
