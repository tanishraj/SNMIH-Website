# News and Events Page Blocks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing collection-driven News & Events Highlights and News Grid blocks with a synchronized featured carousel and a fixed-classification tabbed grid while preserving every legacy block layout.

**Architecture:** Expand the existing `contentType` field into a seven-value, single-choice classification and keep all public queries in the server-only News & Events data module. Existing block components select between their legacy server presentation and focused client interaction components; shared serializable card/group types cross the server-client boundary. Pages, Reusable Sections, and `/news-events` routing remain structurally unchanged.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 App Router, React 19, TypeScript 5.7, Tailwind CSS 4, installed shadcn Carousel/Card/Badge/Button/Empty/Separator primitives, Embla Carousel 8.6, Vitest 4, Testing Library 16.

## Global Constraints

- Do not stage or commit any implementation or planning changes; leave the working tree available for user review.
- Do not modify or render these blocks directly on the dedicated `/news-events` route.
- Preserve `newsEventsHighlights` and `newsGrid` slugs, interface names, renderer registrations, and existing-layout defaults.
- Every entry has exactly one stored classification: `news`, `event`, `notice`, `holiday`, `achievement`, `announcement`, or `other`; `all` is derived only.
- Event-only fields, validation, date ranges, and expiry apply only to `event`.
- Only records with Payload `_status: published` and editorial `workflowState: published` may render publicly.
- The carousel uses editor order first, removes invalid/duplicate entries, then fills from automatic highlights up to 1–6 items.
- Autoplay advances every 6000 ms, pauses for hover/focus, and is disabled for one item, editor opt-out, or reduced motion.
- The tab order is `All`, `News`, `Events`, `Notice`, `Holiday`, `Achievements`, `Announcement`, `Others`.
- Tabbed grids show 3, 6, 9, or 12 entries per tab, default 6, without pagination or browser-side collection queries.
- Use semantic theme tokens and shared content classes; do not add raw SNMIH colors or manual dark-mode overrides.
- Use installed shadcn primitives first. Do not add a registry block or dependency unless the approved behavior cannot be built from installed primitives.
- Run Payload type generation after schema changes and finish with project-context update/check.

---

### Task 1: Expand the News & Events classification contract

**Files:**
- Create: `src/lib/newsEventClassifications.ts`
- Modify: `src/collections/NewsEvents.ts`
- Modify: `src/hooks/normalizeNewsEventFields.ts`
- Modify: `src/lib/newsEventsShared.ts`
- Test: `tests/int/news-events-collection.int.spec.ts`
- Test: `tests/int/news-events-data.int.spec.ts`

**Interfaces:**
- Produces: `NewsEventClassification`, `NewsEventClassificationTab`, `NEWS_EVENT_CLASSIFICATIONS`, `NEWS_EVENT_CLASSIFICATION_TABS`, `getNewsEventClassificationLabel()`, `getNewsEventClassificationBadgeVariant()`, and `isEventClassification()`.
- Produces: the expanded `PublicNewsEventCard.contentType` union consumed by both blocks and all later tasks.
- Preserves: the stored field name `contentType` and existing `news`/`event` values.

- [ ] **Step 1: Add failing schema, hook, and label assertions**

Add recursive field lookup to `tests/int/news-events-collection.int.spec.ts`, then assert the exact select contract and that every non-event classification clears event-only values:

```ts
const findNamedField = (value: unknown, name: string): Record<string, unknown> | undefined => {
  if (Array.isArray(value)) {
    for (const child of value) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (record.name === name) return record

    for (const child of Object.values(record)) {
      const match = findNamedField(child, name)
      if (match) return match
    }
  }

  return undefined
}

it('uses one required seven-value entry classification', () => {
  expect(findNamedField(NewsEvents.fields, 'contentType')).toMatchObject({
    label: 'Entry Classification',
    required: true,
    type: 'select',
    options: [
      { label: 'News', value: 'news' },
      { label: 'Events', value: 'event' },
      { label: 'Notice', value: 'notice' },
      { label: 'Holiday', value: 'holiday' },
      { label: 'Achievements', value: 'achievement' },
      { label: 'Announcement', value: 'announcement' },
      { label: 'Others', value: 'other' },
    ],
  })
})

it.each(['news', 'notice', 'holiday', 'achievement', 'announcement', 'other'])(
  'clears event-only values for %s entries',
  async (contentType) => {
    const result = await normalizeNewsEventFields({
      data: {
        contentType,
        eventEnd: '2026-08-02T00:00:00.000Z',
        eventLocation: 'Campus',
        eventRegistrationAction: [{ label: 'Register' }],
        eventStart: '2026-08-01T00:00:00.000Z',
      },
    } as never)

    expect(result).toMatchObject({
      eventEnd: null,
      eventLocation: null,
      eventRegistrationAction: [],
      eventStart: null,
    })
  },
)
```

Add label/tab assertions to `tests/int/news-events-data.int.spec.ts`:

