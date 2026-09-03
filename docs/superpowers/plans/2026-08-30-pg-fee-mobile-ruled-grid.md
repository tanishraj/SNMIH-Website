# PG Fee Structure Mobile Ruled Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make each PG Fee Structure department chapter use the established Fee Structure Atlas two-column ruled layout below `lg` while preserving the current adaptive desktop grid.

**Architecture:** Keep the behavior local to `PGFeeStructureAtlasPresentation`. During the existing column map, derive odd-final-item state and conditionally apply compact row/column rules that reset at `lg`. Verify the responsive class contract through the existing PG Fee Structure integration suite and document the shared compact presentation.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4 responsive utilities, Payload CMS 3 normalized block data, Vitest, Testing Library.

## Global Constraints

- Change only the fee-value grid inside each PG department chapter.
- Below `lg`, render two equal columns with paired vertical rules and horizontal rules from the second row onward.
- An odd final value spans both columns and retains the compact visual center divider; a single value spans both columns without that divider.
- At `lg`, remove compact row rules and odd-item spanning, then preserve the existing adaptive `auto-fit/minmax` grid and vertical separators.
- Preserve authored column order, labels, values, wrapping, em-dash fallback, numeric detection, department headings, notes, tabs, summary, document action, themes, and the five-department 676px desktop scroll contract.
- Do not change Payload fields, generated types, normalization, migrations, saved content, or block registration.
- Leave all changes uncommitted unless the user separately authorizes a commit.

---

### Task 1: Add the responsive ruled-grid contract test and implementation

**Files:**
- Modify: `tests/int/pg-fee-structure.int.spec.tsx`
- Modify: `src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx`

**Interfaces:**
- Consumes: the existing ordered `category.columns` array and normalized `department.cells` array.
- Produces: `data-pg-fee-compact-divider="true"` only on an odd final compact item when the category contains more than one column.
- Preserves: `data-pg-fee-grid`, `data-pg-fee-value`, chapter semantics, and the desktop `auto-fit/minmax` layout.

- [ ] **Step 1: Write the failing compact ruled-grid test**

Add this test inside `describe('PGFeeStructureBlockComponent', ...)` in `tests/int/pg-fee-structure.int.spec.tsx`:

```tsx
it('uses the Fee Structure ruled grid on compact layouts and preserves the adaptive desktop grid', () => {
  const { container } = render(
    <PGFeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory]}
      programmeName="Postgraduate Medical Courses"
    />,
  )

  const grid = container.querySelector<HTMLElement>('[data-pg-fee-grid="true"]')
  const items = Array.from(grid?.children ?? []) as HTMLElement[]

  expect(grid?.className).toContain('grid-cols-2')
  expect(grid?.className).toContain(
    'lg:[grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))]',
  )
  expect(items).toHaveLength(3)
  expect(items[0]?.className).not.toContain('border-l')
  expect(items[1]?.className).toContain('border-l')
  expect(items[2]?.className).toContain('border-t')
  expect(items[2]?.className).toContain('col-span-2')
  expect(items[2]?.className).toContain('lg:col-span-1')
  expect(items[2]?.className).toContain('lg:border-t-0')
  expect(items[2]?.dataset.pgFeeCompactDivider).toBe('true')
  expect(items[2]?.className).toContain('lg:after:hidden')
})
```

- [ ] **Step 2: Extend the existing single-value test with the no-divider edge case**

In `it('omits optional summary regions and preserves missing authored values', ...)`, add these assertions after the existing em-dash assertion:

```tsx
const singleGrid = container.querySelector<HTMLElement>('[data-pg-fee-grid="true"]')
const singleItem = singleGrid?.firstElementChild as HTMLElement | null

expect(singleItem?.className).toContain('col-span-2')
expect(singleItem?.className).toContain('lg:col-span-1')
expect(singleItem?.dataset.pgFeeCompactDivider).toBeUndefined()
```

- [ ] **Step 3: Run the focused test and confirm the new assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: the new ruled-grid test fails because the current PG grid uses an all-breakpoint `auto-fit` layout and has no compact-divider contract; the existing tests remain green.

