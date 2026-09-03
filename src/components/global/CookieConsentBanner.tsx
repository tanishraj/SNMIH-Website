'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { ShieldCheck, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { readAnalyticsConsent, writeAnalyticsConsent } from '@/lib/analyticsConsent'
import { cn } from '@/lib/utils'

const BACK_TO_TOP_SELECTOR = '[data-back-to-top="true"]'
const BACK_TO_TOP_OFFSET_PROPERTY = '--cookie-consent-back-to-top-offset'

export type CookieConsentVariant = 'bottom-bar' | 'floating-card' | 'modal' | 'corner-badge'
export type CookieConsentPosition = 'bottom-left' | 'bottom-right'

export type CookieConsentConfig = {
  enabled?: boolean | null
  variant?: CookieConsentVariant | null
  position?: CookieConsentPosition | null
  heading?: string | null
  message?: string | null
  acceptLabel?: string | null
  rejectLabel?: string | null
  learnMoreLabel?: string | null
  privacyPolicyUrl?: string | null
}

function hasConsentDecision(): boolean {
  return readAnalyticsConsent() !== null
}

// no-op subscribe — cookies have no push notifications; we only need the
// server/client snapshot split to avoid a hydration mismatch.
function subscribe() {
  return () => {}
}

function useConsent() {
  const needsConsent = useSyncExternalStore(
    subscribe,
    () => !hasConsentDecision(), // client: check real cookie
    () => false,                 // server: always hide during SSR
  )
  const [dismissed, setDismissed] = useState(false)

  const visible = needsConsent && !dismissed

  function setConsent(granted: boolean) {
    writeAnalyticsConsent(granted ? 'granted' : 'denied')
    setDismissed(true)
  }

  return { visible, setConsent }
}

function useBackToTopOffsetSource(measurementKey?: unknown) {
  const surfaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const surface = surfaceRef.current
    const root = document.documentElement
    if (!surface) return

    const updateOffset = () => {
      const button = document.querySelector<HTMLElement>(BACK_TO_TOP_SELECTOR)
      if (!button) {
        root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
        return
      }

      const surfaceRect = surface.getBoundingClientRect()
      const buttonRect = button.getBoundingClientRect()
      const overlapsButtonColumn =
        surfaceRect.left < buttonRect.right && surfaceRect.right > buttonRect.left

      if (!overlapsButtonColumn) {
        root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
        return
      }

      const obstruction = Math.max(0, Math.ceil(window.innerHeight - surfaceRect.top))
      if (obstruction === 0) {
        root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
        return
      }

      root.style.setProperty(BACK_TO_TOP_OFFSET_PROPERTY, `${obstruction}px`)
    }

    updateOffset()
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateOffset)
    resizeObserver?.observe(surface)
    window.addEventListener('resize', updateOffset)

    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateOffset)
      root.style.removeProperty(BACK_TO_TOP_OFFSET_PROPERTY)
    }
  }, [measurementKey])

  return surfaceRef
}

// ── Bottom Bar ────────────────────────────────────────────────────────────────

