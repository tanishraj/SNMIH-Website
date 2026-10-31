import type { Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

export const dynamicFormLayoutOptions = [
  { label: 'Split (introduction beside the form)', value: 'split' },
  { label: 'Stacked (introduction above the form)', value: 'stacked' },
] as const

/**
 * Renders any published general or lead Form field by field, including file uploads, so a
 * single block covers applications, enquiries and requests without a fixed field set.
 */
export const DynamicFormBlock: Block = {
  admin: getBlockThumbnailAdmin('dynamicForm'),
  slug: 'dynamicForm',
  interfaceName: 'DynamicFormBlock',
  labels: {
    singular: 'Dynamic Form',
    plural: 'Dynamic Forms',
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
              admin: { placeholder: 'Optional small label above the title, e.g. Careers' },
            },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            {
              name: 'form',
              type: 'relationship',
              relationTo: 'forms',
              required: true,
              filterOptions: {
                and: [
                  { _status: { equals: 'published' } },
                  { submissionIntent: { in: ['general', 'lead'] } },
                ],
              },
              admin: {
                description:
                  'A published general or lead form. Every field is rendered in its saved order; file upload fields are supported.',
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
              name: 'layout',
              type: 'select',
              defaultValue: 'split',
              required: true,
              options: [...dynamicFormLayoutOptions],
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
              admin: { description: 'Applies to the Stacked layout.' },
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
