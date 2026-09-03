import type { GlobalConfig } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { defaultWebsiteTheme, websiteThemeOptions } from '@/lib/themes/websiteThemes'
import { revalidateGlobalsCacheForGlobal } from '@/hooks/revalidateCmsContent'

export const ThemeSettings: GlobalConfig = {
  slug: 'theme-settings',
  label: 'Appearance',
  admin: {
    group: 'Settings',
    description: 'Control the frontend theme preset and light or dark mode behavior.',
    hidden: hideUnlessFeature('appearance'),
  },
  access: {
    read: allowPublicReadOrFeature('appearance'),
    readVersions: requireFeature('appearance'),
    update: requireFeature('appearance'),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [revalidateGlobalsCacheForGlobal],
  },
  fields: [
    {
      name: 'themeColor',
      type: 'select',
      defaultValue: defaultWebsiteTheme,
      required: true,
      admin: {
        description: 'Select which frontend theme preset is loaded for the site.',
      },
      options: websiteThemeOptions,
    },
    {
      name: 'colorScheme',
      type: 'radio',
      defaultValue: 'system',
      required: true,
      admin: {
        description:
          'Choose whether the site follows the system preference or forces light/dark mode.',
      },
      options: [
        {
          label: 'System',
          value: 'system',
        },
        {
          label: 'Light',
          value: 'light',
        },
        {
          label: 'Dark',
          value: 'dark',
        },
      ],
    },
  ],
}
