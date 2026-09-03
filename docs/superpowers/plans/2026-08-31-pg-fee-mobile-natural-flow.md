# PG Fee Structure Mobile Natural Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the PG Fee Structure department statements explicitly use natural page flow below `lg` while preserving the bounded desktop scroll layout for categories with more than four departments.

**Architecture:** Keep responsive ownership in `PGFeeStructureAtlasPresentation` and express the contract with mobile-first sizing classes plus existing `lg:` overflow utilities. Lock the behavior with the existing block integration suite and document it in the maintained block-system reference; no viewport JavaScript, schema, data, or tab behavior changes are needed.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS 4, Radix Tabs, TypeScript, Vitest, Testing Library

## Global Constraints

- Below `lg`, the atlas, summary, statement, and department list use natural height with no bounded internal vertical scroll.
- At `lg` and above, more than four departments keep the existing 676px atlas and internal summary/statement scrolling.
- Four or fewer departments keep natural height at every breakpoint.
- Preserve department order, fee values, notes, tab behavior, schema, and stored CMS data.
- Do not add viewport-detection JavaScript or dependencies.
- Do not stage or commit any changes.

---

### Task 1: Make the responsive height contract explicit

**Files:**
- Modify: `tests/int/pg-fee-structure.int.spec.tsx:322-363`
- Modify: `src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx:40-162`

**Interfaces:**
- Consumes: `hasBoundedDepartmentList: boolean`, derived from `category.departments.length > 4`.
- Produces: mobile-first `h-auto max-h-none` sizing on the atlas regions while retaining the existing `lg:h-[676px]`, `lg:h-full`, `lg:flex-1`, `lg:overflow-y-auto`, and `lg:overscroll-contain` desktop contract.

- [ ] **Step 1: Extend the integration contract before changing the component**

In the test named `bounds exactly five or more departments on desktop and preserves compact natural flow`, add assertions for the mobile-first sizing classes while retaining the existing desktop assertions:

```tsx
expect(boundedAtlas?.className).toContain('h-auto')
expect(boundedAtlas?.className).toContain('max-h-none')
expect(boundedAtlas?.className).toContain('lg:h-[676px]')
expect(summary?.className).toContain('h-auto')
expect(summary?.className).toContain('max-h-none')
expect(summary?.className).toContain('lg:overflow-y-auto')
expect(statement?.className).toContain('h-auto')
expect(statement?.className).toContain('max-h-none')
expect(statement?.className).toContain('lg:flex-col')
expect(scroller?.className).toContain('h-auto')
expect(scroller?.className).toContain('max-h-none')
expect(scroller?.className).toContain('lg:flex-1')
expect(scroller?.className).toContain('lg:overflow-y-auto')
expect(scroller?.className).toContain('lg:overscroll-contain')
expect(scroller?.className.split(' ')).not.toContain('overflow-y-auto')
expect(scroller?.className.split(' ')).not.toContain('overscroll-contain')
```

Keep the existing assertions that all five department chapters and the final note render.

- [ ] **Step 2: Run the focused test and verify the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: FAIL because the atlas regions do not yet include the explicit `h-auto` and `max-h-none` classes.

- [ ] **Step 3: Add mobile-first sizing without changing the desktop breakpoint**

Update the four relevant class groups in `PGFeeStructureAtlasPresentation.tsx`:

```tsx
<div
  className={cn(
    'grid h-auto max-h-none min-w-0 overflow-clip rounded-card border border-border lg:grid-cols-2',
    hasBoundedDepartmentList && 'lg:h-[676px]',
  )}
  data-pg-fee-atlas="true"
  data-pg-fee-category={category.label}
>
```

```tsx
<aside
  className={cn(
    'h-auto max-h-none min-w-0 bg-primary text-primary-foreground',
    hasBoundedDepartmentList && 'lg:h-full lg:min-h-0 lg:overflow-y-auto',
  )}
  data-pg-fee-atlas-summary="true"
>
```

```tsx
<section
  className={cn(
    'h-auto max-h-none min-w-0 bg-card text-card-foreground',
    hasBoundedDepartmentList && 'lg:flex lg:h-full lg:min-h-0 lg:flex-col',
  )}
  data-pg-fee-atlas-statement="true"
>
```

```tsx
className={cn(
  'h-auto max-h-none divide-y divide-border',
  hasBoundedDepartmentList &&
    'focus-visible:ring-ring/40 focus-visible:ring-3 focus-visible:ring-inset focus-visible:outline-none lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable]',
)}
```

Do not add unprefixed `overflow-y-auto`, `overscroll-contain`, or fixed-height utilities.

- [ ] **Step 4: Run the focused integration suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: all PG Fee Structure tests PASS.

### Task 2: Document and verify the responsive contract

**Files:**
- Modify: `.agents/skills/project-context/references/block-system.md:297-318`
- Generated check: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the responsive behavior established in Task 1.
- Produces: maintained architecture documentation and a verified project-context inventory.

- [ ] **Step 1: Update the maintained block behavior reference**

Extend the PG Fee Structure paragraph in `block-system.md` with this behavior:

```markdown
For categories with more than four departments, the Atlas remains natural-height below `lg` so every department statement participates in page scrolling; at `lg` and above, the frame is bounded and the summary and statement regions scroll internally.
```

- [ ] **Step 2: Run static and focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
pnpm exec tsc --noEmit
pnpm lint
pnpm generate:types
```

Expected: all tests, type checking, lint, and Payload type generation succeed. Because no schema changes, `src/payload-types.ts` should remain unchanged.

- [ ] **Step 3: Verify the behavior in the browser**

At a compact viewport below `lg`, inspect a PG Fee Structure category with at least five departments and confirm:

```text
atlas computed height = natural content height
department list overflow-y = visible
department list scrollHeight = clientHeight
final department statement and note are present
page scrollHeight includes the complete atlas
```

At a desktop viewport at or above `lg`, confirm:

```text
atlas height = 676px
department list overflow-y = auto
department list scrollHeight > clientHeight
internal department scrolling reaches the final statement
```

- [ ] **Step 4: Complete the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory update succeeds and the checker reports `Project context is current.` A stale knowledge-graph commit warning is acceptable under the repository contract.

- [ ] **Step 5: Audit the final working tree without staging or committing**

Run:

```bash
git diff --check
git diff -- src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx tests/int/pg-fee-structure.int.spec.tsx .agents/skills/project-context/references/block-system.md
git diff --cached --stat
git status --short --branch
```

Expected: no whitespace errors, only the intended PG Fee responsive changes plus previously existing working-tree changes, and an empty cached diff. Leave every file unstaged and uncommitted.
