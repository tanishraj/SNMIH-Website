import type { BlockAppearance } from '@/blocks/shared/blockAppearance'
import type { RegularBlockSize } from '@/blocks/shared/blockSpacing'
import {
  NewsEventsFeaturedCarousel,
  type NewsEventsHighlightsAlignment,
} from '@/components/news-events/NewsEventsFeaturedCarousel'
import {
  resolveFeaturedHighlightsOverlay,
  type FeaturedHighlightImagePositionOverride,
  type FeaturedHighlightItem,
  type FeaturedHighlightsControlsPosition,
} from '@/components/news-events/featuredHighlightsShared'
import type { CmsActionValue } from '@/lib/cmsLinks'
import type {
  MediaOverlayCoverage,
  MediaOverlayDirection,
  MediaOverlayStrength,
  MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'

export type NewsEventsHighlightsBlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  autoplay?: boolean | null
  carouselControlsPosition?: FeaturedHighlightsControlsPosition | null
  classifications?: unknown
  contentAlignment?: NewsEventsHighlightsAlignment | null
  description?: string | null
  emptyStateMessage?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  imagePositionOverride?: FeaturedHighlightImagePositionOverride | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | null
  size?: RegularBlockSize | null
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

type NewsEventsHighlightsBlockPresentationProps = NewsEventsHighlightsBlockLike & {
  items: FeaturedHighlightItem[]
}

export function NewsEventsHighlightsBlockPresentation({
  actions,
  appearance,
  autoplay,
  carouselControlsPosition,
  contentAlignment = 'left',
  description,
  emptyStateMessage,
  eyebrow,
  footerActions,
  imagePositionOverride,
  items,
  overlayCoverage,
  overlayDirection,
  overlayStyle,
  size = 'default',
  themeMode,
  title,
}: NewsEventsHighlightsBlockPresentationProps) {
  const overlay = resolveFeaturedHighlightsOverlay({
    coverage: overlayCoverage ?? undefined,
    direction: overlayDirection ?? undefined,
    strength: overlayStyle ?? undefined,
    tone: themeMode ?? undefined,
  })

  return (
    <NewsEventsFeaturedCarousel
      actions={actions}
      alignment={contentAlignment ?? 'left'}
      appearance={appearance}
      autoplay={autoplay ?? true}
      carouselControlsPosition={carouselControlsPosition ?? 'bottom'}
      description={description?.trim() || undefined}
      emptyStateMessage={emptyStateMessage?.trim() || undefined}
      eyebrow={eyebrow?.trim() || undefined}
      footerActions={footerActions}
      imagePositionOverride={imagePositionOverride ?? 'item'}
      items={items}
      overlay={overlay}
      size={size ?? 'default'}
      title={title?.trim() || undefined}
    />
  )
}
