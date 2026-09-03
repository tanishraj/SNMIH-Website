# Dynamic Page Header Breadcrumbs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Page Header breadcrumbs automatically follow the current Payload Page hierarchy, with custom and hidden editor modes and matching JSON-LD.

**Architecture:** A pure shared resolver turns a populated Page parent chain into canonical breadcrumb items. Production and live-preview renderers receive the current Page as render context and pass the automatic trail to every Page Header, while the route uses the same resolver for structured data.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19 server/client components, TypeScript, Vitest, React DOM server rendering.

## Global Constraints

- `automatic` is the default and runtime fallback when `breadcrumbMode` is absent.
- Homepage automatic breadcrumbs are always empty.
- Automatic labels come from Page titles, never formatted slugs.
- The current page is visible, unlinked, and marked with `aria-current="page"`.
- Existing custom breadcrumb rows remain stored and are only used in `custom` mode.
- The Page Header component must not query Payload.
- Parent traversal must be cycle-bounded and fail soft on incomplete relationships.
- Reusable Page Headers use the containing Page's breadcrumb context.
- Do not add a standalone breadcrumb block or change article, review, or News & Events templates.
- Do not commit implementation changes unless the user explicitly authorizes it.

---

## File map

- Create `src/lib/pageBreadcrumbs.ts`: pure automatic/custom/effective breadcrumb resolution and first-Page-Header lookup.
- Create `tests/int/page-breadcrumbs.int.spec.tsx`: resolver, rendering, schema, structured-data, homepage and reusable-section coverage.
- Modify `src/blocks/PageHeader/config.ts`: add `breadcrumbMode` and conditionally reveal custom rows.
- Modify `src/blocks/PageHeader/Component.tsx`: consume resolved items and improve current-item semantics.
- Modify `src/blocks/renderPageBlocks.tsx`: establish and propagate production page render context.
- Modify `src/blocks/renderLivePreviewPageBlocks.tsx`: propagate equivalent preview context.
- Modify `src/app/(frontend)/PageContent.tsx`: pass Page and homepage state into the production renderer.
- Modify `src/app/(frontend)/page.tsx`: identify the configured homepage render.
- Modify `src/components/live-preview/PageLivePreview.tsx`: pass live Page data and homepage state into preview rendering.
- Modify `src/app/(frontend)/preview/page/[id]/page.tsx`: determine whether the previewed Page is the configured homepage.
- Modify `src/app/(frontend)/[...slug]/page.tsx`: generate `BreadcrumbList` from the shared resolver.
- Regenerate `src/payload-types.ts`: include `breadcrumbMode` in `PageHeaderBlock`.

---

### Task 1: Create the pure page-breadcrumb resolver

**Files:**
- Create: `src/lib/pageBreadcrumbs.ts`
- Create: `tests/int/page-breadcrumbs.int.spec.tsx`

**Interfaces:**
- Produces: `ResolvedPageBreadcrumb = { label: string; url?: string }`
- Produces: `resolveAutomaticPageBreadcrumbs(page: Page, options?: { isHomepage?: boolean }): ResolvedPageBreadcrumb[]`
- Produces: `resolveCustomPageBreadcrumbs(items): ResolvedPageBreadcrumb[]`
- Produces: `resolvePageHeaderBreadcrumbs(args): ResolvedPageBreadcrumb[]`
- Produces: `resolvePageBreadcrumbsForLayout(page: Page, options?): ResolvedPageBreadcrumb[]`

- [ ] **Step 1: Write failing resolver tests**

Add tests covering a root page, a three-level populated hierarchy, homepage suppression, missing mode fallback, custom mode, hidden mode and a circular in-memory relationship:

