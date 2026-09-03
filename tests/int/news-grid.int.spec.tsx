import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import { NewsGridBlockPresentation } from '@/blocks/NewsGrid/Presentation'
import { NewsGridBlock } from '@/blocks/NewsGrid/config'
import {
  getNewsGridCollectionItemCount,
  normalizeNewsGridTotalCards,
} from '@/blocks/NewsGrid/newsGridShared'
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'
import { fetchNewsGridItems } from '@/lib/newsEvents'
import type {
  NewsEventClassificationBehavior,
  ResolvedNewsEventClassification,
} from '@/lib/newsEventClassifications'
import { formatNewsEventDateRange } from '@/lib/newsEventsShared'
import {
  getNewsEventsPreviewItemCounts,
  getNewsGridPreviewItemCounts,
} from '@/lib/newsEventsPreviewShared'
import type { PublicNewsEventCard } from '@/lib/newsEventsShared'

import { getGeneratedPayloadInterface } from './helpers/generatedPayloadInterface'

const classification = (
  id: string,
  badgeLabel: string,
  behavior: NewsEventClassificationBehavior = 'story',
): ResolvedNewsEventClassification => ({
  active: true,
  badgeLabel,
  behavior,
  calendarColor: 'blue',
  id,
  legacyValue: null,
  slug: id.replace(/-id$/, ''),
  title: badgeLabel,
})

const newsClassification = classification('news-id', 'News')
const eventClassification = classification('event-id', 'Event', 'event')

const newsCard: PublicNewsEventCard = {
  behavior: 'story',
  category: { id: 1, slug: 'academics', title: 'Academics' },
  classification: newsClassification,
  contentType: 'news',
  dateISO: '2026-08-12',
  dateLabel: '12 Aug 2026',
  excerpt: '',
  href: '/news-events/pg-courses',
  id: 'news-1',
  isPastEvent: false,
  slug: 'pg-courses',
  title: 'PG Courses move forward',
}

const eventCard: PublicNewsEventCard = {
  ...newsCard,
  behavior: 'event',
  category: { id: 2, slug: 'admissions', title: 'Admissions' },
  classification: eventClassification,
  contentType: 'event',
  dateLabel: 'Aug 14–16, 2026',
  eventEnd: '2026-08-16T17:00:00.000Z',
  eventStart: '2026-08-14T09:00:00.000Z',
  href: '/news-events/mbbs',
  id: 'event-1',
  slug: 'mbbs',
  title: 'Fifth MBBS batch approved',
}

