# Department Profiles Featured Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional, department-aware featured Profile Carousel above the existing Department Profiles directory while keeping profiles authored once and preserving the current directory behavior.

**Architecture:** Extend the existing Department Profiles schema and normalized profile model with a Featured flag. Extract the Profile Carousel card-collection decision into a section-free shared component, then let `DepartmentProfilesClient` filter that shared collection from its existing active-department and search state. The parent Department Profiles block retains section ownership, while the standalone Profile Carousel keeps its existing public output.

**Tech Stack:** Payload CMS 3.85 fields and validation, Next.js 16, React 19, TypeScript, Tailwind CSS 4, Embla-backed shadcn Carousel, Vitest, Testing Library.

## Global Constraints

- Extend `departmentProfiles`; do not register a second block.
- Keep the existing profiles array as the only authoring source and preserve its authored order.
- Default `showFeaturedCarousel` and every profile's `featured` value to `false`; do not migrate or backfill content.
- Render 1–4 featured profiles with the existing static responsive Profile Carousel grid and 5–12 with its existing manual looping carousel; do not add autoplay.
- All displays every featured profile; a selected department displays only that department's featured profiles.
- Hide the complete featured region for any non-empty normalized search query; keep the directory and its title visible.
- Featured profiles remain in the directory.
- Allow at most 12 featured profiles and require an image for every authored featured profile; non-featured directory profiles may remain image-less.
- Department Profiles owns outer background, container, padding, header, and actions; never nest the standalone Profile Carousel section.
- Preserve deliberately blank featured/directory labels; Payload defaults provide copy for new records, while runtime rendering must not invent replacement headings.
- Use sans-serif subsection titles. The display font remains reserved for the parent section title.
- Feature-disabled rendering must preserve the current directory structure without new titles or spacing.
- Do not stage or commit changes. End each task with a diff/test checkpoint only.
- After implementation, run the required project-context update/check loop.

---

## File Map

- Modify `src/blocks/DepartmentProfiles/config.ts`: add editor fields, conditional visibility, and featured-profile validation.
- Modify `src/blocks/DepartmentProfiles/types.ts`: carry the normalized `featured` state.
- Modify `src/blocks/DepartmentProfiles/Component.tsx`: normalize featured configuration and pass it to the client.
- Modify `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`: render filtered featured profiles between the toolbar and directory.
- Create `src/components/profile-carousel-collection.tsx`: reusable section-free static-grid/manual-carousel collection.
- Modify `src/components/profile-carousel.tsx`: delegate its card collection to the shared component without changing the standalone section.
- Modify `tests/int/profile-carousel.int.spec.ts`: lock the shared extraction and existing 1–4/5–12 behavior.
- Modify `tests/int/department-profiles.int.spec.tsx`: cover schema, validation, normalization, filtering, search suppression, labels, headings, and compatibility.
- Regenerate `src/payload-types.ts`: include the new schema fields.
- Update `.agents/skills/project-context/references/block-system.md`: document the embedded featured-carousel contract.
- Refresh `.agents/skills/project-context/references/project-inventory.json`: record the new shared component and current repository inventory.

---

### Task 1: Add the Payload authoring and validation contract

**Files:**

- Modify: `src/blocks/DepartmentProfiles/config.ts`
- Test: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Produces: `validateFeaturedProfiles(value: unknown): string | true`.
- Produces schema values: `showFeaturedCarousel`, `featuredCarouselTitle`, `directoryTitle`, profile-row `featured`, and prefixed featured-carousel presentation fields.
- Later tasks consume the generated property names exactly as defined here.

- [ ] **Step 1: Add failing schema and validation assertions**

Import `validateFeaturedProfiles` beside the existing validators and extend the schema test with exact assertions:

```tsx
import {
  DepartmentProfilesBlock,
  validateDepartmentRows,
  validateFeaturedProfiles,
  validateProfileDepartment,
} from '@/blocks/DepartmentProfiles/config'

expect(findField(contentFields, 'showFeaturedCarousel')).toMatchObject({
  defaultValue: false,
  type: 'checkbox',
})
expect(findField(contentFields, 'featuredCarouselTitle')).toMatchObject({
  defaultValue: 'Featured Profiles',
  type: 'text',
})
expect(findField(contentFields, 'directoryTitle')).toMatchObject({
  defaultValue: 'Profile Directory',
  type: 'text',
})
expect(findField(contentFields, 'featured')).toMatchObject({
  defaultValue: false,
  type: 'checkbox',
})
expect(
  findField(contentFields, 'featuredCarouselTitle')?.admin?.condition?.(
    {},
    { showFeaturedCarousel: true },
  ),
).toBe(true)
expect(
  findField(contentFields, 'directoryTitle')?.admin?.condition?.(
    {},
    { showFeaturedCarousel: false },
  ),
).toBe(false)

expect(
  findField(themeFields, 'featuredCarouselCardVariant')?.options?.map(({ value }) => value),
).toEqual(['stacked', 'overlay'])
expect(findField(themeFields, 'featuredCarouselSize')?.options?.map(({ value }) => value)).toEqual([
  'compact',
  'default',
  'comfortable',
])
expect(
  findField(themeFields, 'featuredCarouselOverlayAlignment')?.options?.map(({ value }) => value),
).toEqual(['left', 'center', 'right'])
expect(
  findField(themeFields, 'featuredCarouselThemeMode')?.options?.map(({ value }) => value),
).toEqual(['auto', 'light', 'dark', 'brand'])
expect(
  findField(themeFields, 'featuredCarouselOverlayStyle')?.options?.map(({ value }) => value),
).toEqual(['light', 'dark', 'darker'])
expect(
  findField(themeFields, 'featuredCarouselOverlayDirection')?.admin?.condition?.(
    {},
    { featuredCarouselCardVariant: 'overlay', showFeaturedCarousel: true },
  ),
).toBe(true)
expect(
  findField(themeFields, 'featuredCarouselOverlayCoverage')?.admin?.condition?.(
    {},
    { featuredCarouselCardVariant: 'stacked', showFeaturedCarousel: true },
  ),
).toBe(false)
```

Add a focused validation test:

```tsx
it('limits featured profiles and requires featured profile images', () => {
  const featured = (count: number) =>
    Array.from({ length: count }, (_, index) => ({
      featured: true,
      image: index + 1,
      name: `Doctor ${index + 1}`,
    }))

  expect(validateFeaturedProfiles(featured(12))).toBe(true)
  expect(validateFeaturedProfiles(featured(13))).toContain('12')
  expect(
    validateFeaturedProfiles([
      { featured: true, image: null, name: 'Missing Portrait' },
      { featured: false, image: null, name: 'Directory Only' },
    ]),
  ).toContain('Missing Portrait')
  expect(validateFeaturedProfiles([{ featured: false, image: null, name: 'Directory Only' }])).toBe(
    true,
  )
})
```

- [ ] **Step 2: Run the targeted test and confirm it fails for missing fields/export**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because `validateFeaturedProfiles` and the new schema fields do not exist.

- [ ] **Step 3: Add condition helpers and featured validation**

Extend the local data shapes and export the array validator in `config.ts`:

```ts
type FeaturedCarouselSiblingData = {
  featuredCarouselCardVariant?: 'overlay' | 'stacked' | null
  showFeaturedCarousel?: boolean | null
}

type DepartmentProfileValue = {
  featured?: boolean | null
  image?: unknown
  name?: string | null
}

const showsFeaturedCarousel = (_data: unknown, siblingData: FeaturedCarouselSiblingData) =>
  siblingData?.showFeaturedCarousel === true

const usesFeaturedCarouselOverlay = (_data: unknown, siblingData: FeaturedCarouselSiblingData) =>
  siblingData?.showFeaturedCarousel === true &&
  siblingData?.featuredCarouselCardVariant === 'overlay'

export const validateFeaturedProfiles = (value: unknown): string | true => {
  if (!Array.isArray(value)) return true

  const featuredProfiles = (value as DepartmentProfileValue[]).filter(
    (profile) => profile?.featured === true,
  )
  if (featuredProfiles.length > 12) {
    return 'Select no more than 12 featured profiles.'
  }

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

Attach this property to `profilesField` beside `minRows` and `maxRows`:

```ts
validate: validateFeaturedProfiles,
```

Insert this field immediately after `designation` in the profile row fields:

```ts
{
  name: 'featured',
  label: 'Featured in Carousel',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description: 'Show this profile in the optional featured carousel.',
  },
} satisfies CheckboxField,
```

- [ ] **Step 4: Add Content-tab controls**

Place these fields before `departmentsField` so the feature setup precedes its data source:

```ts
{
  name: 'showFeaturedCarousel',
  label: 'Enable Featured Profile Carousel',
  type: 'checkbox',
  defaultValue: false,
} satisfies CheckboxField,
{
  name: 'featuredCarouselTitle',
  label: 'Featured Carousel Title',
  type: 'text',
  defaultValue: 'Featured Profiles',
  admin: { condition: showsFeaturedCarousel },
},
{
  name: 'directoryTitle',
  label: 'Directory Title',
  type: 'text',
  defaultValue: 'Profile Directory',
  admin: { condition: showsFeaturedCarousel },
},
```

- [ ] **Step 5: Add prefixed Theme Settings controls**

Place these after the directory's overlay fields and before section alignment fields:

```ts
{
  name: 'featuredCarouselCardVariant',
  label: 'Featured Carousel Card Variant',
  type: 'select',
  defaultValue: 'stacked',
  options: [
    { label: 'Text Below Image', value: 'stacked' },
    { label: 'Image Overlay', value: 'overlay' },
  ],
  admin: { condition: showsFeaturedCarousel },
} satisfies SelectField,
{
  name: 'featuredCarouselSize',
  label: 'Featured Carousel Card Size',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Comfortable', value: 'comfortable' },
  ],
  admin: {
    condition: showsFeaturedCarousel,
    description: 'Controls featured portrait height without changing section padding.',
  },
} satisfies SelectField,
{
  name: 'featuredCarouselOverlayAlignment',
  label: 'Featured Carousel Overlay Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  admin: { condition: usesFeaturedCarouselOverlay },
} satisfies SelectField,
createMediaOverlayToneField({
  condition: usesFeaturedCarouselOverlay,
  name: 'featuredCarouselThemeMode',
  required: false,
}),
createMediaOverlayStrengthField({
  condition: usesFeaturedCarouselOverlay,
  name: 'featuredCarouselOverlayStyle',
  required: false,
}),
createMediaOverlayDirectionField({
  condition: usesFeaturedCarouselOverlay,
  defaultValue: 'bottomToTop',
  name: 'featuredCarouselOverlayDirection',
  required: false,
}),
createMediaOverlayCoverageField({
  condition: usesFeaturedCarouselOverlay,
  name: 'featuredCarouselOverlayCoverage',
  required: false,
}),
```

- [ ] **Step 6: Run the schema test and inspect the unstaged diff**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
git diff --check -- src/blocks/DepartmentProfiles/config.ts tests/int/department-profiles.int.spec.tsx
```

Expected: the schema/validation test passes; `git diff --check` prints nothing. Do not stage or commit.

---

### Task 2: Extract the section-free shared Profile Carousel collection

**Files:**

- Create: `src/components/profile-carousel-collection.tsx`
- Modify: `src/components/profile-carousel.tsx`
- Test: `tests/int/profile-carousel.int.spec.ts`

**Interfaces:**

- Consumes existing `ProfileCarouselCard`, `ProfileCarouselClient`, and their exported presentation types.
- Produces `ProfileCarouselCollection(props)` with `profiles`, `sectionBackground`, card variant, size, and overlay settings.
- The collection renders no `<section>`, section header, outer container, block padding, or actions.

- [ ] **Step 1: Add a failing shared-collection contract test**

Import the new component and assert it owns only the existing collection behavior:

```tsx
import { ProfileCarouselCollection } from '@/components/profile-carousel-collection'

it('shares the card collection without creating a nested section', () => {
  const staticHtml = renderToStaticMarkup(
    <ProfileCarouselCollection
      cardVariant="stacked"
      overlayAlignment="left"
      overlayCoverage="full"
      overlayDirection="bottomToTop"
      overlayStyle="dark"
      profiles={profiles.slice(0, 4)}
      sectionBackground="subtle"
      size="default"
      themeMode="auto"
    />,
  )
  const carouselHtml = renderToStaticMarkup(
    <ProfileCarouselCollection
      cardVariant="stacked"
      overlayAlignment="left"
      overlayCoverage="full"
      overlayDirection="bottomToTop"
      overlayStyle="dark"
      profiles={profiles}
      sectionBackground="subtle"
      size="default"
      themeMode="auto"
    />,
  )

  expect(staticHtml).toContain('grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4')
  expect(staticHtml).not.toContain('<section')
  expect(staticHtml).not.toContain('Previous profile')
  expect(carouselHtml).toContain('aria-label="Previous profile"')
  expect(carouselHtml).toContain('data-carousel-loop="true"')
  expect(carouselHtml).not.toContain('<section')
})
```

