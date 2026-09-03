import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

const testimonialsField = {
  name: 'testimonials',
  label: 'Testimonials',
  type: 'array',
  minRows: 1,
  maxRows: 12,
  admin: { initCollapsed: true },
  fields: [
    createCardTabs({
      backgroundFieldOptions: {
        adminDescription:
          'Applied to Grid and Featured presentations. Compact List remains intentionally unboxed.',
      },
      contentFields: [
        {
          name: 'quote',
          label: 'Quote',
          type: 'textarea',
          required: true,
        },
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
        },
        {
          name: 'role',
          label: 'Role / Program',
          type: 'text',
          admin: { description: 'e.g. "B.Tech Computer Science, 2023" or "Alumni, MBA"' },
        },
        {
          name: 'department',
          label: 'Department / School',
          type: 'text',
        },
        {
          name: 'avatar',
          label: 'Photo',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    }),
  ],
} satisfies ArrayField

export const TestimonialGridBlock: Block = {
  admin: getBlockThumbnailAdmin('testimonialGrid'),
  slug: 'testimonialGrid',
  interfaceName: 'TestimonialGridBlock',
  labels: {
    singular: 'Testimonial Grid',
    plural: 'Testimonial Grids',
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
              admin: { description: 'Small label above heading, e.g. "Student Stories"' },
            },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            testimonialsField,
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
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
              ],
            } satisfies SelectField,
            {
              name: 'variant',
              label: 'Variant',
              type: 'select',
              defaultValue: 'grid',
              options: [
                { label: 'Grid (cards)', value: 'grid' },
                { label: 'Featured (1 large + row)', value: 'featured' },
                { label: 'Compact list', value: 'list' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Columns',
              type: 'select',
              defaultValue: '3',
              options: [
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
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
