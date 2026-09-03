# Nested Department Profiles Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox
> (`- [ ]`) syntax for tracking.

**Goal:** Nest every Department Profiles profile under its owning department, preserve existing saved
content through a reversible migration, and raise the block-wide capacity from 200 to 400 profiles.

**Architecture:** Payload's native nested arrays become the canonical authoring and storage model.
The server renderer flattens nested departments in department-first order while retaining a temporary
legacy flat-data path. A MongoDB migration rewrites current documents and every version for Pages,
Reusable Sections, and the News & Events Detail Template without dropping profile data.

**Tech Stack:** Payload CMS 3.85.2, MongoDB/Mongoose migration adapter, React 19, Next.js 16,
TypeScript, Vitest, Testing Library

## Global Constraints

- Keep one to fifty ordered departments and allow empty departments.
- Require one to 400 profiles total across all departments.
- Keep no more than twelve featured profiles, and require an image for every featured profile.
- The public All view uses department order, then profile order within each department.
- Preserve current documents, drafts, published versions, and historical versions.
- Keep search, filters, pagination, featured carousel behavior, card presentation, appearance, and
  registrations unchanged.
- Retain temporary runtime support for old flat `profiles[].departmentId` data.
- Never silently discard an orphaned profile during migration.
- Do not stage or commit any changes.
- Preserve unrelated staged and unstaged work already present in the worktree.

---

## File Structure

- `src/blocks/DepartmentProfiles/config.ts`: canonical nested Payload schema and block-wide
  validation.
- `src/blocks/DepartmentProfiles/RowLabels.tsx`: Admin-only department and profile collapsed-row
  labels.
- `src/blocks/DepartmentProfiles/Component.tsx`: nested and legacy input normalization into the
  unchanged visitor presentation contract.
- `src/blocks/DepartmentProfiles/DepartmentSelectField.tsx`: delete after the profile-owned
  department selector is removed.
- `src/blocks/DepartmentProfiles/departmentOptions.ts`: delete with the obsolete selector.
- `src/block-thumbnails/fixtures.tsx`: canonical nested Department Profiles fixture.
- `src/migrations/20260831_010000_nest_department_profiles.ts`: pure reversible layout transform and
  MongoDB document/version runner.
- `src/migrations/index.ts`: migration registration.
- `tests/int/department-profiles.int.spec.tsx`: nested schema, validation, compatibility, ordering,
  and generated-type coverage.
- `tests/int/department-profiles-migration.int.spec.ts`: pure up/down transforms, orphan failure,
  source coverage, and migration registration.
- `src/payload-types.ts`: regenerated nested Payload types.
- `src/app/(payload)/admin/importMap.js`: regenerated RowLabels imports with the removed picker gone.
- `docs/guides/blocks.md`, `docs/architecture/feature-inventory.md`, and
  `.agents/skills/project-context/references/block-system.md`: maintained authoring/runtime contract.
- `.agents/skills/project-context/references/project-inventory.json`: generated project inventory.

---

### Task 1: Define the Nested Payload Schema and Admin Row Labels

**Files:**

- Modify: `src/blocks/DepartmentProfiles/config.ts`
- Create: `src/blocks/DepartmentProfiles/RowLabels.tsx`
- Delete: `src/blocks/DepartmentProfiles/DepartmentSelectField.tsx`
- Delete: `src/blocks/DepartmentProfiles/departmentOptions.ts`
- Modify: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Produces `validateDepartmentRows(value: unknown): string | true` as the single block-wide content
  validator.
- Produces `DepartmentRowLabel` and `DepartmentProfileRowLabel` Admin components.
- Produces `departments[].profiles[]` with no profile-owned `departmentId` field.

- [ ] **Step 1: Replace the flat-schema assertions with failing nested-schema assertions**

