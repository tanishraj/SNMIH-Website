import { getNewsGridCollectionItemCount } from '@/blocks/NewsGrid/newsGridShared'
import {
  getAnnualCalendarClassificationIDs,
  getAnnualCalendarScopeKey,
  type AnnualCalendarInitialSnapshot,
  type AnnualCalendarPeriodInput,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import {
  getCalendarClassificationIDs,
  getCalendarScopeKey,
  type CalendarInitialSnapshot,
} from '@/blocks/Calendar/calendarShared'
import {
  getNewsEventsHighlightsClassificationIDs,
  getNewsEventsHighlightsPreviewKey,
} from '@/blocks/NewsEventsHighlights/newsEventsHighlightsShared'
import {
  getNewsEventsTabsClassificationRelationshipIDs,
  normalizeNewsEventsTabsItemsPerTab,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import type { ResolvedNewsEventClassification } from '@/lib/newsEventClassifications'
import {
  normalizeHighlightsItemCount,
  type PublicNewsEventCard,
  type PublicNewsEventGroups,
} from '@/lib/newsEventsShared'
import type { Page } from '@/payload-types'

export type NewsEventsPreviewSnapshot = {
  annualCalendarByScope: Record<string, AnnualCalendarInitialSnapshot>
  calendarByScope: Record<string, CalendarInitialSnapshot>
  classificationsByScope: Record<string, ResolvedNewsEventClassification[]>
  groupsByScope: Record<string, PublicNewsEventGroups>
  highlightsByScope: Record<string, PublicNewsEventCard[]>
  newsGridByCount: Record<string, PublicNewsEventCard[]>
}

export const EMPTY_NEWS_EVENTS_PREVIEW_SNAPSHOT: NewsEventsPreviewSnapshot = {
  annualCalendarByScope: {},
  calendarByScope: {},
  classificationsByScope: {},
  groupsByScope: {},
  highlightsByScope: {},
  newsGridByCount: {},
}

export type NewsEventsHighlightsPreviewScope = {
  classificationIDs: string[]
  key: string
  limit: number
}

export function getNewsGridPreviewItemCounts(layout?: Page['layout'] | null): number[] {
  const counts = new Set<number>()

  for (const block of layout ?? []) {
    if (block.blockType === 'newsGrid') {
      const itemCount = getNewsGridCollectionItemCount(block.totalCards, block.featureCard)
      // A feature-only grid needs no collection snapshot.
      if (itemCount > 0) counts.add(itemCount)
    }
  }

  return [...counts].sort((left, right) => left - right)
}

export type NewsEventsTabsPreviewScope = {
  classificationIDs: string[]
  key: string
  limit: number
}

export type CalendarPreviewScope = {
  classificationIDs: string[]
  key: string
}

export type AnnualCalendarPreviewScope = CalendarPreviewScope & {
  periodInput: AnnualCalendarPeriodInput
}

const MAX_NEWS_EVENTS_PREVIEW_DEPTH = 10

export function getNewsEventsHighlightsPreviewScopes(
  layout?: Page['layout'] | null,
): NewsEventsHighlightsPreviewScope[] {
  const scopes = new Map<string, NewsEventsHighlightsPreviewScope>()
  const visitedLayouts = new WeakSet<object>()

  const visitLayout = (value: unknown, depth: number): void => {
    if (
      !Array.isArray(value) ||
      depth > MAX_NEWS_EVENTS_PREVIEW_DEPTH ||
      visitedLayouts.has(value)
    ) {
      return
    }

    visitedLayouts.add(value)

    for (const block of value) {
      if (!block || typeof block !== 'object') continue

      const record = block as Record<string, unknown>

      if (record.blockType === 'newsEventsHighlights') {
        const classificationIDs = getNewsEventsHighlightsClassificationIDs(record.classifications)
        const limit = normalizeHighlightsItemCount(record.itemCount as number | null | undefined)
        const key = getNewsEventsHighlightsPreviewKey(classificationIDs, limit)

        scopes.set(key, { classificationIDs, key, limit })
      }

      if (
        record.blockType === 'reusableSection' &&
        record.section &&
        typeof record.section === 'object' &&
        'layout' in record.section
      ) {
        visitLayout((record.section as { layout?: unknown }).layout, depth + 1)
      }
    }
  }

  visitLayout(layout, 0)
  return [...scopes.values()]
}

/** @deprecated Use classification-aware getNewsEventsHighlightsPreviewScopes. */
export function getNewsEventsPreviewItemCounts(layout?: Page['layout'] | null): number[] {
  return [...new Set(getNewsEventsHighlightsPreviewScopes(layout).map(({ limit }) => limit))].sort(
    (left, right) => left - right,
  )
}

export function getCalendarPreviewScopes(layout?: Page['layout'] | null): CalendarPreviewScope[] {
  const scopes = new Map<string, CalendarPreviewScope>()
  const visitedLayouts = new WeakSet<object>()

  const visitLayout = (value: unknown, depth: number): void => {
    if (!Array.isArray(value) || depth > MAX_NEWS_EVENTS_PREVIEW_DEPTH || visitedLayouts.has(value))
      return
    visitedLayouts.add(value)

    for (const block of value) {
      if (!block || typeof block !== 'object') continue
      const record = block as Record<string, unknown>
      if (record.blockType === 'calendar') {
        const classificationIDs = getCalendarClassificationIDs(record.classifications)
        if (classificationIDs.length > 0) {
          const key = getCalendarScopeKey(classificationIDs)
          scopes.set(key, { classificationIDs, key })
        }
      }
      if (
        record.blockType === 'reusableSection' &&
        record.section &&
        typeof record.section === 'object' &&
        'layout' in record.section
      ) {
        visitLayout((record.section as { layout?: unknown }).layout, depth + 1)
      }
    }
  }

  visitLayout(layout, 0)
  return [...scopes.values()]
}

export function getAnnualCalendarPreviewScopes(
  layout?: Page['layout'] | null,
): AnnualCalendarPreviewScope[] {
  const scopes = new Map<string, AnnualCalendarPreviewScope>()
  const visitedLayouts = new WeakSet<object>()

  const visitLayout = (value: unknown, depth: number): void => {
    if (!Array.isArray(value) || depth > MAX_NEWS_EVENTS_PREVIEW_DEPTH || visitedLayouts.has(value))
      return
    visitedLayouts.add(value)

    for (const block of value) {
      if (!block || typeof block !== 'object') continue
      const record = block as Record<string, unknown>

      if (record.blockType === 'annualCalendar') {
        const classificationIDs = getAnnualCalendarClassificationIDs(record.classifications)
        if (classificationIDs.length > 0) {
          const periodInput: AnnualCalendarPeriodInput = {
            periodEndDate:
              typeof record.periodEndDate === 'string' ? record.periodEndDate : null,
            periodMode:
              record.periodMode === 'customAcademicYear' ? 'customAcademicYear' : 'currentYear',
            periodStartDate:
              typeof record.periodStartDate === 'string' ? record.periodStartDate : null,
          }
          const key = getAnnualCalendarScopeKey(classificationIDs, periodInput)
          scopes.set(key, { classificationIDs, key, periodInput })
        }
      }

      if (
        record.blockType === 'reusableSection' &&
        record.section &&
        typeof record.section === 'object' &&
        'layout' in record.section
      ) {
        visitLayout((record.section as { layout?: unknown }).layout, depth + 1)
      }
    }
  }

  visitLayout(layout, 0)
  return [...scopes.values()]
}

export const getNewsEventsTabsPreviewGroupKey = (
  classificationIDs: readonly string[],
  limit: number,
): string => JSON.stringify([limit, ...classificationIDs])

export function getNewsEventsTabsPreviewClassificationIDs(block: unknown): string[] {
  if (!block || typeof block !== 'object') return []

  const record = block as Record<string, unknown>

  return getNewsEventsTabsClassificationRelationshipIDs(record.classifications)
}

export function getNewsEventsTabsPreviewGroupScopes(
  layout?: Page['layout'] | null,
): NewsEventsTabsPreviewScope[] {
  const scopes = new Map<string, NewsEventsTabsPreviewScope>()
  const visitedLayouts = new WeakSet<object>()

  const visitLayout = (value: unknown, depth: number): void => {
    if (
      !Array.isArray(value) ||
      depth > MAX_NEWS_EVENTS_PREVIEW_DEPTH ||
      visitedLayouts.has(value)
    ) {
      return
    }

    visitedLayouts.add(value)

    for (const block of value) {
      if (!block || typeof block !== 'object' || !('blockType' in block)) continue

      const record = block as Record<string, unknown>

      if (record.blockType === 'newsEventsTabs') {
        const classificationIDs = getNewsEventsTabsPreviewClassificationIDs(record)

        const limit = normalizeNewsEventsTabsItemsPerTab(record.itemsPerTab as string | number)
        const key = getNewsEventsTabsPreviewGroupKey(classificationIDs, limit)

        scopes.set(key, { classificationIDs, key, limit })
      }

      if (
        record.blockType === 'reusableSection' &&
        record.section &&
        typeof record.section === 'object' &&
        'layout' in record.section
      ) {
        visitLayout((record.section as { layout?: unknown }).layout, depth + 1)
      }
    }
  }

  visitLayout(layout, 0)
  return [...scopes.values()]
}

/** @deprecated Use getNewsEventsTabsPreviewGroupScopes so equal counts cannot collide. */
export function getNewsEventsTabsPreviewGroupCounts(layout?: Page['layout'] | null): number[] {
  return [...new Set(getNewsEventsTabsPreviewGroupScopes(layout).map(({ limit }) => limit))].sort(
    (left, right) => left - right,
  )
}
