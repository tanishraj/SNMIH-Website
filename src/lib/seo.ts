import type { Metadata } from 'next'

export const robotsFieldOptions = [
  {
    label: 'Index, Follow',
    value: 'index,follow',
  },
  {
    label: 'No Index, Follow',
    value: 'noindex,follow',
  },
  {
    label: 'Index, No Follow',
    value: 'index,nofollow',
  },
  {
    label: 'No Index, No Follow',
    value: 'noindex,nofollow',
  },
] as const

export type RobotsFieldValue = (typeof robotsFieldOptions)[number]['value']
export const robotsModeOptions = [
  {
    label: 'Default',
    value: 'default',
  },
  {
    label: 'Index',
    value: 'index',
  },
  {
    label: 'No Index',
    value: 'noindex',
  },
] as const
export const sitemapInclusionOptions = [
  {
    label: 'Default',
    value: 'default',
  },
  {
    label: 'Include',
    value: 'include',
  },
  {
    label: 'Exclude',
    value: 'exclude',
  },
] as const

export type RobotsModeValue = (typeof robotsModeOptions)[number]['value']
export type SitemapInclusionValue = (typeof sitemapInclusionOptions)[number]['value']

export function getRobotsMetadata(value: string | null | undefined): Metadata['robots'] {
  switch (value) {
    case 'noindex,follow':
      return { index: false, follow: true }
    case 'index,nofollow':
      return { index: true, follow: false }
    case 'noindex,nofollow':
      return { index: false, follow: false }
    case 'index,follow':
    default:
      return { index: true, follow: true }
  }
}

export const resolveCanonicalURL = ({
  canonicalURL,
  resolvedPath,
}: {
  canonicalURL?: string | null
  resolvedPath: string
}): string | null => {
  const trimmedCanonical = canonicalURL?.trim()

  if (!trimmedCanonical) {
    return resolvedPath
  }

  if (trimmedCanonical.startsWith('/')) {
    return trimmedCanonical
  }

  try {
    return new URL(trimmedCanonical).toString()
  } catch {
    return null
  }
}

export const resolveRobotsMode = ({
  inheritedRobots,
  robotsMode,
}: {
  inheritedRobots?: RobotsFieldValue | null
  robotsMode?: RobotsModeValue | null
}): Metadata['robots'] => {
  switch (robotsMode) {
    case 'index':
      return {
        follow: true,
        index: true,
      }
    case 'noindex':
      return {
        follow: true,
        index: false,
      }
    case 'default':
    default:
      return getRobotsMetadata(inheritedRobots)
  }
}

export const resolveSitemapInclusion = ({
  includeInSitemap,
  isIndexable,
  isPublicRoute,
  isPublished,
}: {
  includeInSitemap?: SitemapInclusionValue | null
  isIndexable: boolean
  isPublicRoute: boolean
  isPublished: boolean
}): boolean => {
  if (includeInSitemap === 'exclude') {
    return false
  }

  if (includeInSitemap === 'include') {
    return isPublicRoute && isPublished && isIndexable
  }

  return isPublicRoute && isPublished && isIndexable
}
