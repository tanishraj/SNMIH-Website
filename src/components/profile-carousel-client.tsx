'use client'

import type { ReactNode } from 'react'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  ProfileCarouselCard,
  type ProfileCarouselCardVariant,
  type ProfileCarouselOverlayAlignment,
  type ProfileCarouselProfile,
  type ProfileCarouselSize,
} from '@/components/profile-carousel-card'
import type { BlockBackground } from '@/blocks/shared/blockAppearance'
import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import { cn } from '@/lib/utils'

export type ProfileCarouselControlsLayout = 'floating' | 'inline'

type ProfileCarouselClientProps = {
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

function ProfileCarouselControls({ className }: { className: string }) {
  return (
    <div className={className}>
      <CarouselPrevious
        aria-label="Previous profile"
        className="static inset-auto translate-y-0"
        variant="default"
      />
      <CarouselNext
        aria-label="Next profile"
        className="static inset-auto translate-y-0"
        variant="default"
      />
    </div>
  )
}

export function ProfileCarouselClient({
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
}: ProfileCarouselClientProps) {
  return (
    <Carousel
      className={cn('relative w-full', controlsLayout === 'floating' && 'pt-14')}
      data-carousel-loop="true"
      opts={{ align: 'start', loop: true }}
    >
      {controlsLayout === 'inline' ? (
        <div
          className="mb-5 flex min-h-11 min-w-0 items-center gap-4 md:mb-6"
          data-profile-carousel-header="inline"
        >
          {header ? <div className="min-w-0 flex-1">{header}</div> : null}
          <ProfileCarouselControls className="ml-auto flex shrink-0 items-center justify-end gap-2" />
        </div>
      ) : (
        <ProfileCarouselControls className="absolute top-0 right-0 flex h-10 items-center justify-end gap-2" />
      )}
      <CarouselContent className="-ml-5">
        {profiles.map((profile, index) => (
          <CarouselItem className="pl-5 md:basis-1/2 lg:basis-1/4" key={`${profile.name}-${index}`}>
            <ProfileCarouselCard
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
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
