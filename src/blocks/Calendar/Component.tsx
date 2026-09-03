import { CalendarBlockPresentation, type CalendarBlockLike } from '@/blocks/Calendar/Presentation'
import { getCalendarClassificationIDs } from '@/blocks/Calendar/calendarShared'
import { CalendarScopeError, getPublicCalendarInitialSnapshot } from '@/lib/calendarEvents'

export type { CalendarBlockLike } from '@/blocks/Calendar/Presentation'

export async function CalendarBlockComponent(props: CalendarBlockLike) {
  const classificationIDs = getCalendarClassificationIDs(props.classifications)
  if (classificationIDs.length === 0) return <CalendarBlockPresentation {...props} />

  let initial: Awaited<ReturnType<typeof getPublicCalendarInitialSnapshot>>
  try {
    initial = await getPublicCalendarInitialSnapshot(classificationIDs)
  } catch (error) {
    if (error instanceof CalendarScopeError) return <CalendarBlockPresentation {...props} />
    throw error
  }

  return <CalendarBlockPresentation {...props} initial={initial} />
}
