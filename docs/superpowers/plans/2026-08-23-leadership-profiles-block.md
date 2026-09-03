# Leadership Profiles Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable, fully configurable, static Leadership Profiles Page block that matches the approved academic-leadership card composition and the repository's established section, theme, responsive, preview, and documentation contracts.

**Architecture:** Add a dedicated `leadershipProfiles` Payload block with a server-only React component. The component normalizes editor-authored text and Media values before rendering a shared Academic Programmes-style header and a static semantic card grid; it introduces no client state, profile links, or compatibility layer. Register the block explicitly across every Page-compatible schema and renderer, then generate Payload types and a production-component thumbnail.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19 server components, TypeScript, Tailwind CSS 4, shadcn `Badge`, Vitest, React DOM server rendering, Playwright thumbnail capture, Sharp.

## Global Constraints

- Preserve every unrelated user-authored working-tree change.
- Do not stage or commit any files.
- Payload slug is exactly `leadershipProfiles`; interface name is exactly `LeadershipProfilesBlock`; Admin label is exactly `Leadership Profiles`.
- The block is server rendered and must not introduce `use client`, client state, or a client-only dependency.
- Profiles have no links, buttons, destinations, open-in-new-tab fields, card click behavior, hover navigation, or focus affordance.
- A profile requires both a trimmed name and a resolved Media image at runtime; unusable rows are omitted.
- Editors may author one qualification and at most three ordered expertise items; blank metadata is omitted and factual text is never invented or clamped.
- Desktop columns support exactly 2, 3, and 4 with default 3; mobile always uses one column and tablet never exceeds two.
- Default cards are opaque `bg-card text-card-foreground`; explicit Primary, Secondary, Muted, and Accent cards use the shared semantic card-surface resolver.
- The shared Content and Theme Settings field pattern, block appearance, spacing, section/footer actions, and split/stacked header behavior must remain consistent with Academic Programmes.
- The thumbnail is a generated 1600×900 JPEG rendered from the production block component and repository-local media.
- Normal Page block choices increase from fifty-one to fifty-two.
- After implementation, run `pnpm project-context:update`, inspect its output and the final diff, update maintained narrative references, and run `pnpm project-context:check`.

---

## File Structure

- Create `src/blocks/LeadershipProfiles/config.ts`: owns the Payload authoring schema and thumbnail Admin metadata.
- Create `src/blocks/LeadershipProfiles/types.ts`: owns the small presentation unions and normalized profile contract shared inside this block.
- Create `src/blocks/LeadershipProfiles/Component.tsx`: owns defensive normalization, the section shell, header composition, and static profile cards.
- Create `tests/int/leadership-profiles.int.spec.tsx`: owns focused schema, normalization, semantic surface, markup, header, and responsive contracts.
- Modify `src/collections/Pages.ts`: register the block in normal Pages.
- Modify `src/collections/ReusableSections.ts`: expose it in reusable sections without changing recursion rules.
- Modify `src/globals/NewsEventsDetailTemplate.ts`: expose it in the Page-compatible News & Events template.
- Modify `src/blocks/renderPageBlocks.tsx`: render the new block in production Pages.
- Modify `src/blocks/renderLivePreviewPageBlocks.tsx`: render the same server-safe component in live preview.
- Modify `tests/int/page-blocks.int.spec.ts`: update the exact Page count and assert renderer coverage.
- Modify `tests/int/system-page-blocks.int.spec.ts`: update its canonical normal-Page block count assertion.
- Modify `src/payload-types.ts`: generated Payload schema types only.
- Modify `src/block-thumbnails/definitions.ts`: add picker metadata.
- Modify `src/block-thumbnails/fixtures.tsx`: add a truthful production-component fixture.
- Create `public/block-thumbnails/leadership-profiles.jpg`: generated 1600×900 picker image.
- Modify `tests/int/block-thumbnails.int.spec.ts`: assert the new definition and generated image contract.
- Modify `tests/int/block-thumbnail-fixtures.int.spec.ts`: assert that the fixture renders the approved content structure.
- Modify `docs/guides/blocks.md`: add the operator-facing catalog entry.
- Modify `docs/architecture/feature-inventory.md`: update the Page block count and catalog sentence.
- Modify `.agents/skills/project-context/references/block-system.md`: record registration and runtime behavior.
- Modify `.agents/skills/project-context/references/project-inventory.json`: generated project inventory.

---

### Task 1: Payload schema and authoring contract

**Files:**

- Create: `src/blocks/LeadershipProfiles/config.ts`
- Create: `tests/int/leadership-profiles.int.spec.tsx`

**Interfaces:**

- Consumes: `getBlockThumbnailAdmin(slug)`, `createBlockAppearanceFields()`, `createCardTabs(...)`, and `createContentActionsField(...)`.
- Produces: `LeadershipProfilesBlock: Block` with slug `leadershipProfiles`, interface `LeadershipProfilesBlock`, Content/Theme Settings tabs, and nested profile Content/Theme Settings tabs.

- [ ] **Step 1: Write the failing schema contract**

Create `tests/int/leadership-profiles.int.spec.tsx` with field walkers that inspect nested Payload tabs and arrays:

