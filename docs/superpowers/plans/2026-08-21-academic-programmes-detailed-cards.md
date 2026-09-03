# Academic Programmes Detailed Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Study Pathways with a fully configurable Detailed Cards presentation inside the canonical Academic Programmes block.

**Architecture:** Keep `AcademicProgrammesBlockComponent` responsible for Payload, Media, link, and text normalization. Move normalized programme types into a small shared module, retain `AcademicProgrammesClient` as the filter/layout coordinator, and give the new icon/fact-rich card its own client presentation file. Remove Study Pathways from every active registry, renderer, thumbnail, generated type, test, and maintained-documentation surface without migration.

**Tech Stack:** Payload CMS 3, Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide React dynamic icons, Vitest, Testing Library, Playwright thumbnail generation.

## Global Constraints

- Keep the `academicProgrammes` slug, all existing Academic Programmes fields, and `grid` as the saved/runtime fallback.
- Add `Detailed Cards` as `viewMode: 'detailedCards'`; do not create a new programme block.
- Reuse `duration` as the Detailed Cards pill and the existing per-card link/action configuration.
- Add one optional programme icon and zero-to-four facts; every rendered fact requires a non-empty label and value.
- Do not infer Seats, Eligibility, Fee, icons, labels, values, currency, duration, or ordering.
- Do not render Grid/List-only image, badge, duration label, or intake fields in Detailed Cards.
- Reuse shared section spacing, typography, semantic card surfaces, link treatment, focus treatment, and reduced-motion conventions.
- Use Lucide's dynamic loader in the client graph; do not eagerly bundle the complete icon catalogue.
- Remove Study Pathways without migration, alias, compatibility renderer, or hidden legacy schema.
- Preserve all unrelated workspace changes.
- Do not stage, unstage, or commit any file.

---

## File Structure

- `src/blocks/AcademicProgrammes/config.ts`: owns the new schema option, icon/fact authoring fields, and layout-specific Admin conditions.
- `src/blocks/AcademicProgrammes/types.ts`: owns serializable normalized programme, fact, image, and view-mode types shared by server and client modules.
- `src/blocks/AcademicProgrammes/Component.tsx`: trims and normalizes the new fields and selects the three-value runtime layout.
- `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`: retains filtering and chooses Standard versus Detailed card rendering.
- `src/blocks/AcademicProgrammes/DetailedProgrammeCard.tsx`: owns only the new card anatomy, client-safe dynamic icon resolution, semantic facts, surfaces, and single-link interaction.
- `tests/int/academic-programmes.int.spec.tsx`: owns schema, server normalization, static rendering, theming, fallback, and regression contracts.
- `tests/int/academic-programmes-client.int.spec.tsx`: owns filter interaction and client-rendered Detailed Cards edge states.
- Registry, renderer, thumbnail, generated-type, and documentation files listed below own Study Pathways removal and repository-wide contracts.

---

### Task 1: Extend the Academic Programmes authoring schema

**Files:**
- Modify: `tests/int/academic-programmes.int.spec.tsx`
- Modify: `src/blocks/AcademicProgrammes/config.ts`

**Interfaces:**
- Produces: `viewMode: 'grid' | 'list' | 'detailedCards'` with `grid` default.
- Produces: optional programme `icon` and optional `facts` array capped at four rows.
- Produces: fact `{ icon?: string | null; label: string; value: string; id?: string | null }`.
- Produces: `columns` visible for Grid/Detailed Cards and `metadataPosition` visible for Grid/List.

- [ ] **Step 1: Add failing schema assertions**

Extend the existing first schema test with these exact assertions after resolving `fields`:

