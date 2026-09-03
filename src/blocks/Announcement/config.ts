import type { Block, TabsField } from 'payload'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'

export const AnnouncementBlock: Block = {
  slug: 'announcement',
  interfaceName: 'AnnouncementBlock',
  admin: getBlockThumbnailAdmin('announcement'),
  labels: {
    singular: 'Announcement',
    plural: 'Announcements',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'label',
              label: 'Announcement Label',
              type: 'text',
            },
            {
              name: 'items',
              type: 'array',
              minRows: 1,
              required: true,
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'description',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  label: 'Link URL',
                  type: 'text',
                },
              ],
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'displayMode',
              label: 'Animation Mode',
              type: 'select',
              defaultValue: 'vertical',
              options: [
                {
                  label: 'Vertical Slider',
                  value: 'vertical',
                },
                {
                  label: 'Horizontal Slider',
                  value: 'horizontal',
                },
                {
                  label: 'Marquee',
                  value: 'marquee',
                },
              ],
              required: true,
            },
            {
              name: 'intervalMs',
              label: 'Announcement Interval (ms)',
              type: 'number',
              defaultValue: 4000,
              min: 2000,
              admin: {
                condition: (_, siblingData) => siblingData?.displayMode !== 'marquee',
              },
              required: true,
            },
            {
              name: 'marqueeDurationMs',
              label: 'Marquee Duration (ms)',
              type: 'number',
              defaultValue: 18000,
              min: 8000,
              admin: {
                condition: (_, siblingData) => siblingData?.displayMode === 'marquee',
                description: 'Lower values scroll faster.',
              },
              required: true,
            },
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
