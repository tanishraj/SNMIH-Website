import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NewsEventsHighlightsBlockComponent } from '@/blocks/NewsEventsHighlights/Component'
import { NewsEventsHighlightsBlock } from '@/blocks/NewsEventsHighlights/config'
import { NewsEventsHighlightsPreviewBlockComponent } from '@/blocks/NewsEventsHighlights/PreviewComponent'
import { NewsEventsHighlightsBlockPresentation } from '@/blocks/NewsEventsHighlights/Presentation'
import { toAutomaticFeaturedHighlightItems } from '@/blocks/NewsEventsHighlights/resolveItems'
import {
  getNewsEventsHighlightsClassificationIDs,
  getNewsEventsHighlightsPreviewKey,
} from '@/blocks/NewsEventsHighlights/newsEventsHighlightsShared'
import {
  resolveFeaturedHighlightImagePosition,
  resolveFeaturedHighlightsOverlay,
} from '@/components/news-events/featuredHighlightsShared'
import { getNewsEventsHighlights } from '@/lib/newsEvents'
import { getLegacyNewsEventClassificationRecord } from '@/lib/newsEventClassifications'
import {
  EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
  getNewsEventsHighlightsPreviewScopes,
} from '@/lib/newsEventsPreviewShared'

vi.mock('@/lib/newsEvents', () => ({
  getNewsEventsHighlights: vi.fn(),
}))

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

