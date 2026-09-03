import type { AnnualCalendarMonth } from '@/blocks/AnnualCalendar/annualCalendarShared'
import type { CalendarEvent } from '@/blocks/Calendar/calendarShared'
import {
  resolveCalendarSurfaceClasses,
  type CalendarSurfaceClasses,
} from '@/blocks/Calendar/calendarStyles'
import { getCalendarToneStyle } from '@/blocks/Calendar/calendarTone'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type AnnualCalendarYearStreamProps = {
  emptyMessage: string
  eventCount: number
  months: AnnualCalendarMonth[]
  periodLabel: string
  surface?: BlockSurface
  todayKey: string
}

type AnnualCalendarEventCardProps = {
  event: CalendarEvent
  isToday: boolean
  styles: CalendarSurfaceClasses
  surface: BlockSurface
}

const shortMonth = (dateKey: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' }).format(
    new Date(`${dateKey}T00:00:00.000Z`),
  )

function AnnualCalendarEventCard({
  event,
  isToday,
  styles,
  surface,
}: AnnualCalendarEventCardProps) {
  return (
    <a
      className={cn(
        styles.panel,
        'grid min-h-24 grid-cols-[3.5rem_0.25rem_minmax(0,1fr)] items-start gap-3 p-4 transition-colors hover:bg-current/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset md:px-5',
        surface === 'brand' ? 'focus-visible:ring-primary-foreground' : 'focus-visible:ring-ring',
        isToday && (surface === 'brand' ? 'bg-primary-foreground/8' : 'bg-primary/5'),
      )}
      data-annual-calendar-event="true"
      data-today={isToday ? 'true' : undefined}
      href={event.href}
    >
      <time
        className="font-mono text-xl leading-none font-semibold tabular-nums"
        dateTime={event.startDateKey}
      >
        {event.startDateKey.slice(8, 10)}
        <span
          className={cn(
            'mt-1 block text-[0.625rem] tracking-[0.12em] uppercase',
            styles.supportingText,
          )}
        >
          {isToday ? 'Today' : shortMonth(event.startDateKey)}
        </span>
      </time>
      <span
        aria-hidden="true"
        className="h-full min-h-12 w-1 rounded-compact bg-[var(--calendar-tone)]"
        style={getCalendarToneStyle(event.classification.calendarColor)}
      />
      <span className="min-w-0">
        <span className="block text-sm leading-5 font-semibold">{event.title}</span>
        <span className={cn('mt-1 block text-xs leading-5', styles.supportingText)}>
          {event.allDay ? 'All day' : event.timeLabel}
          {event.location ? ` · ${event.location}` : ''}
        </span>
        <span className="mt-2 block font-mono text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
          {event.classification.badgeLabel}
        </span>
      </span>
    </a>
  )
}

export function AnnualCalendarYearStream({
  emptyMessage,
  eventCount,
  months,
  periodLabel,
  surface = 'light',
  todayKey,
}: AnnualCalendarYearStreamProps) {
  const styles = resolveCalendarSurfaceClasses(surface)
  const currentMonthKey = todayKey.slice(0, 7)

  return (
    <div data-annual-calendar-stream="true">
      <header
        className={cn(
          'flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-end sm:justify-between',
          styles.border,
        )}
      >
        <h3 className="font-sans text-md font-semibold">{periodLabel}</h3>
        <p className={cn('font-mono text-xs tabular-nums', styles.supportingText)}>
          {eventCount} {eventCount === 1 ? 'event' : 'events'}
        </p>
      </header>

      <div className="relative pt-7">
        <span
          aria-hidden="true"
          className={cn('absolute top-7 bottom-0 left-[0.28125rem] w-px', styles.separator)}
          data-annual-calendar-spine="true"
        />

        <div className="flex flex-col gap-9">
          {months.map((month, monthIndex) => {
            const isCurrentMonth = month.monthKey === currentMonthKey
            const hasFollowingMonth = monthIndex < months.length - 1

            return (
              <section
                className="relative grid gap-4 pl-7 md:grid-cols-[9rem_minmax(0,1fr)] md:gap-6"
                data-annual-calendar-month="true"
                data-current-month={isCurrentMonth ? 'true' : undefined}
                key={month.monthKey}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'absolute top-2 left-0 size-2.5 rounded-none border border-current bg-current',
                    isCurrentMonth && 'border-success bg-success',
                  )}
                  data-annual-calendar-marker="true"
                />

                <header className="flex min-w-0 flex-col items-start gap-1">
                  {isCurrentMonth ? (
                    <Badge
                      className="rounded-full border-current/25 bg-transparent font-mono text-[0.625rem] tracking-[0.12em] uppercase"
                      variant="outline"
                    >
                      Current
                    </Badge>
                  ) : null}
                  <h3 className="font-sans text-lg font-semibold tracking-[-0.02em]">
                    {month.monthLabel}
                  </h3>
                  <span
                    className={cn(
                      'font-mono text-[0.625rem] tracking-[0.12em] uppercase',
                      styles.supportingText,
                    )}
                  >
                    {month.events.length} {month.events.length === 1 ? 'event' : 'events'}
                  </span>
                </header>

                {month.events.length > 0 ? (
                  <div className="grid gap-3">
                    {month.events.map((event) => (
                      <AnnualCalendarEventCard
                        event={event}
                        isToday={event.startDateKey === todayKey}
                        key={event.id}
                        styles={styles}
                        surface={surface}
                      />
                    ))}
                  </div>
                ) : (
                  <p
                    className={cn('self-center text-sm leading-6', styles.supportingText)}
                    data-annual-calendar-empty="true"
                  >
                    {emptyMessage}
                  </p>
                )}

                {hasFollowingMonth ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute right-0 -bottom-[1.125rem] left-7 h-px',
                      styles.separator,
                    )}
                    data-annual-calendar-month-divider="true"
                  />
                ) : null}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
