# Event Gallery Rectangular Quilt Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ragged Event Gallery column masonry with a count-aware responsive quilt that always ends on a straight rectangular boundary.

**Architecture:** Keep album loading, ordering, overlays, and viewer behavior unchanged. Replace ratio-based CSS columns with pure count/index presentation helpers and a CSS Grid whose first few cards span two rows only when needed to fill the active column count exactly; the client consumes those helpers without measuring the DOM or reordering albums.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Payload CMS 3, Vitest, Testing Library.

## Global Constraints

- Preserve one outer tile per selected, published Gallery Album and use its first valid image as the cover.
- Preserve Manual and Latest Event Date ordering.
- Preserve the full-album viewer, overlay settings, keyboard focus, accessible names, reduced motion, and hover treatment.
- Use one phone column, two tablet columns, three laptop columns, and four wide-desktop columns, bounded by the number of albums.
- Never use horizontal multi-column spans, dense backfilling, DOM measurement, or JavaScript reordering.
- Keep tiles restrained: standard cards span one row and corrective cards span exactly two rows.
- Do not commit or stage changes.

---

### Task 1: Count-Aware Quilt Presentation Helpers

**Files:**

- Modify: `src/components/event-gallery-presentation.ts`
- Test: `tests/int/event-gallery-presentation.int.spec.ts`

**Interfaces:**

- Consumes: `albumCount: number` and zero-based `index: number`.
- Produces: `getEventGalleryQuiltGridClassName(albumCount: number): string`.
- Produces: `getEventGalleryQuiltRowSpans(albumCount: number, index: number): EventGalleryQuiltRowSpans`.
- Produces: `getEventGalleryQuiltRowSpanClassName(spans: EventGalleryQuiltRowSpans): string`.
- Removes: `EventGalleryMosaicRatio` and `getEventGalleryMosaicRatio`.

- [ ] **Step 1: Replace ratio-pattern tests with failing rectangular-quilt tests**

Add these contracts to `tests/int/event-gallery-presentation.int.spec.ts` while retaining the overlay-position normalization test:

```ts
import {
  getEventGalleryQuiltGridClassName,
  getEventGalleryQuiltRowSpanClassName,
  getEventGalleryQuiltRowSpans,
  normalizeEventGalleryCardTextLayout,
} from '@/components/event-gallery-presentation'

it('bounds responsive columns by the album count', () => {
  expect(getEventGalleryQuiltGridClassName(1)).toBe('grid-cols-1')
  expect(getEventGalleryQuiltGridClassName(2)).toBe('grid-cols-1 sm:grid-cols-2')
  expect(getEventGalleryQuiltGridClassName(3)).toBe('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')
  expect(getEventGalleryQuiltGridClassName(8)).toBe(
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  )
})

it('fills two-, three-, and four-column rectangles without changing source order', () => {
  expect(Array.from({ length: 5 }, (_, index) => getEventGalleryQuiltRowSpans(5, index))).toEqual([
    { base: 1, sm: 2, lg: 2, xl: 2 },
    { base: 1, sm: 1, lg: 1, xl: 2 },
    { base: 1, sm: 1, lg: 1, xl: 2 },
    { base: 1, sm: 1, lg: 1, xl: 1 },
    { base: 1, sm: 1, lg: 1, xl: 1 },
  ])

  expect(Array.from({ length: 6 }, (_, index) => getEventGalleryQuiltRowSpans(6, index))).toEqual([
    { base: 1, sm: 1, lg: 1, xl: 2 },
    { base: 1, sm: 1, lg: 1, xl: 2 },
    { base: 1, sm: 1, lg: 1, xl: 1 },
    { base: 1, sm: 1, lg: 1, xl: 1 },
    { base: 1, sm: 1, lg: 1, xl: 1 },
    { base: 1, sm: 1, lg: 1, xl: 1 },
  ])
})

it('returns only static Tailwind row-span classes', () => {
  expect(getEventGalleryQuiltRowSpanClassName({ base: 1, sm: 2, lg: 1, xl: 2 })).toBe(
    'row-span-1 sm:row-span-2 lg:row-span-1 xl:row-span-2',
  )
})
```

