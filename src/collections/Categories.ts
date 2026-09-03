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

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Topic',
    plural: 'Topics',
  },
  admin: {
    group: 'Taxonomy',
    hidden: hideUnlessFeature('topics'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description:
      'Hierarchical editorial sections — e.g. Admissions, Research, Campus Life. Each topic can own an archive page and have child topics.',
    listSearchableFields: ['title', 'slug'],
  },
  access: {
    create: requireFeature('topics'),
    delete: deleteFeatureOrAdmin('topics'),
    read: allowPublicReadOrFeature('topics'),
    update: requireFeature('topics'),
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
              name: 'parent',
              type: 'relationship',
              relationTo: 'categories',
              label: 'Parent Topic',
              admin: {
                description: 'Optional parent topic — e.g. "Research" could sit under "Academics".',
              },
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Optional short description for archive pages and editorial context.',
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
