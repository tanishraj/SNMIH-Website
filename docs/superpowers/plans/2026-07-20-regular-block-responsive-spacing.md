# Regular Block Responsive Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize every regular content block to `py-12 md:py-16` outer spacing, independent of its Compact, Default, or Comfortable Size setting.

**Architecture:** Keep the existing shared spacing map as the single compatibility boundary, but make all three size keys return the same responsive classes. Remove local desktop outer-padding overrides from exceptional regular sections, while preserving Feature Spotlight's filled-media behavior through a single fixed desktop content inset.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19, Tailwind CSS 4, Vitest

## Global Constraints

- Compact, Default, and Comfortable all use `py-12 md:py-16` outer padding.
- Size settings may continue controlling internal dimensions and gaps.
- Do not change theme, border, alignment, media placement, or data behavior.
- Keep Hero Banner, Announcement, Header, Stats Strip, and full-height system pages unchanged.
- Keep Feature Spotlight filled media full-height on desktop.
- Add no dependency or global CSS.
- Keep all changes unstaged.

---

### Task 1: Centralize the shared regular-block spacing contract

**Files:**

- Modify: `src/blocks/shared/blockSpacing.ts`
- Create: `tests/int/regular-block-spacing.int.spec.tsx`

**Interfaces:**

- Consumes: `RegularBlockSize`
- Produces: `regularBlockMobilePaddingClasses: Record<RegularBlockSize, 'py-12 md:py-16'>`

- [ ] **Step 1: Write the failing shared-contract test**

Create a focused test that asserts the exact map:

```ts
expect(regularBlockMobilePaddingClasses).toEqual({
  compact: 'py-12 md:py-16',
  default: 'py-12 md:py-16',
  comfortable: 'py-12 md:py-16',
})
```

In the same test, read these presentation sources with `readFileSync` and assert each contains `regularBlockMobilePaddingClasses`:

```ts
const regularBlockSources = [
  'src/components/gallery-showcase.tsx',
  'src/components/profile-carousel.tsx',
  'src/components/content-highlights.tsx',
  'src/components/image-mosaic.tsx',
  'src/components/news-events/NewsEventsHighlights.tsx',
  'src/components/review-feed.tsx',
]

for (const sourcePath of regularBlockSources) {
  expect(readFileSync(sourcePath, 'utf8')).toContain('regularBlockMobilePaddingClasses')
}
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/regular-block-spacing.int.spec.tsx`

Expected: FAIL because the three size keys currently resolve to different mobile-only values.

- [ ] **Step 3: Normalize the shared map**

Change `src/blocks/shared/blockSpacing.ts` to:

```ts
export const regularBlockMobilePaddingClasses = {
  compact: 'py-12 md:py-16',
  default: 'py-12 md:py-16',
  comfortable: 'py-12 md:py-16',
} as const satisfies Record<RegularBlockSize, string>
```

- [ ] **Step 4: Run the shared-contract test**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/regular-block-spacing.int.spec.tsx`

Expected: PASS.

### Task 2: Remove oversized regular-section overrides

**Files:**

- Modify: `src/blocks/QaAccordion/Component.tsx`
- Modify: `src/blocks/ReviewSubmission/Component.tsx`
- Modify: `src/components/footer56.tsx`
- Modify: `tests/int/qa-accordion.int.spec.ts`
- Modify: `tests/int/review-submission-render.int.spec.ts`
- Modify: `tests/int/footer-spacing.int.spec.ts`

**Interfaces:**

- Consumes: normalized `regularBlockMobilePaddingClasses`
- Produces: Q&A Accordion, Review Submission, and Footer without local outer `md:py-*` overrides

- [ ] **Step 1: Update focused expectations first**

Change all three size expectations in the Review Submission test to `py-12 md:py-16`. Change Q&A expectations from `py-10 md:py-32` and `py-16 md:py-32` to `py-12 md:py-16`. Change the Footer expectation from `py-12 md:py-32` to `py-12 md:py-16`.

- [ ] **Step 2: Run the focused tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/qa-accordion.int.spec.ts tests/int/review-submission-render.int.spec.ts tests/int/footer-spacing.int.spec.ts
```

Expected: FAIL because the components still append oversized desktop classes.

- [ ] **Step 3: Remove the local outer-padding overrides**

In Q&A Accordion, remove `'md:py-32'` from the section class. In Review Submission, delete `sectionDesktopPaddingClasses` and remove its use from the section class. In Footer, remove `'md:py-32'` from `sectionClassName`. Leave form-panel padding and footer internal spacing unchanged.

- [ ] **Step 4: Run the focused tests**

Run the Task 2 Vitest command again.

Expected: PASS.

### Task 3: Normalize Feature Spotlight without breaking filled media

**Files:**

- Modify: `src/blocks/FeatureSpotlight/Component.tsx`
- Modify: `tests/int/feature-spotlight.int.spec.ts`

**Interfaces:**

- Consumes: normalized `regularBlockMobilePaddingClasses`
- Produces: fixed `md:py-16` filled-content inset, shared regular-layout outer padding, and retained `md:py-0` filled-media outer behavior

- [ ] **Step 1: Update Feature Spotlight expectations first**

Assert that regular contained/content-only modes include `py-12 md:py-16` once. Assert that `edgeToEdge` and `containedFill` sections include `py-12 md:py-0`, and their content wrappers include `md:py-16` regardless of Size.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `pnpm exec vitest run --config ./vitest.config.mts tests/int/feature-spotlight.int.spec.ts`

Expected: FAIL because Feature Spotlight still has size-dependent desktop padding and duplicate regular-layout padding.

- [ ] **Step 3: Simplify Feature Spotlight padding**

Replace `desktopVerticalPaddingClasses` with the fixed string `md:py-16`. Keep filled section classes as `cn(regularBlockMobilePaddingClasses[resolvedSize], 'md:py-0')`. Use the fixed content inset in edge-to-edge and contained-fill content wrappers. Remove the second desktop-padding argument from regular contained/content-only outer containers.

- [ ] **Step 4: Run the focused Feature Spotlight test**

Run the Task 3 Vitest command again.

Expected: PASS.

### Task 4: Verify the normalized page-block system

**Files:**

- Verify all files changed by Tasks 1–3

**Interfaces:**

- Consumes: the normalized spacing contract and updated regular blocks
- Produces: a verified production build with no new staged changes

- [ ] **Step 1: Run related integration coverage**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/regular-block-spacing.int.spec.tsx tests/int/qa-accordion.int.spec.ts tests/int/review-submission-render.int.spec.ts tests/int/footer-spacing.int.spec.ts tests/int/feature-spotlight.int.spec.ts tests/int/news-events-highlights.int.spec.tsx
```

Expected: all tests pass.

- [ ] **Step 2: Run static verification**

Run:

```bash
pnpm exec eslint src/blocks/shared/blockSpacing.ts src/blocks/QaAccordion/Component.tsx src/blocks/ReviewSubmission/Component.tsx src/blocks/FeatureSpotlight/Component.tsx src/components/footer56.tsx tests/int/regular-block-spacing.int.spec.tsx tests/int/qa-accordion.int.spec.ts tests/int/review-submission-render.int.spec.ts tests/int/footer-spacing.int.spec.ts tests/int/feature-spotlight.int.spec.ts
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Expected: all commands pass and the implementation changes remain unstaged.
