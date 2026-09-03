import {
  NewsEventsTabsBlockPresentation,
  type NewsEventsTabsBlockLike,
} from '@/blocks/NewsEventsTabs/Presentation'
import {
  getNewsEventsTabsClassificationRelationshipIDs,
  normalizeNewsEventsTabsItemsPerTab,
} from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import {
  getNewsEventsTabsPreviewClassificationIDs,
  getNewsEventsTabsPreviewGroupKey,
  type NewsEventsPreviewSnapshot,
} from '@/lib/newsEventsPreviewShared'

type NewsEventsTabsPreviewBlockProps = NewsEventsTabsBlockLike & {
  snapshot: NewsEventsPreviewSnapshot
}

export function NewsEventsTabsPreviewBlockComponent({
  snapshot,
  ...props
}: NewsEventsTabsPreviewBlockProps) {
  const itemCount = normalizeNewsEventsTabsItemsPerTab(props.itemsPerTab)
  const classificationIDs = getNewsEventsTabsPreviewClassificationIDs(props)
  const relationshipIDs = getNewsEventsTabsClassificationRelationshipIDs(props.classifications)
  const scopeKey = getNewsEventsTabsPreviewGroupKey(classificationIDs, itemCount)
  const resolvedClassifications = snapshot.classificationsByScope[scopeKey] ?? []
  const classifications =
    relationshipIDs.length > 0
      ? resolvedClassifications.length > 0
        ? resolvedClassifications
        : relationshipIDs
      : props.classifications

  return (
    <NewsEventsTabsBlockPresentation
      {...props}
      classifications={classifications}
      groups={snapshot.groupsByScope[scopeKey]}
    />
  )
}
