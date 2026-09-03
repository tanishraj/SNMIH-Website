# Department Profiles Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable, searchable Department Profiles block with a block-local department directory, a dynamic single-department profile picker, accessible department tabs, and client-side Load More pagination.

**Architecture:** A Payload server block owns authoring, validation, normalization, shared section presentation, and media resolution. A public client component receives only serializable normalized departments/profiles and owns search, tab, and visible-count state; a separate Admin-only client field converts the block-local department array into select options without entering the public bundle.

**Tech Stack:** Payload CMS 3.85.2, React 19, Next.js 16, TypeScript, Tailwind CSS v4, Testing Library, Vitest

## Global Constraints

- Departments are configured once in an ordered block-local array.
- Each profile selects exactly one configured department by stable department row ID.
- Search covers name, designation, and department across the complete normalized list before pagination.
- Search and department tabs are independently configurable.
- All is the automatic initial tab; configured empty departments are omitted publicly.
- Profiles per load supports 12, 16, 20, and 24, defaulting to 20.
- Cards display only image, department, name, and optional designation and remain non-clickable.
- Cards use a fixed `4:5` image, fixed Bottom-to-Top/Full overlay geometry, and configurable safe overlay tone/strength.
- Preserve unrelated user changes in the dirty worktree.
- Do not stage or commit changes.

---

### Task 1: Define and Test the Payload Schema

**Files:**

- Create: `src/blocks/DepartmentProfiles/config.ts`
- Create: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Produces `DepartmentProfilesBlock` with slug `departmentProfiles` and interface `DepartmentProfilesBlock`.
- Produces the fields `departments`, `profiles`, `showSearch`, `searchPlaceholder`, `showDepartmentTabs`, `allTabLabel`, `tabVariant`, `profilesPerLoad`, `loadMoreLabel`, and `noResultsMessage`.
- Reuses shared appearance, section action, footer action, media overlay tone/strength, header layout, columns, and spacing contracts.

- [ ] **Step 1: Write failing schema tests**

Create schema assertions equivalent to:

```tsx
expect(DepartmentProfilesBlock).toMatchObject({
  interfaceName: 'DepartmentProfilesBlock',
  slug: 'departmentProfiles',
})
expect(findField(contentFields, 'departments')).toMatchObject({
  minRows: 1,
  required: true,
  type: 'array',
})
expect(findField(contentFields, 'departmentId')).toMatchObject({
  required: true,
  type: 'text',
})
expect(findField(themeFields, 'profilesPerLoad')?.options?.map(({ value }) => value)).toEqual([
  '12',
  '16',
  '20',
  '24',
])
```

Also assert independent conditions for `searchPlaceholder`, `allTabLabel`, and `tabVariant`, the 2/3/4 column choices, Overlay Tone/Strength defaults, and the absence of link fields.

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: module-not-found failure for the new block.

- [ ] **Step 3: Implement the schema**

Create a two-tab Payload block. Content contains the optional shared section header fields, department array, profile array, and footer actions. Theme Settings contains shared appearance plus directory/display controls.

The profile department field stores an ID string and registers the custom Admin field:

```ts
{
  name: 'departmentId',
  label: 'Department',
  type: 'text',
  required: true,
  admin: {
    components: {
      Field: '/blocks/DepartmentProfiles/DepartmentSelectField#DepartmentSelectField',
    },
  },
}
```

Use Payload array validation to reject blank/case-insensitive duplicate department names and block-level validation helpers to reject profile IDs not found in `departments`.

- [ ] **Step 4: Run the focused schema tests**

Run the Task 1 command. Expected: schema/default/condition assertions pass.

---

### Task 2: Add the Dynamic Admin Department Picker

**Files:**

- Create: `src/blocks/DepartmentProfiles/DepartmentSelectField.tsx`
- Create: `src/blocks/DepartmentProfiles/departmentOptions.ts`
- Modify: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- The Admin component consumes Payload `TextFieldClientComponent`, `SelectInput`, `useField`, and `useFormFields`.
- The framework-independent helper produces `getDepartmentOptionsFromFormFields(fields, path)` for deterministic unit testing; `DepartmentSelectField` consumes it for Admin rendering.

