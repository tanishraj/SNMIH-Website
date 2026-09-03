import { describe, expect, it, vi } from 'vitest'

vi.mock('@payload-config', () => ({
  default: {},
}))

import { Articles } from '@/collections/Articles'
import { Categories } from '@/collections/Categories'
import { Pages } from '@/collections/Pages'
import { Reviews } from '@/collections/Reviews'
import { SystemPages } from '@/collections/SystemPages'
import { Tags } from '@/collections/Tags'
import { buildSEOFields } from '@/fields/buildSEOFields'
import { validateSEOContract } from '@/hooks/validateSEOContract'
import { resolveCanonicalURL, resolveSitemapInclusion } from '@/lib/seo'

describe('seo contract primitives', () => {
  it('builds reusable seo fields with robots and sitemap controls', () => {
    const fields = buildSEOFields()

    expect(JSON.stringify(fields)).toContain('"name":"canonicalURL"')
    expect(JSON.stringify(fields)).toContain('"name":"robotsMode"')
    expect(JSON.stringify(fields)).toContain('"name":"includeInSitemap"')
    expect(JSON.stringify(fields)).toContain('"name":"ogTitle"')
  })

  it('can omit open graph fields for surfaces that only need basic seo controls', () => {
    const fields = buildSEOFields({
      allowOpenGraph: false,
    })

    expect(JSON.stringify(fields)).not.toContain('"name":"ogTitle"')
    expect(JSON.stringify(fields)).not.toContain('"name":"ogImage"')
  })

  it('rejects noindex routes from sitemap inclusion by default', () => {
    expect(
      resolveSitemapInclusion({
        includeInSitemap: 'default',
        isIndexable: false,
        isPublicRoute: true,
        isPublished: true,
      }),
    ).toBe(false)
  })

  it('keeps valid site-relative canonicals', () => {
    expect(
      resolveCanonicalURL({
        canonicalURL: '/articles/launch-notes',
        resolvedPath: '/fallback',
      }),
    ).toBe('/articles/launch-notes')
  })

  it('rejects invalid canonical overrides', async () => {
    await expect(
      validateSEOContract()({
        data: {
          canonicalURL: 'not a valid canonical',
        },
      } as never),
    ).rejects.toThrow('Canonical URL must be a valid site-relative path or absolute URL.')
  })

  it('blocks contradictory forced sitemap inclusion for noindex routes', async () => {
    await expect(
      validateSEOContract()({
        data: {
          includeInSitemap: 'include',
          robotsMode: 'noindex',
        },
      } as never),
    ).rejects.toThrow('Noindexed or non-public routes cannot be forced into the sitemap.')
  })

  it('applies the seo contract to pages, system pages, entries, and taxonomy terms', () => {
    expect(JSON.stringify(Pages.fields)).toContain('"name":"robotsMode"')
    expect(JSON.stringify(SystemPages.fields)).toContain('"name":"includeInSitemap"')
    expect(JSON.stringify(Articles.fields)).toContain('"name":"includeInSitemap"')
    expect(JSON.stringify(Reviews.fields)).toContain('"name":"robotsMode"')
    expect(JSON.stringify(Categories.fields)).toContain('"name":"metaTitle"')
    expect(JSON.stringify(Tags.fields)).toContain('"name":"includeInSitemap"')
  })
})
