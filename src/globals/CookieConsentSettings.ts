import type { GlobalConfig, SelectField, TextField } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { revalidateGlobalsCacheForGlobal } from '@/hooks/revalidateCmsContent'

export const CookieConsentSettings: GlobalConfig = {
  slug: 'cookie-consent-settings',
  label: 'Cookie Consent Banner',
  admin: {
    group: 'Settings',
    hidden: hideUnlessFeature('cookieConsent'),
    description: 'Configure the cookie consent banner shown to first-time visitors.',
  },
  access: {
    read: allowPublicReadOrFeature('cookieConsent'),
    readVersions: requireFeature('cookieConsent'),
    update: requireFeature('cookieConsent'),
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
          label: 'Visibility',
          fields: [
            {
              name: 'enabled',
              label: 'Show Banner',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Uncheck to hide the cookie consent banner site-wide.',
              },
            },
          ],
        },
        {
          label: 'Style',
          fields: [
            {
              name: 'variant',
              label: 'Banner Style',
              type: 'select',
              defaultValue: 'bottom-bar',
              options: [
                {
                  label: 'Bottom Bar — full-width strip pinned to the bottom',
                  value: 'bottom-bar',
                },
                {
                  label: 'Floating Card — compact card in the bottom corner',
                  value: 'floating-card',
                },
                {
                  label: 'Modal — centred overlay requiring an explicit choice',
                  value: 'modal',
                },
                {
                  label: 'Corner Badge — minimal icon-based pill in the corner',
                  value: 'corner-badge',
                },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'position',
              label: 'Corner Position',
              type: 'select',
              defaultValue: 'bottom-right',
              options: [
                { label: 'Bottom Left', value: 'bottom-left' },
                { label: 'Bottom Right', value: 'bottom-right' },
              ],
              admin: {
                description: 'Applies to Floating Card and Corner Badge variants only.',
                condition: (_, siblingData) =>
                  siblingData?.variant === 'floating-card' ||
                  siblingData?.variant === 'corner-badge',
              },
            } satisfies SelectField,
          ],
        },
        {
          label: 'Content',
          fields: [
            {
              name: 'heading',
              label: 'Heading',
              type: 'text',
              admin: {
                description:
                  'Optional heading shown above the message. Displayed in Modal and Floating Card variants.',
                placeholder: 'We value your privacy',
              },
            } satisfies TextField,
            {
              name: 'message',
              label: 'Message',
              type: 'textarea',
              admin: {
                description: 'The consent description shown to visitors.',
                placeholder:
                  'We use cookies to analyse site performance and improve your experience.',
              },
            },
            {
              name: 'acceptLabel',
              label: 'Accept Button Label',
              type: 'text',
              admin: {
                placeholder: 'Accept all',
              },
            } satisfies TextField,
            {
              name: 'rejectLabel',
              label: 'Reject Button Label',
              type: 'text',
              admin: {
                placeholder: 'Reject non-essential',
              },
            } satisfies TextField,
            {
              name: 'learnMoreLabel',
              label: 'Privacy Policy Link Label',
              type: 'text',
              admin: {
                description: 'Label for the link to the Privacy Policy page.',
                placeholder: 'Privacy Policy',
              },
            } satisfies TextField,
          ],
        },
      ],
    },
  ],
}
