import {
  normalizeGalleryAlbumContentPosition,
  type GalleryAlbumContentPosition,
} from '@/components/gallery-album-overlay-content'

export type EventGalleryCardTextLayout = GalleryAlbumContentPosition
export type { GalleryAlbumContentPosition }

export type EventGalleryQuiltRowSpans = {
  base: 1
  sm: 1 | 2
  lg: 1 | 2
  xl: 1 | 2
}

const getCorrectiveSpan = ({
  albumCount,
  index,
  maximumColumns,
}: {
  albumCount: number
  index: number
  maximumColumns: number
}): 1 | 2 => {
  const columns = Math.min(Math.max(albumCount, 1), maximumColumns)
  const missingCells = (columns - (albumCount % columns)) % columns

  return index < missingCells ? 2 : 1
}

export function getEventGalleryQuiltGridClassName(albumCount: number): string {
  if (albumCount <= 1) return 'grid-cols-1'
  if (albumCount === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (albumCount === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}

export function getEventGalleryQuiltRowSpans(
  albumCount: number,
  index: number,
): EventGalleryQuiltRowSpans {
  return {
    base: 1,
    sm: getCorrectiveSpan({ albumCount, index, maximumColumns: 2 }),
    lg: getCorrectiveSpan({ albumCount, index, maximumColumns: 3 }),
    xl: getCorrectiveSpan({ albumCount, index, maximumColumns: 4 }),
  }
}

export function getEventGalleryQuiltRowSpanClassName({
  sm,
  lg,
  xl,
}: EventGalleryQuiltRowSpans): string {
  return [
    'row-span-1',
    sm === 2 ? 'sm:row-span-2' : 'sm:row-span-1',
    lg === 2 ? 'lg:row-span-2' : 'lg:row-span-1',
    xl === 2 ? 'xl:row-span-2' : 'xl:row-span-1',
  ].join(' ')
}

export function normalizeEventGalleryCardTextLayout(value: unknown): EventGalleryCardTextLayout {
  return normalizeGalleryAlbumContentPosition(value)
}
