# Content Highlights Rule Refinement Implementation Plan

> **For agentic workers:** Execute this plan task-by-task with a review checkpoint after each task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove List from Items Layout, preserve legacy List content as 1 Column, add the approved Rule presentation through the existing `divided` value, and increase Open row spacing.

**Architecture:** Keep 1–4 Columns as the public layout contract and normalize stale List values in the Payload block adapter before rendering. Preserve the stored `divided` Card Style value while relabeling it Rule in the admin, then let the shared item renderer apply style-specific gaps, padding, rails, and responsive dividers.

**Tech Stack:** Payload CMS fields, React server components, TypeScript, Tailwind CSS utilities, Vitest, React DOM server rendering.

## Global Constraints

- Items Layout exposes exactly `'1' | '2' | '3' | '4'`.
- The default remains `'3'`.
- A stale `itemsLayout: 'list'`, `cardLayout: 'list'`, or legacy Editorial List normalizes to `'1'`.
- Card Style keeps Open, Left Rule, Boxed, and Rule.
- Rule retains the stored value `'divided'`.
- Rule respects Items Layout, Eyebrow Placement, card background, and card content.
- Open uses 32px row spacing and 24px column spacing.
- Left Rule and Boxed keep 24px row and column spacing.
- Rule remains gapless and uses continuous responsive rules.
- Do not stage or commit any files.

---

### Task 1: Refine the Payload contract and legacy boundary

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/blocks/ContentHighlights/config.ts`
- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `src/components/content-highlights.tsx`

**Interfaces:**

- Produces: `ContentHighlightsItemsLayout = '1' | '2' | '3' | '4'`.
- Consumes at the adapter boundary: `ContentHighlightsItemsLayout | 'list' | null | undefined`.
- Preserves: stored Card Style value `'divided'`, presented to editors as Rule.

- [ ] **Step 1: Write the failing schema and normalization tests**

Update the Items Layout schema assertion to:

```ts
expect(getField(theme?.fields ?? [], 'itemsLayout')).toMatchObject({
  defaultValue: '3',
  label: 'Items Layout',
  options: [
    { label: '1 Column', value: '1' },
    { label: '2 Columns', value: '2' },
    { label: '3 Columns', value: '3' },
    { label: '4 Columns', value: '4' },
  ],
  required: true,
  type: 'select',
})
```

Update Card Style to assert the compatible Rule option:

```ts
expect(getField(theme?.fields ?? [], 'cardStyle')?.options).toEqual([
  { label: 'Open', value: 'open' },
  { label: 'Left Rule', value: 'leftRule' },
  { label: 'Boxed', value: 'boxed' },
  { label: 'Rule', value: 'divided' },
])
```

Add stale-value coverage through the block adapter:

```tsx
it('normalizes a stale List selection to 1 Column', () => {
  const html = renderToStaticMarkup(
    <ContentHighlightsBlockComponent
      items={[item('First')]}
      itemsLayout={'list' as never}
      title="Highlights"
    />,
  )

  expect(html).toContain('data-content-highlights-items-layout="1"')
  expect(html).toContain('data-content-highlights-grid-columns="1"')
})
```

Change legacy Editorial List and `cardLayout="list"` expectations from List to 1 Column.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because List is still an admin option, Divided is still the label, and legacy List still resolves as List.

- [ ] **Step 3: Update the Payload select options**

In `src/blocks/ContentHighlights/config.ts`, remove:

```ts
{ label: 'List', value: 'list' },
```

Change only the editor-facing label of the compatible style:

```ts
{ label: 'Rule', value: 'divided' },
```

Do not change the stored value.

- [ ] **Step 4: Normalize stale List in the block adapter**

In `src/blocks/ContentHighlights/Component.tsx`, keep the block-like input permissive:

```ts
itemsLayout?: ContentHighlightsItemsLayout | 'list' | null
```

Resolve it before rendering:

```ts
const resolvedItemsLayout: ContentHighlightsItemsLayout | undefined =
  itemsLayout === 'list' ? '1' : (itemsLayout ?? undefined)
