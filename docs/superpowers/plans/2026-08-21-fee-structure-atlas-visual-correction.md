# Fee Structure Atlas Visual Correction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require an editor-authored complete programme expense for every Atlas category and align the Atlas typography, period values, spacing, and colors with the project's standard semantic design system.

**Architecture:** Keep the existing Fee Structure data flow and 50/50 Atlas component boundary. Tighten the existing category field contract in Payload, then make presentation-only class changes inside `ProgrammeCostAtlasPresentation` while preserving the table layout, tab behavior, download configuration, and no-calculation rule.

**Tech Stack:** Payload CMS 3.85.2, React 19, Next.js 16, Tailwind CSS 4 semantic tokens, Radix Tabs, Vitest, Testing Library.

## Global Constraints

- `completeProgrammeExpense` is manually authored and required for every Programme Cost Atlas category.
- Never calculate, parse, combine, convert, or infer a complete programme expense.
- Legacy or incomplete runtime data may still omit the expense region defensively.
- Keep the existing 50/50 desktop layout and stacked mobile layout.
- Use the shared sans-serif family for every Atlas heading and amount.
- Align every academic-period label and value to the left.
- Use standard title and body scales; do not introduce display-sized typography.
- Use semantic theme tokens only; add no raw SNMIH-specific colors.
- Preserve table/mobile-card behavior, category tabs, download configuration, and unrelated worktree changes.
- Do not stage, unstage, or commit any files.

---

## File Structure

- Modify `src/blocks/FeeStructure/config.ts`: require the category-owned complete expense in Atlas authoring.
- Modify `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`: standardize typography, alignment, spacing, and semantic color classes.
- Modify `tests/int/fee-structure.int.spec.tsx`: assert the required Payload field and corrected Atlas presentation contract.
- Modify `src/payload-types.ts`: regenerate Payload types.
- Modify `src/block-thumbnails/fixtures.tsx` only if the current Atlas fixture needs no-value or typography coverage changes.
- Replace `public/block-thumbnails/fee-structure.jpg`: regenerate and inspect the corrected preview.
- Modify maintained Fee Structure documentation only where the required-expense or visual contract changed.
- Modify `.agents/skills/project-context/references/project-inventory.json` through the required updater.

---

### Task 1: Require the manually authored complete programme expense

**Files:**

- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `src/blocks/FeeStructure/config.ts`
- Modify: `src/payload-types.ts` through generation

**Interfaces:**

- Consumes: existing `completeProgrammeExpense` category field and `usesProgrammeCostAtlas` block-data condition.
- Produces: a conditionally visible required Payload text field; runtime normalization remains unchanged and defensive.

- [ ] **Step 1: Add the failing schema assertion**

Extend the existing `FeeStructureBlock schema` test:

```tsx
expect(findNamedField(FeeStructureBlock.fields, 'completeProgrammeExpense')).toMatchObject({
  type: 'text',
  required: true,
})
```

Keep the existing block-data condition assertions proving the field is hidden for `table` and visible for `programmeCostAtlas`.

- [ ] **Step 2: Run the focused schema test and confirm failure**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "FeeStructureBlock schema"
```

Expected: FAIL because `completeProgrammeExpense.required` is not yet `true`.

- [ ] **Step 3: Require the existing field without adding calculation logic**

Update the existing field in `config.ts`:

```ts
{
  name: 'completeProgrammeExpense',
  label: 'Complete Programme Expense',
  type: 'text',
  required: true,
  admin: {
    condition: (_data, _siblingData, { blockData }) =>
      usesProgrammeCostAtlas(blockData as FeeStructureBlockData),
    description:
      'Required for Programme Cost Atlas. Enter the official complete amount exactly as published; it is never calculated from annual values.',
  },
}
```

Do not change `normalizeFeeCategories`; its optional normalized amount remains the defensive boundary for legacy data.

- [ ] **Step 4: Run the focused test and generate Payload types**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "FeeStructureBlock schema"
pnpm generate:types
```

Expected: the schema test passes. Payload retains an optional generated TypeScript property because the required field is conditional, while Admin validation requires it whenever the Atlas condition is active.

---

### Task 2: Standardize Atlas typography, alignment, spacing, and semantic colors

**Files:**

- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx`

**Interfaces:**

- Consumes: `ResolvedFeeStructureCategory`, `PeriodBreakdown`, and the existing Atlas data attributes.
- Produces: a class-level visual contract with sans-serif titles, left-aligned period content, standard scales, and matched two-half spacing.

- [ ] **Step 1: Add failing typography and alignment assertions**

In the approved Atlas rendering test, capture stable elements and assert:

```tsx
const atlasTitles = Array.from(container.querySelectorAll('[data-fee-atlas-title="true"]'))
expect(atlasTitles.length).toBeGreaterThan(0)
expect(atlasTitles.every((element) => element.className.includes('font-sans'))).toBe(true)
expect(atlasTitles.every((element) => !element.className.includes('font-serif'))).toBe(true)

