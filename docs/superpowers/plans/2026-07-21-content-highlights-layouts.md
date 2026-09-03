# Content Highlights Split and Alignment Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make split composition independent of Content Highlights item presentation, add conditional horizontal and vertical alignment controls, and convert existing split content safely.

**Architecture:** Keep the four item presentations independent from composition. Payload stores `enableSplitLayout`, `contentAlignment`, and `splitContentAlignment`; the presentation component selects stacked or split composition and resolves the appropriate alignment and grid classes. A temporary, tested migration utility updates current Page documents and Page versions before being removed.

**Tech Stack:** Payload CMS 3.85.2, MongoDB/Mongoose adapter, React, TypeScript, Tailwind CSS, Vitest, React DOM server rendering.

## Global Constraints

- Preserve the `contentHighlights` block slug and all block content.
- Layout offers only `editorialRow`, `highlightsGrid`, `simpleGrid`, and `numberedSteps`.
- Split composition is an independent checkbox and defaults off.
- Non-split Content Alignment offers Left, Center, and Right and defaults Left.
- Split Content Vertical Alignment offers Top, Center, and Bottom and defaults Top.
- Alignment affects the introduction, not individual item text.
- Editorial Row retains its far-right desktop action slot only when split is disabled.
- Split mode places introduction left and items right on large screens and stacks them on smaller screens.
- Split item areas never exceed two columns.
- Convert current Page documents and Page versions from `splitHighlights` to `highlightsGrid` plus enabled split before removing the legacy value.
- Leave no runtime `splitHighlights` compatibility branch after conversion.
- Keep shared `py-12 md:py-16`, container, typography, color, and radius behavior.
- Numbered cards use `border-current/20` in stacked and split composition so their borders follow the resolved block foreground on every background.
- Do not stage or commit changes.

---

## File structure

- Temporarily create `scripts/migrate-content-highlights-split.ts` to update current Pages and Page versions directly through Payload's Mongo adapter models.
- Temporarily create `tests/int/content-highlights-split-migration.int.spec.ts` to verify the migration transform is exact and idempotent; remove both temporary files after database verification.
- Modify `src/blocks/ContentHighlights/config.ts` for the checkbox and conditional selects.
- Modify `src/blocks/ContentHighlights/Component.tsx` to normalize and forward composition and alignment values.
- Modify `src/components/content-highlights.tsx` for stacked/split composition and layout-aware grid contracts.
- Modify `tests/int/content-highlights.int.spec.tsx` for schema, alignment, split, responsive, action, and regression coverage.
- Regenerate `src/payload-types.ts` after the schema is final.

### Task 1: Convert existing split content

**Files:**

- Temporarily create: `scripts/migrate-content-highlights-split.ts`
- Temporarily create: `tests/int/content-highlights-split-migration.int.spec.ts`
- Delete both temporary files after successful verification.

**Interfaces:**

- Produces temporarily: `migrateContentHighlightBlocks(blocks: unknown): { blocks: unknown; changed: number }`.
- Updates: `payload.db.collections.pages` at `layout`.
- Updates: `payload.db.versions.pages` at `version.layout`.

- [ ] **Step 1: Write the failing pure-transform test**

Create `tests/int/content-highlights-split-migration.int.spec.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { migrateContentHighlightBlocks } from '../../scripts/migrate-content-highlights-split'

describe('Content Highlights split migration', () => {
  it('converts only legacy split blocks and is idempotent', () => {
    const input = [
      { blockType: 'heroBanner', title: 'Hero' },
      {
        blockType: 'contentHighlights',
        id: 'legacy',
        layout: 'splitHighlights',
        title: 'Legacy split',
      },
      {
        blockType: 'contentHighlights',
        id: 'grid',
        layout: 'simpleGrid',
        title: 'Existing grid',
      },
    ]

    const first = migrateContentHighlightBlocks(input)

    expect(first.changed).toBe(1)
    expect(first.blocks).toEqual([
      input[0],
      {
        blockType: 'contentHighlights',
        enableSplitLayout: true,
        id: 'legacy',
        layout: 'highlightsGrid',
        splitContentAlignment: 'top',
        title: 'Legacy split',
      },
      input[2],
    ])

    const second = migrateContentHighlightBlocks(first.blocks)
    expect(second.changed).toBe(0)
    expect(second.blocks).toEqual(first.blocks)
  })

  it('leaves non-array values unchanged', () => {
    expect(migrateContentHighlightBlocks(null)).toEqual({ blocks: null, changed: 0 })
  })
})
```

