import type { Payload } from 'payload'
import { describe, expect, it, vi } from 'vitest'

import { resolveSearchPageHrefs } from '@/lib/searchPagePaths'
import type { Page } from '@/payload-types'

type SearchPage = Pick<Page, 'id' | 'parent' | 'slug'>

const page = (id: string, slug: string, parent: SearchPage['parent'] = null): SearchPage => ({
  id,
  parent,
  slug,
})

const payloadWith = (findByID: ReturnType<typeof vi.fn>) =>
  ({ findByID }) as unknown as Pick<Payload, 'findByID'>

describe('search Page path resolution', () => {
  it('resolves a root Page without parent queries', async () => {
    const findByID = vi.fn()

    const hrefs = await resolveSearchPageHrefs([page('root', 'about')], payloadWith(findByID))

    expect(hrefs.get('root')).toBe('/about')
    expect(findByID).not.toHaveBeenCalled()
  })

  it('resolves every segment in a multi-level Page path', async () => {
    const findByID = vi.fn(async ({ id }) => {
      if (id === 'services') return page('services', 'services', 'company')
      if (id === 'company') return page('company', 'company')
      return null
    })

    const hrefs = await resolveSearchPageHrefs(
      [page('consulting', 'consulting', 'services')],
      payloadWith(findByID),
    )

    expect(hrefs.get('consulting')).toBe('/company/services/consulting')
  })

  it('deduplicates shared parent lookups across sibling results', async () => {
    const findByID = vi.fn(async () => page('services', 'services'))

    const hrefs = await resolveSearchPageHrefs(
      [page('consulting', 'consulting', 'services'), page('training', 'training', 'services')],
      payloadWith(findByID),
    )

    expect(hrefs.get('consulting')).toBe('/services/consulting')
    expect(hrefs.get('training')).toBe('/services/training')
    expect(findByID).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['missing', vi.fn(async () => null)],
    ['rejected', vi.fn(async () => Promise.reject(new Error('parent unavailable')))],
  ])('omits a Page when its parent lookup is %s', async (_label, findByID) => {
    const hrefs = await resolveSearchPageHrefs(
      [page('child', 'child', 'missing-parent')],
      payloadWith(findByID),
    )

    expect(hrefs.has('child')).toBe(false)
  })
})
