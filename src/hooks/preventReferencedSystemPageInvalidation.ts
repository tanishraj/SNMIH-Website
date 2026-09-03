import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

import type { SystemModeSetting, SystemPage } from '@/payload-types'
import type { SystemPageType } from '@/lib/systemPageTypes'

const getSystemPageID = (value: string | number | SystemPage | null | undefined): string | number | null => {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (typeof value === 'object' && value !== null) {
    return value.id
  }

  return null
}

const getSystemBehaviorUsage = (pageSettings: SystemModeSetting, pageID: string | number) => {
  const usage: Array<{
    fieldLabel: string
    requiredType: SystemPageType
  }> = []

  if (getSystemPageID(pageSettings.notFoundPage as string | number | SystemPage | null | undefined) === pageID) {
    usage.push({
      fieldLabel: 'Site Defaults -> System -> 404 Page',
      requiredType: '404',
    })
  }

  if (
    getSystemPageID(pageSettings.maintenancePage as string | number | SystemPage | null | undefined) === pageID
  ) {
    usage.push({
      fieldLabel: 'Site Defaults -> System -> Maintenance Page',
      requiredType: 'maintenance',
    })
  }

  if (
    getSystemPageID(pageSettings.comingSoonPage as string | number | SystemPage | null | undefined) === pageID
  ) {
    usage.push({
      fieldLabel: 'Site Defaults -> System -> Coming Soon Page',
      requiredType: 'comingSoon',
    })
  }

  return usage
}

export const preventReferencedSystemPageInvalidation: CollectionBeforeChangeHook<SystemPage> = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation !== 'update' || !originalDoc) {
    return data
  }

  const pageID = originalDoc.id
  const pageSettings = await req.payload.findGlobal({
    slug: 'page-settings',
    depth: 0,
    req,
  })

  const usage = getSystemBehaviorUsage(pageSettings, pageID)

  if (usage.length === 0) {
    return data
  }

  const nextStatus = data._status ?? originalDoc._status
  const nextType = (data.type ?? originalDoc.type) as SystemPageType

  if (nextStatus !== 'published') {
    throw new APIError(
      `This system page cannot be unpublished because it is still used by ${usage.map((entry) => entry.fieldLabel).join('; ')}. Remove these references first.`,
      400,
      null,
      true,
    )
  }

  const invalidUsage = usage.filter((entry) => entry.requiredType !== nextType)

  if (invalidUsage.length > 0) {
    throw new APIError(
      `This system page cannot change type because it is still used by ${invalidUsage.map((entry) => entry.fieldLabel).join('; ')}. Remove these references first.`,
      400,
      null,
      true,
    )
  }

  return data
}
