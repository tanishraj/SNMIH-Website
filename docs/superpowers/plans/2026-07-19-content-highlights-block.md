# Content Highlights Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a theme-aware Content Highlights Payload page block with Editorial Row, Highlights Grid, and Split Highlights layouts.

**Architecture:** Define one normalized Payload schema in `src/blocks/ContentHighlights/config.ts`, adapt CMS values in a thin block component, and keep rendering in a pure server presentation component. Reuse shared appearance, spacing, action, link-resolution, registration, type-generation, and real-render thumbnail infrastructure.

**Tech Stack:** Payload CMS 3, Next.js 16 App Router, React 19 server components, Tailwind CSS 4, shadcn Separator/Button-backed shared actions, Vitest, Testing Library

## Global Constraints

- Block name: `Content Highlights`; slug: `contentHighlights`; interface: `ContentHighlightsBlock`.
- Layout values: `editorialRow`, `highlightsGrid`, and `splitHighlights`; default: `highlightsGrid`.
- Items use one normalized 1–6 row schema and remain reusable when layouts change.
- Preserve the shared `max-w-screen-2xl` container, regular block spacing, typography, semantic colors, and semantic borders.
- Section actions allow zero, one, or two entries and use the existing Link/Button mode.
- Item destinations are optional and incomplete destinations render static titles.
- Render entirely on the server; do not add client state, effects, browser APIs, or new dependencies.
- Keep all changes unstaged and uncommitted.

---

### Task 1: Define and test the Payload schema

**Files:**
- Create: `src/blocks/ContentHighlights/config.ts`
- Create: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**
- Consumes: `createBlockAppearanceFields`, `createContentActionsField`, `createContentActionModeField`, and `getBlockThumbnailAdmin`.
- Produces: `ContentHighlightsBlock: Block` with the approved tabs, layouts, size values, and item constraints.

- [ ] **Step 1: Write the failing schema test**

Create `tests/int/content-highlights.int.spec.tsx` with schema helpers and this initial test:

```tsx
import { describe, expect, it } from 'vitest'

import { ContentHighlightsBlock } from '@/blocks/ContentHighlights/config'

type TestField = {
  defaultValue?: unknown
  fields?: TestField[]
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ label: string; value: string }>
  required?: boolean
  type?: string
}

type TestTab = { fields: TestField[]; label: string }

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

describe('Content Highlights', () => {
  it('defines the approved Payload schema', () => {
    expect(ContentHighlightsBlock).toMatchObject({
      interfaceName: 'ContentHighlightsBlock',
      labels: { plural: 'Content Highlights', singular: 'Content Highlights' },
      slug: 'contentHighlights',
    })

    const tabs = ContentHighlightsBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const content = tabs.tabs.find(({ label }) => label === 'Content')
    const layout = tabs.tabs.find(({ label }) => label === 'Layout & Theme')
    const items = getField(content?.fields ?? [], 'items')

    expect(tabs.type).toBe('tabs')
    expect(content?.fields.map(({ name }) => name)).toEqual([
      'eyebrow',
      'title',
      'description',
      'actions',
      'items',
    ])
    expect(getField(content?.fields ?? [], 'title')).toMatchObject({ required: true, type: 'text' })
    expect(items).toMatchObject({ maxRows: 6, minRows: 1, required: true, type: 'array' })
    expect(items?.fields?.map(({ name }) => name)).toEqual([
      'metadata',
      'title',
      'description',
      'linkType',
      'page',
      'url',
      'openInNewTab',
    ])
    expect(getField(items?.fields ?? [], 'title')).toMatchObject({ required: true, type: 'text' })
    expect(getField(layout?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(getField(layout?.fields ?? [], 'actionMode')?.defaultValue).toBe('link')
    expect(getField(layout?.fields ?? [], 'layout')).toMatchObject({
      defaultValue: 'highlightsGrid',
      required: true,
    })
    expect(getField(layout?.fields ?? [], 'layout')?.options?.map(({ value }) => value)).toEqual([
      'editorialRow',
      'highlightsGrid',
      'splitHighlights',
    ])
    expect(getField(layout?.fields ?? [], 'size')?.defaultValue).toBe('default')
  })
})
```

