import { describe, expect, it, vi } from 'vitest'

import { fetchNewsEventsHighlights } from '@/lib/newsEvents'
import type { ResolvedNewsEventClassification } from '@/lib/newsEventClassifications'

const campusClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'Campus',
  behavior: 'story',
  calendarColor: 'blue',
  id: 'classification-campus',
  legacyValue: null,
  slug: 'campus-updates',
  title: 'Campus Updates',
}

const cmeClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'CME',
  behavior: 'event',
  calendarColor: 'blue',
  id: 'classification-cme',
  legacyValue: null,
  slug: 'continuing-medical-education',
  title: 'Continuing Medical Education',
}

const newsClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'News',
  behavior: 'story',
  calendarColor: 'blue',
  id: 'classification-news',
  legacyValue: 'news',
  slug: 'news',
  title: 'News',
}

const eventClassification: ResolvedNewsEventClassification = {
  active: true,
  badgeLabel: 'Event',
  behavior: 'event',
  calendarColor: 'blue',
  id: 'classification-event',
  legacyValue: 'event',
  slug: 'event',
  title: 'Events',
}

const record = (classification: ResolvedNewsEventClassification) => ({
  classification,
  contentType: null,
  createdAt: '2026-08-10T00:00:00.000Z',
  eventEnd: classification.behavior === 'event' ? '2026-08-20T12:00:00.000Z' : null,
  eventStart: classification.behavior === 'event' ? '2026-08-20T09:00:00.000Z' : null,
  excerpt: `${classification.badgeLabel} excerpt`,
  featuredInHighlights: false,
  featuredImage: null,
  featuredImagePosition: 'center' as const,
  id: `${classification.id}-entry`,
  primaryCategory: null,
  publishedAt: '2026-08-10T00:00:00.000Z',
  slug: `${classification.slug}-entry`,
  title: `${classification.title} entry`,
  updatedAt: '2026-08-10T00:00:00.000Z',
})

describe('News & Events Highlights loader', () => {
  it('places up to three featured Events before three automatic upcoming Events', async () => {
    const featured = [1, 2, 3, 4].map((index) => ({
      ...record(cmeClassification),
      eventStart: `2026-08-2${index}T09:00:00.000Z`,
      featuredInHighlights: true,
      id: `featured-${index}`,
      slug: `featured-${index}`,
    }))
    const upcoming = [1, 2, 3, 4].map((index) => ({
      ...record(eventClassification),
      eventStart: `2026-09-0${index}T09:00:00.000Z`,
      id: `upcoming-${index}`,
      slug: `upcoming-${index}`,
    }))
    const find = vi.fn(async (query: { collection: string; limit?: number; where?: unknown }) => {
      if (query.collection === 'news-event-classifications') {
        return {
          docs: [campusClassification, newsClassification, cmeClassification, eventClassification],
        }
      }

      const serializedWhere = JSON.stringify(query.where)
      const source = serializedWhere.includes('"featuredInHighlights":{"equals":true}')
        ? featured
        : upcoming

      return { docs: source.slice(0, query.limit) }
    })

    await expect(
      fetchNewsEventsHighlights({ find } as never, {
        classificationIDs: [],
        nowISO: '2026-08-17T00:00:00.000Z',
      }),
    ).resolves.toEqual(
      ['featured-1', 'featured-2', 'featured-3', 'upcoming-1', 'upcoming-2', 'upcoming-3'].map(
        (id) => expect.objectContaining({ behavior: 'event', id }),
      ),
    )

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-event-classifications',
        where: { active: { equals: true } },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        limit: 3,
        sort: ['eventStart', 'id'],
        where: {
          and: expect.arrayContaining([
            {
              or: [
                {
                  classification: {
                    in: [cmeClassification.id, eventClassification.id],
                  },
                },
                {
                  and: [
                    expect.objectContaining({ or: expect.any(Array) }),
                    { contentType: { in: ['event'] } },
                  ],
                },
              ],
            },
            expect.objectContaining({ or: expect.any(Array) }),
            { featuredInHighlights: { equals: true } },
          ]),
        },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        limit: 3,
        where: {
          and: expect.arrayContaining([{ featuredInHighlights: { not_equals: true } }]),
        },
      }),
    )
    expect(
      find.mock.calls.some(
        ([query]) =>
          query.collection === 'news-events' &&
          JSON.stringify(query.where).includes(campusClassification.id),
      ),
    ).toBe(false)
  })

  it('strictly scopes entries to selected active classifications', async () => {
    const find = vi.fn(async (query: { collection: string; where?: unknown }) => {
      if (query.collection === 'news-event-classifications') {
        return { docs: [cmeClassification] }
      }

      return { docs: [record(cmeClassification)] }
    })

    await fetchNewsEventsHighlights({ find } as never, {
      classificationIDs: [cmeClassification.id],
      nowISO: '2026-08-17T00:00:00.000Z',
    })

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-event-classifications',
        where: {
          and: [{ active: { equals: true } }, { or: [{ id: { in: [cmeClassification.id] } }] }],
        },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        where: {
          and: expect.arrayContaining([
            {
              classification: {
                in: [cmeClassification.id],
              },
            },
          ]),
        },
      }),
    )
  })

  it('returns no entries when any selected classification is missing or inactive', async () => {
    const find = vi.fn(async (query: { collection: string }) => {
      if (query.collection === 'news-event-classifications') {
        return { docs: [campusClassification] }
      }

      return { docs: [record(campusClassification)] }
    })

    await expect(
      fetchNewsEventsHighlights({ find } as never, {
        classificationIDs: [campusClassification.id, 'classification-inactive'],
        nowISO: '2026-08-17T00:00:00.000Z',
      }),
    ).resolves.toEqual([])

    expect(find).toHaveBeenCalledTimes(1)
  })

  it('de-duplicates defensive overlap between featured and automatic queries', async () => {
    const shared = {
      ...record(eventClassification),
      featuredInHighlights: true,
      id: 'shared-event',
    }
    const find = vi.fn(async (query: { collection: string }) =>
      query.collection === 'news-event-classifications'
        ? { docs: [eventClassification] }
        : { docs: [shared] },
    )

    await expect(
      fetchNewsEventsHighlights({ find } as never, {
        nowISO: '2026-08-17T00:00:00.000Z',
      }),
    ).resolves.toEqual([expect.objectContaining({ id: 'shared-event' })])
  })
})
