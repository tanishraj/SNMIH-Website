# Download List Presentation Variants Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign Download List as an intuitive five-variant document library with responsive one-to-eight-column grids and explicit View and Download actions.

**Architecture:** Keep Payload schema and server-side Media resolution in the existing block config and server component. Introduce shared serializable types plus a focused client presentation module; the client wrapper owns category state and dispatches Card Grid, Open Grid, Framed Grid, Inline List, or Table without querying Payload. Existing `list`, `cards`, and `compact` values remain valid and map to the redesigned Inline List, Card Grid, and Table presentations.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4, Lucide React, Vitest, Testing Library

## Global Constraints

- Do not create a second document block or a PDF viewer.
- Do not add client-side Payload queries, server-side search, or pagination.
- Preserve existing `list`, `cards`, and `compact` saved values without a migration.
- Open Grid has no outer border; Framed Grid has exactly one outer border.
- Only Card Grid uses independent item card backgrounds.
- Grid variants support configured values `1` through `8`, capped responsively at one phone, two tablet, four laptop, and the configured maximum at `2xl`.
- View and Download are separate visible controls; document containers are never complete anchors.
- Download is rendered only for uploaded Media; external URLs alone never claim reliable download behavior.
- All colors, borders, focus states, and hover states use the existing semantic token system.
- Do not stage or commit any implementation or plan changes. Leave all work uncommitted for user review.

---

### Task 1: Define The Payload Authoring Contract

**Files:**
- Create: `tests/int/download-list.int.spec.tsx`
- Modify: `src/blocks/DownloadList/config.ts`
- Generate: `src/payload-types.ts`

**Interfaces:**
- Consumes: `createCardTabs`, `createBlockAppearanceFields`, Payload `SelectField`, `CheckboxField`, and field conditions.
- Produces: `displayMode?: 'list' | 'cards' | 'compact' | 'openGrid' | 'framedGrid'`, `columns?: '1' | ... | '8'`, and five document-action fields on `DownloadListBlock`.

- [ ] **Step 1: Create schema-focused failing tests**

Create `tests/int/download-list.int.spec.tsx` with a recursive `findNamedField` helper and these assertions:

```tsx
import type { Field, SelectField } from 'payload'
import { describe, expect, it } from 'vitest'

import { DownloadListBlock } from '@/blocks/DownloadList/config'

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const match = findNamedField(tab.fields, name)
        if (match) return match
      }
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      const match = findNamedField(field.fields, name)
      if (match) return match
    }
  }
}

describe('DownloadListBlock schema', () => {
  it('offers five compatible presentation variants', () => {
    expect(findNamedField(DownloadListBlock.fields, 'displayMode')).toMatchObject({
      type: 'select',
      defaultValue: 'list',
      options: [
        { label: 'Inline List', value: 'list' },
        { label: 'Card Grid', value: 'cards' },
        { label: 'Open Grid', value: 'openGrid' },
        { label: 'Framed Grid', value: 'framedGrid' },
        { label: 'Table', value: 'compact' },
      ],
    })
  })

  it('offers one-to-eight columns only for grid variants', () => {
    const columns = findNamedField(DownloadListBlock.fields, 'columns') as SelectField
    expect(columns).toMatchObject({
      type: 'select',
      defaultValue: '3',
      required: true,
      options: Array.from({ length: 8 }, (_, index) => ({
        label: `${index + 1} column${index === 0 ? '' : 's'}`,
        value: String(index + 1),
      })),
    })
    expect(columns.admin?.condition?.({}, { displayMode: 'openGrid' })).toBe(true)
    expect(columns.admin?.condition?.({}, { displayMode: 'framedGrid' })).toBe(true)
    expect(columns.admin?.condition?.({}, { displayMode: 'cards' })).toBe(true)
    expect(columns.admin?.condition?.({}, { displayMode: 'list' })).toBe(false)
    expect(columns.admin?.condition?.({}, { displayMode: 'compact' })).toBe(false)
  })

  it('defines explicit view and download action controls', () => {
    expect(findNamedField(DownloadListBlock.fields, 'showViewAction')).toMatchObject({
      type: 'checkbox',
      defaultValue: true,
    })
    expect(findNamedField(DownloadListBlock.fields, 'viewActionLabel')).toMatchObject({
      type: 'text',
      defaultValue: 'View Document',
    })
    expect(findNamedField(DownloadListBlock.fields, 'openViewInNewTab')).toMatchObject({
      type: 'checkbox',
      defaultValue: true,
    })
    expect(findNamedField(DownloadListBlock.fields, 'showDownloadAction')).toMatchObject({
      type: 'checkbox',
      defaultValue: true,
    })
    expect(findNamedField(DownloadListBlock.fields, 'downloadActionLabel')).toMatchObject({
      type: 'text',
      defaultValue: 'Download',
    })
  })

  it('requires document titles and clarifies destination fields', () => {
    expect(findNamedField(DownloadListBlock.fields, 'title')).toMatchObject({
      label: 'Document Title',
      type: 'text',
      required: true,
    })
    expect(findNamedField(DownloadListBlock.fields, 'description')).toMatchObject({
      label: 'Metadata / Supporting Text',
      type: 'text',
    })
    expect(findNamedField(DownloadListBlock.fields, 'externalUrl')).toMatchObject({
      label: 'View URL',
      type: 'text',
    })
  })
})
```

