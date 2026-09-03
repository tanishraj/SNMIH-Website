# Annual Calendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Add a Page-compatible Annual Calendar block that renders January through December for the
current site-timezone year beside a stable Coming Next panel.

**Architecture:** Extend the existing Calendar domain with a serializable annual snapshot and
published/draft server loaders, then render it through a server component and client-safe preview
adapter that share one presentation. Register the block through the canonical catalog, reuse Calendar
classification, timezone, surface, and Upcoming contracts, and keep the existing interactive Calendar
unchanged.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4,
shadcn/ui primitives, Vitest, Playwright.

## Global Constraints

- Preserve the existing `calendar` block and its saved-content behavior.
- New block identity is `Annual Calendar`, slug `annualCalendar`, interface `AnnualCalendarBlock`.
- Current site-timezone year only; no public year, month, view, filter, or pagination controls.
- January through December always render, including empty months.
- Display typography is limited to the section-level title; month names use Inter and dates/labels use
  IBM Plex Mono.
- Use semantic appearance, foreground, border, success, and calendar-tone tokens in light and dark
  modes; do not add hard-coded theme colors or radii.
- One to five active Event-behavior classifications are required; an invalid scope never broadens.
- Event content remains collection-owned; no migration or content rewrite.
- Production and authenticated live preview share one presentation and equivalent snapshot data.
- Do not stage or commit any changes during execution.

---

## File Map

### Create

- `src/blocks/AnnualCalendar/annualCalendarShared.ts` — serializable annual types, month
  materialization, relationship and preview keys.
- `src/blocks/AnnualCalendar/config.ts` — Payload block schema.
- `src/blocks/AnnualCalendar/Component.tsx` — published server adapter.
- `src/blocks/AnnualCalendar/PreviewComponent.tsx` — client-safe preview adapter.
- `src/blocks/AnnualCalendar/Presentation.tsx` — shared section composition.
- `src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx` — annual month/event ledger.
- `src/blocks/AnnualCalendar/AnnualCalendarUpcoming.tsx` — Coming Next wrapper without the Calendar
  legend.
- `tests/int/annual-calendar-data.int.spec.ts` — timezone, query, normalization, ordering, and empty
  month contracts.
- `tests/int/annual-calendar.int.spec.tsx` — schema and presentation contracts.
- `public/block-thumbnails/annual-calendar.jpg` — generated Admin picker thumbnail.

### Modify

- `src/lib/siteTimeZone.ts` — timezone-correct year bounds.
- `src/lib/calendarEvents.ts` — annual published/draft data loaders and caching.
- `src/blocks/Calendar/CalendarUpcoming.tsx` — extract or expose reusable Upcoming event rows without
  changing the existing default legend.
- `src/lib/newsEventsPreviewShared.ts` — Annual Calendar scope discovery and preview snapshot field.
- `src/lib/newsEventsPreviewSnapshot.ts` — authenticated annual draft snapshot loading.
- `src/blocks/blockCatalog.ts` — Explore registration.
- `src/blocks/renderPageBlocks.tsx` — production renderer case.
- `src/blocks/renderLivePreviewPageBlocks.tsx` — preview renderer case.
- `src/hooks/newsEventClassificationReferences.ts` — deletion/behavior-change reference detection.
- `src/block-thumbnails/definitions.ts` — thumbnail metadata.
- `src/block-thumbnails/fixtures.tsx` — Annual Calendar fixture.
- `src/payload-types.ts` — generated Payload interfaces.
- `tests/int/news-event-classifications.int.spec.ts` — Annual Calendar reference regression.
- `tests/int/block-catalog.int.spec.ts` — catalog counts/order.
- `tests/int/page-blocks.int.spec.ts` — schema registration.
- `tests/int/live-preview-renderer.int.spec.tsx` — preview renderer contract.
- `tests/int/block-thumbnails.int.spec.ts` and
  `tests/int/block-thumbnail-fixtures.int.spec.ts` — picker coverage.
- `docs/guides/blocks.md`, `docs/guides/news-events.md`,
  `docs/architecture/feature-inventory.md` — operator contracts.
- `.agents/skills/project-context/references/block-system.md`,
  `.agents/skills/project-context/references/payload-model.md`,
  `.agents/skills/project-context/references/project-inventory.json` — maintained project context.

