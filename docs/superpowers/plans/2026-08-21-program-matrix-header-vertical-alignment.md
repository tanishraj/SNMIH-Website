# Program Matrix Header Vertical Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let editors align the Program Matrix introduction to the top, center, or bottom of its Split-layout column while preserving current Stacked and compact behavior.

**Architecture:** Add one conditional Payload select field named `headerVerticalAlignment`, normalize it in the existing Program Matrix renderer, and apply a large-screen `self-*` class only to the introduction grid item. Keep the matrix, DOM order, horizontal placement, and all action behavior unchanged.

**Tech Stack:** Payload CMS 3, React 19, Next.js 15, TypeScript, Tailwind CSS 4, Vitest, pnpm

## Global Constraints

- Follow `.agents/skills/project-context/SKILL.md` and `.agents/skills/payload/SKILL.md` throughout implementation.
- Treat `docs/superpowers/specs/2026-08-21-program-matrix-header-vertical-alignment-design.md` as the approved product contract.
- Do not edit or stage the user-owned changes in `skills-lock.json` or `.agents/skills/content-research-writer/`.
- The new control is visible and active only for Split layout.
- Top is the schema default and the runtime fallback for missing or invalid values.
- Center and Bottom take effect only at the existing `lg` breakpoint.
- Apply vertical alignment only to the introduction wrapper; do not reposition the matrix.
- Preserve introduction-before-matrix JSX, reading order, focus order, horizontal placement, compact stacking, section actions, footer actions, and card behavior.
- No data migration or save-time rewrite is required.
- Use `apply_patch` for handwritten changes and generators only for generated artifacts.
- Use test-first steps and commit only files belonging to this feature.

---

## Task 1: Add and render Split header vertical alignment

**Files:**

- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `src/blocks/ProgramMatrix/config.ts`
- Modify: `src/blocks/ProgramMatrix/Component.tsx`

**Interfaces:**

- Consumes: existing `headerLayout?: 'split' | 'stacked' | null`, `isSplitHeader`, and the introduction wrapper marked by `data-program-matrix-intro="true"`.
- Produces: `headerVerticalAlignment?: 'top' | 'center' | 'bottom' | null` and normalized large-screen introduction alignment.

- [ ] **Step 1: Add the failing Payload schema contract**

In the existing `ProgramMatrixBlock schema` test, find `headerVerticalAlignment` directly in the
Theme Settings fields and add these assertions after the `headerPosition` assertions:

```ts
const headerVerticalAlignment = themeFields.find(
  (field) => 'name' in field && field.name === 'headerVerticalAlignment',
) as AdminField

expect(headerVerticalAlignment).toMatchObject({
  type: 'select',
  defaultValue: 'top',
  required: true,
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
  ],
})
expect(headerVerticalAlignment.admin?.condition?.({}, { headerLayout: 'split' })).toBe(true)
expect(headerVerticalAlignment.admin?.condition?.({}, { headerLayout: 'stacked' })).toBe(false)
```

- [ ] **Step 2: Add failing renderer contracts for default, invalid, center, bottom, and Stacked behavior**

Extend the existing layout tests with:

```ts
it('defaults missing and invalid split header vertical alignment to top', () => {
  const defaultHtml = renderToStaticMarkup(
    <ProgramMatrixBlockComponent headerLayout="split" items={baseItems} title="Programmes" />,
  )
  const invalidHtml = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      headerLayout="split"
      headerVerticalAlignment={'invalid' as never}
      items={baseItems}
      title="Programmes"
    />,
  )

  for (const html of [defaultHtml, invalidHtml]) {
    expect(html).toContain('data-program-matrix-header-vertical-alignment="top"')
    expect(html).toContain('lg:self-start')
    expect(html).not.toContain('lg:self-center')
    expect(html).not.toContain('lg:self-end')
  }
})

it.each([
  ['center', 'lg:self-center'],
  ['bottom', 'lg:self-end'],
] as const)('aligns a split introduction to the %s', (alignment, expectedClass) => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      headerLayout="split"
      headerVerticalAlignment={alignment}
      items={baseItems}
      title="Programmes"
    />,
  )

  expect(html).toContain(
    `data-program-matrix-header-vertical-alignment="${alignment}"`,
  )
  expect(html).toContain(expectedClass)
  expect(html.indexOf('data-program-matrix-intro="true"')).toBeLessThan(
    html.indexOf('data-program-matrix="true"'),
  )
})

it('ignores saved vertical alignment in Stacked layout', () => {
  const html = renderToStaticMarkup(
    <ProgramMatrixBlockComponent
      headerLayout="stacked"
      headerVerticalAlignment="bottom"
      items={baseItems}
      title="Programmes"
    />,
  )

  expect(html).toContain('data-program-matrix-layout="stacked"')
  expect(html).toContain('data-program-matrix-header-vertical-alignment="bottom"')
  expect(html).not.toContain('lg:self-start')
  expect(html).not.toContain('lg:self-center')
  expect(html).not.toContain('lg:self-end')
})
```

