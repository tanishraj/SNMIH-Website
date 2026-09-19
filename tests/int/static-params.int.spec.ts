import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: async () => ({ find: mocks.find }) }))

import { getStaticPageParams, getStaticSlugParams } from '@/lib/staticParams'

describe('public build-time paths', () => {
  beforeEach(() => vi.clearAllMocks())

  it('reads every batch with anonymous access and only published routing fields', async () => {
    mocks.find
      .mockResolvedValueOnce({ docs: [{ slug: 'one' }], hasNextPage: true })
      .mockResolvedValueOnce({ docs: [{ slug: 'two' }, { slug: 'one' }], hasNextPage: false })
    expect(await getStaticSlugParams('reviews')).toEqual([{ slug: 'one' }, { slug: 'two' }])
    expect(mocks.find).toHaveBeenCalledTimes(2)
    expect(mocks.find).toHaveBeenLastCalledWith(
      expect.objectContaining({
        collection: 'reviews',
        depth: 0,
        draft: false,
        overrideAccess: false,
        page: 2,
        limit: 100,
        sort: 'id',
        select: { slug: true },
        where: { _status: { equals: 'published' } },
      }),
    )
  })

  it('resolves arbitrarily deep parents and skips missing ancestors and cycles', async () => {
    mocks.find.mockResolvedValue({
      docs: [
        { id: '1', slug: 'parent' },
        { id: '2', slug: 'child', parent: '1' },
        { id: '3', slug: 'grandchild', parent: '2' },
        { id: '4', slug: 'private-child', parent: 'unpublished' },
        { id: '5', slug: 'cycle-a', parent: '6' },
        { id: '6', slug: 'cycle-b', parent: '5' },
      ],
      hasNextPage: false,
    })
    expect(await getStaticPageParams()).toEqual([
      { slug: ['parent'] },
      { slug: ['parent', 'child'] },
      { slug: ['parent', 'child', 'grandchild'] },
    ])
  })

  it('does not apply a draft-status filter to unversioned taxonomy', async () => {
    mocks.find.mockResolvedValue({ docs: [{ slug: 'campus' }], hasNextPage: false })
    expect(await getStaticSlugParams('categories')).toEqual([{ slug: 'campus' }])
    expect(mocks.find.mock.calls[0][0]).not.toHaveProperty('where')
  })

  it('returns an empty build list for a new site and propagates database failures', async () => {
    mocks.find.mockResolvedValueOnce({ docs: [], hasNextPage: false })
    expect(await getStaticPageParams()).toEqual([])
    mocks.find.mockRejectedValueOnce(new Error('Database unavailable'))
    await expect(getStaticSlugParams('articles')).rejects.toThrow('Database unavailable')
  })
})
