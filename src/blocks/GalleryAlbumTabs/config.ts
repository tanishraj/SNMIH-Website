import type { Block, RadioField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

export const GalleryAlbumTabsBlock: Block = {
  admin: getBlockThumbnailAdmin('galleryAlbumTabs'),
  slug: 'galleryAlbumTabs',
  interfaceName: 'GalleryAlbumTabsBlock',
  labels: {
    singular: 'Gallery Album Tabs',
    plural: 'Gallery Album Tabs',
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
              admin: { description: 'Small label above the optional section heading.' },
            },
            {
              name: 'title',
              type: 'text',
              admin: {
                description: 'Optional. Album tabs can render without a section heading.',
              },
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
            createContentActionsField({ label: 'Header Actions', maxRows: 2 }),
            {
              name: 'galleryAlbums',
              label: 'Gallery Albums',
              type: 'relationship',
              relationTo: 'gallery-albums',
              hasMany: true,
              required: true,
              admin: {
                allowCreate: true,
                description:
                  'Select albums to create visitor tabs. Album titles become tab labels; drag selections to control Manual order.',
                isSortable: true,
              },
            },
            {
              name: 'displayOrder',
              label: 'Display Order',
              type: 'select',
              defaultValue: 'latestEventDate',
              options: [
                { label: 'Latest Event Date', value: 'latestEventDate' },
                { label: 'Manual', value: 'manual' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'allTabLabel',
              label: 'All Tab Label',
              type: 'text',
              defaultValue: 'All',
              admin: {
                description: 'The mandatory first tab. Leave blank to use “All”.',
              },
            },
            {
              name: 'imagesPerLoad',
              label: 'Images Per Load',
              type: 'select',
              defaultValue: '9',
              options: [
                { label: '6', value: '6' },
                { label: '9', value: '9' },
                { label: '12', value: '12' },
              ],
              required: true,
              admin: {
                description:
                  'Number of images shown initially and revealed by each Load More action.',
              },
            } satisfies SelectField,
            {
              name: 'loadMoreLabel',
              label: 'Load More Label',
              type: 'text',
              defaultValue: 'Load More',
            },
            {
              name: 'emptyStateMessage',
              label: 'Empty State Message',
              type: 'text',
              defaultValue: 'No gallery images available.',
              admin: {
                description: 'Shown when selected published albums contain no usable images.',
              },
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
              name: 'tabVariant',
              label: 'Tab Variant',
              type: 'select',
              defaultValue: 'underline',
              options: [
                { label: 'Contained', value: 'contained' },
                { label: 'Pill', value: 'pill' },
                { label: 'Underline', value: 'underline' },
              ],
              required: true,
              admin: {
                description: 'Choose a contained, pill-shaped, or minimal underline tab treatment.',
              },
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
              admin: {
                description: 'Header actions only sit beside the heading when aligned left.',
              },
            } satisfies SelectField,
            {
              name: 'headerActionAlignment',
              label: 'Header Action Vertical Alignment',
              type: 'radio',
              defaultValue: 'center',
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ],
              required: true,
              admin: {
                condition: (_data, siblingData) => siblingData?.contentAlignment !== 'center',
                description:
                  'Aligns header actions against the content when they appear beside the heading.',
                layout: 'horizontal',
              },
            } satisfies RadioField,
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
