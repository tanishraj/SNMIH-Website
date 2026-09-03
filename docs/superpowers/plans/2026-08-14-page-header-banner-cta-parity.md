# Page Header and Banner CTA Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Page Header the complete Banner CTA configuration and responsive behavior while keeping `h1` semantics, Minimal and Banner variants, and a mutually exclusive Breadcrumb-or-Eyebrow top slot.

**Architecture:** Extract the Banner CTA presentation contract into focused shared modules, then consume those modules from both blocks so labels, defaults, overlay classes, widths, heights, and responsive action behavior cannot drift. Page Header keeps its own renderer because it owns page-level semantics and automatic breadcrumb context, but Minimal and Banner share one internal copy/action layout.

**Tech Stack:** Payload CMS fields, Next.js 16 server components, React 19, TypeScript, Tailwind CSS 4, Vitest, React DOM server rendering.

## Global Constraints

- New Page Header entries expose only `minimal` and `banner`; existing `split` data must still render as Minimal with side actions.
- Top Content is mutually exclusive: Breadcrumb or Eyebrow, never both.
- New entries default Top Content to Breadcrumb; legacy entries without the field prefer a populated eyebrow, then Breadcrumb.
- Page Header must expose every Banner CTA configuration option and every exposed option must affect rendering.
- Banner CTA behavior and visual output must not change.
- Primary Actions allow at most three rows; Footer Actions allow at most two rows.
- No new hard-coded brand colors, arbitrary spacing system, card surface, or decorative treatment.
- Preserve semantic `h1`, breadcrumb navigation semantics, theme-aware focus states, and mobile stacking.
- Preserve unrelated staged or unstaged work. Every task commit must use explicit pathspecs and must not consume unrelated index entries.

---

## File Structure

- Create `src/blocks/shared/bannerCtaFields.ts` — canonical field option arrays and Payload field factories shared by Banner CTA and Page Header.
- Create `src/blocks/shared/bannerCtaPresentation.ts` — canonical presentation types, overlay matrices, width/height/alignment classes, and legacy placement normalization.
- Modify `src/blocks/BannerCta/config.ts` — replace local duplicated field definitions with shared factories.
- Modify `src/blocks/BannerCta/Component.tsx` — consume shared presentation constants without changing markup or defaults.
- Modify `src/blocks/shared/breadcrumbFields.ts` — allow callers to compose a parent condition with automatic/custom breadcrumb conditions.
- Modify `src/blocks/PageHeader/config.ts` — expose Minimal/Banner, Top Content, conditional breadcrumb/eyebrow fields, and the complete Banner CTA settings.
- Modify `src/blocks/PageHeader/Component.tsx` — render one top slot and apply every shared layout/overlay setting.
- Modify `tests/int/page-header-actions.int.spec.tsx` — cover schema parity, legacy placement, layout controls, and Banner presentation.
- Modify `tests/int/page-breadcrumbs.int.spec.tsx` — cover Top Content field conditions, compatibility fallback, and mutually exclusive rendering.
- Modify `src/block-thumbnails/fixtures.tsx` and `public/block-thumbnails/page-header.jpg` — exercise and document the final Banner Page Header.
- Modify `src/payload-types.ts` — regenerate Payload types from the updated schema.

---

### Task 1: Extract the Banner CTA presentation contract

**Files:**

- Create: `src/blocks/shared/bannerCtaPresentation.ts`
- Modify: `src/blocks/BannerCta/Component.tsx`
- Test: `tests/int/page-header-actions.int.spec.tsx`

**Interfaces:**

- Produces: `BannerContentAlignment`, `BannerContentWidth`, `BannerHeight`, `BannerOverlayDirection`, `BannerOverlayStyle`, `BannerThemeMode`, `BannerActionPlacement`, `bannerOverlayClasses`, `bannerTextToneClasses`, `bannerAlignmentClasses`, `bannerActionAlignmentClasses`, `bannerContentWidthClasses`, `bannerTitleSizeClasses`, `bannerHeightClasses`, and `resolveBannerActionPlacement()`.
- Consumes: `RegularBlockSize` from `src/blocks/shared/blockSpacing.ts`.

- [ ] **Step 1: Add a failing legacy placement normalization test**

Add this import and test to `tests/int/page-header-actions.int.spec.tsx`:

```tsx
import { resolveBannerActionPlacement } from '@/blocks/shared/bannerCtaPresentation'

it('normalizes legacy Page Header action placement to the Banner CTA vocabulary', () => {
  expect(resolveBannerActionPlacement('inline')).toBe('below')
  expect(resolveBannerActionPlacement('below')).toBe('below')
  expect(resolveBannerActionPlacement('side')).toBe('side')
  expect(resolveBannerActionPlacement(null)).toBe('side')
})
```

