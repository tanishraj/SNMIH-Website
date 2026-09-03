'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

import { MotionToggle } from '@/components/motion/MotionToggle'
import { useControllableMotion } from '@/components/motion/useControllableMotion'

const DEFAULT_INTERVAL_MS = 4000
const MIN_INTERVAL_MS = 2000
const TRANSITION_DURATION_SECONDS = 0.16

type RotatingAnnouncementItem = {
  description: string
  title?: string
  url?: string
}

export type RotatingAnnouncementMode = 'horizontal' | 'vertical'

export function RotatingAnnouncementContent({
  intervalMs,
  items,
  mode = 'vertical',
}: {
  intervalMs?: number | null
  items: RotatingAnnouncementItem[]
  mode?: RotatingAnnouncementMode
}) {
  const sanitizedInterval = useMemo(
    () => Math.max(intervalMs ?? DEFAULT_INTERVAL_MS, MIN_INTERVAL_MS),
    [intervalMs],
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const motionState = useControllableMotion({ enabled: items.length > 1 })

  useEffect(() => {
    if (!motionState.isMotionAllowed) return

    const intervalId = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % items.length)
    }, sanitizedInterval)

    return () => window.clearInterval(intervalId)
  }, [items.length, motionState.isMotionAllowed, sanitizedInterval])

  const safeCurrentIndex = items.length ? currentIndex % items.length : 0
  const currentItem = items[safeCurrentIndex]
  const initialOffset = mode === 'horizontal' ? { x: 8, y: 0 } : { x: 0, y: 8 }
  const exitOffset = mode === 'horizontal' ? { x: -8, y: 0 } : { x: 0, y: -8 }
  const motionDisabled = motionState.prefersReducedMotion

  if (!currentItem) return null

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      data-testid="announcement-rotator"
      {...motionState.interactionProps}
    >
      <div className="relative min-w-0 flex-1 overflow-hidden py-0.5">
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={safeCurrentIndex}
            animate={{ opacity: 1, x: 0, y: 0 }}
            data-testid="announcement-item"
            exit={motionDisabled ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...exitOffset }}
            initial={motionDisabled ? false : { opacity: 0, ...initialOffset }}
            transition={{
              duration: motionDisabled ? 0 : TRANSITION_DURATION_SECONDS,
              ease: 'easeOut',
            }}
          >
            <AnnouncementItem item={currentItem} />
          </motion.div>
        </AnimatePresence>
      </div>
      {motionState.showMotionControl ? (
        <MotionToggle
          className="rounded-control text-current hover:bg-current/10 hover:text-current"
          contextLabel="announcements"
          isPaused={motionState.isUserPaused}
          onToggle={motionState.toggleUserPaused}
          variant="ghost"
        />
      ) : null}
    </div>
  )
}

function AnnouncementItem({ item }: { item: RotatingAnnouncementItem }) {
  const isExternalUrl = item.url?.startsWith('http://') || item.url?.startsWith('https://')

  return (
    <div className="flex min-h-full min-w-0 items-center gap-x-2 whitespace-nowrap">
      {item.title ? (
        <span className="max-w-[40%] shrink truncate font-medium">{item.title}</span>
      ) : null}
      {item.title ? (
        <span aria-hidden="true" className="shrink-0 text-current/70">
          —
        </span>
      ) : null}
      {item.url ? (
        <a
          className="min-w-0 flex-1 truncate transition-opacity hover:opacity-80"
          href={item.url}
          rel={isExternalUrl ? 'noreferrer' : undefined}
          target={isExternalUrl ? '_blank' : undefined}
        >
          {item.description}
        </a>
      ) : (
        <p className="min-w-0 flex-1 truncate">{item.description}</p>
      )}
    </div>
  )
}
