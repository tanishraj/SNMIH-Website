import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
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
import { NewsEventsFeaturedCarouselClient } from '@/components/news-events/NewsEventsFeaturedCarouselClient'
import type {
  FeaturedHighlightImagePositionOverride,
  FeaturedHighlightItem,
  FeaturedHighlightsControlsPosition,
  FeaturedHighlightsOverlayOptions,
} from '@/components/news-events/featuredHighlightsShared'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import type { CmsActionValue } from '@/lib/cmsLinks'
import { resolveCmsActions } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

export type NewsEventsHighlightsAlignment = 'center' | 'left' | 'right'

type NewsEventsFeaturedCarouselProps = {
  actions?: CmsActionValue[] | null
  alignment?: NewsEventsHighlightsAlignment
  appearance?: BlockAppearance | null
  autoplay?: boolean
  carouselControlsPosition?: FeaturedHighlightsControlsPosition
  description?: string
  emptyStateMessage?: string
  eyebrow?: string
  footerActions?: CmsActionValue[] | null
  imagePositionOverride?: FeaturedHighlightImagePositionOverride
  items: FeaturedHighlightItem[]
  overlay: FeaturedHighlightsOverlayOptions
  size?: RegularBlockSize
  title?: string
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const satisfies Record<NewsEventsHighlightsAlignment, string>

export function NewsEventsFeaturedCarousel({
  actions,
  alignment = 'left',
  appearance,
  autoplay = true,
  carouselControlsPosition = 'bottom',
  description,
  emptyStateMessage,
  eyebrow,
  footerActions,
  imagePositionOverride = 'item',
  items,
  overlay,
  size = 'default',
  title,
}: NewsEventsFeaturedCarouselProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedActions = resolveCmsActions(actions)
  const hasHeader = Boolean(eyebrow || title || description || resolvedActions.length)

  if (!items.length && !emptyStateMessage) return null

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size], appearanceClasses.className)}
      data-news-events-featured-carousel="true"
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10')}>
        {hasHeader ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8">
            <div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[alignment])}>
              {eyebrow ? (
                <SectionEyebrow surface={appearanceClasses.background}>{eyebrow}</SectionEyebrow>
              ) : null}
              {title ? <h2 className={contentSectionHeadingClasses}>{title}</h2> : null}
              {description ? (
                <p className={contentSectionDescriptionClasses}>{description}</p>
              ) : null}
            </div>
            {resolvedActions.length ? (
              <ContentActions actions={resolvedActions} alignment="right" className="lg:w-auto" />
            ) : null}
          </div>
        ) : null}

        {items.length ? (
          <NewsEventsFeaturedCarouselClient
            autoplay={autoplay}
            carouselControlsPosition={carouselControlsPosition}
            imagePositionOverride={imagePositionOverride}
            items={items}
            overlay={overlay}
            sectionBackground={appearanceClasses.background}
          />
        ) : (
          <p className="border-t border-current/15 pt-6 text-sm leading-6 text-current/70">
            {emptyStateMessage}
          </p>
        )}

        <BlockFooterActions
          actions={footerActions}
          alignment={alignment === 'center' ? 'center' : alignment === 'right' ? 'right' : 'left'}
        />
      </div>
    </section>
  )
}