- [ ] **Step 2: Run the migration test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights-split-migration.int.spec.ts
```

Expected: FAIL because the temporary migration module does not exist.

- [ ] **Step 3: Create the temporary idempotent migration utility**

Create `scripts/migrate-content-highlights-split.ts`:

```ts
import 'dotenv/config'

import { pathToFileURL } from 'node:url'

import config from '@payload-config'
import { getPayload } from 'payload'

type BlockValue = Record<string, unknown>
type DocumentValue = Record<string, unknown> & { _id: unknown }
type MongoModel = {
  find: (filter: Record<string, unknown>) => {
    lean: () => Promise<DocumentValue[]>
  }
  updateOne: (
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ) => Promise<unknown>
}

export function migrateContentHighlightBlocks(blocks: unknown): {
  blocks: unknown
  changed: number
} {
  if (!Array.isArray(blocks)) {
    return { blocks, changed: 0 }
  }

  let changed = 0
  const migrated = blocks.map((value) => {
    if (
      value &&
      typeof value === 'object' &&
      (value as BlockValue).blockType === 'contentHighlights' &&
      (value as BlockValue).layout === 'splitHighlights'
    ) {
      changed += 1
      return {
        ...(value as BlockValue),
        enableSplitLayout: true,
        layout: 'highlightsGrid',
        splitContentAlignment: 'top',
      }
    }

    return value
  })

  return { blocks: migrated, changed }
}

function getPath(document: DocumentValue, path: 'layout' | 'version.layout') {
  return path === 'layout'
    ? document.layout
    : (document.version as Record<string, unknown> | undefined)?.layout
}

async function migrateModel({
  dryRun,
  model,
  path,
}: {
  dryRun: boolean
  model: MongoModel
  path: 'layout' | 'version.layout'
}) {
  const documents = await model
    .find({
      [`${path}.blockType`]: 'contentHighlights',
      [`${path}.layout`]: 'splitHighlights',
    })
    .lean()
  let blocksChanged = 0
  let documentsChanged = 0

  for (const document of documents) {
    const result = migrateContentHighlightBlocks(getPath(document, path))
    if (!result.changed) continue

    blocksChanged += result.changed
    documentsChanged += 1
    if (!dryRun) {
      await model.updateOne({ _id: document._id }, { $set: { [path]: result.blocks } })
    }
  }

  return { blocksChanged, documentsChanged }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')
  const verify = process.argv.includes('--verify')
  const payload = await getPayload({ config })

  try {
    const pages = await migrateModel({
      dryRun: dryRun || verify,
      model: payload.db.collections.pages as unknown as MongoModel,
      path: 'layout',
    })
    const versions = await migrateModel({
      dryRun: dryRun || verify,
      model: payload.db.versions.pages as unknown as MongoModel,
      path: 'version.layout',
    })

    console.log(JSON.stringify({ dryRun, pages, verify, versions }, null, 2))

    if (verify && (pages.blocksChanged || versions.blocksChanged)) {
      throw new Error('Legacy splitHighlights values remain in the database.')
    }
  } finally {
    await payload.destroy()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
}
```

- [ ] **Step 4: Run the pure-transform tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights-split-migration.int.spec.ts
```

Expected: both migration tests pass.

- [ ] **Step 5: Preview, execute, and verify the database conversion**

Run in order:

```bash
pnpm exec tsx scripts/migrate-content-highlights-split.ts --dry-run
pnpm exec tsx scripts/migrate-content-highlights-split.ts
pnpm exec tsx scripts/migrate-content-highlights-split.ts --verify
```

Expected: dry-run reports the legacy documents and blocks, execution reports the same updates, and verification reports zero remaining legacy blocks in both current Pages and Page versions.

- [ ] **Step 6: Remove the temporary migration artifacts**

Delete with `apply_patch`:

```text
scripts/migrate-content-highlights-split.ts
tests/int/content-highlights-split-migration.int.spec.ts
```

Expected: no migration-only code remains after the local database has been verified.

### Task 2: Refactor the Payload layout controls

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/blocks/ContentHighlights/config.ts`

**Interfaces:**

- Produces: `layout` with four item presentations.
- Produces: `enableSplitLayout?: boolean | null`.
- Produces: `contentAlignment?: 'center' | 'left' | 'right' | null`.
- Produces: `splitContentAlignment?: 'bottom' | 'center' | 'top' | null`.

- [ ] **Step 1: Add failing schema assertions**

Extend `TestField` in `tests/int/content-highlights.int.spec.tsx`:

```ts
type TestField = {
  admin?: {
    condition?: (data: unknown, siblingData: Record<string, unknown>) => boolean
  }
  defaultValue?: unknown
  fields?: TestField[]
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ label: string; value: string }>
  required?: boolean
  type?: string
}
```

Replace the layout expectation and add the conditional-field assertions:

```ts
expect(getField(layout?.fields ?? [], 'layout')?.options?.map(({ value }) => value)).toEqual([
  'editorialRow',
  'highlightsGrid',
  'simpleGrid',
  'numberedSteps',
])

