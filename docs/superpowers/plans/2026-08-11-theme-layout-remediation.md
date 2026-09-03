# Theme and Block Layout Remediation Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in order. Do not stage, commit, or push.

**Goal:** Make every production block adapt correctly to every selected website theme, correct the known responsive composition defects, and restore reliable automated block coverage.

**Architecture:** Fix accessible, selector-scoped theme tokens first. Then make the shared block appearance wrapper the owner of outer-surface foreground behavior, refactor blocks to consume it, correct responsive layouts, and finish with Payload inventory and visual-matrix coverage.

**Tech Stack:** Next.js 16, React 19, Payload CMS 3, Tailwind CSS 4, shadcn/Radix, Vitest, Playwright, TypeScript.

## Global Constraints

- Preserve all existing uncommitted work and inspect overlapping diffs before editing.
- Do not stage, commit, force-push, or install dependencies.
- Preserve the existing block designs; this is not a redesign.
- Keep intentional media-overlay, rating, destructive, and admin-chrome colors.
- Horizontal Timeline labels are generated as `Step 01`, `Step 02`, `Step 03`, and so on.
- `ReusableSection` remains excluded from its own nested layout.

---

### Task 1: Establish the accessible theme-token contract

**Files:**
- Create: `tests/helpers/oklchContrast.ts`
- Create: `tests/int/theme-contracts.int.spec.ts`
- Modify: `tests/int/theme-settings.int.spec.ts`
- Modify: `src/styles/themes/theme-default.css`
- Modify: `src/styles/themes/theme-blue.css`
- Modify: `src/styles/themes/theme-sunset.css`
- Modify: `src/styles/themes/theme-kodama.css`
- Modify: `src/styles/themes/theme-snmih.css`
- Modify: `src/styles/globals.css`
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/checkbox.tsx`
- Modify: `src/blocks/TabsContent/TabsContentClient.tsx`

**Interfaces:**
- Uses `primary` as the single brand token for filled actions, links, and active navigation text.
- Adds deterministic `parseOklch`, `relativeLuminance`, and `contrastRatio` test helpers.

- [ ] **Step 1: Write the OKLCH helper and failing tests**

Parse opaque `oklch(L C H)` values, convert OKLab to clamped linear sRGB, and calculate WCAG contrast. Tests must load all five theme files and require a `4.5` ratio for `background/foreground`, `card/card-foreground`, `primary/primary-foreground`, `secondary/secondary-foreground`, `accent/accent-foreground`, and `primary/background` in light and dark modes.

Also assert that every named theme selector contains `data-theme-color`, SNMIH has no standalone `:root` or `.dark`, and the radius scale uses multiplication rather than subtraction or addition.

- [ ] **Step 2: Run the tests and confirm current failures**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/theme-settings.int.spec.ts
```

Expected: failures for unscoped SNMIH, low primary contrast, and the current radius scale.

- [ ] **Step 3: Scope SNMIH and unify primary action tokens**

Use these selectors and keep one primary token for buttons, links, and active navigation labels:

```css
:root[data-theme-color='snmih'] {
  --primary: oklch(0.488 0.243 264.376);
}

:root[data-theme-color='snmih'].dark {
  --primary: oklch(0.72 0.16 264);
}
```

Use contrast-safe primary values in the other theme modes:

```text
Default: preserve light; dark 0.72 0.16 150
Blue: preserve light; dark 0.72 0.16 264
Sunset: light 0.52 0.14 34.71; dark 0.78 0.13 34.71
Kodama: light 0.43 0.08 118; dark 0.78 0.05 132
```

- [ ] **Step 4: Correct filled-action foreground pairs**

Pair each adjusted primary with the opposing background color, while preserving already-valid light pairs. Keep Sunset's secondary pair contrast-safe.

Mirror matching sidebar primary pairs when the sidebar shares that primary.

- [ ] **Step 5: Expose and consume semantic action tokens**

Change the shadcn link button and underline-style active Tabs Content label to `text-primary`. Keep filled tabs on `bg-primary text-primary-foreground`.

Use this filled-button hover:

```text
hover:bg-[color-mix(in_oklch,var(--primary),var(--foreground)_8%)]
```

- [ ] **Step 6: Make radii zero-safe**

Use this derived scale:

```css
--radius-xs: calc(var(--radius) * 0.25);
--radius-sm: calc(var(--radius) * 0.5);
--radius-md: calc(var(--radius) * 0.75);
--radius-lg: var(--radius);
--radius-xl: calc(var(--radius) * 1.5);
--radius-2xl: calc(var(--radius) * 1.8);
--radius-3xl: calc(var(--radius) * 2.2);
--radius-4xl: calc(var(--radius) * 2.6);
```

