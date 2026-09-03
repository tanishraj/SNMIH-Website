# Calendar Full-Height Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render Upcoming and the optional PDF download as one full-height calendar sidebar with the download pinned to the desktop bottom.

**Architecture:** A shared `CalendarSidebar` owns the single semantic outer panel and responsive flex behavior. `CalendarUpcoming` and `CalendarPdfDownload` retain standalone defaults but gain embedded modes so Calendar and Annual Calendar can remove nested borders while preserving their content, selectors, and accessibility contracts.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, semantic calendar surface helpers, shadcn-style Button, Vitest, Testing Library.

## Global Constraints

- Use one bordered sidebar containing Upcoming, its optional legend, and the optional PDF region.
- Match the adjacent Calendar or Annual Calendar content height at the existing `lg` breakpoint.
- Pin the PDF region to the desktop bottom with `lg:mt-auto`.
- Preserve natural compact-layout height and source order.
- Remove Annual Calendar's sticky sidebar behavior in favor of the approved full-height rail.
- Preserve all event data, queries, snapshots, filters, caches, PDF resolution, labels, and theme semantics.
- Avoid nested `aside` landmarks, borders, and radii.
- Do not add a dependency, migration, staged change, or Git commit.

---

### Task 1: Create the shared sidebar and embedded presentation modes

**Files:**
- Create: `src/blocks/shared/CalendarSidebar.tsx`
- Modify: `src/blocks/Calendar/CalendarUpcoming.tsx`
- Modify: `src/blocks/shared/CalendarPdfDownload.tsx`
- Modify: `tests/int/calendar-pdf-download.int.spec.tsx`

**Interfaces:**
- Produces: `CalendarSidebar({ children, download, label, surface })`.
- `CalendarUpcoming` gains `embedded?: boolean` with a standalone default of `false`.
- `CalendarPdfDownload` gains `embedded?: boolean` with a standalone default of `false`.
- Embedded PDF regions expose `data-calendar-pdf-embedded="true"`; the shared rail exposes `data-calendar-sidebar="true"`.

- [ ] **Step 1: Add failing shared sidebar tests**

Extend `tests/int/calendar-pdf-download.int.spec.tsx`:

```tsx
import { CalendarUpcoming } from '@/blocks/Calendar/CalendarUpcoming'
import { CalendarSidebar } from '@/blocks/shared/CalendarSidebar'

it('composes one labelled full-height sidebar and pins an embedded PDF region', () => {
  const { container } = render(
    <CalendarSidebar
      download={{ href: '/calendar.pdf', label: 'Download', title: 'Academic calendar PDF' }}
      label="Upcoming"
      surface="light"
    >
      <CalendarUpcoming
        classifications={[]}
        embedded
        emptyMessage="No events"
        eyebrow="Up next"
        events={[]}
        showLegend={false}
        title="Upcoming"
      />
    </CalendarSidebar>,
  )

  const sidebar = container.querySelector('[data-calendar-sidebar="true"]')
  const upcoming = sidebar?.querySelector('[data-calendar-upcoming="true"]')
  const download = sidebar?.querySelector('[data-calendar-pdf-download="true"]')

  expect(sidebar?.tagName).toBe('ASIDE')
  expect(sidebar?.getAttribute('aria-label')).toBe('Upcoming calendar sidebar')
  expect(sidebar?.className).toContain('lg:h-full')
  expect(upcoming?.tagName).toBe('DIV')
  expect(upcoming?.getAttribute('data-calendar-upcoming-embedded')).toBe('true')
  expect(download?.getAttribute('data-calendar-pdf-embedded')).toBe('true')
  expect(download?.className).toContain('lg:mt-auto')
  expect(download?.className).toContain('border-t')
})
```

- [ ] **Step 2: Run the shared test and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/calendar-pdf-download.int.spec.tsx
```

Expected: FAIL because `CalendarSidebar` and the embedded props do not exist.

- [ ] **Step 3: Implement the shared sidebar**

Create `src/blocks/shared/CalendarSidebar.tsx`:

```tsx
import type { ReactNode } from 'react'

import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { CalendarPdfDownload } from '@/blocks/shared/CalendarPdfDownload'
import type { ResolvedCalendarPdf } from '@/blocks/shared/calendarPdf'
import { cn } from '@/lib/utils'

type CalendarSidebarProps = {
  children: ReactNode
  download?: ResolvedCalendarPdf
  label: string
  surface?: BlockSurface
}

