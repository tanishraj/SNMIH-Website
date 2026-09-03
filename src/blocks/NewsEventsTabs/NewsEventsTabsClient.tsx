'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'

import { NewsEventsTabsCard } from '@/blocks/NewsEventsTabs/NewsEventsTabsCard'
import { NewsEventsTabsRow } from '@/blocks/NewsEventsTabs/NewsEventsTabsRow'
import {
  getNewsEventsTabsGridClasses,
  type NewsEventsTabsCardsPerRow,
  type NewsEventsTabsItemsPerTab,
  type NewsEventsTabsLayoutStyle,
  type NewsEventsTabsResolvedTab,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import {
  getContentTabClasses,
  type ContentTabSurface,
  type ContentTabVariant,
} from '@/blocks/shared/contentTabRail'
import { ScrollableContentTabRail } from '@/blocks/shared/ScrollableContentTabRail'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty'
import {
  createEmptyNewsEventPage,
  type PublicNewsEventGroups,
  type PublicNewsEventPage,
} from '@/lib/newsEventsShared'
import { cn } from '@/lib/utils'

type TabPageState = PublicNewsEventPage & {
  hasError: boolean
  isLoading: boolean
}

const createInitialTabState = (
  groups: PublicNewsEventGroups,
  tabs: readonly NewsEventsTabsResolvedTab[],
): Record<string, TabPageState> =>
  Object.fromEntries(
    tabs.map(({ value }) => {
      const page = groups[value] ?? createEmptyNewsEventPage()

      return [
        value,
        {
          ...page,
          docs: [...page.docs],
          hasError: false,
          isLoading: false,
        },
      ]
    }),
  )

type NewsEventsTabsClientProps = {
  cardsPerRow?: NewsEventsTabsCardsPerRow | null
  emptyStateMessage: string
  eventActionLabel: string
  groups: PublicNewsEventGroups
  itemsPerTab: NewsEventsTabsItemsPerTab
  layoutStyle: NewsEventsTabsLayoutStyle
  loadMoreLabel: string
  newsActionLabel: string
  tabs: readonly NewsEventsTabsResolvedTab[]
  tabSurface?: ContentTabSurface
  variant: ContentTabVariant
}

export function NewsEventsTabsClient({
  cardsPerRow,
  emptyStateMessage,
  eventActionLabel,
  groups,
  itemsPerTab,
  layoutStyle,
  loadMoreLabel,
  newsActionLabel,
  tabs,
  tabSurface = 'light',
  variant,
}: NewsEventsTabsClientProps) {
  const instanceID = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const [activeTab, setActiveTab] = useState<string>('all')
  const [pages, setPages] = useState(() => createInitialTabState(groups, tabs))
  const resolvedActiveTab = tabs.some(({ value }) => value === activeTab) ? activeTab : 'all'
  const activePage = pages[resolvedActiveTab] ?? {
    ...createEmptyNewsEventPage(),
    hasError: false,
    isLoading: false,
  }
  const activeItems = activePage.docs
  const selectedIDs = tabs.flatMap(({ value }) => (value === 'all' ? [] : [value]))

  const selectTab = (index: number) => {
    const tab = tabs[index]
    if (!tab) return

    setActiveTab(tab.value)
    const nextButton = tabRefs.current[index]
    nextButton?.focus()
    nextButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const lastIndex = tabs.length - 1
    let nextIndex: number | undefined

    if (event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1
    if (event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = lastIndex

    if (nextIndex === undefined) return

    event.preventDefault()
    selectTab(nextIndex)
  }

  const loadNextPage = async () => {
    const classification = resolvedActiveTab
    const currentPage = pages[classification]

    if (currentPage.isLoading || (!currentPage.hasNextPage && !currentPage.hasError)) return

    setPages((current) => ({
      ...current,
      [classification]: {
        ...current[classification],
        hasError: false,
        isLoading: true,
      },
    }))

    try {
      const params = new URLSearchParams({ classification })
      if (selectedIDs.length > 0) params.set('classifications', selectedIDs.join(','))
      params.set('limit', String(itemsPerTab))
      params.set('page', String(currentPage.page + 1))
      const response = await fetch(`/api/news-events-tabs?${params}`, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) throw new Error('Unable to load News & Events.')

      const nextPage = (await response.json()) as PublicNewsEventPage

      if (!Array.isArray(nextPage.docs) || !Number.isInteger(nextPage.page)) {
        throw new Error('Invalid News & Events response.')
      }

      setPages((current) => {
        const currentClassification = current[classification]
        const ids = new Set(currentClassification.docs.map(({ id }) => id))
        const docs = [
          ...currentClassification.docs,
          ...nextPage.docs.filter(({ id }) => !ids.has(id)),
        ]

        return {
          ...current,
          [classification]: {
            docs,
            hasError: false,
            hasNextPage: nextPage.hasNextPage,
            isLoading: false,
            page: nextPage.page,
          },
        }
      })
    } catch {
      setPages((current) => ({
        ...current,
        [classification]: {
          ...current[classification],
          hasError: true,
          isLoading: false,
        },
      }))
    }
  }

  return (
    <div className="flex flex-col gap-8" data-news-events-tabs-content="true">
      <div className="pb-1" data-news-events-tabs-list-wrap="true">
        <ScrollableContentTabRail className="w-full" surface={tabSurface} variant={variant}>
          <div
            aria-label="News and events classifications"
            className="flex w-max min-w-full flex-nowrap"
            data-content-tab-variant={variant}
            role="tablist"
          >
            {tabs.map((tab, index) => {
              const isActive = resolvedActiveTab === tab.value
              const tabID = `${instanceID}-tab-${tab.value}`
              const panelID = `${instanceID}-panel-${tab.value}`

              return (
                <button
                  aria-controls={panelID}
                  aria-selected={isActive}
                  className={getContentTabClasses(variant, isActive, tabSurface)}
                  id={tabID}
                  key={tab.value}
                  onClick={() => selectTab(index)}
                  onKeyDown={(event) => handleTabKeyDown(event, index)}
                  ref={(node) => {
                    tabRefs.current[index] = node
                  }}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </ScrollableContentTabRail>
      </div>

      <div
        aria-labelledby={`${instanceID}-tab-${resolvedActiveTab}`}
        id={`${instanceID}-panel-${resolvedActiveTab}`}
        role="tabpanel"
        tabIndex={0}
      >
        {activeItems.length > 0 ? (
          <>
            <div
              className={cn(
                layoutStyle === 'editorialList'
                  ? 'border-b border-border'
                  : cn('grid items-stretch gap-4', getNewsEventsTabsGridClasses(cardsPerRow)),
              )}
              data-news-events-tabs-items="true"
              data-news-events-tabs-layout={layoutStyle}
            >
              {activeItems.map((item) =>
                layoutStyle === 'editorialList' ? (
                  <NewsEventsTabsRow item={item} key={item.id} />
                ) : (
                  <NewsEventsTabsCard
                    eventActionLabel={eventActionLabel}
                    item={item}
                    key={item.id}
                    newsActionLabel={newsActionLabel}
                  />
                ),
              )}
            </div>

            {activePage.hasNextPage || activePage.hasError ? (
              <div className="mt-8 flex justify-center">
                <Button
                  aria-live="polite"
                  disabled={activePage.isLoading}
                  onClick={loadNextPage}
                  type="button"
                  variant="outline"
                >
                  {activePage.isLoading
                    ? 'Loading…'
                    : activePage.hasError
                      ? 'Retry'
                      : loadMoreLabel}
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <Empty className="min-h-56 rounded-card border border-border bg-card text-card-foreground">
            <EmptyHeader>
              <EmptyDescription>{emptyStateMessage}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </div>
  )
}
