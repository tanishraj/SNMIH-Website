# Content Highlights Configuration Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace overlapping Content Highlights controls with Grid/List, card style, column count, and eyebrow placement settings while adding generic card metadata and preserving legacy documents.

**Architecture:** Payload exposes four new presentation fields and keeps the old presentation fields hidden for compatibility. The block adapter normalizes new and legacy inputs into one resolved presentation contract, and the presentational component renders shared card content through small layout/style class maps without client state or duplicated card implementations.

**Tech Stack:** Payload CMS 3, React server components, TypeScript, Tailwind CSS, Vitest, React static markup tests.

## Global Constraints

- Do not create commits or change the user's existing staging state.
- Preserve section appearance, header composition, section/footer actions, card backgrounds, and shared action behavior.
- Do not add images, icons, animation, dependencies, or a database migration.
- Keep `markerMode` and `markerLabel` as storage keys while relabeling them as card-eyebrow controls.
- New presentation fields take precedence; hidden legacy fields are fallback inputs only.

---

### Task 1: Lock the Payload content and presentation contract

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/blocks/ContentHighlights/config.ts`

**Interfaces:**

- Produces item field `metadata?: string | null`.
- Produces `cardLayout: 'grid' | 'list'`.
- Produces `cardStyle: 'open' | 'leftRule' | 'boxed' | 'divided'`.
- Produces `gridColumns: '2' | '3'` conditional on Grid.
- Produces `eyebrowPlacement: 'stacked' | 'inline'`.
- Retains `layout`, `itemTreatment`, and `ruledDividers` as hidden legacy fields.

- [ ] **Step 1: Write failing schema assertions**

Update the expected item Content fields and Theme Settings fields:

```ts
expect(itemContent?.fields.map(({ name }) => name)).toEqual([
  'markerMode',
  'markerLabel',
  'metadata',
  'title',
  'description',
  'cardAction',
])

expect(theme?.fields.map(({ name }) => name)).toEqual([
  'appearance',
  'cardLayout',
  'cardStyle',
  'gridColumns',
  'eyebrowPlacement',
  'layout',
  'itemTreatment',
  'ruledDividers',
  'headerLayout',
  'contentAlignment',
  'splitContentAlignment',
  'size',
])
```

Assert the labels, defaults, options, conditional Grid Columns visibility, and `admin.hidden: true` on each legacy presentation field.

- [ ] **Step 2: Run the focused test and confirm the contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: schema assertions fail because the new fields do not exist and legacy controls remain visible.

- [ ] **Step 3: Implement the Payload fields**

Relabel the existing marker fields:

```ts
{
  name: 'markerMode',
  label: 'Card Eyebrow',
  type: 'select',
  defaultValue: 'numbered',
  options: [
    { label: 'Numbered', value: 'numbered' },
    { label: 'Custom Text', value: 'custom' },
    { label: 'Hidden', value: 'hidden' },
  ],
  required: true,
}
```

Add `metadata` before `title`, add the four new presentation selects, and mark the three legacy fields hidden. Use a conditional helper that returns true only when `cardLayout === 'grid'` for Grid Columns.

- [ ] **Step 4: Run the focused schema test**

Expected: schema assertions pass; renderer assertions may still fail until later tasks.

---

### Task 2: Normalize new and legacy presentation inputs

**Files:**

- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `src/components/content-highlights.tsx`
- Modify: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Produces `ResolvedContentHighlightsPresentation` with `cardLayout`, `cardStyle`, `gridColumns`, and `eyebrowPlacement`.
- Consumes new values first and legacy `layout`, `itemTreatment`, and `ruledDividers` only when new values are absent.

- [ ] **Step 1: Add failing normalization cases**

Cover explicit new values plus these legacy mappings:

```ts
;[
  ['editorialRow', undefined, undefined, 'list', 'divided', '3', 'stacked'],
  ['highlightsGrid', undefined, undefined, 'grid', 'boxed', '3', 'stacked'],
  ['simpleGrid', undefined, undefined, 'grid', 'open', '2', 'inline'],
  ['numberedSteps', undefined, undefined, 'grid', 'boxed', '3', 'stacked'],
  ['highlightsGrid', 'ruled', 'individual', 'grid', 'leftRule', '3', 'stacked'],
  ['highlightsGrid', 'ruled', 'grid', 'grid', 'divided', '3', 'stacked'],
] as const
```

Assert resolved values through stable `data-content-highlights-*` attributes.

- [ ] **Step 2: Run the focused test and confirm failures**

Expected: new props and resolved attributes are absent.

- [ ] **Step 3: Implement module-level resolvers**

Add public types:

```ts
export type ContentHighlightsCardLayout = 'grid' | 'list'
export type ContentHighlightsCardStyle = 'boxed' | 'divided' | 'leftRule' | 'open'
export type ContentHighlightsEyebrowPlacement = 'inline' | 'stacked'
export type ContentHighlightsGridColumns = '2' | '3'
```

Resolve explicit new values first. When absent, derive the complete presentation from legacy fields in one pure function. Do not derive presentation in effects or create client state.

- [ ] **Step 4: Pass only resolved presentation to the presentational component**

The block adapter should trim metadata, normalize actions, filter unusable titles, and pass the resolved values. Keep legacy props in `ContentHighlightsBlockLike` only.

- [ ] **Step 5: Run normalization tests**

Expected: all new and legacy mapping cases pass.

---

### Task 3: Render metadata and eyebrow placement

**Files:**

- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `src/components/content-highlights.tsx`
- Modify: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Extends `ContentHighlightItem` with `metadata?: string`.
- Inline placement reserves a marker rail only when an eyebrow exists.
- Action footer belongs to the text column in Inline mode.

- [ ] **Step 1: Add failing content-hierarchy tests**

Render cards containing custom eyebrow, metadata, title, description, and action. Assert DOM order and that blank metadata is omitted. Add a Hidden eyebrow case asserting no inline grid rail class.

- [ ] **Step 2: Run the focused test and confirm failures**

Expected: metadata is absent and eyebrow placement does not affect card structure.

- [ ] **Step 3: Extend normalized item content**

```ts
type ContentHighlightItemValue = {
  metadata?: string | null
  // existing fields remain
}

