# Department Profiles Hidden Tab Scrollbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hide the Department Profiles tab viewport's scrollbar chrome while preserving horizontal scrolling and all tab interactions.

**Architecture:** Extend the existing local three-layer tab structure without changing shared tab primitives. The stationary outer frame remains unchanged; the nested `overflow-x-auto` viewport receives the existing global `no-scrollbar` utility, and the integration contract verifies both behaviors coexist.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4 custom utilities, Vitest, Testing Library.

## Global Constraints

- Apply the change only to the Department Profiles Tabs presentation.
- Preserve touch, trackpad, mouse-wheel, keyboard, tablist, focus, filtering, width, and theme behavior.
- Reuse the existing `no-scrollbar` utility; add no CSS or dependency.
- Do not stage or commit changes.

---

### Task 1: Hide the local tab viewport scrollbar

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx:797`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx:398`

**Interfaces:**

- Consumes: the existing `[data-department-profiles-tab-scroll="true"]` viewport and global `no-scrollbar` Tailwind utility.
- Produces: a horizontally scrollable viewport whose scrollbar chrome is hidden.

- [ ] **Step 1: Extend the existing fixed-frame test**

Add the `no-scrollbar` assertion beside the existing `overflow-x-auto` assertion:

```tsx
expect(viewport?.className).toContain('overflow-x-auto')
expect(viewport?.className).toContain('no-scrollbar')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: the test `keeps the tab frame fixed while its tabs scroll inside it` fails because the viewport does not yet contain `no-scrollbar`.

- [ ] **Step 3: Apply the existing scrollbar utility**

Change the nested viewport class in `DepartmentProfilesClient.tsx` to:

```tsx
className = 'no-scrollbar min-w-0 overflow-x-auto overscroll-x-contain'
```

Do not move `overflow-x-auto` to the outer frame and do not change the semantic tablist.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: all Department Profiles tests pass.

### Task 2: Verify frontend and repository contracts

**Files:**

- Inspect: `.agents/skills/project-context/references/change-impact-map.md`
- Update if generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: the completed local viewport behavior from Task 1.
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
pnpm exec prettier --check src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx tests/int/department-profiles.int.spec.tsx docs/superpowers/specs/2026-08-28-department-profiles-hidden-tab-scrollbar-design.md docs/superpowers/plans/2026-08-28-department-profiles-hidden-tab-scrollbar.md
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

Expected: no whitespace errors; only the intended local viewport/test delta plus any deterministic context hash update. Do not stage or commit.