- [ ] **Step 2: Run the schema test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because `@/blocks/ContentHighlights/config` does not exist.

- [ ] **Step 3: Implement the schema**

Create `src/blocks/ContentHighlights/config.ts` with:

```ts
import type { ArrayField, Block, Condition, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  createContentActionModeField,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'

type ItemLinkSiblingData = { linkType?: 'custom' | 'none' | 'page' | null }

const isPageLink: Condition = (_data, siblingData: ItemLinkSiblingData) =>
  siblingData?.linkType === 'page'
const isCustomLink: Condition = (_data, siblingData: ItemLinkSiblingData) =>
  siblingData?.linkType === 'custom'
const hasItemLink: Condition = (_data, siblingData: ItemLinkSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const itemsField = {
  name: 'items',
  label: 'Items',
  type: 'array',
  minRows: 1,
  maxRows: 6,
  required: true,
  admin: { initCollapsed: true },
  fields: [
    { name: 'metadata', type: 'text' },
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    {
      name: 'linkType',
      label: 'Item Link',
      type: 'select',
      defaultValue: 'none',
      options: [
        { label: 'No Link', value: 'none' },
        { label: 'Page', value: 'page' },
        { label: 'Custom URL', value: 'custom' },
      ],
      required: true,
    },
    { name: 'page', type: 'relationship', relationTo: 'pages', admin: { condition: isPageLink } },
    {
      name: 'url',
      label: 'Custom URL',
      type: 'text',
      admin: { condition: isCustomLink },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: { condition: hasItemLink },
    },
  ],
} satisfies ArrayField

export const ContentHighlightsBlock: Block = {
  slug: 'contentHighlights',
  interfaceName: 'ContentHighlightsBlock',
  admin: getBlockThumbnailAdmin('contentHighlights'),
  labels: { singular: 'Content Highlights', plural: 'Content Highlights' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            createContentActionsField(),
            itemsField,
          ],
        },
        {
          label: 'Layout & Theme',
          fields: [
            createBlockAppearanceFields({ includeTextOverride: false }),
            createContentActionModeField(),
            {
              name: 'layout',
              label: 'Layout',
              type: 'select',
              defaultValue: 'highlightsGrid',
              options: [
                { label: 'Editorial Row', value: 'editorialRow' },
                { label: 'Highlights Grid', value: 'highlightsGrid' },
                { label: 'Split Highlights', value: 'splitHighlights' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Size',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
              required: true,
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
```

The `getBlockThumbnailAdmin` type will remain temporarily red until Task 4 adds the thumbnail definition.

- [ ] **Step 4: Run the schema test after Task 4's definition is available**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx -t "defines the approved Payload schema"
```

Expected: PASS.

---

### Task 2: Build the server-rendered presentation and block adapter

**Files:**
- Create: `src/components/content-highlights.tsx`
- Create: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**
- Consumes: `BlockAppearance`, `regularBlockContainerClasses`, `regularBlockMobilePaddingClasses`, `ContentActions`, `resolveCmsActions`, and `resolveCmsLink`.
- Produces: `ContentHighlights` presentation component and `ContentHighlightsBlockComponent` Payload adapter.

- [ ] **Step 1: Add failing presentation and resilience tests**

Extend `tests/int/content-highlights.int.spec.tsx` with static-render tests that create all three layouts and assert:

```tsx
expect(editorialHtml).toContain('data-content-highlights-layout="editorialRow"')
expect(editorialHtml).toContain('lg:grid-cols-3')
expect(editorialHtml).toContain('Research · Jul 08, 2026')
expect(editorialHtml).toContain('All stories')

expect(gridHtml).toContain('data-content-highlights-layout="highlightsGrid"')
expect(gridHtml).toContain('md:grid-cols-2')
expect(gridHtml).toContain('lg:grid-cols-3')

expect(splitHtml).toContain('data-content-highlights-layout="splitHighlights"')
expect(splitHtml).toContain('lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]')
expect(splitHtml).toContain('md:grid-cols-2')

