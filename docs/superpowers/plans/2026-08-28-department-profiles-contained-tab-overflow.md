# Department Profiles Contained Tab Overflow Implementation Plan

> **For Codex:** Use the executing-plans skill to implement this plan task by task. Do not commit or stage changes.

**Goal:** Keep the Department Profiles tab frame fixed and fully rounded while overflowing tabs scroll horizontally inside it.

**Architecture:** Make a local, presentation-only DOM-layer change in `DepartmentProfilesClient`: a stationary frame owns the existing semantic tab-rail styling, while a nested viewport owns horizontal overflow and contains the semantic tablist. Reuse the existing shared tab class helpers and preserve all state, keyboard, width, theme, and filtering behavior.

**Tech Stack:** React 19, Next.js 16, Tailwind CSS v4, Vitest, Testing Library.

---

## Task 1: Define the fixed-frame overflow contract with a failing test

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`

1. Add a focused test that renders the Tabs presentation and locates three distinct elements:
   - the stationary frame,
   - the nested horizontal scroll viewport,
   - the semantic `tablist`.
2. Assert that the frame has clipping and the existing Pill frame classes (`rounded-full`, border/background styling), but does not own `overflow-x-auto`.
3. Assert that the nested viewport owns `overflow-x-auto` and sits inside the frame.
4. Assert that the `tablist` remains inside the viewport and retains `data-department-profiles-tab-width`.
5. Run the focused test and confirm it fails because the new frame/viewport markers and nesting do not yet exist:

   `pnpm vitest run tests/int/department-profiles.int.spec.tsx`

## Task 2: Separate the stationary frame from the scroll viewport

**Files:**

- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Test: `tests/int/department-profiles.int.spec.tsx`

1. Replace the current single overflow wrapper with a stationary outer frame that:
   - remains `min-w-0 flex-1`,
   - owns `getContentTabRailClasses(tabVariant, tabSurface)`,
   - clips its contents so the left and right frame edges remain visible,
   - exposes a stable test/data marker.
2. Add a nested viewport that owns `overflow-x-auto` and a stable test/data marker.
3. Keep `role="tablist"`, its accessible label, the tab-width marker, and `tabRailWidthClasses` on the innermost tablist.
4. Remove shared rail/frame classes from the moving tablist so the border, background, and radius do not scroll away.
5. Preserve the current tab buttons, keyboard handlers, refs, active state, equal-width behavior, and filter state without modification.
6. Run the focused Department Profiles integration suite and confirm it passes:

   `pnpm vitest run tests/int/department-profiles.int.spec.tsx`

## Task 3: Verify regressions and repository contracts

**Files:**

- Inspect: `.agents/skills/project-context/references/change-impact-map.md`
- Update if generated: `.agents/skills/project-context/references/project-inventory.json`

1. Run the affected and shared tab contract tests:

   `pnpm vitest run tests/int/department-profiles.int.spec.tsx tests/int/theme-contracts.int.spec.ts tests/int/tabs-content-active-color.int.spec.ts`

2. Run TypeScript, lint, and formatting checks using the repository scripts.
3. Run the repository UI/layout detector used by existing frontend work.
4. Run `pnpm project-context:update`.
5. Inspect the final diff against `change-impact-map.md`; do not alter narrative architecture references unless the local presentation behavior changes a documented contract.
6. Run `pnpm project-context:check`.
7. Confirm no Payload schema or generated-type update is required because this is a local frontend DOM/layout change.
8. Report the changed files and verification results. Do not stage or commit.
