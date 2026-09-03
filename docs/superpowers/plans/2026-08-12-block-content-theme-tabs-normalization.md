# Block Content and Theme Settings Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every configurable visual block a consistent top-level Content / Theme Settings authoring structure without changing stored Payload field paths.

**Architecture:** All tab containers remain unnamed Payload tabs, so this phase changes admin information architecture rather than document shape. A registry-level test discovers page, header, footer, and system-page block definitions and enforces the same two labels. Existing nested action or slide style tabs are renamed only when they already contain real presentation fields.

**Tech Stack:** Payload CMS 3 schemas, TypeScript, Vitest.

## Global Constraints

- Top-level visual block tabs must be exactly Content and Theme Settings, in that order.
- Rename Layout, Layout & Theme, and presentation-only Style labels to Theme Settings.
- Preserve every field `name`, default, condition, option, and current tab membership.
- Use unnamed tabs; do not create `content` or `themeSettings` data keys.
- Reusable Section remains a relationship-only utility block and does not gain an empty tab.
- Utility array rows do not gain new empty Theme Settings tabs.
- Existing action rows that already have variant/display controls retain two tabs, renamed to Content / Theme Settings.
- Do not commit; the user requested that the current work remain uncommitted.

---

## File Structure

- Create `tests/int/block-theme-tabs.int.spec.ts`: registry-wide tab contract and legacy-label guard.
- Modify all configurable block `config.ts` files under `src/blocks/`: normalize presentation tab labels.
- Modify `src/blocks/systemPageFields.ts`: normalize the shared system-block presentation tab.
- Modify `src/blocks/shared/contentActionsFields.ts`: normalize existing nested action presentation tabs.
- Modify `src/globals/NewsEventsSettings.ts`: keep the block-default appearance tab terminology aligned.
- Modify existing integration tests that assert Layout or Layout & Theme labels.
- Modify `docs/guides/blocks.md`: document the authoring convention.

### Task 1: Add a registry-level tab contract

**Files:**
- Create: `tests/int/block-theme-tabs.int.spec.ts`

**Interfaces:**
- Consumes: registered block definitions from `Pages`, `Headers`, `Footers`, and `SystemPages`.
- Produces: a regression guard covering every exposed visual block schema.

- [ ] **Step 1: Write the block collector and failing assertions**

```ts
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Block } from 'payload'
import { Pages } from '@/collections/Pages'
import { Headers } from '@/collections/Headers'
import { Footers } from '@/collections/Footers'
import { SystemPages } from '@/collections/SystemPages'

const collectBlocks = (fields: unknown[]): Block[] =>
  fields.flatMap((field) => {
    if (!field || typeof field !== 'object') return []
    const direct = 'blocks' in field && Array.isArray(field.blocks) ? field.blocks as Block[] : []
    const nested = 'fields' in field && Array.isArray(field.fields)
      ? collectBlocks(field.fields)
      : []
    const tabs = 'tabs' in field && Array.isArray(field.tabs)
      ? field.tabs.flatMap((tab) =>
          tab && typeof tab === 'object' && 'fields' in tab && Array.isArray(tab.fields)
            ? collectBlocks(tab.fields)
            : [],
        )
      : []
    return [...direct, ...nested, ...tabs]
  })

const registeredBlocks = [Pages, Headers, Footers, SystemPages]
  .flatMap((collection) => collectBlocks(collection.fields))
  .filter((block) => block.slug !== 'reusableSection')

describe('block Content and Theme Settings tabs', () => {
  it('uses the same top-level tabs for every configurable visual block', () => {
    expect(registeredBlocks.length).toBeGreaterThan(40)
    for (const block of registeredBlocks) {
      const tabs = block.fields[0]
      expect(tabs, block.slug).toMatchObject({ type: 'tabs' })
      if (tabs && typeof tabs === 'object' && 'tabs' in tabs && Array.isArray(tabs.tabs)) {
        expect(tabs.tabs.map(({ label }) => label), block.slug).toEqual([
          'Content',
          'Theme Settings',
        ])
      }
    }
  })

  it('does not leave legacy presentation tab labels in block schemas', () => {
    const blocksRoot = path.resolve(process.cwd(), 'src/blocks')
    const source = registeredBlocks.map((block) => JSON.stringify(block.fields)).join('\n')
    expect(source).not.toContain('Layout & Theme')
    expect(source).not.toMatch(/"label":"Layout"/)
    expect(readFileSync(path.join(blocksRoot, 'shared/contentActionsFields.ts'), 'utf8'))
      .not.toContain("label: 'Layout & Theme'")
  })
})
```

