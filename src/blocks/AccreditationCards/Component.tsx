import { Award, type LucideIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'

import {
  resolveBlockAppearanceClasses,
  resolveBlockSurface,
  type BlockAppearance,
  type BlockBackground,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import {
  contentItemDescriptionClasses,
  contentItemTitleClasses,
  contentIntroClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

type CardBackground = 'brand' | 'default' | 'gradient-brand' | 'gradient-subtle' | 'subtle'

type AccreditationValue = {
  cardBackground?: CardBackground | null
  description?: string | null
  icon?: string | null
  id?: string | null
  title?: string | null
}

type AccreditationCardsBlockLike = {
  accentTitle?: string | null
  accreditations?: AccreditationValue[] | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  cardFrame?: 'boxed' | 'grouped' | 'open' | 'stepped' | null
  cardSize?: 'comfortable' | 'compact' | 'default' | null
  columns?: '2' | '3' | '4' | null
  contentAlignment?: 'center' | 'left' | 'right' | null
  description?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  iconStyle?: 'circle' | 'outline' | 'plain' | 'square' | null
  size?: RegularBlockSize | null
  title?: string | null
}

const gridClasses = {
  '2': 'md:grid-cols-2',
  '3': 'md:grid-cols-2 lg:grid-cols-3',
  '4': 'md:grid-cols-2 xl:grid-cols-4',
} as const

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
  right: 'ml-auto items-end text-right',
} as const

const cardSizeClasses = {
  compact: 'p-6',
  default: 'p-8',
  comfortable: 'p-9 sm:p-10',
} as const

const iconStyleClasses = {
  plain: 'size-6',
  square: 'size-11 rounded-compact border border-transparent',
  circle: 'size-11 rounded-full border border-transparent',
  outline: 'size-11 rounded-compact border',
} as const

const steppedGridClasses = {
  '2': '[&>*]:border-b md:[&>*]:border-r md:[&>*]:border-b-0 md:[&>*:nth-child(2n)]:border-r-0 md:[&>*:nth-child(odd)]:border-b md:[&>*:nth-child(even)]:border-t',
  '3': '[&>*]:border-b lg:[&>*]:border-r lg:[&>*]:border-b-0 lg:[&>*:nth-child(3n)]:border-r-0 lg:[&>*:nth-child(odd)]:border-b lg:[&>*:nth-child(even)]:border-t',
  '4': '[&>*]:border-b xl:[&>*]:border-r xl:[&>*]:border-b-0 xl:[&>*:nth-child(4n)]:border-r-0 xl:[&>*:nth-child(odd)]:border-b xl:[&>*:nth-child(even)]:border-t',
} as const

const dividedGridClasses = {
  '2': 'md:[&>*:nth-child(2n)]:border-l',
  '3': 'md:[&>*:nth-child(2n)]:border-l lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n)]:border-l',
  '4': 'md:[&>*:nth-child(2n)]:border-l xl:[&>*:nth-child(4n+3)]:border-l',
} as const

function resolveCardClasses(background: CardBackground, sectionBackground: BlockBackground) {
  if (background === 'subtle') {
    return {
      className: 'border-border bg-subtle text-foreground',
      description: 'text-foreground',
      icon: 'text-primary',
      iconFill: 'border-transparent bg-primary/10',
      iconOutline: 'border-primary/30 bg-transparent',
    }
  }

  if (background === 'brand') {
    return {
      className: 'border-primary-foreground/15 bg-brand text-primary-foreground',
      description: 'text-primary-foreground',
      icon: 'text-primary-foreground',
      iconFill: 'border-transparent bg-primary-foreground/10',
      iconOutline: 'border-primary-foreground/30 bg-transparent',
    }
  }

  if (background === 'gradient-subtle') {
    return {
      className: 'border-border bg-gradient-subtle text-foreground',
      description: 'text-foreground',
      icon: 'text-primary',
      iconFill: 'border-transparent bg-primary/10',
      iconOutline: 'border-primary/30 bg-transparent',
    }
  }

  if (background === 'gradient-brand') {
    return {
      className: 'border-primary-foreground/15 bg-gradient-brand text-primary-foreground',
      description: 'text-primary-foreground',
      icon: 'text-primary-foreground',
      iconFill: 'border-transparent bg-primary-foreground/10',
      iconOutline: 'border-primary-foreground/30 bg-transparent',
    }
  }

  const isBrandSection = resolveBlockSurface(sectionBackground) === 'brand'

  return isBrandSection
    ? {
        className:
          'border-primary-foreground/15 bg-primary-foreground/[0.045] text-primary-foreground',
        description: 'text-primary-foreground',
        icon: 'text-primary-foreground',
        iconFill: 'border-transparent bg-primary-foreground/10',
        iconOutline: 'border-primary-foreground/30 bg-transparent',
      }
    : {
        className: 'border-border bg-card text-card-foreground',
        description: 'text-muted-foreground',
        icon: 'text-primary',
        iconFill: 'border-transparent bg-primary/10',
        iconOutline: 'border-primary/30 bg-transparent',
      }
}

export function AccreditationCardsBlockComponent({
  accentTitle,
  accreditations,
  actions,
  appearance,
  cardFrame = 'stepped',
  cardSize = 'default',
  columns = '4',
  contentAlignment = 'left',
  description,
  eyebrow,
  footerActions,
  iconStyle = 'plain',
  size = 'default',
  title,
}: AccreditationCardsBlockLike) {
  const items = (accreditations ?? []).flatMap((item, index) => {
    const itemTitle = item.title?.trim()
    if (!itemTitle) return []

    return [
      {
        background: item.cardBackground ?? 'default',
        description: item.description?.trim() || undefined,
        icon: item.icon?.trim() || 'Award',
        id: item.id ?? index,
        title: itemTitle,
      },
    ]
  })

  if (!items.length) return null

  const { background, className: appearanceClassName } = resolveBlockAppearanceClasses(appearance)
  const resolvedActions = resolveCmsActions(actions)
  const resolvedAlignment =
    contentAlignment === 'center' || contentAlignment === 'right' ? contentAlignment : 'left'
  const resolvedColumns = columns === '2' || columns === '3' ? columns : '4'
  const resolvedCardFrame =
    cardFrame === 'boxed' || cardFrame === 'grouped' || cardFrame === 'open' ? cardFrame : 'stepped'
  const resolvedCardSize =
    cardSize === 'compact' || cardSize === 'comfortable' ? cardSize : 'default'
  const resolvedIconStyle =
    iconStyle === 'square' || iconStyle === 'circle' || iconStyle === 'outline'
      ? iconStyle
      : 'plain'
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedDescription = description?.trim()
  const hasHeader = Boolean(
    resolvedEyebrow ||
    resolvedTitle ||
    resolvedAccentTitle ||
    resolvedDescription ||
    resolvedActions.length,
  )

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[size ?? 'default'], appearanceClassName)}
      data-accreditation-cards="true"
    >
      <div className={regularBlockContainerClasses}>
        <div className="flex flex-col gap-10 md:gap-12">
          {hasHeader ? (
            <header
              className={cn(contentIntroClasses, alignmentClasses[resolvedAlignment])}
              data-content-alignment={resolvedAlignment}
            >
              {resolvedEyebrow ? (
                <SectionEyebrow surface={background}>{resolvedEyebrow}</SectionEyebrow>
              ) : null}
              {resolvedTitle || resolvedAccentTitle ? (
                <h2 className={contentSectionHeadingClasses}>
                  {resolvedTitle ? (
                    <span className="block font-[inherit]">{resolvedTitle}</span>
                  ) : null}
                  {resolvedAccentTitle ? (
                    <em className="block font-[inherit]">{resolvedAccentTitle}</em>
                  ) : null}
                </h2>
              ) : null}
              {resolvedDescription ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}
              <ContentActions actions={resolvedActions} alignment={resolvedAlignment} />
            </header>
          ) : null}

          <div
            className={cn(
              (resolvedCardFrame === 'open' || resolvedCardFrame === 'grouped') &&
                'overflow-hidden',
              resolvedCardFrame === 'grouped' && 'rounded-card border border-current/15',
            )}
            data-card-frame={resolvedCardFrame}
          >
            <div
              className={cn(
                'grid grid-cols-1',
                gridClasses[resolvedColumns],
                resolvedCardFrame === 'stepped'
                  ? ['gap-0', steppedGridClasses[resolvedColumns]]
                  : resolvedCardFrame === 'open' || resolvedCardFrame === 'grouped'
                    ? ['-mb-px gap-0', dividedGridClasses[resolvedColumns]]
                    : 'gap-5 lg:gap-6',
              )}
            >
              {items.map((item) => {
                const Icon =
                  ((LucideIcons as Record<string, unknown>)[item.icon] as LucideIcon | undefined) ??
                  Award
                const card = resolveCardClasses(item.background, background)
                const usesDividedFrame =
                  resolvedCardFrame === 'open' || resolvedCardFrame === 'grouped'

                return (
                  <article
                    className={cn(
                      'flex flex-col',
                      cardSizeClasses[resolvedCardSize],
                      card.className,
                      resolvedCardFrame === 'boxed' && 'rounded-card border',
                      resolvedCardFrame === 'stepped' && 'border-current/15',
                      usesDividedFrame && 'border-b border-current/15',
                      usesDividedFrame && item.background === 'default' && 'bg-transparent',
                    )}
                    data-card-background={item.background}
                    key={item.id}
                  >
                    <div className="flex items-start gap-4 sm:gap-5">
                      <span
                        className={cn(
                          'mt-0.5 flex shrink-0 items-center justify-center',
                          iconStyleClasses[resolvedIconStyle],
                          (resolvedIconStyle === 'square' || resolvedIconStyle === 'circle') &&
                            card.iconFill,
                          resolvedIconStyle === 'outline' && card.iconOutline,
                        )}
                      >
                        <Icon
                          aria-hidden="true"
                          className={cn(
                            resolvedIconStyle === 'plain' ? 'size-6' : 'size-5',
                            card.icon,
                          )}
                        />
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <h3 className={contentItemTitleClasses}>{item.title}</h3>
                        {item.description ? (
                          <p className={cn(contentItemDescriptionClasses, card.description)}>
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>

        <BlockFooterActions actions={footerActions} />
      </div>
    </section>
  )
}
