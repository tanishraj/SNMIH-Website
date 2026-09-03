import type { ArrayField, Block, CheckboxField, RadioField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import {
  buttonVariantDescription,
  buttonVariantOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'
import { createIconField } from '@/blocks/shared/iconField'

type ProgramMatrixLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

const isSplitHeader = (_data: unknown, siblingData: ProgramMatrixLayoutSiblingData) =>
  siblingData?.headerLayout === 'split'

const itemsField: ArrayField = {
  name: 'items',
  label: 'Programmes',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 24,
  admin: {
    initCollapsed: true,
    description: 'Each row represents one academic programme or structured offering.',
  },
  fields: [
    createCardTabs({
      contentFields: [
        createIconField({
          description:
            'Lucide icon name, such as Hospital, hospital, GraduationCap, or graduation-cap.',
        }),
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'metadata',
          type: 'text',
          admin: {
            description: 'Short detail such as 4.5 Years + 1 Year Internship.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
        },
        createContentActionsField({
          name: 'cardAction',
          label: 'Card Action',
          maxRows: 1,
        }),
        {
          name: 'linkType',
          label: 'Link',
          type: 'radio',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Page', value: 'page' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: {
            hidden: true,
          },
        } satisfies RadioField,
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          admin: {
            hidden: true,
          },
        },
        {
          name: 'url',
          label: 'Custom URL',
          type: 'text',
          admin: {
            hidden: true,
          },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            hidden: true,
          },
        } satisfies CheckboxField,
      ],
    }),
  ],
}

export const ProgramMatrixBlock: Block = {
  admin: getBlockThumbnailAdmin('programMatrix'),
  slug: 'programMatrix',
  interfaceName: 'ProgramMatrixBlock',
  labels: {
    singular: 'Program Matrix',
    plural: 'Program Matrices',
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
                description: 'Small label above the section title.',
              },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            itemsField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'actionMode',
              label: 'Programme Action Style',
              type: 'select',
              defaultValue: 'link',
              options: [
                { label: 'Link', value: 'link' },
                { label: 'Button', value: 'button' },
              ],
              admin: { hidden: true },
            } satisfies SelectField,
            {
              name: 'actionVariant',
              label: 'Programme Button Variant',
              type: 'select',
              defaultValue: 'default',
              options: buttonVariantOptions,
              admin: {
                description: buttonVariantDescription,
                hidden: true,
              },
            } satisfies SelectField,
            {
              name: 'itemActionLabel',
              label: 'Programme Action Label',
              type: 'text',
              defaultValue: 'Learn More',
              admin: { hidden: true },
            },
            {
              name: 'headerLayout',
              label: 'Section Header Layout',
              type: 'select',
              defaultValue: 'stacked',
              required: true,
              options: [
                { label: 'Stacked', value: 'stacked' },
                { label: 'Split', value: 'split' },
              ],
            } satisfies SelectField,
            {
              name: 'headerPosition',
              label: 'Section Header Position',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Choose which side contains the section introduction on large screens.',
              },
            },
            {
              name: 'headerVerticalAlignment',
              label: 'Section Header Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Position the section introduction relative to the matrix on large screens.',
              },
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Number of Columns',
              type: 'select',
              defaultValue: '2',
              required: true,
              options: [
                { label: '1', value: '1' },
                { label: '2', value: '2' },
                { label: '3', value: '3' },
                { label: '4', value: '4' },
              ],
              admin: {
                description:
                  'Use one column on mobile, up to two on tablet, and this count on desktop.',
              },
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
