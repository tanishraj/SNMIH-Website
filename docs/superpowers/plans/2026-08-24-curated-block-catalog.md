# Curated Block Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat 53-block Page-builder choice with a code-owned, job-based native Payload catalog containing 18 recommended blocks and a complete Advanced Library.

**Architecture:** Add one server-only block catalog that imports Payload block config objects, assigns native `admin.group` metadata without mutation, and exports the Page, Reusable Section, and News/Event template schema registries. Collections and globals consume those exports while production and live-preview renderers remain explicit and separate.

**Tech Stack:** Payload CMS 3.85, TypeScript, Next.js 15, Vitest, pnpm

## Global Constraints

- Keep the project one client per deployment; do not add tenants, tenant switching, or CMS-editable catalog settings.
- Use Payload's native searchable block drawer, thumbnails, focus management, keyboard behavior, and responsive behavior.
- Keep all 53 Page-compatible blocks registered; recommend exactly 18 and place all remaining blocks in `Advanced Library`.
- Preserve every stored block slug, field, interface, validation function, thumbnail, public renderer, and live-preview renderer.
- Keep `Reusable Section` unavailable inside Reusable Sections.
- Keep `News & Events Content` exclusive to the News/Event detail-template registry and group it under `Template Core`.
- Do not use `filterOptions`, role-based hiding, a custom Blocks field, favorites, recent blocks, or page recipes.
- Keep the schema catalog server-only; do not import production React renderers, live-preview renderers, or client-only modules into it.
- Do not commit any specification, plan, implementation, generated file, or documentation change. Use diff checkpoints instead.

---

## File Structure

- Create `src/blocks/blockCatalog.ts`: own canonical server-side block config imports, intent groups, immutable decoration, duplicate detection, and the three registry exports.
- Create `tests/int/block-catalog.int.spec.ts`: prove the approved vocabulary, stable ordering, duplicate rejection, registry differences, and metadata preservation.
- Modify `src/collections/Pages.ts`: replace 53 direct config imports and the literal blocks array with `pageBuilderBlocks`.
- Modify `src/collections/ReusableSections.ts`: replace 52 direct config imports and the literal blocks array with `reusableSectionBuilderBlocks`.
- Modify `src/globals/NewsEventsDetailTemplate.ts`: replace the local detail-template array with `newsEventsDetailBuilderBlocks`; retain validation and global behavior locally.
- Modify `tests/int/page-blocks.int.spec.ts`: assert the native intent-group contract on the Page layout field.
- Modify `tests/int/news-events-detail-template.int.spec.tsx`: assert `Template Core` and canonical registry parity.
- Modify `tests/int/block-thumbnails.int.spec.ts`: keep thumbnail parity coverage aligned with the decorated configs.
- Create `tests/int/helpers/generatedPayloadInterface.ts`: extract one generated Payload interface without relying on registry adjacency.
- Modify `tests/int/cta39.int.spec.tsx`, `tests/int/content-highlights.int.spec.tsx`, `tests/int/department-profiles.int.spec.tsx`, `tests/int/icon-card-showcase.int.spec.tsx`, and `tests/int/news-grid.int.spec.tsx`: use order-independent generated-interface extraction.
- Modify `tests/int/editorial-reasons.int.spec.tsx`, `tests/int/program-matrix.int.spec.tsx`, `tests/int/student-experience.int.spec.tsx`, and `tests/int/testimonial-spotlight-config.int.spec.ts`: assert canonical catalog membership/grouping rather than old collection-source adjacency.
- Modify `.agents/skills/project-context/scripts/project-context-lib.mjs`: teach maintained inventory generation to read the canonical grouped catalog.
- Modify `tests/int/project-context-lib.int.spec.ts`: cover grouped-catalog parsing and current inventory output.
- Modify `docs/guides/blocks.md`: document the editor-facing categories and per-deployment customization contract.
- Modify `.agents/skills/project-context/references/block-system.md`: document the canonical schema catalog and specialized registry differences.
- Regenerate `src/payload-types.ts` and `.agents/skills/project-context/references/project-inventory.json` only if their generators produce deterministic changes.

---

### Task 1: Build the typed server-only catalog

**Files:**
- Create: `src/blocks/blockCatalog.ts`
- Create: `tests/int/block-catalog.int.spec.ts`

**Interfaces:**
- Produces: `blockPickerGroups`, an immutable label map.
- Produces: `BlockPickerGroup`, the union of group label values.
- Produces: `BlockGroupDefinition`, a readonly group plus readonly Payload block list.
- Produces: `buildBlockRegistry(groups: readonly BlockGroupDefinition[]): Block[]`.
- Produces: `pageBlockGroupDefinitions`, the code-owned client vocabulary.
- Produces: `pageBuilderBlocks`, `reusableSectionBuilderBlocks`, and `newsEventsDetailBuilderBlocks`.
- Preserves: every input block's `admin.images` and all non-group Admin metadata.

- [ ] **Step 1: Write the failing catalog contract**

