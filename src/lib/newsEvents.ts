import 'server-only'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Payload, type Where } from 'payload'
import { cache } from 'react'

import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import {
  NEWS_EVENTS_HIGHLIGHTS_FEATURED_LIMIT,
  NEWS_EVENTS_HIGHLIGHTS_UPCOMING_LIMIT,
} from '@/blocks/NewsEventsHighlights/newsEventsHighlightsShared'
import {
  isNewsEventsTabsItemsPerTab,
  NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS,
  type NewsEventsTabsItemsPerTab,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import {
  normalizeLegacyNewsEventClassification,
  normalizeNewsEventClassificationRecord,
  type NewsEventClassification,
  type ResolvedNewsEventClassification,
} from '@/lib/newsEventClassifications'
import {
  createEmptyNewsEventGroups,
  createEmptyNewsEventPage,
  normalizeHighlightsItemCount,
  type PublicNewsEventCard,
  type PublicNewsEventDetail,
  type PublicNewsEventGroups,
  type PublicNewsEventPage,
  toPublicNewsEventCard,
  toPublicNewsEventDetail,
} from '@/lib/newsEventsShared'
import type { NewsEvent, SeoSetting, User } from '@/payload-types'
import { getSiteTimeZone } from '@/lib/siteTimeZone.server'
import {
  DEFAULT_SITE_TIME_ZONE,
  getZonedDayBounds,
  getZonedToday,
  type SiteTimeZone,
} from '@/lib/siteTimeZone'

export type NewsEventsPayload = Pick<Payload, 'find' | 'findGlobal' | 'logger'>

type NewsEventCardRecord = Pick<
  NewsEvent,
  | 'classification'
  | 'contentType'
  | 'createdAt'
  | 'eventAllDay'
  | 'eventEnd'
  | 'eventStart'
  | 'excerpt'
  | 'featuredInHighlights'
  | 'featuredImage'
  | 'featuredImagePosition'
  | 'id'
  | 'primaryCategory'
  | 'publishedAt'
  | 'slug'
  | 'title'
  | 'updatedAt'
>

const cardSelect = {
  classification: true,
  contentType: true,
  createdAt: true,
  eventAllDay: true,
  eventEnd: true,
  eventStart: true,
  excerpt: true,
  featuredInHighlights: true,
  featuredImage: true,
  featuredImagePosition: true,
  primaryCategory: true,
  publishedAt: true,
  slug: true,
  title: true,
  updatedAt: true,
} as const

const publishedWhere: Where[] = [{ _status: { equals: 'published' } }]

const normalizeGroupLimit = (value: number): number =>
  Number.isInteger(value) ? Math.min(12, Math.max(1, value)) : 6

const positiveIntegerPattern = /^[1-9]\d*$/
const normalizeRequestedClassificationIDs = (value: string | null): string[] | null => {
  if (!value) return null

  const rawIDs = value.split(',')
  if (
    rawIDs.length === 0 ||
    rawIDs.length > NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS ||
    rawIDs.some((id) => !id.trim())
  ) {
    return null
  }

  return [...new Set(rawIDs.map((id) => id.trim()))]
}

export function parseNewsEventsTabsPagination(searchParams: URLSearchParams):
  | {
      classification: 'all' | string
      classificationIDs: string[]
      limit: NewsEventsTabsItemsPerTab
      ok: true
      page: number
    }
  | { message: string; ok: false } {
  const classification = searchParams.get('classification')

  if (!classification?.trim()) {
    return { message: 'Classification is invalid.', ok: false }
  }

  const requestedClassification = classification.trim()

  const rawClassificationIDs = searchParams.get('classifications')
  const classificationIDs =
    requestedClassification === 'all' && rawClassificationIDs === null
      ? []
      : normalizeRequestedClassificationIDs(rawClassificationIDs)

  if (!classificationIDs) {
    return { message: 'Select at least one classification.', ok: false }
  }

  if (requestedClassification !== 'all' && !classificationIDs.includes(requestedClassification)) {
    return { message: 'Classification must be included in the selected scope.', ok: false }
  }

  const pageValue = searchParams.get('page')

  if (!pageValue || !positiveIntegerPattern.test(pageValue)) {
    return { message: 'Page must be a positive integer.', ok: false }
  }

  const limitValue = searchParams.get('limit')
  const limit = limitValue && positiveIntegerPattern.test(limitValue) ? Number(limitValue) : NaN

  if (!isNewsEventsTabsItemsPerTab(limit)) {
    return { message: 'Limit must be one of 3, 6, 9, or 12.', ok: false }
  }

  return {
    classification: requestedClassification,
    classificationIDs,
    limit,
    ok: true,
    page: Number(pageValue),
  }
}

const legacyScopePrefix = 'legacy:'

const getLegacyScopeValue = (id: string): NewsEventClassification | null =>
  id.startsWith(legacyScopePrefix)
    ? normalizeLegacyNewsEventClassification(id.slice(legacyScopePrefix.length))
    : null

export async function resolveActiveNewsEventClassifications(
  payload: Pick<NewsEventsPayload, 'find'>,
  requestedIDs: readonly string[],
): Promise<ResolvedNewsEventClassification[]> {
  const normalizedIDs = [...new Set(requestedIDs.map((id) => id.trim()).filter(Boolean))]
  if (normalizedIDs.length === 0) return []

  const directIDs: string[] = []
  const legacyValues: NewsEventClassification[] = []

  for (const id of normalizedIDs) {
    const legacyValue = getLegacyScopeValue(id)

    if (legacyValue) legacyValues.push(legacyValue)
    else directIDs.push(id)
  }

  const or: Where[] = []
  if (directIDs.length > 0) or.push({ id: { in: directIDs } })
  if (legacyValues.length > 0) or.push({ legacyValue: { in: legacyValues } })

  const result = await payload.find({
    collection: 'news-event-classifications',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    where: {
      and: [{ active: { equals: true } }, { or }],
    },
  })
  const records = result.docs.flatMap((value) => {
    const classification = normalizeNewsEventClassificationRecord(value)

    return classification?.active ? [classification] : []
  })
  const byID = new Map(records.map((classification) => [classification.id, classification]))
  const byLegacyValue = new Map(
    records.flatMap((classification) =>
      classification.legacyValue ? ([[classification.legacyValue, classification]] as const) : [],
    ),
  )

  return normalizedIDs.flatMap((id) => {
    const legacyValue = getLegacyScopeValue(id)
    const classification = legacyValue ? byLegacyValue.get(legacyValue) : byID.get(id)

    return classification ? [classification] : []
  })
}

export async function resolveAllActiveNewsEventClassifications(
  payload: Pick<NewsEventsPayload, 'find'>,
): Promise<ResolvedNewsEventClassification[]> {
  const result = await payload.find({
    collection: 'news-event-classifications',
    depth: 0,
    overrideAccess: true,
    pagination: false,
    sort: ['title', 'id'],
    where: { active: { equals: true } },
  })

  return result.docs.flatMap((value) => {
    const classification = normalizeNewsEventClassificationRecord(value)

    return classification?.active ? [classification] : []
  })
}

export class NewsEventsTabsRequestError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NewsEventsTabsRequestError'
  }
}

