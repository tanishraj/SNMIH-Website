'use client'

import Autoplay from 'embla-carousel-autoplay'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'

import { ActionButtonContent } from '@/components/ActionButtonContent'
import { ContentLink } from '@/components/ContentLink'
import { MotionToggle } from '@/components/motion/MotionToggle'
import { useControllableMotion } from '@/components/motion/useControllableMotion'
import { Button } from '@/components/ui/button'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Carousel, type CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import {
  getCmsActionAnchorProps,
  type CmsActionIndicator,
  type CmsActionIndicatorPosition,
  type CmsActionVariant,
} from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'
import {
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'

export type CarouselSlide = {
  backgroundImageAlt?: string
  backgroundImageSrc?: string
  backgroundVideoUrl?: string
  buttons?: Array<{
    download?: string | true
    href: string
    indicator?: CmsActionIndicator
    indicatorPosition?: CmsActionIndicatorPosition
    label: string
    openInNewTab?: boolean
    showArrow: boolean
    variant?: CmsActionVariant
  }>
  description?: string | null
  eyebrow?: string | null
  id?: string
  title?: string | null
}

export type HeroCarouselContentAlignment = 'left' | 'center' | 'right'

type HeroCarouselClientProps = {
  autoplay?: boolean
  contentAlignment?: HeroCarouselContentAlignment
  height?: 'compact' | 'default' | 'immersive'
  overlayCoverage?: MediaOverlayCoverage
  overlayDirection?: MediaOverlayDirection
  overlayStyle?: MediaOverlayStrength
  showArrows?: boolean
  showDots?: boolean
  showPauseControl?: boolean
  slides: CarouselSlide[]
  themeMode?: MediaOverlayTone
}

const heightClasses = {
  compact: 'min-h-[50dvh]',
  default: 'min-h-[70dvh]',
  immersive: 'h-dvh min-h-[42.5rem]',
} as const

const contentAlignmentClasses = {
  left: {
    actions: 'justify-start',
    container: 'justify-start',
    content: 'items-start text-left',
  },
  center: {
    actions: 'justify-center',
    container: 'justify-center',
    content: 'items-center text-center',
  },
  right: {
    actions: 'justify-end',
    container: 'justify-end',
    content: 'items-end text-right',
  },
} as const

export function HeroCarouselClient({
  autoplay = true,
  contentAlignment = 'left',
  height = 'default',
  overlayCoverage = 'full',
  overlayDirection = 'vertical',
  overlayStyle = 'dark',
  showArrows = true,
  showDots = true,
  showPauseControl = false,
  slides,
  themeMode = 'auto',
}: HeroCarouselClientProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([])
  const slideAutoplayEnabled = autoplay && slides.length > 1
  const hasBackgroundVideo = slides.some((slide) => Boolean(slide.backgroundVideoUrl))
  const motionState = useControllableMotion({
    enabled: slideAutoplayEnabled || hasBackgroundVideo,
  })
  const autoplayPlugin = useMemo(
    () => Autoplay({ delay: 6000, playOnInit: false, stopOnInteraction: false }),
    [],
  )
  const plugins = useMemo(
    () => (slideAutoplayEnabled ? [autoplayPlugin] : undefined),
    [autoplayPlugin, slideAutoplayEnabled],
  )
  const overlay = resolveMediaOverlay({
    autoTone: 'dark',
    coverage: overlayCoverage,
    direction: overlayDirection,
    strength: overlayStyle,
    tone: themeMode,
  })

  useEffect(() => {
    if (!api) return

    const updateSelection = () => {
      setSelectedIndex(api.selectedScrollSnap())
      setScrollSnaps(api.scrollSnapList())
    }

    updateSelection()
    api.on('reInit', updateSelection).on('select', updateSelection)

    return () => {
      api.off('reInit', updateSelection).off('select', updateSelection)
    }
  }, [api])

  useEffect(() => {
    const autoplayController = api?.plugins().autoplay
    if (!autoplayController) return

    if (slideAutoplayEnabled && motionState.isMotionAllowed) {
      autoplayController.play()
    } else {
      autoplayController.stop()
    }

    return () => autoplayController.stop()
  }, [api, motionState.isMotionAllowed, slideAutoplayEnabled])

  useEffect(() => {
    const videos = [...videoRefs.current]

    videos.forEach((video, index) => {
      if (!video) return

      if (index === selectedIndex && motionState.isMotionAllowed) {
        const playResult = video.play()
        if (playResult) void playResult.catch(() => undefined)
      } else {
        video.pause()
      }
    })

    return () => {
      videos.forEach((video) => video?.pause())
    }
  }, [motionState.isMotionAllowed, selectedIndex, slides])

  if (slides.length === 0) return null

  const showDotControls = showDots && slides.length > 1
  const showHeroMotionControl = showPauseControl && motionState.showMotionControl
  const isNavigationLocked = motionState.isUserPaused

  return (
    <Carousel
      className={cn('group/hero overflow-hidden', overlay.text.title)}
      data-testid="hero-carousel"
      keyboardNavigation={!isNavigationLocked}
      opts={{ loop: slides.length > 1, watchDrag: !isNavigationLocked }}
      plugins={plugins}
      setApi={setApi}
      {...motionState.interactionProps}
    >
      <CarouselContent className="ml-0">
        {slides.map((slide, index) => {
          const Heading = index === 0 ? 'h1' : 'h2'

          return (
            <CarouselItem
              className="pl-0"
              key={slide.id ?? slide.backgroundVideoUrl ?? slide.backgroundImageSrc ?? index}
            >
              <div
                className={cn(
                  'group relative flex items-center overflow-hidden px-4 py-24 md:px-12 lg:px-40',
                  heightClasses[height],
                )}
                data-block-surface={overlay.blockSurface}
                data-hero-carousel-slide={index}
              >
                <div className="absolute inset-0">
                  {slide.backgroundVideoUrl ? (
                    <video
                      className="size-full object-cover object-center"
                      loop
                      muted
                      playsInline
                      ref={(video) => {
                        videoRefs.current[index] = video
                      }}
                      src={slide.backgroundVideoUrl}
                    />
                  ) : slide.backgroundImageSrc ? (
                    <Image
                      fill
                      alt={slide.backgroundImageAlt ?? ''}
                      className="object-cover object-center"
                      priority={index === 0}
                      sizes="100vw"
                      src={slide.backgroundImageSrc}
                    />
                  ) : null}
                  <div
                    className={cn('absolute', overlay.frameClassName, overlay.className)}
                    data-hero-carousel-overlay-coverage={overlay.coverage}
                  />
                </div>

                <div
                  className={cn(
                    'relative mx-auto flex w-full max-w-screen-2xl',
                    contentAlignmentClasses[contentAlignment].container,
                  )}
                >
                  <div
                    className={cn(
                      'flex max-w-3xl flex-col gap-4',
                      overlay.text.title,
                      contentAlignmentClasses[contentAlignment].content,
                    )}
                  >
                    {slide.eyebrow ? (
                      <SectionEyebrow
                        className="tracking-[0.28em]"
                        surface={overlay.eyebrowSurface}
                      >
                        {slide.eyebrow}
                      </SectionEyebrow>
                    ) : null}
                    {slide.title ? (
                      <Heading className="font-serif font-semibold text-5xl leading-none tracking-tight text-balance md:text-6xl lg:text-7xl">
                        {slide.title}
                      </Heading>
                    ) : null}
                    {slide.description ? (
                      <p
                        className={cn(
                          'max-w-2xl text-base leading-7 text-balance lg:text-lg',
                          overlay.text.secondary,
                        )}
                      >
                        {slide.description}
                      </p>
                    ) : null}
                    {slide.buttons?.length ? (
                      <div
                        className={cn(
                          'mt-1 flex flex-wrap gap-3',
                          contentAlignmentClasses[contentAlignment].actions,
                        )}
                      >
                        {slide.buttons.map((button) =>
                          button.variant === 'link' ? (
                            <ContentLink
                              className={overlay.text.link}
                              download={button.download}
                              href={button.href}
                              indicator={button.indicator}
                              indicatorPosition={button.indicatorPosition}
                              key={`${button.label}-${button.href}`}
                              label={button.label}
                              openInNewTab={button.openInNewTab}
                            />
                          ) : (
                            <Button
                              asChild
                              key={`${button.label}-${button.href}`}
                              size="lg"
                              variant={button.variant ?? 'secondary'}
                            >
                              <a {...getCmsActionAnchorProps(button)}>
                                <ActionButtonContent
                                  indicator={button.indicator}
                                  indicatorPosition={button.indicatorPosition}
                                  label={button.label}
                                  showArrow={button.showArrow}
                                />
                              </a>
                            </Button>
                          ),
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </CarouselItem>
          )
        })}
      </CarouselContent>

      {showArrows && slides.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-between px-4 md:px-8 lg:px-12">
          <Button
            aria-label="Previous slide"
            className="pointer-events-auto"
            disabled={isNavigationLocked}
            onClick={() => api?.scrollPrev()}
            size="icon-lg"
            variant="secondary"
          >
            <ChevronLeft data-icon="inline-start" />
            <span className="sr-only">Previous slide</span>
          </Button>
          <Button
            aria-label="Next slide"
            className="pointer-events-auto"
            disabled={isNavigationLocked}
            onClick={() => api?.scrollNext()}
            size="icon-lg"
            variant="secondary"
          >
            <ChevronRight data-icon="inline-start" />
            <span className="sr-only">Next slide</span>
          </Button>
        </div>
      ) : null}

      {showDotControls ? (
        <div
          className={cn(
            'absolute inset-x-0 bottom-8 flex items-center justify-center gap-3 px-4 md:px-8 lg:px-12',
            overlay.text.title,
          )}
        >
          {scrollSnaps.map((_, index) => (
            <button
              aria-current={selectedIndex === index ? 'true' : undefined}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                'size-2.5 rounded-full border border-current transition-colors',
                selectedIndex === index ? 'bg-current' : 'bg-transparent',
              )}
              disabled={isNavigationLocked}
              key={index}
              onClick={() => api?.scrollTo(index)}
              type="button"
            />
          ))}
        </div>
      ) : null}

      {showHeroMotionControl ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          data-testid="hero-motion-control-overlay"
        >
          <MotionToggle
            className="pointer-events-auto opacity-0 transition-opacity duration-200 group-hover/hero:opacity-100 group-focus-within/hero:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-100"
            contextLabel="hero motion"
            isPaused={motionState.isUserPaused}
            onToggle={motionState.toggleUserPaused}
            variant="secondary"
          />
        </div>
      ) : null}
    </Carousel>
  )
}
