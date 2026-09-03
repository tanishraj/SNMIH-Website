# Live Preview Server Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Payload and `sharp` out of the live-preview browser bundle while rendering real, read-only published Review Feed and Rating Spotlight data in authenticated preview.

**Architecture:** Separate Payload-backed queries from client-safe review types, calculations, and block presentation components. The authenticated preview route inspects the draft layout, fetches only the required published-review snapshot in parallel, and passes that serializable data to a dedicated client-safe block renderer.

**Tech Stack:** Next.js 16 App Router, React 19 Server and Client Components, Payload CMS 3 Local API, TypeScript, Vitest, Testing Library.

## Global Constraints

- Normal public pages continue querying current published review data on the server.
- Authenticated live preview displays current published review data without browser-side Payload imports.
- Reviews are read-only in page blocks and live preview; editors manage them only in the Payload Reviews collection.
- Rating Spotlight manual values remain editable only in Manual data mode; Live data mode is read-only.
- Review Feed supports every unique normalized `pageSize` in the draft layout.
- Review Feed “Load more” continues using `/api/review-feed`.
- Failed auxiliary preview queries render deterministic empty/no-data states without failing page preview.
- No visual design, moderation workflow, publication rule, or review API behavior changes.
- Do not stage or commit any file; preserve the user's existing index exactly.

---

## File Structure

- `src/lib/reviewRatingShared.ts`: new browser-safe rating types and calculations.
- `src/lib/reviewFeedShared.ts`: add browser-safe page-size normalization and empty-page creation.
- `src/lib/reviewFeed.ts` and `src/lib/reviewRatingSummary.ts`: retain only server-backed querying and declare the server boundary.
- `src/lib/reviewPreviewShared.ts`: new serializable snapshot contract and pure requirement collector.
- `src/lib/reviewPreviewSnapshot.ts`: new server-only snapshot loader.
- `src/blocks/ReviewFeed/Presentation.tsx` and `src/blocks/RatingSpotlight/Presentation.tsx`: new client-safe presentation adapters.
- `src/blocks/ReviewFeed/PreviewComponent.tsx` and `src/blocks/RatingSpotlight/PreviewComponent.tsx`: new snapshot-backed preview adapters.
- Existing review block `Component.tsx` files: become thin server adapters.
- `src/blocks/renderLivePreviewPageBlocks.tsx`: new client-safe block renderer.
- Preview route and `PageLivePreview.tsx`: load, serialize, and consume the snapshot.
- Focused tests: validate data collection, read-only rendering, import boundaries, fallbacks, and production build.

---

### Task 1: Establish client-safe review primitives and explicit server boundaries

**Files:**

- Create: `src/lib/reviewRatingShared.ts`
- Modify: `src/lib/reviewFeedShared.ts`
- Modify: `src/lib/reviewFeed.ts`
- Modify: `src/lib/reviewRatingSummary.ts`
- Modify: `src/components/review-feed.tsx`
- Modify: `tests/int/review-feed-data.int.spec.ts`
- Modify: `tests/int/review-rating-summary.int.spec.ts`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `vitest.config.mts`
- Create: `tests/helpers/server-only.ts`

**Interfaces:**

- Produces `normalizeReviewFeedPageSize(value: number | null | undefined): number`.
- Produces `createEmptyReviewFeedPage(): PublicReviewFeedPage`.
- Produces client-safe `PublishedReviewRatingSummary` and `PublishedReviewRatingDistribution` types and calculation functions.
- Payload query modules remain importable only from server code.

- [ ] **Step 1: Write failing shared-helper and boundary tests**

Add these exact expectations to the existing data tests:

```ts
expect(normalizeReviewFeedPageSize(undefined)).toBe(4)
expect(normalizeReviewFeedPageSize(0)).toBe(1)
expect(normalizeReviewFeedPageSize(20)).toBe(12)
expect(normalizeReviewFeedPageSize(2.5)).toBe(4)
expect(createEmptyReviewFeedPage()).toEqual({
  docs: [],
  hasNextPage: false,
  page: 1,
  totalPages: 0,
})
expect(calculatePublishedReviewRatingSummary([1, 2, 3, 4, 10])).toEqual({
  average: 4,
  count: 20,
})
expect(readFileSync('src/lib/reviewFeed.ts', 'utf8')).toContain("import 'server-only'")
expect(readFileSync('src/lib/reviewRatingSummary.ts', 'utf8')).toContain("import 'server-only'")
```

