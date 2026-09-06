import type { CollectionAfterReadHook, CollectionConfig } from 'payload'

import {
  adminOnlyAccess,
  canReadFeature,
  hasFeature,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { syncFormSubmissionToWorkQueue } from '@/hooks/syncFormSubmissionToWorkQueue'
import { updateFormSubmissionActivity } from '@/hooks/updateFormSubmissionActivity'
import { formSubmissionIntentOptions } from '@/lib/forms'

const immutableSubmissionFieldAccess = {
  update: () => false,
}

const sanitizeSubmissionDependencyRead: CollectionAfterReadHook = ({ doc, req }) => {
  if (hasFeature(req.user, 'formSubmissions')) return doc
  if (!hasFeature(req.user, 'reviews')) return doc

  return {
    id: doc.id,
    submitterEmail: `Submission #${doc.id}`,
  }
}

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  labels: {
    singular: 'Form Submission',
    plural: 'Form Submissions',
  },
  admin: {
    group: 'Forms',
    hidden: hideUnlessFeature('formSubmissions'),
    useAsTitle: 'submitterEmail',
    defaultColumns: [
      'status',
      'owner',
      'submissionIntent',
      'submitterName',
      'submitterEmail',
      'submitterPhone',
      'submittedAt',
      'lastActionAt',
    ],
    description:
      'Stored form submissions. Submission payload fields stay read-only after creation, while operators can update operational status.',
    listSearchableFields: [
      'email',
      'submitterEmail',
      'submitterName',
      'submitterPhone',
      'campaign',
      'source',
    ],
  },
  access: {
    create: () => false,
    delete: adminOnlyAccess,
    read: ({ req }) => canReadFeature(req.user, 'formSubmissions'),
    update: requireFeature('formSubmissions'),
  },
  hooks: {
    afterChange: [syncFormSubmissionToWorkQueue],
    afterRead: [sanitizeSubmissionDependencyRead],
    beforeChange: [updateFormSubmissionActivity],
  },
  timestamps: true,
  fields: [
    {
      name: 'form',
      type: 'relationship',
      access: immutableSubmissionFieldAccess,
      relationTo: 'forms',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        {
          label: 'New',
          value: 'new',
        },
        {
          label: 'In Review',
          value: 'in_review',
        },
        {
          label: 'Qualified',
          value: 'qualified',
        },
        {
          label: 'Won',
          value: 'won',
        },
        {
          label: 'Rejected',
          value: 'rejected',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
    },
    {
      name: 'internalNotes',
      type: 'textarea',
    },
    {
      name: 'submissionIntent',
      type: 'select',
      access: immutableSubmissionFieldAccess,
      defaultValue: 'general',
      options: [...formSubmissionIntentOptions],
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'source',
      type: 'text',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'campaign',
      type: 'text',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'landingPage',
      type: 'text',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'submitterName',
      type: 'text',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'submitterEmail',
      type: 'email',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'submitterPhone',
      type: 'text',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'email',
      type: 'email',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'linkedReview',
      type: 'relationship',
      access: immutableSubmissionFieldAccess,
      relationTo: 'reviews',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'promotionError',
      type: 'textarea',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'submittedAt',
      type: 'date',
      access: immutableSubmissionFieldAccess,
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'lastActionAt',
      type: 'date',
      access: immutableSubmissionFieldAccess,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'data',
      label: 'Submitted Data',
      type: 'json',
      access: immutableSubmissionFieldAccess,
      required: true,
      admin: {
        readOnly: true,
      },
    },
  ],
}
