import type { ArrayField, Block, CheckboxField, NumberField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

const itemsField = {
  name: 'items',
  type: 'array',
  minRows: 1,
  admin: {
    initCollapsed: true,
  },
  fields: [
    {
      name: 'prefix',
      type: 'text',
    },
    {
      name: 'value',
      type: 'number',
      required: true,
    },
    {
      name: 'suffix',
      type: 'text',
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
  ],
} satisfies ArrayField

export const StatsStripBlock: Block = {
  slug: 'statsStrip',
  interfaceName: 'StatsStripBlock',
  admin: getBlockThumbnailAdmin('statsStrip'),
  labels: {
    singular: 'Stats Strip',
    plural: 'Stats Strips',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [itemsField],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
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
            {
              name: 'animationEnabled',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'animationDuration',
              type: 'number',
              defaultValue: 1200,
              required: true,
            } satisfies NumberField,
            {
              name: 'triggerOnce',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
