import type { ReactNode } from 'react'

import type { BlockAppearance, BlockBackground } from '@/blocks/shared/blockAppearance'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import { resolveCardSurface } from '@/blocks/shared/cardSurface'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
} from '@/blocks/shared/blockSpacing'
import {
  contentIntroClasses,
  contentItemDescriptionClasses,
  contentItemMetadataClasses,
  contentItemTitleClasses,
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow } from '@/components/SectionEyebrow'
import type { ResolvedCmsAction } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'

export type ContentHighlightsAlignment = 'center' | 'left' | 'right'
export type ContentHighlightsCardLayout = 'grid' | 'list'
export type ContentHighlightsCardStyle = 'boxed' | 'divided' | 'leftRule' | 'open'
export type ContentHighlightsEyebrowPlacement = 'inline' | 'stacked'
export type ContentHighlightsGridColumns = '2' | '3'
export type ContentHighlightsHeaderLayout = 'split' | 'stacked'
export type ContentHighlightsItemsLayout = '1' | '2' | '3' | '4'
export type ContentHighlightsItemTreatment = 'auto' | 'boxed' | 'open' | 'ruled'
export type ContentHighlightsLayout = 'editorialRow' | 'highlightsGrid' | 'simpleGrid'
export type ContentHighlightsLegacyLayout = ContentHighlightsLayout | 'numberedSteps'
export type ContentHighlightsRuledDividers = 'grid' | 'individual' | 'rows'
export type ContentHighlightsSize = 'none' | 'comfortable' | 'compact' | 'default'
export type ContentHighlightsSplitAlignment = 'bottom' | 'center' | 'top'

export type ContentHighlightItem = {
  cardAction?: ResolvedCmsAction
  cardBackground?: string | null
  description?: string
  markerLabel?: string
  markerMode: 'custom' | 'hidden' | 'numbered'
  metadata?: string
  title: string
}

export type ContentHighlightsProps = {
  accentTitle?: string | null
  actions?: ReactNode
  appearance?: BlockAppearance | null
  cardLayout?: ContentHighlightsCardLayout | null
  cardStyle?: ContentHighlightsCardStyle | null
  contentAlignment?: ContentHighlightsAlignment
  description?: string | null
  eyebrow?: string | null
  eyebrowPlacement?: ContentHighlightsEyebrowPlacement | null
  gridColumns?: ContentHighlightsGridColumns | null
  headerLayout?: ContentHighlightsHeaderLayout
  itemsLayout?: ContentHighlightsItemsLayout | null
  itemTreatment?: ContentHighlightsItemTreatment | null
  items: ContentHighlightItem[]
  layout?: ContentHighlightsLegacyLayout | null
  ruledDividers?: ContentHighlightsRuledDividers | null
  size?: ContentHighlightsSize
  splitContentAlignment?: ContentHighlightsSplitAlignment
  title?: string | null
}

const itemLayoutClasses = {
  '1': 'grid grid-cols-1 gap-x-6 gap-y-8',
  '2': 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2',
  '3': 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-3',
  '4': 'grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 xl:grid-cols-4',
} as const satisfies Record<ContentHighlightsItemsLayout, string>

const dividedItemLayoutClasses = {
  '1': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t',
  '2': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t md:grid-cols-2 md:[&>*:nth-child(-n+2)]:border-t',
  '3': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t md:grid-cols-2 md:[&>*:nth-child(-n+2)]:border-t lg:grid-cols-3 lg:[&>*:nth-child(-n+3)]:border-t',
  '4': 'grid grid-cols-1 gap-0 [&>*:first-child]:border-t md:grid-cols-2 md:[&>*:nth-child(-n+2)]:border-t xl:grid-cols-4 xl:[&>*:nth-child(-n+4)]:border-t',
} as const satisfies Record<ContentHighlightsItemsLayout, string>