- [ ] **Step 2: Run the tests and confirm the new exports are missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed-data.int.spec.ts tests/int/review-rating-summary.int.spec.ts
```

Expected: FAIL because the shared helpers and `reviewRatingShared.ts` do not exist.

- [ ] **Step 3: Implement the feed helpers**

Add to `reviewFeedShared.ts`:

```ts
export const normalizeReviewFeedPageSize = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isInteger(value)
    ? Math.min(REVIEW_FEED_MAX_PAGE_SIZE, Math.max(1, value))
    : REVIEW_FEED_DEFAULT_PAGE_SIZE

export const createEmptyReviewFeedPage = (): PublicReviewFeedPage => ({
  docs: [],
  hasNextPage: false,
  page: 1,
  totalPages: 0,
})
```

Move the rating types and pure calculation functions unchanged into `reviewRatingShared.ts`. Re-export them from `reviewRatingSummary.ts` for server callers, while browser-safe consumers import directly from `reviewRatingShared.ts`.

- [ ] **Step 4: Add the explicit server-only marker**

Run:

```bash
pnpm add server-only
```

Place `import 'server-only'` before Payload imports in both query modules. Add this Vitest alias:

```ts
resolve: {
  alias: {
    'server-only': new URL('./tests/helpers/server-only.ts', import.meta.url).pathname,
  },
},
```

Create `tests/helpers/server-only.ts` with:

```ts
export {}
```

- [ ] **Step 5: Run the focused tests**

Run the Step 2 command.

Expected: both files PASS.

- [ ] **Step 6: Audit without staging**

Run `git diff --check && git status --short`.

Expected: no whitespace errors and all Task 1 changes remain unstaged.

---

### Task 2: Build the server-fetched preview snapshot

**Files:**

- Create: `src/lib/reviewPreviewShared.ts`
- Create: `src/lib/reviewPreviewSnapshot.ts`
- Create: `tests/int/review-preview-snapshot.int.spec.ts`

**Interfaces:**

- Consumes Task 1's feed helpers and client-safe rating types.
- Produces `ReviewPreviewSnapshot`, `getReviewPreviewRequirements(layout)`, and `loadReviewPreviewSnapshot(layout)`.

- [ ] **Step 1: Write failing requirement and loader tests**

Test duplicate/default/clamped page sizes, manual versus live Rating Spotlight blocks, layouts without review blocks, parallel successful queries, and per-query fallbacks:

```ts
expect(
  getReviewPreviewRequirements([
    { blockType: 'reviewFeed', pageSize: 4 },
    { blockType: 'reviewFeed', pageSize: 4 },
    { blockType: 'reviewFeed', pageSize: 20 },
    { blockType: 'ratingSpotlight', ratingData: { dataMode: 'manual' } },
  ] as Page['layout']),
).toEqual({ needsRatingDistribution: true, pageSizes: [4, 12] })

expect(
  getReviewPreviewRequirements([
    { blockType: 'ratingSpotlight', ratingData: { dataMode: 'live' } },
  ] as Page['layout']),
).toEqual({ needsRatingDistribution: true, pageSizes: [] })
```

- [ ] **Step 2: Run the new test and confirm the modules are missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-preview-snapshot.int.spec.ts
```

Expected: FAIL because the snapshot modules do not exist.

- [ ] **Step 3: Implement the serializable contract and pure collector**

Use this contract in `reviewPreviewShared.ts`:

```ts
export type ReviewPreviewSnapshot = {
  feedPagesBySize: Record<string, PublicReviewFeedPage>
  ratingDistribution: PublishedReviewRatingDistribution | null
}

export type ReviewPreviewRequirements = {
  needsRatingDistribution: boolean
  pageSizes: number[]
}

export const EMPTY_REVIEW_PREVIEW_SNAPSHOT: ReviewPreviewSnapshot = {
  feedPagesBySize: {},
  ratingDistribution: null,
}
```

