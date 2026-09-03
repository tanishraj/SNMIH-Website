import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { GalleryAlbumTabsBlockPresentation } from '@/blocks/GalleryAlbumTabs/Presentation'
import { GalleryAlbumTabsBlock } from '@/blocks/GalleryAlbumTabs/config'
import {
  normalizeGalleryAlbumTabsImagesPerLoad,
  normalizeGalleryAlbumTabsVariant,
  resolveGalleryAlbumTabs,
} from '@/blocks/GalleryAlbumTabs/galleryAlbumTabsShared'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

vi.mock('@/components/gallery-slideshow-viewer', () => ({
  GallerySlideshowViewer: ({
    album,
    initialIndex,
    onClose,
  }: {
    album: EventGalleryAlbum
    initialIndex?: number
    onClose: () => void
  }) => (
    <div aria-label={`${album.title} gallery`} role="dialog">
      <span>{`${initialIndex ?? 0}:${album.images.length}`}</span>
      <button onClick={onClose} type="button">
        Close test viewer
      </button>
    </div>
  ),
}))

const albums: EventGalleryAlbum[] = [
  {
    id: 'album-a',
    title: 'Campus Life',
    createdAt: '2026-08-18T00:00:00.000Z',
    cover: {
      id: 'row-a1',
      mediaID: 'media-1',
      alt: 'Shared',
      src: '/shared.jpg',
      width: 1600,
      height: 900,
    },
    imageCount: 2,
    images: [
      {
        id: 'row-a1',
        mediaID: 'media-1',
        alt: 'Shared',
        src: '/shared.jpg',
        width: 1600,
        height: 900,
      },
      {
        id: 'row-a2',
        mediaID: 'media-2',
        alt: 'Lecture',
        src: '/lecture.jpg',
        width: 1600,
        height: 900,
      },
    ],
  },
  {
    id: 'album-b',
    title: 'Yoga Day',
    createdAt: '2026-08-17T00:00:00.000Z',
    cover: {
      id: 'row-b1',
      mediaID: 'media-1',
      alt: 'Shared again',
      src: '/shared.jpg',
      width: 1600,
      height: 900,
    },
    imageCount: 2,
    images: [
      {
        id: 'row-b1',
        mediaID: 'media-1',
        alt: 'Shared again',
        src: '/shared.jpg',
        width: 1600,
        height: 900,
      },
      {
        id: 'row-b2',
        mediaID: 'media-3',
        alt: 'Yoga',
        src: '/yoga.jpg',
        width: 1600,
        height: 900,
      },
    ],
  },
]

const interactiveAlbums: EventGalleryAlbum[] = [
  {
    ...albums[0]!,
    imageCount: 6,
    images: Array.from({ length: 6 }, (_, index) => ({
      alt: `Campus image ${index + 1}`,
      height: 900,
      id: `campus-row-${index + 1}`,
      mediaID: `campus-media-${index + 1}`,
      src: `/campus-${index + 1}.jpg`,
      width: 1600,
    })),
  },
  {
    ...albums[1]!,
    imageCount: 4,
    images: Array.from({ length: 4 }, (_, index) => ({
      alt: `Yoga image ${index + 1}`,
      height: 900,
      id: `yoga-row-${index + 1}`,
      mediaID: `yoga-media-${index + 1}`,
      src: `/yoga-${index + 1}.jpg`,
      width: 1600,
    })),
  },
]

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  })
})

afterEach(cleanup)

