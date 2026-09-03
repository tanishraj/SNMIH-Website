import type { Block, Field } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const livePreviewMocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  useLivePreview: vi.fn(),
}))

vi.mock('@payloadcms/live-preview-react', () => ({
  RefreshRouteOnSave: () => null,
  useLivePreview: livePreviewMocks.useLivePreview,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: livePreviewMocks.refresh }),
}))

import { Pages } from '@/collections/Pages'
import { NewsEventsContentBlock } from '@/blocks/NewsEventsContent/config'
import { NewsEventLivePreview } from '@/components/live-preview/NewsEventLivePreview'
import { NewsEventDetailPage } from '@/components/news-events/NewsEventDetailPage'
import { ReusableSections } from '@/collections/ReusableSections'
import { NewsEventsDetailTemplate } from '@/globals/NewsEventsDetailTemplate'
import { fetchNewsEventDetailTemplate } from '@/lib/newsEventDetailTemplate'
import {
  DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE,
  DEFAULT_NEWS_EVENTS_CONTENT_BLOCK,
  getNewsEventDetailAuthorLabel,
  getNewsEventDetailPageBlocks,
  normalizeNewsEventDetailTemplate,
  resolveNewsEventsContentSettings,
} from '@/lib/newsEventDetailTemplateShared'
import { EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT } from '@/lib/newsEventsPreviewShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import { EMPTY_REVIEW_PREVIEW_SNAPSHOT } from '@/lib/reviewPreviewShared'
import type { NewsEvent } from '@/payload-types'
import config from '@/payload.config'

