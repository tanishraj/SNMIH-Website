import type {
  CollectionAfterChangeHook,
  PayloadRequest,
} from 'payload'

import type { Page, Redirect } from '@/payload-types'

import { normalizeRedirectPath } from '@/lib/redirects'
import { getPageHref, isPageDoc } from '@/lib/pagePaths'

const isPublished = (value: { _status?: 'draft' | 'published' | null } | null | undefined) =>
  value?._status === 'published'

const getRelationshipID = (value: string | number | Page | null | undefined): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (isPageDoc(value)) {
    return value.id
  }

  return null
}

const findExistingRedirect = async (
  fromPath: string,
  req: PayloadRequest,
): Promise<Redirect | null> => {
  const result = await req.payload.find({
    collection: 'redirects',
    where: {
      fromPath: {
        equals: normalizeRedirectPath(fromPath),
      },
    },
    limit: 1,
    depth: 0,
    req,
  })

  return result.docs[0] ?? null
}

const findEnabledRedirectsByFromPath = async (
  fromPath: string,
  req: PayloadRequest,
): Promise<Redirect[]> => {
  const result = await req.payload.find({
    collection: 'redirects',
    where: {
      and: [
        {
          fromPath: {
            equals: normalizeRedirectPath(fromPath),
          },
        },
        {
          enabled: {
            equals: true,
          },
        },
      ],
    },
    limit: 50,
    depth: 0,
    req,
  })

  return result.docs
}

const getHomepageID = async (req: PayloadRequest): Promise<string | number | null> => {
  const pageSettings = await req.payload.findGlobal({
    slug: 'page-settings',
    depth: 0,
    req,
  })

  return getRelationshipID(pageSettings.homepage as string | number | Page | null | undefined)
}

const upsertRedirect = async ({
  destination,
  fromPath,
  req,
}: {
  destination:
    | {
        type: 'custom'
        url: string
      }
    | {
        pageID: string | number
        type: 'page'
      }
  fromPath: string
  req: PayloadRequest
}) => {
  const normalizedFromPath = normalizeRedirectPath(fromPath)
  const existing = await findExistingRedirect(normalizedFromPath, req)
  const data: Pick<
    Redirect,
    '_status' | 'destinationType' | 'enabled' | 'fromPath' | 'page' | 'statusCode' | 'url'
  > = {
    fromPath: normalizedFromPath,
    destinationType: destination.type === 'page' ? 'page' : 'custom',
    page: destination.type === 'page' ? String(destination.pageID) : null,
    statusCode: '301',
    url: destination.type === 'custom' ? destination.url : null,
    enabled: true,
    _status: 'published' as const,
  }

  if (existing) {
    await req.payload.update({
      collection: 'redirects',
      id: existing.id,
      data,
      req,
    })

    return
  }

  await req.payload.create({
    collection: 'redirects',
    data,
    req,
  })
}

const deleteConflictingRedirectsForLivePath = async ({
  livePath,
  req,
}: {
  livePath: string
  req: PayloadRequest
}): Promise<Redirect[]> => {
  const redirects = await findEnabledRedirectsByFromPath(livePath, req)

  for (const redirect of redirects) {
    await req.payload.delete({
      collection: 'redirects',
      id: redirect.id,
      req,
    })
  }

  return redirects
}

const hydratePagePath = async (
  pageLike: Pick<Page, 'slug' | 'parent'>,
  req: PayloadRequest,
): Promise<string | null> => {
  const segments = [pageLike.slug]
  let currentParent = pageLike.parent

  while (currentParent != null) {
    if (isPageDoc(currentParent)) {
      segments.unshift(currentParent.slug)
      currentParent = currentParent.parent
      continue
    }

    const parentPage = await req.payload.findByID({
      collection: 'pages',
      id: currentParent,
      depth: 0,
      req,
    })

    segments.unshift(parentPage.slug)
    currentParent = parentPage.parent as string | Page | null | undefined
  }

  return normalizeRedirectPath(`/${segments.join('/')}`)
}

const isDescendantOf = (page: Page, ancestorID: string | number): boolean => {
  let currentParent = page.parent

  while (currentParent != null) {
    const parentID = getRelationshipID(currentParent)

    if (parentID == null) {
      return false
    }

    if (parentID === ancestorID) {
      return true
    }

    if (!isPageDoc(currentParent)) {
      return false
    }

    currentParent = currentParent.parent
  }

  return false
}

const createDescendantRedirects = async ({
  newRootPath,
  oldRootPath,
  pageID,
  req,
}: {
  newRootPath: string
  oldRootPath: string
  pageID: string | number
  req: PayloadRequest
}) => {
  const publishedPages = await req.payload.find({
    collection: 'pages',
    where: {
      _status: {
        equals: 'published',
      },
    },
    depth: 10,
    limit: 1000,
    req,
  })

  const descendants = publishedPages.docs.filter((page) => isDescendantOf(page, pageID))

  for (const descendant of descendants) {
    const currentPath = getPageHref(descendant)

    if (!currentPath || !currentPath.startsWith(`${newRootPath}/`)) {
      continue
    }

    const suffix = currentPath.slice(newRootPath.length)
    const oldDescendantPath = normalizeRedirectPath(`${oldRootPath}${suffix}`)

    if (oldDescendantPath === currentPath) {
      continue
    }

    await upsertRedirect({
      destination: {
        pageID: descendant.id,
        type: 'page',
      },
      fromPath: oldDescendantPath,
      req,
    })
  }
}

export const createRedirectsForChangedPagePath: CollectionAfterChangeHook<Page> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update' || !previousDoc) {
    return doc
  }

  if (!isPublished(previousDoc) || !isPublished(doc)) {
    return doc
  }

  const oldPath = await hydratePagePath(previousDoc, req)
  const newPath = await hydratePagePath(doc, req)

  if (!oldPath || !newPath || oldPath === newPath) {
    return doc
  }

  const pageID = typeof doc.id === 'number' ? doc.id : Number(doc.id)
  const homepageID = await getHomepageID(req)

  const deletedConflicts = await deleteConflictingRedirectsForLivePath({
    livePath: newPath,
    req,
  })

  const restoredPreviousPath = deletedConflicts.some((redirect) => {
    if (redirect.destinationType === 'page') {
      return getRelationshipID(redirect.page as string | number | Page | null | undefined) === pageID
    }

    const destinationUrl = redirect.url?.trim()

    return destinationUrl ? normalizeRedirectPath(destinationUrl) === oldPath : false
  })

  if (!restoredPreviousPath) {
    await upsertRedirect({
      destination:
        homepageID === pageID
          ? {
              type: 'custom',
              url: '/',
            }
          : {
              pageID,
              type: 'page',
            },
      fromPath: oldPath,
      req,
    })
  }

  await createDescendantRedirects({
    newRootPath: newPath,
    oldRootPath: oldPath,
    pageID,
    req,
  })

  return doc
}
