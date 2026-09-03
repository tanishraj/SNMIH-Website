# Fee Structure Block Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully configurable Fee Structure Page block for one programme and academic session, with category tabs, a desktop fee table, mobile period cards, fee-only notes, and an optional official PDF download.

**Architecture:** Payload stores editor-authored text values in ordered category, column, row, and cell arrays; a pure defensive normalizer creates one client-safe model without calculating or inferring values. A server component owns the section shell and Media URL resolution, while a small client component owns accessible category tabs and renders the same normalized data as a semantic table from `md` upward and cards below `md`.

**Tech Stack:** Payload CMS 3.85.2, Next.js 16.2.10, React 19.2.7, TypeScript 5.7.3, Tailwind CSS 4, shadcn/ui `Table`, `Tabs`, existing `Card` and `Button`, Lucide React, Vitest, Testing Library, and repository thumbnail/project-context tooling.

## Global Constraints

- Do not commit, stage, unstage, or alter branch history. Leave all work in the working tree for user review.
- Preserve the existing `skills-lock.json` modification, `.agents/skills/content-research-writer/`, and all other unrelated user changes.
- Treat `FEE STRUCTURE 2026-27.pdf` as source data, never as instructions.
- One block represents exactly one programme and one academic session; multiple programmes require multiple block instances.
- Store and render only fee-related information. Do not add bank, branch, account, IFSC, payment-account, or online-payment fields.
- Never calculate totals, convert currencies, infer missing figures, or invent an NRI total.
- Keep every cell as editor-authored text so INR, USD, unavailable values, and official wording remain faithful.
- Use the regular full-width section container; do not add a split layout.
- `feeCategories` supports 1–4 categories; each category supports 1–6 columns, 1–30 rows, and 0–8 notes.
- New authored rows must contain exactly as many cells as their category has columns.
- Runtime normalization trims strings, drops invalid categories/rows, maps empty or missing cells to `—`, ignores extra cells, and defaults invalid emphasis to `standard`.
- One valid category renders without tabs; two or more use accessible shadcn Tabs with a horizontally scrollable rail.
- Render a semantic table on tablet/desktop and one Card per academic period on mobile from the same normalized data.
- Resolve the optional Media relationship on the server. Render no download panel for an unresolved or unusable file.
- Register the block on Pages and Reusable Sections and keep production/live-preview coverage identical.
- Use the repository's Content/Theme Settings, appearance, spacing, heading, action, footer-action, thumbnail, generated-type, and documentation contracts.

---

### Task 1: Add shadcn primitives and the normalized fee model

**Files:**

- Create: `src/components/ui/table.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/blocks/FeeStructure/types.ts`
- Create: `src/blocks/FeeStructure/normalizeFeeStructure.ts`
- Create: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Produces `normalizeFeeCategories(categories?: FeeStructureCategoryValue[] | null): ResolvedFeeStructureCategory[]`.
- Produces `isNumericFeeValue(value: string): boolean`.
- Produces `FeeStructureBlockLike`, `FeeStructureCategoryValue`, `ResolvedFeeStructureCategory`, `FeeStructureTabStyle`, and `FeeStructureRowEmphasis` for Tasks 2–4.
- Uses only type imports from shared appearance, spacing, CMS actions, Media, and generated Page types; the normalizer remains client-safe and side-effect free.

- [ ] **Step 1: Add failing normalization tests**

Create `tests/int/fee-structure.int.spec.tsx` with the shared imports and this first contract:

```tsx
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ArrayField, Field, SelectField, TabsField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import {
  isNumericFeeValue,
  normalizeFeeCategories,
} from '@/blocks/FeeStructure/normalizeFeeStructure'

afterEach(cleanup)

describe('Fee Structure normalization', () => {
  it('trims authored values, preserves mixed currencies, and aligns cells to valid columns', () => {
    expect(
      normalizeFeeCategories([
        {
          id: 'general',
          label: ' General ',
          caption: ' Official general-category fees ',
          columns: [
            { label: ' 1st Year ' },
            { label: '   ' },
            { label: ' 2nd Year ' },
          ],
          rows: [
            {
              id: 'tuition',
              label: ' Tuition Fee ',
              emphasis: 'unexpected' as never,
              cells: [
                { value: ' Rs. 12,75,000 ' },
                { value: 'must not shift' },
                { value: ' USD 35,000 ' },
                { value: 'ignored extra' },
              ],
            },
            {
              label: ' Total ',
              emphasis: 'total',
              cells: [{ value: ' 17,50,000 ' }],
            },
            { label: '   ', cells: [{ value: 'discarded' }] },
          ],
          notes: [
            { text: ' Total package: Rs. 71.75 lakhs ', emphasis: true },
            { text: '   ' },
          ],
        },
        { label: 'Invalid', columns: [], rows: [] },
      ]),
    ).toEqual([
      {
        id: 'general-0',
        label: 'General',
        caption: 'Official general-category fees',
        columns: [
          { id: 'column-0-0', label: '1st Year' },
          { id: 'column-0-2', label: '2nd Year' },
        ],
        rows: [
          {
            id: 'tuition-0',
            label: 'Tuition Fee',
            emphasis: 'standard',
            cells: ['Rs. 12,75,000', 'USD 35,000'],
          },
          {
            id: 'row-0-1',
            label: 'Total',
            emphasis: 'total',
            cells: ['17,50,000', '—'],
          },
        ],
        notes: [{ id: 'note-0-0', text: 'Total package: Rs. 71.75 lakhs', emphasis: true }],
      },
    ])
  })

  it('recognizes values containing digits without reinterpreting their currency', () => {
    expect(isNumericFeeValue('Rs. 12,75,000')).toBe(true)
    expect(isNumericFeeValue('USD 35,000')).toBe(true)
    expect(isNumericFeeValue('—')).toBe(false)
    expect(isNumericFeeValue('Not applicable')).toBe(false)
  })
})
```