- [ ] **Step 2: Run the focused test and confirm the missing-module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx
```

Expected: FAIL because `@/blocks/shared/bannerCtaPresentation` does not exist.

- [ ] **Step 3: Create the shared presentation module**

Create `src/blocks/shared/bannerCtaPresentation.ts` with the existing Banner CTA values moved verbatim:

```ts
export type BannerActionPlacement = 'below' | 'side'
export type BannerContentAlignment = 'center' | 'left' | 'right'
export type BannerContentWidth = 'default' | 'narrow' | 'wide'
export type BannerHeight = 'compact' | 'default' | 'immersive'
export type BannerOverlayDirection = 'leftToRight' | 'rightToLeft' | 'vertical'
export type BannerOverlayStyle = 'dark' | 'darker' | 'light'
export type BannerThemeMode = 'auto' | 'dark' | 'light'

export const bannerOverlayClasses = {
  auto: {
    light: {
      vertical: 'bg-linear-to-b from-primary/72 via-primary/56 to-primary/78',
      leftToRight: 'bg-linear-to-r from-primary/72 via-primary/56 to-primary/78',
      rightToLeft: 'bg-linear-to-l from-primary/72 via-primary/56 to-primary/78',
    },
    dark: {
      vertical: 'bg-linear-to-b from-primary/86 via-primary/72 to-primary/88',
      leftToRight: 'bg-linear-to-r from-primary/86 via-primary/72 to-primary/88',
      rightToLeft: 'bg-linear-to-l from-primary/86 via-primary/72 to-primary/88',
    },
    darker: {
      vertical: 'bg-linear-to-b from-primary/95 via-primary/82 to-primary/45',
      leftToRight: 'bg-linear-to-r from-primary/95 via-primary/82 to-primary/45',
      rightToLeft: 'bg-linear-to-l from-primary/95 via-primary/82 to-primary/45',
    },
  },
  light: {
    light: {
      vertical: 'bg-linear-to-b from-background/72 via-background/56 to-background/78',
      leftToRight: 'bg-linear-to-r from-background/72 via-background/56 to-background/78',
      rightToLeft: 'bg-linear-to-l from-background/72 via-background/56 to-background/78',
    },
    dark: {
      vertical: 'bg-linear-to-b from-background/82 via-background/68 to-background/86',
      leftToRight: 'bg-linear-to-r from-background/82 via-background/68 to-background/86',
      rightToLeft: 'bg-linear-to-l from-background/82 via-background/68 to-background/86',
    },
    darker: {
      vertical: 'bg-linear-to-b from-background/94 via-background/80 to-background/40',
      leftToRight: 'bg-linear-to-r from-background/94 via-background/80 to-background/40',
      rightToLeft: 'bg-linear-to-l from-background/94 via-background/80 to-background/40',
    },
  },
  dark: {
    light: {
      vertical: 'bg-linear-to-b from-black/56 via-black/42 to-black/62',
      leftToRight: 'bg-linear-to-r from-black/56 via-black/42 to-black/62',
      rightToLeft: 'bg-linear-to-l from-black/56 via-black/42 to-black/62',
    },
    dark: {
      vertical: 'bg-linear-to-b from-black/68 via-black/54 to-black/74',
      leftToRight: 'bg-linear-to-r from-black/68 via-black/54 to-black/74',
      rightToLeft: 'bg-linear-to-l from-black/68 via-black/54 to-black/74',
    },
    darker: {
      vertical: 'bg-linear-to-b from-black/86 via-black/70 to-black/34',
      leftToRight: 'bg-linear-to-r from-black/86 via-black/70 to-black/34',
      rightToLeft: 'bg-linear-to-l from-black/86 via-black/70 to-black/34',
    },
  },
} as const

export const bannerTextToneClasses = {
  auto: { title: 'text-primary-foreground', description: 'text-primary-foreground/84' },
  light: { title: 'text-foreground', description: 'text-foreground/84' },
  dark: { title: 'text-white', description: 'text-white/84' },
} as const

export const bannerAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

export const bannerActionAlignmentClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

export const bannerContentWidthClasses = {
  narrow: 'max-w-xl',
  default: 'max-w-2xl',
  wide: 'max-w-4xl',
} as const

export const bannerTitleSizeClasses = {
  compact: 'text-3xl sm:text-4xl md:text-5xl',
  default: 'text-4xl sm:text-5xl md:text-6xl',
  immersive: 'text-4xl sm:text-6xl md:text-7xl',
} as const

export const bannerHeightClasses = {
  compact: 'min-h-[32dvh]',
  default: 'min-h-[46dvh]',
  immersive: 'min-h-[68dvh]',
} as const

