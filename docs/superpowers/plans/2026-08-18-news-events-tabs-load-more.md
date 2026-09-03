# News & Events Tabs Load More Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Items Per Tab` the batch size for the News & Events Tabs block and append the next collection-backed batch through a themed, configurable Load More button.

**Architecture:** Keep page one server-rendered for every configured classification, replace array-only groups with page-aware public DTOs, and expose a validated read-only API route for later pages. The client owns independent pagination state per tab, while Payload querying, public eligibility, mixed `All` ordering, and public-card normalization remain in `server-only` helpers.

**Tech Stack:** Payload CMS 3 Local API, Next.js 16 App Router route handlers, React 19 client state, TypeScript, shadcn `Button`, Testing Library, Vitest.

## Global Constraints

- Preserve the existing `newsEventsTabs` block slug, registration, theme classes, responsive grid, card component, configurable tabs, and ARIA keyboard behavior.
- `Items Per Tab` supports exactly `3`, `6`, `9`, and `12`, defaults to `6`, and controls both the initial page and each appended batch.
- `Load More Label` defaults to `Load More`; null, missing, and whitespace-only values resolve to `Load More`.
- Initial tab pages are server-rendered; later pages use a read-only public endpoint and contain only `PublicNewsEventCard` fields plus pagination metadata.
- Keep Payload `_status: published`, editorial `workflowState: published`, and current/upcoming Event filtering on every page.
- Preserve deterministic non-event, Event, and mixed `All` ordering across page boundaries.
- Preserve loaded items independently per tab for the current mount; a full refresh resets to page one.
- Keep visible cards after a request failure, expose `Retry`, and de-duplicate appended cards by ID.
- Do not add infinite scrolling, URL pagination, result totals, manual entry selection, or changes to the Highlights carousel/detail pages.
- Do not stage or commit any files.
- Preserve all unrelated dirty-worktree changes.

---

### Task 1: Add the block configuration and shared normalization contract

**Files:**

- Modify: `src/blocks/NewsEventsTabs/config.ts`
- Modify: `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`
- Modify: `tests/int/news-events-tabs.int.spec.tsx`
- Generated: `src/payload-types.ts`

**Interfaces:**

- Produces: `NEWS_EVENTS_TABS_DEFAULT_LOAD_MORE_LABEL: 'Load More'`
- Produces: `resolveNewsEventsTabsLoadMoreLabel(value?: string | null): string`
- Produces: `isNewsEventsTabsItemsPerTab(value: unknown): value is NewsEventsTabsItemsPerTab`
- Preserves: `normalizeNewsEventsTabsItemsPerTab(value): 3 | 6 | 9 | 12`

- [ ] **Step 1: Extend the focused schema and normalization tests first**

Add expectations to `tests/int/news-events-tabs.int.spec.tsx` that verify the new field, revised batch wording, and fallback:

```ts
expect(findNamedField(NewsEventsTabsBlock.fields, 'itemsPerTab')).toMatchObject({
  admin: {
    description:
      'Number of published entries shown initially and appended by each Load More request.',
  },
  defaultValue: '6',
})
expect(findNamedField(NewsEventsTabsBlock.fields, 'loadMoreLabel')).toMatchObject({
  defaultValue: 'Load More',
  label: 'Load More Label',
  type: 'text',
})
expect(resolveNewsEventsTabsLoadMoreLabel(' More updates ')).toBe('More updates')
expect(resolveNewsEventsTabsLoadMoreLabel('   ')).toBe('Load More')
expect(resolveNewsEventsTabsLoadMoreLabel(undefined)).toBe('Load More')
expect(isNewsEventsTabsItemsPerTab(6)).toBe(true)
expect(isNewsEventsTabsItemsPerTab(5)).toBe(false)
```

- [ ] **Step 2: Run the focused test and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
```

Expected: FAIL because the label field and shared helpers do not exist yet.

- [ ] **Step 3: Add the schema field and exact batch-size description**

In `src/blocks/NewsEventsTabs/config.ts`, update `itemsPerTab.admin.description` and place this field immediately after `itemsPerTab` in the Content tab:

```ts
{
  name: 'loadMoreLabel',
  label: 'Load More Label',
  type: 'text',
  defaultValue: 'Load More',
  admin: {
    description: 'Shown when the selected tab has more published entries.',
  },
},
```

- [ ] **Step 4: Add defensive shared helpers**

In `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`, add:

```ts
export const NEWS_EVENTS_TABS_DEFAULT_LOAD_MORE_LABEL = 'Load More'

