import { describe, expect, it, vi } from 'vitest'

import {
  buildCalendarMonthWhere,
  fetchCalendarMonth,
  fetchCalendarUpcoming,
  resolveCalendarClassifications,
} from '@/lib/calendarEvents'

const classifications = [
  {
    active: true,
    badgeLabel: 'Academic',
    behavior: 'event',
    calendarColor: 'green',
    id: 'academic',
    slug: 'academic',
    title: 'Academic',
  },
  {
    active: true,
    badgeLabel: 'Exam',
    behavior: 'event',
    calendarColor: 'blue',
    id: 'exam',
    slug: 'exam',
    title: 'Examination',
  },
]

describe('Calendar data boundary', () => {
  it('builds an explicit published overlap query', () => {
    expect(
      buildCalendarMonthWhere({
        classificationIDs: ['academic', 'exam'],
        endISO: '2026-08-31T18:29:59.999Z',
        startISO: '2026-07-31T18:30:00.000Z',
      }),
    ).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { classification: { in: ['academic', 'exam'] } },
        { eventStart: { less_than_equal: '2026-08-31T18:29:59.999Z' } },
        {
          or: [
            { eventEnd: { greater_than_equal: '2026-07-31T18:30:00.000Z' } },
            {
              and: [
                { or: [{ eventEnd: { exists: false } }, { eventEnd: { equals: null } }] },
                { eventStart: { greater_than_equal: '2026-07-31T18:30:00.000Z' } },
              ],
            },
          ],
        },
      ],
    })
  })

  it('preserves selected classification order and rejects partial scopes', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [classifications[1], classifications[0]] })
    await expect(
      resolveCalendarClassifications({ find } as never, ['academic', 'exam'], {
        overrideAccess: true,
      }),
    ).resolves.toEqual([
      expect.objectContaining({ id: 'academic' }),
      expect.objectContaining({ id: 'exam' }),
    ])

    find.mockResolvedValueOnce({ docs: [classifications[0]] })
    await expect(
      resolveCalendarClassifications({ find } as never, ['academic', 'exam'], {
        overrideAccess: true,
      }),
    ).rejects.toThrow('scope is invalid')
  })

  it('normalizes a bounded month query with IST keys and stable sorting', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: classifications })
      .mockResolvedValueOnce({
        docs: [
          {
            classification: 'exam',
            eventAllDay: true,
            eventEnd: '2026-08-16T18:29:59.000Z',
            eventLocation: 'Exam hall',
            eventStart: '2026-08-13T18:30:00.000Z',
            id: 'b',
            slug: 'exam-week',
            title: 'Exam week',
          },
          {
            classification: 'academic',
            eventAllDay: false,
            eventStart: '2026-08-01T19:00:00.000Z',
            id: 'a',
            slug: 'orientation',
            title: 'Orientation',
          },
        ],
      })

    const snapshot = await fetchCalendarMonth(
      { find } as never,
      ['academic', 'exam'],
      '2026-08',
      'Asia/Kolkata',
      { overrideAccess: true },
    )

    expect(snapshot).toMatchObject({ monthKey: '2026-08', monthLabel: 'August 2026', version: 1 })
    expect(snapshot.events.map(({ id }) => id)).toEqual(['a', 'b'])
    expect(snapshot.events[0]).toMatchObject({ startDateKey: '2026-08-02' })
    expect(snapshot.events[1]).toMatchObject({ allDay: true, endDateKey: '2026-08-16' })
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        limit: 500,
        overrideAccess: true,
        select: expect.objectContaining({ eventAllDay: true, eventStart: true }),
        sort: ['eventStart', 'id'],
      }),
    )
  })

  it('keeps Upcoming independent and includes an ongoing all-day event', async () => {
    const find = vi.fn().mockResolvedValue({
      docs: [
        {
          classification: 'academic',
          eventAllDay: true,
          eventEnd: '2026-08-23T18:29:59.000Z',
          eventStart: '2026-08-21T18:30:00.000Z',
          id: 'ongoing',
          slug: 'ongoing',
          title: 'Ongoing event',
        },
      ],
    })
    const result = await fetchCalendarUpcoming(
      { find } as never,
      classifications.map(({ badgeLabel, calendarColor, id, slug, title }) => ({
        badgeLabel,
        calendarColor: calendarColor as 'blue' | 'green',
        id,
        slug,
        title,
      })),
      new Date('2026-08-23T08:00:00.000Z'),
      'Asia/Kolkata',
      { overrideAccess: true },
    )
    expect(result.map(({ id }) => id)).toEqual(['ongoing'])
  })
})