export function resolveBannerActionPlacement(
  value: BannerActionPlacement | 'inline' | null | undefined,
): BannerActionPlacement {
  return value === 'inline' ? 'below' : (value ?? 'side')
}
```

- [ ] **Step 4: Refactor Banner CTA to consume the module without markup changes**

In `src/blocks/BannerCta/Component.tsx`, replace local types and constant maps with imports from `bannerCtaPresentation.ts`. Keep the component defaults and data attributes unchanged:

```ts
import {
  bannerActionAlignmentClasses,
  bannerAlignmentClasses,
  bannerContentWidthClasses,
  bannerHeightClasses,
  bannerOverlayClasses,
  bannerTextToneClasses,
  bannerTitleSizeClasses,
  type BannerActionPlacement,
  type BannerContentAlignment,
  type BannerContentWidth,
  type BannerHeight,
  type BannerOverlayDirection,
  type BannerOverlayStyle,
  type BannerThemeMode,
} from '@/blocks/shared/bannerCtaPresentation'
```

Rename references only: `overlayClasses` → `bannerOverlayClasses`, `textToneClasses` → `bannerTextToneClasses`, `alignmentClasses` → `bannerAlignmentClasses`, `actionAlignmentClasses` → `bannerActionAlignmentClasses`, `contentWidthClasses` → `bannerContentWidthClasses`, `titleSizeClasses` → `bannerTitleSizeClasses`, and `heightClasses` → `bannerHeightClasses`.

- [ ] **Step 5: Run focused tests and TypeScript**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 6: Commit only Task 1 files**

```bash
git add src/blocks/shared/bannerCtaPresentation.ts src/blocks/BannerCta/Component.tsx tests/int/page-header-actions.int.spec.tsx
git commit --only src/blocks/shared/bannerCtaPresentation.ts src/blocks/BannerCta/Component.tsx tests/int/page-header-actions.int.spec.tsx -m "refactor(blocks): share banner presentation"
```

---

### Task 2: Share Banner CTA Payload field definitions

**Files:**

- Create: `src/blocks/shared/bannerCtaFields.ts`
- Modify: `src/blocks/BannerCta/config.ts`
- Modify: `src/blocks/PageHeader/config.ts`
- Test: `tests/int/page-header-actions.int.spec.tsx`

**Interfaces:**

- Produces: `createBannerActionPlacementField()`, `createBannerContentAlignmentField()`, `createBannerContentWidthField()`, `createBannerThemeModeField()`, `createBannerOverlayStyleField()`, `createBannerOverlayDirectionField()`, `createBannerHeightField()`, and `createBannerSectionPaddingField()`.
- Each factory accepts an optional Payload `Condition` and applies the Banner CTA label, default, options, and description verbatim.

- [ ] **Step 1: Replace the old schema assertions with failing parity assertions**

In `tests/int/page-header-actions.int.spec.tsx`, add helpers that read fields by name from each block, then assert the Page Header selector and shared controls:

```tsx
import { BannerCtaBlock } from '@/blocks/BannerCta/config'

const fieldsByTab = (block: typeof PageHeaderBlock) => {
  const tabs = block.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') throw new Error('Expected tabs')
  return tabs.tabs.map((tab) => tab.fields)
}

const namedField = (fields: Field[], name: string) =>
  fields.find((field) => 'name' in field && field.name === name)

it('offers only Minimal and Banner while retaining renderer compatibility separately', () => {
  const theme = fieldsByTab(PageHeaderBlock)[1] ?? []
  expect(namedField(theme, 'variant')).toMatchObject({
    defaultValue: 'minimal',
    options: [
      { label: 'Minimal — theme surface page introduction', value: 'minimal' },
      { label: 'Banner — optional full-bleed background image', value: 'banner' },
    ],
  })
})

it.each([
  'actionPlacement',
  'contentAlignment',
  'contentWidth',
  'themeMode',
  'overlayStyle',
  'overlayDirection',
  'height',
  'size',
])('matches Banner CTA configuration for %s', (name) => {
  const pageHeaderField = namedField(fieldsByTab(PageHeaderBlock)[1] ?? [], name)
  const bannerField = namedField(fieldsByTab(BannerCtaBlock)[1] ?? [], name)
  expect(pageHeaderField).toMatchObject({
    label: bannerField && 'label' in bannerField ? bannerField.label : undefined,
    defaultValue:
      bannerField && 'defaultValue' in bannerField ? bannerField.defaultValue : undefined,
    options: bannerField && 'options' in bannerField ? bannerField.options : undefined,
  })
})

it('allows three primary actions and two footer actions', () => {
  const content = fieldsByTab(PageHeaderBlock)[0] ?? []
  expect(namedField(content, 'actions')).toMatchObject({ maxRows: 3 })
  expect(namedField(content, 'footerActions')).toMatchObject({ maxRows: 2 })
})
```

Import `type { Field } from 'payload'` for the helper.

- [ ] **Step 2: Run the focused test and confirm schema failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx
```

Expected: FAIL because Page Header still exposes Legacy Split, old action placement, and lacks several Banner CTA fields.

- [ ] **Step 3: Create the shared Payload field factories**

Create `src/blocks/shared/bannerCtaFields.ts`. Use one internal helper to attach an optional condition without changing canonical options:

