import type { CollectionConfig } from 'payload'

import { adminOnlyAccess, canReadFeature, hideUnlessFeature } from '@/access/featureAccess'
import {
  FORM_ATTACHMENT_MIME_TYPES,
  FORM_ATTACHMENTS_COLLECTION,
  FORM_ATTACHMENTS_STORAGE_PREFIX,
} from '@/lib/formAttachmentsShared'

const immutableAttachmentFieldAccess = {
  update: () => false,
}

/**
 * Files visitors upload through public forms. Records are created only by the submission
 * route; operators with the Form Submissions feature can view and download them, and nobody
 * can edit them. Files are never public: with S3 they are streamed through Payload's access
 * control rather than served from a public URL.
 */
export const FormAttachments: CollectionConfig = {
  slug: FORM_ATTACHMENTS_COLLECTION,
  labels: {
    singular: 'Form Attachment',
    plural: 'Form Attachments',
  },
  admin: {
    group: 'Forms',
    hidden: hideUnlessFeature('formSubmissions'),
    useAsTitle: 'originalFilename',
    defaultColumns: ['originalFilename', 'form', 'submission', 'filesize', 'createdAt'],
    description:
      'Files uploaded through public forms. Open the related Form Submission to see the full entry.',
    listSearchableFields: ['originalFilename', 'filename'],
  },
  access: {
    create: () => false,
    delete: adminOnlyAccess,
    read: ({ req }) => canReadFeature(req.user, 'formSubmissions'),
    update: () => false,
  },
  timestamps: true,
  upload: {
    crop: false,
    focalPoint: false,
    imageSizes: [],
    mimeTypes: FORM_ATTACHMENT_MIME_TYPES,
    staticDir: FORM_ATTACHMENTS_STORAGE_PREFIX,
  },
  fields: [
    {
      name: 'originalFilename',
      label: 'Original Filename',
      type: 'text',
      access: immutableAttachmentFieldAccess,
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'form',
      type: 'relationship',
      access: immutableAttachmentFieldAccess,
      relationTo: 'forms',
      required: true,
      admin: { readOnly: true },
    },
    {
      name: 'submission',
      type: 'relationship',
      access: immutableAttachmentFieldAccess,
      relationTo: 'form-submissions',
      admin: { readOnly: true },
    },
    {
      name: 'fieldName',
      label: 'Form Field',
      type: 'text',
      access: immutableAttachmentFieldAccess,
      required: true,
      admin: {
        description: 'Machine key of the form field the file was uploaded through.',
        readOnly: true,
      },
    },
  ],
}