```tsx
import { describe, expect, it } from 'vitest'
import {
  resolveAutomaticPageBreadcrumbs,
  resolvePageHeaderBreadcrumbs,
} from '@/lib/pageBreadcrumbs'
import type { Page } from '@/payload-types'

const page = (value: Partial<Page>): Page => value as Page

it('uses CMS titles and canonical hierarchy paths', () => {
  const academics = page({ id: 'academics', parent: null, slug: 'academics', title: 'Academics' })
  const undergraduate = page({
    id: 'undergraduate',
    parent: academics,
    slug: 'undergraduate',
    title: 'Undergraduate Programmes',
  })
  const mbbs = page({ id: 'mbbs', parent: undergraduate, slug: 'mbbs', title: 'MBBS' })

  expect(resolveAutomaticPageBreadcrumbs(mbbs)).toEqual([
    { label: 'Home', url: '/' },
    { label: 'Academics', url: '/academics' },
    { label: 'Undergraduate Programmes', url: '/academics/undergraduate' },
    { label: 'MBBS', url: '/academics/undergraduate/mbbs' },
  ])
})

it('returns no automatic trail for the homepage', () => {
  expect(resolveAutomaticPageBreadcrumbs(page({ id: 'home', slug: 'home', title: 'Home' }), {
    isHomepage: true,
  })).toEqual([])
})

it('defaults an absent mode to automatic and supports custom and hidden modes', () => {
  const automatic = [{ label: 'Home', url: '/' }, { label: 'About', url: '/about' }]
  const custom = [{ label: 'Start', linkType: 'custom' as const, url: '/' }, { label: 'About' }]

  expect(resolvePageHeaderBreadcrumbs({ automatic, breadcrumbs: custom })).toEqual(automatic)
  expect(resolvePageHeaderBreadcrumbs({ automatic, breadcrumbMode: 'custom', breadcrumbs: custom }))
    .toEqual([{ label: 'Start', url: '/' }, { label: 'About' }])
  expect(resolvePageHeaderBreadcrumbs({ automatic, breadcrumbMode: 'hidden', breadcrumbs: custom }))
    .toEqual([])
})
```

- [ ] **Step 2: Run the tests and verify the missing module failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx`

Expected: FAIL because `@/lib/pageBreadcrumbs` does not exist.

- [ ] **Step 3: Implement the resolver**

Create `src/lib/pageBreadcrumbs.ts` with structural breadcrumb input types, a maximum traversal depth of 32, string-normalized visited IDs, and these rules:

```ts
import { getPageHref, isPageDoc } from '@/lib/pagePaths'
import type { Page, PageHeaderBlock } from '@/payload-types'

export type ResolvedPageBreadcrumb = { label: string; url?: string }
type AutomaticOptions = { isHomepage?: boolean }
type ManualBreadcrumb = NonNullable<PageHeaderBlock['breadcrumbs']>[number]

export function resolveAutomaticPageBreadcrumbs(
  page: Page,
  { isHomepage = false }: AutomaticOptions = {},
): ResolvedPageBreadcrumb[] {
  if (isHomepage) return []

  const chain: Page[] = []
  const visited = new Set<string>()
  let current: Page | null = page

  while (current && chain.length < 32) {
    const key = String(current.id)
    if (visited.has(key)) break
    visited.add(key)
    chain.unshift(current)
    current = isPageDoc(current.parent) ? current.parent : null
  }

  const segments: string[] = []
  return [
    { label: 'Home', url: '/' },
    ...chain.flatMap((entry) => {
      const label = entry.title?.trim()
      const slug = entry.slug?.trim()
      if (!label || !slug) return []
      segments.push(slug)
      return [{ label, url: `/${segments.join('/')}` }]
    }),
  ]
}

export function resolveCustomPageBreadcrumbs(
  items: ManualBreadcrumb[] | null | undefined,
): ResolvedPageBreadcrumb[] {
  return (items ?? []).flatMap((item) => {
    const label = item.label?.trim()
    if (!label) return []
    const url = item.linkType === 'page'
      ? getPageHref(item.page)
      : item.linkType === 'custom'
        ? item.url?.trim() || undefined
        : undefined
    return [{ label, url }]
  })
}

