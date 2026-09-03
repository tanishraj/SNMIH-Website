# Program Matrix Column Count Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let editors configure one to four Program Matrix columns, defaulting to two, with one mobile column, a two-column tablet cap, and the selected count on desktop.

**Architecture:** Add one required Payload select named `columns`, normalize it in the existing renderer, and resolve explicit Tailwind grid classes from a static map. Replace the two-column-specific divider calculation with a breakpoint-aware helper so tablet and desktop borders remain seamless for complete and incomplete rows.

**Tech Stack:** Payload CMS 3, React 19, Next.js 15, TypeScript, Tailwind CSS 4, Vitest, pnpm

## Global Constraints

- Follow `.agents/skills/project-context/SKILL.md` and `.agents/skills/payload/SKILL.md` throughout implementation.
- Treat `docs/superpowers/specs/2026-08-21-program-matrix-column-count-design.md` as the approved product contract.
- Do not edit or stage the user-owned changes in `skills-lock.json` or `.agents/skills/content-research-writer/`.
- The available values are exactly `1`, `2`, `3`, and `4`; the schema default and malformed-value fallback are `2`.
- Mobile always renders one column, tablet renders at most two, and desktop renders the selected count.
- Apply the setting in both Stacked and Split header layouts.
- Preserve the rounded outer border and correct internal bottom/right dividers for complete and incomplete rows.
- Calculate grid positions from the filtered rendered items, not the raw authored array.
- Preserve introduction-before-matrix JSX, reading order, header placement/alignment, actions, card surfaces, and footer behavior.
- Do not add a migration, custom Admin component, per-breakpoint controls, card spans, masonry, or more than four columns.
- Use `apply_patch` for handwritten changes and generators only for generated artifacts.
- Use test-first steps and commit only files belonging to this feature.

---

## Task 1: Add the column schema and responsive renderer behavior

**Files:**

- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/config.ts`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`

**Interfaces:**

- Consumes: the existing filtered `resolvedItems` list and Program Matrix grid wrapper.
- Produces: `columns?: '1' | '2' | '3' | '4' | null`, `data-program-matrix-columns`, explicit responsive grid classes, and breakpoint-aware divider markers/classes.

- [ ] **Step 1: Add the failing Payload schema contract**

In the existing `ProgramMatrixBlock schema` test, add these assertions after the header vertical-alignment contract:

```ts
const columns = themeFields.find((field) => 'name' in field && field.name === 'columns')
expect(columns).toMatchObject({
  label: 'Number of Columns',
  type: 'select',
  defaultValue: '2',
  required: true,
  options: [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
  ],
})
```

- [ ] **Step 2: Add failing grid-class and fallback contracts**

Add this renderer test beside the current layout tests:

```ts
it.each([
  [undefined, '2', 'md:grid-cols-2 lg:grid-cols-2'],
  ['1', '1', 'md:grid-cols-1 lg:grid-cols-1'],
  ['2', '2', 'md:grid-cols-2 lg:grid-cols-2'],
  ['3', '3', 'md:grid-cols-2 lg:grid-cols-3'],
  ['4', '4', 'md:grid-cols-2 lg:grid-cols-4'],
] as const)('renders %s configured columns as a responsive %s-column matrix', (
  columns,
  resolvedColumns,
  expectedClasses,
) => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent columns={columns} items={baseItems} title="Programmes" />,
  )

  expect(html).toContain(`data-program-matrix-columns="${resolvedColumns}"`)
  expect(html).toContain(expectedClasses)
})

it('falls back to two columns for malformed saved values', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      columns={'invalid' as never}
      items={baseItems}
      title="Programmes"
    />,
  )

  expect(html).toContain('data-program-matrix-columns="2"')
  expect(html).toContain('md:grid-cols-2 lg:grid-cols-2')
})
```

- [ ] **Step 3: Replace the old two-column divider test with failing breakpoint-aware contracts**

Replace `marks an odd final row for correct desktop dividers` with:

```ts
it('calculates tablet and desktop dividers from the filtered rendered items', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      columns="3"
      items={[...baseItems, { title: '   ' }]}
      title="Programmes"
    />,
  )

  expect(html.match(/data-program-matrix-item="true"/g)).toHaveLength(4)
  expect(html.match(/data-tablet-row-end="true"/g)).toHaveLength(2)
  expect(html.match(/data-tablet-last-row="true"/g)).toHaveLength(2)
  expect(html.match(/data-desktop-row-end="true"/g)).toHaveLength(1)
  expect(html.match(/data-desktop-last-row="true"/g)).toHaveLength(1)
})

it('keeps right dividers on cards in an incomplete final desktop row', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      columns="3"
      items={[...baseItems, { title: 'Physiotherapy' }]}
      title="Programmes"
    />,
  )

  expect(html.match(/data-desktop-last-row="true"/g)).toHaveLength(2)
  expect(html.match(/data-desktop-row-end="true"/g)).toHaveLength(1)
  expect(html).toContain('lg:border-b-0 lg:border-r')
})
```

