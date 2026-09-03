import 'server-only'

import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload, type Payload, type Where } from 'payload'

import {
  ANNUAL_CALENDAR_RESPONSE_VERSION,
  getAnnualCalendarClassificationIDs,
  materializeAnnualCalendarMonths,
  type AnnualCalendarInitialSnapshot,
  type AnnualCalendarPeriodInput,
  type AnnualCalendarPeriodSnapshot,
  normalizeAnnualCalendarPeriod,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import {
  CALENDAR_RESPONSE_VERSION,
  formatCalendarMonthLabel,
  getCalendarClassificationIDs,
  getCalendarMonthCacheKey,
  type CalendarClassification,
  type CalendarEvent,
  type CalendarInitialSnapshot,
  type CalendarMonthSnapshot,
} from '@/blocks/Calendar/calendarShared'
import { CMS_CACHE_TAGS } from '@/hooks/revalidateCmsContent'
import {
  normalizeNewsEventClassificationRecord,
  type ResolvedNewsEventClassification,
} from '@/lib/newsEventClassifications'
import {
  formatZonedDateRange,
  formatZonedTime,
  getZonedDayBounds,
  getZonedDateKey,
  getZonedMonthBounds,
  getZonedMonthKey,
  getZonedToday,
  type SiteTimeZone,
} from '@/lib/siteTimeZone'
import { getSiteTimeZone } from '@/lib/siteTimeZone.server'
import type { User } from '@/payload-types'

type CalendarPayload = Pick<Payload, 'find'>

type CalendarReadMode =
  | { draft?: false; overrideAccess: true; user?: never }
  | { draft: true; overrideAccess: false; user: User }

export class CalendarScopeError extends Error {
  constructor(message = 'Calendar classification scope is invalid.') {
    super(message)
    this.name = 'CalendarScopeError'
  }
}

export const calendarEventSelect = {
  classification: true,
  eventAllDay: true,
  eventEnd: true,
  eventLocation: true,
  eventStart: true,
  slug: true,
  title: true,
} as const

export const buildCalendarMonthWhere = ({
  classificationIDs,
  endISO,
  published = true,
  startISO,
}: {
  classificationIDs: string[]
  endISO: string
  published?: boolean
  startISO: string
}): Where => ({
  and: [
    ...(published ? [{ _status: { equals: 'published' } }] : []),
    { classification: { in: classificationIDs } },
    { eventStart: { less_than_equal: endISO } },
    {
      or: [
        { eventEnd: { greater_than_equal: startISO } },
        {
          and: [
            { or: [{ eventEnd: { exists: false } }, { eventEnd: { equals: null } }] },
            { eventStart: { greater_than_equal: startISO } },
          ],
        },
      ],
    },
  ],
})

export const buildCalendarPeriodWhere = ({
  classificationIDs,
  endISO,
  published = true,
  startISO,
}: {
  classificationIDs: string[]
  endISO: string
  published?: boolean
  startISO: string
}): Where => ({
  and: [
    ...(published ? [{ _status: { equals: 'published' } }] : []),
    { classification: { in: classificationIDs } },
    { eventStart: { greater_than_equal: startISO } },
    { eventStart: { less_than_equal: endISO } },
  ],
})

const relationID = (value: unknown): string | null => {
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as { id?: unknown }).id
      : value
  return typeof raw === 'string' || typeof raw === 'number' ? String(raw) : null
}

const toCalendarClassification = (
  value: ResolvedNewsEventClassification,
): CalendarClassification => ({
  badgeLabel: value.badgeLabel,
  calendarColor: value.calendarColor,
  id: value.id,
  slug: value.slug,
  title: value.title,
})

export async function resolveCalendarClassifications(
  payload: CalendarPayload,
  requested: readonly string[],
  mode: CalendarReadMode,
): Promise<CalendarClassification[]> {
  const ids = getCalendarClassificationIDs([...requested])
  if (ids.length === 0 || ids.length !== requested.length) throw new CalendarScopeError()

  const result = await payload.find({
    collection: 'news-event-classifications',
    depth: 0,
    pagination: false,
    select: {
      active: true,
      badgeLabel: true,
      behavior: true,
      calendarColor: true,
      slug: true,
      title: true,
    },
    where: {
      and: [{ id: { in: ids } }, { active: { equals: true } }, { behavior: { equals: 'event' } }],
    },
    ...mode,
  })

  const byID = new Map<string, CalendarClassification>()
  for (const record of result.docs) {
    const normalized = normalizeNewsEventClassificationRecord(record)
    if (normalized?.active && normalized.behavior === 'event') {
      byID.set(normalized.id, toCalendarClassification(normalized))
    }
  }
  const ordered = ids.map((id) => byID.get(id)).filter(Boolean) as CalendarClassification[]
  if (ordered.length !== ids.length) throw new CalendarScopeError()
  return ordered
}

