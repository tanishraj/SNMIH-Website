import type { Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

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

export const ReviewSubmissionBlock: Block = {
  slug: 'reviewSubmission',
  interfaceName: 'ReviewSubmissionBlock',
  admin: getBlockThumbnailAdmin('reviewSubmission'),
  labels: {
    singular: 'Review Submission',
    plural: 'Review Submissions',
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
            createContentActionsField(),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            {
              name: 'form',
              label: 'Review Form',
              type: 'relationship',
              relationTo: 'forms',
              required: true,
              filterOptions: {
                submissionIntent: {
                  equals: 'review',
                },
              },
              admin: {
                description:
                  'Select a review-intent form. Use rating, reviewerName, reviewerEmail, reviewBody, and an optional subjectLabel select field; subjectLabel options become the topic chips. Review titles are generated from the submitted review.',
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
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
