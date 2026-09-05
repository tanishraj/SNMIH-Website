import { getPayload, Payload } from 'payload'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { createTestMongoServer } from '../helpers/mongoMemoryServer'

vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  revalidateTag: vi.fn(),
}))

let payload: Payload
let stopMongoServer: (() => Promise<void>) | null = null

describe('API', () => {
  beforeAll(async () => {
    const mongoServer = await createTestMongoServer()

    process.env.MONGODB_URI = mongoServer.uri
    process.env.EMAIL_PROVIDER = 'none'
    process.env.MEDIA_PROVIDER = 'localDisk'
    process.env.PAYLOAD_SECRET = 'test-secret'
    stopMongoServer = mongoServer.stop

    vi.resetModules()
    const { default: config } = await import('@/payload.config')
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
    await Promise.all(Object.values(payload.db.collections).map((model) => model.init()))
  }, 120000)

  afterAll(async () => {
    if (payload) {
      await payload.destroy()
    }

    if (stopMongoServer) {
      await stopMongoServer()
    }
  }, 30000)

  it('loads configured collections', async () => {
    const [users, pages, forms, categories, articles] = await Promise.all([
      payload.find({
        collection: 'users',
      }),
      payload.find({
        collection: 'pages',
        limit: 1,
      }),
      payload.find({
        collection: 'forms',
        limit: 1,
      }),
      payload.find({
        collection: 'categories',
        limit: 1,
      }),
      payload.find({
        collection: 'articles',
        limit: 1,
      }),
    ])

    expect(users).toBeDefined()
    expect(Array.isArray(users.docs)).toBe(true)
    expect(pages).toBeDefined()
    expect(Array.isArray(pages.docs)).toBe(true)
    expect(forms).toBeDefined()
    expect(Array.isArray(forms.docs)).toBe(true)
    expect(categories).toBeDefined()
    expect(Array.isArray(categories.docs)).toBe(true)
    expect(articles).toBeDefined()
    expect(Array.isArray(articles.docs)).toBe(true)
  })

  it('enforces two-role feature permissions through the Payload Local API', async () => {
    await payload.create({
      collection: 'operational-audit-events',
      data: {
        action: 'test_initialized',
        entityId: 'api-test',
        entityTitle: 'API test',
        entityType: 'test',
        occurredAt: new Date().toISOString(),
        summary: 'Initialized the isolated audit collection.',
      },
      draft: false,
      overrideAccess: true,
    })

    const firstAdmin = await payload.create({
      collection: 'users',
      data: {
        email: 'first-admin@example.test',
        password: 'test-password',
        role: 'admin',
      },
      draft: false,
    })

    expect(firstAdmin.role).toBe('admin')

    const siteManager = await payload.create({
      collection: 'users',
      data: {
        email: 'site-manager@example.test',
        features: { pages: true },
        password: 'test-password',
        role: 'siteManager',
      },
      draft: false,
      overrideAccess: false,
      user: firstAdmin,
    })
    const secondAdmin = await payload.create({
      collection: 'users',
      data: {
        email: 'second-admin@example.test',
        password: 'test-password',
        role: 'admin',
      },
      draft: false,
      overrideAccess: false,
      user: firstAdmin,
    })

    expect(siteManager.role).toBe('siteManager')
    expect(siteManager.features?.pages).toBe(true)
    expect(secondAdmin.role).toBe('admin')
    await expect(
      payload.find({
        collection: 'pages',
        overrideAccess: false,
        user: siteManager,
      }),
    ).resolves.toBeDefined()
    await expect(
      payload.find({
        collection: 'articles',
        overrideAccess: false,
        user: siteManager,
      }),
    ).rejects.toThrow()
    await expect(
      payload.create({
        collection: 'users',
        data: {
          email: 'forbidden-user@example.test',
          password: 'test-password',
          role: 'siteManager',
        },
        draft: false,
        overrideAccess: false,
        user: siteManager,
      }),
    ).rejects.toThrow()

    const topic = await payload.create({
      collection: 'categories',
      data: { slug: 'temporary-topic', title: 'Temporary topic' },
      draft: false,
      overrideAccess: false,
      user: firstAdmin,
    })
    await payload.delete({
      collection: 'categories',
      id: topic.id,
      overrideAccess: false,
      user: firstAdmin,
    })

    const deletionAudit = await payload.find({
      collection: 'operational-audit-events',
      overrideAccess: true,
      where: {
        and: [
          { action: { equals: 'permanently_deleted' } },
          { entityId: { equals: String(topic.id) } },
          { feature: { equals: 'topics' } },
        ],
      },
    })
    expect(deletionAudit.totalDocs).toBe(1)
    expect(deletionAudit.docs[0]?.entityTitle).toBe(`Topics #${topic.id}`)

    await payload.update({
      collection: 'users',
      id: siteManager.id,
      data: { deletedAt: new Date().toISOString() },
      overrideAccess: false,
      user: firstAdmin,
    })
    await payload.update({
      collection: 'users',
      id: siteManager.id,
      data: { deletedAt: null },
      overrideAccess: false,
      trash: true,
      user: firstAdmin,
    })
    await payload.delete({
      collection: 'users',
      id: siteManager.id,
      overrideAccess: false,
      user: firstAdmin,
    })

    const userLifecycleAudit = await payload.find({
      collection: 'operational-audit-events',
      overrideAccess: true,
      where: {
        action: {
          in: ['user_trashed', 'user_restored', 'user_permanently_deleted'],
        },
      },
    })
    expect(userLifecycleAudit.docs.map(({ action }) => action)).toEqual(
      expect.arrayContaining(['user_trashed', 'user_restored', 'user_permanently_deleted']),
    )
  })

  it('renames a published Page and creates a permanent redirect for its former slug', async () => {
    const admin = await payload.create({
      collection: 'users',
      data: {
        email: 'page-slug-admin@example.test',
        password: 'test-password',
        role: 'admin',
      },
      draft: false,
      overrideAccess: true,
    })
    const page = await payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        generateSlug: false,
        slug: 'former-page-path',
        title: 'Renamed Page',
      },
      draft: false,
      overrideAccess: false,
      user: admin,
    })

    const updatedPage = await payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        _status: 'published',
        generateSlug: false,
        slug: 'current-page-path',
      },
      draft: false,
      overrideAccess: false,
      user: admin,
    })
    const redirects = await payload.find({
      collection: 'redirects',
      depth: 0,
      draft: true,
      overrideAccess: true,
      where: {
        fromPath: {
          equals: '/former-page-path',
        },
      },
    })

    expect(updatedPage.slug).toBe('current-page-path')
    expect(redirects.docs).toHaveLength(1)
    expect(redirects.docs[0]).toEqual(
      expect.objectContaining({
        _status: 'published',
        destinationType: 'page',
        enabled: true,
        page: page.id,
        statusCode: '301',
      }),
    )
  })
})