type CalendarEventRecord = {
  classification?: unknown
  eventAllDay?: boolean | null
  eventEnd?: string | null
  eventLocation?: string | null
  eventStart?: string | null
  id?: number | string
  slug?: string | null
  title?: string | null
}

const normalizeCalendarEvent = (
  record: CalendarEventRecord,
  classifications: ReadonlyMap<string, CalendarClassification>,
  timeZone: SiteTimeZone,
): CalendarEvent | null => {
  const classificationID = relationID(record.classification)
  const classification = classificationID ? classifications.get(classificationID) : undefined
  const eventStart = record.eventStart
  const title = record.title?.trim()
  const slug = record.slug?.trim()
  if (!classification || !eventStart || !title || !slug || record.id == null) return null

  const startDateKey = getZonedDateKey(eventStart, timeZone)
  const effectiveEnd = record.eventEnd || eventStart
  const endDateKey = getZonedDateKey(effectiveEnd, timeZone)
  if (!startDateKey || !endDateKey) return null
  const allDay = record.eventAllDay === true

  return {
    allDay,
    classification,
    endDateKey,
    eventEnd: record.eventEnd || undefined,
    eventStart,
    href: `/news-events/${slug}`,
    id: String(record.id),
    location: record.eventLocation?.trim() || undefined,
    rangeLabel: formatZonedDateRange(eventStart, record.eventEnd, timeZone, allDay),
    startDateKey,
    timeLabel: allDay ? undefined : formatZonedTime(eventStart, timeZone),
    title,
  }
}

const normalizeEvents = (
  docs: unknown[],
  classifications: CalendarClassification[],
  timeZone: SiteTimeZone,
): CalendarEvent[] => {
  const byID = new Map(classifications.map((classification) => [classification.id, classification]))
  return docs
    .map((record) => normalizeCalendarEvent(record as CalendarEventRecord, byID, timeZone))
    .filter(Boolean)
    .sort((left, right) => {
      const start = new Date(left!.eventStart).getTime() - new Date(right!.eventStart).getTime()
      return start || left!.id.localeCompare(right!.id)
    }) as CalendarEvent[]
}

export async function fetchCalendarMonth(
  payload: CalendarPayload,
  classificationIDs: readonly string[],
  monthKey: string,
  timeZone: SiteTimeZone,
  mode: CalendarReadMode,
): Promise<CalendarMonthSnapshot> {
  const classifications = await resolveCalendarClassifications(payload, classificationIDs, mode)
  const { endISO, startISO } = getZonedMonthBounds(monthKey, timeZone)
  const result = await payload.find({
    collection: 'news-events',
    depth: 0,
    limit: 500,
    pagination: false,
    select: calendarEventSelect,
    sort: ['eventStart', 'id'],
    where: buildCalendarMonthWhere({
      classificationIDs: classifications.map(({ id }) => id),
      endISO,
      published: mode.overrideAccess,
      startISO,
    }),
    ...mode,
  })

  return {
    events: normalizeEvents(result.docs, classifications, timeZone),
    monthKey,
    monthLabel: formatCalendarMonthLabel(monthKey),
    version: CALENDAR_RESPONSE_VERSION,
  }
}

