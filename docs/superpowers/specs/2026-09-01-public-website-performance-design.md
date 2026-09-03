# Public Website Performance Design

## Goal

Reduce anonymous public-page latency and Largest Contentful Paint by making the public HTML cacheable,
serving media through the configured Cloudflare R2 public origin, and removing avoidable image and
font work from the critical rendering path. Preserve Payload editing, authenticated page preview,
analytics consent, themes, accessibility, and existing CMS content behavior.

## Evidence and Priorities

The production audit identified backend and cache latency as the dominant problem:

- the homepage returned an approximately 2.1-second TTFB with `private, no-cache, no-store` and a
  Vercel cache miss;
- the public frontend layout is explicitly `force-dynamic`, reads the analytics cookie, and
  authenticates a Payload user on every request;
- production media still renders through `/api/media/file/**`, adding an application hop before
  Next.js image optimization;
- the LCP Hero Banner image is lazy-loaded;
- three Google Fonts CSS imports create a blocking request chain; and
- the site logo advertises `sizes="100vw"` despite rendering at a small fixed height.

JavaScript bundle attribution remains secondary. It will be revisited after the delivery and LCP
changes are deployed and measured in an anonymous browser session.

## Decision

Implement one critical-path performance phase, then remeasure. Public HTML will no longer vary by
CMS authentication or analytics-consent cookies. Editor-only UI will load after hydration through a
small private session request, while analytics will mount client-side only after consent. Public
maintenance and coming-soon modes will apply consistently to ordinary public URLs; editors will use
the existing authenticated Page Preview route to inspect normal or draft Page content.

This direction was chosen over:

- a caching-only change, which would leave the measured font and image issues on the critical path;
  and
- Partial Prerendering with server-authenticated dynamic islands, which adds a more complex runtime
  boundary without improving the anonymous visitor outcome enough to justify it here.

## Architecture

### Cacheable Public Shell

The frontend root layout will stop exporting `dynamic = 'force-dynamic'` and will stop calling
`cookies()` or `getCurrentCMSUser()`. Its CMS globals remain behind the existing tagged
`unstable_cache` contract and continue to be invalidated by the current Payload hooks.

The shell will define a zero-default `--cms-toolbar-offset` CSS custom property. Content padding,
announcement placement, and sticky-header placement will derive from that property. Anonymous pages
therefore render with no reserved toolbar space. When an authenticated editor toolbar mounts, its
client controller changes the property to the existing toolbar height and restores it on unmount.

The existing `bypassForLoggedInAdmins` public-route behavior will be removed because it requires
request-time authentication and prevents shared caching. The field will be removed from the active
Payload global schema without deleting historical MongoDB values. Ordinary public routes always
respect the selected site mode. Authenticated `/preview/page/[id]` rendering continues to load draft
content directly and does not pass through public system-mode resolution.

### Deferred Editor Session UI

A focused client controller will request a new frontend-session endpoint after hydration. The
endpoint authenticates the current Payload request and returns only the fields the toolbar needs:

```ts
type FrontendSessionResponse = {
  user: null | {
    email: string
    role: string | null
  }
}
```

The endpoint is always private and uncached. Anonymous, invalid, and expired sessions return
`{ user: null }`. Network or parsing failures also resolve to no toolbar. The public page does not
wait for this request and never replaces its content with an error state.

### Client-Side Consent Boundary

The layout will pass the cached Analytics Settings values to a client-only analytics controller. The
controller reads `analytics_consent` after hydration and mounts nothing unless its value is
`granted`. Google Tag Manager retains precedence over standalone GA4, and Vercel Speed Insights uses
the same consent decision.

The Cookie Consent Banner will dispatch a same-page consent-change event after writing the cookie.
Accepting consent will mount the configured analytics integration immediately; it will no longer
refresh the route. Rejecting consent remains non-analytic and preserves the current banner behavior.
External analytics code will be loaded only inside the granted branch so a visitor who has not
consented does not download it.

### Direct R2 Media Delivery

The existing generic S3-compatible provider remains unchanged in ownership. Production will set:

```dotenv
S3_PUBLIC_URL=https://assets.snmih.tanish.im
```

That activates the repository's existing validated `generateFileURL` behavior and exact Next.js
remote image allow-list. Payload continues to upload and delete through the private R2 S3 endpoint;
browsers and the Next image optimizer read originals from the public custom domain.

The production environment change must be followed by a redeployment. Representative direct URLs,
including filenames containing spaces, must succeed before the deployment is accepted. If the
public origin is absent or unavailable, the repository retains its current Payload file-handler
fallback, but the performance rollout is considered incomplete.

Next.js image optimization will use a minimum cache TTL of 86,400 seconds. This matches the existing
one-day browser-cache decision for CMS assets and avoids an effectively permanent cache because
editors may reuse object keys.

### Hero Image Priority

The Page renderer will identify the first rendered Hero Banner in document order, including a Hero
Banner reached through a populated Reusable Section. Only that component receives a preload flag.
The Hero Banner passes the flag to `next/image` through the Next 16 `preload` API. Other Hero Banner
instances retain lazy loading.

The selection is renderer-owned rather than editor-configured. It creates no Payload field, no
migration, and no opportunity for multiple blocks to opt into LCP priority accidentally.

### Font Delivery

