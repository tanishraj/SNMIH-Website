import type {
  ArrayField,
  ArrayFieldValidation,
  Block,
  CheckboxField,
  SelectField,
  TabsField,
} from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  buttonVariantOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'

type FeeCategorySiblingData = {
  columns?: unknown[] | null
}

type FeeRowInput = {
  cells?: unknown[] | null
}

type FeeStructureSiblingData = {
  downloadActionMode?: 'button' | 'link' | null
  feeCategories?: unknown[] | null
  feeDocument?: unknown
}

type FeeStructureBlockData = {
  layout?: 'programmeCostAtlas' | 'table' | null
}

const usesProgrammeCostAtlas = (data: FeeStructureBlockData) =>
  data?.layout === 'programmeCostAtlas'

const hasMultipleFeeCategories = (_data: unknown, siblingData: FeeStructureSiblingData) =>
  Array.isArray(siblingData?.feeCategories) && siblingData.feeCategories.length > 1

const hasFeeDocument = (_data: unknown, siblingData: FeeStructureSiblingData) =>
  Boolean(siblingData?.feeDocument)

const usesDownloadButton = (_data: unknown, siblingData: FeeStructureSiblingData) =>
  hasFeeDocument(_data, siblingData) && siblingData?.downloadActionMode !== 'link'

export const validateFeeRows: ArrayFieldValidation = (value, { siblingData }) => {
  if (!Array.isArray(value)) return true

  const columns = (siblingData as FeeCategorySiblingData)?.columns
  const columnCount = Array.isArray(columns) ? columns.length : 0
  const invalidIndex = (value as FeeRowInput[]).findIndex(
    (row) => !Array.isArray(row.cells) || row.cells.length !== columnCount,
  )

  return invalidIndex === -1
    ? true
    : `Fee row ${invalidIndex + 1} must contain exactly ${columnCount} values—one for each academic-period column.`
}

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
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'textarea',
      admin: {
        description: 'Optional accessible description for this fee table.',
      },
    },
    {
      name: 'completeProgrammeExpenseLabel',
      label: 'Complete Programme Expense Label',
      type: 'text',
      defaultValue: 'Complete programme expense',
      admin: {
        condition: (_data, _siblingData, { blockData }) =>
          usesProgrammeCostAtlas(blockData as FeeStructureBlockData),
      },
    },
    {
      name: 'completeProgrammeExpense',
      label: 'Complete Programme Expense',
      type: 'text',
      required: true,
      admin: {
        condition: (_data, _siblingData, { blockData }) =>
          usesProgrammeCostAtlas(blockData as FeeStructureBlockData),
        description:
          'Required for Programme Cost Atlas. Enter the official complete amount exactly as published; it is never calculated from annual values.',
      },
    },
    {
      name: 'completeProgrammeExpenseNote',
      label: 'Complete Programme Expense Note',
      type: 'textarea',
      admin: {
        condition: (_data, _siblingData, { blockData }) =>
          usesProgrammeCostAtlas(blockData as FeeStructureBlockData),
      },
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
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
      ],
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
        {
          name: 'label',
          label: 'Fee Head',
          type: 'text',
          required: true,
        },
        {
          name: 'note',
          label: 'Row Note',
          type: 'text',
        },
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
          fields: [
            {
              name: 'value',
              type: 'text',
              required: true,
            },
          ],
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
        description:
          'Fee-only notes for this category. Do not enter bank or payment-account details.',
      },
      fields: [
        {
          name: 'text',
          type: 'textarea',
          required: true,
        },
        {
          name: 'emphasis',
          label: 'Emphasize',
          type: 'checkbox',
          defaultValue: false,
        } satisfies CheckboxField,
      ],
    },
  ],
}

export const FeeStructureBlock: Block = {
  admin: getBlockThumbnailAdmin('feeStructure'),
  slug: 'feeStructure',
  interfaceName: 'FeeStructureBlock',
  labels: {
    singular: 'Fee Structure',
    plural: 'Fee Structures',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              admin: {
                description: 'Small label above the optional section heading.',
              },
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'accentTitle',
              label: 'Accent Title (Italic)',
              type: 'text',
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            {
              name: 'programmeName',
              label: 'Programme Name',
              type: 'text',
              required: true,
              admin: {
                description: 'One programme per block, such as MBBS.',
              },
            },
            {
              name: 'academicSession',
              label: 'Academic Session',
              type: 'text',
              required: true,
              admin: {
                description: 'One session per block, such as 2026-27.',
              },
            },
            {
              name: 'programmeDetails',
              label: 'Additional Programme Details',
              type: 'array',
              defaultValue: [
                {
                  label: 'Programme Duration',
                  value: '4.5 Years',
                },
              ],
              maxRows: 4,
              admin: {
                condition: (_data, _siblingData, { blockData }) =>
                  usesProgrammeCostAtlas(blockData as FeeStructureBlockData),
                initCollapsed: true,
                description: 'Optional factual details such as programme duration.',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                },
              ],
            },
            feeCategoriesField,
            {
              name: 'feeDocument',
              label: 'Official Fee Structure File',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Optional official file visitors can download.',
              },
            },
            {
              name: 'downloadLabel',
              label: 'Download Label',
              type: 'text',
              defaultValue: 'Download Fee Structure',
              admin: {
                condition: (_data, siblingData: FeeStructureSiblingData) =>
                  Boolean(siblingData?.feeDocument),
              },
            },
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'layout',
              label: 'Fee Layout',
              type: 'select',
              defaultValue: 'table',
              required: true,
              options: [
                { label: 'Table & Mobile Cards', value: 'table' },
                { label: 'Programme Cost Atlas', value: 'programmeCostAtlas' },
              ],
            } satisfies SelectField,
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
                condition: hasMultipleFeeCategories,
              },
            } satisfies SelectField,
            {
              name: 'tabWidth',
              label: 'Category Tab Width',
              type: 'select',
              defaultValue: 'content',
              required: true,
              options: [
                { label: 'Content Width', value: 'content' },
                { label: 'Centered Auto Width', value: 'centered' },
                { label: 'Equal Full Width', value: 'equal' },
              ],
              admin: {
                condition: hasMultipleFeeCategories,
                description:
                  'Centered Auto Width keeps intrinsic tabs centered when they fit and scrollable when they overflow. Equal Full Width divides the complete tab rail evenly.',
              },
            } satisfies SelectField,
            {
              name: 'downloadActionMode',
              label: 'Download Display As',
              type: 'select',
              defaultValue: 'button',
              required: true,
              options: [
                { label: 'Link', value: 'link' },
                { label: 'Button', value: 'button' },
              ],
              admin: {
                condition: hasFeeDocument,
              },
            } satisfies SelectField,
            {
              name: 'downloadButtonVariant',
              label: 'Download Button Variant',
              type: 'select',
              defaultValue: 'outline',
              required: true,
              options: buttonVariantOptions,
              admin: {
                condition: usesDownloadButton,
              },
            } satisfies SelectField,
            createBlockAppearanceFields({
              condition: hasFeeDocument,
              includeBorder: false,
              label: 'Download Container Appearance',
              name: 'downloadAppearance',
            }),
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
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
