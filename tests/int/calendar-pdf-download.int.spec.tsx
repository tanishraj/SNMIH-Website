import { render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import type { ArrayField, Field, TabsField } from 'payload'
import { describe, expect, it } from 'vitest'

import { AnnualCalendarBlock } from '@/blocks/AnnualCalendar/config'
import { CalendarBlock } from '@/blocks/Calendar/config'
import { CalendarUpcoming } from '@/blocks/Calendar/CalendarUpcoming'
import { CalendarPdfDownload } from '@/blocks/shared/CalendarPdfDownload'
import { CalendarSidebar } from '@/blocks/shared/CalendarSidebar'
import { resolveCalendarDownloadPanel, resolveCalendarPdf } from '@/blocks/shared/calendarPdf'
import { createCalendarDownloadPanelFields } from '@/blocks/shared/calendarPdfFields'
import type { Media, Page } from '@/payload-types'

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

const pdf = {
  filename: 'academic-calendar-2026-27.pdf',
  id: 'calendar-pdf',
  mimeType: 'application/pdf',
  url: '/media/academic-calendar-2026-27.pdf',
} as Media

const page = {
  id: 'admissions-page',
  parent: null,
  slug: 'admissions',
} as Page

const document = {
  filename: 'academic-calendar.ics',
  id: 'calendar-file',
  mimeType: 'text/calendar',
  url: '/media/academic-calendar.ics',
} as Media

describe('shared calendar PDF contract', () => {
  it('keeps generated Calendar actions aligned with the complete shared action', () => {
    const source = readFileSync('src/payload-types.ts', 'utf8')
    const definitions = [
      ...source.matchAll(/calendarPdfAction\?:([\s\S]*?)\n  calendarPdf\?:/g),
    ].map((match) => match[1])

    expect(definitions.length).toBeGreaterThanOrEqual(2)
    for (const definition of definitions) {
      expect(definition).toContain('page?:')
      expect(definition).toContain('url?:')
      expect(definition).toContain('openInNewTab?:')
      expect(definition).toContain('file?:')
      expect(definition).toContain('fileBehavior?:')
      expect(definition).toContain('openFileInNewTab?:')
      expect(definition).toContain('mode?:')
      expect(definition).toContain('showArrow?:')
      expect(definition).toContain('showFileIcon?:')
      expect(definition).toContain('fileIconPosition?:')
    }
    expect(source.match(/calendarPdf\?:/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
    expect(source.match(/calendarPdfLabel\?:/g)?.length ?? 0).toBeGreaterThanOrEqual(2)
  })

  it('defines one normal shared action inside the Download Panel', () => {
    const fields = createCalendarDownloadPanelFields()
    const panel = fields[0]
    const title = findNamedField(fields, 'calendarPdfTitle')
    const action = findNamedField(fields, 'calendarPdfAction') as ArrayField
    const actionTabs = (action.fields[0] as TabsField).tabs
    const content = actionTabs.find(({ label }) => label === 'Content')?.fields ?? []
    const theme = actionTabs.find(({ label }) => label === 'Theme Settings')?.fields ?? []
    const named = (field: Field) => ('name' in field ? field.name : undefined)
    const legacyPdf = findNamedField(fields, 'calendarPdf')
    const legacyLabel = findNamedField(fields, 'calendarPdfLabel')

    expect(panel).toMatchObject({
      label: 'Download Panel',
      type: 'collapsible',
      admin: { initCollapsed: true },
    })
    expect(title).toMatchObject({
      defaultValue: 'Academic calendar PDF',
      label: 'PDF Document Label',
      type: 'text',
    })
    expect(action).toMatchObject({
      label: 'Action',
      maxRows: 1,
      name: 'calendarPdfAction',
      type: 'array',
    })
    expect(content.map(named)).toEqual([
      'label',
      'linkType',
      'page',
      'url',
      'openInNewTab',
      'file',
      'fileBehavior',
      'openFileInNewTab',
    ])
    expect(theme.map(named)).toEqual([
      'mode',
      'variant',
      'showArrow',
      'showFileIcon',
      'fileIconPosition',
    ])
    expect(findNamedField(content, 'linkType')).toMatchObject({
      defaultValue: 'page',
      options: [
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
        { label: 'File', value: 'file' },
      ],
    })
    expect(
      (findNamedField(content, 'file') as Field & { filterOptions?: unknown }).filterOptions,
    ).toBeUndefined()
    expect(findNamedField(content, 'fileBehavior')).toMatchObject({
      defaultValue: 'view',
      options: [
        { label: 'View', value: 'view' },
        { label: 'Download', value: 'download' },
      ],
    })
    expect(findNamedField(theme, 'mode')).toMatchObject({ defaultValue: 'link' })
    expect(legacyPdf).toMatchObject({ admin: { hidden: true }, type: 'upload' })
    expect(legacyLabel).toMatchObject({ admin: { hidden: true }, type: 'text' })
  })

  it('resolves only populated PDF Media and normalizes labels', () => {
    expect(resolveCalendarPdf(pdf, ' Academic year calendar ', ' Save PDF ')).toEqual({
      filename: 'academic-calendar-2026-27.pdf',
      href: '/media/academic-calendar-2026-27.pdf',
      label: 'Save PDF',
      title: 'Academic year calendar',
    })
    expect(resolveCalendarPdf(pdf, '   ', '   ')).toMatchObject({
      label: 'Download',
      title: 'Academic calendar PDF',
    })
    expect(resolveCalendarPdf('calendar-pdf')).toBeUndefined()
    expect(resolveCalendarPdf({ ...pdf, mimeType: 'image/jpeg' } as Media)).toBeUndefined()
    expect(resolveCalendarPdf({ ...pdf, url: null } as Media)).toBeUndefined()
  })

  it.each([
    ['Calendar', CalendarBlock],
    ['Annual Calendar', AnnualCalendarBlock],
  ])('registers the shared Download Panel in %s', (_label, block) => {
    expect(findNamedField(block.fields, 'calendarPdfAction')).toMatchObject({
      label: 'Action',
      maxRows: 1,
      type: 'array',
    })
    expect(findNamedField(block.fields, 'calendarPdfTitle')).toMatchObject({
      defaultValue: 'Academic calendar PDF',
    })
  })

  it('preserves Page and Custom URL action choices', () => {
    expect(
      resolveCalendarDownloadPanel({
        actions: [
          {
            label: 'View admissions',
            linkType: 'page',
            mode: 'link',
            page,
            variant: 'default',
          },
        ],
      }),
    ).toMatchObject({
      action: {
        href: '/admissions',
        label: 'View admissions',
        mode: 'link',
        variant: 'default',
      },
    })

    expect(
      resolveCalendarDownloadPanel({
        actions: [
          {
            label: 'See deadlines',
            linkType: 'custom',
            mode: 'button',
            openInNewTab: true,
            showArrow: true,
            url: '/deadlines',
            variant: 'secondary',
          },
        ],
      }),
    ).toMatchObject({
      action: {
        href: '/deadlines',
        label: 'See deadlines',
        mode: 'button',
        openInNewTab: true,
        showArrow: true,
        variant: 'secondary',
      },
    })
  })

  it('preserves File View and File Download behavior', () => {
    expect(
      resolveCalendarDownloadPanel({
        actions: [
          {
            file: document,
            fileBehavior: 'view',
            label: 'View calendar feed',
            linkType: 'file',
            mode: 'link',
            openFileInNewTab: true,
          },
        ],
      })?.action,
    ).toMatchObject({
      download: undefined,
      href: '/media/academic-calendar.ics',
      indicator: undefined,
      mode: 'link',
      openInNewTab: true,
    })

    expect(
      resolveCalendarDownloadPanel({
        actions: [
          {
            file: document,
            fileBehavior: 'download',
            fileIconPosition: 'right',
            label: 'Download calendar feed',
            linkType: 'file',
            mode: 'button',
            showFileIcon: true,
            variant: 'outline',
          },
        ],
      })?.action,
    ).toMatchObject({
      download: 'academic-calendar.ics',
      href: '/media/academic-calendar.ics',
      indicator: 'download',
      indicatorPosition: 'right',
      mode: 'button',
    })
  })

  it('keeps preceding restricted rows as Buttons when mode is absent', () => {
    expect(
      resolveCalendarDownloadPanel({
        actions: [
          {
            file: pdf,
            fileBehavior: 'download',
            label: 'Download PDF',
            linkType: 'file',
            variant: 'outline',
          },
        ],
      })?.action,
    ).toMatchObject({ mode: 'button', variant: 'outline' })
  })

  it('uses legacy PDF data only when the new action is empty', () => {
    expect(
      resolveCalendarDownloadPanel({
        actions: [],
        legacyLabel: 'Download legacy PDF',
        legacyMedia: pdf,
        title: 'Legacy academic calendar',
      }),
    ).toMatchObject({
      action: {
        indicator: 'download',
        indicatorPosition: 'left',
        label: 'Download legacy PDF',
        mode: 'button',
        variant: 'outline',
      },
      title: 'Legacy academic calendar',
    })

    expect(
      resolveCalendarDownloadPanel({
        actions: [{ label: 'Invalid page', linkType: 'page', page: 'page-id' }],
        legacyMedia: pdf,
      }),
    ).toBeUndefined()
  })

  it('renders a stacked semantic panel with a full-width action', () => {
    const { container } = render(
      <CalendarPdfDownload
        download={{
          action: {
            download: 'academic-calendar.pdf',
            href: '/media/academic-calendar.pdf',
            indicator: 'download',
            indicatorPosition: 'left',
            label: 'Download PDF',
            mode: 'button',
            openInNewTab: false,
            showArrow: false,
            variant: 'outline',
          },
          title: 'Academic calendar document with a long wrapping title',
        }}
        surface="brand"
      />,
    )

    const panel = container.querySelector('[data-calendar-pdf-download="true"]')
    const link = panel?.querySelector('a')
    expect(panel?.className).toContain('flex-col')
    expect(panel?.className).not.toContain('sm:flex-row')
    expect(panel?.querySelector('[data-calendar-pdf-title="true"]')?.className).toContain(
      'break-words',
    )
    expect(panel?.querySelector('[data-action-indicator="download"]')).toBeTruthy()
    expect(link?.className).toContain('w-full')
    expect(link?.getAttribute('download')).toBe('academic-calendar.pdf')
    expect(link?.getAttribute('data-slot')).toBe('button')
    expect(link?.getAttribute('data-variant')).toBe('outline')
    expect(link?.textContent).toContain('Download PDF')
    expect(panel?.className).toContain('border-primary-foreground/20')
  })

  it('renders a generic editorial Link without Button or download semantics', () => {
    const { container } = render(
      <CalendarPdfDownload
        download={{
          action: {
            href: '/admissions',
            label: 'View admissions',
            mode: 'link',
            openInNewTab: false,
            showArrow: false,
            variant: 'default',
          },
          title: 'Academic calendar PDF',
        }}
      />,
    )

    const link = container.querySelector('[data-content-link="true"]')
    expect(link?.getAttribute('href')).toBe('/admissions')
    expect(link?.getAttribute('download')).toBeNull()
    expect(link?.getAttribute('data-slot')).toBeNull()
    expect(link?.className).not.toContain('w-full')
    expect(link?.parentElement?.className).not.toContain('[&>a]:w-full')
  })

  it('composes one labelled full-height sidebar and pins an embedded PDF region', () => {
    const { container } = render(
      <CalendarSidebar
        download={{
          action: {
            download: 'calendar.pdf',
            href: '/calendar.pdf',
            indicator: 'download',
            indicatorPosition: 'left',
            label: 'Download',
            mode: 'button',
            openInNewTab: false,
            showArrow: false,
            variant: 'outline',
          },
          title: 'Academic calendar PDF',
        }}
        label="Upcoming"
        surface="light"
      >
        <CalendarUpcoming
          classifications={[]}
          embedded
          emptyMessage="No events"
          eyebrow="Up next"
          events={[]}
          showLegend={false}
          title="Upcoming"
        />
      </CalendarSidebar>,
    )

    const sidebar = container.querySelector('[data-calendar-sidebar="true"]')
    const upcoming = sidebar?.querySelector('[data-calendar-upcoming="true"]')
    const download = sidebar?.querySelector('[data-calendar-pdf-download="true"]')

    expect(sidebar?.tagName).toBe('ASIDE')
    expect(sidebar?.getAttribute('aria-label')).toBe('Upcoming calendar sidebar')
    expect(sidebar?.className).toContain('lg:h-full')
    expect(upcoming?.tagName).toBe('DIV')
    expect(upcoming?.getAttribute('data-calendar-upcoming-embedded')).toBe('true')
    expect(download?.getAttribute('data-calendar-pdf-embedded')).toBe('true')
    expect(download?.className).toContain('lg:mt-auto')
    expect(download?.className).toContain('border-t')
  })
})