const missingEventEndWhere: Where = {
  or: [{ eventEnd: { exists: false } }, { eventEnd: { equals: null } }],
}

const allDayEventWhere: Where = { eventAllDay: { equals: true } }
const timedEventWhere: Where = {
  or: [
    { eventAllDay: { equals: false } },
    { eventAllDay: { exists: false } },
    { eventAllDay: { equals: null } },
  ],
}

const eventEndingOnOrAfter = (thresholdISO: string): Where => ({
  or: [
    { eventEnd: { greater_than_equal: thresholdISO } },
    {
      and: [missingEventEndWhere, { eventStart: { greater_than_equal: thresholdISO } }],
    },
  ],
})

const eventEndingBefore = (thresholdISO: string): Where => ({
  or: [
    { eventEnd: { less_than: thresholdISO } },
    {
      and: [missingEventEndWhere, { eventStart: { less_than: thresholdISO } }],
    },
  ],
})

export const currentOrUpcomingEventWhere = (
  nowISO: string,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): Where => {
  const todayStartISO = getZonedDayBounds(getZonedToday(nowISO, timeZone), timeZone).startISO

  return {
    or: [
      { and: [allDayEventWhere, eventEndingOnOrAfter(todayStartISO)] },
      { and: [timedEventWhere, eventEndingOnOrAfter(nowISO)] },
    ],
  }
}

