import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

export const GalleryCoverflowBlock: Block = {
  slug: 'galleryCoverflow',
  interfaceName: 'GalleryCoverflowBlock',
  admin: getBlockThumbnailAdmin('galleryCoverflow'),
  labels: {
    singular: 'Gallery Coverflow',
    plural: 'Gallery Coverflows',
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
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Action', maxRows: 1 }),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            {
              name: 'images',
              label: 'Images',
              type: 'array',
              minRows: 3,
              maxRows: 20,
              admin: {
                initCollapsed: true,
                description:
                  'Add at least 3 images. More images create a richer coverflow carousel.',
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            } satisfies ArrayField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'contentAlignment',
              label: 'Content Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
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
