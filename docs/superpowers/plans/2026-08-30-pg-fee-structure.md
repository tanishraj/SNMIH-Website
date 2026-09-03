# PG Fee Structure Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated, theme-aware PG Fee Structure block that models category-specific departments with shared or department-varying fee columns.

**Architecture:** Build an independent `PGFeeStructure` Payload block with dedicated schema, validation, normalization, server shell, and client tabs/table/cards. Reuse existing shared section, tab, appearance, action, and table primitives; extract only the fee-document download panel into a block-neutral shared module so the existing Fee Structure keeps identical behavior without becoming a dependency of the new block.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16, React 19, TypeScript 5.7, Tailwind CSS 4 semantic utilities, Radix Tabs, shadcn Table/Card/Button primitives, Vitest, Testing Library, Sharp.

## Global Constraints

- New directory `src/blocks/PGFeeStructure/`, slug `pgFeeStructure`, interface `PGFeeStructureBlock`, label `PG Fee Structure`.
- Register in Advanced Library immediately after `feeStructure` for Pages, Reusable Sections, and News & Events detail templates.
- Existing Fee Structure schema, saved values, Programme Cost Atlas, DOM, styling, and behavior must not change.
- General and NRI categories own independent columns, departments, currencies, captions, and notes.
- Fee columns use `department` or `shared` value mode; shared values are authored once, variable values are authored once per department in variable-column order.
- Preserve amounts exactly as text. Never calculate, sum, parse, format, infer, or convert currency.
- Desktop renders a semantic department-first table; mobile renders one Card per department.
- Reuse shared Contained/Pill/Underline tab behavior, widths, scrolling, focus, light/brand surfaces, and semantic radii.
- No Programme Cost Atlas, department relationship, public filter/search/sort/pagination, payment-account fields, database migration, custom Admin field, or automatic content creation.
- Page catalog count becomes 56; Reusable Section count becomes 55; Advanced Library count becomes 36.
- Preserve unrelated dirty-worktree changes. Commit only when explicitly authorized during execution.

---

## File Structure

### Shared presentation

- Create `src/blocks/shared/FeeDocumentDownload.tsx`: canonical fee-document panel, types, and Button-variant resolver.
- Modify `src/blocks/FeeStructure/FeeStructureDownload.tsx`: compatibility re-exports using the shared module.
- Modify `src/blocks/FeeStructure/types.ts`: alias existing download types to shared types without changing public names.

### PG block

- Create `src/blocks/PGFeeStructure/types.ts`: authored and normalized PG domain types.
- Create `src/blocks/PGFeeStructure/normalizePGFeeStructure.ts`: text normalization and shared/variable column expansion.
- Create `src/blocks/PGFeeStructure/config.ts`: Payload schema and validation.
- Create `src/blocks/PGFeeStructure/PGFeeStructureClient.tsx`: category tabs, desktop table, mobile department cards, and notes.
- Create `src/blocks/PGFeeStructure/Component.tsx`: section shell, context band, document resolution, and actions.
- Create `tests/int/pg-fee-structure.int.spec.tsx`: schema, validation, normalization, rendering, registration, generated-type, thumbnail, and docs contract.

### Registration and assets

- Modify `src/blocks/blockCatalog.ts`.
- Modify `src/blocks/renderPageBlocks.tsx`.
- Modify `src/blocks/renderLivePreviewPageBlocks.tsx`.
- Modify `src/block-thumbnails/definitions.ts`.
- Modify `src/block-thumbnails/fixtures.tsx`.
- Create `public/block-thumbnails/pg-fee-structure.jpg` through the repository generator.
- Regenerate `src/payload-types.ts`.

### Existing count and documentation contracts

- Modify `tests/int/block-catalog.int.spec.ts`.
- Modify `tests/int/page-blocks.int.spec.ts`.
- Modify `tests/int/system-page-blocks.int.spec.ts`.
- Modify `tests/int/project-context-lib.int.spec.ts`.
- Modify `tests/int/block-thumbnails.int.spec.ts`.
- Modify `tests/int/block-thumbnail-fixtures.int.spec.ts`.
- Modify count-sensitive assertions in `tests/int/program-matrix.int.spec.tsx` and `tests/int/editorial-reasons.int.spec.tsx`.
- Modify `docs/guides/blocks.md`.
- Modify `docs/architecture/feature-inventory.md`.
- Modify `.agents/skills/project-context/references/block-system.md`.
- Refresh `.agents/skills/project-context/references/project-inventory.json`.

