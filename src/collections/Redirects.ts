import type { CollectionBeforeValidateHook, CollectionConfig, Field } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { createDraftPublishQueueHook } from '@/hooks/syncDraftPublishToWorkQueue'
import {
  revalidateDeletedRedirectCache,
  revalidateRedirectsCache,
} from '@/hooks/revalidateCmsContent'

const validateRequiredDestinationField =
  (destinationType: 'page' | 'custom', message: string) =>
  (
    value: unknown,
    { siblingData }: { siblingData?: { destinationType?: 'page' | 'custom' | null } },
  ) => {
    if (siblingData?.destinationType === destinationType && !value) {
      return message
    }

    return true
  }

const normalizeRedirectPath = (value: string): string => {
  const [rawPathname] = value.trim().split('?')
  const pathname = rawPathname.trim()

  if (!pathname || pathname === '/') {
    return '/'
  }

  const withLeadingSlash = pathname.startsWith('/') ? pathname : `/${pathname}`
  return withLeadingSlash.replace(/\/+$/, '')
}

const beforeValidate: CollectionBeforeValidateHook = async ({ data, operation }) => {
  if (!data || (operation !== 'create' && operation !== 'update')) {
    return data
  }

  if (typeof data.fromPath === 'string') {
    data.fromPath = normalizeRedirectPath(data.fromPath)
  }

  return data
}

const fields: Field[] = [
  {
    name: 'fromPath',
    label: 'From Path',
    type: 'text',
    required: true,
    unique: true,
    index: true,
    admin: {
      description:
        'The old incoming path to redirect, for example /old-page or /services/web-design.html.',
      placeholder: '/old-path',
    },
    validate: (value: unknown) => {
      if (typeof value !== 'string' || !value.trim()) {
        return 'Enter the old path.'
      }

      if (value.includes('://')) {
        return 'Use a path only, not a full URL.'
      }

      return true
    },
  },
  {
    name: 'destinationType',
    label: 'Destination Type',
    type: 'radio',
    required: true,
    defaultValue: 'page',
    options: [
      {
        label: 'Destination Page',
        value: 'page',
      },
      {
        label: 'Custom Destination',
        value: 'custom',
      },
    ],
    admin: {
      layout: 'horizontal',
    },
  },
  {
    name: 'page',
    label: 'Destination Page',
    type: 'relationship',
    relationTo: 'pages',
    validate: validateRequiredDestinationField('page', 'Select the destination page.'),
    admin: {
      condition: (_: unknown, siblingData: { destinationType?: 'page' | 'custom' | null }) =>
        siblingData?.destinationType === 'page',
      description: 'Choose the page this old path should redirect to.',
    },
  },
  {
    name: 'url',
    label: 'Custom Destination',
    type: 'text',
    validate: validateRequiredDestinationField('custom', 'Enter the destination URL.'),
    admin: {
      condition: (_: unknown, siblingData: { destinationType?: 'page' | 'custom' | null }) =>
        siblingData?.destinationType === 'custom',
      placeholder: '/new-path or https://example.com',
      description: 'Enter an internal path or full external URL to redirect to.',
    },
  },
  {
    name: 'statusCode',
    type: 'select',
    required: true,
    defaultValue: '301',
    options: [
      {
        label: 'Permanent (301)',
        value: '301',
      },
      {
        label: 'Temporary (302)',
        value: '302',
      },
    ],
    admin: {
      description:
        'Use 301 for permanent site migrations. Use 302 only for temporary routing changes.',
      position: 'sidebar',
    },
  },
  {
    name: 'enabled',
    type: 'checkbox',
    defaultValue: true,
    admin: {
      position: 'sidebar',
    },
  },
]

export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: {
    singular: 'Redirect',
    plural: 'Redirects',
  },
  admin: {
    group: 'Navigation',
    hidden: hideUnlessFeature('redirects'),
    useAsTitle: 'fromPath',
    defaultColumns: ['fromPath', 'destinationType', 'statusCode', 'enabled', 'updatedAt'],
    listSearchableFields: ['fromPath', 'url'],
    description:
      'URL redirects managed from the CMS — changes go live within 60 seconds, no rebuild needed. Auto-generated when a published page URL changes.',
  },
  access: {
    create: requireFeature('redirects'),
    delete: deleteFeatureOrAdmin('redirects'),
    read: allowPublishedReadOrFeature('redirects'),
    readVersions: requireFeature('redirects'),
    update: requireFeature('redirects'),
  },
  hooks: {
    afterChange: [
      createDraftPublishQueueHook({
        sourceAdminPathPrefix: '/admin/collections/redirects',
        sourceCollection: 'redirects',
        summary: (_doc, title) => `${title} has unpublished redirect changes.`,
        titleField: 'fromPath',
      }),
      revalidateRedirectsCache,
    ],
    afterDelete: [revalidateDeletedRedirectCache],
    beforeValidate: [beforeValidate],
  },
  versions: {
    drafts: true,
  },
  timestamps: true,
  fields,
}
