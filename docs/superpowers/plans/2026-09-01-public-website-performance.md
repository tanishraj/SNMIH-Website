# Public Website Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make anonymous CMS pages cacheable and reduce LCP work by deferring editor authentication and analytics, serving media through the R2 public origin, preloading the first renderable Hero Banner, self-hosting fonts, and correctly sizing site logos.

**Architecture:** Keep the public React Server Component shell dependent only on tagged CMS data. Move cookie-sensitive analytics and editor-session behavior into small post-hydration client controllers, keep the session endpoint private and uncached, and make public system-mode resolution independent of authentication. Preserve the current Payload S3 adapter and Page rendering model while tightening image, font, and cache hints at their existing ownership boundaries.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, Payload CMS 3.85.2, TypeScript, Tailwind CSS 4, Vitest 4, Testing Library, Cloudflare R2.

## Global Constraints

- Do not commit any specification, plan, source, generated, test, or documentation change.
- Do not add dependencies.
- Ordinary public CMS Page HTML must not read request cookies or authenticate a Payload user.
- The frontend-session endpoint must return only email and role, use private no-store caching, and fail closed to `user: null`.
- Maintenance and coming-soon modes must apply to ordinary public CMS Page URLs regardless of CMS authentication; editors inspect Page content through `/preview/page/[id]`.
- Do not delete or rewrite historical `bypassForLoggedInAdmins` values in MongoDB.
- Keep `MEDIA_PROVIDER=s3`; the production public origin is exactly `https://assets.snmih.tanish.im`.
- Set Next.js image `minimumCacheTTL` to exactly `86400` seconds.
- Only the first renderable Hero Banner in document order, including populated Reusable Sections, may receive `preload`.
- Keep Inter and Playfair Display normal and italic styles; keep IBM Plex Mono weights 400 and 600; use the Latin subset.
- Preserve existing visual design, semantic font aliases, themes, accessibility behavior, and content.
- Do not change production environment variables or redeploy without separate user approval.

---

### Task 1: Remove request-authenticated system-mode bypass

**Files:**
- Modify: `src/globals/SystemModeSettings.ts`
- Modify: `src/app/(frontend)/pageData.ts`
- Modify: `src/lib/cmsSession.ts`
- Modify: `tests/int/page-settings-system-mode.int.spec.ts`
- Modify: `tests/int/page-routing.int.spec.ts`
- Regenerate: `src/payload-types.ts`

**Interfaces:**
- Consumes: existing tagged `getSystemModeSettings()` and authenticated `/preview/page/[id]` route.
- Produces: request-independent `getSystemPageRenderState()` and `getHomepageRenderState()` behavior; `getCurrentCMSUser()` remains available for the private session endpoint in Task 2.

- [ ] **Step 1: Replace the schema and route tests with the new public-mode contract**

In `tests/int/page-settings-system-mode.int.spec.ts`, replace the bypass-field assertion with an absence assertion and replace the authenticated-user case with a no-authentication case:

```ts
it('keeps site mode controls in System Mode Settings without an authenticated bypass', () => {
  const siteModeField = getNamedField(SystemModeSettings.fields, 'siteMode')
  const bypassField = SystemModeSettings.fields.find(
    (field) =>
      typeof field === 'object' &&
      field !== null &&
      'name' in field &&
      field.name === 'bypassForLoggedInAdmins',
  )

  expect(siteModeField.defaultValue).toBe('off')
  expect(siteModeField.options?.map(({ value }) => value)).toEqual([
    'off',
    'maintenance',
    'comingSoon',
  ])
  expect(bypassField).toBeUndefined()
})

it('keeps maintenance mode active without authenticating the public request', async () => {
  payloadMocks.findGlobal.mockImplementation(async ({ slug }) => {
    if (slug === 'page-settings') return { homepage: null }

    return {
      comingSoonPage: null,
      maintenancePage: null,
      notFoundPage: null,
      siteMode: 'maintenance',
    }
  })

  const { getSystemPageRenderState } = await loadPageData()

  await expect(getSystemPageRenderState('/')).resolves.toEqual({
    mode: 'maintenance',
    page: null,
  })
  expect(payloadMocks.auth).not.toHaveBeenCalled()
})
```

In `tests/int/page-routing.int.spec.ts`, change the former admin-bypass fallback test to prove active mode wins without session authentication:

```ts
it('returns the active maintenance mode without authenticating the request', async () => {
  payloadMocks.findGlobal.mockImplementation(async ({ slug }) => {
    if (slug === 'page-settings') return { homepage: 42 }
    if (slug === 'system-mode-settings') {
      return {
        comingSoonPage: null,
        maintenancePage: null,
        notFoundPage: null,
        siteMode: 'maintenance',
      }
    }

    return {
      defaultDescription: 'Global fallback description',
      defaultImage: null,
      defaultTitle: 'Global fallback title',
      robots: 'index,follow',
    }
  })

  const { getHomepageMetadata, getHomepageRenderState } = await loadPageData()

  await expect(getHomepageRenderState()).resolves.toEqual({
    mode: 'maintenance',
    page: null,
  })
  await expect(getHomepageMetadata()).resolves.toMatchObject({ title: 'Maintenance' })
  expect(payloadMocks.auth).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run the focused tests and verify the old behavior fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-settings-system-mode.int.spec.ts tests/int/page-routing.int.spec.ts
```

Expected: failures show that `bypassForLoggedInAdmins` still exists and public resolution still reaches the authentication helper.

- [ ] **Step 3: Remove the active Payload field and authentication branch**

Delete the `bypassForLoggedInAdmins` checkbox object from `SystemModeSettings.fields`.

In `src/app/(frontend)/pageData.ts`, remove the `isCurrentCMSAdmin` import and `canCurrentRequestBypassSystemModes()`. Return only the page relationships and selected mode from `getSystemBehaviorPages()`:

```ts
return {
  comingSoonPage,
  maintenancePage,
  notFoundPage,
  siteMode: systemModeSettings.siteMode ?? 'off',
}
```