Replace the checkbox's `rounded-[5px]` with `rounded-sm`.

- [ ] **Step 7: Verify Task 1**

Rerun the Task 1 tests. Expected: all pass.

---

### Task 2: Simplify the shared appearance API and rich text

**Files:**
- Modify: `src/blocks/shared/blockAppearance.ts`
- Modify: `src/blocks/shared/blockAppearanceFields.ts`
- Modify all callers of `createBlockAppearanceFields({ includeTextOverride: false })`
- Modify: `src/blocks/RichTextBlock/Component.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Create: `tests/int/block-appearance-contract.int.spec.tsx`

**Interfaces:**
- `BlockAppearance` contains only `background` and `border`.
- The resolver keeps returning background, foreground, border, and merged class names.
- Direct surface copy uses inherited current color; nested surfaces declare paired semantic foregrounds.

- [ ] **Step 1: Add failing contract tests**

Test all five background resolutions, require the absence of a `textColor` schema field, and require Rich Text to avoid `prose-neutral` and `dark:prose-invert`.

- [ ] **Step 2: Confirm failures**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-appearance-contract.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts
```

- [ ] **Step 3: Remove the unreachable text override**

Remove `textColor` from `BlockAppearance`, delete `includeTextOverride` and `textColorField`, and change all callers to the remaining factory options. Preserve the exact background and border options.

- [ ] **Step 4: Make rich text semantic**

Replace neutral/invert typography with `text-current` typography variables. Body, headings, bold, quotes, and counters use current color; links use `var(--primary)`; bullets, rules, and quote borders use `var(--border)`; supporting typography mixes current color with 30% transparency. Preserve link underlines and focus visibility.

- [ ] **Step 5: Verify Task 2**

Rerun the Task 2 tests. Expected: all pass.

---

### Task 3: Refactor production blocks to obey semantic surfaces

**Files:**
- Modify: `src/blocks/FeatureSpotlight/Component.tsx`
- Modify: `src/blocks/QaAccordion/Component.tsx`
- Modify: `src/blocks/ReviewSubmission/Component.tsx`
- Modify: `src/blocks/PageHeader/Component.tsx`
- Modify: `src/blocks/Timeline/Component.tsx`
- Modify: `src/blocks/QuoteBlock/Component.tsx`
- Modify: `src/blocks/AboutSection/Component.tsx`
- Modify: `src/blocks/NumberedSteps/Component.tsx`
- Modify: `src/blocks/IconGrid/Component.tsx`
- Modify: `src/blocks/LogoStrip/Component.tsx`
- Modify: `src/blocks/VideoEmbed/Component.tsx`
- Modify: `src/blocks/AwardsList/Component.tsx`
- Modify: `src/blocks/TestimonialGrid/Component.tsx`
- Modify: `src/blocks/ProgramGrid/ProgramGridClient.tsx`
- Modify: `src/blocks/MediaCarousel/MediaCarouselClient.tsx`
- Modify: `src/components/footer56.tsx`
- Modify: `src/components/contact24.tsx`
- Modify: `src/components/services21.tsx`
- Modify: `src/components/team-showcase.tsx`
- Modify: `src/components/news-events/NewsEventsHighlights.tsx`
- Create: `tests/int/block-surface-semantics.int.spec.ts`

**Interfaces:**
- Direct main copy uses `text-current`; supporting copy uses `text-current/70`.
- Nested cards use `bg-card text-card-foreground` and `text-card-foreground/70`.
- Nested page panels use `bg-background text-foreground`.

- [ ] **Step 1: Add a failing static surface test**

Require representative affected files to use `text-current`, require every `bg-card` block presentation to pair `text-card-foreground`, reject Services 21 `text-red-500`, and reject Team Showcase's blue/green/yellow gradient. Scan production website blocks for raw palette colors with allow-list entries only for rating stars and black/white media overlays.

