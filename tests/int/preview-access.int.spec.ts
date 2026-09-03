import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  find: vi.fn(),
  getPayload: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))

import { getArticlePreviewBySlug } from '@/lib/contentEntries'
import { getNewsEventPreviewBySlug } from '@/lib/newsEvents'
import type { User } from '@/payload-types'

const createUser = (id: string): User => ({
  id,
  collection: 'users',
  createdAt: '2026-08-23T00:00:00.000Z',
  email: `editor-${id}@example.com`,
  features: {
    articles: true,
    newsEvents: true,
  },
  role: 'siteManager',
  updatedAt: '2026-08-23T00:00:00.000Z',
})

describe('preview access', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.find.mockResolvedValue({ docs: [] })
    mocks.getPayload.mockResolvedValue({
      find: mocks.find,
      logger: { error: vi.fn() },
    })
  })

  it('enforces the authenticated user for Article drafts', async () => {
    const user = createUser('editor-7')

    await getArticlePreviewBySlug('draft-article', user)

    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'articles',
        draft: true,
        overrideAccess: false,
        user,
      }),
    )
  })

  it('enforces the authenticated user for News/Event drafts', async () => {
    const user = createUser('editor-8')

    await getNewsEventPreviewBySlug('draft-news', user)

    expect(mocks.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        draft: true,
        overrideAccess: false,
        user,
      }),
    )
  })
})
