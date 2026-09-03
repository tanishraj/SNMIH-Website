import Image from 'next/image'
import { resolveCardSurface, resolveCardSurfaceOverlay } from '@/blocks/shared/cardSurface'
import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import {
  normalizeMediaOverlayTone,
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import { cn } from '@/lib/utils'

export type ProfileCarouselImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type ProfileCarouselCardVariant = 'overlay' | 'stacked'
export type ProfileCarouselOverlayAlignment = 'center' | 'left' | 'right'
export type ProfileCarouselSize = 'none' | 'comfortable' | 'compact' | 'default'

export type ProfileCarouselProfile = {
  cardBackground?: string | null
  department?: string | null
  image: {
    alt: string
    height?: number
    src: string
    width?: number
  }
  imagePosition?: ProfileCarouselImagePosition | null
  name: string
  role?: string | null
}

type ProfileCarouselCardProps = {
  overlayAlignment: ProfileCarouselOverlayAlignment
  overlayCoverage: MediaOverlayCoverage
  overlayDirection: MediaOverlayDirection
  overlayStyle: MediaOverlayStrength
  profile: ProfileCarouselProfile
  sectionBackground: BlockBackground
  size: ProfileCarouselSize
  themeMode: MediaOverlayTone
  variant: ProfileCarouselCardVariant
}

const imageHeightClasses = {
  none: 'h-72 sm:h-80 md:h-96',
  compact: 'h-64 sm:h-72 md:h-80',
  default: 'h-72 sm:h-80 md:h-96',
  comfortable: 'h-80 sm:h-96 md:h-[28rem]',
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const

const overlayAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const

const overlayDirectionClasses = {
  vertical: 'bg-linear-to-b',
  leftToRight: 'bg-linear-to-r',
  rightToLeft: 'bg-linear-to-l',
  bottomToTop: 'bg-linear-to-t',
  topToBottom: 'bg-linear-to-b',
} as const satisfies Record<MediaOverlayDirection, string>

export function ProfileCarouselCard({
  overlayAlignment,
  overlayCoverage,
  overlayDirection,
  overlayStyle,
  profile,
  sectionBackground,
  size,
  themeMode,
  variant,
}: ProfileCarouselCardProps) {
  const imagePosition = profile.imagePosition ?? 'center'
  const surface = resolveCardSurface(profile.cardBackground, sectionBackground)
  const stackedDepartmentSurface = surface.value === 'default' ? sectionBackground : surface.value
  const surfaceOverlay = resolveCardSurfaceOverlay(
    profile.cardBackground,
    sectionBackground,
    overlayStyle,
  )
  const overlay = resolveMediaOverlay({
    coverage: overlayCoverage,
    direction: overlayDirection,
    sectionBackground,
    strength: overlayStyle,
    tone: themeMode,
  })
  const usesCardSurfaceOverlay = normalizeMediaOverlayTone(themeMode) === 'auto'
  const overlayClassName = usesCardSurfaceOverlay
    ? overlay.direction === 'vertical'
      ? surfaceOverlay.evenClassName
      : cn(overlayDirectionClasses[overlay.direction], surfaceOverlay.className)
    : overlay.className
  const overlaySecondaryClassName = usesCardSurfaceOverlay
    ? surface.secondary
    : overlay.text.secondary
  const mediaFrame = (
    <div
      className={cn('relative w-full overflow-hidden rounded-card', imageHeightClasses[size])}
      data-profile-carousel-media-frame="true"
    >
      <Image
        fill
        alt={profile.image.alt}
        className={cn(
          'object-cover select-none motion-safe:transition-transform motion-safe:duration-300 [@media(hover:hover)]:group-hover:scale-[1.02]',
          objectPositionClasses[imagePosition],
        )}
        data-profile-carousel-image-position={imagePosition}
        draggable={false}
        src={profile.image.src}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
      {variant === 'overlay' ? (
        <>
          <div
            className={cn('pointer-events-none absolute', overlay.frameClassName, overlayClassName)}
          />
          <div
            className={cn(
              'absolute inset-0 flex flex-col justify-end gap-0.5 p-5 pt-16',
              usesCardSurfaceOverlay ? surfaceOverlay.textClassName : overlay.text.title,
              overlayAlignmentClasses[overlayAlignment],
            )}
            data-block-surface={usesCardSurfaceOverlay ? undefined : overlay.blockSurface}
          >
            {profile.department ? (
              <p
                className="font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]"
                data-profile-carousel-department="true"
                data-section-eyebrow-surface={overlay.eyebrowSurface}
              >
                {profile.department}
              </p>
            ) : null}
            <p className="text-base leading-tight font-semibold">{profile.name}</p>
            {profile.role ? (
              <p className={cn('text-sm leading-6', overlaySecondaryClassName)}>{profile.role}</p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  )

  if (variant === 'overlay') {
    return (
      <article
        className={cn('group min-w-0 overflow-hidden rounded-card', surface.className)}
        data-card-background={surface.value}
        data-profile-carousel-card-variant="overlay"
        data-profile-carousel-overlay-alignment={overlayAlignment}
        data-profile-carousel-overlay-coverage={overlay.coverage}
        data-profile-carousel-overlay-direction={overlay.direction}
        data-profile-carousel-overlay-strength={
          usesCardSurfaceOverlay ? surfaceOverlay.strength : overlay.strength
        }
        data-profile-carousel-overlay-tone={usesCardSurfaceOverlay ? 'auto' : overlay.tone}
      >
        {mediaFrame}
      </article>
    )
  }

  return (
    <article
      className={cn(
        'group flex min-w-0 flex-col gap-3 overflow-hidden rounded-card',
        surface.className,
      )}
      data-card-background={surface.value}
      data-profile-carousel-card-variant="stacked"
    >
      {mediaFrame}
      <div className="flex flex-col gap-0.5">
        <p className="text-base leading-tight font-semibold text-current">{profile.name}</p>
        {profile.role ? (
          <p className={cn('text-sm leading-6', surface.secondary)}>{profile.role}</p>
        ) : null}
        {profile.department ? (
          <p
            className="font-mono text-xs leading-5 font-semibold uppercase tracking-[0.16em]"
            data-profile-carousel-stacked-department="true"
            data-section-eyebrow-surface={stackedDepartmentSurface}
          >
            {profile.department}
          </p>
        ) : null}
      </div>
    </article>
  )
}