---

### Task 1: Annual Calendar domain contract and timezone year bounds

**Files:**

- Create: `src/blocks/AnnualCalendar/annualCalendarShared.ts`
- Modify: `src/lib/siteTimeZone.ts`
- Create: `tests/int/annual-calendar-data.int.spec.ts`
- Modify: `tests/int/site-time-zone.int.spec.ts`

**Interfaces:**

- Consumes: `CalendarClassification`, `CalendarEvent`, `getCalendarClassificationIDs`,
  `getZonedMonthKey`, and `SiteTimeZone`.
- Produces: `AnnualCalendarMonth`, `AnnualCalendarYearSnapshot`,
  `AnnualCalendarInitialSnapshot`, `getAnnualCalendarMonthKeys(year)`,
  `materializeAnnualCalendarMonths(year, events)`, `getAnnualCalendarScopeKey(ids)`, and
  `getZonedYearBounds(year, timeZone)`.

- [ ] **Step 1: Write failing shared-contract tests**

Add tests with exact expectations:

```ts
import {
  getAnnualCalendarMonthKeys,
  getAnnualCalendarScopeKey,
  materializeAnnualCalendarMonths,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import { getZonedYearBounds } from '@/lib/siteTimeZone'

it('materializes all twelve months and groups events by start month', () => {
  const events = [
    { id: 'august', startDateKey: '2026-08-23' },
    { id: 'january', startDateKey: '2026-01-02' },
  ] as never

  expect(getAnnualCalendarMonthKeys(2026)).toEqual([
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
    '2026-07',
    '2026-08',
    '2026-09',
    '2026-10',
    '2026-11',
    '2026-12',
  ])
  const months = materializeAnnualCalendarMonths(2026, events)
  expect(months).toHaveLength(12)
  expect(months[0]).toMatchObject({ monthKey: '2026-01', events: [{ id: 'january' }] })
  expect(months[7]).toMatchObject({ monthKey: '2026-08', events: [{ id: 'august' }] })
  expect(months[8]).toMatchObject({ monthKey: '2026-09', events: [] })
  expect(getAnnualCalendarScopeKey(['academic', 'exam'])).toBe('["academic","exam"]')
})

it('derives inclusive current-year bounds in the configured timezone', () => {
  expect(getZonedYearBounds(2026, 'Asia/Kolkata')).toEqual({
    endISO: '2026-12-31T18:29:59.999Z',
    startISO: '2025-12-31T18:30:00.000Z',
  })
  expect(getZonedYearBounds(2026, 'Asia/Dubai')).toEqual({
    endISO: '2026-12-31T19:59:59.999Z',
    startISO: '2025-12-31T20:00:00.000Z',
  })
})
```

- [ ] **Step 2: Run the tests and verify the missing exports fail**

Run:

```bash
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/site-time-zone.int.spec.ts
```

Expected: FAIL because Annual Calendar helpers and `getZonedYearBounds` do not exist.

- [ ] **Step 3: Implement the shared serializable types and helpers**

Create `annualCalendarShared.ts` with this public contract:

```ts
import {
  getCalendarClassificationIDs,
  type CalendarClassification,
  type CalendarEvent,
} from '@/blocks/Calendar/calendarShared'
import type { SiteTimeZone } from '@/lib/siteTimeZone'

export const ANNUAL_CALENDAR_RESPONSE_VERSION = 1 as const

export type AnnualCalendarMonth = {
  events: CalendarEvent[]
  monthKey: string
  monthLabel: string
}

export type AnnualCalendarYearSnapshot = {
  classifications: CalendarClassification[]
  months: AnnualCalendarMonth[]
  version: typeof ANNUAL_CALENDAR_RESPONSE_VERSION
  year: number
}

export type AnnualCalendarInitialSnapshot = AnnualCalendarYearSnapshot & {
  timeZone: SiteTimeZone
  todayKey: string
  upcoming: CalendarEvent[]
}

export const getAnnualCalendarClassificationIDs = (value: unknown): string[] =>
  getCalendarClassificationIDs(value)

export const getAnnualCalendarScopeKey = (classificationIDs: readonly string[]): string =>
  JSON.stringify(classificationIDs)

export const getAnnualCalendarMonthKeys = (year: number): string[] =>
  Number.isInteger(year) && year >= 1000 && year <= 9999
    ? Array.from({ length: 12 }, (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`)
    : []

