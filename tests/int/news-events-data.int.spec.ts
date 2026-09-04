import { describe, expect, it, vi } from 'vitest'

import {
  currentOrUpcomingEventWhere,
  fetchNewsEventGroups,
  fetchNewsEventPage,
  fetchNewsEventPageForScope,
  parseNewsEventsTabsPagination,
  pastEventWhere,
  resolveActiveNewsEventClassifications,
} from '@/lib/newsEvents'
import {
  interleaveNewsEvents,
  normalizeHighlightsItemCount,
  type PublicNewsEventCard,
} from '@/lib/newsEventsShared'
import type { ResolvedNewsEventClassification } from '@/lib/newsEventClassifications'

const storyClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'Campus',
  behavior: 'story',
  calendarColor: 'blue',
  id: 'classification-campus',
  legacyValue: null,
  slug: 'campus-update',
  title: 'Campus Updates',
}

const eventClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'CME',
  behavior: 'event',
  calendarColor: 'blue',
  id: 'classification-cme',
  legacyValue: null,
  slug: 'cme',
  title: 'Continuing Medical Education',
}

const legacyNewsClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'News',
  behavior: 'story',
  calendarColor: 'blue',
  id: 'classification-news',
  legacyValue: 'news',
  slug: 'news',
  title: 'News',
}

const legacyEventClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'Event',
  behavior: 'event',
  calendarColor: 'blue',
  id: 'classification-event',
  legacyValue: 'event',
  slug: 'event',
  title: 'Events',
}

const card = (
  id: string,
  classification: ResolvedNewsEventClassification,
): PublicNewsEventCard => ({
  behavior: classification.behavior,
  classification,
  contentType: classification.slug,
  dateISO: '2026-07-20T00:00:00.000Z',
  dateLabel: 'Jul 20, 2026',
  excerpt: `${id} excerpt`,
  href: `/news-events/${id}`,
  id,
  isPastEvent: false,
  slug: id,
  title: id,
})

const record = (id: string, classification: ResolvedNewsEventClassification) => ({
  classification,
  contentType: classification.legacyValue ?? undefined,
  createdAt: '2026-08-10T00:00:00.000Z',
  eventEnd: classification.behavior === 'event' ? '2026-08-20T12:00:00.000Z' : null,
  eventStart: classification.behavior === 'event' ? '2026-08-20T09:00:00.000Z' : null,
  excerpt: `${id} excerpt`,
  featuredImage: null,
  featuredImagePosition: 'center' as const,
  id,
  primaryCategory: null,
  publishedAt: '2026-08-10T00:00:00.000Z',
  slug: id,
  title: `${id} title`,
  updatedAt: '2026-08-10T00:00:00.000Z',
})

