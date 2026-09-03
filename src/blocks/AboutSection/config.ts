import type {
  ArrayField,
  Block,
  CheckboxField,
  GroupField,
  SelectField,
  TabsField,
  TextField,
} from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createIconField } from '@/blocks/shared/iconField'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

const listItemsField = {
  name: 'listItems',
  label: 'List Items',
  type: 'array',
  maxRows: 12,
  admin: {
    initCollapsed: true,
    description:
      'Optional supporting points shown below the body. Add an icon to override the default number or checkmark for that item.',
  },
  fields: [
    {
      name: 'text',
      label: 'Text',
      type: 'text',
      required: true,
    } satisfies TextField,
    createIconField({
      description:
        'Optional Lucide icon. When empty, ordered lists show the item number and unordered lists show a checkmark.',
    }),
  ],
} satisfies ArrayField

type ImageDetailSiblingData = {
  enabled?: boolean | null
}

const showImageDetailFields = (_data: unknown, siblingData: ImageDetailSiblingData) =>
  siblingData?.enabled === true

const imageDetailField = {
  name: 'imageDetail',
  label: 'Image Detail Panel',
  type: 'group',
  admin: {
    description: 'Optional milestone or key detail displayed over the lower corner of the image.',
  },
  fields: [
    {
      name: 'enabled',
      label: 'Show image detail panel',
      type: 'checkbox',
      defaultValue: false,
    } satisfies CheckboxField,
    {
      name: 'eyebrow',
      type: 'text',
      admin: {
        condition: showImageDetailFields,
        description: 'Small uppercase label, e.g. “Established”.',
      },
    },
    {
      name: 'value',
      label: 'Primary Value',
      type: 'text',
      admin: {
        condition: showImageDetailFields,
        description: 'Large focal value, e.g. “2021”. Required when the panel is enabled.',
      },
      validate: (value: unknown, { siblingData }: { siblingData?: ImageDetailSiblingData }) =>
        siblingData?.enabled !== true || (typeof value === 'string' && value.trim().length > 0)
          ? true
          : 'Primary Value is required when the image detail panel is enabled.',
    } satisfies TextField,
    {
      name: 'description',
      type: 'textarea',
      admin: {
        condition: showImageDetailFields,
        description: 'Short supporting detail shown below the primary value.',
      },
    },
  ],
} satisfies GroupField

const valuesField = {
  name: 'values',
  label: 'Values / Pillars',
  type: 'array',
  maxRows: 8,
  admin: {
    initCollapsed: true,
    description: 'Optional: list core values or pillars below the body text.',
  },
  fields: [
    {
      name: 'icon',
      label: 'Icon Name',
      type: 'text',
      admin: {
        description:
          'Lucide icon name — e.g. "Star", "Rocket", "GraduationCap". Browse all icons at lucide.dev/icons',
      },
    },
    {
      name: 'title',
      label: 'Title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
  ],
} satisfies ArrayField

const statsField = {
  name: 'stats',
  label: 'Key Stats',
  type: 'array',
  maxRows: 4,
  admin: {
    initCollapsed: true,
    description: 'Optional inline stats shown alongside the about text.',
  },
  fields: [
    {
      name: 'value',
      label: 'Value',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "25,000+" or "A+"' },
    } satisfies TextField,
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      required: true,
      admin: { description: 'e.g. "Students Enrolled" or "NAAC Grade"' },
    } satisfies TextField,
  ],
} satisfies ArrayField

export const AboutSectionBlock: Block = {
  admin: getBlockThumbnailAdmin('aboutSection'),
  slug: 'aboutSection',
  interfaceName: 'AboutSectionBlock',
  labels: {
    singular: 'About Section',
    plural: 'About Sections',
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
              admin: { description: 'e.g. "About Us" or "Our Story"' },
            },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'body',
              label: 'Body Text',
              type: 'textarea',
              required: true,
              admin: {
                description:
                  'Main about text. Paragraphs separated by blank lines are rendered as separate paragraphs.',
              },
            },
            {
              name: 'listStyle',
              label: 'List Type',
              type: 'select',
              defaultValue: 'unordered',
              options: [
                { label: 'Unordered', value: 'unordered' },
                { label: 'Ordered', value: 'ordered' },
              ],
              required: true,
              admin: {
                description: 'Controls the semantic and visual fallback marker for List Items.',
              },
            } satisfies SelectField,
            listItemsField,
            {
              name: 'image',
              label: 'Image',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'Featured image — shown beside the text in split layouts.' },
            },
            imageDetailField,
            statsField,
            valuesField,
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
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
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
            } satisfies SelectField,
            {
              name: 'variant',
              label: 'Variant',
              type: 'select',
              defaultValue: 'split',
              options: [
                { label: 'Split (text + image side by side)', value: 'split' },
                { label: 'Centered (text centered, image below)', value: 'centered' },
                { label: 'Text only', value: 'text' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'imagePosition',
              label: 'Image Side',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.variant === 'split' },
            } satisfies SelectField,
            {
              name: 'mediaFillMode',
              label: 'Media Fill',
              type: 'select',
              defaultValue: 'contained',
              options: [
                { label: 'Contained', value: 'contained' },
                { label: 'Contained Fill', value: 'containedFill' },
                { label: 'Edge to Edge', value: 'edgeToEdge' },
              ],
              admin: {
                condition: (_data, siblingData) => siblingData?.variant === 'split',
                description:
                  'Contained keeps the image proportional. Contained Fill matches the content height inside the container. Edge to Edge extends the split to the viewport edge.',
              },
            } satisfies SelectField,
            {
              name: 'imageDetailPosition',
              label: 'Image Detail Position',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Bottom Left', value: 'left' },
                { label: 'Bottom Right', value: 'right' },
              ],
              admin: {
                condition: (_data, siblingData) => siblingData?.variant !== 'text',
              },
            } satisfies SelectField,
            {
              name: 'imageDetailBackground',
              label: 'Image Detail Background',
              type: 'select',
              defaultValue: 'brand',
              options: [
                { label: 'Subtle', value: 'subtle' },
                { label: 'Brand', value: 'brand' },
                { label: 'Gradient: Subtle', value: 'gradient-subtle' },
                { label: 'Gradient: Brand', value: 'gradient-brand' },
              ],
              required: true,
              admin: {
                condition: (_data, siblingData) => siblingData?.variant !== 'text',
                description:
                  'Uses the active theme tokens and automatically adjusts panel contrast.',
              },
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
              required: true,
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