```ts
import type { Condition, SelectField } from 'payload'

const withCondition = (field: SelectField, condition?: Condition): SelectField =>
  condition ? { ...field, admin: { ...field.admin, condition } } : field

export const createBannerActionPlacementField = (condition?: Condition) =>
  withCondition(
    {
      name: 'actionPlacement',
      label: 'Action Placement',
      type: 'select',
      defaultValue: 'side',
      options: [
        { label: 'Side column (stacked beside the copy)', value: 'side' },
        { label: 'Below the copy', value: 'below' },
      ],
      admin: { description: 'The side column stacks back under the copy on small screens.' },
    },
    condition,
  )

export const createBannerContentAlignmentField = (condition?: Condition) =>
  withCondition(
    {
      name: 'contentAlignment',
      label: 'Section Content Alignment',
      type: 'select',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Center', value: 'center' },
        { label: 'Right', value: 'right' },
      ],
    },
    condition,
  )

export const createBannerContentWidthField = (condition?: Condition) =>
  withCondition(
    {
      name: 'contentWidth',
      label: 'Content Width',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Narrow', value: 'narrow' },
        { label: 'Default', value: 'default' },
        { label: 'Wide', value: 'wide' },
      ],
    },
    condition,
  )

export const createBannerThemeModeField = (condition?: Condition) =>
  withCondition(
    {
      name: 'themeMode',
      label: 'Overlay Tone',
      type: 'select',
      defaultValue: 'dark',
      options: [
        { label: 'Auto (theme primary)', value: 'auto' },
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
      ],
      admin: {
        description:
          'Auto tints with the theme primary and follows it into dark mode. Light uses a pale scrim under dark copy. Dark keeps white copy over the image regardless of the site theme.',
      },
    },
    condition,
  )

export const createBannerOverlayStyleField = (condition?: Condition) =>
  withCondition(
    {
      name: 'overlayStyle',
      label: 'Overlay Strength',
      type: 'select',
      defaultValue: 'darker',
      options: [
        { label: 'Light', value: 'light' },
        { label: 'Dark', value: 'dark' },
        { label: 'Darker', value: 'darker' },
      ],
    },
    condition,
  )

export const createBannerOverlayDirectionField = (condition?: Condition) =>
  withCondition(
    {
      name: 'overlayDirection',
      label: 'Overlay Direction',
      type: 'select',
      defaultValue: 'leftToRight',
      options: [
        { label: 'Vertical', value: 'vertical' },
        { label: 'Left to Right', value: 'leftToRight' },
        { label: 'Right to Left', value: 'rightToLeft' },
      ],
    },
    condition,
  )

export const createBannerHeightField = (condition?: Condition) =>
  withCondition(
    {
      name: 'height',
      label: 'Minimum Height',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'Compact', value: 'compact' },
        { label: 'Default', value: 'default' },
        { label: 'Immersive', value: 'immersive' },
      ],
    },
    condition,
  )

export const createBannerSectionPaddingField = (condition?: Condition) =>
  withCondition(
    {
      name: 'size',
      label: 'Section Padding',
      type: 'select',
      defaultValue: 'default',
      options: [
        { label: 'None', value: 'none' },
        { label: 'Compact', value: 'compact' },
        { label: 'Default', value: 'default' },
        { label: 'Comfortable', value: 'comfortable' },
      ],
    },
    condition,
  )
```

- [ ] **Step 4: Refactor Banner CTA config to use the factories**

Import the eight factories and replace the eight inline select objects in `src/blocks/BannerCta/config.ts`:

```ts
createBannerActionPlacementField(),
createBannerContentAlignmentField(),
createBannerContentWidthField(),
createBannerThemeModeField(),
createBannerOverlayStyleField(),
createBannerOverlayDirectionField(),
createBannerHeightField(),
createBannerSectionPaddingField(),
```

Do not change field order.

- [ ] **Step 5: Apply the same factories to Page Header config**

In `src/blocks/PageHeader/config.ts`:

```ts
const isBanner = (_data: unknown, siblingData: { variant?: string | null }) =>
  siblingData?.variant === 'banner'
```

Change the visible variant options to Minimal and Banner only. Change primary Actions to `maxRows: 3`. Replace the old action placement/alignment/overlay/height fields with the shared factories in Banner CTA order. Apply `isBanner` only to Overlay Tone, Overlay Strength, and Overlay Direction. Keep Appearance, Action Placement, Content Alignment, Content Width, Height, and Section Padding visible for both variants.

- [ ] **Step 6: Run focused tests and TypeScript**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: schema parity tests PASS. Renderer tests may remain red until Task 4 only if their assertions intentionally target the new output.

- [ ] **Step 7: Commit only Task 2 files**