```ts
expect(NEWS_EVENT_CLASSIFICATION_TABS.map(({ label }) => label)).toEqual([
  'All',
  'News',
  'Events',
  'Notice',
  'Holiday',
  'Achievements',
  'Announcement',
  'Others',
])
expect(getNewsEventClassificationLabel('achievement')).toBe('Achievement')
expect(getNewsEventClassificationLabel('invalid')).toBe('Other')
expect(getNewsEventClassificationBadgeVariant('event')).toBe('secondary')
expect(getNewsEventClassificationBadgeVariant('invalid')).toBe('outline')
```

- [ ] **Step 2: Run the focused tests and confirm the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts tests/int/news-events-data.int.spec.ts
```

Expected: FAIL because the classification module and expanded options do not exist and the hook only clears fields for `news`.

- [ ] **Step 3: Add the client-safe classification module**

Create `src/lib/newsEventClassifications.ts`:

```ts
export const NEWS_EVENT_CLASSIFICATIONS = [
  { adminLabel: 'News', label: 'News', tabLabel: 'News', value: 'news' },
  { adminLabel: 'Events', label: 'Event', tabLabel: 'Events', value: 'event' },
  { adminLabel: 'Notice', label: 'Notice', tabLabel: 'Notice', value: 'notice' },
  { adminLabel: 'Holiday', label: 'Holiday', tabLabel: 'Holiday', value: 'holiday' },
  {
    adminLabel: 'Achievements',
    label: 'Achievement',
    tabLabel: 'Achievements',
    value: 'achievement',
  },
  {
    adminLabel: 'Announcement',
    label: 'Announcement',
    tabLabel: 'Announcement',
    value: 'announcement',
  },
  { adminLabel: 'Others', label: 'Other', tabLabel: 'Others', value: 'other' },
] as const

export type NewsEventClassification = (typeof NEWS_EVENT_CLASSIFICATIONS)[number]['value']
export type NewsEventClassificationTab = 'all' | NewsEventClassification

export const NEWS_EVENT_CLASSIFICATION_TABS = [
  { label: 'All', value: 'all' },
  ...NEWS_EVENT_CLASSIFICATIONS.map(({ tabLabel, value }) => ({ label: tabLabel, value })),
] as const satisfies ReadonlyArray<{ label: string; value: NewsEventClassificationTab }>

const classificationLabels = Object.fromEntries(
  NEWS_EVENT_CLASSIFICATIONS.map(({ label, value }) => [value, label]),
) as Record<NewsEventClassification, string>

export type NewsEventClassificationBadgeVariant = 'default' | 'ghost' | 'outline' | 'secondary'

const classificationBadgeVariants: Record<
  NewsEventClassification,
  NewsEventClassificationBadgeVariant
> = {
  news: 'default',
  event: 'secondary',
  notice: 'outline',
  holiday: 'secondary',
  achievement: 'default',
  announcement: 'ghost',
  other: 'outline',
}

export function getNewsEventClassificationLabel(value?: string | null): string {
  return classificationLabels[value as NewsEventClassification] ?? 'Other'
}

export function getNewsEventClassificationBadgeVariant(
  value?: string | null,
): NewsEventClassificationBadgeVariant {
  return classificationBadgeVariants[value as NewsEventClassification] ?? 'outline'
}

export function isEventClassification(value?: string | null): boolean {
  return value === 'event'
}
```

- [ ] **Step 4: Wire the shared contract into Payload and normalization**

In `src/collections/NewsEvents.ts`, map `NEWS_EVENT_CLASSIFICATIONS` to `{ label: adminLabel, value }` select options and use `isEventClassification(data?.contentType)` for Event Details conditions and validation. Set the editor label to `Entry Classification`, retain `defaultValue: 'news'`, and keep the field required.

In `src/hooks/normalizeNewsEventFields.ts`, replace the `contentType !== 'news'` guard with:

```ts
if (!data || isEventClassification(data.contentType)) {
  return data
}
```

In `src/lib/newsEventsShared.ts`, replace the two-value union with:

```ts
export type NewsEventContentType = NewsEventClassification
```

Keep `const isEvent = entry.contentType === 'event'` so only Event records use event dates.

- [ ] **Step 5: Run focused tests and inspect the diff**

Run the Task 1 Vitest command again. Expected: PASS.

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; changed files remain unstaged and uncommitted.

---

### Task 2: Add carousel selection and grouped-tab server queries

**Files:**
- Modify: `src/lib/newsEvents.ts`
- Modify: `src/lib/newsEventsShared.ts`
- Test: `tests/int/news-events-data.int.spec.ts`
- Test: `tests/int/news-grid.int.spec.tsx`

**Interfaces:**
- Consumes: `NewsEventClassification`, classification tabs, `PublicNewsEventCard`, and existing publication/event predicates.
- Produces: `PublicNewsEventGroups = Record<NewsEventClassificationTab, PublicNewsEventCard[]>`.
- Produces: `fetchNewsEventsCarouselItems(payload, options)` and cached `getNewsEventsCarouselItems(selectedIDsJSON, limit, nowISO)`.
- Produces: `fetchNewsEventGroups(payload, options)` and cached `getNewsEventGroups(limit, nowISO)`.
- Changes: `fetchNewsEventsHighlights()` treats every non-event classification as editorial news.

- [ ] **Step 1: Write failing query and ordering tests**

Add tests that mock `payload.find` and verify:

```ts
const record = (
  id: string,
  contentType: NewsEventClassification,
) => ({
  contentType,
  createdAt: '2026-08-10T00:00:00.000Z',
  eventEnd: contentType === 'event' ? '2026-08-20T12:00:00.000Z' : null,
  eventStart: contentType === 'event' ? '2026-08-20T09:00:00.000Z' : null,
  excerpt: `${id} excerpt`,
  featuredImage: null,
  featuredImagePosition: 'center',
  id,
  primaryCategory: null,
  publishedAt: '2026-08-10T00:00:00.000Z',
  slug: id,
  title: `${id} title`,
  updatedAt: '2026-08-10T00:00:00.000Z',
})

