# Department Profiles Card Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an Inline Department Profiles card layout, optional profile images with a `UserRound` fallback, and Small/Medium/Large card sizing while preserving the current overlay design as Large.

**Architecture:** Keep directory state, search, tabs, and pagination in `DepartmentProfilesClient.tsx`. Move card rendering into a focused `DepartmentProfileCard.tsx` presentation component that consumes normalized, client-safe profile data and handles both layouts, all size variants, semantic surfaces, and missing-image placeholders. The server component remains responsible for Payload normalization and backward-compatible defaults.

**Tech Stack:** Payload CMS fields and generated types, React/Next.js, TypeScript, Tailwind CSS, Lucide React, Vitest, Testing Library.

## Global Constraints

- Existing saved documents resolve to `cardLayout: 'overlay'` and `cardSize: 'lg'` without migration.
- Large Image Overlay must retain the current `4:5`, padding, and typography treatment.
- Medium Image Overlay uses `1:1`; Small Image Overlay uses `5:4`.
- Inline content order is Name, optional Designation, Department.
- Profile image is optional; a missing or unresolved image renders a decorative `UserRound` placeholder.
- Search, tabs, full-list filtering, Load More, section appearance, actions, and configured columns remain unchanged.
- Cards remain static and non-clickable.
- Do not add dependencies and do not create a commit.

---

### Task 1: Lock the Payload Schema and Compatibility Contract

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `src/blocks/DepartmentProfiles/config.ts`
- Modify: `src/blocks/DepartmentProfiles/types.ts`

**Interfaces:**

- Produces `DepartmentProfilesCardLayout = 'inline' | 'overlay'`.
- Produces `DepartmentProfilesCardSize = 'lg' | 'md' | 'sm'`.
- Changes `ResolvedDepartmentProfile.image` from required to optional.
- Adds Payload fields `cardLayout` and `cardSize` with backward-compatible defaults.

- [ ] **Step 1: Add failing schema assertions**

Extend the schema test with the exact contracts:

```tsx
expect(findField(contentFields, 'image')).toMatchObject({
  relationTo: 'media',
  type: 'upload',
})
expect(findField(contentFields, 'image')?.required).not.toBe(true)
expect(findField(themeFields, 'cardLayout')).toMatchObject({
  defaultValue: 'overlay',
  required: true,
})
expect(findField(themeFields, 'cardLayout')?.options?.map(({ value }) => value)).toEqual([
  'overlay',
  'inline',
])
expect(findField(themeFields, 'cardSize')?.options?.map(({ value }) => value)).toEqual([
  'sm',
  'md',
  'lg',
])
expect(findField(themeFields, 'themeMode')?.admin?.condition?.({}, { cardLayout: 'inline' })).toBe(
  false,
)
expect(
  findField(themeFields, 'overlayStyle')?.admin?.condition?.({}, { cardLayout: 'overlay' }),
).toBe(true)
```

- [ ] **Step 2: Run the focused test and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/department-profiles.int.spec.tsx
```

Expected: schema assertions fail because image is still required and the two card fields do not exist.

- [ ] **Step 3: Add schema fields and conditional overlay controls**

In `config.ts`, remove `required: true` from the image upload and add:

```ts
type CardLayoutSiblingData = {
  cardLayout?: 'inline' | 'overlay' | null
}

const usesOverlayCards = (_data: unknown, siblingData: CardLayoutSiblingData) =>
  siblingData?.cardLayout !== 'inline'