Inspect `Page['layout']` once. Add normalized Review Feed sizes to a `Set<number>`. Request a rating distribution for every Review Feed and for Rating Spotlight blocks whose mode is live or unset. Return numerically sorted sizes.

- [ ] **Step 4: Implement parallel server loading and deterministic fallbacks**

Start all requests before awaiting:

```ts
export async function loadReviewPreviewSnapshot(
  layout?: Page['layout'] | null,
): Promise<ReviewPreviewSnapshot> {
  const requirements = getReviewPreviewRequirements(layout)
  const feedEntriesPromise = Promise.all(
    requirements.pageSizes.map(async (pageSize) => {
      const page = await getPublishedReviewFeedPage(1, pageSize).catch(createEmptyReviewFeedPage)
      return [String(pageSize), page] as const
    }),
  )
  const distributionPromise = requirements.needsRatingDistribution
    ? getPublishedReviewRatingDistribution().catch(() => null)
    : Promise.resolve(null)
  const [feedEntries, ratingDistribution] = await Promise.all([
    feedEntriesPromise,
    distributionPromise,
  ])

  return { feedPagesBySize: Object.fromEntries(feedEntries), ratingDistribution }
}
```

Mark `reviewPreviewSnapshot.ts` with `import 'server-only'`.

- [ ] **Step 5: Run snapshot tests**

Run the Step 2 command.

Expected: PASS, including no-query and fallback cases.

- [ ] **Step 6: Audit without staging**

Run `git diff --check && git status --short`.

Expected: no whitespace errors and all Task 2 files remain unstaged.

---

### Task 3: Separate review presentation from server data loading

**Files:**

- Create: `src/blocks/ReviewFeed/Presentation.tsx`
- Create: `src/blocks/ReviewFeed/PreviewComponent.tsx`
- Modify: `src/blocks/ReviewFeed/Component.tsx`
- Create: `src/blocks/RatingSpotlight/Presentation.tsx`
- Create: `src/blocks/RatingSpotlight/PreviewComponent.tsx`
- Modify: `src/blocks/RatingSpotlight/Component.tsx`
- Modify: `tests/int/review-feed.int.spec.tsx`
- Modify: `tests/int/rating-spotlight.int.spec.ts`
- Create: `tests/int/review-preview-blocks.int.spec.tsx`

**Interfaces:**

- Consumes `ReviewPreviewSnapshot` from Task 2.
- Produces `ReviewFeedBlockPresentation`, `ReviewFeedPreviewBlockComponent`, `RatingSpotlightBlockPresentation`, and `RatingSpotlightPreviewBlockComponent` without Payload imports.
- Preserves the existing server component exports and their public-page behavior.

- [ ] **Step 1: Write failing presentation and preview-adapter tests**

Render page-size-specific Review Feed data, manual Rating Spotlight data without a snapshot value, and live Rating Spotlight data from the snapshot:

```tsx
const feedHTML = renderToStaticMarkup(
  <ReviewFeedPreviewBlockComponent
    pageSize={8}
    snapshot={{
      feedPagesBySize: { '8': pageForEight },
      ratingDistribution: distribution,
    }}
    title="Published reviews"
  />,
)
expect(feedHTML).toContain('Review loaded for page size eight')

const manualHTML = renderToStaticMarkup(
  <RatingSpotlightPreviewBlockComponent
    ratingData={{ dataMode: 'manual', manualRating: 4.7, manualReviewCount: 52 }}
    snapshot={EMPTY_REVIEW_PREVIEW_SNAPSHOT}
    title="Manual rating"
  />,
)
expect(manualHTML).toContain('4.7 / 5')

const liveHTML = renderToStaticMarkup(
  <RatingSpotlightPreviewBlockComponent
    snapshot={{ feedPagesBySize: {}, ratingDistribution: distribution }}
    title="Live rating"
  />,
)
expect(liveHTML).toContain(`${distribution.average.toFixed(1)} / 5`)
```

Assert the generated HTML has no form, input, edit, save, or mutation controls for review records. Existing Review Feed “Load more” remains the only review-data interaction.

