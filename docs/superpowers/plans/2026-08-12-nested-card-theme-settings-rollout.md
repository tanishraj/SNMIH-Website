# Nested Card Theme Settings Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every genuine CMS-authored visual card a nested Content / Theme Settings editor and an independently theme-aware semantic background.

**Architecture:** Eligible array rows use the shared `createCardTabs()` schema factory and `resolveCardSurface()` renderer contract from Phase 1. Always-card layouts apply the selected surface directly; multi-variant blocks apply it only to variants that already render bounded cards. Connected, borderless, navigation, gallery, logo, announcement, breadcrumb, Q&A, tab-panel, and stat structures are explicitly excluded so the rollout does not manufacture new card shells.

**Tech Stack:** Payload CMS 3, Next.js 16, React 19, TypeScript, Tailwind CSS semantic variables, Vitest, React server rendering tests.

## Global Constraints

- Eligible rows expose nested unnamed tabs labeled Content and Theme Settings.
- New background fields use Default Card, Primary, Secondary, Muted, and Accent.
- Missing, null, unknown, and legacy `none` values render as Default Card.
- Preserve every existing field name and stored data path.
- Per-card backgrounds must not change grid dimensions, card radius, image crop, spacing, or connected dividers.
- Foreground, supporting copy, icons, links, dividers, and matching buttons come from `resolveCardSurface()`.
- Do not add per-card backgrounds to utility arrays or borderless/connected structures that are not cards.
- Do not use raw color values or SNMIH-specific classes in components.
- Do not commit; the user requested that the current work remain uncommitted.

---

## File Structure

- Create `tests/int/card-block-theme-contract.int.spec.tsx`: eligible/excluded schema inventory and renderer contract.
- Modify eligible block configs: Program Grid, Icon Grid, Bento Grid, Feature Matrix, Content Highlights, Profile Carousel, Team Showcase, Testimonial Grid, Awards List, Download List, Media Carousel, and Numbered Steps.
- Modify the exact block, client, and presentation files listed in Tasks 3–5.
- Create `tests/int/card-block-renderers.int.spec.tsx`: focused cross-block surface rendering tests.
- Modify `src/payload-types.ts`: regenerate after schema changes.
- Modify `src/block-thumbnails/fixtures.tsx`: add representative surface values without changing layouts.
- Modify `docs/guides/blocks.md` and `docs/architecture/feature-inventory.md`: document supported per-card theming.

## Eligibility Inventory

Always-card or always-tile collections:

- `programMatrix.items` (completed in Phase 1)
- `programGrid.programs`
- `iconGrid.items`
- `bentoGrid.items`
- `featureMatrix.features`
- `profileCarousel.profiles`
- `teamShowcase.members`
- `mediaCarousel.items`

Variant-dependent card collections:

- `contentHighlights.items`: apply surface only to `numberedSteps`
- `testimonialGrid.testimonials`: apply to `grid` and `featured`, not `list`
- `awardsList.awards`: apply to `cards`, not `table` or `rows`
- `downloadList.downloads`: apply to `cards`, not `list` or `compact`
- `numberedSteps.steps`: apply to `cards`, not `vertical` or `alternating`

Explicit exclusions:

- Timeline, Stats Strip, Tabs Content, About Section values/stats, Page Header key facts
- Announcement items, Q&A entries, breadcrumbs, menus, submenu children, links, and CTA arrays
- raw gallery/image arrays and Logo Strip logos
- Footer link groups and individual links

### Task 1: Lock eligible and excluded nested schemas

**Files:**
- Create: `tests/int/card-block-theme-contract.int.spec.tsx`

**Interfaces:**
- Consumes: exported block configs and shared field factories.
- Produces: one auditable allowlist preventing both missed cards and theme-tab overreach.

- [ ] **Step 1: Write schema traversal helpers**

