import {
  buildCalendarGrid,
  type CalendarAdjacentMonthDates,
  type CalendarEvent,
} from '@/blocks/Calendar/calendarShared'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import { getCalendarToneStyle } from '@/blocks/Calendar/calendarTone'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const weekdays = [
  ['SUN', 'Sunday'],
  ['MON', 'Monday'],
  ['TUE', 'Tuesday'],
  ['WED', 'Wednesday'],
  ['THU', 'Thursday'],
  ['FRI', 'Friday'],
  ['SAT', 'Saturday'],
] as const

const fullDate = (dateKey: string): string =>
  new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).format(new Date(`${dateKey}T00:00:00.000Z`))

type CalendarMonthViewProps = {
  adjacentMonthDates?: CalendarAdjacentMonthDates
  events: CalendarEvent[]
  monthKey: string
  onShowMore: (dateKey: string) => void
  surface?: BlockSurface
  todayKey: string
}

export function CalendarMonthView({
  adjacentMonthDates = 'muted',
  events,
  monthKey,
  onShowMore,
  surface = 'light',
  todayKey,
}: CalendarMonthViewProps) {
  const styles = resolveCalendarSurfaceClasses(surface)
  const cells = buildCalendarGrid(monthKey)
  const byDate = new Map<string, CalendarEvent[]>()

  for (const event of events) {
    for (const cell of cells) {
      if (cell.dateKey < event.startDateKey || cell.dateKey > event.endDateKey) continue
      const current = byDate.get(cell.dateKey) ?? []
      current.push(event)
      byDate.set(cell.dateKey, current)
    }
  }

  return (
    <div className="overflow-x-auto" data-calendar-month-view="true">
      <table
        className="w-full min-w-[48rem] table-fixed border-collapse"
        aria-label={`Calendar for ${monthKey}`}
      >
        <thead>
          <tr>
            {weekdays.map(([short, full]) => (
              <th
                abbr={full}
                className={cn(
                  'border px-3 py-3 text-left font-mono text-xs font-semibold tracking-[0.14em]',
                  styles.border,
                  styles.weekday,
                )}
                key={full}
                scope="col"
              >
                {short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {cells.slice(rowIndex * 7, rowIndex * 7 + 7).map((cell) => {
                const isAdjacent = !cell.inMonth
                const hideAdjacent = isAdjacent && adjacentMonthDates === 'hidden'
                const cellEvents = isAdjacent ? [] : (byDate.get(cell.dateKey) ?? [])
                const hiddenCount = Math.max(0, cellEvents.length - 2)
                const label = fullDate(cell.dateKey)
                const isToday = cell.inMonth && cell.dateKey === todayKey

                return (
                  <td
                    aria-hidden={hideAdjacent ? 'true' : undefined}
                    className={cn(
                      'h-36 border p-2 align-top text-current',
                      styles.border,
                      isToday && 'shadow-[inset_0_3px_0_var(--primary)]',
                    )}
                    data-adjacent-month-date={isAdjacent ? adjacentMonthDates : undefined}
                    data-calendar-date={cell.dateKey}
                    key={cell.dateKey}
                  >
                    {!hideAdjacent ? (
                      <time
                        className={cn(
                          'inline-flex min-h-6 min-w-6 items-center justify-center rounded-compact font-mono text-xs font-semibold tabular-nums',
                          isAdjacent &&
                            (surface === 'brand'
                              ? 'text-primary-foreground/35'
                              : 'text-muted-foreground/55'),
                          isToday && 'bg-primary px-1.5 text-primary-foreground',
                        )}
                        dateTime={cell.dateKey}
                      >
                        <span className="sr-only">{label}</span>
                        <span aria-hidden="true">{cell.day}</span>
                        {isToday ? <span className="sr-only">, today</span> : null}
                      </time>
                    ) : null}
                    {cell.inMonth ? (
                      <div className="mt-2 flex flex-col gap-1.5">
                        {cellEvents.slice(0, 2).map((event) => {
                          const isStart = cell.dateKey === event.startDateKey
                          const isEnd = cell.dateKey === event.endDateKey
                          return (
                            <a
                              aria-label={`${event.classification.title}: ${event.title}. ${event.rangeLabel}${event.allDay ? '. All day' : ''}`}
                              className={cn(
                                'block min-h-10 border-l-2 bg-[color-mix(in_oklch,var(--calendar-tone)_12%,transparent)] px-2 py-1.5 text-xs leading-4 font-normal text-current transition-colors hover:bg-[color-mix(in_oklch,var(--calendar-tone)_18%,transparent)] focus-visible:outline-none focus-visible:ring-2 motion-reduce:transition-none',
                                surface === 'brand'
                                  ? 'focus-visible:ring-primary-foreground'
                                  : 'focus-visible:ring-ring',
                                !isStart && 'border-l-0 pl-2',
                                isStart && 'rounded-l-compact',
                                isEnd && 'rounded-r-compact',
                              )}
                              data-calendar-event={event.id}
                              href={event.href}
                              key={event.id}
                              style={getCalendarToneStyle(event.classification.calendarColor)}
                            >
                              {!isStart ? <span className="sr-only">Continues: </span> : null}
                              {event.title}
                            </a>
                          )
                        })}
                        {hiddenCount > 0 ? (
                          <Button
                            className={cn(
                              'min-h-10 w-full justify-start px-0 text-left text-xs',
                              surface === 'brand' && 'text-current hover:text-current',
                            )}
                            onClick={() => onShowMore(cell.dateKey)}
                            size="sm"
                            type="button"
                            variant="link"
                          >
                            <span aria-hidden="true">+{hiddenCount} more</span>
                            <span className="sr-only">
                              Show {hiddenCount} more {hiddenCount === 1 ? 'event' : 'events'} on{' '}
                              {label}
                            </span>
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