const dividedColumnClasses = {
  '1': undefined,
  '2': 'md:[&>*:nth-child(2n)]:border-l',
  '3': 'md:[&>*:nth-child(2n)]:border-l lg:[&>*:nth-child(3n+1)]:border-l-0 lg:[&>*:nth-child(3n+2)]:border-l lg:[&>*:nth-child(3n)]:border-l',
  '4': 'md:[&>*:nth-child(2n)]:border-l xl:[&>*:nth-child(4n+1)]:border-l-0 xl:[&>*:nth-child(4n+2)]:border-l xl:[&>*:nth-child(4n+3)]:border-l xl:[&>*:nth-child(4n)]:border-l',
} as const satisfies Record<ContentHighlightsItemsLayout, string | undefined>

const horizontalAlignmentClasses = {
  center: 'mx-auto items-center text-center',
  left: 'items-start text-left',
  right: 'ml-auto items-end text-right',
} as const satisfies Record<ContentHighlightsAlignment, string>

const splitAlignmentClasses = {
  bottom: 'lg:self-end',
  center: 'lg:self-center',
  top: 'lg:self-start',
} as const satisfies Record<ContentHighlightsSplitAlignment, string>

const sectionGapClasses = {
  none: 'gap-10',
  compact: 'gap-8',
  default: 'gap-10',
  comfortable: 'gap-12',
} as const satisfies Record<ContentHighlightsSize, string>

type ResolvedContentHighlightsItemTreatment = Exclude<ContentHighlightsItemTreatment, 'auto'>

type ResolvedContentHighlightsPresentation = {
  cardStyle: ContentHighlightsCardStyle
  eyebrowPlacement: ContentHighlightsEyebrowPlacement
  itemsLayout: ContentHighlightsItemsLayout
}

const automaticItemTreatments = {
  editorialRow: 'ruled',
  highlightsGrid: 'boxed',
  simpleGrid: 'open',
} as const satisfies Record<ContentHighlightsLayout, ResolvedContentHighlightsItemTreatment>

function resolveItemTreatment(
  itemTreatment: ContentHighlightsItemTreatment | null | undefined,
  layout: ContentHighlightsLayout,
): ResolvedContentHighlightsItemTreatment {
  return itemTreatment === 'open' || itemTreatment === 'ruled' || itemTreatment === 'boxed'
    ? itemTreatment
    : automaticItemTreatments[layout]
}

function resolveContentHighlightsPresentation({
  cardLayout,
  cardStyle,
  eyebrowPlacement,
  gridColumns,
  itemsLayout,
  itemTreatment,
  layout,
  ruledDividers,
}: Pick<
  ContentHighlightsProps,
  | 'cardLayout'
  | 'cardStyle'
  | 'eyebrowPlacement'
  | 'gridColumns'
  | 'itemsLayout'
  | 'itemTreatment'
  | 'layout'
  | 'ruledDividers'
>): ResolvedContentHighlightsPresentation {
  const legacyItemsLayout: ContentHighlightsItemsLayout =
    cardLayout === 'list'
      ? '1'
      : cardLayout === 'grid'
        ? gridColumns === '2'
          ? '2'
          : '3'
        : layout === 'editorialRow'
          ? '1'
          : layout === 'simpleGrid'
            ? '2'
            : '3'
  const legacyEyebrowPlacement: ContentHighlightsEyebrowPlacement =
    layout === 'simpleGrid' ? 'inline' : 'stacked'
  const legacyCardStyle: ContentHighlightsCardStyle =
    itemTreatment === 'open'
      ? 'open'
      : itemTreatment === 'boxed'
        ? 'boxed'
        : itemTreatment === 'ruled'
          ? ruledDividers === 'individual'
            ? 'leftRule'
            : 'divided'
          : layout === 'editorialRow'
            ? 'divided'
            : layout === 'highlightsGrid' || layout === 'numberedSteps'
              ? 'boxed'
              : 'open'

  return {
    cardStyle:
      cardStyle === 'leftRule' ||
      cardStyle === 'boxed' ||
      cardStyle === 'divided' ||
      cardStyle === 'open'
        ? cardStyle
        : legacyCardStyle,
    eyebrowPlacement:
      eyebrowPlacement === 'inline' || eyebrowPlacement === 'stacked'
        ? eyebrowPlacement
        : legacyEyebrowPlacement,
    itemsLayout:
      itemsLayout === '1' || itemsLayout === '2' || itemsLayout === '3' || itemsLayout === '4'
        ? itemsLayout
        : legacyItemsLayout,
  }
}

