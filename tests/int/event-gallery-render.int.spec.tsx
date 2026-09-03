import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/components/gallery-slideshow-viewer', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/components/gallery-slideshow-viewer')>()

  return {
    ...original,
    GallerySlideshowViewer: ({
      album,
      onClose,
    }: {
      album: { title: string }
      onClose: () => void
    }) => (
      <div data-testid="event-gallery-viewer">
        {album.title}
        <button onClick={onClose} type="button">
          Close test viewer
        </button>
      </div>
    ),
  }
})

import { EventGallery } from '@/components/event-gallery'
import { EventGalleryBlock } from '@/blocks/EventGallery/config'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

const albums: EventGalleryAlbum[] = [
  {
    cover: {
      alt: 'Yoga session',
      height: 900,
      id: 'image-1',
      src: '/media/yoga.jpg',
      width: 1600,
    },
    createdAt: '2026-07-26T00:00:00.000Z',
    description: 'A day of movement and community.',
    eventDate: '2026-06-21T00:00:00.000Z',
    id: 'album-1',
    imageCount: 2,
    images: [
      {
        alt: 'Yoga session',
        height: 900,
        id: 'image-1',
        src: '/media/yoga.jpg',
        width: 1600,
      },
      {
        alt: 'Group meditation',
        caption: 'Closing meditation',
        height: 900,
        id: 'image-2',
        src: '/media/meditation.jpg',
        width: 1600,
      },
    ],
    title: 'Yoga Day',
  },
  {
    cover: {
      alt: 'Students arriving',
      height: 900,
      id: 'image-3',
      src: '/media/students.jpg',
      width: 1600,
    },
    createdAt: '2026-07-25T00:00:00.000Z',
    id: 'album-2',
    imageCount: 1,
    images: [
      {
        alt: 'Students arriving',
        height: 900,
        id: 'image-3',
        src: '/media/students.jpg',
        width: 1600,
      },
    ],
    title: 'New Batch Day',
  },
]

const mosaicAlbums: EventGalleryAlbum[] = Array.from({ length: 6 }, (_, index) => {
  const source = albums[index % albums.length]

  return {
    ...source,
    cover: { ...source.cover, id: `${source.cover.id}-${index}` },
    id: `${source.id}-${index}`,
    images: source.images.map((image) => ({ ...image, id: `${image.id}-${index}` })),
    title: `${source.title} ${index + 1}`,
  }
})

beforeAll(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      disconnect() {}
      observe() {}
      takeRecords() {
        return []
      }
      unobserve() {}
    },
  )
})

afterAll(() => vi.unstubAllGlobals())
afterEach(cleanup)