- [ ] **Step 3: Run the focused test and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because the schema field, prop, data attribute, and large-screen alignment classes do
not exist.

- [ ] **Step 4: Add the conditional Payload select field**

In `src/blocks/ProgramMatrix/config.ts`, insert this field immediately after `headerPosition` and
before `contentAlignment`:

```ts
{
  name: 'headerVerticalAlignment',
  label: 'Section Header Vertical Alignment',
  type: 'select',
  defaultValue: 'top',
  required: true,
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
  ],
  admin: {
    condition: isSplitHeader,
    description: 'Position the section introduction relative to the matrix on large screens.',
  },
} satisfies SelectField,
```

- [ ] **Step 5: Normalize the renderer prop and map it to large-screen self-alignment**

In `src/blocks/ProgramMatrix/Component.tsx`, add this type beside the existing block-like types:

```ts
type ProgramMatrixHeaderVerticalAlignment = 'top' | 'center' | 'bottom'
```

Add this property to `ProgramMatrixBlockLike`:

```ts
headerVerticalAlignment?: ProgramMatrixHeaderVerticalAlignment | null
```

Add this constant above `ProgramMatrixBlockComponent`:

```ts
const splitHeaderVerticalAlignmentClasses: Record<
  ProgramMatrixHeaderVerticalAlignment,
  string
> = {
  top: 'lg:self-start',
  center: 'lg:self-center',
  bottom: 'lg:self-end',
}
```

Destructure the prop with its schema-compatible default:

```ts
headerVerticalAlignment = 'top',
```

Normalize the runtime value immediately after `resolvedHeaderPosition`:

```ts
const resolvedHeaderVerticalAlignment: ProgramMatrixHeaderVerticalAlignment =
  headerVerticalAlignment === 'center' || headerVerticalAlignment === 'bottom'
    ? headerVerticalAlignment
    : 'top'
```

Add this conditional class to the existing introduction wrapper, after its right-side placement
class:

```ts
usesSplitHeader && splitHeaderVerticalAlignmentClasses[resolvedHeaderVerticalAlignment]
```

Add this stable data attribute to that same wrapper:

```tsx
data-program-matrix-header-vertical-alignment={resolvedHeaderVerticalAlignment}
```

Do not remove the outer grid's existing `lg:items-start`; the per-item `lg:self-*` class intentionally
overrides it only for the introduction.

- [ ] **Step 6: Format the handwritten TypeScript files**

Run:

```bash
pnpm exec prettier --write src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
```

Expected: the three files are formatted without errors.

- [ ] **Step 7: Rerun the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: PASS, including Top, Center, Bottom, invalid-value, Stacked, and DOM-order coverage.

- [ ] **Step 8: Commit the independently testable schema and renderer change**

```bash
git add src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx tests/int/program-matrix.int.spec.tsx
git commit -m "feat(program-matrix): align split header vertically"
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
- Modify: `.agents/skills/project-context/references/project-inventory.json` (generated)

**Interfaces:**

- Consumes: `headerVerticalAlignment` from Task 1.
- Produces: synchronized generated Payload types, picker preview, operator documentation, and project context.

- [ ] **Step 1: Add failing artifact and documentation assertions**

In `Program Matrix registration`, add:

```ts
expect(payloadTypesSource).toContain(
  "headerVerticalAlignment?: ('top' | 'center' | 'bottom') | null",
)
```

In `Program Matrix catalogs`, add:

```ts
expect(thumbnailFixturesSource).toContain('headerVerticalAlignment="center"')
expect(blocksGuideSource).toContain('top, center, or bottom vertical positioning')
expect(featureInventorySource).toContain('top, center, or bottom')
```

- [ ] **Step 2: Run the focused test and verify artifact assertions fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx
```

Expected: FAIL because generated types, fixture, and documentation do not yet contain the new
alignment contract.

- [ ] **Step 3: Demonstrate Center alignment in the thumbnail fixture**

