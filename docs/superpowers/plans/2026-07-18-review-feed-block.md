# Review Feed Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a theme-native Review Feed page block based on `@shadcnblocks/reviews5`, with a server-rendered first page, published-only rating distribution, and server-side Load More pagination.

**Architecture:** Payload remains the source of truth. A focused server data module maps published Review documents into a public DTO and exposes cached page/distribution reads; a read-only Next route serves later pages; an async block adapter supplies page one to a server presentation component containing one small client pagination controller.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router/RSC, React 19, TypeScript, Tailwind CSS v4, shadcn radix-luma, Lucide, Vitest, Testing Library, Playwright.

## Global Constraints

- Display name is **Review Feed**; block slug is `reviewFeed`; interface is `ReviewFeedBlock`.
- Every review list and rating-bucket query explicitly filters `_status: published`.
- Page size defaults to `4` and validates as an integer from `1` through `12`.
- Summary values cover all published reviews, not only loaded cards.
- Preserve the `reviews5` summary, rating bars, review list, and Load More interaction.
- Remove the review-count/sort row, sorting state, helpful text, and placeholder avatars.
- Never serialize reviewer email, moderation notes, source submission, or workflow metadata.
- Use shared block spacing/appearance and semantic theme tokens only.
- Keep the repository unstaged and do not create commits.

---

### Task 1: Acquire and normalize the shadcn source

**Files:**
- Create through CLI: `src/components/ui/avatar.tsx`
- Create through CLI: `src/components/ui/progress.tsx`
- Create through CLI: `src/components/shadcnblocks/rating.tsx`
- Temporary through CLI: `src/components/reviews5.tsx`
- Temporary through CLI: `src/components/ui/dropdown-menu.tsx`
- Preserve unchanged: `src/components/ui/button.tsx`
- Preserve unchanged: `src/components/ui/separator.tsx`

**Interfaces:**
- Produces: shadcn Avatar, Progress, Separator, Button, and Rating primitives used by the presentation task.
- Preserves: the existing Button radius and variants. Reject the registry change from `rounded-md` to `rounded-4xl`.

- [ ] **Step 1: Confirm the registry diff**

```bash
npx shadcn@latest add @shadcnblocks/reviews5 --dry-run
npx shadcn@latest add @shadcnblocks/reviews5 --diff src/components/ui/button.tsx
```

Expected: five new files, two identical skips, and one proposed Button overwrite.

- [ ] **Step 2: Install without overwriting Button**

```bash
npx shadcn@latest add @shadcnblocks/reviews5
```

Answer **No** when prompted to overwrite `src/components/ui/button.tsx`. Do not pass `--overwrite`.

- [ ] **Step 3: Verify the installed primitives**

```bash
pnpm exec eslint src/components/ui/avatar.tsx src/components/ui/progress.tsx src/components/shadcnblocks/rating.tsx
```

Expected: PASS. The temporary `reviews5.tsx` is an adaptation reference and will be deleted after the domain component is built.

---

### Task 2: Build the published rating distribution and public review page data layer

**Files:**
- Modify: `src/lib/reviewRatingSummary.ts`
- Create: `src/lib/reviewFeed.ts`
- Modify: `tests/int/review-rating-summary.int.spec.ts`
- Create: `tests/int/review-feed-data.int.spec.ts`

**Interfaces:**

```ts
export type PublishedReviewRatingDistribution = PublishedReviewRatingSummary & {
  counts: readonly [number, number, number, number, number]
}

export type PublicReviewFeedItem = {
  authorName: string
  content: string
  date: string
  id: string
  rating: number
  title: string
  verified: boolean
}

export type PublicReviewFeedPage = {
  docs: PublicReviewFeedItem[]
  hasNextPage: boolean
  page: number
  totalPages: number
}

export const REVIEW_FEED_DEFAULT_PAGE_SIZE = 4
export const REVIEW_FEED_MAX_PAGE_SIZE = 12
export function parseReviewFeedPagination(searchParams: URLSearchParams):
  | { ok: true; page: number; limit: number }
  | { ok: false; message: string }
export function fetchPublishedReviewFeedPage(
  payload: Pick<Payload, 'find'>,
  input: { page: number; limit: number },
): Promise<PublicReviewFeedPage>
export const getPublishedReviewFeedPage: (
  page: number,
  limit: number,
) => Promise<PublicReviewFeedPage>
```

