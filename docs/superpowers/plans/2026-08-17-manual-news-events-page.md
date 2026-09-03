# Manual News & Events Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not dispatch subagents unless the user explicitly asks for delegated execution.

**Goal:** Replace the fixed `/news-events` archive with a manually authored Payload Page while preserving collection-driven blocks, entry details, RSS, and the existing theme system.

**Architecture:** Keep the explicit `/news-events` route, but make it a thin bridge into the same managed Page renderer used by `/[...slug]`. Remove archive-only routes, components, data helpers, metadata helpers, and the obsolete settings global; retain the News & Events collection, detail route, feed, classifications, taxonomy relationships, and dynamic Page blocks.

**Tech Stack:** Payload CMS 3, Next.js App Router, React Server Components, TypeScript, Vitest, Tailwind CSS.

## Global Constraints

- A published root Page with the exact slug `news-events` owns `/news-events`; no Page is seeded automatically.
- The Page may use any registered Page block, including `News & Events Highlights`, `News & Events Tabs`, and the unchanged `News Grid`.
- `/news-events/[slug]` and `/news-events/feed.xml` remain unchanged public contracts.
- `/news-events/category/[slug]` and `/news-events/tag/[slug]` are removed without adding redirects.
- Topics and Tags remain on News & Events records and render as non-interactive labels on entry details.
- The `News & Events Settings` global is removed without deleting its orphaned database document.
- Do not add dependencies, redesign existing blocks, change the SNMIH theme, or modify unrelated Page behavior.
- Do not stage or commit any changes unless the user explicitly asks later.

---

## File Structure

### Create

- `src/app/(frontend)/ManagedCmsPage.tsx` — shared managed Page route renderer for catch-all and dedicated Page-backed routes.
- `tests/int/managed-cms-page.int.spec.tsx` — managed Page renderer coverage for Page, system-mode, redirect, and 404 behavior.
- `tests/int/manual-news-events-page-route.int.spec.tsx` — fixed-path bridge and metadata coverage for `/news-events`.
- `tests/int/news-events-feed-route.int.spec.ts` — retained RSS channel and entry-link coverage.

### Modify

- `src/app/(frontend)/[...slug]/page.tsx` — delegate rendering to `ManagedCmsPage` while retaining dynamic metadata.
- `src/app/(frontend)/news-events/page.tsx` — load Page metadata and render `ManagedCmsPage` for `['news-events']`.
- `src/components/news-events/NewsEventStory.tsx` — replace taxonomy links with semantic, non-interactive labels.
- `src/lib/newsEvents.ts` — retain block/detail/feed data behavior and remove archive/taxonomy-route loaders.
- `src/lib/newsEventsShared.ts` — remove archive query, pagination, and empty-page types/helpers.
- `src/lib/newsEventsMetadata.ts` — retain detail metadata and structured data only.
- `src/payload.config.ts` — unregister `NewsEventsSettings`.
- `src/lib/mediaUsage.ts` — remove the obsolete global media source.
- `src/app/sitemap.ts` — source `/news-events` from Pages and omit News & Events taxonomy routes.
- `src/payload-types.ts` — regenerate after the global schema removal.
- `tests/int/news-events-data.int.spec.ts` — remove archive-query assertions while preserving block data contracts.
- `tests/int/news-events-metadata-routes.int.spec.ts` — retain entry-detail metadata coverage only.
- `tests/int/news-events-metadata.int.spec.ts` — retain entry-detail metadata and structured-data coverage only.
- `tests/int/news-event-story.int.spec.tsx` — assert taxonomy labels have no removed-route links.
- `tests/int/news-events-collection.int.spec.ts` — assert collection remains and settings global is absent.
- `tests/int/admin-information-architecture.int.spec.ts` — remove the obsolete global from Admin IA expectations.
- `tests/int/admin-documentation.int.spec.ts` — remove the obsolete guide requirement.
- `tests/int/media-governance.int.spec.ts` — remove the obsolete global lookup/reference.
- `tests/int/section-eyebrow.int.spec.tsx` — remove the deleted archive-feed source from the source contract.
- `tests/int/sitemap.int.spec.ts` — make the Page fixture own `/news-events` and reject removed taxonomy URLs.
- `docs/guides/README.md` — remove the settings-global guide entry.
- `docs/guides/news-events.md` — document manual Page composition and retained detail/feed behavior.
- `docs/guides/operational-audit-events.md` — remove the deleted settings global from audit coverage.
- `docs/operations/editorial-governance.md` — remove the deleted settings global from audit coverage.
- `docs/operations/starter-clone-checklist.md` — replace archive-global setup with manual Page setup.
- `docs/architecture/feature-inventory.md` — remove the global and taxonomy routes; describe Page-owned `/news-events`.
- `docs/architecture/content-model-map.md` — describe Pages as the index owner and News & Events as entry owner.
- `.agents/skills/project-context/references/architecture.md` — record the Page-owned route contract.
- `.agents/skills/project-context/references/payload-model.md` — update the global count and ownership.
- `.agents/skills/project-context/references/project-inventory.json` — regenerate structural inventory.

