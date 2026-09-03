import * as LucideIcons from 'lucide-react'
import { Sparkles, type LucideIcon } from 'lucide-react'
import Image from 'next/image'

import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  contentItemDescriptionClasses,
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import {
  resolveMediaOverlay,
  type MediaOverlayCoverage,
  type MediaOverlayDirection,
  type MediaOverlayStrength,
  type MediaOverlayTone,
} from '@/blocks/shared/mediaOverlayPresentation'
import { ContentActions } from '@/components/ContentActions'
import { ActionButtonContent } from '@/components/ActionButtonContent'
import { ContentLink } from '@/components/ContentLink'
import { SectionEyebrow, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
import { Button } from '@/components/ui/button'
import {
  resolveCmsActions,
  resolveCmsLink,
  type CmsActionMode,
  type CmsActionValue,
  type CmsActionVariant,
  type CmsLinkValue,
} from '@/lib/cmsLinks'
import { getMediaImageProps } from '@/lib/media'
import { cn } from '@/lib/utils'

type ShowcaseCardBackground = 'default' | 'subtle' | 'brand' | 'gradient-subtle' | 'gradient-brand'
type LegacyCardBackground = 'primary' | 'secondary' | 'muted' | 'accent'
type ShowcaseCardBackgroundOverride = ShowcaseCardBackground | LegacyCardBackground | 'inherit'
type CardWidth = 'compact' | 'standard' | 'wide'
type CardHeight = 'compact' | 'standard' | 'tall'
type IconSize = 'extraLarge' | 'large' | 'small' | 'standard'
type HeaderLayout = 'split' | 'stacked'
type ContentAlignment = 'center' | 'left' | 'right'
type SplitContentAlignment = 'bottom' | 'center' | 'top'

type ShowcaseCardValue = Omit<CmsLinkValue, 'linkType'> & {
  actionLabel?: string | null
  actionMode?: CmsActionMode | null
  actionVariant?: CmsActionVariant | null
  cardBackground?: ShowcaseCardBackgroundOverride | null
  description?: string | null
  eyebrow?: string | null
  icon?: string | null
  id?: string | null
  linkType?: 'custom' | 'none' | 'page' | null
  showArrow?: boolean | null
  title?: string | null
}

type IconCardShowcaseBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  backgroundImage?: unknown
  cardHeight?: CardHeight | null
  cardContentAlignment?: ContentAlignment | null
  cards?: ShowcaseCardValue[] | null
  cardWidth?: CardWidth | null
  contentAlignment?: ContentAlignment | null
  defaultCardBackground?: ShowcaseCardBackground | LegacyCardBackground | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerLayout?: HeaderLayout | null
  iconSize?: IconSize | null
  overlayCoverage?: MediaOverlayCoverage | null
  overlayDirection?: MediaOverlayDirection | null
  overlayStyle?: MediaOverlayStrength | null
  size?: RegularBlockSize | null
  splitContentAlignment?: SplitContentAlignment | null
  themeMode?: MediaOverlayTone | null
  title?: string | null
}

type ResolvedShowcaseCard = {
  action?: {
    href: string
    label: string
    mode: CmsActionMode
    openInNewTab: boolean
    showArrow: boolean
    variant: CmsActionVariant
  }
  background: ShowcaseCardBackground
  description?: string
  eyebrow?: string
  icon?: LucideIcon
  iconName?: string
  id: string
  legacyLink?: { href: string; openInNewTab: boolean }
  title: string
}

type ShowcaseCardSurface = Omit<ReturnType<typeof resolveCardSurface>, 'value'> & {
  eyebrowSurface: SectionEyebrowSurface
  value: ShowcaseCardBackground
}

const widthClasses = {
  compact: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
  standard: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  wide: 'grid-cols-1 md:grid-cols-2',
} as const satisfies Record<CardWidth, string>

const heightClasses = {
  compact: 'min-h-52',
  standard: 'min-h-72',
  tall: 'min-h-[22rem]',
} as const satisfies Record<CardHeight, string>

