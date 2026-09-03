import { describe, expect, it } from 'vitest'

import { Categories } from '@/collections/Categories'
import { Articles } from '@/collections/Articles'
import { Reviews } from '@/collections/Reviews'
import { Tags } from '@/collections/Tags'
import { syncPrimaryCategoryMembership } from '@/hooks/syncPrimaryCategoryMembership'

describe('taxonomy collections', () => {
  it('keeps taxonomy nav restricted while allowing content operators to read terms', () => {
    expect(Categories.slug).toBe('categories')
    expect(Tags.slug).toBe('tags')

    const categoriesHidden = Categories.admin?.hidden

    if (typeof categoriesHidden !== 'function') {
      throw new Error('Expected Categories admin hidden handler to exist.')
    }

    expect(
      categoriesHidden({ user: { role: 'siteManager', features: { articles: true } } as never }),
    ).toBe(true)
    expect(categoriesHidden({ user: { role: 'admin' } as never })).toBe(false)

    const categoriesReadAccess = Categories.access?.read
    const tagsReadAccess = Tags.access?.read

    if (!categoriesReadAccess || !tagsReadAccess) {
      throw new Error('Expected taxonomy read access to exist.')
    }

    expect(categoriesReadAccess({ req: { user: null } } as never)).toBe(true)
    expect(tagsReadAccess({ req: { user: null } } as never)).toBe(true)
    expect(
      categoriesReadAccess({
        req: {
          user: {
            role: 'siteManager',
            features: {
              articles: true,
            },
          },
        },
      } as never),
    ).toBe(true)
    expect(
      tagsReadAccess({
        req: {
          user: {
            role: 'siteManager',
            features: {
              reviews: true,
            },
          },
        },
      } as never),
    ).toBe(true)
    expect(
      categoriesReadAccess({
        req: {
          user: {
            role: 'siteManager',
            features: {
              pages: true,
            },
          },
        },
      } as never),
    ).toBe(false)
  })

  it('registers taxonomy fields and the primary-category sync hook on content collections', () => {
    expect(Articles.hooks?.beforeChange).toContain(syncPrimaryCategoryMembership)
    expect(Reviews.hooks?.beforeChange).toContain(syncPrimaryCategoryMembership)
    expect(JSON.stringify(Categories.fields)).toContain('"name":"metaTitle"')
    expect(JSON.stringify(Categories.fields)).toContain('"name":"includeInSitemap"')
    expect(JSON.stringify(Tags.fields)).toContain('"name":"metaTitle"')
    expect(JSON.stringify(Tags.fields)).toContain('"name":"includeInSitemap"')
    expect(JSON.stringify(Articles.fields)).toContain('"name":"primaryCategory"')
    expect(JSON.stringify(Articles.fields)).toContain('"name":"tags"')
    expect(JSON.stringify(Articles.fields)).toContain('"name":"categories"')
    expect(JSON.stringify(Reviews.fields)).toContain('"name":"primaryCategory"')
    expect(JSON.stringify(Reviews.fields)).toContain('"name":"tags"')
    expect(JSON.stringify(Reviews.fields)).toContain('"name":"categories"')
  })

  it('keeps the primary category inside supporting categories without duplicates', async () => {
    const result = await syncPrimaryCategoryMembership({
      data: {
        categories: [8, { id: 7 }, 8, { id: 9 }],
        primaryCategory: 7,
      },
      originalDoc: {
        categories: [8],
        primaryCategory: 7,
      },
    } as never)

    expect(result?.categories).toEqual([8, 7, 9])
  })
})
