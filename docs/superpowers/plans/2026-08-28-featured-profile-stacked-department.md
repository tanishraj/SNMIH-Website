# Featured Profile Stacked Department Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Style Text Below Image Featured Profile departments as theme-aware eyebrow metadata matching regular Department Profiles.

**Architecture:** Resolve an eyebrow surface from the existing card surface: explicit card backgrounds use `surface.value`, while default cards inherit `sectionBackground`. Apply that surface through the shared `data-section-eyebrow-surface` contract, retaining the existing stacked metadata order and leaving Image Overlay rendering unchanged.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vitest.

## Global Constraints

- Preserve stacked order as Name, Role / Designation, Department.
- Department uses compact uppercase mono typography and the semantic eyebrow accent.
- Default cards derive eyebrow color from the section background; explicit card backgrounds derive it from the card surface.
- Do not change Image Overlay cards, Payload fields, generated types, card spacing, image sizing, carousel behavior, or editor settings.
- Do not hardcode SNMIH green.
- Do not stage or commit changes.
- Complete the required project-context update/check loop.

---

## File Map

- Modify `tests/int/profile-carousel.int.spec.ts`: lock stacked metadata order, typography, and semantic surface behavior.
- Modify `src/components/profile-carousel-card.tsx`: resolve and apply the stacked Department eyebrow surface.
- Modify `.agents/skills/project-context/references/block-system.md`: record the stacked Department eyebrow contract.
- Refresh `.agents/skills/project-context/references/project-inventory.json` using the required updater.

---

### Task 1: Match stacked Department metadata to the regular profile eyebrow treatment

**Files:**

- Modify: `tests/int/profile-carousel.int.spec.ts`
- Modify: `src/components/profile-carousel-card.tsx`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Consumes `surface.value` from `resolveCardSurface(...)` and the existing `sectionBackground` prop.
- Produces `data-section-eyebrow-surface` on stacked Department metadata.
- Preserves `data-profile-carousel-department="true"` on overlay Department metadata and adds `data-profile-carousel-stacked-department="true"` for the stacked contract.

- [ ] **Step 1: Write failing stacked-card assertions**

In the existing test named `renders optional department independently and omits blank metadata`, assert the populated stacked card renders its metadata in order and exposes the semantic eyebrow contract:

```ts
const nameIndex = html.indexOf('Alex Morgan')
const roleIndex = html.indexOf('Program Director', nameIndex)
const departmentIndex = html.indexOf('data-profile-carousel-stacked-department="true"', roleIndex)

expect(nameIndex).toBeGreaterThan(-1)
expect(roleIndex).toBeGreaterThan(nameIndex)
expect(departmentIndex).toBeGreaterThan(roleIndex)
expect(html).toContain('data-section-eyebrow-surface="none"')
expect(html).toContain('font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]')
```

Add a rendering with `cardBackground: 'primary'` and assert:

```ts
expect(primaryHtml).toContain('data-section-eyebrow-surface="primary"')
```

- [ ] **Step 2: Run the Profile Carousel suite and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL because stacked Department metadata has neither the component data marker nor the eyebrow surface and still uses secondary body-copy typography.

- [ ] **Step 3: Resolve and apply the stacked eyebrow surface**

After resolving `surface`, add:

```ts
const stackedDepartmentSurface = surface.value === 'default' ? sectionBackground : surface.value
```

Replace only the stacked Department paragraph with:

```tsx
<p
  className="font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]"
  data-profile-carousel-stacked-department="true"
  data-section-eyebrow-surface={stackedDepartmentSurface}
>
  {profile.department}
</p>
```

Do not change the stacked Name or Role / Designation markup or the Image Overlay branch.

- [ ] **Step 4: Update the maintained block contract**

Revise the Profile Carousel paragraph in `.agents/skills/project-context/references/block-system.md` so Text Below Image is documented as Name, Role / Designation, then Department using the resolved card/section semantic eyebrow accent.

- [ ] **Step 5: Run verification and refresh project context**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts tests/int/department-profiles.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/components/profile-carousel-card.tsx tests/int/profile-carousel.int.spec.ts
pnpm exec prettier --check src/components/profile-carousel-card.tsx tests/int/profile-carousel.int.spec.ts .agents/skills/project-context/references/block-system.md
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/components/profile-carousel-card.tsx
git diff --check
pnpm project-context:update
pnpm project-context:check
```

Expected: 34 focused tests pass; TypeScript, ESLint, Prettier, layout detection, diff validation, and project-context validation pass. A stale optional knowledge-graph warning is non-blocking. Do not stage or commit.
