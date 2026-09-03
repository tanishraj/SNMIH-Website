# Annual Calendar Year Stream Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Annual Calendar ledger with the approved Year Stream and replace its four custom Month/Year controls with two Payload date pickers whose saved values define one exact twelve-month period.

**Architecture:** Keep `annualCalendarShared.ts` as the single pure owner of date parsing, period normalization, scope keys, labels, and month materialization. Thread that normalized contract through the existing server loader and authenticated preview snapshot, then replace the ledger-only renderer with a focused `AnnualCalendarYearStream` while preserving the shared section shell and `AnnualCalendarUpcoming` panel.

**Tech Stack:** Payload CMS 3 date fields, Next.js 16 React Server Components, React 19, TypeScript, Tailwind CSS 4 semantic theme tokens, Vitest, Testing Library.

## Global Constraints

- Change only the Annual Calendar feature and its directly affected generated/documentation contracts; the interactive Calendar block remains unchanged.
- Preserve current-year and custom academic-year modes, strict one-to-five active Event-classification selection, site timezone behavior, and the independent next-four Coming Next query.
- Use `periodStartDate` and `periodEndDate` Payload date fields with `pickerAppearance: 'dayOnly'`; the selected day and time never affect the rendered period.
- Extract the UTC calendar month and year from saved date strings and require exactly twelve consecutive inclusive months.
- Use the exact validation copy: `Choose dates whose months define exactly 12 consecutive months.`
- In current-year mode, hidden date values must not affect normalization, preview scope identity, or cache identity.
- Do not add a migration or compatibility bridge for `startMonth`, `startYear`, `endMonth`, or `endYear`; those fields exist only in the current uncommitted implementation.
- Reserve display typography for the optional block-level section title. Month names, stream headings, event names, controls, and metadata use text, sans, or mono families already established by the theme.
- Use existing semantic section/panel/tone/focus contracts in light, brand, and dark modes; do not add fixed color values.
- Preserve twelve visible month chapters, textual Current/Today and classification cues, machine-readable event dates, complete-card links, and keyboard-visible focus.
- Preserve the existing `lg:grid-cols-[minmax(0,1fr)_20rem]` main/sidebar composition and stack the complete stream before Coming Next on smaller screens.
- Do not stage or commit any changes. Do not run `git add` or `git commit`. The pre-existing staged diff must remain unchanged; its SHA-256 at planning handoff is `a506fc88d5ee0ccc1fd5062b62f29a1d417b21b450c8f140972acdfb26166999`.

---

## File Structure

- Modify `src/blocks/AnnualCalendar/config.ts`: replace four Month/Year controls with two conditional day-only Payload date fields.
- Modify `src/blocks/AnnualCalendar/annualCalendarShared.ts`: own safe date parsing, exact twelve-month normalization, validation copy, scope keys, and response version 3.
- Modify `src/blocks/AnnualCalendar/Component.tsx`: pass the two date fields to the public loader.
- Modify `src/blocks/AnnualCalendar/PreviewComponent.tsx`: use the same date-based scope contract in live preview.
- Modify `src/lib/newsEventsPreviewShared.ts`: discover date-based Annual Calendar scopes through Pages and populated Reusable Sections.
- Modify `src/lib/calendarEvents.ts`: continue using normalized month keys for bounded public/draft queries and versioned persistent cache identity.
- Create `src/blocks/AnnualCalendar/AnnualCalendarYearStream.tsx`: render the approved chronological month chapters and event cards.
- Delete `src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx`: remove the superseded table-like renderer.
- Modify `src/blocks/AnnualCalendar/Presentation.tsx`: compose the Year Stream with the unchanged Coming Next panel.
- Modify `src/block-thumbnails/fixtures.tsx` and regenerate `public/block-thumbnails/annual-calendar.jpg`: keep the block picker representative.
- Regenerate `src/payload-types.ts`: reflect `periodStartDate` and `periodEndDate`.
- Modify `tests/int/annual-calendar-data.int.spec.ts`: cover pure period normalization, fail-closed querying, response version, and cache-facing keys.
- Modify `tests/int/annual-calendar.int.spec.tsx`: cover Payload fields, preview discovery, stream semantics, theme behavior, and the absence of the ledger grid.
- Modify `docs/guides/blocks.md`, `docs/architecture/feature-inventory.md`, and `.agents/skills/project-context/references/block-system.md`: describe the date-picker authoring model and Year Stream visitor contract.

