import type { CollectionConfig, Field } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { createDraftPublishQueueHook } from '@/hooks/syncDraftPublishToWorkQueue'

const validateRequiredLinkField =
  (linkType: 'page' | 'custom', message: string) =>
  (value: unknown, { siblingData }: { siblingData?: { linkType?: 'page' | 'custom' | null } }) => {
    if (siblingData?.linkType === linkType && !value) {
      return message
    }

    return true
  }

const fields: Field[] = [
  {
    name: 'title',
    type: 'text',
    required: true,
  },
  {
    name: 'description',
    type: 'textarea',
  },
  {
    name: 'linkType',
    type: 'radio',
    required: true,
    defaultValue: 'page',
    options: [
      {
        label: 'Page',
        value: 'page',
      },
      {
        label: 'Custom URL',
        value: 'custom',
      },
    ],
    admin: {
      layout: 'horizontal',
    },
  },
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    validate: validateRequiredLinkField('page', 'Select a page.'),
    admin: {
      condition: (_: unknown, siblingData: { linkType?: 'page' | 'custom' | null }) =>
        siblingData?.linkType === 'page',
    },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    validate: validateRequiredLinkField('custom', 'Enter a custom URL.'),
    admin: {
      condition: (_: unknown, siblingData: { linkType?: 'page' | 'custom' | null }) =>
        siblingData?.linkType === 'custom',
      description:
        'Use #anchor-id for a section on this page or /page-path#anchor-id for a section on another page.',
      placeholder: '#admissions, /contact, or https://example.com',
    },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  },
  {
    name: 'sourceType',
    type: 'select',
    required: true,
    defaultValue: 'manual',
    options: [
      {
        label: 'Manual',
        value: 'manual',
      },
      {
        label: 'Page Synced',
        value: 'pageSynced',
      },
    ],
    admin: {
      description: 'Shows whether this reusable link is manually managed or synced from a page.',
      position: 'sidebar',
    },
  },
  {
    name: 'syncPage',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      position: 'sidebar',
      readOnly: true,
      condition: (_: unknown, siblingData: { sourceType?: 'manual' | 'pageSynced' | null }) =>
        siblingData?.sourceType === 'pageSynced',
      description: 'The page that currently owns this synced reusable link.',
    },
  },
]

export const NavigationLinks: CollectionConfig = {
  slug: 'navigation-links',
  labels: {
    singular: 'Navigation Link',
    plural: 'Navigation Links',
  },
  admin: {
    group: 'Navigation',
    hidden: hideUnlessFeature('navigationLinks'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'linkType', 'sourceType', 'updatedAt'],
    listSearchableFields: ['title', 'url'],
    description: 'Reusable destinations for menus, CTAs, legal links, and utility links.',
  },
  access: {
    create: requireFeature('navigationLinks'),
    delete: deleteFeatureOrAdmin('navigationLinks'),
    read: allowPublishedReadOrFeature('navigationLinks'),
    readVersions: requireFeature('navigationLinks'),
    update: requireFeature('navigationLinks'),
  },
  hooks: {
    afterChange: [
      createDraftPublishQueueHook({
        isActionable: (doc) => (doc as { sourceType?: string | null })?.sourceType !== 'pageSynced',
        sourceAdminPathPrefix: '/admin/collections/navigation-links',
        sourceCollection: 'navigation-links',
        summary: (_doc, title) => `${title} has unpublished draft navigation changes.`,
        titleField: 'title',
      }),
    ],
  },
  versions: {
    drafts: true,
  },
  timestamps: true,
  fields,
}
