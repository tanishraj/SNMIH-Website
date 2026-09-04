import {
  NewsEventsHighlightsBlockPresentation,
  type NewsEventsHighlightsBlockLike,
} from '@/blocks/NewsEventsHighlights/Presentation'
import { getNewsEventsHighlightsClassificationIDs } from '@/blocks/NewsEventsHighlights/newsEventsHighlightsShared'
import { toAutomaticFeaturedHighlightItems } from '@/blocks/NewsEventsHighlights/resolveItems'
import { getNewsEventsHighlights } from '@/lib/newsEvents'

export type { NewsEventsHighlightsBlockLike } from '@/blocks/NewsEventsHighlights/Presentation'

export async function NewsEventsHighlightsBlockComponent(props: NewsEventsHighlightsBlockLike) {
  const items = toAutomaticFeaturedHighlightItems(
    await getNewsEventsHighlights(
      getNewsEventsHighlightsClassificationIDs(props.classifications),
      new Date().toISOString(),
    ).catch(() => []),
  )

  return <NewsEventsHighlightsBlockPresentation {...props} items={items} />
}