export async function fetchAnnualCalendarPeriod(
  payload: CalendarPayload,
  classificationIDs: readonly string[],
  periodInput: AnnualCalendarPeriodInput,
  todayKey: string,
  timeZone: SiteTimeZone,
  mode: CalendarReadMode,
): Promise<AnnualCalendarPeriodSnapshot> {
  const period = normalizeAnnualCalendarPeriod(periodInput, todayKey)
  if (!period) throw new CalendarScopeError('Annual Calendar period is invalid.')

  const classifications = await resolveCalendarClassifications(payload, classificationIDs, mode)
  const { startISO } = getZonedMonthBounds(period.startMonthKey, timeZone)
  const { endISO } = getZonedMonthBounds(period.endMonthKey, timeZone)
  const result = await payload.find({
    collection: 'news-events',
    depth: 0,
    pagination: false,
    select: calendarEventSelect,
    sort: ['eventStart', 'id'],
    where: buildCalendarPeriodWhere({
      classificationIDs: classifications.map(({ id }) => id),
      endISO,
      published: mode.overrideAccess,
      startISO,
    }),
    ...mode,
  })
  const events = normalizeEvents(result.docs, classifications, timeZone)

  return {
    classifications,
    endMonthKey: period.endMonthKey,
    eventCount: events.length,
    months: materializeAnnualCalendarMonths(period.monthKeys, events),
    periodLabel: period.periodLabel,
    startMonthKey: period.startMonthKey,
    version: ANNUAL_CALENDAR_RESPONSE_VERSION,
  }
}

export async function fetchCalendarUpcoming(
  payload: CalendarPayload,
  classifications: CalendarClassification[],
  now: Date,
  timeZone: SiteTimeZone,
  mode: CalendarReadMode,
): Promise<CalendarEvent[]> {
  const todayKey = getZonedToday(now, timeZone)
  const { startISO } = getZonedDayBounds(todayKey, timeZone)
  const result = await payload.find({
    collection: 'news-events',
    depth: 0,
    limit: 500,
    pagination: false,
    select: calendarEventSelect,
    sort: ['eventStart', 'id'],
    where: {
      and: [
        ...(mode.overrideAccess ? [{ _status: { equals: 'published' } }] : []),
        { classification: { in: classifications.map(({ id }) => id) } },
        {
          or: [
            { eventEnd: { greater_than_equal: startISO } },
            {
              and: [
                { or: [{ eventEnd: { exists: false } }, { eventEnd: { equals: null } }] },
                { eventStart: { greater_than_equal: startISO } },
              ],
            },
          ],
        },
      ],
    },
    ...mode,
  })
  const nowTime = now.getTime()
  return normalizeEvents(result.docs, classifications, timeZone)
    .filter((event) =>
      event.allDay
        ? event.endDateKey >= todayKey
        : new Date(event.eventEnd || event.eventStart).getTime() >= nowTime,
    )
    .slice(0, 4)
}

const getPayloadClient = async () => getPayload({ config: configPromise })

export async function getPublicCalendarMonth(
  classificationIDs: readonly string[],
  monthKey: string,
): Promise<CalendarMonthSnapshot> {
  const timeZone = await getSiteTimeZone()
  const ids = getCalendarClassificationIDs([...classificationIDs])
  const cacheKey = getCalendarMonthCacheKey(monthKey, ids)
  return unstable_cache(
    async () =>
      fetchCalendarMonth(await getPayloadClient(), ids, monthKey, timeZone, {
        overrideAccess: true,
      }),
    ['calendar-month', cacheKey, timeZone],
    {
      revalidate: false,
      tags: [
        CMS_CACHE_TAGS.calendar,
        CMS_CACHE_TAGS.newsEvents,
        CMS_CACHE_TAGS.newsEventClassifications,
        CMS_CACHE_TAGS.siteSettings,
      ],
    },
  )()
}

export async function getPublicCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  now: Date = new Date(),
): Promise<CalendarInitialSnapshot> {
  const payload = await getPayloadClient()
  const timeZone = await getSiteTimeZone()
  const classifications = await resolveCalendarClassifications(payload, classificationIDs, {
    overrideAccess: true,
  })
  const monthKey = getZonedMonthKey(now, timeZone)
  const month = await getPublicCalendarMonth(classificationIDs, monthKey)
  const upcomingBucket = Math.floor(now.getTime() / 300_000)
  const upcoming = await unstable_cache(
    async () =>
      fetchCalendarUpcoming(payload, classifications, now, timeZone, { overrideAccess: true }),
    ['calendar-upcoming', JSON.stringify(classificationIDs), timeZone, String(upcomingBucket)],
    {
      revalidate: 300,
      tags: [
        CMS_CACHE_TAGS.calendar,
        CMS_CACHE_TAGS.newsEvents,
        CMS_CACHE_TAGS.newsEventClassifications,
        CMS_CACHE_TAGS.siteSettings,
      ],
    },
  )()

  return { classifications, month, timeZone, todayKey: getZonedToday(now, timeZone), upcoming }
}

