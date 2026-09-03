# Feature Matrix Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact, theme-aware Payload implementation of Shadcn Blocks Feature Matrix with exactly four panels and shared section actions.

**Architecture:** Install the registry source, adapt it into a focused presentational component, and keep Payload/media/link resolution in a block wrapper. Register the block with Pages and the deterministic thumbnail system, then regenerate Payload types and the block preview image.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3, TypeScript, Tailwind CSS 4, shadcn/ui, Vitest, Playwright, Sharp.

## Global Constraints

- Preserve the Feature Matrix asymmetric desktop matrix: `3/5 + 2/5`, then `2/5 + 3/5`.
- Enforce exactly four feature rows.
- Actions appear once below the section description, never inside individual panels.
- Use existing semantic tokens, `ContentActions`, Payload media helpers, and block appearance helpers.
- Each feature image owns an independent Background Position using the Feature Spotlight Center, Top, Bottom, Left, and Right mappings.
- Keep Feature Matrix and future project-owned CSS in `src/styles/custom.css`; restore its import manually whenever `globals.css` is replaced.
- Keep all changes unstaged.

---

### Task 1: Install and adapt the registry component

**Files:**

- Create: `src/components/feature-matrix.tsx`
- Test: `tests/int/feature-matrix.int.spec.ts`

**Interfaces:**

- Consumes: `BlockAppearance`, `resolveBlockAppearanceClasses`, and `cn`.
- Produces: `FeatureMatrix`, `FeatureMatrixItem`, `FeatureMatrixAlignment`, and `FeatureMatrixSize`.

- [x] **Step 1: Add the upstream registry item**

Run `pnpm dlx shadcn@latest add @shadcnblocks/feature166` and inspect every added file.

- [x] **Step 2: Write the failing render contract**

Create a Vitest test that renders four named features and asserts `data-feature-matrix`, `data-feature-matrix-size="compact"`, `data-feature-matrix-alignment="center"`, all four titles, semantic borders, and the asymmetric `lg:col-span-3` / `lg:col-span-2` classes.

- [x] **Step 3: Adapt the presentational component**

Replace registry defaults and remote assets with required props. Use a five-column desktop grid, semantic border and foreground tokens, theme radius, size maps for section/panel spacing, and a single optional `actions: ReactNode` slot beneath the intro description.

- [x] **Step 4: Run the focused render test**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: component render assertions pass.

### Task 2: Add the Payload schema and CMS wrapper

**Files:**

- Create: `src/blocks/FeatureMatrix/config.ts`
- Create: `src/blocks/FeatureMatrix/Component.tsx`
- Modify: `tests/int/feature-matrix.int.spec.ts`

**Interfaces:**

- Consumes: `createBlockAppearanceFields`, `createContentActionsField`, `createContentActionModeField`, `resolveCmsActions`, `getMediaImageProps`, and `ContentActions`.
- Produces: Payload block slug `featureMatrix`, interface `FeatureMatrixBlock`, and `FeatureMatrixBlockComponent`.

- [x] **Step 1: Extend the test with schema assertions**

Assert Content and Layout & Theme tabs, required title, optional eyebrow/description, shared actions, `features.minRows === 4`, `features.maxRows === 4`, required feature title/image, default centered alignment, default Link action mode, and Compact/Default/Comfortable size options.

- [x] **Step 2: Implement the block config**

Define the two Payload tabs. Use the shared field factories and a four-row feature array containing `title`, `description`, and required `media` upload fields.

- [x] **Step 3: Implement the CMS wrapper**

Resolve each feature upload through `getMediaImageProps({ preset: 'generic', fallbackAlt: feature.title })`, discard rows without a usable title/image, resolve shared actions with `resolveCmsActions`, and pass the result plus `ContentActions` into `FeatureMatrix`.

- [x] **Step 4: Run the focused schema/render test**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: schema and component assertions pass.

### Task 3: Register Feature Matrix as a page block

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: `FeatureMatrixBlock` and `FeatureMatrixBlockComponent`.
- Produces: Page editor availability and frontend rendering for `blockType: 'featureMatrix'`.

- [x] **Step 1: Add failing registration assertions**

Assert that Pages contains `featureMatrix`, Reviews does not expose it, and the shared renderer emits Feature Matrix markup for a typed block value.

