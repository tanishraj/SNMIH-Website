import { Badge } from '@/components/ui/badge'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import type { CalendarClassification, CalendarEvent } from '@/blocks/Calendar/calendarShared'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import { getCalendarToneStyle } from '@/blocks/Calendar/calendarTone'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { cn } from '@/lib/utils'

type CalendarUpcomingProps = {
  classifications: CalendarClassification[]
  embedded?: boolean
  emptyMessage: string
  eyebrow: string
  events: CalendarEvent[]
  showLegend?: boolean
  surface?: BlockSurface
  title: string
}

export function CalendarUpcoming({
  classifications,
  embedded = false,
  emptyMessage,
  eyebrow,
  events,
  showLegend = true,
  surface = 'light',
  title,
}: CalendarUpcomingProps) {
  const styles = resolveCalendarSurfaceClasses(surface)
  const Root = embedded ? 'div' : 'aside'

  return (
    <Root
      className={cn('min-w-0', !embedded && styles.panel)}
      data-calendar-upcoming="true"
      data-calendar-upcoming-embedded={embedded ? 'true' : undefined}
    >
      <header className={cn('border-b p-4 md:p-5', styles.border)}>
        <p
          className={cn(
            'text-xs font-semibold tracking-[0.16em] uppercase',
            surface === 'brand' ? 'text-primary-foreground' : 'text-primary',
          )}
        >
          {eyebrow}
        </p>
        <h3 className="mt-2 font-sans text-lg font-semibold">{title}</h3>
      </header>
      {events.length > 0 ? (
        <div className="px-4 md:px-5">
          {events.slice(0, 4).map((event, index) => (
            <div key={event.id}>
              <a
                className={cn(
                  'grid grid-cols-[3.25rem_minmax(0,1fr)] gap-3 py-4 focus-visible:outline-none focus-visible:ring-2',
                  surface === 'brand'
                    ? 'focus-visible:ring-primary-foreground'
                    : 'focus-visible:ring-ring',
                )}
                href={event.href}
              >
                <time
                  className="font-mono text-lg leading-none font-semibold tabular-nums"
                  dateTime={event.startDateKey}
                >
                  {event.startDateKey.slice(8, 10)}
                  <span
                    className={cn(
                      'mt-1 block font-mono text-[0.625rem] tracking-widest uppercase',
                      styles.supportingText,
                    )}
                  >
                    {new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
                      new Date(`${event.startDateKey}T00:00:00.000Z`),
                    )}
                  </span>
                </time>
                <div className={cn('relative border-l pl-4', styles.border)}>
                  <p className="text-sm font-semibold">{event.title}</p>
                  <p className={cn('mt-1 text-xs', styles.supportingText)}>
                    {event.allDay ? 'All day' : event.timeLabel}
                    {event.location ? ` · ${event.location}` : ''}
                  </p>
                </div>
              </a>
              {index < Math.min(events.length, 4) - 1 ? (
                <Separator className={styles.separator} />
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <Empty className="min-h-44 rounded-card border-0 p-6">
          <EmptyHeader>
            <EmptyTitle>No upcoming events</EmptyTitle>
            <EmptyDescription className={styles.supportingText}>{emptyMessage}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      {showLegend ? (
        <div
          className={cn('flex flex-wrap gap-x-3 gap-y-2 border-t p-4 md:p-5', styles.border)}
          aria-label="Event classification legend"
        >
          {classifications.map((classification) => (
            <Badge
              className="gap-1.5 rounded-full border-0 bg-transparent px-0 text-current"
              key={classification.id}
              variant="outline"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[var(--calendar-tone)]"
                style={getCalendarToneStyle(classification.calendarColor)}
              />
              {classification.badgeLabel}
            </Badge>
          ))}
        </div>
      ) : null}
    </Root>
  )
}