- [ ] **Step 1: Write failing distribution tests**

Extend `tests/int/review-rating-summary.int.spec.ts`:

```ts
expect(calculatePublishedReviewRatingDistribution([1, 2, 3, 4, 10])).toEqual({
  average: 4,
  count: 20,
  counts: [1, 2, 3, 4, 10],
})
expect(calculatePublishedReviewRatingDistribution([0, 0, 0, 0, 0])).toBeNull()
```

- [ ] **Step 2: Verify the distribution test fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-rating-summary.int.spec.ts
```

Expected: FAIL because the distribution exports do not exist.

- [ ] **Step 3: Implement cached distribution aggregation**

Add `calculatePublishedReviewRatingDistribution()`, `fetchPublishedReviewRatingDistribution()`, and `getPublishedReviewRatingDistribution()`. Keep five `payload.count()` calls in one `Promise.all()` with the existing published-and-rating filters. Preserve Rating Spotlight with:

```ts
export const getPublishedReviewRatingSummary = cache(async () => {
  const distribution = await getPublishedReviewRatingDistribution()
  return distribution
    ? { average: distribution.average, count: distribution.count }
    : null
})
```

- [ ] **Step 4: Write failing page-data tests**

Create `tests/int/review-feed-data.int.spec.ts`. Assert valid parsing for `page=2&limit=6`, defaults `{ page: 1, limit: 4 }` when both parameters are absent, and rejection of page `0`, non-integers, and limit `13`. Mock `payload.find()` and assert:

```ts
{
  collection: 'reviews',
  page: 2,
  limit: 4,
  overrideAccess: true,
  sort: ['-publishedAt', '-id'],
  where: { _status: { equals: 'published' } },
  select: {
    displayName: true,
    isGenuineExperience: true,
    publishedAt: true,
    rating: true,
    reviewBody: true,
    reviewerName: true,
    reviewTitle: true,
    title: true,
    updatedAt: true,
  },
}
```

Assert mapped output contains only the seven public DTO keys and lacks `reviewerEmail`, `internalModerationNotes`, `sourceSubmission`, `_status`, and `workflowState`.

- [ ] **Step 5: Verify the page-data test fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed-data.int.spec.ts
```

Expected: FAIL because `src/lib/reviewFeed.ts` is missing.

- [ ] **Step 6: Implement `src/lib/reviewFeed.ts`**

Use `getReviewDisplayName()` and a module-level deterministic UTC formatter:

```ts
const reviewDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
  year: 'numeric',
})

const formatPublishedDate = (value: string | null | undefined) =>
  value ? reviewDateFormatter.format(new Date(value)) : ''
```

Default absent pagination parameters before validation, validate supplied values before querying, clamp stored ratings to 1–5, map through one `toPublicReviewFeedItem()` function, and expose a React-cached getter with the signature above. On database failure log `Failed to load published review feed.` through `payload.logger.error()` and rethrow.

- [ ] **Step 7: Run both data suites**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-rating-summary.int.spec.ts tests/int/review-feed-data.int.spec.ts
```

Expected: PASS.

---

### Task 3: Add the published-only pagination endpoint

**Files:**
- Create: `src/app/api/review-feed/route.ts`
- Create: `tests/int/review-feed-route.int.spec.ts`

**Interfaces:**
- Consumes: `parseReviewFeedPagination()` and `getPublishedReviewFeedPage()`.
- Produces: `GET /api/review-feed?page=<positive integer>&limit=<1..12>` returning `PublicReviewFeedPage`.

- [ ] **Step 1: Write failing route tests**

Mock the data module and cover status 200 plus this call:

```ts
expect(getPublishedReviewFeedPageMock).toHaveBeenCalledWith(2, 4)
```

Assert malformed input returns 400 without calling the data function. Assert a rejected data function returns status 500 with exactly `{ message: 'Unable to load reviews.' }`.

- [ ] **Step 2: Verify the route test fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed-route.int.spec.ts
```

