# Image Mosaic CSS Hover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Image Mosaic's direction-aware client animation with a simple CSS-only image zoom and gradient fade.

**Architecture:** Render the complete tile in the existing server-compatible `ImageMosaic` component and remove the dedicated Framer Motion client component. CSS keeps overlays visible by default, then applies synchronized `200ms ease-out` image scale and overlay opacity transitions only on `lg` fine-pointer hover/focus environments.

**Tech Stack:** React 19 server-compatible components, Next.js 16, Tailwind CSS 4, custom CSS, Vitest.

## Global Constraints

- The image must zoom from scale `1` to `1.05`; it must not translate or slide.
- The gradient overlay must fade through opacity only; it must not translate or slide.
- Image zoom and gradient fade must both use `200ms ease-out`.
- Screens below `lg` and coarse-pointer devices must keep the gradient, title, and action permanently visible.
- Only `lg` and wider fine-pointer hover devices may hide the overlay until hover or keyboard focus.
- Reduced-motion mode must disable both transitions.
- Image Mosaic must remain server-compatible and must not import Framer Motion.
- Delete the unused direction-aware client component after moving its markup into `ImageMosaic`.
- Preserve the existing Payload fields, content behavior, image layout, theme tokens, staged snapshot, and unrelated work.
- Keep this revision unstaged and uncommitted.

---

### Task 1: Replace direction-aware motion with CSS zoom and fade

**Files:**

- Modify: `tests/int/image-mosaic.int.spec.tsx`
- Modify: `src/components/image-mosaic.tsx`
- Modify: `src/styles/custom.css`
- Delete: `src/components/ui/direction-aware-hover.tsx`

**Interfaces:**

- Consumes: `ImageMosaicItem`, `.group/image-mosaic`, `.image-mosaic-overlay`, and the existing overlay content.
- Produces: server-rendered tile markup with `.image-mosaic-image` as the CSS zoom target and no client animation dependency.

- [ ] **Step 1: Add failing server-compatibility and animation assertions**

In `tests/int/image-mosaic.int.spec.tsx`, extend the Node import:

```tsx
import { existsSync, readFileSync } from 'node:fs'
```

Replace the current client-source setup and assertions with:

```tsx
const obsoleteClientPath = 'src/components/ui/direction-aware-hover.tsx'
const imageRuleStart = customCss.indexOf('.image-mosaic-image')
const overlayRuleStart = customCss.indexOf('.image-mosaic-overlay')
const desktopOverlayMediaStart = customCss.indexOf(
  '@media (min-width: 64rem) and (hover: hover) and (pointer: fine)',
)
const reducedMotionMediaStart = customCss.indexOf(
  '@media (prefers-reduced-motion: reduce)',
  desktopOverlayMediaStart,
)
const baseImageRules = customCss.slice(imageRuleStart, overlayRuleStart)
const baseOverlayRules = customCss.slice(overlayRuleStart, desktopOverlayMediaStart)
const desktopHoverRules = customCss.slice(desktopOverlayMediaStart, reducedMotionMediaStart)

expect(serverSource).not.toContain("'use client'")
expect(serverSource).not.toContain("from 'framer-motion'")
expect(serverSource).not.toContain('DirectionAwareHover')
expect(existsSync(obsoleteClientPath)).toBe(false)
expect(imageRuleStart).toBeGreaterThan(-1)
expect(desktopOverlayMediaStart).toBeGreaterThan(overlayRuleStart)
expect(baseImageRules).toContain('transform: scale(1)')
expect(baseImageRules).toContain('transition: transform 200ms ease-out')
expect(baseOverlayRules).toContain('pointer-events: auto')
expect(baseOverlayRules).toContain('opacity: 1')
expect(baseOverlayRules).toContain('transition: opacity 200ms ease-out')
expect(desktopHoverRules).toContain('pointer-events: none')
expect(desktopHoverRules).toContain('opacity: 0')
expect(desktopHoverRules).toContain('transform: scale(1.05)')
expect(customCss).not.toContain('data-image-mosaic-direction')
expect(customCss).not.toContain('translate3d')
expect(customCss).not.toContain('@media (hover: none), (pointer: coarse)')
expect(customCss).toContain('@media (prefers-reduced-motion: reduce)')
```

- [ ] **Step 2: Add failing markup assertions**

In the existing overlay visibility test, assert:

```tsx
expect(enabledHtml).toContain('group/image-mosaic')
expect(enabledHtml).toContain('image-mosaic-image')
expect(disabledHtml).not.toContain('group/image-mosaic')
expect(disabledHtml).not.toContain('image-mosaic-image')
```

This ensures disabling overlays also disables tile hover animation.

- [ ] **Step 3: Run the focused tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because `DirectionAwareHover` and its file still exist, the server component delegates tile markup to it, and CSS still contains directional transforms.