const iconSizeClasses = {
  small: 'size-8',
  standard: 'size-12',
  large: 'size-16',
  extraLarge: 'size-20',
} as const satisfies Record<IconSize, string>

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const satisfies Record<ContentAlignment, string>

const cardAlignmentClasses = {
  left: 'items-start text-left',
  center: 'items-center text-center',
  right: 'items-end text-right',
} as const satisfies Record<ContentAlignment, string>

const splitContentAlignmentClasses = {
  bottom: 'lg:self-end',
  center: 'lg:self-center',
  top: 'lg:self-start',
} as const satisfies Record<SplitContentAlignment, string>

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const satisfies Record<RegularBlockSize, string>

const validCardWidths = new Set<CardWidth>(['compact', 'standard', 'wide'])
const validCardHeights = new Set<CardHeight>(['compact', 'standard', 'tall'])
const validIconSizes = new Set<IconSize>(['small', 'standard', 'large', 'extraLarge'])
const validHeaderLayouts = new Set<HeaderLayout>(['stacked', 'split'])
const validContentAlignments = new Set<ContentAlignment>(['left', 'center', 'right'])
const validSectionSizes = new Set<RegularBlockSize>(['none', 'compact', 'default', 'comfortable'])
const validSplitContentAlignments = new Set<SplitContentAlignment>(['top', 'center', 'bottom'])
const showcaseCardBackgroundValues = new Set<ShowcaseCardBackground>([
  'default',
  'subtle',
  'brand',
  'gradient-subtle',
  'gradient-brand',
])
const validActionVariants = new Set<CmsActionVariant>([
  'default',
  'link',
  'outline',
  'primary',
  'secondary',
  'white',
  'whiteOutline',
])

function normalizeValue<Value extends string>(
  value: string | null | undefined,
  validValues: Set<Value>,
  fallback: Value,
): Value {
  return validValues.has(value as Value) ? (value as Value) : fallback
}

function normalizeShowcaseCardBackground(
  value: string | null | undefined,
  fallback: ShowcaseCardBackground,
): ShowcaseCardBackground {
  if (showcaseCardBackgroundValues.has(value as ShowcaseCardBackground)) {
    return value as ShowcaseCardBackground
  }
  if (value === 'primary') return 'brand'
  if (value === 'secondary' || value === 'muted' || value === 'accent') return 'subtle'
  return fallback
}

function resolveShowcaseCardSurface(
  value: ShowcaseCardBackground,
  sectionBackground: BlockBackground,
): ShowcaseCardSurface {
  const background = value === 'default' ? sectionBackground : value
  const surface = resolveCardSurface('default', background)

  return {
    ...surface,
    className:
      value === 'default'
        ? surface.className
        : resolveBlockAppearanceClasses({ background, border: 'none' }).className,
    eyebrowSurface: background,
    value,
  }
}

function resolveCards(
  cards: ShowcaseCardValue[] | null | undefined,
  defaultBackground: ShowcaseCardBackground,
): ResolvedShowcaseCard[] {
  return (cards ?? []).flatMap((card, index) => {
    const title = card.title?.trim()
    if (!title) return []

    const requestedIcon = card.icon?.trim()
    const Icon = requestedIcon
      ? ((LucideIcons as Record<string, unknown>)[requestedIcon] as LucideIcon | undefined)
      : undefined
    const icon = requestedIcon ? (Icon ?? Sparkles) : undefined
    const iconName = requestedIcon ? (Icon ? requestedIcon : 'Sparkles') : undefined
    const background =
      !card.cardBackground || card.cardBackground === 'inherit'
        ? defaultBackground
        : normalizeShowcaseCardBackground(card.cardBackground, defaultBackground)
    const destination = resolveCmsLink({
      ...card,
      linkType: card.linkType === 'none' ? null : card.linkType,
    })
    const href = destination.href?.trim() || undefined
    const actionLabel = card.actionLabel?.trim()
    const actionVariant = validActionVariants.has(card.actionVariant as CmsActionVariant)
      ? (card.actionVariant as CmsActionVariant)
      : 'default'
    const action =
      actionLabel && href
        ? {
            href,
            label: actionLabel,
            mode: card.actionMode === 'button' ? ('button' as const) : ('link' as const),
            openInNewTab: Boolean(destination.openInNewTab),
            showArrow: Boolean(card.showArrow),
            variant: actionVariant,
          }
        : undefined
    const legacyLink =
      href && !actionLabel ? { href, openInNewTab: Boolean(destination.openInNewTab) } : undefined

    return [
      {
        action,
        background,
        description: card.description?.trim() || undefined,
        eyebrow: card.eyebrow?.trim() || undefined,
        icon,
        iconName,
        id: card.id ?? `${title}-${index}`,
        legacyLink,
        title,
      },
    ]
  })
}

