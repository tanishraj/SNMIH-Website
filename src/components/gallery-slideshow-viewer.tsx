'use client'

import Image from 'next/image'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon, Pause, Play, RotateCcw, XIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import type { EventGalleryAlbum, EventGalleryImage } from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

const AUTOPLAY_DELAY_MS = 3500

type Direction = 1 | -1

const slideVariants = {
  enter: (dir: Direction) => ({
    x: dir > 0 ? '55%' : '-55%',
    opacity: 0,
    scale: 0.94,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.45, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  },
  exit: (dir: Direction) => ({
    x: dir > 0 ? '-55%' : '55%',
    opacity: 0,
    scale: 0.94,
    transition: { duration: 0.35, ease: [0.32, 0.72, 0, 1] as [number, number, number, number] },
  }),
}

function PaginationDot({
  index,
  currentIndex,
  isPlaying,
  onClick,
}: {
  index: number
  currentIndex: number
  isPlaying: boolean
  onClick: () => void
}) {
  const controls = useAnimationControls()
  const isActive = index === currentIndex

  useEffect(() => {
    if (isPlaying && isActive) {
      controls.set({ width: 0 })
      controls.start({
        width: '100%',
        transition: { duration: AUTOPLAY_DELAY_MS / 1000, ease: 'linear' },
      })
    } else {
      controls.stop()
    }
  }, [isPlaying, isActive, controls, currentIndex])

  return (
    <button
      aria-label={`Go to image ${index + 1}`}
      onClick={onClick}
      className={cn(
        'relative h-1.5 overflow-hidden rounded-full transition-all duration-300',
        isActive ? 'w-8 bg-white/35' : 'w-1.5 bg-white/30 hover:bg-white/55',
      )}
    >
      {isActive ? (
        <motion.span
          animate={controls}
          className="absolute inset-y-0 left-0 rounded-full bg-white"
          style={{ width: 0 }}
        />
      ) : null}
    </button>
  )
}

export const getEventGalleryCaption = (
  image: EventGalleryImage,
  albumTitle: string,
): string | undefined => {
  const caption = image.caption?.trim()
  if (caption) return caption
  const alt = image.alt.trim()
  return !alt || alt.toLocaleLowerCase() === albumTitle.trim().toLocaleLowerCase() ? undefined : alt
}

export const getAdjacentImageIndexes = (
  length: number,
  currentIndex: number,
): { next: number; previous: number } | null => {
  if (length <= 1) return null
  return {
    next: (currentIndex + 1) % length,
    previous: (currentIndex - 1 + length) % length,
  }
}

export const getEventGalleryAutoplayAction = ({
  isAtEnd,
  isMultiple,
  isPlaying,
}: {
  isAtEnd: boolean
  isMultiple: boolean
  isPlaying: boolean
}) => {
  if (!isPlaying || !isMultiple) return 'idle' as const
  return isAtEnd ? ('stop' as const) : ('schedule' as const)
}

export type GallerySlideshowViewerProps = {
  album: EventGalleryAlbum
  initialIndex?: number
  onClose: () => void
}

export function GallerySlideshowViewer({
  album,
  initialIndex = 0,
  onClose,
}: GallerySlideshowViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(
    Math.min(Math.max(initialIndex, 0), album.images.length - 1),
  )
  const [direction, setDirection] = useState<Direction>(1)
  const [isPlaying, setIsPlaying] = useState(true)
  const autoplayRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMultiple = album.images.length > 1
  const isAtEnd = currentIndex === album.images.length - 1

  const navigate = useCallback((nextIndex: number, dir: Direction) => {
    setDirection(dir)
    setCurrentIndex(nextIndex)
  }, [])

  const goNext = useCallback(() => {
    if (!isMultiple) return
    navigate((currentIndex + 1) % album.images.length, 1)
  }, [currentIndex, album.images.length, isMultiple, navigate])

  const goPrev = useCallback(() => {
    if (!isMultiple) return
    navigate((currentIndex - 1 + album.images.length) % album.images.length, -1)
  }, [currentIndex, album.images.length, isMultiple, navigate])

  const goTo = useCallback(
    (index: number) => navigate(index, index >= currentIndex ? 1 : -1),
    [currentIndex, navigate],
  )

  const restart = useCallback(() => {
    setDirection(1)
    setCurrentIndex(0)
    setIsPlaying(true)
  }, [])

  // Autoplay
  useEffect(() => {
    const action = getEventGalleryAutoplayAction({ isAtEnd, isMultiple, isPlaying })
    if (action === 'idle') return

    autoplayRef.current = setTimeout(
      () => {
        if (action === 'stop') {
          setIsPlaying(false)
          return
        }
        goNext()
      },
      action === 'stop' ? 0 : AUTOPLAY_DELAY_MS,
    )

    return () => {
      if (autoplayRef.current) clearTimeout(autoplayRef.current)
    }
  }, [goNext, isAtEnd, isMultiple, isPlaying])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') {
        setIsPlaying(false)
        goNext()
      }
      if (e.key === 'ArrowLeft') {
        setIsPlaying(false)
        goPrev()
      }
      if (e.key === ' ') {
        e.preventDefault()
        setIsPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goNext, goPrev, onClose])

  // Scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const image = album.images[currentIndex]
  const caption = image ? getEventGalleryCaption(image, album.title) : undefined

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label={`${album.title} gallery`}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black"
        onClick={onClose}
      />

      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-3 bg-linear-to-b from-black/60 via-black/20 to-transparent px-4 pb-12 pt-4 sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight tracking-tight text-white">
            {album.title}
          </p>
          <p className="mt-0.5 font-mono text-[11px] text-white/55">
            {String(currentIndex + 1).padStart(2, '0')} /{' '}
            {String(album.images.length).padStart(2, '0')}
          </p>
        </div>
        <button
          aria-label="Close gallery"
          onClick={onClose}
          className="pointer-events-auto flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      {/* Slide area */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden">
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 flex cursor-grab items-center justify-center active:cursor-grabbing"
            drag={isMultiple ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.12}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 50) {
                setIsPlaying(false)
                if (info.offset.x < 0) {
                  goNext()
                } else {
                  goPrev()
                }
              }
            }}
          >
            <Image
              alt={image?.alt ?? ''}
              src={image?.src ?? ''}
              width={image?.width ?? 1600}
              height={image?.height ?? 900}
              className="max-h-full max-w-full select-none object-contain"
              draggable={false}
              style={{ pointerEvents: 'none' }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Side arrows */}
        {isMultiple ? (
          <>
            <button
              aria-label="Previous image"
              onClick={() => {
                setIsPlaying(false)
                goPrev()
              }}
              className="absolute left-3 z-20 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:left-4 sm:size-11"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              aria-label="Next image"
              onClick={() => {
                setIsPlaying(false)
                goNext()
              }}
              className="absolute right-3 z-20 flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:right-4 sm:size-11"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </>
        ) : null}
      </div>

      {/* Footer */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-4 bg-linear-to-t from-black/65 via-black/25 to-transparent px-4 pb-6 pt-16 sm:px-6">
        {caption ? (
          <p className="max-w-xl text-center text-xs leading-5 text-white/80 sm:text-sm">
            {caption}
          </p>
        ) : null}

        {isMultiple ? (
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Pagination dots */}
            <div className="flex h-10 items-center gap-2 rounded-full bg-black/40 px-5 backdrop-blur-xl ring-1 ring-inset ring-white/10">
              {album.images.map((_, index) => (
                <PaginationDot
                  key={index}
                  index={index}
                  currentIndex={currentIndex}
                  isPlaying={isPlaying}
                  onClick={() => {
                    setIsPlaying(false)
                    goTo(index)
                  }}
                />
              ))}
            </div>

            {/* Play / Pause / Restart */}
            <button
              aria-label={
                isAtEnd && !isPlaying
                  ? 'Restart slideshow'
                  : isPlaying
                    ? 'Pause slideshow'
                    : 'Play slideshow'
              }
              onClick={isAtEnd && !isPlaying ? restart : () => setIsPlaying((p) => !p)}
              className="flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xl ring-1 ring-inset ring-white/10 transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {isAtEnd && !isPlaying ? (
                <RotateCcw className="size-3.5" />
              ) : isPlaying ? (
                <Pause className="size-3.5 fill-white stroke-none" />
              ) : (
                <Play className="size-3.5 fill-white stroke-none" />
              )}
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