- [ ] **Step 2: Confirm the failures**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-surface-semantics.int.spec.ts
```

- [ ] **Step 3: Refactor outer-surface copy**

Replace direct `text-foreground` with inherited color or `text-current`; replace direct `text-muted-foreground` with `text-current/70`. Use `border-current/15` for separators that sit directly on a themed surface.

- [ ] **Step 4: Pair nested surfaces**

Pair `bg-card`, `bg-background`, `bg-muted`, and `bg-primary` with their semantic foreground classes. Convert nested card supporting copy to `text-card-foreground/70`. Do not alter intentional media-overlay or rating colors.

- [ ] **Step 5: Remove raw brand leaks**

Use `text-primary` for Services 21 identifiers. Replace the Team Showcase decorative rule with `from-primary/30 via-primary to-primary/30`.

- [ ] **Step 6: Verify Task 3**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-surface-semantics.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: both pass.

---

### Task 4: Fix Timeline sequencing and responsive composition

**Files:**
- Modify: `src/blocks/Timeline/Component.tsx`
- Modify: `src/components/gallery-showcase-fan.tsx`
- Modify: `src/components/gallery-showcase.tsx`
- Modify: `src/components/team-showcase.tsx`
- Modify: `src/blocks/NumberedSteps/Component.tsx`
- Modify: `src/blocks/PageBlockStack.tsx`
- Create: `tests/int/block-layout-contracts.int.spec.tsx`

**Interfaces:**
- `formatStepLabel(index)` returns a one-based two-digit label.
- Team and Numbered Steps grid helpers derive columns from item counts.

- [ ] **Step 1: Add failing layout tests**

Render four horizontal Timeline items whose CMS labels all say `Step 01`; require one each of `Step 01` through `Step 04`. Also require a safe Team mobile image aspect ratio, three-member desktop columns, four-column numbered steps for four cards, no PageBlockStack `gap-4`, and dedicated Gallery Showcase fan/content separation.

- [ ] **Step 2: Confirm failures**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-layout-contracts.int.spec.tsx
```

- [ ] **Step 3: Generate horizontal Timeline labels**

Add and use only in the horizontal variant:

```ts
export const formatStepLabel = (index: number) =>
  `Step ${String(index + 1).padStart(2, '0')}`
```

Other Timeline variants retain editorial badges and dates.

- [ ] **Step 4: Correct Gallery Showcase overlap**

Use `h-48 sm:h-60 lg:h-68` for the default/none fan, `h-44 sm:h-56 lg:h-60` for compact, and `h-52 sm:h-68 lg:h-72` for comfortable. Change the section stack to `gap-8 sm:gap-10`, preserve the five transforms, and keep horizontal clipping without vertical clipping.

- [ ] **Step 5: Make Team Showcase mobile-safe and count-aware**

Use `aspect-square w-full md:size-12 md:aspect-auto` around fill images. Use two desktop columns for two members, three for three, and three-to-four responsive columns for four or more.

- [ ] **Step 6: Make Numbered Steps count-aware**

Use four large columns for four cards and three columns for three, five, or six cards, retaining one/two-column fallbacks below large screens.

- [ ] **Step 7: Remove duplicate mobile stack spacing**

Change PageBlockStack to `flex flex-col`; block size settings remain the sole spacing contract.

- [ ] **Step 8: Verify Task 4**

Rerun the layout tests and TypeScript. Expected: both pass.

---

### Task 5: Restore Payload and thumbnail inventory parity

**Files:**
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/blocks/ReusableSection/config.ts`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Regenerate: `src/payload-types.ts`
- Generate: `public/block-thumbnails/reusable-section.jpg`

**Interfaces:**
- Reusable Sections accept all page blocks except the recursive wrapper.
- Every registered block has one definition and one unique 1600×900 JPEG.

- [ ] **Step 1: Replace partial inventory expectations**

Derive sorted inventories from the actual collection block arrays. Assert that public and live-preview cases match Pages; Reusable Sections equal Pages minus `reusableSection`; header/footer/system scopes remain isolated; thumbnail definitions equal all registered slugs.

- [ ] **Step 2: Confirm failures**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

- [ ] **Step 3: Add missing reusable blocks**

Register Hero Carousel, Gallery Coverflow, Testimonial Grid, Awards List, and About Section. Keep `ReusableSection` excluded.

- [ ] **Step 4: Add Reusable Section picker metadata**

Add `getBlockThumbnailAdmin('reusableSection')`, a `reusable-section.jpg` definition, and a non-recursive fixture representing a referenced shared section.

- [ ] **Step 5: Fix fixture image dimensions**

Ensure every fixture path passed to `next/image` supplies explicit dimensions or uses `fill` in a sized relative wrapper, including `editorial-landscape.svg`.

- [ ] **Step 6: Regenerate and verify**

```bash
pnpm run generate:types
pnpm run generate:block-thumbnails
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: 44 valid 1600×900 JPEGs and all selected tests passing.

---

### Task 6: Add cross-theme responsive visual QA

**Files:**
- Modify: `src/app/(block-thumbnails)/layout.tsx`
- Modify: `src/block-thumbnails/BlockThumbnailPreviewStage.tsx`
- Modify: `scripts/generate-block-thumbnails.ts`
- Create: `tests/e2e/block-theme-matrix.e2e.spec.ts`

- [ ] **Step 1: Add a failing representative matrix**

