# Calendar Inherited Surface and Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Calendar toolbar, month grid, Timeline, and Upcoming sidebar inherit one section-owned surface while adding framed controls, centered month navigation, compact arrow hover geometry, and an editor-configurable adjacent-month date treatment.

**Architecture:** Keep the existing Calendar data flow intact. Add one normalized Payload field in the Calendar schema, resolve the section light/brand surface in `Presentation.tsx`, and pass only the surface plus adjacent-date mode through the existing client/presentation boundary. Calendar-local style resolvers own all surface variants so shared shadcn primitives and unrelated blocks remain unchanged.

**Tech Stack:** Payload CMS 3.85, Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/Radix Tabs and Select, Vitest/Testing Library, Playwright.

## Global Constraints

- The Calendar section appearance is the only background owner; its internal toolbar, grid, Timeline, Upcoming, error, and empty regions must use transparent inherited surfaces.
- When the section background is None, the Calendar inherits the page background.
- Classification colors remain local accents and must not become text colors.
- Calendar and Timeline use framed shadcn Tabs with a filled active state and no underline.
- Tabs and Select are exactly 44px high.
- Month arrow targets remain 44 by 44px while visible hover fill is confined to a centered 32 by 32px shape.
- Adjacent Month Dates supports `muted` and `hidden`; new and missing values resolve to `muted`.
- Muted and hidden adjacent cells never render events or current-day treatment.
- Display typography remains restricted to the Calendar section-level title.
- Do not change Calendar queries, cache keys, timezone behavior, Upcoming selection, responsive Timeline fallback, access control, or API response shapes.
- Do not add a card-surface selector, separate Calendar background field, content migration, or global shadcn styling change.
- Do not stage or commit any file. Preserve the existing index exactly.

---

## File Structure

**Modify:**

- `src/blocks/Calendar/config.ts` — add the Payload select field.
- `src/blocks/Calendar/calendarShared.ts` — own the adjacent-date type, values, and runtime normalizer.
- `src/blocks/Calendar/Presentation.tsx` — normalize saved values, resolve the section surface, and pass both to the client.
- `src/blocks/Calendar/calendarStyles.ts` — replace fixed card classes with Calendar-local light/brand surface resolvers.
- `src/blocks/Calendar/CalendarClient.tsx` — build centered navigation, framed Tabs, inherited error state, and pass presentation settings to children.
- `src/blocks/Calendar/CalendarMonthView.tsx` — render muted/hidden adjacent cells and inherited month-grid styles.
- `src/blocks/Calendar/CalendarTimelineView.tsx` — inherit section surface.
- `src/blocks/Calendar/CalendarUpcoming.tsx` — inherit section surface.
- `src/block-thumbnails/fixtures.tsx` — include an explicit adjacent-date fixture only if generated types require it; runtime fallback must remain tested independently.
- `src/payload-types.ts` — regenerate from Payload schema.
- `tests/int/calendar.int.spec.tsx` — schema, normalizer, adjacent-date rendering, and behavior tests.
- `tests/int/calendar-ui-contracts.int.spec.tsx` — surface/control geometry and no-card/no-underline contracts.
- `tests/e2e/calendar.e2e.spec.ts` — assert the framed desktop controls, inherited surface, and mobile fallback.
- `docs/guides/blocks.md` — document the adjacent-date editor option and inherited surface behavior.
- `.agents/skills/project-context/references/block-system.md` — record the changed Calendar operator/rendering contract.
- `.agents/skills/project-context/references/project-inventory.json` — refresh generated inventory after structural edits.
- `public/block-thumbnails/calendar.jpg` — regenerate and inspect the 1600×900 editor thumbnail.

**Do not modify:**

- `src/components/ui/tabs.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/button.tsx`
- Calendar API/data loader files

---

### Task 1: Add and Normalize the Adjacent-Month Setting

**Files:**

- Modify: `src/blocks/Calendar/calendarShared.ts`
- Modify: `src/blocks/Calendar/config.ts`
- Modify: `tests/int/calendar.int.spec.tsx`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Produces: `CALENDAR_ADJACENT_MONTH_DATE_MODES`
- Produces: `CalendarAdjacentMonthDates = 'muted' | 'hidden'`
- Produces: `normalizeCalendarAdjacentMonthDates(value?: unknown): CalendarAdjacentMonthDates`
- Produces: Payload field `adjacentMonthDates`
- Consumed later by: `Presentation.tsx`, `CalendarClient.tsx`, and `CalendarMonthView.tsx`

- [ ] **Step 1: Write failing normalizer and schema tests**

Add the import:

```ts
import {
  buildCalendarGrid,
  getCalendarClassificationIDs,
  normalizeCalendarAdjacentMonthDates,
  type CalendarEvent,
  type CalendarInitialSnapshot,
} from '@/blocks/Calendar/calendarShared'
```

Extend the schema test with:

```ts
expect(findNamedField(CalendarBlock.fields, 'adjacentMonthDates')).toMatchObject({
  defaultValue: 'muted',
  options: [
    { label: 'Muted / Disabled', value: 'muted' },
    { label: 'Hidden', value: 'hidden' },
  ],
  required: true,
  type: 'select',
})
```

Add a focused test:

```ts
it('normalizes missing and invalid adjacent-month settings to muted', () => {
  expect(normalizeCalendarAdjacentMonthDates('hidden')).toBe('hidden')
  expect(normalizeCalendarAdjacentMonthDates('muted')).toBe('muted')
  expect(normalizeCalendarAdjacentMonthDates(undefined)).toBe('muted')
  expect(normalizeCalendarAdjacentMonthDates('unknown')).toBe('muted')
})
```

- [ ] **Step 2: Run the focused tests and verify the intended failure**

Run:

```bash
pnpm exec vitest run tests/int/calendar.int.spec.tsx
```

Expected: FAIL because `normalizeCalendarAdjacentMonthDates` and the Payload field do not exist.

- [ ] **Step 3: Add the shared type and normalizer**

Add to `calendarShared.ts` near the existing Calendar constants:

```ts
export const CALENDAR_ADJACENT_MONTH_DATE_MODES = ['muted', 'hidden'] as const

export type CalendarAdjacentMonthDates = (typeof CALENDAR_ADJACENT_MONTH_DATE_MODES)[number]

export const normalizeCalendarAdjacentMonthDates = (value?: unknown): CalendarAdjacentMonthDates =>
  value === 'hidden' ? 'hidden' : 'muted'
```

- [ ] **Step 4: Add the Payload Theme Settings field**

Add this field after `contentAlignment` in `config.ts`:

```ts
{
  name: 'adjacentMonthDates',
  label: 'Adjacent Month Dates',
  type: 'select',
  defaultValue: 'muted',
  options: [
    { label: 'Muted / Disabled', value: 'muted' },
    { label: 'Hidden', value: 'hidden' },
  ],
  required: true,
  admin: {
    description:
      'Choose whether dates outside the selected month remain faintly visible or are hidden.',
  },
} satisfies SelectField,
```

- [ ] **Step 5: Run the focused test and regenerate Payload types**

Run:

```bash
pnpm exec vitest run tests/int/calendar.int.spec.tsx
pnpm generate:types
```

Expected: Calendar tests PASS and `src/payload-types.ts` includes:

```ts
adjacentMonthDates?: ('muted' | 'hidden') | null
```

- [ ] **Step 6: Review checkpoint without staging**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; the current index remains untouched.

---

### Task 2: Build the Calendar Surface Contract

**Files:**

- Modify: `src/blocks/Calendar/calendarStyles.ts`
- Modify: `src/blocks/Calendar/Presentation.tsx`
- Modify: `tests/int/calendar-ui-contracts.int.spec.tsx`

**Interfaces:**

- Consumes: `BlockSurface` from `blockAppearance.ts`
- Produces: `CalendarSurfaceClasses`
- Produces: `resolveCalendarSurfaceClasses(surface?: BlockSurface): CalendarSurfaceClasses`
- Produces: `CalendarClient` props `surface` and `adjacentMonthDates`
- Consumed later by: all four interactive Calendar presentation files

- [ ] **Step 1: Write failing surface-contract tests**

Import the resolver:

```ts
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
```

Add tests:

```ts
it('uses transparent inherited panels for light and brand Calendar surfaces', () => {
  const light = resolveCalendarSurfaceClasses('light')
  const brand = resolveCalendarSurfaceClasses('brand')

  expect(light.panel).toContain('bg-transparent')
  expect(light.panel).toContain('border-border')
  expect(brand.panel).toContain('bg-transparent')
  expect(brand.panel).toContain('border-primary-foreground/20')
  expect(brand.supportingText).toContain('text-primary-foreground/70')

  const sources = `${light.panel}${light.toolbar}${brand.panel}${brand.toolbar}`
  expect(sources).not.toContain('bg-card')
  expect(sources).not.toContain('text-card-foreground')
})
```

Extend the source contract:

```ts
const presentation = fs.readFileSync(
  path.resolve(process.cwd(), 'src/blocks/Calendar/Presentation.tsx'),
  'utf8',
)

expect(presentation).toContain('surface={appearanceClasses.surface}')
expect(presentation).toContain('normalizeCalendarAdjacentMonthDates')
```

