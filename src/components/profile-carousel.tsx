import type { ReactNode } from 'react'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import {
  type ProfileCarouselCardVariant,
  type ProfileCarouselImagePosition,
  type ProfileCarouselOverlayAlignment,
  type ProfileCarouselProfile,
  type ProfileCarouselSize,
} from '@/components/profile-carousel-card'
import { ProfileCarouselCollection } from '@/components/profile-carousel-collection'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { cn } from '@/lib/utils'

export type ProfileCarouselAlignment = 'center' | 'left' | 'right'
export type {
  ProfileCarouselCardVariant,
  ProfileCarouselImagePosition,
  ProfileCarouselOverlayAlignment,
  ProfileCarouselProfile,
  ProfileCarouselSize,
}

type ProfileCarouselProps = {
  accentTitle?: string | null
  actions?: ReactNode
  alignment?: ProfileCarouselAlignment
  appearance?: BlockAppearance | null
  cardVariant?: ProfileCarouselCardVariant
  className?: string
  description?: string | null
  eyebrow?: string | null
  overlayAlignment?: ProfileCarouselOverlayAlignment
  overlayCoverage?: MediaOverlayCoverage
  overlayDirection?: MediaOverlayDirection
  overlayStyle?: MediaOverlayStrength
  profiles: ProfileCarouselProfile[]
  size?: ProfileCarouselSize
  themeMode?: MediaOverlayTone
  title?: string | null
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const profileMarginClasses = {
  none: 'mt-10',
  compact: 'mt-8',
  default: 'mt-10',
  comfortable: 'mt-12',
} as const

export function ProfileCarousel({
  accentTitle,
  actions,
  alignment = 'left',
  appearance,
  cardVariant = 'stacked',
  className,
  description,
  eyebrow,
  overlayAlignment = 'left',
  overlayCoverage = 'full',
  overlayDirection = 'bottomToTop',
  overlayStyle = 'dark',
  profiles,
  size = 'default',
  themeMode = 'auto',
  title,
}: ProfileCarouselProps) {
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedAlignment = alignment ?? 'left'
  const resolvedSize = size ?? 'default'
  const visibleProfiles = profiles.slice(0, 12)
  const usesCarousel = visibleProfiles.length > 4
  const sectionBackground: BlockBackground = appearance?.background ?? 'none'

  if (!visibleProfiles.length) {
    return null
  }

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[resolvedSize],
        appearanceClasses.className,
        className,
      )}
      data-profile-carousel="true"
      data-profile-carousel-alignment={resolvedAlignment}
      data-profile-carousel-background={appearance?.background ?? 'none'}
      data-profile-carousel-card-variant={cardVariant}
      data-profile-carousel-mode={usesCarousel ? 'carousel' : 'static'}
      data-profile-carousel-size={resolvedSize}
    >
      <div className={regularBlockContainerClasses}>
        <div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[resolvedAlignment])}>
          {eyebrow ? <SectionEyebrow surface={sectionBackground}>{eyebrow}</SectionEyebrow> : null}
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
            {resolvedAccentTitle ? (
              <>
                <span className="block font-[inherit]">{title}</span>
                <em className="block font-[inherit]">{resolvedAccentTitle}</em>
              </>
            ) : (
              title
            )}
          </h2>
          {description ? (
            <p className="text-base leading-7 text-balance text-current/70">{description}</p>
          ) : null}
          {actions}
        </div>

        <div className={profileMarginClasses[resolvedSize]}>
          <ProfileCarouselCollection
            cardVariant={cardVariant}
            overlayAlignment={overlayAlignment}
            overlayCoverage={overlayCoverage}
            overlayDirection={overlayDirection}
            overlayStyle={overlayStyle}
            profiles={visibleProfiles}
            sectionBackground={sectionBackground}
            size={resolvedSize}
            themeMode={themeMode}
          />
        </div>
      </div>
    </section>
  )
}
