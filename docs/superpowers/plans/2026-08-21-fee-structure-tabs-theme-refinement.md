# Fee Structure Tabs and Theme Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Fee Structure categories use the existing shared content-tab design, make fee surfaces readable on Brand and Gradient Brand sections, and right-align every fee value including em-dash placeholders.

**Architecture:** Keep the existing Fee Structure schema and saved tab-style values unchanged. Map those values onto `contentTabRail.ts`, pass the resolved section background from the server component to the client renderer, and choose semantic light/brand presentation classes in one client component. Preserve Radix tab semantics while removing Fee Structure's duplicate tab style maps.

**Tech Stack:** Next.js 16, React 19, TypeScript, Payload CMS 3, Tailwind CSS 4 semantic tokens, Radix Tabs, Vitest, Testing Library.

## Global Constraints

- Do not stage or commit any changes.
- Preserve stored `underline`, `pills`, and `boxed` values; do not run a content migration.
- Map `underline` to `underline`, `pills` to `pill`, and `boxed` to `contained`.
- Do not change fee data, calculations, normalization, document downloads, or authoring limits.
- Use semantic theme tokens only; do not hard-code SNMIH color values.
- Keep fee-head labels left-aligned and make every fee-value cell right-aligned.
- Numeric detection controls only `tabular-nums`; it must not control alignment.
- Preserve one-category direct rendering and multi-category accessible tab behavior.
- Run the project-context update/check loop after implementation.

---

### Task 1: Add failing tab, theme, and alignment contracts

**Files:**

- Modify: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Consumes: `FeeStructureBlockComponent`, current `FeeStructureTabStyle`, and rendered `data-fee-*` hooks.
- Produces: regression coverage for shared tab variants, brand surfaces, sticky cells, notes, totals, and unconditional fee-value alignment.

- [ ] **Step 1: Add shared-tab variant assertions to the multi-category test**

Extend the existing `uses accessible tabs for multiple categories and keeps notes category-owned` test so the `pills` value renders the shared `pill` variant:

```tsx
expect(container.querySelector('[data-fee-tab-style="pills"]')).toBeTruthy()
expect(container.querySelector('[data-content-tab-variant="pill"]')).toBeTruthy()
expect(screen.getByRole('tab', { name: 'General' }).className).toContain('min-h-11')
expect(screen.getByRole('tab', { name: 'General' }).className).toContain('rounded-full')
```

Add a separate compatibility test for `boxed`:

```tsx
it('maps legacy Fee Structure tab values onto the shared content-tab variants', () => {
  const { container } = render(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory, nriCategory]}
      programmeName="MBBS"
      tabStyle="boxed"
    />,
  )

  expect(container.querySelector('[data-fee-tab-style="boxed"]')).toBeTruthy()
  expect(container.querySelector('[data-content-tab-variant="contained"]')).toBeTruthy()
})
```

- [ ] **Step 2: Add light/brand surface assertions**

Add a test that renders Brand and Gradient Brand variants and checks every contrast-sensitive hook:

```tsx
it.each(['brand', 'gradient-brand'] as const)(
  'uses brand-compatible fee surfaces on %s sections',
  (background) => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        appearance={{ background, border: 'none' }}
        feeCategories={[generalCategory]}
        programmeName="MBBS"
      />,
    )

    const surface = container.querySelector('[data-fee-surface="brand"]')
    expect(surface?.className).toContain('text-primary-foreground')
    expect(surface?.className).toContain('border-primary-foreground/20')
    expect(container.querySelector('[data-fee-table-header="true"]')?.className).toContain(
      'bg-primary-foreground/[0.08]',
    )
    expect(container.querySelector('[data-fee-sticky-head="true"]')?.className).toContain(
      'bg-primary',
    )
    expect(container.querySelector('[data-fee-row-emphasis="total"]')?.className).toContain(
      'bg-primary-foreground/[0.1]',
    )
    expect(container.querySelector('[data-fee-period-card="true"]')?.className).toContain(
      'text-primary-foreground',
    )
    expect(container.querySelector('[data-fee-category-notes="true"]')?.className).toContain(
      'text-primary-foreground/75',
    )
  },
)
```

Add a light-surface assertion to prevent regressions:

```tsx
it('retains semantic card colors on light section surfaces', () => {
  const { container } = render(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory]}
      programmeName="MBBS"
    />,
  )

  const surface = container.querySelector('[data-fee-surface="light"]')
  expect(surface?.className).toContain('bg-card')
  expect(surface?.className).toContain('text-card-foreground')
  expect(surface?.className).toContain('border-border')
})
```

