import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createIconField } from '@/blocks/shared/iconField'

const itemsField: ArrayField = {
  name: 'items',
  label: 'Slides',
  type: 'array',
  minRows: 1,
  maxRows: 12,
  admin: {
    initCollapsed: true,
    description: 'Each slide can display a video or image. Videos play on hover automatically.',
  },
  fields: [
    createCardTabs({
      contentFields: [
        {
          name: 'media',
          label: 'Media',
          type: 'upload',
          relationTo: 'media',
          required: true,
          admin: {
            description: 'Upload a video (.mp4, .webm) or image. Type is detected from the file.',
          },
        },
        createIconField({
          label: 'Icon Badge',
          description:
            'Optional Lucide icon overlaid on the thumbnail — e.g. "Play", "Star". Browse all icons at lucide.dev/icons',
        }),
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'summary',
          type: 'textarea',
          admin: {
            description: 'Short supporting text shown below the title.',
          },
        },
        createContentActionsField({ maxRows: 1, label: 'Action', name: 'actions' }),
      ],
    }),
  ],
}

export const MediaCarouselBlock: Block = {
  admin: getBlockThumbnailAdmin('mediaCarousel'),
  slug: 'mediaCarousel',
  interfaceName: 'MediaCarouselBlock',
  labels: {
    singular: 'Media Carousel',
    plural: 'Media Carousels',
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
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({
              label: 'Section Actions',
              maxRows: 2,
              name: 'sectionActions',
            }),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            itemsField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'columns',
              label: 'Columns',
              type: 'select',
              defaultValue: '3',
              options: [
                { label: '2 columns', value: '2' },
                { label: '3 columns', value: '3' },
                { label: '4 columns', value: '4' },
              ],
              required: true,
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
              required: true,
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