```tsx
import { describe, expect, it } from 'vitest'

import { LeadershipProfilesBlock } from '@/blocks/LeadershipProfiles/config'

type InspectableField = {
  admin?: { condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean }
  blocks?: Array<{ slug: string }>
  defaultValue?: unknown
  fields?: InspectableField[]
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  tabs?: Array<{ fields: InspectableField[]; label: string }>
  type?: string
}

const tabs = (LeadershipProfilesBlock.fields[0] as unknown as InspectableField).tabs ?? []
const contentFields = tabs.find(({ label }) => label === 'Content')?.fields ?? []
const themeFields = tabs.find(({ label }) => label === 'Theme Settings')?.fields ?? []

const findField = (fields: InspectableField[], name: string): InspectableField | undefined => {
  for (const field of fields) {
    if (field.name === name) return field
    const nested = [...(field.fields ?? []), ...(field.tabs ?? []).flatMap((tab) => tab.fields)]
    const found = findField(nested, name)
    if (found) return found
  }
}

describe('Leadership Profiles block', () => {
  it('defines the approved block identity and two-tab authoring model', () => {
    expect(LeadershipProfilesBlock.slug).toBe('leadershipProfiles')
    expect(LeadershipProfilesBlock.interfaceName).toBe('LeadershipProfilesBlock')
    expect(LeadershipProfilesBlock.labels).toEqual({
      plural: 'Leadership Profiles',
      singular: 'Leadership Profiles',
    })
    expect(tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(findField(contentFields, 'title')).toMatchObject({ required: true, type: 'text' })
    expect(findField(contentFields, 'actions')).toMatchObject({ maxRows: 2, type: 'array' })
    expect(findField(contentFields, 'footerActions')).toMatchObject({
      maxRows: 2,
      type: 'array',
    })
  })

  it('defines required profile media and name with bounded structured metadata', () => {
    const profiles = findField(contentFields, 'profiles')
    expect(profiles).toMatchObject({ maxRows: 24, minRows: 1, required: true, type: 'array' })
    expect(findField(profiles?.fields ?? [], 'image')).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    expect(findField(profiles?.fields ?? [], 'name')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(findField(profiles?.fields ?? [], 'expertise')).toMatchObject({
      maxRows: 3,
      type: 'array',
    })
    expect(findField(profiles?.fields ?? [], 'item')).toMatchObject({
      required: true,
      type: 'text',
    })
    expect(
      findField(profiles?.fields ?? [], 'cardBackground')?.options?.map(({ value }) => value),
    ).toEqual(['default', 'primary', 'secondary', 'muted', 'accent'])
  })

  it('exposes only approved header, spacing, crop, and column controls', () => {
    expect(findField(themeFields, 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
      required: true,
    })
    expect(findField(themeFields, 'headerLayout')).toMatchObject({
      defaultValue: 'split',
      required: true,
    })
    expect(findField(themeFields, 'descriptionPosition')).toMatchObject({
      defaultValue: 'side',
      required: true,
    })
    expect(findField(themeFields, 'sideContentAlignment')).toMatchObject({
      defaultValue: 'bottom',
      required: true,
    })
    expect(findField(themeFields, 'columns')).toMatchObject({
      defaultValue: '3',
      required: true,
    })
    expect(findField(themeFields, 'columns')?.options?.map(({ value }) => value)).toEqual([
      '2',
      '3',
      '4',
    ])
    expect(findField(contentFields, 'imagePosition')?.options?.map(({ value }) => value)).toEqual([
      'center',
      'top',
      'bottom',
      'left',
      'right',
    ])
    expect(
      findField(themeFields, 'descriptionPosition')?.admin?.condition?.(
        {},
        {
          headerLayout: 'split',
        },
      ),
    ).toBe(true)
    expect(
      findField(themeFields, 'descriptionPosition')?.admin?.condition?.(
        {},
        {
          headerLayout: 'stacked',
        },
      ),
    ).toBe(false)
  })

  it('does not define profile interaction fields', () => {
    const profiles = findField(contentFields, 'profiles')
    const source = JSON.stringify(profiles)
    for (const forbidden of [
      'ctaLabel',
      'linkType',
      'page',
      'url',
      'openInNewTab',
      'actionLabel',
    ]) {
      expect(source).not.toContain(`\"name\":\"${forbidden}\"`)
    }
  })
})
```

- [ ] **Step 2: Run the schema test and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx
```

Expected: FAIL because `@/blocks/LeadershipProfiles/config` does not exist.

- [ ] **Step 3: Create the Payload block config**

Create `src/blocks/LeadershipProfiles/config.ts`:

```ts
import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

type HeaderLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

const isSplitHeader = (_data: unknown, siblingData: HeaderLayoutSiblingData) =>
  siblingData?.headerLayout !== 'stacked'

const profilesField = {
  name: 'profiles',
  label: 'Leadership Profiles',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 24,
  admin: {
    description: 'Leadership cards shown in their displayed order.',
    initCollapsed: true,
  },
  fields: [
    createCardTabs({
      contentFields: [
        {
          name: 'image',
          label: 'Profile Image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'leadershipLabel',
          label: 'Leadership Label',
          type: 'text',
          admin: { description: 'Optional short label, such as Principal.' },
        },
        { name: 'name', type: 'text', required: true },
        { name: 'designation', type: 'text' },
        { name: 'qualification', type: 'text' },
        {
          name: 'expertise',
          label: 'Expertise',
          type: 'array',
          maxRows: 3,
          admin: {
            description: 'Add up to three concise expertise areas in displayed order.',
            initCollapsed: true,
          },
          fields: [{ name: 'item', type: 'text', required: true }],
        } satisfies ArrayField,
      ],
      themeFields: [
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
      ],
      backgroundFieldOptions: {
        defaultOptionLabel: 'Default Card',
        adminDescription:
          'Default uses an opaque card surface. Other choices use semantic theme colors with readable text.',
      },
    }),
  ],
} satisfies ArrayField

export const LeadershipProfilesBlock: Block = {
  admin: getBlockThumbnailAdmin('leadershipProfiles'),
  slug: 'leadershipProfiles',
  interfaceName: 'LeadershipProfilesBlock',
  labels: {
    singular: 'Leadership Profiles',
    plural: 'Leadership Profiles',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              admin: { description: 'Small label above the section title.' },
            },
            { name: 'title', type: 'text', required: true },
            {
              name: 'accentTitle',
              label: 'Accent Title',
              type: 'text',
              admin: { description: 'Optional italic second line of the heading.' },
            },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            profilesField,
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                description:
                  'Aligns the section eyebrow, heading, description, and actions together.',
              },
            } satisfies SelectField,
            {
              name: 'headerLayout',
              label: 'Header Layout',
              type: 'select',
              defaultValue: 'split',
              required: true,
              options: [
                { label: 'Split', value: 'split' },
                { label: 'Stacked', value: 'stacked' },
              ],
            } satisfies SelectField,
            {
              name: 'descriptionPosition',
              label: 'Description Placement',
              type: 'select',
              defaultValue: 'side',
              required: true,
              options: [
                { label: 'Right Column', value: 'side' },
                { label: 'Under Title', value: 'underTitle' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Moves the section description between the title column and the right column.',
              },
            } satisfies SelectField,
            {
              name: 'sideContentAlignment',
              label: 'Right Column Alignment',
              type: 'select',
              defaultValue: 'bottom',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Aligns the right-column description and section actions to the top or bottom.',
              },
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Profile Columns',
              type: 'select',
              defaultValue: '3',
              required: true,
              options: [
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
              ],
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              required: true,
              options: [
                { label: 'None', value: 'none' },
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

- [ ] **Step 4: Run the schema assertions in isolation**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx -t "approved block identity|bounded structured metadata|approved header|profile interaction"
```

