import { type CollectionConfig } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { buildSEOFields } from '@/fields/buildSEOFields'
import { publicationMetadataFields } from '@/fields/publicationMetadataFields'
import { projectSlugField } from '@/fields/projectSlugField'
import { revalidateGlobalsCache } from '@/hooks/revalidateCmsContent'
import { enforcePublicationPolicy } from '@/hooks/enforcePublicationPolicy'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { validateSEOContract } from '@/hooks/validateSEOContract'
import { systemPageTypeOptions, type SystemPageType } from '@/lib/systemPageTypes'

import { System404Block } from '../blocks/System404/config'
import { SystemComingSoonBlock } from '../blocks/SystemComingSoon/config'
import { SystemMaintenanceBlock } from '../blocks/SystemMaintenance/config'
import { migrateLegacySystemPageLinksBeforeChange } from '../hooks/migrateLegacyReusableLinks'
import { preventReferencedSystemPageInvalidation } from '../hooks/preventReferencedSystemPageInvalidation'

const blockTypeBySystemPageType: Record<
  SystemPageType,
  'system404' | 'systemMaintenance' | 'systemComingSoon'
> = {
  '404': 'system404',
  maintenance: 'systemMaintenance',
  comingSoon: 'systemComingSoon',
}

const validateSystemLayout = (
  value: unknown,
  { data }: { data?: { type?: SystemPageType | null } },
) => {
  if (!Array.isArray(value) || value.length === 0) {
    return 'Layout requires one block.'
  }

  const selectedType = data?.type

  if (!selectedType) {
    return true
  }

  const expectedBlockType = blockTypeBySystemPageType[selectedType]
  const [firstBlock] = value

  if (!firstBlock || typeof firstBlock !== 'object' || !('blockType' in firstBlock)) {
    return 'Layout contains an invalid block.'
  }

  if (firstBlock.blockType !== expectedBlockType) {
    return 'Selected block must match the system page type.'
  }

  return true
}

export const SystemPages: CollectionConfig = {
  slug: 'system-pages',
  labels: {
    singular: 'System Page',
    plural: 'System Pages',
  },
  admin: {
    description:
      'The 404, maintenance, and coming soon pages — activated from Site Modes in Configuration.',
    group: 'Site Structure',
    hidden: hideUnlessFeature('systemPages'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'updatedAt'],
    listSearchableFields: ['title', 'slug'],
  },
  access: {
    create: requireFeature('systemPages'),
    delete: deleteFeatureOrAdmin('systemPages'),
    read: allowPublishedReadOrFeature('systemPages'),
    readVersions: requireFeature('systemPages'),
    update: requireFeature('systemPages'),
  },
  hooks: {
    afterChange: [
      revalidateGlobalsCache,
      createCollectionAuditHook({
        entityType: 'system_page',
        feature: 'systemPages',
        getSummary: ({ doc, previousDoc }) =>
          `Publication status changed from ${previousDoc?._status ?? 'draft'} to ${doc._status ?? 'draft'}.`,
        titleField: 'title',
      }),
    ],
    beforeChange: [
      validateSEOContract(),
      enforcePublicationPolicy('systemPages', 'system-pages'),
      preventReferencedSystemPageInvalidation,
      migrateLegacySystemPageLinksBeforeChange,
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
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'type',
              type: 'select',
              required: true,
              defaultValue: '404',
              options: [...systemPageTypeOptions],
              admin: {
                description:
                  'Choose which system behavior this preset is intended for. Only matching presets appear in System Defaults.',
              },
            },
            {
              name: 'layout',
              label: 'Layout',
              type: 'blocks',
              required: true,
              minRows: 1,
              maxRows: 1,
              blocks: [System404Block, SystemMaintenanceBlock, SystemComingSoonBlock],
              validate: validateSystemLayout,
              admin: {
                initCollapsed: true,
                description:
                  'Choose one system block variant for this preset. The selected block must match the system page type.',
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [...buildSEOFields()],
        },
      ],
    },
    ...publicationMetadataFields('systemPages'),
  ],
}