Replace `getResolvedSystemPageRenderState` and `getHomepageRenderState` with request-independent forms:

```ts
const getResolvedSystemPageRenderState = async (): Promise<{
  mode: 'comingSoon' | 'maintenance' | null
  page: SystemPage | null
}> => {
  const systemBehavior = await getSystemBehaviorPages()

  if (systemBehavior.siteMode === 'maintenance') {
    return { mode: 'maintenance', page: systemBehavior.maintenancePage }
  }

  if (systemBehavior.siteMode === 'comingSoon') {
    return { mode: 'comingSoon', page: systemBehavior.comingSoonPage }
  }

  return { mode: null, page: null }
}

export async function getHomepageRenderState(): Promise<{
  mode: 'comingSoon' | 'maintenance' | null
  page: SystemPage | null
}> {
  return getResolvedSystemPageRenderState()
}
```

In `src/lib/cmsSession.ts`, remove the `isAdminUser` import and delete `isCurrentCMSAdmin`. Keep `getCurrentCMSUser` for Task 2; the client-safe role label formatter moves out of this server module in Task 2.

- [ ] **Step 4: Regenerate Payload types and prove the active schema no longer exposes the field**

Run:

```bash
pnpm generate:types
rg -n "bypassForLoggedInAdmins" src/payload-types.ts
```

Expected: type generation succeeds; `rg` returns no matches and exits with status 1. Do not create a migration because historical MongoDB values must remain untouched.

- [ ] **Step 5: Run the focused tests and inspect the uncommitted diff**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-settings-system-mode.int.spec.ts tests/int/page-routing.int.spec.ts tests/int/preview-access.int.spec.ts
git diff --check
```

Expected: all three suites pass and the diff check is clean. Leave the changes uncommitted.

---

### Task 2: Defer the CMS session toolbar behind a private endpoint

**Files:**
- Create: `src/lib/frontendSession.ts`
- Create: `src/app/api/frontend-session/route.ts`
- Create: `src/components/admin/DeferredAdminSessionBar.tsx`
- Modify: `src/components/admin/AdminSessionBar.tsx`
- Modify: `src/lib/cmsSession.ts`
- Modify: `src/app/(frontend)/layout.tsx`
- Create: `tests/int/frontend-session.int.spec.tsx`
- Create: `tests/int/frontend-layout-cache.int.spec.ts`
- Modify: `tests/int/global-header.int.spec.ts`

**Interfaces:**
- Consumes: `getCurrentCMSUser(): Promise<User | null>` from `src/lib/cmsSession.ts`.
- Produces: `FrontendSessionResponse`, `isFrontendSessionResponse()`, `GET /api/frontend-session`, and `<DeferredAdminSessionBar />`.

- [ ] **Step 1: Add failing endpoint, controller, and public-layout contract tests**

Create `tests/int/frontend-layout-cache.int.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const layoutSource = readFileSync('src/app/(frontend)/layout.tsx', 'utf8')
const pageDataSource = readFileSync('src/app/(frontend)/pageData.ts', 'utf8')

describe('cacheable public frontend shell', () => {
  it('does not opt the root layout into request-time cookies or CMS authentication', () => {
    expect(layoutSource).not.toContain("from 'next/headers'")
    expect(layoutSource).not.toContain("export const dynamic = 'force-dynamic'")
    expect(layoutSource).not.toContain('getCurrentCMSUser')
    expect(layoutSource).toContain('<DeferredAdminSessionBar />')
  })

  it('uses one client-controlled toolbar offset throughout the shell', () => {
    expect(layoutSource).toContain("const cmsToolbarOffset = 'var(--cms-toolbar-offset, 0px)'")
    expect(layoutSource).toContain("'--cms-toolbar-offset': '0px'")
    expect(layoutSource).toContain('paddingTop: cmsToolbarOffset')
    expect(layoutSource).toContain('stickyTopOffset={cmsToolbarOffset}')
  })

  it('does not authenticate public system-mode resolution', () => {
    expect(pageDataSource).not.toContain('isCurrentCMSAdmin')
    expect(pageDataSource).not.toContain('canCurrentRequestBypassSystemModes')
  })
})
```

Create `tests/int/frontend-session.int.spec.tsx`:

```tsx
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getCurrentCMSUser: vi.fn(),
}))

vi.mock('@/lib/cmsSession', () => ({
  getCurrentCMSUser: mocks.getCurrentCMSUser,
}))

import { GET } from '@/app/api/frontend-session/route'
import { DeferredAdminSessionBar } from '@/components/admin/DeferredAdminSessionBar'

const privateCacheControl = 'private, no-store, max-age=0'

describe('frontend session endpoint', () => {
  beforeEach(() => {
    mocks.getCurrentCMSUser.mockReset()
  })

  it('returns only the toolbar fields for an authenticated user', async () => {
    mocks.getCurrentCMSUser.mockResolvedValue({
      email: 'operator@example.com',
      id: 'user-1',
      role: 'siteManager',
    })

    const response = await GET()

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe(privateCacheControl)
    expect(await response.json()).toEqual({
      user: { email: 'operator@example.com', role: 'siteManager' },
    })
  })

  it('returns a private null session for anonymous and failed authentication', async () => {
    mocks.getCurrentCMSUser.mockResolvedValueOnce(null)
    const anonymous = await GET()

    expect(anonymous.headers.get('cache-control')).toBe(privateCacheControl)
    expect(await anonymous.json()).toEqual({ user: null })

    mocks.getCurrentCMSUser.mockRejectedValueOnce(new Error('expired session'))
    const failed = await GET()

    expect(failed.headers.get('cache-control')).toBe(privateCacheControl)
    expect(await failed.json()).toEqual({ user: null })
  })
})

