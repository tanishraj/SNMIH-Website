import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { type CalendarMonthSnapshot } from '@/blocks/Calendar/calendarShared'
import {
  CalendarScopeError,
  getDraftCalendarMonth,
  getPublicCalendarMonth,
} from '@/lib/calendarEvents'
import { parseCalendarRequest } from '@/lib/calendarRequest'

const errorStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') return undefined
  const status =
    (error as { status?: unknown; statusCode?: unknown }).statusCode ??
    (error as { status?: unknown }).status
  return typeof status === 'number' ? status : undefined
}

export async function GET(request: Request): Promise<Response> {
  const parsed = parseCalendarRequest(new URL(request.url).searchParams)
  if (!parsed.ok) return Response.json({ message: parsed.message }, { status: 400 })

  try {
    let snapshot: CalendarMonthSnapshot
    if (!parsed.draft) {
      snapshot = await getPublicCalendarMonth(parsed.classificationIDs, parsed.monthKey)
    } else {
      const payload = await getPayload({ config: configPromise })
      const { user } = await payload.auth({
        canSetHeaders: false,
        headers: new Headers(request.headers),
      })
      if (!user) return Response.json({ message: 'Authentication required.' }, { status: 401 })
      snapshot = await getDraftCalendarMonth(parsed.classificationIDs, parsed.monthKey, user)
    }

    return Response.json(snapshot, {
      headers: { 'Cache-Control': parsed.draft ? 'private, no-store' : 'public, max-age=60' },
    })
  } catch (error) {
    if (error instanceof CalendarScopeError) {
      return Response.json({ message: error.message }, { status: 400 })
    }
    if (parsed.draft && (errorStatus(error) === 401 || errorStatus(error) === 403)) {
      return Response.json({ message: 'You do not have access to this Calendar.' }, { status: 403 })
    }
    return Response.json(
      { message: 'Calendar events are temporarily unavailable.' },
      { status: 500 },
    )
  }
}