Update the first semantic renderer assertion from:

```ts
expect(html).toContain('md:grid-cols-2')
```

to:

```ts
expect(html).toContain('data-program-matrix-columns="2"')
expect(html).toContain('md:grid-cols-2 lg:grid-cols-2')
```

- [ ] **Step 4: Run the focused test and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because `columns`, its responsive classes, and the breakpoint-aware divider attributes do not exist.

- [ ] **Step 5: Add the required Payload select**

In `src/blocks/ProgramMatrix/config.ts`, insert this field after `headerVerticalAlignment` and before `contentAlignment`:

```ts
{
  name: 'columns',
  label: 'Number of Columns',
  type: 'select',
  defaultValue: '2',
  required: true,
  options: [
    { label: '1', value: '1' },
    { label: '2', value: '2' },
    { label: '3', value: '3' },
    { label: '4', value: '4' },
  ],
  admin: {
    description: 'Use one column on mobile, up to two on tablet, and this count on desktop.',
  },
} satisfies SelectField,
```

- [ ] **Step 6: Add the renderer types, class map, and grid-position helper**

In `src/blocks/ProgramMatrix/Component.tsx`, add:

```ts
type ProgramMatrixColumnCount = '1' | '2' | '3' | '4'

type GridCellPosition = {
  isLastRow: boolean
  isRowEnd: boolean
}
```

Add this property to `ProgramMatrixBlockLike`:

```ts
columns?: ProgramMatrixColumnCount | null
```

Add these constants and helper above `ProgramMatrixBlockComponent`:

```ts
const programMatrixGridClasses: Record<ProgramMatrixColumnCount, string> = {
  '1': 'md:grid-cols-1 lg:grid-cols-1',
  '2': 'md:grid-cols-2 lg:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 lg:grid-cols-4',
}

const resolveGridCellPosition = (
  index: number,
  itemCount: number,
  columnCount: number,
): GridCellPosition => {
  const lastRowStart = itemCount - (itemCount % columnCount || columnCount)

  return {
    isLastRow: index >= lastRowStart,
    isRowEnd: (index + 1) % columnCount === 0,
  }
}
```

- [ ] **Step 7: Normalize the setting and apply its static grid classes**

Destructure the prop with its schema-compatible default:

```ts
columns = '2',
```

After the existing header normalization, add:

```ts
const resolvedColumns: ProgramMatrixColumnCount =
  columns === '1' || columns === '3' || columns === '4' ? columns : '2'
const desktopColumnCount = Number(resolvedColumns)
const tabletColumnCount = Math.min(desktopColumnCount, 2)
```

Replace the matrix wrapper's fixed `md:grid-cols-2` class with:

```ts
className={cn(
  'grid overflow-hidden rounded-[var(--radius)] border bg-transparent text-current',
  programMatrixGridClasses[resolvedColumns],
  isBrandSurface ? 'border-current/15' : 'border-current/10',
  usesSplitHeader &&
    resolvedHeaderPosition === 'right' &&
    'lg:col-start-1 lg:row-start-1',
)}
data-program-matrix="true"
data-program-matrix-columns={resolvedColumns}
```

- [ ] **Step 8: Replace the two-column divider calculation and classes**

Inside `resolvedItems.map`, replace `isLeftColumn`, `lastDesktopRowStart`, and `isLastDesktopRow` with:

```ts
const tabletPosition = resolveGridCellPosition(
  index,
  resolvedItems.length,
  tabletColumnCount,
)
const desktopPosition = resolveGridCellPosition(
  index,
  resolvedItems.length,
  desktopColumnCount,
)
```

Replace the old divider classes and data attributes on `<article>` with:

```tsx
className={cn(
  'flex min-w-0 flex-col p-6 text-left md:p-8',
  surface.className,
  surface.divider,
  !isLastItem && 'border-b',
  tabletPosition.isLastRow ? 'md:border-b-0' : 'md:border-b',
  tabletPosition.isRowEnd ? 'md:border-r-0' : 'md:border-r',
  desktopPosition.isLastRow ? 'lg:border-b-0' : 'lg:border-b',
  desktopPosition.isRowEnd ? 'lg:border-r-0' : 'lg:border-r',
)}
data-card-background={surface.value}
data-desktop-last-row={desktopPosition.isLastRow ? 'true' : undefined}
data-desktop-row-end={desktopPosition.isRowEnd ? 'true' : undefined}
data-program-matrix-item="true"
data-tablet-last-row={tabletPosition.isLastRow ? 'true' : undefined}
data-tablet-row-end={tabletPosition.isRowEnd ? 'true' : undefined}
```