```ts
import { describe, expect, it } from 'vitest'
import type { ArrayField, Block, TabsField } from 'payload'
import { ProgramGridBlock } from '@/blocks/ProgramGrid/config'
import { IconGridBlock } from '@/blocks/IconGrid/config'
import { BentoGridBlock } from '@/blocks/BentoGrid/config'
import { FeatureMatrixBlock } from '@/blocks/FeatureMatrix/config'
import { ContentHighlightsBlock } from '@/blocks/ContentHighlights/config'
import { ProfileCarouselBlock } from '@/blocks/ProfileCarousel/config'
import { TeamShowcaseBlock } from '@/blocks/TeamShowcase/config'
import { TestimonialGridBlock } from '@/blocks/TestimonialGrid/config'
import { AwardsListBlock } from '@/blocks/AwardsList/config'
import { DownloadListBlock } from '@/blocks/DownloadList/config'
import { MediaCarouselBlock } from '@/blocks/MediaCarousel/config'
import { NumberedStepsBlock } from '@/blocks/NumberedSteps/config'

const findField = (fields: unknown[], name: string): Record<string, unknown> | undefined => {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    if ('name' in field && field.name === name) return field as Record<string, unknown>
    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findField(field.fields, name)
      if (nested) return nested
    }
    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if (tab && typeof tab === 'object' && 'fields' in tab && Array.isArray(tab.fields)) {
          const nested = findField(tab.fields, name)
          if (nested) return nested
        }
      }
    }
  }
}

const eligible: Array<[Block, string]> = [
  [ProgramGridBlock, 'programs'],
  [IconGridBlock, 'items'],
  [BentoGridBlock, 'items'],
  [FeatureMatrixBlock, 'features'],
  [ContentHighlightsBlock, 'items'],
  [ProfileCarouselBlock, 'profiles'],
  [TeamShowcaseBlock, 'members'],
  [TestimonialGridBlock, 'testimonials'],
  [AwardsListBlock, 'awards'],
  [DownloadListBlock, 'downloads'],
  [MediaCarouselBlock, 'items'],
  [NumberedStepsBlock, 'steps'],
]
```

- [ ] **Step 2: Add failing eligible-row assertions**

```ts
for (const [block, name] of eligible) {
  it(`${block.slug}.${name} exposes card Content and Theme Settings`, () => {
    const array = findField(block.fields, name) as ArrayField
    const tabs = array.fields[0] as TabsField
    expect(tabs.type).toBe('tabs')
    expect(tabs.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(
      findField(tabs.tabs[1].fields, 'cardBackground') ??
        findField(tabs.tabs[1].fields, 'accentColor'),
    ).toMatchObject({ type: 'select', required: true })
  })
}
```

- [ ] **Step 3: Add excluded-row assertions**

Import Timeline, Stats Strip, Tabs Content, About Section, Page Header, Announcement, Q&A, Logo
Strip, Gallery Showcase, Gallery Coverflow, Image Mosaic, Header Navbar, and Footer block configs.
Use this exact exclusion list and assert its first row field is not a tabs field with Theme
Settings:

```ts
const excluded: Array<[Block, string]> = [
  [TimelineBlock, 'items'],
  [StatsStripBlock, 'items'],
  [TabsContentBlock, 'tabs'],
  [AboutSectionBlock, 'values'],
  [AboutSectionBlock, 'stats'],
  [PageHeaderBlock, 'breadcrumbs'],
  [PageHeaderBlock, 'keyFacts'],
  [AnnouncementBlock, 'items'],
  [QaAccordionBlock, 'items'],
  [LogoStripBlock, 'logos'],
  [GalleryShowcaseBlock, 'images'],
  [GalleryCoverflowBlock, 'images'],
  [ImageMosaicBlock, 'items'],
  [HeaderNavbar12Block, 'menuItems'],
  [Footer56Block, 'linkGroups'],
]

for (const [block, name] of excluded) {
  it(`${block.slug}.${name} does not expose per-item Theme Settings`, () => {
    const array = findField(block.fields, name) as ArrayField
    const first = array.fields[0]
    const labels =
      first && typeof first === 'object' && 'tabs' in first && Array.isArray(first.tabs)
        ? first.tabs.map(({ label }) => label)
        : []
    expect(labels).not.toContain('Theme Settings')
  })
}
```

This guard prevents a future mechanical migration from adding meaningless controls.

