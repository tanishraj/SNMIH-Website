import 'server-only'

import type { Payload } from 'payload'

import { getPageHrefFromSourceWithResolver, isPageDoc } from '@/lib/pagePaths'
import type { Page, SiteSetting } from '@/payload-types'

type PageParent = Pick<Page, 'parent' | 'slug'>

export type LegalPageHrefs = {
  privacyPolicyUrl: string | null
  termsAndConditionsUrl: string | null
}

export async function resolveLegalPageHrefs(
  siteSettings: Pick<SiteSetting, 'privacyPolicyPage' | 'termsAndConditionsPage'>,
  payload: Pick<Payload, 'findByID'>,
): Promise<LegalPageHrefs> {
  const parentCache = new Map<string, Promise<PageParent | null>>()

  const resolveParent = (id: string | number): Promise<PageParent | null> => {
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
      .then(({ parent, slug }) => ({ parent, slug }))
      .catch(() => null)

    parentCache.set(cacheKey, lookup)
    return lookup
  }

  const resolvePage = (page: SiteSetting['privacyPolicyPage']) =>
    isPageDoc(page) ? getPageHrefFromSourceWithResolver(page, resolveParent) : null

  const [privacyPolicyUrl, termsAndConditionsUrl] = await Promise.all([
    resolvePage(siteSettings.privacyPolicyPage),
    resolvePage(siteSettings.termsAndConditionsPage),
  ])

  return {
    privacyPolicyUrl,
    termsAndConditionsUrl,
  }
}
