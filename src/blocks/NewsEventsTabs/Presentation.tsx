import { NewsEventsTabsClient } from '@/blocks/NewsEventsTabs/NewsEventsTabsClient'
import {
  alignNewsEventsTabsGroups,
  getNewsEventsTabsClientStateKey,
  normalizeNewsEventsTabsItemsPerTab,
  normalizeNewsEventsTabsLayoutStyle,
  resolveNewsEventsTabs,
  resolveNewsEventsTabsLoadMoreLabel,
  type NewsEventsTabsCardsPerRow,
  type NewsEventsTabsLayoutStyle,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import { normalizeContentTabVariant, type ContentTabVariant } from '@/blocks/shared/contentTabRail'
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
import { createEmptyNewsEventGroups, type PublicNewsEventGroups } from '@/lib/newsEventsShared'
import { cn } from '@/lib/utils'

type NewsEventsTabsAlignment = 'center' | 'left'
type NewsEventsTabsHeaderActionAlignment = 'bottom' | 'center' | 'top'

export type NewsEventsTabsBlockLike = {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  allTabLabel?: string | null
  appearance?: BlockAppearance | null
  cardsPerRow?: NewsEventsTabsCardsPerRow | null
  classifications?: unknown
  contentAlignment?: NewsEventsTabsAlignment | null
  description?: string | null
  emptyStateMessage?: string | null
  eventActionLabel?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  headerActionAlignment?: NewsEventsTabsHeaderActionAlignment | null
  itemsPerTab?: number | string | null
  layoutStyle?: NewsEventsTabsLayoutStyle | null
  loadMoreLabel?: string | null
  newsActionLabel?: string | null
  size?: RegularBlockSize | null
  tabVariant?: ContentTabVariant | string | null
  title?: string | null
}

type NewsEventsTabsBlockPresentationProps = NewsEventsTabsBlockLike & {
  groups?: PublicNewsEventGroups
}

const alignmentClasses = {
  left: 'items-start text-left',
  center: 'mx-auto items-center text-center',
} as const

export function NewsEventsTabsBlockPresentation({
  accentTitle,
  actions,
  allTabLabel,
  appearance,
  cardsPerRow,
  classifications,
  contentAlignment = 'left',
  description,
  emptyStateMessage,
  eventActionLabel,
  eyebrow,
  footerActions,
  groups,
  headerActionAlignment = 'center',
  itemsPerTab,
  layoutStyle,
  loadMoreLabel,
  newsActionLabel,
  size = 'default',
  tabVariant,
  title,
}: NewsEventsTabsBlockPresentationProps) {
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
  const resolvedTabs = resolveNewsEventsTabs(allTabLabel, classifications)
  const resolvedGroups = alignNewsEventsTabsGroups(
    groups ?? createEmptyNewsEventGroups(),
    resolvedTabs,
  )
  const resolvedItemsPerTab = normalizeNewsEventsTabsItemsPerTab(itemsPerTab)
  const clientStateKey = getNewsEventsTabsClientStateKey(
    resolvedGroups,
    resolvedTabs,
    resolvedItemsPerTab,
  )
  const resolvedTitle = title?.trim()
  const resolvedActions = resolveCmsActions(actions)
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
      data-news-events-tabs-block="true"
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
            data-news-events-tabs-header-action-alignment={resolvedHeaderActionAlignment}
            data-news-events-tabs-header="true"
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
                data-news-events-tabs-actions="true"
              />
            ) : null}
          </div>
        ) : null}

        <NewsEventsTabsClient
          key={clientStateKey}
          cardsPerRow={cardsPerRow}
          emptyStateMessage={emptyStateMessage?.trim() || 'No entries in this classification.'}
          eventActionLabel={eventActionLabel?.trim() || 'View details'}
          groups={resolvedGroups}
          itemsPerTab={resolvedItemsPerTab}
          layoutStyle={normalizeNewsEventsTabsLayoutStyle(layoutStyle)}
          loadMoreLabel={resolveNewsEventsTabsLoadMoreLabel(loadMoreLabel)}
          newsActionLabel={newsActionLabel?.trim() || 'Read update'}
          tabs={resolvedTabs}
          tabSurface={appearanceClasses.surface}
          variant={normalizeContentTabVariant(tabVariant)}
        />

        <BlockFooterActions
          actions={footerActions}
          alignment={resolvedAlignment === 'center' ? 'center' : 'left'}
        />
      </div>
    </section>
  )
}