### Task 1: Replace the Month/Year Contract with Date-Based Period Normalization

**Files:**
- Modify: `tests/int/annual-calendar-data.int.spec.ts`
- Modify: `tests/int/annual-calendar.int.spec.tsx`
- Modify: `src/blocks/AnnualCalendar/annualCalendarShared.ts`
- Modify: `src/blocks/AnnualCalendar/config.ts`

**Interfaces:**
- Produces: `AnnualCalendarPeriodInput = { periodMode?, periodStartDate?, periodEndDate? }`.
- Produces: `normalizeAnnualCalendarPeriod(input, todayKey): ResolvedAnnualCalendarPeriod | null`.
- Produces: `validateAnnualCalendarCustomPeriod(input): true | 'Choose dates whose months define exactly 12 consecutive months.'`.
- Produces: `getAnnualCalendarScopeKey(classificationIDs, periodInput): string` using only mode and saved dates in custom mode.
- Produces: `ANNUAL_CALENDAR_RESPONSE_VERSION = 3`.

- [ ] **Step 1: Replace the pure-contract tests with date-picker inputs**

Update the period cases in `tests/int/annual-calendar-data.int.spec.ts` so they prove that different days in the same selected months normalize identically, current-year mode ignores stale dates, malformed/reversed/short/long ranges fail, and scope keys use only active date inputs:

```ts
const academicPeriod = {
  periodEndDate: '2027-06-02T00:00:00.000Z',
  periodMode: 'customAcademicYear',
  periodStartDate: '2026-07-15T00:00:00.000Z',
} as const

expect(normalizeAnnualCalendarPeriod(academicPeriod, '2026-08-23')).toMatchObject({
  endMonthKey: '2027-06',
  periodLabel: 'Academic year 2026–2027',
  startMonthKey: '2026-07',
})
expect(
  normalizeAnnualCalendarPeriod(
    {
      ...academicPeriod,
      periodEndDate: '2027-06-29T18:30:00.000Z',
      periodStartDate: '2026-07-01T18:30:00.000Z',
    },
    '2026-08-23',
  ),
).toMatchObject({ endMonthKey: '2027-06', startMonthKey: '2026-07' })

for (const input of [
  { ...academicPeriod, periodEndDate: null },
  { ...academicPeriod, periodStartDate: 'not-a-date' },
  { ...academicPeriod, periodEndDate: '2026-06-02T00:00:00.000Z' },
  { ...academicPeriod, periodEndDate: '2027-05-02T00:00:00.000Z' },
  { ...academicPeriod, periodEndDate: '2027-07-02T00:00:00.000Z' },
]) {
  expect(normalizeAnnualCalendarPeriod(input, '2026-08-23')).toBeNull()
}

expect(getAnnualCalendarScopeKey(['academic'], academicPeriod)).toBe(
  '[["academic"],"customAcademicYear","2026-07-15T00:00:00.000Z","2027-06-02T00:00:00.000Z"]',
)
expect(
  getAnnualCalendarScopeKey(['academic'], { ...academicPeriod, periodMode: 'currentYear' }),
).toBe('[["academic"],"currentYear",null,null]')
```

Update the schema assertions in `tests/int/annual-calendar.int.spec.tsx`:

```ts
for (const name of ['startMonth', 'startYear', 'endMonth', 'endYear']) {
  expect(findNamedField(AnnualCalendarBlock.fields, name)).toBeUndefined()
}

const periodStartDate = findNamedField(AnnualCalendarBlock.fields, 'periodStartDate')
const periodEndDate = findNamedField(AnnualCalendarBlock.fields, 'periodEndDate') as Field & {
  validate?: (value: unknown, options: { siblingData?: Record<string, unknown> }) => unknown
}

expect(periodStartDate).toMatchObject({
  admin: { date: { pickerAppearance: 'dayOnly' }, width: '50%' },
  label: 'Academic Year Start Date',
  type: 'date',
})
expect(periodEndDate).toMatchObject({
  admin: { date: { pickerAppearance: 'dayOnly' }, width: '50%' },
  label: 'Academic Year End Date',
  type: 'date',
})
expect(
  periodEndDate.validate?.('2027-06-02T00:00:00.000Z', {
    siblingData: {
      periodEndDate: '2027-06-02T00:00:00.000Z',
      periodMode: 'customAcademicYear',
      periodStartDate: '2026-07-15T00:00:00.000Z',
    },
  }),
).toBe(true)
expect(
  periodEndDate.validate?.('2027-05-02T00:00:00.000Z', {
    siblingData: {
      periodEndDate: '2027-05-02T00:00:00.000Z',
      periodMode: 'customAcademicYear',
      periodStartDate: '2026-07-15T00:00:00.000Z',
    },
  }),
).toBe('Choose dates whose months define exactly 12 consecutive months.')
```

- [ ] **Step 2: Run the focused tests and verify the old contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because `periodStartDate` and `periodEndDate` do not exist, the scope key still contains four Month/Year values, and response version is still 2.

- [ ] **Step 3: Implement the pure date-to-month contract**

In `src/blocks/AnnualCalendar/annualCalendarShared.ts`, replace the old period input and custom-period branch with this contract while retaining classification normalization and month materialization:

```ts
export const ANNUAL_CALENDAR_RESPONSE_VERSION = 3 as const
export const ANNUAL_CALENDAR_PERIOD_VALIDATION_MESSAGE =
  'Choose dates whose months define exactly 12 consecutive months.' as const

export type AnnualCalendarPeriodMode = 'currentYear' | 'customAcademicYear'

export type AnnualCalendarPeriodInput = {
  periodEndDate?: string | null
  periodMode?: AnnualCalendarPeriodMode | null
  periodStartDate?: string | null
}

const toMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`

export const getAnnualCalendarDateMonthKey = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = date.getUTCFullYear()
  if (year < 1000 || year > 9999) return null

  return toMonthKey(year, date.getUTCMonth() + 1)
}

export const getAnnualCalendarScopeKey = (
  classificationIDs: readonly string[],
  periodInput: AnnualCalendarPeriodInput = {},
): string => {
  const isCustom = periodInput.periodMode === 'customAcademicYear'
  return JSON.stringify([
    classificationIDs,
    isCustom ? 'customAcademicYear' : 'currentYear',
    isCustom ? (periodInput.periodStartDate ?? null) : null,
    isCustom ? (periodInput.periodEndDate ?? null) : null,
  ])
}

export const normalizeAnnualCalendarPeriod = (
  input: AnnualCalendarPeriodInput = {},
  todayKey: string,
): ResolvedAnnualCalendarPeriod | null => {
  if (input.periodMode !== 'customAcademicYear') {
    const year = Number(todayKey.slice(0, 4))
    const monthKeys = getAnnualCalendarMonthKeys(year)
    if (monthKeys.length !== 12) return null
    return {
      endMonthKey: monthKeys[11]!,
      monthKeys,
      periodLabel: `Calendar year ${year}`,
      periodMode: 'currentYear',
      startMonthKey: monthKeys[0]!,
    }
  }

  const startMonthKey = getAnnualCalendarDateMonthKey(input.periodStartDate)
  const endMonthKey = getAnnualCalendarDateMonthKey(input.periodEndDate)
  if (!startMonthKey || !endMonthKey) return null

  const monthKeys = getAnnualCalendarPeriodMonthKeys(startMonthKey, endMonthKey)
  if (monthKeys.length !== 12) return null

  return {
    endMonthKey,
    monthKeys,
    periodLabel: `Academic year ${startMonthKey.slice(0, 4)}–${endMonthKey.slice(0, 4)}`,
    periodMode: 'customAcademicYear',
    startMonthKey,
  }
}

export const validateAnnualCalendarCustomPeriod = (
  input: AnnualCalendarPeriodInput = {},
): true | typeof ANNUAL_CALENDAR_PERIOD_VALIDATION_MESSAGE =>
  input.periodMode !== 'customAcademicYear' ||
  normalizeAnnualCalendarPeriod(input, '2000-01-01') !== null ||
  ANNUAL_CALENDAR_PERIOD_VALIDATION_MESSAGE
