# PG Fee Atlas Department Scroll Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the PG Fee Structure atlas at its natural height through four departments, then constrain the desktop frame to 676px and scroll only its department chapters from the fifth department onward.

**Architecture:** Derive one presentation-only boolean from the active normalized category's department count inside `PGFeeStructureAtlasPresentation`. Use it to add desktop-only height and overflow classes without changing the Payload schema or normalized data. Keep the statement header outside the scroll region, keep compact layouts in normal document flow, and expose the bounded chapter list as an accessible named region.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4 responsive utilities, Payload CMS 3 block data, Vitest, Testing Library.

## Global Constraints

- Four or fewer departments preserve the current natural-height atlas.
- Five or more departments activate one fixed 676px desktop atlas at `lg` and above.
- The left summary remains independent; the right statement header remains visible; only department chapters scroll on the right.
- If the left summary itself exceeds the available height, its column may scroll independently rather than clip authored content.
- Below `lg`, all content remains in normal document flow without a fixed height or nested scrolling.
- No department, value, note, shared charge, category, or tab behavior may be omitted or reformatted.
- Do not change the Payload schema, normalized data model, generated Payload types, category limits, or saved content.
- Leave the implementation uncommitted unless the user separately authorizes a commit.

---

### Task 1: Add the exact four/five-department presentation contract

**Files:**
- Modify: `tests/int/pg-fee-structure.int.spec.tsx`
- Modify: `src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx`

**Interfaces:**
- Consumes: `ResolvedPGFeeCategory.departments: ResolvedPGFeeDepartment[]` and the existing `PGFeeStructureAtlasPresentation` props.
- Produces: `data-pg-fee-department-scroll="true"` only for active categories with at least five departments, plus desktop-only `lg:h-[676px]` and `lg:overflow-y-auto` contracts.
- Preserves: the existing DOM order of summary, statement header, and department chapters.

- [ ] **Step 1: Add fixtures for the exact threshold**

Add a fixture factory below `nriCategory` in `tests/int/pg-fee-structure.int.spec.tsx` so the test data contains valid category-owned department values:

```tsx
const makeDepartmentCategory = (departmentCount: number, label: string) => ({
  ...generalCategory,
  id: label.toLowerCase().replaceAll(' ', '-'),
  label,
  departments: Array.from({ length: departmentCount }, (_, index) => ({
    id: `${label.toLowerCase()}-${index + 1}`,
    name: `${label} Department ${index + 1}`,
    note: index === departmentCount - 1 ? 'Final department note remains visible.' : undefined,
    variableValues: [{ value: `₹${index + 1},00,000` }],
  })),
})
```

- [ ] **Step 2: Write the failing boundary and category-switching test**

Add this test inside `describe('PGFeeStructureBlockComponent', ...)`:

```tsx
it('bounds exactly five or more departments on desktop and preserves compact natural flow', () => {
  const fourDepartments = makeDepartmentCategory(4, 'Four')
  const fiveDepartments = makeDepartmentCategory(5, 'Five')
  const { container } = render(
    <PGFeeStructureBlockComponent
      academicSession="2026-27"
      feeCategories={[fourDepartments, fiveDepartments]}
      programmeName="Postgraduate Medical Courses"
    />,
  )

  const naturalAtlas = container.querySelector('[data-pg-fee-atlas="true"]')
  expect(naturalAtlas?.className).not.toContain('lg:h-[676px]')
  expect(container.querySelector('[data-pg-fee-department-scroll="true"]')).toBeNull()
  expect(container.querySelectorAll('[data-pg-fee-department-chapter="true"]')).toHaveLength(4)

  fireEvent.mouseDown(screen.getByRole('tab', { name: 'Five' }), {
    button: 0,
    ctrlKey: false,
  })

  const boundedAtlas = container.querySelector('[data-pg-fee-atlas="true"]')
  const summary = container.querySelector('[data-pg-fee-atlas-summary="true"]')
  const statement = container.querySelector('[data-pg-fee-atlas-statement="true"]')
  const scroller = container.querySelector('[data-pg-fee-department-scroll="true"]')

  expect(boundedAtlas?.className).toContain('lg:h-[676px]')
  expect(summary?.className).toContain('lg:overflow-y-auto')
  expect(statement?.className).toContain('lg:flex-col')
  expect(statement?.firstElementChild?.tagName).toBe('HEADER')
  expect(statement?.children[1]).toBe(scroller)
  expect(scroller?.className).toContain('lg:flex-1')
  expect(scroller?.className).toContain('lg:overflow-y-auto')
  expect(scroller?.className).toContain('lg:overscroll-contain')
  expect(scroller?.className.split(' ')).not.toContain('h-[676px]')
  expect(scroller?.className.split(' ')).not.toContain('overflow-y-auto')
  expect(scroller?.getAttribute('role')).toBe('region')
  expect(scroller?.getAttribute('aria-label')).toBe('Five department fee statements')
  expect(scroller?.getAttribute('tabindex')).toBe('0')
  expect(container.querySelectorAll('[data-pg-fee-department-chapter="true"]')).toHaveLength(5)
  expect(screen.getByText('Final department note remains visible.')).toBeTruthy()
})
```

- [ ] **Step 3: Run the focused test and confirm the new contract fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: the new test fails because the 676px atlas and `data-pg-fee-department-scroll` contract do not exist yet; the existing PG Fee Structure tests remain green.

