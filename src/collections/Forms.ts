import { type CollectionConfig } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  featureFieldReadAccess,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { projectSlugField } from '@/fields/projectSlugField'
import {
  formFieldTypeOptions,
  formSubmissionIntentOptions,
  isTextLikeFormFieldType,
  isValidFormFieldName,
  validateFormFieldDefinitionsForIntent,
} from '@/lib/forms'

export const Forms: CollectionConfig = {
  slug: 'forms',
  labels: {
    singular: 'Form',
    plural: 'Forms',
  },
  admin: {
    group: 'Forms',
    hidden: hideUnlessFeature('forms'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description: 'Reusable form definitions that can be placed on pages.',
    listSearchableFields: ['title', 'slug'],
  },
  access: {
    create: requireFeature('forms'),
    delete: deleteFeatureOrAdmin('forms'),
    read: allowPublishedReadOrFeature('forms'),
    readVersions: requireFeature('forms'),
    update: requireFeature('forms'),
  },
  versions: {
    drafts: true,
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    projectSlugField({
      useAsSlug: 'title',
    }),
    {
      name: 'internalNotes',
      label: 'Internal Notes',
      type: 'textarea',
      access: {
        read: featureFieldReadAccess('forms'),
      },
      admin: {
        description: 'Optional notes for editors. This is not shown on the website.',
      },
    },
    {
      name: 'submissionIntent',
      type: 'select',
      defaultValue: 'general',
      options: [...formSubmissionIntentOptions],
      required: true,
      admin: {
        description:
          'Controls how submissions are operated after intake and whether review promotion applies.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'submitButtonLabel',
          type: 'text',
          required: true,
          defaultValue: 'Submit',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'successMessage',
          type: 'textarea',
          required: true,
          defaultValue: 'Thanks. Your submission has been received.',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'notificationRecipients',
      label: 'Notification Recipients',
      type: 'array',
      access: {
        read: featureFieldReadAccess('forms'),
      },
      labels: {
        singular: 'Recipient',
        plural: 'Recipients',
      },
      admin: {
        description:
          'Optional internal email recipients who should be notified when this form receives a valid submission.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'email',
          type: 'email',
          required: true,
        },
      ],
    },
    {
      name: 'submitterReply',
      label: 'Submitter Confirmation',
      type: 'group',
      admin: {
        description:
          'Optional confirmation email sent automatically to the person who submitted the form.',
      },
      fields: [
        {
          name: 'enabled',
          label: 'Send confirmation email to submitter',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'subject',
          label: 'Subject',
          type: 'text',
          defaultValue: 'Thanks for getting in touch',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
          },
        },
        {
          name: 'message',
          label: 'Message body',
          type: 'textarea',
          defaultValue: 'We have received your message and will be in touch shortly.',
          admin: {
            condition: (_, siblingData) => Boolean(siblingData?.enabled),
            description: 'Plain text shown in the confirmation email.',
          },
        },
      ],
    },
    {
      name: 'fields',
      type: 'array',
      required: true,
      minRows: 1,
      validate: (value, { data }) =>
        validateFormFieldDefinitionsForIntent({
          fields: value,
          submissionIntent: (data as { submissionIntent?: unknown }).submissionIntent,
        }),
      labels: {
        singular: 'Field',
        plural: 'Fields',
      },
      admin: {
        description:
          'Review Submission uses its fixed review fields; it cannot render additional required fields.',
        initCollapsed: true,
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: {
                description: 'Machine key used in stored submission data.',
                width: '50%',
              },
              validate: (value: unknown) => {
                if (typeof value !== 'string' || !value.trim()) {
                  return 'Field name is required.'
                }

                return isValidFormFieldName(value.trim())
                  ? true
                  : 'Use only letters, numbers, and underscores. Names must start with a letter.'
              },
            },
            {
              name: 'label',
              type: 'text',
              required: true,
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              options: [...formFieldTypeOptions],
              defaultValue: 'text',
              admin: {
                width: '50%',
              },
            },
            {
              name: 'required',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                width: '50%',
              },
            },
          ],
        },
        {
          name: 'placeholder',
          type: 'text',
          admin: {
            condition: (_, siblingData) => isTextLikeFormFieldType(siblingData?.type ?? 'text'),
          },
        },
        {
          name: 'options',
          type: 'array',
          labels: {
            singular: 'Option',
            plural: 'Options',
          },
          admin: {
            initCollapsed: true,
            condition: (_, siblingData) => siblingData?.type === 'select',
          },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'value',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
