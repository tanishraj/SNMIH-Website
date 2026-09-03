import type { GlobalConfig, RelationshipFieldSingleValidation } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createGlobalAuditHook } from '@/hooks/logOperationalAuditEvent'
import { describeAuditValue } from '@/lib/operationalAudit'
import { revalidateGlobalsCacheForGlobal } from '@/hooks/revalidateCmsContent'

type AnnouncementAdminData = {
  announcementDisplayMode?: 'horizontal' | 'marquee' | 'vertical' | null
  announcementEnabled?: boolean | null
}

const isAnnouncementEnabled = (
  data?: AnnouncementAdminData,
  siblingData?: AnnouncementAdminData,
): boolean => Boolean(siblingData?.announcementEnabled ?? data?.announcementEnabled)

const getAnnouncementDisplayMode = (
  data?: AnnouncementAdminData,
  siblingData?: AnnouncementAdminData,
) => siblingData?.announcementDisplayMode ?? data?.announcementDisplayMode

const extractPageID = (
  value: number | { id: number | string } | null | undefined,
): number | string | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null) {
    return value.id
  }

  return null
}

const validatePublishedFrontPage: RelationshipFieldSingleValidation = async (value, { req }) => {
  const pageID = extractPageID(value as number | { id: number | string } | null | undefined)

  if (pageID == null) {
    return true
  }

  const result = await req.payload.find({
    collection: 'pages',
    where: {
      and: [
        {
          id: {
            equals: pageID,
          },
        },
        {
          _status: {
            equals: 'published',
          },
        },
      ],
    },
    depth: 0,
    limit: 1,
    req,
  })

  if (result.docs.length === 0) {
    return 'Default Home must reference a published page.'
  }

  return true
}

const validateAnnouncementInterval = (
  value: unknown,
  {
    siblingData,
  }: {
    siblingData?: {
      announcementDisplayMode?: 'horizontal' | 'marquee' | 'vertical' | null
      announcementEnabled?: boolean | null
    }
  },
) => {
  if (!siblingData?.announcementEnabled || siblingData?.announcementDisplayMode === 'marquee') {
    return true
  }

  return typeof value === 'number' && Number.isFinite(value) && value >= 2000
    ? true
    : 'Announcement interval must be at least 2000 milliseconds.'
}

const validateAnnouncementMarqueeDuration = (
  value: unknown,
  {
    siblingData,
  }: {
    siblingData?: {
      announcementDisplayMode?: 'horizontal' | 'marquee' | 'vertical' | null
      announcementEnabled?: boolean | null
    }
  },
) => {
  if (!siblingData?.announcementEnabled || siblingData?.announcementDisplayMode !== 'marquee') {
    return true
  }

  return typeof value === 'number' && Number.isFinite(value) && value >= 8000
    ? true
    : 'Marquee duration must be at least 8000 milliseconds.'
}

const validateAnnouncementItems = (
  value: unknown,
  { siblingData }: { siblingData?: { announcementEnabled?: boolean | null } },
) => {
  if (!siblingData?.announcementEnabled) {
    return true
  }

  if (!Array.isArray(value) || value.length === 0) {
    return 'Add at least one announcement item.'
  }

  const hasValidItem = value.some((item) => {
    if (typeof item !== 'object' || item === null) {
      return false
    }

    const description = 'description' in item ? item.description : null

    return typeof description === 'string' && description.trim()
  })

  return hasValidItem ? true : 'Add at least one announcement item with a description.'
}