describe('deferred admin session bar', () => {
  beforeEach(() => {
    document.documentElement.style.removeProperty('--cms-toolbar-offset')
  })

  afterEach(() => {
    cleanup()
    document.documentElement.style.removeProperty('--cms-toolbar-offset')
    vi.unstubAllGlobals()
  })

  it('mounts authenticated UI and publishes the toolbar offset after hydration', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: async () => ({
          user: { email: 'operator@example.com', role: 'siteManager' },
        }),
        ok: true,
      }),
    )

    const view = render(<DeferredAdminSessionBar />)

    await screen.findByText('Open Admin')
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('3rem')

    view.unmount()
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('')
  })

  it.each([
    ['anonymous', { json: async () => ({ user: null }), ok: true }],
    ['invalid payload', { json: async () => ({ user: { email: 42 } }), ok: true }],
    ['non-OK response', { json: async () => ({ user: null }), ok: false }],
  ])('fails closed for an %s response', async (_label, response) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))

    render(<DeferredAdminSessionBar />)

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Open Admin')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('')
  })

  it('fails closed when the session request rejects', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network unavailable')))

    render(<DeferredAdminSessionBar />)

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1))
    expect(screen.queryByText('Open Admin')).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--cms-toolbar-offset')).toBe('')
  })
})
```

- [ ] **Step 2: Run the new tests and verify the files and contracts are missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend-layout-cache.int.spec.ts tests/int/frontend-session.int.spec.tsx
```

Expected: the suite fails because the endpoint, controller, and static layout boundary do not exist yet.

- [ ] **Step 3: Create the shared response validator and private endpoint**

Create `src/lib/frontendSession.ts`:

```ts
export type FrontendSessionUser = {
  email: string
  role: string | null
}

export type FrontendSessionResponse = {
  user: FrontendSessionUser | null
}

export const isFrontendSessionResponse = (value: unknown): value is FrontendSessionResponse => {
  if (!value || typeof value !== 'object' || !('user' in value)) return false
  const user = value.user
  if (user === null) return true
  if (!user || typeof user !== 'object') return false

  return (
    'email' in user &&
    typeof user.email === 'string' &&
    'role' in user &&
    (typeof user.role === 'string' || user.role === null)
  )
}

export const formatCMSRoleLabel = (role?: string | null): string => {
  switch (role) {
    case 'admin':
      return 'Admin'
    case 'siteManager':
      return 'Site Manager'
    case 'contentManager':
      return 'Content Manager'
    default:
      return 'CMS User'
  }
}
```

Create `src/app/api/frontend-session/route.ts`:

```ts
import { NextResponse } from 'next/server'

import { getCurrentCMSUser } from '@/lib/cmsSession'
import type { FrontendSessionResponse } from '@/lib/frontendSession'

export const dynamic = 'force-dynamic'

const responseInit = {
  headers: { 'Cache-Control': 'private, no-store, max-age=0' },
}

export async function GET() {
  try {
    const user = await getCurrentCMSUser()
    const body: FrontendSessionResponse = {
      user: user
        ? {
            email: user.email,
            role: user.role ?? null,
          }
        : null,
    }

    return NextResponse.json(body, responseInit)
  } catch {
    return NextResponse.json<FrontendSessionResponse>({ user: null }, responseInit)
  }
}
```

- [ ] **Step 4: Create the deferred toolbar controller**

Create `src/components/admin/DeferredAdminSessionBar.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'

import { AdminSessionBar } from '@/components/admin/AdminSessionBar'
import {
  isFrontendSessionResponse,
  type FrontendSessionUser,
} from '@/lib/frontendSession'

const TOOLBAR_OFFSET_PROPERTY = '--cms-toolbar-offset'

export function DeferredAdminSessionBar() {
  const [user, setUser] = useState<FrontendSessionUser | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    void fetch('/api/frontend-session', {
      cache: 'no-store',
      credentials: 'include',
      signal: controller.signal,
    })
      .then(async (response) => (response.ok ? response.json() : null))
      .then((value: unknown) => {
        if (!controller.signal.aborted && isFrontendSessionResponse(value)) {
          setUser(value.user)
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (!user) {
      root.style.removeProperty(TOOLBAR_OFFSET_PROPERTY)
      return
    }

    root.style.setProperty(TOOLBAR_OFFSET_PROPERTY, '3rem')
    return () => root.style.removeProperty(TOOLBAR_OFFSET_PROPERTY)
  }, [user])

  return <AdminSessionBar user={user} />
}
```

Change `AdminSessionBar` to import `FrontendSessionUser` and `formatCMSRoleLabel` from the client-safe `src/lib/frontendSession.ts`, and accept `FrontendSessionUser | null` rather than the full generated `User` type. Delete `formatCMSRoleLabel` from `src/lib/cmsSession.ts` so the client component never imports `@payload-config`, `payload`, or `next/headers` through a server-only dependency.

- [ ] **Step 5: Make the public layout session-independent**

In `src/app/(frontend)/layout.tsx`:

- remove `cookies`, `getCurrentCMSUser`, `AdminSessionBar`, and `dynamic = 'force-dynamic'`;
- import `DeferredAdminSessionBar`;
- call only `getFrontendGlobals()` in `RootLayout`;
- use the CSS variable for all toolbar-sensitive geometry:

```ts
const cmsToolbarOffset = 'var(--cms-toolbar-offset, 0px)'
const headerTopOffset = `calc(${cmsToolbarOffset} + var(--global-announcement-height, ${
  headerReservesAnnouncement ? '2.5rem' : '0px'
}))`
const contentShellStyle = { paddingTop: cmsToolbarOffset } as React.CSSProperties
const htmlStyle = {
  ...(colorScheme === 'system'
    ? { colorScheme: 'light dark' }
    : { colorScheme }),
  '--cms-toolbar-offset': '0px',
} as React.CSSProperties
```

Render `<DeferredAdminSessionBar />` in the existing toolbar position and keep `stickyTopOffset={cmsToolbarOffset}` on `GlobalAnnouncement`.

Update `tests/int/global-header.int.spec.ts` so its source-order assertion looks for `<DeferredAdminSessionBar` instead of `<AdminSessionBar`.

