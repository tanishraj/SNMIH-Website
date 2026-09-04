import { getNewsEventClassificationRelationshipIDs } from '@/lib/newsEventClassifications'

export const NEWS_EVENTS_HIGHLIGHTS_MAX_CLASSIFICATIONS = 50
export const NEWS_EVENTS_HIGHLIGHTS_FEATURED_LIMIT = 3
export const NEWS_EVENTS_HIGHLIGHTS_UPCOMING_LIMIT = 3

export const getNewsEventsHighlightsClassificationIDs = (value: unknown): string[] =>
  getNewsEventClassificationRelationshipIDs(value)

export const getNewsEventsHighlightsPreviewKey = (classificationIDs: readonly string[]): string =>
  JSON.stringify(classificationIDs)