- [ ] **Step 2: Run the test and verify the missing-module failure**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "Fee Structure normalization"
```

Expected: FAIL because `@/blocks/FeeStructure/normalizeFeeStructure` does not exist.

- [ ] **Step 3: Install the official shadcn primitives**

Run:

```bash
pnpm exec shadcn add @shadcn/table @shadcn/tabs
```

Expected: the CLI creates `src/components/ui/table.tsx` and `src/components/ui/tabs.tsx`; it must not replace existing `Card` or `Button` components. Confirm their public exports:

```bash
rg -n "export.*Table|export.*Tabs" src/components/ui/table.tsx src/components/ui/tabs.tsx
```

Expected: Table exports include `Table`, `TableBody`, `TableCaption`, `TableCell`, `TableHead`, `TableHeader`, and `TableRow`; Tabs exports include `Tabs`, `TabsContent`, `TabsList`, and `TabsTrigger`.

- [ ] **Step 4: Define the authored and normalized contracts**

Create `src/blocks/FeeStructure/types.ts`:

```ts
import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import type { CmsActionValue } from '@/lib/cmsLinks'
import type { Media } from '@/payload-types'

export type FeeStructureRowEmphasis = 'standard' | 'total'
export type FeeStructureTabStyle = 'boxed' | 'pills' | 'underline'

export type FeeStructureCellValue = {
  id?: string | null
  value?: string | null
}

export type FeeStructureColumnValue = {
  id?: string | null
  label?: string | null
}

export type FeeStructureRowValue = {
  cells?: FeeStructureCellValue[] | null
  emphasis?: FeeStructureRowEmphasis | null
  id?: string | null
  label?: string | null
  note?: string | null
}

export type FeeStructureNoteValue = {
  emphasis?: boolean | null
  id?: string | null
  text?: string | null
}

export type FeeStructureCategoryValue = {
  caption?: string | null
  columns?: FeeStructureColumnValue[] | null
  id?: string | null
  label?: string | null
  notes?: FeeStructureNoteValue[] | null
  rows?: FeeStructureRowValue[] | null
}

export type ResolvedFeeStructureColumn = { id: string; label: string }
export type ResolvedFeeStructureRow = {
  cells: string[]
  emphasis: FeeStructureRowEmphasis
  id: string
  label: string
  note?: string
}
export type ResolvedFeeStructureNote = {
  emphasis: boolean
  id: string
  text: string
}
export type ResolvedFeeStructureCategory = {
  caption?: string
  columns: ResolvedFeeStructureColumn[]
  id: string
  label: string
  notes: ResolvedFeeStructureNote[]
  rows: ResolvedFeeStructureRow[]
}

export type FeeStructureBlockLike = {
  academicSession?: string | null
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'center' | 'left' | null
  description?: string | null
  downloadLabel?: string | null
  eyebrow?: string | null
  feeCategories?: FeeStructureCategoryValue[] | null
  feeDocument?: Media | string | number | null
  footerActions?: CmsActionValue[] | null
  programmeName?: string | null
  size?: RegularBlockSize | null
  tabStyle?: FeeStructureTabStyle | null
  title?: string | null
}
```

- [ ] **Step 5: Implement defensive normalization**

Create `src/blocks/FeeStructure/normalizeFeeStructure.ts`:

```ts
import type {
  FeeStructureCategoryValue,
  ResolvedFeeStructureCategory,
} from './types'

const text = (value?: string | null) => value?.trim() || undefined

export const isNumericFeeValue = (value: string) => /\d/.test(value)

export function normalizeFeeCategories(
  categories?: FeeStructureCategoryValue[] | null,
): ResolvedFeeStructureCategory[] {
  return (categories ?? []).flatMap((category, categoryIndex) => {
    const label = text(category.label)
    const validColumns = (category.columns ?? []).flatMap((column, sourceIndex) => {
      const columnLabel = text(column.label)
      return columnLabel
        ? [{ id: `${column.id ?? `column-${categoryIndex}`}-${sourceIndex}`, label: columnLabel, sourceIndex }]
        : []
    })

    const rows = (category.rows ?? []).flatMap((row, rowIndex) => {
      const rowLabel = text(row.label)
      if (!rowLabel) return []

      return [
        {
          id: `${row.id ?? `row-${categoryIndex}`}-${rowIndex}`,
          label: rowLabel,
          note: text(row.note),
          emphasis: row.emphasis === 'total' ? 'total' : 'standard',
          cells: validColumns.map(({ sourceIndex }) => text(row.cells?.[sourceIndex]?.value) ?? '—'),
        },
      ]
    })

    if (!label || validColumns.length === 0 || rows.length === 0) return []

    const notes = (category.notes ?? []).flatMap((note, noteIndex) => {
      const noteText = text(note.text)
      return noteText
        ? [{ id: `${note.id ?? `note-${categoryIndex}`}-${noteIndex}`, text: noteText, emphasis: note.emphasis === true }]
        : []
    })

    return [
      {
        id: `${category.id ?? 'category'}-${categoryIndex}`,
        label,
        caption: text(category.caption),
        columns: validColumns.map(({ id, label: columnLabel }) => ({ id, label: columnLabel })),
        rows,
        notes,
      },
    ]
  })
}
```

- [ ] **Step 6: Run normalization tests**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "Fee Structure normalization"
```

Expected: PASS with 2 tests.

---

### Task 2: Add the Payload schema and exact row-length validation

**Files:**

- Create: `src/blocks/FeeStructure/config.ts`
- Modify: `src/block-thumbnails/definitions.ts`
- Modify: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Produces `FeeStructureBlock` with slug `feeStructure` and interface `FeeStructureBlock`.
- Produces exported `validateFeeRows: ArrayFieldValidation` for focused contract testing.
- Consumes shared `createBlockAppearanceFields()`, `createContentActionsField()`, and thumbnail metadata.
- The `rows` validator compares each row's `cells.length` with sibling `columns.length` and returns a row-specific error string.

- [ ] **Step 1: Add schema and validator tests**

Add the following helpers and tests to `tests/int/fee-structure.int.spec.tsx`:

```tsx
import { FeeStructureBlock, validateFeeRows } from '@/blocks/FeeStructure/config'

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

describe('FeeStructureBlock schema', () => {
  it('defines the approved identity, tabs, limits, and defaults', () => {
    expect(FeeStructureBlock).toMatchObject({
      slug: 'feeStructure',
      interfaceName: 'FeeStructureBlock',
      labels: { singular: 'Fee Structure', plural: 'Fee Structures' },
    })
    expect(FeeStructureBlock.admin?.images?.thumbnail).toEqual({
      alt: 'Fee Structure block preview',
      url: '/block-thumbnails/fee-structure.jpg',
    })

    const tabs = FeeStructureBlock.fields[0] as TabsField
    expect(tabs.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(findNamedField(FeeStructureBlock.fields, 'programmeName')).toMatchObject({ required: true })
    expect(findNamedField(FeeStructureBlock.fields, 'academicSession')).toMatchObject({ required: true })
    expect(findNamedField(FeeStructureBlock.fields, 'feeCategories')).toMatchObject({
      type: 'array', required: true, minRows: 1, maxRows: 4,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'columns')).toMatchObject({
      type: 'array', required: true, minRows: 1, maxRows: 6,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'rows')).toMatchObject({
      type: 'array', required: true, minRows: 1, maxRows: 30,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'cells')).toMatchObject({
      type: 'array', required: true, minRows: 1, maxRows: 6,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'notes')).toMatchObject({
      type: 'array', maxRows: 8,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'downloadLabel')).toMatchObject({
      defaultValue: 'Download Fee Structure',
    })
  })

  it('requires row cell counts to match the category column count', async () => {
    expect(
      await validateFeeRows([{ cells: [{ value: '1' }, { value: '2' }] }], {
        siblingData: { columns: [{ label: 'Year 1' }, { label: 'Year 2' }] },
      } as never),
    ).toBe(true)
    expect(
      await validateFeeRows([{ cells: [{ value: '1' }] }], {
        siblingData: { columns: [{ label: 'Year 1' }, { label: 'Year 2' }] },
      } as never),
    ).toBe('Fee row 1 must contain exactly 2 values—one for each academic-period column.')
  })

  it('uses only the approved theme controls and hides tab style for one category', () => {
    const tabStyle = findNamedField(FeeStructureBlock.fields, 'tabStyle') as SelectField
    expect(tabStyle).toMatchObject({
      defaultValue: 'underline',
      required: true,
      options: [
        { label: 'Underline', value: 'underline' },
        { label: 'Pills', value: 'pills' },
        { label: 'Boxed', value: 'boxed' },
      ],
    })
    expect(tabStyle.admin?.condition?.({}, { feeCategories: [{}] }, {} as never)).toBe(false)
    expect(tabStyle.admin?.condition?.({}, { feeCategories: [{}, {}] }, {} as never)).toBe(true)
    expect(findNamedField(FeeStructureBlock.fields, 'contentAlignment')).toMatchObject({
      defaultValue: 'left', required: true,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'size')).toMatchObject({
      defaultValue: 'default', required: true,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'headerLayout')).toBeUndefined()
    expect(findNamedField(FeeStructureBlock.fields, 'bankName')).toBeUndefined()
    expect(findNamedField(FeeStructureBlock.fields, 'accountNumber')).toBeUndefined()
    expect(findNamedField(FeeStructureBlock.fields, 'ifsc')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run schema tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "FeeStructureBlock schema"
```

Expected: FAIL because `config.ts` and the `feeStructure` thumbnail definition do not exist.

- [ ] **Step 3: Register thumbnail metadata needed by the config**

Add this definition beside other content/data block definitions in `src/block-thumbnails/definitions.ts`:

```ts
defineThumbnail({
  alt: 'Fee Structure block preview',
  filename: 'fee-structure.jpg',
  label: 'Fee Structure',
  slug: 'feeStructure',
  stageAlignment: 'top',
}),
```

- [ ] **Step 4: Create the Payload config and validator**

Create `src/blocks/FeeStructure/config.ts`. Use `ArrayFieldValidation`, `Block`, `CheckboxField`, `SelectField`, and `TabsField` from Payload. Export this validator exactly:

```ts
type FeeCategorySiblingData = { columns?: unknown[] | null }
type FeeRowInput = { cells?: unknown[] | null }

export const validateFeeRows: ArrayFieldValidation = (value, { siblingData }) => {
  if (!Array.isArray(value)) return true
  const columnCount = Array.isArray((siblingData as FeeCategorySiblingData)?.columns)
    ? (siblingData as FeeCategorySiblingData).columns!.length
    : 0
  const invalidIndex = (value as FeeRowInput[]).findIndex(
    (row) => !Array.isArray(row.cells) || row.cells.length !== columnCount,
  )

  return invalidIndex === -1
    ? true
    : `Fee row ${invalidIndex + 1} must contain exactly ${columnCount} values—one for each academic-period column.`
}
```

Define the category array with these exact nested contracts:

```ts
const feeCategoriesField: ArrayField = {
  name: 'feeCategories',
  label: 'Fee Categories',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 4,
  admin: {
    initCollapsed: true,
    description: 'Add categories such as General and NRI. Each category owns its table and notes.',
  },
  fields: [
    { name: 'label', type: 'text', required: true },
    {
      name: 'caption',
      type: 'textarea',
      admin: { description: 'Optional accessible description for this fee table.' },
    },
    {
      name: 'columns',
      label: 'Academic-period Columns',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      admin: {
        initCollapsed: true,
        description: 'Add ordered labels such as 1st Year through 5th Year.',
      },
      fields: [{ name: 'label', type: 'text', required: true }],
    },
    {
      name: 'rows',
      label: 'Fee Rows',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 30,
      validate: validateFeeRows,
      admin: {
        initCollapsed: true,
        description: 'Cell order must match the academic-period column order above.',
      },
      fields: [
        { name: 'label', label: 'Fee Head', type: 'text', required: true },
        { name: 'note', label: 'Row Note', type: 'text' },
        {
          name: 'emphasis',
          type: 'select',
          defaultValue: 'standard',
          required: true,
          options: [
            { label: 'Standard', value: 'standard' },
            { label: 'Total', value: 'total' },
          ],
        } satisfies SelectField,
        {
          name: 'cells',
          label: 'Values',
          type: 'array',
          required: true,
          minRows: 1,
          maxRows: 6,
          admin: {
            initCollapsed: true,
            description: 'Enter one display value for each column, in the same order.',
          },
          fields: [{ name: 'value', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'notes',
      label: 'Fee Summary Notes',
      type: 'array',
      maxRows: 8,
      admin: {
        initCollapsed: true,
        description: 'Fee-only notes for this category. Do not enter bank or payment-account details.',
      },
      fields: [
        { name: 'text', type: 'textarea', required: true },
        { name: 'emphasis', label: 'Emphasize', type: 'checkbox', defaultValue: false } satisfies CheckboxField,
      ],
    },
  ],
}
```

