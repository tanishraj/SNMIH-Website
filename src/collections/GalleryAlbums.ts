import { type CollectionConfig } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { projectSlugField } from '@/fields/projectSlugField'

export const GalleryAlbums: CollectionConfig = {
  slug: 'gallery-albums',
  labels: {
    singular: 'Gallery Album',
    plural: 'Gallery Albums',
  },
  admin: {
    group: 'Media',
    hidden: hideUnlessFeature('galleryAlbums'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'eventDate', 'createdAt', 'updatedAt'],
    description: 'Ordered image albums displayed by the Event Gallery block.',
  },
  access: {
    create: requireFeature('galleryAlbums'),
    delete: deleteFeatureOrAdmin('galleryAlbums'),
    read: allowPublishedReadOrFeature('galleryAlbums'),
    readVersions: requireFeature('galleryAlbums'),
    update: requireFeature('galleryAlbums'),
  },
  versions: {
    drafts: true,
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
            },
            {
              name: 'eventDate',
              label: 'Event Date',
              type: 'date',
            },
            {
              name: 'images',
              type: 'array',
              required: true,
              minRows: 1,
              admin: {
                description:
                  'The first image is used as the album cover. Drag rows to change the viewer order.',
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'caption',
                  type: 'textarea',
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