### Delete

- `src/app/(frontend)/news-events/category/[slug]/page.tsx`
- `src/app/(frontend)/news-events/tag/[slug]/page.tsx`
- `src/components/news-events/NewsEventsArchivePage.tsx`
- `src/components/news-events/NewsEventsFeed.tsx`
- `src/lib/newsEventsPaths.ts`
- `src/globals/NewsEventsSettings.ts`
- `tests/int/news-events-feed.int.spec.tsx`
- `tests/int/news-events-taxonomy-paths.int.spec.tsx`
- `tests/int/news-events-taxonomy-routes.int.spec.tsx`
- `docs/guides/news-events-settings.md`

---

### Task 1: Extract the shared managed Page renderer

**Files:**
- Create: `src/app/(frontend)/ManagedCmsPage.tsx`
- Create: `tests/int/managed-cms-page.int.spec.tsx`
- Modify: `src/app/(frontend)/[...slug]/page.tsx`

**Interfaces:**
- Consumes: `getSystemPageRenderState(pathname)`, `getHomepagePath()`, `getPageByPath(segments)`, `getRedirectByPath(pathname)`, `PageContent`, and `SystemModeFallbackPage`.
- Produces: the async `ManagedCmsPage({ segments }: { segments: string[] })` React Server Component.

- [ ] **Step 1: Write a failing managed-route test**

Create `tests/int/managed-cms-page.int.spec.tsx` with this complete harness and behavior coverage:

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getHomepagePath: vi.fn(),
  getPageByPath: vi.fn(),
  getRedirectByPath: vi.fn(),
  getSystemPageRenderState: vi.fn(),
  notFound: vi.fn(),
  permanentRedirect: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  notFound: mocks.notFound,
  permanentRedirect: mocks.permanentRedirect,
  redirect: mocks.redirect,
}))
vi.mock('@/app/(frontend)/PageContent', () => ({
  PageContent: ({ page }: { page: { title: string } }) => (
    <main data-page-content={page.title} />
  ),
}))
vi.mock('@/app/(frontend)/SystemFallbackPage', () => ({
  SystemModeFallbackPage: ({ mode }: { mode: string }) => (
    <main data-system-fallback={mode} />
  ),
}))
vi.mock('@/app/(frontend)/pageData', () => ({
  getHomepagePath: mocks.getHomepagePath,
  getPageByPath: mocks.getPageByPath,
  getSystemPageRenderState: mocks.getSystemPageRenderState,
}))
vi.mock('@/lib/redirects', () => ({ getRedirectByPath: mocks.getRedirectByPath }))
vi.mock('@/lib/pageBreadcrumbs', () => ({
  resolvePageBreadcrumbsForLayout: vi.fn(() => []),
  toBreadcrumbListStructuredData: vi.fn(() => null),
}))
vi.mock('@/lib/siteUrl', () => ({
  toAbsoluteSiteUrl: vi.fn((pathname: string) => `https://example.test${pathname}`),
}))

import { ManagedCmsPage } from '@/app/(frontend)/ManagedCmsPage'

describe('managed CMS Page renderer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSystemPageRenderState.mockResolvedValue({ mode: null, page: null })
    mocks.getHomepagePath.mockResolvedValue(null)
    mocks.getRedirectByPath.mockResolvedValue(null)
  })

it('renders the published Page through PageContent', async () => {
  mocks.getSystemPageRenderState.mockResolvedValue({ mode: null, page: null })
  mocks.getHomepagePath.mockResolvedValue(null)
  mocks.getRedirectByPath.mockResolvedValue(null)
  mocks.getPageByPath.mockResolvedValue({ id: 'news-page', title: 'News & Events' })

  const html = renderToStaticMarkup(
    await ManagedCmsPage({ segments: ['news-events'] }),
  )

  expect(mocks.getPageByPath).toHaveBeenCalledWith(['news-events'])
  expect(html).toContain('data-page-content="News & Events"')
  expect(html).toContain('"@type":"WebPage"')
})

it('renders a configured system Page before the requested Page', async () => {
  mocks.getSystemPageRenderState.mockResolvedValue({
    mode: 'maintenance',
    page: { id: 'maintenance', title: 'Maintenance' },
  })

  const html = renderToStaticMarkup(
    await ManagedCmsPage({ segments: ['news-events'] }),
  )

  expect(html).toContain('data-page-content="Maintenance"')
  expect(mocks.getPageByPath).not.toHaveBeenCalled()
})

