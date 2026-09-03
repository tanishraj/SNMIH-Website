import { type CollectionConfig } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { projectEditor } from '@/fields/bodyEditorConfig'
import { buildSEOFields } from '@/fields/buildSEOFields'
import { publicationMetadataFields } from '@/fields/publicationMetadataFields'
import { projectSlugField } from '@/fields/projectSlugField'
import { enforcePublicationPolicy } from '@/hooks/enforcePublicationPolicy'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import { normalizeNewsEventFields } from '@/hooks/normalizeNewsEventFields'
import { resolveNewsEventClassification } from '@/hooks/resolveNewsEventClassification'
import { syncPrimaryCategoryMembership } from '@/hooks/syncPrimaryCategoryMembership'
import { validateSEOContract } from '@/hooks/validateSEOContract'
import { NEWS_EVENT_CLASSIFICATIONS } from '@/lib/newsEventClassifications'
import {
  revalidateDeletedNewsEventCache,
  revalidateNewsEventsCache,
} from '@/hooks/revalidateCmsContent'

const previewBreakpoints = [
  { name: 'desktop', label: 'Desktop', width: 1440, height: 900 },
  { name: 'tablet', label: 'Tablet', width: 834, height: 1112 },
  { name: 'mobile', label: 'Mobile', width: 390, height: 844 },
] as const

export const NewsEvents: CollectionConfig = {
  slug: 'news-events',
  labels: {
    singular: 'News & Event Entry',
    plural: 'News & Events',
  },
  admin: {
    group: 'News & Events',
    hidden: hideUnlessFeature('newsEvents'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'classification', '_status', 'updatedAt'],
    description: 'Published news stories and scheduled events for the public website.',
    listSearchableFields: ['title', 'slug', 'eventLocation'],
    livePreview: {
      breakpoints: [...previewBreakpoints],
      url: ({ data }) => {
        if (!data?.slug || typeof data.slug !== 'string') {
          return null
        }

        const appURL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

        return `${appURL}/news-events/${data.slug}?preview=true`
      },
    },
  },
  access: {
    create: requireFeature('newsEvents'),
    delete: deleteFeatureOrAdmin('newsEvents'),
    read: allowPublishedReadOrFeature('newsEvents'),
    readVersions: requireFeature('newsEvents'),
    update: requireFeature('newsEvents'),
  },
  hooks: {
    afterChange: [
      revalidateNewsEventsCache,
      createCollectionAuditHook({
        entityType: 'news_event',
        feature: 'newsEvents',
        getSummary: ({ doc, previousDoc }) =>
          `Publication status changed from ${previousDoc?._status ?? 'draft'} to ${doc._status ?? 'draft'}.`,
        titleField: 'title',
      }),
    ],
    afterDelete: [revalidateDeletedNewsEventCache],
    beforeChange: [
      normalizeNewsEventFields,
      syncPrimaryCategoryMembership,
      validateSEOContract(),
      enforcePublicationPolicy('newsEvents', 'news-events'),
    ],
    beforeValidate: [resolveNewsEventClassification],
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
              name: 'classification',
              label: 'Entry Classification',
              type: 'relationship',
              relationTo: 'news-event-classifications',
              required: true,
              filterOptions: { active: { equals: true } },
              admin: {
                allowCreate: true,
                description: 'Controls the public badge, tab, date behavior, and detail metadata.',
              },
            },
            {
              name: 'contentType',
              label: 'Legacy Entry Classification',
              type: 'select',
              options: NEWS_EVENT_CLASSIFICATIONS.map(({ adminLabel, value }) => ({
                label: adminLabel,
                value,
              })),
              admin: {
                hidden: true,
              },
            },
            {
              name: 'excerpt',
              type: 'textarea',
              required: true,
              admin: {
                description: 'Short summary used in cards, archives, previews, and SEO fallbacks.',
              },
            },
            {
              name: 'authorName',
              label: 'Byline',
              type: 'text',
              admin: {
                hidden: true,
                description:
                  'Legacy field retained for existing entries. The shared detail template now controls the public author label.',
              },
            },
            {
              name: 'featuredImage',
              type: 'upload',
              relationTo: 'media',
              required: true,
              filterOptions: {
                mimeType: { contains: 'image' },
              },
            },
            {
              name: 'featuredImagePosition',
              label: 'Image Position',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
            },
            {
              type: 'collapsible',
              label: 'Topics & Tags',
              admin: {
                description: 'Optional subject metadata for grouping and cross-linking.',
                initCollapsed: true,
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'primaryCategory',
                      label: 'Primary Topic',
                      type: 'relationship',
                      relationTo: 'categories',
                      admin: {
                        width: '50%',
                        description: 'Main editorial topic for archive placement.',
                      },
                    },
                    {
                      name: 'tags',
                      type: 'relationship',
                      relationTo: 'tags',
                      hasMany: true,
                      admin: {
                        width: '50%',
                        description: 'Keyword tags for cross-linking.',
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
                      'Additional topics for cross-linking. The primary topic is included automatically.',
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
                description: 'Complete story or event description.',
              },
            },
          ],
        },
        {
          label: 'Event Details',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'eventStart',
                  type: 'date',
                  admin: {
                    date: { pickerAppearance: 'dayAndTime' },
                    description:
                      'Required only when the selected classification uses Event behavior.',
                    width: '50%',
                  },
                },
                {
                  name: 'eventEnd',
                  type: 'date',
                  admin: {
                    date: { pickerAppearance: 'dayAndTime' },
                    description: 'Optional, but cannot be earlier than Event Start.',
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'eventAllDay',
              label: 'All-day Event',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Omits the time and treats the event end date as inclusive.',
              },
            },
            {
              name: 'eventLocation',
              type: 'text',
              admin: {
                description: 'Required only when the selected classification uses Event behavior.',
              },
            },
            {
              ...createContentActionsField({
                includeDisplayMode: true,
                label: 'Registration Action',
                maxRows: 1,
                name: 'eventRegistrationAction',
              }),
              admin: {
                initCollapsed: true,
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
    ...publicationMetadataFields('newsEvents'),
  ],
}
