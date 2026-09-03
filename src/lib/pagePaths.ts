import type { PayloadRequest } from 'payload'

import type { Page } from '@/payload-types'

type PagePathSource = Pick<Page, 'parent' | 'slug'>
type ResolvePageParent = (id: string | number) => Promise<PagePathSource | null>

export const isPageDoc = (value: string | number | Page | null | undefined): value is Page => {
  return typeof value === 'object' && value !== null
}

export const getPageID = (value: string | number | Page | null | undefined): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (isPageDoc(value)) {
    return value.id
  }

  return null
}

export const getPageSlugSegments = (page: Page): string[] => {
  const segments = [page.slug]
  let currentParent = page.parent

  while (isPageDoc(currentParent)) {
    segments.unshift(currentParent.slug)
    currentParent = currentParent.parent
  }

  return segments
}

export const getPageHref = (page: string | number | Page | null | undefined): string | undefined => {
  if (!isPageDoc(page)) {
    return undefined
  }

  return `/${getPageSlugSegments(page).join('/')}`
}

export const getPageHrefFromSource = async (
  page: PagePathSource,
  req: PayloadRequest,
): Promise<string | null> => {
  return getPageHrefFromSourceWithResolver(page, async (id) => {
    return req.payload.findByID({
      collection: 'pages',
      id,
      depth: 0,
      req,
    })
  })
}

export const getPageHrefFromSourceWithResolver = async (
  page: PagePathSource,
  resolvePageParent: ResolvePageParent,
): Promise<string | null> => {
  if (!page.slug) {
    return null
  }

  const segments = [page.slug]
  let currentParent = page.parent

  while (currentParent != null) {
    if (isPageDoc(currentParent)) {
      segments.unshift(currentParent.slug)
      currentParent = currentParent.parent
      continue
    }

    const parentPage = await resolvePageParent(currentParent)

    if (!parentPage) {
      return null
    }

    segments.unshift(parentPage.slug)
    currentParent = parentPage.parent as string | Page | null | undefined
  }

  return `/${segments.join('/')}`
}
