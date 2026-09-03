import type { Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

const aspectRatioField = {
  name: 'aspectRatio',
  label: 'Aspect Ratio',
  type: 'select',
  defaultValue: '16/9',
  options: [
    { label: '16:9 (Widescreen)', value: '16/9' },
    { label: '4:3 (Classic)', value: '4/3' },
    { label: '1:1 (Square)', value: '1/1' },
    { label: '9:16 (Portrait / Reels)', value: '9/16' },
  ],
  required: true,
} satisfies SelectField

const sizeField = {
  name: 'size',
  label: 'Container Width',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'None', value: 'none' },
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Comfortable', value: 'comfortable' },
  ],
  required: true,
} satisfies SelectField

const maxWidthField = {
  name: 'maxWidth',
  label: 'Video Width',
  type: 'select',
  defaultValue: 'lg',
  options: [
    { label: 'Medium (768px)', value: 'md' },
    { label: 'Wide (1024px)', value: 'lg' },
    { label: 'Full', value: 'full' },
  ],
  required: true,
} satisfies SelectField

export const VideoEmbedBlock: Block = {
  admin: getBlockThumbnailAdmin('videoEmbed'),
  slug: 'videoEmbed',
  interfaceName: 'VideoEmbedBlock',
  labels: {
    singular: 'Video / Embed',
    plural: 'Video / Embed Blocks',
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
              label: 'Eyebrow',
              type: 'text',
            },
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              admin: {
                description: 'Display heading shown above the video. Also used as the iframe accessibility title.',
              },
            },
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
            },
            createContentActionsField(),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            {
              name: 'url',
              label: 'Video URL',
              type: 'text',
              required: true,
              admin: {
                description:
                  'Paste a YouTube, Vimeo, or direct .mp4/.webm URL. YouTube and Vimeo links are automatically embedded as iframes.',
              },
            },
            {
              name: 'caption',
              label: 'Caption',
              type: 'text',
              admin: {
                description: 'Optional caption displayed below the video.',
              },
            },
            {
              name: 'autoplay',
              label: 'Autoplay (muted)',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Autoplay is always muted to comply with browser policies.',
              },
            },
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
                { label: 'Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            aspectRatioField,
            maxWidthField,
            sizeField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