metadata: item.metadata?.trim() || undefined
```

- [ ] **Step 4: Implement one shared card-content renderer**

Use one content renderer for every card style. Stacked order is eyebrow, metadata, title, description. Inline uses:

```ts
cn('grid flex-1 gap-x-5 gap-y-2', eyebrow && 'grid-cols-[3.5rem_minmax(0,1fr)]')
```

Place metadata, title, description, and action in the flexible content column. When the eyebrow is hidden, omit the marker element and rail class entirely.

- [ ] **Step 5: Run metadata and placement tests**

Expected: hierarchy, blank handling, inline rail, hidden eyebrow, and action alignment pass.

---

### Task 4: Implement Grid/List and the four card styles

**Files:**

- Modify: `src/components/content-highlights.tsx`
- Modify: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Grid consumes resolved 2/3 columns and limits Split to two columns.
- List always renders one column.
- Styles consume semantic card-surface classes.

- [ ] **Step 1: Add failing presentation matrix tests**

Cover:

```ts
;[
  ['grid', '2', 'open'],
  ['grid', '3', 'leftRule'],
  ['grid', '3', 'boxed'],
  ['grid', '3', 'divided'],
  ['list', '3', 'open'],
  ['list', '3', 'leftRule'],
  ['list', '3', 'boxed'],
  ['list', '3', 'divided'],
] as const
```

Assert `border-l-2` only for Left Rule, a four-sided border only for Boxed, coordinated responsive rule selectors only for divided Grid, and continuous horizontal rules only for divided List.

- [ ] **Step 2: Run the focused test and confirm failures**

Expected: old layout/treatment code does not satisfy the matrix.

- [ ] **Step 3: Replace overlapping class selection with orthogonal maps**

Create module-level maps for Grid/List topology, 2/3 columns, and Open/Left Rule/Boxed/Divided card chrome. Keep card content and action rendering shared.

Left Rule uses:

```ts
cn('border-l-2 p-6 md:p-7', surface.className, surface.divider)
```

Boxed uses the established radius and fine semantic border. Divided Grid owns coordinated responsive selectors at the collection level; Divided List owns top, row, and bottom rules without vertical column selectors.

- [ ] **Step 4: Verify split and responsive behavior**

Assert Split never emits a three-column class, List stays single-column, and mobile emits no orphaned vertical divider.

- [ ] **Step 5: Run the focused presentation tests**

Expected: the complete matrix passes.

---

### Task 5: Regenerate contracts and complete verification

**Files:**

- Modify (generated): `src/payload-types.ts`
- Modify as required: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Generated `ContentHighlightsBlock` includes metadata and new presentation fields.
- Hidden legacy fields remain typed during the compatibility window.

- [ ] **Step 1: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: generated types include the new fields and metadata without removing hidden legacy inputs.

- [ ] **Step 2: Format changed source and tests**

```bash
pnpm exec prettier --write src/blocks/ContentHighlights/config.ts src/blocks/ContentHighlights/Component.tsx src/components/content-highlights.tsx src/payload-types.ts tests/int/content-highlights.int.spec.tsx
```

- [ ] **Step 3: Run focused integration coverage**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
```

Expected: all focused tests pass.

- [ ] **Step 4: Run static verification**

```bash
pnpm exec eslint src/blocks/ContentHighlights/config.ts src/blocks/ContentHighlights/Component.tsx src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx
pnpm exec tsc --noEmit
git diff --check
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/components/content-highlights.tsx
```

Expected: every command exits successfully and the detector returns no unexplained findings.

- [ ] **Step 5: Run the full integration suite**

```bash
pnpm run test:int
```

Expected: the complete suite passes.

- [ ] **Step 6: Inspect the final working state without committing**

```bash
git status --short
git diff --check
```

Expected: only intended Content Highlights source, generated types, tests, and local design/plan documents are changed. Do not stage, unstage, or commit files; preserve the user's existing index state.
