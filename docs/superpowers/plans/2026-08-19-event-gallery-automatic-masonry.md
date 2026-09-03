# Event Gallery Automatic Masonry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Event Gallery's configurable dense grid with an automatic responsive masonry wall that renders one bounded cover tile per selected Gallery Album and supports three overlay content positions with consistently split metadata.

**Architecture:** Keep the existing Gallery Album relationship loader, ordering, viewer, accessibility, shared block appearance, and media overlay resolver. Remove `cardsPerRow` and `cardRatio` from the Payload block schema and runtime props. Use CSS multi-columns for the outer wall and a deterministic bounded aspect-ratio sequence for tiles; normalize legacy `split` and `center` layout values while adding `middleCenter`.

**Tech Stack:** Payload CMS fields, React/Next.js, Tailwind CSS v4 utilities, Framer Motion, Vitest, Testing Library.

## Global Constraints

- Render exactly one cover tile for each selected Gallery Album; the first valid album image remains the cover and the viewer retains every album image.
- Preserve Manual and Latest Event Date ordering, published/draft behavior, whole-card button semantics, focus restoration, and reduced-motion handling.
- Use automatic responsive columns: one phone, two tablet, three laptop, four wide desktop.
- Do not render multi-column lead cards or oversized titles.
- Metadata is split consistently: event date at the start and image count at the end.
- Retain Show Album Details Overlay, Show Event Date, Show Image Count, Overlay Tone, Strength, Direction, and Coverage.
- Do not add dependencies, stage files, or create commits.

---

### Task 1: Presentation Contract and Payload Schema

**Files:**

- Modify: `tests/int/event-gallery-presentation.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `src/components/event-gallery-presentation.ts`
- Modify: `src/blocks/EventGallery/config.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Produces: `EventGalleryMosaicRatio`, `getEventGalleryMosaicRatio(index)`, and `normalizeEventGalleryCardTextLayout(value)`.
- Removes: `EventGalleryCardsPerRow`, `normalizeEventGalleryCardsPerRow`, and the Admin/runtime Card Ratio contract.

- [ ] **Step 1: Write failing helper and schema assertions**

Assert that a repeating index sequence returns bounded `landscape`, `square`, `portrait`, and `wide` roles; invalid layout values fall back to `split`; `middleCenter` is retained; and the Event Gallery schema omits `cardsPerRow` and `cardRatio` while exposing the three content-position options.

- [ ] **Step 2: Run focused tests and confirm the old contract fails**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: failures reference the old column/ratio helpers and missing `middleCenter` option.

- [ ] **Step 3: Implement the new schema and presentation helper**

Use a deterministic eight-item ratio rhythm:

```ts
const mosaicRatioPattern = [
  'landscape',
  'square',
  'portrait',
  'landscape',
  'wide',
  'portrait',
  'landscape',
  'square',
] as const
```

Keep stored layout values compatible:

```ts
export type EventGalleryCardTextLayout = 'center' | 'middleCenter' | 'split'

export const normalizeEventGalleryCardTextLayout = (value: unknown) =>
  value === 'center' || value === 'middleCenter' || value === 'split' ? value : 'split'
```

Remove the Cards Per Row and Card Ratio fields. Rename the master toggle to `Show Album Details Overlay`, rename `cardTextLayout` to `Overlay Content Position`, and offer Bottom Left (`split`), Bottom Center (`center`), and Center — Vertical & Horizontal (`middleCenter`).

- [ ] **Step 4: Generate Payload types and rerun focused tests**

Run:

```bash
pnpm generate:types
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts tests/int/page-blocks.int.spec.ts
```

Expected: generated `EventGalleryBlock` no longer includes `cardsPerRow` or `cardRatio`; focused tests pass.

---

### Task 2: Automatic Masonry and Overlay Hierarchy

**Files:**

- Modify: `tests/int/event-gallery-render.int.spec.tsx`
- Modify: `src/components/event-gallery.tsx`
- Modify: `src/components/event-gallery-client.tsx`
- Modify: `src/blocks/EventGallery/Presentation.tsx`

**Interfaces:**

- Consumes: the normalized layout and deterministic ratio helper from Task 1.
- Produces: one CSS-column tile per album with shared overlay presentation and viewer behavior unchanged.

- [ ] **Step 1: Replace dense-grid assertions with masonry assertions**

Assert responsive column utilities, `break-inside-avoid`, bounded ratio roles, no lead-card marker, split metadata ordering, all three content positions, image-only mode, and existing accessible viewer behavior.

- [ ] **Step 2: Run the render test and confirm the old grid fails**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-render.int.spec.tsx
```

Expected: assertions fail against `grid-flow-dense`, lead spans, and inline metadata.

- [ ] **Step 3: Implement the automatic masonry**

Use:

```ts
'columns-1 gap-3 sm:columns-2 sm:gap-4 lg:columns-3 lg:gap-5 xl:columns-4'
```

Each article uses `mb-3 break-inside-avoid sm:mb-4 lg:mb-5`; no item spans columns. All phone tiles use 4:3. From tablet upward the deterministic ratio role selects 4:3, 1:1, 4:5, or 8:5. Keep `object-cover`, restrained 1.03 hover zoom, focus ring, motion reduction, and the existing viewer.

- [ ] **Step 4: Implement split metadata and restrained type**

Metadata uses a full-width `justify-between` row with date left and image count right. Bottom Left anchors content to the lower-left; Bottom Center anchors content to the bottom and centers the title; `middleCenter` centers the bounded content block on both axes. Use `text-lg sm:text-xl`, semibold display typography, a two-line clamp, and regular small mono metadata.

- [ ] **Step 5: Run render and viewer tests**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-render.int.spec.tsx tests/int/event-gallery-viewer.int.spec.tsx
```

Expected: all tests pass.

---

### Task 3: Preview, Thumbnail, Documentation, and Verification

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Generate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the final Event Gallery schema and runtime presentation.
- Produces: matching production, preview, thumbnail, generated inventory, and operator documentation contracts.

- [ ] **Step 1: Remove obsolete fixture and preview props**

Delete `cardsPerRow` and `cardRatio` from the Event Gallery thumbnail fixture and live-preview tests. Add a `middleCenter` preview assertion while retaining overlay and album-selection assertions.

- [ ] **Step 2: Update maintained documentation**

Document automatic 1/2/3/4 responsive masonry, bounded deterministic ratios, one cover per selected album, three overlay positions, split metadata, and retained full-screen viewer behavior.

- [ ] **Step 3: Run affected tests and static checks**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-data.int.spec.ts tests/int/event-gallery-viewer.int.spec.tsx tests/int/event-gallery-selection.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/block-thumbnails/fixtures.tsx src/blocks/EventGallery/Presentation.tsx src/blocks/EventGallery/config.ts src/components/event-gallery-client.tsx src/components/event-gallery-presentation.ts src/components/event-gallery.tsx tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec prettier --check src/block-thumbnails/fixtures.tsx src/blocks/EventGallery/Presentation.tsx src/blocks/EventGallery/config.ts src/components/event-gallery-client.tsx src/components/event-gallery-presentation.ts src/components/event-gallery.tsx tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-render.int.spec.tsx tests/int/live-preview-renderer.int.spec.tsx tests/int/page-blocks.int.spec.ts docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/components/event-gallery-client.tsx
git diff --check
```

Expected: tests, typecheck, lint, formatting, and diff check pass; detector returns `[]`.

- [ ] **Step 4: Refresh and validate project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; a pre-existing stale knowledge-graph commit warning is allowed.
