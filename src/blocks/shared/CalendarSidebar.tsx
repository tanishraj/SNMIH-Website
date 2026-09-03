import type { ReactNode } from 'react'

import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import { CalendarPdfDownload } from '@/blocks/shared/CalendarPdfDownload'
import type { ResolvedCalendarDownloadPanel } from '@/blocks/shared/calendarPdf'
import { cn } from '@/lib/utils'

type CalendarSidebarProps = {
  children: ReactNode
  download?: ResolvedCalendarDownloadPanel
  label: string
  surface?: BlockSurface
}

export function CalendarSidebar({
  children,
  download,
  label,
  surface = 'light',
}: CalendarSidebarProps) {
  const styles = resolveCalendarSurfaceClasses(surface)

  return (
    <aside
      aria-label={`${label} calendar sidebar`}
      className={cn(styles.panel, 'flex min-w-0 flex-col lg:h-full')}
      data-calendar-sidebar="true"
    >
      {children}
      {download ? <CalendarPdfDownload download={download} embedded surface={surface} /> : null}
    </aside>
  )
}
