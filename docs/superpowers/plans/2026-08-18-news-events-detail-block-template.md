# News & Events Detail Block Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the field-heavy News & Events detail global with a block-built singleton template that automatically injects the current News & Events entry into one required dynamic content block.

**Architecture:** Keep `news-events-detail-template` as the one versioned Payload global, replace its grouped fields with a `layout` blocks field, and add a global-only `newsEventsContent` block. A dedicated detail renderer will reuse the existing page-block node renderer for ordinary blocks while passing the current route entry only to the dynamic block. Runtime normalization will preserve valid block order and supply a safe default layout for legacy, missing, or malformed data.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10 App Router, React 19.2.7, TypeScript 5.7.3, Tailwind CSS 4.3.2, Vitest 4.0.18.

## Global Constraints

- One shared template controls every `/news-events/[slug]` page.
- The News & Events collection remains the owner of entry content, workflow, taxonomy, SEO, and routes.
- The template offers the same block set as Pages, plus one global-only News & Events Content block.
- A published template must contain exactly one News & Events Content block; incomplete drafts remain saveable.
- The dynamic block has no relationship, slug, manual-content, or source-mode field.
- Existing Page Header, Breadcrumb, article, sidebar, share, Lexical, responsive, metadata, and structured-data behavior remains visually aligned.
- Existing global access, versions, caching, and revalidation behavior remains intact.
- Missing or malformed templates must render a safe default layout rather than a blank page.
- Preserve unrelated staged and unstaged work.
- Do not create commits unless the user explicitly requests them.

---

## File Structure

### Create

- `src/blocks/NewsEventsContent/config.ts` — Payload schema for article-only presentation settings.
- `src/blocks/NewsEventsContent/Component.tsx` — adapts the dynamic entry and block settings to `NewsEventStory`.
- `src/blocks/renderNewsEventDetailBlocks.tsx` — renders the template layout with explicit entry and breadcrumb context.

### Modify

- `src/globals/NewsEventsDetailTemplate.ts` — replace the three setting tabs with the block builder and publish validation.
- `src/lib/newsEventDetailTemplateShared.ts` — define normalized layout types, defaults, content-setting normalization, and author extraction.
- `src/lib/newsEventDetailTemplate.ts` — continue loading/caching the published global through the new normalizer.
- `src/blocks/renderPageBlocks.tsx` — expose the existing single-block renderer for safe reuse.
- `src/components/news-events/NewsEventStory.tsx` — consume normalized dynamic-block settings and optionally hide share actions.
- `src/components/news-events/NewsEventDetailPage.tsx` — build dynamic breadcrumbs and delegate to the detail block renderer.
- `src/components/live-preview/NewsEventLivePreview.tsx` — retain the shared renderer with the new template shape.
- `src/app/(frontend)/news-events/[slug]/page.tsx` — derive structured-data author from the dynamic block.
- `src/payload-types.ts` — regenerate after the schema change.
- `tests/int/news-events-detail-template.int.spec.tsx` — cover schema, validation, fallback, order, and dynamic injection.
- `tests/int/news-event-story.int.spec.tsx` — cover retained article presentation and optional share actions.
- `tests/int/news-events-metadata-routes.int.spec.ts` — cover structured-data author extraction from the layout.
- `docs/guides/news-events.md` — explain how editors build the shared detail page.
- `docs/guides/blocks.md` — document the global-only dynamic block.
- `.agents/skills/project-context/references/architecture.md` — record the detail-template rendering boundary.
- `.agents/skills/project-context/references/block-system.md` — record the global block surface and injected context.
- `.agents/skills/project-context/references/payload-model.md` — replace the field-group global contract with the block-layout contract.
- `.agents/skills/project-context/references/project-inventory.json` — regenerate through the project-context update command.

---

### Task 1: Add the global-only block schema and publish validation

**Files:**

- Create: `src/blocks/NewsEventsContent/config.ts`
- Modify: `src/globals/NewsEventsDetailTemplate.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`
- Regenerate: `src/payload-types.ts`

**Interfaces:**

- Produces: `NewsEventsContentBlock` with block type `newsEventsContent`.
- Produces: `validateNewsEventsDetailLayout: BlocksFieldValidation`.
- Produces: `NewsEventsDetailTemplate.layout`, containing the Page block set plus `newsEventsContent`.
- Consumes: existing Page block configs and shared appearance/card/spacing field factories.

- [ ] **Step 1: Replace the old schema assertions with failing block-layout assertions**

Update `tests/int/news-events-detail-template.int.spec.tsx` so its first test finds the `layout`
field, compares its standard block slugs with the Page layout, and verifies the new block remains
global-only:

```tsx
import type { Block, Field } from 'payload'
import { Pages } from '@/collections/Pages'

const collectBlocks = (fields: Field[]): Block[] =>
  fields.flatMap((field) => {
    if (field.type === 'blocks') return field.blocks
    if (field.type === 'tabs') {
      return field.tabs.flatMap((tab) => collectBlocks(tab.fields))
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      return collectBlocks(field.fields)
    }
    return []
  })

it('registers one versioned block-built detail page under Configuration', async () => {
  const resolvedConfig = await config
  const pageSlugs = collectBlocks(Pages.fields).map(({ slug }) => slug)
  const templateSlugs = collectBlocks(NewsEventsDetailTemplate.fields).map(({ slug }) => slug)

  expect(resolvedConfig.globals?.map(({ slug }) => slug)).toContain(
    'news-events-detail-template',
  )
  expect(NewsEventsDetailTemplate).toMatchObject({
    admin: { group: 'Configuration' },
    label: 'News & Events Detail Page',
    slug: 'news-events-detail-template',
  })
  expect(NewsEventsDetailTemplate.versions).toBeTruthy()
  expect(templateSlugs.filter((slug) => slug !== 'newsEventsContent').sort()).toEqual(
    pageSlugs.slice().sort(),
  )
  expect(templateSlugs.filter((slug) => slug === 'newsEventsContent')).toHaveLength(1)
  expect(pageSlugs).not.toContain('newsEventsContent')
})
```

Add validation coverage by obtaining the `layout` field from the global:

```tsx
it('requires exactly one dynamic content block only when publishing', async () => {
  const layout = findNamedField(NewsEventsDetailTemplate.fields, 'layout') as {
    validate?: (
      value: unknown,
      options: { data?: { _status?: 'draft' | 'published' } },
    ) => Promise<string | true> | string | true
  }
  const content = { blockType: 'newsEventsContent' }

  await expect(layout.validate?.([], { data: { _status: 'draft' } })).resolves.toBe(true)
  await expect(layout.validate?.([], { data: { _status: 'published' } })).resolves.toBe(
    'Add exactly one News & Events Content block before publishing.',
  )
  await expect(
    layout.validate?.([content], { data: { _status: 'published' } }),
  ).resolves.toBe(true)
  await expect(
    layout.validate?.([content, content], { data: { _status: 'published' } }),
  ).resolves.toBe('Add exactly one News & Events Content block before publishing.')
})
```

- [ ] **Step 2: Run the focused test and verify the old schema fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx
```

Expected: FAIL because the global label is still `News & Events Detail Template`, `layout` is
missing, and `newsEventsContent` is not registered.

- [ ] **Step 3: Create the dynamic block schema**

Create `src/blocks/NewsEventsContent/config.ts` with the article presentation settings that are
currently in the global's Article Layout tab:

```ts
import type { Block, CheckboxField, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardBackgroundField } from '@/blocks/shared/cardThemeFields'