it('renders the fallback when a system mode has no configured Page', async () => {
  mocks.getSystemPageRenderState.mockResolvedValue({ mode: 'comingSoon', page: null })

  const html = renderToStaticMarkup(
    await ManagedCmsPage({ segments: ['news-events'] }),
  )

  expect(html).toContain('data-system-fallback="comingSoon"')
})

it('uses managed not-found behavior when no published Page exists', async () => {
  mocks.getSystemPageRenderState.mockResolvedValue({ mode: null, page: null })
  mocks.getHomepagePath.mockResolvedValue(null)
  mocks.getRedirectByPath.mockResolvedValue(null)
  mocks.getPageByPath.mockResolvedValue(null)
  mocks.notFound.mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND')
  })

  await expect(ManagedCmsPage({ segments: ['news-events'] })).rejects.toThrow(
    'NEXT_NOT_FOUND',
  )
})

it('honors permanent redirects before Page lookup', async () => {
  mocks.getRedirectByPath.mockResolvedValue({
    destination: '/replacement',
    permanent: true,
  })
  mocks.permanentRedirect.mockImplementation(() => {
    throw new Error('NEXT_REDIRECT')
  })

  await expect(ManagedCmsPage({ segments: ['news-events'] })).rejects.toThrow(
    'NEXT_REDIRECT',
  )
  expect(mocks.permanentRedirect).toHaveBeenCalledWith('/replacement')
  expect(mocks.getPageByPath).not.toHaveBeenCalled()
})

it('honors temporary redirects before Page lookup', async () => {
  mocks.getRedirectByPath.mockResolvedValue({
    destination: '/temporary',
    permanent: false,
  })
  mocks.redirect.mockImplementation(() => {
    throw new Error('NEXT_REDIRECT')
  })

  await expect(ManagedCmsPage({ segments: ['news-events'] })).rejects.toThrow(
    'NEXT_REDIRECT',
  )
  expect(mocks.redirect).toHaveBeenCalledWith('/temporary')
  expect(mocks.getPageByPath).not.toHaveBeenCalled()
})
})
```

- [ ] **Step 2: Run the new test and verify the module is missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/managed-cms-page.int.spec.tsx
```

Expected: FAIL because `src/app/(frontend)/ManagedCmsPage.tsx` does not exist.

- [ ] **Step 3: Move the catch-all rendering contract into `ManagedCmsPage`**

Create `src/app/(frontend)/ManagedCmsPage.tsx` with the current catch-all behavior:

```tsx
import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { PageContent } from './PageContent'
import { SystemModeFallbackPage } from './SystemFallbackPage'
import {
  getHomepagePath,
  getPageByPath,
  getSystemPageRenderState,
} from './pageData'
import { getRedirectByPath } from '@/lib/redirects'
import {
  resolvePageBreadcrumbsForLayout,
  toBreadcrumbListStructuredData,
} from '@/lib/pageBreadcrumbs'
import { toAbsoluteSiteUrl } from '@/lib/siteUrl'

export async function ManagedCmsPage({ segments }: { segments: string[] }) {
  const pathname = `/${segments.join('/')}`
  const systemPageState = await getSystemPageRenderState(pathname)

  if (systemPageState.page) return <PageContent page={systemPageState.page} />
  if (systemPageState.mode) return <SystemModeFallbackPage mode={systemPageState.mode} />

  const homepagePath = await getHomepagePath()
  if (homepagePath && pathname === homepagePath) permanentRedirect('/')

  const matchedRedirect = await getRedirectByPath(pathname)
  if (matchedRedirect?.permanent) permanentRedirect(matchedRedirect.destination)
  if (matchedRedirect) redirect(matchedRedirect.destination)

  const page = await getPageByPath(segments)
  if (!page) notFound()

  const pageUrl = toAbsoluteSiteUrl(pathname)
  const breadcrumbStructuredData = toBreadcrumbListStructuredData(
    resolvePageBreadcrumbsForLayout(page),
    toAbsoluteSiteUrl,
  )
  const structuredData = [
    { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url: pageUrl },
    ...(breadcrumbStructuredData ? [breadcrumbStructuredData] : []),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, '\\u003c'),
        }}
      />
      <PageContent page={page} />
    </>
  )
}
```

Replace the rendering body and now-unused imports in `src/app/(frontend)/[...slug]/page.tsx` so the route ends with:

```tsx
export default async function CmsPage({ params }: PageProps) {
  const { slug } = await params
  return <ManagedCmsPage segments={slug} />
}
```

Keep `generateMetadata({ params })` calling `getPageMetadataByPath(slug)`.

- [ ] **Step 4: Run the managed-route and existing Page route tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/managed-cms-page.int.spec.tsx \
  tests/int/page-routing.int.spec.ts \
  tests/int/page-settings-system-mode.int.spec.ts \
  tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: all selected tests PASS.

---

### Task 2: Bridge `/news-events` to the manual Page

