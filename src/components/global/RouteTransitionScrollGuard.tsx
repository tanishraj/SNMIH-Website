'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

const RESTORE_TIMEOUT_MS = 15_000

type PendingNavigation = {
  hash: string
}

const ROUTE_COMMIT_EVENT = 'snmih:frontend-route-commit'

const getCrossPageDestination = (event: MouseEvent, anchor: HTMLAnchorElement): URL | null => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    anchor.hasAttribute('download')
  ) {
    return null
  }

  const target = anchor.target.trim().toLowerCase()

  if (target && target !== '_self') {
    return null
  }

  const currentURL = new URL(window.location.href)
  const destinationURL = new URL(anchor.href, currentURL)

  if (
    destinationURL.origin !== currentURL.origin ||
    !['http:', 'https:'].includes(destinationURL.protocol) ||
    destinationURL.pathname.startsWith('/api/') ||
    destinationURL.pathname.startsWith('/_next/') ||
    destinationURL.pathname === '/admin' ||
    destinationURL.pathname.startsWith('/admin/') ||
    destinationURL.pathname === currentURL.pathname
  ) {
    return null
  }

  return destinationURL
}

export function RouteTransitionScrollGuard() {
  const router = useRouter()
  const previousScrollBehaviorRef = useRef<string | null>(null)
  const restoreTimerRef = useRef<number | null>(null)
  const pendingNavigationRef = useRef<PendingNavigation | null>(null)

  const restoreScrollBehavior = useCallback(() => {
    if (restoreTimerRef.current !== null) {
      window.clearTimeout(restoreTimerRef.current)
      restoreTimerRef.current = null
    }

    const previousScrollBehavior = previousScrollBehaviorRef.current

    if (previousScrollBehavior === null) {
      return
    }

    const root = document.documentElement

    if (previousScrollBehavior) {
      root.style.scrollBehavior = previousScrollBehavior
    } else {
      root.style.removeProperty('scroll-behavior')
    }

    previousScrollBehaviorRef.current = null
  }, [])

  const cancelPendingNavigation = useCallback(() => {
    pendingNavigationRef.current = null
    restoreScrollBehavior()
  }, [restoreScrollBehavior])

  const positionCommittedDestination = useCallback(() => {
    const pendingNavigation = pendingNavigationRef.current

    if (!pendingNavigation) {
      return
    }

    pendingNavigationRef.current = null

    const hashID = pendingNavigation.hash.slice(1)
    let decodedHashID = hashID

    try {
      decodedHashID = decodeURIComponent(hashID)
    } catch {
      // Keep the encoded value when a CMS-authored fragment is malformed.
    }

    const hashTarget = decodedHashID
      ? (document.getElementById(decodedHashID) ?? document.getElementsByName(decodedHashID)[0])
      : null

    if (hashTarget) {
      hashTarget.scrollIntoView({ behavior: 'auto', block: 'start' })
    } else {
      window.scrollTo({ behavior: 'auto', left: 0, top: 0 })
    }

    restoreScrollBehavior()
  }, [restoreScrollBehavior])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest<HTMLAnchorElement>('a[href]')
      const destinationURL = anchor ? getCrossPageDestination(event, anchor) : null

      if (!destinationURL) {
        return
      }

      event.preventDefault()

      if (
        anchor &&
        document.activeElement === anchor &&
        anchor.closest('[data-slot="navigation-menu-content"]')
      ) {
        anchor.blur()
      }

      const root = document.documentElement

      if (previousScrollBehaviorRef.current === null) {
        previousScrollBehaviorRef.current = root.style.scrollBehavior
      }

      root.style.scrollBehavior = 'auto'
      root.getClientRects()

      if (restoreTimerRef.current !== null) {
        window.clearTimeout(restoreTimerRef.current)
      }

      pendingNavigationRef.current = {
        hash: destinationURL.hash,
      }
      restoreTimerRef.current = window.setTimeout(cancelPendingNavigation, RESTORE_TIMEOUT_MS)

      router.push(`${destinationURL.pathname}${destinationURL.search}${destinationURL.hash}`, {
        scroll: false,
      })
    }

    document.addEventListener('click', handleClick, true)
    window.addEventListener(ROUTE_COMMIT_EVENT, positionCommittedDestination)

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener(ROUTE_COMMIT_EVENT, positionCommittedDestination)
      cancelPendingNavigation()
    }
  }, [cancelPendingNavigation, positionCommittedDestination, router])

  return null
}

export function RouteTransitionCommitSignal() {
  useLayoutEffect(() => {
    window.dispatchEvent(new Event(ROUTE_COMMIT_EVENT))
  }, [])

  return null
}
