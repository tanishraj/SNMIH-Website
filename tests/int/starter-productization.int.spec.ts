import { readFileSync } from 'node:fs'

import { getPayload, type Payload } from 'payload'

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import { createTestMongoServer } from '../helpers/mongoMemoryServer'

let payload: Payload
let stopMongoServer: (() => Promise<void>) | null = null

describe('starter productization', () => {
  beforeAll(async () => {
    const mongoServer = await createTestMongoServer()

    process.env.MONGODB_URI = mongoServer.uri
    process.env.EMAIL_PROVIDER = 'none'
    process.env.MEDIA_PROVIDER = 'localDisk'
    process.env.PAYLOAD_SECRET = 'test-secret'
    stopMongoServer = mongoServer.stop

    vi.resetModules()
    const { default: config } = await import('@/payload.config')
    payload = await getPayload({ config: await config })
  }, 120000)

  afterAll(async () => {
    if (payload) {
      await payload.destroy()
    }

    if (stopMongoServer) {
      await stopMongoServer()
    }
  }, 30000)

  it('keeps the documented local defaults in .env.example', () => {
    const envExample = readFileSync('.env.example', 'utf8')

    expect(envExample).toContain('MONGODB_URI=mongodb://127.0.0.1:27017/payload-cms-starter-kit')
    expect(envExample).not.toContain('DATABASE_PROVIDER=sqlite')
    expect(envExample).toContain('EMAIL_PROVIDER=none')
    expect(envExample).toContain('MEDIA_PROVIDER=localDisk')
    expect(envExample).not.toContain('POSTGRES_URL=')
    expect(envExample).toContain('S3_ENDPOINT')
    expect(envExample).toContain('MEDIA_RECONCILE_TOKEN')
  })

  it('boots the starter and exposes the documented core collections and globals', async () => {
    const [pages, articles, reviews, forms, pageSettings, siteSettings, seoSettings] =
      await Promise.all([
        payload.find({ collection: 'pages', limit: 1 }),
        payload.find({ collection: 'articles', limit: 1 }),
        payload.find({ collection: 'reviews', limit: 1 }),
        payload.find({ collection: 'forms', limit: 1 }),
        payload.findGlobal({ slug: 'page-settings' }),
        payload.findGlobal({ slug: 'site-settings' }),
        payload.findGlobal({ slug: 'seo-settings' }),
      ])

    expect(Array.isArray(pages.docs)).toBe(true)
    expect(Array.isArray(articles.docs)).toBe(true)
    expect(Array.isArray(reviews.docs)).toBe(true)
    expect(Array.isArray(forms.docs)).toBe(true)
    expect(pageSettings).toBeDefined()
    expect(siteSettings).toBeDefined()
    expect(seoSettings).toBeDefined()
  })
})
