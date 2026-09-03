import { cn } from '@/lib/utils'

/**
 * Section background surfaces.
 *
 * Deliberately minimal: every section is either the page background, a light
 * tint, or the brand (navy) surface — each with an optional gradient variant.
 * `subtle` and `gradient-subtle` are light in light mode and dark-tinted in dark
 * mode; `brand` and `gradient-brand` follow --primary, which inverts in dark mode.
 */
export type BlockBackground = 'none' | 'subtle' | 'brand' | 'gradient-subtle' | 'gradient-brand'

/** Whether a surface reads as light (foreground text) or brand (primary-foreground text). */
export type BlockSurface = 'brand' | 'light'

export type BlockAppearance = {
  background?: BlockBackground | null
  border?: 'none' | 'top' | 'bottom' | 'topAndBottom' | null
}

/**
 * Backgrounds retired in the palette collapse. Stored content still holds these
 * values, so they are folded into the nearest surviving surface at render time
 * rather than requiring a data migration.
 */
const legacyBackgrounds: Record<string, BlockBackground> = {
  primary: 'brand',
  secondary: 'subtle',
  muted: 'subtle',
  accent: 'subtle',
  'gradient-secondary': 'gradient-subtle',
  'gradient-muted': 'gradient-subtle',
  'gradient-accent': 'gradient-subtle',
  'gradient-success': 'gradient-subtle',
  'gradient-error': 'gradient-subtle',
  'gradient-info': 'gradient-subtle',
  'gradient-warning': 'gradient-subtle',
  'gradient-primary': 'gradient-brand',
}

const backgroundClasses = {
  none: '',
  subtle: 'bg-subtle',
  brand: 'bg-brand',
  'gradient-subtle': 'bg-gradient-subtle',
  'gradient-brand': 'bg-gradient-brand',
} as const satisfies Record<BlockBackground, string>

const surfaceForegroundClasses = {
  none: '',
  subtle: 'text-foreground',
  brand: 'text-primary-foreground',
  'gradient-subtle': 'text-foreground',
  'gradient-brand': 'text-primary-foreground',
} as const satisfies Record<BlockBackground, string>

const backgroundSurfaces = {
  none: 'light',
  subtle: 'light',
  brand: 'brand',
  'gradient-subtle': 'light',
  'gradient-brand': 'brand',
} as const satisfies Record<BlockBackground, BlockSurface>

const borderClasses = {
  none: '',
  top: 'border-t border-border',
  bottom: 'border-b border-border',
  topAndBottom: 'border-y border-border',
} as const

/** Maps any stored background value — current or retired — onto a supported surface. */
export function normalizeBlockBackground(value?: string | null): BlockBackground {
  if (!value) return 'none'
  if (value in backgroundClasses) return value as BlockBackground
  return legacyBackgrounds[value] ?? 'none'
}

/** Whether a section reads as a light surface or the brand surface. */
export function resolveBlockSurface(value?: string | null): BlockSurface {
  return backgroundSurfaces[normalizeBlockBackground(value)]
}

export function resolveBlockAppearanceClasses(appearance?: BlockAppearance | null) {
  const background = normalizeBlockBackground(appearance?.background)
  const border = appearance?.border ?? 'none'

  const backgroundClassName = backgroundClasses[background]
  const textClassName = surfaceForegroundClasses[background]
  const borderClassName = borderClasses[border]

  return {
    background,
    backgroundClassName,
    borderClassName,
    className: cn(backgroundClassName, textClassName, borderClassName),
    surface: backgroundSurfaces[background],
    textClassName,
  }
}
