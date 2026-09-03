import type { GlobalConfig } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { revalidateSiteSettingsCache } from '@/hooks/revalidateCmsContent'
import { DEFAULT_SITE_TIME_ZONE, SUPPORTED_SITE_TIME_ZONES } from '@/lib/siteTimeZone'

const validateExternalSocialUrl = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return true
  }

  try {
    const url = new URL(value.trim())

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return 'Enter a full external URL starting with http:// or https://.'
    }

    return true
  } catch {
    return 'Enter a valid external URL starting with http:// or https://.'
  }
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Identity',
  admin: {
    group: 'Settings',
    hidden: hideUnlessFeature('siteIdentity'),
  },
  access: {
    read: allowPublicReadOrFeature('siteIdentity'),
    readVersions: requireFeature('siteIdentity'),
    update: requireFeature('siteIdentity'),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [revalidateSiteSettingsCache],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Brand',
          fields: [
            {
              name: 'siteName',
              type: 'text',
              required: true,
            },
            {
              name: 'siteDescription',
              type: 'textarea',
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'logo',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'favicon',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Regional',
          fields: [
            {
              name: 'timeZone',
              label: 'Site Timezone',
              type: 'select',
              defaultValue: DEFAULT_SITE_TIME_ZONE,
              required: true,
              options: SUPPORTED_SITE_TIME_ZONES.map((value) => ({ label: value, value })),
              admin: {
                description:
                  'Used for event dates, event times, calendar month boundaries, and the current day.',
              },
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'contactEmail',
                  type: 'email',
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'contactPhone',
                  type: 'text',
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'address',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'Legal',
          fields: [
            {
              name: 'privacyPolicyPage',
              label: 'Privacy Policy Page',
              type: 'relationship',
              relationTo: 'pages',
            },
            {
              name: 'termsAndConditionsPage',
              label: 'Terms and Conditions Page',
              type: 'relationship',
              relationTo: 'pages',
            },
          ],
        },
        {
          label: 'Social Links',
          fields: [
            {
              name: 'socialLinks',
              type: 'group',
              fields: [
                {
                  name: 'facebook',
                  label: 'Facebook External URL',
                  type: 'text',
                  admin: {
                    description:
                      'Must be a full external URL, for example https://facebook.com/your-page.',
                  },
                  validate: validateExternalSocialUrl,
                },
                {
                  name: 'instagram',
                  label: 'Instagram External URL',
                  type: 'text',
                  admin: {
                    description:
                      'Must be a full external URL, for example https://instagram.com/your-handle.',
                  },
                  validate: validateExternalSocialUrl,
                },
                {
                  name: 'x',
                  label: 'X External URL',
                  type: 'text',
                  admin: {
                    description:
                      'Must be a full external URL, for example https://x.com/your-handle.',
                  },
                  validate: validateExternalSocialUrl,
                },
                {
                  name: 'linkedin',
                  label: 'LinkedIn External URL',
                  type: 'text',
                  admin: {
                    description:
                      'Must be a full external URL, for example https://linkedin.com/company/your-org.',
                  },
                  validate: validateExternalSocialUrl,
                },
                {
                  name: 'youtube',
                  label: 'YouTube External URL',
                  type: 'text',
                  admin: {
                    description:
                      'Must be a full external URL, for example https://youtube.com/@your-channel.',
                  },
                  validate: validateExternalSocialUrl,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
