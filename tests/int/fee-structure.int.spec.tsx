import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Field, GroupField, SelectField, TabsField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { FeeStructureBlockComponent } from '@/blocks/FeeStructure/Component'
import { FeeStructureBlock, validateFeeRows } from '@/blocks/FeeStructure/config'
import {
  isNumericFeeValue,
  normalizeFeeCategories,
  normalizeProgrammeDetails,
} from '@/blocks/FeeStructure/normalizeFeeStructure'
import { renderLivePreviewPageBlocks } from '@/blocks/renderLivePreviewPageBlocks'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import type { Media } from '@/payload-types'

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

describe('Fee Structure normalization', () => {
  it('normalizes Atlas details and category-owned programme expense without deriving values', () => {
    expect(
      normalizeProgrammeDetails([
        { id: 'duration', label: ' Programme Duration ', value: ' 4.5 Years ' },
        { label: ' ', value: 'ignored' },
        { label: 'Location', value: ' ' },
      ]),
    ).toEqual([{ id: 'duration-0', label: 'Programme Duration', value: '4.5 Years' }])

    expect(
      normalizeFeeCategories([
        {
          label: ' General ',
          completeProgrammeExpenseLabel: ' Complete programme expense ',
          completeProgrammeExpense: ' ₹71.75 lakh ',
          completeProgrammeExpenseNote: ' Official 4.5-year package ',
          columns: [{ label: '1st Year' }],
          rows: [{ label: 'Total', emphasis: 'total', cells: [{ value: '17,50,000' }] }],
        },
      ]),
    ).toMatchObject([
      {
        completeProgrammeExpenseLabel: 'Complete programme expense',
        completeProgrammeExpense: '₹71.75 lakh',
        completeProgrammeExpenseNote: 'Official 4.5-year package',
      },
    ])
  })

  it('trims authored values, preserves mixed currencies, and aligns cells to valid columns', () => {
    expect(
      normalizeFeeCategories([
        {
          id: 'general',
          label: ' General ',
          caption: ' Official general-category fees ',
          columns: [{ label: ' 1st Year ' }, { label: '   ' }, { label: ' 2nd Year ' }],
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
          notes: [{ text: ' Total package: Rs. 71.75 lakhs ', emphasis: true }, { text: '   ' }],
        },
        { label: 'Invalid', columns: [], rows: [] },
      ]),
    ).toEqual([
      {
        id: 'general-0',
        label: 'General',
        caption: 'Official general-category fees',
        completeProgrammeExpense: undefined,
        completeProgrammeExpenseLabel: 'Complete programme expense',
        completeProgrammeExpenseNote: undefined,
        columns: [
          { id: 'column-0-0', label: '1st Year' },
          { id: 'column-0-2', label: '2nd Year' },
        ],
        rows: [
          {
            id: 'tuition-0',
            label: 'Tuition Fee',
            note: undefined,
            emphasis: 'standard',
            cells: ['Rs. 12,75,000', 'USD 35,000'],
          },
          {
            id: 'row-0-1',
            label: 'Total',
            note: undefined,
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
    expect(findNamedField(FeeStructureBlock.fields, 'programmeName')).toMatchObject({
      required: true,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'academicSession')).toMatchObject({
      required: true,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'layout')).toMatchObject({
      defaultValue: 'table',
      required: true,
      options: [
        { label: 'Table & Mobile Cards', value: 'table' },
        { label: 'Programme Cost Atlas', value: 'programmeCostAtlas' },
      ],
    })
    expect(findNamedField(FeeStructureBlock.fields, 'programmeDetails')).toMatchObject({
      type: 'array',
      defaultValue: [
        {
          label: 'Programme Duration',
          value: '4.5 Years',
        },
      ],
      maxRows: 4,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'completeProgrammeExpenseLabel')).toMatchObject(
      {
        defaultValue: 'Complete programme expense',
      },
    )
    expect(findNamedField(FeeStructureBlock.fields, 'completeProgrammeExpense')).toMatchObject({
      type: 'text',
      required: true,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'completeProgrammeExpenseNote')).toMatchObject({
      type: 'textarea',
    })
    expect(findNamedField(FeeStructureBlock.fields, 'feeCategories')).toMatchObject({
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 4,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'columns')).toMatchObject({
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'rows')).toMatchObject({
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 30,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'cells')).toMatchObject({
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'notes')).toMatchObject({
      type: 'array',
      maxRows: 8,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'downloadLabel')).toMatchObject({
      defaultValue: 'Download Fee Structure',
    })

    for (const name of [
      'programmeDetails',
      'completeProgrammeExpenseLabel',
      'completeProgrammeExpense',
      'completeProgrammeExpenseNote',
    ]) {
      const field = findNamedField(FeeStructureBlock.fields, name)
      expect(
        field && 'admin' in field
          ? field.admin?.condition?.({}, {}, { blockData: { layout: 'table' } } as never)
          : undefined,
      ).toBe(false)
      expect(
        field && 'admin' in field
          ? field.admin?.condition?.({}, {}, {
              blockData: { layout: 'programmeCostAtlas' },
            } as never)
          : undefined,
      ).toBe(true)
    }
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
    const tabWidth = findNamedField(FeeStructureBlock.fields, 'tabWidth') as SelectField
    const downloadActionMode = findNamedField(
      FeeStructureBlock.fields,
      'downloadActionMode',
    ) as SelectField
    const downloadButtonVariant = findNamedField(
      FeeStructureBlock.fields,
      'downloadButtonVariant',
    ) as SelectField
    const downloadAppearance = findNamedField(
      FeeStructureBlock.fields,
      'downloadAppearance',
    ) as GroupField

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
    expect(tabWidth).toMatchObject({
      defaultValue: 'content',
      required: true,
      options: [
        { label: 'Content Width', value: 'content' },
        { label: 'Centered Auto Width', value: 'centered' },
        { label: 'Equal Full Width', value: 'equal' },
      ],
    })
    expect(tabWidth.admin?.condition?.({}, { feeCategories: [{}] }, {} as never)).toBe(false)
    expect(tabWidth.admin?.condition?.({}, { feeCategories: [{}, {}] }, {} as never)).toBe(true)
    expect(downloadActionMode).toMatchObject({
      defaultValue: 'button',
      required: true,
      options: [
        { label: 'Link', value: 'link' },
        { label: 'Button', value: 'button' },
      ],
    })
    expect(downloadActionMode.admin?.condition?.({}, { feeDocument: null }, {} as never)).toBe(
      false,
    )
    expect(downloadActionMode.admin?.condition?.({}, { feeDocument: 'fees' }, {} as never)).toBe(
      true,
    )
    expect(downloadButtonVariant).toMatchObject({
      defaultValue: 'outline',
      required: true,
    })
    expect(
      downloadButtonVariant.admin?.condition?.(
        {},
        { downloadActionMode: 'link', feeDocument: 'fees' },
        {} as never,
      ),
    ).toBe(false)
    expect(
      downloadButtonVariant.admin?.condition?.(
        {},
        { downloadActionMode: 'button', feeDocument: 'fees' },
        {} as never,
      ),
    ).toBe(true)
    expect(downloadAppearance).toMatchObject({
      label: 'Document Container Appearance',
      type: 'group',
    })
    expect(downloadAppearance.fields).toHaveLength(1)
    expect(findNamedField(downloadAppearance.fields, 'background')).toMatchObject({
      defaultValue: 'none',
      required: true,
    })
    expect(downloadAppearance.admin?.condition?.({}, { feeDocument: null }, {} as never)).toBe(
      false,
    )
    expect(downloadAppearance.admin?.condition?.({}, { feeDocument: 'fees' }, {} as never)).toBe(
      true,
    )
    expect(findNamedField(FeeStructureBlock.fields, 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
      required: true,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'size')).toMatchObject({
      defaultValue: 'default',
      required: true,
    })
    expect(findNamedField(FeeStructureBlock.fields, 'headerLayout')).toBeUndefined()
    expect(findNamedField(FeeStructureBlock.fields, 'bankName')).toBeUndefined()
    expect(findNamedField(FeeStructureBlock.fields, 'accountNumber')).toBeUndefined()
    expect(findNamedField(FeeStructureBlock.fields, 'ifsc')).toBeUndefined()
  })
})

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

const atlasCategory = {
  id: 'general-atlas',
  label: 'General',
  caption: 'Official General category fee statement for MBBS session 2026-27.',
  completeProgrammeExpenseLabel: 'Complete programme expense',
  completeProgrammeExpense: '₹71.75 lakh',
  completeProgrammeExpenseNote: 'Official 4.5-year package.',
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
        { value: '12,75,000' },
        { value: '12,75,000' },
        { value: '12,75,000' },
        { value: '12,75,000' },
        { value: '6,37,500' },
      ],
    },
    {
      label: 'Security Money',
      note: 'One-time charge',
      cells: [
        { value: '1,00,000' },
        { value: '—' },
        { value: '—' },
        { value: '—' },
        { value: '—' },
      ],
    },
    {
      label: 'Total',
      emphasis: 'total' as const,
      cells: [
        { value: '17,50,000' },
        { value: '15,50,000' },
        { value: '15,50,000' },
        { value: '15,50,000' },
        { value: '7,75,000' },
      ],
    },
    {
      label: 'Hostel Total',
      emphasis: 'total' as const,
      cells: [
        { value: '2,00,000' },
        { value: '2,00,000' },
        { value: '2,00,000' },
        { value: '2,00,000' },
        { value: '1,00,000' },
      ],
    },
  ],
  notes: [{ text: 'Amounts are displayed exactly as officially published.', emphasis: true }],
}

describe('FeeStructureBlockComponent', () => {
  it('renders the Programme Cost Atlas with the approved 50/50 editorial hierarchy', () => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[atlasCategory]}
        feeDocument={{ id: 'fees', url: '/media/fees.pdf' } as Media}
        layout="programmeCostAtlas"
        programmeDetails={[
          { label: 'Programme Duration', value: '4.5 Years' },
          { label: 'Campus', value: 'Saharsa, Bihar' },
        ]}
        programmeName="MBBS"
      />,
    )

    const atlas = container.querySelector('[data-fee-atlas="true"]')
    const summary = container.querySelector('[data-fee-atlas-summary="true"]')
    const summaryHTML = summary?.innerHTML ?? ''
    const atlasTitles = Array.from(container.querySelectorAll('[data-fee-atlas-title="true"]'))
    const statementTitle = container.querySelector(
      '[data-fee-atlas-statement-header="true"] [data-fee-atlas-title="true"]',
    )
    const periodLabels = Array.from(container.querySelectorAll('[data-fee-atlas-period="true"] dt'))
    const periodValues = Array.from(
      container.querySelectorAll('[data-fee-atlas-period="true"] [data-fee-value="true"]'),
    )
    const annualTotalsGrid = container.querySelector(
      '[data-fee-atlas-annual-totals="true"] [data-fee-atlas-period-grid="true"]',
    )
    const annualTotalPeriods = Array.from(
      container.querySelectorAll(
        '[data-fee-atlas-annual-totals="true"] [data-fee-atlas-period="true"]',
      ),
    )
    const statementChapters = Array.from(
      container.querySelectorAll('[data-fee-atlas-fee-chapter="true"]'),
    )
    const statementPeriodGrids = Array.from(
      container.querySelectorAll(
        '[data-fee-atlas-statement="true"] [data-fee-atlas-period-grid="true"]',
      ),
    )
    const statementPeriods = Array.from(
      container.querySelectorAll(
        '[data-fee-atlas-statement="true"] [data-fee-atlas-period="true"]',
      ),
    )
    const statementChapterHeadings = Array.from(
      container.querySelectorAll('[data-fee-atlas-fee-chapter-heading="true"]'),
    )

    expect(atlas?.className).toContain('lg:grid-cols-2')
    expect(summary).toBeTruthy()
    expect(summary?.className).toContain('bg-primary')
    expect(container.querySelector('[data-fee-atlas-statement="true"]')).toBeTruthy()
    expect(container.querySelector('[data-fee-atlas-statement="true"]')?.className).toContain(
      'bg-card',
    )
    expect(container.querySelector('[data-fee-atlas-annual-totals="true"]')).toBeTruthy()
    expect(
      container.querySelector('[data-fee-atlas-complete-expense="true"]')?.textContent,
    ).toContain('₹71.75 lakh')
    expect(summary?.querySelector('[data-fee-document="true"]')).toBeTruthy()
    expect(container.querySelectorAll('[data-fee-atlas-fee-chapter="true"]')).toHaveLength(3)
    expect(atlasTitles.length).toBeGreaterThan(0)
    expect(statementTitle?.textContent).toBe('General')
    expect(statementTitle?.textContent).not.toContain('fee heads')
    expect(atlasTitles.every((element) => element.className.includes('font-sans'))).toBe(true)
    expect(atlasTitles.every((element) => !element.className.includes('font-serif'))).toBe(true)
    expect(
      atlasTitles.every(
        (element) =>
          !element.className.includes('text-3xl') && !element.className.includes('text-4xl'),
      ),
    ).toBe(true)
    expect(periodLabels.every((element) => element.className.includes('text-left'))).toBe(true)
    expect(periodValues.every((element) => element.className.includes('text-left'))).toBe(true)
    expect(periodValues.every((element) => !element.className.includes('text-right'))).toBe(true)
    expect(container.querySelector('[data-fee-atlas-summary-inner="true"]')?.className).toContain(
      'sm:p-8',
    )
    expect(
      container.querySelector('[data-fee-atlas-statement-header="true"]')?.className,
    ).toContain('sm:p-8')
    const completeExpense = container.querySelector(
      '[data-fee-atlas-complete-expense-value="true"]',
    )
    expect(completeExpense?.className).toContain('font-sans')
    expect(completeExpense?.className).toContain('text-2xl')
    expect(completeExpense?.className).toContain('text-left')
    expect(completeExpense?.className).toContain('tabular-nums')
    expect(annualTotalsGrid?.getAttribute('data-fee-atlas-period-density')).toBe('default')
    expect(annualTotalPeriods.every((element) => element.className.includes('py-4'))).toBe(true)
    expect(annualTotalPeriods.every((element) => !element.className.includes('py-3'))).toBe(true)
    expect(annualTotalPeriods.every((element) => element.className.includes('px-3'))).toBe(true)
    expect(annualTotalPeriods.every((element) => !element.className.includes('first:pl-0'))).toBe(
      true,
    )
    expect(annualTotalPeriods.every((element) => !element.className.includes('last:pr-0'))).toBe(
      true,
    )
    const finalOddPeriod = annualTotalPeriods.at(-1)
    expect(finalOddPeriod?.getAttribute('data-fee-atlas-compact-divider')).toBe('true')
    expect(finalOddPeriod?.className).toContain('after:left-1/2')
    expect(finalOddPeriod?.className).toContain('after:border-l')
    expect(finalOddPeriod?.className).toContain('lg:after:hidden')
    expect(statementPeriodGrids).toHaveLength(3)
    expect(
      statementPeriodGrids.every(
        (element) => element.getAttribute('data-fee-atlas-period-density') === 'compact',
      ),
    ).toBe(true)
    expect(statementPeriods.every((element) => element.className.includes('py-3'))).toBe(true)
    expect(statementPeriods.every((element) => !element.className.includes('py-4'))).toBe(true)
    expect(statementChapters.every((element) => element.className.includes('px-6'))).toBe(true)
    expect(statementChapters.every((element) => element.className.includes('py-5'))).toBe(true)
    expect(statementChapters.every((element) => element.className.includes('sm:px-8'))).toBe(true)
    expect(statementChapters.every((element) => element.className.includes('sm:py-5'))).toBe(true)
    expect(statementChapters.every((element) => !element.className.includes('sm:p-8'))).toBe(true)
    expect(
      statementChapters.every((element) => element.className.includes('hover:bg-accent/35')),
    ).toBe(true)
    expect(statementChapterHeadings).toHaveLength(3)
    expect(statementChapterHeadings.every((element) => element.className.includes('mb-3'))).toBe(
      true,
    )
    expect(periodLabels.every((element) => element.className.includes('font-mono'))).toBe(true)
    expect(periodLabels.every((element) => element.className.includes('text-xs'))).toBe(true)
    expect(periodLabels.every((element) => element.className.includes('font-medium'))).toBe(true)
    expect(periodLabels.every((element) => element.className.includes('tracking-[0.14em]'))).toBe(
      true,
    )
    const standardFeeTitle = container.querySelector(
      '[data-fee-atlas-fee-chapter="true"][data-fee-row-emphasis="standard"] [data-fee-row-label="true"]',
    )
    expect(standardFeeTitle?.className).toContain('font-sans')
    expect(standardFeeTitle?.className).toContain('text-sm')
    expect(standardFeeTitle?.className).toContain('sm:text-sm')
    expect(standardFeeTitle?.className).toContain('leading-tight')
    expect(standardFeeTitle?.className).toContain('font-medium')
    const totalFeeTitle = container.querySelector(
      '[data-fee-atlas-fee-chapter="true"][data-fee-row-emphasis="total"] [data-fee-row-label="true"]',
    )
    expect(totalFeeTitle?.className).toContain('text-sm')
    expect(totalFeeTitle?.className).toContain('sm:text-sm')
    expect(totalFeeTitle?.className).toContain('font-bold')
    expect(screen.getAllByText('Tuition Fee')).toHaveLength(1)
    expect(screen.getAllByText('1st Year').length).toBeGreaterThan(1)
    expect(summaryHTML.indexOf('Programme details')).toBeLessThan(
      summaryHTML.indexOf('Annual totals'),
    )
    expect(container.querySelector('[data-fee-atlas-notes="true"]')).toBeNull()
    expect(summaryHTML.indexOf('Annual totals')).toBeLessThan(
      summaryHTML.indexOf('Complete programme expense'),
    )
    expect(summaryHTML.indexOf('Complete programme expense')).toBeLessThan(
      summaryHTML.indexOf('data-fee-document="true"'),
    )
    expect(
      Array.from(
        container.querySelectorAll('[data-fee-atlas-statement="true"] [data-fee-row-label="true"]'),
      ).map((element) => element.textContent),
    ).toEqual(['Tuition Fee', 'Security Money', 'Hostel Total'])
    expect(container.querySelector('[data-fee-atlas-statement="true"]')?.textContent).toContain(
      'Hostel Total',
    )
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('[data-fee-context="true"]')).toBeNull()
  })

  it('does not draw a compact center divider for a single-period Atlas grid', () => {
    const singlePeriodCategory = {
      ...atlasCategory,
      columns: atlasCategory.columns.slice(0, 1),
      rows: atlasCategory.rows.map((row) => ({
        ...row,
        cells: row.cells.slice(0, 1),
      })),
    }
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[singlePeriodCategory]}
        layout="programmeCostAtlas"
        programmeName="MBBS"
      />,
    )

    expect(container.querySelector('[data-fee-atlas-compact-divider="true"]')).toBeNull()
    expect(container.querySelector('[data-fee-atlas-period="true"]')?.className).toContain(
      'col-span-2',
    )
  })

  it('keeps the Atlas frame and authored fee chapters when optional summary regions are absent', () => {
    const category = {
      ...atlasCategory,
      completeProgrammeExpense: undefined,
      completeProgrammeExpenseNote: undefined,
      notes: [],
      rows: atlasCategory.rows.filter((row) => row.emphasis !== 'total'),
    }
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[category]}
        layout="programmeCostAtlas"
        programmeName="MBBS"
      />,
    )

    expect(container.querySelector('[data-fee-atlas="true"]')).toBeTruthy()
    expect(container.querySelector('[data-fee-atlas-annual-totals="true"]')).toBeNull()
    expect(container.querySelector('[data-fee-atlas-notes="true"]')).toBeNull()
    expect(container.querySelector('[data-fee-atlas-complete-expense="true"]')).toBeNull()
    expect(container.querySelector('[data-fee-document="true"]')).toBeNull()
    expect(container.querySelectorAll('[data-fee-atlas-fee-chapter="true"]')).toHaveLength(2)

    const periodGrid = container.querySelector('[data-fee-atlas-period-grid="true"]')
    expect(periodGrid?.className).toContain('grid-cols-2')
    expect(periodGrid?.className).toContain('lg:grid-cols-5')
  })

  it.each([undefined, 'table', 'unknown'])(
    'keeps the legacy table layout as the runtime fallback for %s',
    (layout) => {
      const { container } = render(
        <FeeStructureBlockComponent
          academicSession="2026-27"
          feeCategories={[generalCategory]}
          layout={layout as never}
          programmeName="MBBS"
        />,
      )

      expect(container.querySelector('table')).toBeTruthy()
      expect(container.querySelector('[data-fee-structure-mobile="true"]')).toBeTruthy()
      expect(container.querySelector('[data-fee-context="true"]')).toBeTruthy()
      expect(container.querySelector('[data-fee-atlas="true"]')).toBeNull()
    },
  )

  it('switches every category-owned Atlas region through the existing tabs', () => {
    const nriAtlasCategory = {
      ...atlasCategory,
      id: 'nri-atlas',
      label: 'NRI',
      caption: 'Official NRI category fee statement.',
      completeProgrammeExpense: 'USD 175,000',
      completeProgrammeExpenseNote: 'Official NRI package.',
      notes: [{ text: 'NRI values remain in the published currency.' }],
      rows: atlasCategory.rows.map((row) => ({
        ...row,
        cells: row.cells.map(() => ({ value: 'USD 35,000' })),
      })),
    }
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[atlasCategory, nriAtlasCategory]}
        layout="programmeCostAtlas"
        programmeName="MBBS"
        tabStyle="pills"
        tabWidth="equal"
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['General', 'NRI'])
    expect(container.querySelector('[data-fee-tab-style="pills"]')).toBeTruthy()
    expect(container.querySelector('[data-fee-tab-width="equal"]')).toBeTruthy()
    expect(screen.getByText('₹71.75 lakh')).toBeTruthy()

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'NRI' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(screen.getByText('USD 175,000')).toBeTruthy()
    expect(screen.queryByText('NRI values remain in the published currency.')).toBeNull()
    expect(screen.queryByText('₹71.75 lakh')).toBeNull()
    expect(screen.queryByText('Amounts are displayed exactly as officially published.')).toBeNull()
    expect(container.querySelector('[data-fee-atlas-summary="true"]')?.textContent).toContain('NRI')
  })

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

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'NRI' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(screen.getAllByText('USD 35,000').length).toBeGreaterThan(0)
    expect(screen.getByText('Amounts are displayed exactly as published.')).toBeTruthy()
    expect(container.querySelector('[data-fee-tab-style="pills"]')).toBeTruthy()
    expect(container.querySelector('[data-content-tab-variant="pill"]')).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'NRI' }).className).toContain('min-h-11')
    expect(screen.getByRole('tab', { name: 'NRI' }).className).toContain('rounded-full')

    const frame = container.querySelector('[data-scrollable-content-tab-frame="true"]')
    const viewport = container.querySelector('[data-scrollable-content-tab-viewport="true"]')

    expect(frame).not.toBeNull()
    expect(viewport?.className).toContain('overflow-x-auto')
    expect(viewport?.querySelector('[role="tablist"]')).not.toBeNull()
  })

  it('maps legacy Fee Structure tab values onto the shared content-tab variants', () => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory, nriCategory]}
        programmeName="MBBS"
        tabStyle="boxed"
      />,
    )

    const rail = container.querySelector('[data-content-tab-variant="contained"]')
    const frame = rail?.closest('[data-scrollable-content-tab-frame="true"]')

    expect(container.querySelector('[data-fee-tab-style="boxed"]')).toBeTruthy()
    expect(rail).toBeTruthy()
    expect(frame?.className).toContain('rounded-control')

    for (const tab of screen.getAllByRole('tab')) {
      expect(tab.className).toContain('rounded-control')
    }
  })

  it.each([undefined, 'unknown'])(
    'uses content-width tabs as the runtime fallback for %s',
    (tabWidth) => {
      const { container } = render(
        <FeeStructureBlockComponent
          academicSession="2026-27"
          feeCategories={[generalCategory, nriCategory]}
          programmeName="MBBS"
          tabWidth={tabWidth as never}
        />,
      )

      const rail = container.querySelector('[data-fee-tab-width="content"]')
      const railClasses = new Set(rail?.className.split(/\s+/))

      expect(railClasses.has('w-max')).toBe(true)
      expect(railClasses.has('min-w-full')).toBe(true)
      expect(railClasses.has('mx-auto')).toBe(false)
    },
  )

  it('centers intrinsic category tabs and keeps overflow scrolling available', () => {
    const longCategory = {
      ...nriCategory,
      id: 'international-sponsored',
      label: 'International Sponsored Category',
    }
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory, longCategory]}
        programmeName="MBBS"
        tabStyle="pills"
        tabWidth="centered"
      />,
    )

    const rail = container.querySelector('[data-fee-tab-width="centered"]')
    const railClasses = new Set(rail?.className.split(/\s+/))
    const viewport = rail?.parentElement
    const frame = viewport?.parentElement
    const layoutWrapper = frame?.parentElement
    const viewportClasses = new Set(viewport?.className.split(/\s+/))
    const layoutWrapperClasses = new Set(layoutWrapper?.className.split(/\s+/))
    const tabs = screen.getAllByRole('tab')

    expect(railClasses.has('mx-auto')).toBe(true)
    expect(railClasses.has('w-max')).toBe(true)
    expect(railClasses.has('min-w-full')).toBe(false)
    expect(railClasses.has('w-full')).toBe(false)
    expect(railClasses.has('min-w-0')).toBe(false)
    expect(frame?.className).toContain('mx-auto')
    expect(frame?.className).toContain('w-fit')
    expect(frame?.className).toContain('max-w-full')
    expect(viewportClasses.has('overflow-x-auto')).toBe(true)
    expect(layoutWrapperClasses.has('pb-1')).toBe(true)
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      'General',
      'International Sponsored Category',
    ])
    expect(tabs.every((tab) => tab.className.includes('min-h-11'))).toBe(true)
    expect(tabs.every((tab) => tab.className.includes('shrink-0'))).toBe(true)
    expect(tabs.every((tab) => !tab.className.includes('flex-1'))).toBe(true)
    expect(tabs.every((tab) => !tab.className.includes('w-0'))).toBe(true)
    expect(tabs.every((tab) => !tab.className.includes('text-ellipsis'))).toBe(true)

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'International Sponsored Category' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(
      container.querySelector('[data-fee-category="International Sponsored Category"]'),
    ).toBeTruthy()
  })

  it('supports equal full-width category tabs at every breakpoint', () => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory, nriCategory]}
        programmeName="MBBS"
        tabWidth="equal"
      />,
    )

    const rail = container.querySelector('[data-fee-tab-width="equal"]')
    const tabs = screen.getAllByRole('tab')

    expect(rail?.className).toContain('w-full')
    expect(rail?.className).toContain('min-w-0')
    expect(tabs.every((tab) => tab.className.includes('flex-1'))).toBe(true)
    expect(tabs.every((tab) => tab.className.includes('w-0'))).toBe(true)
    expect(tabs.every((tab) => !tab.className.includes('sm:'))).toBe(true)
  })

  it.each([
    ['left', 'self-start'],
    ['center', 'mx-auto'],
  ] as const)(
    'constrains the fee context band when aligned %s',
    (contentAlignment, alignmentClass) => {
      const { container } = render(
        <FeeStructureBlockComponent
          academicSession="2026-27"
          contentAlignment={contentAlignment}
          description="Official programme fees."
          feeCategories={[generalCategory]}
          programmeName="MBBS"
        />,
      )

      const context = container.querySelector('[data-fee-context="true"]')
      expect(context?.className).toContain('w-full')
      expect(context?.className).toContain('max-w-3xl')
      expect(context?.className).toContain(alignmentClass)
    },
  )

  it.each(['none', 'brand'] as const)(
    'keeps header, standard, and total hover states consistent on %s surfaces',
    (background) => {
      const { container } = render(
        <FeeStructureBlockComponent
          academicSession="2026-27"
          appearance={{ background, border: 'none' }}
          feeCategories={[generalCategory]}
          programmeName="MBBS"
        />,
      )

      const header = container.querySelector('[data-fee-table-header-row="true"]')
      const standard = container.querySelector('[data-fee-row-emphasis="standard"]')
      const total = container.querySelector('[data-fee-row-emphasis="total"]')
      const standardLabel = standard?.querySelector('[data-fee-row-label="true"]')
      const totalLabel = total?.querySelector('[data-fee-row-label="true"]')

      expect(header?.className).toContain(
        background === 'brand' ? 'hover:bg-primary-foreground/[0.08]' : 'hover:bg-transparent',
      )
      const expectedStandardSurface =
        background === 'brand'
          ? '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_6%)]'
          : '[&>*]:bg-card'
      const expectedStandardHover =
        background === 'brand'
          ? 'hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_12%)]'
          : 'hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_40%)]'
      const expectedTotalSurface =
        background === 'brand'
          ? '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_10%)]'
          : '[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_55%)]'
      const expectedTotalHover =
        background === 'brand'
          ? 'hover:[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_18%)]'
          : 'hover:[&>*]:bg-[color-mix(in_oklch,var(--card),var(--accent)_75%)]'

      expect(standard?.className).toContain(expectedStandardSurface)
      expect(standard?.className).toContain(expectedStandardHover)
      expect(total?.className).toContain(expectedTotalSurface)
      expect(total?.className).toContain(expectedTotalHover)
      expect(standardLabel?.className).toContain('font-normal')
      expect(standardLabel?.className).not.toContain('font-medium')
      expect(total?.className).toContain('font-bold')
      expect(totalLabel?.className).toContain('font-bold')
      expect(standardLabel?.className).not.toContain('bg-card')
      expect(totalLabel?.className).not.toContain('bg-muted')
    },
  )

  it.each(['brand', 'gradient-brand'] as const)(
    'uses brand-compatible fee surfaces on %s sections',
    (background) => {
      const { container } = render(
        <FeeStructureBlockComponent
          academicSession="2026-27"
          appearance={{ background, border: 'none' }}
          feeCategories={[generalCategory]}
          programmeName="MBBS"
        />,
      )

      const surface = container.querySelector('[data-fee-surface="brand"]')
      expect(surface?.className).toContain('text-primary-foreground')
      expect(surface?.className).toContain('border-primary-foreground/20')
      expect(container.querySelector('[data-fee-table-header="true"]')?.className).toContain(
        'bg-primary-foreground/[0.08]',
      )
      expect(container.querySelector('[data-fee-sticky-head="true"]')?.className).toContain(
        'bg-primary',
      )
      expect(container.querySelector('[data-fee-row-emphasis="total"]')?.className).toContain(
        '[&>*]:bg-[color-mix(in_oklch,var(--primary),var(--primary-foreground)_10%)]',
      )
      expect(container.querySelector('[data-fee-period-card="true"]')?.className).toContain(
        'text-primary-foreground',
      )
      expect(container.querySelector('[data-fee-category-notes="true"]')?.className).toContain(
        'text-primary-foreground',
      )
    },
  )

  it('retains semantic card colors on light section surfaces', () => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        programmeName="MBBS"
      />,
    )

    const surface = container.querySelector('[data-fee-surface="light"]')
    expect(surface?.className).toContain('bg-card')
    expect(surface?.className).toContain('text-card-foreground')
    expect(surface?.className).toContain('border-border')
  })

  it('right-aligns every fee value while reserving tabular numerals for numeric values', () => {
    const { container } = render(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        programmeName="MBBS"
      />,
    )

    const values = Array.from(container.querySelectorAll('[data-fee-value="true"]'))
    const placeholders = values.filter((element) => element.textContent === '—')
    const numericValues = values.filter((element) => element.textContent === '12,75,000')

    expect(values.length).toBeGreaterThan(0)
    expect(values.every((element) => element.className.includes('text-right'))).toBe(true)
    expect(placeholders.length).toBeGreaterThan(0)
    expect(placeholders.every((element) => !element.className.includes('tabular-nums'))).toBe(true)
    expect(numericValues.every((element) => element.className.includes('tabular-nums'))).toBe(true)
  })

  it.each([
    ['view', 'button'],
    ['view', 'link'],
    ['download', 'button'],
    ['download', 'link'],
  ] as const)('renders the official file as %s with %s presentation', (fileBehavior, mode) => {
    const { container } = render(
      <FeeStructureBlockComponent
        programmeName="MBBS"
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        feeDocumentAction={[
          {
            label: 'Official fees',
            linkType: 'file',
            file: {
              id: 'fees',
              url: '/media/current-fees.pdf',
              filename: 'current-fees.pdf',
            } as Media,
            fileBehavior,
            mode,
            variant: 'outline',
            openFileInNewTab: true,
          },
        ]}
      />,
    )
    const action = screen.getByRole('link', { name: 'Official fees' })
    expect(action.getAttribute('href')).toBe('/media/current-fees.pdf')
    expect(action.getAttribute('download')).toBe(
      fileBehavior === 'download' ? 'current-fees.pdf' : null,
    )
    expect(action.getAttribute('target')).toBe(fileBehavior === 'view' ? '_blank' : null)
    expect(
      container.querySelector('[data-fee-download-mode]')?.getAttribute('data-fee-download-mode'),
    ).toBe(mode)
  })

  it('uses an attachment endpoint for a fee document hosted on the asset domain', () => {
    render(
      <FeeStructureBlockComponent
        programmeName="MBBS"
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        feeDocumentAction={[{
          label: 'Download official fees',
          linkType: 'file',
          fileBehavior: 'download',
          file: { id: 'remote-fees', filename: 'fees.pdf', url: 'https://assets.snmih.in/fees.pdf' } as Media,
          mode: 'button',
        }]}
      />,
    )
    expect(screen.getByRole('link', { name: 'Download official fees' }).getAttribute('href')).toBe(
      '/api/media-download/remote-fees',
    )
  })

  it('renders a valid Media download after categories and before footer actions', () => {
    const html = renderToStaticMarkup(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        feeDocument={
          {
            id: 'fees',
            mimeType: 'application/pdf',
            url: '/media/fees.pdf',
          } as Media
        }
        footerActions={[{ label: 'Admissions', linkType: 'custom', url: '/admissions' }]}
        programmeName="MBBS"
      />,
    )

    expect(html).toContain('href="/media/fees.pdf"')
    expect(html).toContain('download=""')
    expect(html).toContain('Download Fee Structure')
    expect(html).toContain('data-fee-download-mode="button"')
    expect(html).toContain('data-variant="outline"')
    expect(html).toContain('data-fee-download-background="none"')
    expect(html.indexOf('data-fee-document="true"')).toBeGreaterThan(
      html.indexOf('data-fee-categories="true"'),
    )
    expect(html.indexOf('data-fee-document="true"')).toBeLessThan(html.indexOf('Admissions'))
  })

  it('renders the uploaded fee document as a configured download link', () => {
    const html = renderToStaticMarkup(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        downloadActionMode="link"
        downloadLabel="Get official fees"
        feeCategories={[generalCategory]}
        feeDocument={{ id: 'fees', url: '/media/fees.pdf' } as Media}
        programmeName="MBBS"
      />,
    )

    expect(html).toContain('data-fee-download-mode="link"')
    expect(html).toContain('href="/media/fees.pdf"')
    expect(html).toContain('download=""')
    expect(html).toContain('Get official fees')
    expect(html).toContain('underline')
    expect(html).not.toContain('data-variant="outline"')
  })

  it.each(['brand', 'gradient-brand'] as const)(
    'applies %s download-container appearance with a readable configured button',
    (background) => {
      const html = renderToStaticMarkup(
        <FeeStructureBlockComponent
          academicSession="2026-27"
          downloadActionMode="button"
          downloadAppearance={{ background, border: 'none' }}
          downloadButtonVariant="whiteOutline"
          feeCategories={[generalCategory]}
          feeDocument={{ id: 'fees', url: '/media/fees.pdf' } as Media}
          programmeName="MBBS"
        />,
      )

      expect(html).toContain(`data-fee-download-background="${background}"`)
      expect(html).toContain(background === 'brand' ? 'bg-brand' : 'bg-gradient-brand')
      expect(html).toContain('text-primary-foreground')
      expect(html).toContain('data-variant="whiteOutline"')
      expect(html).toContain('href="/media/fees.pdf"')
      expect(html).toContain('download=""')
    },
  )

  it('keeps the fallback outline action readable when a transparent download container inherits a brand section', () => {
    const html = renderToStaticMarkup(
      <FeeStructureBlockComponent
        academicSession="2026-27"
        appearance={{ background: 'brand', border: 'none' }}
        feeCategories={[generalCategory]}
        feeDocument={{ id: 'fees', url: '/media/fees.pdf' } as Media}
        programmeName="MBBS"
      />,
    )

    expect(html).toContain('data-fee-download-background="none"')
    expect(html).toContain('data-variant="outline"')
    expect(html).toContain('border-current/70 text-current')
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
        <FeeStructureBlockComponent
          academicSession="2026-27"
          feeCategories={[]}
          programmeName="MBBS"
        />,
      ),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        <FeeStructureBlockComponent
          academicSession=" "
          feeCategories={[generalCategory]}
          programmeName="MBBS"
        />,
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
})