export function CalendarSidebar({
  children,
  download,
  label,
  surface = 'light',
}: CalendarSidebarProps) {
  const styles = resolveCalendarSurfaceClasses(surface)

  return (
    <aside
      aria-label={`${label} calendar sidebar`}
      className={cn(styles.panel, 'flex min-w-0 flex-col lg:h-full')}
      data-calendar-sidebar="true"
    >
      {children}
      {download ? <CalendarPdfDownload download={download} embedded surface={surface} /> : null}
    </aside>
  )
}
```

- [ ] **Step 4: Add embedded mode to Upcoming**

In `src/blocks/Calendar/CalendarUpcoming.tsx`, add `embedded?: boolean`, default it to `false`, and declare the root immediately after the surface classes:

```tsx
const Root = embedded ? 'div' : 'aside'
```

Replace only the existing root opening tag with:

```tsx
<Root
  className={cn('min-w-0', !embedded && styles.panel)}
  data-calendar-upcoming="true"
  data-calendar-upcoming-embedded={embedded ? 'true' : undefined}
>
```

Replace the existing closing `</aside>` with `</Root>`. Leave every existing child between those tags byte-for-byte unchanged.

- [ ] **Step 5: Add embedded mode to the PDF panel**

In `src/blocks/shared/CalendarPdfDownload.tsx`, add `embedded?: boolean`, default it to `false`, and resolve the root classes as:

```tsx
className={cn(
  'flex min-w-0 flex-col gap-4 p-5',
  embedded ? cn('border-t lg:mt-auto', styles.border) : styles.panel,
)}
data-calendar-pdf-embedded={embedded ? 'true' : undefined}
```

Keep the icon, wrapping title, link, download filename, full-width Button, and surface-aware Button variant unchanged.

- [ ] **Step 6: Run the shared tests**

Run the focused shared test. Expected: all tests pass, including standalone and embedded PDF modes.

- [ ] **Step 7: Run the layout detector**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout \
  src/blocks/shared/CalendarSidebar.tsx \
  src/blocks/shared/CalendarPdfDownload.tsx \
  src/blocks/Calendar/CalendarUpcoming.tsx
```

Expected: `[]`, or only a finding with a documented semantic reason.

- [ ] **Step 8: Inspect the uncommitted checkpoint**

Run `git diff --check` and inspect the three component files plus the focused test. Do not stage or commit.

---

### Task 2: Integrate the full-height sidebar into both calendar blocks

**Files:**
- Modify: `src/blocks/Calendar/CalendarClient.tsx`
- Modify: `src/blocks/AnnualCalendar/AnnualCalendarUpcoming.tsx`
- Modify: `src/blocks/AnnualCalendar/Presentation.tsx`
- Modify: `tests/int/calendar.int.spec.tsx`
- Modify: `tests/int/annual-calendar.int.spec.tsx`

**Interfaces:**
- Calendar passes `upcomingTitle` as the sidebar label and `pdfDownload` as the optional download.
- Annual Calendar passes its resolved Upcoming title and PDF contract to the same component.
- Both grid containers use `lg:items-stretch`; Annual Calendar removes `lg:sticky lg:top-6`.

- [ ] **Step 1: Add failing Calendar integration assertions**

Extend the existing configured-PDF test in `tests/int/calendar.int.spec.tsx`:

```tsx
const sidebar = container.querySelector('[data-calendar-sidebar="true"]')
expect(sidebar?.className).toContain('lg:h-full')
expect(sidebar?.getAttribute('aria-label')).toBe('Upcoming calendar sidebar')
expect(upcoming?.tagName).toBe('DIV')
expect(download?.className).toContain('lg:mt-auto')
expect(download?.getAttribute('data-calendar-pdf-embedded')).toBe('true')
```

Also assert the Calendar content/sidebar grid contains `lg:items-stretch`.

- [ ] **Step 2: Add failing Annual Calendar integration assertions**

Extend the configured-PDF test in `tests/int/annual-calendar.int.spec.tsx`:

```tsx
const sidebar = container.querySelector('[data-calendar-sidebar="true"]')
const grid = container.querySelector('[data-annual-calendar-layout="true"]')
expect(grid?.className).toContain('lg:items-stretch')
expect(sidebar?.className).toContain('lg:h-full')
expect(sidebar?.className).not.toContain('sticky')
expect(download?.className).toContain('lg:mt-auto')
```

- [ ] **Step 3: Run both suites and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/calendar.int.spec.tsx \
  tests/int/annual-calendar.int.spec.tsx
```

Expected: FAIL because both blocks still use local sidebar wrappers.

- [ ] **Step 4: Integrate Calendar**

In `src/blocks/Calendar/CalendarClient.tsx`, import `CalendarSidebar`, add `lg:items-stretch` and `data-calendar-layout="true"` to the two-column grid, and replace the local flex wrapper with:

```tsx
<CalendarSidebar download={pdfDownload} label={upcomingTitle} surface={surface}>
  <CalendarUpcoming
    classifications={initial.classifications}
    embedded
    emptyMessage={emptyMessage}
    eyebrow={upcomingEyebrow}
    events={initial.upcoming}
    surface={surface}
    title={upcomingTitle}
  />
