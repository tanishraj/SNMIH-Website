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

describe('articles RSS route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    payloadMocks.find.mockResolvedValue({ docs: [] })
  })

  it('uses a safe site name when legacy settings are incomplete', async () => {
    payloadMocks.findGlobal.mockResolvedValue({
      contactEmail: null,
      siteName: undefined,
    })

    const { GET } = await import('@/app/(frontend)/articles/feed.xml/route')
    const response = await GET()
    const xml = await response.text()

    expect(response.status).toBe(200)
    expect(xml).toContain('<title><![CDATA[Website — Articles]]></title>')
    expect(xml).toContain('<description><![CDATA[Latest articles from Website]]></description>')
  })
})