export const PageSettings: GlobalConfig = {
  slug: 'page-settings',
  label: 'Layout Defaults',
  admin: {
    group: 'Configuration',
    description:
      'Set the active header, footer, and homepage, and configure the site-wide announcement bar.',
    hidden: hideUnlessFeature('layoutDefaults'),
  },
  access: {
    read: allowPublicReadOrFeature('layoutDefaults'),
    readVersions: requireFeature('layoutDefaults'),
    update: requireFeature('layoutDefaults'),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [
      revalidateGlobalsCacheForGlobal,
      createGlobalAuditHook({
        entityType: 'page_settings',
        feature: 'layoutDefaults',
        getSummary: ({ doc, previousDoc }) =>
          `Homepage reference changed from ${describeAuditValue(previousDoc?.homepage)} to ${describeAuditValue(doc.homepage)}.`,
        title: 'Layout Defaults',
      }),
    ],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Site Structure',
          description: 'Pick which page, header, and footer are active across the whole site.',
          fields: [
            {
              name: 'homepage',
              label: 'Homepage',
              type: 'relationship',
              relationTo: 'pages',
              filterOptions: {
                _status: { equals: 'published' },
              },
              validate: validatePublishedFrontPage,
              admin: {
                description: 'The published page that renders at the root URL (/).',
              },
            },
            {
              name: 'activeHeader',
              label: 'Header',
              type: 'relationship',
              relationTo: 'headers',
              admin: {
                description: 'The header preset rendered on every page.',
              },
            },
            {
              name: 'activeFooter',
              label: 'Footer',
              type: 'relationship',
              relationTo: 'footers',
              admin: {
                description: 'The footer preset rendered on every page.',
              },
            },
          ],
        },
        {
          label: 'Page Appearance',
          description: 'Default background and border style applied to all frontend pages.',
          fields: [
            {
              ...createBlockAppearanceFields({ includeBorder: false }),
              name: 'pageAppearance',
              label: 'Appearance',
            },
          ],
        },
        {
          label: 'Announcement',
          description: 'Optional site-wide banner displayed above the header on every page.',
          fields: [
            {
              name: 'announcementEnabled',
              label: 'Enable Announcement Bar',
              type: 'checkbox',
              defaultValue: false,
            },
            {
              name: 'announcementLabel',
              label: 'Label',
              type: 'text',
              admin: {
                condition: isAnnouncementEnabled,
                description: 'Short prefix badge shown before the rotating items (e.g. "News").',
              },
            },
            {
              name: 'announcementItems',
              label: 'Items',
              type: 'array',
              minRows: 1,
              admin: {
                condition: isAnnouncementEnabled,
                description: 'Rotating messages shown in the announcement bar.',
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'description',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'url',
                  label: 'Link URL',
                  type: 'text',
                },
              ],
              validate: (value, options) => {
                const baseValidation = validateAnnouncementItems(value, options)

                if (baseValidation !== true) {
                  return baseValidation
                }

                if (!Array.isArray(value)) {
                  return true
                }

                const invalidRow = value.find((item) => {
                  if (typeof item !== 'object' || item === null) {
                    return true
                  }

                  const description = 'description' in item ? item.description : null

                  return typeof description !== 'string' || !description.trim()
                })

                return invalidRow ? 'Each announcement item requires a description.' : true
              },
            },
            {
              ...createBlockAppearanceFields(),
              name: 'announcementAppearance',
              label: 'Appearance',
              admin: {
                condition: isAnnouncementEnabled,
              },
            },
            {
              name: 'announcementDisplayMode',
              label: 'Animation Mode',
              type: 'select',
              defaultValue: 'vertical',
              options: [
                { label: 'Vertical Slider', value: 'vertical' },
                { label: 'Horizontal Slider', value: 'horizontal' },
                { label: 'Marquee', value: 'marquee' },
              ],
              required: true,
              admin: {
                condition: isAnnouncementEnabled,
              },
            },
            {
              name: 'announcementIntervalMs',
              label: 'Rotation Interval (ms)',
              type: 'number',
              defaultValue: 4000,
              admin: {
                condition: (data, siblingData) =>
                  isAnnouncementEnabled(data, siblingData) &&
                  getAnnouncementDisplayMode(data, siblingData) !== 'marquee',
                description: 'How long each item stays visible before rotating. Minimum 2000ms.',
              },
              validate: validateAnnouncementInterval,
            },
            {
              name: 'announcementMarqueeDurationMs',
              label: 'Marquee Duration (ms)',
              type: 'number',
              defaultValue: 18000,
              admin: {
                condition: (data, siblingData) =>
                  isAnnouncementEnabled(data, siblingData) &&
                  getAnnouncementDisplayMode(data, siblingData) === 'marquee',
                description: 'Full scroll cycle duration. Lower values scroll faster.',
              },
              validate: validateAnnouncementMarqueeDuration,
            },
            {
              name: 'announcementDismissible',
              label: 'Dismissible',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                condition: isAnnouncementEnabled,
                description: 'Show a close button so visitors can hide the bar for their session.',
              },
            },
            {
              name: 'announcementHideOnScroll',
              label: 'Hide on Scroll',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                condition: isAnnouncementEnabled,
                description: 'Let the bar scroll out of view instead of staying pinned.',
              },
            },
          ],
        },
      ],
    },
  ],
}
