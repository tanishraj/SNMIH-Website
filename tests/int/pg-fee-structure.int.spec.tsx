import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { Field, SelectField, TabsField } from 'payload'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'

import { PGFeeStructureBlockComponent } from '@/blocks/PGFeeStructure/Component'
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

const generalCategory = {
  id: 'general',
  label: 'General',
  caption: 'Resident Indian postgraduate fee structure.',
  columns: [
    { id: 'tuition', label: 'Tuition (Per Annum)', valueMode: 'department' as const },
    {
      id: 'hostel',
      label: 'Hostel (Per Annum)',
      valueMode: 'shared' as const,
      sharedValue: '₹3,15,000',
    },
    {
      id: 'security',
      label: 'Security (One Time)',
      valueMode: 'shared' as const,
      sharedValue: '₹2,00,000',
    },
  ],
  departments: [
    {
      id: 'medicine',
      name: 'General Medicine',
      variableValues: [{ value: '₹28,00,000' }],
    },
    {
      id: 'surgery',
      name: 'General Surgery',
      note: 'Subject to the official notification.',
      variableValues: [{ value: '₹25,00,000' }],
    },
  ],
  notes: [{ text: 'Amounts are displayed exactly as officially published.', emphasis: true }],
}

const nriCategory = {
  id: 'nri',
  label: 'NRI',
  columns: [
    { label: 'Tuition (Per Annum)', valueMode: 'department' as const },
    {
      label: 'Hostel (Per Annum)',
      valueMode: 'shared' as const,
      sharedValue: '₹3,15,000',
    },
    {
      label: 'Security (One Time)',
      valueMode: 'shared' as const,
      sharedValue: '₹2,00,000',
    },
  ],
  departments: [
    {
      name: 'General Medicine',
      variableValues: [{ value: 'USD 64,000' }],
    },
    {
      name: 'Radiology',
      variableValues: [{ value: 'USD 1,07,500' }],
    },
  ],
  notes: [{ text: 'NRI tuition remains in the published currency.' }],
}

const makeDepartmentCategory = (departmentCount: number, label: string) => ({
  ...generalCategory,
  id: label.toLowerCase().replaceAll(' ', '-'),
  label,
  departments: Array.from({ length: departmentCount }, (_, index) => ({
    id: `${label.toLowerCase()}-${index + 1}`,
    name: `${label} Department ${index + 1}`,
    note: index === departmentCount - 1 ? 'Final department note remains visible.' : undefined,
    variableValues: [{ value: `₹${index + 1},00,000` }],
  })),
})

describe('PG Fee Structure normalization', () => {
  it('expands department and shared columns without reformatting authored amounts', () => {
    const normalized = normalizePGFeeCategories([
      {
        ...generalCategory,
        label: ' General ',
        columns: [
          { label: ' Tuition (Per Annum) ', valueMode: 'department' },
          { label: ' ', valueMode: 'department' },
          {
            label: ' Hostel (Per Annum) ',
            valueMode: 'shared',
            sharedValue: ' ₹3,15,000 ',
          },
          {
            label: ' Security (One Time) ',
            valueMode: 'shared',
            sharedValue: ' ₹2,00,000 ',
          },
        ],
        departments: [
          {
            name: ' General Medicine ',
            variableValues: [{ value: ' ₹28,00,000 ' }, { value: 'must not shift' }],
          },
        ],
      },
    ])

    expect(normalized[0]?.columns).toEqual([
      {
        id: expect.any(String),
        label: 'Tuition (Per Annum)',
        sharedValue: undefined,
        valueMode: 'department',
      },
      {
        id: expect.any(String),
        label: 'Hostel (Per Annum)',
        sharedValue: '₹3,15,000',
        valueMode: 'shared',
      },
      {
        id: expect.any(String),
        label: 'Security (One Time)',
        sharedValue: '₹2,00,000',
        valueMode: 'shared',
      },
    ])
    expect(normalized[0]?.departments[0]?.cells).toEqual([
      '₹28,00,000',
      '₹3,15,000',
      '₹2,00,000',
    ])
  })

  it('uses an em dash only as a missing-value fallback and detects authored numeric strings', () => {
    expect(
      normalizePGFeeCategories([
        {
          label: 'General',
          columns: [{ label: 'Tuition', valueMode: 'department' }],
          departments: [{ name: 'Pathology', variableValues: [] }],
        },
      ])[0]?.departments[0]?.cells,
    ).toEqual(['—'])
    expect(isNumericPGFeeValue('USD 64,000')).toBe(true)
    expect(isNumericPGFeeValue('₹3,15,000')).toBe(true)
    expect(isNumericPGFeeValue('—')).toBe(false)
  })
})