- [ ] **Step 3: Add unconditional value-alignment assertions**

Use the authored `—` value in `generalCategory` to prove that both desktop and mobile values align right while only numeric content receives tabular numerals:

```tsx
it('right-aligns every fee value while reserving tabular numerals for numeric values', () => {
  const { container } = render(
    <FeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[generalCategory]}
      programmeName="MBBS"
    />,
  )

  const values = Array.from(container.querySelectorAll('[data-fee-value="true"]'))
  const placeholders = values.filter((element) => element.textContent === '—')
  const numericValues = values.filter((element) => element.textContent === '12,75,000')

  expect(values.length).toBeGreaterThan(0)
  expect(values.every((element) => element.className.includes('text-right'))).toBe(true)
  expect(placeholders.length).toBeGreaterThan(0)
  expect(placeholders.every((element) => !element.className.includes('tabular-nums'))).toBe(true)
  expect(numericValues.every((element) => element.className.includes('tabular-nums'))).toBe(true)
})
```

- [ ] **Step 4: Run the focused test and confirm the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: FAIL because `data-content-tab-variant`, `data-fee-surface`, theme-specific classes, and `data-fee-value` are not implemented yet.

---

### Task 2: Reuse shared tabs and implement section-aware fee surfaces

**Files:**

- Modify: `src/blocks/FeeStructure/Component.tsx`
- Modify: `src/blocks/FeeStructure/FeeStructureClient.tsx`
- Test: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Consumes: `BlockBackground` and `resolveBlockSurface` from `blockAppearance.ts`; `ContentTabVariant`, `getContentTabClasses`, and `getContentTabRailClasses` from `contentTabRail.ts`.
- Produces: `FeeStructureClient({ categories, sectionBackground, tabStyle })`, `resolveFeeStructureTabVariant()`, and stable `data-fee-surface`, `data-fee-sticky-head`, `data-fee-table-header`, and `data-fee-value` hooks.

- [ ] **Step 1: Read the Impeccable craft floor immediately before editing UI**

Run:

```bash
cat .agents/skills/impeccable/reference/craft-floor.md
```

Expected: the complete refinement quality floor is available before changing the client component.

- [ ] **Step 2: Pass the resolved section background into the client renderer**

Update the client call in `src/blocks/FeeStructure/Component.tsx`:

```tsx
<FeeStructureClient
  categories={categories}
  sectionBackground={appearanceClasses.background}
  tabStyle={tabStyle}
/>
```

- [ ] **Step 3: Replace local tab class maps with the shared tab contract**

In `src/blocks/FeeStructure/FeeStructureClient.tsx`, add React state, Radix Tabs, block appearance, and shared-tab imports:

```tsx
import { useState } from 'react'
import { Tabs as TabsPrimitive } from 'radix-ui'

import {
  getContentTabClasses,
  getContentTabRailClasses,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import { resolveBlockSurface, type BlockBackground } from '@/blocks/shared/blockAppearance'
```

Remove the `@/components/ui/tabs` import and the local `tabListClasses` and `tabTriggerClasses` records. Replace `resolveTabStyle` with an explicit compatibility mapper:

```tsx
export const resolveFeeStructureTabVariant = (
  value?: FeeStructureTabStyle | null,
): ContentTabVariant => {
  if (value === 'pills') return 'pill'
  if (value === 'boxed') return 'contained'
  return 'underline'
}
```

Keep the stored style for `data-fee-tab-style`, but render the tab rail with the shared variant:

```tsx
const storedStyle = tabStyle === 'boxed' || tabStyle === 'pills' ? tabStyle : 'underline'
const variant = resolveFeeStructureTabVariant(storedStyle)
const [selectedCategoryID, setSelectedCategoryID] = useState(categories[0]!.id)
const activeCategoryID = categories.some(({ id }) => id === selectedCategoryID)
  ? selectedCategoryID
  : categories[0]!.id

return (
  <TabsPrimitive.Root
    className="flex flex-col gap-6"
    data-fee-categories="true"
    data-fee-tab-style={storedStyle}
    onValueChange={setSelectedCategoryID}
    value={activeCategoryID}
  >
    <div className="overflow-x-auto pb-1">
      <TabsPrimitive.List
        aria-label="Fee categories"
        className={cn('flex w-max min-w-full flex-nowrap', getContentTabRailClasses(variant))}
        data-content-tab-variant={variant}
      >
        {categories.map((category) => (
          <TabsPrimitive.Trigger
            className={getContentTabClasses(variant, category.id === activeCategoryID)}
            key={category.id}
            value={category.id}
          >
            {category.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </div>
    {categories.map((category) => (
      <TabsPrimitive.Content className="mt-0 outline-none" key={category.id} value={category.id}>
        <FeeCategoryPresentation category={category} sectionBackground={sectionBackground} />
      </TabsPrimitive.Content>
    ))}
  </TabsPrimitive.Root>
)
```