```

Add the following selects before the overlay controls:

```ts
{
  name: 'cardLayout',
  label: 'Card Layout',
  type: 'select',
  defaultValue: 'overlay',
  required: true,
  options: [
    { label: 'Image Overlay', value: 'overlay' },
    { label: 'Inline', value: 'inline' },
  ],
} satisfies SelectField,
{
  name: 'cardSize',
  label: 'Card Size',
  type: 'select',
  defaultValue: 'lg',
  required: true,
  options: [
    { label: 'Small', value: 'sm' },
    { label: 'Medium', value: 'md' },
    { label: 'Large', value: 'lg' },
  ],
  admin: {
    description: 'Controls card proportion, media size, spacing, and typography.',
  },
} satisfies SelectField,
```

Apply `admin.condition: usesOverlayCards` to Overlay Tone and Overlay Strength while retaining the existing description on Overlay Tone.

- [ ] **Step 4: Add normalized public types**

In `types.ts`, add:

```ts
export type DepartmentProfilesCardLayout = 'inline' | 'overlay'
export type DepartmentProfilesCardSize = 'lg' | 'md' | 'sm'
```

Change the profile image property to:

```ts
image?: {
  alt: string
  height?: number
  src: string
  width?: number
}
```

- [ ] **Step 5: Run the focused test**

Run the focused Vitest command. Expected: schema assertions pass; presentation assertions may still fail only after the next task adds them.

---

### Task 2: Normalize Optional Media and Resolve Layout Defaults

**Files:**

- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `src/blocks/DepartmentProfiles/Component.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`

**Interfaces:**

- Consumes `DepartmentProfilesCardLayout`, `DepartmentProfilesCardSize`, and optional normalized media.
- Produces resolved `cardLayout` and `cardSize` client props.
- Preserves profiles with valid name/department even when `getMediaImageProps()` returns nothing.

- [ ] **Step 1: Add failing normalization and legacy-fallback tests**

Render one profile without media and assert it remains in output. Assert absent layout values produce:

```tsx
expect(html).toContain('data-department-profiles-card-layout="overlay"')
expect(html).toContain('data-department-profiles-card-size="lg"')
expect(html).toContain('data-department-profile-placeholder="true"')
```

Also render `cardLayout="inline" cardSize="sm"` and assert those data attributes are forwarded.

- [ ] **Step 2: Run the focused test and verify failure**

Expected: the no-image profile is omitted and layout/size attributes are absent.

- [ ] **Step 3: Resolve the new values in the server component**

Add the new properties to `DepartmentProfilesBlockLike`, import their types, and normalize using explicit sets:

```ts
const validCardLayouts = new Set<DepartmentProfilesCardLayout>(['inline', 'overlay'])
const validCardSizes = new Set<DepartmentProfilesCardSize>(['lg', 'md', 'sm'])

const resolvedCardLayout = validCardLayouts.has(cardLayout ?? 'overlay')
  ? (cardLayout ?? 'overlay')
  : 'overlay'
const resolvedCardSize = validCardSizes.has(cardSize ?? 'lg') ? (cardSize ?? 'lg') : 'lg'
```

Normalize media without rejecting the profile:

```ts
const image = getMediaImageProps({
  fallbackAlt: name,
  media: profile.image as Media | string | number | null | undefined,
  preset: 'generic',
})

return [
  {
    departmentId: department.id,
    departmentName: department.name,
    designation: profile.designation?.trim() || undefined,
    id: profile.id ?? index,
    image: image ?? undefined,
    imagePosition,
    name,
  },
]
```

Pass `cardLayout` and `cardSize` to the client.

- [ ] **Step 4: Extend the client prop boundary**

Add the two typed props to `DepartmentProfilesClientProps`, accept them, and add stable directory attributes:

```tsx
data-department-profiles-card-layout={cardLayout}
data-department-profiles-card-size={cardSize}
```

- [ ] **Step 5: Run the focused test**

Expected: normalization and forwarding assertions pass.

---

### Task 3: Build the Overlay and Inline Card Presentations

**Files:**

- Create: `src/blocks/DepartmentProfiles/DepartmentProfileCard.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Modify: `src/styles/custom.css`
- Modify: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Produces `DepartmentProfileCard(props)` with `background`, `hasSectionHeading`, `imageSizes`, `layout`, `overlayStyle`, `profile`, `size`, and `themeMode`.
- Keeps `DepartmentProfilesClient` responsible only for directory interaction and grid composition.

- [ ] **Step 1: Add failing presentation tests**

Cover the following concrete behavior:

```tsx
expect(largeOverlay).toContain('aspect-4/5')
expect(mediumOverlay).toContain('aspect-square')
expect(smallOverlay).toContain('aspect-5/4')
expect(inline).toContain('data-department-profile-layout="inline"')
expect(inline.indexOf('Doctor 1')).toBeLessThan(inline.indexOf('Professor 1'))
expect(inline.indexOf('Professor 1')).toBeLessThan(inline.indexOf('General Medicine'))
expect(withoutImage).toContain('data-department-profile-placeholder="true"')
expect(withoutImage).toContain('lucide-user-round')
```

Retain assertions that cards are articles without links or buttons.

- [ ] **Step 2: Run the focused test and verify failure**

Expected: inline, proportions, and placeholder assertions fail.

- [ ] **Step 3: Implement the focused card component**

Create class maps that make every size deterministic:

```ts
const overlaySizeClasses = {
  lg: {
    card: 'aspect-4/5',
    content: 'gap-1 p-5 pt-20',
    department: 'text-xs leading-5',
    designation: 'text-xs leading-5',
    name: 'text-lg leading-tight',
  },
  md: {
    card: 'aspect-square',
    content: 'gap-1 p-4 pt-16',
    department: 'text-[0.6875rem] leading-4',
    designation: 'text-xs leading-4',
    name: 'text-base leading-tight',
  },
  sm: {
    card: 'aspect-5/4',
    content: 'gap-0.5 p-3.5 pt-12',
    department: 'text-[0.625rem] leading-4',
    designation: 'text-[0.6875rem] leading-4',
    name: 'text-sm leading-tight',
  },
} as const

const inlineSizeClasses = {
  lg: { card: 'gap-5 p-5', image: 'size-24', name: 'text-lg', designation: 'text-sm' },
  md: { card: 'gap-4 p-4', image: 'size-20', name: 'text-base', designation: 'text-xs' },
  sm: { card: 'gap-3 p-3', image: 'size-16', name: 'text-sm', designation: 'text-xs' },
} as const
```