Expected: PASS for all four schema tests. Task 1 is independently testable without importing a frontend component that does not exist yet.

- [ ] **Step 5: Inspect the Task 1 diff without staging it**

Run:

```bash
git diff -- src/blocks/LeadershipProfiles/config.ts tests/int/leadership-profiles.int.spec.tsx
```

Expected: only the new schema and its focused contract appear; no profile destination fields are present.

---

### Task 2: Server normalization and static card presentation

**Files:**

- Create: `src/blocks/LeadershipProfiles/types.ts`
- Create: `src/blocks/LeadershipProfiles/Component.tsx`
- Modify: `tests/int/leadership-profiles.int.spec.tsx`

**Interfaces:**

- Consumes: `LeadershipProfilesBlock` values, `getMediaImageProps`, `resolveBlockAppearanceClasses`, `resolveCardSurface`, `resolveCmsActions`, shared content/spacing classes, `ContentActions`, `BlockFooterActions`, `SectionEyebrow`, and shadcn `Badge`.
- Produces: `LeadershipProfilesBlockComponent(props): ReactNode`, `ResolvedLeadershipProfile`, and the approved alignment/crop/column unions.

Before editing UI in this task, load `.agents/skills/impeccable/reference/craft-floor.md`, inspect the installed `src/components/ui/badge.tsx`, and refresh the official Badge contract with:

```bash
pnpm dlx shadcn@latest docs badge
```

Treat this as an extension of the incumbent visual system: the approved signature is the concise leadership badge over a formal 4:3 portrait, while typography, spacing, semantic colors, radius, and section geometry remain project-owned.

- [ ] **Step 1: Add failing render, normalization, and responsiveness assertions**

Append these tests inside the existing `describe` in `tests/int/leadership-profiles.int.spec.tsx`:

Add these server-rendering imports above the existing config import:

```tsx
import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'

import { LeadershipProfilesBlockComponent } from '@/blocks/LeadershipProfiles/Component'
```

```tsx
const validImage = {
  alt: 'Portrait of Dr. Ananya Sharma',
  height: 900,
  url: '/media/ananya-sharma.jpg',
  width: 1200,
}

it('renders a static, opaque, semantic leadership card without profile interaction', () => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      appearance={{ background: 'subtle', border: 'none' }}
      eyebrow="Leadership"
      profiles={[
        {
          cardBackground: 'default',
          designation: 'Principal & Professor of Medicine',
          expertise: [{ item: 'Academic administration' }, { item: 'Clinical education' }],
          image: validImage,
          leadershipLabel: 'Principal',
          name: 'Dr. Ananya Sharma',
          qualification: 'MD (Medicine)',
        },
      ]}
      title="Academic leadership"
    />,
  )

  expect(html).toContain('data-leadership-profiles="true"')
  expect(html).toContain('data-leadership-profile-card="true"')
  expect(html).toContain('data-card-surface="default"')
  expect(html).toContain('bg-card')
  expect(html).toContain('text-card-foreground')
  expect(html).toContain('aspect-[4/3]')
  expect(html).toContain('Principal &amp; Professor of Medicine')
  expect(html).toContain('MD (Medicine)')
  expect(html).toContain('Academic administration')
  expect(html).toContain('Clinical education')
  expect(html).not.toMatch(/<(a|button)\b/)
  expect(html).not.toContain('cursor-pointer')
})

it('omits unusable rows and trims ordered metadata to three expertise items', () => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      profiles={[
        { image: validImage, name: ' ' },
        { image: null, name: 'Missing image' },
        {
          expertise: [
            { item: ' Curriculum ' },
            { item: ' ' },
            { item: 'Clinical governance' },
            { item: 'Mentorship' },
            { item: 'Must not render' },
          ],
          image: { ...validImage, alt: ' ' },
          name: ' Dr. Kavita Rao ',
          qualification: ' MD (Physiology) ',
        },
      ]}
      title="Academic leadership"
    />,
  )

  expect(html.match(/data-leadership-profile-card=/g)).toHaveLength(1)
  expect(html).toContain('alt="Dr. Kavita Rao"')
  expect(html).toContain('Curriculum')
  expect(html).toContain('Clinical governance')
  expect(html).toContain('Mentorship')
  expect(html).not.toContain('Must not render')
  expect(html.match(/aria-hidden="true"> · <\/span>/g)).toHaveLength(3)
})

it('omits absent optional profile elements without empty wrappers', () => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      profiles={[{ image: validImage, name: 'Dr. Arvind Mehta' }]}
      title="Leadership"
    />,
  )

  expect(html).not.toContain('data-leadership-profile-label')
  expect(html).not.toContain('data-leadership-profile-designation')
  expect(html).not.toContain('data-leadership-profile-metadata')
})

it.each([
  ['2', 'xl:grid-cols-2'],
  ['3', 'xl:grid-cols-3'],
  ['4', 'xl:grid-cols-4'],
] as const)('uses one mobile, at most two tablet, and %s desktop columns', (columns, wideClass) => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      columns={columns}
      profiles={[{ image: validImage, name: 'Dr. Ananya Sharma' }]}
      title="Leadership"
    />,
  )

  const classes =
    html.match(/<div class="([^"]+)" data-leadership-profiles-grid="true">/)?.[1].split(' ') ?? []
  expect(classes).toEqual(
    expect.arrayContaining(['grid', 'grid-cols-1', 'md:grid-cols-2', wideClass]),
  )
})

it('normalizes invalid columns, crop, alignment, size, and explicit card surfaces', () => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      columns={'9' as '3'}
      contentAlignment={'diagonal' as 'left'}
      profiles={[
        {
          cardBackground: 'primary',
          designation: 'Dean, Academic Affairs',
          image: validImage,
          imagePosition: 'invalid',
          name: 'Dr. Kavita Rao',
        },
      ]}
      size={'huge' as 'default'}
      title="Leadership"
    />,
  )

  expect(html).toContain('xl:grid-cols-3')
  expect(html).toContain('data-content-alignment="left"')
  expect(html).toContain('object-center')
  expect(html).toContain('data-card-surface="primary"')
  expect(html).toContain('bg-primary text-primary-foreground')
  expect(html).toContain('py-12 md:py-16')
})

it.each([
  ['left', 'mr-auto'],
  ['center', 'mx-auto'],
  ['right', 'ml-auto'],
] as const)('positions a %s stacked header across the full container', (alignment, outerClass) => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      contentAlignment={alignment}
      description="Lead with the institution's academic and clinical leadership."
      headerLayout="stacked"
      profiles={[{ image: validImage, name: 'Dr. Ananya Sharma' }]}
      title="Academic leadership"
    />,
  )
  const classes =
    html
      .match(/<header class="([^"]+)" data-leadership-profiles-header="stacked">/)?.[1]
      .split(' ') ?? []

  expect(classes).toEqual(expect.arrayContaining(['grid', 'w-full', 'max-w-3xl', outerClass]))
  expect(html).toContain(`data-content-alignment="${alignment}"`)
})

it('supports split description placement, side alignment, section actions, and footer actions', () => {
  const html = renderToStaticMarkup(
    <LeadershipProfilesBlockComponent
      actions={[{ label: 'Meet the college', linkType: 'custom', url: '/about' }]}
      description="Lead with the institution's academic and clinical leadership."
      descriptionPosition="underTitle"
      footerActions={[{ label: 'Explore departments', linkType: 'custom', url: '/departments' }]}
      profiles={[{ image: validImage, name: 'Dr. Ananya Sharma' }]}
      sideContentAlignment="top"
      title="Academic leadership"
    />,
  )

  expect(html).toContain('data-leadership-profiles-header="split"')
  expect(html).toContain('data-leadership-profiles-side-alignment="top"')
  expect(html).toContain('lg:self-start')
  expect(html).toContain('Meet the college')
  expect(html).toContain('data-leadership-profiles-footer-actions="true"')
  expect(html).toContain('Explore departments')
})

it('returns no section when the title or every valid profile is missing', () => {
  expect(
    renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        profiles={[{ image: validImage, name: 'Leader' }]}
        title=" "
      />,
    ),
  ).toBe('')
  expect(
    renderToStaticMarkup(
      <LeadershipProfilesBlockComponent
        profiles={[{ image: null, name: 'Leader' }]}
        title="Leadership"
      />,
    ),
  ).toBe('')
})

it('keeps the component server-only', () => {
  const source = readFileSync('src/blocks/LeadershipProfiles/Component.tsx', 'utf8')
  expect(source).not.toMatch(/^['\"]use client['\"]/m)
  expect(source).not.toContain('useState')
  expect(source).not.toContain('useEffect')
})
```