---

### Task 1: Extract the canonical fee-document panel

**Files:**
- Create: `src/blocks/shared/FeeDocumentDownload.tsx`
- Modify: `src/blocks/FeeStructure/FeeStructureDownload.tsx`
- Modify: `src/blocks/FeeStructure/types.ts`
- Test: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**
- Produces `FeeDocumentDownloadActionMode`, `FeeDocumentDownloadButtonVariant`, `ResolvedFeeDocumentDownload`, `resolveFeeDocumentButtonVariant()`, and `FeeDocumentDownload`.
- Preserves existing `FeeStructureDownloadActionMode`, `FeeStructureDownloadButtonVariant`, `ResolvedFeeStructureDownload`, `resolveDownloadButtonVariant()`, and `FeeStructureDownload` names through aliases/re-exports.

- [ ] **Step 1: Run the existing Fee Structure suite as a baseline**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: PASS before refactoring.

- [ ] **Step 2: Create the shared panel with the existing DOM contract**

Create `src/blocks/shared/FeeDocumentDownload.tsx` by moving the existing implementation and replacing feature-specific names with:

```tsx
import { Download, FileText } from 'lucide-react'

import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import { Button, buttonVariants } from '@/components/ui/button'
import type { CmsActionVariant } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

export type FeeDocumentDownloadActionMode = 'button' | 'link'
export type FeeDocumentDownloadButtonVariant = Exclude<CmsActionVariant, 'link'>

export type ResolvedFeeDocumentDownload = {
  appearance?: BlockAppearance | null
  buttonVariant: FeeDocumentDownloadButtonVariant
  label: string
  mode: FeeDocumentDownloadActionMode
  sectionBackground?: BlockAppearance['background'] | null
  url: string
}

const downloadButtonVariants = new Set<CmsActionVariant>([
  'default',
  'primary',
  'secondary',
  'outline',
  'white',
  'whiteOutline',
])

export const resolveFeeDocumentButtonVariant = (
  value?: FeeDocumentDownloadButtonVariant | null,
): FeeDocumentDownloadButtonVariant =>
  downloadButtonVariants.has(value as CmsActionVariant)
    ? (value as FeeDocumentDownloadButtonVariant)
    : 'outline'

export function FeeDocumentDownload({ download }: { download: ResolvedFeeDocumentDownload }) {
  const appearance = resolveBlockAppearanceClasses(download.appearance)
  const surface = appearance.background === 'none' ? download.sectionBackground : appearance.surface

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-card border border-current/15 p-5 sm:flex-row sm:items-center sm:justify-between',
        appearance.className,
      )}
      data-fee-document="true"
      data-fee-download-background={appearance.background}
    >
      <div className="flex items-center gap-3">
        <FileText aria-hidden="true" className="size-5" />
        <p className="font-semibold">Official fee structure</p>
      </div>
      {download.mode === 'link' ? (
        <a
          className={cn(
            buttonVariants({ variant: 'link' }),
            'group/button h-auto gap-2 px-0 py-0 text-sm font-semibold text-current no-underline hover:text-current/80 hover:no-underline',
          )}
          data-fee-download-mode="link"
          download
          href={download.url}
        >
          <span className="underline decoration-current decoration-2 underline-offset-4">
            {download.label}
          </span>
          <Download aria-hidden="true" data-icon="inline-end" />
        </a>
      ) : (
        <Button
          asChild
          className={cn(
            surface === 'brand' &&
              download.buttonVariant === 'outline' &&
              'border-current/70 text-current hover:border-current hover:bg-current/10',
          )}
          variant={download.buttonVariant}
        >
          <a data-fee-download-mode="button" download href={download.url}>
            <Download aria-hidden="true" data-icon="inline-start" />
            {download.label}
          </a>
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Preserve Fee Structure compatibility exports**

Replace `src/blocks/FeeStructure/FeeStructureDownload.tsx` with:

```ts
export {
  FeeDocumentDownload as FeeStructureDownload,
  resolveFeeDocumentButtonVariant as resolveDownloadButtonVariant,
} from '@/blocks/shared/FeeDocumentDownload'
```

In `src/blocks/FeeStructure/types.ts`, replace the locally declared download-mode, variant, and resolved-download shapes with aliases:

```ts
import type {
  FeeDocumentDownloadActionMode,
  FeeDocumentDownloadButtonVariant,
  ResolvedFeeDocumentDownload,
} from '@/blocks/shared/FeeDocumentDownload'

