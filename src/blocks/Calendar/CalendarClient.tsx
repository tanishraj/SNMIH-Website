'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { CalendarMonthView } from '@/blocks/Calendar/CalendarMonthView'
import { CalendarTimelineView } from '@/blocks/Calendar/CalendarTimelineView'
import { CalendarUpcoming } from '@/blocks/Calendar/CalendarUpcoming'
import {
  getAdjacentCalendarMonth,
  getCalendarMonthCacheKey,
  type CalendarAdjacentMonthDates,
  type CalendarInitialSnapshot,
  type CalendarMonthSnapshot,
} from '@/blocks/Calendar/calendarShared'
import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { CalendarSidebar } from '@/blocks/shared/CalendarSidebar'
import type { ResolvedCalendarDownloadPanel } from '@/blocks/shared/calendarPdf'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

type CalendarView = 'calendar' | 'timeline'
type PendingMonth = { key: string; label: string } | null

type CalendarClientProps = {
  adjacentMonthDates?: CalendarAdjacentMonthDates
  draft?: boolean
  emptyMessage: string
  initial: CalendarInitialSnapshot
  pdfDownload?: ResolvedCalendarDownloadPanel
  surface?: BlockSurface
  upcomingEyebrow: string
  upcomingTitle: string
}

const monthLabel = (monthKey: string): string =>
  new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC', year: 'numeric' }).format(
    new Date(`${monthKey}-01T00:00:00.000Z`),
  )

const isMonthSnapshot = (value: unknown, expectedMonth: string): value is CalendarMonthSnapshot => {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<CalendarMonthSnapshot>
  return record.version === 1 && record.monthKey === expectedMonth && Array.isArray(record.events)
}