```bash
git add src/blocks/shared/bannerCtaFields.ts src/blocks/BannerCta/config.ts src/blocks/PageHeader/config.ts tests/int/page-header-actions.int.spec.tsx
git commit --only src/blocks/shared/bannerCtaFields.ts src/blocks/BannerCta/config.ts src/blocks/PageHeader/config.ts tests/int/page-header-actions.int.spec.tsx -m "feat(page-header): align Banner CTA controls"
```

---

### Task 3: Add the mutually exclusive Top Content schema

**Files:**

- Modify: `src/blocks/shared/breadcrumbFields.ts`
- Modify: `src/blocks/PageHeader/config.ts`
- Test: `tests/int/page-breadcrumbs.int.spec.tsx`

**Interfaces:**

- Extends `createBreadcrumbModeField()` and `createBreadcrumbsField()` with `condition?: Condition`.
- Produces Page Header `topContent?: 'breadcrumb' | 'eyebrow' | null`.

- [ ] **Step 1: Write failing field-order and condition tests**

In `tests/int/page-breadcrumbs.int.spec.tsx`, update the schema test to assert:

```tsx
it('configures one Breadcrumb-or-Eyebrow top slot', () => {
  const tabs = PageHeaderBlock.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') throw new Error('Expected tabs')
  const content = tabs.tabs[0]?.fields ?? []
  const theme = tabs.tabs[1]?.fields ?? []
  const topContent = content.find((field) => 'name' in field && field.name === 'topContent')
  const eyebrow = content.find((field) => 'name' in field && field.name === 'eyebrow')
  const breadcrumbs = content.find((field) => 'name' in field && field.name === 'breadcrumbs')
  const mode = theme.find((field) => 'name' in field && field.name === 'breadcrumbMode')

  expect(topContent).toMatchObject({
    defaultValue: 'breadcrumb',
    required: true,
    options: [
      { label: 'Breadcrumb', value: 'breadcrumb' },
      { label: 'Eyebrow', value: 'eyebrow' },
    ],
  })
  expect(eyebrow?.admin?.condition?.({}, { topContent: 'eyebrow' }, {} as never)).toBe(true)
  expect(eyebrow?.admin?.condition?.({}, { topContent: 'breadcrumb' }, {} as never)).toBe(false)
  expect(mode?.admin?.condition?.({}, { topContent: 'breadcrumb' }, {} as never)).toBe(true)
  expect(mode?.admin?.condition?.({}, { topContent: 'eyebrow' }, {} as never)).toBe(false)
  expect(
    breadcrumbs?.admin?.condition?.(
      {},
      { breadcrumbMode: 'custom', topContent: 'breadcrumb' },
      {} as never,
    ),
  ).toBe(true)
})
```

- [ ] **Step 2: Run the test and confirm the missing Top Content failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: FAIL because `topContent` and composed conditions do not exist.

- [ ] **Step 3: Add composable breadcrumb field conditions**

In `src/blocks/shared/breadcrumbFields.ts`, import `Condition`, add `condition?: Condition` to both factory option types, and compose it with the existing mode logic:

```ts
const passes = (
  condition: Condition | undefined,
  data: unknown,
  siblingData: Record<string, unknown>,
  operation: Parameters<Condition>[2],
) => condition?.(data, siblingData, operation) ?? true
```

For `createBreadcrumbModeField`, assign the passed condition directly to `admin.condition`. For `createBreadcrumbsField`, use:

```ts
condition: (data, siblingData, operation) =>
  usesCustomBreadcrumbs(data, siblingData) && passes(condition, data, siblingData, operation)
```

Keep standalone Breadcrumb block behavior unchanged when no condition is passed.

- [ ] **Step 4: Add Top Content and conditional fields to Page Header**

In `src/blocks/PageHeader/config.ts`:

```ts
type PageHeaderTopContentSiblings = {
  topContent?: 'breadcrumb' | 'eyebrow' | null
}

const usesBreadcrumbTopContent = (_data: unknown, siblingData: PageHeaderTopContentSiblings) =>
  siblingData?.topContent !== 'eyebrow'

const usesEyebrowTopContent = (_data: unknown, siblingData: PageHeaderTopContentSiblings) =>
  siblingData?.topContent === 'eyebrow'
```

Place `topContent` directly after `backgroundImage`. Place conditional Custom Breadcrumbs next, then conditional Eyebrow. Pass `usesBreadcrumbTopContent` to both breadcrumb factories. Keep Breadcrumb Display in Theme Settings.

- [ ] **Step 5: Run breadcrumb, standalone breadcrumb, and TypeScript checks**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-breadcrumbs.int.spec.tsx tests/int/breadcrumb-block.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: PASS, including standalone Breadcrumb schema tests.

- [ ] **Step 6: Commit only Task 3 files**

```bash
git add src/blocks/shared/breadcrumbFields.ts src/blocks/PageHeader/config.ts tests/int/page-breadcrumbs.int.spec.tsx
git commit --only src/blocks/shared/breadcrumbFields.ts src/blocks/PageHeader/config.ts tests/int/page-breadcrumbs.int.spec.tsx -m "feat(page-header): add top content source"
```