Update the test imports to remove `validateFeaturedProfiles`, `validateProfileDepartment`, and
`getDepartmentOptionsFromFormFields`. Extend `InspectableField.admin.components` to include
`RowLabel?: string`, add a `validate?: (value: unknown) => string | true` member, and replace the flat
array assertions with:

```tsx
const departmentsField = contentFields.find(({ name }) => name === 'departments')
const nestedProfilesField = departmentsField?.fields?.find(({ name }) => name === 'profiles')

expect(departmentsField).toMatchObject({
  maxRows: 50,
  minRows: 1,
  required: true,
  type: 'array',
})
expect(departmentsField?.admin?.components?.RowLabel).toContain('RowLabels#DepartmentRowLabel')
expect(nestedProfilesField).toMatchObject({
  maxRows: 400,
  type: 'array',
})
expect(nestedProfilesField?.required).not.toBe(true)
expect(nestedProfilesField?.minRows).toBeUndefined()
expect(nestedProfilesField?.admin?.components?.RowLabel).toContain(
  'RowLabels#DepartmentProfileRowLabel',
)
expect(contentFields.some(({ name }) => name === 'profiles')).toBe(false)
expect(findField(departmentsField?.fields ?? [], 'departmentId')).toBeUndefined()
expect(findField(departmentsField?.fields ?? [], 'image')).toMatchObject({
  relationTo: 'media',
  type: 'upload',
})
```

Replace the old department-picker and featured validator tests with one test using this helper:

```tsx
const createDepartmentRows = (count: number) => [
  {
    id: 'medicine',
    name: 'General Medicine',
    profiles: Array.from({ length: count }, (_, index) => ({
      featured: false,
      name: `Doctor ${index + 1}`,
    })),
  },
]

expect(validateDepartmentRows(createDepartmentRows(1))).toBe(true)
expect(validateDepartmentRows(createDepartmentRows(400))).toBe(true)
expect(validateDepartmentRows(createDepartmentRows(401))).toContain('400')
expect(validateDepartmentRows([{ id: 'empty', name: 'Medicine', profiles: [] }])).toContain(
  'at least one profile',
)
expect(
  validateDepartmentRows([
    {
      id: 'one',
      name: 'Medicine',
      profiles: Array.from({ length: 250 }, (_, i) => ({ name: `M${i}` })),
    },
    {
      id: 'two',
      name: 'Anatomy',
      profiles: Array.from({ length: 151 }, (_, i) => ({ name: `A${i}` })),
    },
  ]),
).toContain('400')
expect(
  validateDepartmentRows([
    {
      id: 'one',
      name: 'Medicine',
      profiles: Array.from({ length: 13 }, (_, index) => ({
        featured: true,
        image: index + 1,
        name: `Featured ${index + 1}`,
      })),
    },
  ]),
).toContain('12')
expect(
  validateDepartmentRows([
    { id: 'one', name: 'Medicine', profiles: [{ featured: true, name: 'Missing Portrait' }] },
  ]),
).toContain('Missing Portrait')
```

- [ ] **Step 2: Run the focused test and verify the old schema fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because `profiles` is still top-level, limited to 200, and still owns
`departmentId`.

- [ ] **Step 3: Implement the combined validator and nested arrays**

In `config.ts`, replace the old department/profile validation types and functions with:

```ts
type DepartmentProfileValue = {
  featured?: boolean | null
  image?: unknown
  name?: string | null
}

type DepartmentValue = {
  id?: string | null
  name?: string | null
  profiles?: DepartmentProfileValue[] | null
}

const normalizeDepartmentName = (value?: string | null) => value?.trim().toLocaleLowerCase() ?? ''

export const validateDepartmentRows = (value: unknown): string | true => {
  if (!Array.isArray(value)) return true

  const seen = new Set<string>()
  const profiles: DepartmentProfileValue[] = []

  for (const row of value as DepartmentValue[]) {
    const normalizedName = normalizeDepartmentName(row?.name)
    if (!normalizedName) return 'Every department must have a name.'
    if (seen.has(normalizedName)) return 'Department names must be unique.'
    seen.add(normalizedName)
    if (Array.isArray(row?.profiles)) profiles.push(...row.profiles)
  }

  if (profiles.length === 0) return 'Add at least one profile across all departments.'
  if (profiles.length > 400) return 'Add no more than 400 profiles across all departments.'

  const featuredProfiles = profiles.filter((profile) => profile?.featured === true)
  if (featuredProfiles.length > 12) return 'Select no more than 12 featured profiles.'

  const missingImage = featuredProfiles.find((profile) => !profile?.image)
  if (missingImage) {
    const name = missingImage.name?.trim()
    return name
      ? `Featured profile “${name}” requires a Profile Image.`
      : 'Every featured profile requires a Profile Image.'
  }

  return true
}
```

Define one reusable `profileFields` array and nest the profiles array inside `departmentsField`:

```ts
const profileFields = [
  {
    name: 'image',
    label: 'Profile Image',
    type: 'upload',
    relationTo: 'media',
  },
  { name: 'name', type: 'text', required: true },
  { name: 'designation', type: 'text' },
  {
    name: 'featured',
    label: 'Featured in Carousel',
    type: 'checkbox',
    defaultValue: false,
    admin: { description: 'Show this profile in the optional featured carousel.' },
  } satisfies CheckboxField,
  {
    name: 'imagePosition',
    label: 'Image Position',
    type: 'select',
    defaultValue: 'center',
    required: true,
    options: [
      { label: 'Center', value: 'center' },
      { label: 'Top', value: 'top' },
      { label: 'Bottom', value: 'bottom' },
      { label: 'Left', value: 'left' },
      { label: 'Right', value: 'right' },
    ],
  } satisfies SelectField,
] satisfies ArrayField['fields']

const departmentsField = {
  name: 'departments',
  label: 'Departments',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 50,
  validate: validateDepartmentRows,
  admin: {
    components: {
      RowLabel: '/blocks/DepartmentProfiles/RowLabels#DepartmentRowLabel',
    },
    description:
      'Add departments in public filter order, then expand each department to manage its profiles. Maximum 400 profiles total.',
    initCollapsed: true,
  },
  fields: [
    {
      name: 'name',
      label: 'Department Name',
      type: 'text',
      required: true,
    },
    {
      name: 'profiles',
      label: 'Profiles',
      type: 'array',
      maxRows: 400,
      admin: {
        components: {
          RowLabel: '/blocks/DepartmentProfiles/RowLabels#DepartmentProfileRowLabel',
        },
        description: 'Profiles shown for this department in their displayed order.',
        initCollapsed: true,
      },
      fields: profileFields,
    } satisfies ArrayField,
  ],
} satisfies ArrayField
```

Remove `profilesField` from the Content tab and remove `TextField` plus obsolete types/functions from
the imports and module.

- [ ] **Step 4: Create the Admin row-label components**

Create `src/blocks/DepartmentProfiles/RowLabels.tsx`:

```tsx
'use client'

import { useRowLabel } from '@payloadcms/ui'

type NamedRow = { name?: string | null }

const resolveLabel = (name: string | null | undefined, fallback: string, rowNumber?: number) =>
  name?.trim() || `${fallback} ${typeof rowNumber === 'number' ? rowNumber + 1 : ''}`.trim()

export const DepartmentRowLabel = () => {
  const { data, rowNumber } = useRowLabel<NamedRow>()
  return <span>{resolveLabel(data?.name, 'Department', rowNumber)}</span>
}

export const DepartmentProfileRowLabel = () => {
  const { data, rowNumber } = useRowLabel<NamedRow>()
  return <span>{resolveLabel(data?.name, 'Profile', rowNumber)}</span>
}
```

- [ ] **Step 5: Delete the obsolete picker modules**

Delete:

```text
src/blocks/DepartmentProfiles/DepartmentSelectField.tsx
src/blocks/DepartmentProfiles/departmentOptions.ts
```

Do not hand-edit the generated Admin import map in this task; Task 4 regenerates it from the new
schema.

- [ ] **Step 6: Run the focused schema and validation tests**

Run the Step 2 command.

Expected: PASS for nested fields, 400-total validation, featured rules, and the remaining unchanged
directory-control tests.

---

### Task 2: Normalize Nested Data Without Breaking Legacy Rendering

**Files:**

- Modify: `src/blocks/DepartmentProfiles/Component.tsx`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Consumes canonical `departments[].profiles[]` rows and optional compatibility
  `profiles[].departmentId` rows.
- Produces the unchanged `ResolvedProfileDepartment[]` and `ResolvedDepartmentProfile[]` client
  props.
- Treats nested arrays as authoritative when at least one department owns a `profiles` array.

- [ ] **Step 1: Add failing nested ordering and compatibility render tests**

Add a server-render test with nested departments deliberately ordered differently from the former
flat fixture:

```tsx
const html = renderToStaticMarkup(
  <DepartmentProfilesBlockComponent
    departments={[
      {
        id: 'anatomy',
        name: 'Anatomy',
        profiles: [
          { designation: 'Professor', id: 'a-1', imagePosition: 'top', name: 'Doctor Anatomy' },
        ],
      },
      {
        id: 'medicine',
        name: 'General Medicine',
        profiles: [
          { designation: 'Dean', id: 'm-1', imagePosition: 'center', name: 'Doctor Medicine' },
        ],
      },
    ]}
    title="Faculty Directory"
  />,
)

expect(html.indexOf('Doctor Anatomy')).toBeLessThan(html.indexOf('Doctor Medicine'))
expect(html).toContain('Anatomy')
expect(html).toContain('General Medicine')
```

Keep one existing flat `departments` plus top-level `profiles` render test and rename it to state that
legacy flat data remains supported. Add an authority test where nested rows and a top-level legacy row
are both supplied, asserting that only nested rows render.

- [ ] **Step 2: Run the focused test and verify nested profiles do not render**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because `Component.tsx` only reads the top-level `profiles` prop.

- [ ] **Step 3: Extend the server input types and flatten canonical nested rows**

Update the input types in `Component.tsx`:

```ts
type DepartmentProfileValue = {
  departmentId?: string | null
  designation?: string | null
  featured?: boolean | null
  id?: string | null
  image?: unknown
  imagePosition?: string | null
  name?: string | null
}

type DepartmentValue = {
  id?: string | null
  name?: string | null
  profiles?: DepartmentProfileValue[] | null
}
```

Keep `profiles?: DepartmentProfileValue[] | null` on `DepartmentProfilesBlockLike` solely for legacy
data. Replace the current separate department/profile normalization with this exact precedence:

```ts
const hasNestedProfileArrays = (departments ?? []).some((department) =>
  Array.isArray(department?.profiles),
)
const seenDepartmentNames = new Set<string>()
const nestedProfileRows: Array<{
  departmentId: string
  profile: DepartmentProfileValue
}> = []
const resolvedDepartments = (departments ?? []).flatMap(
  (department): ResolvedProfileDepartment[] => {
    const id = department.id?.trim()
    const name = department.name?.trim()
    if (!id || !name) return []

    const normalizedName = normalizeDepartmentName(name)
    if (seenDepartmentNames.has(normalizedName)) return []
    seenDepartmentNames.add(normalizedName)

    if (hasNestedProfileArrays && Array.isArray(department.profiles)) {
      for (const profile of department.profiles)
        nestedProfileRows.push({ departmentId: id, profile })
    }

    return [{ id, name }]
  },
)
const departmentById = new Map(
  resolvedDepartments.map((department) => [department.id, department] as const),
)
const profileRows = hasNestedProfileArrays
  ? nestedProfileRows
  : (profiles ?? []).map((profile) => ({
      departmentId: profile.departmentId?.trim() ?? '',
      profile,
    }))
const resolvedProfiles = profileRows.flatMap(
  ({ departmentId, profile }, index): ResolvedDepartmentProfile[] => {
    const name = profile.name?.trim()
    const department = departmentId ? departmentById.get(departmentId) : undefined
    if (!name || !department) return []

    const image = getMediaImageProps({
      fallbackAlt: name,
      media: profile.image as Media | string | number | null | undefined,
      preset: 'generic',
    })
    const imagePosition = validImagePositions.has(
      profile.imagePosition as DepartmentProfileImagePosition,
    )
      ? (profile.imagePosition as DepartmentProfileImagePosition)
      : 'center'

    return [
      {
        departmentId: department.id,
        departmentName: department.name,
        designation: profile.designation?.trim() || undefined,
        featured: profile.featured === true,
        id: profile.id ?? index,
        image: image ?? undefined,
        imagePosition,
        name,
      },
    ]
  },
)
```

