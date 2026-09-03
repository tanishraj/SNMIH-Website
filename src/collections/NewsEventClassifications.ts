import type { CollectionConfig } from 'payload'

import {
  adminOnlyAccess,
  allowPublicReadOrFeature,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { projectSlugField } from '@/fields/projectSlugField'
import { protectNewsEventClassificationSystemFields } from '@/hooks/protectNewsEventClassificationSystemFields'
import { preventReferencedNewsEventClassificationDelete } from '@/hooks/preventReferencedNewsEventClassificationDelete'
import {
  revalidateDeletedNewsEventClassificationCache,
  revalidateNewsEventClassificationsCache,
} from '@/hooks/revalidateCmsContent'
import { CALENDAR_TONES, NEWS_EVENT_CLASSIFICATIONS } from '@/lib/newsEventClassifications'

export const calendarColorCondition = (_data: unknown, siblingData: Record<string, unknown>) =>
  siblingData?.behavior === 'event'

export const NewsEventClassifications: CollectionConfig = {
  slug: 'news-event-classifications',
  labels: {
    singular: 'Classification',
    plural: 'Classifications',
  },
  admin: {
    group: 'News & Events',
    hidden: hideUnlessFeature('newsEventClassifications'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'badgeLabel', 'behavior', 'active', 'updatedAt'],
    description:
      'Central classifications used by News & Events entries, badges, tabs, and date behavior.',
    listSearchableFields: ['title', 'badgeLabel', 'slug'],
  },
  access: {
    create: requireFeature('newsEventClassifications'),
    delete: adminOnlyAccess,
    read: allowPublicReadOrFeature('newsEventClassifications'),
    update: requireFeature('newsEventClassifications'),
  },
  hooks: {
    afterChange: [revalidateNewsEventClassificationsCache],
    afterDelete: [revalidateDeletedNewsEventClassificationCache],
    beforeChange: [protectNewsEventClassificationSystemFields],
    beforeDelete: [preventReferencedNewsEventClassificationDelete],
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Visitor-facing tab name, such as News, Events, or Achievements.',
      },
    },
    projectSlugField({
      useAsSlug: 'title',
    }),
    {
      name: 'badgeLabel',
      label: 'Badge Label',
      type: 'text',
      admin: {
        description: 'Short card badge text. When empty, the title is used.',
      },
    },
    {
      name: 'legacyValue',
      label: 'Legacy Value',
      type: 'select',
      index: true,
      options: NEWS_EVENT_CLASSIFICATIONS.map(({ adminLabel, value }) => ({
        label: adminLabel,
        value,
      })),
      admin: {
        hidden: true,
      },
      unique: true,
    },
    {
      name: 'behavior',
      type: 'select',
      defaultValue: 'story',
      options: [
        { label: 'Story', value: 'story' },
        { label: 'Event', value: 'event' },
      ],
      required: true,
      admin: {
        description:
          'Event enables event dates and location behavior. Story uses the publication/display date.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Optional internal guidance describing when editors should use this option.',
      },
    },
    {
      name: 'calendarColor',
      label: 'Calendar Color',
      type: 'select',
      defaultValue: 'blue',
      required: true,
      options: CALENDAR_TONES.map((value) => ({
        label: value.charAt(0).toUpperCase() + value.slice(1),
        value,
      })),
      admin: {
        condition: calendarColorCondition,
        description: 'Semantic accent used for this classification in Calendar blocks.',
      },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      required: true,
      admin: {
        description:
          'Inactive classifications remain readable on existing entries but cannot be newly selected.',
        position: 'sidebar',
      },
    },
  ],
}