---

### Task 4: Rebuild Page Header rendering on the shared Banner contract

**Files:**

- Modify: `src/blocks/PageHeader/Component.tsx`
- Test: `tests/int/page-header-actions.int.spec.tsx`
- Test: `tests/int/page-breadcrumbs.int.spec.tsx`

**Interfaces:**

- Consumes all presentation exports from Task 1.
- Consumes `topContent`, `contentWidth`, `themeMode`, `overlayDirection`, `size`, and normalized action placement from Tasks 2–3.
- Produces stable data attributes for tests: `data-page-header-top-content`, `data-page-header-content-width`, `data-page-header-theme`, `data-page-header-overlay`, `data-page-header-overlay-direction`, and `data-page-header-height`.

- [ ] **Step 1: Write failing mutual-exclusion and compatibility rendering tests**

Add to `tests/int/page-breadcrumbs.int.spec.tsx`:

```tsx
it('renders only the selected Page Header top content', () => {
  const breadcrumb = renderToStaticMarkup(
    <PageHeaderBlockComponent
      automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'Admissions' }]}
      eyebrow="Admissions eyebrow"
      title="Admissions"
      topContent="breadcrumb"
    />,
  )
  const eyebrow = renderToStaticMarkup(
    <PageHeaderBlockComponent
      automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'Admissions' }]}
      eyebrow="Admissions eyebrow"
      title="Admissions"
      topContent="eyebrow"
    />,
  )

  expect(breadcrumb).toContain('aria-label="Breadcrumb"')
  expect(breadcrumb).not.toContain('Admissions eyebrow')
  expect(eyebrow).toContain('Admissions eyebrow')
  expect(eyebrow).not.toContain('aria-label="Breadcrumb"')
})

it('preserves legacy top-content behavior without rendering both sources', () => {
  const withEyebrow = renderToStaticMarkup(
    <PageHeaderBlockComponent
      automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'About' }]}
      eyebrow="About us"
      title="About"
    />,
  )
  const withoutEyebrow = renderToStaticMarkup(
    <PageHeaderBlockComponent
      automaticBreadcrumbs={[{ label: 'Home', url: '/' }, { label: 'About' }]}
      title="About"
    />,
  )

  expect(withEyebrow).toContain('About us')
  expect(withEyebrow).not.toContain('aria-label="Breadcrumb"')
  expect(withoutEyebrow).toContain('aria-label="Breadcrumb"')
})
```

- [ ] **Step 2: Write failing layout and overlay rendering tests**

Replace old Inline expectations in `tests/int/page-header-actions.int.spec.tsx` with:

```tsx
it('renders Below actions after the description', () => {
  const html = renderHeader({ actionPlacement: 'below' })
  expect(html).toContain('data-page-header-action-placement="below"')
  expect(html).toContain('data-page-header-actions="below"')
})

it('applies Banner CTA width, height, padding, tone, strength, and direction', () => {
  const html = renderHeader({
    contentWidth: 'wide',
    height: 'immersive',
    overlayDirection: 'rightToLeft',
    overlayStyle: 'darker',
    size: 'comfortable',
    themeMode: 'auto',
    variant: 'banner',
  })

  expect(html).toContain('data-page-header-content-width="wide"')
  expect(html).toContain('max-w-4xl')
  expect(html).toContain('data-page-header-height="immersive"')
  expect(html).toContain('min-h-[68dvh]')
  expect(html).toContain('py-20 md:py-28')
  expect(html).toContain('data-page-header-theme="auto"')
  expect(html).toContain('data-page-header-overlay="darker"')
  expect(html).toContain('data-page-header-overlay-direction="rightToLeft"')
  expect(html).toContain('bg-linear-to-l from-primary/95 via-primary/82 to-primary/45')
})
```

- [ ] **Step 3: Run both focused suites and confirm renderer failures**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: FAIL because Page Header does not consume the new properties or render one top slot.

- [ ] **Step 4: Add the new Page Header props and resolution rules**

In `src/blocks/PageHeader/Component.tsx`, extend `PageHeaderBlockLike` with:

```ts
actionPlacement?: BannerActionPlacement | 'inline' | null
contentWidth?: BannerContentWidth | null
overlayDirection?: BannerOverlayDirection | null
size?: RegularBlockSize | null
themeMode?: BannerThemeMode | null
topContent?: 'breadcrumb' | 'eyebrow' | null
```

Resolve values with Banner CTA defaults and legacy compatibility:

```ts
const resolvedVariant = variant === 'banner' ? 'banner' : 'minimal'
const resolvedPlacement =
  variant === 'split' ? 'side' : resolveBannerActionPlacement(actionPlacement)
const resolvedTopContent = topContent ?? (eyebrow?.trim() ? 'eyebrow' : 'breadcrumb')
const resolvedContentWidth = contentWidth ?? 'default'
const resolvedHeight = height ?? 'default'
const resolvedOverlayDirection = overlayDirection ?? 'leftToRight'
const resolvedOverlayStyle = overlayStyle ?? 'darker'
const resolvedSize = size ?? 'default'
const resolvedThemeMode = themeMode ?? 'dark'
```

