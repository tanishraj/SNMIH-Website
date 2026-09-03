# News & Events Taxonomy Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add canonical News & Events category and tag archives and include eligible used terms in the sitemap.

**Architecture:** Centralize News & Events taxonomy paths and archive URL building, then share one server archive loader across the root, category, and tag routes. Resolve taxonomy metadata from Payload with request-level caching and extend the existing sitemap usage sets without generating query-string combinations.

**Tech Stack:** Next.js App Router, React Server Components, Payload CMS 3, TypeScript, Vitest

## Global Constraints

- Add `/news-events/category/[slug]` and `/news-events/tag/[slug]` as stable public routes.
- Existing terms remain public even when noindex or excluded from the sitemap; only unknown terms return 404.
- Dedicated route pathnames override a conflicting query parameter for the same taxonomy dimension.
- Pagination, content type, and the second taxonomy dimension remain query parameters on the active base route.
- Sitemap entries include only simple category and tag paths used by eligible published News & Events records.
- Do not generate taxonomy combination, content-type, or pagination URLs in the sitemap.
- Preserve existing article and review sitemap behavior.
- Do not stage or commit any changes.

---

### Task 1: Centralize Taxonomy Paths And Archive Links

**Files:**
- Create: `src/lib/newsEventsPaths.ts`
- Create: `tests/int/news-events-taxonomy-paths.int.spec.tsx`
- Modify: `src/components/news-events/NewsEventsFeed.tsx`
- Modify: `src/components/news-events/NewsEventStory.tsx`

**Interfaces:**
- Produces: `NewsEventsTaxonomyContext`, `getNewsEventsCategoryPath(slug)`, `getNewsEventsTagPath(slug)`, and `buildNewsEventsArchiveHref(query, updates, context?)`
- Consumes: `NewsEventsArchiveQuery` and `NewsEventsArchiveType` from `src/lib/newsEventsShared.ts`

- [ ] **Step 1: Write failing path and rendered-link tests**

Create `tests/int/news-events-taxonomy-paths.int.spec.tsx` with fixtures that assert:

```ts
expect(getNewsEventsCategoryPath('campus-life')).toBe('/news-events/category/campus-life')
expect(getNewsEventsTagPath('open-day')).toBe('/news-events/tag/open-day')

expect(buildNewsEventsArchiveHref(baseQuery, { category: 'campus-life' })).toBe(
  '/news-events/category/campus-life',
)
expect(buildNewsEventsArchiveHref(baseQuery, { tag: 'open-day' })).toBe(
  '/news-events/tag/open-day',
)
expect(
  buildNewsEventsArchiveHref(
    { ...baseQuery, category: 'campus-life' },
    { page: 2 },
    { kind: 'category', slug: 'campus-life' },
  ),
).toBe('/news-events/category/campus-life?page=2')
expect(
  buildNewsEventsArchiveHref(
    { ...baseQuery, category: 'campus-life' },
    { tag: 'open-day' },
    { kind: 'category', slug: 'campus-life' },
  ),
).toBe('/news-events/category/campus-life?tag=open-day')
expect(
  buildNewsEventsArchiveHref(
    { ...baseQuery, category: 'campus-life' },
    { category: undefined },
    { kind: 'category', slug: 'campus-life' },
  ),
).toBe('/news-events')
```

Also server-render `NewsEventStory` and `NewsEventsFeed` fixtures and assert that category/tag anchors use `/news-events/category/...` and `/news-events/tag/...`, with no `?category=` or `?tag=` for a single root selection.

- [ ] **Step 2: Run the focused test and confirm imports or expectations fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-taxonomy-paths.int.spec.tsx
```

Expected: fail because `src/lib/newsEventsPaths.ts` and the dedicated links do not exist.

- [ ] **Step 3: Implement the path contract**

Create `src/lib/newsEventsPaths.ts` with this public shape:

```ts
import type { NewsEventsArchiveQuery, NewsEventsArchiveType } from '@/lib/newsEventsShared'

export type NewsEventsTaxonomyContext = {
  kind: 'category' | 'tag'
  slug: string
}

export type NewsEventsArchiveHrefUpdates = Partial<{
  category: string | undefined
  page: number
  pastPage: number
  tag: string | undefined
  type: NewsEventsArchiveType
  upcomingPage: number
}>

export const getNewsEventsCategoryPath = (slug: string) =>
  `/news-events/category/${encodeURIComponent(slug)}`

export const getNewsEventsTagPath = (slug: string) =>
  `/news-events/tag/${encodeURIComponent(slug)}`

