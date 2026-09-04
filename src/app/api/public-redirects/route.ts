import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import { getPageHref } from '@/lib/pagePaths'

export type RedirectEntry = {
  from: string
  to: string
  permanent: boolean
}

export type RedirectsResponse = {
  redirects: RedirectEntry[]
  count: number
}

const fetchRedirects = unstable_cache(
  async (): Promise<RedirectEntry[]> => {
    const payload = await getPayload({ config: configPromise })

    const { docs } = await payload.find({
      collection: 'redirects',
      depth: 2,
      limit: 0,
      pagination: false,
      where: {
        and: [{ enabled: { equals: true } }, { _status: { equals: 'published' } }],
      },
    })

    const entries: RedirectEntry[] = []

    for (const redirect of docs) {
      if (!redirect.fromPath) continue

      let to: string | undefined

      if (redirect.destinationType === 'page') {
        to = getPageHref(redirect.page) ?? undefined
      } else {
        to = redirect.url ?? undefined
      }

      if (!to) continue

      entries.push({
        from: redirect.fromPath,
        to,
        permanent: redirect.statusCode === '301',
      })
    }

    return entries
  },
  ['redirects-list'],
  { tags: [CMS_CACHE_TAGS.redirects], revalidate: false },
)

export async function GET() {
  const redirects = await fetchRedirects()
  return NextResponse.json<RedirectsResponse>(
    { redirects, count: redirects.length },
    {
      headers: {
        // Downstream caches (e.g. CDN) may cache for up to 60s.
        // The proxy layer has its own in-process TTL cache.
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      },
    },
  )
}
