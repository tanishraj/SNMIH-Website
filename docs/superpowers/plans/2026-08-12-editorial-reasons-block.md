# Editorial Reasons Layout Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Editorial Reasons block with three split proportions, a full-width layout, standard section content alignment, left/right list placement, a responsive one-to-four-column reasons grid, and surface-aware green number accents.

**Architecture:** Keep the feature inside the existing `EditorialReasons` Payload config and server component. Payload owns the editor choices and hides split-only controls in Full Width mode; the renderer validates old or missing values, maps them to static Tailwind class contracts, preserves introduction-first DOM order, and reuses the existing `data-section-eyebrow-surface` theme hook for number color. No new theme token, client component, migration, or dependency is required.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19 server components, TypeScript, Tailwind CSS 4, Vitest, and the existing Playwright thumbnail generator.

## Global Constraints

- Preserve all current Editorial Reasons content, typography, appearance, spacing, action, link, sticky, and registration behavior unless this plan explicitly changes it.
- Add `layoutProportion` values `listFocus`, `balanced`, `introFocus`, and `fullWidth`; default to `listFocus`.
- Label the four choices **List Focus (40 / 60)**, **Balanced (50 / 50)**, **Introduction Focus (60 / 40)**, and **Full Width**.
- Add `listPosition` values `right` and `left`; default to `right` and expose it only for split layouts.
- Hide `introVerticalAlignment` and `stickyIntro` in the admin when `layoutProportion` is `fullWidth`.
- Full Width always renders the introduction above a container-wide reasons grid and ignores list position, vertical alignment, and sticky values, including stale stored values.
- Split layouts stack introduction-first below `lg`.
- `listColumns` selects an explicit desktop count from one through four; multi-column layouts stack
  responsively on smaller screens.
- `listBorderStyle` selects Open, Ruled, or Framed; default to Ruled and validate stale values back
  to that default.
- Section Content Alignment applies to eyebrow, heading, description, and actions together.
- Put generated numbers beside content in One Column and above content in multi-column layouts;
  preserve `aria-hidden="true"`.
- Reuse `data-section-eyebrow-surface` and existing SNMIH theme selectors for number accents; add no token and no hard-coded component color.
- Other themes retain `text-current/65` as the number fallback.
- Keep all files unstaged and uncommitted until the user explicitly requests otherwise.

## File Map

- Modify `src/blocks/EditorialReasons/config.ts` for section content alignment, one-to-four list
  columns, four layout choices, list placement, and conditional controls.
- Modify `src/blocks/EditorialReasons/Component.tsx` for validated layout mappings, visual ordering,
  aligned introduction content, responsive one-to-four-column list rules, and number surface hooks.
- Modify `tests/int/editorial-reasons.int.spec.tsx` for schema and renderer regression coverage.
- Regenerate `src/payload-types.ts` after the schema changes.
- Modify `src/block-thumbnails/fixtures.tsx` only if an explicit non-default fixture value improves catalog coverage.
- Regenerate `public/block-thumbnails/editorial-reasons.jpg` to show the approved default two-column composition.
- Modify `docs/guides/blocks.md` to document the new controls.
- Keep `docs/superpowers/specs/2026-08-12-editorial-reasons-block-design.md` synchronized with the approved behavior.

---

### Task 1: Add the Payload layout controls

**Files:**

- Modify: `src/blocks/EditorialReasons/config.ts`
- Test: `tests/int/editorial-reasons.int.spec.tsx`

**Interfaces:**

- Consumes: Payload `SelectField` and sibling-data `admin.condition` behavior.
- Produces: `layoutProportion` and `listPosition` fields plus split-only visibility conditions.

- [ ] **Step 1: Write failing schema assertions**

Extend the existing theme-control test with exact field contracts:

```ts
expect(findNamedField(EditorialReasonsBlock.fields, 'layoutProportion')).toMatchObject({
  type: 'select',
  defaultValue: 'listFocus',
  required: true,
  options: [
    { label: 'List Focus (40 / 60)', value: 'listFocus' },
    { label: 'Balanced (50 / 50)', value: 'balanced' },
    { label: 'Introduction Focus (60 / 40)', value: 'introFocus' },
    { label: 'Full Width', value: 'fullWidth' },
  ],
})

expect(findNamedField(EditorialReasonsBlock.fields, 'listPosition')).toMatchObject({
  type: 'select',
  defaultValue: 'right',
  required: true,
  options: [
    { label: 'Right', value: 'right' },
    { label: 'Left', value: 'left' },
  ],
})
```