Remove `data-left-column` and `data-last-desktop-row`; their two-column meanings are replaced by the explicit breakpoint markers.

- [ ] **Step 9: Format and run the focused test**

Run:

```bash
pnpm exec prettier --write src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: formatting succeeds and the complete Program Matrix suite passes.

- [ ] **Step 10: Commit the independently testable behavior**

```bash
git add src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
git commit -m "feat(program-matrix): configure responsive columns"
```

---

## Task 2: Refresh generated artifacts, documentation, and final contracts

**Files:**

- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `src/payload-types.ts` (generated)
- Modify: `public/block-thumbnails/program-matrix.jpg` (generated)
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify if generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the schema and renderer contract from Task 1.
- Produces: synchronized generated Payload types, a three-column preview fixture/thumbnail, operator documentation, project knowledge, and final regression evidence.

- [ ] **Step 1: Add failing generated-artifact and documentation contracts**

Extend the existing artifact/catalog tests in `tests/int/program-matrix.int.spec.tsx` with:

```ts
expect(payloadTypesSource).toContain("columns: '1' | '2' | '3' | '4'")
expect(thumbnailFixturesSource).toContain('columns="3"')
expect(featureInventorySource).toContain('one to four responsive columns')
expect(blocksGuideSource).toContain('one to four responsive matrix columns')
```

- [ ] **Step 2: Run the focused test and verify only artifact/catalog contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: the new generated-type, fixture, feature-inventory, and guide assertions fail while Task 1 behavior remains green.

- [ ] **Step 3: Update the thumbnail fixture to exercise three desktop columns**

In the `programMatrix` fixture in `src/block-thumbnails/fixtures.tsx`, add:

```tsx
columns="3"
```

Keep the approved Split header and Center vertical alignment so the thumbnail exercises both compatible controls.

- [ ] **Step 4: Update the three maintained narrative references**

Update the Program Matrix row in `docs/guides/blocks.md` to mention `one to four responsive matrix columns`, while retaining Split/Stacked headers, horizontal/vertical header placement, flexible icons, semantic card backgrounds, and optional per-card actions.

Update the Program Matrix paragraph in `docs/architecture/feature-inventory.md` to state that editors can select `one to four responsive columns`, with one mobile column, a two-column tablet cap, and the selected desktop count.

Update the Program Matrix paragraph in `.agents/skills/project-context/references/block-system.md` with the same runtime contract and note that divider geometry follows the effective breakpoint count.

- [ ] **Step 5: Regenerate Payload types and the import map**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write --ignore-path /dev/null src/payload-types.ts
pnpm generate:importmap
```

Expected: generated `ProgramMatrixBlock` includes `columns: '1' | '2' | '3' | '4'`; the import-map command completes and may report that no new imports were found.

- [ ] **Step 6: Regenerate and visually inspect only the Program Matrix thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=programMatrix pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/program-matrix.jpg` is refreshed at 1600×900. Inspect it and confirm three matrix columns appear on desktop, copy remains readable, the Center-aligned Split introduction is intact, dividers are unbroken, and no content is clipped.

- [ ] **Step 7: Refresh and validate project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `project-inventory.json` is refreshed if its digest changed and the check reports `Project context is current.` A stale knowledge-graph commit warning is non-blocking unless structural architecture changed.

- [ ] **Step 8: Run focused, neighboring, lint, and type verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx tests/int/button-primary-variant.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
pnpm exec eslint src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: every command passes.

- [ ] **Step 9: Audit the final diff and commit artifacts/documentation**

Run:

```bash
git diff --check
git status --short
```

Confirm only this feature's files are staged. Leave `skills-lock.json` and `.agents/skills/content-research-writer/` unstaged.

Commit:

```bash
git add tests/int/program-matrix.int.spec.tsx src/block-thumbnails/fixtures.tsx src/payload-types.ts public/block-thumbnails/program-matrix.jpg docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-08-21-program-matrix-column-count.md
git commit -m "docs(program-matrix): document responsive columns"
```

- [ ] **Step 10: Perform the final repository audit**

Run:

```bash
pnpm project-context:check
git diff --check 66871db..HEAD
git status --short
git log --oneline 66871db..HEAD
```

Expected: project context is current; the commit range has no whitespace errors; the only remaining worktree entries are the user-owned `skills-lock.json` modification and `.agents/skills/content-research-writer/` directory; and the log contains the behavior and artifact commits.
