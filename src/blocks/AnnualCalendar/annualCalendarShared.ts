import {
  getCalendarClassificationIDs,
  type CalendarClassification,
  type CalendarEvent,
} from '@/blocks/Calendar/calendarShared'
import type { SiteTimeZone } from '@/lib/siteTimeZone'

export const ANNUAL_CALENDAR_RESPONSE_VERSION = 3 as const
export const ANNUAL_CALENDAR_PERIOD_VALIDATION_MESSAGE =
  'Choose dates whose months define exactly 12 consecutive months.' as const

export type AnnualCalendarPeriodMode = 'currentYear' | 'customAcademicYear'

export type AnnualCalendarPeriodInput = {
  periodEndDate?: string | null
  periodMode?: AnnualCalendarPeriodMode | null
  periodStartDate?: string | null
}

export type ResolvedAnnualCalendarPeriod = {
  endMonthKey: string
  monthKeys: string[]
  periodLabel: string
  periodMode: AnnualCalendarPeriodMode
  startMonthKey: string
}

export type AnnualCalendarMonth = {
  events: CalendarEvent[]
  monthKey: string
  monthLabel: string
}

export type AnnualCalendarPeriodSnapshot = {
  classifications: CalendarClassification[]
  endMonthKey: string
  eventCount: number
  months: AnnualCalendarMonth[]
  periodLabel: string
  startMonthKey: string
  version: typeof ANNUAL_CALENDAR_RESPONSE_VERSION
}

export type AnnualCalendarInitialSnapshot = AnnualCalendarPeriodSnapshot & {
  timeZone: SiteTimeZone
  todayKey: string
  upcoming: CalendarEvent[]
}

export const getAnnualCalendarClassificationIDs = (value: unknown): string[] =>
  getCalendarClassificationIDs(value)

export const getAnnualCalendarScopeKey = (
  classificationIDs: readonly string[],
  periodInput: AnnualCalendarPeriodInput = {},
): string => {
  const isCustom = periodInput.periodMode === 'customAcademicYear'
  return JSON.stringify([
    classificationIDs,
    isCustom ? 'customAcademicYear' : 'currentYear',
    isCustom ? (periodInput.periodStartDate ?? null) : null,
    isCustom ? (periodInput.periodEndDate ?? null) : null,
  ])
}

const MONTH_KEY_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/

const parseMonthKey = (monthKey: string): { month: number; year: number } | null => {
  const match = MONTH_KEY_PATTERN.exec(monthKey)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  return year >= 1000 && year <= 9999 ? { month, year } : null
}

const toMonthKey = (year: number, month: number): string =>
  `${year}-${String(month).padStart(2, '0')}`

export const getAnnualCalendarDateMonthKey = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.trim().length === 0) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = date.getUTCFullYear()
  if (year < 1000 || year > 9999) return null

  return toMonthKey(year, date.getUTCMonth() + 1)
}

export const getAnnualCalendarPeriodMonthKeys = (
  startMonthKey: string,
  endMonthKey: string,
): string[] => {
  const start = parseMonthKey(startMonthKey)
  const end = parseMonthKey(endMonthKey)
  if (!start || !end) return []

  const startIndex = start.year * 12 + start.month - 1
  const endIndex = end.year * 12 + end.month - 1
  if (endIndex - startIndex !== 11) return []

  return Array.from({ length: 12 }, (_, offset) => {
    const index = startIndex + offset
    return toMonthKey(Math.floor(index / 12), (index % 12) + 1)
  })
}

export const getAnnualCalendarMonthKeys = (year: number): string[] =>
  Number.isInteger(year) && year >= 1000 && year <= 9999
    ? getAnnualCalendarPeriodMonthKeys(`${year}-01`, `${year}-12`)
    : []

export const normalizeAnnualCalendarPeriod = (
  input: AnnualCalendarPeriodInput = {},
  todayKey: string,
): ResolvedAnnualCalendarPeriod | null => {
  if (input.periodMode !== 'customAcademicYear') {
    const year = Number(todayKey.slice(0, 4))
    const monthKeys = getAnnualCalendarMonthKeys(year)
    if (monthKeys.length !== 12) return null
    return {
      endMonthKey: monthKeys[11]!,
      monthKeys,
      periodLabel: `Calendar year ${year}`,
      periodMode: 'currentYear',
      startMonthKey: monthKeys[0]!,
    }
  }

  const startMonthKey = getAnnualCalendarDateMonthKey(input.periodStartDate)
  const endMonthKey = getAnnualCalendarDateMonthKey(input.periodEndDate)
  if (!startMonthKey || !endMonthKey) return null

  const monthKeys = getAnnualCalendarPeriodMonthKeys(startMonthKey, endMonthKey)
  if (monthKeys.length !== 12) return null

  return {
    endMonthKey,
    monthKeys,
    periodLabel: `Academic year ${startMonthKey.slice(0, 4)}–${endMonthKey.slice(0, 4)}`,
    periodMode: 'customAcademicYear',
    startMonthKey,
  }
}

export const validateAnnualCalendarCustomPeriod = (
  input: AnnualCalendarPeriodInput = {},
): true | typeof ANNUAL_CALENDAR_PERIOD_VALIDATION_MESSAGE =>
  input.periodMode !== 'customAcademicYear' ||
  normalizeAnnualCalendarPeriod(input, '2000-01-01') !== null ||
  ANNUAL_CALENDAR_PERIOD_VALIDATION_MESSAGE

const getMonthName = (monthKey: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(
    new Date(`${monthKey}-01T00:00:00.000Z`),
  )

export const materializeAnnualCalendarMonths = (
  monthKeys: readonly string[],
  events: CalendarEvent[],
): AnnualCalendarMonth[] => {
  const eventsByMonth = new Map<string, CalendarEvent[]>()

  for (const event of events) {
    const monthKey = event.startDateKey.slice(0, 7)
    eventsByMonth.set(monthKey, [...(eventsByMonth.get(monthKey) ?? []), event])
  }

  return monthKeys.map((monthKey) => ({
    events: eventsByMonth.get(monthKey) ?? [],
    monthKey,
    monthLabel: getMonthName(monthKey),
  }))
}