- [ ] **Step 4: Derive the bounded state without changing data**

In `PGFeeStructureAtlasPresentation.tsx`, place this immediately after `departmentCount`:

```tsx
const hasBoundedDepartmentList = departmentCount > 4
```

Update the outer atlas classes:

```tsx
className={cn(
  'grid min-w-0 overflow-clip rounded-card border border-border lg:grid-cols-2',
  hasBoundedDepartmentList && 'lg:h-[676px]',
)}
```

- [ ] **Step 5: Keep the summary stationary and protect unusually long authored content**

Update the summary `aside` and its inner container:

```tsx
<aside
  className={cn(
    'min-w-0 bg-primary text-primary-foreground',
    hasBoundedDepartmentList && 'lg:h-full lg:min-h-0 lg:overflow-y-auto',
  )}
  data-pg-fee-atlas-summary="true"
>
  <div
    className={cn(
      'flex min-h-full flex-col gap-8 p-6 sm:p-8',
      hasBoundedDepartmentList
        ? 'lg:h-full lg:min-h-0'
        : 'lg:sticky lg:top-24 lg:min-h-[min(42rem,calc(100vh-8rem))]',
    )}
    data-pg-fee-atlas-summary-inner="true"
  >
```

This keeps the left column independent from the right list and prevents clipping if authored notes or shared charges exceed 676px.

- [ ] **Step 6: Separate the fixed statement header from the scrollable chapters**

Update the statement section classes:

```tsx
<section
  className={cn(
    'min-w-0 bg-card text-card-foreground',
    hasBoundedDepartmentList && 'lg:flex lg:h-full lg:min-h-0 lg:flex-col',
  )}
  data-pg-fee-atlas-statement="true"
>
```

Keep the existing `<header>` as the section's first child and add `shrink-0` to its class list:

```tsx
<header className="shrink-0 border-b border-border p-6 sm:p-8">
```

Replace the chapter-list wrapper with:

```tsx
<div
  aria-label={hasBoundedDepartmentList ? `${category.label} department fee statements` : undefined}
  className={cn(
    'divide-y divide-border',
    hasBoundedDepartmentList &&
      'lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:overscroll-contain lg:[scrollbar-gutter:stable] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/40',
  )}
  data-pg-fee-department-scroll={hasBoundedDepartmentList ? 'true' : undefined}
  role={hasBoundedDepartmentList ? 'region' : undefined}
  tabIndex={hasBoundedDepartmentList ? 0 : undefined}
>
```

Do not move, truncate, or otherwise change the existing department `article` mapping.

- [ ] **Step 7: Run the focused test and confirm every PG contract passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: all PG Fee Structure normalization, schema, presentation, threshold, category-switching, and accessibility tests pass.

---

### Task 2: Document and verify the desktop-only bounded atlas

**Files:**
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate if changed: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the verified five-department threshold and 676px desktop presentation contract from Task 1.
- Produces: maintained editor, architecture, and project-context documentation that matches the runtime behavior.

- [ ] **Step 1: Update the editor-facing block guide**

Extend the PG Fee Structure paragraph in `docs/guides/blocks.md` after the description of self-contained department chapters with this exact behavior:

```markdown
With up to four departments, the atlas keeps its natural height. From the fifth department onward,
large screens use a 676px frame: the Primary summary and statement header remain visible while the
department chapter list scrolls. Compact layouts always keep every chapter in normal page flow.
```

- [ ] **Step 2: Update the maintained architecture inventory**

Extend the PG Fee Structure entry in `docs/architecture/feature-inventory.md` with:

```markdown
Categories with up to four departments retain natural height. At five or more departments, the
desktop atlas is bounded to 676px, leaves the Primary summary and statement header independent, and
scrolls only the complete department-chapter list; compact layouts remain natural-flow.
```

- [ ] **Step 3: Update the project-context block contract**

Add the same threshold and responsive ownership to the PG Fee Structure section of `.agents/skills/project-context/references/block-system.md`:

```markdown
An active category with up to four departments renders at natural height. At five or more,
`lg` layouts use a 676px atlas whose summary and statement header remain independent while only the
department chapter list scrolls; below `lg`, every region returns to normal document flow.
```

- [ ] **Step 4: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: TypeScript exits successfully; ESLint reports no new errors. Existing unrelated warnings, if any, must be identified rather than attributed to this change.

- [ ] **Step 5: Complete the project-context update/check loop**

Run:

```bash
pnpm project-context:update
```

Then inspect `.agents/skills/project-context/references/change-impact-map.md` against the final diff and confirm together:

- the presenter and its focused integration test;
- the block guide and feature inventory;
- the maintained `block-system.md` contract;
- whether `project-inventory.json` changed (a no-op is expected because registrations and file counts do not change).

Finally run:

```bash
pnpm project-context:check
```

Expected: maintained project context passes. A stale optional knowledge graph is reported only as a warning.

- [ ] **Step 6: Run the final focused regression test and inspect the diff**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
git diff --check
git diff -- src/blocks/PGFeeStructure/PGFeeStructureAtlasPresentation.tsx tests/int/pg-fee-structure.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json
```

Expected: focused tests pass, no whitespace errors are reported, and the diff contains only the approved threshold behavior, tests, and maintained documentation. Do not commit the changes.
