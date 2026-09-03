import {
  normalizeBlockBackground,
  resolveBlockSurface,
  type BlockBackground,
} from './blockAppearance'

export type MediaOverlayDirection =
  'bottomToTop' | 'leftToRight' | 'rightToLeft' | 'topToBottom' | 'vertical'

export type MediaOverlayCoverage = 'full' | 'split'
export type MediaOverlayStrength = 'dark' | 'darker' | 'light'
export type MediaOverlayTone = 'auto' | 'brand' | 'dark' | 'light'
export type ResolvedMediaOverlayTone = Exclude<MediaOverlayTone, 'auto'>
export type MediaOverlaySurface = 'brand' | 'darkOverlay' | 'lightOverlay'

const validDirections = new Set<MediaOverlayDirection>([
  'vertical',
  'leftToRight',
  'rightToLeft',
  'bottomToTop',
  'topToBottom',
])
const validCoverages = new Set<MediaOverlayCoverage>(['full', 'split'])
const validStrengths = new Set<MediaOverlayStrength>(['light', 'dark', 'darker'])
const validTones = new Set<MediaOverlayTone>(['auto', 'light', 'dark', 'brand'])

const directionClasses = {
  leftToRight: 'bg-linear-to-r',
  rightToLeft: 'bg-linear-to-l',
  bottomToTop: 'bg-linear-to-t',
  topToBottom: 'bg-linear-to-b',
} as const satisfies Record<Exclude<MediaOverlayDirection, 'vertical'>, string>

const evenStopClasses = {
  light: {
    light: 'bg-white/80',
    dark: 'bg-white/88',
    darker: 'bg-white/94',
  },
  dark: {
    light: 'bg-black/64',
    dark: 'bg-black/74',
    darker: 'bg-black/86',
  },
  brand: {
    light: 'bg-primary/78',
    dark: 'bg-primary/86',
    darker: 'bg-primary/94',
  },
} as const satisfies Record<ResolvedMediaOverlayTone, Record<MediaOverlayStrength, string>>

const fullDirectionalStopClasses = {
  light: {
    light: 'from-white/84 via-white/62 to-transparent',
    dark: 'from-white/92 via-white/72 to-transparent',
    darker: 'from-white/98 via-white/82 to-transparent',
  },
  dark: {
    light: 'from-black/76 via-black/54 to-transparent',
    dark: 'from-black/86 via-black/64 to-transparent',
    darker: 'from-black/94 via-black/74 to-transparent',
  },
  brand: {
    light: 'from-primary/84 via-primary/60 to-transparent',
    dark: 'from-primary/92 via-primary/70 to-transparent',
    darker: 'from-primary/98 via-primary/80 to-transparent',
  },
} as const satisfies Record<ResolvedMediaOverlayTone, Record<MediaOverlayStrength, string>>

const splitDirectionalStopClasses = {
  light: {
    light: 'from-white/88 via-white/68 to-transparent',
    dark: 'from-white/94 via-white/76 to-transparent',
    darker: 'from-white via-white/84 to-transparent',
  },
  dark: {
    light: 'from-black/78 via-black/56 to-transparent',
    dark: 'from-black/88 via-black/66 to-transparent',
    darker: 'from-black/96 via-black/76 to-transparent',
  },
  brand: {
    light: 'from-primary/88 via-primary/62 to-transparent',
    dark: 'from-primary/94 via-primary/72 to-transparent',
    darker: 'from-primary via-primary/82 to-transparent',
  },
} as const satisfies Record<ResolvedMediaOverlayTone, Record<MediaOverlayStrength, string>>

const splitFrameClasses = {
  leftToRight: 'inset-y-0 left-0 w-1/2',
  rightToLeft: 'inset-y-0 right-0 w-1/2',
  bottomToTop: 'inset-x-0 bottom-0 h-1/2',
  topToBottom: 'inset-x-0 top-0 h-1/2',
} as const satisfies Record<Exclude<MediaOverlayDirection, 'vertical'>, string>