export const NewsEventsContentBlock: Block = {
  slug: 'newsEventsContent',
  interfaceName: 'NewsEventsContentBlock',
  labels: {
    singular: 'News & Events Content',
    plural: 'News & Events Content',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'authorLabel',
              label: 'Author',
              type: 'text',
              defaultValue: 'Management, SNMIH',
              required: true,
              admin: {
                description: 'Shared author shown for every News & Events entry.',
              },
            },
            {
              name: 'showShareActions',
              label: 'Show Share Actions',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
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
            createCardBackgroundField({
              name: 'sidebarCardBackground',
              label: 'Sidebar Card Background',
            }),
            {
              name: 'sidebarCardOutline',
              label: 'Show Sidebar Card Outline',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'featuredImageRatio',
              label: 'Featured Image Ratio',
              type: 'select',
              defaultValue: 'wide',
              required: true,
              options: [
                { label: 'Wide (2:1)', value: 'wide' },
                { label: 'Video (16:9)', value: 'video' },
                { label: 'Standard (4:3)', value: 'standard' },
              ],
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

Do not add this block to `Pages` or `ReusableSections`.

- [ ] **Step 4: Replace the field groups with the block builder**

In `src/globals/NewsEventsDetailTemplate.ts`, keep the current access, versions, Admin group,
capabilities, and `afterChange` hook. Remove the old `header`, `breadcrumb`, and `article` field
definitions. Import `BlocksFieldValidation`, all block config symbols currently registered in
`Pages`, and `NewsEventsContentBlock`.

Define and export the validation function:

```ts
import type { BlocksFieldValidation, GlobalConfig } from 'payload'

type LayoutBlock = { blockType?: string | null }

export const validateNewsEventsDetailLayout: BlocksFieldValidation = async (value, { data }) => {
  const status = (data as { _status?: 'draft' | 'published' } | undefined)?._status
  if (status !== 'published') return true

  const count = Array.isArray(value)
    ? (value as LayoutBlock[]).filter(({ blockType }) => blockType === 'newsEventsContent').length
    : 0

  return count === 1 || 'Add exactly one News & Events Content block before publishing.'
}
```

Use the exact Page block order, followed by the dynamic block:

```ts
const detailTemplateBlocks = [
  AnnouncementBlock,
  BannerCtaBlock,
  NewsGridBlock,
  NewsEventsTabsBlock,
  Cta39Block,
  HeroBannerBlock,
  HeroCarouselBlock,
  GalleryCoverflowBlock,
  FeatureSpotlightBlock,
  TestimonialSpotlightBlock,
  FeatureMatrixBlock,
  ContentHighlightsBlock,
  EditorialReasonsBlock,
  AcademicProgrammesBlock,
  NewsEventsHighlightsBlock,
  ProfileCarouselBlock,
  GalleryShowcaseBlock,
  EventGalleryBlock,
  StudyPathwaysBlock,
  ImageMosaicBlock,
  StudentExperienceBlock,
  StatsStripBlock,
  QaAccordionBlock,
  RatingSpotlightBlock,
  ReviewFeedBlock,
  ReviewSubmissionBlock,
  Contact33Block,
  Contact24Block,
  TeamShowcaseBlock,
  Services21Block,
  RichTextBlock,
  VideoEmbedBlock,
  MediaCarouselBlock,
  ProgramGridBlock,
  ProgramMatrixBlock,
  LogoStripBlock,
  PageHeaderBlock,
  BreadcrumbBlock,
  TimelineBlock,
  IconCardShowcaseBlock,
  IconGridBlock,
  QuoteBlockBlock,
  TabsContentBlock,
  DownloadListBlock,
  NumberedStepsBlock,
  BentoGridBlock,
  TestimonialGridBlock,
  AwardsListBlock,
  AboutSectionBlock,
  AccreditationCardsBlock,
  ReusableSectionBlock,
  NewsEventsContentBlock,
]
```

Replace the global's label and fields:

```ts
export const NewsEventsDetailTemplate: GlobalConfig = {
  slug: 'news-events-detail-template',
  label: 'News & Events Detail Page',
  admin: {
    group: 'Configuration',
    description: 'Build the shared page used by every News & Events detail entry.',
    hidden: hideFromUsersWithoutCapability([...capabilities]),
  },
  access: {
    read: allowPublicReadOrCapability([...capabilities]),
    readVersions: requireCapability([...capabilities]),
    update: requireCapability([...capabilities]),
  },
  versions: { drafts: true },
  hooks: { afterChange: [revalidateGlobalsCacheForGlobal] },
  fields: [
    {
      name: 'layout',
      label: 'Layout',
      type: 'blocks',
      blocks: detailTemplateBlocks,
      required: false,
      validate: validateNewsEventsDetailLayout,
      admin: {
        description:
          'Add exactly one News & Events Content block, then arrange shared blocks around it.',
        initCollapsed: true,
      },
    },
  ],
}
```

- [ ] **Step 5: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: PASS and `src/payload-types.ts` contains `NewsEventsContentBlock`, a `layout` property on
`NewsEventsDetailTemplate`, and `newsEventsContent` in the generated block map.

- [ ] **Step 6: Run the schema test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx
```

Expected: schema and validation tests PASS; old field-shape tests still fail until Task 2 replaces
them.

- [ ] **Step 7: Review checkpoint**

Inspect only the Task 1 files with `git diff --check` and `git diff`. Do not stage or commit them.

---

### Task 2: Normalize layouts, legacy data, and dynamic settings

**Files:**

- Modify: `src/lib/newsEventDetailTemplateShared.ts`
- Modify: `src/lib/newsEventDetailTemplate.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`

**Interfaces:**

- Produces: `NewsEventDetailTemplateBlock`.
- Produces: `ResolvedNewsEventDetailTemplate = { layout: NewsEventDetailTemplateBlock[] }`.
- Produces: `ResolvedNewsEventsContentSettings`.
- Produces: `resolveNewsEventsContentSettings(value)`.
- Produces: `getNewsEventDetailAuthorLabel(template)`.
- Consumes: arbitrary Payload global data from `fetchNewsEventDetailTemplate`.

- [ ] **Step 1: Write failing normalization tests**

Replace the old header/breadcrumb/article normalization assertions with these cases:

```tsx
it('uses a complete default layout for missing and legacy field-only data', () => {
  for (const value of [null, {}, { header: { title: 'Legacy title' } }]) {
    const result = normalizeNewsEventDetailTemplate(value)
    expect(result.layout.map(({ blockType }) => blockType)).toEqual([
      'pageHeader',
      'breadcrumb',
      'newsEventsContent',
    ])
  }
})

it('preserves valid block order and repairs missing or duplicate dynamic blocks', () => {
  const before = { blockType: 'pageHeader', title: 'Before' }
  const first = { blockType: 'newsEventsContent', authorLabel: 'Office of the Director' }
  const duplicate = { blockType: 'newsEventsContent', authorLabel: 'Duplicate' }
  const after = { blockType: 'breadcrumb', breadcrumbMode: 'automatic' }

  expect(normalizeNewsEventDetailTemplate({ layout: [before, after] }).layout).toEqual([
    before,
    after,
    expect.objectContaining({ blockType: 'newsEventsContent' }),
  ])
  expect(
    normalizeNewsEventDetailTemplate({ layout: [before, first, duplicate, after] }).layout,
  ).toEqual([before, first, after])
})

it('normalizes dynamic settings and derives the structured-data author', () => {
  const template = normalizeNewsEventDetailTemplate({
    layout: [
      {
        blockType: 'newsEventsContent',
        authorLabel: '  Office of the Director  ',
        featuredImageRatio: 'invalid',
        showShareActions: false,
      },
    ],
  })
  const block = template.layout[0]

  expect(resolveNewsEventsContentSettings(block)).toMatchObject({
    authorLabel: 'Office of the Director',
    featuredImageRatio: 'wide',
    showShareActions: false,
  })
  expect(getNewsEventDetailAuthorLabel(template)).toBe('Office of the Director')
})
```

Keep the published-global loader test, but make its mock return `layout`, assert the normalized
layout instead of `template.article`, and update the expected relationship depth from `1` to `2` so
Reusable Sections and their first-level media match normal Page loading.

- [ ] **Step 2: Run the tests and verify the old normalizer fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx
```

Expected: FAIL because the normalizer still returns `header`, `breadcrumb`, and `article` groups.

- [ ] **Step 3: Replace the shared template model**

In `src/lib/newsEventDetailTemplateShared.ts`, remove the banner/header-specific normalization and
define the layout and article-setting boundaries:

```ts
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { normalizeBlockBackground } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import { cardSurfaceValues, type CardSurfaceValue } from '@/blocks/shared/cardThemeFields'

export type FeaturedImageRatio = 'standard' | 'video' | 'wide'

export type NewsEventDetailTemplateBlock = {
  id?: string | null
  blockName?: string | null
  blockType: string
  [key: string]: unknown
}

export type ResolvedNewsEventDetailTemplate = {
  layout: NewsEventDetailTemplateBlock[]
}

export type ResolvedNewsEventsContentSettings = {
  appearance: BlockAppearance
  authorLabel: string
  featuredImageRatio: FeaturedImageRatio
  showShareActions: boolean
  sidebarCardBackground: CardSurfaceValue
  sidebarCardOutline: boolean
  size: RegularBlockSize
}
```

Define raw default blocks that match the current public output:

```ts
export const DEFAULT_NEWS_EVENTS_CONTENT_BLOCK: NewsEventDetailTemplateBlock = {
  blockType: 'newsEventsContent',
  appearance: { background: 'none', border: 'none' },
  authorLabel: 'Management, SNMIH',
  featuredImageRatio: 'wide',
  showShareActions: true,
  sidebarCardBackground: 'default',
  sidebarCardOutline: true,
  size: 'default',
}

export const DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE: ResolvedNewsEventDetailTemplate = {
  layout: [
    {
      blockType: 'pageHeader',
      appearance: { background: 'none', border: 'none' },
      contentAlignment: 'left',
      contentWidth: 'default',
      eyebrow: 'News & Events',
      height: 'default',
      size: 'default',
      subtitle: 'Stay informed about news, events, notices, and announcements from SNMIH.',
      title: 'Latest updates from SNMIH',
      topContent: 'eyebrow',
      variant: 'minimal',
    },
    {
      blockType: 'breadcrumb',
      alignment: 'left',
      appearance: { background: 'none', border: 'none' },
      breadcrumbMode: 'automatic',
      sectionPadding: 'compact',
      separator: 'chevron',
      showCurrentPage: true,
      showHome: true,
      size: 'default',
    },
    DEFAULT_NEWS_EVENTS_CONTENT_BLOCK,
  ],
}
```

Implement layout normalization without mutating Payload data:

```ts
const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

const isTemplateBlock = (value: unknown): value is NewsEventDetailTemplateBlock =>
  Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as { blockType?: unknown }).blockType === 'string',
  )

export function normalizeNewsEventDetailTemplate(value: unknown): ResolvedNewsEventDetailTemplate {
  const rawLayout = asRecord(value).layout
  if (!Array.isArray(rawLayout) || rawLayout.length === 0) {
    return { layout: DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE.layout.map((block) => ({ ...block })) }
  }

  const validBlocks = rawLayout.filter(isTemplateBlock)
  if (validBlocks.length === 0) {
    return { layout: DEFAULT_NEWS_EVENT_DETAIL_TEMPLATE.layout.map((block) => ({ ...block })) }
  }

  let foundContent = false
  const layout = validBlocks.filter((block) => {
    if (block.blockType !== 'newsEventsContent') return true
    if (foundContent) return false
    foundContent = true
    return true
  })

  if (!foundContent) layout.push({ ...DEFAULT_NEWS_EVENTS_CONTENT_BLOCK })
  return { layout }
}
```

Implement content-setting normalization and author extraction:

```ts
const fromAllowedValues = <Value extends string>(
  value: unknown,
  allowed: readonly Value[],
  fallback: Value,
): Value =>
  typeof value === 'string' && allowed.includes(value as Value) ? (value as Value) : fallback

const trimmed = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  return value.trim() || undefined
}

export function resolveNewsEventsContentSettings(
  value: unknown,
): ResolvedNewsEventsContentSettings {
  const block = asRecord(value)
  const appearance = asRecord(block.appearance)

  return {
    appearance: {
      background: normalizeBlockBackground(trimmed(appearance.background)),
      border: fromAllowedValues(
        appearance.border,
        ['none', 'top', 'bottom', 'topAndBottom'] as const,
        'none',
      ),
    },
    authorLabel: trimmed(block.authorLabel) ?? 'Management, SNMIH',
    featuredImageRatio: fromAllowedValues(
      block.featuredImageRatio,
      ['wide', 'video', 'standard'] as const,
      'wide',
    ),
    showShareActions:
      typeof block.showShareActions === 'boolean' ? block.showShareActions : true,
    sidebarCardBackground: fromAllowedValues(
      block.sidebarCardBackground,
      cardSurfaceValues,
      'default',
    ),
    sidebarCardOutline:
      typeof block.sidebarCardOutline === 'boolean' ? block.sidebarCardOutline : true,
    size: fromAllowedValues(
      block.size,
      ['none', 'compact', 'default', 'comfortable'] as const,
      'default',
    ),
  }
}

export function getNewsEventDetailAuthorLabel(
  template: ResolvedNewsEventDetailTemplate,
): string {
  const content = template.layout.find(({ blockType }) => blockType === 'newsEventsContent')
  return resolveNewsEventsContentSettings(content).authorLabel
}
```

- [ ] **Step 4: Keep the cached loader contract narrow**

`src/lib/newsEventDetailTemplate.ts` should retain its current published-only loading, logging,
cache key, and global cache tag. Change `depth` from `1` to `2` so the Page-compatible Reusable
Section block receives the same relationship population used by normal Page rendering. Update
imports only as required by the new `ResolvedNewsEventDetailTemplate` shape. No additional database
query is permitted.

- [ ] **Step 5: Run the normalization tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx
```

Expected: PASS for schema, validation, defaults, repair behavior, author extraction, and failed-load
fallback.

- [ ] **Step 6: Review checkpoint**

Inspect the Task 2 diff and confirm the old `header`, `breadcrumb`, and `article` output contracts
have no remaining runtime consumers before proceeding. Do not stage or commit.

---

### Task 3: Move the current article presentation behind the dynamic block

**Files:**

- Create: `src/blocks/NewsEventsContent/Component.tsx`
- Modify: `src/components/news-events/NewsEventStory.tsx`
- Modify: `tests/int/news-event-story.int.spec.tsx`

**Interfaces:**

- Consumes: `NewsEventsContentBlock` from generated Payload types.
- Consumes: `PublicNewsEventDetail`.
- Consumes: `resolveNewsEventsContentSettings(value)`.
- Produces: `NewsEventsContentBlockComponent({ entry, ...block })`.
- Produces: `NewsEventStory({ article, entry })` using `ResolvedNewsEventsContentSettings`.

- [ ] **Step 1: Add a failing share-visibility test**

Update the test helper in `tests/int/news-event-story.int.spec.tsx` to accept a layout-shaped
template. Add this assertion:

```tsx
it('hides only the share card when the dynamic block disables sharing', () => {
  const template = normalizeNewsEventDetailTemplate({
    layout: [
      {
        blockType: 'newsEventsContent',
        showShareActions: false,
      },
    ],
  })
  const markup = renderStory(entry, template)

  expect(markup).toContain('Story Details')
  expect(markup).not.toContain('Share This')
  expect(markup).not.toContain('data-news-event-share-actions')
})
```

- [ ] **Step 2: Run the story test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx
```

Expected: FAIL because `NewsEventStory` still expects `template.article` and always renders Share
This.

- [ ] **Step 3: Add the dynamic block component**

Create `src/blocks/NewsEventsContent/Component.tsx`:

```tsx
import type { NewsEventsContentBlock } from '@/payload-types'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import { resolveNewsEventsContentSettings } from '@/lib/newsEventDetailTemplateShared'
import { NewsEventStory } from '@/components/news-events/NewsEventStory'

export function NewsEventsContentBlockComponent({
  entry,
  ...block
}: NewsEventsContentBlock & { entry: PublicNewsEventDetail }) {
  return <NewsEventStory article={resolveNewsEventsContentSettings(block)} entry={entry} />
}
```

- [ ] **Step 4: Make the share card conditional without changing article styling**

In `src/components/news-events/NewsEventStory.tsx`, replace the old template-derived type with:

```ts
import type { ResolvedNewsEventsContentSettings } from '@/lib/newsEventDetailTemplateShared'

type ArticleTemplate = ResolvedNewsEventsContentSettings
```

Wrap only the Share This card:

```tsx
{article.showShareActions ? (
  <SidebarCard article={article} heading="Share This" surface={cardSurface}>
    <NewsEventShareActions title={entry.title} url={toAbsoluteSiteUrl(entry.href)} />
  </SidebarCard>
) : null}
```

Do not change the introduction, featured image, Lexical class contract, grid columns, sticky offset,
Story Details fields, or Event registration rendering.

- [ ] **Step 5: Run the story tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-event-story.int.spec.tsx
```

Expected: PASS for News, Event, sidebar, Lexical, responsive-class, and share-visibility behavior.

- [ ] **Step 6: Review checkpoint**

Confirm the Task 3 diff is presentation-neutral when `showShareActions` is true. Do not stage or
commit.

---

### Task 4: Render standard and dynamic blocks in one ordered stack

**Files:**

- Modify: `src/blocks/renderPageBlocks.tsx`
- Create: `src/blocks/renderNewsEventDetailBlocks.tsx`
- Modify: `src/components/news-events/NewsEventDetailPage.tsx`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`

**Interfaces:**

- Produces: `PageBlockRenderArgs`.
- Produces: `renderPageBlockNode(block, index, args, depth?)`.
- Produces: `renderNewsEventDetailBlocks(layout, context)`.
- Consumes: `context.entry` and `context.automaticBreadcrumbs`.

- [ ] **Step 1: Add failing order and automatic-breadcrumb tests**

Add a render test using one ordinary block before and after the dynamic content:

```tsx
it('renders ordinary blocks around one entry-bound content block in saved order', () => {
  const template = normalizeNewsEventDetailTemplate({
    layout: [
      {
        blockType: 'pageHeader',
        title: 'Before article',
        topContent: 'eyebrow',
        variant: 'minimal',
      },
      {
        blockType: 'newsEventsContent',
        authorLabel: 'Management, SNMIH',
      },
      {
        blockType: 'pageHeader',
        title: 'After article',
        topContent: 'eyebrow',
        variant: 'minimal',
      },
    ],
  })
  const markup = renderToStaticMarkup(<NewsEventDetailPage entry={entry} template={template} />)

  expect(markup.indexOf('Before article')).toBeLessThan(
    markup.indexOf('data-news-event-story="true"'),
  )
  expect(markup.indexOf('data-news-event-story="true"')).toBeLessThan(
    markup.indexOf('After article'),
  )
  expect(markup.match(/data-news-event-story="true"/g)).toHaveLength(1)
})
```

Retain the existing assertion that an automatic Breadcrumb receives Home, News & Events, and the
current entry title.

- [ ] **Step 2: Run the detail-template test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-detail-template.int.spec.tsx
```

Expected: FAIL because `NewsEventDetailPage` still renders three fixed regions rather than the saved
layout.

- [ ] **Step 3: Expose the existing page-block node renderer**

In `src/blocks/renderPageBlocks.tsx`, make only these symbol and call-site changes; leave every
existing switch case intact:

```diff
-type RenderArgs = {
+export type PageBlockRenderArgs = {
   automaticBreadcrumbs: ResolvedPageBreadcrumb[]
 }

-function renderSingleBlock(
+export function renderPageBlockNode(
   block: PageBlock,
   index: number,
-  args: RenderArgs,
+  args: PageBlockRenderArgs,
   depth = 0,
 ): React.ReactNode {
```

Update the reusable-section recursion and public renderer call sites:

```diff
-{innerBlocks.map((inner, i) => renderSingleBlock(inner, i, args, depth + 1))}
+{innerBlocks.map((inner, i) => renderPageBlockNode(inner, i, args, depth + 1))}

-const args: RenderArgs = {
+const args: PageBlockRenderArgs = {
   automaticBreadcrumbs: context.page
     ? resolveAutomaticPageBreadcrumbs(context.page, { isHomepage: context.isHomepage })
     : [],
 }

-{blocks.map((block, index) => renderSingleBlock(block, index, args))}
+{blocks.map((block, index) => renderPageBlockNode(block, index, args))}
```

The switch must not gain a `newsEventsContent` case because that block is not valid on Pages.

- [ ] **Step 4: Add the dedicated detail renderer**

Create `src/blocks/renderNewsEventDetailBlocks.tsx`:

```tsx
import React from 'react'

import { NewsEventsContentBlockComponent } from '@/blocks/NewsEventsContent/Component'
import { PageBlockStack } from '@/blocks/PageBlockStack'
import {
  renderPageBlockNode,
  type PageBlock,
  type PageBlockRenderArgs,
} from '@/blocks/renderPageBlocks'
import { BlockErrorBoundary } from '@/blocks/shared/BlockErrorBoundary'
import type {
  NewsEventDetailTemplateBlock,
  ResolvedNewsEventDetailTemplate,
} from '@/lib/newsEventDetailTemplateShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'
import type { NewsEventsContentBlock } from '@/payload-types'

type DetailRenderContext = {
  automaticBreadcrumbs: ResolvedPageBreadcrumb[]
  entry: PublicNewsEventDetail
}

const isDynamicContent = (
  block: NewsEventDetailTemplateBlock,
): block is NewsEventDetailTemplateBlock & NewsEventsContentBlock =>
  block.blockType === 'newsEventsContent'

export function renderNewsEventDetailBlocks(
  template: ResolvedNewsEventDetailTemplate,
  context: DetailRenderContext,
) {
  const args: PageBlockRenderArgs = {
    automaticBreadcrumbs: context.automaticBreadcrumbs,
  }

  return (
    <PageBlockStack>
      {template.layout.map((block, index) => {
        if (!isDynamicContent(block)) {
          return renderPageBlockNode(block as PageBlock, index, args)
        }

        const key = block.id ?? `${block.blockType}-${index}`
        return (
          <BlockErrorBoundary key={key} blockType={block.blockType}>
            <NewsEventsContentBlockComponent {...block} entry={context.entry} />
          </BlockErrorBoundary>
        )
      })}
    </PageBlockStack>
  )
}
```

- [ ] **Step 5: Convert the detail page into a context adapter**

Replace the fixed components in `src/components/news-events/NewsEventDetailPage.tsx` with:

```tsx
import { renderNewsEventDetailBlocks } from '@/blocks/renderNewsEventDetailBlocks'
import type { ResolvedNewsEventDetailTemplate } from '@/lib/newsEventDetailTemplateShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { ResolvedPageBreadcrumb } from '@/lib/pageBreadcrumbs'

export function NewsEventDetailPage({
  entry,
  template,
}: {
  entry: PublicNewsEventDetail
  template: ResolvedNewsEventDetailTemplate
}) {
  const automaticBreadcrumbs: ResolvedPageBreadcrumb[] = [
    { label: 'Home', url: '/' },
    { label: 'News & Events', url: '/news-events' },
    { label: entry.title },
  ]

  return renderNewsEventDetailBlocks(template, { automaticBreadcrumbs, entry })
}
```

- [ ] **Step 6: Run renderer and existing Page tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/page-blocks.int.spec.ts \
  tests/int/regular-block-spacing.int.spec.tsx
```

Expected: PASS. Page rendering must remain unchanged, the dynamic article renders once, and standard
blocks preserve saved order.

- [ ] **Step 7: Review checkpoint**

Inspect the renderer diff for accidental Page behavior changes, unsafe global state, or a second
News & Events query. Do not stage or commit.

---

### Task 5: Preserve route, preview, and structured-data behavior

**Files:**

- Modify: `src/app/(frontend)/news-events/[slug]/page.tsx`
- Modify: `src/components/live-preview/NewsEventLivePreview.tsx`
- Modify: `tests/int/news-events-metadata-routes.int.spec.ts`
- Modify: `tests/int/news-events-detail-template.int.spec.tsx`

**Interfaces:**

- Consumes: `getNewsEventDetailAuthorLabel(template)`.
- Preserves: `NewsEventLivePreview` entry live-preview contract.
- Preserves: route metadata, not-found, authentication, structured-data script, and parallel data
  loading.

- [ ] **Step 1: Update the route test to fail against the old article-group contract**

Change the detail-page mock to read the layout and the template mock to return a dynamic block:

```tsx
vi.mock('@/components/news-events/NewsEventDetailPage', () => ({
  NewsEventDetailPage: ({ entry }: { entry: { title: string } }) =>
    createElement('div', null, entry.title),
}))

mocks.getNewsEventDetailTemplate.mockResolvedValue({
  layout: [
    {
      blockType: 'newsEventsContent',
      authorLabel: 'Management, SNMIH',
    },
  ],
})
```

Keep the production assertion:

```tsx
expect(mocks.getNewsEventStructuredData).toHaveBeenCalledWith(
  entry,
  'Management, SNMIH',
)
```

- [ ] **Step 2: Run the metadata route test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/news-events-metadata-routes.int.spec.ts
```

Expected: FAIL because the route still reads `template.article.authorLabel`.

- [ ] **Step 3: Derive author data from the dynamic block**

In `src/app/(frontend)/news-events/[slug]/page.tsx`, import the helper and replace the old property
access:

```ts
import { getNewsEventDetailAuthorLabel } from '@/lib/newsEventDetailTemplateShared'

const structuredData = getNewsEventStructuredData(
  entry,
  getNewsEventDetailAuthorLabel(template),
)
```

Do not alter `generateStaticParams`, metadata generation, preview authentication, entry queries,
not-found handling, or JSON-LD escaping.

- [ ] **Step 4: Keep live preview on the shared presentation path**

`src/components/live-preview/NewsEventLivePreview.tsx` should continue accepting
`ResolvedNewsEventDetailTemplate` and passing it to `NewsEventDetailPage`. Update only type-shape
assumptions that still reference `template.article`; do not add a client-side template query.

Add or retain a detail-template test proving the preview-facing component can render a normalized
layout with live entry data.

- [ ] **Step 5: Run route and preview-focused tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-metadata-routes.int.spec.ts \
  tests/int/news-events-metadata.int.spec.ts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx
```

Expected: PASS with the Organization author sourced from the first normalized dynamic block.

- [ ] **Step 6: Review checkpoint**

Confirm production and preview both use `NewsEventDetailPage`, public rendering reads only the
published template, and no route or URL contract changed. Do not stage or commit.

---

### Task 6: Regenerate contracts, update project knowledge, and verify the complete change

**Files:**

- Regenerate: `src/payload-types.ts`
- Regenerate if changed: `src/app/(payload)/admin/importMap.js`
- Modify: `docs/guides/news-events.md`
- Modify: `docs/guides/blocks.md`
- Modify: `.agents/skills/project-context/references/architecture.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/payload-model.md`
- Regenerate: `.agents/skills/project-context/references/project-inventory.json`

**Interfaces:**

- Consumes: completed schema and runtime implementation from Tasks 1–5.
- Produces: current generated Payload contracts and maintained project documentation.

- [ ] **Step 1: Update editor documentation**

In `docs/guides/news-events.md`, replace the field-tab instructions with this workflow:

1. Open **Configuration → News & Events Detail Page**.
2. Add or configure the shared Page Header and Breadcrumb blocks.
3. Add exactly one News & Events Content block.
4. Arrange other Page-compatible blocks before or after the dynamic article.
5. Save drafts while composing and publish only when the dynamic block is present exactly once.
6. Explain that the route entry is injected automatically and cannot be selected manually.

In `docs/guides/blocks.md`, document that `newsEventsContent` is global-only, renders the current
entry, and owns author/share/sidebar/image-ratio presentation settings.

- [ ] **Step 2: Regenerate Payload contracts**

Run:

```bash
pnpm generate:types
pnpm generate:importmap
```

Expected: both commands PASS. `src/payload-types.ts` reflects the final global layout and dynamic
block. The import map may remain unchanged because the new block has no custom Admin component.

- [ ] **Step 3: Run the focused integration suite**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/news-events-detail-template.int.spec.tsx \
  tests/int/news-event-story.int.spec.tsx \
  tests/int/news-events-metadata-routes.int.spec.ts \
  tests/int/news-events-metadata.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/regular-block-spacing.int.spec.tsx \
  tests/int/admin-information-architecture.int.spec.ts \
  tests/int/media-governance.int.spec.ts
```

Expected: all focused tests PASS.

- [ ] **Step 4: Run static verification**

Run:

```bash
pnpm exec tsc --noEmit
pnpm lint
```

Expected: both commands exit successfully. If the repository has unrelated pre-existing failures,
record the exact command and diagnostics and verify no diagnostic points to a file changed by this
plan.

- [ ] **Step 5: Refresh project-context knowledge**

Run:

```bash
pnpm project-context:update
```

Review the generated diff against `.agents/skills/project-context/references/change-impact-map.md`.
Update the three narrative references listed above so they describe:

- The singleton global block layout.
- The global-only injected dynamic block.
- The dedicated detail renderer and existing Page renderer reuse.
- The published-template fallback and validation contract.

Then run:

```bash
pnpm project-context:check
```

Expected: PASS.

- [ ] **Step 6: Run the complete integration suite**

Run:

```bash
pnpm test:int
```

Expected: PASS. Record any unrelated pre-existing failure separately with its exact test name and
diagnostic.

- [ ] **Step 7: Final diff and safety review**

Run:

```bash
git diff --check
git status --short
git diff -- src/blocks/NewsEventsContent src/blocks/renderNewsEventDetailBlocks.tsx src/blocks/renderPageBlocks.tsx src/globals/NewsEventsDetailTemplate.ts src/lib/newsEventDetailTemplate.ts src/lib/newsEventDetailTemplateShared.ts src/components/news-events/NewsEventDetailPage.tsx src/components/news-events/NewsEventStory.tsx src/components/live-preview/NewsEventLivePreview.tsx 'src/app/(frontend)/news-events/[slug]/page.tsx' tests/int/news-events-detail-template.int.spec.tsx tests/int/news-event-story.int.spec.tsx tests/int/news-events-metadata-routes.int.spec.ts
```

Confirm:

- No unrelated user changes were modified or removed.
- `newsEventsContent` is absent from Pages and Reusable Sections.
- The global has no old active header/breadcrumb/article fields.
- Published layouts validate exactly one dynamic block.
- Runtime fallback repairs malformed saved data safely.
- The final visual article contract is unchanged unless Share Actions is disabled.
- No files are staged and no commit was created.