```

Pass `resolvedItemsLayout` to `ContentHighlights`.

- [ ] **Step 5: Narrow the public renderer type and legacy mapping**

In `src/components/content-highlights.tsx`, change:

```ts
export type ContentHighlightsItemsLayout = '1' | '2' | '3' | '4'
```

Remove `'list'` from explicit `itemsLayout` validation. Resolve old layout fields in this order:

```ts
const legacyItemsLayout: ContentHighlightsItemsLayout =
  cardLayout === 'list'
    ? '1'
    : cardLayout === 'grid'
      ? gridColumns === '2'
        ? '2'
        : '3'
      : layout === 'editorialRow'
        ? '1'
        : layout === 'simpleGrid'
          ? '2'
          : '3'
```

The explicit result accepts only `'1'`, `'2'`, `'3'`, or `'4'`. Derive compatibility attributes as Grid plus the selected count.

- [ ] **Step 6: Run the focused test**

Run the same Vitest command.

Expected: schema, type-boundary, and legacy-normalization tests pass. Presentation tests added in Task 2 may still fail until their renderer changes are implemented.

---

### Task 2: Implement Open spacing and the Rule presentation

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/components/content-highlights.tsx`

**Interfaces:**

- Consumes: normalized `itemsLayout: '1' | '2' | '3' | '4'` and existing `cardStyle`.
- Produces: Open-specific gaps and Rule-specific padding, rails, and continuous borders.

- [ ] **Step 1: Write failing presentation tests**

Replace the current layout table with 1–4 Columns only. Assert Open geometry with:

```ts
const openLayoutClasses = {
  '1': 'grid grid-cols-1 gap-x-6 gap-y-8',
  '2': 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2',
  '3': 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-4',
} as const
```

Keep the style matrix for 1–4 Columns and Open, Left Rule, Boxed, and `divided`.

Add Rule padding coverage:

```tsx
it('renders Rule cards with editorial vertical rhythm and no inherited horizontal inset', () => {
  const html = renderToStaticMarkup(
    <ContentHighlights
      cardStyle="divided"
      items={[item('One'), item('Two')]}
      itemsLayout="1"
      title="Highlights"
    />,
  )
  const articleTags = html.match(/<article class="[^"]*"[^>]*>/g) ?? []

  expect(articleTags.every((tag) => tag.includes('border-b py-8 md:py-10'))).toBe(true)
  expect(articleTags.every((tag) => !tag.includes('px-6'))).toBe(true)
})
```

Add explicit-surface padding coverage:

```tsx
it('keeps horizontal padding on Rule cards with an explicit surface', () => {
  const html = renderToStaticMarkup(
    <ContentHighlights
      cardStyle="divided"
      items={[{ ...item('One'), cardBackground: 'primary' }]}
      itemsLayout="1"
      title="Highlights"
    />,
  )
  const articleTag = html.match(/<article class="[^"]*"[^>]*>/)?.[0]

  expect(articleTag).toContain('border-b py-8 md:py-10 px-6 md:px-7')
})
```

Add eyebrow-rail coverage:

```tsx
it('uses a wide Inline eyebrow rail only for 1-Column Rule', () => {
  const oneColumn = renderToStaticMarkup(
    <ContentHighlights
      cardStyle="divided"
      eyebrowPlacement="inline"
      items={[item('One')]}
      itemsLayout="1"
      title="Highlights"
    />,
  )
  const multiColumn = renderToStaticMarkup(
    <ContentHighlights
      cardStyle="divided"
      eyebrowPlacement="inline"
      items={[item('One')]}
      itemsLayout="3"
      title="Highlights"
    />,
  )

  expect(oneColumn).toContain('md:grid-cols-[8rem_minmax(0,1fr)]')
  expect(multiColumn).not.toContain('md:grid-cols-[8rem_minmax(0,1fr)]')
  expect(multiColumn).toContain('grid-cols-[3.5rem_minmax(0,1fr)]')
})
```

- [ ] **Step 2: Run the focused test and confirm presentation failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL on Open gap classes, Rule padding, and the wide Inline rail.

