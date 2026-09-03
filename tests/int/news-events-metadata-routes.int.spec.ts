import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getDraftEventGalleryAlbums: vi.fn(),
  getDraftSiteOfficeLocations: vi.fn(),
  getGalleryAlbumIDsFromBlocks: vi.fn(),
  getNewsEventBySlug: vi.fn(),
  getNewsEventDetailMetadata: vi.fn(),
  getNewsEventDetailTemplate: vi.fn(),
  getNewsEventPreviewBySlug: vi.fn(),
  getNewsEventStructuredData: vi.fn(),
  getNewsEventsInheritedRobots: vi.fn(),
  getPayload: vi.fn(),
  loadNewsEventsPreviewSnapshot: vi.fn(),
  loadReviewPreviewSnapshot: vi.fn(),
  newsEventLivePreview: vi.fn(),
}))

vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('next/headers', () => ({ headers: vi.fn().mockResolvedValue(new Headers()) }))
vi.mock('next/navigation', () => ({ notFound: vi.fn(() => new Error('Not found')) }))
vi.mock('payload', () => ({ getPayload: mocks.getPayload }))
vi.mock('@/components/live-preview/NewsEventLivePreview', () => ({
  NewsEventLivePreview: (props: unknown) => {
    mocks.newsEventLivePreview(props)
    return createElement('div', { 'data-news-event-live-preview': 'true' })
  },
}))
vi.mock('@/components/news-events/NewsEventDetailPage', () => ({
  NewsEventDetailPage: ({ entry }: { entry: { title: string } }) =>
    createElement('div', null, entry.title),
}))
vi.mock('@/lib/newsEventDetailTemplate', () => ({
  getNewsEventDetailTemplate: mocks.getNewsEventDetailTemplate,
}))
vi.mock('@/lib/eventGallery', () => ({
  getDraftEventGalleryAlbums: mocks.getDraftEventGalleryAlbums,
}))
vi.mock('@/lib/eventGalleryShared', () => ({
  getGalleryAlbumIDsFromBlocks: mocks.getGalleryAlbumIDsFromBlocks,
}))
vi.mock('@/lib/newsEvents', () => ({
  getNewsEventBySlug: mocks.getNewsEventBySlug,
  getNewsEventPreviewBySlug: mocks.getNewsEventPreviewBySlug,
  getNewsEventsInheritedRobots: mocks.getNewsEventsInheritedRobots,
}))
vi.mock('@/lib/newsEventsMetadata', () => ({
  getNewsEventDetailMetadata: mocks.getNewsEventDetailMetadata,
  getNewsEventStructuredData: mocks.getNewsEventStructuredData,
}))
vi.mock('@/lib/newsEventsPreviewSnapshot', () => ({
  loadNewsEventsPreviewSnapshot: mocks.loadNewsEventsPreviewSnapshot,
}))
vi.mock('@/lib/reviewPreviewSnapshot', () => ({
  loadReviewPreviewSnapshot: mocks.loadReviewPreviewSnapshot,
}))
vi.mock('@/lib/siteOffices', () => ({
  getDraftSiteOfficeLocations: mocks.getDraftSiteOfficeLocations,
}))

import NewsEventEntryPage, {
  generateMetadata as generateDetailMetadata,
} from '@/app/(frontend)/news-events/[slug]/page'