function BottomBar({ config, onAccept, onReject }: VariantProps) {
  const { message, acceptLabel, rejectLabel, learnMoreLabel, privacyPolicyUrl } = config
  const surfaceRef = useBackToTopOffsetSource()

  return (
    <div
      ref={surfaceRef}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-describedby="cc-description"
      data-cookie-consent-surface="bottom-bar"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 shadow-lg backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:gap-8 md:px-6 md:py-4">
        <p id="cc-description" className="flex-1 text-sm leading-6 text-muted-foreground">
          {message || 'We use cookies to analyse site performance and improve your experience.'}{' '}
          {privacyPolicyUrl ? (
            <Link
              href={privacyPolicyUrl}
              className="font-medium text-foreground underline underline-offset-2 hover:opacity-70"
            >
              {learnMoreLabel || 'Privacy Policy'}
            </Link>
          ) : null}
        </p>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={onReject}>
            {rejectLabel || 'Reject non-essential'}
          </Button>
          <Button size="sm" onClick={onAccept}>
            {acceptLabel || 'Accept all'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Floating Card ─────────────────────────────────────────────────────────────

function FloatingCard({ config, onAccept, onReject }: VariantProps) {
  const { heading, message, acceptLabel, rejectLabel, learnMoreLabel, privacyPolicyUrl, position } =
    config
  const isLeft = position === 'bottom-left'
  const surfaceRef = useBackToTopOffsetSource()

  return (
    <div
      ref={surfaceRef}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      data-cookie-consent-surface="floating-card"
      className={cn(
        'fixed bottom-4 z-50 w-[calc(100vw-2rem)] max-w-sm',
        isLeft ? 'left-4' : 'right-4',
      )}
    >
      <div className="rounded-card border border-border/80 bg-background/95 p-5 shadow-xl backdrop-blur-sm">
        {heading?.trim() ? (
          <p className="mb-2 text-sm font-semibold text-foreground">{heading.trim()}</p>
        ) : null}
        <p id="cc-description" className="text-sm leading-6 text-muted-foreground">
          {message || 'We use cookies to analyse site performance and improve your experience.'}{' '}
          {privacyPolicyUrl ? (
            <Link
              href={privacyPolicyUrl}
              className="font-medium text-foreground underline underline-offset-2 hover:opacity-70"
            >
              {learnMoreLabel || 'Privacy Policy'}
            </Link>
          ) : null}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Button className="w-full" onClick={onAccept}>
            {acceptLabel || 'Accept all'}
          </Button>
          <Button variant="outline" className="w-full" onClick={onReject}>
            {rejectLabel || 'Reject non-essential'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ config, onAccept, onReject }: VariantProps) {
  const { heading, message, acceptLabel, rejectLabel, learnMoreLabel, privacyPolicyUrl } = config
  const rejectButtonRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(
    typeof document !== 'undefined' && document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null,
  )

  useEffect(() => {
    const previousFocus = restoreFocusRef.current

    return () => {
      queueMicrotask(() => {
        if (previousFocus?.isConnected) previousFocus.focus()
      })
    }
  }, [])

  return (
    <DialogPrimitive.Root
      modal
      open
      onOpenChange={(open) => {
        if (!open) onReject()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          data-cookie-consent-overlay="true"
        />
        <DialogPrimitive.Content
          aria-modal="true"
          className="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-border bg-background p-6 shadow-2xl"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            rejectButtonRef.current?.focus()
          }}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <ShieldCheck className="mb-3 size-8 text-primary" aria-hidden="true" />
          <DialogPrimitive.Title className="mb-2 text-base font-semibold text-foreground">
            {heading?.trim() || 'We value your privacy'}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="text-sm leading-6 text-muted-foreground">
            {message || 'We use cookies to analyse site performance and improve your experience.'}{' '}
            {privacyPolicyUrl ? (
              <Link
                href={privacyPolicyUrl}
                className="font-medium text-foreground underline underline-offset-2 hover:opacity-70"
              >
                {learnMoreLabel || 'Privacy Policy'}
              </Link>
            ) : null}
          </DialogPrimitive.Description>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button className="flex-1" onClick={onAccept}>
              {acceptLabel || 'Accept all'}
            </Button>
            <Button
              ref={rejectButtonRef}
              variant="outline"
              className="flex-1"
              onClick={onReject}
            >
              {rejectLabel || 'Reject non-essential'}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ── Corner Badge ──────────────────────────────────────────────────────────────

function CornerBadge({ config, onAccept, onReject }: VariantProps) {
  const [expanded, setExpanded] = useState(false)
  const { message, acceptLabel, rejectLabel, learnMoreLabel, privacyPolicyUrl, position } = config
  const isLeft = position === 'bottom-left'
  const surfaceRef = useBackToTopOffsetSource(expanded)

  return (
    <div
      ref={surfaceRef}
      data-cookie-consent-surface="corner-badge"
      className={cn('fixed bottom-4 z-50', isLeft ? 'left-4' : 'right-4')}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
    >
      {expanded ? (
        <div className="relative w-72 rounded-card border border-border/80 bg-background/95 p-4 shadow-xl backdrop-blur-sm">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setExpanded(false)}
            aria-label="Collapse"
            className="absolute right-3 top-3"
          >
            <X className="size-4" />
          </Button>
          <p className="pr-6 text-sm leading-6 text-muted-foreground">
            {message || 'We use cookies to analyse site performance and improve your experience.'}{' '}
            {privacyPolicyUrl ? (
              <Link
                href={privacyPolicyUrl}
                className="font-medium text-foreground underline underline-offset-2 hover:opacity-70"
              >
                {learnMoreLabel || 'Privacy Policy'}
              </Link>
            ) : null}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="xs" className="flex-1" onClick={onAccept}>
              {acceptLabel || 'Accept all'}
            </Button>
            <Button variant="outline" size="xs" className="flex-1" onClick={onReject}>
              {rejectLabel || 'Reject'}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Cookie preferences"
          className="flex items-center gap-2 rounded-full border border-border/80 bg-background/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-lg backdrop-blur-sm transition hover:text-foreground"
        >
          <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
          Cookie preferences
        </button>
      )}
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────

type VariantProps = {
  config: CookieConsentConfig
  onAccept: () => void
  onReject: () => void
}

export function CookieConsentBanner(config: CookieConsentConfig) {
  const { visible, setConsent } = useConsent()

  if (!config.enabled) return null
  if (!visible) return null

  const variant = config.variant ?? 'bottom-bar'
  const props: VariantProps = {
    config,
    onAccept: () => setConsent(true),
    onReject: () => setConsent(false),
  }

  if (variant === 'floating-card') return <FloatingCard {...props} />
  if (variant === 'modal') return <Modal {...props} />
  if (variant === 'corner-badge') return <CornerBadge {...props} />
  return <BottomBar {...props} />
}
