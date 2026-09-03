# Calendar Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a theme-aware, accessible Calendar Page block backed by published News & Events, with an IST-first month grid, timeline, filtering, stable Upcoming panel, draft preview support, and validated month loading.

**Architecture:** Keep calendar date arithmetic and serialized presentation types in client-safe modules, while Payload queries, access enforcement, caching, and Site Settings reads remain server-only. Production server-renders the current month and Upcoming data, then a focused client component manages view/filter/month state and requests validated month snapshots without importing Payload.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 App Router, React 19 Server/Client Components, TypeScript 5.7, Tailwind CSS 4, Radix-backed shadcn primitives, Vitest, Testing Library, Playwright, Sharp.

## Global Constraints

- Keep the project one client per deployment; do not add tenant, marketplace, or per-visitor configuration.
- Source events only from News & Events records whose resolved classification is active and has Event behavior.
- Allow one to five ordered classifications per Calendar block; invalid non-empty scopes must never widen to all classifications.
- Default and fallback site timezone is exactly `Asia/Kolkata`; browser timezone must not affect rendered labels or grouping.
- Desktop opens in Calendar view; below `md`, render Timeline-first and hide the view toggle.
- Upcoming always contains the next four qualifying events across the complete selected scope and never changes with month, filter, or view.
- Month cells show at most two events; `+N more` switches to Timeline and focuses that local date.
- Multi-day ranges are inclusive; all-day events omit time and treat the final local date as inclusive.
- Use semantic Card/foreground/border/radius tokens and five Calendar tone variables; do not use raw Tailwind palette colors.
- Preserve explicit server/client registry boundaries, public/draft access enforcement, Reusable Section depth guards, and production/live-preview parity.
- Do not migrate existing documents. Missing Calendar Color resolves to Blue, missing All-day resolves to false, and missing Site Timezone resolves to `Asia/Kolkata`.
- Do not create Git commits during execution. Leave all implementation, generated, documentation, and project-context changes uncommitted for user review.

---

## File Structure

### New files

- `src/lib/siteTimeZone.ts` — supported IANA timezone contract and deterministic zoned date arithmetic/formatting.
- `src/lib/siteTimeZone.server.ts` — cached public Site Settings timezone loader.
- `src/blocks/Calendar/calendarShared.ts` — client-safe Calendar types, request constants, classification-scope normalization, six-week grid construction, and event coverage helpers.
- `src/lib/calendarEvents.ts` — server-only classification resolution, published/draft month queries, Upcoming query, normalization, and public caching.
- `src/app/api/calendar-events/route.ts` — validated read-only public/draft month endpoint.
- `src/blocks/Calendar/config.ts` — Payload block schema.
- `src/blocks/Calendar/Component.tsx` — production Server Component adapter.
- `src/blocks/Calendar/PreviewComponent.tsx` — client-safe live-preview adapter.
- `src/blocks/Calendar/Presentation.tsx` — shared section shell and initial client props.
- `src/blocks/Calendar/CalendarClient.tsx` — client state, toolbar, fetching, cache, retry, live announcements, and focus transfer.
- `src/blocks/Calendar/CalendarMonthView.tsx` — semantic Sunday-first six-week month table.
- `src/blocks/Calendar/CalendarTimelineView.tsx` — chronological ruled event rows.
- `src/blocks/Calendar/CalendarUpcoming.tsx` — stable Upcoming list and classification legend.
- `src/blocks/Calendar/calendarTone.ts` — semantic tone normalization and CSS-variable presentation mapping.
- `tests/int/site-time-zone.int.spec.ts` — timezone schema/arithmetic/formatting contract.
- `tests/int/calendar-data.int.spec.ts` — query, normalization, sorting, public/draft access, and caching contract.
- `tests/int/calendar-route.int.spec.ts` — endpoint validation and authentication contract.
- `tests/int/calendar.int.spec.tsx` — block schema, rendering, responsive classes, interaction, accessibility, and preview contract.
- `tests/e2e/calendar.e2e.spec.ts` — generated preview desktop/mobile and month-loading browser smoke.
- `public/block-thumbnails/calendar.jpg` — generated 1600×900 block picker thumbnail.

### Modified files

- `src/globals/SiteSettings.ts` — Regional tab and timezone field.
- `src/collections/NewsEventClassifications.ts` — classification-owned Calendar Color.
- `src/collections/NewsEvents.ts` — All-day event control.
- `src/hooks/resolveNewsEventClassification.ts` — clear All-day for Story behavior.
- `src/hooks/revalidateCmsContent.ts` — Calendar/classification/Site Settings cache tags and invalidation.
- `src/lib/newsEventClassifications.ts` — normalized Calendar tone on classification records.
- `src/lib/newsEventsShared.ts` — timezone-aware labels and all-day public fields.
- `src/lib/newsEvents.ts` — select All-day and pass configured timezone into every public adapter.
- `src/lib/newsEventsMetadata.ts` — date-only structured data for all-day events.
- `src/components/news-events/NewsEventStory.tsx` and News Grid/Tabs/Highlights presentation files — consume preformatted server labels.
- `src/lib/newsEventsPreviewShared.ts`, `src/lib/newsEventsPreviewSnapshot.ts` — discover and load Calendar scopes, including Reusable Sections.
- Page and News/Event preview routes/components — pass the authenticated user and configured timezone through preview data.
- `src/blocks/blockCatalog.ts`, production renderer, and live-preview renderer — register Calendar in Explore with parity.
- `src/block-thumbnails/definitions.ts`, `src/block-thumbnails/fixtures.tsx` — picker metadata and production-component fixture.
- `src/styles/globals.css`, `tests/int/theme-contracts.int.spec.ts` — Calendar semantic tones and contrast checks.
- Registry/count/thumbnail tests — change Page count 53→54, Reusable count 52→53, recommended vocabulary 18→19, and include Calendar.
- `src/payload-types.ts`, `src/app/(payload)/admin/importMap.js` — generated artifacts.
- `docs/guides/blocks.md`, `docs/guides/news-events.md`, `docs/architecture/feature-inventory.md` — editor/operator contract.
- `.agents/skills/project-context/references/project-inventory.json`, `block-system.md`, `payload-model.md`, and `architecture.md` — maintained project context.

