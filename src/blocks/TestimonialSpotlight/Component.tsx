import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import type { CardSurfaceValue } from '@/blocks/shared/cardThemeFields'
import {
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'

type TestimonialSpotlightBlockLike = {
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  containerBackground?: CardSurfaceValue | null
  containerOutline?: 'none' | 'outline' | null
  contentVerticalAlignment?: 'bottom' | 'center' | 'top' | null
  description?: string | null
  designation?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  image?: unknown
  imagePosition?: 'bottom' | 'center' | 'left' | 'right' | 'top' | null
  mediaFillMode?: 'contained' | 'containedFill' | 'edgeToEdge' | null
  mediaPosition?: 'left' | 'right' | null
  personName?: string | null
  sectionContentAlignment?: 'center' | 'left' | null
  sectionDescription?: string | null
  sectionEyebrow?: string | null
  sectionTitle?: string | null
  size?: 'comfortable' | 'compact' | 'default' | 'none' | null
  testimonial?: string | null
  title?: string | null
}

const orderClasses = {
  left: { content: 'md:order-2', media: 'md:order-1' },
  right: { content: 'md:order-1', media: 'md:order-2' },
} as const

const gridTemplateClasses = {
  left: 'md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]',
  right: 'md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]',
} as const

const objectPositionClasses = {
  bottom: 'object-[center_bottom]',
  center: 'object-[center_center]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
  top: 'object-[center_top]',
} as const

const contentVerticalAlignmentClasses = {
  bottom: 'justify-end',
  center: 'justify-center',
  top: 'justify-start',
} as const

const mediaMinHeightClasses = {
  none: 'md:min-h-[24rem]',
  compact: 'md:min-h-[24rem]',
  default: 'md:min-h-[30rem]',
  comfortable: 'md:min-h-[36rem]',
} as const

const resolveContainerEyebrowSurface = (
  containerBackground: CardSurfaceValue,
  sectionBackground: SectionEyebrowSurface,
): SectionEyebrowSurface => {
  if (containerBackground === 'default') return sectionBackground
  return containerBackground === 'primary' ? 'brand' : 'subtle'
}

const testimonialQuotePairs = [
  ['"', '"'],
  ['“', '”'],
] as const

const normalizeTestimonial = (value?: string | null) => {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  const outerPair = testimonialQuotePairs.find(
    ([opening, closing]) =>
      trimmed.length >= opening.length + closing.length &&
      trimmed.startsWith(opening) &&
      trimmed.endsWith(closing),
  )

  if (!outerPair) return trimmed

  const normalized = trimmed.slice(outerPair[0].length, -outerPair[1].length).trim()
  return normalized || undefined
}

export function TestimonialSpotlightBlockComponent({
  actions,
  appearance,
  containerBackground,
  containerOutline,
  contentVerticalAlignment = 'center',
  description,
  designation,
  eyebrow,
  footerActions,
  image,
  imagePosition = 'center',
  mediaFillMode = 'contained',
  mediaPosition = 'left',
  personName,
  sectionContentAlignment = 'center',
  sectionDescription,
  sectionEyebrow,
  sectionTitle,
  size = 'default',
  testimonial,
  title,
}: TestimonialSpotlightBlockLike) {
  const resolvedTitle = title?.trim()
  const resolvedTestimonial = normalizeTestimonial(testimonial)
  const resolvedPersonName = personName?.trim()
  const resolvedDescription = description?.trim()
  const resolvedDesignation = designation?.trim()
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedSectionEyebrow = sectionEyebrow?.trim()
  const resolvedSectionTitle = sectionTitle?.trim()
  const resolvedSectionDescription = sectionDescription?.trim()
  const resolvedSectionActions = resolveCmsActions(actions)
  const hasFooterActions = resolveCmsActions(footerActions).length > 0
  const resolvedSectionContentAlignment = sectionContentAlignment === 'left' ? 'left' : 'center'
  const hasSectionHeader = Boolean(
    resolvedSectionEyebrow ||
    resolvedSectionTitle ||
    resolvedSectionDescription ||
    resolvedSectionActions.length,
  )
  const resolvedImagePosition = imagePosition ?? 'center'
  const resolvedMediaFillMode = mediaFillMode ?? 'contained'
  const resolvedMediaPosition = mediaPosition ?? 'left'
  const resolvedSize = size ?? 'default'
  const resolvedVerticalAlignment = contentVerticalAlignment ?? 'center'
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const isFilled = resolvedMediaFillMode !== 'contained'
  const containerSurface = resolveCardSurface(containerBackground, appearanceClasses.background)
  const resolvedContainerOutline = containerOutline === 'outline' ? 'outline' : 'none'
  const hasContainerTreatment =
    containerSurface.value !== 'default' || resolvedContainerOutline === 'outline'
  const usesJoinedColumns = isFilled || hasContainerTreatment
  const containerEyebrowSurface = resolveContainerEyebrowSurface(
    containerSurface.value,
    appearanceClasses.background,
  )
  const contentPaddingClasses =
    resolvedMediaFillMode === 'edgeToEdge'
      ? 'px-4 pt-8 md:px-8 md:py-16 lg:px-12'
      : hasContainerTreatment
        ? 'p-8 md:px-8 md:py-16 lg:px-12'
        : resolvedMediaFillMode === 'containedFill'
          ? 'pt-8 md:px-8 md:py-16 lg:px-12'
          : undefined
  const media = getMediaImageProps({
    media: image as never,
    preset: 'generic',
    fallbackAlt: resolvedTitle,
  })

  if (!media || !resolvedTitle || !resolvedPersonName) return null

  const MessageHeading = resolvedSectionTitle ? 'h3' : 'h2'
  const isSectionCentered = resolvedSectionContentAlignment === 'center'
  const ContentGroup = resolvedTestimonial ? 'figure' : 'div'
  const Attribution = resolvedTestimonial ? 'figcaption' : 'div'

  const sectionHeader = hasSectionHeader ? (
    <div
      className={cn(
        'flex max-w-3xl flex-col gap-4',
        isSectionCentered ? 'mx-auto items-center text-center' : 'items-start text-left',
      )}
      data-testimonial-spotlight-section-alignment={resolvedSectionContentAlignment}
      data-testimonial-spotlight-section-header="true"
    >
      {resolvedSectionEyebrow ? (
        <SectionEyebrow surface={appearanceClasses.background}>
          {resolvedSectionEyebrow}
        </SectionEyebrow>
      ) : null}
      {resolvedSectionTitle ? (
        <h2 className={contentSectionHeadingClasses}>{resolvedSectionTitle}</h2>
      ) : null}
      {resolvedSectionDescription ? (
        <p className={contentSectionDescriptionClasses}>{resolvedSectionDescription}</p>
      ) : null}
      {resolvedSectionActions.length ? (
        <div className="mt-2 w-full">
          <ContentActions
            actions={resolvedSectionActions}
            alignment={resolvedSectionContentAlignment}
            data-testimonial-spotlight-section-actions="true"
          />
        </div>
      ) : null}
    </div>
  ) : null

  const order = orderClasses[resolvedMediaPosition]
  const mediaFrame = (
    <div
      className={cn(
        order.media,
        'relative aspect-4/3 overflow-hidden md:h-full md:aspect-auto',
        mediaMinHeightClasses[resolvedSize],
      )}
      data-testimonial-spotlight-media-frame={resolvedMediaFillMode}
    >
      <Image
        fill
        alt={media.alt}
        className={cn('object-cover', objectPositionClasses[resolvedImagePosition])}
        sizes="(max-width: 767px) 100vw, 40vw"
        src={media.src}
      />
    </div>
  )

  const content = (
    <div className="flex w-full max-w-3xl flex-col gap-5 text-left">
      {resolvedEyebrow ? (
        <SectionEyebrow surface={containerEyebrowSurface}>{resolvedEyebrow}</SectionEyebrow>
      ) : null}
      <MessageHeading className={contentSectionHeadingClasses}>{resolvedTitle}</MessageHeading>
      <ContentGroup className="flex flex-col gap-5">
        {resolvedTestimonial ? (
          <blockquote className="font-sans text-lg leading-relaxed font-medium text-pretty text-current sm:text-xl">
            “{resolvedTestimonial}”
          </blockquote>
        ) : null}
        {resolvedDescription ? (
          <p className={cn(contentSectionDescriptionClasses, containerSurface.secondary)}>
            {resolvedDescription}
          </p>
        ) : null}
        <Attribution className="flex flex-col gap-1 font-sans">
          <span className="text-base font-semibold text-current">{resolvedPersonName}</span>
          {resolvedDesignation ? (
            <span className={cn('text-xs leading-4', containerSurface.secondary)}>
              {resolvedDesignation}
            </span>
          ) : null}
        </Attribution>
      </ContentGroup>
    </div>
  )

  const splitLayout = (
    <div
      className={cn(
        'grid items-stretch gap-8',
        gridTemplateClasses[resolvedMediaPosition],
        usesJoinedColumns ? 'md:gap-0' : 'md:gap-12 lg:gap-16',
        containerSurface.className,
        hasContainerTreatment && 'overflow-hidden',
        hasContainerTreatment && 'rounded-card',
        resolvedContainerOutline === 'outline' && ['border', containerSurface.divider],
      )}
      data-testimonial-spotlight-container-background={containerSurface.value}
      data-testimonial-spotlight-container-outline={resolvedContainerOutline}
    >
      {mediaFrame}
      <div
        className={cn(
          order.content,
          'flex min-h-full flex-col',
          contentVerticalAlignmentClasses[resolvedVerticalAlignment],
          contentPaddingClasses,
        )}
      >
        {content}
      </div>
    </div>
  )

  const legacyLayout =
    resolvedMediaFillMode === 'edgeToEdge' ? (
      splitLayout
    ) : (
      <div
        className={cn(
          regularBlockContainerClasses,
          !isFilled && regularBlockMobilePaddingClasses[resolvedSize],
        )}
      >
        {splitLayout}
      </div>
    )

  if (!hasSectionHeader && !hasFooterActions) {
    return (
      <section
        className={cn(
          isFilled && regularBlockMobilePaddingClasses[resolvedSize],
          isFilled && 'md:py-0',
          appearanceClasses.className,
        )}
        data-testimonial-spotlight="true"
        data-testimonial-spotlight-background={appearanceClasses.background}
        data-testimonial-spotlight-content-vertical-alignment={resolvedVerticalAlignment}
        data-testimonial-spotlight-image-position={resolvedImagePosition}
        data-testimonial-spotlight-media-fill={resolvedMediaFillMode}
        data-testimonial-spotlight-media-position={resolvedMediaPosition}
        data-testimonial-spotlight-size={resolvedSize}
      >
        {legacyLayout}
      </section>
    )
  }

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClasses.className)}
      data-testimonial-spotlight="true"
      data-testimonial-spotlight-background={appearanceClasses.background}
      data-testimonial-spotlight-content-vertical-alignment={resolvedVerticalAlignment}
      data-testimonial-spotlight-image-position={resolvedImagePosition}
      data-testimonial-spotlight-media-fill={resolvedMediaFillMode}
      data-testimonial-spotlight-media-position={resolvedMediaPosition}
      data-testimonial-spotlight-size={resolvedSize}
    >
      {resolvedMediaFillMode === 'edgeToEdge' ? (
        <>
          {sectionHeader ? (
            <div className={cn(regularBlockContainerClasses, 'mb-12')}>{sectionHeader}</div>
          ) : null}
          {splitLayout}
          {hasFooterActions ? (
            <div className={regularBlockContainerClasses}>
              <BlockFooterActions actions={footerActions} />
            </div>
          ) : null}
        </>
      ) : (
        <div className={regularBlockContainerClasses}>
          {sectionHeader ? <div className="mb-12">{sectionHeader}</div> : null}
          {splitLayout}
          <BlockFooterActions actions={footerActions} />
        </div>
      )}
    </section>
  )
}
