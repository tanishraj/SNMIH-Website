'use client'

import { Megaphone, X } from 'lucide-react'
import { useEffect, useState, useSyncExternalStore } from 'react'

import { cn } from '@/lib/utils'

import { MarqueeAnnouncementContent } from '@/components/announcement/MarqueeAnnouncementContent'
import { RotatingAnnouncementContent } from '@/components/announcement/RotatingAnnouncementContent'
import { Button } from '@/components/ui/button'

export type AnnouncementItemInput = {
  description?: string | null
  title?: string | null
  url?: string | null
}

export type AnnouncementDisplayMode = 'horizontal' | 'marquee' | 'vertical'

type AnnouncementBarProps = {
  displayMode?: AnnouncementDisplayMode | null
  intervalMs?: number | null
  items?: AnnouncementItemInput[] | null
  label?: string | null
  marqueeDurationMs?: number | null
  sticky?: boolean
  topOffset?: string
  className?: string
  dismissible?: boolean | null
  hideOnScroll?: boolean | null
}

// Per-tab dismissal: closing hides the bar for the session and it reappears on
// a fresh visit. Not content-keyed by design (session scope).
const DISMISS_STORAGE_KEY = 'announcement:dismissed'
const noopSubscribe = () => () => {}
const getServerFalse = () => false

const getDismissSnapshot = () => {
  try {
    return window.sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1'
  } catch {
    // sessionStorage can be unavailable (privacy mode); treat as not dismissed.
    return false
  }
}

const normalizeAnnouncementItems = (items?: AnnouncementItemInput[] | null) =>
  (items ?? []).flatMap((item) => {
    const description = item.description?.trim()
    const title = item.title?.trim()
    const url = item.url?.trim()

    return description
      ? [
          {
            description,
            title,
            url: url || undefined,
          },
        ]
      : []
  })

export function AnnouncementBar({
  displayMode = 'vertical',
  intervalMs,
  items,
  label,
  marqueeDurationMs,
  sticky = false,
  topOffset = '0px',
  className,
  dismissible = false,
  hideOnScroll = false,
}: AnnouncementBarProps) {
  const normalizedItems = normalizeAnnouncementItems(items)
  const resolvedDisplayMode = displayMode ?? 'vertical'
  const resolvedLabel = label?.trim() || 'Announcement'
  const resolvedClassName = cn('bg-primary text-primary-foreground', className)

  // "Hide on scroll" bars stay in normal page flow so they scroll away and the
  // sticky header takes the top with no leftover gap. Persistent bars pin.
  const barSticky = sticky && !hideOnScroll

  const storedDismissed = useSyncExternalStore(noopSubscribe, getDismissSnapshot, getServerFalse)
  const [locallyDismissed, setLocallyDismissed] = useState(false)
  const isDismissed = Boolean(dismissible) && (storedDismissed || locallyDismissed)

  const handleDismiss = () => {
    setLocallyDismissed(true)
    try {
      window.sessionStorage.setItem(DISMISS_STORAGE_KEY, '1')
    } catch {
      // The in-memory state still dismisses the bar for this render.
    }
  }

  // Only a shown, pinned bar makes the header reserve space below it. A
  // scroll-away or dismissed bar collapses that offset so the header sits flush.
  const reservesHeaderSpace = barSticky && !isDismissed && normalizedItems.length > 0
  useEffect(() => {
    const root = document.documentElement
    if (reservesHeaderSpace) {
      root.style.removeProperty('--global-announcement-height')
    } else {
      root.style.setProperty('--global-announcement-height', '0px')
    }

    return () => {
      root.style.removeProperty('--global-announcement-height')
    }
  }, [reservesHeaderSpace])

  if (normalizedItems.length === 0 || isDismissed) {
    return null
  }

  const style = barSticky
    ? ({
        position: 'sticky',
        top: topOffset,
        zIndex: 40,
      } as const)
    : undefined

  return (
    <section aria-label="Announcement" className={resolvedClassName} style={style}>
      <div className="mx-auto flex min-h-10 w-full max-w-screen-2xl items-center gap-2 px-4 py-2 text-sm">
        <Megaphone aria-hidden="true" className="size-4 shrink-0 text-current/80 md:hidden" />
        <span className="hidden shrink-0 font-mono font-bold uppercase tracking-wider md:inline">
          {resolvedLabel}
        </span>
        <span aria-hidden="true" className="hidden shrink-0 text-current/70 md:inline">
          |
        </span>
        {resolvedDisplayMode === 'marquee' ? (
          <MarqueeAnnouncementContent durationMs={marqueeDurationMs} items={normalizedItems} />
        ) : (
          <RotatingAnnouncementContent
            intervalMs={intervalMs}
            items={normalizedItems}
            mode={resolvedDisplayMode}
          />
        )}
        {dismissible ? (
          <Button
            aria-label="Dismiss announcement"
            className="size-11 rounded-control text-current/90 hover:bg-current/10 hover:text-current"
            onClick={handleDismiss}
            size="icon-lg"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    </section>
  )
}