- [ ] **Step 1: Add failing option-derivation tests**

Cover a nested path such as `layout.2.profiles.0.departmentId`, department reordering, trimmed labels, blank rows, and an invalid current value retained as an `Unavailable department` option.

- [ ] **Step 2: Run focused tests and verify failure**

Run the Task 1 command. Expected: failure because the Admin helper/component is missing.

- [ ] **Step 3: Implement the client field**

Derive the block prefix by removing `.profiles.<row>.departmentId`, inspect `<prefix>.departments`, and read each row ID/name from Payload form fields. Render `SelectInput` with one selected string value, a clear empty placeholder, standard label/description/error slots, and `setValue` wiring.

Do not import this Admin module from the public component.

- [ ] **Step 4: Re-run focused tests**

Expected: dynamic picker derivation and schema import-path tests pass.

---

### Task 3: Implement Server Normalization and Shared Section Presentation

**Files:**

- Create: `src/blocks/DepartmentProfiles/types.ts`
- Create: `src/blocks/DepartmentProfiles/Component.tsx`
- Modify: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Produces `ResolvedDepartmentProfile`, `ResolvedProfileDepartment`, `DepartmentProfilesColumns`, and `DepartmentProfilesImagePosition`.
- Produces `DepartmentProfilesBlockComponent` and passes normalized values to `DepartmentProfilesClient`.

- [ ] **Step 1: Add failing server render tests**

Assert trimmed content, stable department order, duplicate/blank removal, invalid profile omission, media fallback alt, optional section title behavior, semantic heading levels, shared header layouts, actions, appearance, spacing, and no card links/buttons.

- [ ] **Step 2: Run tests and verify render failures**

Run the focused test file. Expected: failures for the absent server component.

- [ ] **Step 3: Implement normalized types and server component**

Normalize departments into an ordered ID-to-label map. Normalize profiles with `getMediaImageProps`, resolving exactly one valid department per profile. Resolve block appearance, actions, heading levels, 2/3/4 columns, configured batch size, tab variant, and shared overlay tone/strength. Omit the block when no valid profiles remain.

Render the established split/stacked section header and pass only normalized serializable values to the client component.

- [ ] **Step 4: Re-run focused tests**

Expected: server normalization and shared section contracts pass; client interaction tests remain pending.

---

### Task 4: Implement Search, Tabs, Cards, and Load More

**Files:**

- Create: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Modify: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Consumes normalized departments/profiles, `getContentTabClasses`, `getContentTabRailClasses`, `resolveMediaOverlay`, shared Button/Input components, and configured directory labels.
- Produces accessible search/filter/pagination behavior and the responsive overlay card grid.

- [ ] **Step 1: Add failing client interaction tests**

Using Testing Library, assert:

```tsx
fireEvent.change(screen.getByRole('searchbox', { name: 'Search profiles' }), {
  target: { value: 'professor' },
})
expect(screen.getByText('Professor & HOD')).toBeInTheDocument()
expect(screen.queryByText('Dean')).not.toBeInTheDocument()

fireEvent.click(screen.getByRole('tab', { name: 'Anatomy' }))
expect(screen.getByRole('tabpanel')).toHaveTextContent('Dr. Anjali Verma')

fireEvent.click(screen.getByRole('button', { name: 'Load More' }))
expect(screen.getAllByTestId('department-profile-card')).toHaveLength(24)
```

Cover search beyond the initial batch, search-plus-tab AND behavior, independent search/tab visibility, configurable labels, empty results, All default, empty-department omission, Arrow/Home/End navigation, result-count status, Load More completion, and visible-count reset.

- [ ] **Step 2: Run focused tests and verify failure**

Expected: failures for missing interactive behavior.