const monthName = (monthKey: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${monthKey}-01T00:00:00.000Z`),
  )

export const materializeAnnualCalendarMonths = (
  year: number,
  events: CalendarEvent[],
): AnnualCalendarMonth[] => {
  const eventsByMonth = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const monthKey = event.startDateKey.slice(0, 7)
    eventsByMonth.set(monthKey, [...(eventsByMonth.get(monthKey) ?? []), event])
  }

  return getAnnualCalendarMonthKeys(year).map((monthKey) => ({
    events: eventsByMonth.get(monthKey) ?? [],
    monthKey,
    monthLabel: monthName(monthKey),
  }))
}
```

Add `getZonedYearBounds` by composing the existing month-bound helper:

```ts
export const getZonedYearBounds = (
  year: number,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): ZonedMonthBounds => {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error(`Invalid year: ${year}`)
  }
  const january = getZonedMonthBounds(`${year}-01`, timeZone)
  const december = getZonedMonthBounds(`${year}-12`, timeZone)
  return { endISO: december.endISO, startISO: january.startISO }
}
```

- [ ] **Step 4: Run the shared-contract tests**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Run formatting and type checking for the new contract**

```bash
pnpm exec prettier --write src/blocks/AnnualCalendar/annualCalendarShared.ts src/lib/siteTimeZone.ts tests/int/annual-calendar-data.int.spec.ts tests/int/site-time-zone.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: both commands exit 0.

---

### Task 2: Published and draft annual data loaders

**Files:**

- Modify: `src/lib/calendarEvents.ts`
- Modify: `tests/int/annual-calendar-data.int.spec.ts`

**Interfaces:**

- Consumes: Task 1 annual snapshot types/helpers, existing `resolveCalendarClassifications`,
  `fetchCalendarUpcoming`, `normalizeEvents`, `calendarEventSelect`, cache tags, and site timezone.
- Produces: `buildCalendarYearWhere`, `fetchAnnualCalendarYear`,
  `getPublicAnnualCalendarInitialSnapshot`, and `getDraftAnnualCalendarInitialSnapshot`.

- [ ] **Step 1: Add failing query, normalization, strict-scope, and Upcoming tests**

Add tests asserting:

```ts
expect(
  buildCalendarYearWhere({
    classificationIDs: ['academic', 'exam'],
    endISO: '2026-12-31T18:29:59.999Z',
    startISO: '2025-12-31T18:30:00.000Z',
  }),
).toEqual({
  and: [
    { _status: { equals: 'published' } },
    { workflowState: { equals: 'published' } },
    { classification: { in: ['academic', 'exam'] } },
    { eventStart: { greater_than_equal: '2025-12-31T18:30:00.000Z' } },
    { eventStart: { less_than_equal: '2026-12-31T18:29:59.999Z' } },
  ],
})
```

Mock classification and event queries, call `fetchAnnualCalendarYear`, and assert:

```ts
expect(snapshot).toMatchObject({ version: 1, year: 2026 })
expect(snapshot.months).toHaveLength(12)
expect(snapshot.months[0]?.events.map(({ id }) => id)).toEqual(['january-a', 'january-b'])
expect(snapshot.months[7]?.events.map(({ id }) => id)).toEqual(['august'])
expect(snapshot.months[11]?.events).toEqual([])
```

Also assert a partial/inactive scope rejects with `CalendarScopeError`, draft mode forwards
`draft: true`, `overrideAccess: false`, and `user`, and the initial snapshot returns the existing next
four Upcoming semantics even when those events enter the following year.

- [ ] **Step 2: Run the annual data tests and verify failure**

```bash
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/calendar-data.int.spec.ts
```

Expected: FAIL because annual loader exports do not exist.

- [ ] **Step 3: Add the annual query and year loader**

Implement these exact signatures in `calendarEvents.ts`:

```ts
export const buildCalendarYearWhere = ({
  classificationIDs,
  endISO,
  published = true,
  startISO,
}: {
  classificationIDs: string[]
  endISO: string
  published?: boolean
  startISO: string
}): Where => ({
  and: [
    ...(published
      ? [{ _status: { equals: 'published' } }, { workflowState: { equals: 'published' } }]
      : []),
    { classification: { in: classificationIDs } },
    { eventStart: { greater_than_equal: startISO } },
    { eventStart: { less_than_equal: endISO } },
  ],
})

export async function fetchAnnualCalendarYear(
  payload: CalendarPayload,
  classificationIDs: readonly string[],
  year: number,
  timeZone: SiteTimeZone,
  mode: CalendarReadMode,
): Promise<AnnualCalendarYearSnapshot> {
  const classifications = await resolveCalendarClassifications(payload, classificationIDs, mode)
  const { endISO, startISO } = getZonedYearBounds(year, timeZone)
  const result = await payload.find({
    collection: 'news-events',
    depth: 0,
    pagination: false,
    select: calendarEventSelect,
    sort: ['eventStart', 'id'],
    where: buildCalendarYearWhere({
      classificationIDs: classifications.map(({ id }) => id),
      endISO,
      published: mode.overrideAccess,
      startISO,
    }),
    ...mode,
  })
  const events = normalizeEvents(result.docs, classifications, timeZone)
  return {
    classifications,
    months: materializeAnnualCalendarMonths(year, events),
    version: ANNUAL_CALENDAR_RESPONSE_VERSION,
    year,
  }
}
```

- [ ] **Step 4: Add public and authenticated-draft initial snapshot loaders**

Implement:

```ts
export async function getPublicAnnualCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  now: Date = new Date(),
): Promise<AnnualCalendarInitialSnapshot>