const newsRecord = record('news-1', 'news')
const holidayRecord = record('holiday-1', 'holiday')
const noticeRecord = record('notice-1', 'notice')
const announcementRecord = record('announcement-1', 'announcement')
const eventRecord = record('event-1', 'event')

it('preserves eligible manual carousel order and fills without duplicates', async () => {
  const find = vi
    .fn()
    .mockResolvedValueOnce({ docs: [holidayRecord, newsRecord] })
    .mockResolvedValueOnce({ docs: [newsRecord, noticeRecord, announcementRecord] })
    .mockResolvedValueOnce({ docs: [eventRecord] })

  const result = await fetchNewsEventsCarouselItems({ find } as never, {
    limit: 4,
    nowISO: '2026-08-17T00:00:00.000Z',
    selectedIDs: [newsRecord.id, holidayRecord.id, newsRecord.id],
  })

  expect(result.map(({ id }) => id)).toEqual([
    String(newsRecord.id),
    String(holidayRecord.id),
    String(eventRecord.id),
    String(noticeRecord.id),
  ])
})
```

Add a grouped-data test with one mocked response per classification plus `All`, and assert exact keys, limits, Event current/upcoming predicates, and publication sorting for non-events:

```ts
expect(Object.keys(groups)).toEqual([
  'all',
  'news',
  'event',
  'notice',
  'holiday',
  'achievement',
  'announcement',
  'other',
])
expect(groups.notice.every((item) => item.contentType === 'notice')).toBe(true)
expect(groups.event.every((item) => item.contentType === 'event')).toBe(true)
```

- [ ] **Step 2: Run tests and confirm missing loaders fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-data.int.spec.ts tests/int/news-grid.int.spec.tsx
```

Expected: FAIL because carousel selection, grouped results, and expanded automatic queries are absent.

- [ ] **Step 3: Define the grouped public type and empty factory**

In `src/lib/newsEventsShared.ts`, add:

```ts
export type PublicNewsEventGroups = Record<
  NewsEventClassificationTab,
  PublicNewsEventCard[]
>

export function createEmptyNewsEventGroups(): PublicNewsEventGroups {
  return Object.fromEntries(
    NEWS_EVENT_CLASSIFICATION_TABS.map(({ value }) => [value, []]),
  ) as PublicNewsEventGroups
}
```

- [ ] **Step 4: Expand automatic highlights and add manual selection resolution**

Update the non-event highlights query to use:

```ts
{ contentType: { in: NEWS_EVENT_CLASSIFICATIONS.filter(({ value }) => value !== 'event').map(({ value }) => value) } }
```

Add `fetchNewsEventsCarouselItems()` with these exact stages:

```ts
const uniqueSelectedIDs = [...new Set(selectedIDs)]
const selectedResult = uniqueSelectedIDs.length
  ? await payload.find({
      collection: 'news-events',
      depth: 1,
      limit: uniqueSelectedIDs.length,
      overrideAccess: true,
      pagination: false,
      select: cardSelect,
      where: {
        and: [
          ...publishedWhere,
          { id: { in: uniqueSelectedIDs } },
          {
            or: [
              { contentType: { not_equals: 'event' } },
              { and: [{ contentType: { equals: 'event' } }, currentOrUpcomingEventWhere(nowISO)] },
            ],
          },
        ],
      },
    })
  : { docs: [] }

const selectedByID = new Map(
  (selectedResult.docs as NewsEventCardRecord[]).map((entry) => [String(entry.id), entry]),
)
const manualItems = uniqueSelectedIDs.flatMap((id) => {
  const entry = selectedByID.get(String(id))
  return entry ? [toPublicNewsEventCard(entry, nowISO)] : []
})
const automaticItems = await fetchNewsEventsHighlights(payload, { limit, nowISO })
const seen = new Set(manualItems.map(({ id }) => id))

return [
  ...manualItems,
  ...automaticItems.filter(({ id }) => !seen.has(id)),
].slice(0, normalizeHighlightsItemCount(limit))
```

