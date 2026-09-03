# Download List File Types and Category Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Download List's free-text file-type override with a controlled optional preset select and remove document categories and visitor filtering completely.

**Architecture:** Keep `fileType` as the existing optional persisted property so historical values remain readable, but constrain new Admin authoring to approved select options and expand MIME-based fallback detection. Remove the category field from the schema-to-presentation contract and simplify the client into a stateless presentation adapter.

**Tech Stack:** Payload CMS fields and generated types, React, TypeScript, Lucide React, Vitest, Testing Library, Playwright thumbnail generation, and project-context tooling.

## Global Constraints

- Do not stage, unstage, commit, or alter branch history.
- `fileType` remains optional; an empty value means automatic MIME detection and no synthetic `auto` value is stored.
- New Admin values are limited to PDF, DOC, DOCX, XLS, XLSX, CSV, PPT, PPTX, and ZIP.
- Historical non-preset explicit values remain readable and render in uppercase.
- Remove Category, Show Category Filter, category labels, filter controls, and filtering state without replacement.
- Preserve every display mode, column, icon, badge, destination, and action-display behavior outside this scope.

---

### Task 1: Add controlled file-type authoring and complete MIME detection

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Consumes the existing optional `DownloadItem.fileType?: string | null` property.
- Produces an optional Payload select named `fileType` with exact preset values.
- Produces `detectFileType(item): string | undefined` behavior for explicit overrides and supported MIME types.

- [ ] **Step 1: Add a failing schema test for the exact optional select**

Add this test to `DownloadListBlock schema`:

```tsx
it('offers an optional preset file-type override with automatic fallback', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField
  const fileType = findNamedField(downloads.fields, 'fileType') as SelectField

  expect(fileType).toMatchObject({
    type: 'select',
    label: 'File Type Label',
    options: [
      { label: 'PDF', value: 'PDF' },
      { label: 'DOC', value: 'DOC' },
      { label: 'DOCX', value: 'DOCX' },
      { label: 'XLS', value: 'XLS' },
      { label: 'XLSX', value: 'XLSX' },
      { label: 'CSV', value: 'CSV' },
      { label: 'PPT', value: 'PPT' },
      { label: 'PPTX', value: 'PPTX' },
      { label: 'ZIP', value: 'ZIP' },
    ],
  })
  expect(fileType.required).not.toBe(true)
  expect(fileType.defaultValue).toBeUndefined()
})
```

- [ ] **Step 2: Add failing rendering tests for MIME detection and historical overrides**

Add a table-driven rendering test using `DownloadListBlockComponent`. Create one Media object per MIME
type and assert its expected badge:

```tsx
it.each([
  ['application/pdf', 'PDF'],
  ['application/msword', 'DOC'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'DOCX'],
  ['application/vnd.ms-excel', 'XLS'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'XLSX'],
  ['text/csv', 'CSV'],
  ['application/vnd.ms-powerpoint', 'PPT'],
  ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'PPTX'],
  ['application/zip', 'ZIP'],
  ['image/png', 'PNG'],
] as const)('detects %s as %s', (mimeType, expected) => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode="framedGrid"
      downloads={[
        {
          file: { id: mimeType, mimeType, url: `/files/${expected.toLowerCase()}` } as Media,
          title: expected,
        },
      ]}
    />,
  )

  expect(html).toContain(`data-document-file-type="true">${expected}`)
})

it('keeps historical explicit file-type values readable', () => {
  const html = renderToStaticMarkup(
    <DownloadListBlockComponent
      displayMode="framedGrid"
      downloads={[{ file: sharedMedia, fileType: 'odt', title: 'Historical document' }]}
    />,
  )

  expect(html).toContain('data-document-file-type="true">ODT')
})
```