---

### Task 1: Site timezone and zoned date foundation

**Files:**
- Create: `src/lib/siteTimeZone.ts`
- Create: `src/lib/siteTimeZone.server.ts`
- Modify: `src/globals/SiteSettings.ts:46-187`
- Modify: `src/hooks/revalidateCmsContent.ts:12-127`
- Test: `tests/int/site-time-zone.int.spec.ts`

**Interfaces:**
- Produces: `DEFAULT_SITE_TIME_ZONE`, `SUPPORTED_SITE_TIME_ZONES`, `SiteTimeZone`, `normalizeSiteTimeZone(value)`, `getZonedDateKey(value, timeZone)`, `getZonedMonthKey(value, timeZone)`, `getZonedToday(now, timeZone)`, `getZonedMonthBounds(monthKey, timeZone)`, `expandInclusiveDateKeys(startKey, endKey)`, `formatZonedDate`, `formatZonedTime`, `formatZonedDateRange`, and `getSiteTimeZone()`.
- Consumes: existing `CMS_CACHE_TAGS.globals` and public Site Settings access.

- [ ] **Step 1: Write failing timezone and Site Settings tests**

```ts
expect(normalizeSiteTimeZone(undefined)).toBe('Asia/Kolkata')
expect(normalizeSiteTimeZone('Europe/London')).toBe('Europe/London')
expect(normalizeSiteTimeZone('Mars/Olympus')).toBe('Asia/Kolkata')
expect(getZonedDateKey('2026-08-01T19:00:00.000Z', 'Asia/Kolkata')).toBe('2026-08-02')
expect(getZonedMonthKey('2026-07-31T19:00:00.000Z', 'Asia/Kolkata')).toBe('2026-08')
expect(getZonedMonthBounds('2026-08', 'Asia/Kolkata')).toEqual({
  endISO: '2026-08-31T18:29:59.999Z',
  startISO: '2026-07-31T18:30:00.000Z',
})
expect(expandInclusiveDateKeys('2026-08-30', '2026-09-02')).toEqual([
  '2026-08-30',
  '2026-08-31',
  '2026-09-01',
  '2026-09-02',
])
expect(findNamedField(SiteSettings.fields, 'timeZone')).toMatchObject({
  defaultValue: 'Asia/Kolkata',
  required: true,
  type: 'select',
})
```

- [ ] **Step 2: Run the focused test and verify the missing-module/schema failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-time-zone.int.spec.ts`

Expected: FAIL because `siteTimeZone.ts`, `siteTimeZone.server.ts`, and the `timeZone` field do not exist.

- [ ] **Step 3: Implement the supported timezone and zoned arithmetic contract**

```ts
export const DEFAULT_SITE_TIME_ZONE = 'Asia/Kolkata' as const
export const SUPPORTED_SITE_TIME_ZONES = [
  'Asia/Kolkata',
  'UTC',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
] as const

export type SiteTimeZone = (typeof SUPPORTED_SITE_TIME_ZONES)[number]

const supported = new Set<string>(SUPPORTED_SITE_TIME_ZONES)
export const normalizeSiteTimeZone = (value: unknown): SiteTimeZone =>
  typeof value === 'string' && supported.has(value)
    ? (value as SiteTimeZone)
    : DEFAULT_SITE_TIME_ZONE

export type ZonedMonthBounds = { endISO: string; startISO: string }
export type ZonedFormatOptions = { allDay?: boolean; timeZone?: SiteTimeZone }
```

Use `Intl.DateTimeFormat(...).formatToParts()` to obtain year/month/day/hour/minute/second in the requested zone. Convert a local midnight to UTC by iteratively correcting a `Date.UTC(...)` guess against those zoned parts; compute the month end as one millisecond before the next local month begins. Perform `YYYY-MM-DD` iteration with UTC calendar arithmetic on the key itself so the browser timezone never participates.

- [ ] **Step 4: Add the Regional tab and cached public loader**

```ts
{
  label: 'Regional',
  fields: [{
    name: 'timeZone',
    label: 'Site Timezone',
    type: 'select',
    defaultValue: DEFAULT_SITE_TIME_ZONE,
    required: true,
    options: SUPPORTED_SITE_TIME_ZONES.map((value) => ({ label: value, value })),
    admin: {
      description:
        'Used for event dates, event times, calendar month boundaries, and the current day.',
    },
  }],
}
```

In `siteTimeZone.server.ts`, mark the module `server-only`, read the published `site-settings` value with `depth: 0` and `draft: false`, normalize it, and wrap it in `unstable_cache` with `CMS_CACHE_TAGS.siteSettings` and `revalidate: false`.

- [ ] **Step 5: Add focused cache invalidation for Site Settings**

Add `calendar` and `siteSettings` tags. Replace the Site Settings hook with a dedicated `revalidateSiteSettingsCache` that revalidates `globals`, `pages`, `siteSettings`, and `calendar`. Leave other globals on the existing generic hook.

- [ ] **Step 6: Re-run the focused test**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/site-time-zone.int.spec.ts`

Expected: PASS for IANA fallback, IST midnight/month boundaries, inclusive date expansion, Regional schema, and cache-tag ownership.

