import type { CalendarTone } from '@/lib/newsEventClassifications'
import type { SiteTimeZone } from '@/lib/siteTimeZone'

export const CALENDAR_MAX_CLASSIFICATIONS = 5
export const CALENDAR_RESPONSE_VERSION = 1 as const
export const CALENDAR_ADJACENT_MONTH_DATE_MODES = ['muted', 'hidden'] as const

export type CalendarAdjacentMonthDates = (typeof CALENDAR_ADJACENT_MONTH_DATE_MODES)[number]

export const normalizeCalendarAdjacentMonthDates = (value?: unknown): CalendarAdjacentMonthDates =>
  value === 'hidden' ? 'hidden' : 'muted'

export type CalendarClassification = {
  badgeLabel: string
  calendarColor: CalendarTone
  id: string
  slug: string
  title: string
}

export type CalendarEvent = {
  allDay: boolean
  classification: CalendarClassification
  endDateKey: string
  eventEnd?: string
  eventStart: string
  href: string
  id: string
  location?: string
  rangeLabel: string
  startDateKey: string
  timeLabel?: string
  title: string
}

export type CalendarMonthSnapshot = {
  events: CalendarEvent[]
  monthKey: string
  monthLabel: string
  version: typeof CALENDAR_RESPONSE_VERSION
}

export type CalendarInitialSnapshot = {
  classifications: CalendarClassification[]
  month: CalendarMonthSnapshot
  timeZone: SiteTimeZone
  todayKey: string
  upcoming: CalendarEvent[]
}

type RelationshipValue = { id?: number | string | null } | number | string | null | undefined

export const getCalendarClassificationIDs = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  const ids: string[] = []
  const seen = new Set<string>()

  for (const item of value as RelationshipValue[]) {
    const raw = item && typeof item === 'object' ? item.id : item
    if (typeof raw !== 'string' && typeof raw !== 'number') continue
    const id = String(raw).trim()
    if (!id || seen.has(id)) continue
    seen.add(id)
    ids.push(id)
    if (ids.length === CALENDAR_MAX_CLASSIFICATIONS) break
  }

  return ids
}

export const getCalendarScopeKey = (classificationIDs: readonly string[]): string =>
  JSON.stringify(classificationIDs)

export const getCalendarMonthCacheKey = (
  monthKey: string,
  classificationIDs: readonly string[],
): string => JSON.stringify([CALENDAR_RESPONSE_VERSION, monthKey, ...classificationIDs])

const dateKeyToUTC = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

const utcToDateKey = (date: Date): string =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`

export type CalendarGridCell = {
  dateKey: string
  day: number
  inMonth: boolean
}

export const buildCalendarGrid = (monthKey: string): CalendarGridCell[] => {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey)
  if (!match) return []
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const first = new Date(Date.UTC(year, monthIndex, 1))
  const gridStart = new Date(first.getTime() - first.getUTCDay() * 86_400_000)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getTime() + index * 86_400_000)
    return {
      dateKey: utcToDateKey(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthIndex,
    }
  })
}

export type CalendarEventCoverage = {
  dateKey: string
  isContinuation: boolean
  isEnd: boolean
  isStart: boolean
}

export const getCalendarEventCoverage = (
  event: Pick<CalendarEvent, 'endDateKey' | 'startDateKey'>,
  visibleStartKey: string,
  visibleEndKey: string,
): CalendarEventCoverage[] => {
  const start = Math.max(
    dateKeyToUTC(event.startDateKey).getTime(),
    dateKeyToUTC(visibleStartKey).getTime(),
  )
  const end = Math.min(
    dateKeyToUTC(event.endDateKey).getTime(),
    dateKeyToUTC(visibleEndKey).getTime(),
  )
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return []

  const coverage: CalendarEventCoverage[] = []
  for (let cursor = start; cursor <= end; cursor += 86_400_000) {
    const dateKey = utcToDateKey(new Date(cursor))
    coverage.push({
      dateKey,
      isContinuation: dateKey !== event.startDateKey,
      isEnd: dateKey === event.endDateKey,
      isStart: dateKey === event.startDateKey,
    })
  }
  return coverage
}

export const getAdjacentCalendarMonth = (monthKey: string, offset: number): string => {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1 + offset, 1))
  return utcToDateKey(date).slice(0, 7)
}

export const formatCalendarMonthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, 1))
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(date)
}
