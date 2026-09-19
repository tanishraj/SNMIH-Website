import { type CollectionConfig } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { Footer56Block } from '@/blocks/Footer56/config'
import { FooterMinimalBlock } from '@/blocks/FooterMinimal/config'
import { projectSlugField } from '@/fields/projectSlugField'
import { createDraftPublishQueueHook } from '@/hooks/syncDraftPublishToWorkQueue'
import { revalidateGlobalsCache, revalidateDeletedGlobalsCache } from '@/hooks/revalidateCmsContent'

export const Footers: CollectionConfig = {
  slug: 'footers',
  labels: {
    singular: 'Footer',
    plural: 'Footers',
  },
  admin: {
    group: 'Site Structure',
    hidden: hideUnlessFeature('footers'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
    description: 'Reusable site footer presets powered by footer layout blocks.',
    listSearchableFields: ['title', 'slug'],
  },
  access: {
    create: requireFeature('footers'),
    delete: deleteFeatureOrAdmin('footers'),
    read: allowPublishedReadOrFeature('footers'),
    readVersions: requireFeature('footers'),
    update: requireFeature('footers'),
  },
  hooks: {
    afterDelete: [revalidateDeletedGlobalsCache],
    afterChange: [
      revalidateGlobalsCache,
      createDraftPublishQueueHook({
        sourceAdminPathPrefix: '/admin/collections/footers',
        sourceCollection: 'footers',
        summary: (_doc, title) => `${title} has unpublished draft changes.`,
        titleField: 'title',
      }),
    ],
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
      name: 'layout',
      type: 'blocks',
      blocks: [Footer56Block, FooterMinimalBlock],
      admin: {
        initCollapsed: true,
      },
    },
  ],
}