- [ ] **Step 4: Render the complete tile in the server component**

In `src/components/image-mosaic.tsx`, remove:

```tsx
import { DirectionAwareHover } from '@/components/ui/direction-aware-hover'
```

Replace the separate overlay/no-overlay branches inside `visibleItems.map` with one tile:

```tsx
return (
  <div
    className={cn(tileClassName, hasOverlay ? 'group/image-mosaic' : undefined)}
    data-image-mosaic-item={index + 1}
    key={itemKey}
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      alt={item.image.alt}
      className={cn(imageClassName, hasOverlay ? 'image-mosaic-image' : undefined)}
      draggable={false}
      height={item.image.height}
      src={item.image.src}
      width={item.image.width}
    />
    {hasOverlay ? (
      <div className="image-mosaic-overlay absolute inset-x-0 bottom-0 bg-gradient-to-t from-background via-background/85 to-transparent p-5 pt-16 text-foreground">
        <div className="flex flex-col items-start gap-2" data-image-mosaic-overlay="true">
          {resolvedTitle ? (
            <p className="text-base leading-tight font-semibold text-current">{resolvedTitle}</p>
          ) : null}
          {item.action ? (
            <ContentActions
              actions={[item.action]}
              alignment="left"
              data-image-mosaic-item-action="true"
              mode={item.action.mode}
            />
          ) : null}
        </div>
      </div>
    ) : null}
  </div>
)
```

The tile remains a non-interactive `div`; only the nested shared link or button is interactive.

- [ ] **Step 5: Replace directional CSS with synchronized zoom and fade**

Replace the Image Mosaic rules in `src/styles/custom.css` with:

```css
/* Image Mosaic hover treatment */
.image-mosaic-image {
  transform: scale(1);
  transform-origin: center;
  transition: transform 200ms ease-out;
}

.image-mosaic-overlay {
  pointer-events: auto;
  opacity: 1;
  transition: opacity 200ms ease-out;
}

@media (min-width: 64rem) and (hover: hover) and (pointer: fine) {
  .image-mosaic-overlay {
    pointer-events: none;
    opacity: 0;
  }

  .group\/image-mosaic:hover .image-mosaic-image,
  .group\/image-mosaic:focus-within .image-mosaic-image {
    transform: scale(1.05);
  }

  .group\/image-mosaic:hover .image-mosaic-overlay,
  .group\/image-mosaic:focus-within .image-mosaic-overlay {
    pointer-events: auto;
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .image-mosaic-image,
  .image-mosaic-overlay {
    transition: none;
  }
}
```

The base state keeps overlays visible on mobile, tablet, and coarse-pointer devices. Desktop fine-pointer hover/focus changes only image scale and overlay opacity.

- [ ] **Step 6: Delete the obsolete client component**

Delete `src/components/ui/direction-aware-hover.tsx` with `apply_patch`. Confirm no references remain:

```bash
rg -n "DirectionAwareHover|direction-aware-hover|data-image-mosaic-direction" src tests
```

Expected: no matches.

- [ ] **Step 7: Run the focused tests**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: all Image Mosaic tests pass.

- [ ] **Step 8: Format, lint, and type-check the touched files**

Run:

```bash
pnpm exec prettier --write \
  src/components/image-mosaic.tsx \
  src/styles/custom.css \
  tests/int/image-mosaic.int.spec.tsx

pnpm exec eslint \
  src/components/image-mosaic.tsx \
  tests/int/image-mosaic.int.spec.tsx
```

Create a temporary scoped TypeScript configuration with `apply_patch` that extends `tsconfig.json` and includes `src/components/image-mosaic.tsx` and `tests/int/image-mosaic.int.spec.tsx`. Run:

```bash
pnpm exec tsc -p tsconfig.image-mosaic-css-hover.json --noEmit
```

Delete the temporary configuration with `apply_patch` immediately afterward.

Expected: formatting completes, ESLint reports zero errors, and TypeScript reports zero errors.

- [ ] **Step 9: Verify responsive behavior**

Verify the existing Image Mosaic preview:

- Mobile/tablet and coarse-pointer devices show the gradient, title, and action before interaction.
- Desktop fine-pointer hover/focus zooms the image to `1.05` without translation.
- The gradient fades without translation.
- Zoom and fade begin and finish together in `200ms ease-out`.
- The image continues filling every tile edge.
- Reduced-motion mode disables both transitions.
- No client hydration or console errors appear.

- [ ] **Step 10: Audit staged and unstaged state**

Run:

```bash
git diff --check
git diff --name-status
git diff --cached --name-status
```

Expected: the CSS-hover revision appears only in the unstaged working-tree diff. The existing staged snapshot remains unchanged in the index.