Expose a cached server wrapper that accepts JSON-serialized relationship IDs so the cache input is stable and parses only arrays of string/number IDs:

```ts
const parseSelectedNewsEventIDs = (value: string): Array<number | string> => {
  try {
    const parsed = JSON.parse(value) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number | string =>
          typeof id === 'number' || typeof id === 'string',
        )
      : []
  } catch {
    return []
  }
}

export const getNewsEventsCarouselItems = cache(
  async (selectedIDsJSON: string, limit: number, nowISO: string) => {
    const payload = await loadPayload()

    return fetchNewsEventsCarouselItems(payload, {
      limit,
      nowISO,
      selectedIDs: parseSelectedNewsEventIDs(selectedIDsJSON),
    })
  },
)
```

- [ ] **Step 5: Add bounded grouped queries**

Implement `fetchNewsEventGroups()` by loading `All` through expanded highlights and running the seven classification queries in parallel. Each classification query uses `limit`, `cardSelect`, and public predicates; Events additionally use `currentOrUpcomingEventWhere(nowISO)` and `sort: ['eventStart', 'id']`, while every other classification uses `sort: ['-publishedAt', '-id']`.

Construct the result with `createEmptyNewsEventGroups()` and assign each resolved array by its classification key. Add this cached wrapper beside the existing public loaders:

```ts
export const getNewsEventGroups = cache(async (limit: number, nowISO: string) => {
  const payload = await loadPayload()

  try {
    return await fetchNewsEventGroups(payload, { limit, nowISO })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Failed to load grouped News & Events.' })
    return createEmptyNewsEventGroups()
  }
})
```

- [ ] **Step 6: Run focused tests and preserve server-only boundaries**

Run the Task 2 Vitest command. Expected: PASS.

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/live-preview-import-boundary.int.spec.ts
git diff --check
```

Expected: PASS and no whitespace output. Leave all changes unstaged.

---

### Task 3: Implement synchronized carousel interaction

**Files:**
- Create: `src/components/news-events/NewsEventsFeaturedCarouselClient.tsx`
- Test: `tests/int/news-events-featured-carousel.int.spec.tsx`

**Interfaces:**
- Consumes: `PublicNewsEventCard[]`, `autoplay: boolean`, and the resolved section surface.
- Produces: `NewsEventsFeaturedCarouselClient` used by the Task 4 server shell.
- Uses: installed `Carousel`, `Card`, `Badge`, `Button`, and existing `ContentLink`/overlay helpers.

- [ ] **Step 1: Confirm installed shadcn APIs before editing**

Run:

```bash
pnpm dlx shadcn@latest docs carousel card badge button empty separator
```

Expected: official documentation/example URLs are printed. Read those URLs and the installed source files; do not run `add` because all required primitives already exist.

- [ ] **Step 2: Write failing interaction tests**

Create a Testing Library suite with `vi.useFakeTimers()` and a deterministic `window.matchMedia` mock. Cover:

```ts
const item = (id: string, contentType: NewsEventClassification): PublicNewsEventCard => ({
  contentType,
  dateISO: '2026-08-20T09:00:00.000Z',
  dateLabel: 'Aug 20, 2026',
  excerpt: `${id} excerpt`,
  href: `/news-events/${id}`,
  id,
  image: { alt: `${id} image`, position: 'center', src: `/media/${id}.jpg` },
  isPastEvent: false,
  slug: id,
  title: `${id} title`,
})

const items = [item('news-1', 'news'), item('notice-1', 'notice'), item('event-1', 'event')]

render(<NewsEventsFeaturedCarouselClient autoplay items={items} sectionBackground="none" />)
expect(screen.getByRole('heading', { name: items[0].title })).toBeInTheDocument()

fireEvent.click(screen.getByRole('button', { name: `Show ${items[1].title}` }))
expect(screen.getByRole('heading', { name: items[1].title })).toBeInTheDocument()

fireEvent.click(screen.getByRole('button', { name: 'Next story' }))
expect(screen.getByText('3 of 3')).toBeInTheDocument()

fireEvent.mouseEnter(screen.getByTestId('news-events-carousel-shell'))
act(() => vi.advanceTimersByTime(6000))
expect(screen.getByRole('heading', { name: items[2].title })).toBeInTheDocument()
```

Add separate assertions for autoplay advance when not paused, focus pause, reduced-motion opt-out, wrapping previous/next behavior, one-item static rendering, classification labels, and missing-image fallback.

- [ ] **Step 3: Run the new test and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-featured-carousel.int.spec.tsx
```

Expected: FAIL because the client component does not exist.

- [ ] **Step 4: Implement one active index with two responsive rails**

Use one `activeIndex` state for the large feature, a desktop vertical `Carousel`, and a mobile/tablet horizontal `Carousel`. Keep each Embla API through `setApi`; whenever `activeIndex` changes, call `scrollTo(activeIndex)` on both APIs. Render the desktop rail with `hidden lg:block` and the horizontal rail with `lg:hidden`, avoiding viewport-orientation mutation.