export const pastEventWhere = (
  nowISO: string,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): Where => {
  const todayStartISO = getZonedDayBounds(getZonedToday(nowISO, timeZone), timeZone).startISO

  return {
    or: [
      { and: [allDayEventWhere, eventEndingBefore(todayStartISO)] },
      { and: [timedEventWhere, eventEndingBefore(nowISO)] },
    ],
  }
}

const missingClassificationWhere: Where = {
  or: [{ classification: { exists: false } }, { classification: { equals: null } }],
}

/**
 * During the compatibility release, unmigrated entries have only contentType.
 * The missing-relationship guard prevents stale legacy values on migrated entries
 * from placing them in a second or behavior-incompatible stream.
 */
const classificationScopeWhere = (
  classifications: ResolvedNewsEventClassification[],
  single = false,
): Where | null => {
  const ids = classifications.map(({ id }) => id)
  if (ids.length === 0) return null

  const legacyValues = classifications.flatMap(({ legacyValue }) =>
    legacyValue ? [legacyValue] : [],
  )
  const relationshipWhere: Where = {
    classification: single && ids.length === 1 ? { equals: ids[0] } : { in: ids },
  }

  if (legacyValues.length === 0) return relationshipWhere

  const legacyValueWhere: Where = {
    contentType:
      single && legacyValues.length === 1 ? { equals: legacyValues[0] } : { in: legacyValues },
  }

  return {
    or: [relationshipWhere, { and: [missingClassificationWhere, legacyValueWhere] }],
  }
}

const uniqueNewsEventRecords = (...groups: NewsEventCardRecord[][]): NewsEventCardRecord[] => {
  const seen = new Set<string>()

  return groups.flat().filter((record) => {
    const id = String(record.id)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

const toPublicNewsEventCards = (
  records: NewsEventCardRecord[],
  nowISO: string,
  timeZone: SiteTimeZone,
): PublicNewsEventCard[] => records.map((entry) => toPublicNewsEventCard(entry, nowISO, timeZone))

async function fetchEventDirectoryPrefix(
  payload: Pick<NewsEventsPayload, 'find'>,
  {
    limit,
    nowISO,
    scopeWhere,
    timeZone,
  }: {
    limit: number
    nowISO: string
    scopeWhere: Where
    timeZone: SiteTimeZone
  },
): Promise<NewsEventCardRecord[]> {
  const [currentResult, pastResult] = await Promise.all([
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit,
      overrideAccess: true,
      select: cardSelect,
      sort: ['eventStart', 'id'],
      where: {
        and: [...publishedWhere, scopeWhere, currentOrUpcomingEventWhere(nowISO, timeZone)],
      },
    }),
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit,
      overrideAccess: true,
      select: cardSelect,
      sort: ['-eventStart', '-id'],
      where: {
        and: [...publishedWhere, scopeWhere, pastEventWhere(nowISO, timeZone)],
      },
    }),
  ])

  return uniqueNewsEventRecords(
    currentResult.docs as NewsEventCardRecord[],
    pastResult.docs as NewsEventCardRecord[],
  ).slice(0, limit)
}

// The All tab leads with what is coming up: current and upcoming Events soonest-first, then every
// other entry (Stories and past Events) newest-published first. Both streams are fetched as one
// prefix so Load More pages never repeat or skip an entry.
async function fetchMixedNewsEventsPage(
  payload: Pick<NewsEventsPayload, 'find'>,
  {
    classifications,
    limit,
    nowISO,
    page,
    timeZone = DEFAULT_SITE_TIME_ZONE,
  }: {
    classifications: ResolvedNewsEventClassification[]
    limit: number
    nowISO: string
    page: number
    timeZone?: SiteTimeZone
  },
): Promise<PublicNewsEventPage> {
  const storyWhere = classificationScopeWhere(
    classifications.filter(({ behavior }) => behavior === 'story'),
  )
  const eventWhere = classificationScopeWhere(
    classifications.filter(({ behavior }) => behavior === 'event'),
  )
  if (!storyWhere && !eventWhere) return createEmptyNewsEventPage(page)

  const offset = (page - 1) * limit
  const end = page * limit
  const prefixLimit = end + 1
  const restWhere: Where[] = []
  if (storyWhere) restWhere.push(storyWhere)
  if (eventWhere) restWhere.push({ and: [eventWhere, pastEventWhere(nowISO, timeZone)] })

  const [upcomingResult, restResult] = await Promise.all([
    eventWhere
      ? payload.find({
          collection: 'news-events',
          depth: 1,
          limit: prefixLimit,
          overrideAccess: true,
          select: cardSelect,
          sort: ['eventStart', 'id'],
          where: {
            and: [...publishedWhere, eventWhere, currentOrUpcomingEventWhere(nowISO, timeZone)],
          },
        })
      : Promise.resolve({ docs: [] }),
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit: prefixLimit,
      overrideAccess: true,
      select: cardSelect,
      sort: ['-publishedAt', '-id'],
      where: {
        and: [...publishedWhere, { or: restWhere }],
      },
    }),
  ])
  const records = uniqueNewsEventRecords(
    upcomingResult.docs as NewsEventCardRecord[],
    restResult.docs as NewsEventCardRecord[],
  )

  return {
    docs: toPublicNewsEventCards(records.slice(offset, end), nowISO, timeZone),
    hasNextPage: records.length > end,
    page,
  }
}

