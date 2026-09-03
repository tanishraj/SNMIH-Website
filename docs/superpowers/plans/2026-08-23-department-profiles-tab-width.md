# Department Profiles Tab Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Content Width, Centered Auto Width, and Equal Full Width options to the Department Profiles tab rail using the existing Fee Structure behavior.

**Architecture:** Store one required `tabWidth` value on the block, normalize it in the server component, and pass the normalized serializable union to the existing client directory. The client applies the established Fee Structure rail-width classes and changes trigger sizing only for Equal Full Width, leaving search, filtering, tab semantics, and card rendering untouched.

**Tech Stack:** Payload CMS 3.85, Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, Testing Library.

## Global Constraints

- Department Profiles is the only runtime block changed.
- Reuse the exact `content`, `centered`, and `equal` values and editor labels from Fee Structure.
- Content Width is the saved default and runtime fallback for missing or invalid values.
- Equal Full Width fills only the available tab rail beside Search on desktop.
- Existing tab variants, keyboard navigation, filtering, search, result announcements, and Load More behavior remain unchanged.
- Add no dependency and perform no content migration.
- Preserve unrelated working-tree and staged changes; do not stage or commit any file.

---

## File Map

- `src/blocks/DepartmentProfiles/config.ts` — adds the conditional Payload select.
- `src/blocks/DepartmentProfiles/types.ts` — owns the shared tab-width union.
- `src/blocks/DepartmentProfiles/Component.tsx` — normalizes saved values and passes the result to the client.
- `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx` — applies rail and equal-trigger sizing.
- `tests/int/department-profiles.int.spec.tsx` — locks schema, fallback, width classes, accessibility, and generated types.
- `src/payload-types.ts` — regenerated Payload interface.
- `docs/guides/blocks.md` — editor-facing width guidance.
- `docs/architecture/feature-inventory.md` — maintained runtime summary.
- `.agents/skills/project-context/references/block-system.md` — project-context block contract.

---

### Task 1: Add and render the shared tab-width contract

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `src/blocks/DepartmentProfiles/config.ts`
- Modify: `src/blocks/DepartmentProfiles/types.ts`
- Modify: `src/blocks/DepartmentProfiles/Component.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Generate: `src/payload-types.ts`

**Interfaces:**

- Produces: `DepartmentProfilesTabWidth = 'centered' | 'content' | 'equal'`.
- Produces: required Payload field `tabWidth` with default `content`.
- Extends: `DepartmentProfilesClientProps.tabWidth: DepartmentProfilesTabWidth`.
- Guarantees: server-side normalization returns `content` for absent or invalid saved values.

- [ ] **Step 1: Add failing schema and generated-type assertions**

In `tests/int/department-profiles.int.spec.tsx`, add this assertion inside `defines the approved schema and independent directory controls` after the `tabVariant` assertion:

```tsx
const tabWidth = findField(themeFields, 'tabWidth')
expect(tabWidth).toMatchObject({
  defaultValue: 'content',
  required: true,
  type: 'select',
  options: [
    { label: 'Content Width', value: 'content' },
    { label: 'Centered Auto Width', value: 'centered' },
    { label: 'Equal Full Width', value: 'equal' },
  ],
})
expect(tabWidth?.admin?.condition?.({}, { showDepartmentTabs: true })).toBe(true)
expect(tabWidth?.admin?.condition?.({}, { showDepartmentTabs: false })).toBe(false)
```

Inside `registers production, preview, thumbnail, and generated type contracts`, add:

```tsx
expect(generatedDepartmentProfiles).toContain("tabWidth: 'content' | 'centered' | 'equal'")
```

- [ ] **Step 2: Add failing runtime width and fallback tests**

Add `tabWidth: 'content' as const` to `baseClientProps`, then add:

```tsx
it.each([
  ['content', ['w-max', 'min-w-full']],
  ['centered', ['mx-auto', 'w-max']],
  ['equal', ['w-full', 'min-w-0']],
] as const)('applies the %s department-tab width', (tabWidth, expectedClasses) => {
  render(<DepartmentProfilesClient {...baseClientProps} tabWidth={tabWidth} />)

  const tablist = screen.getByRole('tablist', { name: 'Profile departments' })
  expect(tablist.getAttribute('data-department-profiles-tab-width')).toBe(tabWidth)
  for (const className of expectedClasses) expect(tablist.className).toContain(className)

  for (const tab of screen.getAllByRole('tab')) {
    if (tabWidth === 'equal') {
      expect(tab.className).toContain('w-0')
      expect(tab.className).toContain('flex-1')
      expect(tab.className).toContain('text-ellipsis')
    } else {
      expect(tab.className).not.toContain('w-0')
    }
  }
})