const split = getField(layout?.fields ?? [], 'enableSplitLayout')
const horizontal = getField(layout?.fields ?? [], 'contentAlignment')
const vertical = getField(layout?.fields ?? [], 'splitContentAlignment')

expect(split).toMatchObject({ defaultValue: false, type: 'checkbox' })
expect(horizontal).toMatchObject({ defaultValue: 'left', type: 'select' })
expect(horizontal?.options?.map(({ value }) => value)).toEqual(['left', 'center', 'right'])
expect(vertical).toMatchObject({ defaultValue: 'top', type: 'select' })
expect(vertical?.options?.map(({ value }) => value)).toEqual(['top', 'center', 'bottom'])
expect(horizontal?.admin?.condition?.({}, { enableSplitLayout: false })).toBe(true)
expect(horizontal?.admin?.condition?.({}, { enableSplitLayout: true })).toBe(false)
expect(vertical?.admin?.condition?.({}, { enableSplitLayout: false })).toBe(false)
expect(vertical?.admin?.condition?.({}, { enableSplitLayout: true })).toBe(true)
```

- [ ] **Step 2: Run the schema test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because `splitHighlights` still exists and the new controls do not.

- [ ] **Step 3: Add conditional fields and remove the legacy option**

In `src/blocks/ContentHighlights/config.ts`, import `CheckboxField` and define:

```ts
type ContentHighlightsLayoutSiblingData = {
  enableSplitLayout?: boolean | null
}

const isSplitEnabled = (_data: unknown, siblingData: ContentHighlightsLayoutSiblingData) =>
  siblingData?.enableSplitLayout === true

const isSplitDisabled = (_data: unknown, siblingData: ContentHighlightsLayoutSiblingData) =>
  siblingData?.enableSplitLayout !== true
```

Replace the layout options and insert the controls immediately after `layout`:

```ts
options: [
  { label: 'Editorial Row', value: 'editorialRow' },
  { label: 'Highlights Grid', value: 'highlightsGrid' },
  { label: 'Simple Grid', value: 'simpleGrid' },
  { label: 'Numbered Steps', value: 'numberedSteps' },
],
```

```ts
{
  name: 'enableSplitLayout',
  label: 'Enable Split Layout',
  type: 'checkbox',
  defaultValue: false,
} satisfies CheckboxField,
{
  name: 'contentAlignment',
  label: 'Content Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
  admin: { condition: isSplitDisabled },
} satisfies SelectField,
{
  name: 'splitContentAlignment',
  label: 'Content Vertical Alignment',
  type: 'select',
  defaultValue: 'top',
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
  ],
  required: true,
  admin: { condition: isSplitEnabled },
} satisfies SelectField,
```

- [ ] **Step 4: Run the schema test**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: schema assertions pass; renderer assertions may still fail until Task 3.

### Task 3: Implement independent split composition and alignment

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/blocks/ContentHighlights/Component.tsx`
- Modify: `src/components/content-highlights.tsx`

**Interfaces:**

- Consumes: the four-value `ContentHighlightsLayout` union.
- Produces: `ContentHighlightsAlignment = 'center' | 'left' | 'right'`.
- Produces: `ContentHighlightsSplitAlignment = 'bottom' | 'center' | 'top'`.
- Produces: independent `enableSplitLayout`, `contentAlignment`, and `splitContentAlignment` props.

- [ ] **Step 1: Add failing composition and alignment tests**