Do not change `DepartmentProfilesClient.tsx` or the normalized types: the visitor-facing contract is
intentionally unchanged.

- [ ] **Step 4: Convert the thumbnail fixture to canonical nested data**

In `src/block-thumbnails/fixtures.tsx`, move every existing fixture profile into the matching
department object's `profiles` array, remove each `departmentId`, and remove the component's
top-level `profiles` prop. Keep the same department order, profile content, and visual settings so the
thumbnail remains presentation-equivalent.

- [ ] **Step 5: Run the focused test**

Run the Step 2 command.

Expected: PASS for canonical nesting, department-first ordering, nested authority, legacy flat
compatibility, and all existing visitor behavior.

---

### Task 3: Add a Lossless Reversible MongoDB Migration

**Files:**

- Create: `src/migrations/20260831_010000_nest_department_profiles.ts`
- Modify: `src/migrations/index.ts`
- Create: `tests/int/department-profiles-migration.int.spec.ts`
- Modify: `tests/int/legal-pages-migration.int.spec.ts`

**Interfaces:**

- Produces `transformDepartmentProfilesLayout(layout, direction, location)` for pure testing.
- Produces Payload migration `up(args)` and `down(args)`.
- Reads/writes `layout` or `version.layout` for six storage targets.

- [ ] **Step 1: Write failing pure migration tests**

Create `tests/int/department-profiles-migration.int.spec.ts` and import:

```ts
import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-mongodb'
import { describe, expect, it, vi } from 'vitest'

import {
  down,
  transformDepartmentProfilesLayout,
  up,
} from '@/migrations/20260831_010000_nest_department_profiles'
```

Use this legacy block fixture:

```ts
const legacyLayout = [
  {
    blockType: 'departmentProfiles',
    departments: [
      { id: 'medicine', name: 'Medicine' },
      { id: 'anatomy', name: 'Anatomy' },
    ],
    profiles: [
      { departmentId: 'anatomy', id: 'a-1', name: 'Anatomy One' },
      { departmentId: 'medicine', id: 'm-1', name: 'Medicine One' },
      { departmentId: 'anatomy', id: 'a-2', name: 'Anatomy Two' },
    ],
  },
  { blockType: 'richText', id: 'untouched' },
]
```

Assert the upward transform removes top-level `profiles`, removes every `departmentId`, preserves
row IDs and other fields, groups profiles by department, and produces Medicine One before Anatomy One
in the flattened department-first order. Apply the downward transform to the result and assert it
restores a top-level flat array in department-first order. Also assert both directions are idempotent
and non-Department Profiles blocks retain object identity.

Add this required failure assertion:

```ts
expect(() =>
  transformDepartmentProfilesLayout(
    [
      {
        blockType: 'departmentProfiles',
        departments: [{ id: 'medicine', name: 'Medicine' }],
        profiles: [{ departmentId: 'missing', id: 'orphan', name: 'Orphan' }],
      },
    ],
    'up',
    'pages:page-1.layout',
  ),
).toThrow(/orphan.*missing department/i)
```

