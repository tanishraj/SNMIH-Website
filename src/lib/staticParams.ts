import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

type StaticCollection = 'pages' | 'articles' | 'reviews' | 'news-events' | 'categories' | 'tags'
type RouteRecord = { id: string; slug: string; parent?: string | null }

// Read small batches of routing fields only. Public access also excludes moderated
// submissions and trashed records; draft content must never enter build artifacts.
async function getRouteRecords(collection: StaticCollection): Promise<RouteRecord[]> {
  const payload = await getPayload({ config })
  const records: RouteRecord[] = []
  let page = 1
  while (true) {
    const result = await payload.find({
      collection,
      depth: 0,
      draft: false,
      overrideAccess: false,
      limit: 100,
      page,
      sort: 'id',
      select: { slug: true, ...(collection === 'pages' ? { parent: true } : {}) },
      ...(collection === 'categories' || collection === 'tags'
        ? {}
        : { where: { _status: { equals: 'published' as const } } }),
    })
    records.push(...(result.docs as RouteRecord[]))
    if (!result.hasNextPage) return records
    page += 1
  }
}

export async function getStaticSlugParams(collection: Exclude<StaticCollection, 'pages'>) {
  const records = await getRouteRecords(collection)
  return [...new Set(records.map(({ slug }) => slug).filter(Boolean))].map((slug) => ({ slug }))
}

export async function getStaticPageParams() {
  const records = await getRouteRecords('pages')
  const byID = new Map(records.map((record) => [record.id, record]))
  const paths = new Set<string>()
  for (const record of records) {
    const segments: string[] = []
    const visited = new Set<string>()
    let current: RouteRecord | undefined = record
    while (current) {
      // Missing/unpublished ancestors and malformed cycles have no public path.
      if (!current.slug || visited.has(current.id)) break
      visited.add(current.id)
      segments.unshift(current.slug)
      if (!current.parent) {
        paths.add(segments.join('/'))
        break
      }
      current = byID.get(current.parent)
    }
  }
  return [...paths].map((pathname) => ({ slug: pathname.split('/') }))
}
