# Department Profiles Density and Frames Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add size-aware two-to-eight-column Image Overlay directories, keep Inline at two-to-four columns, use compact mobile `4:5` and `sm`-up portrait `3:4` Overlay proportions, and add Boxed, Framed Grid, and Ruled Grid presentations for both card layouts.

**Architecture:** Payload stores one Large-compatible legacy column field shared by Inline plus Overlay-only Medium and Small column fields. The server resolves exactly one layout-aware active column count and a backward-compatible frame value. The client owns responsive grid and outer-frame geometry; the focused card component owns layout-specific surfaces, rounding, density, and media presentation.

**Tech Stack:** Payload CMS, React/Next.js, TypeScript, Tailwind CSS, Vitest, Testing Library.

## Global Constraints

- Inline supports 2–4 columns at every size and defaults to 4.
- Image Overlay Large supports 2–4 columns and defaults to 4.
- Image Overlay Medium supports 3–6 columns and defaults to 6.
- Image Overlay Small supports 4–8 columns and defaults to 8.
- Every Image Overlay size uses `aspect-4/5 sm:aspect-3/4`.
- Mobile Overlay grids are centered and capped at 320px for Large, 288px for Medium, and 256px for Small.
- Existing `columns` data remains the Inline and Large Overlay column value.
- Missing/invalid Card Size resolves to Large; missing/invalid Card Frame resolves to Boxed.
- Boxed uses separated rounded cards; Framed and Ruled use gapless square cells with shared dividers.
- Framed has one complete outer border; Ruled has only top and bottom outer rules.
- Inline Framed/Ruled cells inherit the section surface; Inline Boxed remains muted.
- Search, tabs, filtering, pagination, ordering, headings, optional-image fallback, and static non-clickable behavior remain unchanged.
- Do not add dependencies, stage files, or create a commit.

---

### Task 1: Add Size-Specific Column and Frame Schema

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `src/blocks/DepartmentProfiles/config.ts`
- Modify: `src/blocks/DepartmentProfiles/types.ts`

**Interfaces:**

- Produces `DepartmentProfilesColumns = '2' | '3' | '4' | '5' | '6' | '7' | '8'`.
- Produces `DepartmentProfilesCardFrame = 'boxed' | 'framed' | 'open'`.
- Adds Payload fields `mediumColumns`, `smallColumns`, and `cardFrame`.
- Keeps `columns` as the saved Large field.

- [ ] **Step 1: Add failing schema assertions**

Extend `InspectableField` only if needed, then assert:

```tsx
expect(findField(themeFields, 'columns')).toMatchObject({ defaultValue: '4', required: true })
expect(findField(themeFields, 'columns')?.options?.map(({ value }) => value)).toEqual([
  '2',
  '3',
  '4',
])
expect(findField(themeFields, 'mediumColumns')).toMatchObject({
  defaultValue: '6',
  required: true,
})
expect(findField(themeFields, 'mediumColumns')?.options?.map(({ value }) => value)).toEqual([
  '3',
  '4',
  '5',
  '6',
])
expect(findField(themeFields, 'smallColumns')).toMatchObject({
  defaultValue: '8',
  required: true,
})
expect(findField(themeFields, 'smallColumns')?.options?.map(({ value }) => value)).toEqual([
  '4',
  '5',
  '6',
  '7',
  '8',
])
expect(findField(themeFields, 'cardFrame')).toMatchObject({
  defaultValue: 'boxed',
  required: true,
})
expect(findField(themeFields, 'cardFrame')?.options?.map(({ value }) => value)).toEqual([
  'boxed',
  'framed',
  'open',
])
```

Assert the three column fields are shown only for `lg`, `md`, and `sm` respectively, with undefined legacy Card Size treated as Large.

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: failures for missing Medium/Small columns, Card Frame, and Admin conditions.

- [ ] **Step 3: Add conditional field helpers and schema fields**

In `config.ts`, add:

