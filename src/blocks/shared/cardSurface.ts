import type { CmsActionVariant } from '@/lib/cmsLinks'

import {
  normalizeBlockBackground,
  resolveBlockSurface,
  type BlockBackground,
} from './blockAppearance'
import { cardSurfaceValues, type CardSurfaceValue } from './cardThemeFields'
import {
  normalizeMediaOverlayStrength,
  type MediaOverlayStrength,
} from './mediaOverlayPresentation'

export type CardSurfaceClasses = {
  button: Partial<Record<CmsActionVariant, string>>
  className: string
  divider: string
  icon: string
  link: string
  overlay: string
  secondary: string
  value: CardSurfaceValue
}

const explicitCardSurfaceClasses: Record<
  Exclude<CardSurfaceValue, 'default'>,
  CardSurfaceClasses
> = {
  primary: {
    value: 'primary',
    className: 'bg-primary text-primary-foreground',
    secondary: 'text-primary-foreground',
    icon: 'text-primary-foreground',
    divider: 'border-primary-foreground/15',
    link: 'text-primary-foreground hover:text-primary-foreground/80',
    overlay: 'from-primary via-primary/75 to-transparent text-primary-foreground',
    button: {
      default:
        'bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/30',
    },
  },
  secondary: {
    value: 'secondary',
    className: 'bg-secondary text-secondary-foreground',
    secondary: 'text-secondary-foreground',
    icon: 'text-secondary-foreground',
    divider: 'border-secondary-foreground/15',
    link: 'text-secondary-foreground hover:text-secondary-foreground/80',
    overlay: 'from-secondary via-secondary/75 to-transparent text-secondary-foreground',
    button: {
      secondary:
        'bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90 focus-visible:border-secondary-foreground focus-visible:ring-secondary-foreground/30',
    },
  },
  muted: {
    value: 'muted',
    className: 'bg-muted text-foreground',
    secondary: 'text-muted-foreground',
    icon: 'text-primary',
    divider: 'border-border',
    link: 'text-primary hover:text-primary/80',
    overlay: 'from-muted via-muted/75 to-transparent text-foreground',
    button: {},
  },
  accent: {
    value: 'accent',
    className: 'bg-accent text-accent-foreground',
    secondary: 'text-accent-foreground',
    icon: 'text-primary',
    divider: 'border-accent-foreground/15',
    link: 'text-primary hover:text-primary/80',
    overlay: 'from-accent via-accent/75 to-transparent text-accent-foreground',
    button: {},
  },
}

const defaultDividerClasses: Record<BlockBackground, string> = {
  none: 'border-current/10',
  subtle: 'border-current/10',
  brand: 'border-current/15',
  'gradient-subtle': 'border-current/10',
  'gradient-brand': 'border-current/15',
}

const alternateOverlayStrengthClasses = {
  light: {
    default: 'from-black/56 via-black/32 to-black/5 text-white',
    primary: 'from-primary/72 via-primary/48 to-primary/5 text-primary-foreground',
    secondary: 'from-secondary/72 via-secondary/48 to-secondary/5 text-secondary-foreground',
    muted: 'from-muted/72 via-muted/48 to-muted/5 text-foreground',
    accent: 'from-accent/72 via-accent/48 to-accent/5 text-accent-foreground',
  },
  darker: {
    default: 'from-black/92 via-black/68 to-black/16 text-white',
    primary: 'from-primary via-primary/90 to-primary/20 text-primary-foreground',
    secondary: 'from-secondary via-secondary/90 to-secondary/20 text-secondary-foreground',
    muted: 'from-muted via-muted/90 to-muted/20 text-foreground',
    accent: 'from-accent via-accent/90 to-accent/20 text-accent-foreground',
  },
} as const satisfies Record<Exclude<MediaOverlayStrength, 'dark'>, Record<CardSurfaceValue, string>>

const evenOverlayStrengthClasses = {
  light: {
    default: 'bg-black/64 text-white',
    primary: 'bg-primary/78 text-primary-foreground',
    secondary: 'bg-secondary/78 text-secondary-foreground',
    muted: 'bg-muted/78 text-foreground',
    accent: 'bg-accent/78 text-accent-foreground',
  },
  dark: {
    default: 'bg-black/74 text-white',
    primary: 'bg-primary/86 text-primary-foreground',
    secondary: 'bg-secondary/86 text-secondary-foreground',
    muted: 'bg-muted/86 text-foreground',
    accent: 'bg-accent/86 text-accent-foreground',
  },
  darker: {
    default: 'bg-black/86 text-white',
    primary: 'bg-primary/94 text-primary-foreground',
    secondary: 'bg-secondary/94 text-secondary-foreground',
    muted: 'bg-muted/94 text-foreground',
    accent: 'bg-accent/94 text-accent-foreground',
  },
} as const satisfies Record<MediaOverlayStrength, Record<CardSurfaceValue, string>>

const overlayTextClasses = {
  default: 'text-white',
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  muted: 'text-foreground',
  accent: 'text-accent-foreground',
} as const satisfies Record<CardSurfaceValue, string>

const resolveDefaultCardSurface = (
  rawSectionBackground: BlockBackground | string = 'none',
): CardSurfaceClasses => {
  const sectionBackground = normalizeBlockBackground(rawSectionBackground)
  // Light surfaces can carry primary-colored icons and links; brand surfaces
  // must inherit the surface foreground instead.
  const usesPrimaryAccent = resolveBlockSurface(sectionBackground) === 'light'

  return {
    value: 'default',
    className: 'bg-transparent text-current',
    secondary: 'text-current',
    icon: usesPrimaryAccent ? 'text-primary' : 'text-current',
    divider: defaultDividerClasses[sectionBackground],
    link: usesPrimaryAccent
      ? 'text-primary hover:text-primary/80'
      : 'text-current hover:text-current/80',
    overlay: 'from-black/80 via-black/50 to-transparent text-white',
    // On the brand surface a filled primary button would vanish into the
    // background, so invert it to the surface foreground.
    button: usesPrimaryAccent
      ? {}
      : {
          default:
            'bg-primary-foreground text-primary hover:bg-primary-foreground/90 focus-visible:border-primary-foreground focus-visible:ring-primary-foreground/30',
        },
  }
}

export const resolveCardSurface = (
  value?: string | null,
  sectionBackground: BlockBackground | string = 'none',
): CardSurfaceClasses => {
  const resolvedValue = cardSurfaceValues.includes(value as CardSurfaceValue)
    ? (value as CardSurfaceValue)
    : 'default'

  return resolvedValue === 'default'
    ? resolveDefaultCardSurface(sectionBackground)
    : explicitCardSurfaceClasses[resolvedValue]
}

export const resolveCardSurfaceOverlay = (
  value?: string | null,
  sectionBackground: BlockBackground | string = 'none',
  strength?: string | null,
) => {
  const surface = resolveCardSurface(value, sectionBackground)
  const resolvedStrength = normalizeMediaOverlayStrength(strength)

  return {
    className:
      resolvedStrength === 'dark'
        ? surface.overlay
        : alternateOverlayStrengthClasses[resolvedStrength][surface.value],
    evenClassName: evenOverlayStrengthClasses[resolvedStrength][surface.value],
    strength: resolvedStrength,
    textClassName: overlayTextClasses[surface.value],
  }
}
