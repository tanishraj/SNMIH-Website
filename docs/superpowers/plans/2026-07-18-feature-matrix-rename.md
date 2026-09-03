# Feature Matrix Complete Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Replace the temporary Feature 166 identity with Feature Matrix across Payload, frontend code, CSS, thumbnails, tests, generated types, and implementation documentation.

**Architecture:** Perform one intentional breaking namespace migration with no compatibility branch. Rename source paths and canonical exports first, then update registration, thumbnails, CSS, tests, types, and docs before running an absence audit for the retired runtime identifiers.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3, TypeScript, Tailwind CSS 4, Vitest, Playwright, Sharp.

## Global Constraints

- Canonical Payload slug is `featureMatrix`; no `feature166` alias or migration is allowed.
- Canonical generated interface is `FeatureMatrixBlock`.
- Canonical markup and CSS prefix is `feature-matrix`.
- Preserve the literal `@shadcnblocks/feature166` only as upstream source attribution.
- Preserve current layout, fields, image positioning, animation values, themes, responsiveness, and reduced-motion behavior.
- Keep project-owned animation CSS in `src/styles/custom.css`.
- Keep every change unstaged.

---

### Task 1: Establish the failing rename contract

**Files:**

- Rename: `tests/int/feature166.int.spec.ts` to `tests/int/feature-matrix.int.spec.ts`
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: current Feature 166 config, renderer, component, thumbnail manifest, fixture, and CSS.
- Produces: failing expectations for `featureMatrix`, `FeatureMatrixBlock`, `data-feature-matrix-*`, `.feature-matrix-*`, and `feature-matrix.jpg`.

- [x] **Step 1: Rename the focused test file without staging it**

Run:

```bash
mv tests/int/feature166.int.spec.ts tests/int/feature-matrix.int.spec.ts
```

- [x] **Step 2: Rewrite the focused contract to the canonical namespace**

Change imports and calls to `FeatureMatrixBlockComponent`, `FeatureMatrixBlock`, and `FeatureMatrix`. Assert:

```ts
expect(FeatureMatrixBlock.slug).toBe('featureMatrix')
expect(FeatureMatrixBlock.interfaceName).toBe('FeatureMatrixBlock')
expect(FeatureMatrixBlock.labels).toEqual({
  singular: 'Feature Matrix',
  plural: 'Feature Matrices',
})
expect(html).toContain('data-feature-matrix="true"')
expect(html).not.toContain('data-feature166')
```

Update every other focused data attribute to the `data-feature-matrix-*` prefix and update the stylesheet assertions to `.feature-matrix-divider-beam`, `--feature-matrix-divider-beam-*`, and `feature-matrix-divider-beam-*` keyframes.

- [x] **Step 3: Update shared registration and thumbnail expectations**

Expect Pages and system page slug lists to include `featureMatrix` and exclude `feature166`. Expect the thumbnail manifest to expose slug `featureMatrix`, file `feature-matrix.jpg`, and no old slug or filename.

- [x] **Step 4: Run the renamed focused tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/feature-matrix.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts --config ./vitest.config.mts
```

Expected: failures because source exports, registration, markup, CSS, and thumbnail metadata still use Feature 166.

### Task 2: Rename source paths, exports, markup, and CSS

**Files:**

- Rename: `src/blocks/Feature166` to `src/blocks/FeatureMatrix`
- Rename: `src/components/feature166.tsx` to `src/components/feature-matrix.tsx`
- Modify: `src/blocks/FeatureMatrix/config.ts`
- Modify: `src/blocks/FeatureMatrix/Component.tsx`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `src/styles/custom.css`

**Interfaces:**

- Consumes: the complete current Feature 166 behavior.
- Produces: `FeatureMatrixBlock`, `FeatureMatrixBlockComponent`, `FeatureMatrix`, supporting `FeatureMatrix*` types, `data-feature-matrix-*`, and `.feature-matrix-divider-beam`.

- [x] **Step 1: Rename source paths without staging them**

Run:

```bash
mv src/blocks/Feature166 src/blocks/FeatureMatrix
mv src/components/feature166.tsx src/components/feature-matrix.tsx
```

- [x] **Step 2: Rename Payload and React identifiers**

Set the config identity to:

```ts
export const FeatureMatrixBlock: Block = {
  slug: 'featureMatrix',
  interfaceName: 'FeatureMatrixBlock',
  admin: getBlockThumbnailAdmin('featureMatrix'),
  labels: {
    singular: 'Feature Matrix',
    plural: 'Feature Matrices',
  },
}
```

Rename the wrapper, presentational export, supporting types, props, item resolver, and import path from `feature166` to `feature-matrix` without changing field behavior or class values.

- [x] **Step 3: Rename all owned markup identifiers**

Use `data-feature-matrix` and `data-feature-matrix-*` for the section, actions, alignment, background, size, outer border, animation state, panels, divider beams, phases, and image positions. No rendered `data-feature166*` attribute may remain.

- [x] **Step 4: Rename animation identifiers in custom CSS**

Rename `.feature166-divider-beam`, `--feature166-divider-beam-*`, and `feature166-divider-beam-*` keyframes to the `feature-matrix` prefix. Keep every duration, delay, direction, gradient, translation, and reduced-motion rule unchanged.

- [x] **Step 5: Run the focused component test**

Run `pnpm exec vitest run tests/int/feature-matrix.int.spec.ts --config ./vitest.config.mts`. Expected: component and schema assertions pass; registration or thumbnail assertions may remain failing until Task 3.

### Task 3: Rename registration, thumbnails, fixtures, and generated types

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Rename: `public/block-thumbnails/feature-166.jpg` to `public/block-thumbnails/feature-matrix.jpg`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Consumes: `FeatureMatrixBlock` and `FeatureMatrixBlockComponent` from Task 2.
- Produces: page editor registration, frontend rendering, real-render thumbnail, and generated `FeatureMatrixBlock` types using only `featureMatrix`.

- [x] **Step 1: Update Pages and the shared renderer**

Import from `FeatureMatrix`, register `FeatureMatrixBlock`, and replace the switch branch with:

```tsx
case 'featureMatrix':
  return <FeatureMatrixBlockComponent {...block} key={blockKey} />