export async function getDraftAnnualCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  user: User,
  now: Date = new Date(),
): Promise<AnnualCalendarInitialSnapshot>
```

The public function must derive `timeZone`, `todayKey`, and `year` from `getZonedToday(now,
timeZone)`, cache year data indefinitely under
`['annual-calendar-year', version, year, timeZone, ...classificationIDs]`, and use the existing
five-minute Upcoming bucket and Calendar/news/classification/site-settings tags. The draft function
must call `fetchAnnualCalendarYear` and `fetchCalendarUpcoming` with
`{ draft: true, overrideAccess: false, user }` and must not use public caches.

- [ ] **Step 5: Run annual and existing Calendar data tests**

Run the Step 2 command. Expected: PASS with no existing Calendar regressions.

---

### Task 3: Block schema and theme-aligned presentation

**Files:**

- Create: `src/blocks/AnnualCalendar/config.ts`
- Create: `src/blocks/AnnualCalendar/Component.tsx`
- Create: `src/blocks/AnnualCalendar/PreviewComponent.tsx`
- Create: `src/blocks/AnnualCalendar/Presentation.tsx`
- Create: `src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx`
- Create: `src/blocks/AnnualCalendar/AnnualCalendarUpcoming.tsx`
- Modify: `src/blocks/Calendar/CalendarUpcoming.tsx`
- Create: `tests/int/annual-calendar.int.spec.tsx`
- Modify: `tests/int/calendar-ui-contracts.int.spec.tsx`

**Interfaces:**

- Consumes: Task 1 snapshot types, Task 2 loaders, shared block appearance/actions/spacing/content
  styles, Calendar tones and surface classes.
- Produces: `AnnualCalendarBlock`, `AnnualCalendarBlockComponent`,
  `AnnualCalendarPreviewBlockComponent`, `AnnualCalendarBlockPresentation`, and
  `AnnualCalendarBlockLike`.

- [ ] **Step 1: Write failing schema and rendering tests**

Assert the schema identity and parity:

```ts
expect(AnnualCalendarBlock).toMatchObject({
  interfaceName: 'AnnualCalendarBlock',
  labels: { plural: 'Annual Calendars', singular: 'Annual Calendar' },
  slug: 'annualCalendar',
})
expect(findNamedField(AnnualCalendarBlock.fields, 'classifications')).toMatchObject({
  hasMany: true,
  maxRows: 5,
  minRows: 1,
  relationTo: 'news-event-classifications',
  required: true,
})
expect(findNamedField(AnnualCalendarBlock.fields, 'upcomingTitle')).toMatchObject({
  defaultValue: 'Coming next',
})
expect(findNamedField(AnnualCalendarBlock.fields, 'adjacentMonthDates')).toBeUndefined()
```

Render a fixture snapshot and assert `data-annual-calendar-block`, twelve
`data-annual-calendar-month` nodes, `data-current-month`, `data-today`, all event links, Coming Next,
no classification legend, no display-font class on month names, and the shared section heading class.
Render brand/dark-compatible surface inputs and assert semantic token classes rather than literal color
values.

- [ ] **Step 2: Run presentation tests and verify failure**

```bash
pnpm exec vitest run tests/int/annual-calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: FAIL because the block and presentation do not exist.