export function buildNewsEventsArchiveHref(
  query: NewsEventsArchiveQuery,
  updates: NewsEventsArchiveHrefUpdates,
  context?: NewsEventsTaxonomyContext,
): string {
  const next = { ...query, ...updates }
  const updatesCategory = Object.prototype.hasOwnProperty.call(updates, 'category')
  const updatesTag = Object.prototype.hasOwnProperty.call(updates, 'tag')
  let activeContext = context

  if (context?.kind === 'category' && updatesCategory) {
    activeContext = updates.category
      ? { kind: 'category', slug: updates.category }
      : undefined
  } else if (context?.kind === 'tag' && updatesTag) {
    activeContext = updates.tag ? { kind: 'tag', slug: updates.tag } : undefined
  } else if (!context && updatesCategory && updates.category) {
    activeContext = { kind: 'category', slug: updates.category }
  } else if (!context && updatesTag && updates.tag) {
    activeContext = { kind: 'tag', slug: updates.tag }
  }

  const params = new URLSearchParams()
  if (next.type !== 'all') params.set('type', next.type)
  if (next.category && activeContext?.kind !== 'category') params.set('category', next.category)
  if (next.tag && activeContext?.kind !== 'tag') params.set('tag', next.tag)
  if (next.page > 1) params.set('page', String(next.page))
  if (next.upcomingPage > 1) params.set('upcomingPage', String(next.upcomingPage))
  if (next.pastPage > 1) params.set('pastPage', String(next.pastPage))

  const pathname =
    activeContext?.kind === 'category'
      ? getNewsEventsCategoryPath(activeContext.slug)
      : activeContext?.kind === 'tag'
        ? getNewsEventsTagPath(activeContext.slug)
        : '/news-events'
  const search = params.toString()
  return search ? `${pathname}?${search}` : pathname
}
```

- [ ] **Step 4: Use the shared link contract in both components**

In `NewsEventsFeed`, add an optional `taxonomyContext?: NewsEventsTaxonomyContext` prop and pass it into every `buildNewsEventsArchiveHref` call. Delete the file-local `ArchiveHrefUpdates` and `buildArchiveHref` definitions.

In `NewsEventStory`, replace query taxonomy links with `getNewsEventsCategoryPath(term.slug)` and `getNewsEventsTagPath(tag.slug)`.

- [ ] **Step 5: Run the focused path test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-taxonomy-paths.int.spec.tsx tests/int/news-event-story.int.spec.tsx tests/int/news-events-feed.int.spec.tsx
```

Expected: all focused link and existing presentation tests pass.

### Task 2: Share Archive Loading And Add Taxonomy Routes

**Files:**
- Create: `src/components/news-events/NewsEventsArchivePage.tsx`
- Create: `src/app/(frontend)/news-events/category/[slug]/page.tsx`
- Create: `src/app/(frontend)/news-events/tag/[slug]/page.tsx`
- Create: `tests/int/news-events-taxonomy-routes.int.spec.tsx`
- Modify: `src/app/(frontend)/news-events/page.tsx`
- Modify: `src/lib/newsEvents.ts`
- Modify: `src/lib/newsEventsMetadata.ts`
- Modify: `tests/int/news-events-metadata.int.spec.ts`

**Interfaces:**
- Produces: `getNewsEventCategoryBySlug(slug): Promise<Category | null>` and `getNewsEventTagBySlug(slug): Promise<Tag | null>`
- Produces: `getNewsEventsTaxonomyMetadata({ inheritedRobots, kind, pathname, settings, term }): Metadata`
- Produces: `NewsEventsArchivePage({ fixedTaxonomy?, searchParams })`
- Consumes: Task 1's `NewsEventsTaxonomyContext`

- [ ] **Step 1: Write failing metadata tests**

Extend `tests/int/news-events-metadata.int.spec.ts` to assert a category fixture produces:

```ts
expect(metadata.title).toBe('Campus Life | News & Events')
expect(metadata.description).toBe('Campus updates and events.')
expect(metadata.alternates?.canonical).toBe(
  'http://localhost:3000/news-events/category/campus-life',
)
expect(metadata.robots).toEqual({ follow: false, index: false })
```

Add a tag fixture with `metaTitle`, `metaDescription`, `canonicalURL`, `robotsMode`, `ogTitle`, `ogDescription`, and `ogImage`, then assert each configured override wins and the archive image is used only as fallback.

- [ ] **Step 2: Write failing route tests**

Create `tests/int/news-events-taxonomy-routes.int.spec.tsx`. Mock the News & Events loaders and `next/navigation`'s `notFound`. Assert:

- category route passes `{ kind: 'category', slug: 'campus-life' }` to the shared archive page;
- tag route passes `{ kind: 'tag', slug: 'open-day' }`;
- the shared archive query overwrites conflicting `category` or `tag` search parameters;
- a missing term calls `notFound()`;
- metadata uses the dedicated pathname and taxonomy term.