Create `tests/int/block-catalog.int.spec.ts`:

```ts
import type { Block } from 'payload'
import { describe, expect, it } from 'vitest'

import {
  blockPickerGroups,
  buildBlockRegistry,
  newsEventsDetailBuilderBlocks,
  pageBuilderBlocks,
  reusableSectionBuilderBlocks,
} from '@/blocks/blockCatalog'

const slugsForGroup = (blocks: Block[], group: string) =>
  blocks.filter((block) => block.admin?.group === group).map((block) => block.slug)

const recommendedGroups = [
  blockPickerGroups.start,
  blockPickerGroups.explain,
  blockPickerGroups.explore,
  blockPickerGroups.prove,
  blockPickerGroups.convert,
]

describe('curated block catalog', () => {
  it('offers the approved 18-block vocabulary before the advanced library', () => {
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.start)).toEqual([
      'pageHeader',
      'heroBanner',
      'reusableSection',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.explain)).toEqual([
      'richText',
      'aboutSection',
      'featureSpotlight',
      'contentHighlights',
      'academicProgrammes',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.explore)).toEqual([
      'newsEventsTabs',
      'departmentProfiles',
      'galleryAlbumTabs',
      'qaAccordion',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.prove)).toEqual([
      'statsStrip',
      'testimonialSpotlight',
      'accreditationCards',
    ])
    expect(slugsForGroup(pageBuilderBlocks, blockPickerGroups.convert)).toEqual([
      'bannerCta',
      'contact24',
      'downloadList',
    ])

    const recommended = pageBuilderBlocks.filter((block) =>
      recommendedGroups.includes(block.admin?.group as (typeof recommendedGroups)[number]),
    )
    const groupsInDrawerOrder = [...new Set(pageBuilderBlocks.map((block) => block.admin?.group))]

    expect(recommended).toHaveLength(18)
    expect(groupsInDrawerOrder).toEqual([
      ...recommendedGroups,
      blockPickerGroups.advanced,
    ])
  })

  it('registers every Page block exactly once and classifies the remainder as advanced', () => {
    const pageSlugs = pageBuilderBlocks.map((block) => block.slug)
    const advancedSlugs = slugsForGroup(pageBuilderBlocks, blockPickerGroups.advanced)

    expect(pageSlugs).toHaveLength(53)
    expect(new Set(pageSlugs).size).toBe(pageSlugs.length)
    expect(advancedSlugs).toHaveLength(35)
    expect(pageBuilderBlocks.every((block) => typeof block.admin?.group === 'string')).toBe(true)
  })

  it('preserves the documented special-registry differences', () => {
    const pageSlugs = pageBuilderBlocks.map((block) => block.slug)
    const reusableSlugs = reusableSectionBuilderBlocks.map((block) => block.slug)
    const detailSlugs = newsEventsDetailBuilderBlocks.map((block) => block.slug)

    expect(reusableSlugs).toEqual(pageSlugs.filter((slug) => slug !== 'reusableSection'))
    expect(detailSlugs.slice(1)).toEqual(pageSlugs)
    expect(detailSlugs[0]).toBe('newsEventsContent')
    expect(newsEventsDetailBuilderBlocks[0]?.admin?.group).toBe(blockPickerGroups.templateCore)
    expect(pageSlugs).not.toContain('newsEventsContent')
    expect(reusableSlugs).not.toContain('newsEventsContent')
  })

  it('decorates without losing thumbnail metadata or mutating the source object', () => {
    const pageHeader = pageBuilderBlocks.find((block) => block.slug === 'pageHeader')

    expect(pageHeader).not.toBe(PageHeaderBlock)
    expect(PageHeaderBlock.admin?.group).toBeUndefined()
    expect(pageHeader?.admin?.group).toBe(blockPickerGroups.start)
    expect(pageHeader?.admin?.images?.thumbnail).toMatchObject({
      alt: 'Page Header block preview',
      url: '/block-thumbnails/page-header.jpg',
    })
  })

  it('rejects duplicate slugs instead of silently rendering an ambiguous catalog', () => {
    const duplicate: Block = { fields: [], slug: 'duplicate' }

    expect(() =>
      buildBlockRegistry([
        { blocks: [duplicate], group: blockPickerGroups.start },
        { blocks: [duplicate], group: blockPickerGroups.advanced },
      ]),
    ).toThrowError('Duplicate block slug in catalog: duplicate')
  })
})
```

Add this import with the catalog imports in the test:

```ts
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
```

- [ ] **Step 2: Run the contract and verify the missing-module failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-catalog.int.spec.ts
```

Expected: FAIL because `@/blocks/blockCatalog` does not exist.

- [ ] **Step 3: Implement the canonical catalog**

Create `src/blocks/blockCatalog.ts`. Import `Block` from Payload and each block config currently imported by `Pages.ts`, plus `NewsEventsContentBlock`. Define the complete module as follows; preserve alphabetical import formatting through ESLint rather than changing block config files.

```ts
import type { Block } from 'payload'