```ts
type CardSizeSiblingData = {
  cardSize?: 'lg' | 'md' | 'sm' | null
}

const usesLargeCards = (_data: unknown, siblingData: CardSizeSiblingData) =>
  siblingData?.cardSize !== 'md' && siblingData?.cardSize !== 'sm'
const usesMediumCards = (_data: unknown, siblingData: CardSizeSiblingData) =>
  siblingData?.cardSize === 'md'
const usesSmallCards = (_data: unknown, siblingData: CardSizeSiblingData) =>
  siblingData?.cardSize === 'sm'
```

Keep `columns` with options 2–4, relabel it **Profiles per Row**, and show it for Inline or Large Overlay. Show the following Medium and Small fields only for their matching Image Overlay size. Add:

```ts
{
  name: 'mediumColumns',
  label: 'Profiles per Row',
  type: 'select',
  defaultValue: '6',
  required: true,
  options: ['3', '4', '5', '6'].map((value) => ({ label: value, value })),
  admin: { condition: usesMediumCards },
} satisfies SelectField,
{
  name: 'smallColumns',
  label: 'Profiles per Row',
  type: 'select',
  defaultValue: '8',
  required: true,
  options: ['4', '5', '6', '7', '8'].map((value) => ({ label: value, value })),
  admin: { condition: usesSmallCards },
} satisfies SelectField,
{
  name: 'cardFrame',
  label: 'Card Frame',
  type: 'select',
  defaultValue: 'boxed',
  required: true,
  options: [
    { label: 'Boxed Cards', value: 'boxed' },
    { label: 'Framed Grid', value: 'framed' },
    { label: 'Ruled Grid', value: 'open' },
  ],
} satisfies SelectField,
```

- [ ] **Step 4: Expand the shared public types**

In `types.ts`, replace the column union and add the frame type:

```ts
export type DepartmentProfilesCardFrame = 'boxed' | 'framed' | 'open'
export type DepartmentProfilesColumns = '2' | '3' | '4' | '5' | '6' | '7' | '8'
```

- [ ] **Step 5: Run the focused schema test**

Expected: schema and condition assertions pass.

---

### Task 2: Resolve Active Columns and Frame Compatibility

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `src/blocks/DepartmentProfiles/Component.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`

**Interfaces:**

- Consumes Large `columns`, `mediumColumns`, `smallColumns`, Card Size, and Card Frame.
- Produces one normalized `columns: DepartmentProfilesColumns` and `cardFrame: DepartmentProfilesCardFrame` client prop.

- [ ] **Step 1: Add failing normalization tests**

Render the server component and assert:

```tsx
expect(renderBlock({})).toContain('data-department-profiles-columns="4"')
expect(renderBlock({})).toContain('data-department-profiles-card-frame="boxed"')
expect(renderBlock({ cardSize: 'md', mediumColumns: '5' })).toContain(
  'data-department-profiles-columns="5"',
)
expect(renderBlock({ cardSize: 'sm', smallColumns: '7' })).toContain(
  'data-department-profiles-columns="7"',
)
expect(renderBlock({ cardSize: 'md', mediumColumns: '8' })).toContain(
  'data-department-profiles-columns="6"',
)
expect(renderBlock({ cardFrame: 'framed' })).toContain(
  'data-department-profiles-card-frame="framed"',
)
```

- [ ] **Step 2: Run the focused test and verify failure**

Expected: active column and frame attributes are absent.

- [ ] **Step 3: Normalize size-specific values in the server component**

Add optional `mediumColumns`, `smallColumns`, and `cardFrame` properties to `DepartmentProfilesBlockLike`. Use explicit sets:

```ts
const largeColumns = new Set<DepartmentProfilesColumns>(['2', '3', '4'])
const mediumColumns = new Set<DepartmentProfilesColumns>(['3', '4', '5', '6'])
const smallColumns = new Set<DepartmentProfilesColumns>(['4', '5', '6', '7', '8'])
const cardFrames = new Set<DepartmentProfilesCardFrame>(['boxed', 'framed', 'open'])
```

Resolve active columns after resolving Card Layout and Card Size. Inline reads only the legacy 2–4 `columns` value; Image Overlay uses the size-specific branch:

```ts
const resolvedColumns =
  resolvedCardLayout === 'inline'
    ? largeColumns.has(columns as DepartmentProfilesColumns)
      ? (columns as DepartmentProfilesColumns)
      : '4'
    : resolvedCardSize === 'sm'
      ? smallColumns.has(smallColumnsValue as DepartmentProfilesColumns)
        ? (smallColumnsValue as DepartmentProfilesColumns)
        : '8'
      : resolvedCardSize === 'md'
        ? mediumColumns.has(mediumColumnsValue as DepartmentProfilesColumns)
          ? (mediumColumnsValue as DepartmentProfilesColumns)
          : '6'
        : largeColumns.has(columns as DepartmentProfilesColumns)
          ? (columns as DepartmentProfilesColumns)
          : '4'
```

Resolve missing/invalid Card Frame to `boxed`, and pass both results to the client.

- [ ] **Step 4: Add stable directory attributes in the client**

Accept the typed frame prop and render:

```tsx
data-department-profiles-card-frame={cardFrame}
data-department-profiles-columns={columns}
```

- [ ] **Step 5: Run the focused test**

Expected: all compatibility and active-column assertions pass.

---

### Task 3: Implement Responsive Two-to-Eight-Column Frame Geometry

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfileCard.tsx`

**Interfaces:**

- `DepartmentProfilesClient` owns outer borders, no-gap offsets, item divider wrappers, and responsive column classes.
- `DepartmentProfileCard` consumes `frame: DepartmentProfilesCardFrame` to resolve boxed versus inherited surfaces and rounding.

- [ ] **Step 1: Add failing grid and frame tests**

Assert responsive classes for all configured counts:

```tsx
expect(renderClient('2')).toContain('sm:grid-cols-2')
expect(renderClient('3')).toContain('lg:grid-cols-3')
expect(renderClient('4')).toContain('lg:grid-cols-4')
expect(renderClient('5')).toContain('2xl:grid-cols-5')
expect(renderClient('6')).toContain('2xl:grid-cols-6')
expect(renderClient('7')).toContain('2xl:grid-cols-7')
expect(renderClient('8')).toContain('2xl:grid-cols-8')
```

For Boxed assert gaps, rounded cards, and individual borders. For Framed assert one outer border, no gaps, `-mb-px -mr-px`, square cells, and right/bottom item dividers. For Ruled assert `border-y`, no complete outer border, and the same internal dividers. Exercise both Inline and Overlay.

- [ ] **Step 2: Run the focused test and verify failure**

Expected: missing 5–8 column classes and frame geometry assertions fail.

- [ ] **Step 3: Expand grid and image-size maps**

Use the established Download List breakpoint strategy:

```ts
const gridClasses = {
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '5': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5',
  '6': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6',
  '7': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7',
  '8': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8',
} as const
```

Add corresponding `sizes` hints: two to four retain their current desktop proportions; five to eight use 25vw at standard desktop and 20/16.67/14.29/12.5vw at `2xl`.

- [ ] **Step 4: Add shared frame-container geometry**

For Boxed, render the grid with `gap-5 sm:gap-6`. For Framed/Ruled, wrap the grid with:

```tsx
<div
  className={cn(
    'overflow-hidden border-current/15',
    cardFrame === 'framed' ? 'border' : 'border-y',
  )}
>
  <div className={cn('-mb-px -mr-px grid', gridClasses[columns])}>
    {profiles.map((profile) => (
      <div className="min-w-0 border-r border-b border-current/15" key={profile.id}>
        <DepartmentProfileCard frame={cardFrame} {...cardProps} />
      </div>
    ))}
  </div>
</div>
```

Use square outer corners for Framed/Ruled. Keep Boxed card keys and gap behavior unchanged.

- [ ] **Step 5: Make cell surfaces frame-aware**

In `DepartmentProfileCard.tsx`:

- Boxed Overlay uses its rounded individual border; Framed/Ruled Overlay removes individual border and rounding.
- Boxed Inline resolves the muted surface and retains rounded border.
- Framed/Ruled Inline resolves the default section surface, removes individual borders/rounding, and fills the divider cell height.
- Placeholder media remains muted in all modes.

- [ ] **Step 6: Run focused tests, TypeScript, and lint**

Run:

```bash
pnpm exec vitest run tests/int/department-profiles.int.spec.tsx
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/DepartmentProfiles tests/int/department-profiles.int.spec.tsx
```

Expected: all commands pass.

---

### Task 4: Standardize Overlay Ratio and Density

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfileCard.tsx`

