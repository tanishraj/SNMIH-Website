# Leadership Profiles Image Overlay Variant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a block-wide Image Overlay card layout to Leadership Profiles using the shared media-overlay configuration and presentation system while preserving the current Standard layout.

**Architecture:** Extend the existing Payload block with one layout discriminator and four conditional shared overlay fields. Normalize those values in the server component, keep the current card renderer as the Standard branch, and add a portrait `4:5` overlay branch that consumes `resolveMediaOverlay`; existing documents continue through the Standard fallback without migration.

**Tech Stack:** Payload CMS, React Server Components, Next.js Image, Tailwind CSS v4, Vitest, TypeScript

## Global Constraints

- `Standard` remains the saved default and runtime fallback.
- Image Overlay displays only Leadership Label, Name, and Designation.
- Qualification and Expertise remain saved and reappear when Standard is selected.
- Overlay Tone, Strength, Direction, and Coverage are block-wide and conditionally visible only for Image Overlay.
- Image Overlay uses a fixed `4:5` portrait ratio and preserves per-profile image positioning.
- Cards remain non-clickable with no buttons, links, hover interactions, or client state.
- Preserve existing profile normalization, header behavior, actions, spacing, semantic heading levels, responsive columns, and legacy card-surface fallback.
- Do not stage or commit changes.

---

### Task 1: Add the Card Layout and Conditional Overlay Schema

**Files:**

- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Modify: `src/blocks/LeadershipProfiles/config.ts`

**Interfaces:**

- Consumes: `createMediaOverlayToneField`, `createMediaOverlayStrengthField`, `createMediaOverlayDirectionField`, and `createMediaOverlayCoverageField` from `src/blocks/shared/mediaOverlayFields.ts`.
- Produces: `cardLayout`, `themeMode`, `overlayStyle`, `overlayDirection`, and `overlayCoverage` fields on `LeadershipProfilesBlock`.

- [ ] **Step 1: Add failing schema contracts**

Extend the Theme Settings test with these assertions:

```tsx
const cardLayout = findField(themeFields, 'cardLayout')
expect(cardLayout).toMatchObject({
  defaultValue: 'standard',
  required: true,
  type: 'select',
})
expect(cardLayout?.options?.map(({ value }) => value)).toEqual(['standard', 'imageOverlay'])

const cardBackground = findField(themeFields, 'cardBackground')
expect(cardBackground?.admin?.condition?.({}, { cardLayout: 'standard' })).toBe(true)
expect(cardBackground?.admin?.condition?.({}, { cardLayout: 'imageOverlay' })).toBe(false)

for (const [name, defaultValue] of [
  ['themeMode', 'dark'],
  ['overlayStyle', 'dark'],
  ['overlayDirection', 'bottomToTop'],
  ['overlayCoverage', 'full'],
] as const) {
  const field = findField(themeFields, name)
  expect(field).toMatchObject({ defaultValue, required: true, type: 'select' })
  expect(field?.admin?.condition?.({}, { cardLayout: 'imageOverlay' })).toBe(true)
  expect(field?.admin?.condition?.({}, { cardLayout: 'standard' })).toBe(false)
}
```

- [ ] **Step 2: Run the focused test and verify the schema contract fails**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: failure because `cardLayout` and the four overlay fields are not registered yet.

- [ ] **Step 3: Add the conditional fields to the Payload configuration**

Import the four shared overlay field factories and add the sibling-data conditions:

```ts
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

type CardLayoutSiblingData = {
  cardLayout?: 'imageOverlay' | 'standard' | null
}

const usesStandardCardLayout = (_data: unknown, siblingData: CardLayoutSiblingData) =>
  siblingData?.cardLayout !== 'imageOverlay'

const usesImageOverlayCardLayout = (_data: unknown, siblingData: CardLayoutSiblingData) =>
  siblingData?.cardLayout === 'imageOverlay'
```

Create the shared card-background field once so its existing admin configuration can be preserved while adding the condition:

```ts
const leadershipCardBackgroundField = createCardBackgroundField({
  defaultOptionLabel: 'Default Card',
  adminDescription:
    'Applies one semantic card surface to every Standard leadership profile for a consistent directory.',
})
```