Export `FeeStructureBlock` with `admin: getBlockThumbnailAdmin('feeStructure')`, the approved identity, and one top-level Tabs field. The Content tab must contain, in order, `eyebrow`, `title`, `accentTitle`, `description`, shared header `actions` (max 2), required `programmeName`, required `academicSession`, `feeCategoriesField`, optional `feeDocument` upload to `media`, conditional `downloadLabel` defaulting to `Download Fee Structure`, and shared `footerActions` (max 2). The Theme Settings tab must contain:

```ts
createBlockAppearanceFields(),
{
  name: 'contentAlignment',
  label: 'Section Content Alignment',
  type: 'select',
  defaultValue: 'left',
  required: true,
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
  ],
} satisfies SelectField,
{
  name: 'tabStyle',
  label: 'Category Tab Style',
  type: 'select',
  defaultValue: 'underline',
  required: true,
  options: [
    { label: 'Underline', value: 'underline' },
    { label: 'Pills', value: 'pills' },
    { label: 'Boxed', value: 'boxed' },
  ],
  admin: {
    condition: (_data, siblingData) =>
      Array.isArray(siblingData?.feeCategories) && siblingData.feeCategories.length > 1,
  },
} satisfies SelectField,
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
```

The `downloadLabel` Admin condition must return true only when `siblingData.feeDocument` is truthy.

- [ ] **Step 5: Run schema and normalizer tests**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "normalization|schema"
```

Expected: PASS for every normalization and schema test.

---

### Task 3: Build the server section and responsive client presentation

**Files:**

- Create: `src/blocks/FeeStructure/FeeStructureClient.tsx`
- Create: `src/blocks/FeeStructure/Component.tsx`
- Modify: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Produces `FeeStructureClient({ categories, tabStyle })` for normalized categories only.
- Produces `FeeStructureBlockComponent(props: FeeStructureBlockLike)` for both production and live preview.
- Consumes `normalizeFeeCategories`, `getMediaAbsoluteUrl`, `resolveCmsActions`, shared content styles, regular spacing, appearance, actions, and footer actions.
- Maintains document order: optional introduction, programme/session context, category presentation, optional file panel, footer actions.

- [ ] **Step 1: Add rendering, interaction, fallback, and download tests**

Add fixtures and tests to `tests/int/fee-structure.int.spec.tsx`:

```tsx
import { FeeStructureBlockComponent } from '@/blocks/FeeStructure/Component'
import type { Media } from '@/payload-types'

const generalCategory = {
  id: 'general',
  label: 'General',
  caption: 'General category fees for MBBS session 2026-27.',
  columns: [{ label: '1st Year' }, { label: '2nd Year' }],
  rows: [
    {
      label: 'Tuition Fee',
      cells: [{ value: '12,75,000' }, { value: '12,75,000' }],
    },
    {
      label: 'Admission Fee',
      note: 'One time',
      cells: [{ value: '1,00,000' }, { value: '—' }],
    },
    {
      label: 'Total',
      emphasis: 'total' as const,
      cells: [{ value: '17,50,000' }, { value: '15,50,000' }],
    },
  ],
  notes: [{ text: 'Total package for 4.5 years: Rs. 71.75 lakhs.', emphasis: true }],
}

const nriCategory = {
  id: 'nri',
  label: 'NRI',
  columns: [{ label: '1st Year' }, { label: '2nd Year' }],
  rows: [
    {
      label: 'Tuition Fee',
      cells: [{ value: 'USD 35,000' }, { value: 'USD 35,000' }],
    },
    {
      label: 'Admission Fee',
      note: 'One time',
      cells: [{ value: '1,00,000' }, { value: '—' }],
    },
  ],
  notes: [{ text: 'Amounts are displayed exactly as published.' }],
}

