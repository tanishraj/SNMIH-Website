import { CALENDAR_MAX_CLASSIFICATIONS } from '@/blocks/Calendar/calendarShared'
import { parseZonedMonthKey } from '@/lib/siteTimeZone'

type ParsedCalendarRequest =
  | { classificationIDs: string[]; draft: boolean; monthKey: string; ok: true }
  | { message: string; ok: false }

const calendarIDPattern = /^[A-Za-z0-9:_-]{1,128}$/

export const parseCalendarRequest = (searchParams: URLSearchParams): ParsedCalendarRequest => {
  const monthValues = searchParams.getAll('month')
  const classificationValues = searchParams.getAll('classifications')
  const draftValues = searchParams.getAll('draft')

  if (monthValues.length !== 1 || !parseZonedMonthKey(monthValues[0] ?? '')) {
    return { message: 'Month must use YYYY-MM.', ok: false }
  }
  if (classificationValues.length !== 1 || !classificationValues[0]?.trim()) {
    return { message: 'One to five classifications are required.', ok: false }
  }
  if (draftValues.length > 1 || (draftValues.length === 1 && draftValues[0] !== 'true')) {
    return { message: 'Draft must be omitted or set to true.', ok: false }
  }

  const classificationIDs = classificationValues[0].split(',').map((id) => id.trim())
  if (
    classificationIDs.length < 1 ||
    classificationIDs.length > CALENDAR_MAX_CLASSIFICATIONS ||
    classificationIDs.some((id) => !calendarIDPattern.test(id)) ||
    new Set(classificationIDs).size !== classificationIDs.length
  ) {
    return { message: 'Classification scope is invalid.', ok: false }
  }

  return {
    classificationIDs,
    draft: draftValues[0] === 'true',
    monthKey: monthValues[0],
    ok: true,
  }
}