const createClassificationCard = (contentType: string, id: string): PublicNewsEventCard => ({
  ...newsCard,
  classification: classification(
    `${contentType}-id`,
    {
      achievement: 'Achievement',
      announcement: 'Announcement',
      holiday: 'Holiday',
      news: 'News',
      notice: 'Notice',
      other: 'Other',
    }[contentType] ?? contentType,
  ),
  contentType,
  href: `/news-events/${contentType}`,
  id,
  slug: contentType,
  title: `${contentType} update`,
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

describe('News Grid', () => {
  it('formats compact event date ranges without changing news dates', () => {
    expect(formatNewsEventDateRange('2026-08-14T09:00:00.000Z')).toBe('Aug 14, 2026')
    expect(formatNewsEventDateRange('2026-08-14T09:00:00.000Z', '2026-08-14T17:00:00.000Z')).toBe(
      'Aug 14, 2026',
    )
    expect(formatNewsEventDateRange('2026-08-14T09:00:00.000Z', '2026-08-16T17:00:00.000Z')).toBe(
      'Aug 14–16, 2026',
    )
    expect(formatNewsEventDateRange('2026-08-30T09:00:00.000Z', '2026-09-02T17:00:00.000Z')).toBe(
      'Aug 30, 2026 – Sep 2, 2026',
    )
  })

  it('loads every published classification in newest-published order while excluding past events', async () => {
    const cme = classification('cme-id', 'CME', 'event')
    const campus = classification('campus-id', 'Campus')
    const seededNews = { ...classification('news-id', 'News'), legacyValue: 'news' as const }
    const seededEvent = {
      ...classification('event-id', 'Event', 'event'),
      legacyValue: 'event' as const,
    }
    const loaderRecord = (
      id: string,
      resolvedClassification: ResolvedNewsEventClassification | null,
      contentType: string,
      event = false,
    ) => ({
      classification: resolvedClassification,
      contentType,
      createdAt: '2026-08-10T00:00:00.000Z',
      eventEnd: event ? '2026-08-20T12:00:00.000Z' : null,
      eventStart: event ? '2026-08-20T09:00:00.000Z' : null,
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
    const find = vi
      .fn()
      .mockResolvedValueOnce({ docs: [cme, campus, seededNews, seededEvent] })
      .mockResolvedValueOnce({
        docs: [
          loaderRecord('migrated-campus', campus, 'event'),
          loaderRecord('migrated-cme', cme, 'news', true),
          loaderRecord('legacy-news', null, 'news'),
          loaderRecord('legacy-event', null, 'event', true),
        ],
      })

    const items = await fetchNewsGridItems({ find } as never, {
      limit: 4,
      nowISO: '2026-08-14T00:00:00.000Z',
    })

    expect(items.map(({ behavior, id }) => [id, behavior])).toEqual([
      ['migrated-campus', 'story'],
      ['migrated-cme', 'event'],
      ['legacy-news', 'story'],
      ['legacy-event', 'event'],
    ])

    expect(find).toHaveBeenCalledTimes(2)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-event-classifications',
        pagination: false,
        where: { active: { equals: true } },
      }),
    )
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'news-events',
        limit: 4,
        sort: ['-publishedAt', '-createdAt', '-id'],
        where: {
          and: expect.arrayContaining([
            { _status: { equals: 'published' } },
            {
              or: [
                {
                  or: [
                    { classification: { in: [campus.id, seededNews.id] } },
                    {
                      and: [
                        expect.objectContaining({ or: expect.any(Array) }),
                        { contentType: { in: ['news'] } },
                      ],
                    },
                  ],
                },
                {
                  and: [
                    {
                      or: [
                        { classification: { in: [cme.id, seededEvent.id] } },
                        {
                          and: [
                            expect.objectContaining({ or: expect.any(Array) }),
                            { contentType: { in: ['event'] } },
                          ],
                        },
                      ],
                    },
                    expect.objectContaining({ or: expect.any(Array) }),
                  ],
                },
              ],
            },
          ]),
        },
      }),
    )
  })

  it('configures a total card cap and an explicit desktop column count', () => {
    expect(findNamedField(NewsGridBlock.fields, 'totalCards')).toMatchObject({
      defaultValue: 3,
      max: 6,
      min: 1,
      required: true,
      type: 'number',
    })
    expect(findNamedField(NewsGridBlock.fields, 'cardsPerRow')).toMatchObject({
      admin: {
        layout: 'horizontal',
      },
      defaultValue: '3',
      required: true,
      type: 'radio',
    })
    expect(findNamedField(NewsGridBlock.fields, 'cardsPerRow')?.options).toEqual([
      { label: '2', value: '2' },
      { label: '3', value: '3' },
      { label: '4', value: '4' },
    ])
    expect(findNamedField(NewsGridBlock.fields, 'itemCount')).toBeUndefined()
    expect(findNamedField(NewsGridBlock.fields, 'headerActionAlignment')).toMatchObject({
      admin: { layout: 'horizontal' },
      defaultValue: 'center',
      options: [
        { label: 'Center', value: 'center' },
        { label: 'Top', value: 'top' },
        { label: 'Bottom', value: 'bottom' },
      ],
      required: true,
      type: 'radio',
    })
  })

  it('keeps the total count stable when the optional feature occupies a slot', () => {
    expect(normalizeNewsGridTotalCards(undefined)).toBe(3)
    expect(normalizeNewsGridTotalCards(6)).toBe(6)
    expect(normalizeNewsGridTotalCards(20)).toBe(3)
    expect(
      getNewsGridCollectionItemCount(3, {
        enabled: true,
        title: 'Discover campus life',
      }),
    ).toBe(2)
    expect(getNewsGridCollectionItemCount(3, { enabled: true, title: '  ' })).toBe(3)
    expect(getNewsGridCollectionItemCount(1, { enabled: true, title: 'Feature' })).toBe(0)
  })

  it.each([
    ['2', 'xl:grid-cols-2'],
    ['3', 'xl:grid-cols-3'],
    ['4', 'xl:grid-cols-4'],
  ] as const)('uses the selected %s-card desktop grid', (cardsPerRow, desktopClass) => {
    const html = renderToStaticMarkup(
      <NewsGridBlockPresentation
        cardsPerRow={cardsPerRow}
        items={[newsCard, eventCard]}
        title="News &"
      />,
    )

    expect(html).toContain('grid-cols-1')
    expect(html).toContain('md:grid-cols-2')
    expect(html).toContain(desktopClass)
  })

  it('renders collection entries with a per-type action label', () => {
    const html = renderToStaticMarkup(
      <NewsGridBlockPresentation items={[newsCard, eventCard]} title="News &" />,
    )

    expect(html).toContain('data-news-grid-card-type="news"')
    expect(html).toContain('data-news-grid-card-type="event"')
    expect(html).toContain('>News</span>')
    expect(html).toContain('>Event</span>')
    expect(html).not.toContain('Academics')
    expect(html).toContain('12 Aug 2026')
    expect(html).toContain('Aug 14–16, 2026')
    expect(html).toContain('font-sans text-xs leading-4 text-current/70">12 Aug 2026</p>')
    // News and events get different calls to action.
    expect(html).toContain('Read update')
    expect(html).toContain('View details')
    expect(html).toContain('href="/news-events/pg-courses"')
    expect(html).toContain('line-clamp-3')
  })

  it('renders canonical labels and the default CTA for every non-event classification', () => {
    const cards = ['news', 'notice', 'holiday', 'achievement', 'announcement', 'other'].map(
      (contentType, index) => createClassificationCard(contentType, `${contentType}-${index}`),
    )
    const html = renderToStaticMarkup(
      <NewsGridBlockPresentation
        items={cards}
        newsActionLabel="Read update"
        title="Updates"
        totalCards={6}
      />,
    )

    for (const label of ['News', 'Notice', 'Holiday', 'Achievement', 'Announcement', 'Other']) {
      expect(html).toContain(`>${label}</span>`)
    }
    expect(html.match(/Read update/g)).toHaveLength(6)

    const eventHTML = renderToStaticMarkup(
      <NewsGridBlockPresentation
        eventActionLabel="View event"
        items={[eventCard]}
        newsActionLabel="Read update"
        title="Updates"
      />,
    )
    expect(eventHTML).toContain('>Event</span>')
    expect(eventHTML).toContain('View event')
    expect(eventHTML).not.toContain('Read update')
  })

  it('presents the stored News CTA field as the default non-event label', () => {
    expect(findNamedField(NewsGridBlock.fields, 'newsActionLabel')).toMatchObject({
      label: 'Default Action Label',
      type: 'text',
    })
    expect(findNamedField(NewsGridBlock.fields, 'eventActionLabel')).toMatchObject({
      label: 'Event Action Label',
      type: 'text',
    })
  })

  it('places the header actions beside the heading when aligned left', () => {
    const left = renderToStaticMarkup(
      <NewsGridBlockPresentation
        actions={[{ label: 'View all news', linkType: 'custom', url: '/news-events' }]}
        items={[newsCard]}
        title="News &"
      />,
    )
    const centered = renderToStaticMarkup(
      <NewsGridBlockPresentation
        actions={[{ label: 'View all news', linkType: 'custom', url: '/news-events' }]}
        contentAlignment="center"
        items={[newsCard]}
        title="News &"
      />,
    )

    const top = renderToStaticMarkup(
      <NewsGridBlockPresentation
        actions={[{ label: 'View all news', linkType: 'custom', url: '/news-events' }]}
        headerActionAlignment="top"
        items={[newsCard]}
        title="News &"
      />,
    )
    const bottom = renderToStaticMarkup(
      <NewsGridBlockPresentation
        actions={[{ label: 'View all news', linkType: 'custom', url: '/news-events' }]}
        headerActionAlignment="bottom"
        items={[newsCard]}
        title="News &"
      />,
    )

    expect(left).toContain('md:flex-row md:justify-between md:items-center')
    expect(left).toContain('data-news-grid-header-action-alignment="center"')
    expect(top).toContain('md:flex-row md:justify-between md:items-start')
    expect(top).toContain('data-news-grid-header-action-alignment="top"')
    expect(bottom).toContain('md:flex-row md:justify-between md:items-end')
    expect(bottom).toContain('data-news-grid-header-action-alignment="bottom"')
    // Centred headings stack their actions instead.
    expect(centered).not.toContain('md:flex-row md:justify-between')
  })

  it('renders the feature card last and only once titled', () => {
    const withFeature = renderToStaticMarkup(
      <NewsGridBlockPresentation
        featureCard={{
          actionLabel: 'Explore campus',
          enabled: true,
          eyebrow: 'Campus',
          image: { alt: 'Campus building', url: '/media/campus.jpg' },
          linkType: 'custom',
          title: 'Discover campus life',
          url: '/campus',
        }}
        items={[newsCard]}
        title="News &"
      />,
    )
    const untitled = renderToStaticMarkup(
      <NewsGridBlockPresentation
        featureCard={{ enabled: true, eyebrow: 'Campus', title: '  ' }}
        items={[newsCard]}
        title="News &"
      />,
    )

    expect(withFeature).toContain('data-news-grid-feature="true"')
    expect(withFeature).toContain('mt-2 line-clamp-3')
    // It carries light copy over the image, so buttons and eyebrow invert.
    expect(withFeature).toContain('data-block-surface="brand"')
    expect(withFeature.indexOf('data-news-grid-feature')).toBeGreaterThan(
      withFeature.indexOf('data-news-grid-card'),
    )
    expect(untitled).not.toContain('data-news-grid-feature')
  })

  it('uses a semantic card surface without an image and a decorative image with one', () => {
    const withoutImage = renderToStaticMarkup(
      <NewsGridBlockPresentation
        featureCard={{ enabled: true, title: 'Discover campus life' }}
        items={[]}
        title="News &"
      />,
    )
    const withImage = renderToStaticMarkup(
      <NewsGridBlockPresentation
        featureCard={{
          enabled: true,
          image: { alt: 'Campus building', url: '/media/campus.jpg' },
          title: 'Discover campus life',
        }}
        items={[]}
        title="News &"
      />,
    )
    const withoutImageTag = withoutImage.match(
      /<article[^>]*data-news-grid-feature="true"[^>]*>/,
    )?.[0]
    const withImageTag = withImage.match(/<article[^>]*data-news-grid-feature="true"[^>]*>/)?.[0]

    expect(withoutImage).toContain('bg-card')
    expect(withoutImage).toContain('text-card-foreground')
    expect(withoutImage).not.toContain('bg-linear-to-b')
    expect(withoutImageTag).toContain('rounded-card')
    expect(withoutImageTag).not.toContain('rounded-[var(--radius)]')
    expect(withImage).toContain('bg-linear-to-b')
    expect(withImage).toContain('alt=""')
    expect(withImageTag).toContain('rounded-card')
    expect(withImageTag).not.toContain('rounded-[var(--radius)]')
  })

  it('falls back to the empty state, but still renders a feature-only grid', () => {
    const empty = renderToStaticMarkup(
      <NewsGridBlockPresentation
        emptyStateMessage="No updates published yet."
        items={[]}
        title="News &"
      />,
    )
    const featureOnly = renderToStaticMarkup(
      <NewsGridBlockPresentation
        emptyStateMessage="No updates published yet."
        featureCard={{ enabled: true, title: 'Discover campus life' }}
        items={[]}
        title="News &"
      />,
    )

    expect(empty).toContain('No updates published yet.')
    expect(empty).not.toContain('data-news-grid-items')
    // The editor-authored card does not depend on the collection.
    expect(featureOnly).toContain('data-news-grid-feature="true"')
    expect(featureOnly).not.toContain('No updates published yet.')
  })

  it('is registered on Pages, both renderers, and the preview snapshot scanner', () => {
    const layoutField = (
      Pages.fields.find(
        (field) => typeof field === 'object' && field !== null && 'tabs' in field,
      ) as { tabs: Array<{ fields: unknown[]; label: string }> } | undefined
    )?.tabs
      .find((tab) => tab.label === 'Content')
      ?.fields.find(
        (field) =>
          typeof field === 'object' && field !== null && 'name' in field && field.name === 'layout',
      ) as { blocks?: Array<{ slug: string }> } | undefined

    expect(layoutField?.blocks?.map((block) => block.slug)).toContain('newsGrid')
    const reusableLayoutField = ReusableSections.fields.find(
      (field) => field.type === 'blocks' && field.name === 'layout',
    )
    expect(
      reusableLayoutField && 'blocks' in reusableLayoutField
        ? reusableLayoutField.blocks.map((block) => block.slug)
        : [],
    ).toContain('newsGrid')
    expect(readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')).toContain("case 'newsGrid'")
    expect(readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')).toContain(
      "case 'newsGrid'",
    )
    expect(NewsGridBlock.interfaceName).toBe('NewsGridBlock')

    // Without this the block renders empty in live preview.
    const counts = getNewsGridPreviewItemCounts([
      {
        blockType: 'newsGrid',
        featureCard: { enabled: true, title: 'Discover campus' },
        title: 'News &',
        totalCards: 3,
      },
    ] as never)
    expect(counts).toContain(2)
    expect(
      getNewsEventsPreviewItemCounts([
        { blockType: 'newsEventsHighlights', itemCount: 4 },
        { blockType: 'newsGrid', title: 'News &', totalCards: 3 },
      ] as never),
    ).toEqual([4])
  })

  it('keeps generated Payload types aligned with the schema', () => {
    const generatedTypes = readFileSync('src/payload-types.ts', 'utf8')
    const newsGridInterface = getGeneratedPayloadInterface(generatedTypes, 'NewsGridBlock')

    expect(newsGridInterface).toContain('totalCards: number')
    expect(newsGridInterface).toContain("cardsPerRow: '2' | '3' | '4'")
    expect(newsGridInterface).toContain("blockType: 'newsGrid'")
    expect(newsGridInterface).not.toContain('itemCount')
  })
})