Expected: FAIL because the route does not exist.

- [ ] **Step 3: Implement the route**

```ts
export async function GET(request: Request) {
  const pagination = parseReviewFeedPagination(new URL(request.url).searchParams)
  if (!pagination.ok) {
    return Response.json({ message: pagination.message }, { status: 400 })
  }
  try {
    return Response.json(await getPublishedReviewFeedPage(pagination.page, pagination.limit))
  } catch {
    return Response.json({ message: 'Unable to load reviews.' }, { status: 500 })
  }
}
```

Also export `const dynamic = 'force-dynamic'` so newly published reviews are never hidden behind a cached endpoint response.

- [ ] **Step 4: Run the route test**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed-route.int.spec.ts
```

Expected: PASS.

---

### Task 4: Build schema, server presentation, and client pagination

**Files:**
- Create: `src/blocks/ReviewFeed/config.ts`
- Create: `src/blocks/ReviewFeed/Component.tsx`
- Create: `src/components/review-feed.tsx`
- Create: `src/components/review-feed-list.tsx`
- Modify: `src/components/shadcnblocks/rating.tsx`
- Delete after adaptation: `src/components/reviews5.tsx`
- Delete if unused: `src/components/ui/dropdown-menu.tsx`
- Create: `tests/int/review-feed.int.spec.tsx`

**Interfaces:**

```ts
export type ReviewFeedSize = 'compact' | 'default' | 'comfortable'
export type ReviewFeedPresentationProps = {
  appearance?: BlockAppearance | null
  description?: string | null
  emptyStateMessage: string
  eyebrow?: string | null
  initialPage: PublicReviewFeedPage
  loadMoreLabel: string
  pageSize: number
  size?: ReviewFeedSize
  summary: PublishedReviewRatingDistribution | null
  title: string
}
```

- [ ] **Step 1: Write failing schema and presentation tests**

Assert slug `reviewFeed`, interface `ReviewFeedBlock`, two tabs, approved fields/defaults, and page-size validation rejecting `0`, `2.5`, `13` while accepting `1`, `4`, `12`. Render the pure presentation and assert summary, five progress bars, cards, initials, verified label, shared appearance classes, and empty state. Assert rendered HTML excludes `Sort:`, `Most Helpful`, and `people found this helpful`.

- [ ] **Step 2: Write failing client interaction tests**

Use Testing Library to mock `fetch`, click Load More, and assert page-two items append. Return a duplicate ID and assert it renders once. Reject the request, confirm existing cards remain, then click Retry and confirm another request. Assert Load More disappears after `hasNextPage: false`.

- [ ] **Step 3: Verify the component test fails**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed.int.spec.tsx
```

Expected: FAIL because the block and components are missing.

- [ ] **Step 4: Implement the Payload schema**

Use Content and Layout & Theme tabs, `createBlockAppearanceFields({ includeTextOverride: false })`, and:

```ts
validate: (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 12
    ? true
    : 'Reviews per load must be a whole number between 1 and 12.'
```

- [ ] **Step 5: Normalize the generated Rating primitive**

Remove its unnecessary client directive. Decorative stars use `aria-hidden`; the wrapper exposes `aria-label="<rating> out of 5"`. Use semantic `text-primary` and `text-current/20`, preserving full, half, and empty states.

- [ ] **Step 6: Implement `ReviewFeedList`**

Use `'use client'`, `useState`, and `useTransition`. Fetch:

```ts
fetch(`/api/review-feed?page=${nextPage}&limit=${pageSize}`, {
  headers: { Accept: 'application/json' },
})
```

Merge through a stable ID Set. Preserve existing cards on error, expose Retry, and remove Load More when `hasNextPage` becomes false.

- [ ] **Step 7: Implement the server presentation**

