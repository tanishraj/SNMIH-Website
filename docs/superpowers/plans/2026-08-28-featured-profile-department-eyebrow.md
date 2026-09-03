# Featured Profile Department Eyebrow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Profile Carousel Image Overlay department labels the existing theme-aware eyebrow accent color.

**Architecture:** Reuse the resolved media overlay's semantic `eyebrowSurface` through the existing `data-section-eyebrow-surface` styling contract. No new color utility, CSS selector, field, or component API is introduced.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Payload CMS block rendering, Vitest.

## Global Constraints

- Keep Department above Name and Role / Designation with its current compact uppercase mono typography.
- Change only Image Overlay department color behavior; Text Below Image remains unchanged.
- Use semantic theme behavior across SNMIH light mode, dark mode, and light, dark, and brand overlays.
- Do not change Payload fields, generated types, card layout, carousel behavior, filters, settings, or other profile metadata colors.
- Do not stage or commit changes.
- Complete the required project-context update/check loop.

---

## File Map

- Modify `tests/int/profile-carousel.int.spec.ts`: lock the semantic eyebrow-surface rendering contract.
- Modify `src/components/profile-carousel-card.tsx`: expose the resolved overlay eyebrow surface on Department metadata.
- Refresh `.agents/skills/project-context/references/project-inventory.json` using the required updater; narrative documentation should remain unchanged because the current block-system reference already defines Department as eyebrow metadata.

---

### Task 1: Apply the semantic eyebrow color to overlay Department metadata

**Files:**

- Modify: `tests/int/profile-carousel.int.spec.ts`
- Modify: `src/components/profile-carousel-card.tsx`

**Interfaces:**

- Consumes `overlay.eyebrowSurface` from the existing `resolveMediaOverlay(...)` result.
- Produces `data-section-eyebrow-surface="lightOverlay" | "darkOverlay" | "brand"` on Image Overlay Department markup.
- Retains `data-profile-carousel-department="true"` for the existing component-specific rendering contract.

- [ ] **Step 1: Write the failing rendering assertion**

In the existing test named `renders a configurable image overlay with one alignment for every profile`, add an assertion for the configured light overlay:

```ts
expect(html.match(/data-section-eyebrow-surface="lightOverlay"/g)).toHaveLength(4)
```

This test already renders four overlay cards with `themeMode: 'light'`, so the expected count is exact and does not depend on unrelated page eyebrows.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL because Profile Carousel department metadata does not yet expose `data-section-eyebrow-surface`.

- [ ] **Step 3: Apply the resolved eyebrow surface**

In the Image Overlay department paragraph in `src/components/profile-carousel-card.tsx`, preserve the existing classes and data attribute, and add:

```tsx
<p
  className="font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]"
  data-profile-carousel-department="true"
  data-section-eyebrow-surface={overlay.eyebrowSurface}
>
  {profile.department}
</p>
```

Do not add a hardcoded `text-*` color class. The existing SNMIH rules in `src/styles/custom.css` will render dark overlays green, light overlays in an accessible darker green, and brand/dark-mode surfaces through their established semantic mappings.

- [ ] **Step 4: Run focused verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts tests/int/department-profiles.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/components/profile-carousel-card.tsx tests/int/profile-carousel.int.spec.ts
pnpm exec prettier --check src/components/profile-carousel-card.tsx tests/int/profile-carousel.int.spec.ts
node .agents/skills/impeccable/scripts/detect.mjs --json --scope color src/components/profile-carousel-card.tsx
git diff --check
```

Expected: 34 focused tests pass; TypeScript, ESLint, Prettier, and diff checks exit zero; the color detector reports no unresolved issue.

- [ ] **Step 5: Refresh maintained project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory is current and the context check passes. A stale optional knowledge-graph warning is non-blocking. Confirm that `block-system.md` needs no narrative change because it already specifies Image Overlay Department as eyebrow metadata. Do not stage or commit.
