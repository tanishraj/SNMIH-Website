import type { NavigationLink, Page } from '@/payload-types'

import { getPageHref } from './pagePaths'

export const isNavigationLinkDoc = (
  value: string | number | NavigationLink | null | undefined,
): value is NavigationLink => {
  return typeof value === 'object' && value !== null
}

export const resolveNavigationLink = (
  value: string | number | NavigationLink | null | undefined,
): {
  description?: string
  href?: string
  openInNewTab?: boolean
  title?: string
} => {
  if (!isNavigationLinkDoc(value)) {
    return {}
  }

  const href =
    value.linkType === 'page'
      ? getPageHref(value.page as string | number | Page | null | undefined)
      : value.url ?? undefined

  if (!href) {
    return {}
  }

  return {
    description: value.description ?? undefined,
    href,
    openInNewTab: value.openInNewTab ?? undefined,
    title: value.title,
  }
}
