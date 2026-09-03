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
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'

type FeatureSpotlightBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  contentAlignment?: 'left' | 'center' | null
  contentVerticalAlignment?: 'bottom' | 'center' | 'top' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  image?: unknown
  imagePosition?: 'bottom' | 'center' | 'left' | 'right' | 'top' | null
  layoutMode?: 'contentOnly' | 'split' | null
  mediaFillMode?: 'contained' | 'containedFill' | 'edgeToEdge' | null
  mediaPosition?: 'left' | 'right' | null
  size?: 'none' | 'comfortable' | 'compact' | 'default' | null
  title?: string | null
}

const orderClasses = {
  left: {
    content: 'md:order-2',
    media: 'md:order-1',
  },
  right: {
    content: 'md:order-1',
    media: 'md:order-2',
  },
} as const

const objectPositionClasses = {
  center: 'object-[center_center]',
  top: 'object-[center_top]',
  bottom: 'object-[center_bottom]',
  left: 'object-[left_center]',
  right: 'object-[right_center]',
} as const

const filledContentDesktopPaddingClass = 'md:py-16'

const edgeLayoutMinHeightClasses = {
  none: 'min-h-[24rem] md:min-h-[32rem]',
  compact: 'min-h-[18rem] md:min-h-[24rem]',
  default: 'min-h-[24rem] md:min-h-[32rem]',
  comfortable: 'min-h-[30rem] md:min-h-[40rem]',
} as const

const edgeMediaMinHeightClasses = {
  none: 'min-h-72',
  compact: 'min-h-64',
  default: 'min-h-72',
  comfortable: 'min-h-80',
} as const

const contentVerticalAlignmentClasses = {
  top: 'justify-start',
  center: 'justify-center',
  bottom: 'justify-end',
} as const

