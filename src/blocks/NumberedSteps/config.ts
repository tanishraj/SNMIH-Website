import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

const stepsField: ArrayField = {
  name: 'steps',
  label: 'Steps',
  type: 'array',
  minRows: 2,
  maxRows: 10,
  admin: {
    initCollapsed: true,
    description: 'Each step has a number (auto-assigned), title, and optional description.',
  },
  fields: [
    createCardTabs({
      backgroundFieldOptions: {
        adminDescription:
          'Applied only to the Cards presentation. Vertical and Alternating layouts remain unchanged.',
      },
      contentFields: [
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
        {
          name: 'image',
          label: 'Image',
          type: 'upload',
          relationTo: 'media',
          admin: { description: 'Optional image shown alongside this step.' },
        },
        {
          name: 'badge',
          label: 'Badge Text',
          type: 'text',
          admin: {
            description: 'Optional small label (e.g. "Required", "Optional", "New").',
          },
        },
      ],
    }),
  ],
}

export const NumberedStepsBlock: Block = {
  admin: getBlockThumbnailAdmin('numberedSteps'),
  slug: 'numberedSteps',
  interfaceName: 'NumberedStepsBlock',
  labels: {
    singular: 'Numbered Steps',
    plural: 'Numbered Steps',
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
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            stepsField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'variant',
              label: 'Variant',
              type: 'select',
              defaultValue: 'vertical',
              options: [
                { label: 'Vertical (list with connectors)', value: 'vertical' },
                { label: 'Cards (numbered cards in grid)', value: 'cards' },
                { label: 'Alternating (image + text, zigzag)', value: 'alternating' },
              ],
            } satisfies SelectField,
            {
              name: 'numberStyle',
              label: 'Number Style',
              type: 'select',
              defaultValue: 'circle',
              options: [
                { label: 'Circle (filled primary)', value: 'circle' },
                { label: 'Outlined', value: 'outlined' },
                { label: 'Large serif (decorative)', value: 'serif' },
              ],
            } satisfies SelectField,
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
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
