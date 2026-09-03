# Contained Tabs Semantic Radius Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make shared Contained tab rails and their tab triggers use the active website theme's semantic control radius without changing Pill or Underline geometry.

**Architecture:** Keep `src/blocks/shared/contentTabRail.ts` as the single presentation contract for every consuming block. Add the semantic class only in that helper, cover the helper directly, verify one real consumer through Fee Structure, and record the shared semantic in the maintained block-system reference.

**Tech Stack:** TypeScript, React 19, Tailwind CSS 4 semantic utilities, Radix Tabs, Vitest, Testing Library.

## Global Constraints

- Contained rail and Contained triggers use `rounded-control`.
- Pill rail and Pill triggers retain `rounded-full` and must not gain `rounded-control`.
- Underline rail and Underline triggers retain square geometry and must not gain either radius class.
- Preserve existing light/brand colors, borders, padding, sizing, focus states, overflow, scrolling, keyboard behavior, and responsive layout.
- SNMIH-Green derives rounded controls from its theme radius; SNMIH-Blue stays square because its base radius is zero.
- Do not change Payload fields, generated types, migrations, stored values, or the generic shadcn Tabs primitive.
- Preserve all unrelated working-tree changes. Commit only the files in a task, and only when the user explicitly authorizes a commit during execution.

---

## File Structure

- Create `tests/int/content-tab-rail.int.spec.ts`: direct unit-level contract for Contained, Pill, and Underline geometry on Light and Brand surfaces.
- Modify `tests/int/fee-structure.int.spec.tsx`: rendered consumer assertion proving legacy `boxed` maps to a rounded Contained rail and rounded triggers.
- Modify `src/blocks/shared/contentTabRail.ts`: add semantic control radius to the Contained rail and triggers at the shared source.
- Modify `.agents/skills/project-context/references/block-system.md`: document the shared Contained radius behavior and the unchanged Pill/Underline geometry.
- Potentially modify `.agents/skills/project-context/references/project-inventory.json`: accept only factual generated updates produced by `pnpm project-context:update`; a no-op is expected because no file registration changes.

### Task 1: Lock and implement the shared Contained radius contract

**Files:**
- Create: `tests/int/content-tab-rail.int.spec.ts`
- Modify: `tests/int/fee-structure.int.spec.tsx:789-801`
- Modify: `src/blocks/shared/contentTabRail.ts:10-43`

**Interfaces:**
- Consumes: `getContentTabRailClasses(variant, surface)` and `getContentTabClasses(variant, active, surface)` from `src/blocks/shared/contentTabRail.ts`.
- Produces: the existing helper signatures unchanged, with `rounded-control` included only for the `contained` variant.

- [ ] **Step 1: Write the failing direct contract test**

Create `tests/int/content-tab-rail.int.spec.ts` with:

```ts
import { describe, expect, it } from 'vitest'

import {
  getContentTabClasses,
  getContentTabRailClasses,
  type ContentTabSurface,
} from '@/blocks/shared/contentTabRail'

const surfaces: ContentTabSurface[] = ['light', 'brand']
const hasClass = (classes: string, className: string) =>
  classes.split(/\s+/).includes(className)

describe('shared content tab radius contract', () => {
  it.each(surfaces)('rounds the %s Contained rail and every trigger state', (surface) => {
    expect(hasClass(getContentTabRailClasses('contained', surface), 'rounded-control')).toBe(true)

    for (const active of [false, true]) {
      expect(hasClass(getContentTabClasses('contained', active, surface), 'rounded-control')).toBe(
        true,
      )
    }
  })

  it.each(surfaces)('keeps the %s Pill rail and triggers fully rounded', (surface) => {
    expect(hasClass(getContentTabRailClasses('pill', surface), 'rounded-full')).toBe(true)
    expect(hasClass(getContentTabRailClasses('pill', surface), 'rounded-control')).toBe(false)

    for (const active of [false, true]) {
      const classes = getContentTabClasses('pill', active, surface)

      expect(hasClass(classes, 'rounded-full')).toBe(true)
      expect(hasClass(classes, 'rounded-control')).toBe(false)
    }
  })

  it.each(surfaces)('keeps the %s Underline rail and triggers square', (surface) => {
    const railClasses = getContentTabRailClasses('underline', surface)

    expect(hasClass(railClasses, 'rounded-control')).toBe(false)
    expect(hasClass(railClasses, 'rounded-full')).toBe(false)

    for (const active of [false, true]) {
      const classes = getContentTabClasses('underline', active, surface)

      expect(hasClass(classes, 'rounded-control')).toBe(false)
      expect(hasClass(classes, 'rounded-full')).toBe(false)
    }
  })
})
```

- [ ] **Step 2: Strengthen the rendered Fee Structure regression test**

Extend the existing `maps legacy Fee Structure tab values onto the shared content-tab variants` test in `tests/int/fee-structure.int.spec.tsx`:

```tsx
const rail = container.querySelector('[data-content-tab-variant="contained"]')

expect(container.querySelector('[data-fee-tab-style="boxed"]')).toBeTruthy()
expect(rail).toBeTruthy()
expect(rail?.className).toContain('rounded-control')

for (const tab of screen.getAllByRole('tab')) {
  expect(tab.className).toContain('rounded-control')
}
```

Replace the test's current standalone `data-content-tab-variant="contained"` truthiness assertion with the `rail` assertions above.

