import type { Block, CheckboxField, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardBackgroundField } from '@/blocks/shared/cardThemeFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

export const NewsEventsContentBlock: Block = {
  slug: 'newsEventsContent',
  interfaceName: 'NewsEventsContentBlock',
  labels: {
    singular: 'News & Events Content',
    plural: 'News & Events Content',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'authorLabel',
              label: 'Author',
              type: 'text',
              defaultValue: 'Management, SNMIH',
              required: true,
              admin: {
                description: 'Shared author shown for every News & Events entry.',
              },
            },
            {
              name: 'showShareActions',
              label: 'Show Share Actions',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
          ],
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
              required: true,
              options: [
                { label: 'None', value: 'none' },
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
            } satisfies SelectField,
            createCardBackgroundField({
              name: 'sidebarCardBackground',
              label: 'Sidebar Card Background',
            }),
            {
              name: 'sidebarCardOutline',
              label: 'Show Sidebar Card Outline',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'featuredImageRatio',
              label: 'Featured Image Ratio',
              type: 'select',
              defaultValue: 'wide',
              required: true,
              options: [
                { label: 'Wide (2:1)', value: 'wide' },
                { label: 'Video (16:9)', value: 'video' },
                { label: 'Standard (4:3)', value: 'standard' },
              ],
            } satisfies SelectField,
            createMediaOverlayToneField({ defaultValue: 'dark' }),
            createMediaOverlayStrengthField({ defaultValue: 'darker' }),
            createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' }),
            createMediaOverlayCoverageField({ defaultValue: 'full' }),
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