- [ ] **Step 4: Run the test and verify it fails on flat eligible rows**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-theme-contract.int.spec.tsx
```

Expected: FAIL because eligible rows other than Program Matrix are still flat.

### Task 2: Convert eligible row schemas without changing field paths

**Files:**
- Modify: `src/blocks/ProgramGrid/config.ts`
- Modify: `src/blocks/IconGrid/config.ts`
- Modify: `src/blocks/BentoGrid/config.ts`
- Modify: `src/blocks/FeatureMatrix/config.ts`
- Modify: `src/blocks/ContentHighlights/config.ts`
- Modify: `src/blocks/ProfileCarousel/config.ts`
- Modify: `src/blocks/TeamShowcase/config.ts`
- Modify: `src/blocks/TestimonialGrid/config.ts`
- Modify: `src/blocks/AwardsList/config.ts`
- Modify: `src/blocks/DownloadList/config.ts`
- Modify: `src/blocks/MediaCarousel/config.ts`
- Modify: `src/blocks/NumberedSteps/config.ts`

**Interfaces:**
- Consumes: `createCardTabs()` and `createCardBackgroundField()` from Phase 1.
- Produces: unchanged item field paths plus one additive card-background field per eligible row.

- [ ] **Step 1: Wrap always-card rows with shared tabs**

For Program Grid, Icon Grid, Feature Matrix, Profile Carousel, Team Showcase, and Media Carousel,
replace the flat `fields` array with one unnamed tab field. Use this exact allocation:

| Block | Content fields | Theme Settings fields |
| --- | --- | --- |
| Program Grid | `image`, `category`, `badge`, `title`, `description`, duration/intake row, `linkType`, `page`, `url`, `openInNewTab` | generated `cardBackground` |
| Icon Grid | `icon`, `title`, `description`, `linkType`, `page`, `url`, `openInNewTab` | generated `cardBackground` |
| Feature Matrix | `title`, `description`, `image` | `imagePosition`, generated `cardBackground` |
| Profile Carousel | `image`, `name`, `role` | `imagePosition`, generated `cardBackground` |
| Team Showcase | `image`, `name`, `role`, `description` | generated `cardBackground` |
| Media Carousel | `media`, `icon`, `title`, `summary`, `actions` | generated `cardBackground` |

```ts
fields: [
  createCardTabs({
    contentFields,
    themeFields,
  }),
],
```

Keep `imagePosition` under Theme Settings for Feature Matrix and Profile Carousel. Keep all media,
copy, relationship, URL, and action fields under Content.

- [ ] **Step 2: Preserve Bento Grid's legacy surface field**

Move `size` and `accentColor` into the nested Theme Settings tab. Keep the stored field name
`accentColor`, relabel it Background, add the missing Muted option, and label the legacy `none`
value Default Card:

```ts
{
  name: 'accentColor',
  label: 'Background',
  type: 'select',
  defaultValue: 'none',
  required: true,
  options: [
    { label: 'Default Card', value: 'none' },
    { label: 'Primary', value: 'primary' },
    { label: 'Secondary', value: 'secondary' },
    { label: 'Muted', value: 'muted' },
    { label: 'Accent', value: 'accent' },
  ],
}
```

Build the nested tabs directly for Bento Grid or add an `includeBackground: false` option to
`createCardTabs()` with a focused shared-helper test. Do not add a duplicate `cardBackground` key.

- [ ] **Step 3: Wrap variant-dependent rows with the same authoring contract**

Use `createCardTabs()` for Content Highlights, Testimonial Grid, Awards List, Download List, and
Numbered Steps. Add an admin description to Background stating exactly which parent variant uses
the surface; renderers will ignore it for non-card variants without altering stored content.

- [ ] **Step 4: Run the nested schema contract**

Run the Task 1 command.

Expected: PASS for eligible and excluded inventories.

- [ ] **Step 5: Regenerate Payload types and verify additive fields**

Run:

```bash
pnpm run generate:types
rg -n "cardBackground|accentColor" src/payload-types.ts
```

Expected: eligible item interfaces include optional/generated semantic background unions; Bento
Grid retains `accentColor` and no `content` or `themeSettings` object keys appear.

### Task 3: Theme always-card grids and matrices

**Files:**
- Modify: `src/blocks/ProgramGrid/Component.tsx`
- Modify: `src/blocks/ProgramGrid/ProgramGridClient.tsx`
- Modify: `src/blocks/IconGrid/Component.tsx`
- Modify: `src/blocks/BentoGrid/Component.tsx`
- Modify: `src/blocks/FeatureMatrix/Component.tsx`
- Modify: `src/components/feature-matrix.tsx`
- Modify: `src/blocks/MediaCarousel/Component.tsx`
- Modify: `src/blocks/MediaCarousel/MediaCarouselClient.tsx`
- Create: `tests/int/card-block-renderers.int.spec.tsx`
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `tests/int/carousel-blocks.int.spec.tsx`

**Interfaces:**
- Consumes: `resolveCardSurface()`.
- Produces: independent semantic card surfaces while retaining existing grids, dividers, images, and actions.

- [ ] **Step 1: Add one renderer test per block family**

Render at least Default, Primary, Secondary, Muted, and Accent items in each family. Assert the
item marker contains `data-card-background`, the expected semantic background/foreground class,
and no raw `dark:bg-*`, `text-white`, or theme-specific value. For Program Grid and Media Carousel,
also assert a link or button on Primary uses the shared contrast class.

- [ ] **Step 2: Run the focused renderer tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/feature-matrix.int.spec.ts tests/int/carousel-blocks.int.spec.tsx
```