export function CalendarClient({
  adjacentMonthDates = 'muted',
  draft = false,
  emptyMessage,
  initial,
  pdfDownload,
  surface = 'light',
  upcomingEyebrow,
  upcomingTitle,
}: CalendarClientProps) {
  const styles = resolveCalendarSurfaceClasses(surface)
  const classificationIDs = useMemo(
    () => initial.classifications.map(({ id }) => id),
    [initial.classifications],
  )
  const [view, setView] = useState<CalendarView>('calendar')
  const [filter, setFilter] = useState('all')
  const [month, setMonth] = useState(initial.month)
  const [pending, setPending] = useState<PendingMonth>(null)
  const [failedTarget, setFailedTarget] = useState<PendingMonth>(null)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState(`Showing ${initial.month.monthLabel}.`)
  const [focusDate, setFocusDate] = useState<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const requestKeyRef = useRef<string | null>(null)
  const cacheRef = useRef(
    new Map([[getCalendarMonthCacheKey(initial.month.monthKey, classificationIDs), initial.month]]),
  )

  useEffect(() => () => requestRef.current?.abort(), [])

  const filteredEvents = useMemo(
    () =>
      filter === 'all'
        ? month.events
        : month.events.filter(({ classification }) => classification.id === filter),
    [filter, month.events],
  )
  const selectedClassification = initial.classifications.find(({ id }) => id === filter)
  const resolvedEmptyMessage = selectedClassification
    ? `${emptyMessage} No ${selectedClassification.title} events match this month.`
    : emptyMessage

  const loadMonth = async (target: PendingMonth) => {
    if (!target) return
    const key = getCalendarMonthCacheKey(target.key, classificationIDs)
    const cached = cacheRef.current.get(key)
    requestRef.current?.abort()
    setError(null)
    setFailedTarget(null)

    if (cached) {
      setMonth(cached)
      setAnnouncement(`Showing ${cached.monthLabel}.`)
      return
    }

    const controller = new AbortController()
    requestRef.current = controller
    requestKeyRef.current = key
    setPending(target)
    try {
      const params = new URLSearchParams({
        classifications: classificationIDs.join(','),
        month: target.key,
      })
      if (draft) params.set('draft', 'true')
      const response = await fetch(`/api/calendar-events?${params.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
      })
      if (!response.ok) throw new Error('Calendar request failed.')
      const next = (await response.json()) as unknown
      if (!isMonthSnapshot(next, target.key)) throw new Error('Calendar response was invalid.')
      if (requestKeyRef.current !== key) return
      cacheRef.current.set(key, next)
      setMonth(next)
      setAnnouncement(`Showing ${next.monthLabel}.`)
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') return
      if (requestKeyRef.current !== key) return
      setError('We could not load that month. Your current events are still shown.')
      setFailedTarget(target)
    } finally {
      if (requestKeyRef.current === key) setPending(null)
    }
  }

  const navigate = (offset: number) => {
    const key = getAdjacentCalendarMonth(month.monthKey, offset)
    void loadMonth({ key, label: monthLabel(key) })
  }

  const showMore = (dateKey: string) => {
    setFocusDate(dateKey)
    setView('timeline')
    setAnnouncement(`Timeline view. Focused events for ${dateKey}.`)
  }

  return (
    <div data-calendar-client="true">
      <Tabs
        className="gap-4"
        onValueChange={(value) => {
          if (value === 'calendar' || value === 'timeline') {
            setView(value)
            setAnnouncement(`${value === 'calendar' ? 'Calendar' : 'Timeline'} view.`)
          }
        }}
        value={view}
      >
        <div className={styles.toolbar}>
          <div
            className={cn(
              'grid grid-cols-[2.75rem_minmax(9rem,1fr)_2.75rem] items-center border-b sm:border-r sm:border-b-0',
              styles.border,
            )}
          >
            <Button
              aria-label={`Show previous month, ${monthLabel(getAdjacentCalendarMonth(month.monthKey, -1))}`}
              className={styles.navButton}
              disabled={Boolean(pending)}
              onClick={() => navigate(-1)}
              size="icon-lg"
              type="button"
              variant="ghost"
            >
              <ChevronLeft aria-hidden="true" data-icon="inline-start" />
            </Button>
            <p className="px-3 text-center font-sans text-sm font-semibold tabular-nums">
              {pending?.label ?? month.monthLabel}
            </p>
            <Button
              aria-label={`Show next month, ${monthLabel(getAdjacentCalendarMonth(month.monthKey, 1))}`}
              className={styles.navButton}
              disabled={Boolean(pending)}
              onClick={() => navigate(1)}
              size="icon-lg"
              type="button"
              variant="ghost"
            >
              <ChevronRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 p-2">
            <TabsList aria-label="Calendar view" className={styles.tabsList} variant="default">
              <TabsTrigger className={styles.tabsTrigger} value="calendar">
                Calendar
              </TabsTrigger>
              <TabsTrigger className={styles.tabsTrigger} value="timeline">
                Timeline
              </TabsTrigger>
            </TabsList>
            <Select onValueChange={setFilter} value={filter}>
              <SelectTrigger
                aria-label="Filter events by classification"
                className={styles.selectTrigger}
              >
                <SelectValue placeholder="All event types" />
              </SelectTrigger>
              <SelectContent className={styles.selectContent}>
                <SelectGroup>
                  <SelectItem className={styles.selectItem} value="all">
                    All event types
                  </SelectItem>
                  {initial.classifications.map((classification) => (
                    <SelectItem
                      className={styles.selectItem}
                      key={classification.id}
                      value={classification.id}
                    >
                      {classification.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error ? (
          <Alert className={styles.alert} variant="destructive">
            <AlertDescription>{error}</AlertDescription>
            <AlertAction>
              <Button
                className={
                  surface === 'brand' ? 'border-primary-foreground/30 text-current' : undefined
                }
                onClick={() => void loadMonth(failedTarget)}
                size="sm"
                type="button"
                variant="outline"
              >
                Retry
              </Button>
            </AlertAction>
          </Alert>
        ) : null}

        <div
          aria-busy={Boolean(pending)}
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch"
          data-calendar-layout="true"
        >
          <main className="min-w-0">
            <TabsContent className="mt-0" value="calendar">
              <div className="hidden md:block">
                <CalendarMonthView
                  adjacentMonthDates={adjacentMonthDates}
                  events={filteredEvents}
                  monthKey={month.monthKey}
                  onShowMore={showMore}
                  surface={surface}
                  todayKey={initial.todayKey}
                />
              </div>
              <div className="md:hidden">
                <CalendarTimelineView
                  emptyMessage={resolvedEmptyMessage}
                  events={filteredEvents}
                  surface={surface}
                />
              </div>
            </TabsContent>
            <TabsContent className="mt-0" value="timeline">
              <CalendarTimelineView
                emptyMessage={resolvedEmptyMessage}
                events={filteredEvents}
                focusDate={focusDate}
                surface={surface}
              />
            </TabsContent>
          </main>
          <CalendarSidebar download={pdfDownload} label={upcomingTitle} surface={surface}>
            <CalendarUpcoming
              classifications={initial.classifications}
              embedded
              emptyMessage={emptyMessage}
              eyebrow={upcomingEyebrow}
              events={initial.upcoming}
              surface={surface}
              title={upcomingTitle}
            />
          </CalendarSidebar>
        </div>
      </Tabs>
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  )
}
