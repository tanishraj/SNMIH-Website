# Gallery Overlay Display Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editor-controlled Always Visible and Reveal on Hover overlay modes to Event Gallery and Image Mosaic while preserving each block's existing legacy behavior.

**Architecture:** A shared Payload field factory defines the identical Admin control, while a client-safe presentation helper owns the two-value runtime type and fallback normalization. Event Gallery and Image Mosaic pass the resolved mode to their tile wrappers, and shared progressive-enhancement CSS handles hover, keyboard focus, touch pointers, and reduced motion.

**Tech Stack:** Payload CMS 3 block fields, React 19, TypeScript, Tailwind CSS 4, project CSS, Vitest, Testing Library.

## Global Constraints

- Event Gallery missing value resolves to `always`.
- Image Mosaic missing value resolves to `hover`.
- Hover mode remains visible on touch/coarse-pointer devices and reveals on keyboard focus.
- Existing overlay master switches, overlay styling, tile actions, and slideshow behavior remain unchanged.
- Do not migrate stored documents.
- Do not commit or stage changes in this shared worktree.

---

### Task 1: Shared overlay display schema and resolver

**Files:**

- Create: `src/blocks/shared/overlayDisplayFields.ts`
- Create: `src/blocks/shared/overlayDisplayPresentation.ts`
- Modify: `src/blocks/EventGallery/config.ts`
- Modify: `src/blocks/ImageMosaic/config.ts`
- Test: `tests/int/page-blocks.int.spec.ts`
- Test: `tests/int/image-mosaic.int.spec.tsx`

**Interfaces:**

- Produces: `OverlayDisplayMode = 'always' | 'hover'`.
- Produces: `normalizeOverlayDisplayMode(value, fallback): OverlayDisplayMode`.
- Produces: `createOverlayDisplayField({ condition, defaultValue }): SelectField` with field name `overlayDisplay`.

- [ ] **Step 1: Add failing schema and normalization assertions**

Assert that Event Gallery exposes a conditional `overlayDisplay` select with default `always`, Image Mosaic exposes the same select with default `hover`, both offer the exact values `always` and `hover`, and invalid runtime values use the supplied fallback.

```ts
expect(eventOverlayDisplay).toMatchObject({
  name: 'overlayDisplay',
  type: 'select',
  defaultValue: 'always',
  options: [
    { label: 'Always Visible', value: 'always' },
    { label: 'Reveal on Hover', value: 'hover' },
  ],
})
expect(imageOverlayDisplay).toMatchObject({ defaultValue: 'hover' })
expect(normalizeOverlayDisplayMode(undefined, 'always')).toBe('always')
expect(normalizeOverlayDisplayMode('invalid', 'hover')).toBe('hover')
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run:

```bash
pnpm exec vitest run tests/int/page-blocks.int.spec.ts tests/int/image-mosaic.int.spec.tsx
```

Expected: failures because `overlayDisplay` and its shared helpers do not exist.

- [ ] **Step 3: Implement the client-safe resolver and Payload field factory**

Create `overlayDisplayPresentation.ts`:

```ts
export type OverlayDisplayMode = 'always' | 'hover'

export const normalizeOverlayDisplayMode = (
  value: unknown,
  fallback: OverlayDisplayMode,
): OverlayDisplayMode => (value === 'always' || value === 'hover' ? value : fallback)
```

Create `overlayDisplayFields.ts`:

```ts
import type { Condition, SelectField } from 'payload'
import type { OverlayDisplayMode } from './overlayDisplayPresentation'