Cover CTA, Feature Spotlight, Review Submission, Tabs Content, Timeline, Gallery Showcase, Team Showcase, and Rich Text across default/SNMIH, light/dark, desktop 1440×900, and mobile 390×844. Require no horizontal overflow or console errors.

- [ ] **Step 2: Add validated preview theme controls**

Validate requested themes through the shared registry and apply `data-theme-color`, `.dark`, `data-color-scheme`, and `colorScheme`. Invalid values fall back to the default.

- [ ] **Step 3: Add an unscaled mobile QA mode**

Keep canonical 1600×900 scaling for CMS thumbnails. In QA mode, use actual viewport width and natural content height so tall layouts cannot be hidden by downscaling.

- [ ] **Step 4: Verify Task 6**

```bash
pnpm exec playwright test tests/e2e/block-theme-matrix.e2e.spec.ts --config=playwright.config.ts
```

Expected: every matrix case passes.

---

### Task 6A: Refine the global Search Dialog type scale

**Files:**
- Modify: `src/components/global/SearchDialog.tsx`
- Create: `tests/int/search-dialog-design.int.spec.ts`

**Interfaces:**
- Consumes: existing semantic theme utilities and the current `SearchDialog` state/data flow.
- Produces: the same `SearchDialog` interface with a larger responsive type scale and accessible control targets.

- [ ] **Step 1: Write the failing design-contract test**

Assert that the dialog uses `max-w-2xl`, `text-base sm:text-lg` for the search input, `text-base` for result titles, `text-sm` for supporting copy, 20-pixel icons, a 36-pixel close target, and consistent keyboard-command spacing.

- [ ] **Step 2: Confirm the test fails**

```bash
pnpm exec vitest run tests/int/search-dialog-design.int.spec.ts
```

Expected: failure against the current `text-sm`, 16-pixel icons, and undersized close control.

- [ ] **Step 3: Implement the approved compact command-palette scale**

Use `max-w-2xl`. Update the input row to `gap-4 px-5 py-4 sm:px-6`, the input to `text-base sm:text-lg`, the search/close icons to `size-5`, and the close button to `size-9`. Promote result titles to `text-base`; promote loading, error, empty, idle, and footer guidance to `text-sm`; preserve the compact monospaced group label. Group each keyboard icon and label with `gap-2`, then separate command groups with `gap-4`.

- [ ] **Step 4: Verify the dialog contract and types**

```bash
pnpm exec vitest run tests/int/search-dialog-design.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: both commands pass with no behavior or API changes.

---

### Task 7: Clear existing production lint failures

**Files:**
- Modify: `src/app/(frontend)/error.tsx`
- Modify: `src/blocks/StatsStrip/AnimatedMetricValue.tsx`
- Modify: `src/components/event-gallery-viewer.tsx`
- Modify: `src/components/global/SearchDialog.tsx`
- Modify: `src/blocks/renderPageBlocks.tsx`

- [ ] **Step 1: Capture the baseline**

Run `pnpm run lint`. Expected current production errors: internal home anchor, two Stats Strip synchronous effect updates, Event Gallery synchronous effect update, and Search Dialog synchronous effect update.

- [ ] **Step 2: Correct internal navigation**

Use `next/link` for `/` while preserving styling and accessible copy.

- [ ] **Step 3: Remove synchronous effect-state updates**

For Stats Strip, render the reduced-motion value directly and keep animation updates in callbacks. Stop Event Gallery autoplay in its navigation/timer callback. Derive Search Dialog idle presentation from the debounced query and clear results from the query-change path.

- [ ] **Step 4: Remove touched-file warnings**

Remove stale lint suppressions and replace new page-block `any` casts with generated union members.

- [ ] **Step 5: Verify Task 7**

```bash
pnpm run lint
pnpm exec tsc --noEmit
```

Expected: zero production lint errors and TypeScript success.

---

### Task 8: Final regression and diff review

- [ ] **Step 1: Run integration tests**

```bash
pnpm run test:int
```

- [ ] **Step 2: Run the visual matrix**

```bash
pnpm exec playwright test tests/e2e/block-theme-matrix.e2e.spec.ts --config=playwright.config.ts
```

- [ ] **Step 3: Run production validation**

```bash
pnpm run lint
pnpm exec tsc --noEmit
pnpm run build
```

- [ ] **Step 4: Review scope without staging**

```bash
git status --short
git diff --check
git diff --stat
```

Confirm no unrelated user work was overwritten, no files were staged by this work, and no commit was created.

- [ ] **Step 5: Deliver the handoff**

Report shared contracts, block-specific fixes, exact validation results, any browser/environment limitations, and that all changes remain uncommitted.
