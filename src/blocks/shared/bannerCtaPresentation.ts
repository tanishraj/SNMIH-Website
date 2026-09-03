import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from './mediaOverlayPresentation'

export type BannerActionPlacement = 'below' | 'side'
export type BannerContentAlignment = 'center' | 'left' | 'right'
export type BannerContentWidth = 'default' | 'narrow' | 'wide'
export type BannerHeight = 'compact' | 'default' | 'immersive'
export type BannerOverlayCoverage = MediaOverlayCoverage
export type BannerOverlayDirection = MediaOverlayDirection
export type BannerOverlayStyle = MediaOverlayStrength
export type BannerThemeMode = MediaOverlayTone

export const bannerAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

export const bannerActionAlignmentClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

export const bannerContentWidthClasses = {
  narrow: 'max-w-xl',
  default: 'max-w-2xl',
  wide: 'max-w-4xl',
} as const

export const bannerTitleSizeClasses = {
  compact: 'text-3xl sm:text-4xl md:text-5xl',
  default: 'text-4xl sm:text-5xl md:text-6xl',
  immersive: 'text-4xl sm:text-6xl md:text-7xl',
} as const

export const bannerHeightClasses = {
  compact: 'min-h-[32dvh]',
  default: 'min-h-[46dvh]',
  immersive: 'min-h-[68dvh]',
} as const

export function resolveBannerActionPlacement(
  value: BannerActionPlacement | 'inline' | null | undefined,
): BannerActionPlacement {
  return value === 'inline' ? 'below' : (value ?? 'side')
}