import { AboutSectionBlock } from '@/blocks/AboutSection/config'
import { AcademicProgrammesBlock } from '@/blocks/AcademicProgrammes/config'
import { AccreditationCardsBlock } from '@/blocks/AccreditationCards/config'
import { AnnouncementBlock } from '@/blocks/Announcement/config'
import { AwardsListBlock } from '@/blocks/AwardsList/config'
import { BannerCtaBlock } from '@/blocks/BannerCta/config'
import { BentoGridBlock } from '@/blocks/BentoGrid/config'
import { BreadcrumbBlock } from '@/blocks/Breadcrumb/config'
import { Contact24Block } from '@/blocks/Contact24/config'
import { Contact33Block } from '@/blocks/Contact33/config'
import { ContentHighlightsBlock } from '@/blocks/ContentHighlights/config'
import { Cta39Block } from '@/blocks/Cta39/config'
import { DepartmentProfilesBlock } from '@/blocks/DepartmentProfiles/config'
import { DownloadListBlock } from '@/blocks/DownloadList/config'
import { EditorialReasonsBlock } from '@/blocks/EditorialReasons/config'
import { EventGalleryBlock } from '@/blocks/EventGallery/config'
import { FeatureMatrixBlock } from '@/blocks/FeatureMatrix/config'
import { FeatureSpotlightBlock } from '@/blocks/FeatureSpotlight/config'
import { FeeStructureBlock } from '@/blocks/FeeStructure/config'
import { GalleryAlbumTabsBlock } from '@/blocks/GalleryAlbumTabs/config'
import { GalleryCoverflowBlock } from '@/blocks/GalleryCoverflow/config'
import { GalleryShowcaseBlock } from '@/blocks/GalleryShowcase/config'
import { HeroBannerBlock } from '@/blocks/HeroBanner/config'
import { HeroCarouselBlock } from '@/blocks/HeroCarousel/config'
import { IconCardShowcaseBlock } from '@/blocks/IconCardShowcase/config'
import { IconGridBlock } from '@/blocks/IconGrid/config'
import { ImageMosaicBlock } from '@/blocks/ImageMosaic/config'
import { LeadershipProfilesBlock } from '@/blocks/LeadershipProfiles/config'
import { LogoStripBlock } from '@/blocks/LogoStrip/config'
import { MediaCarouselBlock } from '@/blocks/MediaCarousel/config'
import { NewsEventsContentBlock } from '@/blocks/NewsEventsContent/config'
import { NewsEventsHighlightsBlock } from '@/blocks/NewsEventsHighlights/config'
import { NewsEventsTabsBlock } from '@/blocks/NewsEventsTabs/config'
import { NewsGridBlock } from '@/blocks/NewsGrid/config'
import { NumberedStepsBlock } from '@/blocks/NumberedSteps/config'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
import { ProfileCarouselBlock } from '@/blocks/ProfileCarousel/config'
import { ProgramMatrixBlock } from '@/blocks/ProgramMatrix/config'
import { QaAccordionBlock } from '@/blocks/QaAccordion/config'
import { QuoteBlockBlock } from '@/blocks/QuoteBlock/config'
import { RatingSpotlightBlock } from '@/blocks/RatingSpotlight/config'
import { ReusableSectionBlock } from '@/blocks/ReusableSection/config'
import { ReviewFeedBlock } from '@/blocks/ReviewFeed/config'
import { ReviewSubmissionBlock } from '@/blocks/ReviewSubmission/config'
import { RichTextBlock } from '@/blocks/RichTextBlock/config'
import { Services21Block } from '@/blocks/Services21/config'
import { StatsStripBlock } from '@/blocks/StatsStrip/config'
import { StudentExperienceBlock } from '@/blocks/StudentExperience/config'
import { TabsContentBlock } from '@/blocks/TabsContent/config'
import { TeamShowcaseBlock } from '@/blocks/TeamShowcase/config'
import { TestimonialGridBlock } from '@/blocks/TestimonialGrid/config'
import { TestimonialSpotlightBlock } from '@/blocks/TestimonialSpotlight/config'
import { TimelineBlock } from '@/blocks/Timeline/config'
import { VideoEmbedBlock } from '@/blocks/VideoEmbed/config'

export const blockPickerGroups = {
  start: 'Start',
  explain: 'Explain',
  explore: 'Explore',
  prove: 'Prove',
  convert: 'Convert',
  advanced: 'Advanced Library',
  templateCore: 'Template Core',
} as const

export type BlockPickerGroup = (typeof blockPickerGroups)[keyof typeof blockPickerGroups]

export type BlockGroupDefinition = Readonly<{
  blocks: readonly Block[]
  group: BlockPickerGroup
}>

const decorateBlock = (block: Block, group: BlockPickerGroup): Block => ({
  ...block,
  admin: {
    ...block.admin,
    group,
  },
})