- [ ] **Step 6: Run the session and shell tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/frontend-session.int.spec.tsx tests/int/frontend-layout-cache.int.spec.ts tests/int/admin-session-bar.int.spec.ts tests/int/global-header.int.spec.ts
git diff --check
```

Expected: all suites pass, anonymous and failed requests produce no toolbar, authenticated requests apply `3rem`, and the public layout contains no request cookie/auth boundary. Leave changes uncommitted.

---

### Task 3: Move analytics consent entirely behind hydration

**Files:**
- Create: `src/lib/analyticsConsent.ts`
- Create: `src/components/analytics/ConsentAwareAnalytics.tsx`
- Modify: `src/components/global/CookieConsentBanner.tsx`
- Modify: `src/app/(frontend)/layout.tsx`
- Create: `tests/int/analytics-consent.int.spec.tsx`
- Modify: `tests/int/cookie-consent-modal.int.spec.tsx`
- Modify: `tests/int/speed-insights.int.spec.ts`

**Interfaces:**
- Produces: `ANALYTICS_CONSENT_CHANGE_EVENT`, `readAnalyticsConsent()`, `writeAnalyticsConsent()`, and `<ConsentAwareAnalytics />`.
- Consumes: cached analytics settings passed from the server layout as primitive props.

- [ ] **Step 1: Write failing functional consent tests**

Create `tests/int/analytics-consent.int.spec.tsx`:

```tsx
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@next/third-parties/google', () => ({
  GoogleTagManager: ({ gtmId }: { gtmId: string }) => (
    <div data-testid="gtm" data-id={gtmId} />
  ),
}))

vi.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="speed-insights" />,
}))

vi.mock('next/script', () => ({
  default: ({ id, src }: { id: string; src?: string }) => (
    <script data-script-id={id} src={src} />
  ),
}))

import { ConsentAwareAnalytics } from '@/components/analytics/ConsentAwareAnalytics'
import { CookieConsentBanner } from '@/components/global/CookieConsentBanner'

describe('consent-aware analytics', () => {
  beforeEach(() => {
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
  })

  afterEach(() => {
    cleanup()
    document.cookie = 'analytics_consent=; Max-Age=0; Path=/'
  })

it('loads nothing before consent', async () => {
  render(<ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />)
  expect(screen.queryByTestId('gtm')).toBeNull()
  expect(screen.queryByTestId('speed-insights')).toBeNull()
})

it('hydrates analytics from an existing granted cookie', async () => {
  document.cookie = 'analytics_consent=granted; Path=/'
  render(<ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />)

  expect(await screen.findByTestId('gtm')).toBeTruthy()
  expect(screen.getByTestId('speed-insights')).toBeTruthy()
})

it('mounts GTM and Speed Insights immediately after acceptance', async () => {
  render(
    <>
      <ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />
      <CookieConsentBanner enabled variant="bottom-bar" />
    </>,
  )

  fireEvent.click(await screen.findByRole('button', { name: 'Accept all' }))
  expect((await screen.findByTestId('gtm')).getAttribute('data-id')).toBe('GTM-TEST')
  expect(screen.getByTestId('speed-insights')).toBeTruthy()
})

it('keeps analytics absent after rejection', async () => {
  render(
    <>
      <ConsentAwareAnalytics gtmEnabled gtmContainerId="GTM-TEST" />
      <CookieConsentBanner enabled variant="bottom-bar" />
    </>,
  )

  fireEvent.click(await screen.findByRole('button', { name: 'Reject non-essential' }))
  await waitFor(() => expect(document.cookie).toContain('analytics_consent=denied'))
  expect(screen.queryByTestId('gtm')).toBeNull()
  expect(screen.queryByTestId('speed-insights')).toBeNull()
})

it('gives GTM precedence over standalone GA4', async () => {
  document.cookie = 'analytics_consent=granted; Path=/'
  render(
    <ConsentAwareAnalytics
      ga4Enabled
      ga4MeasurementId="G-TEST"
      gtmEnabled
      gtmContainerId="GTM-TEST"
    />,
  )

  expect(await screen.findByTestId('gtm')).toBeTruthy()
  expect(document.querySelector('[data-script-id="ga4-library"]')).toBeNull()
})

it('loads standalone GA4 only when GTM is unavailable', async () => {
  document.cookie = 'analytics_consent=granted; Path=/'
  render(<ConsentAwareAnalytics ga4Enabled ga4MeasurementId="G-TEST" />)

  await waitFor(() =>
    expect(document.querySelector('[data-script-id="ga4-library"]')).toBeTruthy(),
  )
  const library = document.querySelector('[data-script-id="ga4-library"]')
  expect(library?.getAttribute('src')).toContain('id=G-TEST')
  expect(document.querySelector('[data-script-id="ga4-config"]')).toBeTruthy()
  expect(screen.queryByTestId('gtm')).toBeNull()
})

it('loads only Speed Insights when analytics IDs are missing', async () => {
  document.cookie = 'analytics_consent=granted; Path=/'
  render(<ConsentAwareAnalytics ga4Enabled gtmEnabled />)

  expect(await screen.findByTestId('speed-insights')).toBeTruthy()
  expect(screen.queryByTestId('gtm')).toBeNull()
  expect(document.querySelector('[data-script-id="ga4-library"]')).toBeNull()
})
})
```

Update the existing cookie modal test to expect zero router refreshes after both acceptance and rejection, then remove its `next/navigation` mock once no test imports it.

- [ ] **Step 2: Run the analytics tests and verify the server-owned contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/analytics-consent.int.spec.tsx tests/int/cookie-consent-modal.int.spec.tsx tests/int/speed-insights.int.spec.ts
```

Expected: failures show that acceptance refreshes the route and analytics still depend on the server cookie branch.

- [ ] **Step 3: Create the shared consent event helper**

Create `src/lib/analyticsConsent.ts`:

```ts
export const ANALYTICS_CONSENT_COOKIE = 'analytics_consent'
export const ANALYTICS_CONSENT_CHANGE_EVENT = 'analytics-consent-change'

export type AnalyticsConsent = 'denied' | 'granted' | null

export function readAnalyticsConsent(): AnalyticsConsent {
  if (typeof document === 'undefined') return null
  const value = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ANALYTICS_CONSENT_COOKIE}=`))
    ?.slice(ANALYTICS_CONSENT_COOKIE.length + 1)

  return value === 'granted' || value === 'denied' ? value : null
}

