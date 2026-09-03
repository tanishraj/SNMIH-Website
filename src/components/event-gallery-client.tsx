'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { useCallback, useRef, useState, useSyncExternalStore } from 'react'

import type { EventGalleryResolvedOverlay } from '@/components/event-gallery'
import type { OverlayDisplayMode } from '@/blocks/shared/overlayDisplayPresentation'
import {
  getEventGalleryQuiltGridClassName,
  getEventGalleryQuiltRowSpanClassName,
  getEventGalleryQuiltRowSpans,
  type EventGalleryCardTextLayout,
} from '@/components/event-gallery-presentation'
import {
  formatGalleryAlbumEventDate,
  GalleryAlbumOverlayContent,
} from '@/components/gallery-album-overlay-content'
import { GallerySlideshowViewer } from '@/components/gallery-slideshow-viewer'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

type EventGalleryClientProps = {
  albums: EventGalleryAlbum[]
  cardTextLayout?: EventGalleryCardTextLayout
  enableAlbumSlideshow?: boolean
  overlay: EventGalleryResolvedOverlay
  overlayDisplay: OverlayDisplayMode
  showCardOverlay?: boolean
  showEventDate?: boolean
  showImageCount?: boolean
}

const subscribeToHydration = () => () => undefined
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export function EventGalleryClient({
  albums,
  cardTextLayout = 'split',
  enableAlbumSlideshow = true,
  overlay,
  overlayDisplay,
  showCardOverlay = true,
  showEventDate = true,
  showImageCount = true,
}: EventGalleryClientProps) {
  const [activeAlbum, setActiveAlbum] = useState<EventGalleryAlbum | null>(null)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const shouldReduceMotion = isHydrated && Boolean(prefersReducedMotion)
  const gridColumnsClassName = getEventGalleryQuiltGridClassName(albums.length)

  const closeViewer = useCallback(() => {
    setActiveAlbum(null)
    requestAnimationFrame(() => openerRef.current?.focus())
  }, [])

  return (
    <>
      <div
        className={cn(
          'grid auto-rows-56 gap-3 sm:auto-rows-60 sm:gap-4 lg:auto-rows-64 lg:gap-5',
          gridColumnsClassName,
        )}
        data-event-gallery-layout="rectangular-quilt"
      >
        {albums.map((album, index) => {
          const eventDate = formatGalleryAlbumEventDate(album.eventDate)
          const rowSpans = getEventGalleryQuiltRowSpans(albums.length, index)
          const rowSpanClassName = getEventGalleryQuiltRowSpanClassName(rowSpans)
          const cardContent = (
            <div className="relative h-full min-h-0 w-full overflow-hidden">
              <Image
                fill
                alt={album.cover.alt}
                className="object-cover transition-transform duration-700 ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03]"
                src={album.cover.src}
                sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
              />

              {showCardOverlay ? (
                <div className="gallery-overlay-layer absolute inset-0">
                  <div
                    aria-hidden="true"
                    className={cn(
                      'pointer-events-none absolute',
                      overlay.frameClassName,
                      overlay.className,
                    )}
                    data-event-gallery-card-overlay="true"
                  />
                  <GalleryAlbumOverlayContent
                    album={album}
                    formattedEventDate={eventDate}
                    overlay={overlay}
                    position={cardTextLayout}
                    showEventDate={showEventDate}
                    showImageCount={showImageCount}
                  />
                </div>
              ) : null}
            </div>
          )

          return (
            <motion.article
              animate={shouldReduceMotion ? { opacity: 1, y: 0 } : undefined}
              className={cn('group min-h-0 min-w-0', rowSpanClassName)}
              data-gallery-overlay-display={showCardOverlay ? overlayDisplay : undefined}
              data-event-gallery-row-span-lg={rowSpans.lg}
              data-event-gallery-row-span-sm={rowSpans.sm}
              data-event-gallery-row-span-xl={rowSpans.xl}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 28 }}
              key={album.id}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { delay: Math.min(index * 0.08, 0.32), duration: 0.5 }
              }
              viewport={{ amount: 0.2, once: true }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            >
              {enableAlbumSlideshow ? (
                <button
                  aria-label={`Open ${album.title} gallery with ${album.imageCount} ${
                    album.imageCount === 1 ? 'image' : 'images'
                  }`}
                  className="block h-full w-full cursor-pointer overflow-hidden rounded-card border border-border text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2"
                  data-block-surface={overlay.blockSurface}
                  data-event-gallery-interaction="slideshow"
                  onClick={(event) => {
                    openerRef.current = event.currentTarget
                    setActiveAlbum(album)
                  }}
                  type="button"
                >
                  {cardContent}
                </button>
              ) : (
                <div
                  className="block h-full w-full overflow-hidden rounded-card border border-border text-left"
                  data-block-surface={overlay.blockSurface}
                  data-event-gallery-interaction="static"
                >
                  {cardContent}
                </div>
              )}
            </motion.article>
          )
        })}
      </div>

      {enableAlbumSlideshow && activeAlbum ? (
        <GallerySlideshowViewer album={activeAlbum} onClose={closeViewer} />
      ) : null}
    </>
  )
}