```

Remove the old case entirely.

- [x] **Step 2: Update thumbnail metadata and fixture**

Set the definition to slug `featureMatrix`, label `Feature Matrix`, and filename `feature-matrix.jpg`. Rename the fixture key and use `FeatureMatrixBlockComponent` with the existing four local media items.

- [x] **Step 3: Rename the existing binary preview**

Run:

```bash
mv public/block-thumbnails/feature-166.jpg public/block-thumbnails/feature-matrix.jpg
```

The pixels remain unchanged because this task changes identity only.

- [x] **Step 4: Regenerate Payload types**

Run `pnpm run generate:types`. Expected: `FeatureMatrixBlock` and `FeatureMatrixBlockSelect` exist, `blockType` is `featureMatrix`, and no `Feature166Block` declaration remains.

- [x] **Step 5: Run integration coverage**

Run the renamed focused test plus page-block, system-page-block, thumbnail-definition, and thumbnail-fixture tests. Expected: all rename contracts pass.

### Task 4: Rename implementation documentation and complete the absence audit

**Files:**

- Rename: `docs/superpowers/specs/2026-07-17-feature166-block-design.md` to `docs/superpowers/specs/2026-07-17-feature-matrix-block-design.md`
- Rename: `docs/superpowers/plans/2026-07-17-feature166-block.md` to `docs/superpowers/plans/2026-07-17-feature-matrix-block.md`
- Modify: renamed design and plan documents
- Modify: `docs/superpowers/specs/2026-07-18-feature-matrix-rename-design.md`
- Modify: `docs/superpowers/plans/2026-07-18-feature-matrix-rename.md`

**Interfaces:**

- Consumes: the completed runtime rename.
- Produces: documentation using Feature Matrix terminology while retaining only the upstream registry token and explicit historical/negative assertions where necessary.

- [x] **Step 1: Rename the original design and plan files**

Run:

```bash
mv docs/superpowers/specs/2026-07-17-feature166-block-design.md docs/superpowers/specs/2026-07-17-feature-matrix-block-design.md
mv docs/superpowers/plans/2026-07-17-feature166-block.md docs/superpowers/plans/2026-07-17-feature-matrix-block.md
```

- [x] **Step 2: Rewrite implementation-facing documentation**

Replace Feature 166 names, paths, exports, commands, data attributes, CSS identifiers, thumbnail identifiers, and filenames with Feature Matrix equivalents. Restore the literal `@shadcnblocks/feature166` wherever the documents identify the upstream source. Historical old-name references are allowed only in this rename spec/plan and negative tests.

- [x] **Step 3: Format, lint, and test**

Run scoped Prettier and ESLint, then the focused and integration suites. Run `git diff --check` and `git status --short`. Do not stage or commit.

- [x] **Step 4: Verify runtime behavior in a browser**

Confirm the real-render preview at `/block-thumbnail-previews/featureMatrix` loads, responsive matrix proportions remain intact, all five image positions compute correctly, normal motion exposes horizontal/vertical animation names, and reduced motion hides every divider beam.

- [x] **Step 5: Audit the retired namespace**

Search runtime files for `Feature166`, `feature166`, `Feature 166`, `feature-166.jpg`, `data-feature166`, and `.feature166-`. Expected: no matches in `src`, public assets, or positive fixture/config assertions. Matches are permitted only for `@shadcnblocks/feature166`, explicit negative tests, and historical explanation in the rename spec/plan.

- [x] **Step 6: Mark this plan complete**

Change every checkbox in this plan to `[x]` without staging or committing files.
