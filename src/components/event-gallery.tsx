import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import {
  normalizeOverlayDisplayMode,
  type OverlayDisplayMode,
} from '@/blocks/shared/overlayDisplayPresentation'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { EventGalleryClient } from '@/components/event-gallery-client'
import {
  normalizeEventGalleryCardTextLayout,
  type EventGalleryCardTextLayout,
} from '@/components/event-gallery-presentation'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

export type EventGalleryAlignment = 'center' | 'left' | 'right'
export type { EventGalleryCardTextLayout } from '@/components/event-gallery-presentation'
export type EventGallerySize = 'none' | 'comfortable' | 'compact' | 'default'
export type EventGalleryResolvedOverlay = ReturnType<typeof resolveMediaOverlay>

type EventGalleryProps = {
  actions?: React.ReactNode
  albums: EventGalleryAlbum[]
  alignment?: EventGalleryAlignment
  appearance?: BlockAppearance | null
  cardTextLayout?: EventGalleryCardTextLayout | string | null
  className?: string
  description?: string | null
  enableAlbumSlideshow?: boolean
  eyebrow?: string | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDisplay?: OverlayDisplayMode | string | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | null
  showCardOverlay?: boolean
  showEventDate?: boolean
  showImageCount?: boolean
  size?: EventGallerySize
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

const alignmentClasses = {
  center: 'mx-auto items-center text-center',
  left: 'items-start text-left',
  right: 'ml-auto items-end text-right',
} as const

const gridMarginClasses = {
  comfortable: 'mt-12',
  none: 'mt-10',
  compact: 'mt-8',
  default: 'mt-10',
} as const

export function EventGallery({
  actions,
  albums,
  alignment = 'left',
  appearance,
  cardTextLayout = 'split',
  className,
  description,
  enableAlbumSlideshow = true,
  eyebrow,
  overlayCoverage = 'full',
  overlayDisplay,
  overlayDirection = 'bottomToTop',
  overlayStyle = 'darker',
  showCardOverlay = true,
  showEventDate = true,
  showImageCount = true,
  size = 'default',
  themeMode = 'dark',
  title,
}: EventGalleryProps) {
  if (!albums.length) {
    return null
  }

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedOverlayDisplay = normalizeOverlayDisplayMode(overlayDisplay, 'always')
  const resolvedCardTextLayout = normalizeEventGalleryCardTextLayout(cardTextLayout)
  const overlay = resolveMediaOverlay({
    coverage: overlayCoverage,
    direction: overlayDirection,
    sectionBackground: appearanceClasses.background,
    strength: overlayStyle,
    tone: themeMode,
  })
  const hasHeaderContent = Boolean(eyebrow || title || description || actions)

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className, className)}
      data-event-gallery="true"
      data-event-gallery-alignment={alignment}
      data-event-gallery-background={appearance?.background ?? 'none'}
      data-event-gallery-overlay-coverage={overlay.coverage}
      data-event-gallery-overlay-direction={overlay.direction}
      data-event-gallery-overlay-strength={overlay.strength}
      data-event-gallery-overlay-tone={overlay.tone}
      data-event-gallery-show-card-overlay={showCardOverlay ? 'true' : 'false'}
      data-event-gallery-size={size}
    >
      <div className={regularBlockContainerClasses}>
        {hasHeaderContent ? (
          <div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[alignment])}>
            {eyebrow ? (
              <SectionEyebrow surface={appearance?.background ?? 'none'}>{eyebrow}</SectionEyebrow>
            ) : null}
            {title ? (
              <h2 className="text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-base leading-7 text-balance text-current/70">{description}</p>
            ) : null}
            {actions ? <div className="mt-2">{actions}</div> : null}
          </div>
        ) : null}

        <div className={hasHeaderContent ? gridMarginClasses[size] : undefined}>
          <EventGalleryClient
            albums={albums}
            cardTextLayout={resolvedCardTextLayout}
            enableAlbumSlideshow={enableAlbumSlideshow}
            overlay={overlay}
            overlayDisplay={resolvedOverlayDisplay}
            showCardOverlay={showCardOverlay}
            showEventDate={showEventDate}
            showImageCount={showImageCount}
          />
        </div>
      </div>
    </section>
  )
}
