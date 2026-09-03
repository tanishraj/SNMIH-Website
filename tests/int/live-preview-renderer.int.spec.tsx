import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import type { ReviewPreviewSnapshot } from '@/lib/reviewPreviewShared'
import { EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT } from '@/lib/newsEventsPreviewShared'
import type { Page } from '@/payload-types'

describe('live-preview page block renderer', () => {
  it('covers every production Page block type', () => {
    const productionSource = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')
    const previewSource = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')
    const blockCases = (source: string) =>
      [...source.matchAll(/case '([^']+)'/g)].map((match) => match[1]).sort()

    expect(blockCases(previewSource)).toEqual(blockCases(productionSource))
    expect(previewSource).not.toContain("case 'studyPathways'")
    expect(previewSource).not.toContain('StudyPathwaysBlockComponent')
    expect(previewSource).toContain("case 'academicProgrammes'")
  })

  it('renders every formerly missing block with production behavior', () => {
    const media = (id: string) => ({
      alt: `${id} alt`,
      height: 900,
      id,
      url: `/${id}.jpg`,
      width: 1600,
    })
    const layout = [
      {
        autoplay: false,
        blockType: 'heroCarousel',
        showArrows: false,
        showDots: false,
        slides: [
          { backgroundImage: media('hero-one'), title: 'Preview hero one' },
          { backgroundImage: media('hero-two'), title: 'Preview hero two' },
        ],
      },
      {
        blockType: 'galleryCoverflow',
        images: ['one', 'two', 'three'].map((id) => ({ image: media(id) })),
        title: 'Preview coverflow',
      },
      {
        blockType: 'testimonialGrid',
        testimonials: [{ name: 'Alex Morgan', quote: 'Preview testimonial quote' }],
        title: 'Preview testimonials',
      },
      {
        awards: [{ category: 'award', title: 'Preview excellence award', year: '2026' }],
        blockType: 'awardsList',
        title: 'Preview awards',
      },
      {
        blockType: 'aboutSection',
        body: 'Preview about body',
        title: 'Preview about section',
      },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        [],
      ),
    )

    expect(html).toContain('data-hero-carousel="true"')
    expect(html).toContain('Preview hero one')
    expect(html).not.toContain('Previous slide')
    expect(html).not.toContain('Go to slide')
    expect(html).toContain('data-gallery-coverflow="true"')
    expect(html).toContain('Preview coverflow')
    expect(html).toContain('Preview testimonial quote')
    expect(html).toContain('Preview excellence award')
    expect(html).toContain('Preview about section')
    expect(html).toContain('Preview about body')
  })

  it('renders formerly missing blocks through Reusable Sections', () => {
    const layout = [
      {
        blockType: 'reusableSection',
        section: {
          id: 'shared-awards',
          layout: [
            {
              awards: [{ title: 'Nested preview award' }],
              blockType: 'awardsList',
              title: 'Nested awards',
            },
          ],
          title: 'Shared awards',
        },
      },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        [],
      ),
    )

    expect(html).toContain('Nested preview award')
  })

  it('renders review blocks from the server-provided snapshot', () => {
    const snapshot: ReviewPreviewSnapshot = {
      feedPagesBySize: {
        '8': {
          docs: [
            {
              authorName: 'Alex M.',
              content: 'Review loaded for page size eight',
              date: 'Jul 19, 2026',
              id: 'review-8',
              rating: 5,
              title: 'Matching snapshot page',
              verified: true,
            },
          ],
          hasNextPage: false,
          page: 1,
          totalPages: 1,
        },
      },
      ratingDistribution: { average: 4.5, count: 2, counts: [0, 0, 0, 1, 1] },
    }
    const layout = [
      { blockType: 'ratingSpotlight', title: 'Live rating' },
      { blockType: 'reviewFeed', pageSize: 8, title: 'Reviews' },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(layout, snapshot, EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT, [], []),
    )

    expect(html).toContain('Live rating')
    expect(html).toContain('4.5 / 5')
    expect(html).toContain('Reviews')
    expect(html).toContain('Review loaded for page size eight')
  })

  it('renders contact24 from the server-provided draft office snapshot', () => {
    const offices = [
      {
        id: 'draft-office',
        region: 'Middle East',
        city: 'Draft Dubai',
        address: 'DIFC',
        phone: '+971 4 555 0123',
        phoneHref: 'tel:+97145550123',
        email: 'dubai@example.com',
        mapEmbedUrl: 'https://www.google.com/maps/embed?pb=draft',
        mapUrl: 'https://maps.google.com/?q=Dubai',
        mapTitle: 'Interactive map for the draft Dubai office',
        showAddressDetails: true,
      },
    ]
    const layout = [
      {
        blockType: 'contact24',
        title: 'Global offices',
      },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: {
            average: 0,
            count: 0,
            counts: [0, 0, 0, 0, 0],
          },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        offices,
        [],
      ),
    )

    expect(html).toContain('Global offices')
    expect(html).toContain('Draft Dubai')
    expect(html).toContain('data-contact24-size="default"')
  })

  it('renders eventGallery from the server-provided draft album snapshot', () => {
    const layout = [
      {
        blockType: 'eventGallery',
        cardTextLayout: 'middleCenter',
        displayOrder: 'manual',
        galleryAlbums: ['draft-album'],
        overlayCoverage: 'full',
        overlayDirection: 'bottomToTop',
        overlayStyle: 'darker',
        showCardOverlay: true,
        showEventDate: false,
        showImageCount: false,
        themeMode: 'brand',
        title: 'Event gallery',
      },
    ] as unknown as NonNullable<Page['layout']>
    const albums = [
      {
        cover: {
          alt: 'Draft event',
          height: 900,
          id: 'draft-image',
          src: '/media/draft-event.jpg',
          width: 1600,
        },
        createdAt: '2026-07-27T00:00:00.000Z',
        id: 'draft-album',
        imageCount: 1,
        images: [
          {
            alt: 'Draft event',
            height: 900,
            id: 'draft-image',
            src: '/media/draft-event.jpg',
            width: 1600,
          },
        ],
        title: 'Draft Yoga Day',
      },
    ]
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: {
            average: 0,
            count: 0,
            counts: [0, 0, 0, 0, 0],
          },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        albums,
      ),
    )

    expect(html).toContain('Event gallery')
    expect(html).toContain('Draft Yoga Day')
    expect(html).toContain('data-event-gallery="true"')
    expect(html).toContain('data-event-gallery-layout="rectangular-quilt"')
    expect(html).toContain('data-event-gallery-card-position="middleCenter"')
    expect(html).toContain('data-event-gallery-overlay-tone="brand"')
    expect(html).toContain('data-event-gallery-overlay-strength="darker"')
    expect(html).not.toContain('data-event-gallery-image-count="true"')
  })

  it('filters a shared album snapshot independently for multiple blocks', () => {
    const sharedAlbums = [
      {
        cover: {
          alt: 'Yoga Day',
          height: 900,
          id: 'yoga-image',
          src: '/media/yoga.jpg',
          width: 1600,
        },
        createdAt: '2026-07-27T00:00:00.000Z',
        eventDate: '2026-06-21T00:00:00.000Z',
        id: 'yoga',
        imageCount: 1,
        images: [
          {
            alt: 'Yoga Day',
            height: 900,
            id: 'yoga-image',
            src: '/media/yoga.jpg',
            width: 1600,
          },
        ],
        title: 'Yoga Day',
      },
      {
        cover: {
          alt: 'Independence Day',
          height: 900,
          id: 'independence-image',
          src: '/media/independence.jpg',
          width: 1600,
        },
        createdAt: '2026-07-20T00:00:00.000Z',
        eventDate: '2026-08-15T00:00:00.000Z',
        id: 'independence',
        imageCount: 1,
        images: [
          {
            alt: 'Independence Day',
            height: 900,
            id: 'independence-image',
            src: '/media/independence.jpg',
            width: 1600,
          },
        ],
        title: 'Independence Day',
      },
    ]
    const layout = [
      {
        blockType: 'eventGallery',
        displayOrder: 'manual',
        galleryAlbums: ['yoga'],
        title: 'Manual gallery',
      },
      {
        blockType: 'eventGallery',
        displayOrder: 'latestEventDate',
        galleryAlbums: ['yoga', 'independence'],
        title: 'Latest gallery',
      },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: {
            average: 0,
            count: 0,
            counts: [0, 0, 0, 0, 0],
          },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        sharedAlbums,
      ),
    )
    const firstBlockStart = html.indexOf('Manual gallery')
    const secondBlockStart = html.indexOf('Latest gallery')
    const firstBlockHTML = html.slice(firstBlockStart, secondBlockStart)
    const secondBlockHTML = html.slice(secondBlockStart)

    expect(firstBlockHTML).toContain('Yoga Day')
    expect(firstBlockHTML).not.toContain('Independence Day')
    expect(secondBlockHTML.indexOf('Independence Day')).toBeLessThan(
      secondBlockHTML.indexOf('Yoga Day'),
    )
  })

  it('renders Gallery Album Tabs from the selected draft album snapshot', () => {
    const layout = [
      {
        allTabLabel: 'Every moment',
        blockType: 'galleryAlbumTabs',
        displayOrder: 'manual',
        galleryAlbums: ['draft-gallery'],
        imagesPerLoad: '6',
        tabVariant: 'pill',
      },
    ] as unknown as NonNullable<Page['layout']>
    const albums = [
      {
        cover: {
          alt: 'Draft gallery image',
          height: 900,
          id: 'draft-row',
          mediaID: 'draft-media',
          src: '/media/draft-gallery.jpg',
          width: 1600,
        },
        createdAt: '2026-08-18T00:00:00.000Z',
        id: 'draft-gallery',
        imageCount: 1,
        images: [
          {
            alt: 'Draft gallery image',
            height: 900,
            id: 'draft-row',
            mediaID: 'draft-media',
            src: '/media/draft-gallery.jpg',
            width: 1600,
          },
        ],
        title: 'Draft campus life',
      },
    ]
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        albums,
      ),
    )

    expect(html).toContain('data-gallery-album-tabs-block="true"')
    expect(html).toContain('data-gallery-album-tabs-variant="pill"')
    expect(html).toContain('Every moment')
    expect(html).toContain('Draft campus life')
    expect(html).toContain('Draft gallery image')
  })

  it('renders album-backed Image Mosaic from the server-provided draft snapshot', () => {
    const sharedAlbums = [
      {
        cover: {
          alt: 'Draft mosaic album',
          height: 900,
          id: 'mosaic-image',
          src: '/media/mosaic.jpg',
          width: 1600,
        },
        createdAt: '2026-08-18T00:00:00.000Z',
        eventDate: '2026-08-18T00:00:00.000Z',
        id: 'draft-mosaic-album',
        imageCount: 1,
        images: [
          {
            alt: 'Draft mosaic album',
            height: 900,
            id: 'mosaic-image',
            src: '/media/mosaic.jpg',
            width: 1600,
          },
        ],
        title: 'Selected draft mosaic album',
      },
      {
        cover: {
          alt: 'Unselected album',
          height: 900,
          id: 'unselected-image',
          src: '/media/unselected.jpg',
          width: 1600,
        },
        createdAt: '2026-08-19T00:00:00.000Z',
        id: 'unselected-album',
        imageCount: 1,
        images: [
          {
            alt: 'Unselected album',
            height: 900,
            id: 'unselected-image',
            src: '/media/unselected.jpg',
            width: 1600,
          },
        ],
        title: 'Unselected album',
      },
    ]
    const layout = [
      {
        blockType: 'imageMosaic',
        contentSource: 'galleryAlbums',
        displayOrder: 'manual',
        enableAlbumSlideshow: false,
        galleryAlbums: ['draft-mosaic-album'],
        title: 'Draft mosaic albums',
      },
    ] as unknown as NonNullable<Page['layout']>
    const html = renderToStaticMarkup(
      renderLivePreviewPageBlocks(
        layout,
        {
          feedPagesBySize: {},
          ratingDistribution: { average: 0, count: 0, counts: [0, 0, 0, 0, 0] },
        },
        EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT,
        [],
        sharedAlbums,
      ),
    )

    expect(html).toContain('Draft mosaic albums')
    expect(html).toContain('data-image-mosaic-source="galleryAlbums"')
    expect(html).toContain('Selected draft mosaic album')
    expect(html).toContain('data-image-mosaic-album-interaction="static"')
    expect(html).not.toContain('Unselected album')
  })
})