Each rail item is a semantic `Button` or button-like trigger labelled `Show ${item.title}`. The large active panel contains the detail `ContentLink`; do not nest a destination link inside the rail selection trigger.

Render large-feature and rail classifications with shadcn `Badge`, `getNewsEventClassificationLabel()`, and `getNewsEventClassificationBadgeVariant()`. Structure rail entries with full shadcn `CardHeader`, `CardTitle`, and `CardContent` composition rather than a single styled container.

- [ ] **Step 5: Implement bounded autoplay and accessibility**

Use a 6000 ms interval only when `autoplay`, `items.length > 1`, reduced motion is false, and neither hover nor focus-within pause is active. Clean the interval on every dependency change and unmount. Set the feature announcement container to `aria-live="off"` during autoplay and use visible `${activeIndex + 1} of ${items.length}` position feedback.

Buttons use `Previous story` and `Next story` accessible labels, wrap at both ends, and retain existing shadcn focus rings. The image uses the stored object-position class; absent images render `bg-muted` with no empty `Image` request.

- [ ] **Step 6: Run interaction and regression tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts tests/int/regular-block-spacing.int.spec.tsx
```

Expected: PASS. Run `git diff --check`; leave all files unstaged.

---

### Task 4: Add Featured Carousel block configuration and server presentation

**Files:**
- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Modify: `src/blocks/NewsEventsHighlights/Component.tsx`
- Modify: `src/blocks/NewsEventsHighlights/Presentation.tsx`
- Create: `src/components/news-events/NewsEventsFeaturedCarousel.tsx`
- Test: `tests/int/news-events-highlights.int.spec.tsx`

**Interfaces:**
- Consumes: `getNewsEventsCarouselItems()`, `PublicNewsEventCard[]`, existing block appearance/actions/spacing, and `NewsEventsFeaturedCarouselClient` from Task 3.
- Produces: `NewsEventsHighlightsLayout = 'cards' | 'featuredCarousel'` and expanded `NewsEventsHighlightsBlockLike` props.
- Preserves: the existing `NewsEventsHighlights` component and exact cards-layout render branch.

- [ ] **Step 1: Add failing block-schema and branch tests**

Assert:

```ts
expect(findNamedField(NewsEventsHighlightsBlock.fields, 'layout')).toMatchObject({
  defaultValue: 'cards',
  required: true,
  options: [
    { label: 'Cards', value: 'cards' },
    { label: 'Featured Carousel', value: 'featuredCarousel' },
  ],
})
expect(findNamedField(NewsEventsHighlightsBlock.fields, 'featuredEntries')).toMatchObject({
  maxRows: 6,
  type: 'array',
})
expect(findNamedField(NewsEventsHighlightsBlock.fields, 'entry')).toMatchObject({
  relationTo: 'news-events',
  required: true,
  type: 'relationship',
})
expect(findNamedField(NewsEventsHighlightsBlock.fields, 'autoplay')).toMatchObject({
  defaultValue: true,
  type: 'checkbox',
})
```

Add rendering assertions that legacy/missing `layout` still emits `data-news-events-highlights="true"`, while `layout="featuredCarousel"` renders with no outer title and emits `data-news-events-featured-carousel="true"` when items exist.

- [ ] **Step 2: Run the highlights test and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-highlights.int.spec.tsx
```

Expected: FAIL because the layout, ordered relationship rows, autoplay, and carousel branch are absent.

- [ ] **Step 3: Add conditional Payload fields**

Add `layout` before `itemCount`, then conditionally show:

```ts
{
  name: 'featuredEntries',
  label: 'Featured Entries',
  type: 'array',
  maxRows: 6,
  admin: {
    condition: (_data, siblingData) => siblingData?.layout === 'featuredCarousel',
    description: 'Manual order is preserved; automatic highlights fill empty positions.',
  },
  fields: [
    {
      name: 'entry',
      type: 'relationship',
      relationTo: 'news-events',
      required: true,
    },
  ],
},
{
  name: 'autoplay',
  type: 'checkbox',
  defaultValue: true,
  admin: {
    condition: (_data, siblingData) => siblingData?.layout === 'featuredCarousel',
  },
},
```

Keep existing fields and both tabs in their established order.

- [ ] **Step 4: Select the correct server loader**

In `Component.tsx`, normalize `featuredEntries[].entry` IDs from numbers, strings, or populated records. When `layout === 'featuredCarousel'`, call `getNewsEventsCarouselItems(JSON.stringify(ids), itemCount, nowISO)`; otherwise call the existing `getNewsEventsHighlights(itemCount, nowISO)`. Both branches catch failures to `[]`.

- [ ] **Step 5: Add the themed server shell and branch presentation**

