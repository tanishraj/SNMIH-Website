import { GalleryAlbumTabsClient } from '@/blocks/GalleryAlbumTabs/GalleryAlbumTabsClient'
import {
  normalizeGalleryAlbumTabsImagesPerLoad,
  normalizeGalleryAlbumTabsVariant,
  resolveGalleryAlbumTabs,
  type GalleryAlbumTabsVariant,
} from '@/blocks/GalleryAlbumTabs/galleryAlbumTabsShared'
import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import {
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import type { EventGalleryAlbum, EventGalleryDisplayOrder } from '@/lib/eventGalleryShared'
import { cn } from '@/lib/utils'

type GalleryAlbumTabsAlignment = 'center' | 'left'
type GalleryAlbumTabsHeaderActionAlignment = 'bottom' | 'center' | 'top'

export type GalleryAlbumTabsBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  allTabLabel?: string | null
  appearance?: BlockAppearance | null
  contentAlignment?: GalleryAlbumTabsAlignment | null
  description?: string | null
  displayOrder?: EventGalleryDisplayOrder | null
  emptyStateMessage?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  galleryAlbums?: unknown
  headerActionAlignment?: GalleryAlbumTabsHeaderActionAlignment | null
  imagesPerLoad?: number | string | null
  loadMoreLabel?: string | null
  size?: RegularBlockSize | null
  tabVariant?: GalleryAlbumTabsVariant | string | null
  title?: string | null
}

type GalleryAlbumTabsBlockPresentationProps = GalleryAlbumTabsBlockLike & {
  albums: EventGalleryAlbum[]
}

const alignmentClasses = {
  center: 'mx-auto items-center text-center',
  left: 'items-start text-left',
} as const

export function GalleryAlbumTabsBlockPresentation({
  accentTitle,
  actions,
  allTabLabel,
  albums,
  appearance,
  contentAlignment = 'left',
  description,
  emptyStateMessage,
  eyebrow,
  footerActions,
  headerActionAlignment = 'center',
  imagesPerLoad,
  loadMoreLabel,
  size = 'default',
  tabVariant,
  title,
}: GalleryAlbumTabsBlockPresentationProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const surface: SectionEyebrowSurface = appearanceClasses.background
  const resolvedAlignment = contentAlignment ?? 'left'
  const resolvedHeaderActionAlignment =
    headerActionAlignment === 'top' || headerActionAlignment === 'bottom'
      ? headerActionAlignment
      : 'center'
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedActions = resolveCmsActions(actions)
  const resolvedDescription = description?.trim()
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedTitle = title?.trim()
  const resolvedTabs = resolveGalleryAlbumTabs(albums, allTabLabel)
  const hasHeader = Boolean(
    resolvedEyebrow ||
    resolvedTitle ||
    resolvedAccentTitle ||
    resolvedDescription ||
    resolvedActions.length,
  )

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[size ?? 'default'],
        appearanceClasses.className,
      )}
      data-gallery-album-tabs-block="true"
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10')}>
        {hasHeader ? (
          <div
            className={cn(
              'flex flex-col gap-6',
              resolvedAlignment === 'left' &&
                resolvedActions.length > 0 &&
                cn(
                  'md:flex-row md:justify-between',
                  resolvedHeaderActionAlignment === 'top'
                    ? 'md:items-start'
                    : resolvedHeaderActionAlignment === 'bottom'
                      ? 'md:items-end'
                      : 'md:items-center',
                ),
            )}
            data-gallery-album-tabs-header-action-alignment={resolvedHeaderActionAlignment}
            data-gallery-album-tabs-header="true"
          >
            <div
              className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[resolvedAlignment])}
            >
              {resolvedEyebrow ? (
                <SectionEyebrow surface={surface}>{resolvedEyebrow}</SectionEyebrow>
              ) : null}

              {resolvedTitle || resolvedAccentTitle ? (
                <h2 className={contentSectionHeadingClasses}>
                  {resolvedTitle ? <span className="font-[inherit]">{resolvedTitle}</span> : null}
                  {resolvedTitle && resolvedAccentTitle ? ' ' : null}
                  {resolvedAccentTitle ? (
                    <em className="font-[inherit]">{resolvedAccentTitle}</em>
                  ) : null}
                </h2>
              ) : null}

              {resolvedDescription ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}
            </div>

            {resolvedActions.length > 0 ? (
              <ContentActions
                actions={resolvedActions}
                alignment={resolvedAlignment === 'center' ? 'center' : 'left'}
                className="md:w-auto md:shrink-0"
                data-gallery-album-tabs-actions="true"
              />
            ) : null}
          </div>
        ) : null}

        {albums.length > 0 ? (
          <GalleryAlbumTabsClient
            imagesPerLoad={normalizeGalleryAlbumTabsImagesPerLoad(imagesPerLoad)}
            loadMoreLabel={loadMoreLabel?.trim() || 'Load More'}
            tabs={resolvedTabs}
            tabSurface={appearanceClasses.surface}
            variant={normalizeGalleryAlbumTabsVariant(tabVariant)}
          />
        ) : (
          <p className="border border-border bg-background px-5 py-10 text-center text-sm text-current/70">
            {emptyStateMessage?.trim() || 'No gallery images available.'}
          </p>
        )}

        <BlockFooterActions
          actions={footerActions}
          alignment={resolvedAlignment === 'center' ? 'center' : 'left'}
        />
      </div>
    </section>
  )
}
