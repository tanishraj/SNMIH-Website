import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'

import type { Page } from '@/payload-types'
import {
  ensureSyncedNavigationLinkForPage,
  findSyncedNavigationLink,
} from '@/lib/navigationLinkSync'

export const syncNavigationLinkAfterChange: CollectionAfterChangeHook<Page> = async ({
  doc,
  req,
}) => {
  await ensureSyncedNavigationLinkForPage({
    page: doc,
    req,
  })

  return doc
}

export const syncNavigationLinkAfterDelete: CollectionAfterDeleteHook<Page> = async ({
  doc,
  req,
}) => {
  const pageID = typeof doc?.id === 'number' ? doc.id : Number(doc?.id)

  if (!pageID) {
    return doc
  }

  const existing = await findSyncedNavigationLink(pageID, req)

  if (!existing) {
    return doc
  }

  await req.payload.update({
    collection: 'navigation-links',
    id: existing.id,
    data: {
      page: null,
      sourceType: 'manual',
      syncPage: null,
    },
    req,
  })

  return doc
}
