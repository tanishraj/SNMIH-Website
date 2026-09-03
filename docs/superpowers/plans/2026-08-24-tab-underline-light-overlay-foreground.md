# Visible Underline Tabs and Theme-Aligned Light Overlays Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the active Underline tab visually unmistakable and make Light media-overlay text use a readable, theme-specific foreground in both website color modes.

**Architecture:** Keep both fixes in their existing shared presentation contracts. `contentTabRail` owns tab state styling, while theme CSS and `mediaOverlayPresentation` own Light overlay foreground semantics; Banner CTA receives the corrected behavior without a private override.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, TypeScript, Vitest.

## Global Constraints

- Preserve all Payload fields, saved values, generated types, block registrations, and renderer boundaries.
- Preserve the current 44px tab target, horizontal scrolling, focus treatment, and reduced-motion behavior.
- Do not add Banner CTA-specific color logic.
- Do not change Dark or Brand media-overlay presentation.
- Keep all changes uncommitted unless the user explicitly requests a commit.
- Preserve unrelated working-tree changes.

---

## Task 1: Replace the Underline tab pseudo-element with a visible border

**Files:**

- Modify: `tests/int/tabs-content-active-color.int.spec.ts`
- Modify: `src/blocks/shared/contentTabRail.ts`

- [x] **Step 1: Add failing shared-contract assertions**

Update the source-contract test so the Underline variant must use a real two-pixel bottom border and must not retain the pseudo-element indicator. Assert these exact shared class fragments:

```ts
expect(source).toContain("variant === 'underline' && '-mb-px border-b-2 border-transparent'")
expect(source).toContain("'border-primary text-primary'")
expect(source).toContain("'border-primary-foreground text-primary-foreground'")
expect(source).not.toContain('after:scale-x')
expect(source).not.toContain('after:bg')
```

Retain the existing assertions that all tab blocks consume `contentTabRail` rather than defining private active-state colors.

- [x] **Step 2: Run the focused test and confirm the intended failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/tabs-content-active-color.int.spec.ts
```

Expected: failure because the current contract uses a one-pixel `after:` pseudo-element instead of the required bottom border.

- [x] **Step 3: Implement the shared Underline border state**

In `contentTabRail.ts`, remove the Underline variant's `after:` classes. Add the resting geometry as a real transparent border:

```ts
variant === 'underline' && '-mb-px border-b-2 border-transparent'
```

For an active Underline tab, use:

```ts
surface === 'brand'
  ? 'border-primary-foreground text-primary-foreground'
  : 'border-primary text-primary'
```

Keep the current inactive, hover, focus-visible, target-size, scrolling, and motion classes unchanged. The `-mb-px` overlap lets the two-pixel selected border sit cleanly over the rail's one-pixel divider.

- [x] **Step 4: Re-run the focused test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/tabs-content-active-color.int.spec.ts
```

Expected: pass.

---

## Task 2: Add a theme-specific Light overlay foreground token

**Files:**

- Modify: `tests/int/theme-contracts.int.spec.ts`
- Modify: `tests/int/media-overlay.int.spec.ts`
- Modify: `tests/int/banner-media-overlay.int.spec.tsx`
- Modify: `src/styles/globals.css`
- Modify: `src/styles/themes/theme-default.css`
- Modify: `src/styles/themes/theme-sunset.css`
- Modify: `src/styles/themes/theme-blue.css`
- Modify: `src/styles/themes/theme-kodama.css`
- Modify: `src/styles/themes/theme-snmih.css`
- Modify: `src/blocks/shared/mediaOverlayPresentation.ts`

- [x] **Step 1: Add failing theme-token coverage**

In `theme-contracts.int.spec.ts`, add `light-overlay-foreground` to the required semantic token contract. For every theme in both light and dark mode, assert that the token exists and has at least 4.5:1 contrast against white:

```ts
const white = 'oklch(1 0 0)'

for (const mode of ['light', 'dark'] as const) {
  const tokens = getModeTokens(css, mode)
  expect(tokens['light-overlay-foreground']).toBeDefined()
  expect(contrastRatio(tokens['light-overlay-foreground'], white)).toBeGreaterThanOrEqual(4.5)
}
```

Also assert that `globals.css` exposes the Tailwind bridge:

```css
--color-light-overlay-foreground: var(--light-overlay-foreground);
```

- [x] **Step 2: Add failing shared-overlay and Banner CTA coverage**

In `media-overlay.int.spec.ts`, require every Light overlay text slot to use the semantic utility:

```ts
expect(mediaOverlayTextClasses.light).toEqual({
  title: 'text-light-overlay-foreground',
  secondary: 'text-light-overlay-foreground',
  eyebrow: 'text-light-overlay-foreground',
  link: 'text-light-overlay-foreground',
})
```

In `banner-media-overlay.int.spec.tsx`, render Banner CTA with an image and `themeMode="light"`. Assert that it exposes `data-banner-cta-theme="light"`, contains `text-light-overlay-foreground`, and does not contain `text-black`.

- [x] **Step 3: Run the focused tests and confirm the intended failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/media-overlay.int.spec.ts tests/int/banner-media-overlay.int.spec.tsx
```

Expected: failures because the new token and semantic utility are not present yet.

- [x] **Step 4: Define the global fallback and Tailwind bridge**

In `globals.css`, add the default fallback to `:root`:

```css
--light-overlay-foreground: oklch(0.145 0 0);
```

Expose it inside `@theme inline`:

```css
--color-light-overlay-foreground: var(--light-overlay-foreground);
```

Do not invert this token in `.dark`; a Light overlay remains a white surface regardless of the surrounding website color mode.

- [x] **Step 5: Define the token in both modes of every theme**

Add the same theme-specific value to both that theme's light and dark selector blocks:

```text
Default: oklch(0.145 0 0)
Sunset:  oklch(0.34 0.01 2.77)
Blue:    oklch(0.147 0.004 49.25)
Kodama:  oklch(0.145 0.008 326)
SNMIH:   oklch(0.2322 0.0575 258.39)
```

This deliberately preserves each theme's light-mode foreground character on a white media overlay, including when the website itself is in dark mode.

- [x] **Step 6: Update the shared media-overlay text contract**

Replace the hard-coded black Light overlay classes in `mediaOverlayPresentation.ts` with:

```ts
light: {
  title: 'text-light-overlay-foreground',
  secondary: 'text-light-overlay-foreground',
  eyebrow: 'text-light-overlay-foreground',
  link: 'text-light-overlay-foreground',
},
```

Leave Dark and Brand mappings unchanged. Do not add conditionals to Banner CTA; it should inherit this through `resolveMediaOverlay`.

- [x] **Step 7: Re-run the focused tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/media-overlay.int.spec.ts tests/int/banner-media-overlay.int.spec.tsx
```

Expected: pass.

---

## Task 3: Verify shared impact and refresh project knowledge

**Files:**

- Review: `.agents/skills/project-context/references/change-impact-map.md`
- Modify only if the update reports a narrative change: `.agents/skills/project-context/references/architecture.md`
- Modify only if the update reports a narrative change: `.agents/skills/project-context/references/block-system.md`
- Generated by the project script: `.agents/skills/project-context/references/project-inventory.json`

- [x] **Step 1: Run affected contract and render coverage together**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/theme-contracts.int.spec.ts tests/int/tabs-content-active-color.int.spec.ts tests/int/media-overlay.int.spec.ts tests/int/banner-media-overlay.int.spec.tsx tests/int/hero-banner-render.int.spec.ts
```

Expected: pass. The Hero Banner test guards against unintended regressions in another consumer of the shared media-overlay contract.

- [x] **Step 2: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/shared/contentTabRail.ts src/blocks/shared/mediaOverlayPresentation.ts tests/int/tabs-content-active-color.int.spec.ts tests/int/theme-contracts.int.spec.ts tests/int/media-overlay.int.spec.ts tests/int/banner-media-overlay.int.spec.tsx
```

Expected: both commands pass without new errors or warnings.

- [x] **Step 3: Run the full integration suite**

Run:

```bash
pnpm test:int
```

Expected: all integration tests pass.

- [x] **Step 4: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
```

Read `.agents/skills/project-context/references/change-impact-map.md`. Update `architecture.md` or `block-system.md` only if the generated impact report shows that their maintained narrative is now incomplete. Then run:

```bash
pnpm project-context:check
```

Expected: project context is current.

- [x] **Step 5: Inspect the final uncommitted diff**

Run:

```bash
git diff --check
git status --short
git diff -- src/blocks/shared/contentTabRail.ts src/blocks/shared/mediaOverlayPresentation.ts src/styles/globals.css src/styles/themes tests/int/tabs-content-active-color.int.spec.ts tests/int/theme-contracts.int.spec.ts tests/int/media-overlay.int.spec.ts tests/int/banner-media-overlay.int.spec.tsx
```

Confirm that:

- the selected Underline tab has a real two-pixel theme-aware border;
- the Light overlay foreground is readable and theme-specific in both website modes;
- Banner CTA has no private color exception;
- Dark and Brand overlays are unchanged;
- no Payload schema or generated type changed;
- all work remains uncommitted.