- [ ] **Step 2: Run the schema tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx
```

Expected: failures for missing Open/Framed modes, columns, action fields, and required title.

- [ ] **Step 3: Add schema helpers and fields**

In `config.ts`, define:

```ts
type DownloadListSiblingData = {
  displayMode?: 'cards' | 'compact' | 'framedGrid' | 'list' | 'openGrid' | null
  showDownloadAction?: boolean | null
  showViewAction?: boolean | null
}

const isGridMode = (_data: unknown, siblingData: DownloadListSiblingData) =>
  siblingData?.displayMode === 'cards' ||
  siblingData?.displayMode === 'openGrid' ||
  siblingData?.displayMode === 'framedGrid'

const showsViewAction = (_data: unknown, siblingData: DownloadListSiblingData) =>
  siblingData?.showViewAction !== false

const showsDownloadAction = (_data: unknown, siblingData: DownloadListSiblingData) =>
  siblingData?.showDownloadAction !== false

const validateActionAvailability = (
  _value: unknown,
  { siblingData }: { siblingData?: DownloadListSiblingData },
) =>
  siblingData?.showViewAction === false && siblingData?.showDownloadAction === false
    ? 'Enable at least one document action.'
    : true
```

Update the existing document fields without renaming stored keys:

```ts
{ name: 'title', label: 'Document Title', type: 'text', required: true }
{
  name: 'description',
  label: 'Metadata / Supporting Text',
  type: 'text',
  admin: { description: 'Short authority, programme, year, or explanatory detail.' },
}
{
  name: 'externalUrl',
  label: 'View URL',
  type: 'text',
  admin: {
    description:
      'Optional viewer or external destination. When a file is also uploaded, View uses this URL and Download uses the file.',
  },
}
```

Replace the display options and add the conditional columns field:

```ts
{
  name: 'displayMode',
  label: 'Display Mode',
  type: 'select',
  defaultValue: 'list',
  options: [
    { label: 'Inline List', value: 'list' },
    { label: 'Card Grid', value: 'cards' },
    { label: 'Open Grid', value: 'openGrid' },
    { label: 'Framed Grid', value: 'framedGrid' },
    { label: 'Table', value: 'compact' },
  ],
} satisfies SelectField,
{
  name: 'columns',
  label: 'Grid Columns',
  type: 'select',
  defaultValue: '3',
  required: true,
  options: Array.from({ length: 8 }, (_, index) => ({
    label: `${index + 1} column${index === 0 ? '' : 's'}`,
    value: String(index + 1),
  })),
  admin: { condition: isGridMode },
} satisfies SelectField,
```

Add the action controls in the Content tab before `downloadsField`:

```ts
{
  type: 'collapsible',
  label: 'Document Actions',
  admin: { initCollapsed: true },
  fields: [
    {
      name: 'showViewAction',
      label: 'Show View Action',
      type: 'checkbox',
      defaultValue: true,
      validate: validateActionAvailability,
    },
    {
      name: 'viewActionLabel',
      label: 'View Label',
      type: 'text',
      defaultValue: 'View Document',
      admin: { condition: showsViewAction },
    },
    {
      name: 'openViewInNewTab',
      label: 'Open View in New Tab',
      type: 'checkbox',
      defaultValue: true,
      admin: { condition: showsViewAction },
    },
    {
      name: 'showDownloadAction',
      label: 'Show Download Action',
      type: 'checkbox',
      defaultValue: true,
      validate: validateActionAvailability,
    },
    {
      name: 'downloadActionLabel',
      label: 'Download Label',
      type: 'text',
      defaultValue: 'Download',
      admin: { condition: showsDownloadAction },
    },
  ],
},
```

Update the card-background Admin description to say it applies only to Card Grid.

- [ ] **Step 4: Run schema tests and generate Payload types**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts
pnpm generate:types
pnpm exec prettier --write src/payload-types.ts
```

