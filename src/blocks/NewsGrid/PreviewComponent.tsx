import { NewsGridBlockPresentation, type NewsGridBlockLike } from '@/blocks/NewsGrid/Presentation'
import { getNewsGridCollectionItemCount } from '@/blocks/NewsGrid/newsGridShared'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'

type NewsGridPreviewBlockProps = NewsGridBlockLike & {
  snapshot: NewsEventsPreviewSnapshot
}

export function NewsGridPreviewBlockComponent({ snapshot, ...props }: NewsGridPreviewBlockProps) {
  const itemCount = getNewsGridCollectionItemCount(props.totalCards, props.featureCard)

  return (
    <NewsGridBlockPresentation
      {...props}
      items={itemCount > 0 ? (snapshot.newsGridByCount[String(itemCount)] ?? []) : []}
    />
  )
}