- [ ] **Step 2: Run the helper test and verify the red phase**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts
```

Expected: FAIL because the quilt helper exports do not exist and the old mosaic-ratio contract still exists.

- [ ] **Step 3: Implement the count-aware helpers**

Replace the mosaic-ratio type and pattern in `src/components/event-gallery-presentation.ts` with:

```ts
export type EventGalleryCardTextLayout = 'center' | 'middleCenter' | 'split'

export type EventGalleryQuiltRowSpans = {
  base: 1
  sm: 1 | 2
  lg: 1 | 2
  xl: 1 | 2
}

const getCorrectiveSpan = ({
  albumCount,
  index,
  maximumColumns,
}: {
  albumCount: number
  index: number
  maximumColumns: number
}): 1 | 2 => {
  const columns = Math.min(Math.max(albumCount, 1), maximumColumns)
  const missingCells = (columns - (albumCount % columns)) % columns

  return index < missingCells ? 2 : 1
}

export function getEventGalleryQuiltGridClassName(albumCount: number): string {
  if (albumCount <= 1) return 'grid-cols-1'
  if (albumCount === 2) return 'grid-cols-1 sm:grid-cols-2'
  if (albumCount === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
}

export function getEventGalleryQuiltRowSpans(
  albumCount: number,
  index: number,
): EventGalleryQuiltRowSpans {
  return {
    base: 1,
    sm: getCorrectiveSpan({ albumCount, index, maximumColumns: 2 }),
    lg: getCorrectiveSpan({ albumCount, index, maximumColumns: 3 }),
    xl: getCorrectiveSpan({ albumCount, index, maximumColumns: 4 }),
  }
}

export function getEventGalleryQuiltRowSpanClassName({
  sm,
  lg,
  xl,
}: EventGalleryQuiltRowSpans): string {
  return [
    'row-span-1',
    sm === 2 ? 'sm:row-span-2' : 'sm:row-span-1',
    lg === 2 ? 'lg:row-span-2' : 'lg:row-span-1',
    xl === 2 ? 'xl:row-span-2' : 'xl:row-span-1',
  ].join(' ')
}

export function normalizeEventGalleryCardTextLayout(value: unknown): EventGalleryCardTextLayout {
  return value === 'center' || value === 'middleCenter' || value === 'split' ? value : 'split'
}
```

- [ ] **Step 4: Run the helper test and verify the green phase**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts
```

Expected: PASS with all presentation-helper tests green.

---

### Task 2: Rectangular Event Gallery Grid

**Files:**

- Modify: `src/components/event-gallery-client.tsx`
- Test: `tests/int/event-gallery-render.int.spec.tsx`
- Test: `tests/int/live-preview-renderer.int.spec.tsx`

**Interfaces:**

- Consumes: all three quilt helpers from Task 1.
- Preserves: `EventGalleryClientProps`, `EventGalleryCardContent`, `EventGalleryViewer`, and existing album/overlay props.
- Produces: `data-event-gallery-layout="rectangular-quilt"` plus per-breakpoint row-span diagnostics.

- [ ] **Step 1: Write failing rendering contracts for the rectangular quilt**

Update the mosaic assertion in `tests/int/event-gallery-render.int.spec.tsx` to verify:

```ts
expect(html).toContain('data-event-gallery-layout="rectangular-quilt"')
expect(html).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4')
expect(html).toContain('auto-rows-56 sm:auto-rows-60 lg:auto-rows-64')
expect(html).not.toContain('columns-1')
expect(html).not.toContain('data-event-gallery-ratio=')

expect(
  Array.from(html.matchAll(/data-event-gallery-row-span-xl="(\d)"/g), (match) => match[1]),
).toEqual(['2', '2', '1', '1', '1', '1'])
```

Retain the existing assertions that all six album titles render, metadata is split, overlay settings render, image-only mode hides content, and the viewer opens the complete selected album. In `tests/int/live-preview-renderer.int.spec.tsx`, replace the masonry marker assertion with:

```ts
expect(html).toContain('data-event-gallery-layout="rectangular-quilt"')
```

- [ ] **Step 2: Run the rendering tests and verify the red phase**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx
```

Expected: FAIL because the client still renders CSS columns and ratio roles.

- [ ] **Step 3: Replace CSS columns and ratio wrappers with the quilt grid**

In `src/components/event-gallery-client.tsx`, replace the mosaic-ratio imports with:

```ts
import {
  getEventGalleryQuiltGridClassName,
  getEventGalleryQuiltRowSpanClassName,
  getEventGalleryQuiltRowSpans,
  type EventGalleryCardTextLayout,
} from '@/components/event-gallery-presentation'
```

Remove `ratioClasses`. Before returning JSX, resolve the responsive column classes once:

```ts
const gridColumnsClassName = getEventGalleryQuiltGridClassName(albums.length)
```

Replace the columns container with:

```tsx
<div
  className={cn(
    'grid auto-rows-56 gap-3 sm:auto-rows-60 sm:gap-4 lg:auto-rows-64 lg:gap-5',
    gridColumnsClassName,
  )}
  data-event-gallery-layout="rectangular-quilt"
>
```

Inside `albums.map`, replace the ratio calculation with:

```ts
const rowSpans = getEventGalleryQuiltRowSpans(albums.length, index)
const rowSpanClassName = getEventGalleryQuiltRowSpanClassName(rowSpans)
```

Change the article's existing `className` prop to the following expression and add the three diagnostic attributes beside it. Leave its existing animation, key, transition, viewport, and `whileInView` props byte-for-byte unchanged:

```tsx
className={cn('group min-h-0 min-w-0', rowSpanClassName)}
data-event-gallery-row-span-lg={rowSpans.lg}
data-event-gallery-row-span-sm={rowSpans.sm}
data-event-gallery-row-span-xl={rowSpans.xl}
```

Replace the button's existing `className` string with:

```tsx
className =
  'block h-full w-full cursor-pointer overflow-hidden rounded-md border border-border text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:ring-offset-2'
```

Replace the current ratio frame opening tag:

```tsx
<div
  className={cn('relative w-full overflow-hidden', ratioClasses[mosaicRatio])}
  data-event-gallery-ratio={mosaicRatio}
>
```

with:

```tsx
<div className="relative h-full min-h-0 w-full overflow-hidden">
```

Do not edit the existing `Image` props, click handler, accessible label, overlay rendering, viewer rendering, animation props, or focus-restoration callback.

- [ ] **Step 4: Run focused Event Gallery and live-preview tests**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: PASS with the quilt layout, all albums, overlay positions, image-only mode, live preview, and viewer behavior covered.

---

### Task 3: Maintained Contracts and Final Verification

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `docs/guides/blocks.md`
- Modify when generated facts change: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the final rectangular-quilt behavior from Tasks 1–2.
- Produces: current operator and architecture documentation plus verified repository context.

- [ ] **Step 1: Update maintained Event Gallery documentation**

Replace references to CSS-column masonry, bounded aspect-ratio rhythm, and ragged packing with this current contract:

```md
Event Gallery uses a count-aware rectangular quilt: one column on phones, two on tablets, three on laptops, and four on wide desktops. The first few tiles span two rows only when required to fill the active grid exactly, so every rendered album count ends on a straight boundary without horizontal spans or oversized lead cards. Each selected published album still contributes one cover tile and opens its full image set.
```

Keep the existing overlay-control, ordering, publication, and first-valid-cover documentation intact.

- [ ] **Step 2: Format and run the complete affected test matrix**

Run:

```bash
pnpm exec prettier --write src/components/event-gallery-presentation.ts src/components/event-gallery-client.tsx tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx .agents/skills/project-context/references/block-system.md docs/architecture/feature-inventory.md docs/guides/blocks.md docs/superpowers/specs/2026-08-19-event-gallery-rectangular-quilt-design.md docs/superpowers/plans/2026-08-19-event-gallery-rectangular-quilt.md
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-data.int.spec.ts tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-selection.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: Prettier completes without errors and the complete Event Gallery contract suite passes.

- [ ] **Step 3: Run type, lint, layout, and diff checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/components/event-gallery-presentation.ts src/components/event-gallery-client.tsx tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/components/event-gallery-client.tsx
git diff --check
```

Expected: TypeScript and ESLint pass, the layout detector returns no unexplained findings, and `git diff --check` produces no output.

- [ ] **Step 4: Complete the mandatory project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory is current; an existing stale knowledge-graph commit warning is acceptable.

- [ ] **Step 5: Review scope and hand off without committing**

Run:

```bash
git status --short
git diff --stat
git diff --check
```

Expected: only Event Gallery implementation/tests/docs, the approved spec/plan, generated project inventory changes, and pre-existing user work are present. Do not stage or commit any file.
