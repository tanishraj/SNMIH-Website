import type {
  CollectionAfterReadHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  featureFieldReadAccess,
  hasFeature,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import {
  buildMediaUsageSummary,
  findMediaUsage,
  mediaUsageAdminFieldConfig,
  type MediaUsageReference,
} from '@/lib/mediaUsage'
import { preventMediaDeletionWhileInUse } from '@/hooks/preventMediaDeletionWhileInUse'
import { syncMediaToWorkQueue } from '@/hooks/syncMediaToWorkQueue'
import { revalidateGlobalsCache, revalidateDeletedGlobalsCache } from '@/hooks/revalidateCmsContent'

const mediaAssetTypeOptions = [
  {
    label: 'General',
    value: 'general',
  },
  {
    label: 'Logo',
    value: 'logo',
  },
  {
    label: 'Hero',
    value: 'hero',
  },
  {
    label: 'SEO',
    value: 'seo',
  },
  {
    label: 'Icon',
    value: 'icon',
  },
  {
    label: 'Document',
    value: 'document',
  },
] as const

const imageOnlyAssetTypes = new Set(['hero', 'logo', 'seo'])
const isImageMimeType = (value: unknown): value is string =>
  typeof value === 'string' && value.startsWith('image/')

const beforeValidate: CollectionBeforeValidateHook = async ({ data, operation, originalDoc }) => {
  if (!data || (operation !== 'create' && operation !== 'update')) {
    return data
  }

  const assetType = typeof data.assetType === 'string' ? data.assetType : originalDoc?.assetType
  const mimeType = typeof data.mimeType === 'string' ? data.mimeType : originalDoc?.mimeType
  const alt = typeof data.alt === 'string' ? data.alt : originalDoc?.alt

  if (assetType && imageOnlyAssetTypes.has(assetType) && !isImageMimeType(mimeType)) {
    const labels: Record<string, string> = {
      hero: 'Hero',
      logo: 'Logo',
      seo: 'SEO',
    }

    throw new Error(`${labels[assetType]} assets must use an uploaded image file.`)
  }

  if (isImageMimeType(mimeType) && (!alt || alt.trim().length === 0)) {
    throw new Error('Image assets require alt text.')
  }

  return data
}

type MediaWithUsage = {
  id: number | string
  usageDetails?: MediaUsageReference[]
  usageSummary?: string
}

const populateMediaUsage: CollectionAfterReadHook<MediaWithUsage> = async ({
  doc,
  findMany,
  req,
}) => {
  if (findMany || doc.id == null || !hasFeature(req.user, 'media')) {
    return doc
  }

  const usageDetails = await findMediaUsage({
    mediaID: doc.id,
    payload: req.payload,
  })

  doc.usageDetails = usageDetails
  doc.usageSummary = buildMediaUsageSummary(usageDetails)

  return doc
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Media',
    hidden: hideUnlessFeature('media'),
    useAsTitle: 'title',
    defaultColumns: ['filename', 'alt', 'assetType', 'updatedAt'],
    listSearchableFields: ['title', 'alt', 'filename'],
  },
  access: {
    create: requireFeature('media'),
    delete: deleteFeatureOrAdmin('media'),
    read: allowPublishedReadOrFeature('media'),
    readVersions: requireFeature('media'),
    update: requireFeature('media'),
  },
  hooks: {
    afterDelete: [revalidateDeletedGlobalsCache],
    afterChange: [revalidateGlobalsCache, syncMediaToWorkQueue],
    afterRead: [populateMediaUsage],
    beforeDelete: [preventMediaDeletionWhileInUse],
    beforeValidate: [beforeValidate],
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'storageStatus',
      label: 'Storage Status',
      type: 'select',
      access: {
        read: featureFieldReadAccess('media'),
      },
      defaultValue: 'unchecked',
      options: [
        {
          label: 'Unchecked',
          value: 'unchecked',
        },
        {
          label: 'Healthy',
          value: 'healthy',
        },
        {
          label: 'Missing',
          value: 'missing',
        },
        {
          label: 'Check Failed',
          value: 'check_failed',
        },
        {
          label: 'Local Only',
          value: 'local_only',
        },
      ],
      admin: {
        description: 'Read-only storage health set by the media reconciliation process.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'storageCheckedAt',
      label: 'Storage Checked At',
      type: 'date',
      access: {
        read: featureFieldReadAccess('media'),
      },
      admin: {
        description: 'Most recent storage verification time.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'storageMissingSince',
      label: 'Missing Since',
      type: 'date',
      access: {
        read: featureFieldReadAccess('media'),
      },
      admin: {
        description: 'When this asset was first detected missing from object storage.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'storageIssue',
      label: 'Storage Issue',
      type: 'textarea',
      access: {
        read: featureFieldReadAccess('media'),
      },
      admin: {
        description: 'Read-only diagnostic detail from the last storage verification.',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'title',
      type: 'text',
      access: {
        read: featureFieldReadAccess('media'),
      },
      admin: {
        description: 'Internal asset name used in the admin panel.',
      },
    },
    {
      name: 'assetType',
      label: 'Asset Type',
      type: 'select',
      access: {
        read: featureFieldReadAccess('media'),
      },
      defaultValue: 'general',
      options: [...mediaAssetTypeOptions],
      admin: {
        description:
          'Use Logo, Hero, and SEO for image assets only. Logo: prefer transparent background and clean padding. Hero: prefer wide, high-resolution imagery for desktop layouts. SEO: prefer Open Graph-friendly images around 1200x630.',
      },
    },
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'Required for image assets. Describe the image for accessibility and SEO. Documents can leave this blank.',
      },
    },
    {
      name: 'tags',
      type: 'array',
      access: {
        read: featureFieldReadAccess('media'),
      },
      labels: {
        singular: 'Tag',
        plural: 'Tags',
      },
      admin: {
        description: 'Optional labels to make assets easier to find later.',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'value',
          label: 'Tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      access: {
        read: featureFieldReadAccess('media'),
      },
      admin: {
        description:
          'Optional internal notes about where or how this asset should be used, plus any preferred sizing or placement guidance for editors.',
      },
    },
    {
      name: 'isCriticalAsset',
      type: 'checkbox',
      access: {
        read: featureFieldReadAccess('media'),
      },
      defaultValue: false,
      admin: {
        description:
          'Mark logos, default SEO images, or other high-sensitivity assets that should be changed with extra care.',
      },
    },
    {
      name: 'replacementNotes',
      type: 'textarea',
      access: {
        read: featureFieldReadAccess('media'),
      },
      admin: {
        description:
          'Optional internal guidance for replacement, retirement, or migration of this asset.',
      },
    },
    ...mediaUsageAdminFieldConfig,
  ],
  upload: true,
}