```

- [ ] **Step 4: Replace the four Admin controls with two date fields**

In `src/blocks/AnnualCalendar/config.ts`, remove `monthOptions`, `requireCustomPeriodValue`, and the two Month/Year rows. Import `DateField`, the shared validator, and the period-input type, then add one conditional row:

```ts
const validateCustomPeriodDate = (
  _value: unknown,
  { siblingData }: { siblingData?: AnnualCalendarPeriodInput },
): true | string =>
  siblingData?.periodMode !== 'customAcademicYear'
    ? true
    : validateAnnualCalendarCustomPeriod(siblingData)

{
  type: 'row',
  fields: [
    {
      name: 'periodStartDate',
      label: 'Academic Year Start Date',
      type: 'date',
      validate: validateCustomPeriodDate,
      admin: {
        condition: customPeriodCondition,
        date: { pickerAppearance: 'dayOnly' },
        description: 'The selected day is ignored; its month and year start the period.',
        width: '50%',
      },
    } satisfies DateField,
    {
      name: 'periodEndDate',
      label: 'Academic Year End Date',
      type: 'date',
      validate: validateCustomPeriodDate,
      admin: {
        condition: customPeriodCondition,
        date: { pickerAppearance: 'dayOnly' },
        description: 'Choose a month that completes exactly 12 consecutive months.',
        width: '50%',
      },
    } satisfies DateField,
  ],
}
```

Import the shared validator and period-input type; the shared validator remains the only owner of the validation message.

- [ ] **Step 5: Run the focused tests and verify the pure/schema contract passes**

Run the command from Step 2.

Expected: PASS for date extraction, exact twelve-month validation, field names, day-only picker appearance, and current-year fallback. UI/preview expectations that still mention the old scope or ledger may remain red until Tasks 2–3.

### Task 2: Thread the Date Contract Through Production, Cache, and Live Preview

**Files:**
- Modify: `src/blocks/AnnualCalendar/Component.tsx`
- Modify: `src/blocks/AnnualCalendar/PreviewComponent.tsx`
- Modify: `src/lib/newsEventsPreviewShared.ts`
- Modify: `src/lib/calendarEvents.ts`
- Modify: `tests/int/annual-calendar-data.int.spec.ts`
- Modify: `tests/int/annual-calendar.int.spec.tsx`
- Regenerate: `src/payload-types.ts`

**Interfaces:**
- Consumes: the Task 1 `AnnualCalendarPeriodInput`, normalizer, scope key, and response version.
- Preserves: `fetchAnnualCalendarPeriod(...)`, `getPublicAnnualCalendarInitialSnapshot(...)`, and `getDraftAnnualCalendarInitialSnapshot(...)` signatures.
- Produces: date-based Page and Reusable Section preview scopes keyed identically to `PreviewComponent.tsx`.

- [ ] **Step 1: Update preview and loader tests for the new scope identity**

In `tests/int/annual-calendar.int.spec.tsx`, change discovered scope expectations to:

```ts
expect(getAnnualCalendarPreviewScopes(layout)).toEqual([
  {
    classificationIDs: ['academic', 'exam'],
    key: '[["academic","exam"],"currentYear",null,null]',
    periodInput: {
      periodEndDate: null,
      periodMode: 'currentYear',
      periodStartDate: null,
    },
  },
])
```

For equal classification scopes across two periods, use:

```ts
{
  blockType: 'annualCalendar',
  classifications: ['academic'],
  periodEndDate: '2027-06-02T00:00:00.000Z',
  periodMode: 'customAcademicYear',
  periodStartDate: '2026-07-15T00:00:00.000Z',
}
```

and expect the keys:

```ts
[
  '[["academic"],"currentYear",null,null]',
  '[["academic"],"customAcademicYear","2026-07-15T00:00:00.000Z","2027-06-02T00:00:00.000Z"]',
]
```

In `tests/int/annual-calendar-data.int.spec.ts`, replace every old Month/Year input passed to `fetchAnnualCalendarPeriod` with the two ISO date strings, change snapshot version expectations to `3`, and retain the assertion that invalid custom input leaves `find` uncalled. In `tests/int/annual-calendar.int.spec.tsx`, also change the shared `initial.version` fixture from `2 as const` to `3 as const`.

- [ ] **Step 2: Run the focused tests and verify the propagation gap fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because production and preview adapters still construct the removed Month/Year input shape and generated types do not contain the new fields.

- [ ] **Step 3: Pass date fields through production and client-safe preview adapters**

In both `src/blocks/AnnualCalendar/Component.tsx` and `src/blocks/AnnualCalendar/PreviewComponent.tsx`, construct only:

```ts
const periodInput: AnnualCalendarPeriodInput = {
  periodEndDate: props.periodEndDate,
  periodMode: props.periodMode,
  periodStartDate: props.periodStartDate,
}
```

Do not pass hidden custom dates into any other contract. The scope helper itself is responsible for ignoring them in current-year mode.

- [ ] **Step 4: Discover date fields in Page and Reusable Section previews**

In `getAnnualCalendarPreviewScopes` inside `src/lib/newsEventsPreviewShared.ts`, replace the old record extraction with:

```ts
const periodInput: AnnualCalendarPeriodInput = {
  periodEndDate: typeof record.periodEndDate === 'string' ? record.periodEndDate : null,
  periodMode: record.periodMode === 'customAcademicYear' ? 'customAcademicYear' : 'currentYear',
  periodStartDate: typeof record.periodStartDate === 'string' ? record.periodStartDate : null,
}
const key = getAnnualCalendarScopeKey(classificationIDs, periodInput)
scopes.set(key, { classificationIDs, key, periodInput })
```

Keep the existing depth-10 and `WeakSet` cycle guards unchanged.

- [ ] **Step 5: Verify loader normalization and versioned cache identity**

In `src/lib/calendarEvents.ts`, keep `normalizeAnnualCalendarPeriod(periodInput, todayKey)` before every annual query. Confirm the persistent cache key remains based on normalized values:

```ts
[
  'annual-calendar-period',
  String(ANNUAL_CALENDAR_RESPONSE_VERSION),
  period.periodMode,
  period.startMonthKey,
  period.endMonthKey,
  timeZone,
  ...ids,
]
```

No raw date or selected day belongs in this public cache key. The version automatically moves from 2 to 3 through the shared constant. Keep invalid custom periods throwing `CalendarScopeError` before `resolveCalendarClassifications` or `payload.find`.

- [ ] **Step 6: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` replaces the Annual Calendar `startMonth`, `startYear`, `endMonth`, and `endYear` properties with nullable string `periodStartDate` and `periodEndDate` properties. Do not hand-edit the generated file.