const periodValues = Array.from(
  container.querySelectorAll('[data-fee-atlas-period="true"] [data-fee-value="true"]'),
)
expect(periodValues.every((element) => element.className.includes('text-left'))).toBe(true)
expect(periodValues.every((element) => !element.className.includes('text-right'))).toBe(true)

expect(container.querySelector('[data-fee-atlas-summary-inner="true"]')?.className).toContain(
  'sm:p-8',
)
expect(container.querySelector('[data-fee-atlas-statement-header="true"]')?.className).toContain(
  'sm:p-8',
)
```

Assert the complete-expense amount has `font-sans`, `text-2xl`, `text-left`, and `tabular-nums`, while fee chapters use `text-lg` and normal rows are `font-medium`.

- [ ] **Step 2: Run the focused Atlas test and confirm failure**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "Programme Cost Atlas"
```

Expected: FAIL because current headings and the complete-expense amount use `font-serif`, and period values use `text-right`.

- [ ] **Step 3: Correct the shared period presentation**

Keep the existing responsive grid and separators. Change the value class in `PeriodBreakdown` to:

```tsx
className={cn(
  'mt-2 break-words text-left text-sm font-medium text-current',
  isNumericFeeValue(value) && 'tabular-nums',
)}
```

Keep period labels left-aligned with `text-left`, the existing metadata scale, and `text-current/60` so both Primary and Card surfaces inherit the correct semantic foreground.

- [ ] **Step 4: Correct title families and standard sizes**

Add `data-fee-atlas-title="true"` to Annual totals, the right statement title, each fee-head title, and the complete-expense amount. Use these exact class contracts:

```tsx
// Annual totals and statement title
className="font-sans text-xl font-semibold tracking-tight"

// Fee-head title
className={cn(
  'font-sans text-lg tracking-tight text-card-foreground',
  row.emphasis === 'total' ? 'font-bold' : 'font-medium',
)}

// Complete programme expense amount
className={cn(
  'mt-2 break-words text-left font-sans text-2xl font-semibold tracking-tight text-primary-foreground',
  isNumericFeeValue(category.completeProgrammeExpense) && 'tabular-nums',
)}
```

No `font-serif`, `text-3xl`, or `text-4xl` class remains in the Atlas component.

- [ ] **Step 5: Match the two halves' spacing rhythm**

Add `data-fee-atlas-summary-inner="true"` and use:

```tsx
className =
  'flex min-h-full flex-col gap-8 p-6 sm:p-8 lg:sticky lg:top-24 lg:min-h-[min(42rem,calc(100vh-8rem))]'
```

Add `data-fee-atlas-statement-header="true"` and use `p-6 sm:p-8`. Use the same `p-6 sm:p-8` on each right-side fee chapter. Preserve the sticky behavior, `mt-auto` bottom group, semantic surfaces, `border-border`, Primary foreground opacity, and `hover:bg-accent/35`.

- [ ] **Step 6: Run the complete Fee Structure suite and type-check**

Run:

```bash
pnpm exec prettier --write src/blocks/FeeStructure tests/int/fee-structure.int.spec.tsx
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx
pnpm exec tsc --noEmit
git diff --check -- src/blocks/FeeStructure tests/int/fee-structure.int.spec.tsx src/payload-types.ts
```

Expected: all Fee Structure tests, TypeScript, and diff checks pass.

---

### Task 3: Refresh visual and maintained project contracts

**Files:**

- Replace: `public/block-thumbnails/fee-structure.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` through generation

**Interfaces:**

- Consumes: the corrected production Atlas component and its existing thumbnail fixture.
- Produces: an accurate picker preview, operator contract, and current project inventory.

- [ ] **Step 1: Update the maintained Fee Structure contract**

State in the existing Fee Structure paragraphs that Complete programme expense is required per Atlas category and manually authored. Add the visual contract concisely: Atlas uses standard sans-serif headings, left-aligned period labels/values, matched spacing, and semantic Primary/Card colors. Do not change the registered block count.

- [ ] **Step 2: Regenerate and inspect only the Fee Structure thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=feeStructure pnpm generate:block-thumbnails
```

Expected: `✓ feeStructure -> public/block-thumbnails/fee-structure.jpg`. Inspect the 1600×900 image and confirm the complete expense is visible, titles are standard sans-serif, both year labels and amounts align left, the two halves share spacing, and Primary/Card contrast is coherent.

- [ ] **Step 3: Run the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. The existing stale knowledge-graph commit warning may remain.

- [ ] **Step 4: Run neighboring contracts and quality checks**

Run:

```bash
pnpm exec vitest run \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout \
  src/blocks/FeeStructure/Component.tsx \
  src/blocks/FeeStructure/FeeStructureClient.tsx \
  src/blocks/FeeStructure/ProgrammeCostAtlasPresentation.tsx
```

Expected: tests and TypeScript pass, lint has no errors, and the layout detector returns `[]`. The existing GTM advisory may remain.

- [ ] **Step 5: Perform the final worktree audit**

Run:

```bash
git diff --check
git diff --cached --name-only
git status --short
```

Expected: no staged files, no commits, and only the approved Fee Structure work plus pre-existing user changes.
