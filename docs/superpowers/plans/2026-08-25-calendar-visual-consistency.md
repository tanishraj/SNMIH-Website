# Calendar Visual Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Calendar block into the approved SNMIH Institutional Ledger direction with consistent shadcn controls, semantic light/dark colors, theme-owned radii, spacing, and typography that reserves the display font for the section title.

**Architecture:** Preserve the Calendar schema, loaders, API, state, and responsive information architecture. Add official shadcn Tabs and Alert primitives, compose them inside `CalendarClient`, and centralize Calendar-only layout classes in a focused style module so the existing site-wide Select defaults remain unchanged. Normalize the month, timeline, and Upcoming presentations against semantic tokens and verify the result through source contracts, rendered interaction tests, theme tests, Playwright, and the project-context loop.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui radix-luma, Radix UI, Vitest, Testing Library, Playwright, Payload CMS 3.85.2.

## Global Constraints

- Keep this a focused Calendar refinement; do not change Calendar schema, API, caching, timezone, recurrence, migrations, or content behavior.
- The Calendar block section heading is the only Calendar text allowed to use `var(--font-display)`.
- Use semantic tokens for all readable surfaces and text; classification colors are accents only.
- Use the active theme radius throughout Calendar; SNMIH resolves `--radius` to zero.
- Desktop starts in Calendar view; compact layouts remain Timeline-first with no desktop view tabs.
- Preserve existing live announcements, keyboard focus transfer, event links, filtering, loading, error recovery, empty states, all-day events, and inclusive multi-day ranges.
- Do not modify the shared Select defaults or restyle unrelated blocks.
- Do not stage or commit any files; the user explicitly requested uncommitted changes.

---

### Task 1: Add project-aligned shadcn Tabs and Alert primitives

**Files:**

- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/alert.tsx`
- Test: `tests/int/calendar-ui-contracts.int.spec.tsx`

**Interfaces:**

- Produces: `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent` from `@/components/ui/tabs`.
- Produces: `Alert`, `AlertDescription`, and `AlertAction` from `@/components/ui/alert`.
- Consumes: the existing Radix base, Lucide icon system, `cn()`, and semantic theme tokens.

- [ ] **Step 1: Write the failing primitive contract test**

Create `tests/int/calendar-ui-contracts.int.spec.tsx`:

```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

