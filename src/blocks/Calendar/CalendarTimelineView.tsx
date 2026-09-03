import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { getCalendarToneStyle } from '@/blocks/Calendar/calendarTone'
import type { CalendarEvent } from '@/blocks/Calendar/calendarShared'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'

const fullDate = (dateKey: string): string =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00.000Z`))

type CalendarTimelineViewProps = {
  emptyMessage: string
  events: CalendarEvent[]
  focusDate?: string | null
  surface?: BlockSurface
}

export function CalendarTimelineView({
  emptyMessage,
  events,
  focusDate,
  surface = 'light',
}: CalendarTimelineViewProps) {
  const styles = resolveCalendarSurfaceClasses(surface)

  if (events.length === 0) {
    return (
      <Empty
        className={cn(
          'min-h-64 rounded-card border bg-transparent text-current',
          styles.border,
        )}
      >
        <EmptyHeader>
          <EmptyTitle>No events found</EmptyTitle>
          <EmptyDescription className={styles.supportingText}>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const groups = new Map<string, CalendarEvent[]>()
  for (const event of events)
    groups.set(event.startDateKey, [...(groups.get(event.startDateKey) ?? []), event])

  return (
    <div className={styles.panel} data-calendar-timeline-view="true">
      {Array.from(groups).map(([dateKey, group], groupIndex) => (
        <section className="grid md:grid-cols-[7rem_minmax(0,1fr)]" key={dateKey}>
          <h3
            className={cn(
              'border-b p-4 font-sans text-sm font-semibold text-current md:border-r md:px-5 md:py-5',
              styles.border,
            )}
            data-calendar-date-heading={dateKey}
            ref={(node) => {
              if (node && focusDate === dateKey) node.focus()
            }}
            tabIndex={-1}
          >
            {fullDate(dateKey)}
          </h3>
          <div className="px-4 md:px-5">
            {group.map((event, eventIndex) => (
              <div key={event.id}>
                <a
                  className={cn(
                    'grid min-h-20 gap-3 py-4 font-sans text-current transition-colors focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none sm:grid-cols-[6rem_minmax(0,1fr)_minmax(8rem,auto)] sm:items-center',
                    surface === 'brand'
                      ? 'hover:text-primary-foreground/80 focus-visible:ring-primary-foreground'
                      : 'hover:text-primary focus-visible:ring-ring',
                  )}
                  href={event.href}
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className="rounded-full border-[var(--calendar-tone)] bg-[color-mix(in_oklch,var(--calendar-tone)_10%,transparent)] text-current"
                      style={getCalendarToneStyle(event.classification.calendarColor)}
                      variant="outline"
                    >
                      {event.classification.badgeLabel}
                    </Badge>
                    {event.allDay ? (
                      <span className={cn('text-xs', styles.supportingText)}>All day</span>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    {event.startDateKey !== event.endDateKey ? (
                      <p className={cn('mt-1 text-xs', styles.supportingText)}>
                        {event.rangeLabel}
                      </p>
                    ) : null}
                  </div>
                  <div className={cn('text-xs sm:text-right', styles.supportingText)}>
                    {!event.allDay && event.timeLabel ? <p>{event.timeLabel}</p> : null}
                    {event.location ? <p>{event.location}</p> : null}
                  </div>
                </a>
                {eventIndex < group.length - 1 ? <Separator className={styles.separator} /> : null}
              </div>
            ))}
          </div>
          {groupIndex < groups.size - 1 ? (
            <Separator className={cn('md:col-span-2', styles.separator)} />
          ) : null}
        </section>
      ))}
    </div>
  )
}