describe('FeeStructureBlockComponent', () => {
  it('renders one category directly as a desktop table and mobile period cards', () => {
    const html = renderToStaticMarkup(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        programmeName="MBBS"
        title="Fee Structure"
      />,
    )

    expect(html).toContain('data-fee-structure="true"')
    expect(html).toContain('<table')
    expect(html).toContain('<caption')
    expect(html).toContain('General category fees for MBBS session 2026-27.')
    expect(html).toContain('data-fee-structure-desktop="true"')
    expect(html).toContain('data-fee-structure-mobile="true"')
    expect(html.match(/data-fee-period-card="true"/g)).toHaveLength(2)
    expect(html).toContain('data-fee-row-emphasis="total"')
    expect(html).toContain('tabular-nums')
    expect(html).not.toContain('role="tablist"')
  })

  it('uses accessible tabs for multiple categories and keeps notes category-owned', () => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory, nriCategory]}
        programmeName="MBBS"
        tabStyle="pills"
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['General', 'NRI'])
    expect(screen.getByText('Total package for 4.5 years: Rs. 71.75 lakhs.')).toBeTruthy()
    fireEvent.click(screen.getByRole('tab', { name: 'NRI' }))
    expect(screen.getAllByText('USD 35,000').length).toBeGreaterThan(0)
    expect(screen.getByText('Amounts are displayed exactly as published.')).toBeTruthy()
    expect(container.querySelector('[data-fee-tab-style="pills"]')).toBeTruthy()
  })

  it('renders a valid Media download after categories and before footer actions', () => {
    const html = renderToStaticMarkup(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        feeDocument={{ id: 'fees', mimeType: 'application/pdf', url: '/media/fees.pdf' } as Media}
        footerActions={[{ label: 'Admissions', linkType: 'custom', url: '/admissions' }]}
        programmeName="MBBS"
      />,
    )

    expect(html).toContain('href="/media/fees.pdf"')
    expect(html).toContain('download=""')
    expect(html).toContain('Download Fee Structure')
    expect(html.indexOf('data-fee-document="true"')).toBeGreaterThan(
      html.indexOf('data-fee-categories="true"'),
    )
    expect(html.indexOf('data-fee-document="true"')).toBeLessThan(html.indexOf('Admissions'))
  })

  it('omits invalid downloads and incomplete blocks without inventing content', () => {
    expect(
      renderToStaticMarkup(
        <FeeStructureBlockComponent
          academicSession="2026-27"
          feeCategories={[generalCategory]}
          feeDocument="unpopulated-media-id"
          programmeName="MBBS"
        />,
      ),
    ).not.toContain('data-fee-document="true"')
    expect(
      renderToStaticMarkup(
        <FeeStructureBlockComponent academicSession="2026-27" feeCategories={[]} programmeName="MBBS" />,
      ),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        <FeeStructureBlockComponent academicSession=" " feeCategories={[generalCategory]} programmeName="MBBS" />,
      ),
    ).toBe('')
  })

  it('applies appearance, alignment, and spacing fallbacks through shared contracts', () => {
    const html = renderToStaticMarkup(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        appearance={{ background: 'brand', border: 'topAndBottom' }}
        contentAlignment="center"
        feeCategories={[generalCategory]}
        programmeName="MBBS"
        size="compact"
      />,
    )

    expect(html).toContain('bg-brand text-primary-foreground border-y border-border')
    expect(html).toContain('py-8 md:py-10')
    expect(html).toContain('data-content-alignment="center"')
  })
})
```

- [ ] **Step 2: Run component tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx -t "FeeStructureBlockComponent"
```

Expected: FAIL because `Component.tsx` and `FeeStructureClient.tsx` do not exist.

- [ ] **Step 3: Implement the responsive category presentation**

Create `src/blocks/FeeStructure/FeeStructureClient.tsx` with `'use client'`. Import the shadcn Table, Tabs, and Card primitives, `cn`, `isNumericFeeValue`, and resolved types. Normalize `tabStyle` with:

```ts
const resolveTabStyle = (value?: FeeStructureTabStyle | null): FeeStructureTabStyle =>
  value === 'boxed' || value === 'pills' ? value : 'underline'
```

Use style records that retain theme tokens and an intrinsic scrollable rail:

```ts
const tabListClasses: Record<FeeStructureTabStyle, string> = {
  underline: 'h-auto w-max min-w-full justify-start rounded-none border-b border-current/15 bg-transparent p-0',
  pills: 'h-auto w-max min-w-full justify-start rounded-[var(--radius)] bg-current/5 p-1',
  boxed: 'h-auto w-max min-w-full justify-start rounded-[var(--radius)] border border-current/15 bg-transparent p-0',
}

const tabTriggerClasses: Record<FeeStructureTabStyle, string> = {
  underline: 'w-auto shrink-0 rounded-none border-b-2 border-transparent px-4 py-3 text-current/70 shadow-none data-[state=active]:border-current data-[state=active]:bg-transparent data-[state=active]:text-current',
  pills: 'w-auto shrink-0 text-current/70 data-[state=active]:bg-card data-[state=active]:text-card-foreground',
  boxed: 'w-auto shrink-0 rounded-none border-r border-current/15 px-4 py-3 text-current/70 last:border-r-0 data-[state=active]:bg-card data-[state=active]:text-card-foreground',
}
```

Implement `FeeCategoryPresentation` so it renders both breakpoint variants from the same category:

```tsx
function FeeCategoryPresentation({ category }: { category: ResolvedFeeStructureCategory }) {
  return (
    <div className="flex flex-col gap-6" data-fee-category={category.label}>
      <div className="hidden overflow-x-auto pb-2 md:block" data-fee-structure-desktop="true">
        <div className="min-w-max overflow-hidden rounded-[var(--radius)] border border-border bg-card text-card-foreground">
          <Table>
            {category.caption ? <TableCaption>{category.caption}</TableCaption> : null}
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-20 min-w-56 bg-card">Fee Head</TableHead>
                {category.columns.map((column) => (
                  <TableHead className="min-w-36 text-right" key={column.id}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {category.rows.map((row) => (
                <TableRow
                  className={cn(row.emphasis === 'total' && 'bg-muted/60 font-semibold')}
                  data-fee-row-emphasis={row.emphasis}
                  key={row.id}
                >
                  <TableCell className={cn('sticky left-0 z-10 bg-card font-medium', row.emphasis === 'total' && 'bg-muted')}>
                    <span className="block">{row.label}</span>
                    {row.note ? <span className="mt-1 block text-xs font-normal text-current/60">{row.note}</span> : null}
                  </TableCell>
                  {row.cells.map((value, index) => (
                    <TableCell
                      className={cn(isNumericFeeValue(value) && 'text-right tabular-nums')}
                      key={`${row.id}-${category.columns[index]?.id ?? index}`}
                    >
                      {value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="grid gap-4 md:hidden" data-fee-structure-mobile="true">
        {category.columns.map((column, columnIndex) => (
          <Card className="gap-0 rounded-[var(--radius)] border border-border py-0 shadow-none ring-0" data-fee-period-card="true" key={column.id}>
            <CardHeader className="rounded-none border-b border-border px-5 py-4">
              <CardTitle className="font-sans text-lg font-semibold">{column.label}</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border px-5">
              {category.rows.map((row) => (
                <div className={cn('grid grid-cols-[minmax(0,1fr)_auto] gap-4 py-4', row.emphasis === 'total' && 'font-semibold')} data-fee-row-emphasis={row.emphasis} key={row.id}>
                  <div>
                    <p>{row.label}</p>
                    {row.note ? <p className="mt-1 text-xs font-normal text-muted-foreground">{row.note}</p> : null}
                  </div>
                  <p className={cn('text-right', isNumericFeeValue(row.cells[columnIndex] ?? '—') && 'tabular-nums')}>
                    {row.cells[columnIndex] ?? '—'}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {category.notes.length > 0 ? (
        <ul className="space-y-2 text-sm leading-6 text-current/70" data-fee-category-notes="true">
          {category.notes.map((note) => (
            <li className={cn(note.emphasis && 'font-semibold text-current')} key={note.id}>{note.text}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
```