**Files:**
- Create: `tests/int/manual-news-events-page-route.int.spec.tsx`
- Modify: `src/app/(frontend)/news-events/page.tsx`
- Modify: `tests/int/news-events-metadata-routes.int.spec.ts`

**Interfaces:**
- Consumes: `ManagedCmsPage({ segments })` and `getPageMetadataByPath(segments)` from Task 1.
- Produces: an explicit `/news-events` route backed by the published Page at `['news-events']`.

- [ ] **Step 1: Write a failing fixed-route bridge test**

Create `tests/int/manual-news-events-page-route.int.spec.tsx` with the complete fixed-path contract:

```tsx
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPageMetadataByPath: vi.fn(),
}))

vi.mock('@/app/(frontend)/pageData', () => ({
  getPageMetadataByPath: mocks.getPageMetadataByPath,
}))

import NewsEventsPage, {
  generateMetadata,
} from '@/app/(frontend)/news-events/page'
import { ManagedCmsPage } from '@/app/(frontend)/ManagedCmsPage'

describe('manual News & Events Page route', () => {
it('renders the manually authored news-events Page', () => {
  const element = NewsEventsPage()

  expect(element.type).toBe(ManagedCmsPage)
  expect(element.props.segments).toEqual(['news-events'])
})

it('uses the Page document metadata contract', async () => {
  mocks.getPageMetadataByPath.mockResolvedValue({ title: 'Manual News & Events' })

  await expect(generateMetadata()).resolves.toEqual({ title: 'Manual News & Events' })
  expect(mocks.getPageMetadataByPath).toHaveBeenCalledWith(['news-events'])
})
})
```

- [ ] **Step 2: Run the bridge test and verify it fails against the archive route**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/manual-news-events-page-route.int.spec.tsx
```

Expected: FAIL because the route still imports archive settings and `NewsEventsArchivePage`.

- [ ] **Step 3: Replace the archive route with the Page bridge**

Replace `src/app/(frontend)/news-events/page.tsx` with:

```tsx
import type { Metadata } from 'next'

import { ManagedCmsPage } from '../ManagedCmsPage'
import { getPageMetadataByPath } from '../pageData'

const newsEventsPageSegments = ['news-events']

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadataByPath(newsEventsPageSegments)
}

export default function NewsEventsPage() {
  return <ManagedCmsPage segments={newsEventsPageSegments} />
}
```

In `tests/int/news-events-metadata-routes.int.spec.ts`, delete the archive-settings mocks and archive metadata assertion. Keep the detail-route test unchanged so per-entry metadata still resolves through `getNewsEventDetailMetadata(entry, inheritedRobots)`.

- [ ] **Step 4: Run fixed-route and detail metadata tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/manual-news-events-page-route.int.spec.tsx \
  tests/int/news-events-metadata-routes.int.spec.ts
```

Expected: both files PASS; no archive-global metadata mock remains.

---

### Task 3: Remove archive-only routes, UI, data, and taxonomy links

**Files:**
- Delete: `src/app/(frontend)/news-events/category/[slug]/page.tsx`
- Delete: `src/app/(frontend)/news-events/tag/[slug]/page.tsx`
- Delete: `src/components/news-events/NewsEventsArchivePage.tsx`
- Delete: `src/components/news-events/NewsEventsFeed.tsx`
- Delete: `src/lib/newsEventsPaths.ts`
- Delete: `tests/int/news-events-feed.int.spec.tsx`
- Delete: `tests/int/news-events-taxonomy-paths.int.spec.tsx`
- Delete: `tests/int/news-events-taxonomy-routes.int.spec.tsx`
- Modify: `src/lib/newsEvents.ts`
- Modify: `src/lib/newsEventsShared.ts`
- Modify: `src/lib/newsEventsMetadata.ts`
- Modify: `src/components/news-events/NewsEventStory.tsx`
- Modify: `tests/int/news-events-data.int.spec.ts`
- Modify: `tests/int/news-events-metadata.int.spec.ts`
- Modify: `tests/int/news-event-story.int.spec.tsx`
- Modify: `tests/int/section-eyebrow.int.spec.tsx`

**Interfaces:**
- Preserves: `getNewsEventsHighlights`, `getNewsEventsCarouselItems`, `getNewsEventGroups`, `getNewsGridItems`, `getNewsEventBySlug`, `getNewsEventPreviewBySlug`, `getNewsEventsInheritedRobots`, card/detail transforms, classifications, and date formatting.
- Removes: archive queries/pages, taxonomy route lookups/paths, archive metadata, and archive UI.

- [ ] **Step 1: Change retained tests to describe the new contract**

In `tests/int/news-events-data.int.spec.ts`, remove `parseNewsEventsSearchParams` from the imports and replace the archive parsing test with the retained block-count contract:

```ts
it('normalizes dynamic block item counts', () => {
  expect(normalizeHighlightsItemCount(99)).toBe(6)
  expect(normalizeHighlightsItemCount(0)).toBe(1)
  expect(normalizeHighlightsItemCount(undefined)).toBe(3)
})
```

In `tests/int/news-event-story.int.spec.tsx`, extend the existing story assertion:

```tsx
expect(markup).toContain('Campus')
expect(markup).toContain('Education')
expect(markup).not.toContain('href="/news-events/category/')
expect(markup).not.toContain('href="/news-events/tag/')
```

In `tests/int/news-events-metadata.int.spec.ts`, remove archive and taxonomy metadata cases. Keep the two detail robots-policy tests and add retained structured-data coverage:

```ts
it('keeps NewsArticle structured data for non-event entries', () => {
  expect(getNewsEventStructuredData(detailFixture('default'))).toMatchObject({
    '@type': 'NewsArticle',
    headline: 'Example news entry',
    url: 'http://localhost:3000/news-events/example',
  })
})

it('keeps Event structured data for event entries', () => {
  expect(
    getNewsEventStructuredData({
      ...detailFixture('default'),
      contentType: 'event',
      eventLocation: 'Main Auditorium',
      eventStart: '2026-09-10T09:00:00.000Z',
    }),
  ).toMatchObject({
    '@type': 'Event',
    location: { '@type': 'Place', name: 'Main Auditorium' },
    startDate: '2026-09-10T09:00:00.000Z',
  })
})
```

- [ ] **Step 2: Run retained tests and verify taxonomy-link expectations fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-data.int.spec.ts \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/news-events-metadata.int.spec.ts
```

Expected: the story test FAILS because taxonomy metadata is still rendered with links.

- [ ] **Step 3: Remove the archive-only implementation**

Delete the route, component, path-helper, and archive-only test files listed above. In `src/lib/newsEventsShared.ts`, remove:

```ts
NEWS_EVENTS_DEFAULT_PAGE_SIZE
NEWS_EVENTS_MAX_PAGE_SIZE
NewsEventsArchiveType
PublicNewsEventsPage
NewsEventsArchiveQuery
archiveTypeValues
categorySlugPattern
tagSlugPattern
positiveIntegerPattern
firstSearchParam
parsePositiveInteger
normalizeNewsEventsPageSize
parseNewsEventsSearchParams
createEmptyNewsEventsPage
```

In `src/lib/newsEvents.ts`, remove the matching imports plus:

```ts
pastEventWhere
categoryWhere
tagWhere
toPublicPage
fetchNewsEventsArchivePage
fetchEventsPage
getNewsEventsArchivePage
getUpcomingEventsPage
getPastEventsPage
getNewsEventCategoryBySlug
getNewsEventTagBySlug
getNewsEventCategories
getNewsEventTags
```

Do not remove `currentOrUpcomingEventWhere`; the Highlights, Tabs, and News Grid queries still use it. Keep `getNewsEventsInheritedRobots` for entry detail metadata.

In `src/lib/newsEventsMetadata.ts`, remove `getNewsEventsArchiveMetadata` and `getNewsEventsTaxonomyMetadata`, leaving these exports:

```ts
export function getNewsEventDetailMetadata(
  entry: PublicNewsEventDetail,
  inheritedRobots: RobotsFieldValue | null | undefined,
): Metadata

export function getNewsEventStructuredData(entry: PublicNewsEventDetail)
```

- [ ] **Step 4: Render taxonomy as non-interactive metadata**

Remove the `Link` and `newsEventsPaths` imports from `NewsEventStory.tsx`. Replace the primary-category link with:

```tsx
{entry.category ? <span>{entry.category.title}</span> : null}
```

Replace footer taxonomy links with spans while retaining the same visual treatment:

```tsx
{entry.categories.map((term) => (
  <span
    className="rounded-md border border-border px-3 py-1 text-sm text-current/70"
    key={`category-${term.id}`}
  >
    {term.title}
  </span>
))}
{entry.tags.map((tag) => (
  <span
    className="rounded-md border border-border px-3 py-1 text-sm text-current/70"
    key={`tag-${tag.id}`}
  >
    {tag.title}
  </span>
))}
```

Remove `src/components/news-events/NewsEventsFeed.tsx` from the source list in `tests/int/section-eyebrow.int.spec.tsx`.

- [ ] **Step 5: Verify no archive implementation remains and retained behavior passes**

Run:

```bash
rg -n "NewsEventsArchivePage|NewsEventsFeed|NewsEventsArchiveQuery|getNewsEventsArchivePage|getUpcomingEventsPage|getPastEventsPage|getNewsEventsCategoryPath|getNewsEventsTagPath|getNewsEventsTaxonomyMetadata" src tests
```

Expected: no matches.

Then run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-data.int.spec.ts \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/news-events-metadata.int.spec.ts \
  tests/int/news-events-metadata-routes.int.spec.ts \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/news-events-featured-carousel.int.spec.tsx \
  tests/int/news-events-tabs.int.spec.tsx
```