export function resolvePageHeaderBreadcrumbs({
  automatic,
  breadcrumbMode = 'automatic',
  breadcrumbs,
}: {
  automatic: ResolvedPageBreadcrumb[]
  breadcrumbMode?: 'automatic' | 'custom' | 'hidden' | null
  breadcrumbs?: ManualBreadcrumb[] | null
}): ResolvedPageBreadcrumb[] {
  if (breadcrumbMode === 'hidden') return []
  if (breadcrumbMode === 'custom') return resolveCustomPageBreadcrumbs(breadcrumbs)
  return automatic
}
```

Also add a bounded recursive lookup for the first Page Header in `Page['layout']`, including populated reusable sections, and implement `resolvePageBreadcrumbsForLayout` by combining that block's effective mode with the automatic trail. If no Page Header is found, return the automatic trail.

- [ ] **Step 4: Run the resolver tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx`

Expected: PASS for the resolver tests.

- [ ] **Step 5: Commit when authorized**

```bash
git add src/lib/pageBreadcrumbs.ts tests/int/page-breadcrumbs.int.spec.tsx
git commit -m "feat: resolve page breadcrumbs"
```

---

### Task 2: Add the Payload editor mode and regenerate types

**Files:**
- Modify: `src/blocks/PageHeader/config.ts:7-55`
- Modify: `src/payload-types.ts`
- Test: `tests/int/page-breadcrumbs.int.spec.tsx`

**Interfaces:**
- Consumes: `PageHeaderBlock['breadcrumbMode']`
- Produces: Payload field values `'automatic' | 'custom' | 'hidden'`

- [ ] **Step 1: Add a failing schema test**

```tsx
import { PageHeaderBlock } from '@/blocks/PageHeader/config'

it('exposes automatic, custom, and hidden breadcrumb modes', () => {
  const tabs = PageHeaderBlock.fields[0]
  expect(tabs.type).toBe('tabs')
  const contentFields = tabs.tabs[0].fields
  const mode = contentFields.find((field) => 'name' in field && field.name === 'breadcrumbMode')
  const breadcrumbs = contentFields.find((field) => 'name' in field && field.name === 'breadcrumbs')

  expect(mode).toMatchObject({ defaultValue: 'automatic', required: true })
  expect(mode && 'options' in mode ? mode.options : []).toEqual([
    { label: 'Automatic — use page hierarchy', value: 'automatic' },
    { label: 'Custom — configure trail below', value: 'custom' },
    { label: 'Hidden', value: 'hidden' },
  ])
  expect(breadcrumbs?.admin?.condition({}, { breadcrumbMode: 'custom' })).toBe(true)
  expect(breadcrumbs?.admin?.condition({}, { breadcrumbMode: 'automatic' })).toBe(false)
})
```

- [ ] **Step 2: Verify the schema test fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx`

Expected: FAIL because `breadcrumbMode` is absent.

- [ ] **Step 3: Add the schema field and condition**

Add `breadcrumbMode` before `breadcrumbsField` in the Content tab. Update the array description to describe custom mode, and add this condition:

```ts
type BreadcrumbModeSiblingData = { breadcrumbMode?: 'automatic' | 'custom' | 'hidden' | null }
const usesCustomBreadcrumbs = (_data: unknown, siblingData: BreadcrumbModeSiblingData) =>
  siblingData?.breadcrumbMode === 'custom'

const breadcrumbModeField: SelectField = {
  name: 'breadcrumbMode',
  label: 'Breadcrumb Display',
  type: 'select',
  defaultValue: 'automatic',
  required: true,
  options: [
    { label: 'Automatic — use page hierarchy', value: 'automatic' },
    { label: 'Custom — configure trail below', value: 'custom' },
    { label: 'Hidden', value: 'hidden' },
  ],
}
```

Set `breadcrumbsField.admin.condition = usesCustomBreadcrumbs`.

- [ ] **Step 4: Regenerate Payload types**

Run: `pnpm run generate:types`

Expected: `PageHeaderBlock` in `src/payload-types.ts` contains `breadcrumbMode: 'automatic' | 'custom' | 'hidden'`.

- [ ] **Step 5: Run the schema tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx`

Expected: PASS.

- [ ] **Step 6: Commit when authorized**

