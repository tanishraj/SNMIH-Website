import type { GlobalConfig } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { revalidateGlobalsCacheForGlobal } from '@/hooks/revalidateCmsContent'

export const AnalyticsSettings: GlobalConfig = {
  slug: 'analytics-settings',
  label: 'Analytics & Tracking',
  admin: {
    group: 'Settings',
    hidden: hideUnlessFeature('analyticsTracking'),
    description: 'Configure Google Tag Manager and GA4 tracking for the site.',
  },
  access: {
    read: allowPublicReadOrFeature('analyticsTracking'),
    readVersions: requireFeature('analyticsTracking'),
    update: requireFeature('analyticsTracking'),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [revalidateGlobalsCacheForGlobal],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Google Tag Manager',
          fields: [
            {
              name: 'gtmEnabled',
              label: 'Enable GTM',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Injects the GTM snippet into every page of the site.',
              },
            },
            {
              name: 'gtmContainerId',
              label: 'Container ID',
              type: 'text',
              admin: {
                description: 'Your GTM container ID, e.g. GTM-XXXXXX.',
                condition: (_, siblingData) => Boolean(siblingData?.gtmEnabled),
              },
              validate: (value: unknown) => {
                if (!value || typeof value !== 'string') return true
                if (!/^GTM-[A-Z0-9]+$/.test(value.trim())) {
                  return 'Container ID must match the format GTM-XXXXXX.'
                }
                return true
              },
            },
          ],
        },
        {
          label: 'Google Analytics 4',
          fields: [
            {
              name: 'ga4Enabled',
              label: 'Enable GA4 (standalone)',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Use this only if you are NOT using GTM. If GTM is enabled, configure GA4 inside your GTM container instead.',
              },
            },
            {
              name: 'ga4MeasurementId',
              label: 'Measurement ID',
              type: 'text',
              admin: {
                description: 'Your GA4 measurement ID, e.g. G-XXXXXXXXXX.',
                condition: (_, siblingData) => Boolean(siblingData?.ga4Enabled),
              },
              validate: (value: unknown) => {
                if (!value || typeof value !== 'string') return true
                if (!/^G-[A-Z0-9]+$/.test(value.trim())) {
                  return 'Measurement ID must match the format G-XXXXXXXXXX.'
                }
                return true
              },
            },
          ],
        },
      ],
    },
  ],
}