export type FeeStructureDownloadActionMode = FeeDocumentDownloadActionMode
export type FeeStructureDownloadButtonVariant = FeeDocumentDownloadButtonVariant
export type ResolvedFeeStructureDownload = ResolvedFeeDocumentDownload
```

Keep all other Fee Structure types unchanged.

- [ ] **Step 4: Re-run the Fee Structure regression suite**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/fee-structure.int.spec.tsx
```

Expected: PASS with the same document mode, labels, data attributes, variants, and brand contrast assertions.

- [ ] **Step 5: Review the Task 1 diff**

```bash
git diff --check
git diff -- src/blocks/shared/FeeDocumentDownload.tsx src/blocks/FeeStructure/FeeStructureDownload.tsx src/blocks/FeeStructure/types.ts
```

Expected: one shared extraction with compatibility aliases; no Fee Structure schema or DOM change.

### Task 2: Add PG types, normalization, and Payload validation

**Files:**
- Create: `src/blocks/PGFeeStructure/types.ts`
- Create: `src/blocks/PGFeeStructure/normalizePGFeeStructure.ts`
- Create: `src/blocks/PGFeeStructure/config.ts`
- Create: `tests/int/pg-fee-structure.int.spec.tsx`

**Interfaces:**
- Produces authored `PGFee*Value` types and normalized `ResolvedPGFee*` types.
- Produces `normalizePGFeeCategories()`, `isNumericPGFeeValue()`, `validatePGFeeCategories()`, `validatePGFeeColumns()`, and `validatePGFeeDepartments()`.
- Produces Payload block `PGFeeStructureBlock`.

- [ ] **Step 1: Write failing schema, validation, and normalization tests**

Create `tests/int/pg-fee-structure.int.spec.tsx` with imports and helpers:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Field, TabsField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import {
  PGFeeStructureBlock,
  validatePGFeeCategories,
  validatePGFeeColumns,
  validatePGFeeDepartments,
} from '@/blocks/PGFeeStructure/config'
import {
  isNumericPGFeeValue,
  normalizePGFeeCategories,
} from '@/blocks/PGFeeStructure/normalizePGFeeStructure'

afterEach(cleanup)

const findNamedField = (fields: Field[], name: string): Field | undefined => {
  for (const field of fields) {
    if ('name' in field && field.name === name) return field
    if (field.type === 'tabs') {
      for (const tab of field.tabs) {
        const found = findNamedField(tab.fields, name)
        if (found) return found
      }
    }
    if ('fields' in field && Array.isArray(field.fields)) {
      const found = findNamedField(field.fields, name)
      if (found) return found
    }
  }
}
```

Add assertions that:

```tsx
expect(PGFeeStructureBlock).toMatchObject({
  slug: 'pgFeeStructure',
  interfaceName: 'PGFeeStructureBlock',
  labels: { singular: 'PG Fee Structure', plural: 'PG Fee Structures' },
})
expect((PGFeeStructureBlock.fields[0] as TabsField).tabs.map(({ label }) => label)).toEqual([
  'Content',
  'Theme Settings',
])
expect(findNamedField(PGFeeStructureBlock.fields, 'feeCategories')).toMatchObject({
  type: 'array', minRows: 1, maxRows: 4, required: true,
})
expect(findNamedField(PGFeeStructureBlock.fields, 'columns')).toMatchObject({
  type: 'array', minRows: 1, maxRows: 6, required: true,
})
expect(findNamedField(PGFeeStructureBlock.fields, 'departments')).toMatchObject({
  type: 'array', minRows: 1, maxRows: 30, required: true,
})
expect(findNamedField(PGFeeStructureBlock.fields, 'variableValues')).toMatchObject({
  type: 'array', maxRows: 6,
})
expect(findNamedField(PGFeeStructureBlock.fields, 'layout')).toBeUndefined()
```

Add validation cases for case-insensitive duplicate category/column/department labels, missing shared values, and one/two variable-value count mismatches. Add normalization input with Tuition=`department`, Hostel/Security=`shared`, mixed `₹` and `USD` strings, blank draft values, and separate General/NRI department lists. Assert ordered cells such as:

```tsx
expect(normalizePGFeeCategories(categories)).toMatchObject([
  {
    label: 'General',
    columns: [
      { label: 'Tuition (Per Annum)', valueMode: 'department' },
      { label: 'Hostel (Per Annum)', valueMode: 'shared' },
      { label: 'Security (One Time)', valueMode: 'shared' },
    ],
    departments: [
      { name: 'General Medicine', cells: ['₹28,00,000', '₹3,15,000', '₹2,00,000'] },
    ],
  },
])
expect(isNumericPGFeeValue('USD 64,000')).toBe(true)
expect(isNumericPGFeeValue('—')).toBe(false)
```

- [ ] **Step 2: Run the new suite and verify module-not-found failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: FAIL because the PG modules do not exist.

- [ ] **Step 3: Create the PG domain types**

Create `src/blocks/PGFeeStructure/types.ts` with:

```ts
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import type {
  FeeDocumentDownloadActionMode,
  FeeDocumentDownloadButtonVariant,
} from '@/blocks/shared/FeeDocumentDownload'
import type { CmsActionValue } from '@/lib/cmsLinks'
import type { Media } from '@/payload-types'

