import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import {
  normalizeOverlayDisplayMode,
  type OverlayDisplayMode,
} from '@/blocks/shared/overlayDisplayPresentation'
import { ContentActions } from '@/components/ContentActions'
import {
  normalizeGalleryAlbumContentPosition,
  type GalleryAlbumContentPosition,
} from '@/components/gallery-album-overlay-content'
import {
  ImageMosaic,
  type ImageMosaicAlignment,
  type ImageMosaicImagePosition,
  type ImageMosaicItem,
  type ImageMosaicSize,
} from '@/components/image-mosaic'
import { ImageMosaicAlbumGrid } from '@/components/image-mosaic-album-grid'
import {
  normalizeImageMosaicContentSource,
  type ImageMosaicContentSource,
} from '@/components/image-mosaic-presentation'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import {
  getEventGalleryAlbumRelationshipIDs,
  selectAndOrderEventGalleryAlbums,
  type EventGalleryAlbum,
  type EventGalleryDisplayOrder,
} from '@/lib/eventGalleryShared'
import { getMediaImageProps, isMediaDoc } from '@/lib/media'
import type { Media } from '@/payload-types'

type ImageMosaicActionValue = CmsActionValue & {
  mode?: 'button' | 'link' | null
}

type ImageMosaicItemValue = {
  action?: ImageMosaicActionValue[] | null
  image?: unknown
  imagePosition?: ImageMosaicImagePosition | null
  title?: string | null
}

export type ImageMosaicBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  cardTextLayout?: GalleryAlbumContentPosition | string | null
  contentAlignment?: ImageMosaicAlignment | null
  contentSource?: ImageMosaicContentSource | string | null
  description?: string | null
  displayOrder?: EventGalleryDisplayOrder | string | null
  enableAlbumSlideshow?: boolean | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  galleryAlbums?: unknown
  items?: ImageMosaicItemValue[] | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDisplay?: OverlayDisplayMode | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | null
  showEventDate?: boolean | null
  showImageCount?: boolean | null
  showImageOverlays?: boolean | null
  size?: ImageMosaicSize | null
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

export const resolveManualImageMosaicItems = (
  items: ImageMosaicItemValue[] | null | undefined,
): ImageMosaicItem[] =>
  (items ?? [])
    .flatMap((item): ImageMosaicItem[] => {
      const itemTitle = item.title?.trim()
      const media = item.image as Media | number | string | null | undefined
      const image = getMediaImageProps({ fallbackAlt: itemTitle, media, preset: 'generic' })

      if (!image) return []

      const actionValue = item.action?.[0]
      const resolvedAction = resolveCmsActions(actionValue ? [actionValue] : [])[0]

      return [
        {
          id: isMediaDoc(media) ? media.id : image.src,
          image,
          imagePosition: item.imagePosition ?? 'center',
          action: resolvedAction
            ? { ...resolvedAction, mode: actionValue?.mode ?? 'link' }
            : undefined,
          title: itemTitle,
        },
      ]
    })
    .slice(0, 8)

export function ImageMosaicBlockPresentation({
  accentTitle,
  actions,
  albums = [],
  appearance,
  cardTextLayout,
  contentAlignment = 'center',
  contentSource,
  description,
  displayOrder,
  enableAlbumSlideshow,
  eyebrow,
  footerActions,
  galleryAlbums,
  items,
  overlayCoverage,
  overlayDisplay,
  overlayDirection,
  overlayStyle,
  showEventDate,
  showImageCount,
  showImageOverlays,
  size = 'default',
  themeMode,
  title,
}: ImageMosaicBlockLike & { albums?: EventGalleryAlbum[] }) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null

  const source = normalizeImageMosaicContentSource(contentSource)
  const alignment = contentAlignment ?? 'center'
  const resolvedSize = size ?? 'default'
  const resolvedShowOverlays = showImageOverlays ?? true
  const resolvedOverlayDisplay = normalizeOverlayDisplayMode(overlayDisplay, 'hover')
  const resolvedOverlayCoverage = overlayCoverage ?? 'full'
  const resolvedOverlayDirection = overlayDirection ?? 'bottomToTop'
  const resolvedOverlayStyle = overlayStyle ?? 'dark'
  const resolvedThemeMode = themeMode ?? 'auto'
  const position = normalizeGalleryAlbumContentPosition(cardTextLayout)
  const commonProps = {
    accentTitle,
    actions: (
      <ContentActions
        actions={resolveCmsActions(actions).slice(0, 2)}
        alignment={alignment}
        data-image-mosaic-actions="true"
      />
    ),
    alignment,
    appearance,
    cardTextLayout: position,
    contentSource: source,
    description: description?.trim() || undefined,
    eyebrow: eyebrow?.trim() || undefined,
    overlayCoverage: resolvedOverlayCoverage,
    overlayDisplay: resolvedOverlayDisplay,
    overlayDirection: resolvedOverlayDirection,
    overlayStyle: resolvedOverlayStyle,
    showImageOverlays: resolvedShowOverlays,
    size: resolvedSize,
    themeMode: resolvedThemeMode,
    title: resolvedTitle,
  } as const

  if (source === 'galleryAlbums') {
    const selectedAlbumIDs = getEventGalleryAlbumRelationshipIDs(galleryAlbums).slice(0, 8)
    const selectedAlbums = selectAndOrderEventGalleryAlbums({
      albums,
      displayOrder: displayOrder === 'manual' ? 'manual' : 'latestEventDate',
      selectedAlbumIDs,
    }).slice(0, 8)

    if (!selectedAlbums.length) return null

    const appearanceClasses = resolveBlockAppearanceClasses(appearance)
    const overlay = resolveMediaOverlay({
      coverage: resolvedOverlayCoverage,
      direction: resolvedOverlayDirection,
      sectionBackground: appearanceClasses.background,
      strength: resolvedOverlayStyle,
      tone: resolvedThemeMode,
    })

    return (
      <>
        <ImageMosaic
          {...commonProps}
          albumGrid={
            <ImageMosaicAlbumGrid
              albums={selectedAlbums}
              cardTextLayout={position}
              enableAlbumSlideshow={enableAlbumSlideshow ?? true}
              overlay={overlay}
              overlayDisplay={resolvedOverlayDisplay}
              showEventDate={showEventDate ?? true}
              showImageCount={showImageCount ?? true}
              showImageOverlays={resolvedShowOverlays}
              size={resolvedSize}
            />
          }
          itemCount={selectedAlbums.length}
        />
        <BlockFooterActions actions={footerActions} />
      </>
    )
  }

  const resolvedItems = resolveManualImageMosaicItems(items)
  if (!resolvedItems.length) return null

  return (
    <>
      <ImageMosaic {...commonProps} items={resolvedItems} />
      <BlockFooterActions actions={footerActions} />
    </>
  )
}
