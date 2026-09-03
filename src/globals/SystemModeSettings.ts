import type { GlobalConfig, RelationshipFieldSingleValidation } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { createGlobalAuditHook } from '@/hooks/logOperationalAuditEvent'
import type { SystemPageType } from '@/lib/systemPageTypes'

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

const validatePublishedSystemPageType =
  (expectedType: SystemPageType, fieldLabel: string): RelationshipFieldSingleValidation =>
  async (value, { req }) => {
    const pageID = extractPageID(value as number | { id: number | string } | null | undefined)

    if (pageID == null) {
      return true
    }

    const result = await req.payload.find({
      collection: 'system-pages',
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
          {
            type: {
              equals: expectedType,
            },
          },
        ],
      },
      depth: 0,
      limit: 1,
      req,
    })

    if (result.docs.length === 0) {
      return `${fieldLabel} must reference a published ${expectedType} system page.`
    }

    return true
  }

const pageOfTypeFilter = (type: SystemPageType) => ({
  type: {
    equals: type,
  },
})

export const SystemModeSettings: GlobalConfig = {
  slug: 'system-mode-settings',
  label: 'Maintenance & Modes',
  admin: {
    group: 'Configuration',
    hidden: hideUnlessFeature('maintenanceModes'),
  },
  access: {
    read: allowPublicReadOrFeature('maintenanceModes'),
    readVersions: requireFeature('maintenanceModes'),
    update: requireFeature('maintenanceModes'),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [
      createGlobalAuditHook({
        entityType: 'system_mode_settings',
        feature: 'maintenanceModes',
        getSummary: ({ doc, previousDoc }) =>
          `Site mode changed from ${previousDoc?.siteMode ?? 'off'} to ${doc.siteMode}.`,
        title: 'Website Modes',
      }),
    ],
  },
  fields: [
    {
      name: 'notFoundPage',
      label: '404 Page',
      type: 'relationship',
      relationTo: 'system-pages',
      filterOptions: pageOfTypeFilter('404'),
      validate: validatePublishedSystemPageType('404', '404 Page'),
      admin: {
        description:
          'Select a 404 system preset. Draft presets appear here, but the selected preset must be published before it can be used live.',
      },
    },
    {
      name: 'maintenancePage',
      label: 'Maintenance Page',
      type: 'relationship',
      relationTo: 'system-pages',
      filterOptions: pageOfTypeFilter('maintenance'),
      validate: validatePublishedSystemPageType('maintenance', 'Maintenance Page'),
      admin: {
        description:
          'Select a maintenance system preset. Draft presets appear here, but the selected preset must be published before it can be used live.',
      },
    },
    {
      name: 'comingSoonPage',
      label: 'Coming Soon Page',
      type: 'relationship',
      relationTo: 'system-pages',
      filterOptions: pageOfTypeFilter('comingSoon'),
      validate: validatePublishedSystemPageType('comingSoon', 'Coming Soon Page'),
      admin: {
        description:
          'Select a coming soon system preset. Draft presets appear here, but the selected preset must be published before it can be used live.',
      },
    },
    {
      name: 'siteMode',
      label: 'Site Mode',
      type: 'radio',
      defaultValue: 'off',
      options: [
        {
          label: 'Off',
          value: 'off',
        },
        {
          label: 'Maintenance',
          value: 'maintenance',
        },
        {
          label: 'Coming Soon',
          value: 'comingSoon',
        },
      ],
      admin: {
        description:
          'Choose which system page should override the public site. This affects all public routes, not only the homepage.',
        layout: 'horizontal',
      },
    },
  ],
}