export async function fetchNewsEventsHighlights(
  payload: Pick<NewsEventsPayload, 'find'>,
  {
    classificationIDs = [],
    nowISO,
    timeZone = DEFAULT_SITE_TIME_ZONE,
  }: {
    classificationIDs?: readonly string[]
    nowISO: string
    timeZone?: SiteTimeZone
  },
): Promise<PublicNewsEventCard[]> {
  const requestedIDs = [...new Set(classificationIDs.map((id) => id.trim()).filter(Boolean))]
  const classifications =
    requestedIDs.length > 0
      ? await resolveActiveNewsEventClassifications(payload, requestedIDs)
      : await resolveAllActiveNewsEventClassifications(payload)

  if (requestedIDs.length > 0 && classifications.length !== requestedIDs.length) return []
  if (classifications.length === 0) return []

  const eventWhere = classificationScopeWhere(
    classifications.filter(({ behavior }) => behavior === 'event'),
  )
  if (!eventWhere) return []

  const eligibilityWhere = currentOrUpcomingEventWhere(nowISO, timeZone)
  const [featuredResult, upcomingResult] = await Promise.all([
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit: NEWS_EVENTS_HIGHLIGHTS_FEATURED_LIMIT,
      overrideAccess: true,
      select: cardSelect,
      sort: ['eventStart', 'id'],
      where: {
        and: [
          ...publishedWhere,
          eventWhere,
          eligibilityWhere,
          { featuredInHighlights: { equals: true } },
        ],
      },
    }),
    payload.find({
      collection: 'news-events',
      depth: 1,
      limit: NEWS_EVENTS_HIGHLIGHTS_UPCOMING_LIMIT,
      overrideAccess: true,
      select: cardSelect,
      sort: ['eventStart', 'id'],
      where: {
        and: [
          ...publishedWhere,
          eventWhere,
          eligibilityWhere,
          { featuredInHighlights: { not_equals: true } },
        ],
      },
    }),
  ])

  const records = uniqueNewsEventRecords(
    featuredResult.docs as NewsEventCardRecord[],
    upcomingResult.docs as NewsEventCardRecord[],
  )

  return toPublicNewsEventCards(records, nowISO, timeZone)
}

export async function fetchNewsEventGroups(
  payload: Pick<NewsEventsPayload, 'find'>,
  {
    classifications,
    limit,
    nowISO,
    timeZone = DEFAULT_SITE_TIME_ZONE,
  }: {
    classifications: ResolvedNewsEventClassification[]
    limit: number
    nowISO: string
    timeZone?: SiteTimeZone
  },
): Promise<PublicNewsEventGroups> {
  const resolvedLimit = normalizeGroupLimit(limit)
  const allPromise = fetchNewsEventPage(payload, {
    classification: 'all',
    classifications,
    limit: resolvedLimit,
    nowISO,
    page: 1,
    timeZone,
  })
  const classificationPromises = classifications.map(async (classification) => {
    const page = await fetchNewsEventPage(payload, {
      classification,
      classifications,
      limit: resolvedLimit,
      nowISO,
      page: 1,
      timeZone,
    })

    return [classification, page] as const
  })
  const [all, classificationPages] = await Promise.all([
    allPromise,
    Promise.all(classificationPromises),
  ])
  const groups: PublicNewsEventGroups = { all }

  for (const [classification, items] of classificationPages) {
    groups[classification.id] = items
    if (classification.legacyValue) groups[classification.legacyValue] = items
  }

  return groups
}