```bash
git add src/blocks/PageHeader/config.ts src/payload-types.ts tests/int/page-breadcrumbs.int.spec.tsx
git commit -m "feat: configure breadcrumb display"
```

---

### Task 3: Propagate automatic breadcrumbs through production rendering

**Files:**
- Modify: `src/blocks/PageHeader/Component.tsx:15-120`
- Modify: `src/blocks/renderPageBlocks.tsx:55-180`
- Modify: `src/app/(frontend)/PageContent.tsx`
- Modify: `src/app/(frontend)/page.tsx`
- Test: `tests/int/page-breadcrumbs.int.spec.tsx`

**Interfaces:**
- Consumes: `resolveAutomaticPageBreadcrumbs` and `resolvePageHeaderBreadcrumbs`
- Produces: `PageRenderContext = { page?: Page | null; isHomepage?: boolean }`
- Produces: optional `automaticBreadcrumbs` prop on `PageHeaderBlockComponent`

- [ ] **Step 1: Add failing rendered-markup tests**

Render `PageContent` with a nested Page containing a Page Header and assert:

```tsx
const html = renderToStaticMarkup(
  <PageContent page={nestedPageWithPageHeader} />,
)
expect(html).toContain('href="/academics"')
expect(html).toContain('Undergraduate Programmes')
expect(html).toContain('aria-current="page"')

const homepageHtml = renderToStaticMarkup(
  <PageContent isHomepage page={nestedPageWithPageHeader} />,
)
expect(homepageHtml).not.toContain('aria-label="Breadcrumb"')
```

Add custom and hidden Page Header cases. Add a reusable section containing a Page Header and assert it receives the containing Page trail.

- [ ] **Step 2: Verify the rendering tests fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx`

Expected: FAIL because Page context is not propagated.

- [ ] **Step 3: Update Page Header rendering**

Replace its local raw-row filtering with the shared resolver:

```tsx
type PageHeaderBlockLike = {
  automaticBreadcrumbs?: ResolvedPageBreadcrumb[]
  breadcrumbMode?: 'automatic' | 'custom' | 'hidden' | null
  breadcrumbs?: BreadcrumbItem[] | null
  // existing fields remain unchanged
}

const resolvedBreadcrumbs = resolvePageHeaderBreadcrumbs({
  automatic: automaticBreadcrumbs ?? [],
  breadcrumbMode,
  breadcrumbs,
})
```

Change `Breadcrumbs` to consume `ResolvedPageBreadcrumb[]`. Link `crumb.url` only when the item is not last, and render `aria-current="page"` on the last item's `<span>`.

- [ ] **Step 4: Add renderer context and propagate it recursively**

In `renderPageBlocks.tsx`, add:

```tsx
export type PageRenderContext = {
  isHomepage?: boolean
  page?: Page | null
}

type RenderArgs = {
  automaticBreadcrumbs: ResolvedPageBreadcrumb[]
}

export function renderPageBlocks(
  blocks?: PageBlock[] | null,
  context: PageRenderContext = {},
) {
  const args: RenderArgs = {
    automaticBreadcrumbs: context.page
      ? resolveAutomaticPageBreadcrumbs(context.page, { isHomepage: context.isHomepage })
      : [],
  }
  // map through renderSingleBlock(block, index, args)
}
```

Pass `automaticBreadcrumbs` only to `PageHeaderBlockComponent`. Thread the same `args` through reusable-section recursion so reusable Page Headers use the containing Page.

- [ ] **Step 5: Pass Page context from `PageContent` and identify `/`**

```tsx
export function PageContent({
  isHomepage = false,
  page,
}: {
  isHomepage?: boolean
  page: Page | SystemPage
}) {
  if ('type' in page) {
    return <div data-system-page-root="true"><RenderBlocks blocks={getRenderableBlocks(page)} /></div>
  }
  return renderPageBlocks(page.layout, { isHomepage, page })
}
```

Update both homepage Page renders in `src/app/(frontend)/page.tsx` to use `<PageContent isHomepage page={...} />`. Internal catch-all pages retain the default `false` value.

- [ ] **Step 6: Run targeted and existing page-block tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx tests/int/page-blocks.int.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit when authorized**

```bash
git add src/blocks/PageHeader/Component.tsx src/blocks/renderPageBlocks.tsx 'src/app/(frontend)/PageContent.tsx' 'src/app/(frontend)/page.tsx' tests/int/page-breadcrumbs.int.spec.tsx
git commit -m "feat: render automatic breadcrumbs"
```

---

### Task 4: Preserve breadcrumb behavior in live preview

**Files:**
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx:45-215`
- Modify: `src/components/live-preview/PageLivePreview.tsx`
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Test: `tests/int/page-breadcrumbs.int.spec.tsx`
- Test: `tests/int/live-preview-renderer.int.spec.tsx`

