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
  it('loads migrated and legacy-only Story and Event entries without stale-value leakage', async () => {
    const find = vi.fn(async (query: { collection: string; where?: unknown }) => {
      if (query.collection === 'news-event-classifications') {
        return {
          docs: [campusClassification, newsClassification, cmeClassification, eventClassification],
        }
      }

      const serializedWhere = JSON.stringify(query.where)
      const isEventQuery = serializedWhere.includes(cmeClassification.id)
      const migratedClassification = isEventQuery ? cmeClassification : campusClassification
      const legacyClassification = isEventQuery ? eventClassification : newsClassification

      return {
        docs: [
          {
            ...record(migratedClassification),
            contentType: isEventQuery ? 'news' : 'event',
          },
          {
            ...record(legacyClassification),
            classification: null,
            contentType: legacyClassification.legacyValue,
          },
        ],
      }
    })

    await expect(
      fetchNewsEventsHighlights({ find } as never, {
        classificationIDs: [],
        limit: 6,
        nowISO: '2026-08-17T00:00:00.000Z',
      }),
    ).resolves.toEqual([
      expect.objectContaining({
        behavior: 'story',
        classification: campusClassification,
      }),
      expect.objectContaining({
        behavior: 'event',
        classification: cmeClassification,
      }),
      expect.objectContaining({ behavior: 'story', contentType: 'news' }),
      expect.objectContaining({ behavior: 'event', contentType: 'event' }),
    ])

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-event-classifications',
        where: { active: { equals: true } },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        sort: ['-publishedAt', '-id'],
        where: {
          and: expect.arrayContaining([
            {
              or: [
                {
                  classification: {
                    in: [campusClassification.id, newsClassification.id],
                  },
                },
                {
                  and: [
                    expect.objectContaining({ or: expect.any(Array) }),
                    { contentType: { in: ['news'] } },
                  ],
                },
              ],
            },
          ]),
        },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
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
          ]),
        },
      }),
    )
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
      limit: 3,
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
        limit: 3,
        nowISO: '2026-08-17T00:00:00.000Z',
      }),
    ).resolves.toEqual([])

    expect(find).toHaveBeenCalledTimes(1)
  })
})