export async function fetchNewsEventPage(
  payload: Pick<NewsEventsPayload, 'find'>,
  {
    classification,
    classifications,
    limit,
    nowISO,
    page,
    timeZone = DEFAULT_SITE_TIME_ZONE,
  }: {
    classification: 'all' | ResolvedNewsEventClassification
    classifications: ResolvedNewsEventClassification[]
    limit: number
    nowISO: string
    page: number
    timeZone?: SiteTimeZone
  },
): Promise<PublicNewsEventPage> {
  const resolvedLimit = normalizeGroupLimit(limit)
  const resolvedPage = Number.isInteger(page) && page > 0 ? page : 1

  if (classification === 'all') {
    return fetchMixedNewsEventsPage(payload, {
      classifications,
      limit: resolvedLimit,
      nowISO,
      page: resolvedPage,
      timeZone,
    })
  }

  const isEvent = classification.behavior === 'event'
  const scopeWhere = classificationScopeWhere([classification], true)
  if (!scopeWhere) return createEmptyNewsEventPage(resolvedPage)

  if (isEvent) {
    const offset = (resolvedPage - 1) * resolvedLimit
    const end = resolvedPage * resolvedLimit
    const records = await fetchEventDirectoryPrefix(payload, {
      limit: end + 1,
      nowISO,
      scopeWhere,
      timeZone,
    })

    return {
      docs: toPublicNewsEventCards(records.slice(offset, end), nowISO, timeZone),
      hasNextPage: records.length > end,
      page: resolvedPage,
    }
  }

  const result = await payload.find({
    collection: 'news-events',
    depth: 1,
    limit: resolvedLimit,
    overrideAccess: true,
    page: resolvedPage,
    select: cardSelect,
    sort: ['-publishedAt', '-id'],
    where: {
      and: [...publishedWhere, scopeWhere],
    },
  })

  return {
    docs: (result.docs as NewsEventCardRecord[]).map((entry) =>
      toPublicNewsEventCard(entry, nowISO, timeZone),
    ),
    hasNextPage: result.hasNextPage,
    page: result.page ?? resolvedPage,
  }
}

export async function fetchNewsEventPageForScope(
  payload: Pick<NewsEventsPayload, 'find'>,
  {
    classification,
    classificationIDs,
    limit,
    nowISO,
    page,
    timeZone = DEFAULT_SITE_TIME_ZONE,
  }: {
    classification: 'all' | string
    classificationIDs: readonly string[]
    limit: number
    nowISO: string
    page: number
    timeZone?: SiteTimeZone
  },
): Promise<PublicNewsEventPage> {
  const requestedIDs = [...new Set(classificationIDs.map((id) => id.trim()).filter(Boolean))]
  const classifications =
    requestedIDs.length > 0
      ? await resolveActiveNewsEventClassifications(payload, requestedIDs)
      : classification === 'all'
        ? await resolveAllActiveNewsEventClassifications(payload)
        : []

  if (requestedIDs.length > 0 && classifications.length !== requestedIDs.length) {
    throw new NewsEventsTabsRequestError('Classification scope is invalid.')
  }

  const selectedIndex = classification === 'all' ? -1 : requestedIDs.indexOf(classification)
  const selectedClassification = classification === 'all' ? 'all' : classifications[selectedIndex]

  if (!selectedClassification) {
    throw new NewsEventsTabsRequestError('Classification scope is invalid.')
  }

  return fetchNewsEventPage(payload, {
    classification: selectedClassification,
    classifications,
    limit,
    nowISO,
    page,
    timeZone,
  })
}

