'use client'

import { Fragment, useMemo } from 'react'

import { MotionToggle } from '@/components/motion/MotionToggle'
import { useControllableMotion } from '@/components/motion/useControllableMotion'
import { cn } from '@/lib/utils'

const DEFAULT_MARQUEE_DURATION_MS = 18000
const MIN_MARQUEE_DURATION_MS = 8000

type MarqueeAnnouncementItem = {
  description: string
  title?: string
  url?: string
}

export function MarqueeAnnouncementContent({
  durationMs,
  items,
}: {
  durationMs?: number | null
  items: MarqueeAnnouncementItem[]
}) {
  const sanitizedDuration = useMemo(
    () => Math.max(durationMs ?? DEFAULT_MARQUEE_DURATION_MS, MIN_MARQUEE_DURATION_MS),
    [durationMs],
  )
  const motionState = useControllableMotion({ enabled: items.length > 1 })

  if (items.length === 0) {
    return null
  }

  const rendersStaticTrack = items.length === 1 || motionState.prefersReducedMotion

  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2"
      data-testid="announcement-marquee"
      {...motionState.interactionProps}
    >
      <div className="min-w-0 flex-1 overflow-hidden py-0.5">
        {rendersStaticTrack ? (
          <MarqueeTrack
            animated={false}
            animationDuration={sanitizedDuration}
            isPaused
            items={items}
          />
        ) : (
          <div className="flex w-max min-w-full items-center">
            <MarqueeTrack
              animated
              animationDuration={sanitizedDuration}
              isPaused={!motionState.isMotionAllowed}
              items={items}
            />
            <MarqueeTrack
              animated
              animationDuration={sanitizedDuration}
              duplicate
              isPaused={!motionState.isMotionAllowed}
              items={items}
            />
          </div>
        )}
      </div>
      {motionState.showMotionControl ? (
        <MotionToggle
          className="rounded-control text-current hover:bg-current/10 hover:text-current"
          contextLabel="marquee"
          isPaused={motionState.isUserPaused}
          onToggle={motionState.toggleUserPaused}
          variant="ghost"
        />
      ) : null}
    </div>
  )
}

function MarqueeTrack({
  animated,
  animationDuration,
  duplicate = false,
  isPaused,
  items,
}: {
  animated: boolean
  animationDuration: number
  duplicate?: boolean
  isPaused: boolean
  items: MarqueeAnnouncementItem[]
}) {
  return (
    <div
      aria-hidden={duplicate || undefined}
      className={cn(
        'items-center gap-4',
        animated
          ? 'flex shrink-0 animate-marquee whitespace-nowrap pr-4'
          : 'flex min-w-0 flex-wrap whitespace-normal',
      )}
      data-testid="announcement-marquee-track"
      style={
        animated
          ? {
              animationDuration: `${animationDuration}ms`,
              animationPlayState: isPaused ? 'paused' : 'running',
            }
          : undefined
      }
    >
      {items.map((item, index) => (
        <Fragment
          key={`${duplicate ? 'duplicate' : 'primary'}-${item.url ?? item.description}-${index}`}
        >
          <MarqueeItem animated={animated} duplicate={duplicate} item={item} />
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-current/70" />
        </Fragment>
      ))}
    </div>
  )
}

function MarqueeItem({
  animated,
  duplicate = false,
  item,
}: {
  animated: boolean
  duplicate?: boolean
  item: MarqueeAnnouncementItem
}) {
  const isExternalUrl = item.url?.startsWith('http://') || item.url?.startsWith('https://')

  if (item.url) {
    return (
      <a
        className={cn(
          'inline-flex items-center gap-x-2 transition-opacity hover:opacity-80',
          !animated && 'min-w-0 flex-wrap whitespace-normal break-words',
        )}
        href={item.url}
        rel={isExternalUrl ? 'noreferrer' : undefined}
        tabIndex={duplicate ? -1 : undefined}
        target={isExternalUrl ? '_blank' : undefined}
      >
        {item.title ? <span className="font-medium">{item.title}</span> : null}
        {item.title ? (
          <span aria-hidden="true" className="text-current/70">
            —
          </span>
        ) : null}
        <span>{item.description}</span>
      </a>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-x-2',
        !animated && 'min-w-0 flex-wrap whitespace-normal break-words',
      )}
    >
      {item.title ? <span className="font-medium">{item.title}</span> : null}
      {item.title ? (
        <span aria-hidden="true" className="text-current/70">
          —
        </span>
      ) : null}
      <span>{item.description}</span>
    </div>
  )
}