- [ ] **Step 2: Run focused block tests and confirm the new components are missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed.int.spec.tsx tests/int/rating-spotlight.int.spec.ts tests/int/review-preview-blocks.int.spec.tsx
```

Expected: FAIL because the presentation and preview adapter files do not exist.

- [ ] **Step 3: Extract Review Feed presentation**

Create this data-only presentation interface:

```ts
export type ReviewFeedBlockPresentationProps = ReviewFeedBlockLike & {
  initialPage: PublicReviewFeedPage
  summary: PublishedReviewRatingDistribution | null
}
```

Move title trimming, default labels, page-size normalization, and the existing `<ReviewFeed>` call into `ReviewFeedBlockPresentation`. Keep `ReviewFeedBlockComponent` as a thin async adapter that starts page and distribution queries together and then renders the presentation component.

Implement the preview adapter with no query import:

```tsx
const resolvedPageSize = normalizeReviewFeedPageSize(pageSize)

return (
  <ReviewFeedBlockPresentation
    {...props}
    initialPage={snapshot.feedPagesBySize[String(resolvedPageSize)] ?? createEmptyReviewFeedPage()}
    pageSize={resolvedPageSize}
    summary={snapshot.ratingDistribution}
  />
)
```

- [ ] **Step 4: Extract Rating Spotlight presentation**

Create this interface:

```ts
export type RatingSpotlightBlockPresentationProps = RatingSpotlightBlockLike & {
  liveSummary: PublishedReviewRatingSummary | null
}
```

Move title trimming, action resolution, alignment, size, and manual-value validation into `RatingSpotlightBlockPresentation`. Manual mode must use only configured manual values; live/default mode must use `liveSummary`.

The server component queries `getPublishedReviewRatingSummary()` only in live/default mode. The preview adapter converts the snapshot distribution without querying:

```ts
const liveSummary = snapshot.ratingDistribution
  ? {
      average: snapshot.ratingDistribution.average,
      count: snapshot.ratingDistribution.count,
    }
  : null
```

- [ ] **Step 5: Add source-boundary assertions for the four client-safe files**

For each presentation and preview adapter source, assert:

```ts
expect(source).not.toContain('@payload-config')
expect(source).not.toContain("from 'payload'")
expect(source).not.toContain("from '@/lib/reviewFeed'")
expect(source).not.toContain("from '@/lib/reviewRatingSummary'")
```

- [ ] **Step 6: Run the review block suite**

Run the Step 2 command.

Expected: PASS with unchanged public server behavior and read-only preview rendering.

- [ ] **Step 7: Audit without staging**

Run `git diff --check && git status --short`.

Expected: no whitespace errors and all Task 3 files remain unstaged.

---

### Task 4: Add the client-safe live-preview renderer and route wiring

**Files:**

- Create: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/components/live-preview/PageLivePreview.tsx`
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx`
- Create: `tests/int/live-preview-renderer.int.spec.tsx`
- Create: `tests/int/live-preview-import-boundary.int.spec.ts`

**Interfaces:**

- Consumes the preview snapshot loader and the two preview adapters.
- Produces `renderLivePreviewPageBlocks(blocks, snapshot)`.
- Changes `PageLivePreview` to require `reviewSnapshot: ReviewPreviewSnapshot`.

- [ ] **Step 1: Write the failing client-safe renderer test**

Render a mixed layout and verify snapshot-backed blocks resolve correctly:

```tsx
const html = renderToStaticMarkup(
  renderLivePreviewPageBlocks(
    [
      { blockType: 'ratingSpotlight', title: 'Live rating' },
      { blockType: 'reviewFeed', pageSize: 8, title: 'Reviews' },
    ] as Page['layout'],
    snapshot,
  ),
)

