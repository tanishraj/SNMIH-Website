/**
 * Client-safe celebration rules shared by the collection schema, the server loader, and the
 * browser host. Dates are compared as `YYYY-MM-DD` keys in the site timezone so a celebration
 * starts and ends on the institution's calendar day, whatever the visitor's location.
 */

export const CELEBRATION_STYLES = ['aurora', 'ticket', 'poster', 'glass', 'medallion'] as const
export type CelebrationStyle = (typeof CELEBRATION_STYLES)[number]

export const CELEBRATION_IMAGE_SIZES = ['small', 'medium', 'large'] as const
export type CelebrationImageSize = (typeof CELEBRATION_IMAGE_SIZES)[number]
export const CELEBRATION_IMAGE_WIDTHS: Record<CelebrationImageSize, number> = {
  small: 560,
  medium: 720,
  large: 960,
}

export const CELEBRATION_STYLE_OPTIONS: { label: string; value: CelebrationStyle }[] = [
  { label: 'Aurora Halo (navy card, portrait in a gold ring)', value: 'aurora' },
  { label: 'Holographic Ticket (event ticket with a date stub)', value: 'ticket' },
  { label: 'Floating Poster (your image in a glass frame)', value: 'poster' },
  { label: 'Glass Bloom (light frosted card)', value: 'glass' },
  { label: 'Medallion (circular seal with a highlight number)', value: 'medallion' },
]

export const CELEBRATION_FREQUENCIES = [
  'oncePerDay',
  'everyPageLoad',
  'oncePerVisitor',
  'timesPerDay',
] as const
export type CelebrationFrequency = (typeof CELEBRATION_FREQUENCIES)[number]

export const CELEBRATION_FREQUENCY_OPTIONS: { label: string; value: CelebrationFrequency }[] = [
  { label: 'Once per visitor per day', value: 'oncePerDay' },
  { label: 'Every page load', value: 'everyPageLoad' },
  { label: 'Once per visitor for the whole celebration', value: 'oncePerVisitor' },
  { label: 'A set number of times per visitor per day', value: 'timesPerDay' },
]

export const CONFETTI_SPEEDS = ['verySlow', 'slow', 'medium', 'lively'] as const
export type ConfettiSpeed = (typeof CONFETTI_SPEEDS)[number]

export const CONFETTI_MAX_SHOTS = 8
export const DEFAULT_CONFETTI_SHOTS = 5
/** Pieces fired from each bottom corner per burst. */
export const CONFETTI_MIN_PIECES = 20
export const CONFETTI_MAX_PIECES = 300
export const DEFAULT_CONFETTI_PIECES = 160
export const MAX_TIMES_PER_DAY = 20

const dateKeyPattern = /^\d{4}-\d{2}-\d{2}$/

export const isDateKey = (value: unknown): value is string =>
  typeof value === 'string' && dateKeyPattern.test(value)

/** True when `todayKey` falls within the inclusive start/end window (end defaults to start). */
export const isCelebrationActiveOn = (
  window: { endKey?: string | null; startKey: string },
  todayKey: string,
) => {
  if (!isDateKey(window.startKey) || !isDateKey(todayKey)) return false
  const endKey = isDateKey(window.endKey) ? window.endKey : window.startKey
  return todayKey >= window.startKey && todayKey <= endKey
}

/** What the browser remembers about one celebration for one visitor. */
export type CelebrationViewRecord = {
  /** Day key of the last automatic open. */
  day?: string
  /** Automatic opens on `day`. */
  opensToday?: number
  /** True once the celebration has opened automatically at least once. */
  seen?: boolean
}

export const getCelebrationStorageKey = (id: string) => `celebration:${id}`

export const parseCelebrationViewRecord = (raw: string | null): CelebrationViewRecord => {
  if (!raw) return {}
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return {}
    const record = value as Record<string, unknown>
    return {
      day: isDateKey(record.day) ? record.day : undefined,
      opensToday:
        typeof record.opensToday === 'number' && Number.isFinite(record.opensToday)
          ? Math.max(0, Math.floor(record.opensToday))
          : undefined,
      seen: record.seen === true,
    }
  } catch {
    return {}
  }
}

/** Decides whether the modal should open by itself for this visitor on `todayKey`. */
export const shouldAutoOpenCelebration = ({
  frequency,
  record,
  timesPerDay,
  todayKey,
}: {
  frequency: CelebrationFrequency
  record: CelebrationViewRecord
  timesPerDay?: number | null
  todayKey: string
}) => {
  const opensToday = record.day === todayKey ? (record.opensToday ?? 0) : 0

  switch (frequency) {
    case 'everyPageLoad':
      return true
    case 'oncePerVisitor':
      return !record.seen
    case 'timesPerDay':
      return opensToday < clampTimesPerDay(timesPerDay)
    case 'oncePerDay':
    default:
      return opensToday < 1
  }
}

/** The record to store after an automatic open on `todayKey`. */
export const recordCelebrationOpen = (
  record: CelebrationViewRecord,
  todayKey: string,
): CelebrationViewRecord => ({
  day: todayKey,
  opensToday: (record.day === todayKey ? (record.opensToday ?? 0) : 0) + 1,
  seen: true,
})

export const clampTimesPerDay = (value?: number | null) =>
  Math.min(MAX_TIMES_PER_DAY, Math.max(1, Math.floor(Number(value) || 1)))

export const clampConfettiPieces = (value?: number | null) =>
  Math.min(
    CONFETTI_MAX_PIECES,
    Math.max(CONFETTI_MIN_PIECES, Math.floor(Number(value) || DEFAULT_CONFETTI_PIECES)),
  )

export const clampConfettiShots = (value?: number | null) =>
  Math.min(CONFETTI_MAX_SHOTS, Math.max(1, Math.floor(Number(value) || DEFAULT_CONFETTI_SHOTS)))