- [ ] **Step 5: Create one internal top-content renderer**

Inside the component, render exactly one branch:

```tsx
const topContentNode =
  resolvedTopContent === 'breadcrumb' ? (
    <BreadcrumbTrail items={resolvedBreadcrumbs} linkClassName={breadcrumbLinkClassName} />
  ) : resolvedEyebrow ? (
    <SectionEyebrow surface={eyebrowSurface}>{resolvedEyebrow}</SectionEyebrow>
  ) : null
```

Wrap it in a single `div` with `className="mb-4"` and `data-page-header-top-content={resolvedTopContent}` so Breadcrumb and Eyebrow use the same slot spacing.

- [ ] **Step 6: Replace the duplicated Minimal/Banner copy layout**

Build one internal layout using:

```tsx
<div
  className={cn(
    regularBlockContainerClasses,
    'flex flex-col justify-center gap-10',
    bannerHeightClasses[resolvedHeight],
    resolvedPlacement === 'side' && 'lg:flex-row lg:items-center lg:justify-between lg:gap-16',
  )}
  data-page-header-height={resolvedHeight}
>
  <div
    className={cn(
      'flex w-full min-w-0 flex-col gap-6',
      bannerContentWidthClasses[resolvedContentWidth],
      bannerAlignmentClasses[resolvedAlignment],
    )}
    data-page-header-content-width={resolvedContentWidth}
  >
    {topContentNode}
    {/* h1, subtitle, and Below actions */}
  </div>
  {/* Side action rail */}
</div>
```

Use `ContentActions` exactly as Banner CTA does. Keep Footer Actions after the main container. Preserve `h1`, resolved accent title, description data attribute, and breadcrumb link contrast.

- [ ] **Step 7: Apply Minimal and Banner surfaces**

For Minimal, apply `resolveBlockAppearanceClasses(appearance).className` and no media/overlay layer. For Banner, render an optional image and the shared overlay matrix:

```tsx
{
  resolvedVariant === 'banner' && image ? (
    <>
      <div className="absolute inset-0 -z-10">
        <Image
          alt={image.alt}
          className="object-cover"
          fill
          priority
          sizes="100vw"
          src={image.src}
        />
      </div>
      <div
        className={cn(
          'absolute inset-0 -z-10',
          bannerOverlayClasses[resolvedThemeMode][resolvedOverlayStyle][resolvedOverlayDirection],
        )}
        data-page-header-overlay={resolvedOverlayStyle}
        data-page-header-overlay-direction={resolvedOverlayDirection}
        data-page-header-theme={resolvedThemeMode}
      />
    </>
  ) : null
}
```

When Banner has no image, retain Appearance as the fallback surface. Use Banner tone classes only when an image overlay is present; otherwise use the appearance surface so white text is never placed on an unpainted background.

- [ ] **Step 8: Run focused tests and TypeScript**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx tests/int/content-action-presentation.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: PASS.

- [ ] **Step 9: Commit only Task 4 files**

```bash
git add src/blocks/PageHeader/Component.tsx tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx
git commit --only src/blocks/PageHeader/Component.tsx tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx -m "feat(page-header): match Banner CTA layout"
```

---

### Task 5: Regenerate types and update representative fixtures

**Files:**

- Modify: `src/payload-types.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/page-header.jpg`
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Test: `tests/int/page-blocks.int.spec.ts`

**Interfaces:**

- Consumes the final Page Header schema and component props.
- Produces generated `PageHeaderBlock` types containing the new fields and enum values.

- [ ] **Step 1: Update the Page Header fixture before generating types**

In `src/block-thumbnails/fixtures.tsx`, update the Page Header fixture to exercise the final controls:

```tsx
<PageHeaderBlockComponent
  actionPlacement="side"
  actions={[
    {
      label: 'Explore Admissions',
      linkType: 'custom',
      mode: 'button',
      showArrow: true,
      url: '/admissions',
      variant: 'default',
    },
    {
      label: 'Download Brochure',
      linkType: 'custom',
      mode: 'button',
      showArrow: true,
      url: '/brochure.pdf',
      variant: 'outline',
    },
  ]}
  appearance={{ background: 'brand', border: 'none' }}
  backgroundImage={fakeMedia(editorialLandscape, 'Medical learning environment', 1600, 900)}
  contentAlignment="left"
  contentWidth="default"
  eyebrow="Admissions"
  height="default"
  overlayDirection="leftToRight"
  overlayStyle="darker"
  size="default"
  subtitle="Discover an academic environment built around knowledge, clinical experience, and compassionate care."
  themeMode="dark"
  title="Your journey in medicine starts here."
  topContent="eyebrow"
  variant="banner"
/>
```

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm run generate:types
```

Expected: `src/payload-types.ts` includes `topContent`, `contentWidth`, `themeMode`, `overlayDirection`, and `size`; visible variant type is Minimal/Banner while renderer compatibility remains locally typed.

- [ ] **Step 3: Run schema and fixture tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec tsc --noEmit
```