Expected: FAIL because the card values are not propagated or rendered.

- [ ] **Step 3: Propagate normalized surfaces through server-to-client boundaries**

At each server mapping boundary, normalize and pass the value:

```ts
const surface = resolveCardSurface(item.cardBackground)

return {
  ...resolvedContent,
  cardBackground: surface.value,
}
```

For Bento Grid use:

```ts
const surface = resolveCardSurface(item.accentColor === 'none' ? 'default' : item.accentColor)
```

Extend the corresponding resolved item interfaces with `cardBackground: CardSurfaceValue`.

- [ ] **Step 4: Apply the shared classes without changing geometry**

At each existing card/article wrapper, combine the existing layout classes with:

```tsx
const surface = resolveCardSurface(item.cardBackground)

<article
  className={cn(existingCardClasses, surface.className, surface.divider)}
  data-card-background={surface.value}
>
```

Replace fixed supporting-copy, icon, link, divider, and matching-button classes with
`surface.secondary`, `surface.icon`, `surface.link`, `surface.divider`, and `surface.button[variant]`.
Do not alter existing rounded, padding, grid-span, image-position, or divider placement classes.

- [ ] **Step 5: Run the focused renderer tests**

Run the Task 3 test command again.

Expected: PASS.

### Task 4: Theme people cards

**Files:**
- Modify: `src/blocks/ProfileCarousel/Component.tsx`
- Modify: `src/components/profile-carousel.tsx`
- Modify: `src/components/profile-carousel-card.tsx`
- Modify: `src/components/profile-carousel-client.tsx`
- Modify: `src/blocks/TeamShowcase/Component.tsx`
- Modify: `src/components/team-showcase.tsx`
- Modify: `tests/int/profile-carousel.int.spec.ts`
- Modify: `tests/int/card-block-renderers.int.spec.tsx`
- Modify: `tests/int/profile-carousel.int.spec.ts`

**Interfaces:**
- Consumes: normalized `CardSurfaceValue` and `resolveCardSurface()`.
- Produces: static, carousel, base, and hover-profile cards with identical semantic surfaces.

- [ ] **Step 1: Add profile and team surface tests**

Assert all five surface values render in static profile mode. Assert the carousel receives the
same normalized value. For Team Showcase, assert both the base member unit and highlighted hover
card inherit the member's selected surface rather than hard-coded `bg-background`.

- [ ] **Step 2: Run the people-card tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/profile-carousel.int.spec.ts
```

Expected: FAIL on missing surface propagation.

- [ ] **Step 3: Extend shared people-card item types**

Add `cardBackground?: CardSurfaceValue | null` to profile/member input types and normalize it before
rendering. Pass the value through `ProfileCarouselClient` and `ProfileCarouselCard`; use the same
value for Team Showcase's base and highlighted states.

- [ ] **Step 4: Apply semantic surface classes**

Use `surface.className` on the existing visible card container and `surface.secondary` for role and
description. Keep circular avatars, image crop, overlay gradient structure, spacing, and hover
motion unchanged. Replace only the hover card's fixed `bg-background text-foreground` surface.

- [ ] **Step 5: Run the people-card tests**

Run the Task 4 test command again.

Expected: PASS.

### Task 5: Theme variant-dependent card renderers

**Files:**
- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `src/components/content-highlights.tsx`
- Modify: `src/blocks/TestimonialGrid/Component.tsx`
- Modify: `src/blocks/AwardsList/Component.tsx`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/NumberedSteps/Component.tsx`
- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `tests/int/card-block-renderers.int.spec.tsx`
- Modify: `tests/int/block-layout-contracts.int.spec.tsx`