Add a table-driven test for all four layouts:

```tsx
it.each([
  'editorialRow',
  'highlightsGrid',
  'simpleGrid',
  'numberedSteps',
] satisfies ContentHighlightsLayout[])('supports stacked and split composition for %s', (layout) => {
  const items = [
    { description: 'First description', title: 'First' },
    { description: 'Second description', title: 'Second' },
  ]
  const stacked = renderToStaticMarkup(
    <ContentHighlights
      actions={<span>Explore</span>}
      contentAlignment="right"
      items={items}
      layout={layout}
      title="Highlights"
    />,
  )
  const split = renderToStaticMarkup(
    <ContentHighlights
      actions={<span>Explore</span>}
      enableSplitLayout
      items={items}
      layout={layout}
      splitContentAlignment="bottom"
      title="Highlights"
    />,
  )

  expect(stacked).toContain('data-content-highlights-split="false"')
  expect(stacked).toContain('data-content-highlights-alignment="right"')
  expect(stacked).toContain('ml-auto items-end text-right')
  expect(split).toContain('data-content-highlights-split="true"')
  expect(split).toContain('data-content-highlights-split-alignment="bottom"')
  expect(split).toContain('lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]')
  expect(split).toContain('lg:self-end')
  expect(split).not.toContain('lg:grid-cols-3')
  expect(split).not.toContain('lg:grid-cols-4')
})
```

Add focused Editorial Row assertions:

```tsx
it('keeps the Editorial Row action slot only in stacked composition', () => {
  const props = {
    actions: <span>All stories</span>,
    items: [{ title: 'Story' }],
    layout: 'editorialRow' as const,
    title: 'Latest',
  }
  const stacked = renderToStaticMarkup(<ContentHighlights {...props} />)
  const split = renderToStaticMarkup(<ContentHighlights {...props} enableSplitLayout />)

  expect(stacked).toContain('data-content-highlights-action-slot="true"')
  expect(split).not.toContain('data-content-highlights-action-slot="true"')
  expect(split).toContain('All stories')
})
```

Add a defensive fallback assertion:

```tsx
it('falls back to Highlights Grid for an unknown layout value', () => {
  const html = renderToStaticMarkup(
    <ContentHighlights
      items={[{ title: 'Item' }]}
      layout={'removed-layout' as ContentHighlightsLayout}
      title="Highlights"
    />,
  )

  expect(html).toContain('data-content-highlights-layout="highlightsGrid"')
  expect(html).toContain('lg:grid-cols-3')
})
```

- [ ] **Step 2: Run the renderer tests and verify they fail**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because composition and alignment props are not implemented.

- [ ] **Step 3: Extend component types and grid maps**

In `src/components/content-highlights.tsx`, replace the layout union and add alignment types:

```ts
export type ContentHighlightsAlignment = 'center' | 'left' | 'right'
export type ContentHighlightsLayout =
  | 'editorialRow'
  | 'highlightsGrid'
  | 'numberedSteps'
  | 'simpleGrid'
export type ContentHighlightsSplitAlignment = 'bottom' | 'center' | 'top'
```

Extend `ContentHighlightsProps`:

```ts
contentAlignment?: ContentHighlightsAlignment
enableSplitLayout?: boolean
splitContentAlignment?: ContentHighlightsSplitAlignment
```

Replace the single grid map with:

```ts
const fullWidthItemGridClasses = {
  editorialRow: 'grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
  highlightsGrid: 'grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
  numberedSteps: 'grid gap-4 md:grid-cols-2 lg:grid-cols-4',
  simpleGrid: 'grid gap-x-16 gap-y-10 md:grid-cols-2',
} as const satisfies Record<ContentHighlightsLayout, string>

const splitItemGridClasses = {
  editorialRow: 'grid gap-x-8 gap-y-8 md:grid-cols-2',
  highlightsGrid: 'grid gap-x-8 gap-y-8 md:grid-cols-2',
  numberedSteps: 'grid gap-4 md:grid-cols-2',
  simpleGrid: 'grid gap-x-8 gap-y-10 md:grid-cols-2',
} as const satisfies Record<ContentHighlightsLayout, string>

const horizontalAlignmentClasses = {
  center: 'mx-auto items-center text-center',
  left: 'items-start text-left',
  right: 'ml-auto items-end text-right',
} as const satisfies Record<ContentHighlightsAlignment, string>

const splitAlignmentClasses = {
  bottom: 'lg:self-end',
  center: 'lg:self-center',
  top: 'lg:self-start',
} as const satisfies Record<ContentHighlightsSplitAlignment, string>

const contentHighlightsLayouts = new Set<ContentHighlightsLayout>([
  'editorialRow',
  'highlightsGrid',
  'numberedSteps',
  'simpleGrid',
])

function resolveContentHighlightsLayout(layout?: ContentHighlightsLayout | null) {
  return layout && contentHighlightsLayouts.has(layout) ? layout : 'highlightsGrid'
}
```

