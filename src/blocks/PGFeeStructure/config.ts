import type {
  ArrayField,
  ArrayFieldValidation,
  Block,
  CheckboxField,
  SelectField,
  TabsField,
} from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import {
  createFeeDocumentActionField,
  hasFeeDocumentAction,
} from '@/blocks/shared/feeDocumentActionFields'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  buttonVariantOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'

type PGFeeStructureSiblingData = {
  downloadActionMode?: 'button' | 'link' | null
  feeCategories?: unknown[] | null
  feeDocument?: unknown
}

type PGFeeCategorySiblingData = {
  columns?: Array<{ valueMode?: unknown }> | null
}

const hasMultipleFeeCategories = (_data: unknown, siblingData: PGFeeStructureSiblingData) =>
  Array.isArray(siblingData?.feeCategories) && siblingData.feeCategories.length > 1

const hasFeeDocument = (_data: unknown, siblingData: PGFeeStructureSiblingData) =>
  Boolean(siblingData?.feeDocument)

const usesDownloadButton = (_data: unknown, siblingData: PGFeeStructureSiblingData) =>
  hasFeeDocument(_data, siblingData) && siblingData?.downloadActionMode !== 'link'

const normalizedKey = (value: unknown) =>
  typeof value === 'string' ? value.trim().toLowerCase() : ''

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

  if (duplicateIndex >= 0) {
    return `Fee column ${duplicateIndex + 1} duplicates an earlier column label.`
  }

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

  if (duplicateIndex >= 0) {
    return `Department ${duplicateIndex + 1} duplicates an earlier department name.`
  }

  const columns = Array.isArray((siblingData as PGFeeCategorySiblingData)?.columns)
    ? (siblingData as PGFeeCategorySiblingData).columns!
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

const feeCategoriesField: ArrayField = {
  name: 'feeCategories',
  label: 'Fee Categories',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 4,
  validate: validatePGFeeCategories,
  admin: {
    initCollapsed: true,
    description:
      'Add categories such as General and NRI. Every category owns its columns, departments, values, and notes.',
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
        description: 'Optional accessible description for this category fee table.',
      },
    },
    {
      name: 'columns',
      label: 'Fee Columns',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      validate: validatePGFeeColumns,
      admin: {
        initCollapsed: true,
        description:
          'Choose whether each fee changes by department or is shared across this category.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        {
          name: 'valueMode',
          label: 'Value Source',
          type: 'select',
          defaultValue: 'department',
          required: true,
          options: [
            { label: 'Changes by Department', value: 'department' },
            { label: 'Shared Across Departments', value: 'shared' },
          ],
        } satisfies SelectField,
        {
          name: 'sharedValue',
          label: 'Shared Value',
          type: 'text',
          admin: {
            condition: (_data, siblingData) => siblingData?.valueMode === 'shared',
            description: 'Displayed for every department in this fee category.',
          },
        },
      ],
    },
    {
      name: 'departments',
      label: 'Departments',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 30,
      validate: validatePGFeeDepartments,
      admin: {
        initCollapsed: true,
        description:
          'For each department, enter one value for every “Changes by Department” column, in column order.',
      },
      fields: [
        {
          name: 'name',
          label: 'Department Name',
          type: 'text',
          required: true,
        },
        {
          name: 'note',
          label: 'Department Note',
          type: 'text',
        },
        {
          name: 'variableValues',
          label: 'Department-specific Values',
          type: 'array',
          maxRows: 6,
          admin: {
            initCollapsed: true,
            description:
              'Enter values only for columns configured as “Changes by Department”, preserving their order.',
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

export const PGFeeStructureBlock: Block = {
  admin: getBlockThumbnailAdmin('pgFeeStructure'),
  slug: 'pgFeeStructure',
  interfaceName: 'PGFeeStructureBlock',
  labels: {
    singular: 'PG Fee Structure',
    plural: 'PG Fee Structures',
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
                description: 'One programme per block, such as Postgraduate Medical Courses.',
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
            feeCategoriesField,
            createFeeDocumentActionField(),
            {
              name: 'feeDocument',
              label: 'Official Fee Structure File',
              type: 'upload',
              relationTo: 'media',
              admin: {
                hidden: true,
              },
            },
            {
              name: 'downloadLabel',
              label: 'Download Label',
              type: 'text',
              defaultValue: 'Download Fee Structure',
              admin: {
                hidden: true,
                condition: hasFeeDocument,
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
                hidden: true,
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
                hidden: true,
                condition: usesDownloadButton,
              },
            } satisfies SelectField,
            createBlockAppearanceFields({
              condition: hasFeeDocumentAction,
              includeBorder: false,
              label: 'Document Container Appearance',
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