describe('Gallery Album Tabs block', () => {
  it('keeps All first, derives album labels, and de-duplicates All by Media ID', () => {
    const tabs = resolveGalleryAlbumTabs(albums, 'Everything')

    expect(tabs.map(({ id, label }) => ({ id, label }))).toEqual([
      { id: 'all', label: 'Everything' },
      { id: 'album-a', label: 'Campus Life' },
      { id: 'album-b', label: 'Yoga Day' },
    ])
    expect(tabs[0]?.images.map(({ mediaID }) => mediaID)).toEqual(['media-1', 'media-2', 'media-3'])
    expect(tabs[1]?.images).toHaveLength(2)
    expect(tabs[2]?.images).toHaveLength(2)
  })

  it('falls back to All and de-duplicates fixtures without Media IDs by source URL', () => {
    const duplicateWithoutMediaID = {
      ...albums[1]!.images[0]!,
      id: 'another-row',
      mediaID: undefined,
    }
    const albumsWithoutMediaID = [
      {
        ...albums[0]!,
        images: albums[0]!.images.map(({ mediaID: _mediaID, ...image }) => image),
      },
      {
        ...albums[1]!,
        images: [duplicateWithoutMediaID],
      },
    ]

    const tabs = resolveGalleryAlbumTabs(albumsWithoutMediaID, ' ')

    expect(tabs[0]?.label).toBe('All')
    expect(tabs[0]?.images).toHaveLength(2)
  })

  it('normalizes legacy and invalid presentation values', () => {
    expect(normalizeGalleryAlbumTabsVariant(undefined)).toBe('underline')
    expect(normalizeGalleryAlbumTabsVariant('contained')).toBe('contained')
    expect(normalizeGalleryAlbumTabsVariant('pill')).toBe('pill')
    expect(normalizeGalleryAlbumTabsVariant('invalid')).toBe('underline')
    expect(normalizeGalleryAlbumTabsImagesPerLoad(undefined)).toBe(9)
    expect(normalizeGalleryAlbumTabsImagesPerLoad('6')).toBe(6)
    expect(normalizeGalleryAlbumTabsImagesPerLoad(12)).toBe(12)
    expect(normalizeGalleryAlbumTabsImagesPerLoad('4')).toBe(9)
  })

  it('defines selected albums, labels, batch size, and three tab variants', () => {
    expect(GalleryAlbumTabsBlock).toMatchObject({
      slug: 'galleryAlbumTabs',
      interfaceName: 'GalleryAlbumTabsBlock',
      labels: {
        singular: 'Gallery Album Tabs',
        plural: 'Gallery Album Tabs',
      },
    })

    const serialized = JSON.stringify(GalleryAlbumTabsBlock.fields)

    expect(serialized).toContain('galleryAlbums')
    expect(serialized).toContain('imagesPerLoad')
    expect(serialized).toContain('allTabLabel')
    expect(serialized).toContain('loadMoreLabel')
    expect(serialized).toContain('emptyStateMessage')
    expect(serialized).toContain('contained')
    expect(serialized).toContain('pill')
    expect(serialized).toContain('underline')
  })

  it('renders All first and preserves independent Load More progress per tab', () => {
    const { container } = render(
      <GalleryAlbumTabsBlockPresentation
        albums={interactiveAlbums}
        imagesPerLoad="6"
        title="Gallery moments"
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'All',
      'Campus Life',
      'Yoga Day',
    ])
    expect(container.querySelectorAll('[data-gallery-album-tabs-tile="true"]')).toHaveLength(6)

    fireEvent.click(screen.getByRole('button', { name: 'Load More' }))
    expect(container.querySelectorAll('[data-gallery-album-tabs-tile="true"]')).toHaveLength(10)

    fireEvent.click(screen.getByRole('tab', { name: 'Campus Life' }))
    expect(container.querySelectorAll('[data-gallery-album-tabs-tile="true"]')).toHaveLength(6)
    expect(screen.queryByRole('button', { name: 'Load More' })).toBeNull()

    fireEvent.click(screen.getByRole('tab', { name: 'All' }))
    expect(container.querySelectorAll('[data-gallery-album-tabs-tile="true"]')).toHaveLength(10)
  })

  it('supports wrapped arrow navigation plus Home and End across tabs', () => {
    render(<GalleryAlbumTabsBlockPresentation albums={interactiveAlbums} />)

    const all = screen.getByRole('tab', { name: 'All' })
    const campus = screen.getByRole('tab', { name: 'Campus Life' })
    const yoga = screen.getByRole('tab', { name: 'Yoga Day' })

    all.focus()
    fireEvent.keyDown(all, { key: 'ArrowLeft' })
    expect(document.activeElement).toBe(yoga)
    expect(yoga.getAttribute('aria-selected')).toBe('true')

    fireEvent.keyDown(yoga, { key: 'Home' })
    expect(document.activeElement).toBe(all)

    fireEvent.keyDown(all, { key: 'End' })
    expect(document.activeElement).toBe(yoga)

    fireEvent.keyDown(yoga, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(all)
    expect(campus.getAttribute('aria-selected')).toBe('false')
  })

  it('opens the complete active-tab slideshow at the selected image and restores focus', () => {
    const { container } = render(
      <GalleryAlbumTabsBlockPresentation albums={interactiveAlbums} imagesPerLoad="6" />,
    )
    const secondTile = container.querySelectorAll<HTMLButtonElement>(
      '[data-gallery-album-tabs-tile="true"]',
    )[1]

    secondTile?.focus()
    fireEvent.click(secondTile!)

    expect(screen.getByRole('dialog', { name: 'All gallery' }).textContent).toContain('1:10')
    fireEvent.click(screen.getByRole('button', { name: 'Close test viewer' }))
    expect(document.activeElement).toBe(secondTile)
  })

  it('renders all three tab treatments and a useful empty state without requiring a header', () => {
    for (const tabVariant of ['contained', 'pill', 'underline'] as const) {
      const { container, unmount } = render(
        <GalleryAlbumTabsBlockPresentation albums={interactiveAlbums} tabVariant={tabVariant} />,
      )

      const tabList = screen.getByRole('tablist', { name: 'Gallery albums' })
      const wrapper = container.querySelector('[data-gallery-album-tabs-tablist="true"]')
      const frame = wrapper?.querySelector('[data-scrollable-content-tab-frame="true"]')
      const viewport = wrapper?.querySelector('[data-scrollable-content-tab-viewport="true"]')

      expect(container.querySelector('[data-gallery-album-tabs-header="true"]')).toBeNull()
      expect(
        container
          .querySelector('[data-gallery-album-tabs-variant]')
          ?.getAttribute('data-gallery-album-tabs-variant'),
      ).toBe(tabVariant)
      expect(tabList.getAttribute('data-content-tab-variant')).toBe(tabVariant)
      expect(tabList.className).toContain('min-w-full')
      expect(tabList.className).toContain('w-max')
      expect(tabList.className).toContain('flex-nowrap')
      expect(frame?.className).toContain('overflow-hidden')
      expect(viewport?.className).toContain('overflow-x-auto')
      expect(viewport?.contains(tabList)).toBe(true)

      for (const tab of screen.getAllByRole('tab')) {
        expect(tab.className).toContain('w-auto')
        expect(tab.className).toContain('shrink-0')
        expect(tab.className).not.toContain('flex-1')
        expect(tab.className).not.toContain('sm:min-w-32')
      }

      unmount()
    }

    expect(normalizeGalleryAlbumTabsVariant(undefined)).toBe('underline')
    expect(normalizeGalleryAlbumTabsVariant('invalid')).toBe('underline')

    render(
      <GalleryAlbumTabsBlockPresentation
        albums={[]}
        emptyStateMessage="No photographs have been published."
        title="Gallery moments"
      />,
    )
    expect(screen.getByText('No photographs have been published.')).toBeTruthy()
    expect(screen.queryByRole('tablist')).toBeNull()
  })
})
