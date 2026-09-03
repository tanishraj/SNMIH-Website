import type React from 'react'

import { normalizeCalendarTone, type CalendarTone } from '@/lib/newsEventClassifications'

export const calendarToneStyles = {
  amber: { variable: 'var(--calendar-amber)' },
  blue: { variable: 'var(--calendar-blue)' },
  cyan: { variable: 'var(--calendar-cyan)' },
  green: { variable: 'var(--calendar-green)' },
  violet: { variable: 'var(--calendar-violet)' },
} as const satisfies Record<CalendarTone, { variable: string }>

export const getCalendarToneStyle = (tone: CalendarTone): React.CSSProperties =>
  ({
    '--calendar-tone': calendarToneStyles[normalizeCalendarTone(tone)].variable,
  }) as React.CSSProperties
