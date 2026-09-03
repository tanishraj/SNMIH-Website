import 'server-only'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import { normalizeSiteTimeZone, type SiteTimeZone } from '@/lib/siteTimeZone'

const loadSiteTimeZone = async (): Promise<SiteTimeZone> => {
  const payload = await getPayload({ config: configPromise })
  const settings = await payload.findGlobal({
    slug: 'site-settings',
    depth: 0,
    draft: false,
    overrideAccess: true,
  })
  return normalizeSiteTimeZone(settings.timeZone)
}

export const getSiteTimeZone = unstable_cache(loadSiteTimeZone, ['site-time-zone'], {
  revalidate: false,
  tags: [CMS_CACHE_TAGS.siteSettings],
})
