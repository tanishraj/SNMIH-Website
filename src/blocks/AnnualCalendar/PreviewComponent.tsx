import {
  AnnualCalendarBlockPresentation,
  type AnnualCalendarBlockLike,
} from '@/blocks/AnnualCalendar/Presentation'
import {
  getAnnualCalendarClassificationIDs,
  getAnnualCalendarScopeKey,
  type AnnualCalendarPeriodInput,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import type { NewsEventsPreviewSnapshot } from '@/lib/newsEventsPreviewShared'

type AnnualCalendarPreviewBlockComponentProps = AnnualCalendarBlockLike & {
  snapshot: NewsEventsPreviewSnapshot
}

export function AnnualCalendarPreviewBlockComponent({
  snapshot,
  ...props
}: AnnualCalendarPreviewBlockComponentProps) {
  const ids = getAnnualCalendarClassificationIDs(props.classifications)
  const periodInput: AnnualCalendarPeriodInput = {
    periodEndDate: props.periodEndDate,
    periodMode: props.periodMode,
    periodStartDate: props.periodStartDate,
  }
  const initial =
    ids.length > 0
      ? snapshot.annualCalendarByScope[getAnnualCalendarScopeKey(ids, periodInput)]
      : undefined

  return <AnnualCalendarBlockPresentation {...props} draft initial={initial} />
}
