import { NewsGridBlockPresentation, type NewsGridBlockLike } from '@/blocks/NewsGrid/Presentation'
import { getNewsGridCollectionItemCount } from '@/blocks/NewsGrid/newsGridShared'
import { getNewsGridItems } from '@/lib/newsEvents'

export type { NewsGridBlockLike } from '@/blocks/NewsGrid/Presentation'

export async function NewsGridBlockComponent(props: NewsGridBlockLike) {
  const itemCount = getNewsGridCollectionItemCount(props.totalCards, props.featureCard)
  const nowISO = new Date().toISOString()
  // News Grid is intentionally newest-updated first. A failed query degrades
  // to the empty state rather than taking the page down.
  const items = itemCount > 0 ? await getNewsGridItems(itemCount, nowISO).catch(() => []) : []

  return <NewsGridBlockPresentation {...props} items={items} />
}
