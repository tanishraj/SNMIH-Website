import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import {
  normalizeMediaOverlayTone,
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import { ActionButtonContent } from '@/components/ActionButtonContent'
import { ContentLink } from '@/components/ContentLink'
import { Button } from '@/components/ui/button'
import { SectionEyebrow, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
import {
  getCmsActionAnchorProps,
  resolveCmsLink,
  type CmsActionIndicatorPosition,
  type CmsActionVariant,
} from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'
import type { Media, Page } from '@/payload-types'

type HeroButton = {
  file?: Media | number | string | null
  fileBehavior?: 'download' | 'view' | null
  fileIconPosition?: CmsActionIndicatorPosition | null
  label?: string | null
  linkType?: 'page' | 'custom' | 'file' | null
  openFileInNewTab?: boolean | null
  openInNewTab?: boolean | null
  page?: Page | number | string | null
  showArrow?: boolean | null
  showFileIcon?: boolean | null
  url?: string | null
  variant?: CmsActionVariant | null
}

export type HeroBannerBlockLike = {
  accentTitle?: string | null
  appearance?: BlockAppearance | null
  backgroundImage?: unknown
  buttons?: HeroButton[] | null
  contentWidth?: 'default' | 'narrow' | 'wide' | null
  description?: string | null
  enableTextShadow?: boolean | null
  eyebrow?: string | null
  height?: '40' | '60' | '80' | 'balanced' | 'compact' | 'default' | 'immersive' | null
  horizontalAlignment?: 'center' | 'left' | 'right' | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | 'brand' | 'darkest' | 'ink' | 'soft' | null
  preload?: boolean
  themeMode?: MediaOverlayTone | null
  title?: string | null
  verticalAlignment?: 'bottom' | 'center' | 'top' | null
}

const horizontalShellClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

const textAlignmentClasses = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const

const constrainedItemAlignmentClasses = {
  left: 'mr-auto',
  center: 'mx-auto',
  right: 'ml-auto',
} as const

const verticalShellClasses = {
  top: 'items-start py-16 md:py-20',
  center: 'items-center py-16 md:py-20',
  bottom: 'items-end py-16 md:py-20',
} as const

const contentWidthClasses = {
  narrow: 'max-w-xl',
  default: 'max-w-3xl',
  wide: 'max-w-5xl',
} as const

const titleWidthClasses = {
  narrow: 'max-w-[12ch]',
  default: 'max-w-[16ch]',
  wide: 'max-w-[20ch]',
} as const

const descriptionWidthClasses = {
  narrow: 'max-w-[46ch]',
  default: 'max-w-[60ch]',
  wide: 'max-w-[72ch]',
} as const

const heightClasses = {
  compact: 'min-h-[40dvh]',
  default: 'min-h-[60dvh]',
  immersive: 'min-h-[80dvh]',
} as const

const titleSizeClasses = {
  compact: 'text-3xl sm:text-4xl md:text-5xl',
  default: 'text-4xl sm:text-5xl md:text-6xl',
  immersive: 'text-4xl sm:text-5xl md:text-6xl lg:text-7xl',
} as const

const descriptionSizeClasses = {
  compact: 'text-sm leading-6 lg:text-lg',
  default: 'text-base leading-7 lg:text-xl',
  immersive: 'text-base leading-7 lg:text-xl',
} as const

const actionAlignmentClasses = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
} as const

const heroTextShadowStyle = { textShadow: '0 2px 12px rgb(0 0 0 / 55%)' } as const
const heroLinkArrowShadowStyle = {
  filter: 'drop-shadow(0 2px 6px rgb(0 0 0 / 55%))',
} as const

const legacyDarkLightVerticalOverlay = 'bg-linear-to-b from-black/56 via-black/42 to-black/62'

export function resolveHeroBannerImage({
  backgroundImage,
  title,
}: Pick<HeroBannerBlockLike, 'backgroundImage' | 'title'>) {
  return getMediaImageProps({
    media: backgroundImage as never,
    preset: 'hero',
    fallbackAlt: title,
  })
}

export function HeroBannerBlockComponent({
  accentTitle,
  appearance,
  backgroundImage,
  buttons,
  contentWidth = 'default',
  description,
  enableTextShadow = false,
  eyebrow,
  height = 'default',
  horizontalAlignment = 'left',
  overlayCoverage = 'full',
  overlayDirection = 'vertical',
  overlayStyle = 'dark',
  preload = false,
  themeMode = 'auto',
  title,
  verticalAlignment = 'center',
}: HeroBannerBlockLike) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedContentWidth = contentWidth ?? 'default'
  const resolvedHorizontalAlignment = horizontalAlignment ?? 'left'
  const legacyOverlayStrength =
    overlayStyle === 'ink' || overlayStyle === 'darkest'
      ? 'darker'
      : overlayStyle === 'brand'
        ? 'dark'
        : overlayStyle
  const selectedThemeMode = normalizeMediaOverlayTone(themeMode)
  const mediaOverlay = resolveMediaOverlay({
    coverage: overlayCoverage ?? 'full',
    direction: overlayDirection ?? 'vertical',
    sectionBackground: appearanceClasses.background,
    strength: legacyOverlayStrength ?? 'dark',
    tone: selectedThemeMode,
  })
  // Preserve the established Hero treatment for saved Dark + Light content.
  // Other tones, strengths, directions, and coverage modes use the shared system.
  const heroOverlayClassName =
    selectedThemeMode === 'dark' &&
    mediaOverlay.strength === 'light' &&
    mediaOverlay.direction === 'vertical'
      ? legacyDarkLightVerticalOverlay
      : mediaOverlay.className
  const usesTextShadow = Boolean(enableTextShadow)
  const eyebrowSurface: SectionEyebrowSurface = mediaOverlay.eyebrowSurface
  const resolvedVerticalAlignment = verticalAlignment ?? 'center'
  const resolvedHeight =
    height === '40'
      ? 'compact'
      : height === '80'
        ? 'immersive'
        : height === '60' || height === 'balanced'
          ? 'default'
          : (height ?? 'default')

  const resolvedAccentTitle = accentTitle?.trim() || undefined

  const image = resolveHeroBannerImage({ backgroundImage, title })

  if (!image) {
    return null
  }

  const actions = (buttons ?? []).flatMap((button) => {
    const label = button.label?.trim()
    const link = resolveCmsLink(button)
    const resolvedVariant = button.variant ?? 'default'

    return label && link.href
      ? [
          {
            download: link.download,
            href: link.href,
            indicator: link.indicator,
            indicatorPosition: link.indicatorPosition,
            label,
            openInNewTab: link.openInNewTab,
            showArrow: Boolean(button.showArrow),
            variant: resolvedVariant,
          },
        ]
      : []
  })

  return (
    <section
      className={cn('relative isolate overflow-hidden', appearanceClasses.className)}
      data-block-surface={mediaOverlay.blockSurface}
      data-hero-banner-background={appearanceClasses.background}
      data-hero-banner-block="true"
      data-hero-banner-theme={selectedThemeMode}
    >
      <div className="absolute inset-0">
        <Image
          fill
          alt={image.alt}
          className="object-cover"
          fetchPriority={preload ? 'high' : undefined}
          preload={preload}
          sizes="100vw"
          src={image.src}
        />
      </div>
      <div
        className={cn('absolute', mediaOverlay.frameClassName, heroOverlayClassName)}
        data-hero-banner-overlay={mediaOverlay.strength}
        data-hero-banner-overlay-coverage={mediaOverlay.coverage}
        data-hero-banner-overlay-direction={mediaOverlay.direction}
        data-hero-banner-theme={selectedThemeMode}
      />
      <div
        className={cn('relative mx-auto flex max-w-screen-2xl px-4', heightClasses[resolvedHeight])}
        data-hero-banner-height={resolvedHeight}
      >
        <div
          className={cn(
            'flex w-full',
            horizontalShellClasses[resolvedHorizontalAlignment],
            verticalShellClasses[resolvedVerticalAlignment],
          )}
          data-hero-banner-horizontal={resolvedHorizontalAlignment}
          data-hero-banner-vertical={resolvedVerticalAlignment}
        >
          <div
            className={cn(
              'flex w-full flex-col gap-8',
              contentWidthClasses[resolvedContentWidth],
              textAlignmentClasses[resolvedHorizontalAlignment],
            )}
            data-hero-banner-content-width={resolvedContentWidth}
          >
            <div className="flex flex-col gap-6">
              {eyebrow ? (
                <SectionEyebrow
                  className={cn('tracking-[0.28em]', mediaOverlay.text.eyebrow)}
                  data-hero-banner-eyebrow="true"
                  surface={eyebrowSurface}
                  style={usesTextShadow ? heroTextShadowStyle : undefined}
                >
                  {eyebrow}
                </SectionEyebrow>
              ) : null}
              <h1
                className={cn(
                  'font-semibold tracking-tight text-balance',
                  titleSizeClasses[resolvedHeight],
                  mediaOverlay.text.title,
                  titleWidthClasses[resolvedContentWidth],
                  constrainedItemAlignmentClasses[resolvedHorizontalAlignment],
                )}
                style={usesTextShadow ? heroTextShadowStyle : undefined}
              >
                {resolvedAccentTitle ? (
                  <>
                    <span className="block">{title}</span>
                    <em className="block">{resolvedAccentTitle}</em>
                  </>
                ) : (
                  title
                )}
              </h1>
              {description ? (
                <p
                  className={cn(
                    'text-balance',
                    descriptionSizeClasses[resolvedHeight],
                    descriptionWidthClasses[resolvedContentWidth],
                    mediaOverlay.text.secondary,
                    constrainedItemAlignmentClasses[resolvedHorizontalAlignment],
                  )}
                  data-hero-banner-description="true"
                  style={usesTextShadow ? heroTextShadowStyle : undefined}
                >
                  {description}
                </p>
              ) : null}
            </div>
            {actions.length > 0 ? (
              <div
                className={cn(
                  'flex flex-col gap-3 sm:flex-row',
                  actionAlignmentClasses[resolvedHorizontalAlignment],
                )}
                data-hero-banner-actions="true"
              >
                {actions.map((action) =>
                  action.variant === 'link' ? (
                    <ContentLink
                      arrowStyle={usesTextShadow ? heroLinkArrowShadowStyle : undefined}
                      className={cn('w-full sm:w-auto', mediaOverlay.text.link)}
                      download={action.download}
                      href={action.href}
                      indicator={action.indicator}
                      indicatorPosition={action.indicatorPosition}
                      key={`${action.label}-${action.href}`}
                      label={action.label}
                      openInNewTab={action.openInNewTab}
                      style={usesTextShadow ? heroTextShadowStyle : undefined}
                    />
                  ) : (
                    <Button
                      asChild
                      className="h-12 w-full sm:w-auto"
                      key={`${action.label}-${action.href}`}
                      size="lg"
                      variant={action.variant}
                    >
                      <a {...getCmsActionAnchorProps(action)}>
                        <ActionButtonContent
                          indicator={action.indicator}
                          indicatorPosition={action.indicatorPosition}
                          label={action.label}
                          showArrow={action.showArrow}
                        />
                      </a>
                    </Button>
                  ),
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