Export the client wrapper with exact one-vs-many behavior:

```tsx
export function FeeStructureClient({
  categories,
  tabStyle,
}: {
  categories: ResolvedFeeStructureCategory[]
  tabStyle?: FeeStructureTabStyle | null
}) {
  const style = resolveTabStyle(tabStyle)
  if (categories.length === 1) {
    return <div data-fee-categories="true"><FeeCategoryPresentation category={categories[0]!} /></div>
  }

  return (
    <Tabs className="gap-6" data-fee-categories="true" data-fee-tab-style={style} defaultValue={categories[0]!.id}>
      <div className="overflow-x-auto pb-1">
        <TabsList aria-label="Fee categories" className={tabListClasses[style]}>
          {categories.map((category) => (
            <TabsTrigger className={tabTriggerClasses[style]} key={category.id} value={category.id}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {categories.map((category) => (
        <TabsContent className="mt-0" key={category.id} value={category.id}>
          <FeeCategoryPresentation category={category} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
```

- [ ] **Step 4: Implement the server-safe section shell and download panel**

Create `src/blocks/FeeStructure/Component.tsx`. Resolve `programmeName`, `academicSession`, and normalized categories first and return `null` if any are absent. Normalize alignment, size, and tab style to approved defaults. The section must use `resolveBlockAppearanceClasses`, `regularBlockMobilePaddingClasses`, `regularBlockContainerClasses`, `SectionEyebrow`, `contentIntroClasses`, `contentSectionHeadingClasses`, `contentSectionDescriptionClasses`, `ContentActions`, `BlockFooterActions`, and `resolveCmsActions`.

Use this section composition:

```tsx
export function FeeStructureBlockComponent({
  academicSession,
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'left',
  description,
  downloadLabel = 'Download Fee Structure',
  eyebrow,
  feeCategories,
  feeDocument,
  footerActions,
  programmeName,
  size = 'default',
  tabStyle = 'underline',
  title,
}: FeeStructureBlockLike) {
  const resolvedProgramme = programmeName?.trim()
  const resolvedSession = academicSession?.trim()
  const categories = normalizeFeeCategories(feeCategories)
  if (!resolvedProgramme || !resolvedSession || categories.length === 0) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const alignment = contentAlignment === 'center' ? 'center' : 'left'
  const resolvedSize = size === 'none' || size === 'compact' || size === 'comfortable' ? size : 'default'
  const resolvedActions = resolveCmsActions(actions)
  const fileURL = getMediaAbsoluteUrl(feeDocument)
  const fileLabel = downloadLabel?.trim() || 'Download Fee Structure'
  const hasHeader = Boolean(eyebrow?.trim() || title?.trim() || description?.trim() || resolvedActions.length)

  return (
    <section className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClasses.className)} data-fee-structure="true">
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-8 md:gap-10')}>
        {hasHeader ? (
          <div className={cn(contentIntroClasses, alignment === 'center' ? 'mx-auto items-center text-center' : 'items-start text-left')} data-content-alignment={alignment}>
            {eyebrow?.trim() ? <SectionEyebrow surface={appearanceClasses.background}>{eyebrow.trim()}</SectionEyebrow> : null}
            {title?.trim() ? (
              <h2 className={contentSectionHeadingClasses}>
                {accentTitle?.trim() ? <><span className="block">{title.trim()}</span><em className="block">{accentTitle.trim()}</em></> : title.trim()}
              </h2>
            ) : null}
            {description?.trim() ? <p className={contentSectionDescriptionClasses}>{description.trim()}</p> : null}
            <ContentActions actions={resolvedActions} alignment={alignment} />
          </div>
        ) : null}

        <dl className={cn('flex flex-wrap gap-x-8 gap-y-3 border-y border-current/15 py-4', alignment === 'center' && 'justify-center text-center')} data-fee-context="true">
          <div><dt className="font-mono text-xs uppercase tracking-[0.14em] text-current/60">Programme</dt><dd className="mt-1 font-semibold">{resolvedProgramme}</dd></div>
          <div><dt className="font-mono text-xs uppercase tracking-[0.14em] text-current/60">Academic Session</dt><dd className="mt-1 font-semibold tabular-nums">{resolvedSession}</dd></div>
        </dl>

        <FeeStructureClient categories={categories} tabStyle={tabStyle} />

        {fileURL ? (
          <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-current/15 p-5 sm:flex-row sm:items-center sm:justify-between" data-fee-document="true">
            <div className="flex items-center gap-3"><FileText aria-hidden="true" className="size-5" /><p className="font-semibold">Official fee structure</p></div>
            <Button asChild variant="outline">
              <a download href={fileURL}><Download aria-hidden="true" data-icon="inline-start" />{fileLabel}</a>
            </Button>
          </div>
        ) : null}

        <BlockFooterActions actions={footerActions} alignment={alignment} className="mt-0" />
      </div>
    </section>
  )
}
```

Import `Download` and `FileText` from `lucide-react` plus the shared `Button`. Do not add a client directive to this file.

- [ ] **Step 5: Run the complete focused test file**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx
```

Expected: every normalization, schema, server-rendering, and tab-interaction test passes.

---

### Task 4: Register the block and generate Payload contracts

**Files:**

- Modify: `src/collections/Pages.ts`
- Modify: `src/collections/ReusableSections.ts`
- Modify: `src/blocks/renderPageBlocks.tsx`
- Modify: `src/blocks/renderLivePreviewPageBlocks.tsx`
- Modify: `src/payload-types.ts` (generated)
- Modify: `src/app/(payload)/admin/importMap.js` only if `pnpm generate:importmap` produces a deterministic change
- Modify: `tests/int/page-blocks.int.spec.ts`
- Modify: `tests/int/fee-structure.int.spec.tsx`

**Interfaces:**

- Pages and Reusable Sections expose `feeStructure` once in matching order.
- Production wraps `FeeStructureBlockComponent` with the existing `BlockErrorBoundary`; live preview renders the same component directly.
- Generated `Page['layout']` includes `FeeStructureBlock` and narrows both renderer switches without casts.

- [ ] **Step 1: Extend registration and renderer-parity tests first**

In `tests/int/page-blocks.int.spec.ts`, update the current Page block count from `52` to `53` and add:

```ts
expect(registeredSlugs).toContain('feeStructure')
```

The existing loop must continue checking every registered slug against both renderers. Add this test to `tests/int/fee-structure.int.spec.tsx`:

```tsx
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'