export function writeAnalyticsConsent(granted: boolean) {
  const value: Exclude<AnalyticsConsent, null> = granted ? 'granted' : 'denied'
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${ANALYTICS_CONSENT_COOKIE}=${value}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
  window.dispatchEvent(
    new CustomEvent(ANALYTICS_CONSENT_CHANGE_EVENT, { detail: { value } }),
  )
}
```

- [ ] **Step 4: Create the client-only analytics controller**

Create `src/components/analytics/ConsentAwareAnalytics.tsx`:

```tsx
'use client'

import { GoogleTagManager } from '@next/third-parties/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import Script from 'next/script'
import { useEffect, useState } from 'react'

import {
  ANALYTICS_CONSENT_CHANGE_EVENT,
  readAnalyticsConsent,
} from '@/lib/analyticsConsent'

type ConsentAwareAnalyticsProps = {
  ga4Enabled?: boolean | null
  ga4MeasurementId?: string | null
  gtmEnabled?: boolean | null
  gtmContainerId?: string | null
}

export function ConsentAwareAnalytics({
  ga4Enabled,
  ga4MeasurementId,
  gtmEnabled,
  gtmContainerId,
}: ConsentAwareAnalyticsProps) {
  const [granted, setGranted] = useState(false)

  useEffect(() => {
    const syncConsent = () => setGranted(readAnalyticsConsent() === 'granted')
    syncConsent()
    window.addEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncConsent)
    return () => window.removeEventListener(ANALYTICS_CONSENT_CHANGE_EVENT, syncConsent)
  }, [])

  if (!granted) return null

  const gtmId = gtmContainerId?.trim()
  const ga4Id = ga4MeasurementId?.trim()
  const serializedGa4Id = JSON.stringify(ga4Id ?? '').replace(/</g, '\\u003c')

  return (
    <>
      {gtmEnabled && gtmId ? (
        <GoogleTagManager gtmId={gtmId} />
      ) : ga4Enabled && ga4Id ? (
        <>
          <Script
            id="ga4-library"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`}
            strategy="afterInteractive"
          />
          <Script
            id="ga4-config"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${serializedGa4Id});`,
            }}
          />
        </>
      ) : null}
      <SpeedInsights />
    </>
  )
}
```

- [ ] **Step 5: Connect the banner and layout without a route refresh**

In `CookieConsentBanner.tsx`, remove `useRouter` and the local cookie constant. Import `readAnalyticsConsent` and `writeAnalyticsConsent`; implement the existing helpers as:

```ts
function hasConsentDecision(): boolean {
  return readAnalyticsConsent() !== null
}

function setConsent(granted: boolean) {
  writeAnalyticsConsent(granted)
  setDismissed(true)
}
```

In the frontend layout, remove server-side Google, Speed Insights, cookie, and inline GA4 branches. Render exactly one controller after the consent banner:

```tsx
<ConsentAwareAnalytics
  ga4Enabled={analyticsSettings.ga4Enabled}
  ga4MeasurementId={analyticsSettings.ga4MeasurementId}
  gtmEnabled={analyticsSettings.gtmEnabled}
  gtmContainerId={analyticsSettings.gtmContainerId}
/>
```

Update `tests/int/speed-insights.int.spec.ts` to inspect `ConsentAwareAnalytics.tsx` and assert GTM precedence, event-gated mounting, and Speed Insights inside the granted branch rather than looking for the old layout cookie branch.

- [ ] **Step 6: Run analytics and existing consent interaction suites**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/analytics-consent.int.spec.tsx tests/int/cookie-consent-modal.int.spec.tsx tests/int/back-to-top-button.int.spec.tsx tests/int/speed-insights.int.spec.ts tests/int/frontend-layout-cache.int.spec.ts
git diff --check
```

Expected: analytics appears immediately after acceptance, never after rejection, GTM suppresses standalone GA4, and no route refresh is called. Leave changes uncommitted.

---

### Task 4: Increase image-cache reuse and document the R2 rollout gate

**Files:**
- Modify: `next.config.ts`
- Modify: `tests/int/media-public-url.int.spec.ts`
- Modify: `.env.example` only if its current R2 public-origin comment is no longer exact
- Modify: `docs/operations/runtime-and-providers.md`

**Interfaces:**
- Consumes: `getMediaRemotePattern(process.env.S3_PUBLIC_URL)` and the existing Payload `generateFileURL` behavior.
- Produces: `images.minimumCacheTTL = 86400` while retaining the exact remote host and Payload fallback pattern.

- [ ] **Step 1: Extend the Next image configuration test**

Add these assertions to the existing configured-origin test in `tests/int/media-public-url.int.spec.ts`:

```ts
expect(nextConfig.images?.minimumCacheTTL).toBe(86400)
expect(nextConfig.images?.remotePatterns).toContainEqual({
  hostname: 'assets.snmih.tanish.im',
  pathname: '/**',
  port: '',
  protocol: 'https',
})
expect(nextConfig.images?.localPatterns).toContainEqual({
  pathname: '/api/media/file/**',
})
```

- [ ] **Step 2: Run the test and verify the TTL assertion fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-public-url.int.spec.ts tests/int/provider-selection.int.spec.ts tests/int/runtime-config.int.spec.ts
```

Expected: only the new `minimumCacheTTL` assertion fails.

- [ ] **Step 3: Add the one-day minimum cache TTL**

Change the `images` object in `next.config.ts` to start with:

```ts
images: {
  minimumCacheTTL: 86400,
  localPatterns: [
    {
      pathname: '/api/media/file/**',
    },
  ],
  remotePatterns: mediaRemotePattern ? [mediaRemotePattern] : [],
},
```

Do not remove the local pattern; it is the deliberate fallback when `S3_PUBLIC_URL` is absent.

- [ ] **Step 4: Tighten the operator acceptance text**

In `docs/operations/runtime-and-providers.md`, add these exact requirements to the R2 verification section:

- production must contain `S3_PUBLIC_URL=https://assets.snmih.tanish.im` before deployment;
- a deployment is required after changing the variable because `next.config.ts` reads it at build time;
- Next image variants have a one-day minimum optimizer TTL;
- test a direct object URL containing encoded spaces, an optimized `/_next/image` URL, and a repeated request;
- reject rollout if rendered media still resolves to `/api/media/file/**`.