describe('Calendar shadcn primitives', () => {
  it('exposes accessible Tabs behavior with the line variant', () => {
    render(
      <Tabs defaultValue="calendar">
        <TabsList aria-label="Calendar view" variant="line">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <TabsContent value="calendar">Month grid</TabsContent>
        <TabsContent value="timeline">Timeline list</TabsContent>
      </Tabs>,
    )

    expect(screen.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Timeline' }))
    fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }))
    expect(screen.getByText('Timeline list')).toBeTruthy()
  })

  it('composes a semantic recoverable alert', () => {
    render(
      <Alert variant="destructive">
        <AlertDescription>Calendar unavailable.</AlertDescription>
        <AlertAction>
          <button type="button">Retry</button>
        </AlertAction>
      </Alert>,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Calendar unavailable.')
    expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run the primitive test and confirm the missing modules fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: FAIL because `@/components/ui/tabs` and `@/components/ui/alert` do not exist.

- [ ] **Step 3: Install the official components through the project package runner**

Run:

```bash
pnpm dlx shadcn@latest add tabs alert
```

Expected: creates exactly `src/components/ui/tabs.tsx` and `src/components/ui/alert.tsx`; it must not overwrite unrelated UI files.

- [ ] **Step 4: Align the new primitives with project semantic radius and colors**

Keep the official Radix behavior, exports, and data attributes. In `src/components/ui/tabs.tsx`, use these base variants:

```tsx
const tabsListVariants = cva(
  'group/tabs inline-flex w-fit items-center justify-center rounded-[var(--radius)] p-1 text-muted-foreground group-data-horizontal/tabs:h-9 group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        line: 'gap-1 border-b border-border bg-transparent p-0',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)
```

Use this semantic trigger contract, removing all generated manual `dark:` color branches:

```tsx
className={cn(
  'relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-2 rounded-[var(--radius)] border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-active:bg-background data-active:text-foreground',
  'after:absolute after:bg-primary after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-px group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100',
  className,
)}
```

In `src/components/ui/alert.tsx`, replace the generated fixed `rounded-2xl` base with `rounded-[var(--radius)]`. Keep `bg-card`, `text-card-foreground`, `text-destructive`, `text-muted-foreground`, and the official composition exports unchanged.

- [ ] **Step 5: Run and pass the primitive contract**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-ui-contracts.int.spec.tsx
pnpm exec eslint src/components/ui/tabs.tsx src/components/ui/alert.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: both tests pass with zero ESLint errors.

- [ ] **Step 6: Review the task diff without staging or committing**

Run:

```bash
git diff -- src/components/ui/tabs.tsx src/components/ui/alert.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: only the two new shadcn primitives and their focused contract appear.

---

### Task 2: Recompose the Calendar toolbar with shadcn controls

**Files:**

- Create: `src/blocks/Calendar/calendarStyles.ts`
- Modify: `src/blocks/Calendar/CalendarClient.tsx`
- Modify: `tests/int/calendar.int.spec.tsx`
- Test: `tests/int/calendar-ui-contracts.int.spec.tsx`

**Interfaces:**

- Consumes: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Alert`, `AlertDescription`, `AlertAction`, existing `Button`, and existing `Select` primitives.
- Produces: `calendarToolbarClasses`, `calendarTabsListClasses`, `calendarTabsTriggerClasses`, `calendarSelectTriggerClasses`, `calendarSelectContentClasses`, and `calendarSelectItemClasses`.
- Preserves: `CalendarView`, `loadMonth()`, `navigate()`, `showMore()`, `filteredEvents`, `resolvedEmptyMessage`, and focus transfer.

- [ ] **Step 1: Extend the Calendar interaction test before changing the component**

Add the following test to `tests/int/calendar.int.spec.tsx` and replace `afterEach(cleanup)` with:

```tsx
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
```

Then add:

```tsx
it('uses Tabs for views and a grouped Select for event classification', () => {
  render(
    <CalendarClient
      emptyMessage="No events"
      initial={initial}
      upcomingEyebrow="Up next"
      upcomingTitle="Upcoming"
    />,
  )

  expect(screen.getByRole('tablist', { name: 'Calendar view' })).toBeTruthy()
  expect(screen.getByRole('tab', { name: 'Calendar' })).toHaveAttribute('aria-selected', 'true')
  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Timeline' }))
  fireEvent.click(screen.getByRole('tab', { name: 'Timeline' }))
  expect(screen.getByRole('tab', { name: 'Timeline' })).toHaveAttribute('aria-selected', 'true')
  expect(screen.getByLabelText('Filter events by classification')).toHaveAttribute(
    'data-slot',
    'select-trigger',
  )
})

it('renders the month-loading failure through a recoverable Alert', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
  render(
    <CalendarClient
      emptyMessage="No events"
      initial={initial}
      upcomingEyebrow="Up next"
      upcomingTitle="Upcoming"
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: 'Show next month, September 2026' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'We could not load that month. Your current events are still shown.',
  )
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy()
})
```

- [ ] **Step 2: Add a source contract for Calendar-only theme integration**

Append to `tests/int/calendar-ui-contracts.int.spec.tsx`:

```tsx
import fs from 'node:fs'
import path from 'node:path'

it('keeps Calendar controls semantic and radius-owned without global Select changes', () => {
  const styles = fs.readFileSync(
    path.resolve(process.cwd(), 'src/blocks/Calendar/calendarStyles.ts'),
    'utf8',
  )
  const select = fs.readFileSync(
    path.resolve(process.cwd(), 'src/components/ui/select.tsx'),
    'utf8',
  )

  expect(styles).toContain('rounded-[var(--radius)]')
  expect(styles).toContain('border-border')
  expect(styles).not.toMatch(/dark:/)
  expect(select).toContain('rounded-3xl')
})
```

- [ ] **Step 3: Run the focused tests and confirm the old ToggleGroup implementation fails them**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: FAIL because Calendar still exposes a `radiogroup`, the style module is missing, and the error state is not a shadcn Alert.

- [ ] **Step 4: Create Calendar-only style constants**

Create `src/blocks/Calendar/calendarStyles.ts`:

```ts
export const calendarPanelClasses =
  'rounded-[var(--radius)] border border-border bg-card text-card-foreground'

export const calendarToolbarClasses =
  'flex flex-col rounded-[var(--radius)] border border-border bg-card text-card-foreground sm:flex-row sm:items-stretch'

export const calendarTabsListClasses = 'hidden h-11 rounded-none border-b-0 md:inline-flex'

export const calendarTabsTriggerClasses =
  'h-11 min-w-24 rounded-none px-4 font-sans text-sm font-semibold data-active:text-primary'

export const calendarSelectTriggerClasses =
  'h-11 min-w-44 rounded-[var(--radius)] border-border bg-card text-card-foreground'

export const calendarSelectContentClasses =
  'rounded-[var(--radius)] border-border bg-popover text-popover-foreground'

export const calendarSelectItemClasses = 'rounded-[var(--radius)]'
```

- [ ] **Step 5: Replace ToggleGroup and the custom alert in CalendarClient**

In `src/blocks/Calendar/CalendarClient.tsx`:

1. Remove `ToggleGroup` and `ToggleGroupItem` imports.
2. Import `Alert`, `AlertAction`, `AlertDescription`, the Tabs exports, `SelectGroup`, and all constants from `calendarStyles.ts`.
3. Wrap the toolbar and view content in a controlled `Tabs` root:

```tsx
<Tabs
  className="gap-4"
  onValueChange={(value) => {
    if (value === 'calendar' || value === 'timeline') {
      setView(value)
      setAnnouncement(`${value === 'calendar' ? 'Calendar' : 'Timeline'} view.`)
    }
  }}
  value={view}
>
  <div className={calendarToolbarClasses}>
    {/* existing month navigation group */}
    <div className="flex flex-1 flex-wrap items-center justify-end gap-2 p-2">
      <TabsList aria-label="Calendar view" className={calendarTabsListClasses} variant="line">
        <TabsTrigger className={calendarTabsTriggerClasses} value="calendar">
          Calendar
        </TabsTrigger>
        <TabsTrigger className={calendarTabsTriggerClasses} value="timeline">
          Timeline
        </TabsTrigger>
      </TabsList>
      {/* Select follows */}
    </div>
  </div>
  {/* Alert and content grid follow */}
</Tabs>
```

Use `size="icon-lg"`, `className="size-11 rounded-[var(--radius)]"`, and `data-icon` on both Chevron icons. Keep each navigation label unchanged.

Compose Select exactly as:

```tsx
<Select onValueChange={setFilter} value={filter}>
  <SelectTrigger
    aria-label="Filter events by classification"
    className={calendarSelectTriggerClasses}
  >
    <SelectValue placeholder="All event types" />
  </SelectTrigger>
  <SelectContent className={calendarSelectContentClasses}>
    <SelectGroup>
      <SelectItem className={calendarSelectItemClasses} value="all">
        All event types
      </SelectItem>
      {initial.classifications.map((classification) => (
        <SelectItem
          className={calendarSelectItemClasses}
          key={classification.id}
          value={classification.id}
        >
          {classification.title}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

Replace the custom error `div` with:

```tsx
{
  error ? (
    <Alert className="rounded-[var(--radius)]" variant="destructive">
      <AlertDescription>{error}</AlertDescription>
      <AlertAction>
        <Button
          onClick={() => void loadMonth(failedTarget)}
          size="sm"
          type="button"
          variant="outline"
        >
          Retry
        </Button>
      </AlertAction>
    </Alert>
  ) : null
}
```

Render the view inside Tabs content while preserving mobile Timeline-first behavior:

```tsx
<main className="min-w-0">
  <TabsContent className="mt-0" value="calendar">
    <div className="hidden md:block">
      <CalendarMonthView
        events={filteredEvents}
        monthKey={month.monthKey}
        onShowMore={showMore}
        todayKey={initial.todayKey}
      />
    </div>
    <div className="md:hidden">
      <CalendarTimelineView emptyMessage={resolvedEmptyMessage} events={filteredEvents} />
    </div>
  </TabsContent>
  <TabsContent className="mt-0" value="timeline">
    <CalendarTimelineView emptyMessage={resolvedEmptyMessage} events={filteredEvents} />
  </TabsContent>
</main>
```

- [ ] **Step 6: Run the toolbar and interaction tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: all Calendar interaction and primitive tests pass, including `+N more` focus transfer.

- [ ] **Step 7: Review the task diff without staging or committing**

Run:

```bash
git diff -- src/blocks/Calendar/CalendarClient.tsx src/blocks/Calendar/calendarStyles.ts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: Calendar state behavior is unchanged; only composition, styling constants, and focused tests change.

---

### Task 3: Normalize Calendar typography, spacing, and semantic surfaces

**Files:**

- Modify: `src/blocks/Calendar/CalendarMonthView.tsx`
- Modify: `src/blocks/Calendar/CalendarTimelineView.tsx`
- Modify: `src/blocks/Calendar/CalendarUpcoming.tsx`
- Modify: `src/blocks/Calendar/Presentation.tsx`
- Modify: `src/blocks/Calendar/calendarStyles.ts`
- Modify: `tests/int/calendar.int.spec.tsx`
- Modify: `tests/int/calendar-ui-contracts.int.spec.tsx`

**Interfaces:**

- Consumes: semantic token classes, `Badge`, `Button`, `Separator`, `Empty`, and `getCalendarToneStyle()`.
- Produces: a single typography hierarchy shared by Month, Timeline, and Upcoming.
- Preserves: semantic table markup, event link labels, all-day rendering, multi-day continuation behavior, Upcoming next-four stability, and empty-state copy.

- [ ] **Step 1: Write a failing typography and semantic-color source contract**

Add to `tests/int/calendar-ui-contracts.int.spec.tsx`:

```tsx
it('reserves display typography for the Calendar section heading', () => {
  const read = (file: string) =>
    fs.readFileSync(path.resolve(process.cwd(), `src/blocks/Calendar/${file}`), 'utf8')

  expect(read('Presentation.tsx')).toContain('contentSectionHeadingClasses')
  for (const child of [
    'CalendarClient.tsx',
    'CalendarMonthView.tsx',
    'CalendarTimelineView.tsx',
    'CalendarUpcoming.tsx',
  ]) {
    expect(read(child), child).not.toContain('font-display')
  }
})

it('uses Calendar color only for accents and semantic tokens for text', () => {
  const month = fs.readFileSync(
    path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarMonthView.tsx'),
    'utf8',
  )
  const timeline = fs.readFileSync(
    path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarTimelineView.tsx'),
    'utf8',
  )
  const upcoming = fs.readFileSync(
    path.resolve(process.cwd(), 'src/blocks/Calendar/CalendarUpcoming.tsx'),
    'utf8',
  )

  expect(`${month}${timeline}${upcoming}`).not.toContain('text-[var(--calendar-tone)]')
  expect(`${month}${timeline}${upcoming}`).toContain('text-card-foreground')
  expect(`${month}${timeline}${upcoming}`).toContain('text-muted-foreground')
})
```

- [ ] **Step 2: Run the source contract and confirm current child display-font usage fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-ui-contracts.int.spec.tsx
```

Expected: FAIL because Timeline and Upcoming currently use `font-display`.

- [ ] **Step 3: Normalize Month view geometry and typography**

In `CalendarMonthView.tsx`:

- Use `bg-muted` rather than `bg-muted/35` for weekday cells and use full `text-muted-foreground` contrast.
- Add `font-mono tabular-nums` to date numbers.
- Replace out-of-month `bg-muted/20` with `bg-muted` while retaining `text-muted-foreground`.
- Use `rounded-[var(--radius)]` for current-date and event geometry.
- Use `text-xs leading-4` for event links and a consistent `min-h-10` target.
- Replace the raw `+N more` button with the existing shadcn `Button`:

```tsx
<Button
  className="min-h-10 w-full justify-start px-0 text-left text-xs"
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
```

Keep event text `text-card-foreground`; retain classification color only in the two-pixel edge and `color-mix()` background.

- [ ] **Step 4: Normalize Timeline typography and spacing**

In `CalendarTimelineView.tsx`, replace the date heading classes with:

```tsx
className =
  'border-b border-border p-4 font-sans text-sm font-semibold text-card-foreground md:border-r md:px-5 md:py-5'
```

Use `min-h-20`, `gap-3`, `py-4`, `font-sans`, `text-sm font-semibold` for event rows. Keep badges at `text-xs`, metadata at `text-xs text-muted-foreground`, and all separators through the existing `Separator` primitive. Use `rounded-[var(--radius)]` on the Empty state and root panel.

- [ ] **Step 5: Normalize Upcoming as a supporting panel**

In `CalendarUpcoming.tsx`:

- Keep the semantic `aside` root and use `calendarPanelClasses`.
- Replace the display-font Upcoming heading with `font-sans text-lg font-semibold`.
- Replace display-font date numerals with `font-mono text-lg font-semibold tabular-nums`.
- Use `font-mono` for the compact month label.
- Use `text-sm font-semibold` for event titles and `text-xs text-muted-foreground` for time/location.
- Keep classification color only on the timeline dot and legend dot.
- Use `p-4 md:p-5` for the header and legend; retain `py-4` row rhythm.
- Keep the shadcn `Badge`, `Separator`, and `Empty` composition.

- [ ] **Step 6: Confirm the section shell owns the only display heading**

Keep `contentSectionHeadingClasses` unchanged in `Presentation.tsx`. Change no Calendar child text to `font-display`. Preserve the existing `gap-10` section rhythm, standard block container, appearance resolver, eyebrow, ContentActions, and BlockFooterActions.

- [ ] **Step 7: Run focused rendering and theme tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/theme-contracts.int.spec.ts
```

Expected: all tests pass; the five-theme Calendar accent contrast contract remains green.

- [ ] **Step 8: Review the task diff without staging or committing**

Run:

```bash
git diff -- src/blocks/Calendar tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/theme-contracts.int.spec.ts
```

Expected: no schema, API, loader, timezone, cache, or generated Payload type changes.

---

### Task 4: Verify responsive light/dark behavior and refresh the Calendar thumbnail

**Files:**

- Modify: `tests/e2e/calendar.e2e.spec.ts`
- Modify: `public/block-thumbnails/calendar.jpg`
- Modify if generated facts change: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the development-only Calendar block preview route and the existing Calendar fixture.
- Produces: browser coverage for desktop Tabs, mobile Timeline-first rendering, SNMIH light/dark token application, and the refreshed 1600×900 picker thumbnail.

- [ ] **Step 1: Extend the Calendar browser smoke test**

Update `tests/e2e/calendar.e2e.spec.ts` to verify shadcn Tabs and both SNMIH modes:

```ts
await page.setViewportSize({ height: 900, width: 1440 })
await page.goto(calendarPreviewURL)

const root = page.locator('html')
await root.evaluate((element) => {
  element.setAttribute('data-theme-color', 'snmih')
  element.setAttribute('data-color-scheme', 'light')
  element.classList.remove('dark')
})

const calendar = page.locator('[data-calendar-block="true"]')
await expect(calendar.getByRole('tablist', { name: 'Calendar view' })).toBeVisible()
await expect(calendar.getByRole('tab', { name: 'Calendar' })).toHaveAttribute(
  'aria-selected',
  'true',
)
await expect(calendar.locator('[data-calendar-month-view="true"]')).toBeVisible()

const lightBackground = await calendar
  .locator('[data-calendar-upcoming="true"]')
  .evaluate((element) => getComputedStyle(element).backgroundColor)

await root.evaluate((element) => {
  element.setAttribute('data-color-scheme', 'dark')
  element.classList.add('dark')
})

const darkBackground = await calendar
  .locator('[data-calendar-upcoming="true"]')
  .evaluate((element) => getComputedStyle(element).backgroundColor)
expect(darkBackground).not.toBe(lightBackground)

await page.setViewportSize({ height: 844, width: 390 })
await expect(calendar.locator('[data-calendar-timeline-view="true"]')).toBeVisible()
await expect(calendar.locator('[data-calendar-month-view="true"]')).toBeHidden()
await expect(calendar.getByRole('tablist', { name: 'Calendar view' })).toBeHidden()
```

- [ ] **Step 2: Run the focused browser test**

Run:

```bash
pnpm exec playwright test tests/e2e/calendar.e2e.spec.ts --reporter=line
```

Expected: one Chromium test passes. If the configured Playwright browser is unavailable but system Chrome exists, use a temporary non-committed config with `channel: 'chrome'`, run the same test, and delete that temporary file immediately afterward.

- [ ] **Step 3: Perform one bounded visual inspection**

Open `/block-thumbnail-previews/calendar` and inspect these four states in one pass:

1. 1440×900 SNMIH light, Calendar view.
2. 1440×900 SNMIH dark, Calendar view.
3. 1440×900 SNMIH dark, Timeline view.
4. 390×844 SNMIH light, Timeline-first mobile.

Confirm: display font appears only in the block heading; all controls are 44px; selected tab underline is visible; Select trigger/content/items share square SNMIH geometry; event text remains semantic; classification accents remain quiet; no panel competes with the section heading; no page-level mobile overflow.

- [ ] **Step 4: Apply one batched visual correction if the inspection finds defects**

Make only corrections identified across the four-state inspection. Re-run the four states once. Do not start an open-ended polish loop.

- [ ] **Step 5: Regenerate the Calendar thumbnail**

Run:

```bash
env BLOCK_THUMBNAIL_SLUG=calendar pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/calendar.jpg` is replaced with a 1600×900 JPEG reflecting the Institutional Ledger treatment.

- [ ] **Step 6: Run thumbnail and browser contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx
pnpm exec playwright test tests/e2e/calendar.e2e.spec.ts --reporter=line
```

Expected: thumbnail contracts, Calendar rendering tests, UI contracts, and responsive browser smoke all pass.

---

### Task 5: Complete repository verification and project-context maintenance

**Files:**

- Update: `.agents/skills/project-context/references/project-inventory.json`
- Review: `.agents/skills/project-context/references/change-impact-map.md`
- Review: all Calendar refinement files from Tasks 1–4

**Interfaces:**

- Consumes: the complete uncommitted Calendar refinement.
- Produces: current generated project knowledge and a verified handoff with no staging or commits.

- [ ] **Step 1: Run formatting, lint, and TypeScript checks**

Run:

```bash
pnpm exec prettier --write src/components/ui/tabs.tsx src/components/ui/alert.tsx src/blocks/Calendar tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/e2e/calendar.e2e.spec.ts docs/superpowers/specs/2026-08-25-calendar-visual-consistency-design.md docs/superpowers/plans/2026-08-25-calendar-visual-consistency.md
pnpm exec eslint src/components/ui/tabs.tsx src/components/ui/alert.tsx src/blocks/Calendar tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/e2e/calendar.e2e.spec.ts
pnpm exec tsc --noEmit
```

Expected: Prettier reports formatted files; ESLint and TypeScript exit zero.

- [ ] **Step 2: Run affected integration contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar.int.spec.tsx tests/int/calendar-ui-contracts.int.spec.tsx tests/int/calendar-data.int.spec.ts tests/int/calendar-route.int.spec.ts tests/int/site-time-zone.int.spec.ts tests/int/block-catalog.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/theme-contracts.int.spec.ts
```

Expected: all Calendar, registry, thumbnail, timezone, route, data, and theme contracts pass.

- [ ] **Step 3: Refresh and check maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `project-inventory.json` records the new UI primitive/test paths and the check reports `Project context is current`. A stale optional knowledge graph warning is acceptable.

- [ ] **Step 4: Inspect the final diff using the change-impact map**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git diff --check
git diff --stat
git status --short
```

Expected: no whitespace errors, no temporary browser configuration, no generated visual-companion session in the handoff, no schema/type churn, and no staged files.

- [ ] **Step 5: Report the uncommitted result**

Report:

- shadcn Tabs and Alert integration;
- Calendar-only Select radius treatment;
- display-font restriction;
- semantic light/dark surface and classification accent behavior;
- desktop/mobile browser result;
- focused test, lint, TypeScript, thumbnail, and project-context results;
- any environment-only build or browser limitation.

Do not run `git add` or `git commit`.