### Task 2: Classification color, All-day events, and shared News & Events formatting

**Files:**
- Modify: `src/collections/NewsEventClassifications.ts:49-115`
- Modify: `src/collections/NewsEvents.ts:246-292`
- Modify: `src/hooks/resolveNewsEventClassification.ts:102-132`
- Modify: `src/lib/newsEventClassifications.ts:78-124`
- Modify: `src/lib/newsEventsShared.ts:27-305`
- Modify: `src/lib/newsEvents.ts:36-68,278-669`
- Modify: `src/lib/newsEventsMetadata.ts:42-59`
- Modify: `src/components/news-events/NewsEventStory.tsx:105-137`
- Modify: `src/blocks/NewsEventsHighlights/resolveItems.ts`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsCard.tsx`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsRow.tsx`
- Modify: `src/blocks/NewsGrid/Presentation.tsx`
- Test: `tests/int/news-events-collection.int.spec.ts`
- Test: `tests/int/news-grid.int.spec.tsx`
- Test: `tests/int/news-events-metadata.int.spec.ts`
- Test: `tests/int/news-events-data.int.spec.ts`

**Interfaces:**
- Consumes: Task 1 timezone formatters and `getSiteTimeZone()`.
- Produces: `CalendarTone = 'amber' | 'blue' | 'cyan' | 'green' | 'violet'`; every `ResolvedNewsEventClassification` has normalized `calendarColor`; `NewsEventCardSource`; public event cards expose `eventAllDay`, `eventStartDateKey`, and `eventEndDateKey`; `dateLabel` is already correctly formatted server-side.

- [ ] **Step 1: Extend existing tests with color, all-day, and IST cases**

```ts
expect(findNamedField(NewsEventClassifications.fields, 'calendarColor')).toMatchObject({
  defaultValue: 'blue',
  type: 'select',
})
expect(calendarColorCondition({}, { behavior: 'event' })).toBe(true)
expect(calendarColorCondition({}, { behavior: 'story' })).toBe(false)
expect(findNamedField(NewsEvents.fields, 'eventAllDay')).toMatchObject({
  defaultValue: false,
  type: 'checkbox',
})
expect(clearNewsEventEventFields({ eventAllDay: true })).toMatchObject({ eventAllDay: null })
expect(normalizeNewsEventClassificationRecord({
  active: true,
  behavior: 'event',
  id: 'academic',
  slug: 'academic',
  title: 'Academic',
})?.calendarColor).toBe('blue')
```

Add formatting assertions for a timestamp that crosses midnight in IST, an inclusive all-day range, and Story clearing.

- [ ] **Step 2: Run the four focused suites and verify failures**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts tests/int/news-grid.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/news-events-data.int.spec.ts`

Expected: FAIL on missing fields, missing normalized color/all-day values, and UTC-only labels.

- [ ] **Step 3: Add classification color and All-day schema fields**

Use exactly these options and fallbacks:

```ts
export const CALENDAR_TONES = ['green', 'blue', 'cyan', 'amber', 'violet'] as const
export type CalendarTone = (typeof CALENDAR_TONES)[number]
export const normalizeCalendarTone = (value: unknown): CalendarTone =>
  CALENDAR_TONES.includes(value as CalendarTone) ? (value as CalendarTone) : 'blue'
```

`calendarColor` is required, defaults to `blue`, and is conditionally visible only for Event behavior. `eventAllDay` is a checkbox after the Start/End row, defaults to false, and is cleared to `null` with every other Event-only field when behavior becomes Story.

- [ ] **Step 4: Centralize server-formatted public event labels**

Change the adapter contract to:

```ts
export type PublicNewsEventCard = {
  // existing fields remain
  eventAllDay?: boolean
  eventEndDateKey?: string
  eventStartDateKey?: string
}

export type NewsEventCardSource = Pick<
  NewsEvent,
  | 'classification'
  | 'contentType'
  | 'eventAllDay'
  | 'eventEnd'
  | 'eventStart'
  | 'excerpt'
  | 'featuredImage'
  | 'featuredImagePosition'
  | 'id'
  | 'primaryCategory'
  | 'publishedAt'
  | 'slug'
  | 'title'
  | 'updatedAt'
>

export function toPublicNewsEventCard(
  entry: NewsEventCardSource,
  nowISO: string,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): PublicNewsEventCard
```

For Event behavior, calculate both zoned date keys, normalize missing End to Start, set `dateLabel` with `formatZonedDateRange`, and omit time from the label when `eventAllDay` is true. Story behavior keeps a single zoned publication/display date. Add `eventAllDay: true` to all relevant Payload `select` objects.

- [ ] **Step 5: Thread configured timezone through all public News & Events loaders**

Resolve `getSiteTimeZone()` in `getNewsEventsHighlights`, `getNewsEventGroups`, `getNewsEventPage`, `getNewsGridItems`, and `getNewsEventBySlug`, then pass it to the existing pure fetch/adaptation functions. Keep pure functions defaulted to `Asia/Kolkata` for deterministic direct tests. Update rendered cards/rows/detail metadata to use `item.dateLabel` or `entry.dateLabel` rather than formatting raw dates in client-capable modules.

- [ ] **Step 6: Serialize all-day Event structured data as date-only values**

```ts
startDate: entry.eventAllDay ? entry.eventStartDateKey : entry.eventStart,
endDate: entry.eventAllDay ? entry.eventEndDateKey : entry.eventEnd,
```

Timed Events retain ISO date-times. Do not change RSS `<pubDate>` from RFC-compatible UTC because it represents publication time, not visitor-facing Event time.

- [ ] **Step 7: Re-run the four focused suites**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-collection.int.spec.ts tests/int/news-grid.int.spec.tsx tests/int/news-events-metadata.int.spec.ts tests/int/news-events-data.int.spec.ts`

