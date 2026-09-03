import 'server-only'

import type { Payload } from 'payload'

import { getPageHrefFromSourceWithResolver } from '@/lib/pagePaths'
import type { Page } from '@/payload-types'

type SearchPage = Pick<Page, 'id' | 'parent' | 'slug'>
type SearchPageParent = Pick<Page, 'parent' | 'slug'>

export async function resolveSearchPageHrefs(
  pages: SearchPage[],
  payload: Pick<Payload, 'findByID'>,
): Promise<Map<string, string>> {
  const parentCache = new Map<string, Promise<SearchPageParent | null>>()

  const resolveParent = (id: string | number): Promise<SearchPageParent | null> => {
    const cacheKey = String(id)
    const cached = parentCache.get(cacheKey)
    if (cached) return cached

    const lookup = payload
      .findByID({
        collection: 'pages',
        id,
        depth: 0,
        select: {
          parent: true,
          slug: true,
        },
      })
      .then((parent) => ({ parent: parent.parent, slug: parent.slug }))
      .catch(() => null)

    parentCache.set(cacheKey, lookup)
    return lookup
  }

  const resolvedPages = await Promise.all(
    pages.map(async (page) => {
      const href = await getPageHrefFromSourceWithResolver(page, resolveParent)
      return href ? ([String(page.id), href] as const) : null
    }),
  )
  const hrefs = new Map<string, string>()

  for (const resolvedPage of resolvedPages) {
    if (resolvedPage) hrefs.set(...resolvedPage)
  }

  return hrefs
}