**Interfaces:**
- Consumes: `PageRenderContext` and `resolveAutomaticPageBreadcrumbs`
- Produces: optional sixth `context` argument on `renderLivePreviewPageBlocks`
- Produces: required `isHomepage` prop on `PageLivePreview`

- [ ] **Step 1: Add a failing live-preview breadcrumb test**

Call `renderLivePreviewPageBlocks` with a nested live Page as context and assert the same trail as production. Add a homepage context case that produces no breadcrumb. Keep the context argument optional so existing renderer tests and thumbnail fixtures remain valid.

- [ ] **Step 2: Verify the preview test fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx`

Expected: FAIL because the preview renderer does not accept Page context.

- [ ] **Step 3: Propagate preview render context**

Append an optional context argument:

```tsx
export function renderLivePreviewPageBlocks(
  blocks: Page['layout'] | null | undefined,
  snapshot: ReviewPreviewSnapshot,
  newsEventsSnapshot: NewsEventsPreviewSnapshot,
  officeLocations: SiteOfficeLocation[],
  eventGalleryAlbums: EventGalleryAlbum[],
  context: PageRenderContext = {},
) {
  const args: SnapshotArgs = {
    snapshot,
    newsEventsSnapshot,
    officeLocations,
    eventGalleryAlbums,
    automaticBreadcrumbs: context.page
      ? resolveAutomaticPageBreadcrumbs(context.page, { isHomepage: context.isHomepage })
      : [],
  }
  // preserve args through reusable-section recursion
}
```

Pass `automaticBreadcrumbs` into preview Page Header instances.

- [ ] **Step 4: Pass live Page and homepage state**

Add `isHomepage: boolean` to `PageLivePreview` and call the renderer with `{ isHomepage, page: data }`.

In the preview route, fetch the draft Page Settings global with the Page, use `getPageID(pageSettings.homepage)` from `src/lib/pagePaths.ts`, compare IDs with `String(...)`, and pass the boolean to `PageLivePreview`:

```ts
const isHomepage = String(getPageID(pageSettings.homepage)) === String(page.id)
```

- [ ] **Step 5: Run preview and import-boundary tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts`

Expected: PASS with no server-only import crossing into `PageLivePreview`.

- [ ] **Step 6: Commit when authorized**

```bash
git add src/blocks/renderLivePreviewPageBlocks.tsx src/components/live-preview/PageLivePreview.tsx 'src/app/(frontend)/preview/page/[id]/page.tsx' tests/int/page-breadcrumbs.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx
git commit -m "feat: preview automatic breadcrumbs"
```

---

### Task 5: Unify breadcrumb JSON-LD with the rendered trail

**Files:**
- Modify: `src/lib/pageBreadcrumbs.ts`
- Modify: `src/app/(frontend)/[...slug]/page.tsx:61-88`
- Test: `tests/int/page-breadcrumbs.int.spec.tsx`

**Interfaces:**
- Consumes: `resolvePageBreadcrumbsForLayout(page, options)`
- Produces: `toBreadcrumbListStructuredData(items, toAbsoluteUrl)` or an equivalent pure formatter

- [ ] **Step 1: Add failing effective-layout and JSON-LD tests**