- [ ] **Step 2: Run the Profile Carousel test and confirm the missing module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL because `@/components/profile-carousel-collection` does not exist.

- [ ] **Step 3: Create the shared collection**

Create `src/components/profile-carousel-collection.tsx` with the extracted branch and no outer section:

```tsx
import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import {
  ProfileCarouselCard,
  type ProfileCarouselCardVariant,
  type ProfileCarouselOverlayAlignment,
  type ProfileCarouselProfile,
  type ProfileCarouselSize,
} from '@/components/profile-carousel-card'
import { ProfileCarouselClient } from '@/components/profile-carousel-client'

export type ProfileCarouselCollectionProps = {
  cardVariant: ProfileCarouselCardVariant
  overlayAlignment: ProfileCarouselOverlayAlignment
  overlayCoverage: MediaOverlayCoverage
  overlayDirection: MediaOverlayDirection
  overlayStyle: MediaOverlayStrength
  profiles: ProfileCarouselProfile[]
  sectionBackground: BlockBackground
  size: ProfileCarouselSize
  themeMode: MediaOverlayTone
}

export function ProfileCarouselCollection({
  cardVariant,
  overlayAlignment,
  overlayCoverage,
  overlayDirection,
  overlayStyle,
  profiles,
  sectionBackground,
  size,
  themeMode,
}: ProfileCarouselCollectionProps) {
  const visibleProfiles = profiles.slice(0, 12)
  if (!visibleProfiles.length) return null

  if (visibleProfiles.length > 4) {
    return (
      <ProfileCarouselClient
        cardVariant={cardVariant}
        overlayAlignment={overlayAlignment}
        overlayCoverage={overlayCoverage}
        overlayDirection={overlayDirection}
        overlayStyle={overlayStyle}
        profiles={visibleProfiles}
        sectionBackground={sectionBackground}
        size={size}
        themeMode={themeMode}
      />
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {visibleProfiles.map((profile, index) => (
        <ProfileCarouselCard
          key={`${profile.name}-${index}`}
          overlayAlignment={overlayAlignment}
          overlayCoverage={overlayCoverage}
          overlayDirection={overlayDirection}
          overlayStyle={overlayStyle}
          profile={profile}
          sectionBackground={sectionBackground}
          size={size}
          themeMode={themeMode}
          variant={cardVariant}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Delegate the standalone wrapper to the collection**

In `src/components/profile-carousel.tsx`, replace direct imports of `ProfileCarouselCard` and `ProfileCarouselClient` with `ProfileCarouselCollection`, retain the exported types from `profile-carousel-card`, and replace the current collection branch with:

```tsx
<div className={profileMarginClasses[resolvedSize]}>
  <ProfileCarouselCollection
    cardVariant={cardVariant}
    overlayAlignment={overlayAlignment}
    overlayCoverage={overlayCoverage}
    overlayDirection={overlayDirection}
    overlayStyle={overlayStyle}
    profiles={visibleProfiles}
    sectionBackground={sectionBackground}
    size={resolvedSize}
    themeMode={themeMode}
  />