- [ ] **Step 2: Run the contract test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: FAIL because the resolver and prop wiring do not exist.

- [ ] **Step 3: Replace fixed Calendar styles with one surface resolver**

Replace `calendarStyles.ts` with this API:

```ts
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'

export type CalendarSurfaceClasses = {
  alert: string
  border: string
  navButton: string
  panel: string
  selectContent: string
  selectItem: string
  selectTrigger: string
  supportingText: string
  tabsList: string
  tabsTrigger: string
  toolbar: string
  weekday: string
}

export const resolveCalendarSurfaceClasses = (
  surface: BlockSurface = 'light',
): CalendarSurfaceClasses => {
  const isBrand = surface === 'brand'
  const border = isBrand ? 'border-primary-foreground/20' : 'border-border'
  const focus = isBrand ? 'focus-visible:ring-primary-foreground/40' : 'focus-visible:ring-ring/30'

  return {
    alert: cn('border bg-transparent text-current', border),
    border,
    navButton: cn(
      'relative size-11 rounded-none bg-transparent text-current hover:bg-transparent hover:text-current before:absolute before:inset-1.5 before:rounded-[var(--radius)] before:transition-colors motion-reduce:before:transition-none [&_svg]:relative [&_svg]:z-10',
      isBrand
        ? 'hover:before:bg-primary-foreground/12 focus-visible:ring-primary-foreground/40'
        : 'hover:before:bg-primary/10 focus-visible:ring-ring/30',
    ),
    panel: cn('rounded-[var(--radius)] border bg-transparent text-current', border),
    selectContent: 'rounded-[var(--radius)] border-border bg-popover text-popover-foreground',
    selectItem: 'rounded-[var(--radius)]',
    selectTrigger: cn(
      'h-11 min-w-44 rounded-[var(--radius)] bg-transparent text-current',
      border,
      focus,
    ),
    supportingText: isBrand ? 'text-primary-foreground/70' : 'text-muted-foreground',
    tabsList: cn(
      'hidden h-11 rounded-[var(--radius)] border bg-transparent p-1 md:inline-flex',
      border,
    ),
    tabsTrigger: cn(
      'h-full min-w-24 rounded-[calc(var(--radius)-2px)] border-0 px-4 font-sans text-sm font-semibold after:hidden',
      isBrand
        ? 'text-primary-foreground/70 hover:text-primary-foreground data-active:bg-primary-foreground data-active:text-primary focus-visible:ring-primary-foreground/40'
        : 'text-muted-foreground hover:text-foreground data-active:bg-primary data-active:text-primary-foreground focus-visible:ring-ring/30',
    ),
    toolbar: cn(
      'flex flex-col rounded-[var(--radius)] border bg-transparent text-current sm:flex-row sm:items-stretch',
      border,
    ),
    weekday: isBrand
      ? 'bg-transparent text-primary-foreground/70'
      : 'bg-transparent text-muted-foreground',
  }
}
```

If Tailwind sorting changes class order, preserve the exact semantics rather than literal ordering.

- [ ] **Step 4: Wire normalized settings and surface through Presentation**

Extend imports:

```ts
import {
  normalizeCalendarAdjacentMonthDates,
  type CalendarAdjacentMonthDates,
  type CalendarInitialSnapshot,
} from '@/blocks/Calendar/calendarShared'
```

Extend `CalendarBlockLike`:

```ts
adjacentMonthDates?: CalendarAdjacentMonthDates | null
```

Destructure `adjacentMonthDates`, then pass:

```tsx
<CalendarClient
  adjacentMonthDates={normalizeCalendarAdjacentMonthDates(adjacentMonthDates)}
  draft={draft}
  emptyMessage={resolvedEmptyMessage}
  initial={initial}
  surface={appearanceClasses.surface}
  upcomingEyebrow={upcomingEyebrow?.trim() || 'Up next'}
  upcomingTitle={upcomingTitle?.trim() || 'Upcoming'}
/>
```

Update the unconfigured Empty to inherit instead of forcing a card:

```tsx
<Empty className="min-h-64 rounded-[var(--radius)] border border-current/15 bg-transparent text-current">
```

- [ ] **Step 5: Run the surface contracts**

Run:

```bash
pnpm exec vitest run tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: PASS.

- [ ] **Step 6: Review checkpoint without staging**

Run:

```bash
git diff --check
git status --short
```

Expected: only working-tree changes from Tasks 1–2 plus pre-existing changes.

---

### Task 3: Recompose the Toolbar with Centered Navigation and Framed Tabs

**Files:**

- Modify: `src/blocks/Calendar/CalendarClient.tsx`
- Modify: `tests/int/calendar.int.spec.tsx`
- Modify: `tests/int/calendar-ui-contracts.int.spec.tsx`

**Interfaces:**

- Consumes: `CalendarAdjacentMonthDates`
- Consumes: `BlockSurface`
- Consumes: `resolveCalendarSurfaceClasses(surface)`
- Produces: `CalendarClientProps.adjacentMonthDates`
- Produces: `CalendarClientProps.surface`
- Passes later: `adjacentMonthDates` and `surface` to the month/timeline/upcoming children

- [ ] **Step 1: Write failing toolbar behavior and class contracts**

Update every `CalendarClient` test render to pass explicit defaults only where needed by TypeScript:

```tsx
<CalendarClient
  adjacentMonthDates="muted"
  emptyMessage="No events"
  initial={initial}
  surface="light"
  upcomingEyebrow="Up next"
  upcomingTitle="Upcoming"
/>
```

Add assertions to the Tabs test:

```ts
const tablist = screen.getByRole('tablist', { name: 'Calendar view' })
const select = screen.getByLabelText('Filter events by classification')
const monthLabel = screen.getByText('August 2026')

expect(tablist.className).toContain('h-11')
expect(tablist.className).toContain('border')
expect(tablist.getAttribute('data-variant')).toBe('default')
expect(select.className).toContain('h-11')
expect(monthLabel.parentElement?.className).toContain(
  'grid-cols-[2.75rem_minmax(9rem,1fr)_2.75rem]',
)
```

Extend the source contract:

```ts
const client = fs.readFileSync(
  path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarClient.tsx'),
  'utf8',
)

