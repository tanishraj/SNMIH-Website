# Scrollable Tab Rail Edge Fades Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add radius-aware, adaptive start/end gradient fades to every website tab rail that can scroll horizontally.

**Architecture:** A new client-side `ScrollableContentTabRail` in `src/blocks/shared` will own the stationary content-tab frame, native scroll viewport, overflow measurement, and CSS mask. Existing blocks keep ownership of semantic tablists and selection behavior, but route their scrolling through the shared primitive.

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS 4, Radix Tabs, Vitest 4, Testing Library, jsdom

## Global Constraints

- Cover Department Profiles, News & Events Tabs, Gallery Album Tabs, Tabs Content, Academic Programmes, Fee Structure, and PG Fee Structure.
- Render no fade when content fits, end-only at the start, both in the middle, and start-only at the end.
- Preserve native horizontal scrolling, hidden scrollbar treatment, existing ARIA/tab keyboard behavior, width modes, and CMS settings.
- Clip the fade to the existing Pill, Contained, or Underline geometry without hard-coded surface colors.
- Add no dependency, Payload field, saved-data rewrite, generated Payload type, or migration.
- Fail open: unsupported observation APIs leave a usable native horizontal scroller without the enhancement.
- Do not stage or commit the implementation, tests, documentation, generated context, or this plan.

---

## File Structure

- Create `src/blocks/shared/ScrollableContentTabRail.tsx`: shared frame, viewport, measurement, mask, and cleanup.
- Create `tests/int/scrollable-content-tab-rail.int.spec.tsx`: focused overflow-state and fallback contract.
- Modify `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`: replace its bespoke stationary frame/viewport.
- Modify `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`: route the classification rail through the shared frame.
- Modify `src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx`: route the album rail through the shared frame.
- Modify `src/blocks/TabsContent/TabsContentClient.tsx`: separate the semantic tablist from its current scroll element.
- Modify `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`: preserve aligned shrink-wrap behavior inside the shared frame.
- Modify `src/blocks/FeeStructure/FeeStructureClient.tsx`: add frame width classes and wrap the Radix tablist.
- Modify `src/blocks/PGFeeStructure/PGFeeStructureClient.tsx`: mirror the Fee Structure integration.
- Modify affected tests under `tests/int`: preserve existing contracts and assert shared-rail adoption.
- Modify `.agents/skills/project-context/references/block-system.md`: document the shared adaptive overflow affordance.

---

### Task 1: Build the shared overflow-state primitive

**Files:**
- Create: `tests/int/scrollable-content-tab-rail.int.spec.tsx`
- Create: `src/blocks/shared/ScrollableContentTabRail.tsx`

**Interfaces:**
- Consumes: `ContentTabVariant`, `ContentTabSurface`, and `getContentTabRailClasses()` from `src/blocks/shared/contentTabRail.ts`.
- Produces: `ScrollableContentTabRail(props: ScrollableContentTabRailProps)` with outer `<div>` props, `viewportClassName`, and `viewportProps`.
- Produces stable selectors: `data-scrollable-content-tab-frame`, `data-scrollable-content-tab-viewport`, `data-overflow-start`, and `data-overflow-end`.

- [ ] **Step 1: Write the failing shared-component test**

Create `tests/int/scrollable-content-tab-rail.int.spec.tsx` with focused state transitions and cleanup:

