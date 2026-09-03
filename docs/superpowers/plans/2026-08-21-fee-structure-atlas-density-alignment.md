# Fee Structure Atlas Density Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the vertical space between Programme Cost Atlas fee-head chapters on the right and align their title, metadata, and value typography with the project’s established content-item rhythm without compacting the left Annual totals.

**Architecture:** Keep the change inside the existing `ProgrammeCostAtlasPresentation` and its focused integration contract. Extend the local `PeriodBreakdown` helper with an explicit `default | compact` density prop, apply `compact` only to right-side statement chapters, and retain the default padding for the left Annual totals. Preserve the existing semantic surfaces, dividers, hover behavior, breakpoints, and content model.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Payload CMS block rendering, Vitest, Testing Library, project-context tooling.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-21-fee-structure-programme-cost-atlas-design.md`, especially the approved “Right-side statement density” contract.
- Keep the right statement header at `p-6 sm:p-8`.
- Use `px-6 py-5 sm:px-8 sm:py-6` for right fee-head chapters and retain `hover:bg-accent/35`.
- Use a 12px (`mb-3`) fee-head-title-to-period-grid gap.
- Use 12px vertical padding (`py-3`) for right academic-period cells and retain 16px (`py-4`) for left Annual totals.
- Use `font-sans text-md leading-tight font-medium sm:text-lg` for standard fee-head titles and the same scale with `font-bold` for additional total-emphasis fee heads.
- Use `font-mono text-xs font-medium tracking-[0.14em]` for academic-period labels; values remain `text-sm font-medium`, left aligned, and tabular only when numeric.
- Preserve the 50/50 layout, Primary/Card surface ownership, current-color dividers, Accent hover treatment, responsive grid, content order, and every authored value.
- Do not change Payload fields, generated Payload types, normalization, table/mobile-card rendering, tabs, download behavior, or Fee Structure content.
- Do not stage, unstage, or commit any files.

---

## File Map

- Modify `tests/int/fee-structure.int.spec.tsx`: lock distinct left/default and right/compact period density plus approved chapter spacing and typography.
- Modify `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`: add the local density interface and apply the approved spacing/type classes.
- Replace `public/block-thumbnails/fee-structure.jpg`: regenerate and visually inspect the real rendered Fee Structure fixture.
- Refresh `.agents/skills/project-context/references/project-inventory.json`: run the required project-context update/check loop. No manual architecture or operator documentation change is needed because the schema, registry, renderer topology, and editor controls remain unchanged.

---

### Task 1: Lock the compact-right/default-left presentation contract

**Files:**

- Modify: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Consumes: existing Programme Cost Atlas DOM contracts, including `data-fee-atlas-annual-totals`, `data-fee-atlas-statement`, `data-fee-atlas-fee-chapter`, `data-fee-atlas-period-grid`, `data-fee-atlas-period`, and `data-fee-row-label`.
- Produces: regression expectations for `data-fee-atlas-period-density="default|compact"` and `data-fee-atlas-fee-chapter-heading="true"`.

- [ ] **Step 1: Add density, spacing, and shared-type queries to the Atlas integration test**

In `renders the Programme Cost Atlas with the approved 50/50 editorial hierarchy`, add these queries after `periodValues`:

```tsx
const annualTotalsGrid = container.querySelector(
  '[data-fee-atlas-annual-totals="true"] [data-fee-atlas-period-grid="true"]',
)
const annualTotalPeriods = Array.from(
  container.querySelectorAll(
    '[data-fee-atlas-annual-totals="true"] [data-fee-atlas-period="true"]',
  ),
)
const statementChapters = Array.from(
  container.querySelectorAll('[data-fee-atlas-fee-chapter="true"]'),
)
const statementPeriodGrids = Array.from(
  container.querySelectorAll(
    '[data-fee-atlas-statement="true"] [data-fee-atlas-period-grid="true"]',
  ),
)
const statementPeriods = Array.from(
  container.querySelectorAll('[data-fee-atlas-statement="true"] [data-fee-atlas-period="true"]'),
)
const statementChapterHeadings = Array.from(
  container.querySelectorAll('[data-fee-atlas-fee-chapter-heading="true"]'),
)
```

- [ ] **Step 2: Replace the current single fee-title assertion block with the complete density contract**

Use these assertions where `standardFeeTitle` is currently checked:

```tsx
expect(annualTotalsGrid?.getAttribute('data-fee-atlas-period-density')).toBe('default')
expect(annualTotalPeriods.every((element) => element.className.includes('py-4'))).toBe(true)
expect(annualTotalPeriods.every((element) => !element.className.includes('py-3'))).toBe(true)
expect(statementPeriodGrids).toHaveLength(3)
expect(
  statementPeriodGrids.every(
    (element) => element.getAttribute('data-fee-atlas-period-density') === 'compact',
  ),
).toBe(true)
expect(statementPeriods.every((element) => element.className.includes('py-3'))).toBe(true)
expect(statementPeriods.every((element) => !element.className.includes('py-4'))).toBe(true)
expect(statementChapters.every((element) => element.className.includes('px-6'))).toBe(true)
expect(statementChapters.every((element) => element.className.includes('py-5'))).toBe(true)
expect(statementChapters.every((element) => element.className.includes('sm:px-8'))).toBe(true)
expect(statementChapters.every((element) => element.className.includes('sm:py-6'))).toBe(true)
expect(statementChapters.every((element) => !element.className.includes('sm:p-8'))).toBe(true)
expect(statementChapters.every((element) => element.className.includes('hover:bg-accent/35'))).toBe(
  true,
)
expect(statementChapterHeadings).toHaveLength(3)
expect(statementChapterHeadings.every((element) => element.className.includes('mb-3'))).toBe(true)
expect(periodLabels.every((element) => element.className.includes('font-mono'))).toBe(true)
expect(periodLabels.every((element) => element.className.includes('text-xs'))).toBe(true)
expect(periodLabels.every((element) => element.className.includes('font-medium'))).toBe(true)
expect(periodLabels.every((element) => element.className.includes('tracking-[0.14em]'))).toBe(true)
const standardFeeTitle = container.querySelector(
  '[data-fee-atlas-fee-chapter="true"][data-fee-row-emphasis="standard"] [data-fee-row-label="true"]',
)
expect(standardFeeTitle?.className).toContain('font-sans')
expect(standardFeeTitle?.className).toContain('text-md')
expect(standardFeeTitle?.className).toContain('sm:text-lg')
expect(standardFeeTitle?.className).toContain('leading-tight')
expect(standardFeeTitle?.className).toContain('font-medium')
const totalFeeTitle = container.querySelector(
  '[data-fee-atlas-fee-chapter="true"][data-fee-row-emphasis="total"] [data-fee-row-label="true"]',
)
expect(totalFeeTitle?.className).toContain('text-md')
expect(totalFeeTitle?.className).toContain('sm:text-lg')
expect(totalFeeTitle?.className).toContain('font-bold')
```

Keep the existing assertions for the 50/50 grid, semantic surfaces, sans-serif headings, left alignment, Complete programme expense, content order, row-label order, no table, and no external context band.

- [ ] **Step 3: Run the focused test and verify the contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: FAIL because `PeriodBreakdown` does not expose a density attribute, all period cells use `py-4`, right chapters use `p-6 sm:p-8`, the title wrapper uses `mb-4`, and the fee-head/metadata classes do not match the approved shared scale.

---

### Task 2: Implement the compact statement density

**Files:**

- Modify: `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`

**Interfaces:**

- Consumes: `ResolvedFeeStructureCategory`, `ResolvedFeeStructureRow`, `cn`, and the existing period-grid geometry.
- Produces: local `PeriodBreakdownDensity = 'default' | 'compact'`; `PeriodBreakdown({ category, density = 'default', row })`; stable density and chapter-heading data attributes.

- [ ] **Step 1: Add an explicit density type and prop to `PeriodBreakdown`**

Immediately above `PeriodBreakdown`, add:

```tsx
type PeriodBreakdownDensity = 'compact' | 'default'
```

Change the function signature and `<dl>` opening to:

```tsx
function PeriodBreakdown({
  category,
  density = 'default',
  row,
}: {
  category: ResolvedFeeStructureCategory
  density?: PeriodBreakdownDensity
  row: ResolvedFeeStructureRow
}) {
  const desktopColumns =
    desktopPeriodGridClasses[
      Math.min(Math.max(category.columns.length, 1), 6) as keyof typeof desktopPeriodGridClasses
    ]

  return (
    <dl
      className={cn('grid grid-cols-2', desktopColumns)}
      data-fee-atlas-period-density={density}
      data-fee-atlas-period-grid="true"
    >
```

Retain the desktop-column resolver exactly once when replacing the function opening.

- [ ] **Step 2: Give compact period cells 12px vertical padding while preserving Annual totals**

Replace the base period-cell class with:

```tsx
className={cn(
  'min-w-0 px-3 first:pl-0 last:pr-0',
  density === 'compact' ? 'py-3' : 'py-4',
  index % 2 === 1 && 'border-l border-current/15',
  index >= 2 && 'border-t border-current/15',
  index > 0 && 'lg:border-l lg:border-current/15',
  'lg:border-t-0',
  isLastOddItem && 'col-span-2 lg:col-span-1',
)}
```

Leave the Annual totals call as `<PeriodBreakdown category={category} row={annualTotals} />`; its resolved density remains `default` and retains `py-4`.

- [ ] **Step 3: Align period metadata with the shared metadata scale**

Replace the `<dt>` class with:

```tsx
<dt className="text-left font-mono text-xs font-medium uppercase tracking-[0.14em] text-current/65">
```

Keep the `<dd>` at `mt-2 break-words text-left text-sm font-medium text-current`, including conditional `tabular-nums`.

- [ ] **Step 4: Apply the approved right-chapter density and item-title scale**

Replace each statement article opening with:

```tsx
<article
  className="px-6 py-5 transition-colors hover:bg-accent/35 sm:px-8 sm:py-6"
  data-fee-atlas-fee-chapter="true"
  data-fee-row-emphasis={row.emphasis}
  key={row.id}
>
```

Replace the heading wrapper and title opening with:

```tsx
<div className="mb-3" data-fee-atlas-fee-chapter-heading="true">
  <h4
    className={cn(
      'font-sans text-md leading-tight tracking-tight text-card-foreground sm:text-lg',
      row.emphasis === 'total' ? 'font-bold' : 'font-medium',
    )}
    data-fee-atlas-title="true"
    data-fee-row-label="true"
  >
    {row.label}
  </h4>
```

Keep the optional row note immediately after the heading. Change only the closing right-side period call to:

```tsx
<PeriodBreakdown category={category} density="compact" row={row} />
```

Do not change the statement header, left summary spacing, semantic colors, dividers, or responsive column rules.

- [ ] **Step 5: Format the component and test**

Run:

```bash
pnpm exec prettier --write src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx
```

Expected: both files format successfully with no unrelated edits.

- [ ] **Step 6: Re-run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: PASS, including the left/default versus right/compact density assertions and all existing Fee Structure behavior.

---

### Task 3: Regenerate the visual artifact and complete repository verification

**Files:**

- Replace: `public/block-thumbnails/fee-structure.jpg`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`
- Review unchanged: `.agents/skills/project-context/references/block-system.md`
- Review unchanged: `docs/guides/blocks.md`
- Review unchanged: `docs/architecture/feature-inventory.md`

**Interfaces:**

- Consumes: the real Fee Structure thumbnail fixture and repository project-context scripts.
- Produces: a visually verified 1600×900 thumbnail, passing affected suites, and current generated repository knowledge.

- [ ] **Step 1: Regenerate only the Fee Structure thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=feeStructure pnpm generate:block-thumbnails
```

Expected: `✓ feeStructure -> public/block-thumbnails/fee-structure.jpg` and a 1600×900 JPEG generated from the production component fixture.

- [ ] **Step 2: Inspect the thumbnail visually**

Open `public/block-thumbnails/fee-structure.jpg` with the workspace image viewer and confirm:

- right fee-head chapters have a visibly tighter vertical rhythm without looking compressed;
- the right statement header retains its existing padding;
- fee-head titles match existing sans-serif content-item titles and standard rows remain medium weight;
- year labels use the shared metadata style and every amount remains left aligned and readable;
- left Annual totals retain their roomier period-cell padding;
- Complete programme expense and Download Fee Structure remain visible at the bottom of the left panel;
- the 50/50 frame, dividers, Accent hover, Primary/Card surfaces, and content order remain unchanged;
- no text clips, overlaps, or overflows at 1600×900.

- [ ] **Step 3: Run focused and neighboring Fee Structure tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/theme-contracts.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
```

Expected: all selected integration files PASS; table/mobile-card rendering, production/live-preview rendering, reusable sections, and thumbnail contracts remain intact.

- [ ] **Step 4: Run static and layout checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx
pnpm exec prettier --check src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx docs/superpowers/specs/2026-08-21-fee-structure-programme-cost-atlas-design.md docs/superpowers/plans/2026-08-21-fee-structure-atlas-density-alignment.md
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/FeeStructure/Component.tsx src/blocks/FeeStructure/FeeStructureClient.tsx src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
git diff --check
```

Expected: TypeScript, focused ESLint, Prettier, and whitespace checks PASS; the layout detector returns `[]`.

- [ ] **Step 5: Complete the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the repository inventory is refreshed atomically and the check reports `Project context is current.` The known stale knowledge-graph warning is acceptable only if it remains the sole warning. Leave the reviewed operator and architecture documents unchanged because the Admin contract and block architecture do not change; the approved visual contract is recorded in the design spec.

- [ ] **Step 6: Audit the final scope without staging or committing**

Run:

```bash
git status --short
git diff -- src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx public/block-thumbnails/fee-structure.jpg .agents/skills/project-context/references/project-inventory.json docs/superpowers/specs/2026-08-21-fee-structure-programme-cost-atlas-design.md docs/superpowers/plans/2026-08-21-fee-structure-atlas-density-alignment.md
git diff --cached --name-only
```

Expected: the implementation diff contains only the approved density/type refinement, its regression contract, refreshed Fee Structure thumbnail, design/plan documents, and any generated project inventory update attributable to the shared workspace. `git diff --cached --name-only` prints nothing; all work remains unstaged and uncommitted, and unrelated pre-existing user changes remain untouched.
