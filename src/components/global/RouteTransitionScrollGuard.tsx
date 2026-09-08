'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

const RESTORE_TIMEOUT_MS = 15_000

const ROUTE_COMMIT_EVENT = 'snmih:frontend-route-commit'

const getNavigationDestination = (event: MouseEvent, anchor: HTMLAnchorElement): URL | null => {
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
    (destinationURL.pathname === currentURL.pathname &&
      destinationURL.search === currentURL.search &&
      Boolean(destinationURL.hash))
  ) {
    return null
  }

  return destinationURL
}

export function RouteTransitionScrollGuard() {
  const router = useRouter()
  const previousScrollBehaviorRef = useRef<string | null>(null)
  const restoreTimerRef = useRef<number | null>(null)
  const committedRouteRef = useRef<string | null>(null)

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
    restoreScrollBehavior()
  }, [restoreScrollBehavior])

  const positionDestination = useCallback(
    (hash: string) => {
      const root = document.documentElement
      if (previousScrollBehaviorRef.current === null) {
        previousScrollBehaviorRef.current = root.style.scrollBehavior
      }
      root.style.scrollBehavior = 'auto'
      root.getClientRects()

      const hashID = hash.slice(1)
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
    },
    [restoreScrollBehavior],
  )

  const positionCommittedDestination = useCallback(() => {
    const route = `${window.location.pathname}${window.location.search}`
    if (committedRouteRef.current === route) return
    committedRouteRef.current = route
    // Read the final URL, including any redirect, rather than the clicked URL.
    positionDestination(window.location.hash)
  }, [positionDestination])

  useEffect(() => {
    committedRouteRef.current = `${window.location.pathname}${window.location.search}`
    const previousScrollRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    const handleClick = (event: MouseEvent) => {
      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest<HTMLAnchorElement>('a[href]')
      const destinationURL = anchor ? getNavigationDestination(event, anchor) : null

      if (!destinationURL) {
        return
      }

      event.preventDefault()

      // A link back to the current page without a fragment still means its top.
      // It may not cause a React route commit, so position it immediately.
      if (
        destinationURL.pathname === window.location.pathname &&
        destinationURL.search === window.location.search
      ) {
        positionDestination('')
        router.push(`${destinationURL.pathname}${destinationURL.search}`, { scroll: false })
        return
      }

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
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [cancelPendingNavigation, positionCommittedDestination, positionDestination, router])

  return null
}

export function RouteTransitionCommitSignal() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useLayoutEffect(() => {
    window.dispatchEvent(new Event(ROUTE_COMMIT_EVENT))
  }, [pathname, search])

  return null
}