describe('News & Events public data helpers', () => {
  it('alternates Story and Event records and backfills without duplicates', () => {
    expect(
      interleaveNewsEvents(
        [
          card('story-1', storyClassification),
          card('story-2', storyClassification),
          card('story-3', storyClassification),
        ],
        [card('event-1', eventClassification)],
        4,
      ).map(({ id }) => id),
    ).toEqual(['story-1', 'event-1', 'story-2', 'story-3'])
  })

  it('normalizes dynamic block item counts', () => {
    expect(normalizeHighlightsItemCount(99)).toBe(6)
    expect(normalizeHighlightsItemCount(0)).toBe(1)
    expect(normalizeHighlightsItemCount(undefined)).toBe(3)
  })

  it('keeps all-day Events eligible through their final site-local calendar day', () => {
    const nowISO = '2026-08-20T12:00:00.000Z'
    const todayStartISO = '2026-08-19T18:30:00.000Z'

    expect(currentOrUpcomingEventWhere(nowISO, 'Asia/Kolkata')).toEqual({
      or: [
        {
          and: [
            { eventAllDay: { equals: true } },
            {
              or: [
                { eventEnd: { greater_than_equal: todayStartISO } },
                {
                  and: [
                    expect.objectContaining({ or: expect.any(Array) }),
                    { eventStart: { greater_than_equal: todayStartISO } },
                  ],
                },
              ],
            },
          ],
        },
        {
          and: [
            expect.objectContaining({ or: expect.any(Array) }),
            expect.objectContaining({ or: expect.any(Array) }),
          ],
        },
      ],
    })
    expect(JSON.stringify(pastEventWhere(nowISO, 'Asia/Kolkata'))).toContain(
      `"less_than":"${todayStartISO}"`,
    )
  })

  it('parses a bounded selected-classification pagination scope', () => {
    expect(
      parseNewsEventsTabsPagination(
        new URLSearchParams(
          'classification=classification-campus&classifications=classification-campus,classification-cme,classification-campus&page=2&limit=6',
        ),
      ),
    ).toEqual({
      classification: 'classification-campus',
      classificationIDs: ['classification-campus', 'classification-cme'],
      limit: 6,
      ok: true,
      page: 2,
    })
    expect(
      parseNewsEventsTabsPagination(
        new URLSearchParams(
          'classification=all&classifications=legacy%3Anews,legacy%3Aevent&page=1&limit=12',
        ),
      ),
    ).toEqual({
      classification: 'all',
      classificationIDs: ['legacy:news', 'legacy:event'],
      limit: 12,
      ok: true,
      page: 1,
    })

    expect(
      parseNewsEventsTabsPagination(new URLSearchParams('classification=all&page=1&limit=6')),
    ).toEqual({
      classification: 'all',
      classificationIDs: [],
      limit: 6,
      ok: true,
      page: 1,
    })

    const overLimit = Array.from({ length: 51 }, (_, index) => `classification-${index}`).join(',')

    for (const query of [
      'classification=all&classifications=&page=1&limit=6',
      'classification=outside&classifications=inside&page=1&limit=6',
      'classification=inside&classifications=inside,,outside&page=1&limit=6',
      `classification=all&classifications=${overLimit}&page=1&limit=6`,
      'classification=inside&classifications=inside&page=0&limit=6',
      'classification=inside&classifications=inside&page=1.5&limit=6',
      'classification=inside&classifications=inside&page=1&limit=5',
      'classification=inside&classifications=inside&page=1',
    ]) {
      expect(parseNewsEventsTabsPagination(new URLSearchParams(query)).ok).toBe(false)
    }
  })

  it('loads the All-only scope from every active classification', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [eventClassification, storyClassification] })
      .mockResolvedValueOnce({
        docs: [record('story-1', storyClassification)],
        hasNextPage: false,
        page: 1,
      })
      .mockResolvedValueOnce({
        docs: [record('event-1', eventClassification)],
        hasNextPage: false,
        page: 1,
      })
      .mockResolvedValueOnce({ docs: [], hasNextPage: false, page: 1 })

    const page = await fetchNewsEventPageForScope({ find } as never, {
      classification: 'all',
      classificationIDs: [],
      limit: 6,
      nowISO: '2026-08-17T00:00:00.000Z',
      page: 1,
    })

    expect(page.docs.map(({ id }) => id)).toEqual(['story-1', 'event-1'])
    expect(find).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'news-event-classifications',
        where: { active: { equals: true } },
      }),
    )
  })

  it('resolves active records in requested order, de-duplicates IDs, and maps legacy scopes', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [eventClassification, legacyNewsClassification, storyClassification],
    })

    await expect(
      resolveActiveNewsEventClassifications({ find } as never, [
        eventClassification.id,
        'legacy:news',
        eventClassification.id,
        storyClassification.id,
      ]),
    ).resolves.toEqual([eventClassification, legacyNewsClassification, storyClassification])
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-event-classifications',
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            { active: { equals: true } },
            {
              or: [
                {
                  id: {
                    in: [eventClassification.id, storyClassification.id],
                  },
                },
                { legacyValue: { in: ['news'] } },
              ],
            },
          ],
        },
      }),
    )
  })

  it('rejects unknown or inactive scope IDs before querying News & Events', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        storyClassification,
        { ...eventClassification, active: false, id: 'classification-missing' },
      ],
    })

    await expect(
      fetchNewsEventPageForScope({ find } as never, {
        classification: 'classification-missing',
        classificationIDs: [storyClassification.id, 'classification-missing'],
        limit: 6,
        nowISO: '2026-08-17T00:00:00.000Z',
        page: 1,
      }),
    ).rejects.toThrow('Classification scope is invalid.')
    expect(find).toHaveBeenCalledTimes(1)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ collection: 'news-event-classifications' }),
    )
  })

  it('queries each selected classification by relationship ID and behavior', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [], hasNextPage: false, page: 1 })
      .mockResolvedValueOnce({ docs: [], hasNextPage: false, page: 1 })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })
      .mockResolvedValueOnce({ docs: [] })

    const groups = await fetchNewsEventGroups({ find } as never, {
      classifications: [storyClassification, eventClassification],
      limit: 6,
      nowISO: '2026-08-17T00:00:00.000Z',
    })

    expect(Object.keys(groups)).toEqual(['all', storyClassification.id, eventClassification.id])
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        sort: ['-publishedAt', '-id'],
        where: {
          and: expect.arrayContaining([{ classification: { equals: storyClassification.id } }]),
        },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        sort: ['eventStart', 'id'],
        where: {
          and: expect.arrayContaining([
            { classification: { equals: eventClassification.id } },
            expect.objectContaining({ or: expect.any(Array) }),
          ]),
        },
      }),
    )
  })

  it('continues deterministic All pagination across selected Story and Event streams', async () => {
    const stories = ['story-1', 'story-2', 'story-3'].map((id) => record(id, storyClassification))
    const events = ['event-1', 'event-2', 'event-3'].map((id) => record(id, eventClassification))
    const find = vi.fn(async (query: { limit: number; where: unknown }) => {
      const isEventQuery = JSON.stringify(query.where).includes(eventClassification.id)

      return { docs: (isEventQuery ? events : stories).slice(0, query.limit) }
    })
    const input = {
      classification: 'all' as const,
      classifications: [storyClassification, eventClassification],
      limit: 2,
      nowISO: '2026-08-17T00:00:00.000Z',
    }

    const first = await fetchNewsEventPage({ find } as never, { ...input, page: 1 })
    const second = await fetchNewsEventPage({ find } as never, { ...input, page: 2 })
    const combined = [...first.docs, ...second.docs]

    expect(combined.map(({ id }) => id)).toEqual(['story-1', 'event-1', 'story-2', 'event-2'])
    expect(new Set(combined.map(({ id }) => id)).size).toBe(combined.length)
    expect(first.hasNextPage).toBe(true)
    expect(second.hasNextPage).toBe(true)
    expect(find.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        sort: ['-publishedAt', '-id'],
        where: {
          and: expect.arrayContaining([{ classification: { in: [storyClassification.id] } }]),
        },
      }),
    )
    expect(find.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        sort: ['eventStart', 'id'],
        where: {
          and: expect.arrayContaining([{ classification: { in: [eventClassification.id] } }]),
        },
      }),
    )
  })

  it('uses relationship IDs for a stable specific page', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [record('campus-2', storyClassification)],
      hasNextPage: true,
      page: 2,
    })

    const result = await fetchNewsEventPage({ find } as never, {
      classification: storyClassification,
      classifications: [storyClassification, eventClassification],
      limit: 6,
      nowISO: '2026-08-17T00:00:00.000Z',
      page: 2,
    })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        limit: 6,
        page: 2,
        sort: ['-publishedAt', '-id'],
        where: {
          and: expect.arrayContaining([
            { _status: { equals: 'published' } },
            { classification: { equals: storyClassification.id } },
          ]),
        },
      }),
    )
    expect(result).toMatchObject({
      docs: [expect.objectContaining({ id: 'campus-2' })],
      hasNextPage: true,
      page: 2,
    })
  })

  it('shows every published Event with current and upcoming entries before recent past entries', async () => {
    const current = {
      ...record('current-event', eventClassification),
      eventEnd: '2026-08-18T12:00:00.000Z',
      eventStart: '2026-08-16T09:00:00.000Z',
    }
    const upcoming = {
      ...record('upcoming-event', eventClassification),
      eventEnd: '2026-08-21T12:00:00.000Z',
      eventStart: '2026-08-21T09:00:00.000Z',
    }
    const recentPast = {
      ...record('recent-past-event', eventClassification),
      eventEnd: '2026-08-16T12:00:00.000Z',
      eventStart: '2026-08-16T09:00:00.000Z',
    }
    const olderPast = {
      ...record('older-past-event', eventClassification),
      eventEnd: '2026-08-10T12:00:00.000Z',
      eventStart: '2026-08-10T09:00:00.000Z',
    }
    const find = vi.fn(async (query: { sort?: string[] }) => ({
      docs: query.sort?.[0] === '-eventStart' ? [recentPast, olderPast] : [current, upcoming],
    }))

    const result = await fetchNewsEventPage({ find } as never, {
      classification: eventClassification,
      classifications: [eventClassification],
      limit: 6,
      nowISO: '2026-08-17T00:00:00.000Z',
      page: 1,
    })

    expect(result.docs.map(({ id }) => id)).toEqual([
      'current-event',
      'upcoming-event',
      'recent-past-event',
      'older-past-event',
    ])
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: ['eventStart', 'id'] }))
    expect(find).toHaveBeenCalledWith(expect.objectContaining({ sort: ['-eventStart', '-id'] }))
  })

  it('keeps legacy-only Story and Event entries visible during local compatibility', async () => {
    const find = vi.fn(async (query: { where: unknown }) => {
      const isEventQuery = JSON.stringify(query.where).includes(legacyEventClassification.id)
      const classification = isEventQuery ? legacyEventClassification : legacyNewsClassification

      return {
        docs: [
          {
            ...record(`legacy-${classification.legacyValue}`, classification),
            classification: null,
            contentType: classification.legacyValue,
          },
        ],
        hasNextPage: false,
        page: 1,
      }
    })
    const input = {
      classifications: [legacyNewsClassification, legacyEventClassification],
      limit: 6,
      nowISO: '2026-08-17T00:00:00.000Z',
      page: 1,
    }

    const storyPage = await fetchNewsEventPage({ find } as never, {
      ...input,
      classification: legacyNewsClassification,
    })
    const eventPage = await fetchNewsEventPage({ find } as never, {
      ...input,
      classification: legacyEventClassification,
    })

    expect(storyPage.docs[0]).toMatchObject({ behavior: 'story', contentType: 'news' })
    expect(eventPage.docs[0]).toMatchObject({ behavior: 'event', contentType: 'event' })

    expect(find.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        sort: ['-publishedAt', '-id'],
        where: {
          and: expect.arrayContaining([
            {
              or: [
                { classification: { equals: legacyNewsClassification.id } },
                {
                  and: [
                    {
                      or: [
                        { classification: { exists: false } },
                        { classification: { equals: null } },
                      ],
                    },
                    { contentType: { equals: 'news' } },
                  ],
                },
              ],
            },
          ]),
        },
      }),
    )
    expect(find.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        sort: ['eventStart', 'id'],
        where: {
          and: expect.arrayContaining([
            {
              or: [
                { classification: { equals: legacyEventClassification.id } },
                {
                  and: [
                    {
                      or: [
                        { classification: { exists: false } },
                        { classification: { equals: null } },
                      ],
                    },
                    { contentType: { equals: 'event' } },
                  ],
                },
              ],
            },
            expect.objectContaining({ or: expect.any(Array) }),
          ]),
        },
      }),
    )
  })
})
