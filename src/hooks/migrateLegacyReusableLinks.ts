import type { CollectionBeforeChangeHook, PayloadRequest } from 'payload'

import type { NavigationLink, Page, SystemPage } from '@/payload-types'
import {
  ensureManualNavigationLinkForURL,
  ensureSyncedNavigationLinkForPage,
} from '@/lib/navigationLinkSync'

type LegacyLinkValue = {
  link?: string | number | NavigationLink | null
  linkType?: 'page' | 'custom' | null
  openInNewTab?: boolean | null
  page?: string | number | Page | null
  url?: string | null
}

const getRelationshipID = (value: string | number | NavigationLink | null | undefined): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null) {
    return value.id
  }

  return null
}

const stripLegacyLinkFields = (value: LegacyLinkValue) => {
  delete value.linkType
  delete value.page
  delete value.url
}

const resolveLinkID = async ({
  fallbackTitle,
  req,
  value,
}: {
  fallbackTitle?: string | null
  req: PayloadRequest
  value: LegacyLinkValue
}): Promise<string | number | null> => {
  const existingLinkID = getRelationshipID(value.link)

  if (existingLinkID) {
    stripLegacyLinkFields(value)
    return existingLinkID
  }

  if (value.linkType === 'page') {
    const syncedLink = value.page
      ? await ensureSyncedNavigationLinkForPage({
          page: value.page,
          req,
        })
      : null

    if (syncedLink) {
      value.link = syncedLink.id
      stripLegacyLinkFields(value)
      return syncedLink.id
    }
  }

  if (value.linkType === 'custom' && value.url?.trim()) {
    const manualLink = await ensureManualNavigationLinkForURL({
      req,
      title: fallbackTitle,
      url: value.url,
    })

    if (manualLink) {
      value.link = manualLink.id
      stripLegacyLinkFields(value)
      return manualLink.id
    }
  }

  return null
}

export const migrateLegacySystemPageLinksBeforeChange: CollectionBeforeChangeHook<SystemPage> = async ({
  data,
  req,
}) => {
  if (!data || !Array.isArray(data.layout)) {
    return data
  }

  for (const block of data.layout) {
    if (!block || typeof block !== 'object' || !('blockType' in block)) {
      continue
    }

    const actionEntries = [block.primaryAction, block.secondaryAction]

    for (const action of actionEntries) {
      if (!action || typeof action !== 'object') {
        continue
      }

      await resolveLinkID({
        fallbackTitle: typeof action.label === 'string' ? action.label : null,
        req,
        value: action as LegacyLinkValue,
      })
    }
  }

  return data
}
