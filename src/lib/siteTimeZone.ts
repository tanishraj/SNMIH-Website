export const DEFAULT_SITE_TIME_ZONE = 'Asia/Kolkata' as const

export const SUPPORTED_SITE_TIME_ZONES = [
  'Asia/Kolkata',
  'UTC',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Australia/Sydney',
] as const

export type SiteTimeZone = (typeof SUPPORTED_SITE_TIME_ZONES)[number]

const supportedTimeZones = new Set<string>(SUPPORTED_SITE_TIME_ZONES)

export const normalizeSiteTimeZone = (value: unknown): SiteTimeZone =>
  typeof value === 'string' && supportedTimeZones.has(value)
    ? (value as SiteTimeZone)
    : DEFAULT_SITE_TIME_ZONE

type DateParts = {
  day: number
  hour: number
  minute: number
  month: number
  second: number
  year: number
}

const getPartsFormatter = (timeZone: SiteTimeZone) =>
  new Intl.DateTimeFormat('en-CA', {
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  })

const getZonedParts = (value: Date, timeZone: SiteTimeZone): DateParts => {
  const parts = Object.fromEntries(
    getPartsFormatter(timeZone)
      .formatToParts(value)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value: partValue }) => [type, Number(partValue)]),
  )

  return {
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    month: parts.month,
    second: parts.second,
    year: parts.year,
  }
}

const pad = (value: number): string => String(value).padStart(2, '0')
const toDate = (value: Date | string | number): Date =>
  value instanceof Date ? new Date(value.getTime()) : new Date(value)
const isValidDate = (value: Date): boolean => !Number.isNaN(value.getTime())

const localDateTimeToUTC = (parts: DateParts, timeZone: SiteTimeZone): Date => {
  const target = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  let guess = target

  for (let index = 0; index < 4; index += 1) {
    const observed = getZonedParts(new Date(guess), timeZone)
    const observedAsUTC = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    )
    const correction = target - observedAsUTC
    guess += correction
    if (correction === 0) break
  }

  return new Date(guess)
}

export const getZonedDateKey = (
  value: Date | string | number,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): string => {
  const date = toDate(value)
  if (!isValidDate(date)) return ''
  const parts = getZonedParts(date, timeZone)
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`
}

export const getZonedMonthKey = (
  value: Date | string | number,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): string => getZonedDateKey(value, timeZone).slice(0, 7)

export const getZonedToday = (
  now: Date | string | number = new Date(),
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): string => getZonedDateKey(now, timeZone)

export const parseZonedMonthKey = (monthKey: string): { month: number; year: number } | null => {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthKey)
  return match ? { month: Number(match[2]), year: Number(match[1]) } : null
}

const parseDateKey = (dateKey: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  if (!match) return null
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
  return getZonedDateKey(date, 'UTC') === dateKey ? date : null
}

export type ZonedMonthBounds = { endISO: string; startISO: string }

export const getZonedDayBounds = (
  dateKey: string,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): ZonedMonthBounds => {
  const date = parseDateKey(dateKey)
  if (!date) throw new Error(`Invalid date key: ${dateKey}`)
  const start = localDateTimeToUTC(
    {
      day: date.getUTCDate(),
      hour: 0,
      minute: 0,
      month: date.getUTCMonth() + 1,
      second: 0,
      year: date.getUTCFullYear(),
    },
    timeZone,
  )
  const next = new Date(date.getTime() + 86_400_000)
  const end = localDateTimeToUTC(
    {
      day: next.getUTCDate(),
      hour: 0,
      minute: 0,
      month: next.getUTCMonth() + 1,
      second: 0,
      year: next.getUTCFullYear(),
    },
    timeZone,
  )
  return { endISO: new Date(end.getTime() - 1).toISOString(), startISO: start.toISOString() }
}

export const getZonedMonthBounds = (
  monthKey: string,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): ZonedMonthBounds => {
  const parsed = parseZonedMonthKey(monthKey)
  if (!parsed) throw new Error(`Invalid month key: ${monthKey}`)
  const start = localDateTimeToUTC(
    { day: 1, hour: 0, minute: 0, month: parsed.month, second: 0, year: parsed.year },
    timeZone,
  )
  const nextMonth = new Date(Date.UTC(parsed.year, parsed.month, 1))
  const end = localDateTimeToUTC(
    {
      day: 1,
      hour: 0,
      minute: 0,
      month: nextMonth.getUTCMonth() + 1,
      second: 0,
      year: nextMonth.getUTCFullYear(),
    },
    timeZone,
  )

  return { endISO: new Date(end.getTime() - 1).toISOString(), startISO: start.toISOString() }
}

export const getZonedYearBounds = (
  year: number,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): ZonedMonthBounds => {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new Error(`Invalid year: ${year}`)
  }

  const january = getZonedMonthBounds(`${year}-01`, timeZone)
  const december = getZonedMonthBounds(`${year}-12`, timeZone)

  return { endISO: december.endISO, startISO: january.startISO }
}

export const expandInclusiveDateKeys = (startKey: string, endKey: string): string[] => {
  const start = parseDateKey(startKey)
  const end = parseDateKey(endKey)
  if (!start || !end || end < start) return []

  const result: string[] = []
  for (let cursor = start; cursor <= end; cursor = new Date(cursor.getTime() + 86_400_000)) {
    result.push(getZonedDateKey(cursor, 'UTC'))
  }
  return result
}

export const formatZonedDate = (
  value: Date | string | number,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
  options: Intl.DateTimeFormatOptions = {},
): string => {
  const date = toDate(value)
  if (!isValidDate(date)) return ''
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    timeZone,
    year: 'numeric',
    ...options,
  }).format(date)
}

export const formatZonedTime = (
  value: Date | string | number,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
): string => {
  const date = toDate(value)
  if (!isValidDate(date)) return ''
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(date)
}

export const formatZonedDateRange = (
  startValue: Date | string | number,
  endValue: Date | string | number | null | undefined,
  timeZone: SiteTimeZone = DEFAULT_SITE_TIME_ZONE,
  allDay = false,
): string => {
  const start = toDate(startValue)
  const end = endValue == null ? null : toDate(endValue)
  if (!isValidDate(start)) return ''
  const startKey = getZonedDateKey(start, timeZone)
  const endKey = end && isValidDate(end) ? getZonedDateKey(end, timeZone) : startKey
  const startDate = formatZonedDate(start, timeZone)
  const endDate = end && isValidDate(end) ? formatZonedDate(end, timeZone) : startDate
  if (allDay) return startKey === endKey ? startDate : `${startDate} – ${endDate}`
  const startTime = formatZonedTime(start, timeZone)
  if (!end || !isValidDate(end)) return `${startDate}, ${startTime}`
  const endTime = formatZonedTime(end, timeZone)
  return startKey === endKey
    ? `${startDate}, ${startTime}–${endTime}`
    : `${startDate}, ${startTime} – ${endDate}, ${endTime}`
}