export const buildBlockRegistry = (groups: readonly BlockGroupDefinition[]): Block[] => {
  const slugs = new Set<string>()

  return groups.flatMap(({ blocks, group }) =>
    blocks.map((block) => {
      if (slugs.has(block.slug)) {
        throw new Error(`Duplicate block slug in catalog: ${block.slug}`)
      }

      slugs.add(block.slug)
      return decorateBlock(block, group)
    }),
  )
}

export const pageBlockGroupDefinitions = [
  {
    group: blockPickerGroups.start,
    blocks: [PageHeaderBlock, HeroBannerBlock, ReusableSectionBlock],
  },
  {
    group: blockPickerGroups.explain,
    blocks: [
      RichTextBlock,
      AboutSectionBlock,
      FeatureSpotlightBlock,
      ContentHighlightsBlock,
      AcademicProgrammesBlock,
    ],
  },
  {
    group: blockPickerGroups.explore,
    blocks: [
      NewsEventsTabsBlock,
      DepartmentProfilesBlock,
      GalleryAlbumTabsBlock,
      QaAccordionBlock,
    ],
  },
  {
    group: blockPickerGroups.prove,
    blocks: [StatsStripBlock, TestimonialSpotlightBlock, AccreditationCardsBlock],
  },
  {
    group: blockPickerGroups.convert,
    blocks: [BannerCtaBlock, Contact24Block, DownloadListBlock],
  },
  {
    group: blockPickerGroups.advanced,
    blocks: [
      AnnouncementBlock,
      NewsGridBlock,
      Cta39Block,
      HeroCarouselBlock,
      GalleryCoverflowBlock,
      FeatureMatrixBlock,
      EditorialReasonsBlock,
      LeadershipProfilesBlock,
      NewsEventsHighlightsBlock,
      ProfileCarouselBlock,
      GalleryShowcaseBlock,
      EventGalleryBlock,
      ImageMosaicBlock,
      StudentExperienceBlock,
      RatingSpotlightBlock,
      ReviewFeedBlock,
      ReviewSubmissionBlock,
      Contact33Block,
      TeamShowcaseBlock,
      Services21Block,
      VideoEmbedBlock,
      MediaCarouselBlock,
      ProgramMatrixBlock,
      LogoStripBlock,
      BreadcrumbBlock,
      TimelineBlock,
      IconCardShowcaseBlock,
      IconGridBlock,
      QuoteBlockBlock,
      TabsContentBlock,
      FeeStructureBlock,
      NumberedStepsBlock,
      BentoGridBlock,
      TestimonialGridBlock,
      AwardsListBlock,
    ],
  },
] as const satisfies readonly BlockGroupDefinition[]

export const pageBuilderBlocks = buildBlockRegistry(pageBlockGroupDefinitions)

export const reusableSectionBuilderBlocks = pageBuilderBlocks.filter(
  (block) => block.slug !== ReusableSectionBlock.slug,
)

export const newsEventsDetailBuilderBlocks = buildBlockRegistry([
  {
    group: blockPickerGroups.templateCore,
    blocks: [NewsEventsContentBlock],
  },
  ...pageBlockGroupDefinitions,
])
```

- [ ] **Step 4: Run the catalog test and verify it passes**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-catalog.int.spec.ts
```

Expected: PASS with 5 tests.

- [ ] **Step 5: Review the isolated catalog diff without committing**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors; the new catalog and test are uncommitted.

---

### Task 2: Make every Payload composition surface consume the catalog

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/globals/NewsEventsDetailTemplate.ts`
- Modify: `tests/int/block-catalog.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Create: `tests/int/helpers/generatedPayloadInterface.ts`
- Modify: `tests/int/cta39.int.spec.tsx`
- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `tests/int/department-profiles.int.spec.tsx`
- Modify: `tests/int/editorial-reasons.int.spec.tsx`
- Modify: `tests/int/icon-card-showcase.int.spec.tsx`
- Modify: `tests/int/news-grid.int.spec.tsx`
- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `tests/int/student-experience.int.spec.tsx`
- Modify: `tests/int/testimonial-spotlight-config.int.spec.ts`

**Interfaces:**
- Consumes: the three `Block[]` registry exports from Task 1.
- Preserves: `Pages`, `ReusableSections`, and `NewsEventsDetailTemplate` public config exports.
- Preserves: News/Event detail publication validation and all collection/global hooks.

- [ ] **Step 1: Extend the contract to require exact registry consumption**

Change the first Payload type import in `tests/int/block-catalog.int.spec.ts` to `import type { Block, Field } from 'payload'`, then add these imports:

```ts
import { Pages } from '@/collections/Pages'
import { ReusableSections } from '@/collections/ReusableSections'
import { NewsEventsDetailTemplate } from '@/globals/NewsEventsDetailTemplate'
```

Add this helper above the `describe` block:

```ts
const findBlocksFieldValue = (fields: Field[]): Block[] | undefined => {
  for (const field of fields) {
    if (field.type === 'blocks') return field.blocks

    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const match = findBlocksFieldValue(tab.fields)
        if (match) return match
      }
    }

    if ('fields' in field && Array.isArray(field.fields)) {
      const match = findBlocksFieldValue(field.fields)
      if (match) return match
    }
  }

  return undefined
}
```