Inter, Playfair Display, and IBM Plex Mono will move from Google Fonts CSS `@import` statements to
`next/font/google` in the public frontend layout. The layout will expose their generated variables,
and the existing semantic CSS tokens (`--font-text`, `--font-display`, `--font-mono`, and related
aliases) will consume those variables. Typography, theme semantics, and component class names remain
unchanged.

Only the required Latin subset and used styles will be configured. Inter and Playfair Display retain
normal and italic support; IBM Plex Mono retains the 400 and 600 weights used by the interface.
Next.js will self-host the emitted font files, removing all runtime requests to `fonts.googleapis.com`
and `fonts.gstatic.com`.

### Logo Sizing

`SiteLogo` will preserve media width and height when available. It will calculate the expected
rendered width from the requested display height and intrinsic aspect ratio, then pass valid
intrinsic dimensions and a pixel-based `sizes` hint to `next/image`. Media without dimensions will
use a bounded square fallback instead of zero dimensions and `100vw`.

When the resolved light and dark logo URLs are identical, the component will render one image rather
than two theme variants. Different custom light and dark assets retain the existing theme-switching
behavior.

## Data Flow

### Anonymous request

1. Next.js serves or generates cacheable public HTML from tagged CMS data.
2. No request cookie or Payload session lookup participates in the HTML response.
3. The browser hydrates the consent controller and deferred editor-session controller.
4. The anonymous session response produces no toolbar.
5. Analytics remains absent unless the consent cookie is already `granted` or the visitor accepts.
6. Hero and logo image requests use responsive Next image URLs whose source origin is the R2 custom
   domain when production is configured correctly.

### Authenticated editor request

1. The editor receives the same cacheable public HTML as an anonymous visitor.
2. The frontend-session request authenticates the Payload cookie after hydration.
3. The toolbar mounts and updates `--cms-toolbar-offset` without changing public cache identity.
4. Draft inspection and normal-content inspection during an active site mode use
   `/preview/page/[id]`.

### Consent acceptance

1. The banner writes `analytics_consent=granted` with the existing one-year and security attributes.
2. It dispatches the local consent-change event.
3. The analytics controller re-reads the cookie and mounts GTM, or GA4 when GTM is disabled, plus
   Speed Insights.
4. No route refresh or server render occurs.

## Failure Handling

- A failed frontend-session request is silent and leaves the public shell at a zero toolbar offset.
- An unauthenticated Preview request continues to return the existing not-found behavior.
- Missing analytics IDs render no corresponding analytics integration even after consent.
- A missing Hero Banner media relationship renders no Hero Banner, matching current behavior; it
  does not emit an invalid preload.
- Missing logo dimensions use the bounded fallback and never reintroduce `sizes="100vw"`.
- R2 origin or object failures block operational rollout. They do not trigger automatic database or
  object mutations.
- Font download failures surface during the production build rather than creating a runtime Google
  Fonts dependency.

## Verification

### Repository checks

- Add focused tests proving the public layout contains no request cookie/auth call or
  `force-dynamic` export.
- Test anonymous, authenticated, and failed frontend-session endpoint behavior plus its private
  no-store headers.
- Test consent acceptance without `router.refresh` and the immediate analytics mount contract.
- Test public system modes without an authenticated bypass and Preview authentication separately.
- Test that only the first rendered Hero Banner is preloaded.
- Test logo intrinsic dimensions, realistic `sizes`, the missing-dimension fallback, and identical
  light/dark deduplication.
- Test `next.config.ts` for `minimumCacheTTL: 86400` and the existing R2 remote pattern.
- Test that the frontend uses `next/font` variables and no Google Fonts CSS imports.
- Run focused Vitest suites, ESLint on affected files, TypeScript validation, and a production build.
- Run `pnpm project-context:update`, inspect the change-impact map, then run
  `pnpm project-context:check`.

### Operational checks

- Confirm the production deployment has `S3_PUBLIC_URL=https://assets.snmih.tanish.im` and redeploy.
- Verify homepage and representative Page responses no longer return `private, no-cache, no-store`
  solely because of the frontend shell.
- Compare cold and warm TTFB with the existing baseline.
- Confirm rendered media source URLs use `assets.snmih.tanish.im` rather than
  `/api/media/file/**`.
- Confirm the first Hero Banner emits preload/high-priority behavior and later Hero Banners remain
  lazy.
- Confirm no public request is made to Google Fonts domains.
- Run a mobile Lighthouse check in an anonymous browser session and compare LCP, FCP, TBT, and CLS.
- Sign in as a CMS user and verify the delayed toolbar, logout, Page Preview, consent variants,
  analytics precedence, header offsets, and system-mode behavior.

## Documentation Impact

Update the active architecture reference and operator guides for analytics, cookie consent, system
modes, and R2 deployment. Regenerate Payload types after removing the active bypass field. Generated
project inventory changes are accepted only when they reflect the final source state.

## Out of Scope

- Removing features based on bundle size before an anonymous post-change bundle analysis.
- Adopting Partial Prerendering or Cache Components.
- Replacing Next.js image optimization with Cloudflare Images transformations.
- Renaming media objects or modifying Payload media relationships.
- Changing the visual design, typography choices, content, or theme tokens.
- Committing any specification, plan, implementation, generated file, or documentation change.
