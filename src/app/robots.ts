import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { MetadataRoute } from 'next'

import { toAbsoluteSiteUrl } from '@/lib/siteUrl'

export const revalidate = 3600

export default async function robots(): Promise<MetadataRoute.Robots> {
  const payload = await getPayload({ config: configPromise })
  const seoSettings = await payload.findGlobal({ slug: 'seo-settings', depth: 0 })
  const globalRobots = seoSettings.robots ?? 'index,follow'
  const isNoindex = globalRobots.includes('noindex')

  if (isNoindex) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/preview'],
      },
    ],
    sitemap: toAbsoluteSiteUrl('/sitemap.xml'),
  }
}