</div>
```

Keep `visibleProfiles`, `usesCarousel`, the root data attributes, section header, actions, margin classes, and all defaults unchanged.

- [ ] **Step 5: Prove standalone markup and collection boundaries remain stable**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/profile-carousel.int.spec.ts
git diff --check -- src/components/profile-carousel.tsx src/components/profile-carousel-collection.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: every existing Profile Carousel assertion plus the new section-free test passes; no whitespace errors. Do not stage or commit.

---

### Task 3: Integrate featured profiles into Department Profiles state and rendering

**Files:**

- Modify: `src/blocks/DepartmentProfiles/types.ts`
- Modify: `src/blocks/DepartmentProfiles/Component.tsx`
- Modify: `src/blocks/DepartmentProfiles/DepartmentProfilesClient.tsx`
- Test: `tests/int/department-profiles.int.spec.tsx`

**Interfaces:**

- Consumes `ProfileCarouselCollection` from Task 2.
- Extends `ResolvedDepartmentProfile` with `featured: boolean`.
- `DepartmentProfilesClient` accepts optional feature properties with safe defaults so existing direct consumers remain compatible.
- Produces the visitor order: toolbar, featured subsection when eligible, directory subsection, grid/load more.

- [ ] **Step 1: Add failing normalization and interaction tests**

Update `createProfile` to default `featured: false`, then add tests that verify server normalization and client state:

```tsx
const createProfile = (
  id: number,
  overrides: Partial<ResolvedDepartmentProfile> = {},
): ResolvedDepartmentProfile => ({
  departmentId: 'medicine',
  departmentName: 'General Medicine',
  designation: `Professor ${id}`,
  featured: false,
  id,
  image: { alt: `Profile ${id}`, height: 1200, src: '/media/profile.jpg', width: 900 },
  imagePosition: 'center',
  name: `Doctor ${id}`,
  ...overrides,
})
```

Add a server-rendering test for labels, variants, heading levels, and invalid legacy media:

```tsx
it('normalizes featured profiles into the shared carousel presentation', () => {
  const html = renderToStaticMarkup(
    <DepartmentProfilesBlockComponent
      departments={departments}
      directoryTitle="Faculty Directory"
      featuredCarouselCardVariant="overlay"
      featuredCarouselOverlayAlignment="center"
      featuredCarouselOverlayCoverage="split"
      featuredCarouselOverlayDirection="rightToLeft"
      featuredCarouselOverlayStyle="darker"
      featuredCarouselThemeMode="light"
      featuredCarouselTitle="Featured Faculty"
      profiles={[
        {
          departmentId: 'medicine',
          designation: 'Professor',
          featured: true,
          image: { alt: 'Dr A', id: 1, url: '/a.jpg' },
          name: 'Dr A',
        },
        { departmentId: 'anatomy', featured: true, name: 'Legacy Missing Image' },
      ]}
      showFeaturedCarousel
      title="Department Profiles"
    />,
  )

  expect(html).toContain('data-department-profiles-featured="true"')
  expect(html).toContain('Featured Faculty')
  expect(html).toContain('Faculty Directory')
  expect(html).toMatch(/<h3[^>]*>Featured Faculty<\/h3>/)
  expect(html).toContain('data-profile-carousel-card-variant="overlay"')
  expect(html).toContain('data-profile-carousel-overlay-alignment="center"')
  expect(html).toContain('data-profile-carousel-overlay-direction="rightToLeft"')
  expect(html).toContain('data-profile-carousel-overlay-coverage="split"')
  expect(html).toContain('Dr A')
  expect(html).toContain('Legacy Missing Image')
  expect(html.match(/data-profile-carousel-media-frame="true"/g)).toHaveLength(1)
})
```

Add an interactive test for filter ownership, search suppression, restoration, and directory duplication:

```tsx
it('filters featured profiles by department and hides them while searching', () => {
  const profiles = [
    createProfile(1, { featured: true, name: 'Medicine Featured' }),
    createProfile(2, {
      departmentId: 'anatomy',
      departmentName: 'Anatomy',
      featured: true,
      name: 'Anatomy Featured',
    }),
    createProfile(3, { name: 'Directory Only' }),
  ]
  const { container } = render(
    <DepartmentProfilesClient
      {...baseClientProps}
      directoryTitle="Profile Directory"
      featuredCarouselTitle="Featured Profiles"
      profiles={profiles}
      showFeaturedCarousel
    />,
  )

  const featuredRegion = () => container.querySelector('[data-department-profiles-featured="true"]')

  expect(featuredRegion()?.textContent).toContain('Medicine Featured')
  expect(featuredRegion()?.textContent).toContain('Anatomy Featured')
  expect(screen.getAllByText('Medicine Featured')).toHaveLength(2)

  fireEvent.click(screen.getByRole('tab', { name: 'Anatomy' }))
  expect(featuredRegion()?.textContent).not.toContain('Medicine Featured')
  expect(featuredRegion()?.textContent).toContain('Anatomy Featured')

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search profiles' }), {
    target: { value: 'anatomy' },
  })
  expect(featuredRegion()).toBeNull()
  expect(screen.getByRole('heading', { name: 'Profile Directory' })).toBeTruthy()

  fireEvent.change(screen.getByRole('searchbox', { name: 'Search profiles' }), {
    target: { value: '' },
  })
  expect(featuredRegion()?.textContent).toContain('Anatomy Featured')
})
```

Add compatibility assertions:

```tsx
const disabledHtml = renderClient()
expect(disabledHtml).not.toContain('Featured Profiles')
expect(disabledHtml).not.toContain('Profile Directory')
expect(disabledHtml).not.toContain('data-department-profiles-featured="true"')

