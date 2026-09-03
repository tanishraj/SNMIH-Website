# Image Mosaic Hover Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve Image Mosaic's directional hover motion while ensuring the image covers the complete tile throughout the animation.

**Architecture:** Keep the existing `DirectionAwareHover` client boundary and replace its fixed 20-pixel translations with responsive two-percent translations. Increase image overscan from `1.08` to `1.10`, leaving three percent of coverage beyond the maximum shift on every edge.

**Tech Stack:** React 19, Next.js 16, Framer Motion, Tailwind CSS 4, Vitest.

## Global Constraints

- Preserve the existing direction-aware hover behavior.
- Use a two-percent directional image shift and a `1.10` overscan scale.
- The image must cover the complete tile throughout hover; no background may appear at an image edge.
- Do not change Payload fields, Image Mosaic layout, overlay styling, or touch behavior.
- Continue honoring reduced-motion preferences.
- Preserve the currently staged snapshot and keep this revision unstaged and uncommitted.

---

### Task 1: Keep directional image motion inside its overscan

**Files:**

- Modify: `tests/int/image-mosaic.int.spec.tsx`
- Modify: `src/components/ui/direction-aware-hover.tsx`

**Interfaces:**

- Consumes: the existing `DirectionAwareHover` props and direction calculation.
- Produces: the same component API with responsive hover variants that never exceed image overscan.

- [ ] **Step 1: Add a failing regression test for hover coverage**

Extend the existing source-level interaction test in `tests/int/image-mosaic.int.spec.tsx` with exact assertions for the approved responsive variants and overscan:

```tsx
expect(clientSource).toContain("top: { x: 0, y: '2%' }")
expect(clientSource).toContain("right: { x: '-2%', y: 0 }")
expect(clientSource).toContain("bottom: { x: 0, y: '-2%' }")
expect(clientSource).toContain("left: { x: '2%', y: 0 }")
expect(clientSource).toContain('scale-[1.1]')
expect(clientSource).not.toMatch(/[xy]: -?20/)
```

These assertions protect both sides of the coverage relationship: the translation is limited to two percent and the image retains ten-percent total overscan.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: FAIL because the component still uses fixed `20` translations and `scale-[1.08]`.

- [ ] **Step 3: Replace fixed translations with responsive translations**

In `src/components/ui/direction-aware-hover.tsx`, replace `imageVariants` with:

```tsx
const imageVariants = {
  initial: { x: 0, y: 0 },
  top: { x: 0, y: '2%' },
  right: { x: '-2%', y: 0 },
  bottom: { x: 0, y: '-2%' },
  left: { x: '2%', y: 0 },
} as const
```

This keeps the direction semantics unchanged: entering from an edge moves the image away from that edge, but the movement now scales with the tile dimensions.

- [ ] **Step 4: Increase the image overscan**

Change the image base class in the same component:

```tsx
className={cn('size-full scale-[1.1] object-cover', imageClassName)}
```

A centered `1.10` scale supplies five-percent coverage beyond each edge. A two-percent translation leaves approximately three-percent remaining coverage, preventing subpixel seams without producing the heavy crop required to support the old 20-pixel movement.

- [ ] **Step 5: Run the focused test**

Run:

```bash
pnpm exec vitest run tests/int/image-mosaic.int.spec.tsx --config ./vitest.config.mts
```

Expected: all Image Mosaic tests pass.

- [ ] **Step 6: Format, lint, and type-check the touched files**

Run:

```bash
pnpm exec prettier --write \
  src/components/ui/direction-aware-hover.tsx \
  tests/int/image-mosaic.int.spec.tsx

pnpm exec eslint \
  src/components/ui/direction-aware-hover.tsx \
  tests/int/image-mosaic.int.spec.tsx
```

Create a temporary scoped TypeScript configuration with `apply_patch` that extends `tsconfig.json` and includes the two touched files, run:

```bash
pnpm exec tsc -p tsconfig.image-mosaic-hover.json --noEmit
```

Then delete the temporary configuration with `apply_patch`.

Expected: formatting completes, ESLint reports zero errors, and TypeScript reports zero errors.

- [ ] **Step 7: Verify real hover coverage**

Open the existing Image Mosaic preview on a hover-capable desktop viewport and enter tiles from the top, right, bottom, and left.

Verify:

- Directional motion remains visible but subtle.
- The image covers every tile edge throughout the animation.
- No background or blank strip appears at any edge.
- The overlay remains interactive.
- Touch/coarse-pointer behavior is unchanged.
- Reduced-motion behavior is unchanged.
- No console or hydration errors appear.

- [ ] **Step 8: Audit staged and unstaged state**

Run:

```bash
git diff --check
git diff --name-status
git diff --cached --name-status
```

Expected: the hover-coverage revision appears only in the unstaged working-tree diff. The previously staged Image Mosaic snapshot remains unchanged in the index.
