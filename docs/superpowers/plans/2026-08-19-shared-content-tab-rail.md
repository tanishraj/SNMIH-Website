# Shared Content Tab Rail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Gallery Album Tabs and News & Events Tabs the same configurable, full-width tab rail with intrinsically sized tabs and an underline default.

**Architecture:** Add a presentation-only shared module for the three variants, normalization, and class resolution. Each block retains its own data and interaction state while both clients consume the same rail contract; News & Events gains `tabVariant`, and Gallery keeps compatibility exports.

**Tech Stack:** Payload CMS 3, Next.js, React, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Both blocks expose `contained`, `pill`, and `underline`; default and fallback are `underline`.
- Tabs use label-based intrinsic widths, never `flex: 1` or a fixed desktop minimum width.
- The outer rail spans the block container and horizontally scrolls as one row on overflow.
- Data loading, ordering, pagination, slideshow, card-grid, and editorial-list behavior do not change.
- Preserve the ARIA tab pattern and Arrow Left/Right, Home, and End keyboard controls.
- Do not stage or commit changes.

---

### Task 1: Shared tab presentation and Gallery migration

**Files:**

- Create: `src/blocks/shared/contentTabRail.ts`
- Modify: `src/blocks/GalleryAlbumTabs/galleryAlbumTabsShared.ts`
- Modify: `src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx`
- Test: `tests/int/gallery-album-tabs.int.spec.tsx`

**Interfaces:**

- Produces: `CONTENT_TAB_VARIANTS`, `ContentTabVariant`, `normalizeContentTabVariant`, `getContentTabRailClasses`, and `getContentTabClasses`.
- Preserves: Gallery-prefixed exports as aliases for existing consumers.

- [ ] **Step 1: Write failing Gallery layout tests**

Add assertions for each variant:

```tsx
expect(tabList).toHaveClass('min-w-full', 'w-max', 'flex-nowrap')
expect(tabList).toHaveAttribute('data-content-tab-variant', variant)
for (const tab of screen.getAllByRole('tab')) {
  expect(tab).toHaveClass('w-auto', 'shrink-0')
  expect(tab).not.toHaveClass('flex-1', 'sm:min-w-32')
}
```

Also assert missing and invalid values normalize to `underline`.

- [ ] **Step 2: Confirm the test fails**

Run `pnpm exec vitest run tests/int/gallery-album-tabs.int.spec.tsx`.

Expected: FAIL because Gallery currently uses `flex-1 sm:min-w-32` and lacks the shared marker.

- [ ] **Step 3: Implement the shared presentation module**

Create:

```ts
import { cn } from '@/lib/utils'

export const CONTENT_TAB_VARIANTS = ['contained', 'pill', 'underline'] as const
export type ContentTabVariant = (typeof CONTENT_TAB_VARIANTS)[number]

export const normalizeContentTabVariant = (value?: unknown): ContentTabVariant =>
  value === 'contained' || value === 'pill' ? value : 'underline'

const railClasses = {
  contained: 'border border-border bg-background p-1',
  pill: 'rounded-full border border-border bg-background p-1',
  underline: 'border-b border-border',
} as const satisfies Record<ContentTabVariant, string>

export const getContentTabRailClasses = (variant: ContentTabVariant) => railClasses[variant]

export const getContentTabClasses = (variant: ContentTabVariant, active: boolean) =>
  cn(
    'relative inline-flex min-h-11 w-auto shrink-0 items-center justify-center px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
    variant === 'pill' && 'rounded-full',
    variant === 'underline' &&
      'after:absolute after:inset-x-0 after:-bottom-px after:h-px after:origin-center after:scale-x-0 after:bg-primary after:transition-transform',
    active
      ? variant === 'underline'
        ? 'text-foreground after:scale-x-100'
        : 'bg-primary text-primary-foreground'
      : 'text-muted-foreground hover:text-foreground',
  )
```

- [ ] **Step 4: Migrate Gallery to the shared contract**

Alias Gallery's variant type, constant, normalizer, and class functions to the shared module. Keep the viewport and render the rail as:

```tsx
<div className="overflow-x-auto pb-1" data-gallery-album-tabs-tablist="true">
  <div
    className={cn('flex w-max min-w-full flex-nowrap', getContentTabRailClasses(variant))}
    data-content-tab-variant={variant}
    role="tablist"
  >
```

Retain keyboard focus movement and `scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })`.

- [ ] **Step 5: Confirm Gallery passes**

Run `pnpm exec vitest run tests/int/gallery-album-tabs.int.spec.tsx`.

Expected: PASS.

### Task 2: News & Events setting and shared rail

**Files:**

- Modify: `src/blocks/NewsEventsTabs/config.ts`
- Modify: `src/blocks/NewsEventsTabs/newsEventsTabsShared.ts`
- Modify: `src/blocks/NewsEventsTabs/Presentation.tsx`
- Modify: `src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx`
- Test: `tests/int/news-events-tabs.int.spec.tsx`

**Interfaces:**

- Consumes: the five shared exports from Task 1.
- Produces: `NewsEventsTabsBlockLike.tabVariant` and `NewsEventsTabsClientProps.variant`.

