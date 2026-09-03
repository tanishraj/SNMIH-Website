import Image from 'next/image'

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
import { ContentLink } from '@/components/ContentLink'
import { NewsEventClassificationBadge } from '@/components/news-events/NewsEventClassificationBadge'
import { SectionEyebrow, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
import {
  resolveCmsActions,
  resolveCmsLink,
  type CmsActionValue,
  type CmsLinkValue,
} from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import type { PublicNewsEventCard } from '@/lib/newsEventsShared'
import { cn } from '@/lib/utils'
import {
  getNewsGridClasses,
  getNewsGridImageSizes,
  hasValidNewsGridFeature,
  normalizeNewsGridTotalCards,
  type NewsGridCardsPerRow,
} from '@/blocks/NewsGrid/newsGridShared'

type NewsGridAlignment = 'center' | 'left'
type NewsGridHeaderActionAlignment = 'bottom' | 'center' | 'top'

export type NewsGridFeatureCard = Omit<CmsLinkValue, 'linkType'> & {
  actionLabel?: string | null
  enabled?: boolean | null
  eyebrow?: string | null
  image?: unknown
  linkType?: 'custom' | 'none' | 'page' | null
  title?: string | null
}

export type NewsGridBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  cardsPerRow?: NewsGridCardsPerRow | null
  contentAlignment?: NewsGridAlignment | null
  description?: string | null
  emptyStateMessage?: string | null
  eventActionLabel?: string | null
  eyebrow?: string | null
  featureCard?: NewsGridFeatureCard | null
  footerActions?: CmsActionValue[] | null
  headerActionAlignment?: NewsGridHeaderActionAlignment | null
  newsActionLabel?: string | null
  size?: RegularBlockSize | null
  title?: string | null
  totalCards?: number | null
}

type NewsGridBlockPresentationProps = NewsGridBlockLike & {
  items: PublicNewsEventCard[]
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
} as const