type ShowcaseHeaderProps = {
  accentTitle?: string
  actions: ReturnType<typeof resolveCmsActions>
  alignment: ContentAlignment
  description?: string
  eyebrow?: string
  eyebrowSurface: SectionEyebrowSurface
  layout: HeaderLayout
  linkClassName?: string
  splitContentAlignment: SplitContentAlignment
  textClasses?: { secondary: string; title: string }
  title?: string
}

function ShowcaseHeader({
  accentTitle,
  actions,
  alignment,
  description,
  eyebrow,
  eyebrowSurface,
  layout,
  linkClassName,
  splitContentAlignment,
  textClasses,
  title,
}: ShowcaseHeaderProps) {
  if (!accentTitle && !actions.length && !description && !eyebrow && !title) return null

  const heading =
    title || accentTitle ? (
      <h2 className={cn(contentSectionHeadingClasses, textClasses?.title)}>
        {title ? <span className="block font-[family-name:inherit]">{title}</span> : null}
        {accentTitle ? <em className="block font-[family-name:inherit]">{accentTitle}</em> : null}
      </h2>
    ) : null

  if (layout === 'split') {
    return (
      <div
        className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)] lg:gap-16"
        data-icon-card-showcase-header="split"
        data-icon-card-showcase-split-alignment={splitContentAlignment}
      >
        <div className={cn(contentIntroClasses, alignmentClasses[alignment])}>
          {eyebrow ? <SectionEyebrow surface={eyebrowSurface}>{eyebrow}</SectionEyebrow> : null}
          {heading}
        </div>
        <div
          className={cn(
            contentIntroClasses,
            'max-w-xl',
            alignmentClasses[alignment],
            splitContentAlignmentClasses[splitContentAlignment],
          )}
        >
          {description ? (
            <p
              className={cn(
                contentSectionDescriptionClasses,
                'max-w-[65ch]',
                textClasses?.secondary,
              )}
            >
              {description}
            </p>
          ) : null}
          <ContentActions actions={actions} alignment={alignment} linkClassName={linkClassName} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(contentIntroClasses, alignmentClasses[alignment])}
      data-icon-card-showcase-header="stacked"
    >
      {eyebrow ? <SectionEyebrow surface={eyebrowSurface}>{eyebrow}</SectionEyebrow> : null}
      {heading}
      {description ? (
        <p className={cn(contentSectionDescriptionClasses, textClasses?.secondary)}>
          {description}
        </p>
      ) : null}
      <ContentActions actions={actions} alignment={alignment} linkClassName={linkClassName} />
    </div>
  )
}

type ShowcaseCardActionProps = {
  action: NonNullable<ResolvedShowcaseCard['action']>
  surface: ShowcaseCardSurface
}