describe('PGFeeStructureBlock schema', () => {
  it('defines the approved independent block identity and editor limits', () => {
    expect(PGFeeStructureBlock).toMatchObject({
      slug: 'pgFeeStructure',
      interfaceName: 'PGFeeStructureBlock',
      labels: { singular: 'PG Fee Structure', plural: 'PG Fee Structures' },
    })
    expect(PGFeeStructureBlock.admin?.images?.thumbnail).toEqual({
      alt: 'PG Fee Structure block preview',
      url: '/block-thumbnails/pg-fee-structure.jpg',
    })

    const tabs = PGFeeStructureBlock.fields[0] as TabsField
    expect(tabs.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(findNamedField(PGFeeStructureBlock.fields, 'feeCategories')).toMatchObject({
      type: 'array',
      minRows: 1,
      maxRows: 4,
      required: true,
    })
    expect(findNamedField(PGFeeStructureBlock.fields, 'columns')).toMatchObject({
      type: 'array',
      minRows: 1,
      maxRows: 6,
      required: true,
    })
    expect(findNamedField(PGFeeStructureBlock.fields, 'departments')).toMatchObject({
      type: 'array',
      minRows: 1,
      maxRows: 30,
      required: true,
    })
    expect(findNamedField(PGFeeStructureBlock.fields, 'variableValues')).toMatchObject({
      type: 'array',
      maxRows: 6,
    })
    expect(findNamedField(PGFeeStructureBlock.fields, 'notes')).toMatchObject({
      type: 'array',
      maxRows: 8,
    })
    expect(findNamedField(PGFeeStructureBlock.fields, 'layout')).toBeUndefined()
    expect(findNamedField(PGFeeStructureBlock.fields, 'programmeDetails')).toBeUndefined()
  })

  it('keeps the shared category-tab and download appearance controls', () => {
    const tabStyle = findNamedField(PGFeeStructureBlock.fields, 'tabStyle') as SelectField
    const tabWidth = findNamedField(PGFeeStructureBlock.fields, 'tabWidth') as SelectField
    const valueMode = findNamedField(PGFeeStructureBlock.fields, 'valueMode') as SelectField
    const sharedValue = findNamedField(PGFeeStructureBlock.fields, 'sharedValue')

    expect(tabStyle).toMatchObject({ defaultValue: 'underline', required: true })
    expect(tabWidth).toMatchObject({ defaultValue: 'content', required: true })
    expect(valueMode).toMatchObject({
      defaultValue: 'department',
      options: [
        { label: 'Changes by Department', value: 'department' },
        { label: 'Shared Across Departments', value: 'shared' },
      ],
    })
    expect(
      sharedValue && 'admin' in sharedValue
        ? sharedValue.admin?.condition?.({}, { valueMode: 'department' }, {} as never)
        : undefined,
    ).toBe(false)
    expect(
      sharedValue && 'admin' in sharedValue
        ? sharedValue.admin?.condition?.({}, { valueMode: 'shared' }, {} as never)
        : undefined,
    ).toBe(true)
  })

  it('rejects duplicate labels, missing shared values, and mismatched variable values', async () => {
    expect(
      await validatePGFeeCategories([{ label: 'General' }, { label: ' general ' }], {} as never),
    ).toBe('Fee category 2 duplicates an earlier category label.')
    expect(
      await validatePGFeeColumns([{ label: 'Tuition' }, { label: ' TUITION ' }], {} as never),
    ).toBe('Fee column 2 duplicates an earlier column label.')
    expect(
      await validatePGFeeColumns(
        [{ label: 'Hostel', valueMode: 'shared', sharedValue: ' ' }],
        {} as never,
      ),
    ).toBe('Fee column 1 requires a Shared Value.')
    expect(
      await validatePGFeeDepartments(
        [{ name: 'Medicine', variableValues: [] }, { name: ' medicine ' }],
        { siblingData: { columns: [] } } as never,
      ),
    ).toBe('Department 2 duplicates an earlier department name.')
    expect(
      await validatePGFeeDepartments(
        [{ name: 'Medicine', variableValues: [{ value: '₹28,00,000' }] }],
        {
          siblingData: {
            columns: [
              { valueMode: 'department' },
              { valueMode: 'department' },
              { valueMode: 'shared' },
            ],
          },
        } as never,
      ),
    ).toBe('Department 1 must contain exactly 2 variable fee values.')
  })
})

describe('PGFeeStructureBlockComponent', () => {
  it('uses the Fee Structure ruled grid on compact layouts and preserves the adaptive desktop grid', () => {
    const { container } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        programmeName="Postgraduate Medical Courses"
      />,
    )

    const grid = container.querySelector<HTMLElement>('[data-pg-fee-grid="true"]')
    const items = Array.from(grid?.children ?? []) as HTMLElement[]

    expect(grid?.className).toContain('grid-cols-2')
    expect(grid?.className).toContain(
      'lg:[grid-template-columns:repeat(auto-fit,minmax(min(100%,9rem),1fr))]',
    )
    expect(items).toHaveLength(3)
    expect(items[0]?.className).not.toContain('border-l')
    expect(items[1]?.className).toContain('border-l')
    expect(items[2]?.className).toContain('border-t')
    expect(items[2]?.className).toContain('col-span-2')
    expect(items[2]?.className).toContain('lg:col-span-1')
    expect(items[2]?.className).toContain('lg:border-t-0')
    expect(items[2]?.dataset.pgFeeCompactDivider).toBe('true')
    expect(items[2]?.className).toContain('lg:after:hidden')
  })

  it('bounds exactly five or more departments on desktop and preserves compact natural flow', () => {
    const fourDepartments = makeDepartmentCategory(4, 'Four')
    const fiveDepartments = makeDepartmentCategory(5, 'Five')
    const { container } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[fourDepartments, fiveDepartments]}
        programmeName="Postgraduate Medical Courses"
      />,
    )

    const naturalAtlas = container.querySelector('[data-pg-fee-atlas="true"]')
    expect(naturalAtlas?.className).not.toContain('lg:h-[676px]')
    expect(container.querySelector('[data-pg-fee-department-scroll="true"]')).toBeNull()
    expect(container.querySelectorAll('[data-pg-fee-department-chapter="true"]')).toHaveLength(4)

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'Five' }), {
      button: 0,
      ctrlKey: false,
    })

    const boundedAtlas = container.querySelector('[data-pg-fee-atlas="true"]')
    const summary = container.querySelector('[data-pg-fee-atlas-summary="true"]')
    const statement = container.querySelector('[data-pg-fee-atlas-statement="true"]')
    const scroller = container.querySelector('[data-pg-fee-department-scroll="true"]')

    expect(boundedAtlas?.className).toContain('h-auto')
    expect(boundedAtlas?.className).toContain('max-h-none')
    expect(boundedAtlas?.className).toContain('lg:h-[676px]')
    expect(summary?.className).toContain('h-auto')
    expect(summary?.className).toContain('max-h-none')
    expect(summary?.className).toContain('lg:overflow-y-auto')
    expect(statement?.className).toContain('h-auto')
    expect(statement?.className).toContain('max-h-none')
    expect(statement?.className).toContain('lg:flex-col')
    expect(statement?.firstElementChild?.tagName).toBe('HEADER')
    expect(statement?.children[1]).toBe(scroller)
    expect(scroller?.className).toContain('h-auto')
    expect(scroller?.className).toContain('max-h-none')
    expect(scroller?.className).toContain('lg:flex-1')
    expect(scroller?.className).toContain('lg:overflow-y-auto')
    expect(scroller?.className).toContain('lg:overscroll-contain')
    expect(scroller?.className.split(' ')).not.toContain('h-[676px]')
    expect(scroller?.className.split(' ')).not.toContain('overflow-y-auto')
    expect(scroller?.className.split(' ')).not.toContain('overscroll-contain')
    expect(scroller?.getAttribute('role')).toBe('region')
    expect(scroller?.getAttribute('aria-label')).toBe('Five department fee statements')
    expect(scroller?.getAttribute('tabindex')).toBe('0')
    expect(container.querySelectorAll('[data-pg-fee-department-chapter="true"]')).toHaveLength(5)
    expect(screen.getByText('Final department note remains visible.')).toBeTruthy()
  })

  it('renders a complete department-chapters atlas without a visitor table', () => {
    const { container } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        programmeName="Postgraduate Medical Courses"
        title="PG Fee Structure"
      />,
    )

    expect(container.querySelector('[data-pg-fee-atlas="true"]')).toBeTruthy()
    expect(container.querySelector('[data-pg-fee-atlas-summary="true"]')).toBeTruthy()
    expect(container.querySelector('[data-pg-fee-atlas-statement="true"]')).toBeTruthy()
    expect(container.querySelectorAll('[data-pg-fee-department-chapter="true"]')).toHaveLength(2)
    expect(container.querySelector('[data-pg-fee-shared-charges="true"]')).toBeTruthy()
    expect(screen.getByText('Postgraduate Medical Courses')).toBeTruthy()
    expect(screen.getByText('2026-27')).toBeTruthy()
    expect(container.querySelector('[data-pg-fee-atlas-summary="true"]')?.textContent).toContain(
      'General',
    )
    expect(screen.getByRole('heading', { level: 3, name: 'General' })).toBeTruthy()
    expect(screen.getByText('2 Departments')).toBeTruthy()
    expect(screen.getByText('Resident Indian postgraduate fee structure.')).toBeTruthy()
    expect(screen.getByText('Amounts are displayed exactly as officially published.')).toBeTruthy()
    expect(container.querySelector('table')).toBeNull()
    expect(container.querySelector('[data-pg-fee-table-scroll]')).toBeNull()
    expect(container.querySelector('[data-pg-fee-department-card]')).toBeNull()

    for (const chapter of container.querySelectorAll(
      '[data-pg-fee-department-chapter="true"]',
    )) {
      expect(chapter.textContent).toContain('Tuition (Per Annum)')
      expect(chapter.textContent).toContain('Hostel (Per Annum)')
      expect(chapter.textContent).toContain('Security (One Time)')
      expect(chapter.textContent).toContain('₹3,15,000')
      expect(chapter.textContent).toContain('₹2,00,000')
    }
  })

  it('switches the complete summary and department chapters through tabs', () => {
    const { container } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory, nriCategory]}
        programmeName="Postgraduate Medical Courses"
        tabStyle="boxed"
        tabWidth="centered"
      />,
    )

    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual(['General', 'NRI'])
    expect(screen.getAllByText('General Surgery').length).toBeGreaterThan(0)
    expect(screen.getByText('Amounts are displayed exactly as officially published.')).toBeTruthy()
    expect(container.querySelector('[data-content-tab-variant="contained"]')).toBeTruthy()
    expect(container.querySelector('[data-pg-fee-tab-width="centered"]')).toBeTruthy()

    const frame = container.querySelector('[data-scrollable-content-tab-frame="true"]')
    const viewport = container.querySelector('[data-scrollable-content-tab-viewport="true"]')

    expect(frame).not.toBeNull()
    expect(viewport?.className).toContain('overflow-x-auto')
    expect(viewport?.querySelector('[role="tablist"]')).not.toBeNull()

    fireEvent.mouseDown(screen.getByRole('tab', { name: 'NRI' }), {
      button: 0,
      ctrlKey: false,
    })

    expect(screen.getByRole('heading', { level: 3, name: 'NRI' })).toBeTruthy()
    expect(screen.queryByText('NRI category department fees')).toBeNull()
    expect(screen.getByText('USD 64,000')).toBeTruthy()
    expect(screen.getByText('Radiology')).toBeTruthy()
    expect(screen.getByText('NRI tuition remains in the published currency.')).toBeTruthy()
    expect(screen.queryByText('General Surgery')).toBeNull()
  })

  it('uses semantic brand surfaces and the shared official-document Link or Button presenter', () => {
    const file = { id: 'pg-fees', url: '/media/pg-fees.pdf' } as Media
    const { container: linkContainer } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        appearance={{ background: 'brand', border: 'none' }}
        downloadActionMode="link"
        downloadLabel="View official PG fees"
        feeCategories={[generalCategory]}
        feeDocument={file}
        programmeName="Postgraduate Medical Courses"
      />,
    )

    const summary = linkContainer.querySelector('[data-pg-fee-atlas-summary="true"]')
    expect(summary?.querySelector('[data-fee-document="true"]')).toBeTruthy()
    expect(summary?.querySelector('[data-fee-download-mode="link"]')).toBeTruthy()
    expect(summary?.textContent).toContain('View official PG fees')

    cleanup()

    const { container: buttonContainer } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        downloadActionMode="button"
        feeCategories={[generalCategory]}
        feeDocument={file}
        programmeName="Postgraduate Medical Courses"
      />,
    )

    expect(
      buttonContainer
        .querySelector('[data-pg-fee-atlas-summary="true"]')
        ?.querySelector('[data-fee-download-mode="button"]'),
    ).toBeTruthy()
    expect(buttonContainer.textContent).toContain('Download Fee Structure')
  })

  it('omits optional summary regions and preserves missing authored values', () => {
    const { container } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[
          {
            label: 'General',
            columns: [{ label: 'Tuition', valueMode: 'department' }],
            departments: [{ name: 'Pathology', variableValues: [] }],
          },
        ]}
        programmeName="Postgraduate Medical Courses"
      />,
    )

    expect(container.querySelector('[data-pg-fee-shared-charges]')).toBeNull()
    expect(container.querySelector('[data-pg-fee-category-notes]')).toBeNull()
    expect(container.querySelector('[data-fee-document]')).toBeNull()
    expect(screen.getByText('1 Department')).toBeTruthy()
    expect(screen.getByText('—')).toBeTruthy()

    const singleGrid = container.querySelector<HTMLElement>('[data-pg-fee-grid="true"]')
    const singleItem = singleGrid?.firstElementChild as HTMLElement | null

    expect(singleItem?.className).toContain('col-span-2')
    expect(singleItem?.className).toContain('lg:col-span-1')
    expect(singleItem?.dataset.pgFeeCompactDivider).toBeUndefined()
  })

  it('uses semantic chapters and description lists with container-aware fee grids', () => {
    const { container } = render(
      <PGFeeStructureBlockComponent
        academicSession="2026-27"
        feeCategories={[generalCategory]}
        programmeName="Postgraduate Medical Courses"
      />,
    )

    const atlas = container.querySelector('[data-pg-fee-atlas="true"]')
    const summary = container.querySelector('[data-pg-fee-atlas-summary="true"]')
    const statement = container.querySelector('[data-pg-fee-atlas-statement="true"]')
    const chapters = container.querySelectorAll(
      'article[data-pg-fee-department-chapter="true"]',
    )

    expect(chapters).toHaveLength(2)
    expect(container.querySelectorAll('dl[data-pg-fee-grid="true"]')).toHaveLength(2)
    expect(container.querySelectorAll('[data-pg-fee-grid="true"] dt').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('[data-pg-fee-grid="true"] dd').length).toBeGreaterThan(0)
    expect(atlas?.className).toContain('rounded-card')
    expect(atlas?.className).toContain('lg:grid-cols-2')
    expect(summary?.className).toContain('bg-primary')
    expect(summary?.className).toContain('text-primary-foreground')
    expect(statement?.className).toContain('bg-card')
    expect(statement?.className).toContain('text-card-foreground')
    expect(
      container.querySelector('[data-pg-fee-atlas-summary-inner="true"]')?.className,
    ).toContain('lg:sticky')
  })

  it('returns no visitor markup when required context or valid fee rows are absent', () => {
    expect(
      renderToStaticMarkup(
        <PGFeeStructureBlockComponent
          academicSession="2026-27"
          feeCategories={[]}
          programmeName="Postgraduate Medical Courses"
        />,
      ),
    ).toBe('')
  })
})
