import { Images } from 'lucide-react'

import type { EventGalleryResolvedOverlay } from '@/components/event-gallery'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

export type GalleryAlbumContentPosition = 'center' | 'middleCenter' | 'split'
export type GalleryAlbumOverlayScope = 'eventGallery' | 'imageMosaic'

export const normalizeGalleryAlbumContentPosition = (
  value: unknown,
): GalleryAlbumContentPosition =>
  value === 'center' || value === 'middleCenter' || value === 'split' ? value : 'split'

const eventDateFormatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

export const formatGalleryAlbumEventDate = (value: string | undefined): string | undefined => {
  if (!value) return undefined

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? undefined : eventDateFormatter.format(date)
}

const contentPositionClasses = {
  center: 'items-end justify-center text-center',
  middleCenter: 'items-center justify-center text-center',
  split: 'items-end justify-start text-left',
} as const satisfies Record<GalleryAlbumContentPosition, string>

export type GalleryAlbumOverlayContentProps = {
  album: EventGalleryAlbum
  formattedEventDate?: string
  overlay: EventGalleryResolvedOverlay
  position: GalleryAlbumContentPosition
  scope?: GalleryAlbumOverlayScope
  showEventDate: boolean
  showImageCount: boolean
}

export function GalleryAlbumOverlayContent({
  album,
  formattedEventDate,
  overlay,
  position,
  scope = 'eventGallery',
  showEventDate,
  showImageCount,
}: GalleryAlbumOverlayContentProps) {
  const hasEventDate = showEventDate && Boolean(formattedEventDate)
  const hasMetadata = showImageCount || hasEventDate
  const isLeftAligned = position === 'split'
  const alignment = isLeftAligned ? 'left' : 'center'
  const scopedAttributes =
    scope === 'eventGallery'
      ? {
          'data-event-gallery-card-content': 'true',
          'data-event-gallery-card-position': position,
          'data-event-gallery-content-alignment': alignment,
        }
      : {
          'data-image-mosaic-card-content': 'true',
          'data-image-mosaic-card-position': position,
          'data-image-mosaic-content-alignment': alignment,
        }

  return (
    <div
      className={cn('absolute inset-0 flex p-4 sm:p-5', contentPositionClasses[position])}
      data-gallery-album-card-content="true"
      data-gallery-album-card-position={position}
      {...scopedAttributes}
    >
      <div
        className={cn(
          'flex min-w-0 flex-col',
          position === 'middleCenter' ? 'w-full max-w-sm' : 'w-full',
          isLeftAligned ? 'items-start text-left' : 'items-center text-center',
        )}
        data-gallery-album-content-alignment={alignment}
      >
        {hasMetadata ? (
          <div
            className={cn(
              'mb-3 flex w-full flex-col gap-2 font-mono text-xs font-normal uppercase tracking-wider',
              isLeftAligned ? 'items-start text-left' : 'items-center text-center',
              overlay.text.eyebrow,
            )}
            data-event-gallery-card-meta={scope === 'eventGallery' ? 'true' : undefined}
            data-event-gallery-metadata-layout={scope === 'eventGallery' ? 'stacked' : undefined}
            data-gallery-album-card-meta="true"
            data-gallery-album-metadata-layout="stacked"
            data-image-mosaic-card-meta={scope === 'imageMosaic' ? 'true' : undefined}
          >
            {showImageCount ? (
              <span
                aria-label={`${album.imageCount} ${album.imageCount === 1 ? 'image' : 'images'}`}
                className="inline-flex items-center justify-center gap-1.5"
                data-event-gallery-image-count={scope === 'eventGallery' ? 'true' : undefined}
                data-gallery-album-image-count="true"
                data-image-mosaic-image-count={scope === 'imageMosaic' ? 'true' : undefined}
              >
                <Images aria-hidden="true" className="size-3.5" />
                {album.imageCount}
              </span>
            ) : null}
            {hasEventDate ? (
              <span className="max-w-full truncate">{formattedEventDate}</span>
            ) : null}
          </div>
        ) : null}
        <p
          className={cn(
            'line-clamp-2 font-[family-name:var(--font-text)] text-lg font-semibold tracking-tight text-balance sm:text-xl',
            overlay.text.title,
            isLeftAligned ? 'max-w-md' : 'mx-auto max-w-md',
          )}
        >
          {album.title}
        </p>
      </div>
    </div>
  )
}