export function isNewsEventsTabsItemsPerTab(value: unknown): value is NewsEventsTabsItemsPerTab {
  return value === 3 || value === 6 || value === 9 || value === 12
}

export function resolveNewsEventsTabsLoadMoreLabel(value?: string | null): string {
  return value?.trim() || NEWS_EVENTS_TABS_DEFAULT_LOAD_MORE_LABEL
}
```

Use `isNewsEventsTabsItemsPerTab(parsed)` inside the existing normalizer so accepted values have one source of truth.

- [ ] **Step 5: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: PASS and `NewsEventsTabsBlock`/its select type include `loadMoreLabel?: string | null` plus the revised `itemsPerTab` description.

- [ ] **Step 6: Re-run the focused test**

Run the Step 2 command again.

Expected: PASS.

- [ ] **Step 7: Review only this task's diff without staging**

Run:

```bash
git diff --check -- src/blocks/NewsEventsTabs/config.ts src/blocks/NewsEventsTabs/newsEventsTabsShared.ts tests/int/news-events-tabs.int.spec.tsx src/payload-types.ts
```

Expected: no output.

---

### Task 2: Replace fixed groups with page-aware server data

**Files:**

- Modify: `src/lib/newsEventsShared.ts`
- Modify: `src/lib/newsEvents.ts`
- Modify: `tests/int/news-events-data.int.spec.ts`

**Interfaces:**

- Produces: `PublicNewsEventPage = { docs: PublicNewsEventCard[]; hasNextPage: boolean; page: number }`
- Produces: `PublicNewsEventGroups = Record<NewsEventClassificationTab, PublicNewsEventPage>`
- Produces: `createEmptyNewsEventPage(page?: number): PublicNewsEventPage`
- Produces: `fetchNewsEventPage(payload, { classification, limit, nowISO, page }): Promise<PublicNewsEventPage>`
- Produces: `fetchNewsEventGroups(payload, { limit, nowISO }): Promise<PublicNewsEventGroups>` with page-one values
- Produces: `getNewsEventPage(classification, page, limit, nowISO): Promise<PublicNewsEventPage>`

- [ ] **Step 1: Rewrite the data tests around the page contract**

In `tests/int/news-events-data.int.spec.ts`, make the existing group assertions read `groups.all.docs` and `groups.notice.docs`, then add tests for:

```ts
expect(createEmptyNewsEventPage()).toEqual({ docs: [], hasNextPage: false, page: 1 })
expect(createEmptyNewsEventGroups().all).toEqual({ docs: [], hasNextPage: false, page: 1 })
```

Add a classification page test whose mocked Payload response includes `hasNextPage: true` and `page: 2`, and assert:

```ts
expect(find).toHaveBeenCalledWith(
  expect.objectContaining({
    collection: 'news-events',
    limit: 6,
    page: 2,
    sort: ['-publishedAt', '-id'],
    where: {
      and: expect.arrayContaining([
        { _status: { equals: 'published' } },
        { workflowState: { equals: 'published' } },
        { contentType: { equals: 'notice' } },
      ]),
    },
  }),
)
expect(result).toMatchObject({ docs: expect.any(Array), hasNextPage: true, page: 2 })
```

Add an `All` test with enough mocked non-events and Events to assert that page 1 and page 2 concatenate to the same ID sequence as one interleaved prefix, without duplicates.

- [ ] **Step 2: Run the data test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts
```

Expected: FAIL because page DTOs and `fetchNewsEventPage` do not exist.

- [ ] **Step 3: Introduce the shared page DTO and empty factories**

In `src/lib/newsEventsShared.ts`, replace the array-valued group type and factory with:

```ts
export type PublicNewsEventPage = {
  docs: PublicNewsEventCard[]
  hasNextPage: boolean
  page: number
}

export type PublicNewsEventGroups = Record<NewsEventClassificationTab, PublicNewsEventPage>

export const createEmptyNewsEventPage = (page = 1): PublicNewsEventPage => ({
  docs: [],
  hasNextPage: false,
  page,
})

export function createEmptyNewsEventGroups(): PublicNewsEventGroups {
  return Object.fromEntries(
    NEWS_EVENT_CLASSIFICATION_TABS.map(({ value }) => [value, createEmptyNewsEventPage()]),
  ) as PublicNewsEventGroups
}
```

- [ ] **Step 4: Implement direct classification pagination**

In `src/lib/newsEvents.ts`, add `fetchNewsEventPage`. For classifications other than `all`, call Payload with `page`, `limit`, the existing `cardSelect`, existing published filters, the existing Event eligibility condition when applicable, and the existing stable sort. Map the response as:

