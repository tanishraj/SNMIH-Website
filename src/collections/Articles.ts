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
import { enforcePublicationPolicy } from '@/hooks/enforcePublicationPolicy'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { syncPrimaryCategoryMembership } from '@/hooks/syncPrimaryCategoryMembership'
import { validateSEOContract } from '@/hooks/validateSEOContract'
import {
  revalidateArticlesCache,
  revalidateDeletedArticleCache,
} from '@/hooks/revalidateCmsContent'
import { projectEditor } from '@/fields/bodyEditorConfig'

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

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'Article',
    plural: 'Articles',
  },
  admin: {
    group: 'Content',
    hidden: hideUnlessFeature('articles'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'primaryCategory', '_status', 'updatedAt'],
    description: 'Editorial long-form content with writing-first authoring and SEO controls.',
    listSearchableFields: ['title', 'slug', 'authorName'],
    livePreview: {
      breakpoints: [...previewBreakpoints],
      url: ({ data }) => {
        if (!data?.slug || typeof data.slug !== 'string') {
          return null
        }

        const appURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

        return `${appURL}/articles/${data.slug}?preview=true`
      },
    },
  },
  access: {
    create: requireFeature('articles'),
    delete: deleteFeatureOrAdmin('articles'),
    read: allowPublishedReadOrFeature('articles'),
    readVersions: requireFeature('articles'),
    update: requireFeature('articles'),
  },
  hooks: {
    afterChange: [
      revalidateArticlesCache,
      createCollectionAuditHook({
        entityType: 'article',
        feature: 'articles',
        getSummary: ({ doc, previousDoc }) =>
          `Publication status changed from ${previousDoc?._status ?? 'draft'} to ${doc._status ?? 'draft'}.`,
        titleField: 'title',
      }),
    ],
    afterDelete: [revalidateDeletedArticleCache],
    beforeChange: [
      syncPrimaryCategoryMembership,
      validateSEOContract(),
      enforcePublicationPolicy('articles', 'articles'),
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
                    description: 'Optional topical tags for cross-linking and tag archives.',
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
              name: 'excerpt',
              type: 'textarea',
              required: true,
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
            {
              type: 'row',
              fields: [
                {
                  name: 'authorName',
                  type: 'text',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'publishedAtOverride',
                  type: 'date',
                  admin: {
                    description:
                      'Optional. Override the visible publication date without changing publication metadata.',
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'body',
              type: 'richText',
              editor: projectEditor,
              required: true,
              admin: {
                description: 'Primary long-form article body.',
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
    ...publicationMetadataFields('articles'),
  ],
}
