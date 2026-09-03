# Annual Calendar Period Header Implementation Plan

> **For agentic workers:** REQUIRED SKILL: Use `executing-plans` to implement this plan task by task.
> Steps use checkbox (`- [ ]`) syntax for tracking. Do not stage or commit the work.

**Goal:** Add a ledger summary header and an optional, strictly validated twelve-month academic-year
range to Annual Calendar while refining month and empty-row presentation.

**Architecture:** Introduce one normalized Annual Calendar period contract shared by schema,
production, preview, queries, cache keys, and presentation. Current-year mode derives January through
December from the site timezone; custom mode accepts explicit start/end month and year fields only
when they form twelve consecutive months. The existing Calendar block remains unchanged.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4,
Vitest.

## Global Constraints

- Existing Annual Calendar blocks default to the current calendar year without migration.
- Default header copy is `Calendar year 2026`; valid custom copy is `Academic year 2026–2027`.
- Custom ranges contain exactly twelve consecutive inclusive months.
- Invalid custom configuration never issues a broader query.
- Coming Next remains independent and keeps the next-four semantics from today.
- Remove the green ledger spine, repeated month year, and side-positioned Current badge.
- Display typography remains limited to the section-level block title.
- Use only semantic light/brand surface, border, foreground, supporting-text, radius, and calendar-tone
  tokens.
- Do not change, stage, or commit unrelated work. Do not stage or commit this implementation.
- Preserve the repository's existing staged state exactly; this plan must add no new paths or hunks to
  the index.

---

## File Map

### Modify

- `src/blocks/AnnualCalendar/annualCalendarShared.ts` — period input, normalization, validation,
  month materialization, preview key, and snapshot fields.
- `src/blocks/AnnualCalendar/config.ts` — period mode and conditional start/end fields.
- `src/lib/calendarEvents.ts` — range query, public/draft snapshots, cache keys, and event totals.
- `src/lib/newsEventsPreviewShared.ts` — range-aware Annual Calendar preview scopes.
- `src/blocks/AnnualCalendar/Component.tsx` — pass the saved period configuration to the public
  loader.
- `src/blocks/AnnualCalendar/PreviewComponent.tsx` — use the range-aware preview key.
- `src/blocks/AnnualCalendar/Presentation.tsx` — pass period label and event total into the ledger.
- `src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx` — summary header and approved row refinements.
- `src/block-thumbnails/fixtures.tsx` and `public/block-thumbnails/annual-calendar.jpg` — updated
  production fixture and picker image.
- `src/payload-types.ts` — generated block fields.
- `tests/int/annual-calendar-data.int.spec.ts` — period normalization and data-range contracts.
- `tests/int/annual-calendar.int.spec.tsx` — schema and presentation contracts.
- `tests/int/news-events-metadata-routes.int.spec.ts` and other TypeScript-reported preview fixtures —
  new snapshot shape where necessary.
- `docs/guides/blocks.md`, `docs/guides/news-events.md`,
  `.agents/skills/project-context/references/block-system.md`, and generated
  `.agents/skills/project-context/references/project-inventory.json` — maintained behavior.

---

### Task 1: Normalize and validate the twelve-month period

**Files:**

- Modify: `src/blocks/AnnualCalendar/annualCalendarShared.ts`
- Modify: `src/blocks/AnnualCalendar/config.ts`
- Modify: `tests/int/annual-calendar-data.int.spec.ts`
- Modify: `tests/int/annual-calendar.int.spec.tsx`

**Interfaces:**

- Consumes: `getZonedToday`, saved Annual Calendar fields, and existing Calendar classification IDs.
- Produces: `AnnualCalendarPeriodMode`, `AnnualCalendarPeriodInput`,
  `ResolvedAnnualCalendarPeriod`, `normalizeAnnualCalendarPeriod`,
  `validateAnnualCalendarCustomPeriod`, `getAnnualCalendarPeriodMonthKeys`, and a range-aware
  `getAnnualCalendarScopeKey`.

- [ ] **Step 1: Write failing period normalization tests**

Add exact contracts:

```ts
expect(normalizeAnnualCalendarPeriod({}, '2026-08-23')).toEqual({
  endMonthKey: '2026-12',
  monthKeys: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
    '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'],
  periodLabel: 'Calendar year 2026',
  periodMode: 'currentYear',
  startMonthKey: '2026-01',
})

const academicPeriod = {
  periodMode: 'customAcademicYear',
  startMonth: '07',
  startYear: 2026,
  endMonth: '06',
  endYear: 2027,
} as const

expect(normalizeAnnualCalendarPeriod(academicPeriod, '2026-08-23')).toMatchObject({
  endMonthKey: '2027-06',
  periodLabel: 'Academic year 2026–2027',
  startMonthKey: '2026-07',
})
expect(normalizeAnnualCalendarPeriod({ ...academicPeriod, endMonth: '05' }, '2026-08-23')).toBeNull()
expect(getAnnualCalendarScopeKey(['academic'], academicPeriod)).toBe(
  '[["academic"],"customAcademicYear","07",2026,"06",2027]',
)
```

