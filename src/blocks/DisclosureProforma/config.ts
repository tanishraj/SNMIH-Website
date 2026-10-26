import type { ArrayFieldValidation, Block, Field } from 'payload'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { defaultSections, sectionOptions } from './shared'

export const uniqueKeys: ArrayFieldValidation = (value) => {
  if (!Array.isArray(value)) return true
  const keys = value.map((v) =>
    String(v && typeof v === 'object' && 'key' in v ? v.key : '').trim(),
  )
  return new Set(keys).size === keys.length || 'Keys must be unique within this list.'
}
const keyField: Field = {
  name: 'key',
  type: 'text',
  required: true,
  maxLength: 64,
  validate: (v: unknown) =>
    (typeof v === 'string' && /^[a-z][a-z0-9-]*$/.test(v)) ||
    'Use a lowercase key, e.g. monthly-records.',
  admin: {
    description:
      'Stable key used to match data records. Changing it does not rename existing records.',
  },
}
export const DisclosureProformaBlock: Block = {
  slug: 'disclosureProforma',
  interfaceName: 'DisclosureProformaBlock',
  labels: { singular: 'Disclosure Proforma', plural: 'Disclosure Proformas' },
  admin: getBlockThumbnailAdmin('disclosureProforma'),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text', defaultValue: 'Institutional disclosures' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
              defaultValue: 'Explore current information and previous reporting periods.',
            },
            createContentActionsField({ label: 'Header Actions', maxRows: 2 }),
            {
              name: 'dataset',
              label: 'Disclosure Dataset',
              type: 'relationship',
              relationTo: 'disclosure-datasets',
              required: true,
              admin: {
                description:
                  'Select the dataset whose reporting periods and records this block displays.',
              },
            },
            {
              name: 'sections',
              type: 'array',
              required: true,
              minRows: 1,
              maxRows: 7,
              defaultValue: defaultSections,
              validate: uniqueKeys,
              admin: {
                initCollapsed: true,
                description:
                  'Reorder sections, edit labels and configure each group of facts, metrics or table columns.',
              },
              fields: [
                {
                  name: 'key',
                  label: 'Section',
                  type: 'select',
                  options: [...sectionOptions],
                  required: true,
                },
                { name: 'enabled', type: 'checkbox', defaultValue: true },
                { name: 'label', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
                {
                  name: 'groups',
                  type: 'array',
                  minRows: 1,
                  maxRows: 8,
                  required: true,
                  validate: uniqueKeys,
                  admin: { initCollapsed: true },
                  fields: [
                    keyField,
                    { name: 'title', type: 'text' },
                    {
                      name: 'layout',
                      type: 'select',
                      required: true,
                      defaultValue: 'facts',
                      options: [
                        { label: 'Label / value rows', value: 'facts' },
                        { label: 'Metric highlights', value: 'metrics' },
                        { label: 'Table', value: 'table' },
                      ],
                    },
                    {
                      name: 'columns',
                      type: 'array',
                      maxRows: 12,
                      validate: (value, args) =>
                        (args.siblingData as { layout?: string })?.layout === 'table' &&
                        (!Array.isArray(value) || !value.length)
                          ? 'Add at least one table column.'
                          : uniqueKeys(value, args),
                      admin: {
                        condition: (_, s) => s.layout === 'table',
                        description: 'Cell keys must match the keys entered on Disclosure Records.',
                      },
                      fields: [
                        keyField,
                        { name: 'label', type: 'text', required: true },
                        { name: 'numeric', label: 'Align as numeric data', type: 'checkbox' },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              name: 'defaultSection',
              type: 'select',
              defaultValue: 'institution',
              options: [...sectionOptions],
            },
            {
              name: 'emptyMessage',
              type: 'text',
              defaultValue: 'No information is available for this reporting period.',
            },
            { name: 'missingMessage', type: 'text', defaultValue: 'Not supplied' },
            {
              name: 'archiveNote',
              type: 'textarea',
              defaultValue: 'Previous reporting periods remain available within each section.',
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
              type: 'select',
              defaultValue: 'left',
              options: ['left', 'center'],
            },
            {
              name: 'headerLayout',
              label: 'Section Header Layout',
              type: 'select',
              defaultValue: 'split',
              options: [
                { label: 'Split', value: 'split' },
                { label: 'Stacked', value: 'stacked' },
              ],
              admin: {
                condition: (_, s) => s?.contentAlignment !== 'center',
                description:
                  'Split shows the reporting record beside the introduction on wide screens. Centred sections always stack.',
              },
            },
            {
              name: 'sidebarWidth',
              type: 'select',
              defaultValue: 'wide',
              options: [
                { label: 'Standard', value: 'standard' },
                { label: 'Wide', value: 'wide' },
              ],
            },
            {
              name: 'showSectionNumbers',
              label: 'Show Section Numbers',
              type: 'checkbox',
              defaultValue: true,
            },
            {
              name: 'density',
              label: 'Table Density',
              type: 'select',
              defaultValue: 'comfortable',
              options: ['compact', 'comfortable'],
            },
            {
              name: 'missingValueStyle',
              label: 'Missing Value Style',
              type: 'select',
              defaultValue: 'chip',
              options: [
                { label: 'Chip', value: 'chip' },
                { label: 'Footnote', value: 'footnote' },
                { label: 'Text', value: 'text' },
              ],
              admin: {
                description:
                  'How Not supplied and Not applicable values appear. Footnotes add one note under each affected group.',
              },
            },
            {
              name: 'itemsPerPage',
              type: 'select',
              defaultValue: '10',
              options: ['5', '10', '20', '50'],
            },
            {
              name: 'paginationMode',
              type: 'select',
              defaultValue: 'pages',
              options: [
                { label: 'Page navigation', value: 'pages' },
                { label: 'Load more', value: 'loadMore' },
              ],
            },
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              options: ['none', 'compact', 'default', 'comfortable'],
            },
          ],
        },
      ],
    },
    {
      name: 'publicUpdatedAt',
      type: 'date',
      admin: { hidden: true },
      access: { create: () => false, update: () => false },
    },
    {
      name: 'publicUpdatedBy',
      type: 'text',
      admin: { hidden: true },
      access: { create: () => false, update: () => false },
    },
  ],
}