describe('event gallery presentation', () => {
  it('defines a block-wide slideshow switch enabled by default', () => {
    const tabsField = EventGalleryBlock.fields[0]

    if (tabsField.type !== 'tabs') throw new Error('Expected Event Gallery tabs')

    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const slideshowField = contentTab?.fields.find(
      (field) => 'name' in field && field.name === 'enableAlbumSlideshow',
    )

    expect(slideshowField).toMatchObject({
      defaultValue: true,
      label: 'Enable Album Slideshow',
      type: 'checkbox',
    })
  })

  it('uses shared section sizing and renders album cards in the provided order', () => {
    const html = renderToStaticMarkup(
      <EventGallery
        albums={albums}
        alignment="center"
        appearance={{ background: 'subtle', border: 'topAndBottom' }}
        description="Recent events"
        eyebrow="Moments"
        size="compact"
        title="Event gallery"
      />,
    )

    expect(html).toContain('data-event-gallery="true"')
    expect(html).toContain('data-event-gallery-alignment="center"')
    expect(html).toContain('data-event-gallery-size="compact"')
    expect(html).toContain('bg-subtle')
    expect(html.indexOf('Yoga Day')).toBeLessThan(html.indexOf('New Batch Day'))
    expect(html).toContain('Open Yoga Day gallery with 2 images')
  })

  it('renders the configured rectangular quilt and shared overlay contract', () => {
    const html = renderToStaticMarkup(
      <EventGallery
        albums={mosaicAlbums}
        overlayCoverage="full"
        overlayDirection="bottomToTop"
        overlayStyle="darker"
        themeMode="brand"
        title="Event gallery"
      />,
    )

    expect(html).toContain('data-event-gallery-layout="rectangular-quilt"')
    expect(html).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
    expect(html).toContain('auto-rows-56')
    expect(html).toContain('sm:auto-rows-60')
    expect(html).toContain('lg:auto-rows-64')
    expect(html).not.toContain('columns-1')
    expect(html).toContain('data-event-gallery-overlay-tone="brand"')
    expect(html).toContain('data-event-gallery-overlay-direction="bottomToTop"')
    expect(html).toContain('data-event-gallery-card-overlay="true"')
    expect(html).toContain('data-event-gallery-image-count="true"')
    expect(html).toContain('data-event-gallery-metadata-layout="stacked"')
    expect(html).not.toContain('data-event-gallery-ratio=')
    expect(
      Array.from(html.matchAll(/data-event-gallery-row-span-xl="(\d)"/g), (match) => match[1]),
    ).toEqual(['2', '2', '1', '1', '1', '1'])

    const firstCardContent = html.slice(html.indexOf('data-event-gallery-card-content="true"'))
    expect(firstCardContent.indexOf('data-event-gallery-image-count="true"')).toBeLessThan(
      firstCardContent.indexOf('Jun 21, 2026'),
    )
    expect(firstCardContent.indexOf('Jun 21, 2026')).toBeLessThan(
      firstCardContent.indexOf('Yoga Day 1'),
    )
    expect(firstCardContent).not.toContain('>2 images</span>')
  })

  it('supports always-visible and hover-reveal overlay display modes', () => {
    const legacyHtml = renderToStaticMarkup(<EventGallery albums={albums} title="Legacy gallery" />)
    const hoverHtml = renderToStaticMarkup(
      <EventGallery albums={albums} overlayDisplay="hover" title="Hover gallery" />,
    )
    const hiddenHtml = renderToStaticMarkup(
      <EventGallery albums={albums} showCardOverlay={false} title="Image-only gallery" />,
    )

    expect(legacyHtml).toContain('data-gallery-overlay-display="always"')
    expect(hoverHtml).toContain('data-gallery-overlay-display="hover"')
    expect(hoverHtml).toContain('gallery-overlay-layer')
    expect(hiddenHtml).not.toContain('gallery-overlay-layer')
  })

  it('stacks count, date, and a text-family title for every overlay position', () => {
    for (const position of ['split', 'center', 'middleCenter'] as const) {
      const html = renderToStaticMarkup(
        <EventGallery albums={[albums[0]]} cardTextLayout={position} title="Event gallery" />,
      )
      const cardContent = html.slice(html.indexOf('data-event-gallery-card-content="true"'))

      expect(cardContent).toContain(`data-event-gallery-card-position="${position}"`)
      expect(cardContent).toContain('data-event-gallery-metadata-layout="stacked"')
      expect(cardContent).toContain('font-[family-name:var(--font-text)]')
      expect(cardContent).not.toContain('font-[family-name:var(--font-display)]')
      expect(cardContent).not.toContain('>2 images</span>')

      const imageCountIndex = cardContent.indexOf('data-event-gallery-image-count="true"')
      const eventDateIndex = cardContent.indexOf('Jun 21, 2026')
      const titleIndex = cardContent.indexOf('Yoga Day')

      expect(imageCountIndex).toBeGreaterThan(-1)
      expect(imageCountIndex).toBeLessThan(eventDateIndex)
      expect(eventDateIndex).toBeLessThan(titleIndex)
      expect(cardContent).toContain(
        `data-event-gallery-content-alignment="${position === 'split' ? 'left' : 'center'}"`,
      )
    }
  })

  it('collapses missing rows in the fully centered metadata stack', () => {
    const html = renderToStaticMarkup(
      <EventGallery
        albums={[albums[0]]}
        cardTextLayout="middleCenter"
        showImageCount={false}
        title="Event gallery"
      />,
    )

    const cardContent = html.slice(html.indexOf('data-event-gallery-card-content="true"'))

    expect(html).toContain('data-event-gallery-metadata-layout="stacked"')
    expect(html).not.toContain('data-event-gallery-image-count="true"')
    expect(cardContent.indexOf('Jun 21, 2026')).toBeLessThan(cardContent.indexOf('Yoga Day'))
  })

  it('lets Event Date and Image Count be hidden independently', () => {
    const hiddenMetadata = renderToStaticMarkup(
      <EventGallery
        albums={albums}
        showEventDate={false}
        showImageCount={false}
        title="Event gallery"
      />,
    )

    expect(hiddenMetadata).not.toContain('Jun 21, 2026')
    expect(hiddenMetadata).not.toContain('data-event-gallery-image-count="true"')
  })

  it('can render image-only cards without the details overlay', () => {
    const html = renderToStaticMarkup(
      <EventGallery albums={albums} showCardOverlay={false} title="Event gallery" />,
    )

    expect(html).not.toContain('data-event-gallery-card-overlay="true"')
    expect(html).not.toContain('data-event-gallery-card-content="true"')
  })

  it('keeps legacy and enabled cards interactive while disabled cards are static', () => {
    const enabled = renderToStaticMarkup(
      <EventGallery albums={albums} enableAlbumSlideshow title="Event gallery" />,
    )
    const disabled = renderToStaticMarkup(
      <EventGallery albums={albums} enableAlbumSlideshow={false} title="Static gallery" />,
    )
    const legacy = renderToStaticMarkup(<EventGallery albums={albums} title="Legacy gallery" />)

    expect(enabled).toContain('data-event-gallery-interaction="slideshow"')
    expect(enabled).toContain('<button')
    expect(disabled).toContain('data-event-gallery-interaction="static"')
    expect(disabled).not.toContain('<button')
    expect(disabled).toContain('Yoga Day')
    expect(legacy).toContain('data-event-gallery-interaction="slideshow"')
  })

  it('does not expose button semantics when the slideshow is disabled', () => {
    render(<EventGallery albums={albums} enableAlbumSlideshow={false} title="Static gallery" />)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.getByText('Yoga Day')).toBeTruthy()
  })

  it('opens the selected album viewer and restores focus when it closes', async () => {
    render(<EventGallery albums={albums} title="Event gallery" />)

    const opener = screen.getByRole('button', {
      name: 'Open Yoga Day gallery with 2 images',
    })

    fireEvent.click(opener)

    expect(screen.getByTestId('event-gallery-viewer').textContent).toContain('Yoga Day')

    fireEvent.click(screen.getByRole('button', { name: 'Close test viewer' }))

    await waitFor(() => {
      expect(document.activeElement).toBe(opener)
    })
  })

  it('returns nothing when albums are empty', () => {
    expect(renderToStaticMarkup(<EventGallery albums={[]} title="Event gallery" />)).toBe('')
  })
})