Insert these controls in Theme Settings immediately after `createBlockAppearanceFields()`:

```ts
{
  name: 'cardLayout',
  label: 'Card Layout',
  type: 'select',
  defaultValue: 'standard',
  required: true,
  options: [
    { label: 'Standard — image above profile details', value: 'standard' },
    { label: 'Image Overlay — portrait image with overlaid identity', value: 'imageOverlay' },
  ],
} satisfies SelectField,
{
  ...leadershipCardBackgroundField,
  admin: {
    ...leadershipCardBackgroundField.admin,
    condition: usesStandardCardLayout,
  },
},
createMediaOverlayToneField({
  condition: usesImageOverlayCardLayout,
  defaultValue: 'dark',
}),
createMediaOverlayStrengthField({
  condition: usesImageOverlayCardLayout,
  defaultValue: 'dark',
}),
createMediaOverlayDirectionField({
  condition: usesImageOverlayCardLayout,
  defaultValue: 'bottomToTop',
}),
createMediaOverlayCoverageField({
  condition: usesImageOverlayCardLayout,
  defaultValue: 'full',
}),
```

- [ ] **Step 4: Run the focused test and verify the schema contract passes**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: the new schema assertions pass; the already identified stale Standard aspect-ratio assertion remains failing until Task 2 updates that contract.

---

### Task 2: Render the Portrait Image Overlay Variant

**Files:**

- Modify: `src/blocks/LeadershipProfiles/types.ts`
- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Modify: `src/blocks/LeadershipProfiles/Component.tsx`

**Interfaces:**

- Consumes: `resolveMediaOverlay` and the media-overlay value types from `src/blocks/shared/mediaOverlayPresentation.ts`.
- Produces: `LeadershipProfilesCardLayout`, Standard and Image Overlay card branches, and stable overlay data attributes for verification.

- [ ] **Step 1: Define the layout type**

Add to `src/blocks/LeadershipProfiles/types.ts`:

```ts
export type LeadershipProfilesCardLayout = 'imageOverlay' | 'standard'
```

- [ ] **Step 2: Add failing Standard cleanup and Image Overlay render contracts**

Update both stale `aspect-[4/3]` references in the Standard-card test to `aspect-4/3`, and assert that the name no longer includes the redundant breakpoint utility:

```tsx
expect(html).toContain('aspect-4/3')
expect(html).not.toContain('sm:text-lg')
```

Add a dedicated overlay test:

```tsx
it('renders the portrait image-overlay layout with shared overlay semantics', () => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      cardLayout="imageOverlay"
      overlayCoverage="split"
      overlayDirection="bottomToTop"
      overlayStyle="darker"
      profiles={[
        {
          designation: 'Dean, Academic Affairs',
          expertise: [{ item: 'Curriculum planning' }],
          image: validImage,
          leadershipLabel: 'Dean, Academics',
          name: 'Dr. Kavita Rao',
          qualification: 'MD (Physiology)',
        },
      ]}
      themeMode="brand"
      title="Leadership"
    />,
  )

  expect(html).toContain('data-leadership-profile-layout="imageOverlay"')
  expect(html).toContain('aspect-4/5')
  expect(html).toContain('data-leadership-profile-overlay="darker"')
  expect(html).toContain('data-leadership-profile-overlay-coverage="split"')
  expect(html).toContain('data-leadership-profile-overlay-direction="bottomToTop"')
  expect(html).toContain('data-leadership-profile-overlay-tone="brand"')
  expect(html).toContain('bg-linear-to-t')
  expect(html).toContain('text-primary-foreground')
  expect(html).toContain('Dean, Academics')
  expect(html).toContain('Dr. Kavita Rao')
  expect(html).toContain('Dean, Academic Affairs')
  expect(html).not.toContain('MD (Physiology)')
  expect(html).not.toContain('Curriculum planning')
  expect(html).not.toMatch(/<(a|button)\b/)
})
```

Add a fallback/default test:

```tsx
it('keeps Standard as the default and runtime fallback while normalizing overlay defaults', () => {
  const standardHtml = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent profiles={[{ image: validImage, name: 'Leader' }]} />,
  )
  const invalidHtml = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      cardLayout={'invalid' as 'standard'}
      profiles={[{ image: validImage, name: 'Leader' }]}
    />,
  )
  const overlayHtml = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      cardLayout="imageOverlay"
      profiles={[{ image: validImage, name: 'Leader' }]}
    />,
  )

  expect(standardHtml).toContain('data-leadership-profile-layout="standard"')
  expect(invalidHtml).toContain('data-leadership-profile-layout="standard"')
  expect(overlayHtml).toContain('data-leadership-profile-overlay="dark"')
  expect(overlayHtml).toContain('data-leadership-profile-overlay-coverage="full"')
  expect(overlayHtml).toContain('data-leadership-profile-overlay-direction="bottomToTop"')
  expect(overlayHtml).toContain('data-leadership-profile-overlay-tone="dark"')
})
```

- [ ] **Step 3: Run the focused test and verify the new render contracts fail**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
```

Expected: failures for the missing Image Overlay branch and the redundant `sm:text-lg` class.

- [ ] **Step 4: Extend component inputs and normalize the layout and overlay**

Add the shared overlay imports and the new layout type:

```ts
import {
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import type {
  LeadershipProfileImagePosition,
  LeadershipProfilesAlignment,
  LeadershipProfilesCardLayout,
  LeadershipProfilesColumns,
  ResolvedLeadershipProfile,
} from './types'
```

Extend `LeadershipProfilesBlockLike`:

```ts
cardLayout?: LeadershipProfilesCardLayout | null
overlayCoverage?: MediaOverlayCoverage | null
overlayDirection?: MediaOverlayDirection | null
overlayStyle?: MediaOverlayStrength | null
themeMode?: MediaOverlayTone | null
```

Add a valid-layout set and resolve the block values:

```ts
const validCardLayouts = new Set<LeadershipProfilesCardLayout>(['standard', 'imageOverlay'])

const resolvedCardLayout = validCardLayouts.has(cardLayout ?? 'standard')
  ? (cardLayout ?? 'standard')
  : 'standard'
const resolvedOverlay = resolveMediaOverlay({
  coverage: overlayCoverage ?? 'full',
  direction: overlayDirection ?? 'bottomToTop',
  sectionBackground: background,
  strength: overlayStyle ?? 'dark',
  tone: themeMode ?? 'dark',
})
```

- [ ] **Step 5: Add the Image Overlay card branch and preserve Standard**

Pass `cardLayout: LeadershipProfilesCardLayout` and `overlay: ReturnType<typeof resolveMediaOverlay>` to `LeadershipProfileCard`. Before the Standard return, add an Image Overlay branch with this structure:

```tsx
if (cardLayout === 'imageOverlay') {
  return (
    <article
      className={cn(
        'relative isolate aspect-4/5 min-w-0 overflow-hidden rounded-xl border border-current/20',
        overlay.text.title,
      )}
      data-block-surface={overlay.blockSurface}
      data-leadership-profile-card="true"
      data-leadership-profile-layout="imageOverlay"
    >
      <Image
        alt={profile.image.alt}
        className={cn('object-cover', imagePositionClasses[profile.imagePosition])}
        fill
        sizes={imageSizes}
        src={profile.image.src}
      />
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute z-10',
          overlay.frameClassName,
          overlay.className,
        )}
        data-leadership-profile-overlay={overlay.strength}
        data-leadership-profile-overlay-coverage={overlay.coverage}
        data-leadership-profile-overlay-direction={overlay.direction}
        data-leadership-profile-overlay-tone={overlay.tone}
      />
      <div className="absolute inset-0 z-20 flex min-w-0 flex-col justify-end gap-1 p-5 pt-20">
        {profile.leadershipLabel ? (
          <p
            className={cn(
              'wrap-break-word font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]',
              overlay.text.eyebrow,
            )}
            data-leadership-profile-label="true"
          >
            {profile.leadershipLabel}
          </p>
        ) : null}
        <NameHeading
          className={cn(
            'wrap-break-word font-sans text-lg leading-tight font-medium',
            overlay.text.title,
          )}
        >
          {profile.name}
        </NameHeading>
        {profile.designation ? (
          <p
            className={cn('wrap-break-word text-xs leading-5', overlay.text.secondary)}
            data-leadership-profile-designation="true"
          >
            {profile.designation}
          </p>
        ) : null}
      </div>
    </article>
  )
}
```

Add `data-leadership-profile-layout="standard"` to the existing Standard article, retain `aspect-4/3`, and change the Standard name class to:

```tsx
<NameHeading className="wrap-break-word font-sans text-lg leading-tight font-semibold text-current">
```

- [ ] **Step 6: Run focused tests and TypeScript**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all Leadership Profiles tests pass and TypeScript reports no errors.

---

### Task 3: Align Types, Preview, Documentation, and Repository Contracts

**Files:**

- Modify: `src/payload-types.ts` through the Payload generator
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/leadership-profiles.jpg` through the targeted thumbnail generator
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Verify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Verify: `tests/int/block-thumbnails.int.spec.ts`
- Verify: `tests/int/card-block-renderers.int.spec.tsx`
- Verify: `tests/int/card-block-theme-contract.int.spec.ts`
- Verify: `tests/int/page-blocks.int.spec.ts`
- Verify: `tests/int/section-eyebrow.int.spec.tsx`
- Verify: `tests/int/system-page-blocks.int.spec.ts`