```ts
return {
  docs: (result.docs as NewsEventCardRecord[]).map((entry) => toPublicNewsEventCard(entry, nowISO)),
  hasNextPage: result.hasNextPage,
  page: result.page ?? page,
}
```

- [ ] **Step 5: Implement deterministic mixed `All` pages**

Extract a mixed-prefix helper that loads at most `page * limit + 1` eligible records from each source using the existing source filters and sorts. Interleave to the same bounded prefix, then slice it:

```ts
const offset = (page - 1) * limit
const end = page * limit
const mixed = interleaveNewsEvents(news, events, end + 1)

return {
  docs: mixed.slice(offset, end),
  hasNextPage: mixed.length > end,
  page,
}
```

Do not change `fetchNewsEventsHighlights`; it continues returning the existing array contract.

- [ ] **Step 6: Make initial groups page-aware**

Implement `fetchNewsEventGroups` by requesting page `1` for `all` and every stored classification and assigning each returned page to `createEmptyNewsEventGroups()`. Keep all eight groups present even when empty.

Add the cached server adapter:

```ts
export const getNewsEventPage = cache(
  async (
    classification: NewsEventClassificationTab,
    page: number,
    limit: number,
    nowISO: string,
  ) => {
    const payload = await loadPayload()
    return fetchNewsEventPage(payload, { classification, limit, nowISO, page })
  },
)
```

Unlike the initial block adapter, allow endpoint failures to throw so the route can return HTTP `500`.

- [ ] **Step 7: Run the data tests**

Run the Step 2 command.

Expected: PASS, including stable page-one/page-two `All` ordering.

- [ ] **Step 8: Review this task's diff without staging**

Run:

```bash
git diff --check -- src/lib/newsEventsShared.ts src/lib/newsEvents.ts tests/int/news-events-data.int.spec.ts
```

Expected: no output.

---

### Task 3: Add the validated public pagination endpoint

**Files:**

- Create: `src/app/api/news-events-tabs/route.ts`
- Create: `tests/int/news-events-tabs-route.int.spec.ts`
- Modify: `src/lib/newsEvents.ts`

**Interfaces:**

- Produces: `parseNewsEventsTabsPagination(searchParams)` returning either `{ classification; limit; ok: true; page }` or `{ message; ok: false }`
- Consumes: `isNewsEventsTabsItemsPerTab`
- Consumes: `getNewsEventPage(classification, page, limit, nowISO)`
- Produces: `GET(request: Request): Promise<Response>` at `/api/news-events-tabs`

- [ ] **Step 1: Create failing parser and route tests**

In `tests/int/news-events-tabs-route.int.spec.ts`, mock only `getNewsEventPage` and assert:

```ts
const response = await GET(
  new Request('http://localhost/api/news-events-tabs?classification=notice&page=2&limit=6'),
)
expect(response.status).toBe(200)
expect(getNewsEventPageMock).toHaveBeenCalledWith(
  'notice',
  2,
  6,
  expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
)
```

Add table-driven `400` cases for a missing/unknown classification, page `0`, decimal page, unsupported limit `5`, and missing limit. Add a rejected-loader case expecting:

```ts
expect(response.status).toBe(500)
expect(await response.json()).toEqual({ message: 'Unable to load News & Events.' })
```

Add parser tests to `tests/int/news-events-data.int.spec.ts` that assert only the eight supported tab values, positive integer pages, and supported batch sizes succeed.

