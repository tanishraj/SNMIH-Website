import { resolveCmsActions, type CmsActionValue, type ResolvedCmsAction } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { formatZonedDate, getZonedDateKey, type SiteTimeZone } from '@/lib/siteTimeZone'
import type { Celebration } from '@/payload-types'

import {
  CELEBRATION_FREQUENCIES,
  CELEBRATION_IMAGE_SIZES,
  CELEBRATION_STYLES,
  CONFETTI_SPEEDS,
  clampConfettiPieces,
  clampConfettiShots,
  clampTimesPerDay,
  type CelebrationFrequency,
  type CelebrationImageSize,
  type CelebrationStyle,
  type ConfettiSpeed,
} from './shared'

/** Everything the browser needs to show one celebration; plain, serializable data only. */
export type CelebrationView = {
  accentHeading?: string
  action?: ResolvedCmsAction
  badgeLabel: string
  confetti: { enabled: boolean; pieces: number; shots: number; speed: ConfettiSpeed }
  dateLabel: { day: string; month: string; year: string }
  endKey: string
  eyebrow?: string
  frequency: CelebrationFrequency
  heading?: string
  highlight?: string
  id: string
  image?: { alt: string; height?: number; src: string; width?: number }
  imageOnly: boolean
  imageSize?: CelebrationImageSize
  message?: string
  openDelayMs: number
  showReopenBadge: boolean
  signature?: string
  signatureRole?: string
  startKey: string
  style: CelebrationStyle
  timesPerDay: number
}

const text = (value?: string | null) => value?.trim() || undefined

const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

/** Maps a celebration document to its browser view, or null when it cannot be shown. */
export const toCelebrationView = (
  doc: Celebration | string | number | null | undefined,
  timeZone: SiteTimeZone,
): CelebrationView | null => {
  if (!doc || typeof doc !== 'object' || doc.enabled === false || !doc.startDate) return null

  const startKey = getZonedDateKey(doc.startDate, timeZone)
  const endKey = doc.endDate ? getZonedDateKey(doc.endDate, timeZone) : startKey
  if (!startKey || !endKey) return null

  const image = getMediaImageProps({ media: doc.image, fallbackAlt: text(doc.heading) })
  const imageOnly = Boolean(doc.imageOnly && image)
  const heading = text(doc.heading)
  if (!imageOnly && !heading) return null

  return {
    accentHeading: text(doc.accentHeading),
    action: resolveCmsActions(doc.actions as CmsActionValue[] | null | undefined)[0],
    badgeLabel: text(doc.badgeLabel) ?? 'Celebrating today',
    confetti: {
      enabled: doc.confettiEnabled !== false,
      pieces: clampConfettiPieces(doc.confettiPieces),
      shots: clampConfettiShots(doc.confettiShots),
      speed: pick(doc.confettiSpeed, CONFETTI_SPEEDS, 'medium'),
    },
    dateLabel: {
      day: formatZonedDate(doc.startDate, timeZone, {
        day: 'numeric',
        month: undefined,
        year: undefined,
      }),
      month: formatZonedDate(doc.startDate, timeZone, {
        day: undefined,
        month: 'long',
        year: undefined,
      }),
      year: formatZonedDate(doc.startDate, timeZone, {
        day: undefined,
        month: undefined,
        year: 'numeric',
      }),
    },
    endKey,
    eyebrow: text(doc.eyebrow),
    frequency: pick(doc.frequency, CELEBRATION_FREQUENCIES, 'oncePerDay'),
    heading,
    highlight: text(doc.highlight),
    id: String(doc.id),
    image,
    imageOnly,
    imageSize: pick(doc.imageSize, CELEBRATION_IMAGE_SIZES, 'medium'),
    message: text(doc.message),
    openDelayMs: Math.min(30, Math.max(0, Number(doc.openDelay ?? 1) || 0)) * 1000,
    showReopenBadge: doc.showReopenBadge !== false,
    signature: text(doc.signature),
    signatureRole: text(doc.signatureRole),
    startKey,
    style: pick(doc.style, CELEBRATION_STYLES, 'aurora'),
    timesPerDay: clampTimesPerDay(doc.timesPerDay),
  }
}