export type PGFeeColumnValueMode = 'department' | 'shared'
export type PGFeeTabStyle = 'boxed' | 'pills' | 'underline'
export type PGFeeTabWidth = 'centered' | 'content' | 'equal'

export type PGFeeVariableValue = { id?: string | null; value?: string | null }
export type PGFeeColumnValue = {
  id?: string | null
  label?: string | null
  sharedValue?: string | null
  valueMode?: PGFeeColumnValueMode | null
}
export type PGFeeDepartmentValue = {
  id?: string | null
  name?: string | null
  note?: string | null
  variableValues?: PGFeeVariableValue[] | null
}
export type PGFeeNoteValue = {
  emphasis?: boolean | null
  id?: string | null
  text?: string | null
}
export type PGFeeCategoryValue = {
  caption?: string | null
  columns?: PGFeeColumnValue[] | null
  departments?: PGFeeDepartmentValue[] | null
  id?: string | null
  label?: string | null
  notes?: PGFeeNoteValue[] | null
}

export type ResolvedPGFeeColumn = {
  id: string
  label: string
  valueMode: PGFeeColumnValueMode
}
export type ResolvedPGFeeDepartment = {
  cells: string[]
  id: string
  name: string
  note?: string
}
export type ResolvedPGFeeNote = { emphasis: boolean; id: string; text: string }
export type ResolvedPGFeeCategory = {
  caption?: string
  columns: ResolvedPGFeeColumn[]
  departments: ResolvedPGFeeDepartment[]
  id: string
  label: string
  notes: ResolvedPGFeeNote[]
}

export type PGFeeStructureBlockLike = {
  academicSession?: string | null
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | null
  description?: string | null
  downloadActionMode?: FeeDocumentDownloadActionMode | null
  downloadAppearance?: BlockAppearance | null
  downloadButtonVariant?: FeeDocumentDownloadButtonVariant | null
  downloadLabel?: string | null
  eyebrow?: string | null
  feeCategories?: PGFeeCategoryValue[] | null
  feeDocument?: Media | string | number | null
  footerActions?: CmsActionValue[] | null
  programmeName?: string | null
  size?: RegularBlockSize | null
  tabStyle?: PGFeeTabStyle | null
  tabWidth?: PGFeeTabWidth | null
  title?: string | null
}
```

- [ ] **Step 4: Implement deterministic PG normalization**

Create `src/blocks/PGFeeStructure/normalizePGFeeStructure.ts`. Use trimmed text, retain valid source indices, and expand cells by walking visible columns:

```ts
import type {
  PGFeeCategoryValue,
  ResolvedPGFeeCategory,
} from './types'

const normalizeText = (value?: string | null) => value?.trim() || undefined
export const isNumericPGFeeValue = (value: string) => /\d/.test(value)

