# Department Profiles Filter Presentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let editors render the Department Profiles department filter as either the existing tabs or a shadcn Select dropdown at every breakpoint.

**Architecture:** Add one backward-compatible Payload select field that defaults to Tabs and normalize it at the server component boundary. The client reuses its existing ordered populated-department options and `selectDepartment` state transition, branching only the filter control presentation; Tabs keep their current keyboard contract and Dropdown uses the shared shadcn Select primitive.

**Tech Stack:** Payload CMS 3, React 19, TypeScript, shadcn/Radix Select, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Preserve stored `showDepartmentTabs`, `allTabLabel`, `tabVariant`, and `tabWidth` field names.
- Add `departmentFilterPresentation` with exact values `tabs` and `dropdown`; default and invalid fallback are `tabs`.
- The presentation choice applies at every breakpoint.
- Dropdown options are All plus populated departments in configured order.
- Selecting either control follows the same state path and resets visible profiles to `profilesPerLoad`.
- Search remains independently optional and combines with the active department.
- Tab settings remain saved but are hidden in Admin when Dropdown is selected.
- Use shared shadcn Select and semantic theme tokens; do not hardcode colors.
- Do not add a migration, compatibility renderer, dependency, or custom Admin component.
- Do not stage or commit changes.
- Complete the required project-context update/check loop.

---

## File Map

- Modify `src/blocks/DepartmentProfiles/config.ts`: add the presentation field, relabel compatible fields, and refine Admin conditions.
- Modify `src/blocks/DepartmentProfiles/types.ts`: define `DepartmentProfilesFilterPresentation`.
- Modify `src/blocks/DepartmentProfiles/Component.tsx`: normalize the new field and pass it to the client.
- Modify `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`: render Tabs or shadcn Select from the same options and state transition.
- Modify `tests/int/department-profiles.int.spec.tsx`: lock schema, fallback, rendering, accessibility, filtering, and compatibility contracts.
- Regenerate `src/payload-types.ts` with `pnpm generate:types`.
- Modify `.agents/skills/project-context/references/block-system.md`: document the selectable filter presentation.
- Refresh `.agents/skills/project-context/references/project-inventory.json` through the required updater.

---

### Task 1: Add the backward-compatible Payload presentation setting

**Files:**

- Modify: `src/blocks/DepartmentProfiles/config.ts`
- Modify: `src/blocks/DepartmentProfiles/types.ts`
- Test: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Produces `DepartmentProfilesFilterPresentation = 'dropdown' | 'tabs'`.
- Produces stored `departmentFilterPresentation: 'tabs' | 'dropdown'`, defaulting to `tabs`.
- Keeps `showDepartmentTabs` and `allTabLabel` storage unchanged.

- [ ] **Step 1: Add failing schema and condition assertions**

Extend the block schema test with:

```ts
expect(findField(themeFields, 'showDepartmentTabs')).toMatchObject({
  defaultValue: true,
  label: 'Show Department Filter',
})
expect(findField(themeFields, 'allTabLabel')?.label).toBe('All Departments Label')
expect(findField(themeFields, 'departmentFilterPresentation')).toMatchObject({
  defaultValue: 'tabs',
  required: true,
  type: 'select',
})
expect(
  findField(themeFields, 'departmentFilterPresentation')?.options?.map(({ value }) => value),
).toEqual(['tabs', 'dropdown'])
```

Assert the presentation and label fields show when `showDepartmentTabs` is true, and assert `tabVariant` and `tabWidth` show only when `showDepartmentTabs` is true and `departmentFilterPresentation` is not `dropdown`.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because the new field and labels do not exist and the tab field conditions ignore presentation.

- [ ] **Step 3: Add the field type and conditional helpers**

In `src/blocks/DepartmentProfiles/types.ts`, add:

```ts
export type DepartmentProfilesFilterPresentation = 'dropdown' | 'tabs'
```

Extend `DirectoryControlSiblingData` in `config.ts`:

```ts
type DirectoryControlSiblingData = {
  departmentFilterPresentation?: 'dropdown' | 'tabs' | null
  showDepartmentTabs?: boolean | null
  showSearch?: boolean | null
}
```

Use two conditions:

```ts
const showsDepartmentFilter = (_data: unknown, siblingData: DirectoryControlSiblingData) =>
  siblingData?.showDepartmentTabs !== false

const usesDepartmentTabs = (_data: unknown, siblingData: DirectoryControlSiblingData) =>
  siblingData?.showDepartmentTabs !== false &&
  siblingData?.departmentFilterPresentation !== 'dropdown'
```

- [ ] **Step 4: Add the presentation field and relabel compatible fields**

Keep the checkbox name but set `label: 'Show Department Filter'`. Insert after it:

```ts
{
  name: 'departmentFilterPresentation',
  label: 'Department Filter Presentation',
  type: 'select',
  defaultValue: 'tabs',
  required: true,
  options: [
    { label: 'Tabs', value: 'tabs' },
    { label: 'Dropdown', value: 'dropdown' },
  ],
  admin: { condition: showsDepartmentFilter },
} satisfies SelectField
```

Relabel `allTabLabel` to `All Departments Label` and use `showsDepartmentFilter`. Use `usesDepartmentTabs` for both `tabVariant` and `tabWidth`.

- [ ] **Step 5: Run the schema test**

Run the focused suite command from Step 2. Expected: schema assertions pass; runtime tests remain unchanged. Do not stage or commit.

---

### Task 2: Normalize and render the dropdown through the shared state path

