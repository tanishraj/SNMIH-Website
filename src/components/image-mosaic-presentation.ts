import type { ImageMosaicSize } from '@/components/image-mosaic'
import { cn } from '@/lib/utils'

export type ImageMosaicContentSource = 'galleryAlbums' | 'manualImages'

export const normalizeImageMosaicContentSource = (value: unknown): ImageMosaicContentSource =>
  value === 'galleryAlbums' ? 'galleryAlbums' : 'manualImages'

const desktopGridClasses = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-4',
  6: 'lg:grid-cols-4',
  7: 'lg:grid-cols-4',
  8: 'lg:grid-cols-4',
} as const

const gridRowClasses = {
  none: 'lg:auto-rows-[15rem]',
  compact: 'lg:auto-rows-[13rem]',
  default: 'lg:auto-rows-[15rem]',
  comfortable: 'lg:auto-rows-[17rem]',
} as const

const mobileTileHeightClasses = {
  none: 'h-60 md:h-64 lg:h-full',
  compact: 'h-52 md:h-56 lg:h-full',
  default: 'h-60 md:h-64 lg:h-full',
  comfortable: 'h-68 md:h-72 lg:h-full',
} as const

const mosaicSpanClasses = [
  '',
  'lg:col-span-2',
  'lg:row-span-2',
  'lg:col-span-2',
  '',
  'lg:col-span-2',
  '',
  '',
] as const

export type ImageMosaicGridCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export const getImageMosaicGridCount = (count: number): ImageMosaicGridCount =>
  Math.max(1, Math.min(8, count)) as ImageMosaicGridCount

export const getImageMosaicGridClassName = (count: number, size: ImageMosaicSize): string => {
  const normalizedCount = getImageMosaicGridCount(count)

  return cn(
    'grid grid-flow-dense grid-cols-1 gap-2.5 overflow-hidden md:grid-cols-2',
    desktopGridClasses[normalizedCount],
    gridRowClasses[size],
  )
}

export const getImageMosaicSpanClassName = (count: number, index: number): string =>
  count >= 5 ? (mosaicSpanClasses[index] ?? '') : ''

export const getImageMosaicTileClassName = ({
  count,
  index,
  size,
}: {
  count: number
  index: number
  size: ImageMosaicSize
}): string =>
  cn(
    'relative overflow-hidden rounded-card border border-border',
    mobileTileHeightClasses[size],
    getImageMosaicSpanClassName(count, index),
  )