Keep `.env.example` unchanged when it already contains the exact public origin; avoid a cosmetic diff.

- [ ] **Step 5: Run storage/configuration contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/media-public-url.int.spec.ts tests/int/provider-selection.int.spec.ts tests/int/runtime-config.int.spec.ts tests/int/media-url.int.spec.ts
git diff --check
```

Expected: all suites pass. Do not mutate Vercel or redeploy during this task.

---

### Task 5: Preload only the first renderable Hero Banner

**Files:**
- Modify: `src/blocks/HeroBanner/Component.tsx`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderNewsEventDetailBlocks.tsx`
- Create: `tests/int/hero-banner-preload.int.spec.tsx`
- Modify: `tests/int/hero-banner-render.int.spec.ts`

**Interfaces:**
- Produces: optional `preload?: boolean` on `HeroBannerBlockComponent`, exported `resolveHeroBannerImage()`, and renderer-owned `heroPreloadState: { assigned: boolean }`.
- Consumes: existing recursive Reusable Section traversal and `getMediaImageProps({ preset: 'hero' })`.

- [ ] **Step 1: Write failing direct and recursive preload tests**

In `tests/int/hero-banner-render.int.spec.ts`, add a direct assertion:

```ts
it('emits a preload only when the renderer requests it', () => {
  const eager = renderToStaticMarkup(
    createElement(HeroBannerBlockComponent, {
      backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
      preload: true,
      title: 'Campus',
    }),
  )
  const lazy = renderToStaticMarkup(
    createElement(HeroBannerBlockComponent, {
      backgroundImage: { alt: 'Campus', url: '/media/campus.jpg' } as never,
      title: 'Campus',
    }),
  )

  expect(eager).toContain('<link rel="preload" as="image"')
  expect(lazy).not.toContain('<link rel="preload" as="image"')
})
```

Create `tests/int/hero-banner-preload.int.spec.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { renderPageBlocks } from '@/blocks/renderPageBlocks'

describe('Hero Banner preload selection', () => {
  it('preloads the first renderable Hero Banner across Reusable Sections', () => {
    const html = renderToStaticMarkup(
      renderPageBlocks([
        {
          blockType: 'heroBanner',
          backgroundImage: null,
          title: 'Missing hero',
        },
        {
          blockType: 'reusableSection',
          section: {
            id: 'nested-section',
            layout: [
              {
                blockType: 'heroBanner',
                backgroundImage: { alt: 'Nested campus', url: '/media/nested.jpg' },
                title: 'Nested valid hero',
              },
            ],
          },
        },
        {
          blockType: 'heroBanner',
          backgroundImage: { alt: 'Later campus', url: '/media/later.jpg' },
          title: 'Later hero',
        },
      ] as never),
    )

    expect(html.match(/<link rel="preload" as="image"/g)).toHaveLength(1)
    expect(html).toMatch(/<link rel="preload" as="image"[^>]+%2Fmedia%2Fnested\.jpg/)
    expect(html).toContain('Nested valid hero')
    expect(html).toContain('Later hero')
  })
})
```

The one preload must reference the nested valid hero, proving missing media does not consume the assignment and recursion preserves document order.

- [ ] **Step 2: Run the Hero tests and verify no preload exists**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-banner-render.int.spec.ts tests/int/hero-banner-preload.int.spec.tsx
```

Expected: the new preload assertions fail.

- [ ] **Step 3: Expose renderability and the Next 16 preload prop**

Export `HeroBannerBlockLike`, add `preload?: boolean`, and extract the image lookup:

```ts
export function resolveHeroBannerImage({
  backgroundImage,
  title,
}: Pick<HeroBannerBlockLike, 'backgroundImage' | 'title'>) {
  return getMediaImageProps({
    media: backgroundImage as never,
    preset: 'hero',
    fallbackAlt: title,
  })
}
```

Use `resolveHeroBannerImage()` inside the component and pass the new prop to Next Image:

```tsx
<Image
  fill
  alt={image.alt}
  className="object-cover"
  preload={preload}
  sizes="100vw"
  src={image.src}
/>
```

- [ ] **Step 4: Assign preload state once across recursive rendering**

Extend `PageBlockRenderArgs`:

```ts
export type PageBlockRenderArgs = {
  automaticBreadcrumbs: ResolvedPageBreadcrumb[]
  heroPreloadState: { assigned: boolean }
}
```

In the `heroBanner` case:

```tsx
case 'heroBanner': {
  const preload =
    !args.heroPreloadState.assigned && Boolean(resolveHeroBannerImage(block))
  if (preload) args.heroPreloadState.assigned = true
  return wrap(<HeroBannerBlockComponent {...block} preload={preload} />)
}
```

Initialize `heroPreloadState: { assigned: false }` once in both `renderPageBlocks()` and `renderNewsEventDetailBlocks()`. Pass the same `args` object into every Reusable Section recursion; do not reset it per nested array or block.

- [ ] **Step 5: Run block renderer coverage**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/hero-banner-render.int.spec.ts tests/int/hero-banner-preload.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx
git diff --check
```

Expected: exactly one valid production Hero Banner preloads; live preview and detail rendering remain valid. Leave changes uncommitted.

---

### Task 6: Self-host the three public font families with `next/font`

**Files:**
- Modify: `src/app/(frontend)/layout.tsx`
- Modify: `src/styles/globals.css`
- Create: `tests/int/font-delivery.int.spec.ts`

**Interfaces:**
- Produces: `--font-inter`, `--font-playfair-display`, and `--font-ibm-plex-mono` on the public `<html>` element.
- Consumes: existing semantic `--font-sans`, `--font-serif`, `--font-mono`, `--font-display`, and `--font-text` CSS aliases.

