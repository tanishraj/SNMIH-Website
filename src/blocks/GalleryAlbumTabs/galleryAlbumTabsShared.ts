import type { EventGalleryAlbum, EventGalleryImage } from '@/lib/eventGalleryShared'
import {
  CONTENT_TAB_VARIANTS,
  getContentTabClasses,
  getContentTabRailClasses,
  normalizeContentTabVariant,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'

export const GALLERY_ALBUM_TABS_VARIANTS = CONTENT_TAB_VARIANTS
export type GalleryAlbumTabsVariant = ContentTabVariant

export const GALLERY_ALBUM_TABS_IMAGES_PER_LOAD_VALUES = ['6', '9', '12'] as const
export type GalleryAlbumTabsImagesPerLoad = 6 | 9 | 12

export type GalleryAlbumTabsResolvedTab = {
  id: string
  images: EventGalleryImage[]
  label: string
}

export const normalizeGalleryAlbumTabsVariant = normalizeContentTabVariant

export const normalizeGalleryAlbumTabsImagesPerLoad = (
  value?: unknown,
): GalleryAlbumTabsImagesPerLoad => {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value

  return parsed === 6 || parsed === 12 ? parsed : 9
}

const getImageIdentity = (image: EventGalleryImage) => image.mediaID ?? image.src

export function resolveGalleryAlbumTabs(
  albums: EventGalleryAlbum[],
  allTabLabel?: string | null,
): GalleryAlbumTabsResolvedTab[] {
  const seenImages = new Set<string>()
  const allImages = albums.flatMap(({ images }) =>
    images.filter((image) => {
      const identity = getImageIdentity(image)

      if (seenImages.has(identity)) return false

      seenImages.add(identity)
      return true
    }),
  )

  return [
    {
      id: 'all',
      images: allImages,
      label: allTabLabel?.trim() || 'All',
    },
    ...albums.map(({ id, images, title }) => ({ id, images, label: title })),
  ]
}

export const getGalleryAlbumTabsTabListClasses = getContentTabRailClasses
export const getGalleryAlbumTabsTabClasses = getContentTabClasses