- [ ] **Step 7: Run the focused data and preview tests**

Run the command from Step 2.

Expected: PASS for current/custom scopes, date propagation, response version 3, public/draft query bounds, and fail-closed invalid ranges.

### Task 3: Replace the Ledger with the Approved Year Stream

**Files:**
- Create: `src/blocks/AnnualCalendar/AnnualCalendarYearStream.tsx`
- Delete: `src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx`
- Modify: `src/blocks/AnnualCalendar/Presentation.tsx`
- Modify: `tests/int/annual-calendar.int.spec.tsx`

**Interfaces:**
- Consumes: `AnnualCalendarMonth[]`, `eventCount`, `periodLabel`, `todayKey`, `emptyMessage`, and semantic `BlockSurface`.
- Produces: `AnnualCalendarYearStream(props)` with `data-annual-calendar-stream`, twelve `data-annual-calendar-month` chapters, `data-current-month`, `data-today`, and `data-annual-calendar-empty` hooks.
- Preserves: complete-card `/news-events/...` links and the existing `AnnualCalendarUpcoming` composition.

- [ ] **Step 1: Rewrite presentation tests around chronology rather than table geometry**

Replace ledger assertions in `tests/int/annual-calendar.int.spec.tsx` with:

```ts
const stream = container.querySelector('[data-annual-calendar-stream="true"]')
expect(stream).toBeTruthy()
expect(container.querySelector('[data-annual-calendar-ledger="true"]')).toBeNull()
expect(container.querySelectorAll('[data-annual-calendar-month="true"]')).toHaveLength(12)
expect(container.querySelector('[data-annual-calendar-spine="true"]')).toBeTruthy()

const currentMonth = container.querySelector('[data-current-month="true"]')
expect(currentMonth?.textContent).toContain('Current')
expect(currentMonth?.textContent).toContain('August')
expect(currentMonth?.textContent?.indexOf('Current')).toBeLessThan(
  currentMonth?.textContent?.indexOf('August') ?? 0,
)

expect(container.querySelectorAll('[data-annual-calendar-event="true"]')).toHaveLength(2)
expect(container.querySelector('[data-today="true"]')?.textContent).toContain('Event today')
expect(container.querySelector('[data-annual-calendar-empty="true"]')?.className).not.toContain(
  'min-h-24',
)
expect(container.querySelector('[data-annual-calendar-empty="true"]')?.textContent).toContain(
  'No events are scheduled for this month.',
)
```

