import { describe, expect, it } from 'vitest'

import {
  getAdjacentImageIndexes,
  getEventGalleryAutoplayAction,
  getEventGalleryCaption,
} from '@/components/event-gallery-viewer'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

const album: EventGalleryAlbum = {
  cover: {
    alt: 'Opening ceremony',
    height: 900,
    id: 'image-1',
    src: '/media/opening.jpg',
    width: 1600,
  },
  createdAt: '2026-07-26T00:00:00.000Z',
  id: 'album-1',
  imageCount: 3,
  images: [
    {
      alt: 'Opening ceremony',
      height: 900,
      id: 'image-1',
      src: '/media/opening.jpg',
      width: 1600,
    },
    {
      alt: 'Independence Day',
      caption: 'Students celebrate together',
      height: 900,
      id: 'image-2',
      src: '/media/celebration.jpg',
      width: 1600,
    },
    {
      alt: 'Closing performance',
      height: 900,
      id: 'image-3',
      src: '/media/performance.jpg',
      width: 1600,
    },
  ],
  title: 'Independence Day',
}

describe('event gallery viewer utilities', () => {
  it('derives looped adjacent images and useful captions', () => {
    expect(getAdjacentImageIndexes(3, 0)).toEqual({ next: 1, previous: 2 })
    expect(getAdjacentImageIndexes(1, 0)).toBeNull()
    expect(getEventGalleryCaption(album.images[0]!, album.title)).toBe('Opening ceremony')
    expect(getEventGalleryCaption(album.images[1]!, album.title)).toBe(
      'Students celebrate together',
    )
    expect(
      getEventGalleryCaption({ ...album.images[0]!, alt: ' independence day ' }, album.title),
    ).toBeUndefined()
  })

  it('derives idle, scheduled, and terminal autoplay actions', () => {
    expect(
      getEventGalleryAutoplayAction({ isAtEnd: false, isMultiple: true, isPlaying: false }),
    ).toBe('idle')
    expect(
      getEventGalleryAutoplayAction({ isAtEnd: false, isMultiple: false, isPlaying: true }),
    ).toBe('idle')
    expect(
      getEventGalleryAutoplayAction({ isAtEnd: false, isMultiple: true, isPlaying: true }),
    ).toBe('schedule')
    expect(
      getEventGalleryAutoplayAction({ isAtEnd: true, isMultiple: true, isPlaying: true }),
    ).toBe('stop')
  })
})