expect(linkedHtml).toContain('href="/programs"')
expect(linkedHtml).toContain('target="_blank"')
expect(linkedHtml).not.toContain('Missing item')
expect(staticHtml).not.toContain('href=""')
```

- [ ] **Step 2: Run the component tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because the presentation and adapter do not exist.

- [ ] **Step 3: Implement the pure presentation component**

Create `src/components/content-highlights.tsx` with these public contracts:

```tsx
import type { ReactNode } from 'react'

import type { BlockAppearance } from '@/blocks/shared/blockAppearance'

export type ContentHighlightsLayout = 'editorialRow' | 'highlightsGrid' | 'splitHighlights'
export type ContentHighlightsSize = 'comfortable' | 'compact' | 'default'
export type ContentHighlightItem = {
  description?: string
  href?: string
  metadata?: string
  openInNewTab?: boolean
  title: string
}

export type ContentHighlightsProps = {
  actions?: ReactNode
  appearance?: BlockAppearance | null
  description?: string | null
  eyebrow?: string | null
  items: ContentHighlightItem[]
  layout?: ContentHighlightsLayout
  size?: ContentHighlightsSize
  title: string
}
```

Implement module-level class maps:

```ts
const itemGridClasses = {
  editorialRow: 'grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
  highlightsGrid: 'grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
  splitHighlights: 'grid gap-x-8 gap-y-8 md:grid-cols-2',
} as const

