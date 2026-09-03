import {
  normalizeMediaOverlayCoverage,
  normalizeMediaOverlayDirection,
  normalizeMediaOverlayStrength,
  normalizeMediaOverlayTone,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import type { ResolvedNewsEventClassification } from '@/lib/newsEventClassifications'

export type FeaturedHighlightImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type FeaturedHighlightImagePositionOverride = 'item' | FeaturedHighlightImagePosition
export type FeaturedHighlightsControlsPosition = 'bottom' | 'top'

export type FeaturedHighlightImage = {
  alt: string
  height?: number
  position: FeaturedHighlightImagePosition
  src: string
  width?: number
}

export type FeaturedHighlightAction = {
  href: string
  label: string
  openInNewTab?: boolean
}

export type FeaturedHighlightItem = {
  action?: FeaturedHighlightAction
  classification?: ResolvedNewsEventClassification
  dateISO?: string
  dateLabel?: string
  description?: string
  id: string
  image?: FeaturedHighlightImage
  title: string
}

export type FeaturedHighlightsOverlayOptions = {
  coverage: MediaOverlayCoverage
  direction: MediaOverlayDirection
  strength: MediaOverlayStrength
  tone: MediaOverlayTone
}

const validImagePositions = new Set<FeaturedHighlightImagePosition>([
  'bottom',
  'center',
  'left',
  'right',
  'top',
])

export const featuredHighlightObjectPositionClasses = {
  bottom: 'object-bottom',
  center: 'object-center',
  left: 'object-left',
  right: 'object-right',
  top: 'object-top',
} as const satisfies Record<FeaturedHighlightImagePosition, string>

export function normalizeFeaturedHighlightsControlsPosition(
  value: unknown,
): FeaturedHighlightsControlsPosition {
  return value === 'top' ? 'top' : 'bottom'
}

export function resolveFeaturedHighlightImagePosition(
  itemPosition: string | null | undefined,
  override: string | null | undefined,
): FeaturedHighlightImagePosition {
  const resolvedItem = validImagePositions.has(itemPosition as FeaturedHighlightImagePosition)
    ? (itemPosition as FeaturedHighlightImagePosition)
    : 'center'

  return override !== 'item' && validImagePositions.has(override as FeaturedHighlightImagePosition)
    ? (override as FeaturedHighlightImagePosition)
    : resolvedItem
}

export function resolveFeaturedHighlightsOverlay({
  coverage,
  direction,
  strength,
  tone,
}: Partial<FeaturedHighlightsOverlayOptions>): FeaturedHighlightsOverlayOptions {
  const resolvedDirection = normalizeMediaOverlayDirection(direction, 'bottomToTop')

  return {
    coverage: normalizeMediaOverlayCoverage(coverage, resolvedDirection),
    direction: resolvedDirection,
    strength: normalizeMediaOverlayStrength(strength, 'darker'),
    tone: normalizeMediaOverlayTone(tone, 'dark'),
  }
}