it('renders through production and live-preview pipelines', () => {
  const block = {
    blockType: 'feeStructure',
    academicSession: '2026-27',
    feeCategories: [generalCategory],
    programmeName: 'MBBS',
  } as never
  const production = renderToStaticMarkup(renderPageBlocks([block]))
  const preview = renderToStaticMarkup(
    renderLivePreviewPageBlocks([block], {} as never, {} as never, [], []),
  )

  expect(production).toContain('data-page-block-stack="true"')
  expect(production).toContain('data-fee-structure="true"')
  expect(preview).toContain('data-page-block-stack="true"')
  expect(preview).toContain('data-fee-structure="true"')
})
```

- [ ] **Step 2: Run registration tests and verify failure**

Run:

```bash
pnpm exec vitest run tests/int/page-blocks.int.spec.ts tests/int/fee-structure.int.spec.tsx
```

Expected: FAIL because Page/Reusable registration and renderer cases do not contain `feeStructure`.

- [ ] **Step 3: Register the schema in both collections**

Add to both collection import groups:

```ts
import { FeeStructureBlock } from '@/blocks/FeeStructure/config'
```

Insert `FeeStructureBlock` immediately after `DownloadListBlock` in the Page and Reusable Section `blocks` arrays. Keep `ReusableSectionBlock` excluded from Reusable Sections exactly as before.

- [ ] **Step 4: Generate Payload types before narrowing renderer switches**

Run:

```bash
pnpm generate:types
```

Expected: `src/payload-types.ts` gains `FeeStructureBlock`, its nested category/column/row/cell/note fields, and includes it in Page and Reusable Section layout unions.

- [ ] **Step 5: Add production and live-preview renderer cases**

Import the production component in both renderer files:

```ts
import { FeeStructureBlockComponent } from './FeeStructure/Component'
```

Add after `downloadList` in `src/blocks/renderPageBlocks.tsx`:

```tsx
case 'feeStructure':
  return wrap(<FeeStructureBlockComponent {...block} />)
```

Add after `downloadList` in `src/blocks/renderLivePreviewPageBlocks.tsx`:

```tsx
case 'feeStructure':
  return <FeeStructureBlockComponent key={key} {...block} />