- [ ] **Step 3: Run both focused suites and confirm the missing APIs fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-metadata.int.spec.ts tests/int/news-events-taxonomy-routes.int.spec.tsx
```

Expected: fail because the taxonomy metadata helper, shared archive page, and routes do not exist.

- [ ] **Step 4: Add request-cached taxonomy lookups**

In `src/lib/newsEvents.ts`, import `Category` and `Tag` types and add React `cache()` lookups:

```ts
export const getNewsEventCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const payload = await loadPayload()
  const result = await payload.find({
    collection: 'categories',
    depth: 1,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})

export const getNewsEventTagBySlug = cache(async (slug: string): Promise<Tag | null> => {
  const payload = await loadPayload()
  const result = await payload.find({
    collection: 'tags',
    depth: 1,
    limit: 1,
    where: { slug: { equals: slug } },
  })
  return result.docs[0] ?? null
})
```

Use request-level `cache`, not `unstable_cache`, so taxonomy SEO edits cannot become indefinitely stale behind the News & Events cache tag.

- [ ] **Step 5: Add taxonomy metadata**

In `src/lib/newsEventsMetadata.ts`, add `getNewsEventsTaxonomyMetadata`. Resolve title in this order: `term.metaTitle`, then `${term.title} | News & Events`. Resolve description from `term.metaDescription`, `term.description`, `settings.metaDescription`, then `settings.description`. Resolve canonical through `resolveCanonicalURL({ canonicalURL: term.canonicalURL, resolvedPath: pathname })`. Resolve robots from `term.robotsMode` and inherited robots. Prefer term Open Graph fields/image, falling back to the News & Events settings fields/image. Use `website` Open Graph type.

- [ ] **Step 6: Extract the shared server archive page**

Move the loading and `<NewsEventsFeed>` rendering from `src/app/(frontend)/news-events/page.tsx` into `src/components/news-events/NewsEventsArchivePage.tsx`:

```ts
type Props = {
  fixedTaxonomy?: NewsEventsTaxonomyContext
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function NewsEventsArchivePage({ fixedTaxonomy, searchParams }: Props) {
  const settings = await getNewsEventsSettings()
  const parsedQuery = parseNewsEventsSearchParams(await searchParams)
  const query = fixedTaxonomy
    ? { ...parsedQuery, [fixedTaxonomy.kind]: fixedTaxonomy.slug }
    : parsedQuery
  const limit = normalizeNewsEventsPageSize(settings.entriesPerPage)
  const nowISO = new Date().toISOString()

  const [categories, tags, archiveData, upcomingEvents, pastEvents] = await Promise.all([
    getNewsEventCategories().catch(() => []),
    getNewsEventTags().catch(() => []),
    query.type === 'event'
      ? Promise.resolve(createEmptyNewsEventsPage())
      : getNewsEventsArchivePage(query, limit, nowISO).catch(() => createEmptyNewsEventsPage()),
    query.type === 'event'
      ? getUpcomingEventsPage(query, limit, nowISO).catch(() => createEmptyNewsEventsPage())
      : Promise.resolve(undefined),
    query.type === 'event'
      ? getPastEventsPage(query, limit, nowISO).catch(() => createEmptyNewsEventsPage())
      : Promise.resolve(undefined),
  ])

  return (
    <NewsEventsFeed
      archiveData={archiveData}
      categories={categories}
      pastEvents={pastEvents}
      query={query}
      settings={settings}
      tags={tags}
      taxonomyContext={fixedTaxonomy}
      upcomingEvents={upcomingEvents}
    />
  )
}
```

Keep root `generateMetadata` unchanged and reduce the root page to rendering this shared component.

- [ ] **Step 7: Add the category and tag route modules**

Each route must:

- await `params`;
- resolve the corresponding term;
- call `notFound()` only when the term is absent;
- render `NewsEventsArchivePage` with the fixed taxonomy context;
- load term, settings, and inherited robots concurrently in `generateMetadata`;
- return `{}` when the term is absent;
- call `getNewsEventsTaxonomyMetadata` with the dedicated pathname.

- [ ] **Step 8: Run focused route and metadata tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-taxonomy-routes.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts tests/int/news-events-feed.int.spec.tsx
```

Expected: all tests pass.

### Task 3: Extend Sitemap Taxonomy Coverage

**Files:**
- Modify: `src/app/sitemap.ts`
- Modify: `tests/int/sitemap.int.spec.ts`

**Interfaces:**
- Consumes: Task 1's `getNewsEventsCategoryPath` and `getNewsEventsTagPath`
- Produces: canonical sitemap entries for eligible News & Events taxonomy terms

- [ ] **Step 1: Add News & Events-only taxonomy fixtures**

In `tests/int/sitemap.int.spec.ts`, update the eligible News & Events fixture with:

```ts
primaryCategory: { id: 102, slug: 'community', title: 'Community' },
categories: [{ id: 103, slug: 'open-days', title: 'Open Days' }],
tags: [{ id: 301, slug: 'featured-event', title: 'Featured Event' }],
```

Add category/tag collection documents for those IDs, plus unused, noindex, and sitemap-excluded terms. Add a noindex News & Events record using otherwise-unused taxonomy terms to prove ineligible content does not create archive entries.

- [ ] **Step 2: Add failing sitemap assertions**

Assert the sitemap contains:

```ts
expect(urls).toContain('http://localhost:3000/news-events/category/community')
expect(urls).toContain('http://localhost:3000/news-events/category/open-days')
expect(urls).toContain('http://localhost:3000/news-events/tag/featured-event')
```

Assert it contains no `news-events?category=`, `news-events?tag=`, unused, noindex, or excluded taxonomy URL. Preserve all existing article/review assertions.

- [ ] **Step 3: Run the sitemap test and confirm the new paths fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/sitemap.int.spec.ts
```

Expected: existing sitemap assertions pass and the three dedicated News & Events taxonomy assertions fail.

- [ ] **Step 4: Track eligible News & Events taxonomy usage separately**

In `src/app/sitemap.ts`, add `newsEventCategoryIDs` and `newsEventTagIDs`. While iterating fetched News & Events records, add relationships only when the record passes `isRouteEligibleForSitemap`. Include the primary category, all additional category relationship IDs, and all tag relationship IDs.

Do not add these IDs to the existing article/review usage sets because that would create empty article or review taxonomy archives.

- [ ] **Step 5: Emit dedicated eligible taxonomy paths**

Import the Task 1 path helpers. During the existing category and tag document loops, independently add News & Events paths when the term ID appears in the corresponding News & Events set and the term passes `isRouteEligibleForSitemap`. Reuse `addEntry` so identical pathnames deduplicate.

- [ ] **Step 6: Run the sitemap suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/sitemap.int.spec.ts tests/int/seo-contract.int.spec.ts
```

Expected: all sitemap and SEO contract tests pass.

### Task 4: Document And Verify The Complete Feature

**Files:**
- Modify: `docs/guides/news-events.md`
- Modify: `docs/architecture/feature-inventory.md`
- Verify: all files changed in Tasks 1–3

**Interfaces:**
- Consumes: the completed route, metadata, link, and sitemap contracts
- Produces: accurate operator and architecture documentation with no remaining known-gap section

- [ ] **Step 1: Update News & Events documentation**

Document that category and tag links have dedicated public archives, combined filters remain query parameters, and only eligible used terms enter the sitemap.

- [ ] **Step 2: Update the feature inventory**

Add both taxonomy route families to the Public Routes table. Update the sitemap description to include used News & Events topics and tags. Remove the remaining sitemap limitation and remove `Known Implementation Boundaries` when the section has no bullets.

- [ ] **Step 3: Run focused linting**

Run ESLint over every changed TypeScript/TSX file:

```bash
pnpm exec eslint src/lib/newsEventsPaths.ts src/lib/newsEvents.ts src/lib/newsEventsMetadata.ts src/components/news-events/NewsEventsFeed.tsx src/components/news-events/NewsEventStory.tsx src/components/news-events/NewsEventsArchivePage.tsx 'src/app/(frontend)/news-events/page.tsx' 'src/app/(frontend)/news-events/category/[slug]/page.tsx' 'src/app/(frontend)/news-events/tag/[slug]/page.tsx' src/app/sitemap.ts tests/int/news-events-taxonomy-paths.int.spec.tsx tests/int/news-events-taxonomy-routes.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/sitemap.int.spec.ts
```

Expected: exit code 0 with no warnings or errors.

- [ ] **Step 4: Run TypeScript validation**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
```

Expected: exit code 0.

- [ ] **Step 5: Run the combined focused regression suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-taxonomy-paths.int.spec.tsx tests/int/news-events-taxonomy-routes.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts tests/int/news-events-feed.int.spec.tsx tests/int/news-event-story.int.spec.tsx tests/int/sitemap.int.spec.ts tests/int/seo-contract.int.spec.ts tests/int/admin-documentation.int.spec.ts
```

Expected: all test files pass.

- [ ] **Step 6: Check patch integrity**

Run:

```bash
git diff --check
```

Expected: exit code 0 with no whitespace errors.