expect(html).toContain('Live rating')
expect(html).toContain('Reviews')
expect(html).toContain('Review loaded for page size eight')
```

- [ ] **Step 2: Write the failing transitive import-boundary test**

Recursively follow runtime relative and `@/` imports from `PageLivePreview.tsx`, excluding `import type` declarations. Assert the reachable paths exclude:

```ts
expect(reachablePaths).not.toContain('src/payload.config.ts')
expect(reachablePaths).not.toContain('src/lib/reviewFeed.ts')
expect(reachablePaths).not.toContain('src/lib/reviewRatingSummary.ts')
expect(reachablePaths).not.toContain('src/blocks/ReviewFeed/Component.tsx')
expect(reachablePaths).not.toContain('src/blocks/RatingSpotlight/Component.tsx')
```

Also assert `PageLivePreview.tsx` imports `renderLivePreviewPageBlocks` and no longer imports `renderPageBlocks`.

- [ ] **Step 3: Run the new tests and confirm the current boundary fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: FAIL because the client-safe renderer is missing and the current client graph reaches both server review components.

- [ ] **Step 4: Implement the client-safe renderer**

Create the same exhaustive switch and stable key behavior as `renderPageBlocks.tsx`, wrapped in `PageBlockStack`. Use the ordinary existing components for all non-review blocks and these exact replacements:

```tsx
case 'ratingSpotlight':
  return (
    <RatingSpotlightPreviewBlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      snapshot={snapshot}
      {...block}
    />
  )
case 'reviewFeed':
  return (
    <ReviewFeedPreviewBlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      snapshot={snapshot}
      {...block}
    />
  )
```

- [ ] **Step 5: Load the snapshot in the authenticated server route**

After the draft page is loaded:

```tsx
const reviewSnapshot = await loadReviewPreviewSnapshot(page.layout)

return <PageLivePreview initialData={page} reviewSnapshot={reviewSnapshot} />
```

- [ ] **Step 6: Consume the snapshot in the Client Component**

Use the client-safe type and renderer:

```tsx
type Props = {
  initialData: Page
  reviewSnapshot: ReviewPreviewSnapshot
}

export function PageLivePreview({ initialData, reviewSnapshot }: Props) {
  const router = useRouter()
  const { data } = useLivePreview<Page>({ depth: 2, initialData, serverURL })

  return (
    <>
      {renderLivePreviewPageBlocks(data.layout, reviewSnapshot)}
      <RefreshRouteOnSave depth={2} refresh={() => router.refresh()} serverURL={serverURL} />
    </>
  )
}
```

- [ ] **Step 7: Run renderer and boundary tests**

Run the Step 3 command.

Expected: PASS; the client graph excludes all listed server-only paths.

- [ ] **Step 8: Audit without staging**

Run `git diff --check && git status --short`.

Expected: no whitespace errors and all Task 4 files remain unstaged.

---

### Task 5: Run regression and production-build verification

**Files:**

- Modify only files implicated by failures introduced in Tasks 1–4.

**Interfaces:**

- Verifies every acceptance criterion without changing the feature contract.

- [ ] **Step 1: Run the focused review and preview suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/review-feed-data.int.spec.ts \
  tests/int/review-rating-summary.int.spec.ts \
  tests/int/review-feed.int.spec.tsx \
  tests/int/rating-spotlight.int.spec.ts \
  tests/int/review-preview-snapshot.int.spec.ts \
  tests/int/review-preview-blocks.int.spec.tsx \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run scoped lint and full TypeScript validation**

Run:

```bash
pnpm exec eslint \
  'src/app/(frontend)/preview/page/[id]/page.tsx' \
  src/blocks/ReviewFeed \
  src/blocks/RatingSpotlight \
  src/blocks/renderLivePreviewPageBlocks.tsx \
  src/components/live-preview/PageLivePreview.tsx \
  src/components/review-feed.tsx \
  src/lib/reviewFeed.ts \
  src/lib/reviewFeedShared.ts \
  src/lib/reviewPreviewShared.ts \
  src/lib/reviewPreviewSnapshot.ts \
  src/lib/reviewRatingShared.ts \
  src/lib/reviewRatingSummary.ts \
  tests/int/live-preview-*.int.spec.* \
  tests/int/review-preview-*.int.spec.*
pnpm exec tsc --noEmit
```

Expected: both commands exit successfully. Correct only errors caused by this implementation.

- [ ] **Step 3: Run the production build regression check**

Run:

```bash
pnpm build
```

Expected: the Next.js production build succeeds with no `Can't resolve 'child_process'` error and no browser import trace from `PageLivePreview` to `payload.config.ts`.

- [ ] **Step 4: Re-run the import-boundary guard**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Perform the final unstaged audit**

Run:

```bash
git diff --check
git status --short
git diff --cached --stat
```

Expected: no whitespace errors; implementation files remain unstaged; the cached diff is unchanged from the user's pre-existing staged work.
