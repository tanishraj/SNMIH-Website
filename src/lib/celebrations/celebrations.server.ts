import 'server-only'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import { getSiteTimeZone } from '@/lib/siteTimeZone.server'

import { toCelebrationView, type CelebrationView } from './view'

/** Celebrations that ended more than this long ago are left out of the cached list. */
const RECENT_PAST_MS = 2 * 86_400_000

/**
 * Published, enabled, site-wide celebrations that are current or upcoming. The browser decides
 * which one is active today, so cached pages still switch on the right day without a rebuild.
 */
const loadSiteWideCelebrations = async (): Promise<CelebrationView[]> => {
  const payload = await getPayload({ config: configPromise })
  const [timeZone, result] = await Promise.all([
    getSiteTimeZone(),
    payload.find({
      collection: 'celebrations',
      depth: 1,
      limit: 24,
      overrideAccess: false,
      pagination: false,
      sort: 'startDate',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { enabled: { equals: true } },
          { placement: { equals: 'everyPage' } },
          { lastDay: { greater_than_equal: new Date(Date.now() - RECENT_PAST_MS).toISOString() } },
        ],
      },
    }),
  ])

  return result.docs.flatMap((doc) => {
    const view = toCelebrationView(doc, timeZone)
    return view ? [view] : []
  })
}

export const getSiteWideCelebrations = unstable_cache(
  loadSiteWideCelebrations,
  // Bump the version whenever CelebrationView changes shape, so stale cached views are not reused.
  ['site-wide-celebrations', 'v2'],
  {
    // An hourly refresh drops ended celebrations even when nothing is edited.
    revalidate: 3600,
    tags: [CMS_CACHE_TAGS.celebrations, CMS_CACHE_TAGS.siteSettings],
  },
)
