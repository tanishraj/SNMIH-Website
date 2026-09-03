# Fee Structure Unified Row Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every desktop fee-table body row use one continuous base and hover surface while changing regular fee-name labels to normal weight and retaining bold Total rows.

**Architecture:** Keep the shared table primitive and Fee Structure schema unchanged. Define static semantic surface classes inside `FeeStructureClient`, apply them from each body `TableRow` to every direct `th` and `td`, and remove the sticky body header's competing background. Use opaque semantic `color-mix()` values so the sticky fee-name cell masks horizontally scrolled content without creating a visual seam.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, shadcn table primitives, Vitest, Testing Library.

## Global Constraints

- Do not stage, unstage, or commit any file.
- Change only desktop fee-table body rows; keep the top `Fee Head` header row unchanged.
- Keep the fee-name column sticky during horizontal scrolling.
- Keep mobile period cards unchanged.
- Regular fee-name cells use normal font weight; Total labels and values remain bold.
- Every direct cell in a body row must share the row's base and hover surfaces.
- Light surfaces must use semantic Card/Accent mixtures; do not use Muted for body-row hover.
- Brand and Gradient Brand surfaces must use semantic Primary/Primary Foreground mixtures.
- Do not change Payload schema, fee data, normalization, calculations, downloads, tabs, or section layout.
- Complete the project-context update/check loop after implementation.

---

### Task 1: Unify desktop fee-row surfaces and typography

**Files:**
- Modify: `tests/int/fee-structure.int.spec.tsx`
- Modify: `src/blocks/FeeStructure/FeeStructureClient.tsx`

**Interfaces:**
- Consumes: `FeeStructureRowEmphasis`, `isBrandSurface`, `TableRow`, `TableHead`, and `TableCell`.
- Produces: `feeRowSurfaceClasses`, a static light/brand × standard/total class map applied to every direct table-body cell.

- [ ] **Step 1: Replace the existing row-hover assertions with failing unified-cell contracts**

In `tests/int/fee-structure.int.spec.tsx`, replace the body-row portion of `keeps header, standard, and total hover states consistent on %s surfaces` with:

```tsx
const expectedStandardSurface =
  background === 'brand'
    ? '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_6%)]'
    : '[&>*]:bg-card'
const expectedStandardHover =
  background === 'brand'
    ? 'hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_12%)]'
    : 'hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_40%)]'
const expectedTotalSurface =
  background === 'brand'
    ? '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_10%)]'
    : '[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_55%)]'
const expectedTotalHover =
  background === 'brand'
    ? 'hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_18%)]'
    : 'hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_75%)]'

expect(standard?.className).toContain(expectedStandardSurface)
expect(standard?.className).toContain(expectedStandardHover)
expect(total?.className).toContain(expectedTotalSurface)
expect(total?.className).toContain(expectedTotalHover)
expect(standardLabel?.className).toContain('font-normal')
expect(standardLabel?.className).not.toContain('font-medium')
expect(total?.className).toContain('font-bold')
expect(totalLabel?.className).toContain('font-bold')
expect(standardLabel?.className).not.toContain('bg-card')
expect(totalLabel?.className).not.toContain('bg-muted')
```

Keep the existing assertion that the top header row is stable:

```tsx
expect(header?.className).toContain(
  background === 'brand' ? 'hover:bg-primary-foreground/[0.08]' : 'hover:bg-transparent',
)
```

- [ ] **Step 2: Run the focused test and confirm the intended failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: FAIL because body rows still place hover/background classes on the `tr`, the sticky fee-name cell still owns a conflicting background, and standard fee names still use `font-medium`.

- [ ] **Step 3: Add the static semantic body-row surface map**

In `src/blocks/FeeStructure/FeeStructureClient.tsx`, add this constant after `resolveFeeStructureTabVariant`:

```tsx
const feeRowSurfaceClasses = {
  light: {
    standard:
      '[&>*]:bg-card hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_40%)]',
    total:
      '[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_55%)] hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_75%)]',
  },
  brand: {
    standard:
      '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_6%)] hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_12%)]',
    total:
      '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_10%)] hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_18%)]',
  },
} as const
```

These are fully opaque mixes, so the sticky cell continues to mask content moving beneath it.

- [ ] **Step 4: Apply one surface to every direct body-row cell**

Inside `FeeCategoryPresentation`, resolve the table surface once:

```tsx
const tableSurface = isBrandSurface ? 'brand' : 'light'
```

Replace the body `TableRow` class with:

```tsx
className={cn(
  'hover:bg-transparent',
  isBrandSurface && 'border-primary-foreground/20',
  feeRowSurfaceClasses[tableSurface][row.emphasis],
  row.emphasis === 'total' && 'font-bold',
)}
```

The direct-child selectors make the sticky `th` and every value `td` use the same normal and row-hover background.

- [ ] **Step 5: Remove the sticky body's competing background and correct label weight**

Replace the body `TableHead` class branch with:

```tsx
className={cn(
  'sticky left-0 z-10 h-auto py-3 text-left whitespace-normal',
  row.emphasis === 'total' ? 'font-bold' : 'font-normal',
  isBrandSurface ? 'text-primary-foreground' : 'text-card-foreground',
)}
```

Do not modify the `TableHead` inside the top header row. Do not modify the mobile card markup.

- [ ] **Step 6: Format and run the focused test**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/FeeStructure/FeeStructureClient.tsx \
  tests/int/fee-structure.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: all Fee Structure tests pass.

---

### Task 2: Refresh documentation, preview, and verification

**Files:**
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`
- Modify (generated if hash changes): `.agents/skills/project-context/references/project-inventory.json`
- Replace: `public/block-thumbnails/fee-structure.jpg`

**Interfaces:**
- Consumes: the completed row-surface and typography behavior.
- Produces: current operator documentation, project context, and a verified block-picker preview.

- [ ] **Step 1: Correct the maintained behavior wording**

In `.agents/skills/project-context/references/block-system.md`, replace:

```markdown
Standard fee heads remain medium, Total rows are bold, and explicit light/brand hover states preserve row emphasis.
```

with:

```markdown
Standard fee-name cells use normal weight, Total rows are bold, and every body-row cell shares the same opaque light/brand base and hover surface so the sticky fee-name column remains visually continuous.
```

In `docs/guides/blocks.md`, replace the equivalent `standard fee heads use medium weight` wording with:

```markdown
standard fee-name cells use normal weight, Total rows are bold, and every desktop body row uses one continuous base and hover surface across its sticky label and value cells
```

- [ ] **Step 2: Regenerate only the Fee Structure thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=feeStructure pnpm generate:block-thumbnails
```

Expected: `✓ feeStructure -> public/block-thumbnails/fee-structure.jpg`. Inspect the 1600×900 JPEG and confirm standard labels are regular weight and the Total row has one continuous surface.

- [ ] **Step 3: Run the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` The known stale knowledge-graph warning may remain.

- [ ] **Step 4: Run focused integration and static verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/project-context-repository.int.spec.ts \
  --reporter=dot
pnpm exec tsc --noEmit --pretty false
pnpm lint
git diff --check
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout \
  src/blocks/FeeStructure/FeeStructureClient.tsx
```

Expected: focused tests, TypeScript, lint, and diff checks pass; the layout detector returns `[]`. The existing unchanged Google Tag Manager lint advisory may remain as a warning.

- [ ] **Step 5: Inspect the final shared working tree without changing the index**

Run:

```bash
git diff --stat
git status --short
git diff --cached --name-only
```

Expected: the Fee Structure row-surface correction appears only as working-tree changes layered over the user's existing staged work. Do not stage, unstage, or commit any file.