The one-category branch must also pass `sectionBackground` to `FeeCategoryPresentation`.

- [ ] **Step 4: Resolve the table and mobile-card surface once per category**

Change the presentation signature and compute the semantic surface:

```tsx
function FeeCategoryPresentation({
  category,
  sectionBackground,
}: {
  category: ResolvedFeeStructureCategory
  sectionBackground?: BlockBackground | null
}) {
  const isBrandSurface = resolveBlockSurface(sectionBackground) === 'brand'

  return (
    <div className="flex flex-col gap-6" data-fee-category={category.label}>
      {/* existing desktop table, mobile cards, and notes */}
    </div>
  )
}
```

Use these class branches for the desktop table wrapper:

```tsx
className={cn(
  'min-w-max overflow-hidden rounded-[var(--radius)] border',
  isBrandSurface
    ? 'border-primary-foreground/20 bg-primary-foreground/[0.06] text-primary-foreground'
    : 'border-border bg-card text-card-foreground',
)}
data-fee-surface={isBrandSurface ? 'brand' : 'light'}
```

Apply a branded header and explicit current-color headings:

```tsx
<TableHeader
  className={cn(isBrandSurface && '[&_tr]:border-primary-foreground/20')}
  data-fee-table-header="true"
>
  <TableRow
    className={cn(
      isBrandSurface && 'bg-primary-foreground/[0.08] hover:bg-primary-foreground/[0.08]',
    )}
  >
    <TableHead
      className={cn(
        'sticky left-0 z-20 min-w-56 text-left text-current',
        isBrandSurface ? 'bg-primary text-primary-foreground' : 'bg-card',
      )}
      data-fee-sticky-head="true"
    >
      Fee Head
    </TableHead>
    {category.columns.map((column) => (
      <TableHead className="min-w-36 text-right text-current" key={column.id}>
        {column.label}
      </TableHead>
    ))}
  </TableRow>
</TableHeader>
```

Apply section-aware row, sticky-cell, caption, and value classes:

```tsx
<TableRow
  className={cn(
    isBrandSurface
      ? 'border-primary-foreground/20 hover:bg-primary-foreground/[0.06]'
      : 'hover:bg-muted/50',
    row.emphasis === 'total' &&
      (isBrandSurface ? 'bg-primary-foreground/[0.1] font-semibold' : 'bg-muted/60 font-semibold'),
  )}
>
```

```tsx
<TableHead
  className={cn(
    'sticky left-0 z-10 h-auto py-3 text-left font-medium whitespace-normal',
    isBrandSurface ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground',
    row.emphasis === 'total' && 'font-semibold',
    row.emphasis === 'total' && !isBrandSurface && 'bg-muted',
  )}
  data-fee-sticky-head="true"
  scope="row"
>
```

```tsx
<TableCell
  className={cn('text-right', isNumericFeeValue(value) && 'tabular-nums')}
  data-fee-value="true"
  key={`${row.id}-${category.columns[index]?.id ?? index}`}
>
  {value}
</TableCell>
```

Render the caption and row notes with explicit section-aware tones:

```tsx
{
  category.caption ? (
    <TableCaption
      className={isBrandSurface ? 'text-primary-foreground/70' : 'text-muted-foreground'}
    >
      {category.caption}
    </TableCaption>
  ) : null
}
```

```tsx
{
  row.note ? (
    <span
      className={cn(
        'mt-1 block text-xs font-normal',
        isBrandSurface ? 'text-primary-foreground/65' : 'text-current/60',
      )}
    >
      {row.note}
    </span>
  ) : null
}
```

- [ ] **Step 5: Apply the same semantic branch to mobile cards and notes**

Use section-aware classes on the card, header divider, content dividers, total row, row note, and category notes:

```tsx
<Card
  className={cn(
    'gap-0 rounded-[var(--radius)] border py-0 shadow-none ring-0',
    isBrandSurface
      ? 'border-primary-foreground/20 bg-primary-foreground/[0.06] text-primary-foreground'
      : 'border-border bg-card text-card-foreground',
  )}
  data-fee-period-card="true"
  data-fee-surface={isBrandSurface ? 'brand' : 'light'}
>
```

