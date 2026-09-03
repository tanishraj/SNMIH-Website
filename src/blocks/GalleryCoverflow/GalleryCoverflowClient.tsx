'use client'

import 'swiper/css'
import 'swiper/css/effect-coverflow'

import { motion, useReducedMotion } from 'framer-motion'
import Image from 'next/image'
import { useMemo, useSyncExternalStore } from 'react'
import { Autoplay, EffectCoverflow } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import { cn } from '@/lib/utils'

export type CoverflowImage = {
  alt: string
  height?: number
  id: string | number
  src: string
  width?: number
}

export type CoverflowSurface = 'accent' | 'muted' | 'none' | 'primary' | 'secondary'

export type CoverflowLoopImage = CoverflowImage & {
  renderKey: string
}

type GalleryCoverflowClientProps = {
  images: CoverflowImage[]
  surface?: CoverflowSurface
}

const surfaceFadeClasses = {
  accent: 'from-accent',
  muted: 'from-muted',
  none: 'from-background',
  primary: 'from-primary',
  secondary: 'from-secondary',
} as const

const MIN_COVERFLOW_SLIDES = 9

export function buildCoverflowLoopImages(images: CoverflowImage[]): CoverflowLoopImage[] {
  if (images.length === 0) return []

  const cycleCount =
    images.length < MIN_COVERFLOW_SLIDES ? Math.ceil(MIN_COVERFLOW_SLIDES / images.length) : 1

  return Array.from({ length: images.length * cycleCount }, (_, index) => {
    const image = images[index % images.length]

    return {
      ...image,
      renderKey: `${image.id}-${index}`,
    }
  })
}

const swiperCss = `
  .gallery-coverflow-swiper {
    width: 100%;
    height: 420px;
    padding-bottom: 50px;
  }

  .gallery-coverflow-swiper .swiper-slide {
    width: min(300px, calc(100vw - 4rem));
    height: 100%;
  }

  .gallery-coverflow-swiper .swiper-slide-shadow-left,
  .gallery-coverflow-swiper .swiper-slide-shadow-right {
    background: none;
  }

  @media (max-width: 639px) {
    .gallery-coverflow-swiper {
      height: 360px;
    }
  }
`

const subscribeToHydration = () => () => undefined
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

export function GalleryCoverflowClient({ images, surface = 'none' }: GalleryCoverflowClientProps) {
  const prefersReducedMotion = useReducedMotion()
  const loopImages = useMemo(() => buildCoverflowLoopImages(images), [images])
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const shouldReduceMotion = isHydrated && Boolean(prefersReducedMotion)

  if (images.length === 0) return null

  return (
    <div
      className="relative mx-auto mt-12 h-90 w-full max-w-4xl overflow-hidden sm:h-105"
      data-gallery-coverflow-stage="true"
    >
      <style>{swiperCss}</style>

      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-linear-to-r to-transparent md:w-40',
          surfaceFadeClasses[surface],
        )}
      />
      <div
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-linear-to-l to-transparent md:w-40',
          surfaceFadeClasses[surface],
        )}
      />

      <motion.div
        animate={{ opacity: 1 }}
        className="w-full"
        initial={shouldReduceMotion ? false : { opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
      >
        <Swiper
          autoplay={{ delay: 1500, disableOnInteraction: false }}
          centeredSlides
          className="gallery-coverflow-swiper"
          coverflowEffect={{
            depth: 100,
            modifier: 1,
            rotate: 50,
            slideShadows: true,
            stretch: 0,
          }}
          effect="coverflow"
          grabCursor
          loop
          modules={[EffectCoverflow, Autoplay]}
          slidesPerView="auto"
        >
          {loopImages.map((image) => (
            <SwiperSlide key={image.renderKey}>
              <div className="relative size-full overflow-hidden rounded-card shadow-lg">
                <Image
                  fill
                  alt={image.alt}
                  className="object-cover"
                  sizes="(max-width: 640px) calc(100vw - 4rem), 300px"
                  src={image.src}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </motion.div>
    </div>
  )
}
