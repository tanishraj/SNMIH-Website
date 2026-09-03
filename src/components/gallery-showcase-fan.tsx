'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

export type GalleryShowcaseImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type GalleryShowcaseSize = 'none' | 'comfortable' | 'compact' | 'default'

export type GalleryShowcaseImage = {
  alt: string
  height?: number
  id: number | string
  imagePosition?: GalleryShowcaseImagePosition | null
  src: string
  width?: number
}

export const galleryShowcaseTransforms = [
  { rotate: -19, x: '-120%', y: '0%', zIndex: 1 },
  { rotate: -19, x: '-62%', y: '2%', zIndex: 2 },
  { rotate: 0, x: '0%', y: '-19%', zIndex: 3 },
  { rotate: 12, x: '62%', y: '2%', zIndex: 2 },
  { rotate: 12, x: '120%', y: '0%', zIndex: 1 },
] as const

export const galleryShowcaseMobileVisibilityClasses = [
  'hidden sm:block',
  '',
  '',
  '',
  'hidden sm:block',
] as const

const fanHeightClasses = {
  none: 'h-48 sm:h-60 lg:h-68',
  compact: 'h-44 sm:h-56 lg:h-60',
  default: 'h-48 sm:h-60 lg:h-68',
  comfortable: 'h-52 sm:h-68 lg:h-72',
} as const

const cardSizeClasses = {
  none: 'size-20 sm:size-40 lg:size-44',
  compact: 'size-16 sm:size-36 lg:size-40',
  default: 'size-20 sm:size-40 lg:size-44',
  comfortable: 'size-24 sm:size-44 lg:size-48',
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const

const subscribeToHydration = () => () => undefined
const getClientHydrationSnapshot = () => true
const getServerHydrationSnapshot = () => false

type GalleryShowcaseFanProps = {
  images: GalleryShowcaseImage[]
  size?: GalleryShowcaseSize
}

export function GalleryShowcaseFan({ images, size = 'default' }: GalleryShowcaseFanProps) {
  const prefersReducedMotion = useReducedMotion()
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  )
  const shouldReduceMotion = isHydrated && Boolean(prefersReducedMotion)

  if (images.length !== 5) {
    return null
  }

  return (
    <div className="w-full overflow-x-clip" data-gallery-showcase-fan="true">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn('relative flex items-center justify-center', fanHeightClasses[size])}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 100 }}
        transition={
          shouldReduceMotion ? { duration: 0 } : { bounce: 0.3, duration: 0.7, type: 'spring' }
        }
      >
        {images.map((image, index) => {
          const transform = galleryShowcaseTransforms[index]
          const position = image.imagePosition ?? 'center'
          const visibilityClass = galleryShowcaseMobileVisibilityClasses[index]

          return (
            <motion.div
              animate={transform}
              className={cn(
                'absolute cursor-grab overflow-hidden rounded-card shadow-xl active:cursor-grabbing',
                cardSizeClasses[size],
                visibilityClass,
              )}
              drag
              dragSnapToOrigin
              initial={
                shouldReduceMotion
                  ? false
                  : {
                      rotate: transform.rotate,
                      x: '0%',
                      y: transform.y,
                      zIndex: transform.zIndex,
                    }
              }
              key={`${image.id}-${image.src}`}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : {
                      bounce: 0.3,
                      delay: 0.5,
                      duration: 0.7,
                      rotate: { duration: 0.2 },
                      scale: { duration: 0.2 },
                      type: 'spring',
                      y: { duration: 0.2 },
                      zIndex: { duration: 0.2 },
                    }
              }
              whileHover={
                shouldReduceMotion ? undefined : { rotate: 0, scale: 1.1, y: '-12%', zIndex: 20 }
              }
            >
              <Image
                alt={image.alt}
                className={cn(
                  'pointer-events-none block size-full object-cover select-none',
                  objectPositionClasses[position],
                )}
                data-gallery-showcase-image-position={position}
                draggable={false}
                height={image.height}
                src={image.src}
                width={image.width}
              />
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