Update month-materialization coverage to call
`materializeAnnualCalendarMonths(resolvedPeriod.monthKeys, events)` and assert July 2026 is first,
June 2027 is last, and every intermediate month exists.

- [ ] **Step 2: Write failing Payload field tests**

Assert:

```ts
expect(findNamedField(AnnualCalendarBlock.fields, 'periodMode')).toMatchObject({
  defaultValue: 'currentYear',
  options: [
    { label: 'Current calendar year', value: 'currentYear' },
    { label: 'Custom academic year', value: 'customAcademicYear' },
  ],
})
for (const name of ['startMonth', 'startYear', 'endMonth', 'endYear']) {
  expect(findNamedField(AnnualCalendarBlock.fields, name)).toBeDefined()
}
```

Call the `endYear` validator with valid and invalid sibling data and assert the exact recovery copy:
`Choose an academic-year range containing exactly 12 consecutive months.`

- [ ] **Step 3: Run tests and verify missing contracts fail**

```bash
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because period normalization and fields do not exist.

- [ ] **Step 4: Implement the shared period contract**

Use these public types:

```ts
export type AnnualCalendarPeriodMode = 'currentYear' | 'customAcademicYear'

export type AnnualCalendarPeriodInput = {
  endMonth?: string | null
  endYear?: number | null
  periodMode?: AnnualCalendarPeriodMode | null
  startMonth?: string | null
  startYear?: number | null
}

export type ResolvedAnnualCalendarPeriod = {
  endMonthKey: string
  monthKeys: string[]
  periodLabel: string
  periodMode: AnnualCalendarPeriodMode
  startMonthKey: string
}
```

Implement month arithmetic with UTC year/month indexes. `getAnnualCalendarPeriodMonthKeys` returns
an empty array unless the inclusive range is exactly twelve months. `normalizeAnnualCalendarPeriod`
returns January–December from `todayKey` for missing/current mode and returns `null` for any invalid
custom value. `validateAnnualCalendarCustomPeriod` returns `true` outside custom mode, otherwise
returns `true` or the exact recovery message.

Bump `ANNUAL_CALENDAR_RESPONSE_VERSION` to `2`. Replace snapshot `year` with `startMonthKey`,
`endMonthKey`, `periodLabel`, and `eventCount`. Change materialization to:

```ts
export const materializeAnnualCalendarMonths = (
  monthKeys: readonly string[],
  events: CalendarEvent[],
): AnnualCalendarMonth[]
```

- [ ] **Step 5: Add conditional Payload fields**

Add `periodMode`, then two `row` fields containing Start Month/Year and End Month/Year. Use reusable
January–December options with string values `01` through `12`. Each range field uses:

```ts
admin: {
  condition: (_data, siblingData) => siblingData?.periodMode === 'customAcademicYear',
  width: '50%',
}
```

Year fields are number fields with `min: 1000`, `max: 9999`. Fields remain schema-optional for
legacy compatibility; their validators require values in custom mode. The `endYear` validator calls
`validateAnnualCalendarCustomPeriod(siblingData)` to enforce the complete range.

- [ ] **Step 6: Run and format the focused contracts**

```bash
pnpm exec prettier --write src/blocks/AnnualCalendar/annualCalendarShared.ts src/blocks/AnnualCalendar/config.ts tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx
```

Expected: PASS.

---

### Task 2: Query and preview the resolved period safely

**Files:**

- Modify: `src/lib/calendarEvents.ts`
- Modify: `src/blocks/AnnualCalendar/Component.tsx`
- Modify: `src/blocks/AnnualCalendar/PreviewComponent.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/newsEventsPreviewSnapshot.ts`
- Modify: `tests/int/annual-calendar-data.int.spec.ts`
- Modify: `tests/int/annual-calendar.int.spec.tsx`
- Modify: preview snapshot fixtures reported by TypeScript

**Interfaces:**

- Consumes: Task 1 `AnnualCalendarPeriodInput` and `ResolvedAnnualCalendarPeriod`.
- Produces: `fetchAnnualCalendarPeriod`, range-aware public/draft initial loaders, and preview scopes
  whose keys include saved period configuration.

- [ ] **Step 1: Write failing range-query and fail-closed tests**

Rename the annual query helper to `buildCalendarPeriodWhere` and assert July–June bounds:

```ts
expect(buildCalendarPeriodWhere({
  classificationIDs: ['academic'],
  startISO: '2026-06-30T18:30:00.000Z',
  endISO: '2027-06-30T18:29:59.999Z',
})).toEqual({
  and: [
    { _status: { equals: 'published' } },
    { workflowState: { equals: 'published' } },
    { classification: { in: ['academic'] } },
    { eventStart: { greater_than_equal: '2026-06-30T18:30:00.000Z' } },
    { eventStart: { less_than_equal: '2027-06-30T18:29:59.999Z' } },
  ],
})
```

Mock July, August, and June events and assert the returned snapshot has twelve months,
`periodLabel: 'Academic year 2026–2027'`, and `eventCount: 3`. Assert invalid custom configuration
rejects with `CalendarScopeError` before the News & Events query. Preserve draft assertions for
`draft: true`, `overrideAccess: false`, and `user`.

- [ ] **Step 2: Write failing range-aware preview tests**

Use two Annual Calendar blocks with the same classifications but different period modes and assert
two distinct scopes. Verify a populated Reusable Section carries the custom period fields into its
scope key.

- [ ] **Step 3: Run tests and verify failure**

```bash
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: FAIL because loaders and preview scopes still use the current-year-only contract.

