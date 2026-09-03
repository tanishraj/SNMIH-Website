'use client'

import Image from 'next/image'
import { useId, useMemo, useRef, useState } from 'react'

import {
  getGalleryAlbumTabsTabClasses,
  type GalleryAlbumTabsImagesPerLoad,
  type GalleryAlbumTabsResolvedTab,
  type GalleryAlbumTabsVariant,
} from '@/blocks/GalleryAlbumTabs/galleryAlbumTabsShared'
import type { ContentTabSurface } from '@/blocks/shared/contentTabRail'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import {
  getEventGalleryQuiltGridClassName,
  getEventGalleryQuiltRowSpanClassName,
  getEventGalleryQuiltRowSpans,
} from '@/components/event-gallery-presentation'
import { GallerySlideshowViewer } from '@/components/gallery-slideshow-viewer'
import { Button } from '@/components/ui/button'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

type GalleryAlbumTabsClientProps = {
  imagesPerLoad: GalleryAlbumTabsImagesPerLoad
  loadMoreLabel: string
  tabs: GalleryAlbumTabsResolvedTab[]
  tabSurface?: ContentTabSurface
  variant: GalleryAlbumTabsVariant
}

type OpenImage = {
  imageIndex: number
  tab: GalleryAlbumTabsResolvedTab
}

const createVisibleCountMap = (
  tabs: GalleryAlbumTabsResolvedTab[],
  imagesPerLoad: GalleryAlbumTabsImagesPerLoad,
) => Object.fromEntries(tabs.map(({ id }) => [id, imagesPerLoad]))

const createViewerAlbum = (tab: GalleryAlbumTabsResolvedTab): EventGalleryAlbum => ({
  cover: tab.images[0]!,
  createdAt: '1970-01-01T00:00:00.000Z',
  id: `gallery-album-tabs-${tab.id}`,
  imageCount: tab.images.length,
  images: tab.images,
  title: tab.label,
})

export function GalleryAlbumTabsClient({
  imagesPerLoad,
  loadMoreLabel,
  tabs,
  tabSurface = 'light',
  variant,
}: GalleryAlbumTabsClientProps) {
  const componentID = useId().replaceAll(':', '')
  const [activeTabID, setActiveTabID] = useState(tabs[0]?.id ?? 'all')
  const [visibleCountByTab, setVisibleCountByTab] = useState<Record<string, number>>(() =>
    createVisibleCountMap(tabs, imagesPerLoad),
  )
  const [openImage, setOpenImage] = useState<OpenImage | null>(null)
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const activeTab = tabs.find(({ id }) => id === activeTabID) ?? tabs[0]
  const visibleCount = activeTab ? (visibleCountByTab[activeTab.id] ?? imagesPerLoad) : 0
  const visibleImages = useMemo(
    () => activeTab?.images.slice(0, visibleCount) ?? [],
    [activeTab, visibleCount],
  )

  if (!activeTab) return null

  const activateTab = (index: number) => {
    const nextTab = tabs[index]
    const nextButton = tabRefs.current[index]

    if (!nextTab) return

    setActiveTabID(nextTab.id)
    nextButton?.focus()
    nextButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }

  const handleTabKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null

    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = tabs.length - 1

    if (nextIndex === null) return

    event.preventDefault()
    activateTab(nextIndex)
  }

  const closeViewer = () => {
    setOpenImage(null)
    openerRef.current?.focus()
  }

  return (
    <div
      className="flex flex-col gap-8 md:gap-10"
      data-gallery-album-tabs-content="true"
      data-gallery-album-tabs-variant={variant}
    >
      <div className="pb-1" data-gallery-album-tabs-tablist="true">
        <ScrollableContentTabRail className="w-full" surface={tabSurface} variant={variant}>
          <div
            aria-label="Gallery albums"
            className="flex w-max min-w-full flex-nowrap"
            data-content-tab-variant={variant}
            role="tablist"
          >
            {tabs.map((tab, index) => {
              const active = tab.id === activeTab.id
              const tabID = `gallery-album-tabs-${componentID}-tab-${index}`
              const panelID = `gallery-album-tabs-${componentID}-panel`

              return (
                <button
                  aria-controls={panelID}
                  aria-selected={active}
                  className={getGalleryAlbumTabsTabClasses(variant, active, tabSurface)}
                  id={tabID}
                  key={tab.id}
                  onClick={() => activateTab(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  role="tab"
                  tabIndex={active ? 0 : -1}
                  type="button"
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </ScrollableContentTabRail>
      </div>

      <div
        aria-labelledby={`gallery-album-tabs-${componentID}-tab-${tabs.indexOf(activeTab)}`}
        data-gallery-album-tabs-panel="true"
        id={`gallery-album-tabs-${componentID}-panel`}
        role="tabpanel"
        tabIndex={0}
      >
        {visibleImages.length > 0 ? (
          <div
            className={cn(
              'grid auto-rows-48 gap-3 sm:auto-rows-52 sm:gap-4 lg:auto-rows-56 lg:gap-5',
              getEventGalleryQuiltGridClassName(visibleImages.length),
            )}
            data-gallery-album-tabs-layout="rectangular-quilt"
          >
            {visibleImages.map((image, index) => {
              const rowSpans = getEventGalleryQuiltRowSpans(visibleImages.length, index)

              return (
                <button
                  aria-label={`Open image ${index + 1} of ${activeTab.images.length} in ${activeTab.label} gallery`}
                  className={cn(
                    'group relative w-full overflow-hidden border border-border bg-muted text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
                    getEventGalleryQuiltRowSpanClassName(rowSpans),
                  )}
                  data-gallery-album-tabs-tile="true"
                  key={`${image.mediaID ?? image.id}-${index}`}
                  onClick={(event) => {
                    openerRef.current = event.currentTarget
                    setOpenImage({ imageIndex: index, tab: activeTab })
                  }}
                  type="button"
                >
                  <Image
                    alt={image.alt}
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.025] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    src={image.src}
                  />
                </button>
              )
            })}
          </div>
        ) : (
          <p className="border border-border bg-background px-5 py-8 text-center text-sm text-current/70">
            No images are available in this album.
          </p>
        )}
      </div>

      {visibleCount < activeTab.images.length ? (
        <div className="flex justify-center">
          <Button
            onClick={() =>
              setVisibleCountByTab((current) => ({
                ...current,
                [activeTab.id]: (current[activeTab.id] ?? imagesPerLoad) + imagesPerLoad,
              }))
            }
            type="button"
            variant="outline"
          >
            {loadMoreLabel}
          </Button>
        </div>
      ) : null}

      {openImage ? (
        <GallerySlideshowViewer
          album={createViewerAlbum(openImage.tab)}
          initialIndex={openImage.imageIndex}
          onClose={closeViewer}
        />
      ) : null}
    </div>
  )
}