const noHeadingHtml = renderToStaticMarkup(
  <DepartmentProfilesBlockComponent
    departments={departments}
    featuredCarouselTitle="Featured Profiles"
    profiles={[
      {
        departmentId: 'medicine',
        featured: true,
        image: { alt: 'Dr A', id: 1, url: '/a.jpg' },
        name: 'Dr A',
      },
    ]}
    showFeaturedCarousel
  />,
)
expect(noHeadingHtml).toMatch(/<h2[^>]*>Featured Profiles<\/h2>/)
```

- [ ] **Step 2: Run the Department Profiles test and confirm type/property failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL because the normalized profile and client/server props do not yet expose featured configuration.

- [ ] **Step 3: Extend the normalized profile model and server input type**

In `types.ts` add the required flag:

```ts
export type ResolvedDepartmentProfile = {
  departmentId: string
  departmentName: string
  designation?: string
  featured: boolean
  id: number | string
  image?: {
    alt: string
    height?: number
    src: string
    width?: number
  }
  imagePosition: DepartmentProfileImagePosition
  name: string
}
```

In `Component.tsx`, add `featured?: boolean | null` to the existing `DepartmentProfileValue`. Add these exact members to `DepartmentProfilesBlockLike`:

```ts
directoryTitle?: string | null
featuredCarouselCardVariant?: ProfileCarouselCardVariant | null
featuredCarouselOverlayAlignment?: ProfileCarouselOverlayAlignment | null
featuredCarouselOverlayCoverage?: MediaOverlayCoverage | null
featuredCarouselOverlayDirection?: MediaOverlayDirection | null
featuredCarouselOverlayStyle?: MediaOverlayStrength | null
featuredCarouselSize?: Exclude<ProfileCarouselSize, 'none'> | null
featuredCarouselThemeMode?: MediaOverlayTone | null
featuredCarouselTitle?: string | null
showFeaturedCarousel?: boolean | null
```

Import the three Profile Carousel presentation types from `@/components/profile-carousel-card`.

- [ ] **Step 4: Normalize featured values and presentation defaults**

Add valid sets and normalize inputs before render:

```ts
const validFeaturedCarouselCardVariants = new Set<ProfileCarouselCardVariant>([
  'overlay',
  'stacked',
])
const validFeaturedCarouselOverlayAlignments = new Set<ProfileCarouselOverlayAlignment>([
  'center',
  'left',
  'right',
])
const validFeaturedCarouselSizes = new Set<Exclude<ProfileCarouselSize, 'none'>>([
  'comfortable',
  'compact',
  'default',
])
```

Add `featured: profile.featured === true` to each normalized profile. Trim copy without replacing an intentionally blank editor value, and normalize appearance with safe fallbacks:

```ts
const resolvedDirectoryTitle = directoryTitle?.trim()
const resolvedFeaturedCarouselCardVariant = validFeaturedCarouselCardVariants.has(
  featuredCarouselCardVariant ?? 'stacked',
)
  ? (featuredCarouselCardVariant ?? 'stacked')
  : 'stacked'
const resolvedFeaturedCarouselOverlayAlignment = validFeaturedCarouselOverlayAlignments.has(
  featuredCarouselOverlayAlignment ?? 'left',
)
  ? (featuredCarouselOverlayAlignment ?? 'left')
  : 'left'
const resolvedFeaturedCarouselOverlayDirection = normalizeMediaOverlayDirection(
  featuredCarouselOverlayDirection,
  'bottomToTop',
)
const resolvedFeaturedCarouselOverlayCoverage = normalizeMediaOverlayCoverage(
  featuredCarouselOverlayCoverage,
  resolvedFeaturedCarouselOverlayDirection,
)
const resolvedFeaturedCarouselOverlayStyle = normalizeMediaOverlayStrength(
  featuredCarouselOverlayStyle,
  'dark',
)
const resolvedFeaturedCarouselSize = validFeaturedCarouselSizes.has(
  featuredCarouselSize ?? 'default',
)
  ? (featuredCarouselSize ?? 'default')
  : 'default'