- [ ] **Step 1: Add a failing font-delivery source contract**

Create `tests/int/font-delivery.int.spec.ts`:

```ts
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const layoutSource = readFileSync('src/app/(frontend)/layout.tsx', 'utf8')
const globalStyles = readFileSync('src/styles/globals.css', 'utf8')

describe('public font delivery', () => {
  it('uses next/font variables for every semantic family', () => {
    expect(layoutSource).toContain("from 'next/font/google'")
    expect(layoutSource).toContain("variable: '--font-inter'")
    expect(layoutSource).toContain("variable: '--font-playfair-display'")
    expect(layoutSource).toContain("variable: '--font-ibm-plex-mono'")
    expect(globalStyles).toContain('var(--font-inter)')
    expect(globalStyles).toContain('var(--font-playfair-display)')
    expect(globalStyles).toContain('var(--font-ibm-plex-mono)')
  })

  it('contains no runtime Google Fonts stylesheet imports', () => {
    expect(globalStyles).not.toContain('fonts.googleapis.com')
    expect(globalStyles).not.toContain('fonts.gstatic.com')
  })
})
```

- [ ] **Step 2: Run the contract and verify the Google imports are detected**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/font-delivery.int.spec.ts
```

Expected: both tests fail against the current CSS imports and missing layout variables.

- [ ] **Step 3: Configure the exact font subsets, weights, and styles**

At module scope in the frontend layout:

```ts
import { IBM_Plex_Mono, Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({
  display: 'swap',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-inter',
})

const playfairDisplay = Playfair_Display({
  display: 'swap',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-playfair-display',
})

const ibmPlexMono = IBM_Plex_Mono({
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-ibm-plex-mono',
})
```

Build the `<html>` class string from all three `.variable` values plus the optional dark class:

```ts
const htmlClassName = [
  inter.variable,
  playfairDisplay.variable,
  ibmPlexMono.variable,
  colorScheme === 'dark' ? 'dark' : null,
]
  .filter(Boolean)
  .join(' ')
```

- [ ] **Step 4: Remove remote imports and reconnect semantic aliases**

Delete the three Google Fonts `@import` declarations from `globals.css`. Replace the font declarations in `:root` with:

```css
--font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--font-ibm-plex-mono), ui-monospace, monospace;
--font-serif: var(--font-playfair-display), ui-serif, Georgia, serif;
--font-display: var(--font-playfair-display), ui-serif, Georgia, serif;
--font-text: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
```

Keep `--font-handwriting` unchanged because Caveat is not currently imported by this layout.

- [ ] **Step 5: Run font, theme, and layout contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/font-delivery.int.spec.ts tests/int/theme-contracts.int.spec.ts tests/int/theme-settings.int.spec.ts tests/int/frontend-layout-cache.int.spec.ts
git diff --check
```

Expected: font source contracts and theme contracts pass with no Google runtime domains. Leave changes uncommitted.

---

### Task 7: Give site logos truthful intrinsic and responsive sizes

**Files:**
- Modify: `src/components/site/SiteLogo.tsx`
- Modify: `tests/int/header-navbar-render.int.spec.ts`

**Interfaces:**
- Produces: positive intrinsic width/height, a pixel `sizes` hint based on displayed height and aspect ratio, a square fallback, and single-image rendering for identical light/dark URLs.
- Consumes: `Media.width`, `Media.height`, the configured display `height`, and existing light/dark media selection.

- [ ] **Step 1: Add failing logo sizing and deduplication tests**

Extend the header logo test group:

```ts
it('uses intrinsic dimensions and a rendered pixel width hint', () => {
  const html = renderToStaticMarkup(
    createElement(SiteLogo, {
      fallbackText: 'Acme Studio',
      height: 40,
      mode: 'siteDefault',
      siteLogo: { alt: 'Acme', height: 200, url: '/logo.png', width: 400 },
    }),
  )

  expect(html).toContain('width="400"')
  expect(html).toContain('height="200"')
  expect(html).toContain('sizes="80px"')
  expect(html).not.toContain('sizes="100vw"')
})

it('uses a bounded square fallback and deduplicates identical theme URLs', () => {
  const html = renderToStaticMarkup(
    createElement(SiteLogo, {
      customDark: { alt: 'Acme', url: '/same-logo.svg' },
      customLight: { alt: 'Acme', url: '/same-logo.svg' },
      fallbackText: 'Acme Studio',
      height: 40,
      mode: 'customLogo',
    }),
  )

  expect(html.match(/<img/g)).toHaveLength(1)
  expect(html).toContain('width="40"')
  expect(html).toContain('height="40"')
  expect(html).toContain('sizes="40px"')
})
```

- [ ] **Step 2: Run the header test and verify zero dimensions and duplicate output fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts
```

Expected: the new tests fail because current logos use zero dimensions, `100vw`, and two images.

- [ ] **Step 3: Resolve positive intrinsic and rendered dimensions**

Extend the lightweight media object with `width` and `height`. Make `getLogoImageProps` accept the requested display height and return:

```ts
const sourceWidth = typeof media.width === 'number' && media.width > 0 ? media.width : null
const sourceHeight = typeof media.height === 'number' && media.height > 0 ? media.height : null
const fallbackSize = Math.max(1, Math.round(displayHeight))
const width = sourceWidth ?? fallbackSize
const height = sourceHeight ?? fallbackSize
const renderedWidth =
  sourceWidth && sourceHeight
    ? Math.max(1, Math.round(displayHeight * (sourceWidth / sourceHeight)))
    : fallbackSize

