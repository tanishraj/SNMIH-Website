import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublishedEventGalleryAlbums: vi.fn(),
}))

vi.mock('@/lib/eventGallery', () => ({
  getPublishedEventGalleryAlbums: mocks.getPublishedEventGalleryAlbums,
}))

import { EventGalleryBlockComponent } from '@/blocks/EventGallery/Component'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

const createAlbum = ({
  createdAt,
  eventDate,
  id,
  title,
}: {
  createdAt: string
  eventDate: string
  id: string
  title: string
}): EventGalleryAlbum => ({
  cover: {
    alt: title,
    height: 900,
    id: `${id}-image`,
    src: `/media/${id}.jpg`,
    width: 1600,
  },
  createdAt,
  eventDate,
  id,
  imageCount: 1,
  images: [
    {
      alt: title,
      height: 900,
      id: `${id}-image`,
      src: `/media/${id}.jpg`,
      width: 1600,
    },
  ],
  title,
})

const yogaDay = createAlbum({
  createdAt: '2026-07-26T00:00:00.000Z',
  eventDate: '2026-06-21T00:00:00.000Z',
  id: 'yoga-day',
  title: 'Yoga Day',
})
const independenceDay = createAlbum({
  createdAt: '2026-07-20T00:00:00.000Z',
  eventDate: '2026-08-15T00:00:00.000Z',
  id: 'independence-day',
  title: 'Independence Day',
})

beforeEach(() => {
  mocks.getPublishedEventGalleryAlbums.mockReset()
  mocks.getPublishedEventGalleryAlbums.mockResolvedValue([independenceDay, yogaDay])
})

describe('Event Gallery public selection', () => {
  it('loads only selected IDs and preserves manual relationship order', async () => {
    const element = await EventGalleryBlockComponent({
      displayOrder: 'manual',
      galleryAlbums: [{ id: 'yoga-day' }, 'independence-day'],
      title: 'Events',
    })
    const html = renderToStaticMarkup(element)

    expect(mocks.getPublishedEventGalleryAlbums).toHaveBeenCalledWith([
      'yoga-day',
      'independence-day',
    ])
    expect(html.indexOf('Yoga Day')).toBeLessThan(html.indexOf('Independence Day'))
  })

  it('orders selected albums by latest Event Date', async () => {
    const element = await EventGalleryBlockComponent({
      displayOrder: 'latestEventDate',
      galleryAlbums: ['yoga-day', 'independence-day'],
      title: 'Events',
    })
    const html = renderToStaticMarkup(element)

    expect(html.indexOf('Independence Day')).toBeLessThan(html.indexOf('Yoga Day'))
  })

  it('renders selected albums without requiring a section title', async () => {
    const element = await EventGalleryBlockComponent({
      displayOrder: 'latestEventDate',
      galleryAlbums: ['yoga-day', 'independence-day'],
    })
    const html = renderToStaticMarkup(element)

    expect(html).toContain('data-event-gallery="true"')
    expect(html).toContain('Independence Day')
    expect(html).not.toContain('<h2')
  })

  it('renders nothing and skips the loader without a selection', async () => {
    await expect(
      EventGalleryBlockComponent({
        displayOrder: 'latestEventDate',
        galleryAlbums: [],
        title: 'Events',
      }),
    ).resolves.toBeNull()
    expect(mocks.getPublishedEventGalleryAlbums).not.toHaveBeenCalled()
  })
})