- [ ] **Step 2: Run the focused test and confirm render failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx
```

Expected: FAIL because the component and its normalized presentation contract do not exist.

- [ ] **Step 3: Define the block-local presentation types**

Create `src/blocks/LeadershipProfiles/types.ts`:

```ts
import type { CardSurfaceValue } from '@/blocks/shared/cardThemeFields'

export type LeadershipProfilesAlignment = 'center' | 'left' | 'right'
export type LeadershipProfilesColumns = '2' | '3' | '4'
export type LeadershipProfileImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'

export type ResolvedLeadershipProfile = {
  cardBackground: CardSurfaceValue
  designation?: string
  expertise: string[]
  id: number | string
  image: {
    alt: string
    height?: number
    src: string
    width?: number
  }
  imagePosition: LeadershipProfileImagePosition
  leadershipLabel?: string
  name: string
  qualification?: string
}
```

- [ ] **Step 4: Implement the defensive server component and approved visual structure**

Create `src/blocks/LeadershipProfiles/Component.tsx`. Use the following exact contract and class maps; keep `LeadershipProfileCard` in this file because it is private to one server-rendered block:

```tsx
import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { Badge } from '@/components/ui/badge'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

import type {
  LeadershipProfileImagePosition,
  LeadershipProfilesAlignment,
  LeadershipProfilesColumns,
  ResolvedLeadershipProfile,
} from './types'

type ExpertiseValue = { id?: string | null; item?: string | null }

type LeadershipProfileValue = {
  cardBackground?: string | null
  designation?: string | null
  expertise?: ExpertiseValue[] | null
  id?: string | null
  image?: unknown
  imagePosition?: string | null
  leadershipLabel?: string | null
  name?: string | null
  qualification?: string | null
}

type LeadershipProfilesBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  columns?: LeadershipProfilesColumns | null
  contentAlignment?: LeadershipProfilesAlignment | null
  description?: string | null
  descriptionPosition?: 'side' | 'underTitle' | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: 'split' | 'stacked' | null
  profiles?: LeadershipProfileValue[] | null
  sideContentAlignment?: 'bottom' | 'top' | null
  size?: RegularBlockSize | null
  title?: string | null
}

const validColumns = new Set<LeadershipProfilesColumns>(['2', '3', '4'])
const validAlignments = new Set<LeadershipProfilesAlignment>(['left', 'center', 'right'])
const validImagePositions = new Set<LeadershipProfileImagePosition>([
  'center',
  'top',
  'bottom',
  'left',
  'right',
])
const validSizes = new Set<RegularBlockSize>(['none', 'compact', 'default', 'comfortable'])

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const stackedAlignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const

const gridClasses = {
  '2': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
} as const