**Interfaces:**

- Keeps the existing `cardSize` prop but maps every Overlay size to `aspect-4/5 sm:aspect-3/4`.
- Retains separate Large/Medium/Small typography and padding maps.

- [ ] **Step 1: Replace the old ratio tests with a failing shared-ratio contract**

```tsx
expect(renderDirectory('overlay', 'lg')).toContain('aspect-4/5 sm:aspect-3/4')
expect(renderDirectory('overlay', 'md')).toContain('aspect-4/5 sm:aspect-3/4')
expect(renderDirectory('overlay', 'sm')).toContain('aspect-4/5 sm:aspect-3/4')
expect(renderDirectory('overlay', 'lg')).not.toContain('aspect-4/5')
expect(renderDirectory('overlay', 'md')).not.toContain('aspect-square')
expect(renderDirectory('overlay', 'sm')).not.toContain('aspect-5/4')
```

Retain assertions for distinct Large/Medium/Small padding and type classes.

- [ ] **Step 2: Run the focused test and verify failure**

Expected: current Large, Medium, and Small ratio mappings fail.

- [ ] **Step 3: Change the overlay size map**

Set `card: 'aspect-4/5 sm:aspect-3/4'` for every Overlay size. Preserve the approved density classes:

```ts
lg: { content: 'gap-1 p-5 pt-20', name: 'text-lg leading-tight' }
md: { content: 'gap-1 p-4 pt-16', name: 'text-base leading-tight' }
sm: { content: 'gap-0.5 p-3.5 pt-12', name: 'text-sm leading-tight' }
```

- [ ] **Step 4: Run the focused test**

Expected: all ratio and density assertions pass.

---

### Task 5: Regenerate Artifacts, Preview, Documentation, and Verify

**Files:**

- Modify generated: `src/payload-types.ts`
- Modify generated if changed: `src/app/(payload)/admin/importMap.js`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Replace: `public/block-thumbnails/department-profiles.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify generated: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Generated types expose Medium/Small columns and Card Frame.
- The thumbnail demonstrates a high-density frame presentation without clipping.

- [ ] **Step 1: Regenerate Payload types and import map**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: `DepartmentProfilesBlock` includes `mediumColumns`, `smallColumns`, and `cardFrame`.

- [ ] **Step 2: Update and regenerate the thumbnail**

Use Image Overlay Small with eight columns and Framed Grid. Regenerate only `departmentProfiles`, inspect the 1600×900 JPEG, and make one bounded correction pass if spacing, text wrapping, or dividers fail.

- [ ] **Step 3: Update current documentation**

Update only Department Profiles entries to document the responsive mobile 4:5 and `sm`-up 3:4 ratios, mobile width caps, size-specific ranges/defaults, and Boxed/Framed/Ruled behavior. Do not reformat adjacent Markdown tables or rewrite earlier historical specs.

- [ ] **Step 4: Run the design detector once**

Run the bundled detector over the changed Department Profiles TSX files and `custom.css`. Expected: no material findings.

- [ ] **Step 5: Run the project-context loop**

Run `pnpm project-context:update`, then `pnpm project-context:check`. Expected: `Project context is current`; the stale knowledge-graph warning remains informational.

- [ ] **Step 6: Run affected verification**

Run focused Department Profiles, page registration, system blocks, thumbnail, project-context, and SNMIH contrast tests, plus TypeScript, focused ESLint, Prettier check, and `git diff --check`. Expected: all affected checks pass.

- [ ] **Step 7: Inspect the final workspace**

Confirm the user's staged files remain staged, new edits are not staged automatically, no unrelated formatting churn or dependency changes were introduced, and no commit was created.