export function FeatureSpotlightBlockComponent({
  accentTitle,
  actions,
  appearance,
  contentAlignment = 'center',
  contentVerticalAlignment = 'center',
  description,
  eyebrow,
  footerActions,
  image,
  imagePosition = 'center',
  layoutMode = 'split',
  mediaFillMode = 'contained',
  mediaPosition = 'left',
  size = 'default',
  title,
}: FeatureSpotlightBlockLike) {
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const media = getMediaImageProps({
    media: image as never,
    preset: 'generic',
    fallbackAlt: title,
  })

  const resolvedLayoutMode = layoutMode ?? 'split'

  const resolvedActions = resolveCmsActions(actions)

  const resolvedImagePosition = imagePosition ?? 'center'
  const resolvedPosition = mediaPosition ?? 'left'
  const resolvedMediaFillMode = mediaFillMode ?? 'contained'
  const resolvedSize = size ?? 'default'
  const resolvedContentVerticalAlignment = contentVerticalAlignment ?? 'center'
  const order = resolvedPosition === 'right' ? orderClasses.right : orderClasses.left
  const hasMedia = Boolean(media)
  const renderAsSplit = resolvedLayoutMode === 'split' && hasMedia
  const renderAsEdgeToEdge = renderAsSplit && resolvedMediaFillMode === 'edgeToEdge'
  const renderAsContainedFill = renderAsSplit && resolvedMediaFillMode === 'containedFill'
  const resolvedContentAlignment = contentAlignment ?? 'center'
  const contentContainerClasses = renderAsSplit
    ? 'max-w-xl text-left'
    : resolvedContentAlignment === 'left'
      ? 'max-w-2xl items-start text-left'
      : 'mx-auto max-w-2xl items-center text-center'
  const contentVerticalAlignmentClass =
    contentVerticalAlignmentClasses[resolvedContentVerticalAlignment]
  const filledSectionPaddingClasses =
    renderAsEdgeToEdge || renderAsContainedFill
      ? cn(regularBlockMobilePaddingClasses[resolvedSize], 'md:py-0')
      : undefined
  const edgeToEdgeContentPaddingClasses =
    resolvedPosition === 'right'
      ? cn('pr-4', filledContentDesktopPaddingClass, 'md:pr-8 lg:pr-12')
      : cn('px-4', 'md:px-8', filledContentDesktopPaddingClass, 'lg:px-12')
  const containedFillContentPaddingClasses =
    resolvedPosition === 'right'
      ? cn(filledContentDesktopPaddingClass, 'md:pr-8 lg:pr-12')
      : cn('md:px-8', filledContentDesktopPaddingClass, 'lg:px-12')
  const splitContentPaddingClasses = renderAsContainedFill
    ? containedFillContentPaddingClasses
    : edgeToEdgeContentPaddingClasses

  const content = (
    <div
      className={cn(
        'flex flex-col gap-4',
        renderAsEdgeToEdge ? 'w-full max-w-xl text-left mr-auto' : contentContainerClasses,
      )}
    >
      {eyebrow ? (
        <SectionEyebrow surface={appearance?.background ?? 'none'}>
          {eyebrow}
        </SectionEyebrow>
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
        <p className="text-balance text-base leading-7 text-current/70">{description}</p>
      ) : null}
      <ContentActions
        actions={resolvedActions}
        alignment={renderAsSplit ? 'left' : resolvedContentAlignment}
        data-feature-spotlight-actions="true"
      />
    </div>
  )

  return (
    <section
      className={cn(filledSectionPaddingClasses, appearanceClasses.className)}
      data-feature-spotlight-background={appearance?.background ?? 'none'}
      data-feature-spotlight-layout={renderAsSplit ? 'split' : 'contentOnly'}
      data-feature-spotlight-media-fill={renderAsSplit ? resolvedMediaFillMode : 'contentOnly'}
      data-feature-spotlight-content-vertical-alignment={
        renderAsSplit ? resolvedContentVerticalAlignment : 'contentOnly'
      }
      data-feature-spotlight-image-position={resolvedImagePosition}
      data-feature-spotlight-position={renderAsSplit ? resolvedPosition : 'contentOnly'}
      data-feature-spotlight-size={resolvedSize}
    >
      {renderAsEdgeToEdge ? (
        <>
        <div
          className={cn(
            'grid items-stretch gap-8 md:grid-cols-2 md:gap-0',
            edgeLayoutMinHeightClasses[resolvedSize],
          )}
        >
          {renderAsSplit ? (
            <div
              className={cn(
                order.media,
                'relative aspect-4/3 overflow-hidden md:min-h-full md:aspect-auto',
                edgeMediaMinHeightClasses[resolvedSize],
              )}
              data-feature-spotlight-media-frame="edgeToEdge"
            >
              <Image
                fill
                alt={media?.alt ?? ''}
                className={cn('object-cover', objectPositionClasses[resolvedImagePosition])}
                src={media?.src ?? ''}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          ) : null}
          <div className={cn(order.content)}>
            {resolvedPosition === 'right' ? (
              <div className="ml-auto h-full w-full max-w-[calc(var(--breakpoint-2xl)/2)] pl-4">
                <div
                  className={cn(
                    'flex min-h-full flex-col',
                    contentVerticalAlignmentClass,
                    splitContentPaddingClasses,
                  )}
                >
                  {content}
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'flex min-h-full flex-col',
                  contentVerticalAlignmentClass,
                  splitContentPaddingClasses,
                )}
              >
                {content}
              </div>
            )}
          </div>
        </div>
        <BlockFooterActions actions={footerActions} />
        </>
      ) : renderAsContainedFill ? (
        <div className={regularBlockContainerClasses}>
          <div
            className={cn(
              'grid items-stretch gap-8 md:grid-cols-2 md:gap-0',
              edgeLayoutMinHeightClasses[resolvedSize],
            )}
          >
            <div className={cn(order.media)} data-feature-spotlight-media-frame="containedFill">
              <div className="relative aspect-4/3 overflow-hidden md:h-full md:aspect-auto">
                <Image
                  fill
                  alt={media?.alt ?? ''}
                  className={cn('object-cover', objectPositionClasses[resolvedImagePosition])}
                  src={media?.src ?? ''}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
            <div className={cn(order.content)}>
              <div
                className={cn(
                  'flex min-h-full flex-col',
                  contentVerticalAlignmentClass,
                  splitContentPaddingClasses,
                )}
              >
                {content}
              </div>
            </div>
          </div>
          <BlockFooterActions actions={footerActions} />
        </div>
      ) : (
        <div
          className={cn(
            regularBlockContainerClasses,
            regularBlockMobilePaddingClasses[resolvedSize],
          )}
        >
          {renderAsSplit ? (
            <div className={cn('grid items-stretch gap-8 md:grid-cols-2 md:gap-12 lg:gap-16')}>
              <div className={cn(order.media)} data-feature-spotlight-media-frame="contained">
                <div className="relative aspect-4/3 overflow-hidden rounded-card border border-border bg-muted/20">
                  <Image
                    fill
                    alt={media?.alt ?? ''}
                    className={cn('object-cover', objectPositionClasses[resolvedImagePosition])}
                    src={media?.src ?? ''}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              <div
                className={cn(
                  order.content,
                  'flex min-h-full flex-col',
                  contentVerticalAlignmentClass,
                )}
              >
                {content}
              </div>
            </div>
          ) : (
            <div className="block">{content}</div>
          )}
          <BlockFooterActions actions={footerActions} />
        </div>
      )}
    </section>
  )
}