In the `programMatrix` entry in `src/block-thumbnails/fixtures.tsx`, add this prop beside
`headerPosition="left"`:

```tsx
headerVerticalAlignment="center"
```

- [ ] **Step 4: Update operator and architecture documentation**

Change the Program Matrix guide row in `docs/guides/blocks.md` to:

```md
| Program Matrix | Academic programmes or structured offerings | Stacked or 40/60 split introduction beside a seamless one/two-column matrix, with left/right placement, top, center, or bottom vertical positioning, flexible Lucide icons, semantic card backgrounds, and one optional per-card Link or Button action |
```

Replace the current Program Matrix paragraph in `docs/architecture/feature-inventory.md` with:

```md
Program Matrix supports a stacked introduction or a 40/60 split at large breakpoints, with the introduction on either visual side and top, center, or bottom vertical positioning. The introduction remains first in document order, and every programme card can independently expose one optional Link or Button action.
```

Replace the current Program Matrix paragraph in
`.agents/skills/project-context/references/block-system.md` with:

```md
Program Matrix keeps its introduction before the matrix and footer actions in document order. Editors
can use a stacked layout or a large-screen 40/60 split with the introduction on either visual side
and aligned to the top, center, or bottom of its column. Each card owns at most one optional Link or
Button action; hidden legacy link and block-wide action fields remain registered only for saved-content
compatibility.
```

- [ ] **Step 5: Generate Payload types and normalize repository formatting**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write --ignore-path /dev/null src/payload-types.ts
rg -n "headerVerticalAlignment|interface ProgramMatrixBlock" src/payload-types.ts
```

Expected: generation succeeds; `ProgramMatrixBlock` contains optional
`headerVerticalAlignment?: ('top' | 'center' | 'bottom') | null`; the generated select interface also
contains `headerVerticalAlignment?: T`; unrelated type definitions do not show formatting churn.

- [ ] **Step 6: Verify the Payload import map remains valid**

Run:

```bash
pnpm generate:importmap
```

Expected: PASS with `No new imports found, skipping writing import map` because no custom Admin
component was added.

- [ ] **Step 7: Regenerate the Program Matrix picker thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=programMatrix pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/program-matrix.jpg` is regenerated successfully.

- [ ] **Step 8: Inspect the generated thumbnail once**

Open `public/block-thumbnails/program-matrix.jpg` with the workspace image viewer and verify:

- the introduction is vertically centered against the matrix at 1600×900;
- the existing 40/60 proportions and left-side placement remain intact;
- all card copy, dividers, and actions are legible and unclipped.

- [ ] **Step 9: Update and verify project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the generated inventory is synchronized and the check reports `Project context is current`.
A stale knowledge-graph warning is informational and does not fail this scoped block change.

- [ ] **Step 10: Run the focused and neighboring block contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/program-matrix.int.spec.tsx tests/int/button-primary-variant.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: all selected test files PASS.

- [ ] **Step 11: Run lint and TypeScript validation**

Run:

```bash
pnpm exec eslint src/blocks/ProgramMatrix/config.ts src/blocks/ProgramMatrix/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/program-matrix.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: both commands exit 0 without errors.

- [ ] **Step 12: Audit the scoped diff and preserved user changes**

Run:

```bash
git diff --check
git status --short
```

Confirm that:

- the schema exposes Top, Center, and Bottom only for Split;
- Top is the default and invalid-value fallback;
- only the introduction receives an `lg:self-*` class;
- Stacked and compact layouts receive no vertical-alignment class;
- the matrix and introduction DOM order are unchanged;
- generated types, fixture, thumbnail, docs, and project context are synchronized;
- `skills-lock.json` and `.agents/skills/content-research-writer/` remain outside feature commits.

- [ ] **Step 13: Commit artifacts and documentation**

```bash
git add tests/int/program-matrix.int.spec.tsx src/block-thumbnails/fixtures.tsx src/payload-types.ts public/block-thumbnails/program-matrix.jpg docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/plans/2026-08-21-program-matrix-header-vertical-alignment.md
git commit -m "docs(program-matrix): document header alignment"
```

- [ ] **Step 14: Run the final clean-state verification**

Run:

```bash
pnpm project-context:check
git diff --check c9fe707..HEAD
git status --short
git log --oneline c9fe707..HEAD
```

Expected: project context is current, the committed feature diff has no whitespace errors, and the
only remaining worktree entries are the pre-existing `skills-lock.json` modification and untracked
`.agents/skills/content-research-writer/` directory.
