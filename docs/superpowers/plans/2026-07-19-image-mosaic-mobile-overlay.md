# Image Mosaic Mobile Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Image Mosaic gradient, title, and action permanently visible below the `lg` breakpoint while synchronizing desktop image and overlay animations.

**Architecture:** Make the overlay's base CSS state visible and move the hidden directional-entry state into a desktop-only fine-pointer media query. Give the Framer Motion image the same `200ms ease-out` transition already used by the CSS overlay, without changing the component API or reduced-motion behavior.

**Tech Stack:** React 19, Next.js 16, Framer Motion, Tailwind CSS 4, Vitest.

## Global Constraints

- Screens below the `lg` breakpoint must always show the complete gradient overlay, title, and action.
- Coarse-pointer or non-hover devices must always show the overlay at every viewport width.
- Only `lg` and wider devices with hover support and a fine pointer may hide the overlay until hover or keyboard focus.
- Image movement and gradient-overlay entry must both use `200ms ease-out`.
- Reduced-motion behavior must continue disabling both animations.
- Do not change Payload fields, content rendering, image layout, or theme tokens.
- Preserve the currently staged snapshot and keep this revision unstaged and uncommitted.

---

### Task 1: Make overlays mobile-first and synchronize desktop motion

**Files:**

- Modify: `tests/int/image-mosaic.int.spec.tsx`
- Modify: `src/styles/custom.css`
- Modify: `src/components/ui/direction-aware-hover.tsx`

**Interfaces:**

- Consumes: `.image-mosaic-overlay`, `data-image-mosaic-direction`, and the existing `DirectionAwareHover` Framer variants.
- Produces: permanent overlay visibility outside desktop fine-pointer environments and one shared `200ms ease-out` timing contract.

- [ ] **Step 1: Add failing assertions for mobile-first overlay visibility**

In the existing interaction test in `tests/int/image-mosaic.int.spec.tsx`, derive the base and desktop rule sections:

```tsx
const overlayRuleStart = customCss.indexOf('.image-mosaic-overlay')
const desktopOverlayMediaStart = customCss.indexOf(
  '@media (min-width: 64rem) and (hover: hover) and (pointer: fine)',
)
const reducedMotionMediaStart = customCss.indexOf(
  '@media (prefers-reduced-motion: reduce)',
  desktopOverlayMediaStart,
)
const baseOverlayRules = customCss.slice(overlayRuleStart, desktopOverlayMediaStart)
const desktopOverlayRules = customCss.slice(desktopOverlayMediaStart, reducedMotionMediaStart)
```

Assert the required base and desktop states:

```tsx
expect(desktopOverlayMediaStart).toBeGreaterThan(overlayRuleStart)
expect(baseOverlayRules).toContain('pointer-events: auto')
expect(baseOverlayRules).toContain('opacity: 1')
expect(baseOverlayRules).toContain('transform: translate3d(0, 0, 0)')
expect(baseOverlayRules).toContain('200ms ease-out')
expect(desktopOverlayRules).toContain('pointer-events: none')
expect(desktopOverlayRules).toContain('opacity: 0')
expect(customCss).not.toContain('@media (hover: none), (pointer: coarse)')
```

The absence of a touch override is intentional: visible is the base state, so mobile and coarse-pointer behavior no longer depend on capability detection.

- [ ] **Step 2: Add failing assertions for synchronized image timing**

In the same test, add:

```tsx
expect(clientSource).toContain(
  "const imageTransition = { duration: 0.2, ease: 'easeOut' } as const",
)
expect(clientSource).toContain('transition={imageTransition}')
```

- [ ] **Step 3: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the overlay is currently hidden by default, visibility depends on the coarse-pointer media query, and the image lacks an explicit matching transition.

- [ ] **Step 4: Make the overlay visible by default**

In `src/styles/custom.css`, replace the current Image Mosaic overlay rules with this mobile-first structure:

```css
/* Image Mosaic direction-aware overlays */
.image-mosaic-overlay {
  pointer-events: auto;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  transition:
    opacity 200ms ease-out,
    transform 200ms ease-out;
}

@media (min-width: 64rem) and (hover: hover) and (pointer: fine) {
  .image-mosaic-overlay {
    pointer-events: none;
    opacity: 0;
    transform: translate3d(-0.75rem, 0, 0);
  }

  [data-image-mosaic-direction='top'] .image-mosaic-overlay {
    transform: translate3d(0, -0.75rem, 0);
  }

  [data-image-mosaic-direction='right'] .image-mosaic-overlay {
    transform: translate3d(0.75rem, 0, 0);
  }

  [data-image-mosaic-direction='bottom'] .image-mosaic-overlay {
    transform: translate3d(0, 0.75rem, 0);
  }

  [data-image-mosaic-direction='left'] .image-mosaic-overlay {
    transform: translate3d(-0.75rem, 0, 0);
  }

  .group\/image-mosaic:hover .image-mosaic-overlay,
  .group\/image-mosaic:focus-within .image-mosaic-overlay {
    pointer-events: auto;
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-mosaic-overlay {
    transition: none;
  }
}
```

This uses `64rem`, Tailwind's existing `lg` breakpoint, and preserves keyboard focus visibility on hover-capable desktops.

- [ ] **Step 5: Synchronize the image transition**

In `src/components/ui/direction-aware-hover.tsx`, add next to `imageVariants`:

```tsx
const imageTransition = { duration: 0.2, ease: 'easeOut' } as const
```

Pass it to the motion image:

```tsx
<motion.img
  alt={alt}
  className={cn('size-full scale-[1.1] object-cover', imageClassName)}
  draggable={false}
  height={height}
  src={imageUrl}
  transition={imageTransition}
  variants={imageVariants}
  width={width}
/>
```

The existing `whileHover={shouldReduceMotion ? undefined : direction}` keeps image movement disabled when reduced motion is requested. The CSS reduced-motion rule continues removing the overlay transition.

- [ ] **Step 6: Run the focused tests**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: all Image Mosaic tests pass.

- [ ] **Step 7: Format, lint, and type-check the touched files**

Run:

```bash
pnpm exec prettier --write \
  src/styles/custom.css \
  src/components/ui/direction-aware-hover.tsx \
  tests/int/image-mosaic.int.spec.tsx

pnpm exec eslint \
  src/components/ui/direction-aware-hover.tsx \
  tests/int/image-mosaic.int.spec.tsx
```

Create a temporary scoped TypeScript configuration with `apply_patch` that extends `tsconfig.json` and includes the touched TSX files. Run:

```bash
pnpm exec tsc -p tsconfig.image-mosaic-mobile-overlay.json --noEmit
```

Delete the temporary configuration with `apply_patch` immediately afterward.

Expected: formatting completes, ESLint reports zero errors, and TypeScript reports zero errors.

- [ ] **Step 8: Verify responsive behavior**

Verify the existing Image Mosaic preview at phone, tablet, desktop fine-pointer, and coarse-pointer widths:

- Below `lg`, the gradient, title, and action are visible before interaction.
- At `lg` and wider with a fine pointer, the overlay enters on hover or keyboard focus.
- At `lg` and wider with a coarse pointer, the overlay remains visible.
- Image and overlay transitions begin and finish together.
- Reduced-motion mode disables both transitions.
- No console or hydration errors appear.

- [ ] **Step 9: Audit staged and unstaged state**

Run:

```bash
git diff --check
git diff --name-status
git diff --cached --name-status
```

Expected: the mobile-overlay revision appears only in the unstaged working-tree diff. The existing staged snapshot remains unchanged in the index.