- [ ] **Step 4: Implement `fetchAnnualCalendarPeriod`**

Resolve the period before querying. Derive bounds with:

```ts
const start = getZonedMonthBounds(period.startMonthKey, timeZone)
const end = getZonedMonthBounds(period.endMonthKey, timeZone)
```

Query normalized event starts inside `start.startISO` and `end.endISO`. Return:

```ts
return {
  classifications,
  endMonthKey: period.endMonthKey,
  eventCount: events.length,
  months: materializeAnnualCalendarMonths(period.monthKeys, events),
  periodLabel: period.periodLabel,
  startMonthKey: period.startMonthKey,
  version: ANNUAL_CALENDAR_RESPONSE_VERSION,
}
```

Throw `CalendarScopeError('Annual Calendar period is invalid.')` before querying when period
normalization returns `null`.

- [ ] **Step 5: Make public and draft initial loaders range-aware**

Use signatures:

```ts
getPublicAnnualCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  periodInput: AnnualCalendarPeriodInput = {},
  now: Date = new Date(),
): Promise<AnnualCalendarInitialSnapshot>

getDraftAnnualCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  periodInput: AnnualCalendarPeriodInput,
  user: User,
  now: Date = new Date(),
): Promise<AnnualCalendarInitialSnapshot>
```

Include `startMonthKey` and `endMonthKey` in the persistent cache key. Keep the existing five-minute
Coming Next bucket and tags. Update `Component.tsx` to pass the four period fields and mode.

- [ ] **Step 6: Extend preview scopes and adapters**

Store normalized saved period input on each `AnnualCalendarPreviewScope`. Build keys with
`getAnnualCalendarScopeKey(classificationIDs, periodInput)`. Pass the period input to the draft loader
in `newsEventsPreviewSnapshot.ts`, and use the identical key calculation in `PreviewComponent.tsx`.
Keep all Payload imports server-only.

- [ ] **Step 7: Run data, preview, type, and boundary checks**

```bash
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/news-events-metadata-routes.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: PASS.

---

### Task 3: Refine the ledger hierarchy and empty rows

**Files:**

- Modify: `src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx`
- Modify: `src/blocks/AnnualCalendar/Presentation.tsx`
- Modify: `tests/int/annual-calendar.int.spec.tsx`

**Interfaces:**

- Consumes: Task 2 snapshot `periodLabel` and `eventCount`.
- Produces: `AnnualCalendarLedger` with a semantic summary header and approved month-row ordering.

- [ ] **Step 1: Write failing presentation tests**

Render a July–June fixture and assert:

```ts
expect(screen.getByText('Academic year 2026–2027')).toBeTruthy()
expect(screen.getByText('2 events')).toBeTruthy()
expect(container.querySelector('[data-annual-calendar-ledger]')?.className)
  .not.toContain('border-l-success')

const currentMonth = container.querySelector('[data-current-month="true"]')
expect(currentMonth?.textContent).toContain('Current')
expect(currentMonth?.textContent).toContain('August')
expect(currentMonth?.textContent).not.toContain('2026')
expect(currentMonth?.textContent?.indexOf('Current')).toBeLessThan(
  currentMonth?.textContent?.indexOf('August') ?? 0,
)

const empty = container.querySelector('[data-annual-calendar-empty="true"]')
expect(empty?.className).toContain('items-center')
expect(empty?.className).toContain('min-h-24')
```

Add a singular count case for `1 event` and a zero case for `0 events`. Retain twelve-month, current,
today, complete-link, no-legend, light/brand, and no-literal-color assertions.

- [ ] **Step 2: Run tests and verify failure**

```bash
pnpm exec vitest run tests/int/annual-calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/theme-contracts.int.spec.ts
```

Expected: FAIL on missing header and old green/year/current layout.

- [ ] **Step 3: Implement the ledger header**

Change `AnnualCalendarLedgerProps` to accept `periodLabel` and `eventCount` instead of `year`.
Inside the existing semantic panel, render before the months:

```tsx
<header className={cn('flex flex-col gap-1 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between md:px-5', styles.border)}>
  <h3 className="font-sans text-base font-semibold">{periodLabel}</h3>
  <p className={cn('font-mono text-xs tabular-nums', styles.supportingText)}>
    {eventCount} {eventCount === 1 ? 'event' : 'events'}
  </p>