describe('News & Events metadata routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth.mockResolvedValue({ user: { id: 'admin' } })
    mocks.getPayload.mockResolvedValue({ auth: mocks.auth })
    mocks.getDraftEventGalleryAlbums.mockResolvedValue([])
    mocks.getDraftSiteOfficeLocations.mockResolvedValue([])
    mocks.getGalleryAlbumIDsFromBlocks.mockReturnValue([])
    mocks.getNewsEventsInheritedRobots.mockResolvedValue('noindex,follow')
    mocks.getNewsEventDetailTemplate.mockResolvedValue({
      layout: [
        {
          authorLabel: 'Management, SNMIH',
          blockType: 'newsEventsContent',
        },
      ],
    })
    mocks.getNewsEventStructuredData.mockReturnValue({ '@type': 'NewsArticle' })
    mocks.loadNewsEventsPreviewSnapshot.mockResolvedValue({
      annualCalendarByScope: {},
      calendarByScope: {},
      classificationsByScope: {},
      groupsByScope: {},
      highlightsByScope: {},
      newsGridByCount: {},
    })
    mocks.loadReviewPreviewSnapshot.mockResolvedValue({
      feedPagesBySize: {},
      ratingDistribution: null,
    })
  })

  it('passes inherited robots to detail metadata', async () => {
    const entry = { href: '/news-events/example', title: 'Example' }
    mocks.getNewsEventBySlug.mockResolvedValue(entry)
    mocks.getNewsEventDetailMetadata.mockReturnValue({ title: 'Detail metadata' })

    await expect(
      generateDetailMetadata({
        params: Promise.resolve({ slug: 'example' }),
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toEqual({ title: 'Detail metadata' })
    expect(mocks.getNewsEventDetailMetadata).toHaveBeenCalledWith(entry, 'noindex,follow')
  })

  it('loads the shared template for production presentation and structured data', async () => {
    const entry = { href: '/news-events/example', title: 'Example' }
    mocks.getNewsEventBySlug.mockResolvedValue(entry)

    const result = await NewsEventEntryPage({
      params: Promise.resolve({ slug: 'example' }),
      searchParams: Promise.resolve({}),
    })
    const markup = renderToStaticMarkup(result)

    expect(mocks.getNewsEventDetailTemplate).toHaveBeenCalledOnce()
    expect(mocks.getNewsEventStructuredData).toHaveBeenCalledWith(entry, 'Management, SNMIH')
    expect(markup).toContain('Example')
  })

  it('server-loads detail preview snapshots and passes them to the client-safe renderer', async () => {
    const entry = { id: 'entry-1', title: 'Draft example' }
    const pageBlocks = [
      { blockType: 'reviewFeed', pageSize: 6 },
      { blockType: 'newsGrid', totalCards: 3 },
      { blockType: 'contact24' },
      { blockType: 'eventGallery', galleryAlbums: ['album-1'] },
      {
        blockType: 'imageMosaic',
        contentSource: 'galleryAlbums',
        galleryAlbums: ['album-2'],
      },
    ]
    const template = {
      layout: [...pageBlocks, { blockType: 'newsEventsContent' }],
    }
    const reviewSnapshot = { feedPagesBySize: { 6: { docs: [] } }, ratingDistribution: null }
    const newsEventsSnapshot = {
      annualCalendarByScope: {},
      calendarByScope: {},
      classificationsByScope: {},
      groupsByScope: {},
      highlightsByScope: {},
      newsGridByCount: { 3: [] },
    }
    const officeLocations = [{ id: 'office-1', name: 'Main Office' }]
    const eventGalleryAlbums = [
      { id: 'album-1', title: 'Annual Day' },
      { id: 'album-2', title: 'Campus Life' },
    ]
    mocks.getNewsEventPreviewBySlug.mockResolvedValue(entry)
    mocks.getNewsEventDetailTemplate.mockResolvedValue(template)
    mocks.getGalleryAlbumIDsFromBlocks.mockReturnValue(['album-1', 'album-2'])
    mocks.loadReviewPreviewSnapshot.mockResolvedValue(reviewSnapshot)
    mocks.loadNewsEventsPreviewSnapshot.mockResolvedValue(newsEventsSnapshot)
    mocks.getDraftSiteOfficeLocations.mockResolvedValue(officeLocations)
    mocks.getDraftEventGalleryAlbums.mockResolvedValue(eventGalleryAlbums)

    const result = await NewsEventEntryPage({
      params: Promise.resolve({ slug: 'draft-example' }),
      searchParams: Promise.resolve({ preview: 'true' }),
    })
    const markup = renderToStaticMarkup(result)

    expect(mocks.getNewsEventPreviewBySlug).toHaveBeenCalledWith(
      'draft-example',
      expect.objectContaining({ id: 'admin' }),
    )
    expect(mocks.getNewsEventDetailTemplate).toHaveBeenCalledOnce()
    expect(mocks.loadReviewPreviewSnapshot).toHaveBeenCalledWith(pageBlocks)
    expect(mocks.loadNewsEventsPreviewSnapshot).toHaveBeenCalledWith(pageBlocks, { id: 'admin' })
    expect(mocks.getDraftSiteOfficeLocations).toHaveBeenCalledOnce()
    expect(mocks.getDraftEventGalleryAlbums).toHaveBeenCalledWith(['album-1', 'album-2'])
    expect(mocks.newsEventLivePreview.mock.calls.at(-1)?.[0]).toMatchObject({
      eventGalleryAlbums,
      initialData: entry,
      initialTemplate: template,
      newsEventsSnapshot,
      officeLocations,
      reviewSnapshot,
    })
    expect(markup).toContain('data-news-event-live-preview="true"')
  })
})
