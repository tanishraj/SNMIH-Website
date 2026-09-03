import {
  NewsEventsHighlightsBlockPresentation,
  type NewsEventsHighlightsBlockLike,
} from '@/blocks/NewsEventsHighlights/Presentation'
import {
  getNewsEventsHighlightsClassificationIDs,
  getNewsEventsHighlightsPreviewKey,
} from '@/blocks/NewsEventsHighlights/newsEventsHighlightsShared'
import { toAutomaticFeaturedHighlightItems } from '@/blocks/NewsEventsHighlights/resolveItems'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'
import { normalizeHighlightsItemCount } from '@/lib/newsEventsShared'

type NewsEventsHighlightsPreviewBlockProps = NewsEventsHighlightsBlockLike & {
  snapshot: NewsEventsPreviewSnapshot
}

export function NewsEventsHighlightsPreviewBlockComponent({
  snapshot,
  ...props
}: NewsEventsHighlightsPreviewBlockProps) {
  const itemCount = normalizeHighlightsItemCount(props.itemCount)
  const classificationIDs = getNewsEventsHighlightsClassificationIDs(props.classifications)
  const previewKey = getNewsEventsHighlightsPreviewKey(classificationIDs, itemCount)
  const items = toAutomaticFeaturedHighlightItems(snapshot.highlightsByScope[previewKey] ?? [])

  return <NewsEventsHighlightsBlockPresentation {...props} items={items} />
}