Expected: tests pass; `DownloadListBlock` contains the new unions and fields without unrelated type churn.

- [ ] **Step 5: Inspect the checkpoint without staging or committing**

Run:

```bash
git diff --check
git diff -- src/blocks/DownloadList/config.ts src/payload-types.ts tests/int/download-list.int.spec.tsx
```

Expected: only the planned schema, generated type, and test changes appear. Do not run `git add` or `git commit`.

---

### Task 2: Resolve Independent View And Download Destinations

**Files:**
- Create: `src/blocks/DownloadList/types.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**
- Produces `DownloadDisplayMode`, `DownloadGridColumns`, `ResolvedDownload`, and `DownloadActionSettings` for all renderer modules.
- `ResolvedDownload` contains independent optional `viewHref` and `downloadHref`; it never exposes the old ambiguous `href` or `isExternal` fields.

- [ ] **Step 1: Add failing server-resolution tests**

Append tests that render `DownloadListBlockComponent` and assert:

```tsx
const media = {
  id: 'policy',
  url: '/api/media/file/policy.pdf',
  mimeType: 'application/pdf',
} as Media

it('resolves file-only documents to view and download actions', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent downloads={[{ file: media, title: 'Policy' }]} />,
  )
  expect(html).toContain('href="/api/media/file/policy.pdf"')
  expect(html).toContain('data-document-view="true"')
  expect(html).toContain('data-document-download="true"')
  expect(html).toContain('download=""')
})

it('uses an external URL for View and the uploaded file for Download', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      downloads={[
        {
          externalUrl: 'https://viewer.example/policy',
          file: media,
          title: 'Policy',
        },
      ]}
    />,
  )
  expect(html).toContain('data-document-view="true" href="https://viewer.example/policy"')
  expect(html).toContain('data-document-download="true" href="/api/media/file/policy.pdf"')
})

it('omits Download for external-only documents and omits unresolved rows', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      downloads={[
        { externalUrl: 'https://example.com/policy', title: 'External Policy' },
        { title: 'Missing destination' },
      ]}
    />,
  )
  expect(html).toContain('External Policy')
  expect(html).not.toContain('Missing destination')
  expect(html).not.toContain('data-document-download="true"')
})
```

- [ ] **Step 2: Create shared serializable types**

Create `types.ts`:

```ts
export type DownloadDisplayMode = 'cards' | 'compact' | 'framedGrid' | 'list' | 'openGrid'
export type DownloadGridColumns = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8'

export type DownloadActionSettings = {
  downloadLabel: string
  openViewInNewTab: boolean
  showDownload: boolean
  showView: boolean
  viewLabel: string
}

export type ResolvedDownload = {
  cardBackground?: string
  category?: string
  description?: string
  downloadHref?: string
  fileType?: string
  id: string | number
  title: string
  viewHref?: string
}
```

- [ ] **Step 3: Update the server component contract**

Add the new block props:

```ts
columns?: DownloadGridColumns | null
downloadActionLabel?: string | null
openViewInNewTab?: boolean | null
showDownloadAction?: boolean | null
showViewAction?: boolean | null
viewActionLabel?: string | null
```

Resolve every item with:

```ts
const fileHref = isMediaDoc(item.file) ? getMediaAbsoluteUrl(item.file) : undefined
const externalViewHref = item.externalUrl?.trim() || undefined
const viewHref = externalViewHref ?? fileHref
const downloadHref = fileHref

if (!viewHref && !downloadHref) return []