- [ ] **Step 1: Write failing schema and rendering tests**

Assert the Theme Settings field:

```ts
expect(tabVariantField).toMatchObject({
  defaultValue: 'underline',
  name: 'tabVariant',
  options: [
    { label: 'Contained', value: 'contained' },
    { label: 'Pill', value: 'pill' },
    { label: 'Underline', value: 'underline' },
  ],
  required: true,
  type: 'select',
})
```

For every variant, assert `min-w-full w-max flex-nowrap`, intrinsic tab classes, the shared variant marker, and a horizontally scrollable viewport.

- [ ] **Step 2: Confirm the test fails**

Run `pnpm exec vitest run tests/int/news-events-tabs.int.spec.tsx`.

Expected: FAIL because the setting is absent and the current tabs wrap with independent pill styling.

- [ ] **Step 3: Add the Payload field**

Add under Theme Settings:

```ts
{
  name: 'tabVariant',
  label: 'Tab Variant',
  type: 'select',
  defaultValue: 'underline',
  options: [
    { label: 'Contained', value: 'contained' },
    { label: 'Pill', value: 'pill' },
    { label: 'Underline', value: 'underline' },
  ],
  required: true,
  admin: {
    description: 'Choose a contained, pill-shaped, or minimal underline tab treatment.',
  },
} satisfies SelectField
```

- [ ] **Step 4: Thread and normalize the value**

Add `tabVariant?: ContentTabVariant | string | null` to `NewsEventsTabsBlockLike`. Destructure it, call `normalizeContentTabVariant(tabVariant)`, and pass the result as the client's required `variant` prop.

- [ ] **Step 5: Replace the wrapping buttons**

Replace `flex flex-wrap gap-2` and shadcn Button tabs with native tab buttons using the shared classes:

```tsx
<div className="overflow-x-auto pb-1" data-news-events-tabs-list-wrap="true">
  <div
    className={cn('flex w-max min-w-full flex-nowrap', getContentTabRailClasses(variant))}
    data-content-tab-variant={variant}
    role="tablist"
  >
```

Make pointer selection use `selectTab(index)`. That function sets state, focuses the tab, and scrolls it inline into view. Do not alter Load More or result rendering.

- [ ] **Step 6: Confirm both focused suites pass**

Run `pnpm exec vitest run tests/int/gallery-album-tabs.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx`.

Expected: PASS, including existing pagination, retry, keyboard, card-grid, editorial-list, Gallery switching, and slideshow tests.

### Task 3: Types, documentation, and verification

**Files:**

- Modify (generated): `src/payload-types.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`
- Modify via updater: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: final schemas and presentation behavior.
- Produces: current Payload types and project knowledge.

- [ ] **Step 1: Regenerate Payload types**

Run `pnpm generate:types`.

Expected: News & Events and Gallery block types both contain `tabVariant?: ('contained' | 'pill' | 'underline') | null`.

- [ ] **Step 2: Update documentation**

For both blocks, document:

```md
- Tab variants: Contained, Pill, and Underline; Underline is the default.
- Tabs size to their labels while the outer rail spans the block container.
- At narrow widths or with long/localized labels, the single-row rail scrolls horizontally instead of wrapping or distributing tabs equally.
```

Remove the old News & Events statement that tab pills wrap without horizontal scrolling.

- [ ] **Step 3: Format and validate**

Run:

```bash
pnpm exec prettier --write src/blocks/shared/contentTabRail.ts src/blocks/GalleryAlbumTabs/galleryAlbumTabsShared.ts src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx src/blocks/NewsEventsTabs/config.ts src/blocks/NewsEventsTabs/newsEventsTabsShared.ts src/blocks/NewsEventsTabs/Presentation.tsx src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx tests/int/gallery-album-tabs.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx src/payload-types.ts .agents/skills/project-context/references/block-system.md docs/guides/blocks.md docs/superpowers/specs/2026-08-19-shared-content-tab-rail-design.md docs/superpowers/plans/2026-08-19-shared-content-tab-rail.md
pnpm exec eslint src/blocks/shared/contentTabRail.ts src/blocks/GalleryAlbumTabs/galleryAlbumTabsShared.ts src/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient.tsx src/blocks/NewsEventsTabs/config.ts src/blocks/NewsEventsTabs/newsEventsTabsShared.ts src/blocks/NewsEventsTabs/Presentation.tsx src/blocks/NewsEventsTabs/NewsEventsTabsClient.tsx tests/int/gallery-album-tabs.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx
pnpm exec vitest run tests/int/gallery-album-tabs.int.spec.tsx tests/int/news-events-tabs.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all commands pass.

- [ ] **Step 4: Check layout and diffs**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/shared/contentTabRail.ts src/blocks/GalleryAlbumTabs src/blocks/NewsEventsTabs
git diff --check
```

Expected: detector returns `[]`; diff check produces no output.

- [ ] **Step 5: Complete project-context maintenance**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory is current and the check passes aside from any explicitly identified pre-existing stale knowledge-graph warning.

- [ ] **Step 6: Review without staging**

Run `git status --short`, then review the scoped diff. Confirm only intended changes plus pre-existing user work are present, no files are staged, and no commit was created.