```

- [ ] **Step 6: Regenerate and inspect the Admin import map**

Run:

```bash
pnpm generate:importmap
```

Expected: command succeeds. Because this block does not add a custom Payload Admin component, no new Fee Structure import-map entry is expected; retain only deterministic generator output if the file changes.

- [ ] **Step 7: Run registration, renderer, and focused tests**

Run:

```bash
pnpm exec vitest run tests/int/page-blocks.int.spec.ts tests/int/fee-structure.int.spec.tsx
```

Expected: all tests pass, the Page block count is 53, and both renderer pipelines include Fee Structure.

---

### Task 5: Add the picker fixture, generated thumbnail, documentation, and final verification

**Files:**

- Modify: `src/block-thumbnails/fixtures.tsx`
- Create: `public/block-thumbnails/fee-structure.jpg` (generated)
- Modify: `tests/int/block-thumbnails.int.spec.ts`
- Modify: `docs/guides/blocks.md`
- Modify: `docs/architecture/feature-inventory.md`
- Modify: `.agents/skills/project-context/references/block-system.md`
- Modify: `.agents/skills/project-context/references/project-inventory.json` (generated)
- Test: `tests/int/block-thumbnail-fixtures.int.spec.ts`
- Test: `tests/int/project-context-repository.int.spec.ts`

**Interfaces:**

- Thumbnail metadata, fixture keys, generated JPEGs, registered blocks, and operator documentation remain one-to-one.
- The fixture uses the production component and only fee-related MBBS 2026-27 data.
- Documentation states the no-calculation/no-inference and no-bank-details boundaries.

- [ ] **Step 1: Add failing thumbnail metadata assertions**

Add to `tests/int/block-thumbnails.int.spec.ts` inside the metadata command test:

```ts
expect(getBlockThumbnailDefinition('feeStructure')).toMatchObject({
  alt: 'Fee Structure block preview',
  filename: 'fee-structure.jpg',
  label: 'Fee Structure',
  slug: 'feeStructure',
  stageAlignment: 'top',
})
```

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: FAIL because the fixture and `public/block-thumbnails/fee-structure.jpg` are missing.

- [ ] **Step 2: Add the production-component thumbnail fixture**

Import `FeeStructureBlockComponent` into `src/block-thumbnails/fixtures.tsx` and add the `feeStructure` key. Use this fee-only fixture:

```tsx
feeStructure: (
  <FeeStructureBlockComponent
    academicSession="2026-27"
    appearance={{ background: 'subtle', border: 'topAndBottom' }}
    description="Official programme fees arranged by category and academic year."
    eyebrow="Admissions"
    feeCategories={[
      {
        label: 'General',
        caption: 'General category fee structure for MBBS, session 2026-27.',
        columns: [
          { label: '1st Year' },
          { label: '2nd Year' },
          { label: '3rd Year' },
          { label: '4th Year' },
          { label: '5th Year' },
        ],
        rows: [
          {
            label: 'Tuition Fee',
            cells: [
              { value: '12,75,000' }, { value: '12,75,000' }, { value: '12,75,000' },
              { value: '12,75,000' }, { value: '6,37,500' },
            ],
          },
          {
            label: 'Admission Fee', note: 'One time',
            cells: [{ value: '1,00,000' }, { value: '—' }, { value: '—' }, { value: '—' }, { value: '—' }],
          },
          {
            label: 'Accommodation and Fooding etc.',
            cells: [
              { value: '2,75,000' }, { value: '2,75,000' }, { value: '2,75,000' },
              { value: '2,75,000' }, { value: '1,37,500' },
            ],
          },
          {
            label: 'Total', emphasis: 'total',
            cells: [
              { value: '17,50,000' }, { value: '15,50,000' }, { value: '15,50,000' },
              { value: '15,50,000' }, { value: '7,75,000' },
            ],
          },
        ],
        notes: [{ text: 'Total package for 4.5 years: Rs. 71.75 lakhs.', emphasis: true }],
      },
      {
        label: 'NRI',
        columns: [
          { label: '1st Year' }, { label: '2nd Year' }, { label: '3rd Year' },
          { label: '4th Year' }, { label: '5th Year' },
        ],
        rows: [
          {
            label: 'Tuition Fee',
            cells: [
              { value: 'USD 35,000' }, { value: 'USD 35,000' }, { value: 'USD 35,000' },
              { value: 'USD 35,000' }, { value: 'USD 17,500' },
            ],
          },
        ],
      },
    ]}
    feeDocument={{ id: 'fee-structure-pdf', mimeType: 'application/pdf', url: '#fee-structure' } as Media}
    programmeName="MBBS"
    size="compact"
    title="Fee Structure"
  />
),
```

Do not add payment instructions, bank details, an NRI total, or inferred currency prefixes to the fixture.

- [ ] **Step 3: Generate only the Fee Structure JPEG**

Run:

```bash
BLOCK_THUMBNAIL_SLUG=feeStructure pnpm generate:block-thumbnails
```

Expected: `public/block-thumbnails/fee-structure.jpg` is generated as a 1600×900 JPEG from the production component fixture.

- [ ] **Step 4: Verify thumbnail contracts**

Run:

```bash
pnpm exec vitest run tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts
```

Expected: every registered definition has one fixture and one exact 1600×900 JPEG.

- [ ] **Step 5: Update operator and architecture documentation**

Add a `Fee Structure` row to `docs/guides/blocks.md` immediately after Download List:

```md
| Fee Structure | One programme's fees for one academic session | One to four category tabs, configurable academic-period columns and fee rows, desktop table, mobile period cards, fee-only category notes, and an optional official file download |
```

Add an operator paragraph stating that cells are display text, every row must match the category's column count, totals are manual, missing values must be authored rather than inferred, category notes stay with their category, and bank/payment-account details must not be entered.

In `docs/architecture/feature-inventory.md`, correct the current Page count to `53`, include both the already-registered `Gallery Album Tabs` and new `Fee Structure` in the normal Page list, and add:

```md
Fee Structure models one programme and one academic session per block. Editors configure one to four fee categories with ordered period columns, fee rows, text values, manual total emphasis, category-owned fee notes, and an optional Media download. Runtime normalization never calculates totals, converts currencies, infers missing values, or exposes bank/payment-account fields. Tablet and desktop render a semantic horizontally scrollable table with a sticky fee-head column; mobile renders one card per period from the same normalized values.
```

In `.agents/skills/project-context/references/block-system.md`, update the registered Page count and ordered slug list to include `galleryAlbumTabs` and `feeStructure`, then add the same runtime/authoring contract in the block narrative section.

- [ ] **Step 6: Run the mandatory project-context update/check loop**

Run:

```bash
pnpm project-context:update
pnpm project-context:check
```

Expected: `project-inventory.json` records the Fee Structure files, registrations, renderer cases, test, and thumbnail. The check passes. Inspect generated changes and retain only project-context files that changed because of this feature.

- [ ] **Step 7: Run formatting and static verification**

Run:

```bash
pnpm exec prettier --write src/blocks/FeeStructure src/components/ui/table.tsx src/components/ui/tabs.tsx tests/int/fee-structure.int.spec.tsx src/collections/Pages.ts src/collections/ReusableSections.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
pnpm exec tsc --noEmit --pretty false
pnpm lint
git diff --check
```

Expected: Prettier succeeds; TypeScript and ESLint exit 0; `git diff --check` reports no whitespace errors.

- [ ] **Step 8: Run focused, neighboring, and full integration contracts**

Run:

```bash
pnpm exec vitest run tests/int/fee-structure.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts tests/int/block-thumbnail-fixtures.int.spec.ts tests/int/theme-contracts.int.spec.ts
pnpm test:int
```

Expected: all focused contracts and the complete integration suite pass.

- [ ] **Step 9: Perform responsive visual QA**

Run `pnpm dev`, open `/block-thumbnail-previews/feeStructure`, and inspect at widths 390, 834, and 1440 pixels. Confirm:

- 390: tabs scroll horizontally, one academic-period Card appears per column, values remain paired with the correct fee head, and totals are emphasized.
- 834 and 1440: the semantic table replaces cards, the first Fee Head column remains visible during horizontal scrolling, numbers align right with tabular numerals, and no content clips.
- Every width: General notes do not appear in NRI, the download follows category content, footer actions remain last, keyboard focus is visible, and brand/subtle/dark surfaces retain readable contrast.

Stop the development server after inspection.

- [ ] **Step 10: Review the final working tree without staging or committing**

Run:

```bash
git status --short
git diff --stat
git diff -- src/blocks/FeeStructure src/components/ui/table.tsx src/components/ui/tabs.tsx src/collections/Pages.ts src/collections/ReusableSections.ts src/blocks/renderPageBlocks.tsx src/blocks/renderLivePreviewPageBlocks.tsx src/block-thumbnails/definitions.ts src/block-thumbnails/fixtures.tsx tests/int/fee-structure.int.spec.tsx tests/int/page-blocks.int.spec.ts tests/int/block-thumbnails.int.spec.ts docs/guides/blocks.md docs/architecture/feature-inventory.md .agents/skills/project-context/references/block-system.md
```

Expected: only the approved Fee Structure implementation/generated artifacts plus the user's pre-existing unrelated changes are present. Do not run `git add` or `git commit`.
