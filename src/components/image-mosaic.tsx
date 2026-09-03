import type { ReactNode } from 'react'
import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
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
import { ContentActions } from '@/components/ContentActions'
import {
  normalizeGalleryAlbumContentPosition,
  type GalleryAlbumContentPosition,
} from '@/components/gallery-album-overlay-content'
import {
  getImageMosaicGridClassName,
  getImageMosaicGridCount,
  getImageMosaicTileClassName,
  type ImageMosaicContentSource,
} from '@/components/image-mosaic-presentation'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import type { ResolvedCmsAction } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

export type ImageMosaicAlignment = 'center' | 'left' | 'right'
export type ImageMosaicImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
export type ImageMosaicSize = 'none' | 'comfortable' | 'compact' | 'default'

export type ImageMosaicItem = {
  action?: ResolvedCmsAction & {
    mode: 'button' | 'link'
  }
  id: number | string
  image: {
    alt: string
    height?: number
    src: string
    width?: number
  }
  imagePosition?: ImageMosaicImagePosition | null
  title?: string | null
}

type ImageMosaicProps = {
  accentTitle?: string | null
  actions?: ReactNode
  albumGrid?: ReactNode
  alignment?: ImageMosaicAlignment
  appearance?: BlockAppearance | null
  cardTextLayout?: GalleryAlbumContentPosition | string | null
  className?: string
  contentSource?: ImageMosaicContentSource
  description?: string | null
  eyebrow?: string | null
  itemCount?: number
  items?: ImageMosaicItem[]
  overlayCoverage?: MediaOverlayCoverage
  overlayDisplay?: OverlayDisplayMode | string | null
  overlayDirection?: MediaOverlayDirection
  overlayStyle?: MediaOverlayStrength
  showImageOverlays?: boolean
  size?: ImageMosaicSize
  themeMode?: MediaOverlayTone
  title?: string | null
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const

export function ImageMosaic({
  accentTitle,
  actions,
  albumGrid,
  alignment = 'center',
  appearance,
  cardTextLayout = 'split',
  className,
  contentSource = 'manualImages',
  description,
  eyebrow,
  itemCount,
  items = [],
  overlayCoverage = 'full',
  overlayDisplay,
  overlayDirection = 'bottomToTop',
  overlayStyle = 'dark',
  showImageOverlays = true,
  size = 'default',
  themeMode = 'auto',
  title,
}: ImageMosaicProps) {
  const visibleItems = items.slice(0, 8)
  const count = getImageMosaicGridCount(itemCount ?? visibleItems.length)

  if (!title?.trim() || (!albumGrid && visibleItems.length === 0)) {
    return null
  }

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const overlay = resolveMediaOverlay({
    coverage: overlayCoverage,
    direction: overlayDirection,
    sectionBackground: appearanceClasses.background,
    strength: overlayStyle,
    tone: themeMode,
  })
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const resolvedCardTextLayout = normalizeGalleryAlbumContentPosition(cardTextLayout)
  const resolvedOverlayDisplay = normalizeOverlayDisplayMode(overlayDisplay, 'hover')
  const isLeftAligned = resolvedCardTextLayout === 'split'
  const manualOverlayPositionClasses =
    resolvedCardTextLayout === 'middleCenter'
      ? 'inset-0 items-center justify-center text-center'
      : resolvedCardTextLayout === 'center'
        ? 'inset-x-0 bottom-0 items-center text-center'
        : 'inset-x-0 bottom-0 items-start text-left'

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className, className)}
      data-image-mosaic="true"
      data-image-mosaic-alignment={alignment}
      data-image-mosaic-background={appearance?.background ?? 'none'}
      data-image-mosaic-overlay-coverage={overlay.coverage}
      data-image-mosaic-overlay-direction={overlay.direction}
      data-image-mosaic-overlay-strength={overlay.strength}
      data-image-mosaic-overlay-tone={overlay.tone}
      data-image-mosaic-overlays={showImageOverlays ? 'shown' : 'hidden'}
      data-image-mosaic-size={size}
      data-image-mosaic-source={contentSource}
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col', sectionGapClasses[size])}>
        <div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[alignment])}>
          {eyebrow ? (
            <SectionEyebrow surface={appearance?.background ?? 'none'}>{eyebrow}</SectionEyebrow>
          ) : null}
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

        {albumGrid ?? (
          <div className={getImageMosaicGridClassName(count, size)} data-image-mosaic-count={count}>
            {visibleItems.map((item, index) => {
              const position = item.imagePosition ?? 'center'
              const resolvedTitle = item.title?.trim()
              const hasOverlay = showImageOverlays && Boolean(resolvedTitle || item.action)
              const tileClassName = getImageMosaicTileClassName({ count, index, size })
              const imageClassName = cn('size-full object-cover', objectPositionClasses[position])
              const itemKey = `${item.id}-${index}`

              return (
                <div
                  className={cn(tileClassName, hasOverlay ? 'group/image-mosaic' : undefined)}
                  data-gallery-overlay-display={hasOverlay ? resolvedOverlayDisplay : undefined}
                  data-image-mosaic-item={index + 1}
                  key={itemKey}
                >
                  <Image
                    alt={item.image.alt}
                    className={cn(imageClassName, hasOverlay ? 'image-mosaic-image' : undefined)}
                    draggable={false}
                    height={item.image.height}
                    src={item.image.src}
                    width={item.image.width}
                  />
                  {hasOverlay ? (
                    <div className="gallery-overlay-layer image-mosaic-overlay absolute inset-0">
                      <div
                        className={cn(
                          'pointer-events-none absolute',
                          overlay.frameClassName,
                          overlay.className,
                        )}
                      />
                      <div
                        className={cn(
                          'absolute flex flex-col gap-2 p-5',
                          manualOverlayPositionClasses,
                          overlay.text.title,
                        )}
                        data-block-surface={overlay.blockSurface}
                        data-image-mosaic-overlay="true"
                        data-image-mosaic-card-position={resolvedCardTextLayout}
                      >
                        {resolvedTitle ? (
                          <p
                            className={cn(
                              'text-base leading-tight font-semibold text-current',
                              isLeftAligned ? 'text-left' : 'text-center',
                            )}
                          >
                            {resolvedTitle}
                          </p>
                        ) : null}
                        {item.action ? (
                          <ContentActions
                            actions={[item.action]}
                            alignment={isLeftAligned ? 'left' : 'center'}
                            className={cn(
                              overlay.text.link,
                              '[&_[data-content-link]]:text-current',
                            )}
                            data-image-mosaic-item-action="true"
                          />
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