```tsx
<CardHeader
  className={cn(
    'rounded-none border-b px-5 py-4',
    isBrandSurface ? 'border-primary-foreground/20 bg-primary-foreground/[0.08]' : 'border-border',
  )}
>
```

```tsx
<CardContent
  className={cn(
    'px-5',
    isBrandSurface ? 'divide-y divide-primary-foreground/20' : 'divide-y divide-border',
  )}
>
```

```tsx
<p className={cn('text-right', isNumericFeeValue(value) && 'tabular-nums')} data-fee-value="true">
  {value}
</p>
```

Apply the complete mobile row branch, including totals and notes:

```tsx
<div
  className={cn(
    'grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4',
    row.emphasis === 'total' &&
      (isBrandSurface
        ? '-mx-5 bg-primary-foreground/[0.1] px-5 font-semibold'
        : '-mx-5 bg-muted/60 px-5 font-semibold'),
  )}
  data-fee-row-emphasis={row.emphasis}
  key={row.id}
>
  <div>
    <p>{row.label}</p>
    {row.note ? (
      <p
        className={cn(
          'mt-1 text-xs font-normal',
          isBrandSurface ? 'text-primary-foreground/65' : 'text-muted-foreground',
        )}
      >
        {row.note}
      </p>
    ) : null}
  </div>
  <p className={cn('text-right', isNumericFeeValue(value) && 'tabular-nums')} data-fee-value="true">
    {value}
  </p>
</div>
```

Render category notes with a semantic surface tone and retain emphasized-note contrast:

```tsx
<ul
  className={cn(
    'flex flex-col gap-2 text-sm leading-6',
    isBrandSurface ? 'text-primary-foreground/75' : 'text-current/70',
  )}
  data-fee-category-notes="true"
>
  {category.notes.map((note) => (
    <li className={cn(note.emphasis && 'font-semibold text-current')} key={note.id}>
      {note.text}
    </li>
  ))}
</ul>
```

- [ ] **Step 6: Run focused tests and confirm the implementation passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx --reporter=dot
```

Expected: all Fee Structure tests pass, including the new shared-tab, brand-surface, and alignment contracts.

---

### Task 3: Refresh visual documentation and complete verification

**Files:**

- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` only if `project-context:update` changes it
- Replace: `public/block-thumbnails/fee-structure.jpg` if regenerated output differs
- Verify: `src/blocks/FeeStructure/Component.tsx`
- Verify: `src/blocks/FeeStructure/FeeStructureClient.tsx`
- Verify: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Consumes: the completed Fee Structure presentation and project-context scripts.
- Produces: current operator/architecture documentation, an updated picker preview, and a verified uncommitted working tree.

- [ ] **Step 1: Update the Fee Structure narrative contract**

Extend the Fee Structure paragraph in `.agents/skills/project-context/references/block-system.md` with this behavior:

```markdown
Multiple categories reuse the shared Contained, Pill, and Underline content-tab presentation while preserving the Fee Structure `boxed`, `pills`, and `underline` saved values through runtime mapping. Light sections use semantic card surfaces; Brand and Gradient Brand sections use primary-foreground overlays, borders, and text for the table and mobile cards. Every fee-value cell is right-aligned, including em-dash placeholders, while numeric values alone receive tabular numerals.
```

- [ ] **Step 2: Regenerate the block thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: the generator completes and `public/block-thumbnails/fee-structure.jpg` reflects the shared tab styling. Preserve unrelated generated thumbnails if they are unchanged; do not overwrite unrelated user work.

- [ ] **Step 3: Run focused block and renderer contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  --reporter=dot
```

Expected: all selected tests pass.

- [ ] **Step 4: Run static checks**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm lint
git diff --check
```

Expected: TypeScript and diff checks pass. ESLint has no errors; the existing unchanged Google Tag Manager advisory may remain as a warning.

- [ ] **Step 5: Complete the required project-context loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `Project context is current.` A stale knowledge-graph warning is allowed by the project-context skill.

- [ ] **Step 6: Inspect final scope and staging state**

Run:

```bash
git diff --stat
git diff --check
git status --short
git diff --cached --name-only
```

Expected: only the approved Fee Structure refinement, its tests/docs/thumbnail, the already approved uncommitted Fee Structure implementation, and pre-existing user changes are present. `git diff --cached --name-only` prints nothing, and no commit is created.