export function normalizePGFeeCategories(
  categories?: PGFeeCategoryValue[] | null,
): ResolvedPGFeeCategory[] {
  return (categories ?? []).flatMap((category, categoryIndex) => {
    const label = normalizeText(category.label)
    const columns = (category.columns ?? []).flatMap((column, columnIndex) => {
      const columnLabel = normalizeText(column.label)
      if (!columnLabel) return []
      const valueMode = column.valueMode === 'shared' ? ('shared' as const) : ('department' as const)
      return [{
        id: `${column.id ?? `column-${categoryIndex}`}-${columnIndex}`,
        label: columnLabel,
        sharedValue: normalizeText(column.sharedValue),
        valueMode,
      }]
    })
    const departments = (category.departments ?? []).flatMap((department, departmentIndex) => {
      const name = normalizeText(department.name)
      if (!name) return []
      let variableIndex = 0
      const cells = columns.map((column) => {
        if (column.valueMode === 'shared') return column.sharedValue ?? '—'
        const value = normalizeText(department.variableValues?.[variableIndex]?.value) ?? '—'
        variableIndex += 1
        return value
      })
      return [{
        cells,
        id: `${department.id ?? `department-${categoryIndex}`}-${departmentIndex}`,
        name,
        note: normalizeText(department.note),
      }]
    })
    if (!label || columns.length === 0 || departments.length === 0) return []
    const notes = (category.notes ?? []).flatMap((note, noteIndex) => {
      const text = normalizeText(note.text)
      return text
        ? [{ emphasis: note.emphasis === true, id: `${note.id ?? `note-${categoryIndex}`}-${noteIndex}`, text }]
        : []
    })
    return [{
      caption: normalizeText(category.caption),
      columns: columns.map(({ id, label: columnLabel, valueMode }) => ({ id, label: columnLabel, valueMode })),
      departments,
      id: `${category.id ?? 'category'}-${categoryIndex}`,
      label,
      notes,
    }]
  })
}
```

- [ ] **Step 5: Implement native Payload fields and validation**

Create `src/blocks/PGFeeStructure/config.ts` by following Fee Structure's top-level Content/Theme Settings organization. Export these validators:

```ts
const normalizedKey = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLocaleLowerCase() : ''

const duplicateLabelIndex = (rows: unknown[], key: 'label' | 'name') => {
  const seen = new Set<string>()
  return rows.findIndex((row) => {
    if (!row || typeof row !== 'object') return false
    const value = normalizedKey((row as Record<string, unknown>)[key])
    if (!value) return false
    if (seen.has(value)) return true
    seen.add(value)
    return false
  })
}

export const validatePGFeeCategories: ArrayFieldValidation = (value) => {
  if (!Array.isArray(value)) return true
  const index = duplicateLabelIndex(value, 'label')
  return index < 0 ? true : `Fee category ${index + 1} duplicates an earlier category label.`
}

export const validatePGFeeColumns: ArrayFieldValidation = (value) => {
  if (!Array.isArray(value)) return true
  const duplicateIndex = duplicateLabelIndex(value, 'label')
  if (duplicateIndex >= 0) return `Fee column ${duplicateIndex + 1} duplicates an earlier column label.`
  const missingSharedIndex = value.findIndex((column) => {
    if (!column || typeof column !== 'object') return false
    const item = column as { sharedValue?: unknown; valueMode?: unknown }
    return item.valueMode === 'shared' && normalizedKey(item.sharedValue) === ''
  })
  return missingSharedIndex < 0
    ? true
    : `Fee column ${missingSharedIndex + 1} requires a Shared Value.`
}

