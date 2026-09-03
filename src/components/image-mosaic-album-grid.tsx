'use client'

import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'

import type { EventGalleryResolvedOverlay } from '@/components/event-gallery'
import type { OverlayDisplayMode } from '@/blocks/shared/overlayDisplayPresentation'
import {
  formatGalleryAlbumEventDate,
  GalleryAlbumOverlayContent,
  type GalleryAlbumContentPosition,
} from '@/components/gallery-album-overlay-content'
import { GallerySlideshowViewer } from '@/components/gallery-slideshow-viewer'
import type { ImageMosaicSize } from '@/components/image-mosaic'
import {
  getImageMosaicGridClassName,
  getImageMosaicGridCount,
  getImageMosaicTileClassName,
} from '@/components/image-mosaic-presentation'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

export type ImageMosaicAlbumGridProps = {
  albums: EventGalleryAlbum[]
  cardTextLayout: GalleryAlbumContentPosition
  enableAlbumSlideshow: boolean
  overlay: EventGalleryResolvedOverlay
  overlayDisplay: OverlayDisplayMode
  showEventDate: boolean
  showImageCount: boolean
  showImageOverlays: boolean
  size: ImageMosaicSize
}

export function ImageMosaicAlbumGrid({
  albums,
  cardTextLayout,
  enableAlbumSlideshow,
  overlay,
  overlayDisplay,
  showEventDate,
  showImageCount,
  showImageOverlays,
  size,
}: ImageMosaicAlbumGridProps) {
  const [activeAlbum, setActiveAlbum] = useState<EventGalleryAlbum | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const count = getImageMosaicGridCount(albums.length)

  const closeViewer = useCallback(() => {
    setActiveAlbum(null)
    requestAnimationFrame(() => openerRef.current?.focus())
  }, [])

  return (
    <>
      <div className={getImageMosaicGridClassName(count, size)} data-image-mosaic-count={count}>
        {albums.map((album, index) => {
          const tileClassName = getImageMosaicTileClassName({ count, index, size })
          const eventDate = formatGalleryAlbumEventDate(album.eventDate)
          const content = (
            <div className="relative h-full min-h-0 w-full overflow-hidden">
              <Image
                fill
                alt={album.cover.alt}
                className="size-full object-cover transition-transform duration-200 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover/image-mosaic:scale-[1.03]"
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 25vw"
                src={album.cover.src}
              />
              {showImageOverlays ? (
                <div className="gallery-overlay-layer image-mosaic-overlay absolute inset-0">
                  <div
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute',
                      overlay.frameClassName,
                      overlay.className,
                    )}
                  />
                  <GalleryAlbumOverlayContent
                    album={album}
                    formattedEventDate={eventDate}
                    overlay={overlay}
                    position={cardTextLayout}
                    scope="imageMosaic"
                    showEventDate={showEventDate}
                    showImageCount={showImageCount}
                  />
                </div>
              ) : null}
            </div>
          )

          return (
            <article
              className={cn(tileClassName, showImageOverlays && 'group/image-mosaic')}
              data-gallery-overlay-display={showImageOverlays ? overlayDisplay : undefined}
              data-image-mosaic-album-interaction={enableAlbumSlideshow ? 'slideshow' : 'static'}
              data-image-mosaic-item={index + 1}
              key={album.id}
            >
              {enableAlbumSlideshow ? (
                <button
                  aria-label={`Open ${album.title} gallery with ${album.imageCount} ${
                    album.imageCount === 1 ? 'image' : 'images'
                  }`}
                  className="block h-full w-full cursor-pointer text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-inset"
                  onClick={(event) => {
                    openerRef.current = event.currentTarget
                    setActiveAlbum(album)
                  }}
                  type="button"
                >
                  {content}
                </button>
              ) : (
                content
              )}
            </article>
          )
        })}
      </div>

      {activeAlbum ? <GallerySlideshowViewer album={activeAlbum} onClose={closeViewer} /> : null}
    </>
  )
}
