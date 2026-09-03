import configPromise from '@payload-config'
import { getPayload } from 'payload'

import {
  NewsEventsTabsBlockPresentation,
  type NewsEventsTabsBlockLike,
} from '@/blocks/NewsEventsTabs/Presentation'
import {
  getNewsEventsTabsClassificationRelationshipIDs,
  normalizeNewsEventsTabsItemsPerTab,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import { normalizeNewsEventClassificationRecord } from '@/lib/newsEventClassifications'
import { getNewsEventGroups } from '@/lib/newsEvents'

export type { NewsEventsTabsBlockLike } from '@/blocks/NewsEventsTabs/Presentation'

export async function NewsEventsTabsBlockComponent(props: NewsEventsTabsBlockLike) {
  const itemCount = normalizeNewsEventsTabsItemsPerTab(props.itemsPerTab)
  const selectedIDs = getNewsEventsTabsClassificationRelationshipIDs(props.classifications)
  let classifications: unknown = props.classifications

  if (selectedIDs.length > 0) {
    const payload = await getPayload({ config: configPromise })
    const result = await payload.find({
      collection: 'news-event-classifications',
      depth: 0,
      overrideAccess: true,
      pagination: false,
      where: {
        and: [{ id: { in: selectedIDs } }, { active: { equals: true } }],
      },
    })
    const byID = new Map(
      result.docs.flatMap((entry) => {
        const classification = normalizeNewsEventClassificationRecord(entry)

        return classification ? [[classification.id, classification] as const] : []
      }),
    )
    const resolved = selectedIDs.flatMap((id) => {
      const classification = byID.get(id)

      return classification ? [classification] : []
    })

    // Preserve a non-empty relationship source when every selected record is unavailable so an
    // invalid saved selection cannot silently widen into the All-only active-classification scope.
    classifications = resolved.length > 0 ? resolved : selectedIDs
  }

  const groups = await getNewsEventGroups(selectedIDs, itemCount, new Date().toISOString())

  return (
    <NewsEventsTabsBlockPresentation {...props} classifications={classifications} groups={groups} />
  )
}