Expected: PASS with existing behavior retained and new IST/all-day cases covered.

### Task 3: Calendar block schema and client-safe contract

**Files:**
- Create: `src/blocks/Calendar/calendarShared.ts`
- Create: `src/blocks/Calendar/config.ts`
- Test: `tests/int/calendar.int.spec.tsx`

**Interfaces:**
- Consumes: shared block appearance/action/spacing fields and `CalendarTone`.
- Produces: `CalendarBlock`, `CALENDAR_MAX_CLASSIFICATIONS = 5`, `CALENDAR_RESPONSE_VERSION = 1`, `CalendarClassification`, `CalendarEvent`, `CalendarMonthSnapshot`, `CalendarInitialSnapshot`, `getCalendarClassificationIDs`, `getCalendarScopeKey`, `getCalendarMonthCacheKey`, `buildCalendarGrid`, and `getCalendarEventCoverage`.

- [ ] **Step 1: Write failing block schema and shared-helper tests**

```ts
expect(CalendarBlock).toMatchObject({
  interfaceName: 'CalendarBlock',
  slug: 'calendar',
  labels: { plural: 'Calendars', singular: 'Calendar' },
})
expect(findNamedField(CalendarBlock.fields, 'classifications')).toMatchObject({
  hasMany: true,
  maxRows: 5,
  minRows: 1,
  relationTo: 'news-event-classifications',
  required: true,
})
expect(getCalendarClassificationIDs(['a', { id: 'b' }, 'a', null])).toEqual(['a', 'b'])
expect(buildCalendarGrid('2026-08')).toHaveLength(42)
expect(buildCalendarGrid('2026-08')[0]?.dateKey).toBe('2026-07-26')
```

- [ ] **Step 2: Run the Calendar suite and verify the missing-module failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx`

Expected: FAIL because the Calendar block modules do not exist.

- [ ] **Step 3: Implement the serializable Calendar data contract**

```ts
export type CalendarClassification = {
  badgeLabel: string
  calendarColor: CalendarTone
  id: string
  slug: string
  title: string
}

export type CalendarEvent = {
  allDay: boolean
  classification: CalendarClassification
  endDateKey: string
  eventEnd?: string
  eventStart: string
  href: string
  id: string
  location?: string
  rangeLabel: string
  startDateKey: string
  timeLabel?: string
  title: string
}

export type CalendarMonthSnapshot = {
  events: CalendarEvent[]
  monthKey: string
  monthLabel: string
  version: 1
}

export type CalendarInitialSnapshot = {
  classifications: CalendarClassification[]
  month: CalendarMonthSnapshot
  timeZone: SiteTimeZone
  todayKey: string
  upcoming: CalendarEvent[]
}
```

`getCalendarMonthCacheKey(monthKey, classificationIDs)` serializes response version, month, and ordered IDs. `buildCalendarGrid` always returns 42 Sunday-first cells. `getCalendarEventCoverage` clips inclusive event keys to the visible grid range and labels start/continuation/end state without reading browser-local dates.

- [ ] **Step 4: Implement the Payload block schema**

Use the approved Content fields/defaults and the exact relationship filter:

```ts
filterOptions: {
  and: [{ active: { equals: true } }, { behavior: { equals: 'event' } }],
}
```

Add `required: true`, `minRows: 1`, `maxRows: 5`, sortable Admin order, and validation that rejects duplicate resolved IDs. Theme Settings contain shared appearance, Left/Center content alignment, and None/Compact/Default/Comfortable section padding. Do not add a view, week-start, semester, manual-event, count, or card-surface field.

- [ ] **Step 5: Re-run the Calendar suite**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx`

Expected: PASS for schema labels/defaults/filtering/cardinality and the 42-day deterministic grid helpers.

### Task 4: Published/draft Calendar queries, normalization, and caching

**Files:**
- Create: `src/lib/calendarEvents.ts`
- Modify: `src/hooks/revalidateCmsContent.ts`
- Test: `tests/int/calendar-data.int.spec.ts`

**Interfaces:**
- Consumes: Task 1 timezone/bounds loader and Task 3 Calendar types/scope normalization.
- Produces: `buildCalendarMonthWhere`, `resolveCalendarClassifications`, `fetchCalendarMonth`, `fetchCalendarUpcoming`, `getPublicCalendarInitialSnapshot`, `getPublicCalendarMonth`, and `getDraftCalendarInitialSnapshot`.

- [ ] **Step 1: Write failing query and normalization tests**

Cover this exact overlap predicate:

```ts
expect(buildCalendarMonthWhere({
  classificationIDs: ['academic', 'exam'],
  endISO: '2026-08-31T18:29:59.999Z',
  startISO: '2026-07-31T18:30:00.000Z',
})).toEqual({
  and: [
    { _status: { equals: 'published' } },
    { workflowState: { equals: 'published' } },
    { classification: { in: ['academic', 'exam'] } },
    { eventStart: { less_than_equal: '2026-08-31T18:29:59.999Z' } },
    { or: [
      { eventEnd: { greater_than_equal: '2026-07-31T18:30:00.000Z' } },
      { and: [
        { or: [{ eventEnd: { exists: false } }, { eventEnd: { equals: null } }] },
        { eventStart: { greater_than_equal: '2026-07-31T18:30:00.000Z' } },
      ] },
    ] },
  ],
})
```

Also assert ordered classification resolution, inactive/Story omission without widening, `eventStart/id` sorting, four-item Upcoming cap, ongoing all-day inclusion through local end-of-day, explicit `select`, `limit: 500` for a month, and draft calls with `draft: true`, `user`, and `overrideAccess: false`.

