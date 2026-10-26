import { describe, expect, it, vi } from 'vitest'
const { find } = vi.hoisted(() => ({ find: vi.fn() }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('payload', () => ({ getPayload: vi.fn(async () => ({ find })) }))
vi.mock('@/lib/siteTimeZone.server', () => ({ getSiteTimeZone: async () => 'Asia/Kolkata' }))
import { loadDisclosure } from '@/blocks/DisclosureProforma/load'
import { parseDisclosureQuery } from '@/blocks/DisclosureProforma/request'
const query = () =>
  parseDisclosureQuery(
    new URLSearchParams(
      'dataset=dataset&section=courses&groups=programmes&period=period&limit=5&page=2',
    ),
  )
describe('Disclosure public and draft queries', () => {
  it('enforces published scope, bounds and safe projection on every public row request', async () => {
    find
      .mockReset()
      .mockResolvedValueOnce({ docs: [{ id: 'dataset' }] })
      .mockResolvedValueOnce({
        docs: [{ id: 'period', label: 'September 2026' }],
        hasNextPage: false,
      })
      .mockResolvedValueOnce({
        docs: [{ id: 'row', label: 'Programme', content: { value: '0' }, sourceNote: 'private' }],
        totalDocs: 10,
        totalPages: 2,
        page: 2,
      })
    const result = await loadDisclosure(query())
    const rowCall = find.mock.calls[2][0]
    expect(rowCall).toMatchObject({
      collection: 'disclosure-records',
      overrideAccess: false,
      draft: false,
      limit: 5,
      page: 2,
      depth: 0,
    })
    expect(rowCall.where.and).toEqual(
      expect.arrayContaining([
        { dataset: { equals: 'dataset' } },
        { period: { equals: 'period' } },
        { _status: { equals: 'published' } },
      ]),
    )
    expect(result.groups.programmes.rows[0]).not.toHaveProperty('sourceNote')
  })
  it('rejects cross-dataset or unpublished selected periods before reading rows', async () => {
    find
      .mockReset()
      .mockResolvedValueOnce({ docs: [{ id: 'dataset' }] })
      .mockResolvedValueOnce({ docs: [], hasNextPage: false })
      .mockResolvedValueOnce({ docs: [] })
    await expect(loadDisclosure(query())).rejects.toMatchObject({ status: 404 })
    expect(find).toHaveBeenCalledTimes(3)
    expect(find.mock.calls[2][0].where.and).toContainEqual({ dataset: { equals: 'dataset' } })
  })
  it('requires authenticated permission before querying drafts', async () => {
    find.mockReset()
    await expect(loadDisclosure({ ...query(), draft: true })).rejects.toMatchObject({ status: 401 })
    await expect(
      loadDisclosure({ ...query(), draft: true }, { role: 'siteManager', features: {} } as never),
    ).rejects.toMatchObject({ status: 403 })
    expect(find).not.toHaveBeenCalled()
  })
})