- [ ] **Step 3: Implement the Payload config by preserving Calendar field contracts**

Create a two-tab schema with the exact fields listed in the approved spec. Reuse
`CALENDAR_MAX_CLASSIFICATIONS`, `getAnnualCalendarClassificationIDs`,
`createContentActionsField`, and `createBlockAppearanceFields`. Keep Calendar's relationship
`filterOptions`, validation messages, `allowCreate: false`, and `isSortable: true`. Use `Coming next`
as the Annual Calendar `upcomingTitle` default and omit `adjacentMonthDates`.

- [ ] **Step 4: Implement the server and preview adapters**

Server adapter contract:

```tsx
export async function AnnualCalendarBlockComponent(props: AnnualCalendarBlockLike) {
  const classificationIDs = getAnnualCalendarClassificationIDs(props.classifications)
  if (classificationIDs.length === 0) return <AnnualCalendarBlockPresentation {...props} />

  try {
    const initial = await getPublicAnnualCalendarInitialSnapshot(classificationIDs)
    return <AnnualCalendarBlockPresentation {...props} initial={initial} />
  } catch (error) {
    if (error instanceof CalendarScopeError) return <AnnualCalendarBlockPresentation {...props} />
    throw error
  }
}
```

Preview adapter must resolve the ordered IDs, look up
`snapshot.annualCalendarByScope[getAnnualCalendarScopeKey(ids)]`, and render the same presentation
with `draft` set.

- [ ] **Step 5: Implement the Institutional Ledger presentation**

Use these stable layout contracts:

```tsx
<div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
  <AnnualCalendarLedger
    emptyMessage={resolvedEmptyMessage}
    months={initial.months}
    surface={appearanceClasses.surface}
    todayKey={initial.todayKey}
    year={initial.year}
  />
  <AnnualCalendarUpcoming
    emptyMessage={resolvedEmptyMessage}
    eyebrow={resolvedUpcomingEyebrow}
    events={initial.upcoming}
    surface={appearanceClasses.surface}
    title={resolvedUpcomingTitle}
  />
</div>
```

The ledger must use `border-l-2 border-l-success`, semantic surface borders, Inter month headings,
mono date/status/classification labels, calendar-tone marker styles, complete `<a>` rows, and a subtle
semantic today surface. The Upcoming wrapper must use the existing Calendar event-list contract but
omit the classification legend. Extend `CalendarUpcoming` only through a backward-compatible
`showLegend = true` prop or extract an internal shared list; existing Calendar output must remain
identical.

- [ ] **Step 6: Run schema/presentation and existing Calendar UI tests**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 7: Run the UI quality checks**

```bash
pnpm exec eslint src/blocks/AnnualCalendar src/blocks/Calendar/CalendarUpcoming.tsx tests/int/annual-calendar.int.spec.tsx --max-warnings=0
pnpm exec prettier --check src/blocks/AnnualCalendar src/blocks/Calendar/CalendarUpcoming.tsx tests/int/annual-calendar.int.spec.tsx
```

Expected: both commands exit 0.

---

### Task 4: Preview pipeline, registries, and classification governance

**Files:**

- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Modify: `src/blocks/blockCatalog.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/hooks/newsEventClassificationReferences.ts`
- Modify: `tests/int/annual-calendar.int.spec.tsx`
- Modify: `tests/int/news-event-classifications.int.spec.ts`
- Modify: `tests/int/block-catalog.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Modify: every manually constructed `NewsEventsPreviewSnapshot` fixture reported by TypeScript.

**Interfaces:**

- Consumes: Task 1 scope helper, Task 2 draft loader, Task 3 block adapters.
- Produces: `annualCalendarByScope` preview data, Explore catalog registration, renderer coverage, and
  guarded classification references.

- [ ] **Step 1: Write failing preview-scope and governance tests**

Add scope discovery coverage through a populated Reusable Section:

```ts
expect(
  getAnnualCalendarPreviewScopes([
    {
      blockType: 'reusableSection',
      section: {
        layout: [{ blockType: 'annualCalendar', classifications: ['academic', { id: 'exam' }] }],
      },
    },
  ] as never),
).toEqual([{ classificationIDs: ['academic', 'exam'], key: '["academic","exam"]' }])
```

Add a deletion-reference matrix row containing
`{ blockType: 'annualCalendar', classifications: ['classification-1'] }` and expect the containing
Page label. Add renderer tests that production calls `AnnualCalendarBlockComponent` and live preview
uses `AnnualCalendarPreviewBlockComponent` with `newsEventsSnapshot`.

- [ ] **Step 2: Run the integration contracts and verify failure**

```bash
pnpm exec vitest run tests/int/annual-calendar.int.spec.tsx tests/int/news-event-classifications.int.spec.ts tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx
```

Expected: FAIL because Annual Calendar is not registered or discovered.

- [ ] **Step 3: Extend the preview snapshot without crossing client/server boundaries**

Add:

```ts
annualCalendarByScope: Record<string, AnnualCalendarInitialSnapshot>
```

to `NewsEventsPreviewSnapshot` and its empty value. Add a recursive
`getAnnualCalendarPreviewScopes(layout)` alongside `getCalendarPreviewScopes`, using the same
WeakSet, maximum depth, Reusable Section traversal, ID normalization, and de-duplication by scope key.
In `loadNewsEventsPreviewSnapshot`, load each scope only when `user` exists:

```ts
const annualCalendarEntries = user
  ? await Promise.all(
      getAnnualCalendarPreviewScopes(layout).map(async ({ classificationIDs, key }) => {
        const initial = await getDraftAnnualCalendarInitialSnapshot(classificationIDs, user)
        return [key, initial] as const
      }),
    )
  : []
```

Return `annualCalendarByScope: Object.fromEntries(annualCalendarEntries)` and update test snapshot
fixtures with `annualCalendarByScope: {}`.

- [ ] **Step 4: Register the block and renderers**

Import `AnnualCalendarBlock` and place it immediately after `CalendarBlock` in the Explore group.
Import the production and preview adapters and add `case 'annualCalendar'` adjacent to `calendar` in
both renderers. Expected catalog totals become:

- Page blocks: 55
- Reusable Section blocks: 54
- Recommended blocks: 20
- Explore order: News & Events Tabs, Calendar, Annual Calendar, Department Profiles, Gallery Album
  Tabs, Q&A Accordion
- Advanced blocks: 35

- [ ] **Step 5: Extend guarded classification references**

Add `value.blockType === 'annualCalendar'` to the relationship-bearing block condition in
`newsEventClassificationReferences.ts`. Update behavior-change copy so it names Calendar, Annual
Calendar, Highlights, and Tabs without implying that only one block type is protected.

- [ ] **Step 6: Run the integration contracts**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 7: Run client/server import-boundary tests**

```bash
pnpm exec vitest run tests/int/live-preview-import-boundary.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts
```

Expected: PASS; no client graph imports `calendarEvents.ts`, Payload, or `server-only`.

---

### Task 5: Thumbnail, generated types, and authoring coverage

**Files:**

- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Create: `public/block-thumbnails/annual-calendar.jpg`
- Modify: `src/payload-types.ts` through generation
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**

- Consumes: Task 3 presentation and Task 1 annual snapshot types.
- Produces: Admin picker image and generated `AnnualCalendarBlock` Payload type.

- [ ] **Step 1: Add failing thumbnail-definition and fixture expectations**

Expect this definition:

```ts
{
  alt: 'Annual Calendar block preview',
  filename: 'annual-calendar.jpg',
  label: 'Annual Calendar',
  slug: 'annualCalendar',
  stageAlignment: 'top',
  url: '/block-thumbnails/annual-calendar.jpg',
}
```

and require `blockThumbnailFixtures.annualCalendar` to render the production presentation.

- [ ] **Step 2: Run thumbnail tests and verify failure**

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL because definition, fixture, and image are absent.

- [ ] **Step 3: Add the fixture and definition**

Create a 2026 annual snapshot from the existing Calendar thumbnail classifications/events, with all
twelve materialized months, `todayKey: '2026-08-23'`, and the existing four upcoming events. Render
`AnnualCalendarBlockPresentation` with `size="compact"`, `title="Academic calendar"`, and realistic
SNMIH content. Add the thumbnail definition immediately after Calendar.

- [ ] **Step 4: Generate Payload types and the thumbnail**

```bash
pnpm generate:types
BLOCK_THUMBNAIL_SLUG=annualCalendar pnpm generate:block-thumbnails
```

Expected: `src/payload-types.ts` contains `AnnualCalendarBlock`, and
`public/block-thumbnails/annual-calendar.jpg` exists without rewriting unrelated thumbnails.

- [ ] **Step 5: Run thumbnail, catalog, type, and formatting checks**

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-catalog.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec prettier --check src/blocks/AnnualCalendar src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/annual-calendar.int.spec.tsx tests/int/annual-calendar-data.int.spec.ts
```

