import {
  getNewsEventClassificationRelationshipIDs,
  normalizeNewsEventClassificationRecord,
  type ResolvedNewsEventClassification,
} from '@/lib/newsEventClassifications'
import { createEmptyNewsEventPage, type PublicNewsEventGroups } from '@/lib/newsEventsShared'

export type NewsEventsTabsResolvedTab = {
  classification?: ResolvedNewsEventClassification
  label: string
  value: 'all' | string
}

export function getNewsEventsTabsClassificationRelationshipIDs(value: unknown): string[] {
  return getNewsEventClassificationRelationshipIDs(value)
}

export function resolveNewsEventsTabs(
  allTabLabel?: string | null,
  classifications?: unknown,
): NewsEventsTabsResolvedTab[] {
  const resolved: NewsEventsTabsResolvedTab[] = [
    { label: allTabLabel?.trim() || 'All', value: 'all' },
  ]
  const relationshipValues = Array.isArray(classifications) ? classifications : []

  const seen = new Set<string>()

  for (const value of relationshipValues) {
    const classification = normalizeNewsEventClassificationRecord(value)

    if (
      !classification ||
      !classification.active ||
      !classification.title.trim() ||
      seen.has(classification.id)
    ) {
      continue
    }

    seen.add(classification.id)
    resolved.push({
      classification,
      label: classification.title,
      value: classification.id,
    })
  }

  return resolved
}

export function alignNewsEventsTabsGroups(
  groups: PublicNewsEventGroups,
  tabs: readonly NewsEventsTabsResolvedTab[],
): PublicNewsEventGroups {
  const aligned: PublicNewsEventGroups = {
    all: groups.all ?? createEmptyNewsEventPage(),
  }

  for (const tab of tabs) {
    if (tab.value === 'all') continue

    aligned[tab.value] = groups[tab.value] ?? createEmptyNewsEventPage()
  }

  return aligned
}

export const NEWS_EVENTS_TABS_DEFAULT_ITEMS_PER_TAB = 6
export const NEWS_EVENTS_TABS_DEFAULT_LOAD_MORE_LABEL = 'Load More'
export const NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS = 50

export const NEWS_EVENTS_TABS_ITEM_VALUES = ['3', '6', '9', '12'] as const

export type NewsEventsTabsItemsPerTabValue = (typeof NEWS_EVENTS_TABS_ITEM_VALUES)[number]
export type NewsEventsTabsItemsPerTab = 3 | 6 | 9 | 12
export type NewsEventsTabsCardsPerRow = '2' | '3' | '4'

export const NEWS_EVENTS_TABS_LAYOUT_STYLES = ['cardGrid', 'editorialList'] as const

export type NewsEventsTabsLayoutStyle = (typeof NEWS_EVENTS_TABS_LAYOUT_STYLES)[number]

const gridClassesByCardsPerRow = {
  '2': 'grid-cols-1 md:grid-cols-2',
  '3': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  '4': 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
} as const satisfies Record<NewsEventsTabsCardsPerRow, string>

export function normalizeNewsEventsTabsItemsPerTab(
  value?: number | string | null,
): NewsEventsTabsItemsPerTab {
  const parsed = typeof value === 'string' ? Number.parseInt(value, 10) : value

  return isNewsEventsTabsItemsPerTab(parsed) ? parsed : NEWS_EVENTS_TABS_DEFAULT_ITEMS_PER_TAB
}

export function isNewsEventsTabsItemsPerTab(value: unknown): value is NewsEventsTabsItemsPerTab {
  return value === 3 || value === 6 || value === 9 || value === 12
}

export function resolveNewsEventsTabsLoadMoreLabel(value?: string | null): string {
  return value?.trim() || NEWS_EVENTS_TABS_DEFAULT_LOAD_MORE_LABEL
}

export function normalizeNewsEventsTabsCardsPerRow(
  value?: string | null,
): NewsEventsTabsCardsPerRow {
  return value === '2' || value === '4' ? value : '3'
}

export function normalizeNewsEventsTabsLayoutStyle(
  value?: string | null,
): NewsEventsTabsLayoutStyle {
  return value === 'editorialList' ? 'editorialList' : 'cardGrid'
}

export function getNewsEventsTabsGridClasses(value?: string | null): string {
  return gridClassesByCardsPerRow[normalizeNewsEventsTabsCardsPerRow(value)]
}

export function getNewsEventsTabsClientStateKey(
  groups: PublicNewsEventGroups,
  tabs: readonly NewsEventsTabsResolvedTab[],
  itemsPerTab: NewsEventsTabsItemsPerTab,
): string {
  const initialPages = tabs.map(({ value }) => {
    const page = groups[value] ?? createEmptyNewsEventPage()

    return [
      value,
      page.page,
      page.hasNextPage,
      page.docs.map((item) => [
        item.id,
        item.title,
        item.excerpt,
        item.dateISO,
        item.classification.id,
        item.behavior,
      ]),
    ]
  })

  return JSON.stringify([itemsPerTab, initialPages])
}