- [ ] **Step 4: Make introduction and item-grid rendering composition-aware**

Add `className?: string` to `ContentHighlightsIntro` and merge it into its root:

```tsx
<div className={cn('flex max-w-3xl flex-col gap-4', className)}>
```

Add `split: boolean` to `ContentHighlightsItems` and select its classes:

```tsx
<div
  className={(split ? splitItemGridClasses : fullWidthItemGridClasses)[layout]}
  data-content-highlights-items="true"
>
```

Resolve props at the start of `ContentHighlights`:

```ts
const resolvedAlignment = contentAlignment ?? 'left'
const resolvedLayout = resolveContentHighlightsLayout(layout)
const resolvedSize = size ?? 'default'
const resolvedSplitAlignment = splitContentAlignment ?? 'top'
const isSplit = enableSplitLayout === true
```

Add the data attributes to the section:

```tsx
data-content-highlights-alignment={resolvedAlignment}
data-content-highlights-split={String(isSplit)}
data-content-highlights-split-alignment={resolvedSplitAlignment}
```

Replace the legacy `resolvedLayout === 'splitHighlights'` branch with:

```tsx
{isSplit ? (
  <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
    <ContentHighlightsIntro
      actions={actions}
      className={splitAlignmentClasses[resolvedSplitAlignment]}
      description={description}
      eyebrow={eyebrow}
      title={title}
    />
    <ContentHighlightsItems items={items} layout={resolvedLayout} split />
  </div>
) : (
  <div className={cn('flex flex-col', sectionGapClasses[resolvedSize])}>
    {resolvedLayout === 'editorialRow' ? (
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <ContentHighlightsIntro
          className={horizontalAlignmentClasses[resolvedAlignment]}
          description={description}
          eyebrow={eyebrow}
          title={title}
        />
        {actions ? (
          <div className="lg:shrink-0 lg:pb-1" data-content-highlights-action-slot="true">
            {actions}
          </div>
        ) : null}
      </div>
    ) : (
      <ContentHighlightsIntro
        actions={actions}
        className={horizontalAlignmentClasses[resolvedAlignment]}
        description={description}
        eyebrow={eyebrow}
        title={title}
      />
    )}
    <ContentHighlightsItems items={items} layout={resolvedLayout} split={false} />
  </div>
)}
```

- [ ] **Step 5: Forward the new CMS values and align actions**

In `src/blocks/ContentHighlights/Component.tsx`, import the two alignment types, add the three fields to `ContentHighlightsBlockLike`, destructure their defaults, and resolve:

```ts
const isSplit = enableSplitLayout === true
const resolvedAlignment = contentAlignment ?? 'left'
```

Build the action node with the resolved split and alignment values:

```tsx
const resolvedActionNode = resolvedActions.length ? (
  <ContentActions
    actions={resolvedActions}
    alignment={isSplit ? 'left' : resolvedAlignment}
    className={
      resolvedLayout === 'editorialRow' && !isSplit
        ? 'lg:w-auto lg:shrink-0 lg:items-end lg:justify-end'
        : undefined
    }
    data-content-highlights-actions="true"
    mode={actionMode ?? 'link'}
  />
) : null
```

```tsx
<ContentHighlights
  actions={resolvedActionNode}
  appearance={appearance}
  contentAlignment={resolvedAlignment}
  description={description?.trim() || undefined}
  enableSplitLayout={isSplit}
  eyebrow={eyebrow?.trim() || undefined}
  items={resolvedItems}
  layout={resolvedLayout}
  size={size ?? 'default'}
  splitContentAlignment={splitContentAlignment ?? 'top'}
  title={resolvedTitle}
/>
```