- [ ] **Step 2: Run the contract and verify it fails on current labels**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-theme-tabs.int.spec.ts
```

Expected: FAIL with blocks reporting Layout or Layout & Theme.

- [ ] **Step 3: Confirm the test includes each block registry**

Temporarily inspect the failure list and confirm it includes normal page blocks plus
`headerNavbar12`, `footer56`, `system404`, `systemMaintenance`, and `systemComingSoon`. Keep the
assertion registry-driven rather than hard-coding a partial slug list.

### Task 2: Normalize every top-level visual block tab

**Files:**
- Modify: `src/blocks/AboutSection/config.ts`
- Modify: `src/blocks/Announcement/config.ts`
- Modify: `src/blocks/AwardsList/config.ts`
- Modify: `src/blocks/BentoGrid/config.ts`
- Modify: `src/blocks/Contact24/config.ts`
- Modify: `src/blocks/Contact33/config.ts`
- Modify: `src/blocks/ContentHighlights/config.ts`
- Modify: `src/blocks/Cta39/config.ts`
- Modify: `src/blocks/DownloadList/config.ts`
- Modify: `src/blocks/EventGallery/config.ts`
- Modify: `src/blocks/FeatureMatrix/config.ts`
- Modify: `src/blocks/FeatureSpotlight/config.ts`
- Modify: `src/blocks/Footer56/config.ts`
- Modify: `src/blocks/GalleryCoverflow/config.ts`
- Modify: `src/blocks/GalleryShowcase/config.ts`
- Modify: `src/blocks/HeaderNavbar12/config.ts`
- Modify: `src/blocks/HeroBanner/config.ts`
- Modify: `src/blocks/HeroCarousel/config.ts`
- Modify: `src/blocks/IconGrid/config.ts`
- Modify: `src/blocks/ImageMosaic/config.ts`
- Modify: `src/blocks/LogoStrip/config.ts`
- Modify: `src/blocks/MediaCarousel/config.ts`
- Modify: `src/blocks/NewsEventsHighlights/config.ts`
- Modify: `src/blocks/NumberedSteps/config.ts`
- Modify: `src/blocks/PageHeader/config.ts`
- Modify: `src/blocks/ProfileCarousel/config.ts`
- Modify: `src/blocks/ProgramGrid/config.ts`
- Modify: `src/blocks/ProgramMatrix/config.ts`
- Modify: `src/blocks/QaAccordion/config.ts`
- Modify: `src/blocks/QuoteBlock/config.ts`
- Modify: `src/blocks/RatingSpotlight/config.ts`
- Modify: `src/blocks/ReviewFeed/config.ts`
- Modify: `src/blocks/ReviewSubmission/config.ts`
- Modify: `src/blocks/RichTextBlock/config.ts`
- Modify: `src/blocks/Services21/config.ts`
- Modify: `src/blocks/StatsStrip/config.ts`
- Modify: `src/blocks/TabsContent/config.ts`
- Modify: `src/blocks/TeamShowcase/config.ts`
- Modify: `src/blocks/TestimonialGrid/config.ts`
- Modify: `src/blocks/Timeline/config.ts`
- Modify: `src/blocks/VideoEmbed/config.ts`
- Modify: `src/blocks/systemPageFields.ts`

**Interfaces:**
- Consumes: current unnamed top-level tab definitions.
- Produces: unchanged field paths under the normalized labels.

- [ ] **Step 1: Change only the presentation label in each block**

For each file above, preserve the first `Content` tab and make only the applicable one-line
replacement on the top-level presentation tab:

```diff
- label: 'Layout',
+ label: 'Theme Settings',
```

```diff
- label: 'Layout & Theme',
+ label: 'Theme Settings',
```

Do not add `name` to either tab. Do not move title, item arrays, media, relationships, or action
destinations out of Content. Do not move appearance, spacing, alignment, columns, variants, or
action presentation out of Theme Settings.

- [ ] **Step 2: Normalize the shared system-page field factory**

In `src/blocks/systemPageFields.ts`, change only the second tab label to `Theme Settings`. All three
system blocks consume this factory and must retain the same data fields.

- [ ] **Step 3: Run the registry contract**

Run the Task 1 test command.

Expected: the top-level assertion passes; the nested legacy-label guard may still fail until Task 3.

- [ ] **Step 4: Check field-path stability**

Run:

```bash
pnpm run generate:types
git diff -- src/payload-types.ts
```

Expected: no new `content` or `themeSettings` object keys. Generated types may reflect unrelated
uncommitted Program Matrix work but must not change solely because labels changed.

### Task 3: Normalize existing nested presentation tabs

**Files:**
- Modify: `src/blocks/shared/contentActionsFields.ts`
- Modify: `src/blocks/HeroBanner/config.ts`
- Modify: `src/blocks/HeroCarousel/config.ts`
- Modify: `src/blocks/Footer56/config.ts`
- Modify: `src/blocks/HeaderNavbar12/config.ts`
- Modify: `src/globals/NewsEventsSettings.ts`

**Interfaces:**
- Consumes: existing nested tabs that already contain button variant, display mode, slide style, or other real presentation fields.
- Produces: consistent Content / Theme Settings labels without adding theme controls to utility rows.

- [ ] **Step 1: Rename the shared action presentation tab**

In `createContentActionsField()`, retain `actionContentFields` and
`createActionLayoutFields(includeDisplayMode)` exactly, changing only:

```ts
{
  label: 'Theme Settings',
  fields: createActionLayoutFields(includeDisplayMode),
}
```

- [ ] **Step 2: Rename local nested style tabs**

Inspect the local `buttons`, `slides`, menu/CTA, or equivalent tab definitions in the listed block
configs. Where the nested second tab already contains visual controls, rename it to Theme Settings.
Do not add tabs to plain link, menu-child, footer-link, or button rows that currently have none.

- [ ] **Step 3: Align the News & Events default-appearance label**

In `src/globals/NewsEventsSettings.ts`, rename the appearance tab from Layout & Theme to Theme
Settings while preserving the Content and SEO tabs and all stored field paths.

- [ ] **Step 4: Run the registry contract and a source scan**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-theme-tabs.int.spec.ts
rg -n "label: 'Layout'|label: 'Layout & Theme'" src/blocks src/globals/NewsEventsSettings.ts
```

