import { beforeEach, describe, expect, it, vi } from 'vitest'

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

describe('News & Events RSS route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('keeps the manual Page and detail URLs in the News & Events feed', async () => {
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          authorName: 'Editorial Team',
          classification: {
            active: true,
            badgeLabel: 'Campus',
            behavior: 'story',
            id: 'campus-classification',
            legacyValue: null,
            slug: 'campus-update',
            title: 'Campus Updates',
          },
          excerpt: 'A public update.',
          featuredImage: null,
          publishedAt: '2026-08-17T00:00:00.000Z',
          slug: 'public-update',
          title: 'Public update',
          updatedAt: '2026-08-17T00:00:00.000Z',
        },
      ],
    })
    payloadMocks.findGlobal.mockResolvedValue({ siteName: 'SNMIH' })

    const { GET } = await import('@/app/(frontend)/news-events/feed.xml/route')
    const response = await GET()
    const xml = await response.text()

    expect(response.status).toBe(200)
    expect(xml).toContain('<link>http://localhost:3000/news-events</link>')
    expect(xml).toContain(
      '<guid isPermaLink="true">http://localhost:3000/news-events/public-update</guid>',
    )
    expect(xml).toContain('<category><![CDATA[Campus]]></category>')
  })
})