Read the three fields as `SelectField` / `CheckboxField`, call their `admin.condition` callbacks with
`{ layoutProportion: 'listFocus' }` and `{ layoutProportion: 'fullWidth' }`, and assert that
`listPosition`, `introVerticalAlignment`, and `stickyIntro` are visible only for the split value.

- [ ] **Step 2: Run the focused schema test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/editorial-reasons.int.spec.tsx -t 'approved theme controls'
```

Expected: FAIL because `layoutProportion` and `listPosition` do not exist and the existing controls
do not have split-layout conditions.

- [ ] **Step 3: Implement the schema controls**

Add these types and condition near the current sibling-data helpers:

```ts
type EditorialReasonsLayoutSiblingData = {
  layoutProportion?: 'balanced' | 'fullWidth' | 'introFocus' | 'listFocus' | null
}

const isSplitLayout = (_data: unknown, siblingData: EditorialReasonsLayoutSiblingData) =>
  siblingData?.layoutProportion !== 'fullWidth'
```

Insert these fields immediately after the shared action-mode field:

```ts
{
  name: 'layoutProportion',
  label: 'Layout Proportion',
  type: 'select',
  defaultValue: 'listFocus',
  required: true,
  options: [
    { label: 'List Focus (40 / 60)', value: 'listFocus' },
    { label: 'Balanced (50 / 50)', value: 'balanced' },
    { label: 'Introduction Focus (60 / 40)', value: 'introFocus' },
    { label: 'Full Width', value: 'fullWidth' },
  ],
  admin: {
    description: 'Controls the introduction and numbered-list proportions on large screens.',
  },
} satisfies SelectField,
{
  name: 'listPosition',
  label: 'List Position',
  type: 'select',
  defaultValue: 'right',
  required: true,
  options: [
    { label: 'Right', value: 'right' },
    { label: 'Left', value: 'left' },
  ],
  admin: { condition: isSplitLayout },
} satisfies SelectField,
```

Add `condition: isSplitLayout` to the existing `admin` objects for `introVerticalAlignment` and
`stickyIntro`. Keep their current descriptions and defaults.

- [ ] **Step 4: Run the schema tests**

Run:

```bash
pnpm exec vitest run tests/int/editorial-reasons.int.spec.tsx -t 'schema'
```

Expected: both Editorial Reasons schema tests PASS.

---

### Task 2: Render all four layouts and both list positions

**Files:**

- Modify: `src/blocks/EditorialReasons/Component.tsx`
- Test: `tests/int/editorial-reasons.int.spec.tsx`

**Interfaces:**

- Consumes: `layoutProportion`, `listPosition`, current introduction alignment, and current sticky flag.
- Produces: safe layout defaults, static outer-grid classes, visual list ordering, and stable data hooks.

- [ ] **Step 1: Add failing layout-mapping tests**

Add a table-driven test with these exact mappings:

```ts
it.each([
  ['listFocus', 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'],
  ['balanced', 'lg:grid-cols-2'],
  ['introFocus', 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]'],
] as const)('maps the %s split proportion', (layoutProportion, expectedClass) => {
  const html = renderToStaticMarkup(
    <EditorialReasonsBlockComponent
      layoutProportion={layoutProportion}
      reasons={baseReasons}
      title="Why choose us"
    />,
  )

  expect(html).toContain(expectedClass)
  expect(html).toContain(`data-editorial-reasons-layout="${layoutProportion}"`)
})
```

Add a list-position test asserting that `right` gives the intro `lg:order-1` and list `lg:order-2`,
while `left` gives the intro `lg:order-2` and list `lg:order-1`. Assert
`data-editorial-reasons-list-position` exposes the resolved value.

Add a Full Width test that passes stale conflicting values (`listPosition="left"`,
`introVerticalAlignment="bottom"`, `stickyIntro`) and asserts:

```ts
expect(html).toContain('data-editorial-reasons-layout="fullWidth"')
expect(html).toContain('data-editorial-reasons-list-position="below"')
expect(html).not.toContain('lg:grid-cols-2')
expect(html).not.toContain('lg:order-')
expect(html).not.toContain('lg:self-end')
expect(html).not.toContain('lg:sticky')
```

Add a safe-default test by passing invalid values through a cast and assert resolution to
`listFocus` and `right` rather than emitting an unknown class.

- [ ] **Step 2: Run the layout tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/editorial-reasons.int.spec.tsx -t 'layout|position|Full Width|safe defaults'
```

Expected: FAIL because the component still has one fixed `1fr / 2fr` outer grid.

- [ ] **Step 3: Add validated renderer types and class maps**

Add these component types and maps:

```ts
type EditorialReasonsLayoutProportion = 'balanced' | 'fullWidth' | 'introFocus' | 'listFocus'
type EditorialReasonsListPosition = 'left' | 'right'

const layoutProportionClasses = {
  listFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
  balanced: 'lg:grid-cols-2',
  introFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
} as const

const leftListLayoutProportionClasses = {
  listFocus: 'lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
  balanced: 'lg:grid-cols-2',
  introFocus: 'lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
} as const

const layoutProportions = new Set<EditorialReasonsLayoutProportion>([
  'listFocus',
  'balanced',
  'introFocus',
  'fullWidth',
])

const listPositions = new Set<EditorialReasonsListPosition>(['right', 'left'])
```

Extend `EditorialReasonsBlockLike` with nullable `layoutProportion` and `listPosition`. Resolve each
against the sets, defaulting to `listFocus` and `right`. Derive `isFullWidth` once.

- [ ] **Step 4: Apply layout, order, and split-only behavior**

Keep introduction first in the DOM. On the outer container:

```tsx
className={cn(
  regularBlockContainerClasses,
  'grid gap-10 lg:gap-16',
  !isFullWidth &&
    (resolvedListPosition === 'left'
      ? leftListLayoutProportionClasses[resolvedLayoutProportion]
      : layoutProportionClasses[resolvedLayoutProportion]),
)}
data-editorial-reasons-layout={resolvedLayoutProportion}
```

Apply `lg:order-1` / `lg:order-2` only for split layouts. The Full Width list position data value is
`below`; split layouts expose `left` or `right`. Apply `introAlignmentClasses` and
`lg:sticky lg:top-28` only when `!isFullWidth`.

- [ ] **Step 5: Run layout, alignment, and sticky tests**

Run:

```bash
pnpm exec vitest run tests/int/editorial-reasons.int.spec.tsx -t 'layout|position|alignment|sticky|Full Width|safe defaults'
```

Expected: all selected tests PASS, including the pre-existing alignment and sticky cases.

---

### Task 3: Build the responsive ruled reasons grid and surface-aware numbers

**Files:**

- Modify: `src/blocks/EditorialReasons/Component.tsx`
- Test: `tests/int/editorial-reasons.int.spec.tsx`
- Verify: `src/styles/themes/theme-snmih.css`

**Interfaces:**

- Consumes: resolved section background and existing SNMIH eyebrow surface selectors.
- Produces: a one-column number-rail composition, responsive two-to-four-column grids, clean
  semantic dividers, three outer-border treatments, and inherited green accent behavior.

- [ ] **Step 1: Replace obsolete list assertions with failing grid assertions**

For the default split layout, assert:

```ts
expect(html).toContain('data-editorial-reasons-grid="true"')
expect(html).toContain('grid-cols-1 md:grid-cols-2')
expect(html).toContain('data-editorial-reasons-columns="2"')
expect(html.match(/data-section-eyebrow-surface="none"/g)).toHaveLength(5)
expect(html.match(/aria-hidden="true"/g)).toHaveLength(4)
expect(html).toContain('flex flex-col')
expect(html).not.toContain('grid-cols-[2rem_minmax(0,1fr)]')
```

Render each configured `listColumns` value and assert one uses `grid-cols-1`, two adds
`md:grid-cols-2`, three adds `xl:grid-cols-3`, and four adds `xl:grid-cols-4`. Assert the data hook
exposes the validated count. Verify One Column uses a number rail while multi-column layouts place
numbers above their content.

Render `appearance={{ background: 'primary' }}` and assert every number carries
`data-section-eyebrow-surface="primary"` while preserving the fallback
`text-current/65` metadata class.

- [ ] **Step 2: Run the grid tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/editorial-reasons.int.spec.tsx -t 'responsive|grid|surface-aware|odd'
```

Expected: FAIL until all explicit column mappings and the single-column composition are present.

- [ ] **Step 3: Implement the breakpoint-aware grid**

Set the list grid to the validated static column class mapping:

```tsx
className={cn(
  '-mx-6 grid',
  listColumnClasses[resolvedListColumns],
)}
data-editorial-reasons-columns={resolvedListColumns}
```

Map static Tailwind classes for one through four columns. Use clipped one-pixel shadows for internal
vertical rules so every active column count has correct dividers without brittle `nth-child`
selectors. The One Column article uses a number rail; multi-column articles remain vertical:

```tsx
className={cn(
  'min-w-0 border-b border-border px-6 py-7 shadow-[-1px_0_0_var(--border)] sm:py-8',
  resolvedListColumns === '1'
    ? 'grid grid-cols-[3.5rem_minmax(0,1fr)] items-start gap-5'
    : 'flex flex-col',
)}
```

Render the number before the content wrapper using `contentItemMetadataClasses`, `tabular-nums`, and
`data-section-eyebrow-surface={resolvedSectionBackground}`. Use top alignment in One Column and
`mb-6` in multi-column layouts. Keep the existing title/link/description markup and accessibility
attributes unchanged.

- [ ] **Step 4: Run the full component test suite**

Run:

```bash
pnpm exec vitest run tests/int/editorial-reasons.int.spec.tsx
pnpm exec vitest run tests/int/section-eyebrow.int.spec.tsx
pnpm exec vitest run tests/int/content-style-parity.int.spec.ts
```

Expected: all tests PASS. `theme-snmih.css` remains unchanged because its existing selectors match
the number surface attributes.

---

### Task 4: Regenerate types, documentation, thumbnail, and verify

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Regenerate: `public/block-thumbnails/editorial-reasons.jpg`
- Verify: all files in the File Map

**Interfaces:**

- Consumes: completed schema and renderer.
- Produces: synchronized generated types, operator documentation, and a visually accurate admin thumbnail.

- [ ] **Step 1: Update the block guide**

Change the Editorial Reasons row to:

```md
| Editorial Reasons | Institutional strengths | Four proportion presets, aligned section content, left/right placement, optional sticky introduction, and a responsive one-to-four-column numbered grid |
```

Add a short note below the catalog explaining that Full Width places the introduction above the
list and that the other proportions apply on large screens before stacking on smaller viewports.

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm run generate:types
```

Expected: `EditorialReasonsBlock` contains required `layoutProportion` and `listPosition` unions with
the four and two approved values. No unrelated schema type disappears.

- [ ] **Step 3: Format and run focused checks**

Run:

```bash
pnpm exec prettier --write src/blocks/EditorialReasons/config.ts src/blocks/EditorialReasons/Component.tsx tests/int/editorial-reasons.int.spec.tsx src/payload-types.ts docs/guides/blocks.md docs/superpowers/specs/2026-08-12-editorial-reasons-block-design.md docs/superpowers/plans/2026-08-12-editorial-reasons-block.md
pnpm exec vitest run tests/int/editorial-reasons.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx tests/int/content-style-parity.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/EditorialReasons/config.ts src/blocks/EditorialReasons/Component.tsx tests/int/editorial-reasons.int.spec.tsx
git diff --check
```

Expected: all commands PASS.

- [ ] **Step 4: Regenerate and inspect the thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=editorialReasons pnpm run generate:block-thumbnails
```

Expected: `public/block-thumbnails/editorial-reasons.jpg` shows the display-font introduction beside
the default clean two-column reasons grid. If browser launch is sandbox-blocked, rerun with browser permission;
do not create a manual substitute.

- [ ] **Step 5: Perform one bounded visual inspection**

Inspect List Focus Right, Balanced Left, Introduction Focus Right, and Full Width at desktop width;
inspect one split layout and Full Width at mobile width. Include light and SNMIH primary/dark
surfaces in the same pass. Verify wrapping, visual order, responsive stacking, all four column
settings, the one-column number rail, divider continuity, green number contrast, sticky behavior,
and keyboard focus. Fix all material
defects in one batch and confirm once.

- [ ] **Step 6: Run the typography/design detector once**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/EditorialReasons/Component.tsx src/blocks/EditorialReasons/config.ts
```

Expected: no unresolved findings. If a finding requires a code change, rerun only the affected tests,
TypeScript, ESLint, and `git diff --check`.

- [ ] **Step 7: Confirm the working tree remains unstaged**

Run:

```bash
git diff --cached --name-only
git status --short
git diff --stat
```

Expected: the cached-name command prints nothing. All Editorial Reasons work remains visible only as
unstaged or untracked working-tree changes. Do not commit.