export const validatePGFeeDepartments: ArrayFieldValidation = (value, { siblingData }) => {
  if (!Array.isArray(value)) return true
  const duplicateIndex = duplicateLabelIndex(value, 'name')
  if (duplicateIndex >= 0) return `Department ${duplicateIndex + 1} duplicates an earlier department name.`
  const columns = Array.isArray((siblingData as { columns?: unknown[] })?.columns)
    ? (siblingData as { columns: Array<{ valueMode?: unknown }> }).columns
    : []
  const variableCount = columns.filter((column) => column?.valueMode !== 'shared').length
  const mismatchIndex = value.findIndex((department) => {
    if (!department || typeof department !== 'object') return false
    const values = (department as { variableValues?: unknown[] }).variableValues
    return (Array.isArray(values) ? values.length : 0) !== variableCount
  })
  return mismatchIndex < 0
    ? true
    : `Department ${mismatchIndex + 1} must contain exactly ${variableCount} variable fee ${variableCount === 1 ? 'value' : 'values'}.`
}
```

Define `feeCategories` with category `columns`, `departments`, and `notes`; set the approved limits; condition `sharedValue` on `valueMode === 'shared'`; and set `valueMode` default to `department`. Copy Fee Structure's header/actions/programme/session/document/footer fields and Theme Settings except `layout` and `programmeDetails`. Use `getBlockThumbnailAdmin('pgFeeStructure')`.

- [ ] **Step 6: Run domain tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: schema, validation, and normalization tests pass; rendering assertions added in Task 3 may still be absent.

### Task 3: Build the department-first visitor presentation

**Files:**
- Create: `src/blocks/PGFeeStructure/PGFeeStructureClient.tsx`
- Create: `src/blocks/PGFeeStructure/Component.tsx`
- Modify: `tests/int/pg-fee-structure.int.spec.tsx`

**Interfaces:**
- `PGFeeStructureClient` consumes normalized categories and tab/theme values.
- `PGFeeStructureBlockComponent` consumes `PGFeeStructureBlockLike`, resolves the shell and download, and passes normalized serializable data to the client.

- [ ] **Step 1: Add failing rendering tests**

Add fixtures for General and NRI. Test that one category renders directly and two categories expose `General`/`NRI` tabs. Assert:

```tsx
expect(html).toContain('data-pg-fee-structure="true"')
expect(html).toContain('data-pg-fee-structure-desktop="true"')
expect(html).toContain('data-pg-fee-structure-mobile="true"')
expect(html).toContain('<th')
expect(html).toContain('scope="row"')
expect(html).toContain('Department')
expect(html.match(/data-pg-fee-department-card="true"/g)).toHaveLength(10)
expect(html).toContain('₹28,00,000')
expect(html).toContain('₹3,15,000')
expect(html).toContain('₹2,00,000')
```

Use Testing Library to switch to NRI and assert `USD 64,000` appears while a General-only department disappears. Assert the desktop first column is sticky, mobile cards are department-first, notes remain category-owned, brand classes remain readable, and both document Link/Button modes use `data-fee-document="true"`.

- [ ] **Step 2: Run rendering tests and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx
```

Expected: FAIL because the server and client components do not exist.

- [ ] **Step 3: Implement `PGFeeStructureClient`**

Follow the existing Fee Structure table surface and tab mappings. Export:

```ts
export const resolvePGFeeTabVariant = (value?: PGFeeTabStyle | null): ContentTabVariant =>
  value === 'pills' ? 'pill' : value === 'boxed' ? 'contained' : 'underline'
```

Implement `PGFeeCategoryPresentation` with:

- desktop wrapper `hidden overflow-x-auto pb-2 md:block` and `data-pg-fee-structure-desktop="true"`;
- `min-w-max overflow-hidden rounded-card border` frame;
- `Department` sticky TableHead;
- one TableHead per `category.columns`;
- one TableRow per department with a scoped sticky row TableHead and right-aligned cells;
- mobile `grid gap-4 md:hidden` wrapper;
- one Card per department, with name/note in CardHeader and column-label/value rows in CardContent;
- category notes after both responsive presentations.

Implement one-category direct rendering and multi-category Radix Tabs using `getContentTabRailClasses()`, `getContentTabClasses()`, and the exact `content/centered/equal` width map from Fee Structure. Use `data-pg-fee-*` attributes for tests while retaining shared `data-content-tab-variant`.

- [ ] **Step 4: Implement the server section shell**

Create `src/blocks/PGFeeStructure/Component.tsx` by following Fee Structure's header/context/download/footer order. Resolve:

```ts
const categories = normalizePGFeeCategories(feeCategories)
const resolvedProgramme = programmeName?.trim()
const resolvedSession = academicSession?.trim()
if (!resolvedProgramme || !resolvedSession || categories.length === 0) return null
```

Use `resolveBlockAppearanceClasses`, shared spacing/content styles, `ContentActions`, `BlockFooterActions`, `getMediaAbsoluteUrl`, `resolveFeeDocumentButtonVariant`, and `FeeDocumentDownload`. Render the context band labels `Programme` and `Academic Session`. Keep the download after categories.