- [ ] **Step 3: Run the focused tests and confirm the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-tab-rail.int.spec.ts tests/int/fee-structure.int.spec.tsx
```

Expected: FAIL because the Contained rail and triggers do not yet contain `rounded-control`; existing Pill assertions continue to pass.

- [ ] **Step 4: Add the semantic radius at the shared source**

Update the Contained rail definitions in `src/blocks/shared/contentTabRail.ts`:

```ts
const railClasses = {
  light: {
    contained: 'rounded-control border border-border bg-background p-1',
    pill: 'rounded-full border border-border bg-background p-1',
    underline: 'border-b border-border',
  },
  brand: {
    contained:
      'rounded-control border border-primary-foreground/25 bg-primary-foreground/[0.06] p-1',
    pill:
      'rounded-full border border-primary-foreground/25 bg-primary-foreground/[0.06] p-1',
    underline: 'border-b border-primary-foreground/25',
  },
} as const satisfies Record<ContentTabSurface, Record<ContentTabVariant, string>>
```

Add the Contained trigger branch immediately before the existing Pill branch in `getContentTabClasses`:

```ts
variant === 'contained' && 'rounded-control',
variant === 'pill' && 'rounded-full',
variant === 'underline' && '-mb-px border-b-2 border-transparent',
```

Do not modify any consumer component; Fee Structure, Department Profiles, Gallery Album Tabs, News & Events Tabs, and Tabs Content must inherit the correction through the helper.

- [ ] **Step 5: Run the focused tests and confirm they pass**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-tab-rail.int.spec.ts tests/int/fee-structure.int.spec.tsx
```

Expected: PASS. The direct contract covers both surfaces and both trigger states; Fee Structure proves the shared classes reach rendered DOM.

- [ ] **Step 6: Inspect the scoped diff**

Run:

```bash
git diff -- src/blocks/shared/contentTabRail.ts tests/int/content-tab-rail.int.spec.ts tests/int/fee-structure.int.spec.tsx
git diff --check
```

Expected: only the shared helper and two focused tests differ for this task; `git diff --check` prints no errors.

- [ ] **Step 7: Commit only if explicitly authorized**

If the user requests a commit during execution:

```bash
git add src/blocks/shared/contentTabRail.ts tests/int/content-tab-rail.int.spec.ts tests/int/fee-structure.int.spec.tsx
git commit -m "fix(tabs): align contained radii"
```

Otherwise leave the verified changes uncommitted.

### Task 2: Document and verify the shared presentation change

**Files:**
- Modify: `.agents/skills/project-context/references/block-system.md:57-60`
- Verify: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the implemented `rounded-control` Contained contract from Task 1.
- Produces: maintained architecture text that accurately describes the shared rail geometry; no runtime API or schema changes.

- [ ] **Step 1: Update the maintained shared-presentation reference**

Replace the `contentTabRail.ts` bullet in `.agents/skills/project-context/references/block-system.md` with:

```md
- `contentTabRail.ts`: Contained, Pill, and Underline tab geometry with light/brand surface-aware
  foreground, active, hover, and focus states. Contained applies the semantic `rounded-control` role
  to both its framed rail and triggers, Pill remains intentionally `rounded-full`, and Underline stays
  square. Underline uses a two-pixel active border that overlaps the rail divider so selection remains
  visible. Tabs Content maps its legacy Boxed, Pills, Segmented, and Underline values into this contract
  without changing saved content.
```

- [ ] **Step 2: Run the affected shared and consumer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/content-tab-rail.int.spec.ts \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/department-profiles.int.spec.tsx \
  tests/int/gallery-album-tabs.int.spec.tsx \
  tests/int/news-events-tabs.int.spec.tsx \
  tests/int/tabs-content-active-color.int.spec.ts \
  tests/int/theme-contracts.int.spec.ts \
  tests/int/semantic-radius-contract.int.spec.ts
```

Expected: PASS with no changed scrolling, variant, active-color, or semantic-radius regressions.

- [ ] **Step 3: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit --pretty false
pnpm lint
```

Expected: TypeScript exits zero. ESLint exits zero, apart from any explicitly identified pre-existing warning that is unrelated to the scoped diff.

- [ ] **Step 4: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/references/project-inventory.json .agents/skills/project-context/references/block-system.md
pnpm project-context:check
```

Expected: `project-context:check` passes. The inventory update should be a no-op because no registrations or exported interfaces changed; retain a generated inventory change only if it reflects a real source fact. A stale optional knowledge-graph warning is non-blocking.

- [ ] **Step 5: Review the final change impact**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git diff --check
git status --short
git diff -- src/blocks/shared/contentTabRail.ts tests/int/content-tab-rail.int.spec.ts tests/int/fee-structure.int.spec.tsx .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: the final scoped diff contains only the shared tab radius contract, its tests, the maintained semantic description, and any truthful generated context update. No Payload generator, import-map generation, migration, or block-thumbnail generation is required.

- [ ] **Step 6: Commit only if explicitly authorized**

If the user requests a commit during execution and Task 1 was not committed separately:

```bash
git add src/blocks/shared/contentTabRail.ts tests/int/content-tab-rail.int.spec.ts tests/int/fee-structure.int.spec.tsx .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
git commit -m "fix(tabs): align contained radii"
```

If Task 1 was already committed and the documentation changed afterward:

```bash
git add .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
git commit -m "docs(tabs): record radius contract"
```

Otherwise leave all verified changes uncommitted.