- [ ] **Step 2: Add failing storage-target coverage**

Create mock Mongoose models whose `find().session().lean().exec()` chain returns supplied documents
and whose `bulkWrite` method is a spy. Build migration args with:

```ts
payload.db.collections.pages
payload.db.collections['reusable-sections']
payload.db.globals
payload.db.versions.pages
payload.db.versions['reusable-sections']
payload.db.versions['news-events-detail-template']
```

Call `up(args)` and assert all six models are queried with their correct current/version path, and
that changed documents receive `$set` updates for `layout` or `version.layout`. Call `down(args)` with
nested fixtures and assert the same six targets are reversed. Verify `bulkWrite` is not called for a
target with no changed block.

- [ ] **Step 3: Run the migration test and verify the module is missing**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles-migration.int.spec.ts
```

Expected: FAIL because the migration file does not exist.

- [ ] **Step 4: Implement the pure reversible transform**

Create `src/migrations/20260831_010000_nest_department_profiles.ts` with record guards and exported
direction/layout types. The upward block transform must:

```ts
const { profiles: legacyProfiles, ...blockWithoutLegacyProfiles } = block
const profilesByDepartment = new Map<string, JsonRecord[]>()

for (const department of departments) {
  const id = asTrimmedString(department.id)
  if (!id) throw new Error(`${location}: department is missing its stable row ID.`)
  if (Array.isArray(department.profiles)) {
    throw new Error(`${location}: block contains both flat and nested profile data.`)
  }
  profilesByDepartment.set(id, [])
}

for (const profile of legacyProfiles) {
  if (!isRecord(profile)) throw new Error(`${location}: profile row is invalid.`)
  const departmentId = asTrimmedString(profile.departmentId)
  const destination = departmentId ? profilesByDepartment.get(departmentId) : undefined
  if (!destination) {
    const profileName = asTrimmedString(profile.name) || 'Unnamed profile'
    throw new Error(`${location}: profile “${profileName}” references a missing department.`)
  }
  const { departmentId: _departmentId, ...nestedProfile } = profile
  destination.push(nestedProfile)
}

