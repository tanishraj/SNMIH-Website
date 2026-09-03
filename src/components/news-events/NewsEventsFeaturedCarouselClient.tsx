'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveMediaOverlay } from '@/blocks/shared/mediaOverlayPresentation'
import { ContentLink } from '@/components/ContentLink'
import { NewsEventClassificationBadge } from '@/components/news-events/NewsEventClassificationBadge'
import { NewsEventDateMeta } from '@/components/news-events/NewsEventDateMeta'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import {
  featuredHighlightObjectPositionClasses,
  normalizeFeaturedHighlightsControlsPosition,
  resolveFeaturedHighlightImagePosition,
  resolveFeaturedHighlightsOverlay,
  type FeaturedHighlightsControlsPosition,
  type FeaturedHighlightImagePositionOverride,
  type FeaturedHighlightItem,
  type FeaturedHighlightsOverlayOptions,
} from '@/components/news-events/featuredHighlightsShared'
import { cn } from '@/lib/utils'

type NewsEventsFeaturedCarouselClientProps = {
  autoplay?: boolean
  carouselControlsPosition?: FeaturedHighlightsControlsPosition
  imagePositionOverride?: FeaturedHighlightImagePositionOverride
  items: FeaturedHighlightItem[]
  overlay?: Partial<FeaturedHighlightsOverlayOptions>
  sectionBackground?: BlockBackground
}

const DEFAULT_NEWS_EVENT_IMAGE = '/images/snmih-news-events-default.png'

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updatePreference = () => setReducedMotion(mediaQuery.matches)

    updatePreference()
    mediaQuery.addEventListener?.('change', updatePreference)

    return () => mediaQuery.removeEventListener?.('change', updatePreference)
  }, [])

  return reducedMotion
}

function RailCard({ active, item }: { active: boolean; item: FeaturedHighlightItem }) {
  const hasMetadata = Boolean(item.classification || item.dateLabel)

  return (
    <Card
      className={cn(
        'h-full w-full justify-center gap-0 overflow-hidden rounded-card bg-card py-0 text-left text-card-foreground shadow-none ring-1 ring-inset transition-colors motion-reduce:transition-none',
        active ? 'ring-primary' : 'ring-border hover:bg-muted/50',
      )}
      data-news-events-carousel-rail-card="true"
    >
      <CardHeader className="gap-3 rounded-none px-5 pt-5">
        {hasMetadata ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {item.classification ? (
              <NewsEventClassificationBadge classification={item.classification} />
            ) : null}
            {item.dateLabel ? (
              <NewsEventDateMeta
                className="text-muted-foreground"
                dateISO={item.dateISO}
                dateLabel={item.dateLabel}
              />
            ) : null}
          </div>
        ) : null}
        <CardTitle className="line-clamp-1 text-xl leading-snug font-semibold">
          {item.title}
        </CardTitle>
      </CardHeader>
      {item.description ? (
        <CardContent className="px-5 pt-3 pb-5">
          <p className="line-clamp-2 text-base leading-6 font-normal text-muted-foreground">
            {item.description}
          </p>
        </CardContent>
      ) : null}
    </Card>
  )
}