function ShowcaseCardAction({ action, surface }: ShowcaseCardActionProps) {
  if (action.mode === 'button' && action.variant !== 'link') {
    return (
      <Button
        asChild
        className={surface.button[action.variant]}
        data-icon-card-showcase-action="button"
        size="lg"
        variant={action.variant}
      >
        <a
          href={action.href}
          rel={action.openInNewTab ? 'noreferrer' : undefined}
          target={action.openInNewTab ? '_blank' : undefined}
        >
          <ActionButtonContent label={action.label} showArrow={action.showArrow} />
        </a>
      </Button>
    )
  }

  return (
    <ContentLink
      className={surface.link}
      data-icon-card-showcase-action="link"
      href={action.href}
      label={action.label}
      openInNewTab={action.openInNewTab}
    />
  )
}

type ShowcaseCardProps = {
  alignment: ContentAlignment
  card: ResolvedShowcaseCard
  height: CardHeight
  iconSize: IconSize
  sectionBackground: BlockBackground
}

function ShowcaseCard({ alignment, card, height, iconSize, sectionBackground }: ShowcaseCardProps) {
  const surface = resolveShowcaseCardSurface(card.background, sectionBackground)
  const Icon = card.icon
  const className = cn(
    'flex h-full min-w-0 flex-col justify-center gap-5 rounded-card border px-6 py-8 sm:px-8',
    cardAlignmentClasses[alignment],
    heightClasses[height],
    surface.className,
    surface.divider,
    card.legacyLink &&
      'motion-safe:transition-transform motion-safe:duration-200 motion-safe:hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current',
  )
  const content = (
    <>
      {Icon ? (
        <Icon
          aria-hidden="true"
          className={cn('shrink-0', iconSizeClasses[iconSize], surface.icon)}
          data-icon-card-showcase-icon={card.iconName}
          strokeWidth={1.5}
        />
      ) : null}
      <div className={cn('flex w-full max-w-xl flex-col gap-3', cardAlignmentClasses[alignment])}>
        {card.eyebrow ? (
          <SectionEyebrow surface={surface.eyebrowSurface}>{card.eyebrow}</SectionEyebrow>
        ) : null}
        <h3 className="font-sans text-xl leading-tight font-semibold text-balance text-current sm:text-2xl">
          {card.title}
        </h3>
        {card.description ? (
          <p className={cn(contentItemDescriptionClasses, 'max-w-[40ch]', surface.secondary)}>
            {card.description}
          </p>
        ) : null}
        {card.action ? <ShowcaseCardAction action={card.action} surface={surface} /> : null}
      </div>
    </>
  )

  if (card.legacyLink) {
    return (
      <a
        className={className}
        data-icon-card-showcase-card="true"
        data-icon-card-showcase-card-alignment={alignment}
        href={card.legacyLink.href}
        rel={card.legacyLink.openInNewTab ? 'noreferrer' : undefined}
        target={card.legacyLink.openInNewTab ? '_blank' : undefined}
      >
        {content}
      </a>
    )
  }

  return (
    <article
      className={className}
      data-icon-card-showcase-card="true"
      data-icon-card-showcase-card-alignment={alignment}
    >
      {content}
    </article>
  )
}