function ContentHighlightsIntro({
  accentTitle,
  actions,
  className,
  description,
  eyebrow,
  surface,
  title,
}: Pick<ContentHighlightsProps, 'accentTitle' | 'actions' | 'description' | 'eyebrow' | 'title'> & {
  className?: string
  surface: BlockBackground
}) {
  const resolvedAccentTitle = accentTitle?.trim() || undefined

  return (
    <div className={cn(contentIntroClasses, className)}>
      {eyebrow ? <SectionEyebrow surface={surface}>{eyebrow}</SectionEyebrow> : null}
      <h2 className={contentSectionHeadingClasses}>
        {resolvedAccentTitle ? (
          <>
            <span className="block font-[inherit]">{title}</span>
            <em className="block font-[inherit]">{resolvedAccentTitle}</em>
          </>
        ) : (
          title
        )}
      </h2>
      {description ? <p className={contentSectionDescriptionClasses}>{description}</p> : null}
      {actions}
    </div>
  )
}

function resolveMarker(item: ContentHighlightItem, index: number) {
  if (item.markerMode === 'hidden') return undefined
  if (item.markerMode === 'custom') {
    return item.markerLabel?.trim() || String(index + 1).padStart(2, '0')
  }
  return String(index + 1).padStart(2, '0')
}