Expected: PASS. If block-count assertions change only because generated types reorder output, do not alter counts; Page Header remains one existing block.

- [ ] **Step 4: Regenerate the Page Header thumbnail**

With the local development server running, execute:

```bash
BLOCK_THUMBNAIL_SLUG=pageHeader pnpm run generate:block-thumbnails
```

Expected: `public/block-thumbnails/page-header.jpg` shows the Banner variant with one eyebrow top slot, readable overlay, and side actions.

- [ ] **Step 5: Inspect the generated image**

Open `public/block-thumbnails/page-header.jpg` and verify:

- no Breadcrumb and Eyebrow double stack;
- copy and actions align at desktop width;
- title remains the dominant element;
- overlay retains image detail and readable text;
- action variants remain theme-aware.

- [ ] **Step 6: Commit only Task 5 files**

```bash
git add src/payload-types.ts src/block-thumbnails/fixtures.tsx public/block-thumbnails/page-header.jpg
git commit --only src/payload-types.ts src/block-thumbnails/fixtures.tsx public/block-thumbnails/page-header.jpg -m "chore(page-header): refresh schema artifacts"
```

---

### Task 6: Run regression and production verification

**Files:**

- Modify only if a verification failure exposes an in-scope Page Header or shared Banner regression.

**Interfaces:**

- Consumes all deliverables from Tasks 1–5.
- Produces a verified implementation with no unrelated mutations.

- [ ] **Step 1: Format all touched text files**

```bash
pnpm exec prettier --write src/blocks/shared/bannerCtaPresentation.ts src/blocks/shared/bannerCtaFields.ts src/blocks/shared/breadcrumbFields.ts src/blocks/BannerCta/config.ts src/blocks/BannerCta/Component.tsx src/blocks/PageHeader/config.ts src/blocks/PageHeader/Component.tsx src/block-thumbnails/fixtures.tsx tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: Prettier completes without error.

- [ ] **Step 2: Run lint on the touched source and test files**

```bash
pnpm exec eslint src/blocks/shared/bannerCtaPresentation.ts src/blocks/shared/bannerCtaFields.ts src/blocks/shared/breadcrumbFields.ts src/blocks/BannerCta/config.ts src/blocks/BannerCta/Component.tsx src/blocks/PageHeader/config.ts src/blocks/PageHeader/Component.tsx tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: zero errors.

- [ ] **Step 3: Run TypeScript and the full integration suite**

```bash
pnpm exec tsc --noEmit
pnpm run test:int
```

Expected: TypeScript exits zero and all integration tests pass.

- [ ] **Step 4: Run the production build without an active dev server sharing `.next`**

```bash
pnpm run build
```

Expected: optimized production build, type checking, page-data collection, and static generation all complete successfully. The existing Next.js middleware deprecation warning may remain; no new Page Header error is acceptable.

- [ ] **Step 5: Audit the final diff and index boundaries**

```bash
git diff --check
git status --short
git diff -- src/blocks/shared/bannerCtaPresentation.ts src/blocks/shared/bannerCtaFields.ts src/blocks/shared/breadcrumbFields.ts src/blocks/BannerCta/config.ts src/blocks/BannerCta/Component.tsx src/blocks/PageHeader/config.ts src/blocks/PageHeader/Component.tsx tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx
```

Expected: no whitespace errors, no unrelated file edits, and no accidental consumption of pre-existing staged changes.

- [ ] **Step 6: Commit any verification-only fixes using the complete in-scope path list**

If Steps 2–4 required an in-scope fix, stage and commit only from this explicit list; Git ignores unchanged paths:

```bash
git add src/blocks/shared/bannerCtaPresentation.ts src/blocks/shared/bannerCtaFields.ts src/blocks/shared/breadcrumbFields.ts src/blocks/BannerCta/config.ts src/blocks/BannerCta/Component.tsx src/blocks/PageHeader/config.ts src/blocks/PageHeader/Component.tsx src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx public/block-thumbnails/page-header.jpg
git commit --only src/blocks/shared/bannerCtaPresentation.ts src/blocks/shared/bannerCtaFields.ts src/blocks/shared/breadcrumbFields.ts src/blocks/BannerCta/config.ts src/blocks/BannerCta/Component.tsx src/blocks/PageHeader/config.ts src/blocks/PageHeader/Component.tsx src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/page-header-actions.int.spec.tsx tests/int/page-breadcrumbs.int.spec.tsx public/block-thumbnails/page-header.jpg -m "fix(page-header): close parity regressions"
```

If no fix was necessary, do not create an empty commit.
