import { AnnualCalendarUpcoming } from '@/blocks/AnnualCalendar/AnnualCalendarUpcoming'
import { AnnualCalendarYearStream } from '@/blocks/AnnualCalendar/AnnualCalendarYearStream'
import type { AnnualCalendarInitialSnapshot } from '@/blocks/AnnualCalendar/annualCalendarShared'
import type { AnnualCalendarPeriodInput } from '@/blocks/AnnualCalendar/annualCalendarShared'
import {
  resolveBlockAppearanceClasses,
  type BlockAppearance,
} from '@/blocks/shared/blockAppearance'
import { BlockFooterActions } from '@/blocks/shared/BlockFooterActions'
import { CalendarSidebar } from '@/blocks/shared/CalendarSidebar'
import { resolveCalendarDownloadPanel } from '@/blocks/shared/calendarPdf'
import {
  regularBlockContainerClasses,
  regularBlockMobilePaddingClasses,
  type RegularBlockSize,
} from '@/blocks/shared/blockSpacing'
import {
  contentSectionDescriptionClasses,
  contentSectionHeadingClasses,
} from '@/blocks/shared/contentStyles'
import { ContentActions } from '@/components/ContentActions'
import { SectionEyebrow, type SectionEyebrowSurface } from '@/components/SectionEyebrow'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { resolveCmsActions, type CmsActionValue } from '@/lib/cmsLinks'
import { cn } from '@/lib/utils'
import type { Media } from '@/payload-types'

export type AnnualCalendarBlockLike = AnnualCalendarPeriodInput & {
  accentTitle?: string | null
  actions?: CmsActionValue[] | null
  appearance?: BlockAppearance | null
  calendarPdf?: string | number | Media | null
  calendarPdfAction?: CmsActionValue[] | null
  calendarPdfLabel?: string | null
  calendarPdfTitle?: string | null
  classifications?: unknown
  contentAlignment?: 'center' | 'left' | null
  description?: string | null
  emptyStateMessage?: string | null
  eyebrow?: string | null
  footerActions?: CmsActionValue[] | null
  size?: RegularBlockSize | null
  title?: string | null
  upcomingEyebrow?: string | null
  upcomingTitle?: string | null
}

type AnnualCalendarBlockPresentationProps = AnnualCalendarBlockLike & {
  draft?: boolean
  initial?: AnnualCalendarInitialSnapshot | null
}

const alignmentClasses = {
  center: 'mx-auto items-center text-center',
  left: 'items-start text-left',
} as const

export function AnnualCalendarBlockPresentation({
  accentTitle,
  actions,
  appearance,
  calendarPdf,
  calendarPdfAction,
  calendarPdfLabel,
  calendarPdfTitle,
  contentAlignment = 'left',
  description,
  emptyStateMessage,
  eyebrow,
  footerActions,
  initial,
  size = 'default',
  title,
  upcomingEyebrow,
  upcomingTitle,
}: AnnualCalendarBlockPresentationProps) {
  const appearanceClasses = resolveBlockAppearanceClasses(appearance)
  const surface: SectionEyebrowSurface = appearanceClasses.background
  const alignment = contentAlignment === 'center' ? 'center' : 'left'
  const resolvedActions = resolveCmsActions(actions)
  const resolvedEyebrow = eyebrow?.trim()
  const resolvedTitle = title?.trim()
  const resolvedAccentTitle = accentTitle?.trim()
  const resolvedDescription = description?.trim()
  const hasHeader = Boolean(
    resolvedEyebrow ||
    resolvedTitle ||
    resolvedAccentTitle ||
    resolvedDescription ||
    resolvedActions.length,
  )
  const resolvedEmptyMessage =
    emptyStateMessage?.trim() || 'No events are scheduled for this month.'
  const resolvedCalendarPdf = resolveCalendarDownloadPanel({
    actions: calendarPdfAction,
    legacyLabel: calendarPdfLabel,
    legacyMedia: calendarPdf,
    title: calendarPdfTitle,
  })
  const resolvedUpcomingTitle = upcomingTitle?.trim() || 'Coming next'

  return (
    <section
      className={cn(
        regularBlockMobilePaddingClasses[size ?? 'default'],
        appearanceClasses.className,
      )}
      data-annual-calendar-block="true"
      data-block-surface={appearanceClasses.surface}
    >
      <div className={cn(regularBlockContainerClasses, 'flex flex-col gap-10')}>
        {hasHeader ? (
          <header
            className={cn(
              'flex flex-col gap-6',
              alignment === 'left' &&
                resolvedActions.length > 0 &&
                'md:flex-row md:items-center md:justify-between',
            )}
          >
            <div className={cn('flex max-w-3xl flex-col gap-4', alignmentClasses[alignment])}>
              {resolvedEyebrow ? (
                <SectionEyebrow surface={surface}>{resolvedEyebrow}</SectionEyebrow>
              ) : null}
              {resolvedTitle || resolvedAccentTitle ? (
                <h2 className={contentSectionHeadingClasses}>
                  {resolvedTitle ? <span className="font-[inherit]">{resolvedTitle}</span> : null}
                  {resolvedTitle && resolvedAccentTitle ? ' ' : null}
                  {resolvedAccentTitle ? (
                    <em className="font-[inherit]">{resolvedAccentTitle}</em>
                  ) : null}
                </h2>
              ) : null}
              {resolvedDescription ? (
                <p className={contentSectionDescriptionClasses}>{resolvedDescription}</p>
              ) : null}
            </div>
            {resolvedActions.length > 0 ? (
              <ContentActions
                actions={resolvedActions}
                alignment={alignment}
                className="md:w-auto md:shrink-0"
              />
            ) : null}
          </header>
        ) : null}

        {initial ? (
          <div
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-stretch"
            data-annual-calendar-layout="true"
          >
            <AnnualCalendarYearStream
              emptyMessage={resolvedEmptyMessage}
              eventCount={initial.eventCount}
              months={initial.months}
              periodLabel={initial.periodLabel}
              surface={appearanceClasses.surface}
              todayKey={initial.todayKey}
            />
            <CalendarSidebar
              download={resolvedCalendarPdf}
              label={resolvedUpcomingTitle}
              surface={appearanceClasses.surface}
            >
              <AnnualCalendarUpcoming
                embedded
                emptyMessage={resolvedEmptyMessage}
                eyebrow={upcomingEyebrow?.trim() || 'Up next'}
                events={initial.upcoming}
                surface={appearanceClasses.surface}
                title={resolvedUpcomingTitle}
              />
            </CalendarSidebar>
          </div>
        ) : (
          <Empty className="min-h-64 rounded-card border border-current/15 bg-transparent text-current">
            <EmptyHeader>
              <EmptyTitle>Annual Calendar is not configured</EmptyTitle>
              <EmptyDescription>
                Select at least one active Event classification to show the annual schedule.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        <BlockFooterActions actions={footerActions} alignment={alignment} className="mt-0" />
      </div>
    </section>
  )
}