- [ ] **Step 2: Run both focused suites and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts
```

Expected: FAIL because the route and parser do not exist.

- [ ] **Step 3: Implement strict query parsing in the server-only data module**

In `src/lib/newsEvents.ts`, validate exact strings rather than silently normalizing invalid public input:

```ts
export function parseNewsEventsTabsPagination(searchParams: URLSearchParams):
  | {
      classification: NewsEventClassificationTab
      limit: NewsEventsTabsItemsPerTab
      ok: true
      page: number
    }
  | { message: string; ok: false } {
  // Require a known classification, /^[1-9]\d*$/ page, and one supported numeric limit.
}
```

Use a shared classification guard derived from `NEWS_EVENT_CLASSIFICATION_TABS`, and return deterministic messages such as `Classification is invalid.`, `Page must be a positive integer.`, and `Limit must be one of 3, 6, 9, or 12.`.

- [ ] **Step 4: Implement the dynamic read-only route**

Create `src/app/api/news-events-tabs/route.ts`:

```ts
import { getNewsEventPage, parseNewsEventsTabsPagination } from '@/lib/newsEvents'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const pagination = parseNewsEventsTabsPagination(new URL(request.url).searchParams)

  if (!pagination.ok) {
    return Response.json({ message: pagination.message }, { status: 400 })
  }

  try {
    return Response.json(
      await getNewsEventPage(
        pagination.classification,
        pagination.page,
        pagination.limit,
        new Date().toISOString(),
      ),
    )
  } catch {
    return Response.json({ message: 'Unable to load News & Events.' }, { status: 500 })
  }
}
```

- [ ] **Step 5: Run parser and route tests**

Run the Step 2 command.

Expected: PASS.

- [ ] **Step 6: Confirm the route exposes no mutation handler and review the diff**

Run:

```bash
rg -n "export async function (POST|PATCH|PUT|DELETE)" src/app/api/news-events-tabs/route.ts
git diff --check -- src/app/api/news-events-tabs/route.ts src/lib/newsEvents.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-data.int.spec.ts
```

Expected: `rg` has no matches; `git diff --check` has no output.

---

### Task 4: Thread page metadata and the configured label through production and preview

**Files:**

- Modify: `src/blocks/NewsEventsTabs/Presentation.tsx`
- Modify: `src/blocks/NewsEventsTabs/Component.tsx`
- Modify: `src/blocks/NewsEventsTabs/PreviewComponent.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/news-events-tabs.int.spec.tsx`
- Verify: `tests/int/live-preview-renderer.int.spec.tsx`
- Verify: `tests/int/block-thumbnails.int.spec.ts`

**Interfaces:**

- `NewsEventsTabsBlockLike` gains `loadMoreLabel?: string | null`
- `NewsEventsTabsClient` receives `itemsPerTab: NewsEventsTabsItemsPerTab` and `loadMoreLabel: string`
- Production and preview continue consuming `PublicNewsEventGroups`, now page-aware

- [ ] **Step 1: Add failing presentation/preview assertions**

Update fixtures in `tests/int/news-events-tabs.int.spec.tsx` from arrays to page DTOs:

```ts
groups.all = { docs: [baseCard], hasNextPage: true, page: 1 }
```

Add a server-rendered presentation assertion that passes `itemsPerTab="6"` and `loadMoreLabel="More updates"`, then expects a `More updates` button. Add a whitespace-label case that expects `Load More`.

Update any live-preview and thumbnail fixtures to wrap their existing arrays as `{ docs, hasNextPage: false, page: 1 }`.

- [ ] **Step 2: Run affected presentation/preview suites and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts
```

Expected: FAIL on the old array group shape and missing label/page-size props.

- [ ] **Step 3: Normalize the new block field in the presentation layer**

Add `loadMoreLabel` to `NewsEventsTabsBlockLike`, retain `itemsPerTab` in the destructured props, and pass:

```tsx
<NewsEventsTabsClient
  cardsPerRow={cardsPerRow}
  emptyStateMessage={emptyStateMessage?.trim() || 'No entries in this classification.'}
  eventActionLabel={eventActionLabel?.trim() || 'View details'}
  groups={groups ?? createEmptyNewsEventGroups()}
  itemsPerTab={normalizeNewsEventsTabsItemsPerTab(itemsPerTab)}
  loadMoreLabel={resolveNewsEventsTabsLoadMoreLabel(loadMoreLabel)}
  newsActionLabel={newsActionLabel?.trim() || 'Read update'}
  tabs={resolvedTabs}
/>
```

- [ ] **Step 4: Keep production and preview page-one loaders aligned**

`NewsEventsTabsBlockComponent` continues calling `getNewsEventGroups(itemCount, nowISO)`. `NewsEventsTabsPreviewBlockComponent` continues selecting `snapshot.groupsByCount[String(itemCount)]`; only the value type changes to page-aware groups. Keep `NewsEventsPreviewSnapshot` client-safe and do not import `src/lib/newsEvents.ts` into a client component.

- [ ] **Step 5: Convert thumbnail and preview fixtures to page DTOs**

Wrap each group fixture with:

```ts
const page = (docs: PublicNewsEventCard[]): PublicNewsEventPage => ({
  docs,
  hasNextPage: false,
  page: 1,
})
```

Do not regenerate the JPEG solely for this data-shape change; its rendered appearance is unchanged when fixture pages are terminal.

- [ ] **Step 6: Run the affected suites**

Run the Step 2 command.