const sectionGapClasses = {
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const
```

Render every item as an `article` beginning with the installed shadcn `<Separator />`, followed by optional metadata, a bold non-heading title or linked title, and optional description. Linked titles use a semantic rounded focus outline and underline on hover; static titles use the same typography. Use `rel="noreferrer"` and `target="_blank"` only when `openInNewTab` is true.

Render the layouts with these exact structural classes:

```tsx
// Editorial Row header
<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

// Shared item grids
<div className={itemGridClasses[resolvedLayout]}>

// Split layout
<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
```

Use `regularBlockMobilePaddingClasses[resolvedSize]`, `resolveBlockAppearanceClasses`, and `regularBlockContainerClasses`. Apply normalized content typography:

```tsx
<p className="font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current/70" />
<h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl" />
<p className="text-base leading-7 text-balance text-current/70" />
```

- [ ] **Step 4: Implement the thin Payload adapter**

Create `src/blocks/ContentHighlights/Component.tsx`. Define a block-like input type containing the generated field shapes plus `CmsActionValue[]`. Resolve and trim values once:

```tsx
const resolvedItems = (items ?? []).flatMap((item): ContentHighlightItem[] => {
  const itemTitle = item.title?.trim()

  if (!itemTitle) return []

  const destination = resolveCmsLink({
    linkType: item.linkType === 'none' ? null : item.linkType,
    openInNewTab: item.openInNewTab,
    page: item.page,
    url: item.url,
  })

  return [{
    description: item.description?.trim() || undefined,
    href: destination.href,
    metadata: item.metadata?.trim() || undefined,
    openInNewTab: destination.openInNewTab,
    title: itemTitle,
  }]
})
```

Return `null` if the trimmed section title is empty or there are no valid items. Otherwise render `ContentHighlights` and pass a shared `ContentActions` node:

```tsx
<ContentActions
  actions={resolveCmsActions(actions)}
  alignment="left"
  data-content-highlights-actions="true"
  mode={actionMode ?? 'link'}
/>
```

- [ ] **Step 5: Run all Content Highlights tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: all schema, layout, action, item-link, and resilience tests PASS after Task 4 supplies the thumbnail definition.

---

### Task 3: Register the block and regenerate Payload types

**Files:**
- Modify: `src/collections/Pages.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `src/payload-types.ts` via the Payload generator

**Interfaces:**
- Consumes: `ContentHighlightsBlock`, `ContentHighlightsBlockComponent`.
- Produces: Page-editor availability, frontend rendering, and generated `ContentHighlightsBlock` types.

- [ ] **Step 1: Update registration tests first**

Add `contentHighlights` after `featureMatrix` in the expected page block arrays in both registration tests. Add a source assertion that `src/blocks/renderPageBlocks.tsx` contains:

```ts
case 'contentHighlights':
```

- [ ] **Step 2: Run registration tests and verify failure**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/page-blocks.int.spec.ts -t "registers a general layout blocks field on Pages"
pnpm exec vitest run --config ./vitest.config.mts tests/int/system-page-blocks.int.spec.ts -t "registers page, header, footer, and system blocks only on their intended collections"
```

Expected: FAIL because Content Highlights is not registered.

- [ ] **Step 3: Register config and renderer**

Import `ContentHighlightsBlock` into `src/collections/Pages.ts` and add it immediately after `FeatureMatrixBlock` in the layout block list.

Import `ContentHighlightsBlockComponent` into `src/blocks/renderPageBlocks.tsx` and add:

```tsx
case 'contentHighlights':
  return (
    <ContentHighlightsBlockComponent
      key={block.id ?? `${block.blockType}-${index}`}
      {...block}
    />
  )
```

- [ ] **Step 4: Generate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: exit 0 and `src/payload-types.ts` contains `ContentHighlightsBlock` plus `blockType: 'contentHighlights'`.

- [ ] **Step 5: Re-run registration tests**

Run the two commands from Step 2.

Expected: both targeted tests PASS.

---

### Task 4: Add the real-render block thumbnail

**Files:**
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Verify/Create: `public/block-thumbnails/content-highlights.jpg`

**Interfaces:**
- Consumes: `ContentHighlightsBlockComponent` and existing thumbnail generator.
- Produces: `contentHighlights` thumbnail manifest entry, deterministic fixture, and 1600×900 JPEG.

- [ ] **Step 1: Update thumbnail expectations first**

Add `contentHighlights` to the expected registered slug list and add:

```ts
expect(getBlockThumbnailDefinition('contentHighlights')).toMatchObject({
  filename: 'content-highlights.jpg',
  label: 'Content Highlights',
  slug: 'contentHighlights',
  stageAlignment: 'top',
})
```

- [ ] **Step 2: Add the manifest definition**

Insert after Feature Matrix:

```ts
defineThumbnail({
  alt: 'Content Highlights block preview',
  filename: 'content-highlights.jpg',
  label: 'Content Highlights',
  slug: 'contentHighlights',
  stageAlignment: 'top',
}),
```

- [ ] **Step 3: Add the deterministic fixture**

Import `ContentHighlightsBlockComponent` and add a `contentHighlights` fixture using `highlightsGrid`, `size="compact"`, muted background with top-and-bottom border, one section action, and six items titled Housing, Wellness, Organizations, Athletics, Service, and Diversity. Use custom URLs only; do not add remote assets.

- [ ] **Step 4: Generate and inspect the thumbnail**

Run:

```bash
pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/content-highlights.jpg` is generated as a 1600×900 JPEG. Restore any unrelated thumbnails changed by nondeterministic rendering without discarding Content Highlights work.

- [ ] **Step 5: Run thumbnail tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: all thumbnail metadata, dimensions, fixture, and local-asset tests PASS.

---

### Task 5: Final quality and responsive verification

**Files:**
- Verify all files from Tasks 1–4

**Interfaces:**
- Consumes: complete Content Highlights implementation.
- Produces: verified, formatted, unstaged implementation.

- [ ] **Step 1: Run focused tests together**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/content-highlights.int.spec.tsx \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: all focused tests PASS.

- [ ] **Step 2: Run scoped lint and formatting**

Run:

```bash
pnpm exec eslint \
  src/blocks/ContentHighlights \
  src/components/content-highlights.tsx \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  tests/int/content-highlights.int.spec.tsx

pnpm exec prettier --check \
  src/blocks/ContentHighlights \
  src/components/content-highlights.tsx \
  src/block-thumbnails/definitions.ts \
  src/block-thumbnails/fixtures.tsx \
  tests/int/content-highlights.int.spec.tsx
```

Expected: both commands exit 0.

- [ ] **Step 3: Verify responsive behavior**

At 1440px, confirm Editorial Row and Highlights Grid render three columns and Split Highlights renders a one-third/two-thirds split with a two-column item grid. At 390px, confirm each variant is one column, section actions follow the intro, standard 16px container padding remains, and `document.body.scrollWidth <= document.documentElement.clientWidth`.

- [ ] **Step 4: Verify final repository state**

Run:

```bash
git diff --check
git diff --cached --quiet
git status --short
```

Expected: no whitespace errors, cached diff exit 0, and all Content Highlights changes remain unstaged.