const resolvedFeaturedCarouselThemeMode = normalizeMediaOverlayTone(
  featuredCarouselThemeMode,
  'auto',
)
const resolvedFeaturedCarouselTitle = featuredCarouselTitle?.trim()
```

Pass every resolved value plus `showFeaturedCarousel={showFeaturedCarousel === true}` to `DepartmentProfilesClient`.

- [ ] **Step 5: Add optional client props and derive the featured set**

Import `ProfileCarouselCollection` and Profile Carousel types. Add these optional properties to `DepartmentProfilesClientProps`:

```ts
directoryTitle?: string
featuredCarouselCardVariant?: ProfileCarouselCardVariant
featuredCarouselOverlayAlignment?: ProfileCarouselOverlayAlignment
featuredCarouselOverlayCoverage?: MediaOverlayCoverage
featuredCarouselOverlayDirection?: MediaOverlayDirection
featuredCarouselOverlayStyle?: MediaOverlayStrength
featuredCarouselSize?: Exclude<ProfileCarouselSize, 'none'>
featuredCarouselThemeMode?: MediaOverlayTone
featuredCarouselTitle?: string
showFeaturedCarousel?: boolean
```

```ts
featuredCarouselCardVariant = 'stacked',
featuredCarouselOverlayAlignment = 'left',
featuredCarouselOverlayCoverage = 'full',
featuredCarouselOverlayDirection = 'bottomToTop',
featuredCarouselOverlayStyle = 'dark',
featuredCarouselSize = 'default',
featuredCarouselThemeMode = 'auto',
showFeaturedCarousel = false,
```

Derive presentation profiles from the current department without applying the search query:

```ts
const featuredProfiles = useMemo(
  () =>
    profiles.flatMap((profile): ProfileCarouselProfile[] => {
      if (!showFeaturedCarousel || !profile.featured || !profile.image) return []
      if (activeId !== 'all' && profile.departmentId !== activeId) return []

      return [
        {
          department: profile.departmentName,
          image: profile.image,
          imagePosition: profile.imagePosition,
          name: profile.name,
          role: profile.designation,
        },
      ]
    }),
  [activeId, profiles, showFeaturedCarousel],
)
const showFeaturedRegion = showFeaturedCarousel && !normalizedQuery && featuredProfiles.length > 0
const SubsectionHeading = hasSectionHeading ? 'h3' : 'h2'
```

- [ ] **Step 6: Render the two subsections in the approved order**

After the toolbar and before the live status, render the featured region. Use sans typography and key the collection by department:

```tsx
{
  showFeaturedRegion ? (
    <div className="flex min-w-0 flex-col gap-5 md:gap-6" data-department-profiles-featured="true">
      {featuredCarouselTitle ? (
        <SubsectionHeading className="font-sans text-xl leading-tight font-semibold tracking-tight text-current sm:text-2xl">
          {featuredCarouselTitle}
        </SubsectionHeading>
      ) : null}
      <ProfileCarouselCollection
        key={activeId}
        cardVariant={featuredCarouselCardVariant}
        overlayAlignment={featuredCarouselOverlayAlignment}
        overlayCoverage={featuredCarouselOverlayCoverage}
        overlayDirection={featuredCarouselOverlayDirection}
        overlayStyle={featuredCarouselOverlayStyle}
        profiles={featuredProfiles}
        sectionBackground={background}
        size={featuredCarouselSize}
        themeMode={featuredCarouselThemeMode}
      />
    </div>
  ) : null
}
```

Immediately before the live status/directory tabpanel, render the directory title only when the feature is enabled:

```tsx
{
  showFeaturedCarousel && directoryTitle ? (
    <SubsectionHeading
      className="font-sans text-xl leading-tight font-semibold tracking-tight text-current sm:text-2xl"
      data-department-profiles-directory-title="true"
    >
      {directoryTitle}
    </SubsectionHeading>
  ) : null
}
```

Do not change `filteredProfiles`, `visibleProfiles`, the tabpanel, card grid, empty state, or Load More branch.

- [ ] **Step 7: Run interaction, server-rendering, and shared-carousel tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
git diff --check -- src/blocks/DepartmentProfiles src/components/profile-carousel.tsx src/components/profile-carousel-collection.tsx tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: both suites pass and `git diff --check` prints nothing. Do not stage or commit.

---

### Task 4: Regenerate types and complete repository verification

**Files:**

- Modify (generated): `src/payload-types.ts`
- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify (generated): `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes the final Payload schema from Task 1.
- Produces generated `DepartmentProfilesBlock` properties that match the runtime input names.
- Produces current maintained project context required by `AGENTS.md`.