Use `next/image` only when `profile.image` exists. Otherwise render:

```tsx
<div
  className="flex size-full items-center justify-center bg-muted text-muted-foreground"
  data-department-profile-placeholder="true"
>
  <UserRound aria-hidden="true" className="size-1/3" strokeWidth={1.5} />
</div>
```

For Inline, use `resolveCardSurface('muted', background)`, a rounded border, a shrink-free square media wrapper, and text order Name → Designation → Department. For Overlay, preserve the current resolver, gradient, and text contrast while swapping only the size classes and media fallback.

- [ ] **Step 4: Replace the inline card markup in the directory client**

Import and render:

```tsx
<DepartmentProfileCard
  background={background}
  hasSectionHeading={hasSectionHeading}
  imageSizes={imageSizes[columns]}
  layout={cardLayout}
  overlayStyle={overlayStyle}
  profile={profile}
  size={cardSize}
  themeMode={themeMode}
/>
```

Keep existing keys, grid classes, filtering, and pagination untouched.

- [ ] **Step 5: Extend SNMIH’s department accent safely**

Add an `inline` accent-surface selector in `custom.css`: use the contrast-tested deep success/foreground mix on light muted cards and `var(--ring)` in dark mode. Do not override the card name or designation colors.

- [ ] **Step 6: Run focused tests, TypeScript, and lint**

Run:

```bash
pnpm exec vitest run tests/int/department-profiles.int.spec.tsx
pnpm exec tsc --noEmit --pretty false
pnpm exec eslint src/blocks/DepartmentProfiles tests/int/department-profiles.int.spec.tsx
```

Expected: all commands pass.

---

### Task 4: Regenerate Payload Artifacts and Refresh the Block Preview

**Files:**

- Modify generated: `src/payload-types.ts`
- Modify generated if changed: `src/app/(payload)/admin/importMap.js`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Replace: `public/block-thumbnails/department-profiles.jpg`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`

**Interfaces:**

- Generated `DepartmentProfilesBlock` exposes required authoring fields `cardLayout` and `cardSize` plus optional profile `image`; the runtime component still accepts absent legacy values.
- The thumbnail fixture demonstrates Inline Medium with at least one placeholder profile so both new capabilities are visible.

- [ ] **Step 1: Regenerate types and import map**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: generated types include required `cardLayout: 'overlay' | 'inline'`, required `cardSize: 'sm' | 'md' | 'lg'`, and optional profile media.

- [ ] **Step 2: Update the production thumbnail fixture**

Set the Department Profiles fixture to `cardLayout="inline"`, `cardSize="md"`, retain multiple departments, and omit one profile image to demonstrate the fallback without inventing factual profile data.

- [ ] **Step 3: Regenerate and inspect the targeted thumbnail**

Run the repository thumbnail generator for `departmentProfiles`. Expected: a 1600×900 JPEG showing readable Inline Medium rows, balanced spacing, and one `UserRound` placeholder without clipping at desktop width.

- [ ] **Step 4: Update current documentation**

Update only the Department Profiles entries in the guide, feature inventory, and block-system reference to describe both layouts, optional images, fallback icon, proportions, and compatibility defaults. Do not reformat adjacent tables or rewrite historical specifications.

---

### Task 5: Complete Repository Verification

**Files:**

- Modify generated: `.agents/skills/project-context/references/project-inventory.json`
- Inspect all files listed in Tasks 1–4.

**Interfaces:**

- Confirms the repository block contract, generated schema, themes, and documentation remain synchronized.

- [ ] **Step 1: Run the required project-context update**

Run `pnpm project-context:update`. Expected: the inventory records the new presentation module and current hashes.

- [ ] **Step 2: Run affected contract tests**

Run the Department Profiles test plus page registration, system block, thumbnail, theme, and project-context contract suites. Expected: all affected tests pass.

- [ ] **Step 3: Run static verification**

Run TypeScript, focused ESLint, and `git diff --check`. Expected: zero errors.

- [ ] **Step 4: Run the required project-context check**

Run `pnpm project-context:check`. Expected: `Project context is current`; a stale knowledge-graph commit warning is informational.

- [ ] **Step 5: Inspect the final diff**

Confirm existing staged/user changes remain intact, no unrelated formatting churn was introduced, no dependency changed, and no commit was created.