`NewsEventsFeaturedCarousel.tsx` resolves section appearance, optional section header, shared actions, empty state, and `BlockFooterActions`. Render `NewsEventsFeaturedCarouselClient` only when items exist. The shell uses `regularBlockContainerClasses`, `regularBlockMobilePaddingClasses`, shared content heading/description classes, `SectionEyebrow`, and no raw theme colors.

In `Presentation.tsx`, preserve the current title guard only for `cards`. For `featuredCarousel`, allow an absent title and render `NewsEventsFeaturedCarousel` with trimmed optional header content, resolved actions, `autoplay ?? true`, and all items.

- [ ] **Step 6: Run server rendering tests**

Run the Task 4 Vitest command. Expected: PASS for schema, legacy branch, optional carousel header, and empty-state behavior.

Run `git diff --check`. Expected: no output; leave changes unstaged.

---

### Task 5: Add Classification Tabs configuration and server rendering

**Files:**
- Modify: `src/blocks/NewsGrid/config.ts`
- Modify: `src/blocks/NewsGrid/newsGridShared.ts`
- Modify: `src/blocks/NewsGrid/Presentation.tsx`
- Create: `src/blocks/NewsGrid/NewsGridCollectionCard.tsx`
- Test: `tests/int/news-grid.int.spec.tsx`

**Interfaces:**
- Consumes: shared classification labels and existing News Grid appearance/action fields.
- Produces: `NewsGridDisplayMode = 'grid' | 'classificationTabs'`, numeric `NewsGridItemsPerTab = 3 | 6 | 9 | 12`, stored `NewsGridItemsPerTabValue = '3' | '6' | '9' | '12'`, and `normalizeNewsGridItemsPerTab()`.
- Produces: reusable `NewsGridCollectionCard` used by both legacy and tabbed layouts.
- Preserves: existing feature-card, total-card, and title behavior when display mode is missing or `grid`.

- [ ] **Step 1: Add failing schema and normalization tests**

Assert:

```ts
expect(findNamedField(NewsGridBlock.fields, 'displayMode')).toMatchObject({
  defaultValue: 'grid',
  required: true,
  options: [
    { label: 'Grid', value: 'grid' },
    { label: 'Classification Tabs', value: 'classificationTabs' },
  ],
})
expect(findNamedField(NewsGridBlock.fields, 'itemsPerTab')).toMatchObject({
  defaultValue: '6',
  options: ['3', '6', '9', '12'].map((value) => ({ label: value, value })),
  type: 'select',
})
expect(normalizeNewsGridItemsPerTab(undefined)).toBe(6)
expect(normalizeNewsGridItemsPerTab('12')).toBe(12)
expect(normalizeNewsGridItemsPerTab('7')).toBe(6)
```

Add render tests proving the extracted collection card preserves the existing News/Event markup and displays the exact labels for Notice, Holiday, Achievement, Announcement, and Other. A missing display mode must retain the existing grid markup.

- [ ] **Step 2: Run the News Grid test and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid.int.spec.tsx
```

Expected: FAIL because display mode, tab count, grouped data, and optional tabbed header do not exist.

- [ ] **Step 3: Add display-mode schema without breaking legacy authoring**

Add `displayMode` before count fields. Add conditional `itemsPerTab`; hide `totalCards` and `featureCard` when `displayMode === 'classificationTabs'`. Remove unconditional `required: true` from `title` and add validation that returns true for tabbed mode or a non-whitespace title, otherwise `Title is required for the Grid display mode.`

In `newsGridShared.ts`, add:

```ts
export const NEWS_GRID_ITEMS_PER_TAB_VALUES = ['3', '6', '9', '12'] as const
export type NewsGridItemsPerTabValue = (typeof NEWS_GRID_ITEMS_PER_TAB_VALUES)[number]
export type NewsGridItemsPerTab = 3 | 6 | 9 | 12

