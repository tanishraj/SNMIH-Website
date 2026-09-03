import {
  AnnualCalendarBlockPresentation,
  type AnnualCalendarBlockLike,
} from '@/blocks/AnnualCalendar/Presentation'
import {
  getAnnualCalendarClassificationIDs,
  type AnnualCalendarPeriodInput,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import { CalendarScopeError, getPublicAnnualCalendarInitialSnapshot } from '@/lib/calendarEvents'

export type { AnnualCalendarBlockLike } from '@/blocks/AnnualCalendar/Presentation'

export async function AnnualCalendarBlockComponent(props: AnnualCalendarBlockLike) {
  const classificationIDs = getAnnualCalendarClassificationIDs(props.classifications)
  if (classificationIDs.length === 0) return <AnnualCalendarBlockPresentation {...props} />
  const periodInput: AnnualCalendarPeriodInput = {
    periodEndDate: props.periodEndDate,
    periodMode: props.periodMode,
    periodStartDate: props.periodStartDate,
  }

  let initial: Awaited<ReturnType<typeof getPublicAnnualCalendarInitialSnapshot>>
  try {
    initial = await getPublicAnnualCalendarInitialSnapshot(classificationIDs, periodInput)
  } catch (error) {
    if (error instanceof CalendarScopeError) return <AnnualCalendarBlockPresentation {...props} />
    throw error
  }

  return <AnnualCalendarBlockPresentation {...props} initial={initial} />
}