```tsx
const programmeIcon = findNamedField(fields, 'icon')
const facts = findNamedField(fields, 'facts')
const factIcon = findNamedField(facts?.fields ?? [], 'icon')

expect(findNamedField(fields, 'viewMode')?.options?.map((option) => option.value)).toEqual([
  'grid',
  'list',
  'detailedCards',
])
expect(programmeIcon).toMatchObject({ type: 'text' })
expect(facts).toMatchObject({ maxRows: 4, type: 'array' })
expect(factIcon).toMatchObject({ type: 'text' })
expect(findNamedField(facts?.fields ?? [], 'label')).toMatchObject({
  required: true,
  type: 'text',
})
expect(findNamedField(facts?.fields ?? [], 'value')).toMatchObject({
  required: true,
  type: 'text',
})
expect(findNamedField(fields, 'columns')?.admin?.condition?.({}, { viewMode: 'grid' })).toBe(true)
expect(
  findNamedField(fields, 'columns')?.admin?.condition?.({}, { viewMode: 'detailedCards' }),
).toBe(true)
expect(findNamedField(fields, 'columns')?.admin?.condition?.({}, { viewMode: 'list' })).toBe(false)
expect(
  findNamedField(fields, 'metadataPosition')?.admin?.condition?.({}, { viewMode: 'grid' }),
).toBe(true)
expect(
  findNamedField(fields, 'metadataPosition')?.admin?.condition?.({}, { viewMode: 'list' }),
).toBe(true)
expect(
  findNamedField(fields, 'metadataPosition')?.admin?.condition?.(
    {},
    { viewMode: 'detailedCards' },
  ),
).toBe(false)
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx
```

Expected: FAIL because `detailedCards`, programme/fact icons, facts, and the metadata-position condition do not exist.

- [ ] **Step 3: Add the schema fields and conditions**

Import `createIconField` and extend the view sibling type:

```ts
import { createIconField } from '@/blocks/shared/iconField'

type AcademicProgrammesViewSiblingData = {
  viewMode?: 'detailedCards' | 'grid' | 'list' | null
}

const usesCardColumns = (_data: unknown, siblingData: AcademicProgrammesViewSiblingData) =>
  siblingData?.viewMode !== 'list'

const usesStandardMetadata = (_data: unknown, siblingData: AcademicProgrammesViewSiblingData) =>
  siblingData?.viewMode !== 'detailedCards'
```

Add these fields inside programme `contentFields`, after `image` and after `intake` respectively:

```ts
createIconField({
  description: 'Optional icon used by the Detailed Cards layout.',
  required: false,
}),
```

```ts
{
  name: 'facts',
  label: 'Detailed Card Facts',
  type: 'array',
  maxRows: 4,
  admin: {
    description:
      'Optional facts used by Detailed Cards, such as Seats, Eligibility, or Fee. Add up to four.',
    initCollapsed: true,
  },
  fields: [
    createIconField({
      description: 'Optional decorative Lucide icon shown beside this fact label.',
      required: false,
    }),
    { name: 'label', type: 'text', required: true },
    { name: 'value', type: 'text', required: true },
  ],
} satisfies ArrayField,
```

Add `{ label: 'Detailed Cards', value: 'detailedCards' }` to `viewMode.options`. Set `columns.admin.condition` to `usesCardColumns`, change its description to `Applies to the Grid and Detailed Cards programme layouts.`, and add `condition: usesStandardMetadata` to `metadataPosition.admin` without changing its existing description.

- [ ] **Step 4: Re-run the focused schema test**

Run the Step 2 command.

Expected: PASS, including existing schema and header contracts.

---

### Task 2: Add normalized Detailed Cards data and presentation