Adapt the upstream `max-w-3xl` structure using Avatar, Progress, Separator, the shared Button, shared regular block spacing, semantic colors, `gap-*`, and responsive wrapping. Do not use `space-y-*` or manual dark-mode colors.

- [ ] **Step 8: Implement the async block adapter**

Start the cached page and distribution reads before awaiting:

```ts
const pagePromise = getPublishedReviewFeedPage(1, resolvedPageSize).catch(() => ({
  docs: [],
  hasNextPage: false,
  page: 1,
  totalPages: 0,
}))
const summaryPromise = getPublishedReviewRatingDistribution()
const [initialPage, summary] = await Promise.all([pagePromise, summaryPromise])
```

- [ ] **Step 9: Remove unused upstream files**

Delete `src/components/reviews5.tsx`. Delete the newly created Dropdown Menu only after `rg` proves no other import uses it. Keep Avatar, Progress, Separator, Button, and Rating.

- [ ] **Step 10: Run component checks**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/review-feed.int.spec.tsx
pnpm exec eslint src/blocks/ReviewFeed src/components/review-feed.tsx src/components/review-feed-list.tsx src/components/shadcnblocks/rating.tsx
```

Expected: PASS.

---

### Task 5: Register, type, thumbnail, and verify

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify generated: `src/payload-types.ts`
- Create generated: `public/block-thumbnails/review-feed.jpg`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`

- [ ] **Step 1: Add failing registration and thumbnail assertions**

Add `reviewFeed` to Page block expectations and assert:

```ts
expect(getBlockThumbnailDefinition('reviewFeed')).toMatchObject({
  filename: 'review-feed.jpg',
  label: 'Review Feed',
  slug: 'reviewFeed',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Verify registration tests fail**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: FAIL because Review Feed is unregistered and its JPEG is missing.

- [ ] **Step 3: Register the block and renderer**

Add `ReviewFeedBlock` to `Pages`, and add `case 'reviewFeed'` returning `ReviewFeedBlockComponent` in `renderPageBlocks.tsx`.

- [ ] **Step 4: Add thumbnail definition and fixture**

Define `review-feed.jpg`, label `Review Feed`, slug `reviewFeed`, and `stageAlignment: 'top'`. Add a pure-presentation fixture with four deterministic reviews and fixed bucket counts; it must not query Payload.

- [ ] **Step 5: Regenerate types and thumbnail**

```bash
pnpm generate:types
pnpm generate:block-thumbnails
```

Expected: generated `ReviewFeedBlock` types and an exact 1600 × 900 JPEG. Restore any unrelated thumbnail changed by regeneration.

- [ ] **Step 6: Run focused automated verification**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/review-rating-summary.int.spec.ts \
  tests/int/review-feed-data.int.spec.ts \
  tests/int/review-feed-route.int.spec.ts \
  tests/int/review-feed.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: PASS.

- [ ] **Step 7: Run scoped quality checks**

```bash
pnpm exec prettier --check src/lib/reviewRatingSummary.ts src/lib/reviewFeed.ts src/app/api/review-feed/route.ts src/blocks/ReviewFeed src/components/review-feed.tsx src/components/review-feed-list.tsx
pnpm exec eslint src/lib/reviewRatingSummary.ts src/lib/reviewFeed.ts src/app/api/review-feed/route.ts src/blocks/ReviewFeed src/components/review-feed.tsx src/components/review-feed-list.tsx
pnpm exec tsc --noEmit --pretty false
```

Expected: no Review Feed-specific errors. Record any pre-existing repository-wide TypeScript failures separately.

- [ ] **Step 8: Verify Chromium and WebKit**

Open `/block-thumbnail-previews/reviewFeed` at 390 × 844 and 1440 × 900 in both engines. Confirm no overflow, clean wrapping, keyboard-reachable Load More, successful append, terminal/empty states, and no console or hydration errors.

- [ ] **Step 9: Audit the unstaged diff**

```bash
git diff --check
git diff --cached --check
git status --short
```

Expected: no whitespace errors and no staged files.
