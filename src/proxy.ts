import { type NextRequest, NextResponse } from 'next/server'

import type { RedirectEntry, RedirectsResponse } from './app/api/public-redirects/route'

// In-process cache: keyed by base URL so a multi-origin deployment is safe.
const cacheByOrigin = new Map<string, { map: Map<string, RedirectEntry>; at: number }>()
const TTL_MS = 60_000

async function loadRedirects(baseUrl: string): Promise<Map<string, RedirectEntry>> {
  const now = Date.now()
  const cached = cacheByOrigin.get(baseUrl)
  if (cached && now - cached.at < TTL_MS) return cached.map

  try {
    const res = await fetch(`${baseUrl}/api/public-redirects`, {
      // Bypass Next.js fetch cache so the proxy always sees fresh data
      // (the API route itself is cached with unstable_cache + tag revalidation).
      cache: 'no-store',
    })
    if (!res.ok) throw new Error(`/api/public-redirects returned ${res.status}`)
    const data = (await res.json()) as RedirectsResponse
    const map = new Map<string, RedirectEntry>(data.redirects.map((r) => [r.from, r]))
    cacheByOrigin.set(baseUrl, { map, at: now })
    return map
  } catch {
    // On failure, keep whatever was cached (empty map on first failure is fine —
    // the page will simply 404 or render normally; no redirect is a safe default).
    return cached?.map ?? new Map()
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Preserve bookmarked Admin preview URLs without making public pages read
  // request-specific query parameters (which would disable static rendering).
  if (
    request.nextUrl.searchParams.get('preview') === 'true' &&
    /^\/(articles|news-events)\/[^/]+\/?$/.test(pathname)
  ) {
    const destination = request.nextUrl.clone()
    destination.pathname = `/preview${pathname}`
    destination.searchParams.delete('preview')
    return NextResponse.redirect(destination)
  }
  const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`

  const redirects = await loadRedirects(baseUrl)
  const entry = redirects.get(pathname)

  if (entry) {
    const destination = entry.to.startsWith('http') ? entry.to : `${baseUrl}${entry.to}`
    return NextResponse.redirect(destination, {
      status: entry.permanent ? 301 : 302,
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Run on all paths except:
     *   - /_next/* (Next.js internals)
     *   - /api/*  (Payload and public API routes)
     *   - /admin/* (Payload admin panel)
     *   - Common static asset paths
     */
    '/((?!_next|api|admin|favicon\\.ico|robots\\.txt|sitemap\\.xml|.*\\.xml$|.*\\.json$).*)',
  ],
}
