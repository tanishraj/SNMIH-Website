# Fee Atlas Period Grid Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align every Programme Cost Atlas period record and restore the center divider in an incomplete compact two-column row.

**Architecture:** Keep `PeriodBreakdown` as the single shared renderer for Annual totals and statement fee heads. Normalize cell padding at that boundary, and let the final odd full-row cell draw a compact-only decorative center divider without changing its span or the large-screen configured column grid.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library, Payload CMS project-context tooling

## Global Constraints

- Preserve all existing user edits in `ProgrammeCostAtlasPresentation.tsx` outside the approved period-cell correction.
- Do not stage, unstage, or commit any files.
- Keep the final odd period spanning the complete compact row.
- Hide the added center divider at the `lg` breakpoint.
- Do not render the added divider for a category containing only one period.
- Do not change fee data, content order, typography, colors, or Atlas structure.

---

### Task 1: Correct compact period alignment and divider geometry

**Files:**
- Modify: `tests/int/fee-structure.int.spec.tsx:460-641`
- Modify: `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx:42-73`
- Regenerate: `public/block-thumbnails/fee-structure.jpg`

**Interfaces:**
- Consumes: `PeriodBreakdown({ category, density, row })` and the existing `data-fee-atlas-period` test contract.
- Produces: uniform `px-3` period cells and `data-fee-atlas-compact-divider="true"` on only the final odd full-row period when the category contains multiple periods.

- [ ] **Step 1: Add failing alignment and divider assertions to the existing Atlas rendering test**

After the `annualTotalPeriods` query, assert that every period retains equal padding, that edge-specific padding exceptions are absent, and that the fifth period owns the compact-only divider:

```tsx
expect(annualTotalPeriods.every((period) => period.className.includes('px-3'))).toBe(true)
expect(annualTotalPeriods.every((period) => !period.className.includes('first:pl-0'))).toBe(true)
expect(annualTotalPeriods.every((period) => !period.className.includes('last:pr-0'))).toBe(true)

const finalOddPeriod = annualTotalPeriods.at(-1)
expect(finalOddPeriod?.getAttribute('data-fee-atlas-compact-divider')).toBe('true')
expect(finalOddPeriod?.className).toContain('after:left-1/2')
expect(finalOddPeriod?.className).toContain('after:border-l')
expect(finalOddPeriod?.className).toContain('lg:after:hidden')
```

- [ ] **Step 2: Add a failing single-period edge-case test**

Create a category with one configured period and one cell per row, then verify that the compact divider is omitted while the period still spans the compact row:

```tsx
it('does not draw a compact center divider for a single-period Atlas grid', () => {
  const singlePeriodCategory = {
    ...atlasCategory,
    columns: atlasCategory.columns.slice(0, 1),
    rows: atlasCategory.rows.map((row) => ({
      ...row,
      cells: row.cells.slice(0, 1),
    })),
  }
  const { container } = render(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[singlePeriodCategory]}
      layout="programmeCostAtlas"
      programmeName="MBBS"
    />,
  )

  expect(container.querySelector('[data-fee-atlas-compact-divider="true"]')).toBeNull()
  expect(container.querySelector('[data-fee-atlas-period="true"]')?.className).toContain(
    'col-span-2',
  )
})
```

- [ ] **Step 3: Run the focused test and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: the equal-padding assertion fails because `first:pl-0` and `last:pr-0` remain, and the divider assertions fail because no compact-divider contract exists.

- [ ] **Step 4: Implement the minimal shared presentation correction**

Inside the period map, derive whether the odd full-row item needs the compact divider:

```tsx
const showsCompactRowDivider = isLastOddItem && category.columns.length > 1
```

Replace the period cell classes and add the test-facing data attribute:

```tsx
<div
  className={cn(
    'min-w-0 px-3',
    density === 'compact' ? 'py-3' : 'py-4',
    index % 2 === 1 && 'border-l border-current/15',
    index >= 2 && 'border-t border-current/15',
    index > 0 && 'lg:border-l lg:border-current/15',
    'lg:border-t-0',
    isLastOddItem && 'col-span-2 lg:col-span-1',
    showsCompactRowDivider &&
      "relative after:absolute after:inset-y-0 after:left-1/2 after:border-l after:border-current/15 after:content-[''] lg:after:hidden",
  )}
  data-fee-atlas-compact-divider={showsCompactRowDivider ? 'true' : undefined}
  data-fee-atlas-period="true"
  key={`${row.id}-${column.id}`}
>
```

- [ ] **Step 5: Run the focused test and confirm it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: all Fee Structure integration tests pass.

- [ ] **Step 6: Format and run static verification**

Run:

```bash
pnpm exec prettier --write src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx tests/int/fee-structure.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
```

Expected: TypeScript and ESLint exit successfully, and the layout detector returns `[]`.

- [ ] **Step 7: Regenerate and inspect the Fee Structure thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=feeStructure pnpm generate:block-thumbnails
sips -g pixelWidth -g pixelHeight public/block-thumbnails/fee-structure.jpg
```

Expected: the generator updates `public/block-thumbnails/fee-structure.jpg` at 1600×900. Inspect it once to confirm equal period insets and the compact center divider without changing the surrounding Atlas layout.

- [ ] **Step 8: Complete the repository context loop and final boundary audit**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
git diff --check
git status --short
git diff --name-status
git diff --cached --name-status
```

Expected: project context is current; a stale knowledge-graph commit warning is allowed. Diff checks pass, the implementation and its spec/plan remain unstaged, and the pre-existing staged files remain staged without any index mutation.