export function NewsGridBlockPresentation({
  accentTitle,
  actions,
  appearance,
  cardsPerRow,
  contentAlignment = 'left',
  description,
  emptyStateMessage,
  eventActionLabel,
  eyebrow,
  featureCard,
  footerActions,
  headerActionAlignment = 'center',
  items,
  newsActionLabel,
  size = 'default',
  title,
  totalCards,
}: NewsGridBlockPresentationProps) {
  const resolvedTitle = title?.trim()
  if (!resolvedTitle) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const surface: SectionEyebrowSurface = appearanceClasses.background
  const resolvedAlignment = contentAlignment ?? 'left'
  const resolvedHeaderActionAlignment =
    headerActionAlignment === 'top' || headerActionAlignment === 'bottom'
      ? headerActionAlignment
      : 'center'
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedDescription = description?.trim()
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedActions = resolveCmsActions(actions)
  const resolvedDefaultActionLabel = newsActionLabel?.trim() || 'Read update'
  const resolvedEventLabel = eventActionLabel?.trim() || 'View details'

  // Editor-supplied, so it survives even when the collection has nothing to show.
  const featureDestination = featureCard?.enabled
    ? resolveCmsLink({
        linkType: featureCard.linkType === 'none' ? null : featureCard.linkType,
        openInNewTab: featureCard.openInNewTab,
        page: featureCard.page,
        url: featureCard.url,
      })
    : undefined
  const featureImage = featureCard?.enabled
    ? getMediaImageProps({
        media: featureCard.image as never,
        preset: 'generic',
        fallbackAlt: featureCard.title?.trim() ?? 'Feature',
      })
    : undefined
  const showsFeature = hasValidNewsGridFeature(featureCard)
  const resolvedTotalCards = normalizeNewsGridTotalCards(totalCards)
  const visibleItems = items.slice(0, Math.max(0, resolvedTotalCards - (showsFeature ? 1 : 0)))

  const hasCards = visibleItems.length > 0 || showsFeature
  const resolvedEmptyState = emptyStateMessage?.trim()

  if (!hasCards && !resolvedEmptyState) return null

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[size ?? 'default'],
        appearanceClasses.className,
      )}
      data-news-grid-block="true"
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10')}>
        {/* Header actions sit level with the heading rather than under it, so
            "View all" stays reachable without scanning past the cards. */}
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
          data-news-grid-header-action-alignment={resolvedHeaderActionAlignment}
          data-news-grid-header="true"
        >
          <div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[resolvedAlignment])}>
            {resolvedEyebrow ? (
              <SectionEyebrow surface={surface}>{resolvedEyebrow}</SectionEyebrow>
            ) : null}

            <h2 className={contentSectionHeadingClasses}>
              <span className="font-[inherit]">{resolvedTitle}</span>
              {resolvedAccentTitle ? (
                <>
                  {' '}
                  <em className="font-[inherit]">{resolvedAccentTitle}</em>
                </>
              ) : null}
            </h2>

            {resolvedDescription ? (
              <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
            ) : null}
          </div>

          {resolvedActions.length > 0 ? (
            <ContentActions
              actions={resolvedActions}
              alignment={resolvedAlignment === 'center' ? 'center' : 'left'}
              className="md:w-auto md:shrink-0"
              data-news-grid-actions="true"
            />
          ) : null}
        </div>

        {hasCards ? (
          <div
            className={cn('grid items-stretch gap-4', getNewsGridClasses(cardsPerRow))}
            data-news-grid-items="true"
          >
            {visibleItems.map((item) => (
              <article
                className="flex h-full min-h-[18rem] flex-col gap-4 rounded-card border border-current/15 p-6 sm:p-7"
                data-news-grid-card="true"
                data-news-grid-card-type={item.classification.slug}
                key={item.id}
              >
                <NewsEventClassificationBadge classification={item.classification} />

                {item.dateLabel ? (
                  <p className="font-sans text-xs leading-4 text-current/70">{item.dateLabel}</p>
                ) : null}

                <h3 className="line-clamp-3 font-sans text-lg font-semibold leading-snug tracking-tight text-current sm:text-xl">
                  {item.title}
                </h3>

                {/* Pushes the link to the foot so every card's CTA lines up. */}
                <div className="mt-auto pt-4">
                  <ContentLink
                    href={item.href}
                    label={
                      item.behavior === 'event' ? resolvedEventLabel : resolvedDefaultActionLabel
                    }
                  />
                </div>
              </article>
            ))}

            {showsFeature ? (
              <article
                className={cn(
                  'relative isolate flex h-full min-h-[18rem] flex-col justify-end overflow-hidden border border-current/15 p-6 sm:p-7',
                  'rounded-card',
                  featureImage ? 'text-white' : 'bg-card text-card-foreground',
                )}
                data-block-surface={featureImage ? 'brand' : 'light'}
                data-news-grid-feature="true"
              >
                {featureImage ? (
                  <Image
                    alt=""
                    className="-z-10 object-cover"
                    fill
                    sizes={getNewsGridImageSizes(cardsPerRow)}
                    src={featureImage.src}
                  />
                ) : null}
                {featureImage ? (
                  <div className="absolute inset-0 -z-10 bg-linear-to-b from-black/25 via-black/55 to-black/85" />
                ) : null}

                {featureCard?.eyebrow?.trim() ? (
                  <SectionEyebrow
                    className={featureImage ? 'text-white/80' : undefined}
                    surface={featureImage ? 'darkOverlay' : surface}
                  >
                    {featureCard.eyebrow.trim()}
                  </SectionEyebrow>
                ) : null}

                <h3 className="mt-2 line-clamp-3 font-sans text-lg font-semibold leading-snug tracking-tight text-current sm:text-xl">
                  {featureCard?.title?.trim()}
                </h3>

                {featureDestination?.href ? (
                  <div className="mt-4">
                    <ContentLink
                      href={featureDestination.href}
                      label={featureCard?.actionLabel?.trim() || 'Explore'}
                      openInNewTab={featureDestination.openInNewTab}
                    />
                  </div>
                ) : null}
              </article>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-6 text-current/70" data-news-grid-empty="true">
            {resolvedEmptyState}
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