Add this test:

```ts
it('is the exact schema source for all three composition surfaces', () => {
  expect(findBlocksFieldValue(Pages.fields)).toBe(pageBuilderBlocks)
  expect(findBlocksFieldValue(ReusableSections.fields)).toBe(reusableSectionBuilderBlocks)
  expect(findBlocksFieldValue(NewsEventsDetailTemplate.fields)).toBe(
    newsEventsDetailBuilderBlocks,
  )
})
```

- [ ] **Step 2: Run the contract and verify that literal registries fail identity checks**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-catalog.int.spec.ts
```

Expected: FAIL on `is the exact schema source for all three composition surfaces` because the configs still own literal arrays.

- [ ] **Step 3: Wire Pages to the canonical Page registry**

In `src/collections/Pages.ts`, remove all imports from `@/blocks/*/config`. Add:

```ts
import { pageBuilderBlocks } from '@/blocks/blockCatalog'
```

Replace the complete literal `blocks: [...]` value on the `layout` field with:

```ts
blocks: pageBuilderBlocks,
```

Do not change the field name, label, `required`, description, or `initCollapsed` value.

- [ ] **Step 4: Wire Reusable Sections to the non-recursive registry**

In `src/collections/ReusableSections.ts`, remove all imports from `@/blocks/*/config`. Add:

```ts
import { reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'
```

Replace the comment and literal `blocks: [...]` value with:

```ts
// Reusable Section is intentionally excluded to prevent direct recursive selection.
blocks: reusableSectionBuilderBlocks,
```

Do not change access, hooks, drafts, title fields, or descriptions.

- [ ] **Step 5: Wire the News/Event template to the specialized registry**

In `src/globals/NewsEventsDetailTemplate.ts`, remove every `@/blocks/*/config` import and delete the local `detailTemplateBlocks` constant. Add:

```ts
import { newsEventsDetailBuilderBlocks } from '@/blocks/blockCatalog'
```

Change only the layout field registry:

```ts
blocks: newsEventsDetailBuilderBlocks,
```

Keep `validateNewsEventsDetailLayout`, capabilities, access, versions, hooks, and the instruction to add exactly one dynamic block unchanged.

- [ ] **Step 6: Add direct native-group assertions to existing contracts**

In the `registers a general layout blocks field on Pages` test in `tests/int/page-blocks.int.spec.ts`, widen the local blocks type and add these assertions:

```ts
const layoutField = getLayoutField() as
  | {
      blocks?: Array<{ admin?: { group?: string }; slug: string }>
      type?: string
    }
  | undefined

expect(layoutField?.blocks?.[0]).toMatchObject({
  admin: { group: 'Start' },
  slug: 'pageHeader',
})
expect(layoutField?.blocks?.at(-1)?.admin?.group).toBe('Advanced Library')
```

In `tests/int/news-events-detail-template.int.spec.tsx`, add after `templateSlugs` is built:

```ts
const templateBlocks = collectBlocks(NewsEventsDetailTemplate.fields)
```

Then add:

```ts
expect(templateBlocks[0]).toMatchObject({
  admin: { group: 'Template Core' },
  slug: 'newsEventsContent',
})
```

In `tests/int/block-thumbnails.int.spec.ts`, retain the existing `uses manifest metadata in every Payload block config` test unchanged. It is the regression proof that shallow decoration preserves `admin.images.thumbnail`.

- [ ] **Step 7: Replace source-file and adjacency assumptions with catalog contracts**

In `tests/int/editorial-reasons.int.spec.tsx`, `tests/int/program-matrix.int.spec.tsx`, and `tests/int/student-experience.int.spec.tsx`:

1. Delete the `pagesSource` and `reusableSectionsSource` constants.
2. Import both registry exports:

```ts
import { pageBuilderBlocks, reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'
```

3. Replace their Page/Reusable source assertions with the relevant slug checks. For example, Editorial Reasons becomes:

```ts
expect(pageBuilderBlocks.map(({ slug }) => slug)).toContain('editorialReasons')
expect(reusableSectionBuilderBlocks.map(({ slug }) => slug)).toContain('editorialReasons')
```

Use `programMatrix` and `studentExperience` respectively in the other two files. Keep production renderer, live-preview renderer, thumbnail, generated type, and documentation assertions unchanged.

In `tests/int/department-profiles.int.spec.tsx`, delete the reads of `Pages.ts` and `ReusableSections.ts`, import both registry exports, and replace the two source assertions with:

```ts
expect(pageBuilderBlocks.map(({ slug }) => slug)).toContain('departmentProfiles')
expect(reusableSectionBuilderBlocks.map(({ slug }) => slug)).toContain('departmentProfiles')
```

In `tests/int/testimonial-spotlight-config.int.spec.ts`, retain the Page and Reusable Section membership assertions but replace both adjacency assertions with:

```ts
const pageBlock = collectRegisteredBlocks(Pages.fields).find(
  ({ slug }) => slug === 'testimonialSpotlight',
)
const reusableBlock = collectRegisteredBlocks(ReusableSections.fields).find(
  ({ slug }) => slug === 'testimonialSpotlight',
)

expect(pageBlock?.admin?.group).toBe('Prove')
expect(reusableBlock?.admin?.group).toBe('Prove')
```

This removes the obsolete requirement that Testimonial Spotlight immediately follow Feature Spotlight while retaining its cross-surface registration contract.

- [ ] **Step 8: Make generated-type assertions independent of picker order**

Create `tests/int/helpers/generatedPayloadInterface.ts`:

```ts
export const getGeneratedPayloadInterface = (source: string, interfaceName: string): string => {
  const marker = `export interface ${interfaceName} {`
  const start = source.indexOf(marker)

  if (start === -1) {
    throw new Error(`Missing generated Payload interface: ${interfaceName}`)
  }

  const nextInterface = source.indexOf('\nexport interface ', start + marker.length)
  return source.slice(start, nextInterface === -1 ? source.length : nextInterface)
}
```

Import this helper in the five tests that currently slice to a specifically named neighboring block interface:

```ts
import { getGeneratedPayloadInterface } from './helpers/generatedPayloadInterface'
```

Replace each adjacency-based slice with:

```ts
const ctaType = getGeneratedPayloadInterface(generatedTypes, 'Cta39Block')
const contentHighlightsType = getGeneratedPayloadInterface(
  generatedTypes,
  'ContentHighlightsBlock',
)
const generatedDepartmentProfiles = getGeneratedPayloadInterface(
  generated,
  'DepartmentProfilesBlock',
)
const contract = getGeneratedPayloadInterface(source, 'IconCardShowcaseBlock')
const newsGridInterface = getGeneratedPayloadInterface(generatedTypes, 'NewsGridBlock')
```

Apply the matching replacement in `tests/int/cta39.int.spec.tsx`, `tests/int/content-highlights.int.spec.tsx`, `tests/int/department-profiles.int.spec.tsx`, `tests/int/icon-card-showcase.int.spec.tsx`, and `tests/int/news-grid.int.spec.tsx`. Keep every existing positive and negative field assertion.

- [ ] **Step 9: Run the focused registry suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/cta39.int.spec.tsx \
  tests/int/content-highlights.int.spec.tsx \
  tests/int/department-profiles.int.spec.tsx \
  tests/int/editorial-reasons.int.spec.tsx \
  tests/int/icon-card-showcase.int.spec.tsx \
  tests/int/news-grid.int.spec.tsx \
  tests/int/program-matrix.int.spec.tsx \
  tests/int/student-experience.int.spec.tsx \
  tests/int/testimonial-spotlight-config.int.spec.ts
```

Expected: PASS. Existing Page count remains 53, Reusable Sections remain Page-minus-Reusable-Section, News/Event detail remains Page-plus-News-Events-Content, and every thumbnail assertion passes.

- [ ] **Step 10: Review the schema wiring diff without committing**

Run:

```bash
git diff --check
git diff --stat
git status --short
```

Expected: no whitespace errors and no commit created.

---

### Task 3: Teach project-context inventory about the canonical catalog

**Files:**
- Modify: `.agents/skills/project-context/scripts/project-context-lib.mjs`
- Modify: `tests/int/project-context-lib.int.spec.ts`

**Interfaces:**
- Produces: `extractBlockGroupIdentifiers(source: string, filePath: string, exportName: string): string[]`.
- Changes: `buildProjectInventory()` reads Page registry order from `pageBlockGroupDefinitions` and derives the Reusable Section registry by excluding `ReusableSectionBlock`.
- Preserves: literal-array parsing for Header, Footer, System Page, collections, and globals.

- [ ] **Step 1: Add a failing parser fixture and inventory assertion**

In `tests/int/project-context-lib.int.spec.ts`, add `extractBlockGroupIdentifiers` to the imported names. Add this fixture after `blockFixture`:

```ts
const groupedBlockCatalogFixture = `
  export const pageBlockGroupDefinitions = [
    { group: 'Start', blocks: [PageHeaderBlock, HeroBannerBlock] },
    { group: 'Advanced Library', blocks: [AnnouncementBlock] },
  ] as const
`
```

Add this test inside `project context parser`:

```ts
it('extracts canonical grouped block registries in drawer order', () => {
  expect(
    extractBlockGroupIdentifiers(
      groupedBlockCatalogFixture,
      'src/blocks/blockCatalog.ts',
      'pageBlockGroupDefinitions',
    ),
  ).toEqual(['PageHeaderBlock', 'HeroBannerBlock', 'AnnouncementBlock'])
})
```

Keep the existing `builds the current registered Payload and block inventory` test unchanged; after Task 2 it will also fail until inventory reads the catalog rather than the removed literal arrays.

- [ ] **Step 2: Run the parser tests and verify both failures**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/project-context-lib.int.spec.ts
```

Expected: FAIL because `extractBlockGroupIdentifiers` is not exported and current inventory cannot discover Page blocks through the imported registry.

- [ ] **Step 3: Implement grouped registry extraction**

Add this exported function immediately after `extractArrayPropertyIdentifiers` in `.agents/skills/project-context/scripts/project-context-lib.mjs`:

```js
export function extractBlockGroupIdentifiers(source, filePath, exportName) {
  const ast = parseSource(source, filePath)

  for (const statement of ast.statements) {
    if (!ts.isVariableStatement(statement)) continue

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== exportName) continue
      if (!declaration.initializer) {
        throw new Error(`${exportName} has no initializer in ${filePath}`)
      }

      const initializer = unwrapExpression(declaration.initializer)
      if (!ts.isArrayLiteralExpression(initializer)) {
        throw new Error(`${exportName} is not an array literal in ${filePath}`)
      }

      const identifiers = []

      for (const groupElement of initializer.elements) {
        const group = unwrapExpression(groupElement)
        if (!ts.isObjectLiteralExpression(group)) {
          throw new Error(`Invalid block group in ${exportName} from ${filePath}`)
        }

        const blocksProperty = group.properties.find(
          (property) =>
            ts.isPropertyAssignment(property) && getPropertyName(property.name) === 'blocks',
        )

        if (!blocksProperty || !ts.isPropertyAssignment(blocksProperty)) {
          throw new Error(`Block group is missing blocks in ${exportName} from ${filePath}`)
        }

        const blocks = unwrapExpression(blocksProperty.initializer)
        if (!ts.isArrayLiteralExpression(blocks)) {
          throw new Error(`Block group blocks must be an array in ${exportName} from ${filePath}`)
        }

        for (const block of blocks.elements) {
          if (!ts.isIdentifier(block)) {
            throw new Error(`Block group contains a non-identifier in ${exportName} from ${filePath}`)
          }
          identifiers.push(block.text)
        }
      }

      return identifiers
    }
  }

  throw new Error(`Missing ${exportName} in ${filePath}`)
}
```

This parser is intentionally strict: spreads, calls, string slugs, and computed entries fail rather than disappearing from maintained inventory.

- [ ] **Step 4: Make inventory generation consume the grouped source of truth**

Add this helper after `getRegistrySlugs` in `.agents/skills/project-context/scripts/project-context-lib.mjs`:

```js
async function getPageCatalogSlugs(projectRoot, definitionsBySymbol) {
  const catalogPath = 'src/blocks/blockCatalog.ts'
  const source = await readText(projectRoot, catalogPath)
  const symbols = extractBlockGroupIdentifiers(
    source,
    catalogPath,
    'pageBlockGroupDefinitions',
  )

  return symbols.map((symbol) => {
    const definition = definitionsBySymbol.get(symbol)
    if (!definition) {
      throw new Error(`Unknown block symbol ${symbol} in ${catalogPath}`)
    }
    return definition.slug
  })
}
```

Inside `buildProjectInventory`, after `definitionsBySymbol` is created, add:

```js
const pageBlockSlugs = await getPageCatalogSlugs(root, definitionsBySymbol)
```

Replace the Page and Reusable Section values in the returned `blocks` object:

```js
page: pageBlockSlugs,
reusableSection: pageBlockSlugs.filter((slug) => slug !== 'reusableSection'),
```

Keep `getRegistrySlugs` for Footer, Header, and System Page collections.

- [ ] **Step 5: Run parser and repository-context tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/project-context-lib.int.spec.ts \
  tests/int/project-context-repository.int.spec.ts \
  tests/int/block-catalog.int.spec.ts
```

Expected: PASS. Inventory reports 53 Page blocks in curated drawer order and Reusable Sections as Page-minus-Reusable-Section.

- [ ] **Step 6: Review the tooling change without committing**

Run:

```bash
git diff --check
git diff -- .agents/skills/project-context/scripts/project-context-lib.mjs tests/int/project-context-lib.int.spec.ts
```

Expected: the parser change is limited to strict grouped-registry extraction and inventory routing.

---

### Task 4: Document client customization and refresh maintained project knowledge

**Files:**
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Potential generated modification: `src/payload-types.ts`
- Potential generated modification: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**
- Consumes: the catalog names and behavior established in Tasks 1–2.
- Produces: an operator-facing customization contract and current architecture reference.

- [ ] **Step 1: Add the editor and deployment guidance**

In `docs/guides/blocks.md`, replace the inaccurate Reusable Section exclusion sentence in the opening with:

```markdown
`Reusable Section` references a shared block stack. Reusable Sections intentionally cannot contain another Reusable Section; runtime rendering also stops nesting after depth 10.
```

Add this section immediately before `## Content And Theme Settings`:

```markdown
## Choosing A Block

The Add Block drawer is searchable and organized by editorial intent:

- **Start** establishes the page opening or inserts an approved shared section.
- **Explain** presents the main institutional story, structured content, or programme information.
- **Explore** helps visitors browse collections, departments, galleries, or answers.
- **Prove** adds evidence such as metrics, testimonials, and accreditations.
- **Convert** gives visitors a clear next action, contact route, or document.
- **Advanced Library** contains specialized alternatives that remain fully supported and searchable.

The first five groups form the client-approved 18-block vocabulary. Advanced blocks are not hidden or permission-restricted, so existing pages always remain editable.

For a new one-client deployment, developers customize the groups in `src/blocks/blockCatalog.ts`. Keep every Page-compatible block classified exactly once, retain Reusable Section and News/Event template exclusions, and run the catalog and registry contracts before handoff. Editors do not manage this vocabulary through Site Settings.
```

- [ ] **Step 2: Update the maintained block-system reference**

In `.agents/skills/project-context/references/block-system.md`, replace the opening Page/Reusable registry description with a concise source-of-truth statement:

```markdown
## Registries

[blockCatalog.ts](../../../../src/blocks/blockCatalog.ts) is the server-only canonical Payload schema catalog for Page-compatible blocks. It assigns native Admin groups in this order: Start, Explain, Explore, Prove, Convert, and Advanced Library. The first five groups contain the client-approved 18-block vocabulary; all remaining Page-compatible blocks stay registered under Advanced Library.

[Pages.ts](../../../../src/collections/Pages.ts) consumes the complete 53-block Page registry. [ReusableSections.ts](../../../../src/collections/ReusableSections.ts) consumes the same registry without `reusableSection`, preventing direct recursion. [NewsEventsDetailTemplate.ts](../../../../src/globals/NewsEventsDetailTemplate.ts) consumes the Page registry plus `newsEventsContent`, which appears first under Template Core.

The catalog imports schema config only. Production and live-preview renderer switches remain explicit and separate so server/client boundaries are not mixed.
```

Delete the former inline 53-block registry sentence after adding this source-of-truth description. Keep the restricted Header, Footer, and System Page registry section unchanged; the operator guide owns the complete editor-facing group membership.

- [ ] **Step 3: Run Payload generators and inspect rather than assuming their output**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected:

- type generation succeeds; a union-order-only change in `src/payload-types.ts` is acceptable because the native group order changed, but block interfaces and stored fields must not change;
- import-map generation succeeds and should be a no-op because no custom Admin component was added.

Inspect:

```bash
git diff -- src/payload-types.ts src/app/\(payload\)/admin/importMap.js
```

If generated types show added, removed, or renamed fields rather than ordering changes, stop and correct the schema catalog before continuing.

- [ ] **Step 4: Run the project-context update loop**

Run:

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/references/project-inventory.json
pnpm project-context:check
```

Expected: update succeeds; the inventory records `src/blocks/blockCatalog.ts` and current registrations; check passes. A stale optional Understand knowledge graph remains a warning rather than a project-context failure.

- [ ] **Step 5: Run documentation and catalog-focused tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/project-context-repository.int.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Review all architecture-impact paths without committing**

Run:

```bash
git diff --check
git diff -- src/blocks src/collections/Pages.ts src/collections/ReusableSections.ts src/globals/NewsEventsDetailTemplate.ts tests/int docs/guides/blocks.md .agents/skills/project-context/references
git status --short
```

Expected: only scoped implementation, tests, generated artifacts, the approved uncommitted spec/plan, and routed documentation appear.

---

### Task 5: Complete the verification gate and handoff

**Files:**
- Verify all files changed in Tasks 1–4.
- Do not create a commit.

**Interfaces:**
- Consumes: the finished catalog and all maintained contracts.
- Produces: evidence that the native drawer metadata is safe to hand off.

- [ ] **Step 1: Run all integration and component tests**

Run:

```bash
pnpm test:int
```

Expected: all integration/component test files and tests pass. If MongoMemoryServer cannot bind inside the sandbox, rerun the same command with the required execution permission rather than weakening or skipping tests.

- [ ] **Step 2: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm project-context:check
```

Expected: TypeScript and project-context pass; ESLint has zero errors. Report any pre-existing warning separately rather than hiding it.

- [ ] **Step 3: Perform the final change-impact review**

Compare the final diff with `.agents/skills/project-context/references/change-impact-map.md` and verify:

```text
schema producer       src/blocks/blockCatalog.ts
schema consumers      Pages, ReusableSections, NewsEventsDetailTemplate
generated contract    payload-types.ts and project inventory inspected
renderer boundaries   production and live-preview files unchanged
Admin assets          thumbnails preserved; import map inspected
tests                 catalog, page, reusable, template, thumbnail contracts pass
documentation         blocks guide and block-system reference current
```

- [ ] **Step 4: Produce the uncommitted handoff**

Run:

```bash
git diff --check
git diff --stat
git status --short
```

Handoff must report:

- the 18 recommended blocks and six public drawer groups;
- that all 35 advanced blocks remain available;
- that no migration or public-rendering change occurred;
- exact test, type, lint, generator, and project-context results;
- every generated or narrative project-context file changed, or that its update was a checked no-op; and
- that all changes remain uncommitted at the user's request.