export async function getDraftCalendarMonth(
  classificationIDs: readonly string[],
  monthKey: string,
  user: User,
): Promise<CalendarMonthSnapshot> {
  const timeZone = await getSiteTimeZone()
  return fetchCalendarMonth(await getPayloadClient(), classificationIDs, monthKey, timeZone, {
    draft: true,
    overrideAccess: false,
    user,
  })
}

export async function getDraftCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  user: User,
  now: Date = new Date(),
): Promise<CalendarInitialSnapshot> {
  const payload = await getPayloadClient()
  const timeZone = await getSiteTimeZone()
  const mode = { draft: true, overrideAccess: false, user } as const
  const classifications = await resolveCalendarClassifications(payload, classificationIDs, mode)
  const monthKey = getZonedMonthKey(now, timeZone)
  const [month, upcoming] = await Promise.all([
    fetchCalendarMonth(payload, classificationIDs, monthKey, timeZone, mode),
    fetchCalendarUpcoming(payload, classifications, now, timeZone, mode),
  ])
  return { classifications, month, timeZone, todayKey: getZonedToday(now, timeZone), upcoming }
}

export async function getPublicAnnualCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  periodInput: AnnualCalendarPeriodInput = {},
  now: Date = new Date(),
): Promise<AnnualCalendarInitialSnapshot> {
  const payload = await getPayloadClient()
  const timeZone = await getSiteTimeZone()
  const ids = getAnnualCalendarClassificationIDs([...classificationIDs])
  const todayKey = getZonedToday(now, timeZone)
  const period = normalizeAnnualCalendarPeriod(periodInput, todayKey)
  if (!period) throw new CalendarScopeError('Annual Calendar period is invalid.')
  const periodSnapshot = await unstable_cache(
    async () =>
      fetchAnnualCalendarPeriod(payload, ids, periodInput, todayKey, timeZone, {
        overrideAccess: true,
      }),
    [
      'annual-calendar-period',
      String(ANNUAL_CALENDAR_RESPONSE_VERSION),
      period.periodMode,
      period.startMonthKey,
      period.endMonthKey,
      timeZone,
      ...ids,
    ],
    {
      revalidate: false,
      tags: [
        CMS_CACHE_TAGS.calendar,
        CMS_CACHE_TAGS.newsEvents,
        CMS_CACHE_TAGS.newsEventClassifications,
        CMS_CACHE_TAGS.siteSettings,
      ],
    },
  )()
  const upcomingBucket = Math.floor(now.getTime() / 300_000)
  const upcoming = await unstable_cache(
    async () =>
      fetchCalendarUpcoming(payload, periodSnapshot.classifications, now, timeZone, {
        overrideAccess: true,
      }),
    ['annual-calendar-upcoming', JSON.stringify(ids), timeZone, String(upcomingBucket)],
    {
      revalidate: 300,
      tags: [
        CMS_CACHE_TAGS.calendar,
        CMS_CACHE_TAGS.newsEvents,
        CMS_CACHE_TAGS.newsEventClassifications,
        CMS_CACHE_TAGS.siteSettings,
      ],
    },
  )()

  return { ...periodSnapshot, timeZone, todayKey, upcoming }
}

export async function getDraftAnnualCalendarInitialSnapshot(
  classificationIDs: readonly string[],
  periodInput: AnnualCalendarPeriodInput,
  user: User,
  now: Date = new Date(),
): Promise<AnnualCalendarInitialSnapshot> {
  const payload = await getPayloadClient()
  const timeZone = await getSiteTimeZone()
  const todayKey = getZonedToday(now, timeZone)
  const mode = { draft: true, overrideAccess: false, user } as const
  const periodSnapshot = await fetchAnnualCalendarPeriod(
    payload,
    classificationIDs,
    periodInput,
    todayKey,
    timeZone,
    mode,
  )
  const upcoming = await fetchCalendarUpcoming(
    payload,
    periodSnapshot.classifications,
    now,
    timeZone,
    mode,
  )

  return { ...periodSnapshot, timeZone, todayKey, upcoming }
}
