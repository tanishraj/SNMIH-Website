import type { Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

export const QuoteBlockBlock: Block = {
  admin: getBlockThumbnailAdmin('quoteBlock'),
  slug: 'quoteBlock',
  interfaceName: 'QuoteBlockBlock',
  labels: {
    singular: 'Quote / Testimonial',
    plural: 'Quotes / Testimonials',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'quote',
              label: 'Quote',
              type: 'textarea',
              required: true,
              admin: {
                description: 'The pull quote or testimonial text. The leading " " is added automatically.',
              },
            },
            {
              name: 'attributionName',
              label: 'Name',
              type: 'text',
              admin: { description: 'Person or organization being quoted.' },
            },
            {
              name: 'attributionTitle',
              label: 'Title / Role',
              type: 'text',
            },
            {
              name: 'attributionCompany',
              label: 'Company / Institution',
              type: 'text',
            },
            {
              name: 'avatar',
              label: 'Avatar Image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Optional photo of the person being quoted.',
              },
            },
            {
              name: 'rating',
              label: 'Star Rating',
              type: 'select',
              defaultValue: 'none',
              options: [
                { label: 'None', value: 'none' },
                { label: '1 Star', value: '1' },
                { label: '2 Stars', value: '2' },
                { label: '3 Stars', value: '3' },
                { label: '4 Stars', value: '4' },
                { label: '5 Stars', value: '5' },
              ],
            } satisfies SelectField,
            {
              name: 'eyebrow',
              type: 'text',
              admin: { description: 'Optional small label above the quote (e.g. "Student Story").' },
            },
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
              defaultValue: 'centered',
              options: [
                { label: 'Centered (large pull quote)', value: 'centered' },
                { label: 'Side (avatar left, quote right)', value: 'side' },
                { label: 'Card (contained box with shadow)', value: 'card' },
                { label: 'Highlight (accent border left)', value: 'highlight' },
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
            {
              name: 'quoteSize',
              label: 'Quote Text Size',
              type: 'select',
              defaultValue: 'lg',
              options: [
                { label: 'Small', value: 'sm' },
                { label: 'Medium', value: 'lg' },
                { label: 'Large', value: 'xl' },
                { label: 'Display', value: '2xl' },
              ],
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
