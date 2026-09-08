import { describe, expect, it, vi } from 'vitest'

import { findRankedSearchDocuments } from '@/lib/searchRanking'

describe('search relevance ranking', () => {
  it('prioritizes exact, prefix, other title matches, then metadata matches', async () => {
    const docs = [
      'Public Disclosure',
      'PG Admission',
      'Admission Enquiry',
      'Academic Courses',
      'Admission',
      'Admission Eligibility',
    ].map((title, id) => ({ id, title }))
    const result = await findRankedSearchDocuments('  ADMISSION  ', 6, async () => ({ docs }))
    expect(result.docs.map(({ title }) => title)).toEqual([
      'Admission',
      'Admission Eligibility',
      'Admission Enquiry',
      'PG Admission',
      'Academic Courses',
      'Public Disclosure',
    ])
  })

  it('finds a strong match beyond the first batch before applying the UI limit', async () => {
    const fetchPage = vi.fn(async (page: number) =>
      page === 1
        ? {
            docs: Array.from({ length: 100 }, (_, id) => ({ id, title: `General page ${id}` })),
            hasNextPage: true,
          }
        : { docs: [{ id: 101, title: 'Admission Enquiry' }], hasNextPage: false },
    )
    const result = await findRankedSearchDocuments('Admission', 6, fetchPage)
    expect(result.docs).toHaveLength(6)
    expect(result.docs[0].title).toBe('Admission Enquiry')
    expect(fetchPage.mock.calls).toEqual([[1], [2]])
  })

  it('ranks titles containing all query words above metadata-only matches', async () => {
    const result = await findRankedSearchDocuments('admission eligibility', 4, async () => ({
      docs: [
        { id: 1, title: 'Academic Courses' },
        { id: 2, title: 'Eligibility for Admission' },
        { id: 3, title: 'PG Admission Eligibility' },
        { id: 4, title: 'Admission   Eligibility' },
      ],
    }))
    expect(result.docs.map(({ id }) => id)).toEqual([4, 3, 2, 1])
  })

  it('uses deterministic title and ID tie-breakers independent of database order', async () => {
    const docs = [
      { id: 'b', title: 'Admission Enquiry' },
      { id: 'a', title: 'Admission Enquiry' },
    ]
    const run = (rows: typeof docs) =>
      findRankedSearchDocuments('admission', 2, async () => ({ docs: rows }))
    expect(await run(docs)).toEqual(await run([...docs].reverse()))
    expect((await run(docs)).docs.map(({ id }) => id)).toEqual(['a', 'b'])
  })
})
