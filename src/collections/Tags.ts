import { type CollectionConfig } from 'payload'

import {
  allowPublicReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { buildSEOFields } from '@/fields/buildSEOFields'
import { projectSlugField } from '@/fields/projectSlugField'
import { validateSEOContract } from '@/hooks/validateSEOContract'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: 'Tag',
    plural: 'Tags',
  },
  admin: {
    group: 'Taxonomy',
    hidden: hideUnlessFeature('tags'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description:
      'Flat keyword labels for cross-linking content — e.g. "scholarship", "AI research", "graduation". Unlike Topics, tags have no hierarchy.',
    listSearchableFields: ['title', 'slug'],
  },
  access: {
    create: requireFeature('tags'),
    delete: deleteFeatureOrAdmin('tags'),
    read: allowPublicReadOrFeature('tags'),
    update: requireFeature('tags'),
  },
  hooks: {
    beforeChange: [validateSEOContract()],
  },
  timestamps: true,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
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
              name: 'description',
              type: 'textarea',
              admin: {
                description:
                  'Optional short description for editorial context and tag archive metadata.',
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
  ],
}
