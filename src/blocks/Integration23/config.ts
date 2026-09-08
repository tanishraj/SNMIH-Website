import type { Block, SelectField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

export const Integration23Block: Block = {
  slug: 'integration23',
  interfaceName: 'Integration23Block',
  labels: { singular: 'Partner Directory', plural: 'Partner Directories' },
  admin: getBlockThumbnailAdmin('integration23'),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions' }),
            {
              name: 'items',
              label: 'Partners / Insurers',
              type: 'array',
              required: true,
              minRows: 1,
              maxRows: 100,
              admin: {
                initCollapsed: true,
                description: 'Ordered directory entries. Names remain visible even without a logo.',
              },
              fields: [
                { name: 'name', type: 'text', required: true },
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  filterOptions: { mimeType: { contains: 'image/' } },
                  admin: { description: 'Optional logo. Missing images use the name initials.' },
                },
                {
                  name: 'description',
                  label: 'Details',
                  type: 'textarea',
                  admin: {
                    description: 'Optional information shown when the visitor opens this entry.',
                  },
                },
                createContentActionsField({ label: 'Detail Actions' }),
              ],
            },
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions' }),
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'layoutMode',
              label: 'Layout Mode',
              type: 'select',
              defaultValue: 'stacked',
              options: [
                { label: 'Stacked', value: 'stacked' },
                { label: 'Split', value: 'split' },
              ],
              admin: {
                description:
                  'Split places section content beside the directory on desktop. Compact screens stack content above the grid.',
              },
            } satisfies SelectField,
            {
              name: 'splitProportion',
              label: 'Split Proportion',
              type: 'select',
              defaultValue: 'balanced',
              options: [
                { label: 'Balanced (50 / 50)', value: 'balanced' },
                { label: 'Directory Focus (40 / 60)', value: 'directoryFocus' },
                { label: 'Section Content Focus (60 / 40)', value: 'sectionFocus' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.layoutMode === 'split' },
            } satisfies SelectField,
            {
              name: 'gridPosition',
              label: 'Directory Position',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.layoutMode === 'split' },
            } satisfies SelectField,
            {
              name: 'sectionVerticalAlignment',
              label: 'Section Content Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.layoutMode === 'split' },
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              admin: {
                description:
                  'Aligns the eyebrow, heading, description, and actions within their available width in both layouts.',
              },
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Desktop Columns',
              type: 'select',
              defaultValue: '4',
              required: true,
              options: [
                { label: '1 Column', value: '1' },
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
                { label: '6 Columns', value: '6' },
              ],
              admin: {
                description:
                  'Maximum columns. Smaller screens and narrower split panels automatically use fewer columns.',
              },
            } satisfies SelectField,
            {
              name: 'itemLayout',
              label: 'Item Layout',
              type: 'select',
              defaultValue: 'block',
              options: [
                { label: 'Block — Logo Above Text', value: 'block' },
                { label: 'Inline — Logo Beside Text', value: 'inline' },
              ],
              admin: {
                description:
                  'Controls each directory entry in both Stacked and Split section layouts.',
              },
            } satisfies SelectField,
            {
              name: 'itemAlignment',
              label: 'Item Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
              admin: {
                description:
                  'Aligns each logo and name together, independently of the section heading.',
              },
            } satisfies SelectField,
            {
              name: 'gridStyle',
              label: 'Directory Style',
              type: 'select',
              defaultValue: 'grid',
              options: [
                { label: 'Bordered Grid', value: 'grid' },
                { label: 'Ruled — Internal Dividers', value: 'ruled' },
              ],
              admin: {
                description:
                  'Ruled keeps horizontal and vertical dividers between items without an outer container border.',
              },
            } satisfies SelectField,
            {
              name: 'enableDetails',
              label: 'Enable Detail Dialogs',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Entries with details or actions open a dialog. Other entries remain static.',
              },
            },
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
    },
  ],
}