Expected: all selected tests PASS and cards still use `/news-events/[slug]` links.

---

### Task 4: Remove the obsolete Payload global and media-governance source

**Files:**
- Delete: `src/globals/NewsEventsSettings.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/lib/mediaUsage.ts`
- Modify: `tests/int/news-events-collection.int.spec.ts`
- Modify: `tests/int/admin-information-architecture.int.spec.ts`
- Modify: `tests/int/media-governance.int.spec.ts`
- Modify: `src/payload-types.ts` by generation

**Interfaces:**
- Preserves: the `news-events` collection and its seven-value classification.
- Removes: Payload global slug `news-events-settings` and generated `NewsEventsSetting` types.

- [ ] **Step 1: Update tests to require the global's absence**

In `tests/int/news-events-collection.int.spec.ts`, remove the global import and global-tab helper assertion. Change the registration test to:

```ts
it('registers the typed collection without the retired archive settings global', async () => {
  const resolvedConfig = await config

  expect(resolvedConfig.collections?.map(({ slug }) => slug)).toContain('news-events')
  expect(resolvedConfig.globals?.map(({ slug }) => slug)).not.toContain(
    'news-events-settings',
  )
  expect(NewsEvents.versions).toBeTruthy()
  expect(
    typeof NewsEvents.versions === 'object' && NewsEvents.versions !== null
      ? 'drafts' in NewsEvents.versions
      : NewsEvents.versions === true,
  ).toBe(true)
})
```

In `tests/int/admin-information-architecture.int.spec.ts`, remove the `NewsEventsSettings` import and expectation, and use:

```ts
expect(PageSettings.admin?.group).toBe('Configuration')
expect(SystemModeSettings.admin?.group).toBe('Configuration')
```

In `tests/int/media-governance.int.spec.ts`, remove the `news-events-settings` branch and expected reference. Update the expected reference count from `13` to `12`.

- [ ] **Step 2: Run schema and media tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-collection.int.spec.ts \
  tests/int/admin-information-architecture.int.spec.ts \
  tests/int/media-governance.int.spec.ts
```

Expected: FAIL because the global is still registered and queried.

- [ ] **Step 3: Unregister and delete the settings global**

Delete `src/globals/NewsEventsSettings.ts`. Remove this import and registration from `src/payload.config.ts`:

```ts
import { NewsEventsSettings } from './globals/NewsEventsSettings'
```

```ts
NewsEventsSettings,
```

In `src/lib/mediaUsage.ts`, remove the label entry:

```ts
'news-events-settings': 'News & Events Settings',
```

and remove the entire `globalSources` item whose slug is `news-events-settings`. Keep the Site Identity and SEO & Metadata sources unchanged.

- [ ] **Step 4: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: command succeeds; `src/payload-types.ts` no longer contains `NewsEventsSetting`, `NewsEventsSettingsSelect`, or the `news-events-settings` global mapping.

- [ ] **Step 5: Verify global removal**

Run:

```bash
rg -n "NewsEventsSetting|news-events-settings" src tests --glob '!docs/**'
```

Expected: no matches.

Then rerun the three tests from Step 2. Expected: all PASS.

---

### Task 5: Make sitemap ownership match the manual Page

**Files:**
- Create: `tests/int/news-events-feed-route.int.spec.ts`
- Modify: `src/app/sitemap.ts`
- Modify: `tests/int/sitemap.int.spec.ts`

**Interfaces:**
- Consumes: standard published Page sitemap entries and published News & Events detail entries.
- Produces: `/news-events` only when the published Page is sitemap-eligible; no News & Events taxonomy URLs.

- [ ] **Step 1: Update the sitemap fixture and assertions**

Add this document to the mocked `pages` result:

```ts
{
  id: 3,
  includeInSitemap: 'default',
  path: '/news-events',
  robotsMode: 'index',
  slug: 'news-events',
  updatedAt: '2026-08-17T00:00:00.000Z',
},
```

Rename the sitemap test to `includes public Pages and detail entries without removed News & Events taxonomy routes`. Retain the `/news-events` and `/news-events/community-open-day` assertions, and replace News & Events taxonomy assertions with:

```ts
expect(urls).not.toContain('http://localhost:3000/news-events/category/community')
expect(urls).not.toContain('http://localhost:3000/news-events/category/open-days')
expect(urls).not.toContain('http://localhost:3000/news-events/tag/featured-event')
expect(urls).toContain('http://localhost:3000/articles/category/guides')
expect(urls).toContain('http://localhost:3000/reviews/category/guides')
expect(urls).toContain('http://localhost:3000/articles/tag/featured')
```

Assert that `findGlobal` is called only for `page-settings` and `seo-settings`, not `news-events-settings`:

```ts
expect(payloadMocks.findGlobal.mock.calls.map(([query]) => query.slug)).toEqual([
  'page-settings',
  'seo-settings',
])
```

- [ ] **Step 2: Run the sitemap test and verify the old taxonomy behavior fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/sitemap.int.spec.ts
```