export function normalizeNewsGridItemsPerTab(value?: string | null): NewsGridItemsPerTab {
  return NEWS_GRID_ITEMS_PER_TAB_VALUES.includes(value as NewsGridItemsPerTabValue)
    ? (Number(value) as NewsGridItemsPerTab)
    : 6
}
```

- [ ] **Step 4: Extract the existing collection card without changing markup**

Move the current regular collection-card article into `NewsGridCollectionCard.tsx`. Its props are:

```ts
type NewsGridCollectionCardProps = {
  classificationStyle?: 'badge' | 'eyebrow'
  eventActionLabel: string
  item: PublicNewsEventCard
  newsActionLabel: string
  surface: SectionEyebrowSurface
}
```

Use `getNewsEventClassificationLabel(item.contentType)` for the classification copy. The default `classificationStyle="eyebrow"` preserves the legacy `SectionEyebrow`; `classificationStyle="badge"` renders shadcn `Badge` with `getNewsEventClassificationBadgeVariant()` for the new tabbed mode. Only `event` uses the Event action label and event date range; all six non-event values use the News action label and publication label. Preserve existing data attributes and responsive classes so legacy assertions remain valid.

- [ ] **Step 5: Run News Grid schema and legacy rendering tests**

Run the Task 5 Vitest command. Expected: PASS, including all pre-existing grid and feature-card assertions.

Run `git diff --check`; leave the working tree unstaged.

---

### Task 6: Implement accessible classification tabs

**Files:**
- Create: `src/blocks/NewsGrid/NewsGridClassificationTabsClient.tsx`
- Test: `tests/int/news-grid-classification-tabs.int.spec.tsx`

**Interfaces:**
- Consumes: `PublicNewsEventGroups`, `NEWS_EVENT_CLASSIFICATION_TABS`, `NewsGridCardsPerRow`, labels, surface, and empty-state text.
- Consumes: `NewsGridCollectionCard` from Task 5.
- Produces: the complete interactive tablist/tabpanels used by the tabbed News Grid presentation.

- [ ] **Step 1: Write failing tab behavior tests**

Use Testing Library to verify the exact labels, default selection, filtered cards, keyboard movement, and empty state:

```ts
const baseCard: PublicNewsEventCard = {
  contentType: 'news',
  dateISO: '2026-08-17T00:00:00.000Z',
  dateLabel: 'Aug 17, 2026',
  excerpt: 'A current update.',
  href: '/news-events/current-update',
  id: 'current-update',
  isPastEvent: false,
  slug: 'current-update',
  title: 'Current update',
}
const groups = createEmptyNewsEventGroups()
groups.all = [baseCard]
groups.holiday = [
  {
    ...baseCard,
    contentType: 'holiday',
    href: '/news-events/campus-holiday',
    id: 'campus-holiday',
    slug: 'campus-holiday',
    title: 'Campus holiday',
  },
]
groups.notice = [
  {
    ...baseCard,
    contentType: 'notice',
    href: '/news-events/research-notice',
    id: 'research-notice',
    slug: 'research-notice',
    title: 'Research notice',
  },
]
const baseProps = {
  cardsPerRow: '3' as const,
  emptyStateMessage: 'No entries in this classification.',
  eventActionLabel: 'View details',
  newsActionLabel: 'Read update',
  sectionBackground: 'none' as const,
}

render(<NewsGridClassificationTabsClient groups={groups} {...baseProps} />)

expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
  'All',
  'News',
  'Events',
  'Notice',
  'Holiday',
  'Achievements',
  'Announcement',
  'Others',
])
expect(screen.getByRole('tab', { name: 'All' })).toHaveAttribute('aria-selected', 'true')

fireEvent.click(screen.getByRole('tab', { name: 'Holiday' }))
expect(screen.getByRole('tabpanel')).toHaveTextContent('Campus holiday')
expect(screen.getByRole('tabpanel')).not.toHaveTextContent('Research notice')
```

Add ArrowRight, ArrowLeft, Home, and End focus/selection assertions; a horizontal-overflow class assertion; 2/3/4-column class assertions; and an empty Notice panel that keeps the tablist visible.

- [ ] **Step 2: Run the new tab test and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid-classification-tabs.int.spec.tsx
```

Expected: FAIL because the client component does not exist.

- [ ] **Step 3: Implement the fixed ARIA tabs contract**

Use `useId()` and `useState<NewsEventClassificationTab>('all')`. Render each fixed classification as a `role="tab"` button with `aria-controls`, `aria-selected`, and roving `tabIndex`. On click and Arrow/Home/End keys, set the active value and focus the matching trigger.

The tab list uses semantic border/primary/current classes, `overflow-x-auto`, `shrink-0` triggers, and existing focus-visible ring classes. Do not add raw colors or manual dark-mode classes.

- [ ] **Step 4: Render stable panels and cards**

Render one active `role="tabpanel"` labelled by its tab. Use `getNewsGridClasses(cardsPerRow)` for the card grid and `NewsGridCollectionCard classificationStyle="badge"` for entries. If `groups[activeValue]` is empty, render the installed `Empty`, `EmptyHeader`, `EmptyTitle`, and `EmptyDescription` primitives with the configured message while preserving the tab list.

- [ ] **Step 5: Run tab, grid, and theme tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid-classification-tabs.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: PASS. Run `git diff --check`; leave all changes unstaged.

---

### Task 7: Align previews, thumbnails, generated types, docs, and final verification

