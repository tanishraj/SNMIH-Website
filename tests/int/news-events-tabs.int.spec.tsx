import { readFileSync } from 'node:fs'

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Block, Field } from 'payload'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { NewsEventsTabsClient } from '@/blocks/NewsEventsTabs/NewsEventsTabsClient'
import { NewsEventsTabsPreviewBlockComponent } from '@/blocks/NewsEventsTabs/PreviewComponent'
import { NewsEventsTabsRow } from '@/blocks/NewsEventsTabs/NewsEventsTabsRow'
import { NewsEventsTabsBlockPresentation } from '@/blocks/NewsEventsTabs/Presentation'
import { NewsEventsTabsBlock } from '@/blocks/NewsEventsTabs/config'
import {
  getNewsEventsTabsGridClasses,
  getNewsEventsTabsClassificationRelationshipIDs,
  isNewsEventsTabsItemsPerTab,
  normalizeNewsEventsTabsCardsPerRow,
  normalizeNewsEventsTabsItemsPerTab,
  normalizeNewsEventsTabsLayoutStyle,
  NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS,
  resolveNewsEventsTabs,
  resolveNewsEventsTabsLoadMoreLabel,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'
import {
  getNewsEventsTabsPreviewGroupCounts,
  getNewsEventsTabsPreviewGroupKey,
  getNewsEventsTabsPreviewGroupScopes,
} from '@/lib/newsEventsPreviewShared'
import {
  createEmptyNewsEventGroups,
  type PublicNewsEventCard,
  type PublicNewsEventGroups,
} from '@/lib/newsEventsShared'

const newsClassification = {
  active: true,
  badgeLabel: 'News',
  behavior: 'story' as const,
  calendarColor: 'blue' as const,
  id: 'classification-news',
  legacyValue: 'news' as const,
  slug: 'news',
  title: 'News',
}

const eventClassification = {
  active: true,
  badgeLabel: 'Event',
  behavior: 'event' as const,
  calendarColor: 'blue' as const,
  id: 'classification-event',
  legacyValue: 'event' as const,
  slug: 'events',
  title: 'Events',
}

const noticeClassification = {
  active: true,
  badgeLabel: 'Notice',
  behavior: 'story' as const,
  calendarColor: 'blue' as const,
  id: 'classification-notice',
  legacyValue: 'notice' as const,
  slug: 'notice',
  title: 'Campus notices',
}

const holidayClassification = {
  active: true,
  badgeLabel: 'Holiday',
  behavior: 'story' as const,
  calendarColor: 'blue' as const,
  id: 'classification-holiday',
  legacyValue: 'holiday' as const,
  slug: 'holiday',
  title: 'Closures',
}

const selectedClassifications = [
  newsClassification,
  eventClassification,
  noticeClassification,
  holidayClassification,
]

const baseCard: PublicNewsEventCard = {
  behavior: 'story',
  classification: newsClassification,
  contentType: 'news',
  dateISO: '2026-08-17T00:00:00.000Z',
  dateLabel: 'Aug 17, 2026',
  excerpt: 'A current update.',
  href: '/news-events/current-update',
  id: 'current-update',
  isPastEvent: false,
  slug: 'current-update',
  title: 'Current update',
}

const groups: PublicNewsEventGroups = createEmptyNewsEventGroups()
groups.all = { docs: [baseCard], hasNextPage: false, page: 1 }
groups[holidayClassification.id] = {
  docs: [
    {
      ...baseCard,
      classification: holidayClassification,
      contentType: 'holiday',
      href: '/news-events/campus-holiday',
      id: 'campus-holiday',
      slug: 'campus-holiday',
      title: 'Campus holiday',
    },
  ],
  hasNextPage: false,
  page: 1,
}
groups[noticeClassification.id] = {
  docs: [
    {
      ...baseCard,
      classification: noticeClassification,
      contentType: 'notice',
      href: '/news-events/research-notice',
      id: 'research-notice',
      slug: 'research-notice',
      title: 'Research notice',
    },
  ],
  hasNextPage: false,
  page: 1,
}

const baseClientProps = {
  cardsPerRow: '3' as const,
  emptyStateMessage: 'No entries in this classification.',
  eventActionLabel: 'View details',
  groups,
  itemsPerTab: 6 as const,
  layoutStyle: 'cardGrid' as const,
  loadMoreLabel: 'Load More',
  newsActionLabel: 'Read update',
  tabs: resolveNewsEventsTabs(null, selectedClassifications),
  variant: 'underline' as const,
}

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

const findNamedField = (value: unknown, name: string): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.name === name) return record

    for (const child of Object.values(record)) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  return undefined
}

