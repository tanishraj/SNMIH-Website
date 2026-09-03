import { CalendarBlockPresentation, type CalendarBlockLike } from '@/blocks/Calendar/Presentation'
import { getCalendarClassificationIDs, getCalendarScopeKey } from '@/blocks/Calendar/calendarShared'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'

type CalendarPreviewBlockComponentProps = CalendarBlockLike & {
  snapshot: NewsEventsPreviewSnapshot
}

export function CalendarPreviewBlockComponent({
  snapshot,
  ...props
}: CalendarPreviewBlockComponentProps) {
  const ids = getCalendarClassificationIDs(props.classifications)
  const initial = ids.length > 0 ? snapshot.calendarByScope[getCalendarScopeKey(ids)] : undefined
  return <CalendarBlockPresentation {...props} draft initial={initial} />
}