- [x] **Step 2: Register config and renderer**

Import `FeatureMatrixBlock` into Pages and append it to the page layout list. Import the wrapper into `renderPageBlocks` and add the `featureMatrix` switch branch with the standard stable key.

- [x] **Step 3: Correct the stale registered-page-block expectation**

Update the existing system-page test's page slug list to include the already registered FAQ and Review Submission blocks plus Feature Matrix, without changing collection behavior.

- [x] **Step 4: Generate Payload types**

Run `pnpm run generate:types`. Expected: `FeatureMatrixBlock` and its select type appear in `src/payload-types.ts` and `Page.layout` includes it.

- [x] **Step 5: Run registration tests**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts tests/int/system-page-blocks.int.spec.ts --config ./vitest.config.mts`. Expected: Feature Matrix tests pass; unrelated existing assertions are reported separately if still stale.

### Task 4: Add the real-render thumbnail

**Files:**

- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Create: `public/block-thumbnails/feature-matrix.jpg`

**Interfaces:**

- Consumes: `FeatureMatrixBlockComponent` and repository-local thumbnail SVG assets.
- Produces: manifest slug `featureMatrix`, local fixture, and exact 1600×900 JPEG.

- [x] **Step 1: Extend thumbnail coverage expectations**

Add `featureMatrix` to the registered-slug contract. The existing exact-file test must fail until generation completes.

- [x] **Step 2: Add manifest metadata and fixture**

Define `feature-matrix.jpg` metadata and add a compact centered fixture with neutral eyebrow/title/description, four feature entries backed only by `/block-thumbnail-assets/*`, and one Link-mode action.

- [x] **Step 3: Generate thumbnails**

Run `pnpm generate:block-thumbnails`. Expected: all manifest images, including Feature Matrix, are 1600×900 JPEGs.

- [x] **Step 4: Visually inspect Feature Matrix**

Inspect `public/block-thumbnails/feature-matrix.jpg`. Confirm four panels, compact spacing, readable intro/action, asymmetric desktop widths, semantic borders, and no clipping or development overlay.

### Task 5: Final verification

**Files:**

- Modify: `docs/superpowers/plans/2026-07-17-featureMatrix-block.md`

**Interfaces:**

- Consumes: all Feature Matrix implementation files.
- Produces: verified unstaged working tree.

- [x] **Step 1: Run focused tests**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/page-blocks.int.spec.ts --config ./vitest.config.mts`.

- [x] **Step 2: Run formatting and linting**

Run Prettier and ESLint only against the Feature Matrix files and directly modified registration/thumbnail files.

- [x] **Step 3: Run repository diagnostics**

Run `pnpm exec tsc --noEmit --pretty false`, `git diff --check`, and `git status --short`. Distinguish Feature Matrix regressions from known unrelated repository errors.

- [x] **Step 4: Mark this checklist complete**

Change every completed plan checkbox to `[x]`. Do not stage or commit any file.

### Task 6: Normalize feature image heights

**Files:**

- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `public/block-thumbnails/feature-matrix.jpg`

**Interfaces:**

- Consumes: `FeatureMatrixSize` and the component's existing `resolvedSize` value.
- Produces: `imageHeightClasses: Record<FeatureMatrixSize, string>` applied identically to all four images.

- [x] **Step 1: Add a failing equal-height contract**

Update the compact render assertion so every occurrence of the Feature Matrix image class includes `h-40 md:h-44 lg:h-48`, and assert that the old `aspect-[1.45]` and `lg:aspect-[2.4]` classes are absent.

- [x] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: failure because the component still applies unequal aspect ratios.

- [x] **Step 3: Add the responsive height map**

Add this constant to `src/components/feature-matrix.tsx`:

```ts
const imageHeightClasses = {
  compact: 'h-40 md:h-44 lg:h-48',
  default: 'h-44 md:h-48 lg:h-52',
  comfortable: 'h-48 md:h-52 lg:h-56',
} as const
```

Apply `imageHeightClasses[resolvedSize]` to every image and remove both wide/narrow aspect-ratio branches. Keep `w-full`, `object-cover`, and the theme radius unchanged.

- [x] **Step 4: Verify and regenerate the thumbnail**

Run the focused Feature Matrix test, `pnpm generate:block-thumbnails`, Prettier, ESLint, and `git diff --check`. Inspect `public/block-thumbnails/feature-matrix.jpg` and confirm all four images have equal heights.

- [x] **Step 5: Mark this task complete**

Change every Task 6 checkbox to `[x]` without staging or committing files.

### Task 7: Normalize panel content typography

**Files:**

- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `public/block-thumbnails/feature-matrix.jpg`

**Interfaces:**

- Consumes: the existing `FeatureMatrixItem.title` and `FeatureMatrixItem.description` values.
- Produces: paragraph-based panel labels at `text-base font-semibold leading-tight` and descriptions at `text-sm leading-6`.

- [x] **Step 1: Add the failing semantic typography contract**

Assert that the rendered matrix contains no feature-title `<h3>` elements, renders all four feature titles as `<p>` elements with `text-base leading-tight font-semibold text-current`, and renders descriptions with `text-sm leading-6 text-current/70`.

- [x] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: failure because titles still use `<h3>` and descriptions still use `text-base leading-7`.

- [x] **Step 3: Update the panel markup**

Replace each panel-title `<h3>` with:

```tsx
<p className="text-base leading-tight font-semibold text-current">{feature.title}</p>
```

Change each panel description to:

```tsx
<p className="text-sm leading-6 text-current/70">{feature.description}</p>
```

Do not alter the section heading, grid proportions, image heights, or action behavior.

- [x] **Step 4: Verify and regenerate the thumbnail**

Run the Feature Matrix test, regenerate block thumbnails, inspect `feature-matrix.jpg`, then run scoped Prettier, ESLint, and `git diff --check`.

- [x] **Step 5: Mark this task complete**

Change every Task 7 checkbox to `[x]` without staging or committing files.

### Task 8: Correct matrix radius, borders, and text spacing

**Files:**

- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `public/block-thumbnails/feature-matrix.jpg`

**Interfaces:**

- Consumes: each panel's zero-based map index and the existing matrix grid.
- Produces: `panelDividerClasses` for internal-only dividers, a complete `rounded-md border` matrix frame, `rounded-md` images, and a `gap-1` title/description group.

- [x] **Step 1: Add the failing frame and spacing contract**

Assert that the matrix contains `overflow-hidden rounded-md border border-border`, no `rounded-[var(--radius)]`, four `flex flex-col gap-1` text groups, and the responsive panel-three divider `border-b border-border lg:border-r lg:border-b-0`.

- [x] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: failure because the parent owns only top/left borders, panels construct the outer border, radii are arbitrary values, and text is not grouped.

- [x] **Step 3: Implement the frame and internal dividers**

Add this index-aligned map:

```ts
const panelDividerClasses = [
  'border-b border-border lg:border-r',
  'border-b border-border',
  'border-b border-border lg:border-r lg:border-b-0',
  '',
] as const
```

Set the matrix to `grid overflow-hidden rounded-md border border-border lg:grid-cols-5`. Remove border utilities from the shared article class and apply `panelDividerClasses[index]`. Wrap title and optional description in `div.flex.flex-col.gap-1`, and change the image frame to `rounded-md`.

- [x] **Step 4: Verify and regenerate the thumbnail**

Run the focused Feature Matrix test, regenerate block thumbnails, inspect the bottom-right matrix corner and panel spacing in `feature-matrix.jpg`, then run scoped Prettier, ESLint, and `git diff --check`.

- [x] **Step 5: Mark this task complete**

Change every Task 8 checkbox to `[x]` without staging or committing files.

### Task 9: Add a configurable matrix outer border

**Files:**

- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `src/blocks/FeatureMatrix/config.ts`
- Modify: `src/blocks/FeatureMatrix/Component.tsx`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Consumes: Payload checkbox `showOuterBorder?: boolean | null`.
- Produces: `showOuterBorder?: boolean` on `FeatureMatrix`, defaulted to `true`, conditional parent `border border-border`, and `data-feature-matrix-outer-border="shown|hidden"`.

- [x] **Step 1: Add failing schema and render contracts**

Assert that Layout & Theme contains a `showOuterBorder` checkbox defaulting to `true`. Assert the default component state exposes `data-feature-matrix-outer-border="shown"` and the complete matrix border, while `showOuterBorder: false` exposes `"hidden"`, omits the parent border classes, and retains internal divider classes.

- [x] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: failure because the field and component prop do not exist.

- [x] **Step 3: Implement the Payload and rendering control**

Add this checkbox to Layout & Theme:

```ts
{
  name: 'showOuterBorder',
  label: 'Show Outer Border',
  type: 'checkbox',
  defaultValue: true,
} satisfies CheckboxField
```

Pass the generated value through `FeatureMatrixBlockComponent`. In `FeatureMatrix`, resolve nullish values to `true`, conditionally add `border border-border` to the matrix parent, and expose the `shown`/`hidden` data attribute. Do not condition the internal `panelDividerClasses`.

- [x] **Step 4: Generate types and verify**

Run `pnpm run generate:types`, the focused Feature Matrix and page-block tests, scoped Prettier and ESLint, and `git diff --check`. The default thumbnail remains bordered and does not require regeneration because its fixture uses the default state.

- [x] **Step 5: Mark this task complete**

Change every Task 9 checkbox to `[x]` without staging or committing files.

### Task 10: Animate the internal matrix dividers

**Files:**

- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `src/blocks/FeatureMatrix/config.ts`
- Modify: `src/blocks/FeatureMatrix/Component.tsx`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Consumes: Payload checkbox `borderAnimationEnabled?: boolean | null`, semantic `--primary`, and the existing internal `panelDividerClasses` geometry.
- Produces: `borderAnimationEnabled?: boolean` on `FeatureMatrix`, defaulted to `true`; `FeatureMatrixDividerBeam` with horizontal/vertical orientations and fixed animation phases; and `data-feature-matrix-border-animation="enabled|disabled"`.

- [x] **Step 1: Add failing schema and render contracts**

Assert that Layout & Theme contains this field:

```ts
expect(borderAnimationEnabledField).toMatchObject({
  defaultValue: true,
  type: 'checkbox',
})
```

Render the default component and assert `data-feature-matrix-border-animation="enabled"`, three horizontal divider beams, and two vertical divider beams. Render with `borderAnimationEnabled: false` and assert the disabled data state, no beam elements, and unchanged static `border-b border-border` / `lg:border-r` divider classes. Read `src/styles/globals.css` and assert that the animation uses `var(--primary)` and includes a `prefers-reduced-motion: reduce` rule that hides the beams.

- [x] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: failure because neither the Payload setting nor the decorative divider beams exist.

- [x] **Step 3: Add the Payload control and wrapper prop**

Add this field after `showOuterBorder` in Layout & Theme:

```ts
{
  name: 'borderAnimationEnabled',
  label: 'Enable Border Animation',
  type: 'checkbox',
  defaultValue: true,
} satisfies CheckboxField
```

Add `borderAnimationEnabled?: boolean | null` to `FeatureMatrixBlockLike`, default it to `true`, and pass `borderAnimationEnabled ?? true` into `FeatureMatrix`.

- [x] **Step 4: Add the CSS-only internal-divider primitive**

In `src/components/feature-matrix.tsx`, add a private `FeatureMatrixDividerBeam` that renders one decorative `aria-hidden` span with:

```tsx
data-feature-matrix-divider-beam={orientation}
data-feature-matrix-divider-beam-phase={phase}
```

Use an index-aligned descriptor map with exactly five responsive beams: panel one receives an always-visible horizontal beam and desktop vertical beam; panel two receives a horizontal beam; panel three receives a mobile horizontal beam and desktop vertical beam; panel four receives none. Make each panel `relative`. Render descriptors only when `borderAnimationEnabled` resolves to enabled, and expose `data-feature-matrix-border-animation="enabled|disabled"` on the section. Do not alter `panelDividerClasses` or animate the matrix parent.

- [x] **Step 5: Add semantic, deterministic animation CSS**

In `src/styles/globals.css`, define `.feature-matrix-divider-beam` as a clipped, pointer-ignoring two-pixel track positioned on the divider. Use its `::after` pseudo-element for a short transparent-to-`var(--primary)`-to-transparent gradient. Add horizontal and vertical translation keyframes, five phase selectors with unequal durations/negative delays/alternating directions, and:

```css
@media (prefers-reduced-motion: reduce) {
  .feature-matrix-divider-beam {
    display: none;
  }
}
```

The CSS must not contain runtime randomness, JavaScript hooks, raw color values, or outer-frame animation.

- [x] **Step 6: Generate types and verify**

Run `pnpm run generate:types`, then run the focused Feature Matrix, page-block, and thumbnail fixture tests. Run scoped Prettier and ESLint, `git diff --check`, and `git status --short`. Expected: focused checks pass, generated types include `borderAnimationEnabled?: boolean | null`, and all changes remain unstaged.

- [x] **Step 7: Mark this task complete**

Change every Task 10 checkbox to `[x]` without staging or committing files.

### Task 11: Add per-image positioning and protect custom CSS

**Files:**

- Create: `src/styles/custom.css`
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `src/blocks/FeatureMatrix/config.ts`
- Modify: `src/blocks/FeatureMatrix/Component.tsx`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/payload-types.ts`

**Interfaces:**

- Consumes: the Feature Spotlight mappings `center -> object-[center_center]`, `top -> object-[center_top]`, `bottom -> object-[center_bottom]`, `left -> object-[left_center]`, and `right -> object-[right_center]`.
- Produces: exported `FeatureMatrixImagePosition`, optional `FeatureMatrixItem.imagePosition`, required Payload `features[].imagePosition`, `data-feature-matrix-image-position`, and the separately imported `src/styles/custom.css` boundary.

- [x] **Step 1: Add failing schema, rendering, and stylesheet contracts**

Extend the test field shape to read `defaultValue`. Assert that `features[].imagePosition` is a required select, defaults to `center`, and has values in this exact order:

```ts
;['center', 'top', 'bottom', 'left', 'right']
```

Render four features with Top, Bottom, Left, and Right positions and assert one occurrence each of `object-[center_top]`, `object-[center_bottom]`, `object-[left_center]`, and `object-[right_center]`. Render omitted and null values and assert they use `object-[center_center]`. Assert `src/styles/custom.css` contains `.feature-matrix-divider-beam`, `var(--primary)`, and the reduced-motion rule; assert `globals.css` contains `@import './custom.css';` but no Feature Matrix selector or keyframe body.

- [x] **Step 2: Run the focused test and verify failure**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: failure because per-image fields, object-position classes, and `custom.css` do not exist.

- [x] **Step 3: Add the per-feature Payload field**

Add this field after each feature upload in `src/blocks/FeatureMatrix/config.ts`:

```ts
{
  name: 'imagePosition',
  label: 'Background Position',
  type: 'select',
  defaultValue: 'center',
  options: [
    { label: 'Center', value: 'center' },
    { label: 'Top', value: 'top' },
    { label: 'Bottom', value: 'bottom' },
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField
```

- [x] **Step 4: Resolve and render each image position independently**

Export:

```ts
export type FeatureMatrixImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
```

Add `imagePosition?: FeatureMatrixImagePosition | null` to `FeatureMatrixItem` and use this map:

```ts
const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const
```

Resolve `feature.imagePosition ?? 'center'` inside the panel map, add its class to that panel's image, and expose `data-feature-matrix-image-position` on the image. Add the same optional field to the wrapper's feature shape and preserve it when constructing `FeatureMatrixItem` values.

- [x] **Step 5: Move Feature Matrix CSS out of globals**

Create `src/styles/custom.css` containing the complete Feature Matrix divider selectors, five phase definitions, horizontal and vertical keyframes, and reduced-motion media query currently at the end of `globals.css`. Remove that complete block from `globals.css`, then add this import with the other top-level CSS imports before any rules:

```css
@import './custom.css';
```

Do not add inline styles, duplicate selectors, or component-side stylesheet injection.

- [x] **Step 6: Generate types and verify**

Run `pnpm run generate:types`, focused Feature Matrix/page-block/thumbnail fixture tests, scoped Prettier and ESLint, and `git diff --check`. Use a browser computed-style check to confirm all five object-position mappings and the enabled/reduced-motion animation behavior still load through `custom.css`. Expected: all focused checks pass and generated types contain required `features[].imagePosition`.

- [x] **Step 7: Mark this task complete**

Change every Task 11 checkbox to `[x]` without staging or committing files.
