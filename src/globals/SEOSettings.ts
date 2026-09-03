import type { GlobalConfig } from 'payload'

import { allowPublicReadOrFeature, hideUnlessFeature, requireFeature } from '@/access/featureAccess'
import { robotsFieldOptions } from '@/lib/seo'
import { revalidateGlobalsCacheForGlobal } from '@/hooks/revalidateCmsContent'

export const SEOSettings: GlobalConfig = {
  slug: 'seo-settings',
  label: 'SEO & Metadata',
  admin: {
    group: 'Settings',
    description:
      'Default SEO values inherited by public routes when local SEO fields stay on Default or empty.',
    hidden: hideUnlessFeature('seoMetadata'),
  },
  access: {
    read: allowPublicReadOrFeature('seoMetadata'),
    readVersions: requireFeature('seoMetadata'),
    update: requireFeature('seoMetadata'),
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [revalidateGlobalsCacheForGlobal],
  },
  fields: [
    {
      name: 'defaultTitle',
      type: 'text',
    },
    {
      name: 'titleTemplate',
      type: 'text',
      admin: {
        description: 'Example: %s | Your Site Name',
      },
    },
    {
      name: 'defaultDescription',
      type: 'textarea',
    },
    {
      name: 'defaultImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'robots',
      type: 'select',
      defaultValue: 'index,follow',
      options: [...robotsFieldOptions],
      admin: {
        description: 'Inherited when a route keeps its local robots mode on Default.',
      },
    },
    {
      name: 'googleSiteVerification',
      type: 'text',
    },
  ],
}
