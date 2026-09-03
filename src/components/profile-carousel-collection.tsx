import type { ReactNode } from 'react'

import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import {
  ProfileCarouselCard,
  type ProfileCarouselCardVariant,
  type ProfileCarouselOverlayAlignment,
  type ProfileCarouselProfile,
  type ProfileCarouselSize,
} from '@/components/profile-carousel-card'
import {
  ProfileCarouselClient,
  type ProfileCarouselControlsLayout,
} from '@/components/profile-carousel-client'

export type ProfileCarouselCollectionProps = {
  cardVariant: ProfileCarouselCardVariant
  controlsLayout?: ProfileCarouselControlsLayout
  header?: ReactNode
  overlayAlignment: ProfileCarouselOverlayAlignment
  overlayCoverage: MediaOverlayCoverage
  overlayDirection: MediaOverlayDirection
  overlayStyle: MediaOverlayStrength
  profiles: ProfileCarouselProfile[]
  sectionBackground: BlockBackground
  size: ProfileCarouselSize
  themeMode: MediaOverlayTone
}

export function ProfileCarouselCollection({
  cardVariant,
  controlsLayout = 'floating',
  header,
  overlayAlignment,
  overlayCoverage,
  overlayDirection,
  overlayStyle,
  profiles,
  sectionBackground,
  size,
  themeMode,
}: ProfileCarouselCollectionProps) {
  const visibleProfiles = profiles.slice(0, 12)

  if (!visibleProfiles.length) return null

  if (visibleProfiles.length > 4) {
    return (
      <ProfileCarouselClient
        cardVariant={cardVariant}
        controlsLayout={controlsLayout}
        header={header}
        overlayAlignment={overlayAlignment}
        overlayCoverage={overlayCoverage}
        overlayDirection={overlayDirection}
        overlayStyle={overlayStyle}
        profiles={visibleProfiles}
        sectionBackground={sectionBackground}
        size={size}
        themeMode={themeMode}
      />
    )
  }

  const grid = (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
      {visibleProfiles.map((profile, index) => (
        <ProfileCarouselCard
          key={`${profile.name}-${index}`}
          overlayAlignment={overlayAlignment}
          overlayCoverage={overlayCoverage}
          overlayDirection={overlayDirection}
          overlayStyle={overlayStyle}
          profile={profile}
          sectionBackground={sectionBackground}
          size={size}
          themeMode={themeMode}
          variant={cardVariant}
        />
      ))}
    </div>
  )

  if (!header) return grid

  return (
    <div className="flex min-w-0 flex-col gap-5 md:gap-6">
      <div data-profile-carousel-header="static">{header}</div>
      {grid}
    </div>
  )
}