- [ ] **Step 5: Run PG and existing Fee Structure suites**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx tests/int/fee-structure.int.spec.tsx
```

Expected: PASS for the new department-first output and unchanged existing Fee Structure output.

### Task 4: Register renderers, generated types, and thumbnail assets

**Files:**
- Modify: `src/blocks/blockCatalog.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `src/block-thumbnails/fixtures.tsx`
- Modify: `tests/int/pg-fee-structure.int.spec.tsx`
- Modify: `tests/int/block-catalog.int.spec.ts`
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/system-page-blocks.int.spec.ts`
- Modify: `tests/int/project-context-lib.int.spec.ts`
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Modify: `tests/int/program-matrix.int.spec.tsx`
- Modify: `tests/int/editorial-reasons.int.spec.tsx`
- Generate: `src/payload-types.ts`
- Generate: `public/block-thumbnails/pg-fee-structure.jpg`

**Interfaces:**
- Makes `pgFeeStructure` reachable through every Page-compatible schema and renderer.
- Produces generated `PGFeeStructureBlock` and fixture/thumbnail coverage.

- [ ] **Step 1: Add failing registration and asset assertions**

Update exact counts:

```ts
expect(pageSlugs).toHaveLength(56)
expect(advancedSlugs).toHaveLength(36)
expect(reusableSectionSlugs).toHaveLength(55)
expect(inventory.blocks.page).toHaveLength(56)
```

Add `pgFeeStructure` containment assertions beside `feeStructure`. In the PG suite, read renderer, generated type, thumbnail definition, fixture, and docs sources and require:

```ts
expect(pageBuilderBlocks.map(({ slug }) => slug)).toContain('pgFeeStructure')
expect(reusableSectionBuilderBlocks.map(({ slug }) => slug)).toContain('pgFeeStructure')
expect(pageRendererSource).toContain("case 'pgFeeStructure':")
expect(livePreviewRendererSource).toContain("case 'pgFeeStructure':")
expect(payloadTypesSource).toContain('export interface PGFeeStructureBlock')
expect(payloadTypesSource).toContain("blockType: 'pgFeeStructure'")
expect(thumbnailDefinitionsSource).toContain("filename: 'pg-fee-structure.jpg'")
expect(thumbnailFixturesSource).toContain('pgFeeStructure:')
```

Update count-sensitive documentation assertions from `55` to `56`.

- [ ] **Step 2: Run registration tests and verify failure**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/project-context-lib.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL until registration, generated types, fixture, and JPEG exist.

- [ ] **Step 3: Register the schema and both renderers**

- Import `PGFeeStructureBlock` in `src/blocks/blockCatalog.ts` and place it immediately after `FeeStructureBlock` in Advanced Library.
- Import `PGFeeStructureBlockComponent` in both renderer files.
- Add `case 'pgFeeStructure'` immediately after `feeStructure` in both switches, wrapped by `BlockErrorBoundary` in production and keyed directly in live preview.

- [ ] **Step 4: Add thumbnail definition and production fixture**

Add to `src/block-thumbnails/definitions.ts`:

```ts
defineThumbnail({
  alt: 'PG Fee Structure block preview',
  filename: 'pg-fee-structure.jpg',
  label: 'PG Fee Structure',
  slug: 'pgFeeStructure',
  stageAlignment: 'top',
}),
```

Import `PGFeeStructureBlockComponent` in fixtures and add a fixture using General and NRI categories, one variable Tuition column, shared Hostel/Security columns, at least three departments, `appearance={{ background: 'subtle', border: 'topAndBottom' }}`, and the approved PG title/session copy.

- [ ] **Step 5: Generate Payload types**

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` contains `PGFeeStructureBlock`, nested columns/departments/variableValues, tab settings, and `blockType: 'pgFeeStructure'`. Existing Fee Structure types remain present.

- [ ] **Step 6: Generate the block thumbnail**

Ensure the dev thumbnail-preview route is available, then run:

```bash
pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/pg-fee-structure.jpg` exists as an exact 1600×900 JPEG and existing thumbnails remain valid. Do not hand-edit binary thumbnail files.

- [ ] **Step 7: Run registration, renderer, and thumbnail tests**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/project-context-lib.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: PASS with 56 Page blocks, 55 Reusable Section blocks, 36 Advanced blocks, complete renderer parity, generated types, and valid thumbnail coverage.

### Task 5: Update operator and architecture documentation

**Files:**
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: count-sensitive test assertions already listed in Task 4

**Interfaces:**
- Records the new editor contract and exact catalogs without changing runtime behavior.

- [ ] **Step 1: Update the Page block catalog and operator guide**

In `docs/guides/blocks.md`, add the table row:

```md
| PG Fee Structure         | Department-based postgraduate fees          | Category tabs, shared or department-varying fee columns, department-first desktop table and mobile cards, category notes, and an official file Link or Button download |
```

Add a PG Fee Structure section after Fee Structure explaining category ownership, shared/variable fee columns, variable-value order, exact authored currency strings, department cards on mobile, validation, tabs, notes, and downloads.

- [ ] **Step 2: Update the maintained architecture inventory**

In `docs/architecture/feature-inventory.md`:

- change `55-block layouts` to `56-block layouts`;
- change both catalog totals to 56/55;
- insert `PG Fee Structure` after `Fee Structure` in the complete list;
- add a concise paragraph describing the department-first data model, shared/variable expansion, responsive output, exact authored amounts, and no calculation.

In `.agents/skills/project-context/references/block-system.md`:

- change exact catalog counts and recipe wording from 55/54 to 56/55;
- add a PG Fee Structure contract immediately after Fee Structure;
- record the shared fee-document presenter under Shared Configuration and Presentation.

- [ ] **Step 3: Run focused documentation contracts**

```bash
pnpm exec vitest run --config ./vitest.config.mts tests/int/pg-fee-structure.int.spec.tsx tests/int/program-matrix.int.spec.tsx tests/int/editorial-reasons.int.spec.tsx tests/int/admin-documentation.int.spec.ts
```

Expected: PASS with all exact-count and operator-copy assertions aligned.

### Task 6: Complete full verification and project-context maintenance

**Files:**
- Refresh: `.agents/skills/project-context/references/project-inventory.json`
- Inspect: every file changed in Tasks 1–5

**Interfaces:**
- Produces a verified, documented, uncommitted implementation unless commit authorization is provided.

- [ ] **Step 1: Run the complete affected suite**

```bash
pnpm exec vitest run --config ./vitest.config.mts \
  tests/int/pg-fee-structure.int.spec.tsx \
  tests/int/fee-structure.int.spec.tsx \
  tests/int/content-tab-rail.int.spec.ts \
  tests/int/block-catalog.int.spec.ts \
  tests/int/page-blocks.int.spec.ts \
  tests/int/system-page-blocks.int.spec.ts \
  tests/int/project-context-lib.int.spec.ts \
  tests/int/block-thumbnails.int.spec.ts \
  tests/int/block-thumbnail-fixtures.int.spec.ts \
  tests/int/program-matrix.int.spec.tsx \
  tests/int/editorial-reasons.int.spec.tsx \
  tests/int/admin-documentation.int.spec.ts \
  tests/int/theme-contracts.int.spec.ts \
  tests/int/semantic-radius-contract.int.spec.ts
```

Expected: PASS across the new block, existing Fee Structure, tabs, registration, thumbnails, docs, and theme contracts.

- [ ] **Step 2: Run generated-type, TypeScript, and lint verification**

```bash
pnpm generate:types
pnpm exec tsc --noEmit --pretty false
pnpm lint
```

Expected: generated types are stable, TypeScript exits zero, and ESLint has zero errors. Report any unrelated pre-existing warning separately.

- [ ] **Step 3: Complete the required project-context update/check loop**

```bash
pnpm project-context:update
git diff -- .agents/skills/project-context/references/project-inventory.json .agents/skills/project-context/references/block-system.md
pnpm project-context:check
```

Expected: inventory records `PGFeeStructure` source/test paths, `pgFeeStructure` in Page/Reusable/detail catalogs, both renderer cases, and the new thumbnail. Context check passes; a stale optional knowledge-graph warning is non-blocking.

- [ ] **Step 4: Inspect final change impact and whitespace**

Read `.agents/skills/project-context/references/change-impact-map.md`, then run:

```bash
git diff --check
git status --short
git diff --stat
```

Inspect all scoped source, tests, generated types, docs, and thumbnail changes. Confirm there is no migration, import-map change, existing Fee Structure schema change, or unrelated file modification.

- [ ] **Step 5: Commit only if explicitly authorized**

If the user requests a commit during execution:

```bash
git add src/blocks/PGFeeStructure src/blocks/shared/FeeDocumentDownload.tsx src/blocks/FeeStructure/FeeStructureDownload.tsx src/blocks/FeeStructure/types.ts src/blocks/blockCatalog.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx public/block-thumbnails/pg-fee-structure.jpg src/payload-types.ts tests/int/pg-fee-structure.int.spec.tsx tests/int/block-catalog.int.spec.ts tests/int/page-blocks.int.spec.ts tests/int/system-page-blocks.int.spec.ts tests/int/project-context-lib.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/program-matrix.int.spec.tsx tests/int/editorial-reasons.int.spec.tsx docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md .agents/skills/project-context/references/project-inventory.json docs/superpowers/specs/2026-08-30-pg-fee-structure-design.md docs/superpowers/plans/2026-08-30-pg-fee-structure.md
git commit -m "feat(fees): add PG fee structure"
```

Otherwise leave the complete verified implementation uncommitted.