Retain the existing summary copy, link count, Coming Next, no-legend, display-font section title, semantic surface, and no-hex-color assertions.

- [ ] **Step 2: Run the rendering test and verify the ledger fails the new contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because the stream/spine hooks do not exist and empty months still use ledger row height.

- [ ] **Step 3: Create the focused Year Stream renderer**

Create `src/blocks/AnnualCalendar/AnnualCalendarYearStream.tsx` with this complete implementation:

```tsx
import { Badge } from '@/components/ui/badge'
import type { AnnualCalendarMonth } from '@/blocks/AnnualCalendar/annualCalendarShared'
import type { CalendarEvent } from '@/blocks/Calendar/calendarShared'
import {
  resolveCalendarSurfaceClasses,
  type CalendarSurfaceClasses,
} from '@/blocks/Calendar/calendarStyles'
import { getCalendarToneStyle } from '@/blocks/Calendar/calendarTone'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'

type AnnualCalendarYearStreamProps = {
  emptyMessage: string
  eventCount: number
  months: AnnualCalendarMonth[]
  periodLabel: string
  surface?: BlockSurface
  todayKey: string
}

type AnnualCalendarEventCardProps = {
  event: CalendarEvent
  isToday: boolean
  styles: CalendarSurfaceClasses
  surface: BlockSurface
}

const shortMonth = (dateKey: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateKey}T00:00:00.000Z`),
  )

function AnnualCalendarEventCard({
  event,
  isToday,
  styles,
  surface,
}: AnnualCalendarEventCardProps) {
  return (
    <a
      className={cn(
        styles.panel,
        'grid min-h-24 grid-cols-[3.5rem_0.25rem_minmax(0,1fr)] items-start gap-3 p-4 transition-colors hover:bg-current/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset md:px-5',
        surface === 'brand'
          ? 'focus-visible:ring-primary-foreground'
          : 'focus-visible:ring-ring',
        isToday && (surface === 'brand' ? 'bg-primary-foreground/8' : 'bg-primary/5'),
      )}
      data-annual-calendar-event="true"
      data-today={isToday ? 'true' : undefined}
      href={event.href}
    >
      <time
        className="font-mono text-xl leading-none font-semibold tabular-nums"
        dateTime={event.startDateKey}
      >
        {event.startDateKey.slice(8, 10)}
        <span
          className={cn(
            'mt-1 block text-[0.625rem] tracking-[0.12em] uppercase',
            styles.supportingText,
          )}
        >
          {isToday ? 'Today' : shortMonth(event.startDateKey)}
        </span>
      </time>
      <span
        aria-hidden="true"
        className="h-full min-h-12 w-1 rounded-[var(--radius)] bg-[var(--calendar-tone)]"
        style={getCalendarToneStyle(event.classification.calendarColor)}
      />
      <span className="min-w-0">
        <span className="block text-sm leading-5 font-semibold">{event.title}</span>
        <span className={cn('mt-1 block text-xs leading-5', styles.supportingText)}>
          {event.allDay ? 'All day' : event.timeLabel}
          {event.location ? ` · ${event.location}` : ''}
        </span>
        <span className="mt-2 block font-mono text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
          {event.classification.badgeLabel}
        </span>
      </span>
    </a>
  )
}

