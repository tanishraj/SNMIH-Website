import { render } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { AnnualCalendarBlockPresentation } from '@/blocks/AnnualCalendar/Presentation'
import {
  getAnnualCalendarMonthKeys,
  materializeAnnualCalendarMonths,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import { AnnualCalendarBlock } from '@/blocks/AnnualCalendar/config'
import type { CalendarEvent } from '@/blocks/Calendar/calendarShared'
import { getAnnualCalendarPreviewScopes } from '@/lib/newsEventsPreviewShared'
import type { Media, Page } from '@/payload-types'

const classification = {
  badgeLabel: 'Academic',
  calendarColor: 'green' as const,
  id: 'academic',
  slug: 'academic',
  title: 'Academic',
}

const event = (id: string, dateKey: string): CalendarEvent => ({
  allDay: false,
  classification,
  endDateKey: dateKey,
  eventStart: `${dateKey}T04:30:00.000Z`,
  href: `/news-events/${id}`,
  id,
  location: 'Academic Block',
  rangeLabel: `${dateKey}, 10:00 AM`,
  startDateKey: dateKey,
  timeLabel: '10:00 AM',
  title: `Event ${id}`,
})

const events = [event('january', '2026-01-02'), event('today', '2026-08-23')]
const initial = {
  classifications: [classification],
  endMonthKey: '2026-12',
  eventCount: events.length,
  months: materializeAnnualCalendarMonths(getAnnualCalendarMonthKeys(2026), events),
  periodLabel: 'Calendar year 2026',
  startMonthKey: '2026-01',
  timeZone: 'Asia/Kolkata' as const,
  todayKey: '2026-08-23',
  upcoming: [events[1]],
  version: 3 as const,
}

const calendarPdf = {
  filename: 'academic-calendar-2026-27.pdf',
  id: 'calendar-pdf',
  mimeType: 'application/pdf',
  url: '/media/academic-calendar-2026-27.pdf',
} as Media

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field
    if ('fields' in field) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
    if ('tabs' in field) {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }
  }
}

