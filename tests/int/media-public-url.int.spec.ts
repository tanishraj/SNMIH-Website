import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildMediaPublicURL,
  getMediaRemotePattern,
  normalizeMediaPublicURL,
} from '@/config/mediaPublicURL'

const ORIGINAL_S3_PUBLIC_URL = process.env.S3_PUBLIC_URL

afterEach(() => {
  if (ORIGINAL_S3_PUBLIC_URL === undefined) {
    delete process.env.S3_PUBLIC_URL
  } else {
    process.env.S3_PUBLIC_URL = ORIGINAL_S3_PUBLIC_URL
  }

  vi.resetModules()
})

describe('public media URL configuration', () => {
  it('normalizes an HTTPS origin without a trailing slash', () => {
    expect(normalizeMediaPublicURL(' https://assets.snmih.tanish.im/ ')).toBe(
      'https://assets.snmih.tanish.im',
    )
  })

  it('returns null for an omitted public origin', () => {
    expect(normalizeMediaPublicURL(undefined)).toBeNull()
    expect(normalizeMediaPublicURL('   ')).toBeNull()
  })

  it.each([
    'not-a-url',
    'http://assets.snmih.tanish.im',
    'https://user:secret@assets.snmih.tanish.im',
    'https://assets.snmih.tanish.im/media',
    'https://assets.snmih.tanish.im?variant=large',
    'https://assets.snmih.tanish.im#images',
  ])('rejects unsafe or non-origin public URL %s', (publicURL) => {
    expect(() => normalizeMediaPublicURL(publicURL)).toThrow(
      'Invalid S3_PUBLIC_URL. Use an HTTPS origin without credentials, path, query, or fragment.',
    )
  })

  it('encodes every object-key path segment', () => {
    expect(
      buildMediaPublicURL({
        filename: 'Campus image #1.PNG',
        prefix: '/school events/2026/',
        publicURL: 'https://assets.snmih.tanish.im/',
      }),
    ).toBe('https://assets.snmih.tanish.im/school%20events/2026/Campus%20image%20%231.PNG')
  })

  it('builds a strict Next.js remote image pattern', () => {
    expect(getMediaRemotePattern('https://assets.snmih.tanish.im')).toEqual({
      hostname: 'assets.snmih.tanish.im',
      pathname: '/**',
      port: '',
      protocol: 'https',
    })
  })

  it('adds the configured media origin to the Next.js image allow-list', async () => {
    process.env.S3_PUBLIC_URL = 'https://assets.snmih.tanish.im'
    vi.resetModules()

    const { nextConfig } = await import('../../next.config')

    expect(nextConfig.images?.minimumCacheTTL).toBe(86400)
    expect(nextConfig.images?.remotePatterns).toContainEqual({
      hostname: 'assets.snmih.tanish.im',
      pathname: '/**',
      port: '',
      protocol: 'https',
    })
    expect(nextConfig.images?.localPatterns).toContainEqual({
      pathname: '/api/media/file/**',
    })
  })
})