it('normalizes missing and invalid tab widths to Content Width', () => {
  const renderBlock = (tabWidth?: string | null) =>
    renderToStaticMarkup(
      <DepartmentProfilesBlockComponent
        departments={departments}
        profiles={[{ departmentId: 'medicine', name: 'Doctor One' }]}
        tabWidth={tabWidth as never}
      />,
    )

  for (const html of [renderBlock(), renderBlock('invalid')]) {
    expect(html).toContain('data-department-profiles-tab-width="content"')
    expect(html).toContain('w-max min-w-full')
  }
})
```

Keep the existing search/filter and accessible-keyboard tests unchanged; they remain regression coverage for the toolbar behavior.

- [ ] **Step 3: Run the focused suite and verify the new tests fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because `tabWidth` is absent from the schema, component contract, client rail, and generated types.

- [ ] **Step 4: Add the shared type and Payload field**

In `src/blocks/DepartmentProfiles/types.ts`, add:

```ts
export type DepartmentProfilesTabWidth = 'centered' | 'content' | 'equal'
```

In `src/blocks/DepartmentProfiles/config.ts`, add this field immediately after `tabVariant`:

```ts
{
  name: 'tabWidth',
  label: 'Department Tab Width',
  type: 'select',
  defaultValue: 'content',
  required: true,
  options: [
    { label: 'Content Width', value: 'content' },
    { label: 'Centered Auto Width', value: 'centered' },
    { label: 'Equal Full Width', value: 'equal' },
  ],
  admin: {
    condition: showsDepartmentTabs,
    description:
      'Centered Auto Width keeps intrinsic tabs centered when they fit and scrollable when they overflow. Equal Full Width divides the complete available tab rail evenly.',
  },
} satisfies SelectField,
```

- [ ] **Step 5: Normalize the value in the server component**

In `src/blocks/DepartmentProfiles/Component.tsx`, import `DepartmentProfilesTabWidth`. Add this property inside `DepartmentProfilesBlockLike`:

```ts
tabWidth?: DepartmentProfilesTabWidth | null
```

Add this valid-value set beside `validTabVariants`:

```ts
const validTabWidths = new Set<DepartmentProfilesTabWidth>(['content', 'centered', 'equal'])
```

Destructure `tabWidth = 'content'`, then normalize next to `resolvedTabVariant`:

```ts
const resolvedTabWidth = validTabWidths.has(tabWidth ?? 'content')
  ? (tabWidth ?? 'content')
  : 'content'
```

Add the normalized prop to the existing `DepartmentProfilesClient` invocation:

```tsx
tabWidth = { resolvedTabWidth }
```

- [ ] **Step 6: Apply the width classes in the client**

In `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`, import `DepartmentProfilesTabWidth`, add `tabWidth` to `DepartmentProfilesClientProps`, and add this module-level map:

```ts
const tabRailWidthClasses = {
  centered: 'mx-auto w-max',
  content: 'w-max min-w-full',
  equal: 'w-full min-w-0',
} as const satisfies Record<DepartmentProfilesTabWidth, string>
```

Destructure `tabWidth`, then change the tab list to:

```tsx
<div
  aria-label="Profile departments"
  className={cn(
    'flex flex-nowrap',
    tabRailWidthClasses[tabWidth],
    getContentTabRailClasses(tabVariant),
  )}
  data-department-profiles-tab-width={tabWidth}
  role="tablist"
>
```

Change each trigger class to:

```tsx
className={cn(
  getContentTabClasses(tabVariant, active),
  tabWidth === 'equal' &&
    'w-0 min-w-0 flex-1 shrink overflow-hidden px-2 text-ellipsis',
)}
```

The existing `min-w-0 flex-1 overflow-x-auto pb-1` wrapper remains unchanged so Centered Auto Width returns to the inline start on overflow and Equal Full Width fills only the Search-adjacent rail.

- [ ] **Step 7: Generate Payload types and run the focused contract**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write src/blocks/DepartmentProfiles/config.ts src/blocks/DepartmentProfiles/types.ts src/blocks/DepartmentProfiles/Component.tsx src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx tests/int/department-profiles.int.spec.tsx src/payload-types.ts
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: Department Profiles tests PASS and TypeScript exits with code 0.

---

### Task 2: Update maintained guidance and complete verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Verify: every file changed in Task 1

**Interfaces:**

- Consumes: final `tabWidth` labels and runtime behavior.
- Produces: accurate editor and architecture documentation.

- [ ] **Step 1: Update the operator guide**

In the Department Profiles catalog row and its directory guidance, add this exact behavior:

```md
Department tabs support **Content Width**, **Centered Auto Width**, and **Equal Full Width**. Centered Auto Width shrink-wraps and centers the rail when it fits, then remains horizontally scrollable from the inline start when it overflows. Equal Full Width divides the available tab rail evenly; when Search is visible, that means the remaining toolbar space beside Search.
```

- [ ] **Step 2: Update maintained architecture references**

In both `docs/architecture/feature-inventory.md` and `.agents/skills/project-context/references/block-system.md`, add this concrete contract to the Department Profiles narrative:

```md
The department tab rail supports Content Width, Centered Auto Width, and Equal Full Width. Missing or invalid values use Content Width. Centered Auto Width keeps intrinsic tabs centered when they fit and scrollable from the inline start when they overflow; Equal Full Width divides the available Search-adjacent rail evenly, or the full toolbar width when Search is hidden.
```

- [ ] **Step 3: Run final focused and static verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx tests/int/fee-structure.int.spec.tsx tests/int/tabs-content-active-color.int.spec.ts tests/int/card-block-theme-contract.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DepartmentProfiles tests/int/department-profiles.int.spec.tsx
pnpm exec prettier --check src/blocks/DepartmentProfiles tests/int/department-profiles.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-23-department-profiles-tab-width-design.md docs/superpowers/plans/2026-08-23-department-profiles-tab-width.md
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DepartmentProfiles/Component.tsx src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx
git diff --check
git diff --cached --check
```

Expected: focused and neighboring tests, TypeScript, ESLint, Prettier, and diff checks pass; the detector returns `[]`.

- [ ] **Step 4: Complete the project-context handoff without changing the existing index**

Inspect the final diff against `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
pnpm project-context:check
git status --short
```

Expected: report the previously known stale project inventory and knowledge graph if the context check remains non-zero. Do not retry the previously denied `pnpm project-context:update` without new explicit permission. Do not stage, unstage, or commit any file.
