import type { Block, RelationshipFieldSingleValidation, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { validateContact33FormDefinition } from '@/lib/contact33Form'
import type { Form } from '@/payload-types'

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

const contentAlignmentField = {
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
} satisfies SelectField

const imagePositionField = {
  name: 'imagePosition',
  label: 'Image Position',
  type: 'select',
  defaultValue: 'right',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField

const validateContactForm: RelationshipFieldSingleValidation = async (value, { req }) => {
  if (value == null) {
    return true
  }

  if (typeof value === 'object' && value !== null && 'fields' in value) {
    return validateContact33FormDefinition(value as unknown as Form)
  }

  const formID =
    typeof value === 'object' && value !== null && 'value' in value
      ? value.value
      : value
  const form = await req.payload.findByID({
    collection: 'forms',
    depth: 0,
    id: formID as string | number,
    req,
  })

  return validateContact33FormDefinition(form)
}

export const Contact33Block: Block = {
  slug: 'contact33',
  interfaceName: 'Contact33Block',
  admin: getBlockThumbnailAdmin('contact33'),
  labels: {
    singular: 'Contact Form',
    plural: 'Contact Forms',
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
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'imageAlt',
              label: 'Image Alt Text',
              type: 'text',
              required: true,
            },
            {
              name: 'form',
              label: 'Contact Form',
              type: 'relationship',
              relationTo: 'forms',
              required: true,
              filterOptions: {
                and: [
                  { _status: { equals: 'published' } },
                  { submissionIntent: { in: ['general', 'lead'] } },
                ],
              },
              validate: validateContactForm,
              admin: {
                description:
                  'Select a published general or lead form with name (Text), email (Email), subject (Select), and message (Textarea) fields.',
              },
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            contentAlignmentField,
            sizeField,
            imagePositionField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