**Files:**

- Modify: `src/blocks/DepartmentProfiles/Component.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Test: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- `DepartmentProfilesBlockLike.departmentFilterPresentation?: DepartmentProfilesFilterPresentation | null`.
- `DepartmentProfilesClientProps.departmentFilterPresentation: DepartmentProfilesFilterPresentation`.
- The client consumes existing `{ id, name }[]` filter options and `selectDepartment(id: string): void`.

- [ ] **Step 1: Add failing normalization and dropdown-rendering tests**

Add a server-render helper passing `departmentFilterPresentation` to `DepartmentProfilesBlockComponent`. Assert missing and invalid values render a tablist; `dropdown` renders `data-department-profiles-filter-presentation="dropdown"`, a Select trigger labelled `Filter profiles by department`, and no tablist.

Add a client test that renders Dropdown with Search and featured profiles, opens the trigger, selects Anatomy, and asserts:

```ts
expect(screen.getByRole('combobox', { name: 'Filter profiles by department' })).toBeTruthy()
expect(screen.queryByRole('tablist')).toBeNull()
expect(screen.queryByText('Medicine Featured')).toBeNull()
expect(screen.getAllByText('Anatomy Featured').length).toBeGreaterThan(0)
```

Verify All, General Medicine, and Anatomy options appear in configured order and Radiology is omitted because it has no profiles. Verify Search still narrows results after selection. Add enough profiles to expose Load More, click it, then change the department and assert the visible count returns to the configured batch.

- [ ] **Step 2: Run the focused suite and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because the server component ignores the presentation and the client has no dropdown branch.

- [ ] **Step 3: Normalize presentation at the server boundary**

Import `DepartmentProfilesFilterPresentation`, add it to `DepartmentProfilesBlockLike`, destructure it with `tabs` default, and define:

```ts
const validDepartmentFilterPresentations = new Set<DepartmentProfilesFilterPresentation>([
  'dropdown',
  'tabs',
])

const resolvedDepartmentFilterPresentation = validDepartmentFilterPresentations.has(
  departmentFilterPresentation ?? 'tabs',
)
  ? (departmentFilterPresentation ?? 'tabs')
  : 'tabs'
```

Pass `departmentFilterPresentation={resolvedDepartmentFilterPresentation}` to `DepartmentProfilesClient`.

- [ ] **Step 4: Add the shadcn Select branch**

Import `Select`, `SelectContent`, `SelectGroup`, `SelectItem`, `SelectTrigger`, and `SelectValue` from `@/components/ui/select`. Rename the local `tabs` array to `departmentOptions`, retain the populated-department condition, and derive Tabs keyboard navigation from the same array.

When `departmentFilterPresentation === 'dropdown'`, render:

```tsx
<Select onValueChange={selectDepartment} value={activeId}>
  <SelectTrigger
    aria-label="Filter profiles by department"
    className="data-[size=default]:h-11 w-full rounded-md border-border bg-background text-foreground shadow-none lg:w-72"
    data-department-profiles-filter-presentation="dropdown"
  >
    <SelectValue placeholder={allTabLabel} />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      {departmentOptions.map((option) => (
        <SelectItem key={option.id} value={option.id}>
          {option.name}
        </SelectItem>
      ))}
    </SelectGroup>
  </SelectContent>
</Select>
```

When the presentation is Tabs, retain the existing tab rail unchanged and add `data-department-profiles-filter-presentation="tabs"` to its outer presentation wrapper. Keep `selectDepartment` as the only state update path for both controls.

- [ ] **Step 5: Run focused behavior tests**

Run the focused suite command from Step 2. Expected: Dropdown, legacy Tabs, search, featured filtering, tab keyboard navigation, width modes, and Load More tests pass. Do not stage or commit.

---

### Task 3: Regenerate contracts, document behavior, and verify

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Refresh: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Generated `DepartmentProfilesBlock` includes `departmentFilterPresentation: 'tabs' | 'dropdown'`.
- Maintained block documentation describes both presentations and the legacy default.

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `departmentFilterPresentation: 'tabs' | 'dropdown'` for Department Profiles.

- [ ] **Step 2: Extend the generated-type contract test**

Add:

```ts
expect(generatedDepartmentProfiles).toContain("departmentFilterPresentation: 'tabs' | 'dropdown'")
```

Run the focused Department Profiles suite and expect it to pass.

- [ ] **Step 3: Update maintained block documentation**

Update the Department Profiles paragraph in `block-system.md` to state that the optional department filter can render as Tabs or Dropdown, missing legacy values use Tabs, both derive ordered populated departments, and the Dropdown reuses the same filtering state without changing Search, Featured Profiles, or Load More behavior.

- [ ] **Step 4: Run final verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DepartmentProfiles/config.ts src/blocks/DepartmentProfiles/types.ts src/blocks/DepartmentProfiles/Component.tsx src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx tests/int/department-profiles.int.spec.tsx
pnpm exec prettier --check src/blocks/DepartmentProfiles/config.ts src/blocks/DepartmentProfiles/types.ts src/blocks/DepartmentProfiles/Component.tsx src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx tests/int/department-profiles.int.spec.tsx src/payload-types.ts .agents/skills/project-context/references/block-system.md
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx
git diff --check
pnpm project-context:update
pnpm project-context:check
```

Expected: focused tests, TypeScript, ESLint, Prettier, layout detection, diff validation, generated types, and project-context validation pass. A stale optional knowledge-graph warning is non-blocking. Do not stage or commit.