- [ ] **Step 2: Run the data suite and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-data.int.spec.ts`

Expected: FAIL because `calendarEvents.ts` does not exist.

- [ ] **Step 3: Implement classification resolution and month queries**

Use this access shape so public and draft behavior cannot be mixed accidentally:

```ts
type CalendarReadMode =
  | { draft?: false; overrideAccess: true; user?: never }
  | { draft: true; overrideAccess: false; user: User }
```

Resolve only requested IDs, preserve requested order, normalize records, and retain only `active && behavior === 'event'`. If a non-empty requested scope cannot be resolved completely, return a typed invalid-scope result; never query all classifications.

Select only:

```ts
const calendarEventSelect = {
  classification: true,
  eventAllDay: true,
  eventEnd: true,
  eventLocation: true,
  eventStart: true,
  slug: true,
  title: true,
} as const
```

Normalize invalid rows out, build `/news-events/${slug}`, derive zoned keys/labels once, and sort by start timestamp then stable string ID.

- [ ] **Step 4: Implement Upcoming independently from month projection**

Query the selected Event classifications using current-day-start as the coarse lower bound, then filter with exact effective end semantics. For all-day events, calculate the effective end as the next local midnight after `endDateKey` minus one millisecond. Return the first four sorted results. Month/filter/view parameters must not enter this function.

- [ ] **Step 5: Add cache keys and invalidation tags**

Public month keys contain response version, month, ordered classification IDs, and timezone. Tag public month/Upcoming caches with `calendar`, `newsEvents`, `newsEventClassifications`, and `siteSettings`. Use `revalidate: false` for fixed month projections and a five-minute bucket/revalidation for Upcoming. Draft reads bypass shared public caches.

Update hooks so News & Events publish/unpublish/delete revalidates `calendar`; classification changes/deletes revalidate `newsEventClassifications` and `calendar`; Site Settings changes revalidate `siteSettings` and `calendar`.

- [ ] **Step 6: Re-run the data suite**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-data.int.spec.ts`

Expected: PASS for public/draft separation, month overlap, bounded selects/limits, sorting, all-day Upcoming, cache keys, and invalidation.

### Task 5: Validated Calendar month API

**Files:**
- Create: `src/app/api/calendar-events/route.ts`
- Modify: `src/lib/calendarEvents.ts`
- Test: `tests/int/calendar-route.int.spec.ts`

**Interfaces:**
- Consumes: `getPublicCalendarMonth` and draft month loader from Task 4.
- Produces: `GET /api/calendar-events?month=YYYY-MM&classifications=id1,id2[&draft=true]` returning `CalendarMonthSnapshot` version 1.

- [ ] **Step 1: Write failing request parser and route tests**

Test valid `2026-08`, impossible `2026-13`, repeated `month`, missing/empty classification scope, duplicate IDs, six IDs, IDs longer than 128 characters, public success, unauthenticated draft 401, unauthorized draft 403, and authenticated draft access forwarding.

```ts
expect(parseCalendarRequest(new URLSearchParams({
  classifications: 'academic,exam',
  month: '2026-08',
}))).toEqual({
  classificationIDs: ['academic', 'exam'],
  draft: false,
  monthKey: '2026-08',
  ok: true,
})
```

- [ ] **Step 2: Run the route suite and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-route.int.spec.ts`

Expected: FAIL because the parser/route do not exist.

- [ ] **Step 3: Implement strict query parsing**

Accept exactly one `month`, exactly one `classifications`, and zero or one `draft`. Validate month with `/^\d{4}-(0[1-9]|1[0-2])$/`, then round-trip it through the month parser. Split IDs on commas; require one to five unique values matching `/^[A-Za-z0-9:_-]{1,128}$/`. Reject duplicates instead of silently normalizing them at the public boundary.

- [ ] **Step 4: Implement public and draft route branches**

```ts
if (!parsed.ok) return Response.json({ message: parsed.message }, { status: 400 })

if (!parsed.draft) {
  return Response.json(await getPublicCalendarMonth(parsed.classificationIDs, parsed.monthKey))
}

const payload = await getPayload({ config: configPromise })
const { user } = await payload.auth({
  canSetHeaders: false,
  headers: new Headers(request.headers),
})
if (!user) return Response.json({ message: 'Authentication required.' }, { status: 401 })
```

Pass `user` with `overrideAccess: false` inside the draft loader. Map Payload access denial to 403, invalid resolved scope to 400, and unexpected failures to a generic 500 without returning internal error detail.

- [ ] **Step 5: Re-run the route and data suites**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-route.int.spec.ts tests/int/calendar-data.int.spec.ts`

Expected: PASS with no draft-to-public fallback.

### Task 6: Stateless Calendar views and semantic tone presentation

**Files:**
- Create: `src/blocks/Calendar/calendarTone.ts`
- Create: `src/blocks/Calendar/CalendarMonthView.tsx`
- Create: `src/blocks/Calendar/CalendarTimelineView.tsx`
- Create: `src/blocks/Calendar/CalendarUpcoming.tsx`
- Modify: `tests/int/calendar.int.spec.tsx`

**Interfaces:**
- Consumes: Calendar types/grid/coverage helpers from Task 3.
- Produces: stateless view components accepting filtered events, classifications, labels, and callbacks without Payload or network imports.

- [ ] **Step 1: Add failing static rendering/accessibility tests**

Assert a 42-cell Sunday-first table, full weekday assistive labels, `<time>` date keys, current-day text, muted adjacent-month cells, no more than two tiles per day, exact `+2 more` control, complete event links, multi-day continuation text, date-range timeline rows, all-day time omission, stable four-row Upcoming, and a label-bearing legend in selected classification order.

