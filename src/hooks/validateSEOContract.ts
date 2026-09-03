import { APIError, type CollectionBeforeChangeHook } from 'payload'

import {
  resolveCanonicalURL,
  resolveRobotsMode,
  type RobotsModeValue,
  type SitemapInclusionValue,
} from '@/lib/seo'

type ValidateSEOContractOptions = {
  getIsPublicRoute?: (args: {
    data: Record<string, unknown>
    originalDoc?: Record<string, unknown> | null
  }) => boolean
}

type SEOContractData = {
  canonicalURL?: string | null
  includeInSitemap?: SitemapInclusionValue | null
  robotsMode?: RobotsModeValue | null
} & Record<string, unknown>

export const validateSEOContract =
  ({ getIsPublicRoute }: ValidateSEOContractOptions = {}): CollectionBeforeChangeHook =>
  async ({ data, originalDoc }) => {
    if (!data) {
      return data
    }

    const nextData = data as SEOContractData
    const canonicalURL = nextData.canonicalURL?.trim()

    if (canonicalURL) {
      const resolvedCanonical = resolveCanonicalURL({
        canonicalURL,
        resolvedPath: '/',
      })

      if (resolvedCanonical == null) {
        throw new APIError(
          'Canonical URL must be a valid site-relative path or absolute URL.',
          400,
        )
      }
    }

    const isPublicRoute = getIsPublicRoute
      ? getIsPublicRoute({
          data: nextData,
          originalDoc: (originalDoc as Record<string, unknown> | null | undefined) ?? null,
        })
      : true

    const resolvedRobots = resolveRobotsMode({
      inheritedRobots: 'index,follow',
      robotsMode: nextData.robotsMode,
    })
    const isIndexable =
      typeof resolvedRobots === 'object' && resolvedRobots !== null
        ? resolvedRobots.index !== false
        : resolvedRobots !== 'noindex'

    if (nextData.includeInSitemap === 'include' && (!isPublicRoute || !isIndexable)) {
      throw new APIError('Noindexed or non-public routes cannot be forced into the sitemap.', 400)
    }

    return data
  }