Expected: all commands exit 0.

---

### Task 6: Documentation, project context, and release-level verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` through the updater

**Interfaces:**

- Consumes: all completed implementation contracts.
- Produces: operator guidance, maintained architecture knowledge, and verified release evidence.

- [ ] **Step 1: Update operator and architecture documentation**

Document these exact behaviors:

- Annual Calendar is a collection-backed Explore block distinct from Calendar.
- It renders the current timezone year from January through December and keeps empty months.
- It uses one to five active Event classifications and the same Upcoming semantics as Calendar.
- Coming Next is sticky beside the ledger and stacks below on mobile.
- It supports shared section appearance, actions, alignment, spacing, light mode, and dark mode.
- Classification deletion/behavior changes report Annual Calendar references.
- It has no public navigation/filter controls and requires no migration.

Update maintained block counts to 55 Page blocks and 54 Reusable Section blocks.

- [ ] **Step 2: Run focused Annual Calendar and adjacent-domain tests**

```bash
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx tests/int/calendar-data.int.spec.ts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/news-event-classifications.int.spec.ts tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/theme-contracts.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 3: Run static verification**

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm exec prettier --check src/blocks/AnnualCalendar src/lib/calendarEvents.ts src/lib/siteTimeZone.ts src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/blocks/blockCatalog.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/hooks/newsEventClassificationReferences.ts tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx
git diff --check
```

Expected: every command exits 0 with no warnings promoted by project policy.

- [ ] **Step 4: Run the complete integration suite**

```bash
pnpm test:int
```

Expected: all integration files and tests pass. If MongoMemoryServer cannot bind inside the sandbox,
rerun the same command with approved localhost permission; do not treat `listen EPERM` as a product
failure.

- [ ] **Step 5: Perform one bounded browser validation pass**

Run the local app and validate one desktop and one mobile viewport for:

- all twelve months
- sticky desktop and stacked mobile Coming Next placement
- long event titles and dense months
- keyboard focus order
- current month and today labels
- light and dark SNMIH modes
- empty year and invalid-scope configuration states

Fix discovered defects in one batch and perform one confirmation pass. Do not begin an open-ended
polish loop.

- [ ] **Step 6: Refresh and validate project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` A stale optional knowledge-graph commit hash remains a warning,
not a failure.

- [ ] **Step 7: Inspect the final change impact without staging or committing**

```bash
git status --short
git diff --check
git diff -- src/blocks/AnnualCalendar src/lib/calendarEvents.ts src/lib/siteTimeZone.ts src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/blocks/blockCatalog.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/hooks/newsEventClassificationReferences.ts docs/guides/blocks.md docs/guides/news-events.md docs/architecture/feature-inventory.md
```

Confirm the diff contains no migration, no unrelated rewrite, no staged files introduced by this plan,
and no change to the existing Calendar public behavior.