- [ ] **Step 3: Run the new tests and verify they fail**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "preset file-type|detects|historical explicit"
```

Expected: the schema test reports a text field, and the new Office/ZIP MIME cases expose the current
coarse or missing values.

- [ ] **Step 4: Replace the free-text field with the approved select**

In `downloadsField.fields`, replace the current `fileType` text field with:

```ts
{
  name: 'fileType',
  label: 'File Type Label',
  type: 'select',
  options: [
    { label: 'PDF', value: 'PDF' },
    { label: 'DOC', value: 'DOC' },
    { label: 'DOCX', value: 'DOCX' },
    { label: 'XLS', value: 'XLS' },
    { label: 'XLSX', value: 'XLSX' },
    { label: 'CSV', value: 'CSV' },
    { label: 'PPT', value: 'PPT' },
    { label: 'PPTX', value: 'PPTX' },
    { label: 'ZIP', value: 'ZIP' },
  ],
  admin: {
    description: 'Optional override. Leave empty to detect the type from the uploaded file.',
  },
} satisfies SelectField,
```

Do not set `required` or `defaultValue`.

- [ ] **Step 5: Expand MIME detection without restricting historical overrides**

Keep the existing first branch exactly compatible:

```ts
if (item.fileType?.trim()) return item.fileType.trim().toUpperCase()
```

Replace the MIME checks with exact mappings before generic image handling:

```ts
const mime = item.file.mimeType.toLowerCase()
const knownTypes: Record<string, string> = {
  'application/msword': 'DOC',
  'application/pdf': 'PDF',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/x-zip-compressed': 'ZIP',
  'application/zip': 'ZIP',
  'text/csv': 'CSV',
}

if (knownTypes[mime]) return knownTypes[mime]
if (mime.startsWith('image/')) return mime.split('/')[1]?.toUpperCase()
```

- [ ] **Step 6: Run focused schema and detection tests**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "preset file-type|detects|historical explicit"
```

Expected: every selected test passes.

---

### Task 2: Remove category data and filter behavior end to end

**Files:**

- Modify: `src/blocks/DownloadList/config.ts`
- Modify: `src/blocks/DownloadList/types.ts`
- Modify: `src/blocks/DownloadList/Component.tsx`
- Modify: `src/blocks/DownloadList/DownloadListClient.tsx`
- Modify: `src/blocks/DownloadList/Presentation.tsx`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- Produces `ResolvedDownload` without `category`.
- Produces `DownloadListClient` without a `showFilter` prop or local React state.
- Passes `downloads` directly to `DownloadListPresentation`.

- [ ] **Step 1: Add failing schema and source-contract tests**

Add to `DownloadListBlock schema`:

```tsx
it('removes document categories and category filtering', () => {
  const downloads = findNamedField(DownloadListBlock.fields, 'downloads') as ArrayField

  expect(findNamedField(downloads.fields, 'category')).toBeUndefined()
  expect(findNamedField(DownloadListBlock.fields, 'showFilter')).toBeUndefined()
})
```

Add a source-contract test that reads the client and presentation files:

```tsx
it('contains no category filtering or category presentation markup', () => {
  const client = readFileSync(
    join(process.cwd(), 'src/blocks/DownloadList/DownloadListClient.tsx'),
    'utf8',
  )
  const presentation = readFileSync(
    join(process.cwd(), 'src/blocks/DownloadList/Presentation.tsx'),
    'utf8',
  )

  expect(client).not.toContain('showFilter')
  expect(client).not.toContain('activeCategory')
  expect(client).not.toContain('data-download-filters')
  expect(presentation).not.toContain('document.category')
})
```

Delete the existing interactive category-filter test because that feature is intentionally removed.

- [ ] **Step 2: Run removal tests and verify they fail**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx -t "removes document categories|contains no category"
```

Expected: the schema still exposes both fields and source still contains filter/category logic.

- [ ] **Step 3: Remove category and filter fields from Payload config**

Delete the complete `category` text field from `downloadsField.fields`. Delete the complete
`showFilter` checkbox from Theme Settings. Do not add hidden replacements.

- [ ] **Step 4: Remove category from server and resolved types**

In `Component.tsx`:

- Delete `category?: string | null` from `DownloadItem`.
- Delete `showFilter?: boolean | null` from `DownloadListBlockLike`.
- Delete the `showFilter = false` parameter default.
- Delete `category: item.category?.trim() || undefined` from resolved documents.
- Delete `showFilter={showFilter}` from `DownloadListClient`.

In `types.ts`, delete:

```ts
category?: string
```

- [ ] **Step 5: Make the client a stateless presentation adapter**

In `DownloadListClient.tsx`:

- Remove `useState` and `cn` imports.
- Remove `showFilter` from `Props` and function parameters.
- Remove `categories`, `hasCategories`, `activeCategory`, and `filtered` declarations.
- Remove the complete filter-button JSX.
- Pass the original array directly:

```tsx
<DownloadListPresentation
  columns={normalizeGridColumns(columns)}
  displayMode={resolvedDisplayMode}
  documentIconSize={documentIconSize ?? 'medium'}
  downloads={downloads}
  gridActionDisplay={gridActionDisplay === 'icons' ? 'icons' : 'labelled'}
  gridIconPosition={gridIconPosition === 'inline' ? 'inline' : 'above'}
  sectionBackground={sectionBackground}
  showDocumentIcon={showDocumentIcon ?? true}