Expected: FAIL because the sitemap still loads the retired global and emits News & Events taxonomy routes.

- [ ] **Step 3: Remove special archive and taxonomy sitemap logic**

Remove these imports from `src/app/sitemap.ts`:

```ts
getNewsEventsCategoryPath
getNewsEventsTagPath
```

Change global loading to:

```ts
const [pageSettings, seoSettings] = await Promise.all([
  payload.findGlobal({ slug: 'page-settings', depth: 0 }),
  payload.findGlobal({ slug: 'seo-settings', depth: 0 }),
])
```

Delete the special News & Events index block. In the News & Events loop, keep only detail entry creation:

```ts
for (const entry of newsEvents) {
  if (!entry.slug || !isRouteEligibleForSitemap({ entry, inheritedRobots })) continue
  addEntry({ entries, lastModified: entry.updatedAt, pathname: `/news-events/${entry.slug}` })
}
```

Delete `newsEventCategoryIDs`, `newsEventTagIDs`, their population, and their category/tag output branches. Do not change Article or Review taxonomy sitemap behavior.

- [ ] **Step 4: Add a retained RSS route contract test**

Create `tests/int/news-events-feed-route.int.spec.ts` with the complete Payload route harness and assertions:

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => ({
  find: vi.fn(),
  findGlobal: vi.fn(),
}))

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()

  return {
    ...actual,
    getPayload: vi.fn(async () => ({
      find: payloadMocks.find,
      findGlobal: payloadMocks.findGlobal,
    })),
  }
})

vi.mock('@payload-config', () => ({ default: {} }))

describe('News & Events RSS route', () => {
beforeEach(() => {
  vi.clearAllMocks()
})

it('keeps the manual Page and detail URLs in the News & Events feed', async () => {
  payloadMocks.find.mockResolvedValue({
    docs: [
      {
        authorName: 'Editorial Team',
        contentType: 'news',
        excerpt: 'A public update.',
        featuredImage: null,
        publishedAt: '2026-08-17T00:00:00.000Z',
        slug: 'public-update',
        title: 'Public update',
        updatedAt: '2026-08-17T00:00:00.000Z',
      },
    ],
  })
  payloadMocks.findGlobal.mockResolvedValue({ siteName: 'SNMIH' })

  const { GET } = await import('@/app/(frontend)/news-events/feed.xml/route')
  const response = await GET()
  const xml = await response.text()

  expect(response.status).toBe(200)
  expect(xml).toContain('<link>http://localhost:3000/news-events</link>')
  expect(xml).toContain(
    '<guid isPermaLink="true">http://localhost:3000/news-events/public-update</guid>',
  )
})
})
```

- [ ] **Step 5: Run sitemap and feed discovery tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/sitemap.int.spec.ts \
  tests/int/news-events-feed-route.int.spec.ts \
  tests/int/news-events-metadata-routes.int.spec.ts
```

Expected: all selected tests PASS; RSS remains registered and links to `/news-events` plus detail URLs.

---

### Task 6: Update operator documentation and architecture contracts