return {
  alt,
  height,
  sizes: `${renderedWidth}px`,
  src,
  width,
}
```

Pass these values to every Next Image and retain `style={{ height }}` for the configured display height.

- [ ] **Step 4: Render one image when both resolved sources are identical**

Before the two-variant return, add a single-image branch:

```tsx
if (!darkImage || darkImage.src === lightImage.src) {
  return (
    <Image
      alt={lightImage.alt}
      className="block h-auto w-auto object-contain"
      src={lightImage.src}
      width={lightImage.width}
      height={lightImage.height}
      sizes={lightImage.sizes}
      style={{ height }}
    />
  )
}
```

The two-image branch must use each image's own dimensions and pixel `sizes` value while preserving `dark:hidden` and `dark:block` classes.

- [ ] **Step 5: Run logo and header/footer rendering coverage**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/header-navbar-render.int.spec.ts tests/int/global-header.int.spec.ts tests/int/global-footer.int.spec.ts tests/int/footer-minimal.int.spec.tsx tests/int/footer56-presentation.int.spec.tsx
git diff --check
```

Expected: logo sizing, deduplication, header, and footer suites pass. Leave changes uncommitted.

---

### Task 8: Update maintained contracts and run the release gate

**Files:**
- Modify: `docs/guides/analytics.md`
- Modify: `docs/guides/cookie-consent.md`
- Modify: `docs/guides/system-modes.md`
- Modify: `docs/operations/runtime-and-providers.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify if behavior changed: `.agents/skills/project-context/references/architecture.md`
- Modify if schema changed: `.agents/skills/project-context/references/payload-model.md`
- Modify if renderer behavior changed: `.agents/skills/project-context/references/block-system.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the completed source diff from Tasks 1–7 and the project-context change-impact map.
- Produces: current operator documentation, regenerated repository inventory, passing type/lint/build/tests, and an uncommitted handoff.

- [ ] **Step 1: Run the project-context inventory update**

Run:

```bash
pnpm project-context:update
git status --short
```

Expected: the inventory reflects removed/generated symbols and new files. Keep only generated changes that match the final source tree.

- [ ] **Step 2: Update narrative documentation with exact behavior**

Make these contract changes:

- `docs/guides/system-modes.md`: ordinary CMS Page routes always respect the active mode; the bypass checkbox no longer exists; editors inspect normal/draft Page content through `/preview/page/[id]`; dedicated non-Page routes retain their documented scope.
- `docs/guides/analytics.md`: the cached layout passes settings to a client controller; no analytics code loads before consent; acceptance mounts GTM or standalone GA4 plus Speed Insights immediately without navigation; GTM retains precedence.
- `docs/guides/cookie-consent.md`: accepting writes the cookie and dispatches a same-page consent event; remove the router-refresh statement; rejection remains non-analytic.
- `docs/operations/runtime-and-providers.md`: retain the Task 4 R2 build-time environment and one-day Next image TTL acceptance gate.
- `docs/architecture/feature-inventory.md`: record the cacheable public shell, deferred private editor session lookup, client consent boundary, direct R2 origin, first-renderable Hero preload, self-hosted fonts, and truthful logo sizing.
- `.agents/skills/project-context/references/architecture.md`: describe the shared public shell versus the private `/api/frontend-session` endpoint and client analytics boundary.
- `.agents/skills/project-context/references/payload-model.md`: remove the authenticated system-mode bypass from the active global contract and note that historical stored values are ignored.
- `.agents/skills/project-context/references/block-system.md`: state that production rendering preloads only the first renderable Hero Banner across Reusable Section recursion; live preview remains non-preloaded.

- [ ] **Step 3: Run focused integration coverage together**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/frontend-layout-cache.int.spec.ts \
  tests/int/frontend-session.int.spec.tsx \
  tests/int/page-settings-system-mode.int.spec.ts \
  tests/int/page-routing.int.spec.ts \
  tests/int/analytics-consent.int.spec.tsx \
  tests/int/cookie-consent-modal.int.spec.tsx \
  tests/int/speed-insights.int.spec.ts \
  tests/int/media-public-url.int.spec.ts \
  tests/int/hero-banner-render.int.spec.ts \
  tests/int/hero-banner-preload.int.spec.tsx \
  tests/int/font-delivery.int.spec.ts \
  tests/int/header-navbar-render.int.spec.ts
```

Expected: all focused performance and regression contracts pass.

- [ ] **Step 4: Run generated-type, TypeScript, lint, and project-context gates**

Run:

```bash
shasum -a 256 src/payload-types.ts
pnpm generate:types
shasum -a 256 src/payload-types.ts
pnpm exec tsc --noEmit
pnpm lint
pnpm project-context:check
```

Expected: the two generated-type hashes are identical, TypeScript and ESLint pass, and project context is current. If the hashes differ, inspect and retain the correct generated output, then repeat the hash/generation/hash sequence until it is stable.

- [ ] **Step 5: Run the complete integration suite and production build**

Run:

```bash
pnpm test:int
pnpm build
```

Expected: the complete Vitest suite passes and the Next.js production build completes with self-hosted font assets and no dynamic-API warning for the public root layout.

- [ ] **Step 6: Inspect the final change impact and preserve the no-commit requirement**

Run:

```bash
git diff --check
git status --short
git diff --stat
git diff -- .agents/skills/project-context/references/change-impact-map.md
```

Expected: no whitespace errors, all intended source/test/docs/generated files remain visible as uncommitted changes, and the change-impact map itself remains unchanged unless its routing rules genuinely required an update.

- [ ] **Step 7: Prepare the separate production rollout checklist**

Do not execute these actions without explicit approval. Report them for the deployment turn:

1. Read the production environment and confirm `S3_PUBLIC_URL=https://assets.snmih.tanish.im`.
2. Verify direct object URLs, including one with encoded spaces, return successfully.
3. Redeploy so `next.config.ts` receives the public origin at build time.
4. Verify anonymous HTML no longer receives `private, no-cache, no-store` solely from the shell.
5. Verify rendered media sources use `assets.snmih.tanish.im`, the first valid Hero Banner preloads, and Google Fonts domains receive no requests.
6. Compare cold/warm TTFB and mobile Lighthouse LCP, FCP, TBT, and CLS with the recorded baseline.
7. Sign in and verify the delayed toolbar, logout, Page Preview, all consent variants, analytics precedence, header offsets, and active system-mode behavior.