- [ ] **Step 6: Run focused renderer tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: all Content Highlights schema and renderer tests pass.

### Task 4: Regenerate types and verify production readiness

**Files:**

- Regenerate: `src/payload-types.ts`
- Modify only if formatting requires it: `src/blocks/ContentHighlights/config.ts`
- Modify only if formatting requires it: `src/blocks/ContentHighlights/Component.tsx`
- Modify only if formatting requires it: `src/components/content-highlights.tsx`
- Modify only if formatting requires it: `tests/int/content-highlights.int.spec.tsx`

**Interfaces:**

- Produces generated Payload types without `splitHighlights` and with the three new controls.
- Produces a verified build-ready Content Highlights implementation.

- [ ] **Step 1: Regenerate Payload types**

Run:

```bash
pnpm generate:types
```

Expected: `ContentHighlightsBlock.layout` contains only the four approved values and includes `enableSplitLayout`, `contentAlignment`, and `splitContentAlignment`.

- [ ] **Step 2: Format and lint changed files**

Run:

```bash
pnpm exec prettier --write src/blocks/ContentHighlights/config.ts src/blocks/ContentHighlights/Component.tsx src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx src/payload-types.ts
pnpm exec eslint src/blocks/ContentHighlights/config.ts src/blocks/ContentHighlights/Component.tsx src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx
```

Expected: Prettier completes and ESLint exits with no errors.

- [ ] **Step 3: Run focused integration and spacing tests**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/regular-block-spacing.int.spec.tsx
```

Expected: all selected tests pass.

- [ ] **Step 4: Run TypeScript and production build checks**

Run:

```bash
pnpm exec tsc --noEmit
pnpm build
```

Expected: both commands exit successfully. The build may require access to the configured local MongoDB because sitemap generation reads Payload content.

- [ ] **Step 5: Confirm legacy code and values are absent**

Run:

```bash
rg -n "splitHighlights" src tests scripts
```

Expected: no matches.

- [ ] **Step 6: Validate the final unstaged diff**

Run:

```bash
git diff --check
git status --short
```

Expected: no whitespace errors. Preserve any pre-existing staged changes and leave all new modifications unstaged.

### Task 5: Make numbered-card borders adaptive

**Files:**

- Modify: `tests/int/content-highlights.int.spec.tsx`
- Modify: `src/components/content-highlights.tsx`

**Interfaces:**

- Consumes: the existing numbered item presentation and block appearance foreground classes.
- Produces: numbered cards with `border-current/20` in stacked and split composition.

- [ ] **Step 1: Add a failing colored-background border regression test**

Replace the existing numbered border assertion with `border-current/20`, then render a split numbered block on a colored surface:

```tsx
expect(numberedHtml).toContain('rounded-md border border-current/20')
expect(numberedHtml).not.toContain('rounded-md border border-border')

const splitNumberedHtml = renderToStaticMarkup(
  <ContentHighlights
    appearance={{ background: 'secondary' }}
    enableSplitLayout
    items={items}
    layout="numberedSteps"
    title="How your application moves"
  />,
)

expect(splitNumberedHtml).toContain('bg-secondary')
expect(splitNumberedHtml).toContain('text-secondary-foreground')
expect(splitNumberedHtml).toContain('rounded-md border border-current/20')
expect(splitNumberedHtml).not.toContain('rounded-md border border-border')
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx
```

Expected: FAIL because numbered cards still render `border-border`.

- [ ] **Step 3: Use the resolved foreground for numbered-card borders**

In `ContentHighlightItemComponent` within `src/components/content-highlights.tsx`, change only the numbered article class:

```tsx
className="flex min-w-0 flex-col gap-4 rounded-md border border-current/20 p-6"
```

- [ ] **Step 4: Run focused tests, lint, and type checking**

Run:

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/content-highlights.int.spec.tsx tests/int/regular-block-spacing.int.spec.tsx
pnpm exec eslint src/components/content-highlights.tsx tests/int/content-highlights.int.spec.tsx
pnpm exec tsc --noEmit
```

Expected: all selected tests pass; ESLint and TypeScript exit successfully.

- [ ] **Step 5: Run the production build and validate the unstaged diff**

Run:

```bash
pnpm build
git diff --check
git status --short
```

Expected: the production build passes, no whitespace errors are reported, and all new modifications remain unstaged.
