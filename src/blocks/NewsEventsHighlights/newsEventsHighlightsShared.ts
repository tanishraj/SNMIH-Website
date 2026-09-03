import { getNewsEventClassificationRelationshipIDs } from '@/lib/newsEventClassifications'
import { normalizeHighlightsItemCount } from '@/lib/newsEventsShared'

export const NEWS_EVENTS_HIGHLIGHTS_MAX_CLASSIFICATIONS = 50

export const getNewsEventsHighlightsClassificationIDs = (value: unknown): string[] =>
  getNewsEventClassificationRelationshipIDs(value)

export const getNewsEventsHighlightsPreviewKey = (
  classificationIDs: readonly string[],
  itemCount: unknown,
): string =>
  JSON.stringify([
    normalizeHighlightsItemCount(itemCount as number | null | undefined),
    ...classificationIDs,
  ])
