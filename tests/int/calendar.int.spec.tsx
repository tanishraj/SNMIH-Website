import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Field } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CalendarClient } from '@/blocks/Calendar/CalendarClient'
import { CalendarMonthView } from '@/blocks/Calendar/CalendarMonthView'
import { CalendarBlockPresentation } from '@/blocks/Calendar/Presentation'
import { CalendarTimelineView } from '@/blocks/Calendar/CalendarTimelineView'
import {
  buildCalendarGrid,
  getCalendarClassificationIDs,
  normalizeCalendarAdjacentMonthDates,
  type CalendarEvent,
  type CalendarInitialSnapshot,
} from '@/blocks/Calendar/calendarShared'
import { CalendarBlock } from '@/blocks/Calendar/config'
import { getCalendarPreviewScopes } from '@/lib/newsEventsPreviewShared'
import type { Media } from '@/payload-types'

const classification = {
  badgeLabel: 'Academic',
  calendarColor: 'green' as const,
  id: 'academic',
  slug: 'academic',
  title: 'Academic',
}
const event = (id: string, dateKey = '2026-08-23'): CalendarEvent => ({
  allDay: false,
  classification,
  endDateKey: dateKey,
  eventStart: `${dateKey}T04:30:00.000Z`,
  href: `/news-events/${id}`,
  id,
  rangeLabel: 'Aug 23, 2026, 10:00 AM IST',
  startDateKey: dateKey,
  timeLabel: '10:00 AM IST',
  title: `Event ${id}`,
})
const initial: CalendarInitialSnapshot = {
  classifications: [classification],
  month: {
    events: [event('one'), event('two'), event('three'), event('four')],
    monthKey: '2026-08',
    monthLabel: 'August 2026',
    version: 1,
  },
  timeZone: 'Asia/Kolkata',
  todayKey: '2026-08-23',
  upcoming: [event('one')],
}
const calendarPdf = {
  filename: 'academic-calendar-2026-27.pdf',
  id: 'calendar-pdf',
  mimeType: 'application/pdf',
  url: '/media/academic-calendar-2026-27.pdf',
} as Media
const crossingEvent: CalendarEvent = {
  ...event('crossing', '2026-07-31'),
  endDateKey: '2026-08-02',
  rangeLabel: 'Jul 31–Aug 2, 2026',
}

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

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Calendar block', () => {
  it('defines a bounded, sortable Event-classification scope', () => {
    expect(CalendarBlock).toMatchObject({
      interfaceName: 'CalendarBlock',
      labels: { plural: 'Calendars', singular: 'Calendar' },
      slug: 'calendar',
    })
    expect(findNamedField(CalendarBlock.fields, 'classifications')).toMatchObject({
      hasMany: true,
      maxRows: 5,
      minRows: 1,
      relationTo: 'news-event-classifications',
      required: true,
    })
    expect(findNamedField(CalendarBlock.fields, 'adjacentMonthDates')).toMatchObject({
      defaultValue: 'muted',
      options: [
        { label: 'Muted / Disabled', value: 'muted' },
        { label: 'Hidden', value: 'hidden' },
      ],
      required: true,
      type: 'select',
    })
    expect(getCalendarClassificationIDs(['a', { id: 'b' }, 'a', null])).toEqual(['a', 'b'])
  })

  it('normalizes missing and invalid adjacent-month settings to muted', () => {
    expect(normalizeCalendarAdjacentMonthDates('hidden')).toBe('hidden')
    expect(normalizeCalendarAdjacentMonthDates('muted')).toBe('muted')
    expect(normalizeCalendarAdjacentMonthDates(undefined)).toBe('muted')
    expect(normalizeCalendarAdjacentMonthDates('unknown')).toBe('muted')
  })

  it('builds a fixed Sunday-first six-week grid', () => {
    expect(buildCalendarGrid('2026-08')).toHaveLength(42)
    expect(buildCalendarGrid('2026-08')[0]?.dateKey).toBe('2026-07-26')
  })

  it('discovers ordered Calendar scopes through populated Reusable Sections', () => {
    const nested = [
      {
        blockType: 'reusableSection',
        section: {
          layout: [
            { blockType: 'calendar', classifications: ['academic', { id: 'exam' }] },
            { blockType: 'calendar', classifications: ['academic', { id: 'exam' }] },
          ],
        },
      },
    ]
    expect(getCalendarPreviewScopes(nested as never)).toEqual([
      { classificationIDs: ['academic', 'exam'], key: JSON.stringify(['academic', 'exam']) },
    ])
  })

  it('renders semantic month cells, complete links, and a capped more control', () => {
    const onShowMore = vi.fn()
    render(
      <CalendarMonthView
        events={initial.month.events}
        monthKey="2026-08"
        onShowMore={onShowMore}
        todayKey="2026-08-23"
      />,
    )
    expect(screen.getByRole('table')).toBeTruthy()
    expect(screen.getAllByRole('link', { name: /Academic:/ })).toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Show 2 more events on August 23, 2026' }))
    expect(onShowMore).toHaveBeenCalledWith('2026-08-23')
  })

  it('shows adjacent dates as muted and never renders their events', () => {
    const { container } = render(
      <CalendarMonthView
        adjacentMonthDates="muted"
        events={[crossingEvent]}
        monthKey="2026-08"
        onShowMore={vi.fn()}
        surface="light"
        todayKey="2026-07-31"
      />,
    )

    const adjacent = container.querySelector('[data-calendar-date="2026-07-31"]')
    expect(adjacent?.getAttribute('data-adjacent-month-date')).toBe('muted')
    expect(adjacent?.querySelector('time')).toBeTruthy()
    expect(adjacent?.querySelector('[data-calendar-event]')).toBeNull()
    expect(adjacent?.className).not.toContain('shadow-[inset_0_3px_0_var(--primary)]')
  })

  it('hides adjacent dates while preserving their grid cells', () => {
    const { container } = render(
      <CalendarMonthView
        adjacentMonthDates="hidden"
        events={[crossingEvent]}
        monthKey="2026-08"
        onShowMore={vi.fn()}
        surface="brand"
        todayKey="2026-08-23"
      />,
    )

    const adjacent = container.querySelector('[data-calendar-date="2026-07-31"]')
    expect(adjacent).toBeTruthy()
    expect(adjacent?.getAttribute('data-adjacent-month-date')).toBe('hidden')
    expect(adjacent?.getAttribute('aria-hidden')).toBe('true')
    expect(adjacent?.querySelector('time')).toBeNull()
    expect(adjacent?.querySelector('[data-calendar-event]')).toBeNull()
  })

  it('renders each timeline event once and omits time for all-day entries', () => {
    const html = renderToStaticMarkup(
      <CalendarTimelineView
        emptyMessage="No events"
        events={[{ ...event('all-day'), allDay: true, timeLabel: undefined }]}
      />,
    )
    expect(html).toContain('August 23, 2026')
    expect(html).toContain('All day')
    expect(html).not.toContain('10:00 AM IST')
  })

  it('switches to Timeline and transfers focus from the more control', async () => {
    render(
      <CalendarClient
        emptyMessage="No events"
        initial={initial}
        upcomingEyebrow="Up next"
        upcomingTitle="Upcoming"
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Show 2 more events on August 23, 2026' }))
    const heading = await screen.findByRole('heading', { name: 'August 23, 2026' })
    expect(document.activeElement).toBe(heading)
    expect(screen.getByText('Upcoming')).toBeTruthy()
  })

  it('uses Tabs for views and a grouped Select for event classification', () => {
    render(
      <CalendarClient
        emptyMessage="No events"
        initial={initial}
        upcomingEyebrow="Up next"
        upcomingTitle="Upcoming"
      />,
    )

    const tablist = screen.getByRole('tablist', { name: 'Calendar view' })
    const select = screen.getByLabelText('Filter events by classification')
    const monthLabel = screen.getByText('August 2026')

    expect(tablist).toBeTruthy()
    expect(tablist.className).toContain('h-11')
    expect(tablist.className).toContain('border')
    expect(tablist.getAttribute('data-variant')).toBe('default')
    expect(select.className).toContain('h-11')
    expect(monthLabel.parentElement?.className).toContain(
      'grid-cols-[2.75rem_minmax(9rem,1fr)_2.75rem]',
    )
    expect(screen.getByRole('tab', { name: 'Calendar' }).getAttribute('aria-selected')).toBe('true')
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Timeline' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }))
    expect(screen.getByRole('tab', { name: 'Timeline' }).getAttribute('aria-selected')).toBe('true')
    expect(select.getAttribute('data-slot')).toBe('select-trigger')
  })

  it('renders the configured PDF below Upcoming and hides unresolved Media', () => {
    const { container, rerender } = render(
      <CalendarBlockPresentation
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

    const layout = container.querySelector('[data-calendar-layout="true"]')
    const sidebar = container.querySelector('[data-calendar-sidebar="true"]')
    const upcoming = container.querySelector('[data-calendar-upcoming="true"]')
    const download = container.querySelector('[data-calendar-pdf-download="true"]')
    expect(layout?.className).toContain('lg:items-stretch')
    expect(sidebar?.className).toContain('lg:h-full')
    expect(sidebar?.getAttribute('aria-label')).toBe('Upcoming calendar sidebar')
    expect(upcoming).toBeTruthy()
    expect(upcoming?.tagName).toBe('DIV')
    expect(download).toBeTruthy()
    expect(download?.className).toContain('lg:mt-auto')
    expect(download?.getAttribute('data-calendar-pdf-embedded')).toBe('true')
    expect(download?.querySelector('[data-action-indicator="download"]')).toBeTruthy()
    expect(
      upcoming && download
        ? upcoming.compareDocumentPosition(download) & Node.DOCUMENT_POSITION_FOLLOWING
        : 0,
    ).not.toBe(0)
    expect(download?.querySelector('a')?.getAttribute('href')).toBe(
      '/media/academic-calendar-2026-27.pdf',
    )

    rerender(
      <CalendarBlockPresentation
        calendarPdfAction={[
          {
            label: 'View admissions',
            linkType: 'custom',
            mode: 'link',
            url: '/admissions',
          },
        ]}
        calendarPdfTitle="Academic year 2026–27"
        initial={initial}
      />,
    )

    const editorialLink = container.querySelector('[data-calendar-pdf-download="true"] a')
    expect(editorialLink?.getAttribute('data-content-link')).toBe('true')
    expect(editorialLink?.getAttribute('href')).toBe('/admissions')
    expect(editorialLink?.getAttribute('download')).toBeNull()

    rerender(
      <CalendarBlockPresentation
        calendarPdfAction={[]}
        calendarPdf="calendar-pdf"
        initial={initial}
      />,
    )
    expect(container.querySelector('[data-calendar-pdf-download="true"]')).toBeNull()
  })

  it('renders the month-loading failure through a recoverable Alert', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    render(
      <CalendarClient
        emptyMessage="No events"
        initial={initial}
        upcomingEyebrow="Up next"
        upcomingTitle="Upcoming"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Show next month, September 2026' }))
    expect((await screen.findByRole('alert')).textContent).toContain(
      'We could not load that month. Your current events are still shown.',
    )
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })
})
