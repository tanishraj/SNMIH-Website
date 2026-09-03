# Feature Matrix Responsive Image Height Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing Feature Matrix size control apply a clearly differentiated responsive height to all four panel images.

**Architecture:** Keep the Payload schema and component API unchanged. Strengthen the existing `imageHeightClasses` mapping in the presentation component and cover all three size modes with exact server-rendered class assertions.

**Tech Stack:** React 19, Next.js 16, TypeScript 5.7, Tailwind CSS, Payload CMS 3.85, Vitest.

## Global Constraints

- Compact image height is `h-36 md:h-40 lg:h-44`.
- Default image height is `h-44 md:h-52 lg:h-60`.
- Comfortable image height is `h-52 md:h-64 lg:h-72`.
- All four images in one Feature Matrix instance use the same height classes.
- Preserve the Payload `size` field, section and panel spacing, grid, typography, actions, borders, animation, `object-cover`, and image positions.
- Do not modify stored content or the database.
- Do not stage or commit any files.

---

### Task 1: Apply and verify responsive image heights

**Files:**
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `src/components/feature-matrix.tsx`

**Interfaces:**
- Consumes: `FeatureMatrixSize = 'comfortable' | 'compact' | 'default'`.
- Produces: one exact responsive height class string per size, applied to each rendered image.

- [ ] **Step 1: Add failing coverage for all size modes**

Add this test after the compact presentation test:

```ts
it.each([
  ['compact', 'h-36 md:h-40 lg:h-44'],
  ['default', 'h-44 md:h-52 lg:h-60'],
  ['comfortable', 'h-52 md:h-64 lg:h-72'],
] as const)('applies equal responsive image heights in %s mode', (size, classes) => {
  const html = renderToStaticMarkup(
    FeatureMatrix({ features, size, title: 'What we provide' }),
  )

  expect(html.match(new RegExp(classes, 'g'))).toHaveLength(4)
})
```

Update the existing compact presentation assertion from the old height string to `h-36 md:h-40 lg:h-44`.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/feature-matrix.int.spec.ts`

Expected: failures show that the existing image height mapping still uses the old class strings.

- [ ] **Step 3: Replace the image-height map**

```ts
const imageHeightClasses = {
  compact: 'h-36 md:h-40 lg:h-44',
  default: 'h-44 md:h-52 lg:h-60',
  comfortable: 'h-52 md:h-64 lg:h-72',
} as const
```

Do not alter the image JSX, which continues to combine the selected height with `mt-2 w-full rounded-md object-cover` and the selected image-position class.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/feature-matrix.int.spec.ts
pnpm exec eslint src/components/feature-matrix.tsx tests/int/feature-matrix.int.spec.ts
git diff --check
git diff --cached --name-only
```

Expected: all Feature Matrix tests pass, lint and diff checks pass, and staged output is empty.

- [ ] **Step 5: Verify responsive rendering**

Load `/block-thumbnail-previews/featureMatrix` at 390px and 1440px widths. For each selected size in a direct component render, verify that all four images have equal computed heights and that the image position classes remain present.