```tsx
// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'

type ResizeCallback = ResizeObserverCallback

let resizeCallback: ResizeCallback | undefined
const disconnect = vi.fn()

class ResizeObserverMock {
  constructor(callback: ResizeCallback) {
    resizeCallback = callback
  }

  disconnect = disconnect
  observe = vi.fn()
  unobserve = vi.fn()
}

const setMetrics = (
  viewport: HTMLElement,
  { clientWidth, scrollLeft, scrollWidth }: Record<'clientWidth' | 'scrollLeft' | 'scrollWidth', number>,
) => {
  Object.defineProperties(viewport, {
    clientWidth: { configurable: true, value: clientWidth },
    scrollLeft: { configurable: true, value: scrollLeft, writable: true },
    scrollWidth: { configurable: true, value: scrollWidth },
  })
}

const renderRail = () =>
  render(
    <ScrollableContentTabRail surface="light" variant="pill">
      <div aria-label="Test tabs" className="flex w-max" role="tablist">
        <button role="tab" type="button">One</button>
        <button role="tab" type="button">Two</button>
      </div>
    </ScrollableContentTabRail>,
  )

const triggerResize = () => {
  act(() => resizeCallback?.([], {} as ResizeObserver))
}

describe('ScrollableContentTabRail', () => {
  beforeEach(() => {
    resizeCallback = undefined
    disconnect.mockClear()
    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('tracks the four overflow states and applies a radius-clipped mask', () => {
    const { container } = renderRail()
    const frame = container.querySelector<HTMLElement>('[data-scrollable-content-tab-frame="true"]')!
    const viewport = container.querySelector<HTMLElement>('[data-scrollable-content-tab-viewport="true"]')!

    expect(frame.className).toContain('rounded-full')

    setMetrics(viewport, { clientWidth: 240, scrollLeft: 0, scrollWidth: 240 })
    triggerResize()
    expect(viewport.dataset.overflowStart).toBe('false')
    expect(viewport.dataset.overflowEnd).toBe('false')
    expect(viewport.style.maskImage).toBe('')

    setMetrics(viewport, { clientWidth: 240, scrollLeft: 0, scrollWidth: 600 })
    triggerResize()
    expect(viewport.dataset.overflowStart).toBe('false')
    expect(viewport.dataset.overflowEnd).toBe('true')
    expect(viewport.style.maskImage).toContain('calc(100% - 2.75rem)')

    viewport.scrollLeft = 120
    fireEvent.scroll(viewport)
    expect(viewport.dataset.overflowStart).toBe('true')
    expect(viewport.dataset.overflowEnd).toBe('true')

    viewport.scrollLeft = 360
    fireEvent.scroll(viewport)
    expect(viewport.dataset.overflowStart).toBe('true')
    expect(viewport.dataset.overflowEnd).toBe('false')
  })

  it('uses passive scrolling and disconnects observation on unmount', () => {
    const addEventListener = vi.spyOn(HTMLElement.prototype, 'addEventListener')
    const { unmount } = renderRail()

    expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
    unmount()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('falls back to window resize when ResizeObserver is unavailable', () => {
    vi.stubGlobal('ResizeObserver', undefined)
    const addEventListener = vi.spyOn(window, 'addEventListener')
    const removeEventListener = vi.spyOn(window, 'removeEventListener')
    const { container, unmount } = renderRail()
    const viewport = container.querySelector<HTMLElement>('[data-scrollable-content-tab-viewport="true"]')!

    setMetrics(viewport, { clientWidth: 200, scrollLeft: 0, scrollWidth: 500 })
    fireEvent(window, new Event('resize'))

    expect(viewport.dataset.overflowEnd).toBe('true')
    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    unmount()
    expect(removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
  })

  it('keeps the semantic tablist supplied by its consumer', () => {
    renderRail()
    expect(screen.getByRole('tablist', { name: 'Test tabs' })).toBeTruthy()
    expect(screen.getAllByRole('tab')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/scrollable-content-tab-rail.int.spec.tsx
```

Expected: FAIL because `@/blocks/shared/ScrollableContentTabRail` does not exist.

- [ ] **Step 3: Implement the shared component**

Create `src/blocks/shared/ScrollableContentTabRail.tsx`:

```tsx
'use client'

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ReactNode,
} from 'react'

import {
  getContentTabRailClasses,
  type ContentTabSurface,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import { cn } from '@/lib/utils'

const EDGE_TOLERANCE = 1
const EDGE_FADE_WIDTH = '2.75rem'

type OverflowState = {
  end: boolean
  start: boolean
}

const noOverflow: OverflowState = { end: false, start: false }

const getMaskImage = ({ end, start }: OverflowState): string | undefined => {
  if (!start && !end) return undefined
  if (start && end) {
    return `linear-gradient(to right, transparent 0, #000 ${EDGE_FADE_WIDTH}, #000 calc(100% - ${EDGE_FADE_WIDTH}), transparent 100%)`
  }
  if (start) {
    return `linear-gradient(to right, transparent 0, #000 ${EDGE_FADE_WIDTH}, #000 100%)`
  }
  return `linear-gradient(to right, #000 0, #000 calc(100% - ${EDGE_FADE_WIDTH}), transparent 100%)`
}

type ViewportProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children' | 'className' | 'onScroll' | 'ref'
>

export type ScrollableContentTabRailProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> & {
  children: ReactNode
  surface?: ContentTabSurface
  variant: ContentTabVariant
  viewportClassName?: string
  viewportProps?: ViewportProps
}

