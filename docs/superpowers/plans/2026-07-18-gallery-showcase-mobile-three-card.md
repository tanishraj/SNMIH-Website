# Gallery Showcase Mobile Three-Card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render a contained three-card Gallery Showcase fan above its content on mobile while preserving the existing five-card tablet and desktop layout.

**Architecture:** Add a static five-entry responsive visibility map to the isolated fan Client Component so the outer two cards are hidden only below `sm`. Increase only the base fan heights and make the server presentation container a normal-flow vertical stack with a shared gap.

**Tech Stack:** React 19, Next.js 16, TypeScript, Tailwind CSS 4, Framer Motion 12, Vitest, Playwright.

## Global Constraints

- Payload continues to require exactly five images.
- Source positions 1 and 5 are hidden below `sm` and restored at `sm`.
- Source positions 2, 3, and 4 remain visible at every breakpoint.
- Mobile fan heights are Compact `h-36`, Default `h-40`, and Comfortable `h-44`.
- Existing `sm` and `lg` fan heights remain unchanged.
- Existing card sizes, transforms, motion, dragging, snap-back, hover, media positioning, theme, content, and action behavior remain unchanged.
- Content follows the fan in normal document flow with an explicit `gap-5`; it must not use `mt-5` for separation.
- Do not read `window`, viewport width, user agent, or browser state during render.
- Do not stage or commit any files.

---

## File Structure

- Modify `src/components/gallery-showcase-fan.tsx`: define mobile visibility classes, apply them by source position, and update base fan heights.
- Modify `src/components/gallery-showcase.tsx`: make the regular block container a vertical `gap-5` stack and remove the content top margin.
- Modify `tests/int/gallery-showcase.int.spec.ts`: lock responsive visibility, height, and content-flow contracts.
- Regenerate `public/block-thumbnails/gallery-showcase.jpg`: verify the unchanged desktop presentation through the real renderer.

### Task 1: Render and separate the mobile three-card fan

**Files:**

- Modify: `src/components/gallery-showcase-fan.tsx`
- Modify: `src/components/gallery-showcase.tsx`
- Test: `tests/int/gallery-showcase.int.spec.ts`
- Regenerate: `public/block-thumbnails/gallery-showcase.jpg`

**Interfaces:**

- Consumes: `GalleryShowcaseFan({ images, size })`, `GalleryShowcase({ images, title, ...content })`, and the existing five-image source order.
- Produces: exported `galleryShowcaseMobileVisibilityClasses`, a five-entry readonly tuple used by each card; a responsive fan height contract; and a `gap-5` server-rendered content flow.

- [ ] **Step 1: Write failing tests for mobile visibility, height, and separation**

Update the fan import in `tests/int/gallery-showcase.int.spec.ts`:

```ts
import {
  galleryShowcaseMobileVisibilityClasses,
  galleryShowcaseTransforms,
} from '@/components/gallery-showcase-fan'
```

Add this test after the geometry test:

```ts
it('shows the center three cards on mobile and restores all five at sm', () => {
  expect(galleryShowcaseMobileVisibilityClasses).toEqual([
    'hidden sm:block',
    '',
    '',
    '',
    'hidden sm:block',
  ])

  const html = renderToStaticMarkup(GalleryShowcase({ images: galleryImages, title: 'Gallery' }))
  const clientSource = readFileSync('src/components/gallery-showcase-fan.tsx', 'utf8')

  expect(html.split('hidden sm:block')).toHaveLength(3)
  expect(clientSource).not.toContain('window.matchMedia')
  expect(clientSource).not.toContain("typeof window")
  expect(clientSource).not.toContain('navigator.userAgent')
})
```

Update the compact rendering assertions:

```ts
expect(html).toContain('h-36 sm:h-48 lg:h-52')
expect(html).toContain('size-16 sm:size-36 lg:size-40')
expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4 flex flex-col gap-5')
expect(html).not.toContain('mt-5')
```

Update the parameterized size cases:

```ts
it.each([
  ['compact', 'h-36 sm:h-48 lg:h-52', 'size-16 sm:size-36 lg:size-40'],
  ['default', 'h-40 sm:h-52 lg:h-60', 'size-20 sm:size-40 lg:size-44'],
  ['comfortable', 'h-44 sm:h-60 lg:h-64', 'size-24 sm:size-44 lg:size-48'],
] as const)('applies %s fan and card sizing', (size, fanClasses, cardClasses) => {
  const html = renderToStaticMarkup(
    GalleryShowcase({ images: galleryImages, size, title: 'Gallery' }),
  )

  expect(html).toContain(fanClasses)
  expect(html.split(cardClasses)).toHaveLength(6)
})
```

