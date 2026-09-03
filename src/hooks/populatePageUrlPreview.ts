import type { CollectionAfterReadHook } from 'payload'

import type { Page } from '@/payload-types'

import { getPageHrefFromSource } from '@/lib/pagePaths'

type PageWithUrlPreview = Page & {
  publicUrlPreview?: string | null
}

export const populatePageUrlPreview: CollectionAfterReadHook<PageWithUrlPreview> = async ({
  doc,
  findMany,
  req,
}) => {
  if (findMany) {
    return doc
  }

  doc.publicUrlPreview = await getPageHrefFromSource(doc, req)

  return doc
}
