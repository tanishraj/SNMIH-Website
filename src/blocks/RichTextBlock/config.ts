import type { Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { projectEditor } from '@/fields/bodyEditorConfig'

const sizeField = {
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
} satisfies SelectField

const maxWidthField = {
  name: 'maxWidth',
  label: 'Max Width',
  type: 'select',
  defaultValue: 'prose',
  options: [
    { label: 'Prose (65ch)', value: 'prose' },
    { label: 'Medium (768px)', value: 'md' },
    { label: 'Wide (1024px)', value: 'lg' },
    { label: 'Full', value: 'full' },
  ],
  required: true,
} satisfies SelectField

export const RichTextBlock: Block = {
  admin: getBlockThumbnailAdmin('richText'),
  slug: 'richText',
  interfaceName: 'RichTextBlock',
  labels: {
    singular: 'Rich Text',
    plural: 'Rich Text Blocks',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'content',
              label: 'Content',
              type: 'richText',
              required: true,
              editor: projectEditor,
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [createBlockAppearanceFields(), sizeField, maxWidthField],
        },
      ],
    } satisfies TabsField,
  ],
}