**Files:**
- Delete: `docs/guides/news-events-settings.md`
- Modify: `docs/guides/README.md`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/guides/operational-audit-events.md`
- Modify: `docs/operations/editorial-governance.md`
- Modify: `docs/operations/starter-clone-checklist.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `docs/architecture/content-model-map.md`
- Modify: `tests/int/admin-documentation.int.spec.ts`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` by generation

**Interfaces:**
- Produces: one consistent operator contract—Pages own the index, News & Events owns entries, dynamic blocks display listings.

- [ ] **Step 1: Update the documentation contract test**

Remove this expected guide from `tests/int/admin-documentation.int.spec.ts`:

```ts
'[News & Events Settings](./news-events-settings.md)',
```

Add direct assertions for the retained guide:

```ts
const newsEventsGuide = readFileSync('docs/guides/news-events.md', 'utf8')
expect(newsEventsGuide).toContain('root Page with the slug `news-events`')
expect(newsEventsGuide).toContain('News & Events Highlights')
expect(newsEventsGuide).toContain('News & Events Tabs')
expect(newsEventsGuide).not.toContain('/news-events/category/[slug]')
expect(newsEventsGuide).not.toContain('/news-events/tag/[slug]')
```

- [ ] **Step 2: Rewrite the operator workflow around Page composition**

Delete `docs/guides/news-events-settings.md` and remove its link from `docs/guides/README.md` and `docs/guides/news-events.md`.

Update `docs/guides/news-events.md` to state:

```markdown
- Create and publish a root Page with the slug `news-events` to own `/news-events`.
- Compose the Page with normal Page blocks. Use `News & Events Highlights` for the featured carousel and `News & Events Tabs` for the classified text-only listing.
- Cards remain collection-driven and link to `/news-events/[slug]` detail pages.
- Topics and Tags remain editorial metadata; there are no News & Events taxonomy archive routes.
- `/news-events/feed.xml` remains the RSS feed.
```

Replace the clone-checklist settings-global item with:

```markdown
- Create and publish the root `news-events` Page, configure its Page SEO and appearance, and add the required News & Events listing blocks.
```

Remove `News & Events Settings` from both audit-coverage documents because deleting the global removes its audit hook.

- [ ] **Step 3: Update maintained architecture documentation**

In `docs/architecture/feature-inventory.md`:

- remove the `News & Events Settings` global row;
- describe `/news-events` as a published CMS Page using collection-backed blocks;
- remove `/news-events/category/[slug]` and `/news-events/tag/[slug]` route rows;
- retain entry detail and RSS rows.

In `docs/architecture/content-model-map.md`, delete the removed global paragraph and add:

```markdown
Pages own the `/news-events` index route and its layout, appearance, and Page SEO. The News & Events collection owns individual entries, while the News & Events Highlights and News & Events Tabs blocks query published entries for Page composition.
```

Update `.agents/skills/project-context/references/architecture.md` and `payload-model.md` with the same ownership model and change the registered-global count from nine to eight.

- [ ] **Step 4: Run documentation tests and scan for stale contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/admin-documentation.int.spec.ts
```

Expected: PASS.

Run:

```bash
rg -n "News & Events Settings|news-events-settings|built-in filtered archive|/news-events/category/\[slug\]|/news-events/tag/\[slug\]" \
  README.md docs src tests --glob '!docs/superpowers/**' --glob '!src/payload-types.ts'
```

Expected: no stale references.

- [ ] **Step 5: Refresh and validate project knowledge**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands succeed. Inspect `.agents/skills/project-context/references/project-inventory.json` and confirm:

- eight globals are represented;
- `NewsEventsSettings` is absent;
- the category/tag route modules and archive components are absent;
- `/news-events`, `/news-events/[slug]`, and `/news-events/feed.xml` remain represented;
- the two dynamic News & Events blocks remain registered.

---

### Task 7: Final verification and change-impact review

**Files:**
- Review all files changed by Tasks 1–6.
- Do not stage or commit.

**Interfaces:**
- Verifies the complete approved design without expanding scope.

- [ ] **Step 1: Run focused News & Events, route, sitemap, schema, and governance tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/managed-cms-page.int.spec.tsx \
  tests/int/manual-news-events-page-route.int.spec.tsx \
  tests/int/news-events-collection.int.spec.ts \
  tests/int/news-events-data.int.spec.ts \
  tests/int/news-events-highlights.int.spec.tsx \
  tests/int/news-events-featured-carousel.int.spec.tsx \
  tests/int/news-events-tabs.int.spec.tsx \
  tests/int/news-events-metadata.int.spec.ts \
  tests/int/news-events-metadata-routes.int.spec.ts \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/news-events-feed-route.int.spec.ts \
  tests/int/sitemap.int.spec.ts \
  tests/int/admin-information-architecture.int.spec.ts \
  tests/int/admin-documentation.int.spec.ts \
  tests/int/media-governance.int.spec.ts
```

Expected: all selected tests PASS.

- [ ] **Step 2: Run generated-type and static checks**

Run:

```bash
pnpm generate:types
pnpm exec tsc --noEmit
pnpm lint
```

Expected: type generation and TypeScript PASS. Lint introduces no new warning or error; report any pre-existing warning separately rather than changing unrelated code.

- [ ] **Step 3: Run the full integration suite**

Run:

```bash
pnpm test:int
```

Expected: PASS, apart from any already-documented unrelated baseline failure; if a failure touches a changed contract, fix it before handoff.

- [ ] **Step 4: Run final project-context checks**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both PASS and a second update is a no-op.

- [ ] **Step 5: Inspect the final diff against the impact map**

Run:

```bash
git diff --check
git status --short
git diff -- \
  'src/app/(frontend)' \
  src/app/sitemap.ts \
  src/components/news-events \
  src/lib/newsEvents.ts \
  src/lib/newsEventsShared.ts \
  src/lib/newsEventsMetadata.ts \
  src/lib/mediaUsage.ts \
  src/payload.config.ts \
  src/payload-types.ts \
  tests/int \
  docs \
  .agents/skills/project-context/references
```

Expected:

- no whitespace errors;
- no changes to `News Grid` source, tests, or thumbnail;
- no changes to the SNMIH theme;
- dynamic block cards still link to `/news-events/[slug]`;
- no redirects or seed data were added;
- no files are staged and no commit was created.