- [ ] **Step 2: Run the Calendar suite and verify missing-view failures**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx`

Expected: FAIL on missing view components.

- [ ] **Step 3: Implement semantic tone mapping**

```ts
export const calendarToneStyles = {
  amber: { variable: 'var(--calendar-amber)' },
  blue: { variable: 'var(--calendar-blue)' },
  cyan: { variable: 'var(--calendar-cyan)' },
  green: { variable: 'var(--calendar-green)' },
  violet: { variable: 'var(--calendar-violet)' },
} as const

export const getCalendarToneStyle = (tone: CalendarTone): React.CSSProperties => ({
  '--calendar-tone': calendarToneStyles[tone].variable,
} as React.CSSProperties)
```

Use `border-[var(--calendar-tone)]` and a Card-mixed `color-mix(...)` background while keeping all text `text-card-foreground` or the paired muted foreground.

- [ ] **Step 4: Implement the month table**

Render `<table>` with `<thead>`, `<tbody>`, row/column headers, 42 `<td>` cells, and noninteractive date labels. Event tiles are complete links. Clip to two visible tiles, then render a button whose callback receives the date key. Add visible start/continuation/end geometry and an accessible label containing classification, full range, all-day status, and title.

- [ ] **Step 5: Implement Timeline and Upcoming**

Timeline groups events by start date key, renders each event once in chronological order, and exposes each group heading as `tabIndex={-1}` with `data-calendar-date-heading`. Upcoming always renders its panel; with no entries it renders the configured `Empty` description. Use shadcn `Badge`, `Separator`, and `Empty`, plus native complete-row links.

- [ ] **Step 6: Re-run static Calendar tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx`

Expected: PASS for semantic markup, event caps, multi-day/all-day output, links, and Upcoming independence at the presentation boundary.

### Task 7: Interactive client, server presentation shell, and browser behavior

**Files:**
- Create: `src/blocks/Calendar/CalendarClient.tsx`
- Create: `src/blocks/Calendar/Presentation.tsx`
- Create: `src/blocks/Calendar/Component.tsx`
- Modify: `tests/int/calendar.int.spec.tsx`
- Create: `tests/e2e/calendar.e2e.spec.ts`

**Interfaces:**
- Consumes: `getPublicCalendarInitialSnapshot`, stateless views, shadcn Button/Toggle Group/Select, and shared block shell utilities.
- Produces: `CalendarBlockComponent` and `CalendarBlockPresentation`.

- [ ] **Step 1: Add failing client-state tests**

Cover Calendar/Timeline switching, classification filtering without fetch, next/previous month fetch, cache reuse, one abortable request, stale response suppression, `aria-busy`, current-content retention, Retry, polite month announcement, Upcoming stability, and `+N more` focus transfer.

```ts
fireEvent.click(screen.getByRole('button', { name: 'Show 2 more events on August 23, 2026' }))
expect(screen.getByRole('radio', { name: 'Timeline' })).toHaveAttribute('data-state', 'on')
expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'August 23, 2026' }))
```

- [ ] **Step 2: Run Calendar tests and verify client failures**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx`

Expected: FAIL because orchestration and section shell do not exist.

- [ ] **Step 3: Implement toolbar and responsive view contract**

Use shadcn `Button`, single-select `ToggleGroup`, and `Select`. Keep both responsive defaults deterministic without `matchMedia`: when state is Calendar, render Month in `hidden md:block` and a Timeline copy in `md:hidden`; when state is Timeline, render Timeline for all widths. Hide the view Toggle Group below `md`. The DOM order is Toolbar → main region → Upcoming.

- [ ] **Step 4: Implement month loading state machine**

State consists of:

```ts
type CalendarView = 'calendar' | 'timeline'
type PendingMonth = { key: string; label: string } | null

const [view, setView] = useState<CalendarView>('calendar')
const [filter, setFilter] = useState('all')
const [month, setMonth] = useState(initial.month)
const [pending, setPending] = useState<PendingMonth>(null)
const [error, setError] = useState<string | null>(null)
const cacheRef = useRef(new Map([
  [getCalendarMonthCacheKey(initial.month.monthKey, classificationIDs), initial.month],
]))
const requestRef = useRef<AbortController | null>(null)
```

Keep the last successful `month` visible while pending. Abort the previous controller before a new request and verify the intended key before applying a response. Build endpoint parameters from ordered classification IDs and append `draft=true` only for preview. Retry the stored pending target. Do not include filter/view in request keys.

Previous/next buttons use explicit labels naming the destination month. Month changes preserve the active filter. When filtering produces no rows, include the active classification name in assistive empty-state context while retaining the configured visible empty message and all controls.

- [ ] **Step 5: Implement focus and announcements**

After `+N more`, set Timeline view and target date, then in an effect focus `[data-calendar-date-heading="<key>"]` inside the component root. Announce successful month changes and view changes through one `aria-live="polite"` status node. Render failures with `role="alert"` and a real Retry button.

Keep transitions nonessential and add `motion-reduce:transition-none` wherever hover/view polish is introduced. All controls retain shadcn/Radix focus-visible rings and at least 44×44 touch targets.

- [ ] **Step 6: Implement the shared section shell and Server Component**

Match News & Events Tabs' optional section-header pattern: shared regular container/padding, semantic appearance, eyebrow/title/accent/description, up to two header actions, Calendar interface, then `BlockFooterActions`. The inner interface is always `bg-card text-card-foreground border-border rounded-[var(--radius)]`. Use `lg:grid-cols-[minmax(0,1fr)_20rem]` for the main view plus non-sticky Upcoming sidebar; between `md` and `lg`, Upcoming follows below. If no classification IDs survive, retain the authored header and render a calm empty state without querying all classifications.

`CalendarBlockComponent` extracts up to five ordered IDs, calls `getPublicCalendarInitialSnapshot`, and passes one serializable snapshot to `CalendarBlockPresentation`.

- [ ] **Step 7: Add the generated-preview browser smoke**

In `tests/e2e/calendar.e2e.spec.ts`, open `/block-thumbnail-previews/calendar`, assert the desktop Calendar grid and view toggle, set a 390px viewport and assert Timeline is visible while the grid/toggle are not, intercept `/api/calendar-events` for next-month navigation, and assert the new month announcement without horizontal page overflow.

- [ ] **Step 8: Re-run component tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx`