**Files:**
- Create: `src/blocks/AcademicProgrammes/types.ts`
- Create: `src/blocks/AcademicProgrammes/DetailedProgrammeCard.tsx`
- Modify: `src/blocks/AcademicProgrammes/Component.tsx`
- Modify: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`
- Modify: `tests/int/academic-programmes.int.spec.tsx`

**Interfaces:**
- Produces: `AcademicProgrammesViewMode = 'detailedCards' | 'grid' | 'list'`.
- Produces: `ResolvedProgrammeFact` and `ResolvedAcademicProgramme` serializable types.
- Produces: `DetailedProgrammeCard({ background, programme })`.
- Consumes: `resolveCardSurface`, shared item typography, `ActionArrow`, and `lucide-react/dynamic`.

- [ ] **Step 1: Add failing Detailed Cards render tests**

Add this test to `tests/int/academic-programmes.int.spec.tsx`:

```tsx
it('renders normalized detailed cards with semantic facts and one linked card target', () => {
  const html = renderToStaticMarkup(
    <AcademicProgrammesBlockComponent
      columns="2"
      programmes={[
        {
          cardBackground: 'muted',
          ctaLabel: 'Apply now',
          description: 'Competency-based education with supervised clinical exposure.',
          duration: ' 4.5 years + 1 year internship ',
          facts: [
            { icon: 'Users', label: ' Seats ', value: ' 150 ' },
            { icon: 'BookOpen', label: ' Eligibility ', value: ' 10+2 with PCB, NEET-UG qualified ' },
            { icon: 'IndianRupee', label: ' Fee ', value: ' ₹16 Lakhs / year ' },
            { label: ' Campus ', value: ' Main campus ' },
            { label: 'Ignored', value: 'Fifth valid fact' },
          ],
          icon: ' GraduationCap ',
          linkType: 'custom',
          title: 'MBBS',
          url: '/programmes/mbbs',
        },
      ]}
      title="Academic programmes"
      viewMode="detailedCards"
    />,
  )

  expect(html).toContain('data-academic-programmes-view="detailedCards"')
  expect(html).toContain('data-academic-programme-layout="detailedCards"')
  expect(html).toContain('data-academic-programme-icon="graduation-cap"')
  expect(html).toContain('data-academic-programme-duration="true"')
  expect(html).toContain('4.5 years + 1 year internship')
  expect(html).toContain('<dl')
  expect(html).toContain('data-academic-programme-facts="true"')
  expect(html).toContain('Seats')
  expect(html).toContain('10+2 with PCB, NEET-UG qualified')
  expect(html).toContain('₹16 Lakhs / year')
  expect(html).toContain('Main campus')
  expect(html).not.toContain('Fifth valid fact')
  expect(html).toContain('data-academic-programme-action="detailed"')
  expect(html).toContain('mt-auto pt-7')
  expect(html.match(/<a /g)).toHaveLength(1)
  expect(html).toContain('href="/programmes/mbbs"')
  expect(html).toContain('font-sans')
})
```

Add an edge-state test:

```tsx
it('closes detailed-card spacing and falls back to grid for invalid layouts', () => {
  const detailed = renderToStaticMarkup(
    <AcademicProgrammesBlockComponent
      programmes={[
        {
          facts: [
            { icon: 'NotARealLucideIcon', label: ' Seats ', value: '  ' },
            { label: '  ', value: '150' },
          ],
          icon: 'NotARealLucideIcon',
          title: 'MBBS',
        },
      ]}
      title="Academic programmes"
      viewMode="detailedCards"
    />,
  )
  const fallback = renderToStaticMarkup(
    <AcademicProgrammesBlockComponent
      programmes={[{ title: 'MBBS' }]}
      title="Academic programmes"
      viewMode={'unsupported' as 'grid'}
    />,
  )

  expect(detailed).toContain('data-academic-programme-layout="detailedCards"')
  expect(detailed).not.toContain('data-academic-programme-icon=')
  expect(detailed).not.toContain('data-academic-programme-duration=')
  expect(detailed).not.toContain('data-academic-programme-facts=')
  expect(detailed).not.toContain('data-academic-programme-action=')
  expect(fallback).toContain('data-academic-programmes-view="grid"')
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx
```

Expected: FAIL because the new view type, normalized facts/icons, and Detailed card renderer do not exist.

- [ ] **Step 3: Extract serializable Academic Programmes types**

Create `src/blocks/AcademicProgrammes/types.ts` with:

```ts
export type AcademicProgrammesViewMode = 'detailedCards' | 'grid' | 'list'

export type ResolvedProgrammeImage = {
  alt: string
  height?: number
  src: string
  width?: number
}

export type ResolvedProgrammeFact = {
  icon?: string
  label: string
  value: string
}

export type ResolvedAcademicProgramme = {
  badge?: string
  cardBackground?: string | null
  ctaLabel: string
  description?: string
  duration?: string
  durationLabel?: string
  eyebrow?: string
  facts: ResolvedProgrammeFact[]
  href?: string
  icon?: string
  id: number | string
  image?: ResolvedProgrammeImage
  intake?: string
  intakeLabel?: string
  openInNewTab: boolean
  title: string
}
```

Remove the equivalent local image/programme types from `AcademicProgrammesClient.tsx` and import these types. Update its props to consume `AcademicProgrammesViewMode`.

- [ ] **Step 4: Normalize icons, facts, and the three-value layout on the server**

Extend the server-side source value types:

```ts
type ProgrammeFactValue = {
  icon?: string | null
  id?: string | null
  label?: string | null
  value?: string | null
}

type ProgrammeValue = Omit<CmsLinkValue, 'linkType'> & {
  // retain every existing member
  facts?: ProgrammeFactValue[] | null
  icon?: string | null
}
```

Set the block-like `viewMode` member to `AcademicProgrammesViewMode | null`. In each normalized programme, add:

```ts
facts: (programme.facts ?? [])
  .flatMap((fact): ResolvedProgrammeFact[] => {
    const label = fact.label?.trim()
    const value = fact.value?.trim()
    if (!label || !value) return []

    return [{ icon: fact.icon?.trim() || undefined, label, value }]
  })
  .slice(0, 4),
icon: programme.icon?.trim() || undefined,
```

Replace the two-value layout normalization with:

```ts
const resolvedViewMode: AcademicProgrammesViewMode =
  viewMode === 'list' || viewMode === 'detailedCards' ? viewMode : 'grid'
```

Import the shared normalized types from `./types` and continue passing the resolved layout and programme array to `AcademicProgrammesClient`.

- [ ] **Step 5: Implement the focused Detailed Programme card**

Create `src/blocks/AcademicProgrammes/DetailedProgrammeCard.tsx`. Its implementation must include these exact contracts:

```tsx
'use client'

import { DynamicIcon, dynamicIconImports, type IconName } from 'lucide-react/dynamic'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  contentItemDescriptionClasses,
  contentItemMetadataClasses,
  contentItemTitleClasses,
} from '@/blocks/shared/contentStyles'
import { ActionArrow } from '@/components/ActionArrow'
import { cn } from '@/lib/utils'

import type { ResolvedAcademicProgramme } from './types'

const normalizeDynamicIconName = (value?: string) =>
  value
    ?.trim()
    .replace(/Icon$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

const getDynamicIconName = (value?: string): IconName | undefined => {
  const normalized = normalizeDynamicIconName(value)
  return normalized && normalized in dynamicIconImports ? (normalized as IconName) : undefined
}
```

Render the card with:

- `data-academic-programme="true"`, `data-academic-programme-layout="detailedCards"`, and the resolved `data-card-background`;
- the same Default-versus-explicit surface selection used by the existing card;
- `flex h-full min-w-0 flex-col` content with `p-7 sm:p-8`;
- a utility row only when the programme icon or duration exists;
- a fixed-size `size-11` icon container using `border-current/10 bg-current/5` and `surface.icon`;
- `DynamicIcon` with `aria-hidden="true"`, `name={resolvedName}`, `size={20}`, and `strokeWidth={1.75}`;
- a duration pill using `rounded-full border border-current/15 bg-current/5 px-3 py-1 font-sans text-xs font-medium`;
- `contentItemTitleClasses` and `contentItemDescriptionClasses` without section-alignment classes;
- facts in `<dl className="mt-6 grid [grid-template-columns:repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-x-5 gap-y-5">`;
- one `<div className="min-w-0">` per fact, optional decorative icon beside `<dt>`, and a wrapping `<dd className="mt-1.5 font-sans text-sm font-medium leading-5 text-current">`;
- an action wrapper with `className="mt-auto pt-7"`, `data-academic-programme-action="detailed"`, shared surface link colour, an underlined label, and adjacent `ActionArrow`;
- one outer anchor only when `href` is valid, using `group/button block h-full`, the existing focus ring, `target`, and `rel` semantics.

Use `data-academic-programme-icon={resolvedProgrammeIcon}` only on the valid programme-icon container, `data-academic-programme-duration="true"` only on a rendered pill, and `data-academic-programme-facts="true"` only on a non-empty description list.

- [ ] **Step 6: Route Detailed Cards from the client coordinator**

Import `DetailedProgrammeCard`. Keep the current Grid/List `ProgrammeCard` unchanged except for using shared types. Select the outer collection layout with:

```tsx
className={cn(
  viewMode === 'list'
    ? 'flex flex-col gap-5'
    : cn('grid grid-cols-1 gap-6', gridClasses[columns]),
)}
```

Select each card with:

```tsx
{visibleProgrammes.map((programme) =>
  viewMode === 'detailedCards' ? (
    <DetailedProgrammeCard
      background={background}
      key={String(programme.id)}
      programme={programme}
    />
  ) : (
    <ProgrammeCard
      background={background}
      columns={columns}
      key={String(programme.id)}
      metadataPosition={metadataPosition}
      programme={programme}
      viewMode={viewMode}
    />
  ),
)}
```

Narrow the standard `ProgrammeCard` view prop to `'grid' | 'list'` so Detailed Cards cannot accidentally render Grid/List-only image, badge, category, duration-label, or intake UI.

- [ ] **Step 7: Re-run focused server-render tests**

Run the Step 2 command.

Expected: PASS for the new Detailed Cards tests and all existing Grid/List/header/metadata/surface tests.

---

### Task 3: Verify client interaction, responsive contracts, and theme behaviour

**Files:**
- Modify: `tests/int/academic-programmes-client.int.spec.tsx`
- Modify if a failing semantic assertion requires a correction: `src/blocks/AcademicProgrammes/DetailedProgrammeCard.tsx`
- Modify if a failing routing assertion requires a correction: `src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx`

**Interfaces:**
- Confirms: Detailed Cards use existing filter state and outer columns.
- Confirms: optional/invalid icon states, fact semantics, bottom CTA, and dark-surface styling.

- [ ] **Step 1: Add client-rendered Detailed Cards tests**

Extend every normalized programme object passed directly to `AcademicProgrammesClient` in this test file—including the shared `programmes` fixture and all inline arrays—with `facts: []` unless that test supplies populated facts. Then add:

```tsx
it('filters detailed cards and preserves their responsive fact layout', () => {
  const { container } = render(
    <AcademicProgrammesClient
      background="none"
      columns="2"
      contentAlignment="left"
      metadataPosition="flow"
      programmes={[
        {
          ctaLabel: 'Apply now',
          duration: '4.5 years + 1 year internship',
          eyebrow: 'Undergraduate',
          facts: [
            { icon: 'Users', label: 'Seats', value: '150' },
            { icon: 'BookOpen', label: 'Eligibility', value: '10+2 with PCB' },
            { icon: 'IndianRupee', label: 'Fee', value: 'As notified' },
          ],
          href: '/programmes/mbbs',
          icon: 'GraduationCap',
          id: 'mbbs',
          openInNewTab: false,
          title: 'MBBS',
        },
        {
          ctaLabel: 'Apply now',
          eyebrow: 'Postgraduate',
          facts: [],
          id: 'md',
          openInNewTab: false,
          title: 'MD General Medicine',
        },
      ]}
      showFilter
      viewMode="detailedCards"
    />,
  )

  expect(container.querySelector('[data-academic-programmes-view="detailedCards"]')).not.toBeNull()
  expect(container.querySelector('[data-academic-programme-facts="true"]')).not.toBeNull()
  expect(container.innerHTML).toContain(
    '[grid-template-columns:repeat(auto-fit,minmax(min(100%,8.5rem),1fr))]',
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Postgraduate' }))
  expect(screen.getByRole('heading', { name: 'MD General Medicine' })).not.toBeNull()
  expect(screen.queryByRole('heading', { name: 'MBBS' })).toBeNull()
})
```

Add a semantic/theme test:

```tsx
it('keeps detailed cards semantic on a brand section and omits invalid icons', () => {
  const { container } = render(
    <AcademicProgrammesClient
      background="brand"
      columns="2"
      contentAlignment="left"
      metadataPosition="bottom"
      programmes={[
        {
          cardBackground: 'primary',
          ctaLabel: 'Explore programme',
          facts: [{ icon: 'NotReal', label: 'Seats', value: '42' }],
          href: '/programmes/md',
          icon: 'NotReal',
          id: 'md',
          openInNewTab: true,
          title: 'MD / MS',
        },
      ]}
      showFilter={false}
      viewMode="detailedCards"
    />,
  )

  expect(container.querySelector('dl')).not.toBeNull()
  expect(container.querySelectorAll('dt')).toHaveLength(1)
  expect(container.querySelectorAll('dd')).toHaveLength(1)
  expect(container.querySelector('[data-academic-programme-icon]')).toBeNull()
  expect(container.querySelector('svg')).toBeNull()
  const link = container.querySelector('a')
  expect(link?.getAttribute('target')).toBe('_blank')
  expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
  expect(link?.className).toContain('focus-visible:ring-3')
  expect(container.innerHTML).toContain('bg-primary text-primary-foreground')
  expect(container.innerHTML).toContain('mt-auto pt-7')
})
```

- [ ] **Step 2: Run client and server Academic Programmes tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx
```

Expected: PASS. If a new assertion fails, make the smallest correction in the two permitted presentation files and re-run this exact command.

- [ ] **Step 3: Run the adjacent visual-contract tests before removal work**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: PASS with no Grid/List regression and no raw colour/style contract violation.

---

### Task 4: Remove Study Pathways from active source and test surfaces

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/globals/NewsEventsDetailTemplate.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Delete: `src/blocks/StudyPathways/config.ts`
- Delete: `src/blocks/StudyPathways/Component.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/live-preview-renderer.int.spec.tsx`
- Delete: `tests/int/study-pathways.int.spec.tsx`

**Interfaces:**
- Removes: `StudyPathwaysBlock`, `StudyPathwaysBlockComponent`, and `blockType: 'studyPathways'` from active authoring and runtime paths.
- Retains: Academic Programmes in Pages, Reusable Sections, News & Events Detail Template, production rendering, and live preview.

- [ ] **Step 1: Add failing absence assertions**

Change existing positive `studyPathways` expectations in page/system registration tests to:

```ts
expect(registeredSlugs).not.toContain('studyPathways')
expect(registeredSlugs).toContain('academicProgrammes')
```

In the live-preview renderer source-contract test, add:

```ts
expect(source).not.toContain("case 'studyPathways'")
expect(source).not.toContain('StudyPathwaysBlockComponent')
expect(source).toContain("case 'academicProgrammes'")
```

Update exact registered-block counts by one wherever these focused tests assert a current count.

- [ ] **Step 2: Run registry/renderer tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx
```

Expected: FAIL because Study Pathways remains registered and rendered.

- [ ] **Step 3: Remove Study Pathways imports, registrations, and renderer cases**

Use precise patches to remove only:

```ts
import { StudyPathwaysBlock } from '@/blocks/StudyPathways/config'
```

and the corresponding `StudyPathwaysBlock,` array entries from Pages, Reusable Sections, and News & Events Detail Template. Remove only the Study Pathways component imports and `case 'studyPathways'` branches from both renderers. Preserve neighboring block order.

- [ ] **Step 4: Delete Study Pathways source and focused test files**

Delete exactly these text files with patch-based deletions:

```text
src/blocks/StudyPathways/config.ts
src/blocks/StudyPathways/Component.tsx
tests/int/study-pathways.int.spec.tsx
```

Do not modify historical specifications or plans that mention Study Pathways.

- [ ] **Step 5: Re-run registry/renderer tests**

Run the Step 2 command.

Expected: PASS with Academic Programmes still present and Study Pathways absent.

---

### Task 5: Consolidate thumbnails, generated types, and maintained documentation

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Delete: `public/block-thumbnails/study-pathways.jpg`
- Regenerate: `public/block-thumbnails/academic-programmes.jpg`
- Regenerate: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Removes: Study Pathways thumbnail definition, fixture, asset, generated type, union members, and maintained documentation entries.
- Updates: Academic Programmes fixture/thumbnail to demonstrate Detailed Cards.
- Updates: normal Page block count from 52 to 51.

- [ ] **Step 1: Add failing thumbnail and generated-type assertions**

Add to the thumbnail metadata test:

```ts
expect(definitionSlugs).not.toContain('studyPathways')
expect(definitionSlugs).toContain('academicProgrammes')
```

Change the fixture absence assertion to:

```ts
expect(Object.keys(blockThumbnailFixtures)).not.toContain('studyPathways')
```

Replace the existing Academic Programmes fixture assertions with:

```tsx
expect(html).toContain('data-academic-programmes-view="detailedCards"')
expect(html).toContain('data-academic-programme-icon="graduation-cap"')
expect(html).toContain('4.5 Years + 1 Year Internship')
expect(html).toContain('Eligibility')
expect(html).toContain('Fee')
expect(html).toContain('Apply now')
```

In the Academic Programmes schema test, add:

```tsx
import { readFileSync } from 'node:fs'
import path from 'node:path'

const generatedTypes = readFileSync(
  path.resolve(process.cwd(), 'src/payload-types.ts'),
  'utf8',
)
```

Then assert:

```tsx
expect(generatedTypes).toContain("viewMode?: ('grid' | 'list' | 'detailedCards') | null")
expect(generatedTypes).toContain('facts?:')
expect(generatedTypes).not.toContain('export interface StudyPathwaysBlock')
expect(generatedTypes).not.toContain("studyPathways?:")
```

- [ ] **Step 2: Run thumbnail/type-adjacent tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/academic-programmes.int.spec.tsx
```

Expected: FAIL while the Study Pathways definition, fixture, asset/type references, and old Academic fixture remain.

- [ ] **Step 3: Remove the Study Pathways thumbnail definition and fixture**

Remove its import, fixture object entry, and definition object only. Update the Academic Programmes fixture to use:

```tsx
<AcademicProgrammesBlockComponent
  columns="2"
  eyebrow="Our programmes"
  programmes={[
    {
      ctaLabel: 'Apply now',
      description: 'Our flagship undergraduate programme combines medical science and supervised clinical learning.',
      duration: '4.5 Years + 1 Year Internship',
      eyebrow: 'Undergraduate',
      facts: [
        { icon: 'Users', label: 'Seats', value: '150' },
        { icon: 'BookOpen', label: 'Eligibility', value: '10+2 with PCB, NEET-UG qualified' },
        { icon: 'IndianRupee', label: 'Fee', value: 'As officially notified' },
      ],
      icon: 'GraduationCap',
      linkType: 'custom',
      title: 'MBBS',
      url: '/programmes/mbbs',
    },
    {
      ctaLabel: 'Apply now',
      description: 'Postgraduate specialisations across clinical disciplines.',
      duration: '3 Years',
      eyebrow: 'Postgraduate',
      facts: [
        { icon: 'Users', label: 'Seats', value: 'As approved' },
        { icon: 'BookOpen', label: 'Eligibility', value: 'MBBS and NEET-PG qualified' },
        { icon: 'IndianRupee', label: 'Fee', value: 'As officially notified' },
      ],
      icon: 'GraduationCap',
      linkType: 'custom',
      title: 'MD / MS',
      url: '/programmes/postgraduate',
    },
  ]}
  showFilter
  title="Medical education from undergraduate study to specialist training"
  viewMode="detailedCards"
/>
```

- [ ] **Step 4: Delete the exact obsolete JPEG and regenerate Payload types**

Confirm the exact file first:

```bash
test -f public/block-thumbnails/study-pathways.jpg
```

Then delete only `public/block-thumbnails/study-pathways.jpg` and run:

```bash
pnpm generate:types
```

Expected: type generation succeeds; `AcademicProgrammesBlock` includes `detailedCards`, `icon`, and `facts`; `StudyPathwaysBlock` and its select/union members disappear.

- [ ] **Step 5: Update maintained documentation**

Make these exact narrative changes:

- `docs/guides/blocks.md`: remove the Study Pathways row; describe Academic Programmes as Grid, List, or Detailed Cards with category filters, optional images, duration pill, configurable icon/facts, actions, and semantic card surfaces.
- `docs/architecture/feature-inventory.md`: change the normal Page count from 52 to 51 and remove Study Pathways from the enumerated list.
- `.agents/skills/project-context/references/block-system.md`: change the registry count from 52 to 51, remove `studyPathways` from the ordered slug list, and extend the Academic Programmes paragraph with Detailed Cards' icon, duration pill, zero-to-four facts, dynamic icons, responsive auto-fit fact grid, and single-card action contract. Record that Study Pathways was removed without migration or compatibility rendering.

Do not edit historical files under `docs/superpowers/**` beyond this spec and plan.

- [ ] **Step 6: Regenerate the Academic Programmes thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=academicProgrammes pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/academic-programmes.jpg` is regenerated from the production component fixture.

Open the JPEG and verify:

- two equal programme columns at desktop;
- section header follows existing Academic Programmes rhythm;
- icon square and duration pill align on one utility row;
- sans-serif titles and body copy match shared type sizes;
- facts wrap without clipping or overflow;
- CTA sits at the bottom and its arrow remains adjacent to the label;
- no literal reference-image colours appear.

- [ ] **Step 7: Re-run thumbnail/type-adjacent tests**

Run the Step 2 command.

Expected: PASS.

---

### Task 6: Complete verification and the project-context loop

**Files:**
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`
- Modify only if the context updater proves another maintained reference is stale: `.agents/skills/project-context/references/*.md`

**Interfaces:**
- Produces: one canonical programme-directory block, 51 Page blocks, current generated project knowledge, and no active Study Pathways surface.

- [ ] **Step 1: Search for stale active Study Pathways references**

Run:

```bash
rg -n "StudyPathways|studyPathways|Study Pathways|study-pathways" src tests public docs/guides docs/architecture .agents/skills/project-context/references
```

Expected before context generation: no matches in active source/tests/public/operator docs; the manually updated `block-system.md` may contain only the approved historical removal sentence. Do not search-and-replace historical `docs/superpowers/**` files.

- [ ] **Step 2: Run all focused and neighboring integration tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/academic-programmes.int.spec.tsx tests/int/academic-programmes-client.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/live-preview-renderer.int.spec.tsx tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-surface-semantics.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
```

Expected: all selected tests PASS.

- [ ] **Step 3: Run TypeScript and lint separately**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both commands exit 0. Existing non-blocking repository warnings may remain only if they predate this task; no new Academic Programmes or removed-import warning is acceptable.

- [ ] **Step 4: Run the Impeccable layout detector on changed UI files**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json --scope layout src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx src/blocks/AcademicProgrammes/DetailedProgrammeCard.tsx
```

Expected: JSON output contains no actionable layout findings. Fix any new finding in the detailed presentation and repeat the focused tests before continuing.

- [ ] **Step 5: Update and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `project-inventory.json` reflects 51 registered Page blocks, no Study Pathways module/slug, the new Academic Programmes files, and current generated Payload fields. The check exits 0. Inspect generated diffs and retain only changes explained by this implementation.

- [ ] **Step 6: Run final whitespace and workspace checks**

Run:

```bash
git diff --check
git status --short
git diff --stat
```

Expected: no whitespace errors. The status includes the approved spec/plan, Academic Programmes implementation/tests/thumbnail/types/docs/context updates, and explicit Study Pathways deletions alongside the user's pre-existing unrelated changes. Everything remains unstaged and uncommitted.