</header>
```

Remove `border-l-2 border-l-success` from the ledger container.

- [ ] **Step 4: Implement month and empty-state refinements**

Render the Current badge before the month heading inside a vertical group. Use a compact rectangular
badge with the existing `rounded-[var(--radius)]` and semantic border. Remove the year paragraph.
Render empty copy as:

```tsx
<div
  className={cn('flex min-h-24 items-center p-4 text-sm md:p-5', styles.supportingText)}
  data-annual-calendar-empty="true"
>
  {emptyMessage}
</div>
```

Keep event rows and current/today highlights unchanged.

- [ ] **Step 5: Wire the snapshot summary into Presentation**

Pass `initial.periodLabel` and `initial.eventCount` to `AnnualCalendarLedger`. Do not add display
typography to the ledger header or months.

- [ ] **Step 6: Run design-quality checks**

```bash
pnpm exec vitest run tests/int/annual-calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/theme-contracts.int.spec.ts
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx src/blocks/AnnualCalendar/Presentation.tsx
pnpm exec eslint src/blocks/AnnualCalendar tests/int/annual-calendar.int.spec.tsx --max-warnings=0
```

Expected: tests and lint pass; detector returns `[]` or only explained findings consistent with the
approved spec.

---

### Task 4: Regenerate authoring artifacts and verify the complete contract

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/annual-calendar.jpg`
- Modify: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/guides/news-events.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: Tasks 1–3 final schema, snapshot, and presentation.
- Produces: synchronized Payload types, Admin thumbnail, operator guidance, maintained context, and
  release evidence.

- [ ] **Step 1: Update fixture and documentation contracts**

Create the fixture snapshot with the new fields:

```ts
{
  endMonthKey: '2027-06',
  eventCount: calendarEvents.length,
  months: materializeAnnualCalendarMonths(customPeriod.monthKeys, calendarEvents),
  periodLabel: 'Academic year 2026–2027',
  startMonthKey: '2026-07',
  version: 2,
  // existing classifications, timezone, today, and upcoming
}
```

Update the operator docs and maintained block-system reference with current-year fallback, optional
exact twelve-month custom range, derived header, total count, centered empty rows, and no migration.
Do not change the interactive Calendar documentation.

- [ ] **Step 2: Generate types and the Annual Calendar thumbnail**

```bash
pnpm generate:types
BLOCK_THUMBNAIL_SLUG=annualCalendar pnpm generate:block-thumbnails
```

Expected: generated `AnnualCalendarBlock` includes all five period fields and the 1600×900 JPEG is
updated without rewriting unrelated thumbnails.

- [ ] **Step 3: Run focused verification**

```bash
pnpm exec vitest run tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx tests/int/calendar-data.int.spec.ts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/theme-contracts.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
git diff --check
```

Expected: all focused checks pass. The repository's unrelated pre-existing GTM lint warning may remain
but no new warning is introduced.

- [ ] **Step 4: Refresh maintained project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` A stale optional knowledge-graph commit hash remains a warning.

- [ ] **Step 5: Run the complete database-backed integration suite**

```bash
pnpm test:int
```

Expected: all integration files and tests pass. If MongoMemoryServer cannot bind in the sandbox,
rerun with approved localhost permission.

- [ ] **Step 6: Perform one bounded visual validation pass**

Validate the development thumbnail/preview at desktop and mobile widths for the summary header,
long period labels, zero/one/many event counts, Current-above-month order, centered empty rows, dense
months, Coming Next placement, keyboard focus, and light/brand surfaces. Fix findings in one batch and
perform at most one confirmation pass. If no interactive browser is available, inspect the generated
production thumbnail and report the browser limitation explicitly.

- [ ] **Step 7: Inspect final impact without staging or committing**

```bash
git status --short
git diff --cached --name-only
git diff --check
git diff -- src/blocks/AnnualCalendar src/lib/calendarEvents.ts src/lib/newsEventsPreviewShared.ts src/lib/newsEventsPreviewSnapshot.ts src/block-thumbnails/fixtures.tsx docs/guides/blocks.md docs/guides/news-events.md .agents/skills/project-context/references/block-system.md
```

Compare the final cached diff with the baseline captured before implementation. Confirm no migration,
no unrelated rewrite, no newly staged paths or hunks, and no change to the interactive Calendar public
behavior.