**Interfaces:**

- Consumes: the completed Payload schema and component props from Tasks 1–2.
- Produces: generated Payload types, a representative Image Overlay picker thumbnail, and current operator/architecture documentation.

- [ ] **Step 1: Configure the block thumbnail fixture to exercise Image Overlay**

Add these props to the existing Leadership Profiles fixture opening tag:

```diff
@@
 <LeadershipProfilesBlockComponent
   appearance={{ background: 'none', border: 'none' }}
+  cardLayout="imageOverlay"
   columns="3"
+  overlayCoverage="full"
+  overlayDirection="bottomToTop"
+  overlayStyle="dark"
+  themeMode="dark"
   description="Meet the academic and clinical leaders guiding the institution's education and patient-care mission."
   eyebrow="Leadership"
@@
   size="compact"
   title="Academic leadership"
 />
```

Keep the existing three representative profiles so equal-height, wrapping, and column behavior remain visible.

- [ ] **Step 2: Update maintained block documentation**

Document these exact contracts in the Leadership Profiles entries:

- Standard and Image Overlay are block-wide layouts.
- Standard keeps all metadata and the shared semantic card surface.
- Image Overlay uses a fixed `4:5` portrait, shared overlay tone/strength/direction/coverage controls, and displays label/name/designation only.
- Qualification and expertise remain saved but render only in Standard.
- Existing documents fall back to Standard without migration.

- [ ] **Step 3: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `LeadershipProfilesBlock` and `LeadershipProfilesBlockSelect` include `cardLayout`, `themeMode`, `overlayStyle`, `overlayDirection`, and `overlayCoverage` with native generator formatting.

- [ ] **Step 4: Run the complete affected integration set**

Run:

```bash
pnpm exec vitest run tests/int/leadership-profiles.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/section-eyebrow.int.spec.tsx tests/int/system-page-blocks.int.spec.ts
```

Expected: all selected test files pass.

- [ ] **Step 5: Regenerate only the Leadership Profiles thumbnail and visually inspect it**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=leadershipProfiles pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/leadership-profiles.jpg` is a 1600×900 JPEG showing three portrait cards with readable bottom overlays, aligned card geometry, and no overflow.

- [ ] **Step 6: Complete final quality and project-context verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/LeadershipProfiles/Component.tsx
pnpm project-context:update
pnpm project-context:check
git diff --check
git diff --cached --check
```

Expected: TypeScript and diff checks pass; lint has no errors; the detector returns `[]`; project context is current. Existing repository warnings may remain only when unrelated to Leadership Profiles.

- [ ] **Step 7: Audit the final diff without staging or committing**

Inspect the source producer, component consumer, generated types, thumbnail fixture/artifact, tests, and maintained docs together. Confirm that no unrelated user changes were reverted and that the final diff contains no new interaction fields or client component directive.