const entry: PublicNewsEventDetail = {
  behavior: 'story',
  body: {
    root: {
      type: 'root',
      children: [],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  },
  categories: [],
  classification: {
    active: true,
    badgeLabel: 'Campus',
    behavior: 'story',
    calendarColor: 'blue',
    id: 'campus-classification',
    legacyValue: null,
    slug: 'campus-update',
    title: 'Campus Updates',
  },
  contentType: 'news',
  dateISO: '2026-07-19T00:00:00.000Z',
  dateLabel: 'Jul 19, 2026',
  excerpt: 'A concise introduction to the story.',
  href: '/news-events/campus-story',
  id: 'campus-story',
  isPastEvent: false,
  slug: 'campus-story',
  tags: [],
  title: 'Campus story',
  updatedAt: '2026-07-19T00:00:00.000Z',
}

const collectBlocks = (fields: Field[]): Block[] =>
  fields.flatMap((field) => {
    if (field.type === 'blocks') return field.blocks
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => collectBlocks(tab.fields))
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      return collectBlocks(field.fields)
    }
    return []
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

describe('News & Events detail template', () => {
  it('registers one versioned block-built detail page with the News & Events tools', async () => {
    const resolvedConfig = await config
    const pageSlugs = collectBlocks(Pages.fields).map(({ slug }) => slug)
    const reusableSectionSlugs = collectBlocks(ReusableSections.fields).map(({ slug }) => slug)
    const templateBlocks = collectBlocks(NewsEventsDetailTemplate.fields)
    const templateSlugs = templateBlocks.map(({ slug }) => slug)

    expect(resolvedConfig.globals?.map(({ slug }) => slug)).toContain('news-events-detail-template')
    expect(NewsEventsDetailTemplate).toMatchObject({
      admin: { group: 'News & Events' },
      label: 'Detail Page Template',
      slug: 'news-events-detail-template',
    })
    expect(NewsEventsDetailTemplate.versions).toBeTruthy()
    expect(templateSlugs.filter((slug) => slug !== 'newsEventsContent')).toEqual(pageSlugs)
    expect(templateBlocks[0]).toMatchObject({
      admin: { group: 'Template Core' },
      slug: 'newsEventsContent',
    })
    expect(templateSlugs.filter((slug) => slug === 'newsEventsContent')).toHaveLength(1)
    expect(pageSlugs).not.toContain('newsEventsContent')
    expect(reusableSectionSlugs).not.toContain('newsEventsContent')
    expect(findNamedField(NewsEventsContentBlock.fields, 'themeMode')).toMatchObject({
      defaultValue: 'dark',
      type: 'select',
    })
    expect(findNamedField(NewsEventsContentBlock.fields, 'overlayStyle')).toMatchObject({
      defaultValue: 'darker',
      type: 'select',
    })
    expect(findNamedField(NewsEventsContentBlock.fields, 'overlayDirection')).toMatchObject({
      defaultValue: 'bottomToTop',
      type: 'select',
    })
    expect(findNamedField(NewsEventsContentBlock.fields, 'overlayCoverage')).toMatchObject({
      defaultValue: 'full',
      type: 'select',
    })
  })

  it('requires exactly one dynamic content block only when publishing', async () => {
    const layout = findNamedField(NewsEventsDetailTemplate.fields, 'layout') as {
      validate?: (
        value: unknown,
        options: { data?: { _status?: 'draft' | 'published' } },
      ) => Promise<string | true> | string | true
    }
    const content = { blockType: 'newsEventsContent' }

    await expect(layout.validate?.([], { data: { _status: 'draft' } })).resolves.toBe(true)
    await expect(layout.validate?.([], { data: { _status: 'published' } })).resolves.toBe(
      'Add exactly one News & Events Content block before publishing.',
    )
    await expect(layout.validate?.([content], { data: { _status: 'published' } })).resolves.toBe(
      true,
    )
    await expect(
      layout.validate?.([content, content], { data: { _status: 'published' } }),
    ).resolves.toBe('Add exactly one News & Events Content block before publishing.')
  })

  it('uses a complete default layout for missing and legacy field-only data', () => {
    for (const value of [null, {}, { header: { title: 'Legacy title' } }]) {
      const result = normalizeNewsEventDetailTemplate(value)
      expect(result.layout.map(({ blockType }) => blockType)).toEqual([
        'pageHeader',
        'breadcrumb',
        'newsEventsContent',
      ])
    }
  })

  it('preserves valid block order and repairs missing or duplicate dynamic blocks', () => {
    const before = { blockType: 'pageHeader', title: 'Before' }
    const first = { blockType: 'newsEventsContent', authorLabel: 'Office of the Director' }
    const duplicate = { blockType: 'newsEventsContent', authorLabel: 'Duplicate' }
    const after = { blockType: 'breadcrumb', breadcrumbMode: 'automatic' }

    expect(normalizeNewsEventDetailTemplate({ layout: [before, after] }).layout).toEqual([
      before,
      after,
      expect.objectContaining({ blockType: 'newsEventsContent' }),
    ])
    expect(
      normalizeNewsEventDetailTemplate({ layout: [before, first, duplicate, after] }).layout,
    ).toEqual([before, first, after])
  })

  it('collects nested Page blocks needed by server-provided live-preview snapshots', () => {
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        { blockType: 'newsEventsContent' },
        {
          blockType: 'reusableSection',
          section: {
            layout: [
              { blockType: 'reviewFeed' },
              { blockType: 'newsEventsHighlights' },
              { blockType: 'contact24' },
              { blockType: 'eventGallery' },
            ],
          },
        },
      ],
    })

    expect(getNewsEventDetailPageBlocks(template).map(({ blockType }) => blockType)).toEqual([
      'reusableSection',
      'reviewFeed',
      'newsEventsHighlights',
      'contact24',
      'eventGallery',
    ])
  })

  it('renders ordinary blocks around one entry-bound content block in saved order', () => {
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        {
          blockType: 'pageHeader',
          title: 'Before article',
          topContent: 'eyebrow',
          variant: 'minimal',
        },
        {
          blockType: 'newsEventsContent',
          authorLabel: 'Management, SNMIH',
        },
        {
          blockType: 'pageHeader',
          title: 'After article',
          topContent: 'eyebrow',
          variant: 'minimal',
        },
      ],
    })
    const markup = renderToStaticMarkup(<NewsEventDetailPage entry={entry} template={template} />)

    expect(markup.indexOf('Before article')).toBeLessThan(
      markup.indexOf('data-news-event-story="true"'),
    )
    expect(markup.indexOf('data-news-event-story="true"')).toBeLessThan(
      markup.indexOf('After article'),
    )
    expect(markup.match(/data-news-event-story="true"/g)).toHaveLength(1)
  })

  it('renders live entry data through the normalized shared detail layout', () => {
    const initialData = {
      body: entry.body,
      categories: [],
      contentType: 'news',
      createdAt: '2026-07-18T00:00:00.000Z',
      excerpt: 'Initial preview excerpt.',
      featuredImage: null,
      featuredImagePosition: 'center',
      id: entry.id,
      publishedAt: entry.dateISO,
      slug: entry.slug,
      tags: [],
      title: 'Initial preview title',
      updatedAt: entry.updatedAt,
    } as unknown as NewsEvent
    const liveData = {
      ...initialData,
      excerpt: 'Updated live preview excerpt.',
      title: 'Updated live preview title',
    }
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        {
          blockType: 'pageHeader',
          title: 'Preview detail header',
          topContent: 'eyebrow',
          variant: 'minimal',
        },
        {
          blockType: 'breadcrumb',
          breadcrumbMode: 'automatic',
          showCurrentPage: true,
          showHome: true,
        },
        { blockType: 'newsEventsContent' },
        {
          blockType: 'pageHeader',
          title: 'Preview detail footer',
          topContent: 'eyebrow',
          variant: 'minimal',
        },
      ],
    })
    livePreviewMocks.useLivePreview.mockReturnValue({ data: liveData })

    const markup = renderToStaticMarkup(
      <NewsEventLivePreview
        eventGalleryAlbums={[]}
        initialData={initialData}
        initialTemplate={template}
        newsEventsSnapshot={EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT}
        nowISO="2026-07-19T00:00:00.000Z"
        officeLocations={[]}
        reviewSnapshot={EMPTY_REVIEW_PREVIEW_SNAPSHOT}
      />,
    )

    expect(livePreviewMocks.useLivePreview).toHaveBeenCalledWith({
      depth: 2,
      initialData,
      serverURL: 'http://localhost:3000',
    })
    expect(markup).toContain('Preview detail header')
    expect(markup).toContain('Updated live preview title')
    expect(markup).toContain('Updated live preview excerpt.')
    expect(markup).toMatch(/aria-current="page"[^>]*>Updated live preview title<\/span>/)
    expect(markup.indexOf('Preview detail header')).toBeLessThan(
      markup.indexOf('data-news-event-story="true"'),
    )
    expect(markup.indexOf('data-news-event-story="true"')).toBeLessThan(
      markup.indexOf('Preview detail footer'),
    )
    expect(markup.match(/data-news-event-story="true"/g)).toHaveLength(1)
  })

  it('passes the current entry trail to automatic breadcrumb blocks', () => {
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        {
          blockType: 'breadcrumb',
          breadcrumbMode: 'automatic',
          showCurrentPage: true,
          showHome: true,
        },
        { blockType: 'newsEventsContent' },
      ],
    })
    const markup = renderToStaticMarkup(<NewsEventDetailPage entry={entry} template={template} />)

    expect(markup).toContain('href="/"')
    expect(markup).toContain('Home')
    expect(markup).toContain('href="/news-events"')
    expect(markup).toContain('News &amp; Events')
    expect(markup).toMatch(/aria-current="page"[^>]*>Campus story<\/span>/)
  })

  it('passes the current entry trail through a populated Reusable Section', () => {
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        {
          blockType: 'reusableSection',
          section: {
            id: 'detail-breadcrumbs',
            layout: [
              {
                blockType: 'breadcrumb',
                breadcrumbMode: 'automatic',
                showCurrentPage: true,
                showHome: true,
              },
            ],
          },
        },
        { blockType: 'newsEventsContent' },
      ],
    })
    const markup = renderToStaticMarkup(<NewsEventDetailPage entry={entry} template={template} />)

    expect(markup).toContain('href="/"')
    expect(markup).toContain('Home')
    expect(markup).toContain('href="/news-events"')
    expect(markup).toContain('News &amp; Events')
    expect(markup).toMatch(/aria-current="page"[^>]*>Campus story<\/span>/)
  })

  it('deeply isolates normalized layouts from defaults and input blocks', () => {
    const inputBlock = {
      blockType: 'pageHeader',
      presentation: { items: [{ label: 'Original' }] },
    }
    const fromInput = normalizeNewsEventDetailTemplate({ layout: [inputBlock] })
    const inputPresentation = fromInput.layout[0].presentation as {
      items: Array<{ label: string }>
    }

    expect(fromInput.layout[0]).not.toBe(inputBlock)
    expect(inputPresentation).not.toBe(inputBlock.presentation)
    expect(fromInput.layout[1]).not.toBe(DEFAULT_NEWS_EVENTS_CONTENT_BLOCK)
    inputPresentation.items[0].label = 'Changed'
    ;(fromInput.layout[1].appearance as { background: string }).background = 'brand'

    expect(inputBlock.presentation.items[0].label).toBe('Original')
    expect(DEFAULT_NEWS_EVENTS_CONTENT_BLOCK.appearance).toEqual({
      background: 'none',
      border: 'none',
    })

    const fromDefault = normalizeNewsEventDetailTemplate(null)
    const defaultAppearance = fromDefault.layout[0].appearance as { background: string }

    expect(fromDefault.layout[0]).not.toBe(DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE.layout[0])
    expect(defaultAppearance).not.toBe(DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE.layout[0].appearance)
    defaultAppearance.background = 'brand'

    expect(DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE.layout[0].appearance).toEqual({
      background: 'none',
      border: 'none',
    })
  })

  it('normalizes dynamic settings and derives the structured-data author', () => {
    const template = normalizeNewsEventDetailTemplate({
      layout: [
        {
          blockType: 'newsEventsContent',
          authorLabel: '  Office of the Director  ',
          featuredImageRatio: 'invalid',
          showShareActions: false,
        },
      ],
    })
    const block = template.layout[0]

    expect(resolveNewsEventsContentSettings(block)).toMatchObject({
      authorLabel: 'Office of the Director',
      featuredImageRatio: 'wide',
      showShareActions: false,
    })
    expect(getNewsEventDetailAuthorLabel(template)).toBe('Office of the Director')

    expect(
      resolveNewsEventsContentSettings({
        themeMode: 'brand',
        overlayStyle: 'light',
        overlayDirection: 'rightToLeft',
        overlayCoverage: 'split',
      }),
    ).toMatchObject({
      coverage: 'split',
      direction: 'rightToLeft',
      strength: 'light',
      tone: 'brand',
    })

    expect(
      resolveNewsEventsContentSettings({
        themeMode: 'invalid',
        overlayStyle: 'invalid',
        overlayDirection: 'invalid',
        overlayCoverage: 'invalid',
      }),
    ).toMatchObject({
      coverage: 'full',
      direction: 'bottomToTop',
      strength: 'darker',
      tone: 'dark',
    })
  })

  it('uses safe content-setting fallbacks for missing and invalid presentation values', () => {
    for (const value of [
      undefined,
      {
        appearance: { background: 'invalid', border: 'invalid' },
        sidebarCardBackground: 'invalid',
        sidebarCardOutline: 'false',
        size: 'invalid',
      },
    ]) {
      expect(resolveNewsEventsContentSettings(value)).toMatchObject({
        appearance: { background: 'none', border: 'none' },
        sidebarCardBackground: 'default',
        sidebarCardOutline: true,
        size: 'default',
      })
    }
  })

  it('loads only the published global and falls back without breaking the page', async () => {
    const logger = { error: vi.fn() }
    const findGlobal = vi.fn().mockResolvedValue({
      layout: [{ blockType: 'newsEventsContent', authorLabel: 'Office of the Director' }],
    })

    await expect(fetchNewsEventDetailTemplate({ findGlobal, logger } as never)).resolves.toEqual({
      layout: [{ blockType: 'newsEventsContent', authorLabel: 'Office of the Director' }],
    })
    expect(findGlobal).toHaveBeenCalledWith({
      slug: 'news-events-detail-template',
      depth: 2,
      draft: false,
      overrideAccess: true,
    })

    findGlobal.mockRejectedValueOnce(new Error('Unavailable'))
    await expect(fetchNewsEventDetailTemplate({ findGlobal, logger } as never)).resolves.toEqual(
      DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE,
    )
    expect(logger.error).toHaveBeenCalledOnce()
  })
})