- [ ] **Step 3: Separate column geometry from style spacing**

Replace `itemLayoutClasses` with column-only classes:

```ts
const itemColumnClasses = {
  '1': 'grid grid-cols-1',
  '2': 'grid grid-cols-1 md:grid-cols-2',
  '3': 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
} as const satisfies Record<ContentHighlightsItemsLayout, string>
```

Build non-Rule classes from the selected style:

```ts
const gridClasses =
  cardStyle === 'divided'
    ? dividedItemLayoutClasses[itemsLayout]
    : cn(itemColumnClasses[itemsLayout], cardStyle === 'open' ? 'gap-x-6 gap-y-8' : 'gap-6')
```

Remove the List entries from `dividedItemLayoutClasses` and `dividedColumnClasses`.

- [ ] **Step 4: Add Rule padding without changing other styles**

Pass `itemsLayout` into `ContentHighlightItemComponent`. Change the Rule treatment branch to:

```ts
cardStyle === 'divided'
  ? cn(
      'border-b py-8 md:py-10',
      hasExplicitSurface && 'px-6 md:px-7',
      surface.className,
      surface.divider,
    )
```

Keep Open, Left Rule, and Boxed card treatment branches unchanged.

- [ ] **Step 5: Add the responsive Inline Rule rail**

Add an `inlineRailClassName` parameter to `HighlightBody`. Apply it only when a marker exists:

```tsx
marker && inlineRailClassName
```

Resolve it in `ContentHighlightItemComponent`:

```ts
const inlineRailClassName =
  cardStyle === 'divided' && itemsLayout === '1'
    ? 'grid-cols-[3.5rem_minmax(0,1fr)] md:grid-cols-[8rem_minmax(0,1fr)]'
    : 'grid-cols-[3.5rem_minmax(0,1fr)]'
```

Pass it to `HighlightBody`. Eyebrow Placement remains authoritative; this class changes only the width of an already-Inline composition.

- [ ] **Step 6: Run focused and related tests**

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

- Produces: generated `itemsLayout: '1' | '2' | '3' | '4'` Payload type.
- Preserves: generated `cardStyle` value union containing `'divided'`.

- [ ] **Step 1: Update generated-contract assertions**

Assert:

```ts
expect(contentHighlightsType).toContain("itemsLayout: '1' | '2' | '3' | '4'")
expect(contentHighlightsType).toContain("cardStyle: 'open' | 'leftRule' | 'boxed' | 'divided'")
```

Remove the prior generated assertion containing `'list'`.

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains the narrowed Items Layout union and the compatible Card Style union.

- [ ] **Step 3: Format authored files only**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/ContentHighlights/Component.tsx \
  src/blocks/ContentHighlights/config.ts \
  src/components/content-highlights.tsx \
  tests/int/content-highlights.int.spec.tsx \
  docs/superpowers/specs/2026-08-16-content-highlights-layout-selector-design.md \
  docs/superpowers/plans/2026-08-16-content-highlights-rule-refinement.md
```

Do not format generated `src/payload-types.ts`; Payload owns its output format.

- [ ] **Step 4: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint \
  src/blocks/ContentHighlights/Component.tsx \
  src/blocks/ContentHighlights/config.ts \
  src/components/content-highlights.tsx \
  tests/int/content-highlights.int.spec.tsx
node .agents/skills/impeccable/scripts/detect.mjs \
  src/components/content-highlights.tsx \
  src/blocks/ContentHighlights/Component.tsx \
  src/blocks/ContentHighlights/config.ts
git diff --check
git diff --cached --check
```

Expected: all commands exit successfully with no errors or design findings.

- [ ] **Step 5: Run the complete integration suite**

Run:

```bash
pnpm run test:int
```

Expected: all integration tests pass. If MongoMemoryServer is blocked from opening a local port, rerun the exact command with the required sandbox permission.

- [ ] **Step 6: Confirm repository state without staging**

Run:

```bash
git status --short
```

Expected: the Content Highlights changes and documentation remain modified or untracked as intended; no `git add` or `git commit` command has been run.