return {
  ...blockWithoutLegacyProfiles,
  departments: departments.map((department) => ({
    ...department,
    profiles: profilesByDepartment.get(asTrimmedString(department.id)) ?? [],
  })),
}
```

The downward block transform must detect at least one department with an own `profiles` array, require
every department ID, flatten rows in department order, restore `departmentId`, strip nested profile
arrays, and never truncate rows. `transformDepartmentProfilesLayout` must clone only changed layout
entries and return `{ changed: boolean, layout: unknown[] }`.

- [ ] **Step 5: Implement preflight-then-write migration execution**

Define the six targets exactly:

```ts
const targets = [
  {
    label: 'pages',
    model: payload.db.collections.pages,
    path: 'layout',
    query: { 'layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'page versions',
    model: payload.db.versions.pages,
    path: 'version.layout',
    query: { 'version.layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'reusable-sections',
    model: payload.db.collections['reusable-sections'],
    path: 'layout',
    query: { 'layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'reusable-section versions',
    model: payload.db.versions['reusable-sections'],
    path: 'version.layout',
    query: { 'version.layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'news-events-detail-template',
    model: payload.db.globals,
    path: 'layout',
    query: { globalType: 'news-events-detail-template', 'layout.blockType': 'departmentProfiles' },
  },
  {
    label: 'news-events-detail-template versions',
    model: payload.db.versions['news-events-detail-template'],
    path: 'version.layout',
    query: { 'version.layout.blockType': 'departmentProfiles' },
  },
] as const
```

For every target, load lean documents under the supplied session, resolve the exact layout path, and
run the pure transform for every document before performing any write. If any transform throws, no
`bulkWrite` call may have occurred. After successful preflight, call one `bulkWrite` per changed target:

```ts
await target.model.bulkWrite(
  changes.map(({ id, layout }) => ({
    updateOne: {
      filter: { _id: id },
      update: { $set: { [target.path]: layout } },
    },
  })),
  { session: session as never },
)
```

`up` passes direction `up`; `down` passes direction `down`. Keep duplicate Mongo driver session types
narrowed only at the model boundary, matching the existing migrations.

- [ ] **Step 6: Register the migration and update the existing order assertion**

Append this import and registry row in `src/migrations/index.ts`:

```ts
import * as migration_20260831_010000_nest_department_profiles from './20260831_010000_nest_department_profiles'

{
  up: migration_20260831_010000_nest_department_profiles.up,
  down: migration_20260831_010000_nest_department_profiles.down,
  name: '20260831_010000_nest_department_profiles',
},
```

Update the exact migration list in `tests/int/legal-pages-migration.int.spec.ts` to include the new
name after `20260831_000000_provision_legal_pages`.

- [ ] **Step 7: Run migration and focused block tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/department-profiles-migration.int.spec.ts \
  tests/int/legal-pages-migration.int.spec.ts \
  tests/int/department-profiles.int.spec.tsx
```

Expected: PASS with lossless up/down transforms, six target paths, preflight failure safety, and the
registered migration order.

---

### Task 4: Regenerate Types and the Admin Import Map

**Files:**

- Modify (generated): `src/payload-types.ts`
- Modify (generated): `src/app/(payload)/admin/importMap.js`
- Modify: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Generated `DepartmentProfilesBlock` contains `departments[].profiles[]` and no top-level profiles.
- Generated Admin import map contains both RowLabels exports and no DepartmentSelectField import.

- [ ] **Step 1: Add failing generated-artifact assertions**

Update the existing generated interface test to assert the extracted `DepartmentProfilesBlock`
contains:

```ts
departments: {
  name: string;
  profiles?:
    | {
        image?: (string | null) | Media;
        name: string;
        designation?: string | null;
        featured?: boolean | null;
        imagePosition: 'center' | 'top' | 'bottom' | 'left' | 'right';
        id?: string | null;
      }[]
    | null;
  id?: string | null;
}[];
```

Also read `src/app/(payload)/admin/importMap.js` and assert it contains
`RowLabels#DepartmentRowLabel` and `RowLabels#DepartmentProfileRowLabel` but not
`DepartmentSelectField`.

- [ ] **Step 2: Run the focused test and verify stale generated files fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because generated types and the import map still describe the flat picker schema.

- [ ] **Step 3: Regenerate Payload types and the Admin import map**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: both commands exit 0; `DepartmentProfilesBlock` becomes nested and the import map points at
`RowLabels.tsx` only.

- [ ] **Step 4: Re-run the focused test**

Run the Step 2 command.

Expected: PASS.

---

### Task 5: Update Maintained Documentation and Project Knowledge

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify (generated): `.agents/skills/project-context/references/project-inventory.json`
- Verify: `docs/superpowers/specs/2026-08-31-department-profiles-nested-authoring-design.md`

**Interfaces:**

- Documents the canonical nested Admin model, combined 400 limit, ordering, migration, and temporary
  compatibility behavior.
- Removes current-state claims that profiles are a separate flat list selected by stable row ID.

- [ ] **Step 1: Update the editor-facing block guide**

Change the Department Profiles table row in `docs/guides/blocks.md` to say:

```markdown
Configure departments in public filter order, then expand each department to manage its profiles.
The block supports up to 400 profiles total. Search, department filtering, featured profiles, Load
More, responsive card sizes, frames, and missing-image presentation remain configurable.
```

- [ ] **Step 2: Update architecture and block-system narratives**

Replace the current flat-list/picker description in both maintained narrative files with the exact
contract:

```markdown
Department Profiles stores profiles inside its ordered block-local department rows. Editors expand a
department to manage its ordered profile list; department and profile row labels expose their names
while collapsed. Empty departments remain valid, at least one profile is required, and the combined
block limit is 400 profiles. The public All view follows department order and then nested profile
order. Search, department filtering, pagination, featured profiles, cards, and appearance retain
their existing visitor contracts. A reversible migration covers current and versioned Pages,
Reusable Sections, and the News & Events Detail Template, while runtime temporarily accepts legacy
flat assignments during rollout.
```

Retain the existing detailed presentation paragraphs after replacing only the obsolete authoring and
ordering claims.

- [ ] **Step 3: Regenerate the block thumbnail and inspect its scope**

Run:

```bash
pnpm generate:block-thumbnails
git status --short -- src/block-thumbnails
```

Expected: generator exits 0. Only the Department Profiles thumbnail may change due its canonical
fixture rewrite; investigate any unrelated binary changes before continuing and do not discard user
changes.

- [ ] **Step 4: Run the project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit 0; generated inventory removes `DepartmentSelectField.tsx` and
`departmentOptions.ts`, adds `RowLabels.tsx` and the migration/test files, and the narrative matches
the nested schema.

---

### Task 6: Final Regression and Worktree Verification

**Files:**

- Verify all files from Tasks 1–5.
- Do not modify unrelated files unless a failing relevant contract proves they are affected.

**Interfaces:**

- Produces a type-safe production build and passing integration suite.
- Leaves every task change uncommitted and preserves the user's pre-existing worktree state.

- [ ] **Step 1: Format only touched source, test, migration, and documentation files**

Run:

```bash
pnpm exec prettier --write \
  src/blocks/DepartmentProfiles/config.ts \
  src/blocks/DepartmentProfiles/RowLabels.tsx \
  src/blocks/DepartmentProfiles/Component.tsx \
  src/block-thumbnails/fixtures.tsx \
  src/migrations/20260831_010000_nest_department_profiles.ts \
  src/migrations/index.ts \
  tests/int/department-profiles.int.spec.tsx \
  tests/int/department-profiles-migration.int.spec.ts \
  tests/int/legal-pages-migration.int.spec.ts \
  docs/guides/blocks.md \
  docs/architecture/feature-inventory.md \
  .agents/skills/project-context/references/block-system.md \
  docs/superpowers/specs/2026-08-31-department-profiles-nested-authoring-design.md \
  docs/superpowers/plans/2026-08-31-department-profiles-nested-authoring.md
```

Expected: command exits 0 and does not touch unrelated files.

- [ ] **Step 2: Run focused and cross-block contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/department-profiles.int.spec.tsx \
  tests/int/department-profiles-migration.int.spec.ts \
  tests/int/legal-pages-migration.int.spec.ts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/live-preview-renderer.int.spec.tsx \
  tests/int/live-preview-import-boundary.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts
```

Expected: all listed files pass.

- [ ] **Step 3: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: all integration tests pass.

- [ ] **Step 4: Run lint and production build**

Run:

```bash
pnpm lint
pnpm build
```

Expected: both commands exit 0 with no TypeScript, ESLint, import-boundary, or Next.js build errors.

- [ ] **Step 5: Re-run project-context verification after formatting and generators**

Run:

```bash
pnpm project-context:check
git diff --check
```

Expected: project context is current and Git reports no whitespace errors.

- [ ] **Step 6: Review final scope without staging or committing**

Run:

```bash
git status --short
git diff --stat
git diff -- src/blocks/DepartmentProfiles src/migrations tests/int/department-profiles.int.spec.tsx tests/int/department-profiles-migration.int.spec.ts docs/guides/blocks.md docs/architecture/feature-inventory.md
```

Expected: Department Profiles changes match this plan, the existing unrelated changes remain intact,
and nothing new is staged or committed by the implementation workflow.