Expected: test PASS and the source scan produces no matches.

### Task 4: Update label-sensitive integration tests

**Files:**
- Modify: `tests/int/carousel-blocks.int.spec.tsx`
- Modify: `tests/int/contact24-data.int.spec.ts`
- Modify: `tests/int/contact33-config.int.spec.ts`
- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `tests/int/feature-matrix.int.spec.ts`
- Modify: `tests/int/gallery-showcase.int.spec.ts`
- Modify: `tests/int/global-announcement.int.spec.ts`
- Modify: `tests/int/header-presets.int.spec.ts`
- Modify: `tests/int/image-mosaic.int.spec.tsx`
- Modify: `tests/int/news-events-collection.int.spec.ts`
- Modify: `tests/int/news-events-highlights.int.spec.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/profile-carousel.int.spec.ts`
- Modify: `tests/int/rating-spotlight.int.spec.ts`
- Modify: `tests/int/review-feed.int.spec.tsx`
- Modify: `tests/int/system-page-blocks.int.spec.ts`

**Interfaces:**
- Consumes: normalized schema labels.
- Produces: precise assertions that still validate each field's tab placement and defaults.

- [ ] **Step 1: Rename test variables and lookups**

Replace lookups such as:

```ts
const layoutTab = tabsField.tabs.find(({ label }) => label === 'Layout & Theme')
```

with:

```ts
const themeSettingsTab = tabsField.tabs.find(({ label }) => label === 'Theme Settings')
```

Update subsequent references to the renamed variable. Change exact tab arrays to
`['Content', 'Theme Settings']`. Do not loosen field-order, option, default, or condition assertions.

- [ ] **Step 2: Run all label-sensitive tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-theme-tabs.int.spec.ts tests/int/carousel-blocks.int.spec.tsx tests/int/contact24-data.int.spec.ts tests/int/contact33-config.int.spec.ts tests/int/content-highlights.int.spec.tsx tests/int/feature-matrix.int.spec.ts tests/int/gallery-showcase.int.spec.ts tests/int/global-announcement.int.spec.ts tests/int/header-presets.int.spec.ts tests/int/image-mosaic.int.spec.tsx tests/int/news-events-collection.int.spec.ts tests/int/news-events-highlights.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/profile-carousel.int.spec.ts tests/int/rating-spotlight.int.spec.ts tests/int/review-feed.int.spec.tsx tests/int/system-page-blocks.int.spec.ts
```

Expected: PASS.

### Task 5: Document and verify the authoring convention

**Files:**
- Modify: `docs/guides/blocks.md`

**Interfaces:**
- Consumes: the implemented schema convention.
- Produces: operator-facing documentation.

- [ ] **Step 1: Add a concise “Content and Theme Settings” section**

Document that Content owns copy, media, destinations, and item collections; Theme Settings owns
semantic background, border, spacing, alignment, columns, variants, and action presentation.
State that moving fields between unnamed tabs does not change stored content.

- [ ] **Step 2: Run final phase verification**

Run:

```bash
pnpm run test:int
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks src/globals/NewsEventsSettings.ts tests/int/block-theme-tabs.int.spec.ts
git diff --check
```

Expected: all commands pass and `git diff --check` prints nothing. Do not commit.

## Phase Acceptance

- Every registered configurable visual block exposes Content / Theme Settings.
- Reusable Section remains relationship-only.
- Existing nested presentation tabs use the same naming where meaningful.
- No data keys or migrations are introduced.
- Existing detailed schema assertions remain intact rather than being weakened.
