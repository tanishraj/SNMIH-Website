# Mobile Block Container Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Feature Spotlight, FAQ, and Footer one consistent mobile container rhythm while preserving current desktop layouts.

**Architecture:** Keep the existing page-block stack gap and centralize the reusable mobile content container alongside the existing size-based padding map. Feature Spotlight will apply size padding at the outer mobile section for filled media modes, use a consistent stacked gap, and restore its current content padding at `md`. Footer will adopt the default mobile padding and retain `md:py-32`.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, Payload CMS 3, Vitest, Playwright.

## Global Constraints

- Mobile content gutter is exactly `16px` (`px-4`).
- Mobile page-block gap remains exactly `16px` (`gap-4`).
- Regular mobile vertical padding remains compact `40px`, default `48px`, comfortable `64px`.
- Stacked Feature Spotlight media-to-content gap is exactly `32px` (`gap-8`).
- Edge-to-edge media remains horizontally full-bleed.
- Desktop layout and spacing remain unchanged from `md` upward.
- Do not modify Payload fields or stored content.
- Do not stage or commit any files.

---

### Task 1: Shared mobile container contract

**Files:**
- Modify: `src/blocks/shared/blockSpacing.ts`
- Test: `tests/int/faq-render.int.spec.ts`

**Interfaces:**
- Produces: `regularBlockContainerClasses: string` for normal `max-w-screen-2xl` content wrappers.
- Preserves: `regularBlockMobilePaddingClasses: Record<RegularBlockSize, string>`.

- [ ] **Step 1: Add a failing FAQ container assertion**

```ts
expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
```

- [ ] **Step 2: Run the FAQ test and confirm the shared constant is not yet consumed**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/faq-render.int.spec.ts`

- [ ] **Step 3: Export and consume the shared container class**

```ts
export const regularBlockContainerClasses = 'mx-auto w-full max-w-screen-2xl px-4'
```

Replace the literal FAQ wrapper with `regularBlockContainerClasses` through `cn()`.

- [ ] **Step 4: Run the FAQ test**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/faq-render.int.spec.ts`

Expected: all FAQ tests pass.

### Task 2: Normalize every Feature Spotlight mobile layout

**Files:**
- Modify: `src/blocks/FeatureSpotlight/Component.tsx`
- Test: `tests/int/feature-spotlight.int.spec.ts`

**Interfaces:**
- Consumes: `regularBlockMobilePaddingClasses` and `regularBlockContainerClasses` from `src/blocks/shared/blockSpacing.ts`.
- Produces: consistent mobile outer padding and stacked gap for `contained`, `containedFill`, `edgeToEdge`, and `contentOnly`.

- [ ] **Step 1: Update render assertions for filled media modes**

For default filled layouts, assert the section includes `py-12 md:py-0`; for comfortable layouts assert `py-16 md:py-0`. Assert filled grids include `gap-8 md:gap-0`. Assert content wrappers no longer contain unprefixed `py-*` and retain their existing `md:py-*` values.

- [ ] **Step 2: Run the Feature Spotlight test and verify the new assertions fail**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/feature-spotlight.int.spec.ts`

Expected: failures identify missing outer mobile padding and filled-grid gap.

- [ ] **Step 3: Apply mobile outer spacing to filled modes**

```tsx
const filledSectionPaddingClasses = renderAsEdgeToEdge || renderAsContainedFill
  ? cn(regularBlockMobilePaddingClasses[resolvedSize], 'md:py-0')
  : undefined

<section className={cn(filledSectionPaddingClasses, appearanceClasses.className)}>
```

Use `gap-8 md:gap-0` on the edge-to-edge and contained-fill grids. Remove mobile vertical padding from their content wrappers while retaining `md:py-10`, `md:py-12`, or `md:py-16`. Keep edge-to-edge content at `px-4` and contained-fill within the normal shared container.

- [ ] **Step 4: Run Feature Spotlight tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/feature-spotlight.int.spec.ts`

Expected: all Feature Spotlight tests pass.

### Task 3: Normalize Footer mobile padding

**Files:**
- Modify: `src/components/footer56.tsx`
- Test: `tests/int/global-footer.int.spec.ts`

**Interfaces:**
- Consumes: `regularBlockContainerClasses` and `regularBlockMobilePaddingClasses.default`.
- Produces: Footer section classes `py-12 md:py-32` and the same `16px` content gutter as FAQ and Feature Spotlight.

- [ ] **Step 1: Add failing Footer spacing assertions**

```ts
expect(html).toContain('py-12 md:py-32')
expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
```

- [ ] **Step 2: Run the Footer test and confirm the padding assertion fails**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts`

- [ ] **Step 3: Apply shared Footer spacing**

```tsx
const sectionClassName = cn(
  regularBlockMobilePaddingClasses.default,
  'md:py-32',
  appearanceClasses.className,
  className,
)
```

Use `regularBlockContainerClasses` for the Footer content wrapper.

- [ ] **Step 4: Run Footer tests**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/global-footer.int.spec.ts`

Expected: all Footer tests pass.

### Task 4: Cross-block verification

**Files:**
- Verify: all files modified in Tasks 1–3

**Interfaces:**
- Consumes: the completed shared spacing contract.
- Produces: test and rendered-browser evidence that mobile spacing is consistent and desktop is unchanged.

- [ ] **Step 1: Run focused integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/feature-spotlight.int.spec.ts \
  tests/int/faq-render.int.spec.ts \
  tests/int/global-footer.int.spec.ts \
  tests/int/page-blocks.int.spec.ts
```

Expected: all focused tests pass.

- [ ] **Step 2: Run lint and diff checks**

Run ESLint on the changed TypeScript files, then run `git diff --check` and `git diff --cached --name-only`.

Expected: no lint errors, no whitespace errors, and no staged files.

- [ ] **Step 3: Measure the rendered page at mobile and desktop widths**

At `390px`, verify all default regular sections have `48px` outer vertical padding, filled Feature Spotlight grids have `32px` media/content gaps, content begins at `16px`, and Footer has `48px` top/bottom padding. At `1024px`, verify the existing filled-layout gap is `0px`, FAQ remains `128px`, and Footer remains `128px`.