export function createOverlayDisplayField({
  condition,
  defaultValue,
}: {
  condition: Condition
  defaultValue: OverlayDisplayMode
}): SelectField {
  return {
    name: 'overlayDisplay',
    label: 'Overlay Display',
    type: 'select',
    defaultValue,
    options: [
      { label: 'Always Visible', value: 'always' },
      { label: 'Reveal on Hover', value: 'hover' },
    ],
    required: true,
    admin: {
      condition,
      description:
        'Choose whether overlay details remain visible or reveal on hover and keyboard focus. Touch devices always keep details visible.',
    },
  }
}
```

Add `createOverlayDisplayField({ condition: showsCardOverlay, defaultValue: 'always' })` after Event Gallery's master overlay checkbox, and `createOverlayDisplayField({ condition: showImageOverlayControls, defaultValue: 'hover' })` after Image Mosaic's master overlay checkbox.

- [ ] **Step 4: Run the schema tests**

Run the Step 2 command. Expected: all tests pass.

---

### Task 2: Runtime mode propagation and shared interaction CSS

**Files:**

- Modify: `src/blocks/EventGallery/Presentation.tsx`
- Modify: `src/blocks/ImageMosaic/Presentation.tsx`
- Modify: `src/components/event-gallery.tsx`
- Modify: `src/components/event-gallery-client.tsx`
- Modify: `src/components/image-mosaic.tsx`
- Modify: `src/components/image-mosaic-album-grid.tsx`
- Modify: `src/components/gallery-album-overlay-content.tsx`
- Modify: `src/styles/custom.css`
- Test: `tests/int/event-gallery-render.int.spec.tsx`
- Test: `tests/int/image-mosaic.int.spec.tsx`

**Interfaces:**

- Consumes: `OverlayDisplayMode` and `normalizeOverlayDisplayMode` from Task 1.
- Produces: `data-gallery-overlay-display="always|hover"` on every tile with an overlay.
- Produces: shared `.gallery-overlay-layer` behavior for overlay tint and content.

- [ ] **Step 1: Add failing runtime and CSS assertions**

Cover these contracts:

```ts
expect(renderEventGalleryWithoutValue()).toContain('data-gallery-overlay-display="always"')
expect(renderEventGalleryWithHover()).toContain('data-gallery-overlay-display="hover"')
expect(renderImageMosaicWithoutValue()).toContain('data-gallery-overlay-display="hover"')
expect(renderImageMosaicWithAlways()).toContain('data-gallery-overlay-display="always"')
expect(customCss).toContain("[data-gallery-overlay-display='hover'] .gallery-overlay-layer")
expect(customCss).toContain(':focus-within .gallery-overlay-layer')
```

Also assert that disabling the existing master overlay switch renders no `.gallery-overlay-layer`.

- [ ] **Step 2: Run the rendering tests and confirm they fail**

Run:

```bash
pnpm exec vitest run tests/int/event-gallery-render.int.spec.tsx tests/int/image-mosaic.int.spec.tsx
```

Expected: failures because mode props, attributes, and shared CSS are absent.

- [ ] **Step 3: Thread block-specific fallbacks through both presentations**

Add `overlayDisplay?: OverlayDisplayMode | null` to both block-like types. Resolve with:

```ts
const resolvedOverlayDisplay = normalizeOverlayDisplayMode(overlayDisplay, 'always')
```

for Event Gallery and:

```ts
const resolvedOverlayDisplay = normalizeOverlayDisplayMode(overlayDisplay, 'hover')
```

for Image Mosaic. Pass the result through `EventGallery`, `EventGalleryClient`, `ImageMosaic`, and `ImageMosaicAlbumGrid`.

- [ ] **Step 4: Mark tile boundaries and overlay layers**

On each Event Gallery and Image Mosaic tile that has overlay content, set:

```tsx
data-gallery-overlay-display={overlayDisplay}
```

Apply `gallery-overlay-layer` to the complete overlay wrapper for manual Image Mosaic and album-backed Image Mosaic. For Event Gallery, apply it to both the tint layer and `GalleryAlbumOverlayContent` root so both disappear and reveal together. Preserve all existing block-specific data attributes.

- [ ] **Step 5: Replace automatic Image Mosaic-only reveal CSS with the shared mode contract**

Keep overlays visible by default, then scope hiding to fine-pointer desktop hover mode:

```css
.gallery-overlay-layer {
  opacity: 1;
  transition: opacity 200ms ease-out;
}

@media (min-width: 64rem) and (hover: hover) and (pointer: fine) {
  [data-gallery-overlay-display='hover'] .gallery-overlay-layer {
    pointer-events: none;
    opacity: 0;
  }

  [data-gallery-overlay-display='hover']:hover .gallery-overlay-layer,
  [data-gallery-overlay-display='hover']:focus-within .gallery-overlay-layer {
    pointer-events: auto;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gallery-overlay-layer {
    transition: none;
  }
}
```

Keep the existing restrained image zoom and reduced-motion treatment independent of overlay display.

- [ ] **Step 6: Run focused runtime tests**

Run the Step 2 command. Expected: all tests pass.

---

### Task 3: Generated contracts, documentation, and final verification

**Files:**

- Modify (generated): `src/payload-types.ts`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json`
- Modify: `docs/guides/blocks.md`

**Interfaces:**

- Consumes: final schema and runtime behavior from Tasks 1–2.
- Produces: synchronized Payload types and current operator/project documentation.

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: Event Gallery and Image Mosaic generated interfaces include `overlayDisplay?: 'always' | 'hover' | null`.

- [ ] **Step 2: Update maintained documentation**

Document both Admin choices, block-specific legacy fallbacks, touch/focus accessibility, and the independence of overlay display from slideshow/link interaction in `block-system.md` and `docs/guides/blocks.md`.

- [ ] **Step 3: Run all affected checks**

```bash
pnpm exec vitest run tests/int/event-gallery-presentation.int.spec.ts tests/int/event-gallery-selection.int.spec.tsx tests/int/event-gallery-render.int.spec.tsx tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/EventGallery src/blocks/ImageMosaic src/blocks/shared/overlayDisplayFields.ts src/blocks/shared/overlayDisplayPresentation.ts src/components/event-gallery.tsx src/components/event-gallery-client.tsx src/components/image-mosaic.tsx src/components/image-mosaic-album-grid.tsx src/components/gallery-album-overlay-content.tsx tests/int/event-gallery-render.int.spec.tsx tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts
pnpm exec prettier --check src/blocks/EventGallery src/blocks/ImageMosaic src/blocks/shared/overlayDisplayFields.ts src/blocks/shared/overlayDisplayPresentation.ts src/components/event-gallery.tsx src/components/event-gallery-client.tsx src/components/image-mosaic.tsx src/components/image-mosaic-album-grid.tsx src/components/gallery-album-overlay-content.tsx src/styles/custom.css tests/int/event-gallery-render.int.spec.tsx tests/int/image-mosaic.int.spec.tsx tests/int/page-blocks.int.spec.ts docs/guides/blocks.md .agents/skills/project-context/references/block-system.md
git diff --check
```

Expected: all commands pass.

- [ ] **Step 4: Refresh and validate project context**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current; the known stale knowledge-graph warning is allowed.

- [ ] **Step 5: Review the final diff without staging or committing**

Confirm the diff contains only the approved overlay-display implementation and required generated/documentation changes layered on the user's existing worktree.