Expected: PASS for interaction, loading/error/retry, responsive class contract, and focus management.

### Task 8: Draft preview snapshots, canonical registration, and renderer parity

**Files:**
- Create: `src/blocks/Calendar/PreviewComponent.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts:14-126`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts:20-58`
- Modify: `src/app/(frontend)/preview/page/[id]/page.tsx:63-83`
- Modify: `src/app/(frontend)/news-events/[slug]/page.tsx:78-100`
- Modify: `src/components/live-preview/PageLivePreview.tsx`
- Modify: `src/components/live-preview/NewsEventLivePreview.tsx`
- Modify: `src/blocks/renderPageBlocks.tsx:1-215`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx:1-239`
- Modify: `src/blocks/blockCatalog.ts:1-184`
- Test: `tests/int/calendar.int.spec.tsx`
- Test: `tests/int/block-catalog.int.spec.ts`
- Test: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/news-events-detail-template.int.spec.tsx`

**Interfaces:**
- Consumes: authenticated preview `User`, Calendar scope key, draft initial loader, and existing recursive Reusable Section discovery.
- Produces: `calendarByScope` inside `NewsEventsPreviewSnapshot`; production/live-preview `calendar` switch cases; Calendar in Explore across Pages, Reusable Sections, and News Event detail.

- [ ] **Step 1: Add failing preview-discovery and registry assertions**

```ts
expect(getCalendarPreviewScopes(layout)).toEqual([
  { classificationIDs: ['academic', 'exam'], key: JSON.stringify(['academic', 'exam']) },
])
expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.explore)).toEqual([
  'newsEventsTabs',
  'calendar',
  'departmentProfiles',
  'galleryAlbumTabs',
  'qaAccordion',
])
expect(pageBuilderBlocks).toHaveLength(54)
expect(reusableSectionBuilderBlocks).toHaveLength(53)
expect(newsEventsDetailBuilderBlocks.map(({ slug }) => slug)).toContain('calendar')
```

Include nested Reusable Sections, duplicate scopes, depth 10, ID-only preview relationships, and both renderer source cases.

- [ ] **Step 2: Run registry/preview tests and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx`

Expected: FAIL because Calendar is not registered or discovered.

- [ ] **Step 3: Extend preview scope discovery and loading**

```ts
export type NewsEventsPreviewSnapshot = {
  calendarByScope: Record<string, CalendarInitialSnapshot>
  classificationsByScope: Record<string, ResolvedNewsEventClassification[]>
  groupsByScope: Record<string, PublicNewsEventGroups>
  highlightsByCount: Record<string, PublicNewsEventCard[]>
  newsGridByCount: Record<string, PublicNewsEventCard[]>
}
```

Discover Calendar blocks in direct and populated Reusable Section layouts with the existing WeakSet/depth-10 guard. Change `loadNewsEventsPreviewSnapshot(layout, user)` to call `getDraftCalendarInitialSnapshot(ids, user)` for each unique ordered scope. Pass the authenticated `user` from both preview routes. Existing public News Grid/Tabs/Highlights snapshot behavior remains intact.

- [ ] **Step 4: Add PreviewComponent and both renderer cases**

`CalendarPreviewBlockComponent` calculates its scope key, reads `snapshot.calendarByScope[key]`, and passes `draft` to presentation so month navigation adds `draft=true`. If the snapshot is missing, render the authored header and empty state; never fabricate classifications.

Import and add `case 'calendar'` to production and live-preview Page renderers. News/Event detail receives parity automatically through its Page block delegator.

- [ ] **Step 5: Register Calendar in Explore**

Import `CalendarBlock` in `blockCatalog.ts` and place it immediately after `NewsEventsTabsBlock` in Explore. Do not add it to Advanced Library or any restricted Header/Footer/System registry.

- [ ] **Step 6: Update count assertions and re-run registry/preview tests**