- [ ] **Step 1: Extend generated-type assertions before regeneration**

Add these exact assertions to the existing generated contract test:

```tsx
expect(generatedDepartmentProfiles).toContain('showFeaturedCarousel?: boolean | null')
expect(generatedDepartmentProfiles).toContain('featuredCarouselTitle?: string | null')
expect(generatedDepartmentProfiles).toContain('directoryTitle?: string | null')
expect(generatedDepartmentProfiles).toContain('featured?: boolean | null')
expect(generatedDepartmentProfiles).toContain(
  "featuredCarouselCardVariant?: ('stacked' | 'overlay') | null",
)
expect(generatedDepartmentProfiles).toContain(
  "featuredCarouselSize?: ('compact' | 'default' | 'comfortable') | null",
)
expect(generatedDepartmentProfiles).toContain(
  "featuredCarouselOverlayAlignment?: ('left' | 'center' | 'right') | null",
)
expect(generatedDepartmentProfiles).toContain(
  "featuredCarouselThemeMode?: ('auto' | 'light' | 'dark' | 'brand') | null",
)
expect(generatedDepartmentProfiles).toContain(
  "featuredCarouselOverlayStyle?: ('light' | 'dark' | 'darker') | null",
)
expect(generatedDepartmentProfiles).toContain(
  "featuredCarouselOverlayDirection?: ('vertical' | 'leftToRight' | 'rightToLeft' | 'bottomToTop' | 'topToBottom') | null",
)
expect(generatedDepartmentProfiles).toContain(
  "featuredCarouselOverlayCoverage?: ('full' | 'split') | null",
)
```

- [ ] **Step 2: Run the test and confirm stale generated types fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx
```

Expected: FAIL only on the new generated-type assertions.

- [ ] **Step 3: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` changes and contains all new optional fields under `DepartmentProfilesBlock`.

- [ ] **Step 4: Update the maintained block contract**

Extend the Department Profiles paragraph in `block-system.md` with this explicit contract:

```markdown
Its optional featured area is derived from the same ordered profile rows: editors mark up to twelve
image-backed profiles as Featured, and the shared Profile Carousel collection appears after the shared
search/department toolbar. All shows every featured profile; department tabs filter both featured and
directory profiles; any active search hides the featured area while leaving the full directory search
active. One through four featured profiles use the static responsive row and five through twelve use
the manual looping carousel. Featured profiles remain in the directory, and the parent Department
Profiles section continues to own appearance, spacing, actions, and subsection heading hierarchy.
```

- [ ] **Step 5: Run focused and repository-level verification**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DepartmentProfiles src/components/profile-carousel.tsx src/components/profile-carousel-collection.tsx tests/int/department-profiles.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: all commands exit 0. If an unrelated pre-existing repository error appears, record its exact file/message and keep the feature-specific suites green.

- [ ] **Step 6: Run the mandatory project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: the inventory refreshes and the context check exits 0.

- [ ] **Step 7: Perform the final no-commit review**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; only intended uncommitted files plus the user's previously existing work are listed. Do not stage or commit.

## Final Acceptance Checklist

- Feature disabled: existing Department Profiles markup has no new subsection titles or featured spacing.
- Feature enabled: toolbar controls both regions; featured comes before the titled directory.
- Search: any non-empty trimmed query removes the complete featured region and clearing it restores the active department's set.
- Department tabs: All and department-specific sets preserve source order and reset manual-carousel position.
- Presentation: 1–4 is static, 5–12 is manual/looping, both standalone and embedded use identical Profile Carousel cards.
- Content: featured profiles are not removed from directory results.
- Validation: 13 featured profiles fail, featured missing images fail, non-featured missing images remain valid.
- Themes: section background is passed to the shared card surface/overlay resolver for light, dark, subtle, brand, and gradient surfaces.
- Semantics: no nested standalone carousel section; subsection headings are h3 beneath a parent h2 and h2 when the parent has no title; titles use sans typography.
- Compatibility: malformed legacy featured media is omitted only from the featured area and remains represented by the existing directory placeholder.
- Verification: generated types, focused tests, TypeScript, scoped lint, and project-context checks pass.