const imagePositionClasses = {
  center: 'object-center',
  top: 'object-top',
  bottom: 'object-bottom',
  left: 'object-left',
  right: 'object-right',
} as const

const imageSizes = {
  '2': '(min-width: 1280px) 50vw, (min-width: 768px) 50vw, 100vw',
  '3': '(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw',
  '4': '(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw',
} as const

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const satisfies Record<RegularBlockSize, string>

function LeadershipProfileCard({
  imageSizes,
  profile,
}: {
  imageSizes: string
  profile: ResolvedLeadershipProfile
}) {
  const surface = resolveCardSurface(profile.cardBackground)
  const isDefault = surface.value === 'default'
  const metadata = [profile.qualification, ...profile.expertise].filter((item): item is string =>
    Boolean(item),
  )
  const staticAccentClass = surface.link
    .split(' ')
    .filter((token) => !token.startsWith('hover:'))
    .join(' ')

  return (
    <article
      className={cn(
        'flex h-full min-w-0 flex-col overflow-hidden rounded-xl border',
        isDefault
          ? 'border-border bg-card text-card-foreground'
          : [surface.divider, surface.className],
      )}
      data-card-surface={surface.value}
      data-leadership-profile-card="true"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <Image
          alt={profile.image.alt}
          className={cn('object-cover', imagePositionClasses[profile.imagePosition])}
          fill
          sizes={imageSizes}
          src={profile.image.src}
        />
        {profile.leadershipLabel ? (
          <Badge
            className="absolute top-4 left-4 z-10 bg-background/95 text-foreground shadow-sm"
            data-leadership-profile-label="true"
            variant="secondary"
          >
            {profile.leadershipLabel}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="font-[family-name:var(--font-display)] text-xl leading-tight font-semibold text-current sm:text-2xl">
            {profile.name}
          </h3>
          {profile.designation ? (
            <p
              className={cn('text-sm leading-5 font-medium', staticAccentClass)}
              data-leadership-profile-designation="true"
            >
              {profile.designation}
            </p>
          ) : null}
        </div>

        {metadata.length ? (
          <ul
            aria-label={`${profile.name} qualifications and expertise`}
            className={cn(
              'flex flex-wrap text-sm leading-5',
              isDefault ? 'text-muted-foreground' : surface.secondary,
            )}
            data-leadership-profile-metadata="true"
          >
            {metadata.map((item, index) => (
              <li className="inline" key={`${item}-${index}`}>
                {index ? <span aria-hidden="true"> · </span> : null}
                {item}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  )
}

export function LeadershipProfilesBlockComponent({
  accentTitle,
  actions,
  appearance,
  columns = '3',
  contentAlignment = 'left',
  description,
  descriptionPosition = 'side',
  eyebrow,
  footerActions,
  headerLayout = 'split',
  profiles,
  sideContentAlignment = 'bottom',
  size = 'default',
  title,
}: LeadershipProfilesBlockLike) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null

  const resolvedProfiles = (profiles ?? []).flatMap(
    (profile, index): ResolvedLeadershipProfile[] => {
      const name = profile.name?.trim()
      if (!name) return []

      const image = getMediaImageProps({
        fallbackAlt: name,
        media: profile.image as Media | string | number | null | undefined,
        preset: 'generic',
      })
      if (!image) return []

      const surface = resolveCardSurface(profile.cardBackground)
      const imagePosition = validImagePositions.has(
        profile.imagePosition as LeadershipProfileImagePosition,
      )
        ? (profile.imagePosition as LeadershipProfileImagePosition)
        : 'center'

      return [
        {
          cardBackground: surface.value,
          designation: profile.designation?.trim() || undefined,
          expertise: (profile.expertise ?? [])
            .flatMap(({ item }) => (item?.trim() ? [item.trim()] : []))
            .slice(0, 3),
          id: profile.id ?? index,
          image,
          imagePosition,
          leadershipLabel: profile.leadershipLabel?.trim() || undefined,
          name,
          qualification: profile.qualification?.trim() || undefined,
        },
      ]
    },
  )
  if (!resolvedProfiles.length) return null

  const { background, className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const resolvedActions = resolveCmsActions(actions)
  const resolvedAlignment = validAlignments.has(contentAlignment ?? 'left')
    ? (contentAlignment ?? 'left')
    : 'left'
  const resolvedColumns = validColumns.has(columns ?? '3') ? (columns ?? '3') : '3'
  const resolvedDescription = description?.trim()
  const resolvedDescriptionPosition = descriptionPosition === 'underTitle' ? 'underTitle' : 'side'
  const resolvedHeaderLayout = headerLayout === 'stacked' ? 'stacked' : 'split'
  const resolvedSideAlignment = sideContentAlignment === 'top' ? 'top' : 'bottom'
  const resolvedSize = validSizes.has(size ?? 'default') ? (size ?? 'default') : 'default'

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClassName)}
      data-leadership-profiles="true"
    >
      <div className={regularBlockContainerClasses}>
        <div className={cn('flex flex-col', sectionGapClasses[resolvedSize])}>
          <header
            className={cn(
              'grid gap-6',
              resolvedHeaderLayout === 'split'
                ? 'lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:items-end lg:gap-16'
                : cn('w-full max-w-3xl', stackedAlignmentClasses[resolvedAlignment]),
            )}
            data-leadership-profiles-header={resolvedHeaderLayout}
          >
            <div
              className={cn(contentIntroClasses, alignmentClasses[resolvedAlignment])}
              data-content-alignment={resolvedAlignment}
            >
              {eyebrow?.trim() ? (
                <SectionEyebrow surface={background}>{eyebrow.trim()}</SectionEyebrow>
              ) : null}
              <h2 className={contentSectionHeadingClasses}>
                <span className="block font-[inherit]">{resolvedTitle}</span>
                {accentTitle?.trim() ? (
                  <em className="block font-[inherit]">{accentTitle.trim()}</em>
                ) : null}
              </h2>
              {resolvedDescription &&
              (resolvedHeaderLayout === 'stacked' ||
                resolvedDescriptionPosition === 'underTitle') ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}
              {resolvedHeaderLayout === 'stacked' ? (
                <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
              ) : null}
            </div>

            {resolvedHeaderLayout === 'split' &&
            ((resolvedDescriptionPosition === 'side' && resolvedDescription) ||
              resolvedActions.length) ? (
              <div
                className={cn(
                  contentIntroClasses,
                  'max-w-xl',
                  resolvedDescriptionPosition === 'underTitle'
                    ? 'ml-auto w-full items-end text-right'
                    : alignmentClasses[resolvedAlignment],
                  resolvedSideAlignment === 'top' ? 'lg:self-start' : 'lg:self-end lg:pb-1',
                )}
                data-leadership-profiles-side-alignment={resolvedSideAlignment}
              >
                {resolvedDescriptionPosition === 'side' && resolvedDescription ? (
                  <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
                ) : null}
                <ContentActions
                  actions={resolvedActions}
                  alignment={
                    resolvedDescriptionPosition === 'underTitle' ? 'right' : resolvedAlignment
                  }
                />
              </div>
            ) : null}
          </header>

          <div
            className={cn('grid gap-6', gridClasses[resolvedColumns])}
            data-leadership-profiles-grid="true"
          >
            {resolvedProfiles.map((profile) => (
              <LeadershipProfileCard
                imageSizes={imageSizes[resolvedColumns]}
                key={profile.id}
                profile={profile}
              />
            ))}
          </div>
        </div>

        <div data-leadership-profiles-footer-actions="true">
          <BlockFooterActions actions={footerActions} alignment="center" />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 5: Run the complete focused block suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx
```

Expected: PASS. If React serializes a class or separator differently, inspect the generated HTML and correct only the assertion or implementation that conflicts with the approved semantic contract.

- [ ] **Step 6: Run shared visual contracts against the new component**

Add `LeadershipProfilesBlockComponent` to the server-rendered component lists in `tests/int/card-block-renderers.int.spec.tsx`, `tests/int/block-layout-contracts.int.spec.tsx`, `tests/int/card-block-theme-contract.int.spec.ts`, and `tests/int/section-eyebrow.int.spec.tsx` only where those files use explicit component registries. Supply one valid profile with local Media data and a title in each fixture.

Use this canonical fixture shape in each test:

```tsx
<LeadershipProfilesBlockComponent
  appearance={{ background: 'brand', border: 'topAndBottom' }}
  eyebrow="Leadership"
  profiles={[
    {
      cardBackground: 'accent',
      image: { alt: 'Academic leader', url: '/media/academic-leader.jpg' },
      name: 'Dr. Ananya Sharma',
    },
  ]}
  size="compact"
  title="Academic leadership"
/>
```

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: PASS with semantic appearance, spacing, card, and eyebrow coverage intact.

- [ ] **Step 7: Inspect the Task 2 diff without staging it**

Run:

```bash
git diff -- src/blocks/LeadershipProfiles tests/int/leadership-profiles.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: the new block contains no client directive, React hook, profile anchor, profile button, or hover-navigation class.

---

### Task 3: Explicit registrations, renderer parity, and generated Payload types

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/globals/NewsEventsDetailTemplate.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/leadership-profiles.int.spec.tsx`
- Modify (generated): `src/payload-types.ts`

**Interfaces:**

- Consumes: `LeadershipProfilesBlock`, `LeadershipProfilesBlockComponent`, and each registry's existing explicit ordering.
- Produces: authoring and rendering parity in Pages, Reusable Sections, News & Events Detail Template, production Pages, and live preview; generated `LeadershipProfilesBlock` and select types.

- [ ] **Step 1: Add failing registration and generated-type assertions**

In `tests/int/page-blocks.int.spec.ts`, change the normal Page expectation and add the new slug assertion:

```ts
expect(registeredSlugs).toHaveLength(52)
expect(registeredSlugs).toContain('leadershipProfiles')
```

In `tests/int/system-page-blocks.int.spec.ts`, change only the canonical normal Page count from `51` to `52`.

Append to `tests/int/leadership-profiles.int.spec.tsx`:

```tsx
it('is registered across every Page-compatible schema and both renderers', async () => {
  const [{ Pages }, { ReusableSections }, { NewsEventsDetailTemplate }] = await Promise.all([
    import('@/collections/Pages'),
    import('@/collections/ReusableSections'),
    import('@/globals/NewsEventsDetailTemplate'),
  ])
  const collectSlugs = (fields: InspectableField[]): string[] =>
    fields.flatMap((field) => {
      if (field.type === 'blocks') {
        return (field.blocks ?? []).map(({ slug }) => slug)
      }
      return [
        ...(field.fields ? collectSlugs(field.fields) : []),
        ...(field.tabs ?? []).flatMap((tab) => collectSlugs(tab.fields)),
      ]
    })

  expect(collectSlugs(Pages.fields as unknown as InspectableField[])).toContain(
    'leadershipProfiles',
  )
  expect(collectSlugs(ReusableSections.fields as unknown as InspectableField[])).toContain(
    'leadershipProfiles',
  )
  expect(collectSlugs(NewsEventsDetailTemplate.fields as unknown as InspectableField[])).toContain(
    'leadershipProfiles',
  )

  const productionRenderer = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')
  const previewRenderer = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')
  for (const source of [productionRenderer, previewRenderer]) {
    expect(source).toContain("case 'leadershipProfiles'")
    expect(source).toContain('LeadershipProfilesBlockComponent')
  }
})

it('keeps generated Payload types aligned with the schema', () => {
  const generated = readFileSync('src/payload-types.ts', 'utf8')
  expect(generated).toContain('export interface LeadershipProfilesBlock')
  expect(generated).toContain("blockType: 'leadershipProfiles'")
  expect(generated).toContain('export interface LeadershipProfilesBlockSelect')
})
```

- [ ] **Step 2: Run registration tests and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts
```

Expected: FAIL because the new slug is absent from schemas/renderers and generated types still describe fifty-one Page choices.

- [ ] **Step 3: Register the schema explicitly**

Add this import beside `AcademicProgrammesBlock` in all three schema owners:

```ts
import { LeadershipProfilesBlock } from '@/blocks/LeadershipProfiles/config'
```

Insert `LeadershipProfilesBlock` immediately after `AcademicProgrammesBlock` in:

```ts
// src/collections/Pages.ts
// src/collections/ReusableSections.ts
// src/globals/NewsEventsDetailTemplate.ts detailTemplateBlocks
```

Do not add it to Headers, Footers, System Pages, or a shared cross-environment registry.

- [ ] **Step 4: Add production and live-preview renderer cases**

Add this import to both renderer files:

```tsx
import { LeadershipProfilesBlockComponent } from './LeadershipProfiles/Component'
```

Insert this case immediately after `academicProgrammes` in both switches:

```tsx
case 'leadershipProfiles':
  return <LeadershipProfilesBlockComponent key={key} {...block} />
```

Keep the existing production `BlockErrorBoundary` ownership and live-preview client-safe import boundary unchanged.

- [ ] **Step 5: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: exit 0; `src/payload-types.ts` contains `LeadershipProfilesBlock`, `LeadershipProfilesBlockSelect`, `blockType: 'leadershipProfiles'`, profile metadata, header controls, and the two-to-four column union.

- [ ] **Step 6: Run registration, renderer, and generated-type contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/news-events-detail-template.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts
```

Expected: PASS; normal Pages expose exactly 52 unique choices, and production/live-preview cases stay equal.

- [ ] **Step 7: Inspect the Task 3 diff without staging it**

Run:

```bash
git diff -- src/collections/Pages.ts src/collections/ReusableSections.ts src/globals/NewsEventsDetailTemplate.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/payload-types.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/leadership-profiles.int.spec.tsx
```

Expected: one explicit import/list entry/case per required owner, generated types only from the Payload command, and no registry abstraction.

---

### Task 4: Block picker definition, production fixture, and generated JPEG

**Files:**

- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Create: `public/block-thumbnails/leadership-profiles.jpg`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`

**Interfaces:**

- Consumes: `LeadershipProfilesBlockComponent`, the existing `portrait` repository-local SVG fixture asset, and the block thumbnail generator.
- Produces: `leadershipProfiles` thumbnail metadata, a truthful production-component fixture, and an exact 1600×900 JPEG.

- [ ] **Step 1: Add failing thumbnail metadata and fixture assertions**

In `tests/int/block-thumbnails.int.spec.ts`, add:

```ts
expect(getBlockThumbnailDefinition('leadershipProfiles')).toMatchObject({
  alt: 'Leadership Profiles block preview',
  filename: 'leadership-profiles.jpg',
  label: 'Leadership Profiles',
  slug: 'leadershipProfiles',
  stageAlignment: 'top',
})
```

In `tests/int/block-thumbnail-fixtures.int.spec.ts`, add:

```tsx
it('renders the approved Leadership Profiles production composition', () => {
  const html = renderToStaticMarkup(getBlockThumbnailFixture('leadershipProfiles'))

  expect(html).toContain('data-leadership-profiles="true"')
  expect(html).toContain('Academic leadership')
  expect(html).toContain('Principal')
  expect(html).toContain('Medical Superintendent')
  expect(html).toContain('Dean, Academics')
  expect(html.match(/data-leadership-profile-card=/g)).toHaveLength(3)
  expect(html).not.toMatch(/<(a|button)\b/)
})
```

- [ ] **Step 2: Run thumbnail contracts and confirm red state**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL because definition, fixture, and JPEG are absent.

- [ ] **Step 3: Add the thumbnail definition**

Insert after `academicProgrammes` in `blockThumbnailDefinitions`:

```ts
defineThumbnail({
  alt: 'Leadership Profiles block preview',
  filename: 'leadership-profiles.jpg',
  label: 'Leadership Profiles',
  slug: 'leadershipProfiles',
  stageAlignment: 'top',
}),
```

- [ ] **Step 4: Add the production-component fixture**

Import the component in `src/block-thumbnails/fixtures.tsx`:

```tsx
import { LeadershipProfilesBlockComponent } from '@/blocks/LeadershipProfiles/Component'
```

Insert this record entry after `academicProgrammes`:

```tsx
leadershipProfiles: (
  <LeadershipProfilesBlockComponent
    appearance={{ background: 'none', border: 'none' }}
    columns="3"
    description="Meet the academic and clinical leaders guiding the institution's education and patient-care mission."
    eyebrow="Leadership"
    profiles={[
      {
        designation: 'Principal & Professor of Medicine',
        expertise: [{ item: 'Academic administration' }, { item: 'Clinical education' }],
        image: { alt: 'Portrait of the Principal', url: portrait, width: 900, height: 1200 },
        leadershipLabel: 'Principal',
        name: 'Dr. Ananya Sharma',
        qualification: 'MD (Medicine)',
      },
      {
        designation: 'Medical Superintendent',
        expertise: [{ item: 'Hospital operations' }, { item: 'Surgical education' }],
        image: { alt: 'Portrait of the Medical Superintendent', url: portrait, width: 900, height: 1200 },
        leadershipLabel: 'Medical Superintendent',
        name: 'Dr. Arvind Mehta',
        qualification: 'MS (General Surgery)',
      },
      {
        designation: 'Dean, Academic Affairs',
        expertise: [{ item: 'Curriculum planning' }, { item: 'Medical education' }],
        image: { alt: 'Portrait of the Dean of Academics', url: portrait, width: 900, height: 1200 },
        leadershipLabel: 'Dean, Academics',
        name: 'Dr. Kavita Rao',
        qualification: 'MD (Physiology)',
      },
    ]}
    size="compact"
    title="Academic leadership"
  />
),
```

These names and credentials are illustrative thumbnail fixture content, not claims about SNMIH. They remain confined to the internal picker preview and are never seeded into public site content.

- [ ] **Step 5: Generate only the new JPEG**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=leadershipProfiles pnpm generate:block-thumbnails
```

Expected: exit 0 and `public/block-thumbnails/leadership-profiles.jpg` is created.

- [ ] **Step 6: Inspect the generated image visually**

Open `public/block-thumbnails/leadership-profiles.jpg` with the workspace image viewer at original detail. Verify:

- the section header follows the split layout;
- all three cards are visible at 1600×900;
- cards have opaque backgrounds and subtle borders;
- leadership badges remain legible over images;
- names, designations, and metadata wrap without clipping;
- there are no link or button affordances.

If capture framing hides card content, adjust only the fixture's `size`, copy length, or definition `stageAlignment`; do not weaken the production component contract.

- [ ] **Step 7: Run thumbnail contracts**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: PASS; Sharp reports JPEG, width 1600, and height 900 for every definition.

- [ ] **Step 8: Inspect the Task 4 diff without staging it**

Run:

```bash
git diff -- src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts && git status --short public/block-thumbnails/leadership-profiles.jpg
```

Expected: one definition, one fixture, focused assertions, and one untracked/generated JPEG.

---

### Task 5: Operator documentation, project-context refresh, and final verification

**Files:**

- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify (generated): `.agents/skills/project-context/references/project-inventory.json`
- Verify: every file changed in Tasks 1–4

**Interfaces:**

- Consumes: the finished schema, runtime behavior, registration count, generated types, and thumbnail artifact.
- Produces: current editor guidance, maintained architecture knowledge, a synchronized inventory, and a verified uncommitted handoff.

- [ ] **Step 1: Update the operator-facing block catalog**

Add this row immediately after Academic Programmes in `docs/guides/blocks.md`:

```markdown
| Leadership Profiles | Static academic, clinical, or administrative leadership directory | Required image and name; optional leadership badge, designation, qualification, and up to three expertise items; 2–4 semantic card columns; shared split/stacked header and section actions; profile cards are intentionally non-clickable |
```

- [ ] **Step 2: Update the architecture feature inventory**

In `docs/architecture/feature-inventory.md`, change:

```markdown
Normal Pages register 51 choices:
```

to:

```markdown
Normal Pages register 52 choices:
```

Insert `Leadership Profiles` immediately after `Academic Programmes` in that sentence's ordered catalog. Add or extend the block-system feature bullet with this exact contract:

```markdown
- Leadership Profiles provides a static, non-clickable leadership directory with required profile media and names, optional leadership labels, designations, qualifications, and up to three expertise items. It uses the shared split/stacked section header, semantic section/card surfaces, one mobile column, at most two tablet columns, and two-to-four configured desktop columns.
```

- [ ] **Step 3: Update the maintained block-system narrative**

In `.agents/skills/project-context/references/block-system.md`:

1. Change `registers 51 blocks` to `registers 52 blocks`.
2. Insert `` `leadershipProfiles` `` immediately after `` `academicProgrammes` `` in the ordered registry.
3. Add this paragraph after the Academic Programmes paragraph:

```markdown
Leadership Profiles owns the static academic, clinical, and administrative leadership directory. Editors provide one to twenty-four profiles with required Media and names, optional leadership labels, designations, one qualification, up to three ordered expertise items, image crop positions, and semantic card surfaces. Runtime trims author text, omits profiles without a usable name or image, removes blank expertise rows, caps expertise at three, and never invents credentials. The block reuses the shared split/stacked header, section/footer actions, appearance, and spacing patterns. Its grid renders one mobile column, at most two tablet columns, and the selected two, three, or four desktop columns. Cards remain opaque, equal-height, and non-clickable without profile links, buttons, hover navigation, or client state.
```

- [ ] **Step 4: Format all authored source, tests, and documentation**

Run:

```bash
pnpm exec prettier --write src/blocks/LeadershipProfiles src/collections/Pages.ts src/collections/ReusableSections.ts src/globals/NewsEventsDetailTemplate.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/leadership-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/section-eyebrow.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-22-leadership-profiles-block-design.md docs/superpowers/plans/2026-08-23-leadership-profiles-block.md
```

Expected: exit 0; formatting changes remain restricted to listed files.

- [ ] **Step 5: Run focused and shared integration suites**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/leadership-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/live-preview-import-boundary.int.spec.ts tests/int/news-events-detail-template.int.spec.tsx tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: every listed suite passes.

- [ ] **Step 6: Run TypeScript, lint, and visual-design detection**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/LeadershipProfiles
```

Expected: TypeScript and lint exit 0. The detector reports no blocking layout, overflow, theme, interaction, accessibility, or responsive finding; review advisory findings against the approved static design rather than suppressing them.

- [ ] **Step 7: Refresh and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: both commands exit 0. Keep the generated `.agents/skills/project-context/references/project-inventory.json` changes because a block, files, interface, registrations, tests, and thumbnail were added.

- [ ] **Step 8: Re-run generated artifact checks after the context update**

Run:

```bash
pnpm generate:types
pnpm exec prettier --check src/blocks/LeadershipProfiles src/collections/Pages.ts src/collections/ReusableSections.ts src/globals/NewsEventsDetailTemplate.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/leadership-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/section-eyebrow.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/specs/2026-08-22-leadership-profiles-block-design.md docs/superpowers/plans/2026-08-23-leadership-profiles-block.md
```

Expected: type generation is idempotent and Prettier reports every listed file as formatted.

- [ ] **Step 9: Inspect final scope and preserve the uncommitted handoff**

Run:

```bash
git status --short
git diff --check
git diff --stat
git diff -- src/blocks/LeadershipProfiles src/collections/Pages.ts src/collections/ReusableSections.ts src/globals/NewsEventsDetailTemplate.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/leadership-profiles.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/section-eyebrow.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/specs/2026-08-22-leadership-profiles-block-design.md docs/superpowers/plans/2026-08-23-leadership-profiles-block.md
```

Expected: `git diff --check` is clean; every implementation change is explained by this plan; unrelated user changes remain untouched; no files are staged and no commit exists for this work.

## Final Handoff Checklist

- Report the new Admin block name and where editors can use it.
- Summarize configurable section/header, profile, surface, crop, column, and spacing options.
- State explicitly that profile cards are static and non-clickable.
- Report the focused test count plus TypeScript, lint, design detector, thumbnail, and project-context results.
- Link the new block config, component, generated thumbnail, operator guide, approved spec, and this plan using absolute workspace paths.
- Confirm that no commit was created.