return [{
  id: item.id ?? index,
  title: item.title!.trim(),
  description: item.description?.trim() || undefined,
  category: item.category?.trim() || undefined,
  cardBackground: item.cardBackground ?? undefined,
  viewHref,
  downloadHref,
  fileType: detectFileType(item),
}]
```

Pass normalized settings to the client:

```tsx
<DownloadListClient
  actions={{
    downloadLabel: downloadActionLabel?.trim() || 'Download',
    openViewInNewTab: openViewInNewTab ?? true,
    showDownload: showDownloadAction ?? true,
    showView: showViewAction ?? true,
    viewLabel: viewActionLabel?.trim() || 'View Document',
  }}
  columns={columns ?? '3'}
  downloads={resolvedDownloads}
  displayMode={displayMode}
  sectionBackground={appearanceClasses.background}
  showFilter={showFilter}
/>
```

Import `ResolvedDownload` and related types from `types.ts`; remove the duplicate old type from `DownloadListClient.tsx`.

- [ ] **Step 4: Run the focused test and verify the data contract**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/types.ts tests/int/download-list.int.spec.tsx
```

Expected: destination tests pass; old card theme assertions remain valid or fail only where Task 3 has not yet replaced old anchors.

- [ ] **Step 5: Inspect the checkpoint without staging or committing**

Run `git diff --check` and inspect the four task files. Do not stage or commit.

---

### Task 3: Build Card, Open, And Framed Grid Presentations

**Files:**
- Create: `src/blocks/DownloadList/Presentation.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Test: `tests/int/download-list.int.spec.tsx`
- Test: `tests/int/card-block-renderers.int.spec.tsx`

**Interfaces:**
- `DownloadListPresentation(props)` consumes filtered `ResolvedDownload[]`, normalized action settings, `columns`, `displayMode`, and the section background.
- `DocumentActions` renders View and Download anchors without wrapping the document container.

- [ ] **Step 1: Add failing grid-structure tests**

Add tests for these stable evidence attributes:

```tsx
it.each([
  ['cards', 'card'],
  ['openGrid', 'openGrid'],
  ['framedGrid', 'framedGrid'],
] as const)('renders the %s presentation', (displayMode, evidence) => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      columns="8"
      displayMode={displayMode}
      downloads={[{ externalUrl: '/policy', title: 'Policy' }]}
    />,
  )
  expect(html).toContain(`data-download-presentation="${evidence}"`)
  expect(html).toContain('2xl:grid-cols-8')
})

it('keeps Open Grid borderless and Framed Grid singly framed', () => {
  const open = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode="openGrid"
      downloads={[{ externalUrl: '/a', title: 'A' }, { externalUrl: '/b', title: 'B' }]}
    />,
  )
  const framed = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode="framedGrid"
      downloads={[{ externalUrl: '/a', title: 'A' }, { externalUrl: '/b', title: 'B' }]}
    />,
  )
  expect(open).toContain('data-download-grid-frame="open"')
  expect(open).not.toContain('data-download-grid-outer-border="true"')
  expect(framed).toContain('data-download-grid-frame="framed"')
  expect(framed.match(/data-download-grid-outer-border="true"/g)).toHaveLength(1)
})
```

- [ ] **Step 2: Implement static responsive column maps**

In `Presentation.tsx`, define all values explicitly:

```ts
const gridColumnClasses: Record<DownloadGridColumns, string> = {
  '1': 'grid-cols-1',
  '2': 'grid-cols-1 sm:grid-cols-2',
  '3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '5': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5',
  '6': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6',
  '7': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7',
  '8': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-8',
}
```

Export a `normalizeGridColumns` helper that returns `'3'` for unknown values.

- [ ] **Step 3: Implement shared visible document actions**

`DocumentActions` must render:

```tsx
export function DocumentActions({ actions, document, className }: DocumentActionsProps) {
  const canView = actions.showView && Boolean(document.viewHref)
  const canDownload = actions.showDownload && Boolean(document.downloadHref)
  if (!canView && !canDownload) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-2', className)}>
      {canView ? (
        <ContentLink
          data-document-view="true"
          href={document.viewHref!}
          label={actions.viewLabel}
          openInNewTab={actions.openViewInNewTab}
        />
      ) : null}
      {canDownload ? (
        <a
          className={cn(buttonVariants({ variant: 'link' }), 'h-auto gap-2 px-0 py-0 text-sm font-semibold')}
          data-document-download="true"
          download
          href={document.downloadHref!}
        >
          <Download aria-hidden="true" className="size-4" />
          <span className="underline decoration-2 underline-offset-4">{actions.downloadLabel}</span>
        </a>
      ) : null}
    </div>
  )
}
```

Use the existing `ContentLink`, `buttonVariants`, semantic surface resolver, and decorative Lucide icons.

- [ ] **Step 4: Implement the three grid renderers**

Use one `GridDocumentItem` with a `surface` prop. Card Grid resolves each item surface and applies
individual border/radius/gap styling. Open and Framed grids pass the inherited default surface and
render gapless items with `border-b border-r border-current/15` inside an `overflow-hidden` wrapper.

Evidence and wrapper contract:

```tsx
<div
  className={cn(
    displayMode === 'cards' ? 'grid gap-4' : 'overflow-hidden',
    displayMode === 'framedGrid' && 'rounded-[var(--radius)] border border-current/15',
  )}
  data-download-grid-frame={displayMode === 'framedGrid' ? 'framed' : 'open'}
  data-download-grid-outer-border={displayMode === 'framedGrid' ? 'true' : undefined}
  data-download-presentation={displayMode === 'cards' ? 'card' : displayMode}
