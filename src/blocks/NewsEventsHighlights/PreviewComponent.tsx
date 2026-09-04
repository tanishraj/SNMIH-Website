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

type NewsEventsHighlightsPreviewBlockProps = NewsEventsHighlightsBlockLike & {
  snapshot: NewsEventsPreviewSnapshot
}

export function NewsEventsHighlightsPreviewBlockComponent({
  snapshot,
  ...props
}: NewsEventsHighlightsPreviewBlockProps) {
  const classificationIDs = getNewsEventsHighlightsClassificationIDs(props.classifications)
  const previewKey = getNewsEventsHighlightsPreviewKey(classificationIDs)
  const items = toAutomaticFeaturedHighlightItems(snapshot.highlightsByScope[previewKey] ?? [])

  return <NewsEventsHighlightsBlockPresentation {...props} items={items} />
}
