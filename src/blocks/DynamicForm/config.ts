import type { Block, SelectField, TabsField, UploadField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

export const dynamicFormLayoutOptions = [
  { label: 'Image (introduction and form beside a photo)', value: 'image' },
  { label: 'Split (introduction beside the form)', value: 'split' },
  { label: 'Stacked (introduction above the form)', value: 'stacked' },
] as const

const usesImage = (_: unknown, siblingData: { layout?: unknown } | undefined) =>
  siblingData?.layout === 'image'

const imageField = {
  name: 'image',
  type: 'upload',
  relationTo: 'media',
  admin: {
    condition: usesImage,
    description: 'Fills the half of the section beside the form. Landscape photos work best.',
  },
  validate: (value, { siblingData }) =>
    (siblingData as { layout?: unknown } | undefined)?.layout === 'image' && !value
      ? 'Add an image or choose another layout.'
      : true,
} satisfies UploadField

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
            imageField,
            {
              name: 'imageAlt',
              label: 'Image Alt Text',
              type: 'text',
              admin: { condition: usesImage },
            },
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
              defaultValue: 'image',
              required: true,
              options: [...dynamicFormLayoutOptions],
            } satisfies SelectField,
            {
              name: 'imagePosition',
              label: 'Image Position',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: { condition: usesImage },
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
