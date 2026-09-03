# Content Highlights Layout Selector Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with a review checkpoint after each task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate visible Grid/List and Grid Columns controls with one independent Items Layout selector supporting List and 1–4 columns.

**Architecture:** Add a new authoritative `itemsLayout` field and component prop while preserving the existing `cardLayout`, `gridColumns`, and older presentation fields as hidden compatibility inputs. Normalize new and legacy values once at the Content Highlights component boundary, then render every card style through a shared responsive layout map.

**Tech Stack:** Payload CMS fields, React server components, TypeScript, Tailwind CSS utilities, Vitest, React DOM server rendering.

## Global Constraints

- Items Layout values are exactly `'list' | '1' | '2' | '3' | '4'`.
- The default is `'3'`.
- Items Layout is independent of card style, eyebrow placement, surface, and header composition.
- Split headers honor the selected desktop column count.
- Existing records work without a database migration.
- New `itemsLayout` values take precedence over hidden legacy fields.
- Do not stage or commit any files.

---

### Task 1: Add the unified Payload field

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/blocks/ContentHighlights/config.ts`

**Interfaces:**

- Produces: Payload field `itemsLayout` with values `'list' | '1' | '2' | '3' | '4'`.
- Preserves: hidden `cardLayout` and `gridColumns` fields for old documents.

- [ ] **Step 1: Update the schema test first**

Change the Theme Settings field order expectation to include the new visible field and retain the hidden legacy fields:

```ts
expect(theme?.fields.map(({ name }) => name)).toEqual([
  'appearance',
  'itemsLayout',
  'cardStyle',
  'eyebrowPlacement',
  'cardLayout',
  'gridColumns',
  'layout',
  'itemTreatment',
  'ruledDividers',
  'headerLayout',
  'contentAlignment',
  'splitContentAlignment',
  'size',
])

expect(getField(theme?.fields ?? [], 'itemsLayout')).toMatchObject({
  defaultValue: '3',
  label: 'Items Layout',
  options: [
    { label: 'List', value: 'list' },
    { label: '1 Column', value: '1' },
    { label: '2 Columns', value: '2' },
    { label: '3 Columns', value: '3' },
    { label: '4 Columns', value: '4' },
  ],
  required: true,
  type: 'select',
})