Change live repository contracts from Page 53→54, Reusable 52→53, and recommended 18→19. Do not edit historical specs/plans that describe their original 53-block state.

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx tests/int/system-page-blocks.int.spec.ts`

Expected: PASS with exact schema and renderer parity.

### Task 9: Calendar theme tokens and block thumbnail

**Files:**
- Modify: `src/styles/globals.css:22-165`
- Modify: `tests/int/theme-contracts.int.spec.ts`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Create (generated): `public/block-thumbnails/calendar.jpg`

**Interfaces:**
- Consumes: Calendar presentation and tone mapping.
- Produces: five inherited semantic accent tokens in both modes and a production-component picker fixture.

- [ ] **Step 1: Add failing token contrast and thumbnail coverage tests**

Test every Calendar token against each theme's Card surface in light and dark mode. Require at least 3:1 non-text contrast and retain `card-foreground` for text. Add exact thumbnail metadata:

```ts
expect(getBlockThumbnailDefinition('calendar')).toMatchObject({
  alt: 'Calendar block preview',
  filename: 'calendar.jpg',
  label: 'Calendar',
  slug: 'calendar',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Run theme/thumbnail tests and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts`

Expected: FAIL on missing tokens, definition, fixture, and JPEG.

- [ ] **Step 3: Add Calendar semantic variables to globals**

Use these contrast-checked values:

```css
:root {
  --calendar-green: oklch(0.48 0.15 145);
  --calendar-blue: oklch(0.46 0.16 260);
  --calendar-cyan: oklch(0.47 0.11 220);
  --calendar-amber: oklch(0.5 0.12 75);
  --calendar-violet: oklch(0.46 0.16 300);
}

:root.dark {
  --calendar-green: oklch(0.74 0.16 145);
  --calendar-blue: oklch(0.72 0.16 260);
  --calendar-cyan: oklch(0.74 0.12 220);
  --calendar-amber: oklch(0.78 0.14 75);
  --calendar-violet: oklch(0.74 0.15 300);
}
```

Expose `--color-calendar-*` mappings inside `@theme inline`. The lowest checked contrast is above 5:1 against the current light/dark Card surfaces, exceeding the required 3:1 marker/border contract.

- [ ] **Step 4: Add a stable production-component fixture**

Create five Event classifications and a current-month snapshot fixed to August 2026. Render `CalendarBlockPresentation` with Academic, Clinical, Research, Holiday, and Exam events, including one all-day item and one multi-day item. Keep the screenshot deterministic by placing `todayKey: '2026-08-23'` inside the supplied `CalendarInitialSnapshot`; do not call Payload or `new Date()` inside the fixture.

- [ ] **Step 5: Generate the 1600×900 JPEG**

Run: `pnpm generate:block-thumbnails`

Expected: `public/block-thumbnails/calendar.jpg` exists, is JPEG, and is exactly 1600×900. Other thumbnails may be regenerated byte-for-byte or changed by the generator; inspect the binary diff list and retain only intended generated output changes.

- [ ] **Step 6: Re-run theme/thumbnail tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts`

Expected: PASS across all five themes and both modes, with complete fixture/thumbnail coverage.

### Task 10: Generated artifacts, documentation, project context, and final verification

**Files:**
- Modify (generated): `src/payload-types.ts`
- Modify (generated if needed): `src/app/(payload)/admin/importMap.js`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: any current tests that assert the old 53/52/18 counts, including `tests/int/editorial-reasons.int.spec.tsx`, `tests/int/program-matrix.int.spec.tsx`, and `tests/int/project-context-lib.int.spec.ts`

**Interfaces:**
- Consumes: completed schema/runtime behavior from Tasks 1–9.
- Produces: synchronized Payload types/import map, current operator documentation, current project inventory, and a clean verification result with all changes uncommitted.

- [ ] **Step 1: Generate Payload types and Admin import map**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: `CalendarBlock`, `calendarColor`, `eventAllDay`, and `timeZone` appear in `src/payload-types.ts`; the import map remains unchanged unless Payload discovers a new Admin component reference.

- [ ] **Step 2: Update current operator documentation**

Document:

- Calendar in Explore and the 19-block recommended vocabulary.
- All 54 Page blocks remain available after recipe creation; Reusable Sections expose 53 non-recursive blocks.
- Editors select one to five active Event classifications, set classification Calendar Color centrally, and mark All-day on Event entries.
- Site Identity → Regional owns the `Asia/Kolkata` default.
- Desktop Calendar, phone Timeline-first, filtering, multi-day behavior, `+N more`, Upcoming independence, and public detail links.
- `/api/calendar-events` public/draft boundary and five-minute Upcoming freshness.

Update only maintained current-state documents. Leave historical files under `docs/superpowers/specs` and `docs/superpowers/plans` unchanged.

- [ ] **Step 3: Run focused Calendar and affected News & Events tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/site-time-zone.int.spec.ts \
  tests/int/calendar-data.int.spec.ts \
  tests/int/calendar-route.int.spec.ts \
  tests/int/calendar.int.spec.tsx \
  tests/int/news-events-collection.int.spec.ts \
  tests/int/news-events-data.int.spec.ts \
  tests/int/news-events-metadata.int.spec.ts \
  tests/int/news-grid.int.spec.tsx \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/theme-contracts.int.spec.ts
```

Expected: all listed suites pass.

- [ ] **Step 4: Run type, lint, and generated-preview browser checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/Calendar src/lib/calendarEvents.ts src/lib/siteTimeZone.ts src/lib/siteTimeZone.server.ts src/app/api/calendar-events/route.ts src/collections/NewsEvents.ts src/collections/NewsEventClassifications.ts src/globals/SiteSettings.ts tests/int/calendar*.spec.* tests/int/site-time-zone.int.spec.ts
pnpm exec playwright test tests/e2e/calendar.e2e.spec.ts --config=playwright.config.ts
```

Expected: zero TypeScript errors, zero lint errors in changed implementation paths, and desktop/mobile Calendar browser smoke passes.

- [ ] **Step 5: Update and verify maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Inspect the generated inventory and update the three routed narrative references only where the structural/runtime contract changed. Expected: Page registry 54, Reusable registry 53, Calendar files/routes/tests included, and context check passes.

- [ ] **Step 6: Run final integration/build checks in proportion to the cross-cutting change**

Run:

```bash
pnpm test:int
pnpm build
git diff --check
git status --short
```

Expected: integration suite and production build pass; no whitespace errors; status lists only the intended uncommitted Calendar, News & Events, generated, documentation, and project-context changes.

- [ ] **Step 7: Perform final change-impact inspection without committing**

Compare the final diff against `.agents/skills/project-context/references/change-impact-map.md`. Confirm together: schema producers and generated types; public/draft loaders and API; production/live-preview renderers; canonical registries; thumbnail definition/fixture/JPEG; all five themes in both modes; current docs and project context. Report any environment-only skipped browser or Mongo-backed checks explicitly. Do not stage or commit any file.
