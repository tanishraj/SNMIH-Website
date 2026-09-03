import type {
  CollectionBeforeChangeHook,
  PayloadRequest,
} from 'payload'
import { APIError } from 'payload'

import type { NavigationLink, Page, Redirect } from '@/payload-types'

import { getPageID } from '@/lib/pagePaths'

const getLinkTargetLabel = (link: NavigationLink): string => {
  const title = link.title?.trim()

  if (title) {
    return `Links -> ${title}`
  }

  return `Links -> #${link.id}`
}

const getRedirectTargetLabel = (redirect: Redirect): string => {
  const fromPath = redirect.fromPath?.trim()

  if (fromPath) {
    return `Redirects -> ${fromPath}`
  }

  return `Redirects -> #${redirect.id}`
}

const getReferencedPageUsage = async (pageID: string | number, req: PayloadRequest) => {
  const [pageSettings, links, redirects] = await Promise.all([
    req.payload.findGlobal({
      slug: 'page-settings',
      depth: 0,
      req,
    }),
    req.payload.find({
      collection: 'navigation-links',
      where: {
        page: {
          equals: pageID,
        },
      },
      depth: 0,
      limit: 50,
      req,
    }),
    req.payload.find({
      collection: 'redirects',
      where: {
        and: [
          {
            destinationType: {
              equals: 'page',
            },
          },
          {
            page: {
              equals: pageID,
            },
          },
          {
            enabled: {
              equals: true,
            },
          },
          {
            _status: {
              equals: 'published',
            },
          },
        ],
      },
      depth: 0,
      limit: 50,
      req,
    }),
  ])

  const usage: string[] = []

  if (getPageID(pageSettings.homepage as string | number | Page | null | undefined) === pageID) {
    usage.push('Page Settings -> Default Home')
  }

  if (links.docs.length > 0) {
    usage.push(...links.docs.map((link: NavigationLink) => getLinkTargetLabel(link)))
  }

  if (redirects.docs.length > 0) {
    usage.push(...redirects.docs.map((redirect: Redirect) => getRedirectTargetLabel(redirect)))
  }

  return usage
}

export const preventReferencedPageUnpublish: CollectionBeforeChangeHook<Page> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !originalDoc || originalDoc._status !== 'published') {
    return data
  }

  const nextStatus = data._status ?? originalDoc._status

  if (nextStatus !== 'draft') {
    return data
  }

  const pageID = originalDoc.id
  const usage = await getReferencedPageUsage(pageID, req)

  if (usage.length > 0) {
    throw new APIError(
      `This page cannot be unpublished because it is still used by ${usage.join('; ')}. Remove these references first.`,
      400,
      null,
      true,
    )
  }

  return data
}