- [ ] **Step 3: Implement the public client component**

Use state for `query`, `activeDepartmentId`, and `visibleCount`. Derive filtered profiles in this order: complete list, active department, normalized query across department/name/designation, visible slice. Reset visible count directly in search/tab event handlers; do not mirror derived values through effects.

Render the search input only when enabled, accessible content tabs only when enabled and at least one populated department exists, a polite result status, one/two/configured responsive grid, and Load More only when results remain.

Cards use Next Image, `aspect-4/5`, surface-aware full Bottom-to-Top overlay classes, a mono department eyebrow, sans profile heading, and optional secondary designation.

- [ ] **Step 4: Re-run focused tests**

Expected: all Department Profiles schema, render, and interaction tests pass.

---

### Task 5: Register the Block and Add Thumbnail Coverage

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Create through generator: `public/block-thumbnails/department-profiles.jpg`
- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify as required by shared contracts: `tests/int/page-blocks.int.spec.ts`, `tests/int/live-preview-renderer.int.spec.tsx`, `tests/int/block-thumbnails.int.spec.ts`, `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**

- Makes `departmentProfiles` available through every Page-compatible schema and both renderers.
- Adds the production component fixture and thumbnail metadata.

- [ ] **Step 1: Add failing registration and thumbnail assertions**

Assert both collection registries contain the slug, both renderer sources contain the case and component, the definition resolves to `/block-thumbnails/department-profiles.jpg`, and the fixture produces card/toolbar markup.

- [ ] **Step 2: Run focused/shared tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/department-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

- [ ] **Step 3: Add registrations, renderer cases, definition, and fixture**

Place the block adjacent to `leadershipProfiles` in each ordered registry. Keep production/live-preview cases identical and use the new production component in the thumbnail fixture.

- [ ] **Step 4: Run generators**

```bash
pnpm generate:types
pnpm generate:importmap
pnpm generate:block-thumbnails
```

Expected: Payload types include `DepartmentProfilesBlock`, the Admin import map includes `DepartmentSelectField`, and the 1600x900 JPEG exists.

- [ ] **Step 5: Re-run focused/shared tests**

Expected: registration, preview, fixture, and thumbnail tests pass.

---

### Task 6: Update Contracts, Documentation, and Final Verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Generated update: `.agents/skills/project-context/references/project-inventory.json`
- Modify tests only when generated counts/contracts require explicit updates.

**Interfaces:**

- Documents the authoring, filtering, pagination, overlay, and validation contract.
- Keeps project knowledge aligned with the new structural block registration.

- [ ] **Step 1: Document the completed block contract**

Add concise operator guidance for departments, profile assignment, search/tabs toggles, batch size, tab variants, fixed overlay geometry, and non-clickable cards. Update the feature inventory and maintained block-system reference.

- [ ] **Step 2: Run project-context update**

```bash
pnpm project-context:update
```

- [ ] **Step 3: Inspect the final diff against the change-impact map**

Run:

```bash
git diff --check
git status --short
```

Confirm only intended new-block, generated, test, thumbnail, and documentation files changed in addition to pre-existing user work.

- [ ] **Step 4: Run final verification**

```bash
pnpm exec vitest run tests/int/department-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-appearance-contract.int.spec.ts tests/int/regular-block-spacing.int.spec.tsx tests/int/theme-contracts.int.spec.ts
pnpm exec eslint src/blocks/DepartmentProfiles tests/int/department-profiles.int.spec.tsx
pnpm exec tsc --noEmit
pnpm project-context:check
```

Expected: all focused/shared contracts, lint, TypeScript, and project-context checks pass. Any unrelated pre-existing failure is reported separately with evidence.

- [ ] **Step 5: Run the Impeccable detector**

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DepartmentProfiles
```

Expected: no actionable findings.

- [ ] **Step 6: Handoff without committing**

Report created/modified files, behavior delivered, verification results, project-context files changed, and any residual browser-only visual checks. Do not stage or commit.
