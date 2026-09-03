import 'server-only'

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import {
  normalizeSiteOfficeLocations,
  type SiteOfficeLocation,
  type SiteOfficeLocationSource,
} from '@/lib/siteOfficesShared'

const loadAllOfficeLocations = cache(async (draft: boolean): Promise<SiteOfficeLocation[]> => {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'office-locations',
    draft,
    limit: 200,
    overrideAccess: false,
    where: draft ? undefined : { _status: { equals: 'published' } },
    sort: 'createdAt',
  })

  return normalizeSiteOfficeLocations(result.docs as unknown as SiteOfficeLocationSource[])
})

const loadOfficeLocationsByIds = cache(
  async (ids: string, draft: boolean): Promise<SiteOfficeLocation[]> => {
    const idList = ids.split(',').filter(Boolean)
    if (!idList.length) return []

    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'office-locations',
      draft,
      limit: idList.length,
      overrideAccess: false,
      where: {
        and: [
          { id: { in: idList } },
          ...(draft ? [] : [{ _status: { equals: 'published' } }]),
        ],
      },
    })

    const normalized = normalizeSiteOfficeLocations(
      result.docs as unknown as SiteOfficeLocationSource[],
    )

    // Preserve the caller-defined order
    const byId = Object.fromEntries(normalized.map((o) => [o.id, o]))
    return idList.map((id) => byId[id]).filter(Boolean) as SiteOfficeLocation[]
  },
)

export const getPublishedSiteOfficeLocations = () => loadAllOfficeLocations(false)
export const getDraftSiteOfficeLocations = () => loadAllOfficeLocations(true)

export const getPublishedSiteOfficeLocationsByIds = (ids: string[]) =>
  loadOfficeLocationsByIds(ids.join(','), false)

export const getDraftSiteOfficeLocationsByIds = (ids: string[]) =>
  loadOfficeLocationsByIds(ids.join(','), true)