/>
```

The outer `flex flex-col gap-6` wrapper may remain to avoid unrelated layout churn.

- [ ] **Step 6: Remove category labels from both presentations**

Delete the `document.category` conditional paragraphs from `GridDocumentItem` and
`InlinePresentation`. Do not replace them with file-type metadata or spacing shims.

- [ ] **Step 7: Run Download List tests, TypeScript, and lint**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx
```

Expected: all tests and static checks pass with no unused React or utility imports.

---

### Task 3: Regenerate contracts, fixture, thumbnail, and maintained documentation

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `src/payload-types.ts` (generated)
- Modify: `public/block-thumbnails/download-list.jpg` (generated)
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Verify/update: `.agents/skills/project-context/references/project-inventory.json`
- Test: `tests/int/download-list.int.spec.tsx`

**Interfaces:**

- The Download List fixture contains no `category` values and retains explicit supported `fileType`
  selections.
- Generated Download List types expose preset `fileType` values and omit `category` and `showFilter`.
- Maintained docs describe optional preset overrides and automatic detection, with no filter contract.

- [ ] **Step 1: Update fixture content and its source test**

Remove all four `category` properties from the `downloadList` fixture only. Keep each existing
`fileType: 'PDF'`, layout prop, icon position, action display, and document description unchanged.

Extend `DownloadList thumbnail fixture` with:

```tsx
expect(fixture).not.toContain('category:')
expect(fixture).toContain("fileType: 'PDF'")
```

- [ ] **Step 2: Generate and inspect Payload types**

Run:

```bash
pnpm generate:types
pnpm exec prettier --write src/payload-types.ts
```

Confirm the Download List `downloads` item contains:

```ts
fileType?: ('PDF' | 'DOC' | 'DOCX' | 'XLS' | 'XLSX' | 'CSV' | 'PPT' | 'PPTX' | 'ZIP') | null;
```

Confirm its item has no `category` and the block has no `showFilter`. Do not run import-map generation;
no Admin component paths changed.

- [ ] **Step 3: Regenerate and visually inspect only the Download List thumbnail**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=downloadList pnpm generate:block-thumbnails
```

Inspect `public/block-thumbnails/download-list.jpg`. It must remain the current labelled Framed Grid
composition, with PDF badges and no category row beneath document content.

- [ ] **Step 4: Update maintained behavior documentation**

Update the Download List sections in all three files:

- `docs/guides/blocks.md`
- `docs/architecture/feature-inventory.md`
- `.agents/skills/project-context/references/block-system.md`

State that File Type Label is an optional PDF/DOC/DOCX/XLS/XLSX/CSV/PPT/PPTX/ZIP preset override,
empty values auto-detect from uploaded Media, historical explicit values remain readable, and category
filtering has been removed. Remove existing statements that category metadata or filters are available.

- [ ] **Step 5: Format source and documentation before updating project context**

Run:

```bash
pnpm exec prettier --write src/blocks/DownloadList src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md docs/superpowers/specs/2026-08-20-download-list-file-types-and-category-removal-design.md docs/superpowers/plans/2026-08-20-download-list-file-types-and-category-removal.md
```

- [ ] **Step 6: Complete the required project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `project-inventory.json` is current. Report the known stale knowledge-graph warning separately
if it remains; it is not a failure.

- [ ] **Step 7: Run the final verification matrix**

Run:

```bash
pnpm exec vitest run tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
pnpm exec tsc --noEmit
pnpm exec eslint src/blocks/DownloadList src/block-thumbnails/fixtures.tsx tests/int/download-list.int.spec.tsx tests/int/card-block-renderers.int.spec.tsx tests/int/card-block-theme-contract.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/block-thumbnails.int.spec.ts
pnpm exec prettier --check src/blocks/DownloadList src/block-thumbnails/fixtures.tsx src/payload-types.ts tests/int/download-list.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/specs/2026-08-20-download-list-file-types-and-category-removal-design.md docs/superpowers/plans/2026-08-20-download-list-file-types-and-category-removal.md
git diff HEAD --check
```

Expected: all five suites, TypeScript, ESLint, Prettier, project context, and diff integrity pass. Do not
stage or commit the result.
