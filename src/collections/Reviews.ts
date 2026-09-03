import { type Access, type CollectionConfig, type Where } from 'payload'

import {
  canReadFeature,
  deleteFeatureOrAdmin,
  featureFieldReadAccess,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { buildSEOFields } from '@/fields/buildSEOFields'
import { publicationMetadataFields } from '@/fields/publicationMetadataFields'
import { projectSlugField } from '@/fields/projectSlugField'
import { enforcePublicationPolicy } from '@/hooks/enforcePublicationPolicy'
import { enforceReviewModeration } from '@/hooks/enforceReviewModeration'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { syncReviewToWorkQueue } from '@/hooks/syncReviewToWorkQueue'
import { syncPrimaryCategoryMembership } from '@/hooks/syncPrimaryCategoryMembership'
import { validateSEOContract } from '@/hooks/validateSEOContract'
import { reviewRatingOptions } from '@/lib/reviews'
import { revalidateDeletedReviewCache, revalidateReviewsCache } from '@/hooks/revalidateCmsContent'

const previewBreakpoints = [
  {
    name: 'desktop',
    label: 'Desktop',
    width: 1440,
    height: 900,
  },
  {
    name: 'tablet',
    label: 'Tablet',
    width: 834,
    height: 1112,
  },
  {
    name: 'mobile',
    label: 'Mobile',
    width: 390,
    height: 844,
  },
] as const

const readReviews: Access = ({ req }) => {
  if (req.user) return canReadFeature(req.user, 'reviews')

  const publicReviewWhere: Where = {
    and: [
      { _status: { equals: 'published' } },
      {
        or: [
          { sourceSubmission: { exists: false } },
          { sourceSubmission: { equals: null } },
          { moderationStatus: { equals: 'approved' } },
        ],
      },
    ],
  }

  return publicReviewWhere
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: {
    singular: 'Review',
    plural: 'Reviews',
  },
  admin: {
    group: 'Content',
    hidden: hideUnlessFeature('reviews'),
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'primaryCategory',
      'rating',
      'moderationStatus',
      '_status',
      'updatedAt',
    ],
    description: 'Staff-authored reviews and moderated public review submissions.',
    listSearchableFields: ['title', 'reviewTitle', 'reviewerName', 'subjectLabel'],
    livePreview: {
      breakpoints: [...previewBreakpoints],
      url: ({ data }) => {
        if (!data?.slug || typeof data.slug !== 'string') {
          return null
        }

        const appURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

        return `${appURL}/reviews/${data.slug}`
      },
    },
  },
  access: {
    create: requireFeature('reviews'),
    delete: deleteFeatureOrAdmin('reviews'),
    read: readReviews,
    readVersions: requireFeature('reviews'),
    update: requireFeature('reviews'),
  },
  hooks: {
    afterChange: [
      revalidateReviewsCache,
      syncReviewToWorkQueue,
      createCollectionAuditHook({
        entityType: 'review',
        feature: 'reviews',
        getSummary: ({ doc, previousDoc }) =>
          `Review moderation/publication changed from ${previousDoc?.moderationStatus ?? 'staff'}/${previousDoc?._status ?? 'draft'} to ${doc.moderationStatus ?? 'staff'}/${doc._status ?? 'draft'}.`,
        titleField: 'title',
      }),
    ],
    afterDelete: [revalidateDeletedReviewCache],
    beforeChange: [
      syncPrimaryCategoryMembership,
      validateSEOContract(),
      enforceReviewModeration,
      enforcePublicationPolicy('reviews', 'reviews'),
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
              type: 'row',
              fields: [
                {
                  name: 'primaryCategory',
                  label: 'Primary Topic',
                  type: 'relationship',
                  relationTo: 'categories',
                  required: true,
                  admin: {
                    description:
                      'Main editorial topic — owns the archive placement and related-content priority.',
                    width: '50%',
                  },
                },
                {
                  name: 'tags',
                  type: 'relationship',
                  relationTo: 'tags',
                  hasMany: true,
                  admin: {
                    description: 'Keyword tags for related-content matching and cross-linking.',
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'categories',
              label: 'Additional Topics',
              type: 'relationship',
              relationTo: 'categories',
              hasMany: true,
              admin: {
                description:
                  'Additional topics for cross-linking. The primary topic is always included automatically.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'rating',
                  type: 'select',
                  options: [...reviewRatingOptions],
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'subjectLabel',
                  type: 'text',
                  admin: {
                    description: 'Optional short subject like product, service, or campaign label.',
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'reviewTitle',
              type: 'text',
              required: true,
            },
            {
              name: 'reviewBody',
              type: 'textarea',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'reviewerName',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'reviewerEmail',
                  type: 'email',
                  access: {
                    read: featureFieldReadAccess('reviews'),
                  },
                  admin: {
                    description: 'Optional contact email used only for moderation follow-up.',
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'displayName',
                  type: 'text',
                  admin: {
                    description:
                      'Optional public-safe name shown on the frontend instead of the raw reviewer name.',
                    width: '50%',
                  },
                },
                {
                  name: 'isGenuineExperience',
                  type: 'checkbox',
                  defaultValue: false,
                  required: true,
                  admin: {
                    description:
                      'Confirms the reviewer stated this review is based on their own genuine experience.',
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              filterOptions: {
                mimeType: {
                  contains: 'image',
                },
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
    {
      type: 'collapsible',
      label: 'Moderation',
      admin: {
        condition: (data) => Boolean(data?.sourceSubmission),
        initCollapsed: false,
        position: 'sidebar',
      },
      fields: [
        {
          name: 'moderationStatus',
          type: 'select',
          access: {
            read: featureFieldReadAccess('reviews'),
          },
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Approved', value: 'approved' },
            { label: 'Rejected', value: 'rejected' },
          ],
          admin: {
            description: 'Approving publishes the Review. Rejecting keeps it as a draft.',
          },
        },
        {
          name: 'sourceSubmission',
          type: 'relationship',
          relationTo: 'form-submissions',
          access: {
            create: () => false,
            read: featureFieldReadAccess('reviews'),
            update: () => false,
          },
          admin: {
            description: 'Immutable public submission that created this Review.',
            readOnly: true,
          },
        },
        {
          name: 'internalModerationNotes',
          label: 'Moderation Note',
          type: 'textarea',
          access: {
            read: featureFieldReadAccess('reviews'),
          },
          admin: {
            description: 'Internal context for the moderation decision.',
          },
        },
        {
          name: 'moderatedAt',
          type: 'date',
          access: {
            create: () => false,
            read: featureFieldReadAccess('reviews'),
            update: () => false,
          },
          admin: { readOnly: true },
        },
        {
          name: 'moderatedBy',
          type: 'relationship',
          relationTo: 'users',
          access: {
            create: () => false,
            read: featureFieldReadAccess('reviews'),
            update: () => false,
          },
          admin: { readOnly: true },
        },
      ],
    },
    ...publicationMetadataFields('reviews'),
  ],
}
