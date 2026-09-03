import { NewsEventStory } from '@/components/news-events/NewsEventStory'
import { resolveNewsEventsContentSettings } from '@/lib/newsEventDetailTemplateShared'
import type { PublicNewsEventDetail } from '@/lib/newsEventsShared'
import type { NewsEventsContentBlock } from '@/payload-types'

export function NewsEventsContentBlockComponent({
  entry,
  ...block
}: NewsEventsContentBlock & { entry: PublicNewsEventDetail }) {
  return <NewsEventStory article={resolveNewsEventsContentSettings(block)} entry={entry} />
}
