import { describe, expect, it } from 'vitest'

import {
  getEventGalleryQuiltGridClassName,
  getEventGalleryQuiltRowSpanClassName,
  getEventGalleryQuiltRowSpans,
  normalizeEventGalleryCardTextLayout,
} from '@/components/event-gallery-presentation'
import { normalizeGalleryAlbumContentPosition } from '@/components/gallery-album-overlay-content'

describe('Event Gallery presentation settings', () => {
  it('normalizes legacy and current overlay content positions', () => {
    expect(normalizeGalleryAlbumContentPosition('split')).toBe('split')
    expect(normalizeGalleryAlbumContentPosition('center')).toBe('center')
    expect(normalizeGalleryAlbumContentPosition('middleCenter')).toBe('middleCenter')
    expect(normalizeGalleryAlbumContentPosition('invalid')).toBe('split')
    expect(normalizeEventGalleryCardTextLayout('split')).toBe('split')
    expect(normalizeEventGalleryCardTextLayout('center')).toBe('center')
    expect(normalizeEventGalleryCardTextLayout('middleCenter')).toBe('middleCenter')
    expect(normalizeEventGalleryCardTextLayout('invalid')).toBe('split')
  })

  it('bounds responsive columns by the album count', () => {
    expect(getEventGalleryQuiltGridClassName(1)).toBe('grid-cols-1')
    expect(getEventGalleryQuiltGridClassName(2)).toBe('grid-cols-1 sm:grid-cols-2')
    expect(getEventGalleryQuiltGridClassName(3)).toBe('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')
    expect(getEventGalleryQuiltGridClassName(8)).toBe(
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    )
  })

  it('fills two-, three-, and four-column rectangles without changing source order', () => {
    expect(Array.from({ length: 5 }, (_, index) => getEventGalleryQuiltRowSpans(5, index))).toEqual(
      [
        { base: 1, sm: 2, lg: 2, xl: 2 },
        { base: 1, sm: 1, lg: 1, xl: 2 },
        { base: 1, sm: 1, lg: 1, xl: 2 },
        { base: 1, sm: 1, lg: 1, xl: 1 },
        { base: 1, sm: 1, lg: 1, xl: 1 },
      ],
    )

    expect(Array.from({ length: 6 }, (_, index) => getEventGalleryQuiltRowSpans(6, index))).toEqual(
      [
        { base: 1, sm: 1, lg: 1, xl: 2 },
        { base: 1, sm: 1, lg: 1, xl: 2 },
        { base: 1, sm: 1, lg: 1, xl: 1 },
        { base: 1, sm: 1, lg: 1, xl: 1 },
        { base: 1, sm: 1, lg: 1, xl: 1 },
        { base: 1, sm: 1, lg: 1, xl: 1 },
      ],
    )
  })

  it('returns only static Tailwind row-span classes', () => {
    expect(getEventGalleryQuiltRowSpanClassName({ base: 1, sm: 2, lg: 1, xl: 2 })).toBe(
      'row-span-1 sm:row-span-2 lg:row-span-1 xl:row-span-2',
    )
  })

  it('fills the active responsive grid exactly for every representative album count', () => {
    for (let albumCount = 1; albumCount <= 16; albumCount += 1) {
      const spans = Array.from({ length: albumCount }, (_, index) =>
        getEventGalleryQuiltRowSpans(albumCount, index),
      )

      for (const [breakpoint, maximumColumns] of [
        ['sm', 2],
        ['lg', 3],
        ['xl', 4],
      ] as const) {
        const columns = Math.min(albumCount, maximumColumns)
        const occupiedCells = spans.reduce((total, span) => total + span[breakpoint], 0)

        expect(occupiedCells % columns).toBe(0)
      }
    }
  })
})