>
  <div className={cn(displayMode === 'cards' ? 'contents' : '-mb-px -mr-px grid', gridColumnClasses[columns])}>
    {downloads.map(/* GridDocumentItem */)}
  </div>
</div>
```

For Card Grid, avoid `contents` if it interferes with the intended grid; render the mapped items
directly inside the grid wrapper. All three item containers are `article` elements and actions remain
inside the article without wrapping it.

- [ ] **Step 5: Dispatch grid modes from the client wrapper**

Normalize unknown modes to `list`, retain category filtering, and pass filtered documents into
`DownloadListPresentation`. Add `aria-pressed={activeCategory === category}` to filter buttons.

- [ ] **Step 6: Run grid and card-theme verification**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts
pnpm exec eslint src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/DownloadListClient.tsx tests/int/download-list.int.spec.tsx
git diff --check
```

Expected: all grid structures pass; only Card Grid emits `data-card-background`; no whole-card anchor remains. Do not stage or commit.

---

### Task 4: Build Inline List, Semantic Table, And Interactive Filtering

**Files:**
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**
- Inline List consumes the same shared document and action types as grid modes.
- Table produces one native desktop table and one mobile labelled-row representation; responsive CSS ensures only one is exposed visually at each breakpoint.

- [ ] **Step 1: Add failing Inline List and Table tests**

```tsx
it('uses legacy list as the redesigned Inline List and falls back to it', () => {
  const list = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode="list"
      downloads={[{ externalUrl: '/policy', title: 'Policy' }]}
    />,
  )
  const unknown = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode={'unknown' as never}
      downloads={[{ externalUrl: '/policy', title: 'Policy' }]}
    />,
  )
  expect(list).toContain('data-download-presentation="inline"')
  expect(unknown).toContain('data-download-presentation="inline"')
})

it('uses legacy compact as a semantic desktop table with mobile labelled rows', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode="compact"
      downloads={[{ category: 'NMC', externalUrl: '/policy', fileType: 'PDF', title: 'Policy' }]}
    />,
  )
  expect(html).toContain('<table')
  expect(html).toContain('<thead')
  expect(html).toContain('scope="col"')
  expect(html).toContain('data-download-presentation="table"')
  expect(html).toContain('data-download-mobile-table="true"')
  expect(html).toContain('Document')
  expect(html).toContain('Category')
  expect(html).toContain('Type')
  expect(html).toContain('Actions')
})
```

- [ ] **Step 2: Implement Inline List**

Render a divider-based `<ul>` with `<li>` rows. Each row uses a responsive grid such as:

```tsx
className="grid min-w-0 gap-4 border-b border-current/15 py-5 last:border-b-0 md:grid-cols-[auto_minmax(0,1fr)_minmax(8rem,auto)_auto] md:items-center"
```

The first cell is a decorative file icon/type badge, the second is title plus supporting text, the
third is category/type metadata, and the fourth is `DocumentActions`. On compact screens, content
stacks naturally and actions remain visible.

