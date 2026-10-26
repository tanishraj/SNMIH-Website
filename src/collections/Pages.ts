import { stampPageDisclosures } from './Disclosure/hooks'
import { type CollectionConfig, type RelationshipFieldSingleValidation } from 'payload'

import { pageBuilderBlocks } from '@/blocks/blockCatalog'
import { validateUniqueBlockAnchorIDs } from '@/blocks/shared/blockAnchor'
import type { Page } from '@/payload-types'
import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { buildSEOFields } from '@/fields/buildSEOFields'
import { publicationMetadataFields } from '@/fields/publicationMetadataFields'
import { createPageFromRecipeEndpoint } from '@/endpoints/createPageFromRecipe'
import { projectSlugField } from '@/fields/projectSlugField'
import { enforcePublicationPolicy } from '@/hooks/enforcePublicationPolicy'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { validateSEOContract } from '@/hooks/validateSEOContract'

import { createRedirectsForChangedPagePath } from '../hooks/createRedirectsForChangedPagePath'
import { populatePageUrlPreview } from '../hooks/populatePageUrlPreview'
import { preventReferencedPageUnpublish } from '../hooks/preventReferencedPageUnpublish'
import {
  syncNavigationLinkAfterChange,
  syncNavigationLinkAfterDelete,
} from '../hooks/syncNavigationLinkForPage'
import { revalidateDeletedPageCache, revalidatePagesCache } from '../hooks/revalidateCmsContent'

const extractPageID = (
  value: string | number | Page | null | undefined,
): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null) {
    return value.id
  }

  return null
}

const validateParentRelationship: RelationshipFieldSingleValidation = async (
  value,
  { id, req },
) => {
  const parentID = extractPageID(value as string | number | Page | null | undefined)

  if (!parentID || id == null) {
    return true
  }

  const currentPageID = id

  if (parentID === currentPageID) {
    return 'A page cannot be its own parent.'
  }

  const visited = new Set<string | number>([currentPageID])
  let nextParentID: string | number | null = parentID

  while (nextParentID != null) {
    if (visited.has(nextParentID)) {
      return 'This parent selection would create a circular page hierarchy.'
    }

    visited.add(nextParentID)

    const parentPage = await req.payload.findByID({
      collection: 'pages',
      id: nextParentID,
      depth: 0,
      req,
    })

    nextParentID = extractPageID(parentPage.parent as string | number | Page | null | undefined)
  }

  return true
}

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

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Page',
    plural: 'Pages',
  },
  admin: {
    components: {
      views: {
        edit: {
          default: {
            Component: '@/components/admin/PageCreateView#PageCreateView',
          },
        },
      },
    },
    group: 'Content',
    hidden: hideUnlessFeature('pages'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Flexible website pages with reusable layout blocks, SEO controls, and publishing settings.',
    listSearchableFields: ['title', 'slug'],
    livePreview: {
      breakpoints: [...previewBreakpoints],
      url: ({ data }) => {
        if (!data?.id) {
          return null
        }

        const appURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

        return `${appURL}/preview/page/${data.id}`
      },
    },
  },
  access: {
    create: requireFeature('pages'),
    delete: deleteFeatureOrAdmin('pages'),
    read: allowPublishedReadOrFeature('pages'),
    readVersions: requireFeature('pages'),
    update: requireFeature('pages'),
  },
  endpoints: [createPageFromRecipeEndpoint],
  hooks: {
    afterRead: [populatePageUrlPreview],
    afterChange: [
      revalidatePagesCache,
      syncNavigationLinkAfterChange,
      createRedirectsForChangedPagePath,
      createCollectionAuditHook({
        entityType: 'page',
        feature: 'pages',
        getSummary: ({ doc, previousDoc }) =>
          `Publication status changed from ${previousDoc?._status ?? 'draft'} to ${doc._status ?? 'draft'}.`,
        titleField: 'title',
      }),
    ],
    afterDelete: [syncNavigationLinkAfterDelete, revalidateDeletedPageCache],
    beforeChange: [
      stampPageDisclosures,
      validateSEOContract(),
      enforcePublicationPolicy('pages', 'pages'),
      preventReferencedPageUnpublish,
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
              name: 'layout',
              label: 'Layout',
              type: 'blocks',
              blocks: pageBuilderBlocks,
              required: false,
              validate: validateUniqueBlockAnchorIDs,
              admin: {
                description: 'Compose the page using reusable content blocks.',
                initCollapsed: true,
              },
            },
          ],
        },
        {
          label: 'SEO',
          fields: [...buildSEOFields()],
        },
        {
          label: 'Settings',
          fields: [
            {
              name: 'publicUrlPreview',
              label: 'Public URL',
              type: 'text',
              virtual: true,
              admin: {
                readOnly: true,
                description: 'Resolved from the current saved slug and parent hierarchy.',
              },
            },
            {
              name: 'parent',
              type: 'relationship',
              relationTo: 'pages',
              filterOptions: ({ id }) => {
                if (id == null) {
                  return true
                }

                return {
                  id: {
                    not_equals: id,
                  },
                }
              },
              validate: validateParentRelationship,
              admin: {
                description: 'Use this for nested page hierarchies like /services/web-development.',
              },
            },
          ],
        },
      ],
    },
    ...publicationMetadataFields('pages'),
  ],
}
