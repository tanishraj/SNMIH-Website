# Department Profiles Centered Tab Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Department Profiles Centered Auto Width tab frame shrink-wrap and center its tabs while retaining constrained inner scrolling without scrollbar chrome.

**Architecture:** Add a local outer-frame width-class map alongside the existing inner tablist width map. The centered mode receives intrinsic centered frame sizing; Content Width and Equal Full Width keep the current growing frame, while the nested `no-scrollbar` overflow viewport remains unchanged.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4, Vitest, Testing Library.

## Global Constraints

- Apply intrinsic sizing only when `tabWidth="centered"`.
- Preserve `flex-1` for Content Width and Equal Full Width.
- Preserve `no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain` exactly on the nested viewport.
- Preserve stationary frame styling, tab semantics, keyboard navigation, filtering, search, and theme behavior.
- Do not change Fee Structure or shared tab helpers.
- Do not stage or commit changes.

---

### Task 1: Define the outer-frame width contract

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx:778`

**Interfaces:**

- Consumes: `data-department-profiles-tab-frame="true"`, `data-department-profiles-tab-width`, and the existing width variants.
- Produces: a regression contract for centered intrinsic frame sizing and full-width growing frames.

- [ ] **Step 1: Add the failing frame-width test**

Add this focused test after the existing width-variant table:

```tsx
it('shrink-wraps the centered tab frame without changing the hidden scroll viewport', () => {
  const { container } = render(
    <DepartmentProfilesClient {...baseClientProps} tabWidth="centered" />,
  )

  const frame = container.querySelector('[data-department-profiles-tab-frame="true"]')
  const viewport = container.querySelector('[data-department-profiles-tab-scroll="true"]')

  expect(frame?.className).toContain('mx-auto')
  expect(frame?.className).toContain('w-fit')
  expect(frame?.className).toContain('max-w-full')
  expect(frame?.className).not.toContain('flex-1')
  expect(viewport?.className).toContain('no-scrollbar')
  expect(viewport?.className).toContain('overflow-x-auto')
})

it.each(['content', 'equal'] as const)('keeps the %s tab frame growing', (tabWidth) => {
  const { container } = render(
    <DepartmentProfilesClient {...baseClientProps} tabWidth={tabWidth} />,
  )

  expect(
    container.querySelector('[data-department-profiles-tab-frame="true"]')?.className,
  ).toContain('flex-1')
})
```

- [ ] **Step 2: Run the focused suite and verify it fails**

```bash
pnpm vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: the centered frame test fails because every outer frame currently contains `flex-1` and lacks intrinsic width classes.

### Task 2: Apply centered width to the stationary frame

**Files:**

- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx:95`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx:388`
- Test: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Consumes: `DepartmentProfilesTabWidth` and the selected `tabWidth` value.
- Produces: `tabFrameWidthClasses: Record<DepartmentProfilesTabWidth, string>`.

- [ ] **Step 1: Add the local frame-width map**

Place this map beside `tabRailWidthClasses`:

```tsx
const tabFrameWidthClasses = {
  centered: 'mx-auto w-fit max-w-full',
  content: 'flex-1',
  equal: 'flex-1',
} as const satisfies Record<DepartmentProfilesTabWidth, string>
```

- [ ] **Step 2: Apply the selected frame width**

Change the stationary frame classes to:

```tsx
className={cn(
  'min-w-0 overflow-hidden',
  tabFrameWidthClasses[tabWidth],
  getContentTabRailClasses(tabVariant, tabSurface),
)}
```

Keep the nested viewport exactly:

```tsx
className = 'no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain'
```

- [ ] **Step 3: Run the focused suite and verify it passes**

```bash
pnpm vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: all Department Profiles integration tests pass.

### Task 3: Verify shared tab and repository contracts

**Files:**

- Inspect: `.agents/skills/project-context/references/change-impact-map.md`
- Update if generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the centered frame behavior from Task 2.
- Produces: verified frontend and maintained-context contracts.

- [ ] **Step 1: Run affected and shared tab tests**

```bash
pnpm vitest run tests/int/department-profiles.int.spec.tsx tests/int/theme-contracts.int.spec.ts tests/int/tabs-content-active-color.int.spec.ts
```

Expected: all tests pass.

- [ ] **Step 2: Run static checks**

```bash
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx tests/int/department-profiles.int.spec.tsx
pnpm exec prettier --check src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx tests/int/department-profiles.int.spec.tsx docs/superpowers/specs/2026-08-28-department-profiles-centered-tab-frame-design.md docs/superpowers/plans/2026-08-28-department-profiles-centered-tab-frame.md
```

Expected: all commands exit successfully.

- [ ] **Step 3: Run the layout detector**

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx
```

Expected: `[]`.

- [ ] **Step 4: Complete the project-context loop**

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: project context is current. A stale optional knowledge-graph warning may remain.

- [ ] **Step 5: Inspect the final diff**

```bash
git diff --check
git diff -- src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx tests/int/department-profiles.int.spec.tsx .agents/skills/project-context/references/project-inventory.json
git status --short
```

Expected: no whitespace errors and only the intended frame-width/test delta plus any deterministic context hash update. Do not stage or commit.
