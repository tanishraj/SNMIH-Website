import type { PayloadRequest } from 'payload'

import type { NavigationLink, Page } from '@/payload-types'

const getPageID = (value: string | number | Page | null | undefined): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null) {
    return value.id
  }

  return null
}

const getPageTitle = async (
  value: string | number | Page,
  req: PayloadRequest,
): Promise<string | null> => {
  if (typeof value === 'object' && value !== null) {
    return value.title
  }

  const page = await req.payload.findByID({
    collection: 'pages',
    id: value,
    depth: 0,
    req,
  })

  return page.title ?? null
}

export const findSyncedNavigationLink = async (
  pageID: string | number,
  req: PayloadRequest,
): Promise<NavigationLink | null> => {
  const result = await req.payload.find({
    collection: 'navigation-links',
    where: {
      syncPage: {
        equals: pageID,
      },
    },
    limit: 1,
    depth: 0,
    req,
  })

  return result.docs[0] ?? null
}

export const findReusablePageLink = async (
  pageID: string | number,
  req: PayloadRequest,
): Promise<NavigationLink | null> => {
  const result = await req.payload.find({
    collection: 'navigation-links',
    where: {
      page: {
        equals: pageID,
      },
    },
    limit: 1,
    depth: 0,
    req,
  })

  return result.docs[0] ?? null
}

export const findNavigationLinkByURL = async (
  url: string,
  req: PayloadRequest,
): Promise<NavigationLink | null> => {
  const normalizedURL = url.trim()

  if (!normalizedURL) {
    return null
  }

  const result = await req.payload.find({
    collection: 'navigation-links',
    where: {
      and: [
        {
          linkType: {
            equals: 'custom',
          },
        },
        {
          url: {
            equals: normalizedURL,
          },
        },
      ],
    },
    limit: 1,
    depth: 0,
    req,
  })

  return result.docs[0] ?? null
}

export const ensureSyncedNavigationLinkForPage = async ({
  page,
  req,
}: {
  page: string | number | Page
  req: PayloadRequest
}): Promise<NavigationLink | null> => {
  const pageID = getPageID(page)

  if (!pageID) {
    return null
  }

  const pageTitle = await getPageTitle(page, req)

  if (!pageTitle) {
    return null
  }

  const existing =
    (await findSyncedNavigationLink(pageID, req)) ??
    (await findReusablePageLink(pageID, req))

  const data = {
    linkType: 'page' as const,
    page: String(pageID),
    sourceType: 'pageSynced' as const,
    syncPage: String(pageID),
    title: pageTitle,
  }

  if (existing) {
    return req.payload.update({
      collection: 'navigation-links',
      id: existing.id,
      data,
      depth: 0,
      req,
    })
  }

  return req.payload.create({
    collection: 'navigation-links',
    data,
    depth: 0,
    req,
  })
}

export const ensureManualNavigationLinkForURL = async ({
  req,
  title,
  url,
}: {
  req: PayloadRequest
  title?: string | null
  url: string
}): Promise<NavigationLink | null> => {
  const normalizedURL = url.trim()

  if (!normalizedURL) {
    return null
  }

  const existing = await findNavigationLinkByURL(normalizedURL, req)

  if (existing) {
    return existing
  }

  return req.payload.create({
    collection: 'navigation-links',
    data: {
      linkType: 'custom',
      sourceType: 'manual',
      title: title?.trim() || normalizedURL,
      url: normalizedURL,
    },
    depth: 0,
    req,
  })
}
