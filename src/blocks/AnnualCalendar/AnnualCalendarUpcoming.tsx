import type { CalendarEvent } from '@/blocks/Calendar/calendarShared'
import { CalendarUpcoming } from '@/blocks/Calendar/CalendarUpcoming'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'

type AnnualCalendarUpcomingProps = {
  embedded?: boolean
  emptyMessage: string
  eyebrow: string
  events: CalendarEvent[]
  surface?: BlockSurface
  title: string
}

export function AnnualCalendarUpcoming({
  embedded,
  emptyMessage,
  eyebrow,
  events,
  surface,
  title,
}: AnnualCalendarUpcomingProps) {
  return (
    <div data-annual-calendar-upcoming="true">
      <CalendarUpcoming
        classifications={[]}
        embedded={embedded}
        emptyMessage={emptyMessage}
        eyebrow={eyebrow}
        events={events}
        showLegend={false}
        surface={surface}
        title={title}
      />
    </div>
  )
}