**Files:**
- Modify: `src/blocks/NewsGrid/Component.tsx`
- Modify: `src/blocks/NewsGrid/Presentation.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Modify: `src/blocks/NewsEventsHighlights/PreviewComponent.tsx`
- Modify: `src/blocks/NewsGrid/PreviewComponent.tsx`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `public/block-thumbnails/news-events-highlights.jpg`
- Regenerate: `public/block-thumbnails/news-grid.jpg`
- Regenerate: `src/payload-types.ts`
- Modify: `tests/int/news-grid.int.spec.tsx`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate as needed: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: both new layout modes, grouped tab snapshots, carousel selection loaders, and generated Payload unions.
- Produces: production/live-preview parity, representative picker thumbnails, operator documentation, and current project-context knowledge.
- Preserves: current Page and Reusable Section registrations and renderer switch cases.

- [ ] **Step 1: Write failing preview/type/thumbnail assertions**

Extend preview scanner tests so a Page layout containing:

```ts
[
  { blockType: 'newsEventsHighlights', itemCount: 5, layout: 'featuredCarousel' },
  { blockType: 'newsGrid', displayMode: 'classificationTabs', itemsPerTab: '9' },
]
```

returns a carousel count of `5` and a grouped-grid count of `9`. Assert generated interfaces include the exact new unions and relationship/autoplay fields. Extend thumbnail assertions to keep the existing filenames and slugs.

Add presentation assertions proving `displayMode="classificationTabs"` renders its tablist without a section title, does not render `data-news-grid-feature`, and still renders valid footer actions. Assert a missing display mode still follows the existing title-guarded grid branch.

- [ ] **Step 2: Run preview and thumbnail tests and confirm failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-grid.int.spec.tsx tests/int/news-events-highlights.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: FAIL because the production grouped-data branch, preview snapshots, and generated types do not yet include the new mode.

- [ ] **Step 3: Integrate grouped data into the production News Grid block**

Extend `NewsGridBlockLike` with `displayMode` and `itemsPerTab`. Extend presentation props with optional `groups`.

In `Component.tsx`:

```ts
if (props.displayMode === 'classificationTabs') {
  const itemsPerTab = normalizeNewsGridItemsPerTab(props.itemsPerTab)
  const groups = await getNewsEventGroups(itemsPerTab, nowISO).catch(
    () => createEmptyNewsEventGroups(),
  )

  return <NewsGridBlockPresentation {...props} groups={groups} items={[]} />
}
```

Retain the existing item-count/feature-card loader for `grid` and missing values.

In `Presentation.tsx`, resolve the shared optional header once. The `grid` branch retains its current title guard. The `classificationTabs` branch renders the header only when at least one valid header field/action exists, then renders `NewsGridClassificationTabsClient` with groups, grid settings, action labels, surface, and empty-state text. Keep `BlockFooterActions` inside the same section container, and never pass the manual feature card into tabbed mode.

- [ ] **Step 4: Extend live-preview snapshots without server imports in client files**

Add `groupsByCount: Record<string, PublicNewsEventGroups>` to `NewsEventsPreviewSnapshot`. Add a scanner for tabbed `itemsPerTab`. In the server snapshot loader, fetch each distinct grouped count with `getNewsEventGroups()` and serialize it by count.

Highlights preview uses the snapshot's automatic items in carousel mode; manual relationship resolution remains a production server concern unless the relationship is already populated in the live-preview block value. News Grid preview selects `groupsByCount` for tabbed mode and the existing `newsGridByCount` for grid mode. Empty snapshot factories must include all three records.

- [ ] **Step 5: Update representative block fixtures**

Change the Highlights fixture to `layout="featuredCarousel"`, `autoplay={false}`, and at least four classification-varied items. Change the News Grid fixture to `displayMode="classificationTabs"`, `itemsPerTab="6"`, and grouped data covering all tab labels. Use existing local thumbnail assets only.

- [ ] **Step 6: Generate types and thumbnails**

Run:

```bash
pnpm generate:types
pnpm generate:block-thumbnails
```

Expected: Payload types include the seven-value `contentType`, Highlights layout/relationship/autoplay fields, and News Grid display/items-per-tab fields; the two existing JPEGs are regenerated at 1600×900.

Visually inspect both images with the local image viewer. Verify SNMIH typography, semantic colors, square radius, unclipped copy, active carousel rail state, fixed tab order, and balanced card geometry. Make at most one batched fixture/layout correction and regenerate once more if defects are visible.

- [ ] **Step 7: Update operator and project-context narratives**

Document in `docs/guides/news-events.md` that Entry Classification is single-choice with seven values and Event-only fields remain conditional. Document both new block modes and their fallback behavior in `docs/guides/blocks.md` and `docs/architecture/feature-inventory.md`.

Update `payload-model.md` with the expanded single classification and `block-system.md` with the two additive modes, legacy defaults, carousel curation/fallback, tab order, item counts, and theme contract.

- [ ] **Step 8: Run project-context regeneration and focused contracts**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts tests/int/news-events-data.int.spec.ts tests/int/news-events-highlights.int.spec.tsx tests/int/news-events-featured-carousel.int.spec.tsx tests/int/news-grid.int.spec.tsx tests/int/news-grid-classification-tabs.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/live-preview-import-boundary.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/regular-block-spacing.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: every command passes and project-context reports current generated facts.

- [ ] **Step 9: Run type, lint, and full integration verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm test:int
```

Expected: all commands pass. If a pre-existing unrelated failure appears, record its exact command and output without modifying unrelated code.

- [ ] **Step 10: Inspect final impact without staging or committing**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors; only approved News & Events schema, data, block, preview, generated, thumbnail, test, documentation, and project-context files are changed. Do not run `git add` or `git commit`.