- [ ] **Step 3: Implement semantic desktop Table and mobile rows**

Desktop structure:

```tsx
<div className="hidden overflow-hidden rounded-[var(--radius)] border border-current/15 md:block">
  <table className="w-full border-collapse text-left" data-download-presentation="table">
    <thead>{/* four scoped column headers */}</thead>
    <tbody>{/* one row per resolved document */}</tbody>
  </table>
</div>
```

Use `border-b border-current/15 last:border-b-0`, semantic supporting text, an em dash for missing
Category/Type, and right-aligned intrinsic-width actions. The mobile equivalent is:

```tsx
<div className="divide-y divide-current/15 md:hidden" data-download-mobile-table="true">
  {/* each item shows visible Category and Type labels plus DocumentActions */}
</div>
```

- [ ] **Step 4: Add filter interaction coverage**

Using Testing Library, render `DownloadListClient` with two categories, click the second filter, and
assert its `aria-pressed` becomes true while the first category document disappears. Use exact
documents and normalized actions in the test; do not query implementation classes.

- [ ] **Step 5: Run focused behavior, accessibility, and type checks**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/section-eyebrow.int.spec.tsx
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/types.ts tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
git diff --check
```

Expected: all five modes, filter state, destination behavior, semantics, lint, and types pass. Do not stage or commit.

---

### Task 5: Update Catalogs, Thumbnail, Generated Context, And Final Verification

**Files:**
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `public/block-thumbnails/download-list.jpg`
- Modify: `docs/guides/blocks.md`
- Potentially modify: `.agents/skills/project-context/references/block-system.md`
- Generate: `.agents/skills/project-context/references/project-inventory.json`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**
- Consumes: completed five-variant block and generated Payload types.
- Produces: accurate Admin preview, operator documentation, project inventory, and a fully verified uncommitted diff.

- [ ] **Step 1: Update maintained operator documentation**

Change the Download List catalog entry to:

```markdown
| Download List | Files and document libraries | Card Grid, Open Grid, Framed Grid, Inline List, or responsive Table; grid modes support 1–8 columns, explicit View/Download actions, and optional category filtering |
```

Add a short operator paragraph explaining that only Card Grid applies independent semantic item
backgrounds, Open Grid has no outer frame, Framed Grid has one shared frame, and Download appears
only when an uploaded file exists.

- [ ] **Step 2: Update thumbnail fixture and catalog assertions**

Change `downloadList` fixture to `displayMode="framedGrid"`, `columns="2"`, official-document copy,
and at least four documents. Use uploaded fake PDF Media for at least one item so the thumbnail shows
both View and Download. Add source assertions for `framedGrid`, `columns="2"`, and the updated guide.

- [ ] **Step 3: Regenerate and inspect the Download List thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=downloadList pnpm generate:block-thumbnails
sips -g pixelWidth -g pixelHeight public/block-thumbnails/download-list.jpg
```

Expected: 1600×900 JPEG; one shared outer frame, two columns, visible actions, no clipping, and no
nested card appearance. If sandbox IPC prevents generation, rerun the same command with the required
approval rather than changing the generator.

- [ ] **Step 4: Run the Impeccable detector and one bounded visual correction pass**

Run:

```bash
node .agents/skills/impeccable/scripts/detect.mjs --json src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/config.ts
```

Expected: no verified detector findings. Inspect the thumbnail once; if it exposes clipping, weak
contrast, or broken action wrapping, correct all observed defects in one batch and regenerate once.

- [ ] **Step 5: Refresh and check project context**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: inventory refresh succeeds and context is current. Update `block-system.md` with the new
Download List behavior because the operator contract changed. A stale knowledge-graph warning does
not fail this task.

- [ ] **Step 6: Run final verification**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/section-eyebrow.int.spec.tsx
pnpm exec eslint src/blocks/DownloadList/Component.tsx src/blocks/DownloadList/DownloadListClient.tsx src/blocks/DownloadList/Presentation.tsx src/blocks/DownloadList/types.ts src/blocks/DownloadList/config.ts src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx
pnpm exec tsc --noEmit
git diff --check
git status --short
```

Expected: all tests and static checks pass. Status shows the approved spec already staged plus the
uncommitted plan and implementation files. Do not stage, unstage, commit, reset, or discard anything.