describe('News & Events Highlights block', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('uses a carousel-only two-tab configuration with presentation controls under Theme Settings', () => {
    expect(NewsEventsHighlightsBlock.slug).toBe('newsEventsHighlights')
    expect(NewsEventsHighlightsBlock.interfaceName).toBe('NewsEventsHighlightsBlock')
    expect(NewsEventsHighlightsBlock.labels).toEqual({
      plural: 'News & Events Highlights',
      singular: 'News & Events Highlights',
    })

    const tabsField = NewsEventsHighlightsBlock.fields[0]
    expect(tabsField?.type).toBe('tabs')
    if (!tabsField || tabsField.type !== 'tabs') throw new Error('Expected block tabs')

    const contentFields = tabsField.tabs.find(({ label }) => label === 'Content')?.fields ?? []
    const themeFields = tabsField.tabs.find(({ label }) => label === 'Theme Settings')?.fields ?? []

    expect(findNamedField(contentFields, 'contentSource')).toBeUndefined()
    expect(findNamedField(contentFields, 'manualSlides')).toBeUndefined()

    expect(findNamedField(contentFields, 'classifications')).toMatchObject({
      admin: {
        allowCreate: true,
      },
      filterOptions: {
        active: { equals: true },
        behavior: { equals: 'event' },
      },
      hasMany: true,
      maxRows: 50,
      relationTo: 'news-event-classifications',
      type: 'relationship',
    })

    const contentAlignment = findNamedField(themeFields, 'contentAlignment')
    expect(contentAlignment).toMatchObject({
      defaultValue: 'center',
      required: true,
      type: 'select',
    })

    expect(findNamedField(themeFields, 'itemCount')).toBeUndefined()
    expect(findNamedField(themeFields, 'autoplay')).toMatchObject({
      defaultValue: true,
      type: 'checkbox',
    })
    const carouselControlsPosition = findNamedField(themeFields, 'carouselControlsPosition')
    expect(carouselControlsPosition).toMatchObject({
      defaultValue: 'bottom',
      label: 'Carousel Controls Position',
      required: true,
      type: 'select',
    })
    expect(carouselControlsPosition?.options).toEqual([
      { label: 'Bottom', value: 'bottom' },
      { label: 'Top', value: 'top' },
    ])
    expect(findNamedField(themeFields, 'emptyStateMessage')).toMatchObject({ type: 'text' })
    expect(findNamedField(themeFields, 'imagePositionOverride')).toMatchObject({
      defaultValue: 'item',
      required: true,
      type: 'select',
    })
    expect(findNamedField(themeFields, 'themeMode')).toMatchObject({ defaultValue: 'dark' })
    expect(findNamedField(themeFields, 'overlayStyle')).toMatchObject({ defaultValue: 'darker' })
    expect(findNamedField(themeFields, 'overlayDirection')).toMatchObject({
      defaultValue: 'bottomToTop',
    })
    expect(findNamedField(themeFields, 'overlayCoverage')).toMatchObject({
      defaultValue: 'full',
    })

    expect(findNamedField(contentFields, 'layout')).toBeUndefined()
    expect(findNamedField(contentFields, 'featuredEntries')).toBeUndefined()
    expect(findNamedField(NewsEventsHighlightsBlock.fields, 'layout')).toBeUndefined()
    expect(findNamedField(NewsEventsHighlightsBlock.fields, 'featuredEntries')).toBeUndefined()
  })

  it('requests automatic preview entries for each classification scope', () => {
    expect(
      getNewsEventsHighlightsPreviewScopes([
        {
          blockType: 'newsEventsHighlights',
          classifications: ['classification-news'],
          itemCount: 5,
        },
        {
          blockType: 'newsEventsHighlights',
          classifications: ['classification-event'],
          itemCount: 5,
        },
        { blockType: 'newsEventsHighlights', itemCount: 2 },
      ] as never),
    ).toEqual([
      {
        classificationIDs: ['classification-news'],
        key: '["classification-news"]',
      },
      {
        classificationIDs: ['classification-event'],
        key: '["classification-event"]',
      },
      { classificationIDs: [], key: '[]' },
    ])
  })

  it('normalizes relationship IDs and creates stable preview keys', () => {
    const classificationIDs = getNewsEventsHighlightsClassificationIDs([
      'classification-news',
      { id: 'classification-event' },
      'classification-news',
      null,
    ])

    expect(classificationIDs).toEqual(['classification-news', 'classification-event'])
    expect(getNewsEventsHighlightsPreviewKey(classificationIDs)).toBe(
      '["classification-news","classification-event"]',
    )
  })

  it('ignores stale manual fields and always loads the News & Events collection', async () => {
    const classification = getLegacyNewsEventClassificationRecord('news')!
    vi.mocked(getNewsEventsHighlights).mockResolvedValueOnce([
      {
        behavior: classification.behavior,
        classification,
        contentType: 'news',
        dateISO: '2026-08-18T00:00:00.000Z',
        dateLabel: 'Aug 18, 2026',
        excerpt: 'The collection-owned description.',
        href: '/news-events/collection-highlight',
        id: 'collection-highlight',
        isPastEvent: false,
        slug: 'collection-highlight',
        title: 'Collection highlight',
      },
    ])

    const element = await NewsEventsHighlightsBlockComponent({
      classifications: ['classification-news'],
      contentSource: 'manual',
      itemCount: 5,
      manualSlides: [
        {
          action: [{ label: 'Explore', linkType: 'custom', url: '/explore' }],
          title: 'Stale manual highlight',
        },
      ],
    } as never)

    const markup = renderToStaticMarkup(element)

    expect(getNewsEventsHighlights).toHaveBeenCalledWith(
      ['classification-news'],
      expect.any(String),
    )
    expect(markup).toContain('Collection highlight')
    expect(markup).not.toContain('Stale manual highlight')
  })

  it('ignores stale manual fields and renders collection data in live preview', () => {
    const classification = getLegacyNewsEventClassificationRecord('notice')!
    const markup = renderToStaticMarkup(
      NewsEventsHighlightsPreviewBlockComponent({
        carouselControlsPosition: 'top',
        contentSource: 'manual',
        itemCount: 3,
        manualSlides: [{ badgeLabel: 'Campus', title: 'Stale manual highlight' }],
        snapshot: {
          ...EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
          highlightsByScope: {
            '[]': [
              {
                behavior: classification.behavior,
                classification,
                contentType: 'notice',
                dateISO: '2026-08-18T00:00:00.000Z',
                dateLabel: 'Aug 18, 2026',
                excerpt: 'A collection-owned preview.',
                href: '/news-events/preview-highlight',
                id: 'preview-highlight',
                isPastEvent: false,
                slug: 'preview-highlight',
                title: 'Preview collection highlight',
              },
            ],
          },
        },
      } as never),
    )

    expect(markup).toContain('Preview collection highlight')
    expect(markup).toContain('data-news-events-carousel-controls-position="top"')
    expect(markup).not.toContain('Stale manual highlight')
  })

  it('keeps legacy blocks collection-driven when contentSource is missing', async () => {
    const classification = getLegacyNewsEventClassificationRecord('notice')!
    vi.mocked(getNewsEventsHighlights).mockResolvedValueOnce([
      {
        behavior: classification.behavior,
        classification,
        contentType: 'notice',
        dateISO: '2026-08-17T00:00:00.000Z',
        dateLabel: 'Aug 17, 2026',
        excerpt: 'An important notice.',
        href: '/news-events/notice',
        id: 'notice',
        isPastEvent: false,
        slug: 'notice',
        title: 'Campus notice',
      },
    ])

    const element = await NewsEventsHighlightsBlockComponent({ itemCount: 4 } as never)

    expect(getNewsEventsHighlights).toHaveBeenCalledWith([], expect.any(String))
    expect(renderToStaticMarkup(element)).toContain('Campus notice')
  })

  it('normalizes automatic records into the generic carousel model', () => {
    const classification = getLegacyNewsEventClassificationRecord('news')!
    expect(
      toAutomaticFeaturedHighlightItems([
        {
          behavior: classification.behavior,
          classification,
          contentType: 'news',
          dateISO: '2026-07-20T00:00:00.000Z',
          dateLabel: 'Jul 20, 2026',
          excerpt: 'A public story.',
          href: '/news-events/story',
          id: 'story',
          image: {
            alt: 'Campus',
            position: 'top',
            src: '/media/campus.jpg',
          },
          isPastEvent: false,
          slug: 'story',
          title: 'Public story',
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        action: expect.objectContaining({ href: '/news-events/story', label: 'Read more' }),
        classification,
        dateLabel: 'Jul 20, 2026',
        description: 'A public story.',
        id: 'story',
        image: expect.objectContaining({ position: 'top' }),
        title: 'Public story',
      }),
    ])
  })

  it('uses backward-compatible position and overlay fallbacks', () => {
    expect(resolveFeaturedHighlightImagePosition('top', 'item')).toBe('top')
    expect(resolveFeaturedHighlightImagePosition('top', 'left')).toBe('left')
    expect(resolveFeaturedHighlightImagePosition('invalid', 'invalid')).toBe('center')
    expect(resolveFeaturedHighlightsOverlay({})).toEqual({
      coverage: 'full',
      direction: 'bottomToTop',
      strength: 'darker',
      tone: 'dark',
    })
  })

  it.each([
    ['left', 'items-start text-left'],
    ['center', 'mx-auto items-center text-center'],
    ['right', 'ml-auto items-end text-right'],
  ] as const)(
    'aligns the block text to %s and keeps its action right-aligned',
    (contentAlignment, headerClasses) => {
      const markup = renderToStaticMarkup(
        <NewsEventsHighlightsBlockPresentation
          actions={[{ label: 'All stories', linkType: 'custom', url: '/news-events' }]}
          contentAlignment={contentAlignment}
          emptyStateMessage="No updates yet."
          items={[]}
          title="News & Events"
        />,
      )

      expect(markup).toContain('data-news-events-featured-carousel="true"')
      expect(markup).toContain(headerClasses)
      expect(markup).toContain('justify-end')
    },
  )

  it('renders normalized headings, carousel content, badges, and actions', () => {
    const classification = getLegacyNewsEventClassificationRecord('news')!
    const markup = renderToStaticMarkup(
      <NewsEventsHighlightsBlockPresentation
        actions={[{ label: 'All stories', linkType: 'custom', url: '/news-events' }]}
        carouselControlsPosition="top"
        contentAlignment="center"
        eyebrow="Latest"
        items={[
          {
            action: { href: '/news-events/story', label: 'Read more' },
            classification,
            dateISO: '2026-07-20T00:00:00.000Z',
            dateLabel: 'Jul 20, 2026',
            description: 'A public story.',
            id: 'story',
            image: {
              alt: 'Campus',
              height: 900,
              position: 'center',
              src: '/media/campus.jpg',
              width: 1600,
            },
            title: 'Public story',
          },
        ]}
        title="News & Events"
      />,
    )

    expect(markup).toContain('data-news-events-featured-carousel="true"')
    expect(markup).toContain('mx-auto items-center text-center')
    expect(markup).toContain('lg:grid-cols-[minmax(0,1fr)_auto]')
    expect(markup).toContain('justify-end')
    expect(markup).toContain('data-news-events-carousel-feature="true"')
    expect(markup).toContain('data-news-events-carousel-controls-position="top"')
    expect(markup).toContain('<h2')
    expect(markup).toContain('Public story')
    expect(markup).toContain('Read more')
    expect(markup).toContain('All stories')
  })

  it('renders the carousel without requiring a section heading', () => {
    const classification = getLegacyNewsEventClassificationRecord('notice')!
    const markup = renderToStaticMarkup(
      <NewsEventsHighlightsBlockPresentation
        items={[
          {
            classification,
            dateISO: '2026-08-17T00:00:00.000Z',
            dateLabel: 'Aug 17, 2026',
            description: 'An important notice.',
            id: 'notice',
            title: 'Campus notice',
          },
        ]}
      />,
    )

    expect(markup).toContain('data-news-events-featured-carousel="true"')
    expect(markup).toContain('Campus notice')
    expect(markup).not.toContain('<h2')
  })
})