- [ ] **Step 2: Run the focused test and verify the new contracts fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-showcase.int.spec.ts
```

Expected: FAIL because the visibility map is not exported, the base heights are still `h-28`, `h-32`, and `h-36`, and the presentation still uses `mt-5`.

- [ ] **Step 3: Add mobile-only card visibility and reserved fan heights**

Add this tuple after `galleryShowcaseTransforms` in `src/components/gallery-showcase-fan.tsx`:

```ts
export const galleryShowcaseMobileVisibilityClasses = [
  'hidden sm:block',
  '',
  '',
  '',
  'hidden sm:block',
] as const
```

Replace only the base tokens in `fanHeightClasses`:

```ts
const fanHeightClasses = {
  compact: 'h-36 sm:h-48 lg:h-52',
  default: 'h-40 sm:h-52 lg:h-60',
  comfortable: 'h-44 sm:h-60 lg:h-64',
} as const
```

Inside `images.map`, resolve the corresponding visibility class:

```ts
const visibilityClass = galleryShowcaseMobileVisibilityClasses[index]
```

Append it to the existing card class list:

```ts
className={cn(
  'absolute cursor-grab overflow-hidden rounded-md shadow-xl active:cursor-grabbing',
  cardSizeClasses[size],
  visibilityClass,
)}
```

Do not change `galleryShowcaseTransforms`, `cardSizeClasses`, or any motion property.

- [ ] **Step 4: Put fan and content into an explicit vertical flow**

In `src/components/gallery-showcase.tsx`, change the regular block container from:

```tsx
<div className={regularBlockContainerClasses}>
```

to:

```tsx
<div className={cn(regularBlockContainerClasses, 'flex flex-col gap-5')}>
```

Change the content wrapper from:

```tsx
<div className={cn('flex max-w-3xl flex-col gap-4 mt-5', alignmentClasses[alignment])}>
```

to:

```tsx
<div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[alignment])}>
```

- [ ] **Step 5: Format and run the focused tests**

Run:

```bash
pnpm exec prettier --write src/components/gallery-showcase-fan.tsx src/components/gallery-showcase.tsx tests/int/gallery-showcase.int.spec.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/gallery-showcase.int.spec.ts
```

Expected: every Gallery Showcase test passes.

- [ ] **Step 6: Run scoped quality checks**

Run:

```bash
pnpm exec eslint src/components/gallery-showcase-fan.tsx src/components/gallery-showcase.tsx tests/int/gallery-showcase.int.spec.ts
git diff --check
git diff --cached --check
```

Expected: scoped ESLint and both diff checks exit successfully.

- [ ] **Step 7: Regenerate and verify block thumbnails**

Run:

```bash
pnpm generate:block-thumbnails
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: the desktop Gallery Showcase thumbnail still contains all five cards, the generator reports no browser-console or hydration errors, and all seven thumbnail tests pass.

- [ ] **Step 8: Verify mobile content separation**

At 320-, 375-, and 390-pixel viewports, wait for the fan entrance to settle and measure the visible cards, fan, and content wrapper:

```js
const fan = document.querySelector('[data-gallery-showcase-fan="true"]')
const visibleCards = [...fan.firstElementChild.children].filter(
  (card) => getComputedStyle(card).display !== 'none',
)
const content = fan.nextElementSibling
const fanRect = fan.getBoundingClientRect()
const contentRect = content.getBoundingClientRect()

({
  visibleCardCount: visibleCards.length,
  contentFollowsFan: contentRect.top >= fanRect.bottom,
  hasHorizontalScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
})
```

Expected at all three widths: `visibleCardCount` is `3`, `contentFollowsFan` is `true`, `hasHorizontalScroll` is `false`, and the browser console contains no hydration or runtime errors.

- [ ] **Step 9: Confirm changes remain unstaged**

Run:

```bash
git status --short
git diff -- src/components/gallery-showcase-fan.tsx src/components/gallery-showcase.tsx tests/int/gallery-showcase.int.spec.ts public/block-thumbnails/gallery-showcase.jpg
```

Expected: the implementation is present only in the working tree. Do not run `git add` or `git commit`.