Cover automatic, custom and hidden first Page Header modes. Assert title-based names, one-based positions, absolute item URLs and no `BreadcrumbList` for an empty trail:

```tsx
expect(toBreadcrumbListStructuredData([
  { label: 'Home', url: '/' },
  { label: 'Academics', url: '/academics' },
], (path) => `https://example.edu${path}`)).toEqual({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', item: 'https://example.edu/', name: 'Home', position: 1 },
    { '@type': 'ListItem', item: 'https://example.edu/academics', name: 'Academics', position: 2 },
  ],
})
```

- [ ] **Step 2: Verify the JSON-LD test fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx`

Expected: FAIL because the formatter or effective layout resolver is incomplete.

- [ ] **Step 3: Implement the pure formatter and layout selection**

The formatter returns `null` for an empty list. For each non-empty item, include `item` only when `url` exists and convert it through the injected absolute-URL function. `resolvePageBreadcrumbsForLayout` must recursively inspect populated reusable sections to find the first Page Header, bounded to 10 reusable-section levels.

- [ ] **Step 4: Replace slug-derived JSON-LD in the catch-all route**

```tsx
const resolvedBreadcrumbs = resolvePageBreadcrumbsForLayout(page)
const breadcrumbStructuredData = toBreadcrumbListStructuredData(
  resolvedBreadcrumbs,
  toAbsoluteSiteUrl,
)

const structuredData = [
  { '@context': 'https://schema.org', '@type': 'WebPage', name: page.title, url: pageUrl },
  ...(breadcrumbStructuredData ? [breadcrumbStructuredData] : []),
]
```

Delete the existing slug-humanization logic.

- [ ] **Step 5: Run breadcrumb and page tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx`

Expected: PASS.

- [ ] **Step 6: Commit when authorized**

```bash
git add src/lib/pageBreadcrumbs.ts 'src/app/(frontend)/[...slug]/page.tsx' tests/int/page-breadcrumbs.int.spec.tsx
git commit -m "fix: align breadcrumb structured data"
```

---

### Task 6: Complete regression validation

**Files:**
- Verify all files listed above
- Modify only if validation reveals a breadcrumb-related defect

**Interfaces:**
- Consumes all preceding tasks
- Produces a release-ready dynamic breadcrumb change set

- [ ] **Step 1: Check formatting and generated-schema drift**

Run:

```bash
pnpm run generate:types
git diff --check
```

Expected: type generation produces no additional unexpected diff; `git diff --check` exits 0.

- [ ] **Step 2: Run focused linting**

Run:

```bash
pnpm exec eslint \
  src/lib/pageBreadcrumbs.ts \
  src/blocks/PageHeader/config.ts \
  src/blocks/PageHeader/Component.tsx \
  src/blocks/renderPageBlocks.tsx \
  src/blocks/renderLivePreviewPageBlocks.tsx \
  'src/app/(frontend)/PageContent.tsx' \
  'src/app/(frontend)/page.tsx' \
  'src/app/(frontend)/[...slug]/page.tsx' \
  'src/app/(frontend)/preview/page/[id]/page.tsx' \
  src/components/live-preview/PageLivePreview.tsx \
  tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: PASS with no errors or warnings in changed files.

- [ ] **Step 3: Run TypeScript**

Run: `pnpm exec tsc --noEmit --incremental false`

Expected: PASS.

- [ ] **Step 4: Run the full integration suite**

Run: `pnpm run test:int`

Expected: PASS, including all breadcrumb, page-renderer and live-preview tests.

- [ ] **Step 5: Inspect the final diff**

Run:

```bash
git diff --stat
git diff --check
git status --short
```

Expected: only the approved spec, plan and breadcrumb implementation files are changed; nothing is staged.

- [ ] **Step 6: Commit when authorized**

```bash
git add docs/superpowers/specs/2026-08-14-dynamic-page-header-breadcrumbs-design.md docs/superpowers/plans/2026-08-14-dynamic-page-header-breadcrumbs.md src tests
git commit -m "feat: add dynamic page breadcrumbs"
```
