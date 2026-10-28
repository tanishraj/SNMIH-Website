'use client'

import { Sparkles, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'

import {
  getCelebrationStorageKey,
  isCelebrationActiveOn,
  parseCelebrationViewRecord,
  recordCelebrationOpen,
  shouldAutoOpenCelebration,
  type CelebrationViewRecord,
} from '@/lib/celebrations/shared'
import type { CelebrationView } from '@/lib/celebrations/view'
import { getZonedToday, type SiteTimeZone } from '@/lib/siteTimeZone'
import { cn } from '@/lib/utils'

import styles from './celebration.module.css'
import { getCelebrationWidth, CelebrationCard } from './CelebrationCard'
import {
  getCelebrationSlotWinner,
  registerCelebrationHost,
  subscribeCelebrationSlot,
  type CelebrationPriority,
} from './celebrationSlot'
import { launchConfetti } from './confetti'

type CelebrationHostProps = {
  celebrations: CelebrationView[]
  priority: CelebrationPriority
  timeZone: SiteTimeZone
}

/** Re-reads today's date each minute so an open tab switches celebrations at midnight. */
const subscribeToDay = (onChange: () => void) => {
  const id = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(id)
}

const readRecord = (key: string): CelebrationViewRecord => {
  try {
    return parseCelebrationViewRecord(window.localStorage.getItem(key))
  } catch {
    return {}
  }
}

const writeRecord = (key: string, record: CelebrationViewRecord) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(record))
  } catch {
    // Storage can be blocked (private mode); the celebration then follows the in-memory state.
  }
}

/**
 * Shows today's celebration as an accessible modal with confetti, honouring the editor's
 * frequency setting per visitor. Renders nothing on the server, so cached pages never show a
 * celebration on the wrong day.
 */
export function CelebrationHost({ celebrations, priority, timeZone }: CelebrationHostProps) {
  const hostId = useId()
  const todayKey = useSyncExternalStore(
    subscribeToDay,
    () => getZonedToday(new Date(), timeZone),
    () => null,
  )
  const active = useMemo(
    () =>
      todayKey ? celebrations.find((view) => isCelebrationActiveOn(view, todayKey)) : undefined,
    [celebrations, todayKey],
  )

  useEffect(() => {
    if (!active) return
    return registerCelebrationHost(hostId, priority)
  }, [active, hostId, priority])

  const winner = useSyncExternalStore(
    subscribeCelebrationSlot,
    getCelebrationSlotWinner,
    () => null,
  )
  const isWinner = Boolean(active) && winner === hostId

  // Decided once per celebration and day, before the open is recorded.
  const autoOpen = useMemo(() => {
    if (!active || !todayKey) return false
    return shouldAutoOpenCelebration({
      frequency: active.frequency,
      record: readRecord(getCelebrationStorageKey(active.id)),
      timesPerDay: active.timesPerDay,
      todayKey,
    })
  }, [active, todayKey])

  const [open, setOpen] = useState(false)
  const [hasClosed, setHasClosed] = useState(false)

  useEffect(() => {
    if (!isWinner || !active || !todayKey || !autoOpen) return
    const timer = window.setTimeout(() => {
      const key = getCelebrationStorageKey(active.id)
      writeRecord(key, recordCelebrationOpen(readRecord(key), todayKey))
      setOpen(true)
    }, active.openDelayMs)
    return () => window.clearTimeout(timer)
  }, [active, autoOpen, isWinner, todayKey])

  // Confetti lasts only while the modal is open: closing it (or leaving the page) clears the canvas.
  useEffect(() => {
    if (!open || !active?.confetti.enabled) return
    return launchConfetti({
      pieces: active.confetti.pieces,
      shots: active.confetti.shots,
      speed: active.confetti.speed,
    })
  }, [active, open])

  if (!active || !isWinner) return null

  const showBadge = active.showReopenBadge && !open && (hasClosed || !autoOpen)
  const isLightStyle = active.style === 'glass' && !active.imageOnly

  return (
    <>
      <DialogPrimitive.Root
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setHasClosed(true)
        }}
        open={open}
      >
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay
            className={cn(styles.overlay, isLightStyle && styles.overlayLight)}
          />
          {isLightStyle ? (
            <div aria-hidden="true" className={styles.orbs}>
              <i />
              <i />
              <i />
            </div>
          ) : null}
          <DialogPrimitive.Content
            // Without a message there is no Description, so opt out of Radix's describedby link.
            {...(active.message ? {} : { 'aria-describedby': undefined })}
            className={cn(styles.root, styles.content)}
            data-celebration-id={active.id}
            style={{ '--cel-width': `${getCelebrationWidth(active)}px` } as CSSProperties}
          >
            <CelebrationCard
              closeSlot={
                <DialogPrimitive.Close
                  aria-label="Close celebration"
                  className={cn(styles.close, isLightStyle && styles.closeLight)}
                >
                  <X aria-hidden="true" strokeWidth={2} />
                </DialogPrimitive.Close>
              }
              Description={DialogPrimitive.Description}
              Title={DialogPrimitive.Title}
              view={active}
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {showBadge ? (
        <button
          className={cn(styles.root, styles.badge)}
          data-celebration-badge="true"
          onClick={() => setOpen(true)}
          type="button"
        >
          <span aria-hidden="true" className={styles.badgeOrb}>
            <span>
              <Sparkles />
            </span>
          </span>
          {active.badgeLabel}
        </button>
      ) : null}
    </>
  )
}
