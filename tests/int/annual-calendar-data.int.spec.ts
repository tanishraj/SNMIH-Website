import { describe, expect, it, vi } from 'vitest'

import {
  getAnnualCalendarDateMonthKey,
  getAnnualCalendarMonthKeys,
  getAnnualCalendarPeriodMonthKeys,
  getAnnualCalendarScopeKey,
  materializeAnnualCalendarMonths,
  normalizeAnnualCalendarPeriod,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import {
  buildCalendarPeriodWhere,
  CalendarScopeError,
  fetchAnnualCalendarPeriod,
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

describe('Annual Calendar data contract', () => {
  it('normalizes date-based current and academic periods and rejects invalid ranges', () => {
    expect(normalizeAnnualCalendarPeriod({}, '2026-08-23')).toEqual({
      endMonthKey: '2026-12',
      monthKeys: [
        '2026-01',
        '2026-02',
        '2026-03',
        '2026-04',
        '2026-05',
        '2026-06',
        '2026-07',
        '2026-08',
        '2026-09',
        '2026-10',
        '2026-11',
        '2026-12',
      ],
      periodLabel: 'Calendar year 2026',
      periodMode: 'currentYear',
      startMonthKey: '2026-01',
    })

    const academicPeriod = {
      periodEndDate: '2027-06-02T00:00:00.000Z',
      periodMode: 'customAcademicYear',
      periodStartDate: '2026-07-15T00:00:00.000Z',
    } as const

    expect(normalizeAnnualCalendarPeriod(academicPeriod, '2026-08-23')).toMatchObject({
      endMonthKey: '2027-06',
      periodLabel: 'Academic year 2026–2027',
      startMonthKey: '2026-07',
    })
    expect(getAnnualCalendarDateMonthKey('2026-07-29T18:30:00.000Z')).toBe('2026-07')
    expect(
      normalizeAnnualCalendarPeriod(
        {
          ...academicPeriod,
          periodEndDate: '2027-06-29T18:30:00.000Z',
          periodStartDate: '2026-07-01T18:30:00.000Z',
        },
        '2026-08-23',
      ),
    ).toMatchObject({ endMonthKey: '2027-06', startMonthKey: '2026-07' })

    for (const input of [
      { ...academicPeriod, periodEndDate: null },
      { ...academicPeriod, periodStartDate: 'not-a-date' },
      { ...academicPeriod, periodEndDate: '2026-06-02T00:00:00.000Z' },
      { ...academicPeriod, periodEndDate: '2027-05-02T00:00:00.000Z' },
      { ...academicPeriod, periodEndDate: '2027-07-02T00:00:00.000Z' },
    ]) {
      expect(normalizeAnnualCalendarPeriod(input, '2026-08-23')).toBeNull()
    }

    expect(getAnnualCalendarPeriodMonthKeys('2026-07', '2027-06')).toHaveLength(12)
    expect(getAnnualCalendarScopeKey(['academic'], academicPeriod)).toBe(
      '[["academic"],"customAcademicYear","2026-07-15T00:00:00.000Z","2027-06-02T00:00:00.000Z"]',
    )
    expect(
      getAnnualCalendarScopeKey(['academic'], {
        ...academicPeriod,
        periodMode: 'currentYear',
      }),
    ).toBe('[["academic"],"currentYear",null,null]')
  })

  it('materializes all twelve months and groups events by start month', () => {
    const events = [
      { id: 'august', startDateKey: '2026-08-23' },
      { id: 'january', startDateKey: '2026-01-02' },
    ] as never

    expect(getAnnualCalendarMonthKeys(2026)).toEqual([
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
      '2026-11',
      '2026-12',
    ])

    const months = materializeAnnualCalendarMonths(getAnnualCalendarMonthKeys(2026), events)
    expect(months).toHaveLength(12)
    expect(months[0]).toMatchObject({ monthKey: '2026-01', events: [{ id: 'january' }] })
    expect(months[7]).toMatchObject({ monthKey: '2026-08', events: [{ id: 'august' }] })
    expect(months[8]).toMatchObject({ monthKey: '2026-09', events: [] })
    expect(getAnnualCalendarScopeKey(['academic', 'exam'])).toBe(
      '[["academic","exam"],"currentYear",null,null]',
    )
  })

  it('builds a bounded published start-date query', () => {
    expect(
      buildCalendarPeriodWhere({
        classificationIDs: ['academic', 'exam'],
        endISO: '2027-06-30T18:29:59.999Z',
        startISO: '2026-06-30T18:30:00.000Z',
      }),
    ).toEqual({
      and: [
        { _status: { equals: 'published' } },
        { classification: { in: ['academic', 'exam'] } },
        { eventStart: { greater_than_equal: '2026-06-30T18:30:00.000Z' } },
        { eventStart: { less_than_equal: '2027-06-30T18:29:59.999Z' } },
      ],
    })
  })

  it('normalizes, orders, and materializes annual events', async () => {
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: classifications })
      .mockResolvedValueOnce({
        docs: [
          {
            classification: 'academic',
            eventAllDay: false,
            eventStart: '2026-08-23T04:30:00.000Z',
            id: 'august',
            slug: 'august-event',
            title: 'August event',
          },
          {
            classification: 'academic',
            eventAllDay: true,
            eventStart: '2027-06-07T18:30:00.000Z',
            id: 'june',
            slug: 'june',
            title: 'June event',
          },
          {
            classification: 'exam',
            eventAllDay: true,
            eventStart: '2026-07-01T18:30:00.000Z',
            id: 'july',
            slug: 'july',
            title: 'July event',
          },
        ],
      })

    const snapshot = await fetchAnnualCalendarPeriod(
      { find } as never,
      ['academic', 'exam'],
      {
        periodEndDate: '2027-06-02T00:00:00.000Z',
        periodMode: 'customAcademicYear',
        periodStartDate: '2026-07-15T00:00:00.000Z',
      },
      '2026-08-23',
      'Asia/Kolkata',
      { overrideAccess: true },
    )

    expect(snapshot).toMatchObject({
      endMonthKey: '2027-06',
      eventCount: 3,
      periodLabel: 'Academic year 2026–2027',
      startMonthKey: '2026-07',
      version: 3,
    })
    expect(snapshot.months).toHaveLength(12)
    expect(snapshot.months[0]?.monthKey).toBe('2026-07')
    expect(snapshot.months[0]?.events.map(({ id }) => id)).toEqual(['july'])
    expect(snapshot.months[1]?.events.map(({ id }) => id)).toEqual(['august'])
    expect(snapshot.months[11]?.monthKey).toBe('2027-06')
    expect(snapshot.months[11]?.events.map(({ id }) => id)).toEqual(['june'])
    expect(find).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        overrideAccess: true,
        sort: ['eventStart', 'id'],
        where: {
          and: [
            { _status: { equals: 'published' } },
            { classification: { in: ['academic', 'exam'] } },
            { eventStart: { greater_than_equal: '2026-06-30T18:30:00.000Z' } },
            { eventStart: { less_than_equal: '2027-06-30T18:29:59.999Z' } },
          ],
        },
      }),
    )
  })

  it('rejects partial scopes and forwards authenticated draft mode', async () => {
    const partialFind = vi.fn().mockResolvedValueOnce({ docs: [classifications[0]] })

    await expect(
      fetchAnnualCalendarPeriod(
        { find: partialFind } as never,
        ['academic', 'exam'],
        {},
        '2026-08-23',
        'Asia/Kolkata',
        { overrideAccess: true },
      ),
    ).rejects.toBeInstanceOf(CalendarScopeError)

    const user = { id: 'editor' }
    const draftFind = vi
      .fn()
      .mockResolvedValueOnce({ docs: classifications })
      .mockResolvedValueOnce({ docs: [] })

    await fetchAnnualCalendarPeriod(
      { find: draftFind } as never,
      ['academic', 'exam'],
      {},
      '2026-08-23',
      'Asia/Kolkata',
      { draft: true, overrideAccess: false, user } as never,
    )

    expect(draftFind).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        draft: true,
        overrideAccess: false,
        user,
        where: {
          and: [
            { classification: { in: ['academic', 'exam'] } },
            { eventStart: { greater_than_equal: '2025-12-31T18:30:00.000Z' } },
            { eventStart: { less_than_equal: '2026-12-31T18:29:59.999Z' } },
          ],
        },
      }),
    )

    const invalidFind = vi.fn()
    await expect(
      fetchAnnualCalendarPeriod(
        { find: invalidFind } as never,
        ['academic'],
        {
          periodEndDate: '2027-05-02T00:00:00.000Z',
          periodMode: 'customAcademicYear',
          periodStartDate: '2026-07-15T00:00:00.000Z',
        },
        '2026-08-23',
        'Asia/Kolkata',
        { overrideAccess: true },
      ),
    ).rejects.toThrow('Annual Calendar period is invalid.')
    expect(invalidFind).not.toHaveBeenCalled()
  })
})
