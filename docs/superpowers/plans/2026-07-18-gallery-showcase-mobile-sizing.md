# Gallery Showcase Mobile Sizing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Gallery Showcase card and fan dimensions below the `sm` breakpoint so all five transformed images fit narrow mobile viewports while preserving distinct size presets.

**Architecture:** Change only the module-level responsive class maps in the isolated Gallery Showcase fan Client Component. Keep its transforms, drag behavior, reduced-motion handling, Payload schema, server adapter, content presentation, and all `sm`/`lg` sizes unchanged.

**Tech Stack:** React 19.2.7, Next.js 16.2.10, TypeScript 5.7.3, Tailwind CSS 4, Framer Motion 12, Vitest, Playwright thumbnail generator.

## Global Constraints

- Compact mobile card is `size-16`; Default is `size-20`; Comfortable is `size-24`.
- Compact mobile fan is `h-28`; Default is `h-32`; Comfortable is `h-36`.
- Existing `sm` and `lg` card sizes and fan heights remain unchanged.
- Percentage transforms, source order, drag behavior, reduced motion, image positioning, and horizontal clipping remain unchanged.
- Payload fields, generated Payload types, server adapter, content order, typography, actions, and appearance remain unchanged.
- Regenerate the deterministic Gallery Showcase thumbnail and verify no hydration or browser-console errors.
- Do not stage or commit any changes.

## File Structure

- Modify `tests/int/gallery-showcase.int.spec.ts`: lock exact mobile, `sm`, and `lg` class contracts for all three presets.
- Modify `src/components/gallery-showcase-fan.tsx`: replace only base card and fan size tokens.
- Regenerate `public/block-thumbnails/gallery-showcase.jpg`: reflect the smaller base sizing contract while retaining the deterministic desktop preview.

---

### Task 1: Reduce mobile fan and card sizes

**Files:**

- Modify: `tests/int/gallery-showcase.int.spec.ts`
- Modify: `src/components/gallery-showcase-fan.tsx`
- Regenerate: `public/block-thumbnails/gallery-showcase.jpg`

**Interfaces:**

- Consumes: `GalleryShowcase({ images, size, title })`, `GalleryShowcaseSize`, and the existing `fanHeightClasses`/`cardSizeClasses` responsive class maps.
- Produces: exact responsive contracts `h-28/32/36` and `size-16/20/24` below `sm`, with existing tablet and desktop tokens retained.

- [ ] **Step 1: Change the parameterized test to the approved responsive contracts**

Replace the existing size cases in `tests/int/gallery-showcase.int.spec.ts` with:

```ts
it.each([
  ['compact', 'h-28 sm:h-48 lg:h-52', 'size-16 sm:size-36 lg:size-40'],
  ['default', 'h-32 sm:h-52 lg:h-60', 'size-20 sm:size-40 lg:size-44'],
  ['comfortable', 'h-36 sm:h-60 lg:h-64', 'size-24 sm:size-44 lg:size-48'],
] as const)('applies %s fan and card sizing', (size, fanClasses, cardClasses) => {
  const html = renderToStaticMarkup(
    GalleryShowcase({ images: galleryImages, size, title: 'Gallery' }),
  )

  expect(html).toContain(fanClasses)
  expect(html.split(cardClasses)).toHaveLength(6)
})
```

Also update the compact rendering assertion from:

```ts
expect(html).toContain('h-40 sm:h-48 lg:h-52')
expect(html).toContain('size-28 sm:size-36 lg:size-40')
```

to:

```ts
expect(html).toContain('h-28 sm:h-48 lg:h-52')
expect(html).toContain('size-16 sm:size-36 lg:size-40')
```

- [ ] **Step 2: Run the focused test and verify it fails for the old base tokens**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-showcase.int.spec.ts
```

Expected: three size cases and the compact rendering assertion fail because the component still emits `h-40/44/48` and `size-28/32/36` at the base breakpoint.

- [ ] **Step 3: Replace only the base sizing tokens**

In `src/components/gallery-showcase-fan.tsx`, replace both maps with:

```ts
const fanHeightClasses = {
  compact: 'h-28 sm:h-48 lg:h-52',
  default: 'h-32 sm:h-52 lg:h-60',
  comfortable: 'h-36 sm:h-60 lg:h-64',
} as const

const cardSizeClasses = {
  compact: 'size-16 sm:size-36 lg:size-40',
  default: 'size-20 sm:size-40 lg:size-44',
  comfortable: 'size-24 sm:size-44 lg:size-48',
} as const
```

Do not change `galleryShowcaseTransforms`, the object-position map, motion props, or hydration snapshot helpers.

- [ ] **Step 4: Format and run focused tests**

Run:

```bash
pnpm exec prettier --write src/components/gallery-showcase-fan.tsx tests/int/gallery-showcase.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-showcase.int.spec.ts
```

Expected: all Gallery Showcase integration tests pass.

- [ ] **Step 5: Regenerate thumbnails and verify browser rendering**

Run:

```bash
pnpm generate:block-thumbnails
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: every thumbnail generates successfully without hydration or console errors; both thumbnail test files pass.

- [ ] **Step 6: Run scoped quality checks and confirm nothing new was staged**

Run:

```bash
pnpm exec eslint src/components/gallery-showcase-fan.tsx tests/int/gallery-showcase.int.spec.ts
git diff --check
git status --short
```

Expected: scoped ESLint and diff checks pass. The mobile sizing edits remain unstaged; pre-existing staged Gallery Showcase work is not modified in the index.