function HighlightBody({
  actionFooter,
  eyebrowPlacement,
  hasAction,
  inlineRailClassName,
  item,
  marker,
  markerSurface,
  secondaryClassName,
}: {
  actionFooter?: ReactNode
  eyebrowPlacement: ContentHighlightsEyebrowPlacement
  hasAction: boolean
  inlineRailClassName: string
  item: ContentHighlightItem
  marker?: string
  markerSurface: string
  secondaryClassName: string
}) {
  const eyebrow = marker ? (
    <p
      className={cn(contentItemMetadataClasses, eyebrowPlacement === 'inline' && 'pt-1')}
      data-content-highlight-marker={marker}
      data-section-eyebrow-surface={markerSurface}
    >
      {marker}
    </p>
  ) : null
  const textContent = (
    <div className={cn('flex min-w-0 flex-col gap-2', hasAction && 'pb-6')}>
      {item.metadata ? (
        <p
          className={cn('text-sm leading-5 font-medium', secondaryClassName)}
          data-content-highlight-metadata="true"
        >
          {item.metadata}
        </p>
      ) : null}
      <h3 className={contentItemTitleClasses}>{item.title}</h3>
      {item.description ? (
        <p
          className={cn(
            contentItemDescriptionClasses,
            'max-w-[65ch] leading-6',
            secondaryClassName,
          )}
        >
          {item.description}
        </p>
      ) : null}
    </div>
  )

  if (eyebrowPlacement === 'inline') {
    return (
      <div
        className={cn('grid min-h-full flex-1 gap-x-5 gap-y-2', marker && inlineRailClassName)}
        data-content-highlight-eyebrow-placement="inline"
      >
        {eyebrow}
        <div className="flex min-w-0 flex-col" data-content-highlight-inline-content="true">
          {textContent}
          {actionFooter}
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex min-w-0 flex-1 flex-col gap-2"
      data-content-highlight-eyebrow-placement="stacked"
    >
      {eyebrow}
      {textContent}
      {actionFooter}
    </div>
  )
}

function ContentHighlightItemComponent({
  cardLayout,
  cardStyle,
  eyebrowPlacement,
  index,
  item,
  itemsLayout,
  sectionBackground,
}: {
  cardLayout: ContentHighlightsCardLayout
  cardStyle: ContentHighlightsCardStyle
  eyebrowPlacement: ContentHighlightsEyebrowPlacement
  index: number
  item: ContentHighlightItem
  itemsLayout: ContentHighlightsItemsLayout
  sectionBackground: BlockBackground
}) {
  const surface = resolveCardSurface(item.cardBackground, sectionBackground)
  const marker = resolveMarker(item, index)
  const markerSurface = surface.value === 'default' ? sectionBackground : surface.value
  const hasAction = Boolean(item.cardAction)
  const inlineRailClassName =
    cardStyle === 'divided' && itemsLayout === '1'
      ? 'grid-cols-[3.5rem_minmax(0,1fr)] md:grid-cols-[8rem_minmax(0,1fr)]'
      : 'grid-cols-[3.5rem_minmax(0,1fr)]'
  const actionFooter = item.cardAction ? (
    <div
      className={cn('mt-auto border-t pt-4', surface.divider)}
      data-content-highlight-action-footer="true"
    >
      <ContentActions
        actions={[item.cardAction]}
        alignment="left"
        buttonClassNames={surface.button}
        className="w-auto"
        linkClassName={surface.link}
      />
    </div>
  ) : null
  const body = (
    <HighlightBody
      actionFooter={actionFooter}
      eyebrowPlacement={eyebrowPlacement}
      hasAction={hasAction}
      inlineRailClassName={inlineRailClassName}
      item={item}
      marker={marker}
      markerSurface={markerSurface}
      secondaryClassName={surface.secondary}
    />
  )
  const treatmentClasses =
    cardStyle === 'boxed'
      ? cn('rounded-card border p-6 md:p-7', surface.className, surface.divider)
      : cardStyle === 'leftRule'
        ? cn('border-l-2 p-6 md:p-7', surface.className, surface.divider)
        : cardStyle === 'divided'
          ? cn('border-b px-6 py-8 md:px-7 md:py-10', surface.className, surface.divider)
          : cn(surface.value !== 'default' && 'p-6 md:p-7', surface.className)
  const articleClasses = cn('flex min-w-0 flex-col', treatmentClasses)

  return (
    <article
      className={articleClasses}
      data-card-background={surface.value}
      data-content-highlight-item="true"
      data-content-highlight-presentation={cardLayout}
      data-content-highlight-style={cardStyle}
    >
      {body}
    </article>
  )
}

function ContentHighlightsItems({
  cardStyle,
  eyebrowPlacement,
  items,
  itemsLayout,
  sectionBackground,
}: {
  cardStyle: ContentHighlightsCardStyle
  eyebrowPlacement: ContentHighlightsEyebrowPlacement
  items: ContentHighlightItem[]
  itemsLayout: ContentHighlightsItemsLayout
  sectionBackground: BlockBackground
}) {
  const isDivided = cardStyle === 'divided'
  const cardLayout: ContentHighlightsCardLayout = 'grid'
  const gridClasses = isDivided
    ? dividedItemLayoutClasses[itemsLayout]
    : itemLayoutClasses[itemsLayout]
  const columnDividerClasses = isDivided ? dividedColumnClasses[itemsLayout] : undefined

  return (
    <div data-content-highlights-items="true">
      <div className={cn(gridClasses, columnDividerClasses)} data-content-highlights-grid="true">
        {items.map((item, index) => (
          <ContentHighlightItemComponent
            cardLayout={cardLayout}
            cardStyle={cardStyle}
            eyebrowPlacement={eyebrowPlacement}
            index={index}
            item={item}
            itemsLayout={itemsLayout}
            key={`${item.title}-${index}`}
            sectionBackground={sectionBackground}
          />
        ))}
      </div>
    </div>
  )
}

export function ContentHighlights({
  accentTitle,
  actions,
  appearance,
  cardLayout,
  cardStyle,
  contentAlignment = 'left',
  description,
  eyebrow,
  eyebrowPlacement,
  gridColumns,
  headerLayout = 'stacked',
  itemsLayout,
  itemTreatment = 'auto',
  items,
  layout,
  ruledDividers = 'rows',
  size = 'default',
  splitContentAlignment = 'top',
  title,
}: ContentHighlightsProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const resolvedPresentation = resolveContentHighlightsPresentation({
    cardLayout,
    cardStyle,
    eyebrowPlacement,
    gridColumns,
    itemsLayout,
    itemTreatment,
    layout,
    ruledDividers,
  })
  const resolvedAlignment =
    contentAlignment === 'center' || contentAlignment === 'right' ? contentAlignment : 'left'
  const resolvedHeaderLayout = headerLayout === 'split' ? 'split' : 'stacked'
  const resolvedLayout: ContentHighlightsLayout =
    layout === 'editorialRow' || layout === 'simpleGrid' ? layout : 'highlightsGrid'
  const resolvedItemTreatment = resolveItemTreatment(itemTreatment, resolvedLayout)
  const resolvedRuledDividers: ContentHighlightsRuledDividers =
    ruledDividers === 'grid' || ruledDividers === 'individual' ? ruledDividers : 'rows'
  const resolvedSize: ContentHighlightsSize =
    size === 'none' || size === 'compact' || size === 'comfortable' ? size : 'default'
  const resolvedSplitAlignment: ContentHighlightsSplitAlignment =
    splitContentAlignment === 'bottom' || splitContentAlignment === 'center'
      ? splitContentAlignment
      : 'top'
  const isSplit = resolvedHeaderLayout === 'split'
  const resolvedCardLayout: ContentHighlightsCardLayout = 'grid'
  const resolvedGridColumns = resolvedPresentation.itemsLayout
  const sectionBackground: BlockBackground = appearance?.background ?? 'none'

  return (
    <section
      className={cn(regularBlockMobilePaddingClasses[resolvedSize], appearanceClasses.className)}
      data-content-highlights="true"
      data-content-highlights-alignment={resolvedAlignment}
      data-content-highlights-background={appearance?.background ?? 'none'}
      data-content-highlights-card-layout={resolvedCardLayout}
      data-content-highlights-card-style={resolvedPresentation.cardStyle}
      data-content-highlights-eyebrow-placement={resolvedPresentation.eyebrowPlacement}
      data-content-highlights-grid-columns={resolvedGridColumns}
      data-content-highlights-header-layout={resolvedHeaderLayout}
      data-content-highlights-item-treatment={resolvedItemTreatment}
      data-content-highlights-items-layout={resolvedPresentation.itemsLayout}
      data-content-highlights-layout={resolvedLayout}
      data-content-highlights-ruled-dividers={resolvedRuledDividers}
      data-content-highlights-size={resolvedSize}
      data-content-highlights-split-alignment={resolvedSplitAlignment}
    >
      <div className={regularBlockContainerClasses}>
        {isSplit ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16">
            <ContentHighlightsIntro
              accentTitle={accentTitle}
              actions={actions}
              className={splitAlignmentClasses[resolvedSplitAlignment]}
              description={description}
              eyebrow={eyebrow}
              surface={sectionBackground}
              title={title}
            />
            <ContentHighlightsItems
              cardStyle={resolvedPresentation.cardStyle}
              eyebrowPlacement={resolvedPresentation.eyebrowPlacement}
              items={items}
              itemsLayout={resolvedPresentation.itemsLayout}
              sectionBackground={sectionBackground}
            />
          </div>
        ) : (
          <div className={cn('flex flex-col', sectionGapClasses[resolvedSize])}>
            <ContentHighlightsIntro
              accentTitle={accentTitle}
              actions={actions}
              className={horizontalAlignmentClasses[resolvedAlignment]}
              description={description}
              eyebrow={eyebrow}
              surface={sectionBackground}
              title={title}
            />
            <ContentHighlightsItems
              cardStyle={resolvedPresentation.cardStyle}
              eyebrowPlacement={resolvedPresentation.eyebrowPlacement}
              items={items}
              itemsLayout={resolvedPresentation.itemsLayout}
              sectionBackground={sectionBackground}
            />
          </div>
        )}
      </div>
    </section>
  )
}