- [ ] **Step 4: Change the PG fee grid to a compact two-column base with the existing desktop template**

Replace the current `dl` class in `PGFeeStructureAtlasPresentation.tsx` with:

```tsx
<dl
  className="grid grid-cols-2 lg:gap-x-5 lg:gap-y-4 lg:[grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))]"
  data-pg-fee-grid="true"
>
```

- [ ] **Step 5: Derive odd-item state inside the existing column map**

Immediately after the existing `value` declaration, add:

```tsx
const isLastOddItem =
  category.columns.length % 2 === 1 && index === category.columns.length - 1
const showsCompactCenterDivider = isLastOddItem && category.columns.length > 1
```

- [ ] **Step 6: Apply compact rules and reset them at `lg`**

Replace the fee item wrapper with:

```tsx
<div
  className={cn(
    'relative min-w-0 px-3 py-3 lg:px-0 lg:py-0',
    index % 2 === 1 && 'border-l border-border',
    index >= 2 && 'border-t border-border',
    index > 0 && 'lg:border-l lg:border-border lg:pl-4',
    'lg:border-t-0',
    isLastOddItem && 'col-span-2 lg:col-span-1',
    showsCompactCenterDivider &&
      "after:absolute after:inset-y-0 after:left-1/2 after:border-l after:border-border after:content-[''] lg:after:hidden",
  )}
  data-pg-fee-compact-divider={showsCompactCenterDivider ? 'true' : undefined}
  key={column.id}
>
```

Keep the existing `dt`, `dd`, authored value, numeric detection, and key unchanged.

- [ ] **Step 7: Run the focused test and confirm all PG contracts pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: every PG Fee Structure normalization, schema, desktop-scroll, ruled-grid, content, and accessibility test passes.

---

### Task 2: Update maintained behavior documentation and complete verification

**Files:**
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate if changed: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the verified compact ruled-grid behavior from Task 1.
- Produces: editor, architecture, and project-context descriptions that match the visitor presentation.

- [ ] **Step 1: Update the editor-facing block guide**

Extend the PG Fee Structure paragraph in `docs/guides/blocks.md` with:

```markdown
Within each compact department chapter, fee values follow the Fee Structure Atlas ruled pattern:
two values per row, paired vertical rules, horizontal row rules, and a full-width final value when the
column count is odd. Large layouts retain the adaptive fee grid.
```

- [ ] **Step 2: Update the architecture inventory**

Extend the PG Fee Structure entry in `docs/architecture/feature-inventory.md` with:

```markdown
Compact department chapters use a two-column ruled fee grid shared visually with Fee Structure
Atlas; odd final values span the row, while `lg` layouts retain adaptive columns.
```

- [ ] **Step 3: Update the maintained block-system contract**

Add this behavior to the PG Fee Structure section of `.agents/skills/project-context/references/block-system.md`:

```markdown
Below `lg`, every department chapter presents fee values in the Fee Structure Atlas two-column
ruled pattern, including full-width odd final items. At `lg`, compact row rules are removed and the
existing adaptive value grid remains in effect.
```

- [ ] **Step 4: Run TypeScript and lint verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits successfully; ESLint reports no new errors. Identify any unrelated existing warnings separately.

- [ ] **Step 5: Complete the project-context update and impact review**

Run:

```bash
pnpm project-context:update
```

Inspect `.agents/skills/project-context/references/change-impact-map.md` against the final diff and confirm the presenter, focused tests, block guide, architecture inventory, block-system reference, and generated inventory hash are consistent. No Payload generator is required because the schema is unchanged.

Then run:

```bash
pnpm project-context:check
```

Expected: project context is current; a stale optional knowledge graph may remain a warning.

- [ ] **Step 6: Run final regression and diff checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
git diff --check
git diff HEAD -- src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx tests/int/pg-fee-structure.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: focused tests pass, no whitespace errors are reported, and the reviewed diff preserves all desktop, content, theme, and accessibility contracts. Do not commit.