function Rail({
  activeIndex,
  className,
  items,
  onSelect,
  orientation,
  setApi,
}: {
  activeIndex: number
  className?: string
  items: FeaturedHighlightItem[]
  onSelect: (index: number) => void
  orientation: 'horizontal' | 'vertical'
  setApi: (api: CarouselApi) => void
}) {
  const isVertical = orientation === 'vertical'

  return (
    <Carousel
      className={className}
      opts={{ align: 'start', containScroll: 'trimSnaps', dragFree: true }}
      orientation={orientation}
      setApi={setApi}
    >
      <CarouselContent
        className={isVertical ? 'mt-0 h-[36rem] gap-4' : undefined}
        data-news-events-carousel-rail={orientation}
      >
        {items.map((item, index) => (
          <CarouselItem
            className={
              isVertical
                ? 'w-full basis-[calc((100%_-_2rem)/3)] pt-0'
                : 'basis-[88%] sm:basis-[58%]'
            }
            key={`${orientation}-${item.id}`}
          >
            <Button
              aria-label={`Show ${item.title}`}
              aria-pressed={activeIndex === index}
              className={cn(
                'w-full touch-manipulation justify-start p-0 whitespace-normal',
                isVertical ? 'h-full' : 'h-auto',
              )}
              onClick={() => onSelect(index)}
              type="button"
              variant="ghost"
            >
              <RailCard active={activeIndex === index} item={item} />
            </Button>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}

export function NewsEventsFeaturedCarouselClient({
  autoplay = true,
  carouselControlsPosition,
  imagePositionOverride = 'item',
  items,
  overlay,
  sectionBackground = 'none',
}: NewsEventsFeaturedCarouselClientProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [sideApi, setSideApi] = useState<CarouselApi>()
  const [mobileApi, setMobileApi] = useState<CarouselApi>()
  const [pausedByFocus, setPausedByFocus] = useState(false)
  const [pausedByHover, setPausedByHover] = useState(false)
  const [failedImageID, setFailedImageID] = useState<string | null>(null)
  const reducedMotion = usePrefersReducedMotion()

  const itemCount = items.length
  const resolvedActiveIndex = itemCount ? activeIndex % itemCount : 0
  const activeItem = items[resolvedActiveIndex]
  const useFallbackImage = !activeItem?.image || failedImageID === activeItem.id
  const overlayOptions = resolveFeaturedHighlightsOverlay(overlay ?? {})
  const featureOverlay = resolveMediaOverlay({
    ...overlayOptions,
    sectionBackground,
  })
  const resolvedControlsPosition =
    normalizeFeaturedHighlightsControlsPosition(carouselControlsPosition)

  const selectIndex = useCallback(
    (index: number) => {
      if (!itemCount) return
      setActiveIndex((index + itemCount) % itemCount)
    },
    [itemCount],
  )

  useEffect(() => {
    sideApi?.scrollTo(resolvedActiveIndex)
    mobileApi?.scrollTo(resolvedActiveIndex)
  }, [mobileApi, resolvedActiveIndex, sideApi])

  useEffect(() => {
    if (!autoplay || itemCount < 2 || pausedByFocus || pausedByHover || reducedMotion) return

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % itemCount)
    }, 6000)

    return () => window.clearInterval(interval)
  }, [autoplay, itemCount, pausedByFocus, pausedByHover, reducedMotion])

  if (!activeItem) return null

  const controlsRow = (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-current/15',
        resolvedControlsPosition === 'top' ? 'mb-5 border-b pb-4' : 'mt-5 border-t pt-4',
      )}
      data-news-events-carousel-controls-position={resolvedControlsPosition}
    >
      <p aria-live="polite" className="text-sm tabular-nums text-current/70">
        {resolvedActiveIndex + 1} of {itemCount}
      </p>
      {itemCount > 1 ? (
        <div className="flex items-center gap-2">
          <Button
            aria-label="Previous story"
            onClick={() => selectIndex(resolvedActiveIndex - 1)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            aria-label="Next story"
            onClick={() => selectIndex(resolvedActiveIndex + 1)}
            size="icon-sm"
            type="button"
            variant="outline"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      ) : null}
    </div>
  )

  return (
    <div
      data-news-events-carousel-shell="true"
      data-testid="news-events-carousel-shell"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPausedByFocus(false)
      }}
      onFocusCapture={() => setPausedByFocus(true)}
      onMouseEnter={() => setPausedByHover(true)}
      onMouseLeave={() => setPausedByHover(false)}
    >
      {resolvedControlsPosition === 'top' ? controlsRow : null}

      <div
        className="grid gap-6 md:h-[36rem] md:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.9fr)] lg:gap-8"
        data-news-events-carousel-layout="true"
      >
        <Card
          aria-live={autoplay ? 'off' : 'polite'}
          className="relative isolate min-h-[30rem] gap-0 overflow-hidden rounded-card bg-card py-0 text-card-foreground shadow-none ring-1 ring-inset ring-border sm:min-h-[34rem] md:h-full md:min-h-0"
          data-news-events-carousel-feature="true"
        >
          <Image
            alt={useFallbackImage ? '' : (activeItem.image?.alt ?? '')}
            className={cn(
              '-z-20 object-cover',
              featuredHighlightObjectPositionClasses[
                useFallbackImage
                  ? 'center'
                  : resolveFeaturedHighlightImagePosition(
                      activeItem.image?.position,
                      imagePositionOverride,
                    )
              ],
            )}
            data-news-events-image-fallback={useFallbackImage ? 'true' : undefined}
            fill
            onError={() => {
              if (!useFallbackImage) setFailedImageID(activeItem.id)
            }}
            priority
            sizes="(max-width: 1024px) 100vw, 66vw"
            src={
              useFallbackImage
                ? DEFAULT_NEWS_EVENT_IMAGE
                : (activeItem.image?.src ?? DEFAULT_NEWS_EVENT_IMAGE)
            }
          />
          <div
            className={cn(
              'absolute -z-10',
              featureOverlay.frameClassName,
              featureOverlay.className,
            )}
            data-overlay-coverage={featureOverlay.coverage}
            data-overlay-direction={featureOverlay.direction}
            data-overlay-strength={featureOverlay.strength}
            data-overlay-tone={featureOverlay.tone}
            data-news-events-image-overlay="true"
          />

          <div
            className={cn(
              'mt-auto flex max-w-3xl flex-col items-start gap-4 p-6 sm:p-8 lg:p-10',
              featureOverlay.text.title,
            )}
          >
            {activeItem.classification || activeItem.dateLabel ? (
              <div className="flex flex-wrap items-center gap-3">
                {activeItem.classification ? (
                  <NewsEventClassificationBadge classification={activeItem.classification} />
                ) : null}
                {activeItem.dateLabel ? (
                  <NewsEventDateMeta
                    className={cn(featureOverlay.text.secondary)}
                    dateISO={activeItem.dateISO}
                    dateLabel={activeItem.dateLabel}
                    size="sm"
                  />
                ) : null}
              </div>
            ) : null}
            <h3 className="max-w-2xl text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              {activeItem.title}
            </h3>
            {activeItem.description ? (
              <p
                className={cn(
                  'line-clamp-3 max-w-2xl text-base leading-7',
                  featureOverlay.text.secondary,
                )}
              >
                {activeItem.description}
              </p>
            ) : null}
            {activeItem.action ? (
              <ContentLink
                className={featureOverlay.text.link}
                href={activeItem.action.href}
                label={activeItem.action.label}
                openInNewTab={activeItem.action.openInNewTab}
              />
            ) : null}
          </div>
        </Card>

        <Rail
          activeIndex={resolvedActiveIndex}
          className="hidden h-[36rem] md:block"
          items={items}
          onSelect={selectIndex}
          orientation="vertical"
          setApi={setSideApi}
        />
      </div>

      <Rail
        activeIndex={resolvedActiveIndex}
        className="mt-5 md:hidden"
        items={items}
        onSelect={selectIndex}
        orientation="horizontal"
        setApi={setMobileApi}
      />

      {resolvedControlsPosition === 'bottom' ? controlsRow : null}
    </div>
  )
}