**Interfaces:**
- Consumes: `resolveCardSurface()`.
- Produces: card-only theming with non-card variants remaining visually and structurally unchanged.

- [ ] **Step 1: Add paired card/non-card assertions**

For each block, render one Primary item in its card variant and assert
`bg-primary text-primary-foreground`. Render the same item in every non-card variant and assert the
item does not receive `data-card-background` or a new background class. Also assert connected
dividers and table/list wrappers remain unchanged.

- [ ] **Step 2: Run the variant tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/card-block-renderers.int.spec.tsx tests/int/block-layout-contracts.int.spec.tsx tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL on missing card surface behavior.

- [ ] **Step 3: Propagate the item surface without changing layout selection**

Add `cardBackground` to each resolved item. Inside the existing variant branch, resolve and apply
it only when:

```ts
const usesCardSurface =
  (block === 'contentHighlights' && layout === 'numberedSteps') ||
  (block === 'testimonialGrid' && variant !== 'list') ||
  (block === 'awardsList' && variant === 'cards') ||
  (block === 'downloadList' && displayMode === 'cards') ||
  (block === 'numberedSteps' && variant === 'cards')
```

Implement these checks locally in their respective components; do not introduce a cross-block
string-switch utility.

- [ ] **Step 4: Apply surfaces to existing card wrappers only**

Use the shared surface classes on the wrapper that already contains `bg-card`, replacing fixed
foreground/supporting/icon/link classes. Leave list, table, compact, vertical, alternating,
editorial, simple-grid, and connected render branches unchanged.

- [ ] **Step 5: Run the variant-focused tests**

Run the Task 5 command again.

Expected: PASS with both positive card assertions and negative non-card assertions.

### Task 6: Update fixtures, types, and documentation

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `src/payload-types.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`

**Interfaces:**
- Consumes: completed schema and renderer behavior.
- Produces: representative previews, generated types, and accurate authoring documentation.

- [ ] **Step 1: Add restrained fixture variety**

Set most fixture cards to Default Card, with one Muted and one Primary example in representative
card-heavy blocks. Do not recolor every thumbnail item or change fixture copy, media, ordering, or
layout.

- [ ] **Step 2: Regenerate Payload types**

Run:

```bash
pnpm run generate:types
```

Expected: success; eligible row types include background fields and all prior field paths remain.

- [ ] **Step 3: Document the card theme rules**

In `docs/guides/blocks.md`, add the five semantic choices, automatic light/dark adaptation, and
card-variant applicability. In `docs/architecture/feature-inventory.md`, mark the eligible card
blocks as supporting per-card semantic surfaces and explicitly note variant-dependent behavior.

- [ ] **Step 4: Run the complete verification suite**

Run:

```bash
pnpm run test:int
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
git diff --check
```

Expected: all commands pass; the build completes static generation; `git diff --check` prints no
output. Do not commit.

- [ ] **Step 5: Perform visual theme QA**

At desktop and mobile widths, inspect Program Matrix, Program Grid, Icon Grid, Bento Grid, Feature
Matrix, Profile Carousel, Team Showcase, Testimonial Grid, Awards List, Download List, Media
Carousel, Numbered Steps, and Content Highlights under SNMIH light and dark modes. Confirm:

- card size, spacing, radius, and image crop did not change;
- Primary, Secondary, Muted, and Accent cards have readable titles and supporting copy;
- icons, links, buttons, hover, and focus remain visible;
- non-card variants did not acquire boxes or backgrounds;
- connected dividers remain continuous.

## Phase Acceptance

- Every eligible visual card row has nested Content / Theme Settings tabs.
- Every excluded utility or connected array remains free of meaningless theme controls.
- All semantic surface choices adapt through tokens in light and dark modes.
- Variant-dependent blocks theme only genuine card variants.
- Generated types, thumbnails, documentation, integration tests, lint, TypeScript, and build pass.
