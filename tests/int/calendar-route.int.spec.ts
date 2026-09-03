import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  getDraftCalendarMonth: vi.fn(),
  getPublicCalendarMonth: vi.fn(),
}))

vi.mock('payload', async (importOriginal) => {
  const actual = await importOriginal<typeof import('payload')>()
  return { ...actual, getPayload: vi.fn().mockResolvedValue({ auth: mocks.auth }) }
})
vi.mock('@/lib/calendarEvents', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/calendarEvents')>()
  return {
    ...actual,
    getDraftCalendarMonth: mocks.getDraftCalendarMonth,
    getPublicCalendarMonth: mocks.getPublicCalendarMonth,
  }
})

import { GET } from '@/app/api/calendar-events/route'
import { parseCalendarRequest } from '@/lib/calendarRequest'

const snapshot = { events: [], monthKey: '2026-08', monthLabel: 'August 2026', version: 1 }

describe('Calendar month route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getPublicCalendarMonth.mockResolvedValue(snapshot)
    mocks.getDraftCalendarMonth.mockResolvedValue(snapshot)
  })

  it('strictly parses a bounded unique scope', () => {
    expect(
      parseCalendarRequest(
        new URLSearchParams({ classifications: 'academic,exam', month: '2026-08' }),
      ),
    ).toEqual({
      classificationIDs: ['academic', 'exam'],
      draft: false,
      monthKey: '2026-08',
      ok: true,
    })

    for (const query of [
      'month=2026-13&classifications=a',
      'month=2026-08&month=2026-09&classifications=a',
      'month=2026-08&classifications=',
      'month=2026-08&classifications=a,a',
      'month=2026-08&classifications=a,b,c,d,e,f',
    ]) {
      expect(parseCalendarRequest(new URLSearchParams(query)).ok).toBe(false)
    }
  })

  it('serves public data without authenticating', async () => {
    const response = await GET(
      new Request('http://localhost/api/calendar-events?month=2026-08&classifications=academic'),
    )
    expect(response.status).toBe(200)
    expect(mocks.getPublicCalendarMonth).toHaveBeenCalledWith(['academic'], '2026-08')
    expect(mocks.auth).not.toHaveBeenCalled()
  })

  it('requires an authenticated user for draft reads', async () => {
    mocks.auth.mockResolvedValueOnce({ user: null })
    const unauthorized = await GET(
      new Request(
        'http://localhost/api/calendar-events?month=2026-08&classifications=academic&draft=true',
      ),
    )
    expect(unauthorized.status).toBe(401)

    const user = { id: 'editor' }
    mocks.auth.mockResolvedValueOnce({ user })
    const response = await GET(
      new Request(
        'http://localhost/api/calendar-events?month=2026-08&classifications=academic&draft=true',
      ),
    )
    expect(response.status).toBe(200)
    expect(mocks.getDraftCalendarMonth).toHaveBeenCalledWith(['academic'], '2026-08', user)
  })
})