const collectBlocks = (fields: Field[]): Block[] =>
  fields.flatMap((field) => {
    if (field.type === 'blocks') return field.blocks
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => collectBlocks(tab.fields))
    }
    if ('fields' in field && Array.isArray(field.fields)) return collectBlocks(field.fields)
    return []
  })

describe('News & Events Tabs', () => {
  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('defines a standalone reusable block with bounded layout controls', () => {
    expect(NewsEventsTabsBlock).toMatchObject({
      interfaceName: 'NewsEventsTabsBlock',
      slug: 'newsEventsTabs',
    })
    expect(findNamedField(NewsEventsTabsBlock.fields, 'allTabLabel')).toMatchObject({
      defaultValue: 'All',
      type: 'text',
    })
    expect(findNamedField(NewsEventsTabsBlock.fields, 'classifications')).toMatchObject({
      filterOptions: { active: { equals: true } },
      hasMany: true,
      maxRows: NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS,
      relationTo: 'news-event-classifications',
      type: 'relationship',
      admin: {
        allowCreate: true,
        isSortable: true,
      },
    })
    expect(findNamedField(NewsEventsTabsBlock.fields, 'tabs')).toBeUndefined()
    expect(findNamedField(NewsEventsTabsBlock.fields, 'itemsPerTab')).toMatchObject({
      admin: {
        description:
          'Number of published entries shown initially and appended by each Load More request.',
      },
      defaultValue: '6',
      options: [
        { label: '3', value: '3' },
        { label: '6', value: '6' },
        { label: '9', value: '9' },
        { label: '12', value: '12' },
      ],
      required: true,
      type: 'select',
    })
    expect(findNamedField(NewsEventsTabsBlock.fields, 'loadMoreLabel')).toMatchObject({
      defaultValue: 'Load More',
      label: 'Load More Label',
      type: 'text',
    })
    expect(findNamedField(NewsEventsTabsBlock.fields, 'layoutStyle')).toMatchObject({
      defaultValue: 'cardGrid',
      options: [
        { label: 'Card Grid', value: 'cardGrid' },
        { label: 'Editorial List', value: 'editorialList' },
      ],
      required: true,
      type: 'select',
    })
    expect(findNamedField(NewsEventsTabsBlock.fields, 'tabVariant')).toMatchObject({
      defaultValue: 'underline',
      options: [
        { label: 'Contained', value: 'contained' },
        { label: 'Pill', value: 'pill' },
        { label: 'Underline', value: 'underline' },
      ],
      required: true,
      type: 'select',
    })
    const cardsPerRowField = findNamedField(NewsEventsTabsBlock.fields, 'cardsPerRow')
    expect(cardsPerRowField).toMatchObject({
      defaultValue: '3',
      options: [
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '4', value: '4' },
      ],
      required: true,
      type: 'radio',
    })
    const cardsPerRowCondition = (
      cardsPerRowField?.admin as
        | {
            condition?: (data: unknown, siblingData: { layoutStyle?: string }) => boolean
          }
        | undefined
    )?.condition
    expect(cardsPerRowCondition?.({}, { layoutStyle: 'cardGrid' })).toBe(true)
    expect(cardsPerRowCondition?.({}, { layoutStyle: 'editorialList' })).toBe(false)
  })

  it('normalizes stored item and column values', () => {
    expect(normalizeNewsEventsTabsItemsPerTab('3')).toBe(3)
    expect(normalizeNewsEventsTabsItemsPerTab(9)).toBe(9)
    expect(normalizeNewsEventsTabsItemsPerTab('12')).toBe(12)
    expect(normalizeNewsEventsTabsItemsPerTab('invalid')).toBe(6)
    expect(normalizeNewsEventsTabsCardsPerRow('2')).toBe('2')
    expect(normalizeNewsEventsTabsCardsPerRow('invalid')).toBe('3')
    expect(normalizeNewsEventsTabsLayoutStyle('editorialList')).toBe('editorialList')
    expect(normalizeNewsEventsTabsLayoutStyle('cardGrid')).toBe('cardGrid')
    expect(normalizeNewsEventsTabsLayoutStyle('invalid')).toBe('cardGrid')
    expect(normalizeNewsEventsTabsLayoutStyle(undefined)).toBe('cardGrid')
    expect(getNewsEventsTabsGridClasses('4')).toContain('xl:grid-cols-4')
    expect(resolveNewsEventsTabsLoadMoreLabel(' More updates ')).toBe('More updates')
    expect(resolveNewsEventsTabsLoadMoreLabel('   ')).toBe('Load More')
    expect(resolveNewsEventsTabsLoadMoreLabel(undefined)).toBe('Load More')
    expect(isNewsEventsTabsItemsPerTab(6)).toBe(true)
    expect(isNewsEventsTabsItemsPerTab(5)).toBe(false)
  })

  it('resolves relationship titles in saved order and renders only All when empty', () => {
    expect(resolveNewsEventsTabs(null, [])).toEqual([{ label: 'All', value: 'all' }])
    expect(resolveNewsEventsTabs(' Everything ', undefined)).toEqual([
      { label: 'Everything', value: 'all' },
    ])

    expect(
      resolveNewsEventsTabs(' Everything ', [
        holidayClassification,
        newsClassification,
        holidayClassification,
        { ...noticeClassification, active: false },
        'classification-missing',
        { ...eventClassification, title: '   ' },
      ]),
    ).toEqual([
      { label: 'Everything', value: 'all' },
      {
        classification: holidayClassification,
        label: 'Closures',
        value: holidayClassification.id,
      },
      {
        classification: newsClassification,
        label: 'News',
        value: newsClassification.id,
      },
    ])

    expect(resolveNewsEventsTabs('All updates', [])).toEqual([
      { label: 'All updates', value: 'all' },
    ])
  })

  it('extracts de-duplicated relationship IDs', () => {
    expect(
      getNewsEventsTabsClassificationRelationshipIDs([
        newsClassification,
        newsClassification.id,
        eventClassification.id,
        null,
      ]),
    ).toEqual([newsClassification.id, eventClassification.id])
  })

  it('renders optional section content, semantic surfaces, and footer actions without images', () => {
    const html = renderToStaticMarkup(
      <NewsEventsTabsBlockPresentation
        actions={[{ label: 'View archive', linkType: 'custom', url: '/news-events' }]}
        appearance={{ background: 'subtle', border: 'topAndBottom' }}
        footerActions={[{ label: 'All updates', linkType: 'custom', url: '/updates' }]}
        groups={groups}
      />,
    )

    expect(html).toContain('data-news-events-tabs-block="true"')
    expect(html).toContain('data-news-events-tabs-header="true"')
    expect(html).not.toContain('<h2')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-y border-border')
    expect(html).toContain('View archive')
    expect(html).toContain('All updates')
    expect(html).not.toContain('<img')
  })

  it('normalizes and renders the configured Load More label', () => {
    const pagedGroups = createEmptyNewsEventGroups()
    pagedGroups.all = { docs: [baseCard], hasNextPage: true, page: 1 }
    const customHTML = renderToStaticMarkup(
      <NewsEventsTabsBlockPresentation
        groups={pagedGroups}
        itemsPerTab="6"
        loadMoreLabel=" More updates "
      />,
    )
    const fallbackHTML = renderToStaticMarkup(
      <NewsEventsTabsBlockPresentation groups={pagedGroups} itemsPerTab="6" loadMoreLabel="   " />,
    )

    expect(customHTML).toContain('More updates')
    expect(fallbackHTML).toContain('Load More')
  })

  it('passes relationship titles and order through the presentation layer', () => {
    const html = renderToStaticMarkup(
      <NewsEventsTabsBlockPresentation
        allTabLabel="Everything"
        classifications={[noticeClassification, holidayClassification]}
        groups={groups}
      />,
    )

    expect(html.indexOf('Everything')).toBeLessThan(html.indexOf('Campus notices'))
    expect(html.indexOf('Campus notices')).toBeLessThan(html.indexOf('Closures'))
    expect(html).not.toContain('>News</button>')
  })

  it('renders ordered classification metadata for ID-only live-preview relationships', () => {
    const classificationIDs = [noticeClassification.id, holidayClassification.id]
    const limit = 6
    const key = getNewsEventsTabsPreviewGroupKey(classificationIDs, limit)
    const previewGroups = createEmptyNewsEventGroups()
    previewGroups.all = {
      docs: [groups[noticeClassification.id]!.docs[0]!, groups[holidayClassification.id]!.docs[0]!],
      hasNextPage: false,
      page: 1,
    }
    previewGroups[noticeClassification.id] = groups[noticeClassification.id]!
    previewGroups[holidayClassification.id] = groups[holidayClassification.id]!

    render(
      <NewsEventsTabsPreviewBlockComponent
        classifications={classificationIDs}
        itemsPerTab={limit}
        snapshot={{
          annualCalendarByScope: {},
          calendarByScope: {},
          classificationsByScope: {
            [key]: [noticeClassification, holidayClassification],
          },
          groupsByScope: { [key]: previewGroups },
          highlightsByScope: {},
          newsGridByCount: {},
        }}
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'All',
      'Campus notices',
      'Closures',
    ])
    fireEvent.click(screen.getByRole('tab', { name: 'Closures' }))
    expect(screen.getByRole('tabpanel').textContent).toContain('Campus holiday')
  })

  it('renders only All from an empty live-preview selection', () => {
    const limit = 6
    const key = getNewsEventsTabsPreviewGroupKey([], limit)
    const previewGroups = createEmptyNewsEventGroups()
    previewGroups.all = {
      docs: [baseCard],
      hasNextPage: false,
      page: 1,
    }

    render(
      <NewsEventsTabsPreviewBlockComponent
        classifications={[]}
        itemsPerTab={limit}
        snapshot={{
          annualCalendarByScope: {},
          calendarByScope: {},
          classificationsByScope: { [key]: [] },
          groupsByScope: { [key]: previewGroups },
          highlightsByScope: {},
          newsGridByCount: {},
        }}
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['All'])
    expect(screen.getByRole('tabpanel').textContent).toContain('Current update')
  })

  it('remounts client pagination state when preview scope, tabs, or initial pages change', () => {
    const initialGroups = createEmptyNewsEventGroups()
    initialGroups.all = { docs: [baseCard], hasNextPage: false, page: 1 }
    initialGroups[newsClassification.id] = initialGroups.all
    const replacementCard = {
      ...baseCard,
      id: 'replacement-update',
      slug: 'replacement-update',
      title: 'Replacement update',
    }
    const replacementGroups = createEmptyNewsEventGroups()
    replacementGroups.all = { docs: [replacementCard], hasNextPage: false, page: 1 }
    replacementGroups[newsClassification.id] = replacementGroups.all
    const { rerender } = render(
      <NewsEventsTabsBlockPresentation
        classifications={[newsClassification]}
        groups={initialGroups}
        itemsPerTab={6}
      />,
    )

    expect(screen.getByText('Current update')).toBeTruthy()

    rerender(
      <NewsEventsTabsBlockPresentation
        classifications={[newsClassification]}
        groups={replacementGroups}
        itemsPerTab={9}
      />,
    )

    expect(screen.queryByText('Current update')).toBeNull()
    expect(screen.getByText('Replacement update')).toBeTruthy()

    const noticeGroups = createEmptyNewsEventGroups()
    noticeGroups.all = groups[noticeClassification.id]!
    noticeGroups[noticeClassification.id] = groups[noticeClassification.id]!
    rerender(
      <NewsEventsTabsBlockPresentation
        classifications={[noticeClassification]}
        groups={noticeGroups}
        itemsPerTab={9}
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'All',
      'Campus notices',
    ])
    expect(screen.queryByText('Replacement update')).toBeNull()
    expect(screen.getByText('Research notice')).toBeTruthy()
  })

  it('normalizes the configured presentation layout with a card-grid legacy fallback', () => {
    const editorialHTML = renderToStaticMarkup(
      <NewsEventsTabsBlockPresentation groups={groups} layoutStyle="editorialList" />,
    )
    const fallbackHTML = renderToStaticMarkup(
      <NewsEventsTabsBlockPresentation groups={groups} layoutStyle={'invalid' as never} />,
    )

    expect(editorialHTML).toContain('data-news-events-tabs-layout="editorialList"')
    expect(editorialHTML).toContain('data-news-events-tabs-row="true"')
    expect(editorialHTML).not.toContain('data-news-events-tabs-card="true"')
    expect(editorialHTML).toContain('data-content-tab-variant="underline"')
    expect(fallbackHTML).toContain('data-news-events-tabs-layout="cardGrid"')
    expect(fallbackHTML).toContain('data-news-events-tabs-card="true"')
    expect(fallbackHTML).toContain('data-content-tab-variant="underline"')
  })

  it('renders the default tabs and filters the visible panel', () => {
    render(<NewsEventsTabsClient {...baseClientProps} />)

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'All',
      'News',
      'Events',
      'Campus notices',
      'Closures',
    ])
    expect(screen.getByRole('tab', { name: 'All' }).getAttribute('aria-selected')).toBe('true')

    fireEvent.click(screen.getByRole('tab', { name: 'Closures' }))
    expect(screen.getByRole('tabpanel').textContent).toContain('Campus holiday')
    expect(screen.getByRole('tabpanel').textContent).not.toContain('Research notice')
  })

  it('uses intrinsic tab widths inside a full-width, horizontally scrollable rail', () => {
    const { container } = render(<NewsEventsTabsClient {...baseClientProps} />)
    const wrapper = container.querySelector('[data-news-events-tabs-list-wrap="true"]')
    const tabList = screen.getByRole('tablist', {
      name: 'News and events classifications',
    })
    const frame = wrapper?.querySelector('[data-scrollable-content-tab-frame="true"]')
    const viewport = wrapper?.querySelector('[data-scrollable-content-tab-viewport="true"]')

    expect(frame?.className).toContain('overflow-hidden')
    expect(viewport?.className).toContain('overflow-x-auto')
    expect(frame?.contains(viewport ?? null)).toBe(true)
    expect(viewport?.contains(tabList)).toBe(true)
    expect(tabList.className).toContain('min-w-full')
    expect(tabList.className).toContain('w-max')
    expect(tabList.className).toContain('flex-nowrap')
    expect(tabList.getAttribute('data-content-tab-variant')).toBe('underline')

    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.className).toContain('w-auto')
      expect(tab.className).toContain('shrink-0')
      expect(tab.className).not.toContain('flex-1')
      expect(tab.className).not.toContain('sm:min-w-32')
    }

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'All',
      'News',
      'Events',
      'Campus notices',
      'Closures',
    ])
  })

  it('renders the contained, pill, and underline tab treatments from one contract', () => {
    for (const variant of ['contained', 'pill', 'underline'] as const) {
      const { unmount } = render(<NewsEventsTabsClient {...baseClientProps} variant={variant} />)
      const tabList = screen.getByRole('tablist', {
        name: 'News and events classifications',
      })

      expect(tabList.getAttribute('data-content-tab-variant')).toBe(variant)
      expect(tabList.className).toContain('min-w-full')
      expect(tabList.className).toContain('w-max')
      expect(tabList.className).toContain('flex-nowrap')
      unmount()
    }
  })

  it('uses the shared card title and description typography', () => {
    const { container } = render(<NewsEventsTabsClient {...baseClientProps} />)
    const card = container.querySelector('[data-news-events-tabs-card="true"]')
    const title = card?.querySelector('h3')
    const content = card?.querySelector('[data-slot="card-content"]')
    const description = content?.querySelector('p')
    const date = card?.querySelector('time')

    expect(title?.className).toContain('text-xl')
    expect(title?.className).toContain('font-semibold')
    expect(title?.className).toContain('line-clamp-3')
    expect(title?.className).not.toContain('text-lg')
    expect(content?.className).toContain('text-base')
    expect(content?.className).toContain('font-normal')
    expect(description?.className).toContain('line-clamp-4')
    expect(card?.querySelector('.lucide-calendar-days')).toBeTruthy()
    expect(date?.className).toContain('font-sans')
    expect(date?.className).toContain('font-normal')
    expect(date?.className).toContain('tracking-normal')
    expect(date?.className).toContain('tabular-nums')
    expect(date?.className).toContain('text-xs')
    expect(date?.className).not.toContain('font-mono')
    expect(card?.querySelector('[data-news-event-classification="news"]')).toBeTruthy()
  })

  it('renders an accessible full-row editorial link with responsive columns and shared metadata', () => {
    const { container } = render(<NewsEventsTabsRow item={baseCard} />)
    const row = container.querySelector('[data-news-events-tabs-row="true"]')

    expect(row?.tagName).toBe('A')
    expect(row?.getAttribute('href')).toBe(baseCard.href)
    expect(row?.className).toContain('group/button')
    expect(row?.className).toContain(
      'lg:grid-cols-[minmax(9rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(6rem,0.35fr)]',
    )
    expect(row?.className).toContain('lg:items-start')
    expect(row?.className).toContain('gap-y-5')
    expect(row?.className).toContain('lg:gap-x-8')
    expect(row?.className).not.toContain('lg:gap-8')

    const dateColumn = row?.querySelector('[data-news-events-tabs-row-date="true"]')
    const titleColumn = row?.querySelector('[data-news-events-tabs-row-title="true"]')
    const arrow = row?.querySelector('[data-news-events-tabs-row-arrow="true"]')

    expect(dateColumn?.className).toContain('lg:self-center')
    expect(dateColumn?.querySelector('.lucide-calendar-days')).toBeTruthy()
    expect(dateColumn?.querySelector('[data-news-event-classification]')).toBeNull()
    expect(titleColumn?.querySelector('[data-news-event-classification="news"]')).toBeTruthy()
    expect(titleColumn?.className).toContain('flex-col')
    expect(titleColumn?.className).toContain('items-start')
    expect(titleColumn?.className).toContain('gap-3')
    expect(titleColumn?.querySelector('h3')?.className).toContain('text-xl')
    expect(titleColumn?.querySelector('h3')?.className).toContain('font-semibold')
    expect(titleColumn?.querySelector('h3')?.className).toContain('line-clamp-2')
    expect(row?.querySelector('p')?.className).toContain('text-base')
    expect(row?.querySelector('p')?.className).toContain('font-normal')
    expect(row?.querySelector('p')?.className).toContain('line-clamp-3')
    expect(arrow?.className).toContain('lg:self-center')
    expect(arrow?.querySelector('[aria-hidden="true"] .lucide-arrow-right')).toBeTruthy()
  })

  it('formats editorial event ranges and omits missing optional date and excerpt content', () => {
    const eventCard: PublicNewsEventCard = {
      ...baseCard,
      behavior: 'event',
      classification: eventClassification,
      contentType: 'event',
      dateISO: '2026-08-13T00:00:00.000Z',
      dateLabel: 'Aug 13–20, 2026',
      eventEnd: '2026-08-20T00:00:00.000Z',
      eventStart: '2026-08-13T00:00:00.000Z',
      id: 'event-range',
    }
    const { container, rerender } = render(<NewsEventsTabsRow item={eventCard} />)

    expect(container.querySelector('time')?.textContent).toContain('Aug 13–20, 2026')

    rerender(
      <NewsEventsTabsRow
        item={{
          ...baseCard,
          dateISO: '',
          dateLabel: '',
          excerpt: '   ',
        }}
      />,
    )

    const row = container.querySelector('[data-news-events-tabs-row="true"]')
    const dateColumn = row?.querySelector('[data-news-events-tabs-row-date="true"]')
    const titleColumn = row?.querySelector('[data-news-events-tabs-row-title="true"]')
    expect(dateColumn?.querySelector('time')).toBeNull()
    expect(dateColumn?.querySelector('[data-news-event-classification]')).toBeNull()
    expect(titleColumn?.querySelector('[data-news-event-classification="news"]')).toBeTruthy()
    expect(row?.querySelector('p')).toBeNull()
    expect(
      row?.querySelector('[data-news-events-tabs-row-description-placeholder="true"]'),
    ).toBeTruthy()
  })

  it('renders relationship titles and order while keeping All first', () => {
    render(
      <NewsEventsTabsClient
        {...baseClientProps}
        tabs={resolveNewsEventsTabs('Everything', [noticeClassification, holidayClassification])}
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Everything',
      'Campus notices',
      'Closures',
    ])

    fireEvent.click(screen.getByRole('tab', { name: 'Campus notices' }))
    expect(screen.getByRole('tabpanel').textContent).toContain('Research notice')
    expect(screen.getByRole('tabpanel').textContent).not.toContain('Campus holiday')
  })

  it('supports an explicit All-only configuration', () => {
    render(
      <NewsEventsTabsClient {...baseClientProps} tabs={resolveNewsEventsTabs('All updates', [])} />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['All updates'])
    expect(screen.getByRole('tabpanel').textContent).toContain('Current update')
  })

  it('omits the classification scope when loading more from an All-only block', async () => {
    const allOnlyGroups = createEmptyNewsEventGroups()
    allOnlyGroups.all = { docs: [baseCard], hasNextPage: true, page: 1 }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          docs: [{ ...baseCard, id: 'next-all', slug: 'next-all', title: 'Next All update' }],
          hasNextPage: false,
          page: 2,
        }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <NewsEventsTabsClient
        {...baseClientProps}
        groups={allOnlyGroups}
        tabs={resolveNewsEventsTabs('All updates', [])}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Load More' }))

    await screen.findByText('Next All update')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/news-events-tabs?classification=all&limit=6&page=2',
      { headers: { Accept: 'application/json' } },
    )
  })

  it('uses configured order for keyboard navigation', () => {
    render(
      <NewsEventsTabsClient
        {...baseClientProps}
        tabs={resolveNewsEventsTabs(null, [holidayClassification, noticeClassification])}
      />,
    )

    const all = screen.getByRole('tab', { name: 'All' })
    fireEvent.keyDown(all, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Campus notices' }))

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Campus notices' }), { key: 'Home' })
    expect(document.activeElement).toBe(all)
  })

  it('supports Arrow, Home, and End keyboard navigation', () => {
    render(<NewsEventsTabsClient {...baseClientProps} />)

    const all = screen.getByRole('tab', { name: 'All' })
    fireEvent.keyDown(all, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'News' }).getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(screen.getByRole('tab', { name: 'News' }), { key: 'End' })
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Closures' }))

    fireEvent.keyDown(screen.getByRole('tab', { name: 'Closures' }), { key: 'Home' })
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'All' }))

    fireEvent.keyDown(screen.getByRole('tab', { name: 'All' }), { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Closures' }))
  })

  it('keeps the tabs visible when a classification is empty', () => {
    render(<NewsEventsTabsClient {...baseClientProps} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }))
    expect(screen.getByRole('tabpanel').textContent).toContain('No entries in this classification.')
    expect(screen.getAllByRole('tab')).toHaveLength(5)
  })

  it('loads, appends, and completes pagination for the active tab', async () => {
    const initialCards = Array.from({ length: 6 }, (_, index) => ({
      ...baseCard,
      href: `/news-events/news-${index + 1}`,
      id: `news-${index + 1}`,
      slug: `news-${index + 1}`,
      title: `News ${index + 1}`,
    }))
    const nextCards = Array.from({ length: 6 }, (_, index) => ({
      ...baseCard,
      href: `/news-events/news-${index + 7}`,
      id: `news-${index + 7}`,
      slug: `news-${index + 7}`,
      title: `News ${index + 7}`,
    }))
    const pagedGroups = createEmptyNewsEventGroups()
    pagedGroups.all = { docs: initialCards, hasNextPage: true, page: 1 }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ docs: nextCards, hasNextPage: false, page: 2 }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(
      <NewsEventsTabsClient
        {...baseClientProps}
        groups={pagedGroups}
        layoutStyle="editorialList"
        loadMoreLabel="More updates"
      />,
    )

    expect(document.querySelectorAll('[data-news-events-tabs-row="true"]')).toHaveLength(6)
    expect(document.querySelectorAll('[data-news-events-tabs-card="true"]')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'More updates' }))

    await screen.findByText('News 12')
    expect(document.querySelectorAll('[data-news-events-tabs-row="true"]')).toHaveLength(12)
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/news-events-tabs?classification=all&classifications=${selectedClassifications
        .map(({ id }) => id)
        .join('%2C')}&limit=6&page=2`,
      { headers: { Accept: 'application/json' } },
    )
    expect(screen.queryByRole('button', { name: 'More updates' })).toBeNull()
  })

  it('shows Loading, preserves cards on failure, and retries the same page', async () => {
    const pagedGroups = createEmptyNewsEventGroups()
    pagedGroups.all = { docs: [baseCard], hasNextPage: true, page: 1 }
    let rejectFirstRequest: ((reason?: unknown) => void) | undefined
    const firstRequest = new Promise<Response>((_resolve, reject) => {
      rejectFirstRequest = reject
    })
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            docs: [{ ...baseCard, id: 'next', slug: 'next', title: 'Next update' }],
            hasNextPage: false,
            page: 2,
          }),
          { status: 200 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    render(<NewsEventsTabsClient {...baseClientProps} groups={pagedGroups} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load More' }))

    expect(screen.getByRole('button', { name: 'Loading…' }).hasAttribute('disabled')).toBe(true)
    rejectFirstRequest?.(new Error('network failure'))

    const retry = await screen.findByRole('button', { name: 'Retry' })
    expect(screen.getByText('Current update')).toBeTruthy()
    fireEvent.click(retry)

    await screen.findByText('Next update')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(fetchMock.mock.calls[1]?.[0])
  })

  it('de-duplicates appended entries by public ID', async () => {
    const pagedGroups = createEmptyNewsEventGroups()
    pagedGroups.all = { docs: [baseCard], hasNextPage: true, page: 1 }
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            docs: [baseCard, { ...baseCard, id: 'unique', slug: 'unique', title: 'Unique update' }],
            hasNextPage: false,
            page: 2,
          }),
          { status: 200 },
        ),
      ),
    )

    render(<NewsEventsTabsClient {...baseClientProps} groups={pagedGroups} />)
    fireEvent.click(screen.getByRole('button', { name: 'Load More' }))

    await screen.findByText('Unique update')
    expect(screen.getAllByText('Current update')).toHaveLength(1)
  })

  it('retains independent loaded progress for each tab', async () => {
    const pagedGroups = createEmptyNewsEventGroups()
    pagedGroups[newsClassification.id] = { docs: [baseCard], hasNextPage: true, page: 1 }
    pagedGroups[eventClassification.id] = {
      docs: [
        {
          ...baseCard,
          behavior: 'event',
          classification: eventClassification,
          contentType: 'event',
          id: 'event-1',
          slug: 'event-1',
          title: 'Event 1',
        },
      ],
      hasNextPage: true,
      page: 1,
    }
    const fetchMock = vi.fn(async (url: string) => {
      const isNews = url.includes(`classification=${newsClassification.id}`)
      return new Response(
        JSON.stringify({
          docs: [
            {
              ...baseCard,
              behavior: isNews ? 'story' : 'event',
              classification: isNews ? newsClassification : eventClassification,
              contentType: isNews ? 'news' : 'event',
              id: isNews ? 'news-2' : 'event-2',
              slug: isNews ? 'news-2' : 'event-2',
              title: isNews ? 'News 2' : 'Event 2',
            },
          ],
          hasNextPage: false,
          page: 2,
        }),
        { status: 200 },
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    render(<NewsEventsTabsClient {...baseClientProps} groups={pagedGroups} />)
    fireEvent.click(screen.getByRole('tab', { name: 'News' }))
    fireEvent.click(screen.getByRole('button', { name: 'Load More' }))
    await screen.findByText('News 2')

    fireEvent.click(screen.getByRole('tab', { name: 'Events' }))
    fireEvent.click(screen.getByRole('button', { name: 'Load More' }))
    await screen.findByText('Event 2')

    fireEvent.click(screen.getByRole('tab', { name: 'News' }))
    expect(screen.getByText('News 2')).toBeTruthy()
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `/api/news-events-tabs?classification=${newsClassification.id}&classifications=${selectedClassifications
        .map(({ id }) => id)
        .join('%2C')}&limit=6&page=2`,
      `/api/news-events-tabs?classification=${eventClassification.id}&classifications=${selectedClassifications
        .map(({ id }) => id)
        .join('%2C')}&limit=6&page=2`,
    ])
  })

  it('does not render Load More for a terminal initial page', () => {
    render(<NewsEventsTabsClient {...baseClientProps} />)

    expect(screen.queryByRole('button', { name: 'Load More' })).toBeNull()
  })

  it.each([
    ['2', 'md:grid-cols-2'],
    ['3', 'xl:grid-cols-3'],
    ['4', 'xl:grid-cols-4'],
  ] as const)('uses the selected %s-column card grid', (cardsPerRow, expectedClass) => {
    const { container } = render(
      <NewsEventsTabsClient {...baseClientProps} cardsPerRow={cardsPerRow} />,
    )

    expect(container.querySelector('[role="tabpanel"] > .grid')?.className).toContain(expectedClass)
  })

  it('registers in both collection schemas and both renderers', () => {
    expect(collectBlocks(Pages.fields).map(({ slug }) => slug)).toContain('newsEventsTabs')
    expect(collectBlocks(ReusableSections.fields).map(({ slug }) => slug)).toContain(
      'newsEventsTabs',
    )

    expect(readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')).toContain(
      "case 'newsEventsTabs':",
    )
    expect(readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')).toContain(
      "case 'newsEventsTabs':",
    )
  })

  it('keys grouped preview snapshots by ordered classification scope and traverses reusable sections', () => {
    const cyclicSection: { blockType: string; section?: unknown } = {
      blockType: 'reusableSection',
    }
    cyclicSection.section = { layout: [cyclicSection] }
    const layout = [
      {
        blockType: 'newsEventsTabs',
        classifications: [newsClassification.id, eventClassification.id],
        itemsPerTab: '9',
      },
      {
        blockType: 'newsEventsTabs',
        classifications: [noticeClassification.id, holidayClassification.id],
        itemsPerTab: '9',
      },
      {
        blockType: 'reusableSection',
        section: {
          layout: [
            {
              blockType: 'newsEventsTabs',
              itemsPerTab: 'invalid',
              classifications: [],
            },
          ],
        },
      },
      cyclicSection,
    ] as never
    const scopes = getNewsEventsTabsPreviewGroupScopes(layout)

    expect(scopes).toEqual([
      {
        classificationIDs: [newsClassification.id, eventClassification.id],
        key: JSON.stringify([9, newsClassification.id, eventClassification.id]),
        limit: 9,
      },
      {
        classificationIDs: [noticeClassification.id, holidayClassification.id],
        key: JSON.stringify([9, noticeClassification.id, holidayClassification.id]),
        limit: 9,
      },
      {
        classificationIDs: [],
        key: JSON.stringify([6]),
        limit: 6,
      },
    ])
    expect(scopes[0]?.key).not.toBe(scopes[1]?.key)
    expect(getNewsEventsTabsPreviewGroupCounts(layout)).toEqual([6, 9])
  })
})