export async function fetchNewsGridItems(
  payload: Pick<NewsEventsPayload, 'find'>,
  {
    limit,
    nowISO,
    timeZone = DEFAULT_SITE_TIME_ZONE,
  }: {
    limit: number
    nowISO: string
    timeZone?: SiteTimeZone
  },
): Promise<PublicNewsEventCard[]> {
  const resolvedLimit = normalizeHighlightsItemCount(limit)
  const classifications = await resolveAllActiveNewsEventClassifications(payload)
  const storyWhere = classificationScopeWhere(
    classifications.filter(({ behavior }) => behavior === 'story'),
  )
  const eventWhere = classificationScopeWhere(
    classifications.filter(({ behavior }) => behavior === 'event'),
  )
  const classificationWhere: Where[] = []

  if (storyWhere) classificationWhere.push(storyWhere)
  if (eventWhere) {
    classificationWhere.push({
      and: [eventWhere, currentOrUpcomingEventWhere(nowISO, timeZone)],
    })
  }

  if (classificationWhere.length === 0) return []

  const result = await payload.find({
    collection: 'news-events',
    depth: 1,
    limit: resolvedLimit,
    overrideAccess: true,
    select: cardSelect,
    sort: ['-publishedAt', '-createdAt', '-id'],
    where: {
      and: [...publishedWhere, { or: classificationWhere }],
    },
  })

  return (result.docs as NewsEventCardRecord[]).map((entry) =>
    toPublicNewsEventCard(entry, nowISO, timeZone),
  )
}

export async function fetchNewsEventBySlug(
  payload: Pick<NewsEventsPayload, 'find'>,
  slug: string,
  nowISO: string,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): Promise<PublicNewsEventDetail | null> {
  const result = await payload.find({
    collection: 'news-events',
    depth: 2,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [...publishedWhere, { slug: { equals: slug } }],
    },
  })

  const entry = result.docs[0] as NewsEvent | undefined

  return entry ? toPublicNewsEventDetail(entry, nowISO, timeZone) : null
}

const loadPayload = cache(async () => getPayload({ config: configPromise }))

export const getNewsEventsHighlights = cache(
  async (classificationIDs: readonly string[], nowISO: string) => {
    const payload = await loadPayload()
    const timeZone = await getSiteTimeZone()

    try {
      return await fetchNewsEventsHighlights(payload, {
        classificationIDs,
        nowISO,
        timeZone,
      })
    } catch (error) {
      payload.logger.error({ err: error, msg: 'Failed to load News & Events highlights.' })
      throw error
    }
  },
)

export async function getNewsEventGroups(
  classificationIDs: readonly string[],
  limit: number,
  nowISO: string,
): Promise<PublicNewsEventGroups> {
  const payload = await loadPayload()
  const timeZone = await getSiteTimeZone()

  try {
    const classifications =
      classificationIDs.length > 0
        ? await resolveActiveNewsEventClassifications(payload, classificationIDs)
        : await resolveAllActiveNewsEventClassifications(payload)

    return await fetchNewsEventGroups(payload, { classifications, limit, nowISO, timeZone })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Failed to load grouped News & Events.' })
    return { all: createEmptyNewsEventGroups().all }
  }
}

export const getNewsEventPage = cache(
  async (
    classification: 'all' | string,
    classificationIDs: string[],
    page: number,
    limit: number,
    nowISO: string,
  ) => {
    const payload = await loadPayload()
    const timeZone = await getSiteTimeZone()
    return fetchNewsEventPageForScope(payload, {
      classification,
      classificationIDs,
      limit,
      nowISO,
      page,
      timeZone,
    })
  },
)

export const getNewsGridItems = cache(async (limit: number, nowISO: string) => {
  const payload = await loadPayload()
  const timeZone = await getSiteTimeZone()

  try {
    return await fetchNewsGridItems(payload, { limit, nowISO, timeZone })
  } catch (error) {
    payload.logger.error({ err: error, msg: 'Failed to load News Grid items.' })
    throw error
  }
})

export const getNewsEventBySlug = cache(async (slug: string, nowISO: string) => {
  const payload = await loadPayload()
  const timeZone = await getSiteTimeZone()
  return fetchNewsEventBySlug(payload, slug, nowISO, timeZone)
})

export async function getNewsEventPreviewBySlug(
  slug: string,
  user: User,
): Promise<NewsEvent | null> {
  const payload = await loadPayload()
  const result = await payload.find({
    collection: 'news-events',
    depth: 2,
    draft: true,
    limit: 1,
    overrideAccess: false,
    user,
    where: { slug: { equals: slug } },
  })

  return result.docs[0] ?? null
}

const _getNewsEventsInheritedRobots = async (): Promise<SeoSetting['robots']> => {
  const payload = await loadPayload()
  const settings = await payload.findGlobal({ slug: 'seo-settings', depth: 0 })
  return settings.robots
}

export const getNewsEventsInheritedRobots = unstable_cache(
  _getNewsEventsInheritedRobots,
  ['news-events-inherited-robots'],
  { tags: [CMS_CACHE_TAGS.globals], revalidate: false },
)
