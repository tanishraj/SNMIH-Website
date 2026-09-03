import type { ArrayField, Block, CheckboxField, RadioField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

type ReasonSiblingData = {
  linkType?: 'custom' | 'none' | 'page' | null
}

type EditorialReasonsLayoutSiblingData = {
  layoutProportion?: 'balanced' | 'fullWidth' | 'introFocus' | 'listFocus' | null
  numberLayout?: 'columns' | 'inline' | 'stacked' | null
}

const isSplitLayout = (_data: unknown, siblingData: EditorialReasonsLayoutSiblingData) =>
  siblingData?.layoutProportion !== 'fullWidth'

const supportsOuterListColumns = (_data: unknown, siblingData: EditorialReasonsLayoutSiblingData) =>
  siblingData?.numberLayout !== 'columns'

const isPageLink = (_data: unknown, siblingData: ReasonSiblingData) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: ReasonSiblingData) =>
  siblingData?.linkType === 'custom'

const hasLink = (_data: unknown, siblingData: ReasonSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const reasonsField = {
  name: 'reasons',
  label: 'Reasons',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 8,
  admin: {
    description: 'Rows are numbered automatically in their displayed order.',
    initCollapsed: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
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
        layout: 'horizontal',
      },
    } satisfies RadioField,
    {
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      admin: {
        condition: isPageLink,
      },
    },
    {
      name: 'url',
      label: 'Custom URL',
      type: 'text',
      admin: {
        condition: isCustomLink,
      },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        condition: hasLink,
      },
    } satisfies CheckboxField,
  ],
} satisfies ArrayField

export const EditorialReasonsBlock: Block = {
  admin: getBlockThumbnailAdmin('editorialReasons'),
  slug: 'editorialReasons',
  interfaceName: 'EditorialReasonsBlock',
  labels: {
    singular: 'Editorial Reasons',
    plural: 'Editorial Reasons',
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
            {
              name: 'accentTitle',
              label: 'Accent Title',
              type: 'text',
              admin: {
                description: 'Optional emphasized second line of the heading.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            reasonsField,
            createContentActionsField({
              name: 'listActions',
              label: 'List Footer Actions',
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
                { label: 'Right', value: 'right' },
              ],
              admin: {
                description:
                  'Aligns the section eyebrow, heading, description, and actions together.',
              },
            } satisfies SelectField,
            {
              name: 'layoutProportion',
              label: 'Layout Proportion',
              type: 'select',
              defaultValue: 'listFocus',
              required: true,
              options: [
                { label: 'List Focus (40 / 60)', value: 'listFocus' },
                { label: 'Balanced (50 / 50)', value: 'balanced' },
                { label: 'Introduction Focus (60 / 40)', value: 'introFocus' },
                { label: 'Full Width', value: 'fullWidth' },
              ],
              admin: {
                description:
                  'Controls the introduction and numbered-list proportions on large screens.',
              },
            } satisfies SelectField,
            {
              name: 'listColumns',
              label: 'List Columns',
              type: 'select',
              defaultValue: '2',
              required: true,
              options: [
                { label: '1 Column', value: '1' },
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
              ],
              admin: {
                condition: supportsOuterListColumns,
                description:
                  'Sets the desktop list layout. Two to four columns collapse responsively on smaller screens. Three Columns number layout uses one full-width list column.',
              },
            } satisfies SelectField,
            {
              name: 'numberLayout',
              label: 'Number Layout',
              type: 'select',
              defaultValue: 'stacked',
              required: true,
              options: [
                { label: 'Stacked (number above title)', value: 'stacked' },
                { label: 'Inline (number beside title)', value: 'inline' },
                {
                  label: 'Three Columns (number + title + description)',
                  value: 'columns',
                },
              ],
            } satisfies SelectField,
            {
              name: 'listBorderStyle',
              label: 'List Border Style',
              type: 'select',
              defaultValue: 'ruled',
              required: true,
              options: [
                { label: 'Open', value: 'open' },
                { label: 'Ruled', value: 'ruled' },
                { label: 'Framed', value: 'framed' },
              ],
              admin: {
                description:
                  'Open removes the outer top and bottom rules. Ruled keeps them. Framed wraps the list on all sides.',
              },
            } satisfies SelectField,
            {
              name: 'listPosition',
              label: 'List Position',
              type: 'select',
              defaultValue: 'right',
              required: true,
              options: [
                { label: 'Right', value: 'right' },
                { label: 'Left', value: 'left' },
              ],
              admin: {
                condition: isSplitLayout,
              },
            } satisfies SelectField,
            {
              name: 'introVerticalAlignment',
              label: 'Introduction Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitLayout,
              },
            } satisfies SelectField,
            {
              name: 'actionsPosition',
              label: 'Section Actions Position',
              type: 'select',
              defaultValue: 'inline',
              options: [
                { label: 'Directly under the description', value: 'inline' },
                { label: 'Bottom of the column', value: 'bottom' },
              ],
              admin: {
                condition: isSplitLayout,
                description:
                  'Bottom drops the actions to the foot of the introduction column, level with the end of the list. It fills the column height, so it overrides Keep Introduction Visible.',
              },
            } satisfies SelectField,
            {
              name: 'stickyIntro',
              label: 'Keep Introduction Visible',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: isSplitLayout,
                description: 'Keeps the introduction visible beside longer lists on large screens.',
              },
            } satisfies CheckboxField,
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