</CalendarSidebar>
```

- [ ] **Step 5: Support embedded Annual Upcoming content**

Add `embedded?: boolean` to `AnnualCalendarUpcomingProps` and pass it through to `CalendarUpcoming`:

```tsx
<CalendarUpcoming
  classifications={[]}
  embedded={embedded}
  emptyMessage={emptyMessage}
  eyebrow={eyebrow}
  events={events}
  showLegend={false}
  surface={surface}
  title={title}
/>
```

- [ ] **Step 6: Integrate Annual Calendar**

In `src/blocks/AnnualCalendar/Presentation.tsx`, resolve the Upcoming title once, import `CalendarSidebar`, and replace the current sidebar wrapper with:

```tsx
<CalendarSidebar
  download={resolvedCalendarPdf}
  label={resolvedUpcomingTitle}
  surface={appearanceClasses.surface}
>
  <AnnualCalendarUpcoming
    embedded
    emptyMessage={resolvedEmptyMessage}
    eyebrow={upcomingEyebrow?.trim() || 'Up next'}
    events={initial.upcoming}
    surface={appearanceClasses.surface}
    title={resolvedUpcomingTitle}
  />
</CalendarSidebar>
```

Change the outer grid to:

```tsx
<div
  className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch"
  data-annual-calendar-layout="true"
>
```

Do not retain `items-start`, `lg:sticky`, or `lg:top-6`.

- [ ] **Step 7: Run shared and integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/calendar-pdf-download.int.spec.tsx \
  tests/int/calendar.int.spec.tsx \
  tests/int/annual-calendar.int.spec.tsx
```

Expected: all shared and block integration tests pass.

- [ ] **Step 8: Inspect the uncommitted checkpoint**

Run `git diff --check`, confirm no event-query or snapshot files changed, and do not stage or commit.

---

### Task 3: Synchronize documentation, thumbnails, context, and verification

**Files:**
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `public/block-thumbnails/calendar.jpg`
- Modify: `public/block-thumbnails/annual-calendar.jpg`
- Regenerate as needed: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Maintained documentation names the continuous full-height rail and bottom-pinned PDF behavior.
- Both block-picker thumbnails show one bordered sidebar rather than two stacked cards.

- [ ] **Step 1: Update maintained documentation**

Update Calendar and Annual Calendar rows in `docs/guides/blocks.md`. Update `.agents/skills/project-context/references/block-system.md` to record the shared full-height rail, embedded regions, desktop bottom pinning, compact natural flow, and removal of Annual Calendar's sticky sidebar.

- [ ] **Step 2: Run focused tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/calendar-pdf-download.int.spec.tsx \
  tests/int/calendar.int.spec.tsx \
  tests/int/annual-calendar.int.spec.tsx \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: all focused suites pass.

- [ ] **Step 3: Regenerate both thumbnails**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=calendar pnpm generate:block-thumbnails
BLOCK_THUMBNAIL_SLUG=annualCalendar pnpm generate:block-thumbnails
```

Expected: both 1600×900 JPEGs show one continuous rail, Upcoming at the top, and Download at the bottom without nested borders.

- [ ] **Step 4: Perform bounded visual inspection**

Inspect both generated images once together. Verify the single border, bottom alignment, readable label/button, theme consistency, and absence of excess compact-layout space. Fix all visible defects in one batch and perform at most one confirmation render.

- [ ] **Step 5: Run project-context update and check**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the deterministic inventory is current; a stale optional knowledge graph remains a warning only.

- [ ] **Step 6: Run static and mechanical verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout \
  src/blocks/shared/CalendarSidebar.tsx \
  src/blocks/shared/CalendarPdfDownload.tsx \
  src/blocks/Calendar/CalendarUpcoming.tsx \
  src/blocks/Calendar/CalendarClient.tsx \
  src/blocks/AnnualCalendar/Presentation.tsx
```

Expected: TypeScript and lint pass, with only the existing GTM advisory permitted; detector output is `[]`.

- [ ] **Step 7: Run the complete integration baseline**

Run `pnpm test:int`. If the two MongoMemoryServer suites are sandbox-blocked, rerun `tests/int/api.int.spec.ts` and `tests/int/starter-productization.int.spec.ts` with approved local-port access and distinguish the environment failure from assertion failures.

- [ ] **Step 8: Complete the final impact review**

Run `git diff --check`, `git status --short`, and `git log -1 --oneline`. Confirm no commit was created, no unrelated implementation was changed, and the staged index was not intentionally modified.