expect(getField(theme?.fields ?? [], 'cardLayout')?.admin?.hidden).toBe(true)
expect(getField(theme?.fields ?? [], 'gridColumns')?.admin?.hidden).toBe(true)
```

Remove assertions for the old `gridColumns` condition because the field will no longer be visible.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because `itemsLayout` does not exist and the legacy fields are not both hidden.

- [ ] **Step 3: Implement the Payload schema**

In `src/blocks/ContentHighlights/config.ts`, remove `CardLayoutSiblingData` and `isGridLayout`, then insert this field after `appearance`:

```ts
{
  name: 'itemsLayout',
  label: 'Items Layout',
  type: 'select',
  defaultValue: '3',
  options: [
    { label: 'List', value: 'list' },
    { label: '1 Column', value: '1' },
    { label: '2 Columns', value: '2' },
    { label: '3 Columns', value: '3' },
    { label: '4 Columns', value: '4' },
  ],
  required: true,
} satisfies SelectField,
```

Move `cardStyle` and `eyebrowPlacement` directly after it. Keep `cardLayout` and `gridColumns` with their current stored options and defaults, but set both to:

```ts
admin: {
  hidden: true,
},
```

- [ ] **Step 4: Run the focused test**

Run the same Vitest command.

Expected: schema assertions pass; renderer assertions may still fail only after their new expectations are added in Task 2.

---

### Task 2: Normalize and render List plus 1–4 columns

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `src/components/content-highlights.tsx`

**Interfaces:**

- Consumes: `itemsLayout?: 'list' | '1' | '2' | '3' | '4' | null` from Payload.
- Produces: exported type `ContentHighlightsItemsLayout` and resolved `itemsLayout` presentation value.
- Preserves: nullable `cardLayout`, `gridColumns`, `layout`, `itemTreatment`, and `ruledDividers` compatibility props.

- [ ] **Step 1: Write normalization and geometry tests**

Add explicit block-adapter coverage:

```tsx
it.each(['list', '1', '2', '3', '4'] as const)(
  'renders the explicit %s Items Layout',
  (itemsLayout) => {
    const html = renderToStaticMarkup(
      <ContentHighlightsBlockComponent
        items={[item('One'), item('Two'), item('Three'), item('Four')]}
        itemsLayout={itemsLayout}
        title="Highlights"
      />,
    )

    expect(html).toContain(`data-content-highlights-items-layout="${itemsLayout}"`)
  },
)
```

Extend legacy normalization coverage with these results:

```ts
['editorialRow', undefined, undefined, 'list'],
['simpleGrid', undefined, undefined, '2'],
['highlightsGrid', undefined, undefined, '3'],
```

Add a precedence case where `itemsLayout="4"`, `cardLayout="list"`, and `gridColumns="2"` produces `data-content-highlights-items-layout="4"`.

Run the existing card-style assertions for every new layout with a nested table:

```ts
describe.each(['list', '1', '2', '3', '4'] as const)('%s Items Layout', (itemsLayout) => {
  it.each(['open', 'leftRule', 'boxed', 'divided'] as const)(
    'renders the %s card style',
    (cardStyle) => {
      const html = renderToStaticMarkup(
        <ContentHighlights
          cardStyle={cardStyle}
          items={[item('One'), item('Two'), item('Three'), item('Four')]}
          itemsLayout={itemsLayout}
          title="Highlights"
        />,
      )

      expect(html).toContain(`data-content-highlights-items-layout="${itemsLayout}"`)
      expect(html).toContain(`data-content-highlights-card-style="${cardStyle}"`)
    },
  )
})
```

Add responsive geometry expectations:

```ts
const expectedClasses = {
  list: 'grid gap-4',
  '1': 'grid grid-cols-1 gap-6',
  '2': 'grid grid-cols-1 gap-6 md:grid-cols-2',
  '3': 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4',
} as const
```

For Split header coverage, assert `itemsLayout="4"` contains `xl:grid-cols-4`; remove the old assertion that Split never contains more than two columns.

For Divided geometry, verify:

- List has top/bottom row rules and no column selector.
- 1 Column has top/bottom row rules and no column selector.
- 2 Columns has `md:[&>*:nth-child(2n)]:border-l`.
- 3 Columns resets two-column rules and applies three-column rules at `lg`.
- 4 Columns resets two-column rules and applies four-column rules at `xl`.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because the adapter and renderer do not accept `itemsLayout` and four-column classes do not exist.

- [ ] **Step 3: Add the adapter contract**

In `src/blocks/ContentHighlights/Component.tsx`, import `ContentHighlightsItemsLayout`, add it to `ContentHighlightsBlockLike`, destructure it, and pass it through:

```ts
itemsLayout?: ContentHighlightsItemsLayout | null
```

```tsx
<ContentHighlights itemsLayout={itemsLayout} />
```

Keep the existing legacy props flowing to the renderer.

- [ ] **Step 4: Add normalization types and precedence**

In `src/components/content-highlights.tsx`, add:

```ts
export type ContentHighlightsItemsLayout = 'list' | '1' | '2' | '3' | '4'
```

Add `itemsLayout?: ContentHighlightsItemsLayout | null` to `ContentHighlightsProps`. Replace `cardLayout` and `gridColumns` in `ResolvedContentHighlightsPresentation` with:

```ts
itemsLayout: ContentHighlightsItemsLayout
```

Resolve the value in this order:

```ts
const legacyItemsLayout: ContentHighlightsItemsLayout =
  cardLayout === 'list'
    ? 'list'
    : cardLayout === 'grid'
      ? gridColumns === '2'
        ? '2'
        : '3'
      : layout === 'editorialRow'
        ? 'list'
        : layout === 'simpleGrid'
          ? '2'
          : '3'

const resolvedItemsLayout: ContentHighlightsItemsLayout =
  itemsLayout === 'list' ||
  itemsLayout === '1' ||
  itemsLayout === '2' ||
  itemsLayout === '3' ||
  itemsLayout === '4'
    ? itemsLayout
    : legacyItemsLayout