export function AnnualCalendarYearStream({
  emptyMessage,
  eventCount,
  months,
  periodLabel,
  surface = 'light',
  todayKey,
}: AnnualCalendarYearStreamProps) {
  const styles = resolveCalendarSurfaceClasses(surface)
  const currentMonthKey = todayKey.slice(0, 7)

  return (
    <div data-annual-calendar-stream="true">
      <header className={cn('flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-end sm:justify-between', styles.border)}>
        <h3 className="font-sans text-base font-semibold">{periodLabel}</h3>
        <p className={cn('font-mono text-xs tabular-nums', styles.supportingText)}>
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </p>
      </header>

      <div className="relative pt-7">
        <span
          aria-hidden="true"
          className={cn('absolute top-7 bottom-0 left-[0.4375rem] w-px', styles.separator)}
          data-annual-calendar-spine="true"
        />

        <div className="flex flex-col gap-9">
          {months.map((month) => {
            const isCurrentMonth = month.monthKey === currentMonthKey

            return (
              <section
                className="relative grid gap-4 pl-7 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6"
                data-annual-calendar-month="true"
                data-current-month={isCurrentMonth ? 'true' : undefined}
                key={month.monthKey}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-1 left-0 size-[0.9375rem] rounded-none border border-current bg-current',
                    isCurrentMonth && 'border-success bg-success',
                  )}
                />

                <header className="flex min-w-0 flex-col items-start gap-2">
                  {isCurrentMonth ? (
                    <Badge
                      className="rounded-[var(--radius)] border-current/25 bg-transparent font-mono text-[0.625rem] tracking-[0.12em] uppercase"
                      variant="outline"
                    >
                      Current
                    </Badge>
                  ) : null}
                  <h3 className="font-sans text-lg font-semibold tracking-[-0.02em]">
                    {month.monthLabel}
                  </h3>
                  <span className={cn('font-mono text-[0.625rem] tracking-[0.12em] uppercase', styles.supportingText)}>
                    {month.events.length} {month.events.length === 1 ? 'event' : 'events'}
                  </span>
                </header>

                {month.events.length > 0 ? (
                  <div className="grid gap-3">
                    {month.events.map((event) => (
                      <AnnualCalendarEventCard
                        event={event}
                        isToday={event.startDateKey === todayKey}
                        key={event.id}
                        styles={styles}
                        surface={surface}
                      />
                    ))}
                  </div>
                ) : (
                  <p
                    className={cn('self-center text-sm leading-6', styles.supportingText)}
                    data-annual-calendar-empty="true"
                  >
                    {emptyMessage}
                  </p>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

Do not put `font-display` on the period label, month name, event title, or metadata. Do not add animation, horizontal scrolling, fixed colors, a continuous outer border, or a classification legend.

- [ ] **Step 4: Replace the presentation import and remove the ledger**

In `src/blocks/AnnualCalendar/Presentation.tsx`, import `AnnualCalendarYearStream` and replace only the main-column call:

```tsx
<AnnualCalendarYearStream
  emptyMessage={resolvedEmptyMessage}
  eventCount={initial.eventCount}
  months={initial.months}
  periodLabel={initial.periodLabel}
  surface={appearanceClasses.surface}
  todayKey={initial.todayKey}
/>
```

Keep `AnnualCalendarUpcoming`, the section header, shared actions, empty-not-configured state, and responsive `20rem` sidebar grid unchanged. Delete `src/blocks/AnnualCalendar/AnnualCalendarLedger.tsx` after no imports remain.

- [ ] **Step 5: Run the focused rendering tests**

Run the command from Step 2.

Expected: PASS with twelve chronological month chapters, compact empty states, semantic markers/cards, accessible links, Current/Today text, and unchanged Coming Next behavior.

### Task 4: Refresh Generated Visuals, Types, and Operator Contracts

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx`
- Regenerate: `public/block-thumbnails/annual-calendar.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate as needed: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: Annual Calendar response version 3 and `AnnualCalendarYearStream` presentation.
- Produces: accurate block-picker imagery and maintained documentation for editors and implementers.

- [ ] **Step 1: Update the thumbnail fixture response version**

In `src/block-thumbnails/fixtures.tsx`, keep the existing 2026 fixture events and change only:

```ts
version: 3,
```

The fixture should continue to exercise populated, empty, current, and upcoming states through `materializeAnnualCalendarMonths`.

- [ ] **Step 2: Regenerate and inspect the Annual Calendar thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/annual-calendar.jpg` shows the Year Stream rather than a boxed ledger. Inspect it at full size and confirm the spine, markers, month/event hierarchy, semantic contrast, and Coming Next column are legible. Revert unrelated generated thumbnail byte changes if the generator rewrites unaffected files.

- [ ] **Step 3: Update the editor-facing and maintained architecture copy**

In `docs/guides/blocks.md`, replace the Annual Calendar row description with:

```md
Defaults to January–December in the configured site timezone or accepts start/end dates whose months define one exact 12-month academic range; renders a chronological Year Stream with all twelve months, total event count, compact empty months, and an independent Coming Next panel
```

In `docs/architecture/feature-inventory.md`, replace Annual Calendar references to a ledger or four Month/Year controls with the two date-picker and Year Stream contract. In `.agents/skills/project-context/references/block-system.md`, describe:

```md
Annual Calendar is the twelve-month Explore companion to Calendar. Editors use either the current calendar year or two day-only date pickers whose selected months define exactly twelve consecutive inclusive months; selected days are ignored. One shared normalizer owns the production query bounds, persistent cache keys, authenticated preview scopes, derived period label, and twelve month keys, while invalid custom periods fail closed before querying News & Events. Visitors receive a chronological Year Stream with a semantic spine, square month markers, compact Current and event-count metadata, linked event cards, and lightweight empty-month copy. Coming Next remains independent of the selected period and stays beside the stream on desktop and below it on smaller screens.
```

Do not edit historical files under `docs/superpowers/**` other than checking off this active plan during execution.

- [ ] **Step 4: Run thumbnail and block-contract tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: PASS with Annual Calendar registered in all existing Page-compatible surfaces, rendered in production/live preview, and backed by a valid 1600×900 JPEG.

- [ ] **Step 5: Refresh project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project inventory and maintained references agree with the date fields, Year Stream file, registration, tests, and generated types. The check exits 0. A stale optional knowledge graph may be reported separately but must not be treated as a product failure.

### Task 5: Final Verification and Index-Integrity Check

**Files:**
- Verify only; do not stage or commit.

**Interfaces:**
- Consumes: all preceding tasks.
- Produces: a tested, uncommitted working tree whose pre-existing Git index is unchanged.

- [ ] **Step 1: Run focused Annual Calendar tests once more**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 2: Run TypeScript and lint**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both commands exit 0. If lint reports pre-existing warnings, confirm no warning points to an Annual Calendar file and report the baseline separately.

- [ ] **Step 3: Run the full integration suite**

Run:

```bash
pnpm test:int
```

Expected: all integration tests pass. If an environment-only MongoMemoryServer bind failure recurs, rerun the affected suite in an allowed environment and report it distinctly from repository failures.

- [ ] **Step 4: Re-run the project-context check after all generators**

Run:

```bash
pnpm project-context:check
```

Expected: exit 0.

- [ ] **Step 5: Inspect the final diff against the change-impact map**

Run:

```bash
git diff --check
git status --short
git diff -- src/blocks/AnnualCalendar src/lib/calendarEvents.ts src/lib/newsEventsPreviewShared.ts src/payload-types.ts tests/int/annual-calendar-data.int.spec.ts tests/int/annual-calendar.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
```

Expected: no whitespace errors; only the approved date-picker, Year Stream, generated artifact, test, and documentation changes appear in this task's unstaged layer.

- [ ] **Step 6: Confirm the pre-existing staged diff was not changed**

Run:

```bash
git diff --cached | shasum -a 256
```

Expected:

```text
a506fc88d5ee0ccc1fd5062b62f29a1d417b21b450c8f140972acdfb26166999  -
```

Do not stage or commit after this check. Hand off the working-tree changes, commands run, test results, regenerated artifacts, and project-context status to the user.