export const mediaOverlayTextClasses = {
  light: {
    title: 'text-light-overlay-foreground',
    secondary: 'text-light-overlay-foreground',
    eyebrow: 'text-light-overlay-foreground',
    link: 'text-light-overlay-foreground',
  },
  dark: {
    title: 'text-white',
    secondary: 'text-white/90',
    eyebrow: 'text-white/82',
    link: 'text-white',
  },
  brand: {
    title: 'text-primary-foreground',
    secondary: 'text-primary-foreground',
    eyebrow: 'text-primary-foreground',
    link: 'text-primary-foreground',
  },
} as const satisfies Record<
  ResolvedMediaOverlayTone,
  { eyebrow: string; link: string; secondary: string; title: string }
>

export function normalizeMediaOverlayDirection(
  value: string | null | undefined,
  fallback: MediaOverlayDirection = 'vertical',
): MediaOverlayDirection {
  return validDirections.has(value as MediaOverlayDirection)
    ? (value as MediaOverlayDirection)
    : fallback
}

export function normalizeMediaOverlayCoverage(
  value: string | null | undefined,
  direction: MediaOverlayDirection = 'vertical',
): MediaOverlayCoverage {
  if (direction === 'vertical') return 'full'
  return validCoverages.has(value as MediaOverlayCoverage)
    ? (value as MediaOverlayCoverage)
    : 'full'
}

export function normalizeMediaOverlayStrength(
  value: string | null | undefined,
  fallback: MediaOverlayStrength = 'dark',
): MediaOverlayStrength {
  const legacyStrengths: Record<string, MediaOverlayStrength> = {
    soft: 'light',
    default: 'dark',
    strong: 'darker',
  }

  if (value && Object.hasOwn(legacyStrengths, value)) return legacyStrengths[value]
  return validStrengths.has(value as MediaOverlayStrength)
    ? (value as MediaOverlayStrength)
    : fallback
}

export function normalizeMediaOverlayTone(
  value: string | null | undefined,
  fallback: MediaOverlayTone = 'auto',
): MediaOverlayTone {
  return validTones.has(value as MediaOverlayTone) ? (value as MediaOverlayTone) : fallback
}

export function resolveMediaOverlayTone(
  tone: string | null | undefined,
  sectionBackground: BlockBackground | string = 'none',
  autoTone?: ResolvedMediaOverlayTone,
): ResolvedMediaOverlayTone {
  const normalizedTone = normalizeMediaOverlayTone(tone)
  if (normalizedTone !== 'auto') return normalizedTone
  if (autoTone) return autoTone

  return resolveBlockSurface(normalizeBlockBackground(sectionBackground)) === 'brand'
    ? 'brand'
    : 'dark'
}

type ResolveMediaOverlayOptions = {
  autoTone?: ResolvedMediaOverlayTone
  coverage?: string | null
  direction?: string | null
  sectionBackground?: BlockBackground | string | null
  strength?: string | null
  tone?: string | null
}

export function resolveMediaOverlay({
  autoTone,
  coverage,
  direction,
  sectionBackground = 'none',
  strength,
  tone,
}: ResolveMediaOverlayOptions = {}) {
  const resolvedDirection = normalizeMediaOverlayDirection(direction)
  const resolvedCoverage = normalizeMediaOverlayCoverage(coverage, resolvedDirection)
  const resolvedStrength = normalizeMediaOverlayStrength(strength)
  const resolvedTone = resolveMediaOverlayTone(tone, sectionBackground ?? 'none', autoTone)
  const className =
    resolvedDirection === 'vertical'
      ? evenStopClasses[resolvedTone][resolvedStrength]
      : `${directionClasses[resolvedDirection]} ${
          resolvedCoverage === 'split'
            ? splitDirectionalStopClasses[resolvedTone][resolvedStrength]
            : fullDirectionalStopClasses[resolvedTone][resolvedStrength]
        }`

  return {
    blockSurface: (resolvedTone === 'brand'
      ? 'brand'
      : resolvedTone === 'dark'
        ? 'darkOverlay'
        : 'lightOverlay') as MediaOverlaySurface,
    className,
    coverage: resolvedCoverage,
    direction: resolvedDirection,
    eyebrowSurface:
      resolvedTone === 'brand'
        ? ('brand' as const)
        : resolvedTone === 'dark'
          ? ('darkOverlay' as const)
          : ('lightOverlay' as const),
    frameClassName:
      resolvedCoverage === 'split' && resolvedDirection !== 'vertical'
        ? splitFrameClasses[resolvedDirection]
        : 'inset-0',
    strength: resolvedStrength,
    text: mediaOverlayTextClasses[resolvedTone],
    tone: resolvedTone,
  }
}
