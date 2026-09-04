import type { CollectionConfig } from 'payload'

import { reusableSectionBuilderBlocks } from '@/blocks/blockCatalog'
import { validateUniqueBlockAnchorIDs } from '@/blocks/shared/blockAnchor'
import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { revalidateGlobalsCache } from '@/hooks/revalidateCmsContent'

export const ReusableSections: CollectionConfig = {
  slug: 'reusable-sections',
  labels: {
    singular: 'Reusable Section',
    plural: 'Reusable Sections',
  },
  admin: {
    description:
      'Shared block groups that sync across every page that references them. Edit once, update everywhere.',
    group: 'Content',
    hidden: hideUnlessFeature('reusableSections'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  access: {
    create: requireFeature('reusableSections'),
    delete: deleteFeatureOrAdmin('reusableSections'),
    read: allowPublishedReadOrFeature('reusableSections'),
    readVersions: requireFeature('reusableSections'),
    update: requireFeature('reusableSections'),
  },
  hooks: {
    afterChange: [
      revalidateGlobalsCache,
      createCollectionAuditHook({
        entityType: 'reusable-section',
        feature: 'reusableSections',
        getSummary: ({ doc }) => `Reusable section "${doc.title}" was updated.`,
        titleField: 'title',
      }),
    ],
  },
  versions: { drafts: true },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal name shown in the admin and in the block picker.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      // Reusable Section is intentionally excluded to prevent direct recursive selection.
      blocks: reusableSectionBuilderBlocks,
      validate: validateUniqueBlockAnchorIDs,
    },
  ],
}