export function ScrollableContentTabRail({
  children,
  className,
  surface = 'light',
  variant,
  viewportClassName,
  viewportProps,
  ...frameProps
}: ScrollableContentTabRailProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState<OverflowState>(noOverflow)

  const measure = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
    const scrollLeft = Math.min(maxScrollLeft, Math.max(0, viewport.scrollLeft))
    const next = {
      start: scrollLeft > EDGE_TOLERANCE,
      end: scrollLeft < maxScrollLeft - EDGE_TOLERANCE,
    }

    setOverflow((current) =>
      current.start === next.start && current.end === next.end ? current : next,
    )
  }, [])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    measure()
    viewport.addEventListener('scroll', measure, { passive: true })

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(measure)
      resizeObserver.observe(viewport)
      if (viewport.firstElementChild instanceof HTMLElement) {
        resizeObserver.observe(viewport.firstElementChild)
      }
    } else {
      window.addEventListener('resize', measure)
    }

    return () => {
      viewport.removeEventListener('scroll', measure)
      resizeObserver?.disconnect()
      if (!resizeObserver) window.removeEventListener('resize', measure)
    }
  }, [measure])

  const maskImage = getMaskImage(overflow)
  const maskStyle: CSSProperties = maskImage
    ? { maskImage, WebkitMaskImage: maskImage }
    : {}

  return (
    <div
      {...frameProps}
      className={cn(
        'relative min-w-0 overflow-hidden',
        getContentTabRailClasses(variant, surface),
        className,
      )}
      data-scrollable-content-tab-frame="true"
    >
      <div
        {...viewportProps}
        className={cn(
          'no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain',
          viewportClassName,
        )}
        data-overflow-end={overflow.end}
        data-overflow-start={overflow.start}
        data-scrollable-content-tab-viewport="true"
        ref={viewportRef}
        style={{ ...viewportProps?.style, ...maskStyle }}
      >
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run the focused test and TypeScript**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/scrollable-content-tab-rail.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: the new test passes and TypeScript reports no errors.

- [ ] **Step 5: Inspect the primitive diff without staging it**

```bash
git diff --check -- src/blocks/shared/ScrollableContentTabRail.tsx tests/int/scrollable-content-tab-rail.int.spec.tsx
git status --short
```

Expected: the primitive and its focused test remain unstaged working-tree changes.

---

### Task 2: Integrate direct-button tab consumers

**Files:**
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Modify: `src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx`
- Modify: `src/blocks/TabsContent/TabsContentClient.tsx`
- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `tests/int/news-events-tabs.int.spec.tsx`
- Modify: `tests/int/gallery-album-tabs.int.spec.tsx`
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`
- Modify: `tests/int/tabs-content-active-color.int.spec.ts`

**Interfaces:**
- Consumes: `ScrollableContentTabRail` from Task 1.
- Preserves: every existing `role="tablist"`, tab/panel ID relationship, keyboard handler, variant, surface, and width/alignment class.
- Produces: shared frame/viewport markers around each rendered horizontal tablist.

- [ ] **Step 1: Update integration expectations to require the shared rail**

For each rendered client, assert the shared frame and viewport exist while the semantic tablist keeps
its label. Replace assertions that the block-specific wrapper itself owns `overflow-x-auto` with:

```tsx
const frame = container.querySelector('[data-scrollable-content-tab-frame="true"]')
const viewport = container.querySelector('[data-scrollable-content-tab-viewport="true"]')

expect(frame).not.toBeNull()
expect(frame?.className).toContain('overflow-hidden')
expect(viewport).not.toBeNull()
expect(viewport?.className).toContain('overflow-x-auto')
expect(frame?.contains(viewport)).toBe(true)
expect(viewport?.contains(tablist)).toBe(true)
```

Keep the Department Profiles assertions for `data-department-profiles-tab-frame` and
`data-department-profiles-tab-scroll`, and add shared-frame assertions to the representative tests
for News & Events, Gallery Album Tabs, Tabs Content, and Academic Programmes.

- [ ] **Step 2: Run the five focused suites to verify the expectations fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/department-profiles.int.spec.tsx \
  tests/int/news-events-tabs.int.spec.tsx \
  tests/int/gallery-album-tabs.int.spec.tsx \
  tests/int/academic-programmes-client.int.spec.tsx \
  tests/int/tabs-content-active-color.int.spec.ts
```

Expected: FAIL because these consumers do not yet render the shared frame/viewport.

- [ ] **Step 3: Replace each local scroll wrapper**

Import the shared component directly:

```tsx
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
```

Remove `getContentTabRailClasses` from each consumer import. Keep
`getContentTabClasses`, `ContentTabVariant`, and other still-used symbols.

Use these geometry contracts:

```tsx
// Department Profiles: preserve its existing frame widths and both data hooks.
<ScrollableContentTabRail
  className={tabFrameWidthClasses[tabWidth]}
  data-department-profiles-filter-presentation="tabs"
  data-department-profiles-tab-frame="true"
  surface={tabSurface}
  variant={tabVariant}
  viewportProps={{ 'data-department-profiles-tab-scroll': 'true' }}
>
  <div
    aria-label="Profile departments"
    className={cn('flex flex-nowrap', tabRailWidthClasses[tabWidth])}
    data-department-profiles-tab-width={tabWidth}
    role="tablist"
  >
    {/* keep the existing departmentOptions map unchanged */}
  </div>
</ScrollableContentTabRail>
```

```tsx
// News & Events and Gallery Album Tabs: keep the existing pb-1 layout wrapper.
<div className="pb-1" data-news-events-tabs-list-wrap="true">
  <ScrollableContentTabRail className="w-full" surface={tabSurface} variant={variant}>
    <div
      aria-label="News and events classifications"
      className="flex w-max min-w-full flex-nowrap"
      data-content-tab-variant={variant}
      role="tablist"
    >
      {/* keep the existing tabs map unchanged */}
    </div>
  </ScrollableContentTabRail>
</div>
```

Apply the same structure and `aria-label="Gallery albums"` to Gallery Album Tabs.

```tsx
// Tabs Content: the shared frame owns alignment/width; a child div owns tablist semantics.
<ScrollableContentTabRail
  className={cn(
    'max-w-full',
    resolvedTabAlignment === 'stretch' ? 'w-full' : 'w-fit',
    resolvedTabAlignment === 'left' && 'self-start',
    resolvedTabAlignment === 'center' && 'self-center',
    resolvedTabAlignment === 'right' && 'self-end',
  )}
  surface={tabSurface}
  variant={tabVariant}
>
  <div
    aria-label="Content sections"
    className={cn('flex', resolvedTabAlignment === 'stretch' ? 'w-full' : 'w-max')}
    data-tab-alignment={resolvedTabAlignment}
    role="tablist"
  >
    {/* keep the existing tabs map unchanged */}
  </div>
</ScrollableContentTabRail>
```

```tsx
// Academic Programmes: preserve shrink-wrap alignment and the outer pb-1 spacing.
<div className={cn('max-w-full pb-1', filterAlignmentClasses[contentAlignment])}>
  <ScrollableContentTabRail
    className="w-fit max-w-full"
    data-academic-programmes-filter="true"
    surface={tabSurface}
    variant="pill"
  >
    <div aria-label="Programme categories" className="flex w-max flex-nowrap" role="tablist">
      {/* keep the existing tabs map unchanged */}
    </div>
  </ScrollableContentTabRail>
</div>
```

Do not alter tab button classes, selection state, click handlers, keyboard handlers, or panels.

- [ ] **Step 4: Run the focused suites and TypeScript**

Run the same five-suite command from Step 2, followed by:

```bash
pnpm exec tsc --noEmit
```

Expected: all focused suites pass and TypeScript reports no errors.

- [ ] **Step 5: Inspect the direct-button integration diff without staging it**

```bash
git diff --check -- \
  src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx \
  src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx \
  src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx \
  src/blocks/TabsContent/TabsContentClient.tsx \
  src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx \
  tests/int/department-profiles.int.spec.tsx \
  tests/int/news-events-tabs.int.spec.tsx \
  tests/int/gallery-album-tabs.int.spec.tsx \
  tests/int/academic-programmes-client.int.spec.tsx \
  tests/int/tabs-content-active-color.int.spec.ts
git status --short
```

Expected: all direct-button integrations and tests remain unstaged working-tree changes.

---

### Task 3: Integrate Radix fee tab consumers

**Files:**
- Modify: `src/blocks/FeeStructure/FeeStructureClient.tsx`
- Modify: `src/blocks/PGFeeStructure/PGFeeStructureClient.tsx`
- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `tests/int/pg-fee-structure.int.spec.tsx`

**Interfaces:**
- Consumes: `ScrollableContentTabRail` from Task 1.
- Preserves: Radix `TabsPrimitive.Root`, `List`, `Trigger`, and `Content` ownership and the existing Content Width, Centered Auto Width, and Equal Full Width semantics.
- Produces: stationary shared frames with Radix tablists inside native scroll viewports.

- [ ] **Step 1: Add failing shared-frame assertions**

In each fee suite's multiple-category tab test, add:

```tsx
const frame = container.querySelector('[data-scrollable-content-tab-frame="true"]')
const viewport = container.querySelector('[data-scrollable-content-tab-viewport="true"]')

expect(frame).not.toBeNull()
expect(viewport?.className).toContain('overflow-x-auto')
expect(viewport?.querySelector('[role="tablist"]')).not.toBeNull()
```

Retain the existing style/width and Radix selection assertions.

- [ ] **Step 2: Run the fee suites to verify the expectations fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/pg-fee-structure.int.spec.tsx
```

Expected: FAIL because neither fee client renders the shared frame.

- [ ] **Step 3: Add frame widths and wrap both Radix lists**

In both clients, import `ScrollableContentTabRail`, remove `getContentTabRailClasses`, and add:

```tsx
const tabFrameWidthClasses = {
  centered: 'mx-auto w-fit max-w-full',
  content: 'w-full',
  equal: 'w-full',
} as const satisfies Record<FeeStructureTabWidth, string>
```

Use `PGFeeTabWidth` for the PG client. Replace the local scroll wrapper with:

```tsx
<div className="pb-1">
  <ScrollableContentTabRail
    className={tabFrameWidthClasses[resolvedTabWidth]}
    surface={tabSurface}
    variant={variant}
  >
    <TabsPrimitive.List
      aria-label="Fee categories"
      className={cn('flex flex-nowrap', feeTabRailWidthClasses[resolvedTabWidth])}
      data-content-tab-variant={variant}
      data-fee-tab-width={resolvedTabWidth}
    >
      {/* keep the existing category trigger map unchanged */}
    </TabsPrimitive.List>
  </ScrollableContentTabRail>
</div>
```

Mirror the same structure with `aria-label="PG fee categories"`,
`pgFeeTabRailWidthClasses`, and `data-pg-fee-tab-width` in PG Fee Structure.

- [ ] **Step 4: Run fee tests and TypeScript**

Run the two-suite command from Step 2, followed by:

```bash
pnpm exec tsc --noEmit
```

Expected: both suites pass and TypeScript reports no errors.

- [ ] **Step 5: Inspect the Radix integration diff without staging it**

```bash
git diff --check -- \
  src/blocks/FeeStructure/FeeStructureClient.tsx \
  src/blocks/PGFeeStructure/PGFeeStructureClient.tsx \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/pg-fee-structure.int.spec.tsx
git status --short
```

Expected: both Radix integrations and tests remain unstaged working-tree changes.

---

### Task 4: Document and verify the complete contract

**Files:**
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify if generated facts change: `.agents/skills/project-context/references/project-inventory.json`
- Verify: all files changed in Tasks 1-3

**Interfaces:**
- Consumes: the complete shared primitive and seven integrations.
- Produces: maintained project knowledge and a clean, verified repository state.

- [ ] **Step 1: Update the maintained block-system reference**

Extend the `contentTabRail.ts` bullet under Shared Configuration and Presentation with:

```markdown
Horizontally overflowing content-tab rails use one shared client viewport that measures native
scroll position and shows radius-clipped inline-start/inline-end fades only while more tabs remain.
```

Extend the Department Profiles tab-rail paragraph with:

```markdown
Its shared overflow affordance shows an end fade on initial overflow, both fades between edges, and
only the start fade at the final scroll position; fitting rails render no fade.
```

- [ ] **Step 2: Run every affected integration suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/scrollable-content-tab-rail.int.spec.tsx \
  tests/int/department-profiles.int.spec.tsx \
  tests/int/news-events-tabs.int.spec.tsx \
  tests/int/gallery-album-tabs.int.spec.tsx \
  tests/int/academic-programmes-client.int.spec.tsx \
  tests/int/tabs-content-active-color.int.spec.ts \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/pg-fee-structure.int.spec.tsx
```

Expected: all affected suites pass.

- [ ] **Step 3: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both commands exit successfully with no new errors.

- [ ] **Step 4: Perform bounded browser verification**

Run the site locally and inspect one Pill, one Contained, and one Underline rail at desktop and
mobile widths. For each representative rail, verify:

```text
Initial overflow: right/end fade only
Middle position: both fades
Final position: left/start fade only
No overflow: no fades
Focus and pointer input: tabs remain selectable and focus-visible
Frame: border and radius remain stationary while only tab content moves
```

Expected: all six visual/interaction checks hold without horizontal page overflow.

- [ ] **Step 5: Complete the project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. A stale knowledge-graph commit warning is informational unless
the implementation introduced a structural architecture change.

- [ ] **Step 6: Inspect the final diff**

Run:

```bash
git diff --check
git status --short
git diff --stat
git diff
```

Expected: only the planned shared component, seven consumers, focused tests, maintained block-system
reference, generated project inventory if changed, and this plan are present.

- [ ] **Step 7: Confirm all requested work remains uncommitted**

```bash
git status --short
git diff --cached --stat
```

Expected: every implementation-related file is unstaged, and the staged diff is empty.