```

Return `itemsLayout: resolvedItemsLayout` with the existing card-style and eyebrow-placement normalization.

- [ ] **Step 5: Replace layout class maps**

Use one regular layout map:

```ts
const itemLayoutClasses = {
  list: 'grid gap-4',
  '1': 'grid grid-cols-1 gap-6',
  '2': 'grid grid-cols-1 gap-6 md:grid-cols-2',
  '3': 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4',
} as const satisfies Record<ContentHighlightsItemsLayout, string>
```

Use a Divided map with continuous top borders per active row:

```ts
const dividedItemLayoutClasses = {
  list: 'grid gap-0 [&>*:first-child]:border-t',
  '1': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t',
  '2': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t md:grid-cols-2 md:[&>*:nth-child(-n+2)]:border-t',
  '3': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t md:grid-cols-2 md:[&>*:nth-child(-n+2)]:border-t lg:grid-cols-3 lg:[&>*:nth-child(-n+3)]:border-t',
  '4': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t md:grid-cols-2 md:[&>*:nth-child(-n+2)]:border-t xl:grid-cols-4 xl:[&>*:nth-child(-n+4)]:border-t',
} as const satisfies Record<ContentHighlightsItemsLayout, string>
```

Add Divided column maps:

```ts
const dividedColumnClasses = {
  list: undefined,
  '1': undefined,
  '2': 'md:[&>*:nth-child(2n)]:border-l',
  '3': 'md:[&>*:nth-child(2n)]:border-l lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n)]:border-l',
  '4': 'md:[&>*:nth-child(2n)]:border-l xl:[&>*:nth-child(4n+1)]:border-l-0 xl:[&>*:nth-child(4n+2)]:border-l xl:[&>*:nth-child(4n+3)]:border-l xl:[&>*:nth-child(4n)]:border-l',
} as const satisfies Record<ContentHighlightsItemsLayout, string | undefined>
```

Use these maps for Stacked and Split header compositions. Do not keep separate Split class maps or cap Split at two columns.

- [ ] **Step 6: Update rendering data and item semantics**

Pass `itemsLayout` to `ContentHighlightsItems` and expose:

```tsx
data-content-highlights-items-layout={resolvedPresentation.itemsLayout}
```

Derive compatibility attributes without using them for layout decisions:

```ts
const resolvedCardLayout = resolvedPresentation.itemsLayout === 'list' ? 'list' : 'grid'
const resolvedGridColumns =
  resolvedPresentation.itemsLayout === 'list' ? '3' : resolvedPresentation.itemsLayout
```

Pass `resolvedCardLayout` only where the existing diagnostic card attribute requires it. Use `itemsLayout` for grid classes and Divided column rules.

- [ ] **Step 7: Run focused and related tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/content-highlights.int.spec.tsx \
  tests/int/card-block-renderers.int.spec.tsx \
  tests/int/section-eyebrow.int.spec.tsx
```

Expected: all tests pass.

---

### Task 3: Regenerate contracts and verify the repository

**Files:**

- Modify: `src/payload-types.ts` through Payload's generator
- Modify: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Produces: generated `itemsLayout: 'list' | '1' | '2' | '3' | '4'` Payload type.
- Preserves: generated legacy fields for compatibility.

- [ ] **Step 1: Extend the generated-contract assertion**

Add:

```ts
expect(contentHighlightsType).toContain("itemsLayout: 'list' | '1' | '2' | '3' | '4'")
```

Continue asserting that `cardLayout`, `gridColumns`, and the older compatibility fields remain generated.

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` includes the new required `itemsLayout` field and its select union.

- [ ] **Step 3: Format authored files only**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/ContentHighlights/Component.tsx \
  src/blocks/ContentHighlights/config.ts \
  src/components/content-highlights.tsx \
  tests/int/content-highlights.int.spec.tsx \
  docs/superpowers/specs/2026-08-16-content-highlights-layout-selector-design.md \
  docs/superpowers/plans/2026-08-16-content-highlights-layout-selector.md
```

Do not run Prettier on generated `src/payload-types.ts`; Payload's generator owns its format.

- [ ] **Step 4: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint \
  src/blocks/ContentHighlights/Component.tsx \
  src/blocks/ContentHighlights/config.ts \
  src/components/content-highlights.tsx \
  tests/int/content-highlights.int.spec.tsx
git diff --check
git diff --cached --check
```

Expected: all commands exit successfully with no errors.

- [ ] **Step 5: Run the complete integration suite**

Run:

```bash
pnpm run test:int
```

Expected: all integration tests pass. If MongoMemoryServer is blocked from opening a local port by the sandbox, rerun this exact command with the required sandbox permission.

- [ ] **Step 6: Confirm repository state without staging**

Run:

```bash
git status --short
```

Expected: the Content Highlights files and uncommitted documentation remain modified or untracked exactly as intended; no `git add` or `git commit` command has been run.