Expected: PASS.

- [ ] **Step 7: Review the client/server boundary and diff**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-import-boundary.int.spec.ts
git diff --check -- src/blocks/NewsEventsTabs src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/block-thumbnails/fixtures.tsx tests/int/news-events-tabs.int.spec.tsx
```

Expected: boundary suite PASS; diff check has no output.

---

### Task 5: Implement independent per-tab Load More interaction

**Files:**

- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Modify: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: page-aware `groups`
- Consumes: `itemsPerTab` and normalized `loadMoreLabel`
- Calls: `GET /api/news-events-tabs?classification=<value>&page=<next>&limit=<batch>`

- [ ] **Step 1: Add failing interaction tests**

Use `vi.stubGlobal('fetch', fetchMock)` and Testing Library async queries. Cover:

1. six initial cards plus six page-two cards after one click;
2. the exact URL and `Accept: application/json` header;
3. button disappearance when page two returns `hasNextPage: false`;
4. no button for an initial terminal page;
5. configured button label;
6. `Loading…` disabled state while the promise is pending;
7. preserved cards and `Retry` after rejection/non-OK response;
8. successful retry of the same next page;
9. duplicate ID removal while unique cards append;
10. News retaining page-two cards after switching to Events and back;
11. an Events request starting from Events page one, independent of News page two.

The core twelve-item test should follow this shape:

```ts
render(
  <NewsEventsTabsClient
    {...baseClientProps}
    groups={pageOneGroups}
    itemsPerTab={6}
    loadMoreLabel="More updates"
  />,
)

expect(
  document.querySelectorAll('[data-news-events-tabs-card="true"]'),
).toHaveLength(6)
fireEvent.click(screen.getByRole('button', { name: 'More updates' }))
await screen.findByText('News 12')
expect(fetchMock).toHaveBeenCalledWith(
  '/api/news-events-tabs?classification=all&page=2&limit=6',
  { headers: { Accept: 'application/json' } },
)
expect(screen.queryByRole('button', { name: 'More updates' })).toBeNull()
```

Use the card's existing `data-news-events-tabs-card="true"` attribute for counts; no production-only test marker is needed.

- [ ] **Step 2: Run the client test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-tabs.int.spec.tsx
```

Expected: FAIL because the button and per-tab pagination state are not implemented.

- [ ] **Step 3: Model state independently per classification**

In `NewsEventsTabsClient.tsx`, define:

```ts
type TabPageState = PublicNewsEventPage & {
  hasError: boolean
  isLoading: boolean
}

const createInitialTabState = (groups: PublicNewsEventGroups) =>
  Object.fromEntries(
    Object.entries(groups).map(([classification, page]) => [
      classification,
      { ...page, docs: [...page.docs], hasError: false, isLoading: false },
    ]),
  ) as Record<NewsEventClassificationTab, TabPageState>
```

Initialize once with `useState(() => createInitialTabState(groups))`. Derive `activePage` and `activeItems` from the resolved active classification.

- [ ] **Step 4: Implement one-page loading with retry and de-duplication**

Add an async handler that marks only the active tab loading, requests the next page, checks `response.ok`, parses `PublicNewsEventPage`, and commits success with a functional state update:

```ts
const ids = new Set(current.docs.map(({ id }) => id))
const docs = [...current.docs, ...nextPage.docs.filter(({ id }) => !ids.has(id))]

return {
  ...state,
  [classification]: {
    docs,
    hasError: false,
    hasNextPage: nextPage.hasNextPage,
    isLoading: false,
    page: nextPage.page,
  },
}
```

On failure, preserve `docs`, `page`, and `hasNextPage`; set only `hasError: true` and `isLoading: false` for that tab.

- [ ] **Step 5: Render the themed stateful button beneath the grid**

Within the active tab panel, keep the existing grid/empty rendering and append:

```tsx
{
  activeItems.length > 0 && (activePage.hasNextPage || activePage.hasError) ? (
    <div className="mt-8 flex justify-center">
      <Button
        disabled={activePage.isLoading}
        onClick={loadNextPage}
        type="button"
        variant="outline"
      >
        {activePage.isLoading ? 'Loading…' : activePage.hasError ? 'Retry' : loadMoreLabel}
      </Button>
    </div>
  ) : null
}
```

Do not alter the tab button styles, wrapping classes, keyboard handler, grid classes, card typography, or empty-state component.

- [ ] **Step 6: Run the complete interaction suite**

Run the Step 2 command.

Expected: PASS for legacy tab behavior and all new pagination behavior.

