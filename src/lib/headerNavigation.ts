import type { Page } from '@/payload-types'

import { getPageHref } from './pagePaths'

export type HeaderLinkRow = {
  label?: string | null
  linkType?: 'page' | 'custom' | null
  openInNewTab?: boolean | null
  page?: string | number | Page | null
  url?: string | null
}

export type HeaderMenuItemRow = HeaderLinkRow & {
  children?: HeaderLinkRow[] | null
}

export type ResolvedHeaderLink = {
  href: string
  label: string
  newTab: boolean
}

export type ResolvedHeaderMenuItem = ResolvedHeaderLink & {
  children?: ResolvedHeaderLink[]
}

export const resolveHeaderLink = (item: HeaderLinkRow): ResolvedHeaderLink | null => {
  const label = item.label?.trim()

  if (!label) {
    return null
  }

  const href = item.linkType === 'page' ? getPageHref(item.page) : item.url?.trim() || undefined

  if (!href) {
    return null
  }

  return {
    href,
    label,
    newTab: Boolean(item.openInNewTab),
  }
}

export const resolveHeaderMenuItem = (item: HeaderMenuItemRow): ResolvedHeaderMenuItem | null => {
  const resolved = resolveHeaderLink(item)

  if (!resolved) {
    return null
  }

  const children = (item.children ?? [])
    .map((child) => resolveHeaderLink(child))
    .filter((child): child is ResolvedHeaderLink => child !== null)

  if (children.length === 0) {
    return resolved
  }

  return {
    ...resolved,
    children,
  }
}

export const resolveHeaderMenuItems = (items: HeaderMenuItemRow[] | null | undefined): ResolvedHeaderMenuItem[] => {
  return (items ?? [])
    .map((item) => resolveHeaderMenuItem(item))
    .filter((item): item is ResolvedHeaderMenuItem => item !== null)
}