export function IconCardShowcaseBlockComponent({
  accentTitle,
  actions,
  appearance,
  backgroundImage,
  cardContentAlignment,
  cardHeight,
  cards,
  cardWidth,
  contentAlignment,
  defaultCardBackground,
  description,
  eyebrow,
  footerActions,
  headerLayout,
  iconSize,
  overlayCoverage,
  overlayDirection,
  overlayStyle,
  size,
  splitContentAlignment,
  themeMode,
  title,
}: IconCardShowcaseBlockLike) {
  const resolvedCardWidth = normalizeValue(cardWidth, validCardWidths, 'standard')
  const resolvedCardHeight = normalizeValue(cardHeight, validCardHeights, 'standard')
  const resolvedIconSize = normalizeValue(iconSize, validIconSizes, 'standard')
  const resolvedHeaderLayout = normalizeValue(headerLayout, validHeaderLayouts, 'stacked')
  const resolvedAlignment = normalizeValue(contentAlignment, validContentAlignments, 'center')
  const resolvedCardAlignment = normalizeValue(
    cardContentAlignment,
    validContentAlignments,
    'center',
  )
  const resolvedSize = normalizeValue(size, validSectionSizes, 'default')
  const resolvedSplitContentAlignment = normalizeValue(
    splitContentAlignment,
    validSplitContentAlignments,
    'top',
  )
  const resolvedDefaultBackground = normalizeShowcaseCardBackground(defaultCardBackground, 'brand')
  const resolvedCards = resolveCards(cards, resolvedDefaultBackground)

  if (!resolvedCards.length) return null

  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const image = getMediaImageProps({
    fallbackAlt: '',
    media: backgroundImage as never,
    preset: 'hero',
  })
  const overlay = resolveMediaOverlay({
    coverage: overlayCoverage,
    direction: overlayDirection,
    sectionBackground: appearanceClasses.background,
    strength: overlayStyle ?? 'light',
    tone: themeMode ?? 'light',
  })
  const resolvedActions = resolveCmsActions(actions)
  const resolvedEyebrow = eyebrow?.trim() || undefined
  const resolvedTitle = title?.trim() || undefined
  const resolvedAccentTitle = accentTitle?.trim() || undefined
  const resolvedDescription = description?.trim() || undefined
  const eyebrowSurface: SectionEyebrowSurface = image
    ? overlay.eyebrowSurface
    : appearanceClasses.background

  return (
    <section
      className={cn(
        'relative isolate overflow-hidden',
        image
          ? cn(appearanceClasses.borderClassName, overlay.text.title)
          : appearanceClasses.className,
        regularBlockMobilePaddingClasses[resolvedSize],
      )}
      data-block-surface={image ? overlay.blockSurface : appearanceClasses.surface}
      data-icon-card-showcase="true"
      data-icon-card-showcase-card-alignment={resolvedCardAlignment}
      data-icon-card-showcase-height={resolvedCardHeight}
      data-icon-card-showcase-icon-size={resolvedIconSize}
      data-icon-card-showcase-width={resolvedCardWidth}
    >
      {image ? (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-20"
            data-icon-card-showcase-image="true"
          >
            <Image alt="" className="object-cover" fill sizes="100vw" src={image.src} />
          </div>
          <div
            aria-hidden="true"
            className={cn('absolute -z-10', overlay.frameClassName, overlay.className)}
            data-icon-card-showcase-overlay={overlay.strength}
            data-icon-card-showcase-overlay-coverage={overlay.coverage}
            data-icon-card-showcase-overlay-direction={overlay.direction}
            data-icon-card-showcase-theme={overlay.tone}
          />
        </>
      ) : null}

      <div
        className={cn(
          regularBlockContainerClasses,
          'relative z-10 flex flex-col',
          sectionGapClasses[resolvedSize],
        )}
      >
        <ShowcaseHeader
          accentTitle={resolvedAccentTitle}
          actions={resolvedActions}
          alignment={resolvedAlignment}
          description={resolvedDescription}
          eyebrow={resolvedEyebrow}
          eyebrowSurface={eyebrowSurface}
          layout={resolvedHeaderLayout}
          linkClassName={image ? overlay.text.link : undefined}
          splitContentAlignment={resolvedSplitContentAlignment}
          textClasses={image ? overlay.text : undefined}
          title={resolvedTitle}
        />

        <div className={cn('grid gap-4 md:gap-6', widthClasses[resolvedCardWidth])}>
          {resolvedCards.map((card) => (
            <ShowcaseCard
              alignment={resolvedCardAlignment}
              card={card}
              height={resolvedCardHeight}
              iconSize={resolvedIconSize}
              key={card.id}
              sectionBackground={appearanceClasses.background}
            />
          ))}
        </div>

        <BlockFooterActions
          actions={footerActions}
          alignment={resolvedAlignment}
          className="mt-0"
        />
      </div>
    </section>
  )
}