describe('Annual Calendar block', () => {
  it('defines the bounded Event-classification authoring contract', () => {
    expect(AnnualCalendarBlock).toMatchObject({
      interfaceName: 'AnnualCalendarBlock',
      labels: { plural: 'Annual Calendars', singular: 'Annual Calendar' },
      slug: 'annualCalendar',
    })
    expect(findNamedField(AnnualCalendarBlock.fields, 'classifications')).toMatchObject({
      hasMany: true,
      maxRows: 5,
      minRows: 1,
      relationTo: 'news-event-classifications',
      required: true,
    })
    expect(findNamedField(AnnualCalendarBlock.fields, 'upcomingTitle')).toMatchObject({
      defaultValue: 'Coming next',
    })
    expect(findNamedField(AnnualCalendarBlock.fields, 'periodMode')).toMatchObject({
      defaultValue: 'currentYear',
      options: [
        { label: 'Current calendar year', value: 'currentYear' },
        { label: 'Custom academic year', value: 'customAcademicYear' },
      ],
    })
    for (const name of ['startMonth', 'startYear', 'endMonth', 'endYear']) {
      expect(findNamedField(AnnualCalendarBlock.fields, name)).toBeUndefined()
    }

    const periodStartDate = findNamedField(AnnualCalendarBlock.fields, 'periodStartDate')
    const periodEndDate = findNamedField(AnnualCalendarBlock.fields, 'periodEndDate') as Field & {
      validate?: (value: unknown, options: { siblingData?: Record<string, unknown> }) => unknown
    }
    expect(periodStartDate).toMatchObject({
      admin: { date: { pickerAppearance: 'dayOnly' }, width: '50%' },
      label: 'Academic Year Start Date',
      type: 'date',
    })
    expect(periodEndDate).toMatchObject({
      admin: { date: { pickerAppearance: 'dayOnly' }, width: '50%' },
      label: 'Academic Year End Date',
      type: 'date',
    })
    expect(
      periodEndDate.validate?.('2027-06-02T00:00:00.000Z', {
        siblingData: {
          periodEndDate: '2027-06-02T00:00:00.000Z',
          periodMode: 'customAcademicYear',
          periodStartDate: '2026-07-15T00:00:00.000Z',
        },
      }),
    ).toBe(true)
    expect(
      periodEndDate.validate?.('2027-05-02T00:00:00.000Z', {
        siblingData: {
          periodEndDate: '2027-05-02T00:00:00.000Z',
          periodMode: 'customAcademicYear',
          periodStartDate: '2026-07-15T00:00:00.000Z',
        },
      }),
    ).toBe('Choose dates whose months define exactly 12 consecutive months.')

    const calendarPdf = findNamedField(AnnualCalendarBlock.fields, 'calendarPdf')
    const calendarPdfTitle = findNamedField(AnnualCalendarBlock.fields, 'calendarPdfTitle')
    const calendarPdfLabel = findNamedField(AnnualCalendarBlock.fields, 'calendarPdfLabel')
    const calendarPdfAction = findNamedField(AnnualCalendarBlock.fields, 'calendarPdfAction')

    expect(calendarPdf).toMatchObject({
      filterOptions: { mimeType: { equals: 'application/pdf' } },
      admin: { hidden: true },
      label: 'Legacy Calendar PDF',
      relationTo: 'media',
      type: 'upload',
    })
    expect(calendarPdfLabel).toMatchObject({
      defaultValue: 'Download',
      admin: { hidden: true },
      label: 'Legacy PDF Button Label',
      type: 'text',
    })
    expect(calendarPdfTitle).toMatchObject({
      defaultValue: 'Academic calendar PDF',
      label: 'PDF Document Label',
      type: 'text',
    })
    expect(calendarPdfAction).toMatchObject({
      label: 'Action',
      maxRows: 1,
      type: 'array',
    })
    expect(findNamedField(AnnualCalendarBlock.fields, 'adjacentMonthDates')).toBeUndefined()
  })

  it('discovers ordered scopes through populated Reusable Sections', () => {
    expect(
      getAnnualCalendarPreviewScopes([
        {
          blockType: 'reusableSection',
          section: {
            layout: [
              {
                blockType: 'annualCalendar',
                classifications: ['academic', { id: 'exam' }],
              },
            ],
          },
        },
      ] as never),
    ).toEqual([
      {
        classificationIDs: ['academic', 'exam'],
        key: '[["academic","exam"],"currentYear",null,null]',
        periodInput: {
          periodEndDate: null,
          periodMode: 'currentYear',
          periodStartDate: null,
        },
      },
    ])
  })

  it('keeps equal classification scopes distinct across saved periods', () => {
    const scopes = getAnnualCalendarPreviewScopes([
      {
        blockType: 'annualCalendar',
        classifications: ['academic'],
        periodMode: 'currentYear',
      },
      {
        blockType: 'annualCalendar',
        classifications: ['academic'],
        periodEndDate: '2027-06-02T00:00:00.000Z',
        periodMode: 'customAcademicYear',
        periodStartDate: '2026-07-15T00:00:00.000Z',
      },
    ] as never)

    expect(scopes).toHaveLength(2)
    expect(scopes.map(({ key }) => key)).toEqual([
      '[["academic"],"currentYear",null,null]',
      '[["academic"],"customAcademicYear","2026-07-15T00:00:00.000Z","2027-06-02T00:00:00.000Z"]',
    ])
  })

  it('renders a twelve-month stream, current month, today, links, and Coming Next', () => {
    const { container } = render(
      <AnnualCalendarBlockPresentation
        initial={initial}
        title="Academic calendar"
        upcomingTitle="Coming next"
      />,
    )

    expect(container.querySelector('[data-annual-calendar-block="true"]')).toBeTruthy()
    expect(container.querySelector('[data-annual-calendar-stream="true"]')).toBeTruthy()
    expect(container.querySelector('[data-annual-calendar-ledger="true"]')).toBeNull()
    expect(container.querySelector('[data-annual-calendar-spine="true"]')).toBeTruthy()
    expect(container.querySelectorAll('[data-annual-calendar-month-divider="true"]')).toHaveLength(
      11,
    )
    expect(container.querySelectorAll('[data-annual-calendar-marker="true"]')).toHaveLength(12)
    expect(container.querySelector('[data-annual-calendar-marker="true"]')?.className).toContain(
      'size-2.5',
    )
    expect(container.querySelector('[data-annual-calendar-spine="true"]')?.className).toContain(
      'left-[0.28125rem]',
    )
    expect(container.textContent).toContain('Calendar year 2026')
    expect(container.textContent).toContain('2 events')
    expect(container.querySelectorAll('[data-annual-calendar-month="true"]')).toHaveLength(12)
    const currentMonth = container.querySelector('[data-current-month="true"]')
    expect(currentMonth?.textContent).toContain('August')
    expect(currentMonth?.textContent).not.toContain('2026')
    expect(currentMonth?.textContent?.indexOf('Current')).toBeLessThan(
      currentMonth?.textContent?.indexOf('August') ?? 0,
    )
    expect(container.querySelectorAll('[data-annual-calendar-event="true"]')).toHaveLength(2)
    expect(container.querySelector('[data-annual-calendar-empty="true"]')?.className).not.toContain(
      'min-h-24',
    )
    expect(container.querySelector('[data-annual-calendar-empty="true"]')?.textContent).toContain(
      'No events are scheduled for this month.',
    )
    expect(container.querySelector('[data-today="true"]')?.textContent).toContain('Event today')
    expect(container.querySelectorAll('a[href^="/news-events/"]')).toHaveLength(3)
    expect(container.textContent).toContain('Coming next')
    expect(container.querySelector('[aria-label="Event classification legend"]')).toBeNull()
  })

  it('uses singular and zero event summary copy', () => {
    const singular = renderToStaticMarkup(
      <AnnualCalendarBlockPresentation initial={{ ...initial, eventCount: 1 }} />,
    )
    const empty = renderToStaticMarkup(
      <AnnualCalendarBlockPresentation initial={{ ...initial, eventCount: 0 }} />,
    )

    expect(singular).toContain('1 event')
    expect(singular).not.toContain('1 events')
    expect(empty).toContain('0 events')
  })

  it('renders a configured PDF after Coming Next and hides unresolved Media', () => {
    const { container, rerender } = render(
      <AnnualCalendarBlockPresentation
        calendarPdfAction={[
          {
            file: calendarPdf,
            fileBehavior: 'download',
            label: 'Get PDF',
            linkType: 'file',
            variant: 'outline',
          },
        ]}
        calendarPdfTitle="Academic year 2026–27"
        initial={initial}
      />,
    )

    const layout = container.querySelector('[data-annual-calendar-layout="true"]')
    const sidebar = container.querySelector('[data-calendar-sidebar="true"]')
    const upcoming = container.querySelector('[data-annual-calendar-upcoming="true"]')
    const download = container.querySelector('[data-calendar-pdf-download="true"]')
    const link = download?.querySelector('a')

    expect(layout?.className).toContain('lg:items-stretch')
    expect(sidebar?.className).toContain('lg:h-full')
    expect(sidebar?.className).not.toContain('sticky')
    expect(upcoming).toBeTruthy()
    expect(download).toBeTruthy()
    expect(download?.className).toContain('lg:mt-auto')
    expect(
      upcoming && download
        ? upcoming.compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING
        : 0,
    ).not.toBe(0)
    expect(link?.getAttribute('href')).toBe('/media/academic-calendar-2026-27.pdf')
    expect(link?.getAttribute('download')).toBe('academic-calendar-2026-27.pdf')
    expect(download?.querySelector('[data-action-indicator="download"]')).toBeTruthy()
    expect(download?.querySelector('[data-calendar-pdf-title="true"]')?.textContent).toBe(
      'Academic year 2026–27',
    )
    expect(download?.querySelector('[data-calendar-pdf-icon="true"]')).toBeTruthy()
    expect(link?.textContent).toContain('Get PDF')
    expect(link?.textContent).not.toContain('Academic year 2026–27')
    expect(download?.className).toContain('flex-col')
    expect(download?.className).not.toContain('sm:flex-row')
    expect(download?.querySelector('[data-calendar-pdf-title="true"]')?.className).toContain(
      'break-words',
    )
    expect(link?.className).toContain('w-full')

    rerender(
      <AnnualCalendarBlockPresentation
        calendarPdfAction={[
          {
            label: 'View schedule',
            linkType: 'page',
            mode: 'button',
            page: { id: 'schedule-page', parent: null, slug: 'schedule' } as Page,
            showArrow: true,
            variant: 'secondary',
          },
        ]}
        calendarPdfTitle="Academic year 2026–27"
        initial={initial}
      />,
    )

    const pageButton = container.querySelector('[data-calendar-pdf-download="true"] a')
    expect(pageButton?.getAttribute('href')).toBe('/schedule')
    expect(pageButton?.getAttribute('data-slot')).toBe('button')
    expect(pageButton?.getAttribute('data-variant')).toBe('secondary')
    expect(pageButton?.className).toContain('w-full')
    expect(pageButton?.querySelector('[data-action-arrow="true"]')).toBeTruthy()

    rerender(
      <AnnualCalendarBlockPresentation
        calendarPdfAction={[]}
        calendarPdf="calendar-pdf"
        initial={initial}
      />,
    )
    expect(container.querySelector('[data-calendar-pdf-download="true"]')).toBeNull()
  })

  it('uses shared section typography and semantic light/brand surface classes', () => {
    const light = renderToStaticMarkup(
      <AnnualCalendarBlockPresentation
        appearance={{ background: 'subtle', border: 'topAndBottom' }}
        initial={initial}
        title="Academic calendar"
      />,
    )
    const brand = renderToStaticMarkup(
      <AnnualCalendarBlockPresentation
        appearance={{ background: 'brand', border: 'none' }}
        initial={initial}
        title="Academic calendar"
      />,
    )
    const brandWithPdf = renderToStaticMarkup(
      <AnnualCalendarBlockPresentation
        appearance={{ background: 'brand', border: 'none' }}
        calendarPdf={calendarPdf}
        initial={initial}
      />,
    )

    expect(light).toContain('font-display')
    expect(light).toContain('bg-subtle')
    expect(light).toContain('border-border')
    expect(brand).toContain('bg-brand')
    expect(brand).toContain('text-primary-foreground')
    expect(brandWithPdf).toContain('data-block-surface="brand"')
    expect(brandWithPdf).toContain('data-variant="outline"')
    expect(`${light}${brand}${brandWithPdf}`).not.toMatch(/#[0-9a-f]{3,8}/i)
  })
})