expect(client).toContain('variant="default"')
expect(client).not.toContain('variant="line"')
expect(client).toContain('resolveCalendarSurfaceClasses(surface)')
```

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: FAIL because the client still uses the line variant, fixed style constants, and two-sided flex month navigation.

- [ ] **Step 3: Extend CalendarClient props and resolve surface classes**

Add imports:

```ts
import type { CalendarAdjacentMonthDates } from '@/blocks/Calendar/calendarShared'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'
```

Update props:

```ts
type CalendarClientProps = {
  adjacentMonthDates?: CalendarAdjacentMonthDates
  draft?: boolean
  emptyMessage: string
  initial: CalendarInitialSnapshot
  surface?: BlockSurface
  upcomingEyebrow: string
  upcomingTitle: string
}
```

Destructure with safe defaults:

```ts
export function CalendarClient({
  adjacentMonthDates = 'muted',
  draft = false,
  emptyMessage,
  initial,
  surface = 'light',
  upcomingEyebrow,
  upcomingTitle,
}: CalendarClientProps) {
  const styles = resolveCalendarSurfaceClasses(surface)
```

- [ ] **Step 4: Replace the month navigator with a centered grid**

Replace the navigation wrapper and buttons with:

```tsx
<div
  className={cn(
    'grid grid-cols-[2.75rem_minmax(9rem,1fr)_2.75rem] items-center border-b sm:border-r sm:border-b-0',
    styles.border,
  )}
>
  <Button
    aria-label={`Show previous month, ${monthLabel(getAdjacentCalendarMonth(month.monthKey, -1))}`}
    className={styles.navButton}
    disabled={Boolean(pending)}
    onClick={() => navigate(-1)}
    size="icon-lg"
    type="button"
    variant="ghost"
  >
    <ChevronLeft aria-hidden="true" data-icon="inline-start" />
  </Button>
  <p className="px-3 text-center font-sans text-sm font-semibold tabular-nums">
    {pending?.label ?? month.monthLabel}
  </p>
  <Button
    aria-label={`Show next month, ${monthLabel(getAdjacentCalendarMonth(month.monthKey, 1))}`}
    className={styles.navButton}
    disabled={Boolean(pending)}
    onClick={() => navigate(1)}
    size="icon-lg"
    type="button"
    variant="ghost"
  >
    <ChevronRight aria-hidden="true" data-icon="inline-end" />
  </Button>
</div>
```

- [ ] **Step 5: Switch Calendar Tabs to the framed variant and surface-aware Select**

Use:

```tsx
<TabsList aria-label="Calendar view" className={styles.tabsList} variant="default">
  <TabsTrigger className={styles.tabsTrigger} value="calendar">
    Calendar
  </TabsTrigger>
  <TabsTrigger className={styles.tabsTrigger} value="timeline">
    Timeline
  </TabsTrigger>
</TabsList>
```

Use Calendar-local Select classes:

```tsx
<SelectTrigger
  aria-label="Filter events by classification"
  className={styles.selectTrigger}
>
  <SelectValue placeholder="All event types" />
</SelectTrigger>
<SelectContent className={styles.selectContent}>
  <SelectGroup>
    <SelectItem className={styles.selectItem} value="all">
      All event types
    </SelectItem>
    {initial.classifications.map((classification) => (
      <SelectItem
        className={styles.selectItem}
        key={classification.id}
        value={classification.id}
      >
        {classification.title}
      </SelectItem>
    ))}
  </SelectGroup>
</SelectContent>
```

Use `styles.toolbar` for the outer toolbar.

- [ ] **Step 6: Make the Alert inherit the surface**

Use:

```tsx
<Alert className={styles.alert} variant="destructive">
  <AlertDescription>{error}</AlertDescription>
  <AlertAction>
    <Button
      className={surface === 'brand' ? 'border-primary-foreground/30 text-current' : undefined}
      onClick={() => void loadMonth(failedTarget)}
      size="sm"
      type="button"
      variant="outline"
    >
      Retry
    </Button>
  </AlertAction>
</Alert>
```

Do not change retry, fetch, cache, pending, announcement, or abort behavior.

- [ ] **Step 7: Pass surface and adjacent-date mode to children**

Use:

```tsx
<CalendarMonthView
  adjacentMonthDates={adjacentMonthDates}
  events={filteredEvents}
  monthKey={month.monthKey}
  onShowMore={showMore}
  surface={surface}
  todayKey={initial.todayKey}
/>
```

Pass `surface={surface}` to both `CalendarTimelineView` instances and to `CalendarUpcoming`.

- [ ] **Step 8: Run toolbar tests**

Run:

```bash
pnpm exec vitest run tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: toolbar contracts pass after child prop types are completed in Task 4; temporary TypeScript errors in child props are acceptable only until the immediately following task.

- [ ] **Step 9: Review checkpoint without staging**

Run:

```bash
git diff --check
git status --short
```

Expected: no staging or commit changes.

---

### Task 4: Apply the Inherited Surface and Adjacent-Date Rendering

**Files:**

- Modify: `src/blocks/Calendar/CalendarMonthView.tsx`
- Modify: `src/blocks/Calendar/CalendarTimelineView.tsx`
- Modify: `src/blocks/Calendar/CalendarUpcoming.tsx`
- Modify: `tests/int/calendar.int.spec.tsx`
- Modify: `tests/int/calendar-ui-contracts.int.spec.tsx`

**Interfaces:**

- Consumes: `CalendarAdjacentMonthDates`
- Consumes: `BlockSurface`
- Consumes: `resolveCalendarSurfaceClasses(surface)`
- Produces: stable muted/hidden adjacent-cell behavior
- Preserves: timeline focus transfer and Upcoming classification legend

- [ ] **Step 1: Write failing adjacent-date rendering tests**

Add a crossing event fixture:

```ts
const crossingEvent: CalendarEvent = {
  ...event('crossing', '2026-07-31'),
  endDateKey: '2026-08-02',
  rangeLabel: 'Jul 31–Aug 2, 2026',
}
```

Add tests:

```ts
it('shows adjacent dates as muted and never renders their events', () => {
  const { container } = render(
    <CalendarMonthView
      adjacentMonthDates="muted"
      events={[crossingEvent]}
      monthKey="2026-08"
      onShowMore={vi.fn()}
      surface="light"
      todayKey="2026-07-31"
    />,
  )

  const adjacent = container.querySelector('[data-calendar-date="2026-07-31"]')
  expect(adjacent?.getAttribute('data-adjacent-month-date')).toBe('muted')
  expect(adjacent?.querySelector('time')).toBeTruthy()
  expect(adjacent?.querySelector('[data-calendar-event]')).toBeNull()
  expect(adjacent?.className).not.toContain('shadow-[inset_0_3px_0_var(--primary)]')
})

it('hides adjacent dates while preserving their grid cells', () => {
  const { container } = render(
    <CalendarMonthView
      adjacentMonthDates="hidden"
      events={[crossingEvent]}
      monthKey="2026-08"
      onShowMore={vi.fn()}
      surface="brand"
      todayKey="2026-08-23"
    />,
  )

  const adjacent = container.querySelector('[data-calendar-date="2026-07-31"]')
  expect(adjacent).toBeTruthy()
  expect(adjacent?.getAttribute('data-adjacent-month-date')).toBe('hidden')
  expect(adjacent?.getAttribute('aria-hidden')).toBe('true')
  expect(adjacent?.querySelector('time')).toBeNull()
  expect(adjacent?.querySelector('[data-calendar-event]')).toBeNull()
})
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/calendar.int.spec.tsx
```

Expected: FAIL because `CalendarMonthView` does not accept or render the new modes.

- [ ] **Step 3: Extend CalendarMonthView props and resolve surface classes**

Add imports:

```ts
import type { CalendarAdjacentMonthDates } from '@/blocks/Calendar/calendarShared'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
```

Update props and defaults:

```ts
type CalendarMonthViewProps = {
  adjacentMonthDates?: CalendarAdjacentMonthDates
  events: CalendarEvent[]
  monthKey: string
  onShowMore: (dateKey: string) => void
  surface?: BlockSurface
  todayKey: string
}

export function CalendarMonthView({
  adjacentMonthDates = 'muted',
  events,
  monthKey,
  onShowMore,
  surface = 'light',
  todayKey,
}: CalendarMonthViewProps) {
  const styles = resolveCalendarSurfaceClasses(surface)
```

- [ ] **Step 4: Render adjacent cells without events or current-day state**

Inside the cell map, compute:

```ts
const isAdjacent = !cell.inMonth
const hideAdjacent = isAdjacent && adjacentMonthDates === 'hidden'
const cellEvents = isAdjacent ? [] : (byDate.get(cell.dateKey) ?? [])
const hiddenCount = Math.max(0, cellEvents.length - 2)
const isToday = cell.inMonth && cell.dateKey === todayKey
```

Use this cell shell:

```tsx
<td
  aria-hidden={hideAdjacent ? 'true' : undefined}
  className={cn(
    'h-36 border p-2 align-top text-current',
    styles.border,
    isToday && 'shadow-[inset_0_3px_0_var(--primary)]',
  )}
  data-adjacent-month-date={isAdjacent ? adjacentMonthDates : undefined}
  data-calendar-date={cell.dateKey}
  key={cell.dateKey}
>
  {!hideAdjacent ? (
    <time
      className={cn(
        'inline-flex min-h-6 min-w-6 items-center justify-center rounded-[var(--radius)] font-mono text-xs font-semibold tabular-nums',
        isAdjacent &&
          (surface === 'brand' ? 'text-primary-foreground/35' : 'text-muted-foreground/55'),
        isToday && 'bg-primary px-1.5 text-primary-foreground',
      )}
      dateTime={cell.dateKey}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">{cell.day}</span>
      {isToday ? <span className="sr-only">, today</span> : null}
    </time>
  ) : null}
  {cell.inMonth ? (
    <div className="mt-2 flex flex-col gap-1.5">
      {cellEvents.slice(0, 2).map((event) => {
        const isStart = cell.dateKey === event.startDateKey
        const isEnd = cell.dateKey === event.endDateKey

        return (
          <a
            aria-label={`${event.classification.title}: ${event.title}. ${event.rangeLabel}${event.allDay ? '. All day' : ''}`}
            className={cn(
              'block min-h-10 border-l-2 bg-[color-mix(in_oklch,var(--calendar-tone)_12%,transparent)] px-2 py-1.5 text-xs leading-4 font-semibold text-current transition-colors hover:bg-[color-mix(in_oklch,var(--calendar-tone)_18%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none',
              !isStart && 'border-l-0 pl-2',
              isStart && 'rounded-l-[var(--radius)]',
              isEnd && 'rounded-r-[var(--radius)]',
            )}
            data-calendar-event={event.id}
            href={event.href}
            key={event.id}
            style={getCalendarToneStyle(event.classification.calendarColor)}
          >
            {!isStart ? <span className="sr-only">Continues: </span> : null}
            {event.title}
          </a>
        )
      })}
      {hiddenCount > 0 ? (
        <Button
          className="min-h-10 w-full justify-start px-0 text-left text-xs text-current"
          onClick={() => onShowMore(cell.dateKey)}
          size="sm"
          type="button"
          variant="link"
        >
          <span aria-hidden="true">+{hiddenCount} more</span>
          <span className="sr-only">
            Show {hiddenCount} more {hiddenCount === 1 ? 'event' : 'events'} on {label}
          </span>
        </Button>
      ) : null}
    </div>
  ) : null}
</td>
```

Use `styles.weekday` plus `styles.border` for weekday headers; do not use `bg-muted`.

- [ ] **Step 5: Make Timeline inherit the surface**

Add optional `surface?: BlockSurface`, default it to `light`, resolve `styles`, and use:

```tsx
<div className={styles.panel} data-calendar-timeline-view="true">
```

Use `cn('border-b p-4 font-sans text-sm font-semibold text-current md:border-r md:px-5 md:py-5', styles.border)` for each date heading. Use `cn('text-xs', styles.supportingText)` for all-day, range, time, and location metadata. Change the Badge class to:

```tsx
className =
  'rounded-[var(--radius)] border-[var(--calendar-tone)] bg-[color-mix(in_oklch,var(--calendar-tone)_10%,transparent)] text-current'
```

Use `styles.border` for every Separator through `className={styles.border}`.

The empty Timeline state uses:

```tsx
<Empty className={cn('min-h-64 rounded-[var(--radius)] border bg-transparent text-current', styles.border)}>
```

Keep date grouping, hrefs, separators, and focus refs unchanged.

- [ ] **Step 6: Make Upcoming inherit the surface**

Add optional `surface?: BlockSurface`, default it to `light`, resolve `styles`, and use:

```tsx
<aside className={styles.panel} data-calendar-upcoming="true">
```

Replace fixed border and supporting-text classes with `styles.border` and `styles.supportingText`. Replace the timeline-dot center `bg-card` with `bg-transparent`. Keep classification tone borders and dots unchanged.

The eyebrow uses:

```tsx
<p
  className={cn(
    'text-xs font-semibold tracking-[0.16em] uppercase',
    surface === 'brand' ? 'text-primary-foreground' : 'text-primary',
  )}
>
```

Keep the title sans-serif and retain all event links, limits, labels, and legend content.

- [ ] **Step 7: Update the UI source contract**

Assert the Calendar presentation children no longer force inner card surfaces:

```ts
for (const child of ['CalendarMonthView.tsx', 'CalendarTimelineView.tsx', 'CalendarUpcoming.tsx']) {
  const source = read(child)
  expect(source, child).not.toContain('bg-card')
  expect(source, child).not.toContain('text-card-foreground')
}
```

Keep the existing display-font restriction contract.

- [ ] **Step 8: Run all Calendar and theme tests**

Run:

```bash
pnpm exec vitest run \
  tests/int/calendar.int.spec.tsx \
  tests/int/calendar-ui-contracts.int.spec.tsx \
  tests/int/calendar-data.int.spec.ts \
  tests/int/calendar-route.int.spec.ts \
  tests/int/site-time-zone.int.spec.ts \
  tests/int/theme-contracts.int.spec.ts
```

Expected: all selected test files PASS.

- [ ] **Step 9: Review checkpoint without staging**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors and no new index changes.

---

### Task 5: Browser, Thumbnail, Documentation, and Repository Verification

**Files:**

- Modify: `tests/e2e/calendar.e2e.spec.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`
- Regenerate: `public/block-thumbnails/calendar.jpg`

**Interfaces:**

- Consumes: final Calendar DOM/data attributes and Payload schema
- Produces: browser regression coverage, editor documentation, current repository inventory, and thumbnail

- [ ] **Step 1: Extend the persistent Calendar E2E contract**

On desktop, assert framed equal-height controls and inherited panels:

```ts
const tablist = calendar.getByRole('tablist', { name: 'Calendar view' })
const filter = calendar.getByLabel('Filter events by classification')

await expect(tablist).toHaveAttribute('data-variant', 'default')
await expect(tablist).toHaveCSS('height', '44px')
await expect(filter).toHaveCSS('height', '44px')
await expect(calendar.locator('[data-calendar-upcoming="true"]')).toHaveCSS(
  'background-color',
  'rgba(0, 0, 0, 0)',
)
```

Keep the existing desktop month-grid, SNMIH light/dark surface-change, and mobile Timeline assertions. Do not add screenshot assertions to the permanent test.

- [ ] **Step 2: Run the Calendar browser test with the available Chrome channel**

Use the repository Playwright config when its configured browser is installed:

```bash
pnpm exec playwright test tests/e2e/calendar.e2e.spec.ts
```

If bundled Chromium is unavailable, create a temporary untracked config with `channel: 'chrome'`, run the same test, and delete the temporary config with `apply_patch` immediately afterward.

Expected: Calendar E2E PASS at desktop and 390px mobile.

- [ ] **Step 3: Perform one bounded visual pass**

Capture and inspect these states from the development-only Calendar thumbnail preview:

1. SNMIH light, 1600×900 desktop
2. SNMIH dark, 1600×900 desktop
3. SNMIH light, 390px mobile
4. SNMIH dark, 390px mobile

Confirm in one batch:

- the section, toolbar, grid/Timeline, and Upcoming read as one background;
- framed Tabs and Select match at 44px;
- the month label is centered;
- arrow hover fill is visibly compact while the target remains 44px;
- muted adjacent dates are faint and event-free;
- brand/dark supporting text and borders remain legible;
- no horizontal overflow occurs on mobile.

If defects appear, fix them in one batch and perform at most one confirmation capture.

- [ ] **Step 4: Regenerate and inspect the Calendar thumbnail**

Run:

```bash
env BLOCK_THUMBNAIL_SLUG=calendar pnpm generate:block-thumbnails
```

If an already-running stale Next.js development server causes a hydration mismatch, preserve that process and capture the same ready preview with system Chrome at exactly 1600×900 JPEG quality 90. Remove every temporary Playwright file afterward.

Verify:

```bash
file public/block-thumbnails/calendar.jpg
```

Expected: `JPEG image data` at `1600x900`.

- [ ] **Step 5: Update operator and architecture documentation**

Update the Calendar paragraph in `docs/guides/blocks.md` to state:

```md
The section appearance owns the complete Calendar background. Toolbar, month grid, Timeline, and Upcoming inherit that surface and use surface-aware borders and controls. Adjacent Month Dates can remain Muted / Disabled or be Hidden; both modes suppress adjacent-month events, and Muted / Disabled is the default and legacy fallback.
```

Update the Calendar paragraph in `block-system.md` with the same runtime contract, without copying implementation details or rewriting unrelated historical content.

- [ ] **Step 6: Run formatting, lint, type, and affected integration tests**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/Calendar/config.ts \
  src/blocks/Calendar/calendarShared.ts \
  src/blocks/Calendar/calendarStyles.ts \
  src/blocks/Calendar/Presentation.tsx \
  src/blocks/Calendar/CalendarClient.tsx \
  src/blocks/Calendar/CalendarMonthView.tsx \
  src/blocks/Calendar/CalendarTimelineView.tsx \
  src/blocks/Calendar/CalendarUpcoming.tsx \
  tests/int/calendar.int.spec.tsx \
  tests/int/calendar-ui-contracts.int.spec.tsx \
  tests/e2e/calendar.e2e.spec.ts \
  docs/guides/blocks.md \
  .agents/skills/project-context/references/block-system.md

pnpm exec eslint \
  src/blocks/Calendar/config.ts \
  src/blocks/Calendar/calendarShared.ts \
  src/blocks/Calendar/calendarStyles.ts \
  src/blocks/Calendar/Presentation.tsx \
  src/blocks/Calendar/CalendarClient.tsx \
  src/blocks/Calendar/CalendarMonthView.tsx \
  src/blocks/Calendar/CalendarTimelineView.tsx \
  src/blocks/Calendar/CalendarUpcoming.tsx \
  tests/int/calendar.int.spec.tsx \
  tests/int/calendar-ui-contracts.int.spec.tsx \
  tests/e2e/calendar.e2e.spec.ts

pnpm exec tsc --noEmit

pnpm exec vitest run \
  tests/int/calendar.int.spec.tsx \
  tests/int/calendar-ui-contracts.int.spec.tsx \
  tests/int/calendar-data.int.spec.ts \
  tests/int/calendar-route.int.spec.ts \
  tests/int/site-time-zone.int.spec.ts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/theme-contracts.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
```

Expected: lint and TypeScript exit 0; all selected tests PASS.

- [ ] **Step 7: Complete the mandatory project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project inventory updates for any new exports/types and the check prints `Project context is current.` The known stale optional knowledge-graph warning is acceptable.

- [ ] **Step 8: Inspect the final change impact and preserve the index**

Re-read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git diff --check
git status --short
git diff --stat
git diff --cached --stat
```

Expected:

- no whitespace errors;
- no temporary Playwright files;
- no commit was created;
- no `git add` was run;
- pre-existing staged changes remain staged exactly as they were before this plan execution;
- Calendar refinements remain in the working tree.

---

## Plan Self-Review

- **Spec coverage:** Every approved requirement maps to Tasks 1–5. Data/query behavior is explicitly preserved.
- **Placeholder scan:** No TBD, TODO, deferred implementation, or unspecified test step remains.
- **Type consistency:** `CalendarAdjacentMonthDates`, `BlockSurface`, `normalizeCalendarAdjacentMonthDates`, and `resolveCalendarSurfaceClasses` keep the same signatures across producer and consumer tasks.
- **Scope:** This is one cohesive Calendar presentation/schema refinement; no unrelated block or global UI primitive is modified.
- **Repository safety:** The plan explicitly avoids staging, commits, migrations, destructive commands, and changes to the existing development server.