- [ ] **Step 7: Run the route, data, and client suites together**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-tabs.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 8: Review this task's diff without staging**

Run:

```bash
git diff --check -- src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx tests/int/news-events-tabs.int.spec.tsx
```

Expected: no output.

---

### Task 6: Update maintained documentation and complete repository verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Update mechanically if changed: `.agents/skills/project-context/references/project-inventory.json`
- Verify all files from Tasks 1–5

**Interfaces:**

- Documents: `Items Per Tab` as batch size, public Load More behavior, per-tab retention, and configurable label
- Preserves: existing News & Events collection and detail-page documentation

- [ ] **Step 1: Update editor-facing block guidance**

In `docs/guides/blocks.md`, update the News & Events Tabs entry to state:

```md
- **Items Per Tab** controls the initial number of cards and each later Load More batch.
- **Load More Label** customizes the button shown only when the active tab has another page.
- Loaded cards remain available when visitors switch tabs; refreshing the page returns to the initial batch.
```

Do not describe manual entries, URL pagination, or infinite scrolling.

- [ ] **Step 2: Update the maintained block-system reference**

In `.agents/skills/project-context/references/block-system.md`, replace the fixed-limit statement for `newsEventsTabs` with the page-one server snapshot plus public endpoint/client append contract. Record the new route path and page-aware public group DTO without changing unrelated block descriptions.

- [ ] **Step 3: Record the focused public route in the architecture reference**

In `.agents/skills/project-context/references/architecture.md`, update the focused route-handler sentence to include the News & Events Tabs pagination endpoint:

```md
- Form submission, review-feed, News & Events Tabs pagination, redirects, and media reconciliation have focused route handlers.
```

- [ ] **Step 4: Format only the changed implementation/test files**

Run:

```bash
pnpm exec prettier --write src/app/api/news-events-tabs/route.ts src/blocks/NewsEventsTabs/Component.tsx src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx src/blocks/NewsEventsTabs/Presentation.tsx src/blocks/NewsEventsTabs/PreviewComponent.tsx src/blocks/NewsEventsTabs/config.ts src/blocks/NewsEventsTabs/newsEventsTabsShared.ts src/lib/newsEvents.ts src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/lib/newsEventsShared.ts src/block-thumbnails/fixtures.tsx tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-tabs.int.spec.tsx docs/guides/blocks.md .agents/skills/project-context/references/architecture.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-18-news-events-tabs-load-more-design.md docs/superpowers/plans/2026-08-18-news-events-tabs-load-more.md
```

Expected: command exits successfully and does not touch unrelated files.

- [ ] **Step 5: Run focused integration and boundary tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-tabs.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: all selected suites PASS.

- [ ] **Step 6: Run TypeScript and targeted lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/app/api/news-events-tabs/route.ts src/blocks/NewsEventsTabs src/lib/newsEvents.ts src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/lib/newsEventsShared.ts tests/int/news-events-data.int.spec.ts tests/int/news-events-tabs-route.int.spec.ts tests/int/news-events-tabs.int.spec.tsx
```

Expected: both commands PASS.

- [ ] **Step 7: Refresh generated project context**

Run:

```bash
pnpm project-context:update
```

Expected: PASS. Inspect any generated changes and retain only accurate inventory/reference updates. If the sandbox blocks writes under `.agents`, request the required escalation instead of bypassing the skill.

- [ ] **Step 8: Re-read the change-impact map and inspect the final diff**

Run:

```bash
sed -n '1,320p' .agents/skills/project-context/references/change-impact-map.md
git diff --check
git status --short
```

Expected: no whitespace errors; only intentional existing and feature files remain dirty. Confirm Payload producer, generated types, server query, public route, production renderer, preview snapshot, client component, tests, and maintained docs are all represented.

- [ ] **Step 9: Validate project context**

Run:

```bash
pnpm project-context:check
```

Expected: PASS. An already-known stale knowledge-graph warning may be reported, but no current project-context error may remain.

- [ ] **Step 10: Perform a final manual behavior check without committing**

Using a local page containing the News & Events Tabs block and at least twelve eligible entries:

1. confirm six cards appear initially with `Items Per Tab = 6`;
2. confirm `Load More` appears only when another page exists;
3. click once and confirm twelve unique cards appear;
4. switch to another tab, load its next page, and switch back;
5. confirm each tab retains its own cards until refresh;
6. confirm the button wraps cleanly below the responsive grid and all existing tabs still wrap on narrow screens.

Leave every change unstaged and uncommitted.
