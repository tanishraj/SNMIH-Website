import { FileText } from 'lucide-react'

import { resolveCalendarSurfaceClasses } from '@/blocks/Calendar/calendarStyles'
import type { BlockSurface } from '@/blocks/shared/blockAppearance'
import type { ResolvedCalendarDownloadPanel } from '@/blocks/shared/calendarPdf'
import { ContentActions } from '@/components/ContentActions'
import { cn } from '@/lib/utils'

type CalendarPdfDownloadProps = {
  download: ResolvedCalendarDownloadPanel
  embedded?: boolean
  surface?: BlockSurface
}

export function CalendarPdfDownload({
  download,
  embedded = false,
  surface = 'light',
}: CalendarPdfDownloadProps) {
  const styles = resolveCalendarSurfaceClasses(surface)

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-4 p-5',
        embedded ? cn('border-t lg:mt-auto', styles.border) : styles.panel,
      )}
      data-calendar-pdf-download="true"
      data-calendar-pdf-embedded={embedded ? 'true' : undefined}
    >
      <div className="flex min-w-0 items-start gap-3">
        <FileText
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0"
          data-calendar-pdf-icon="true"
        />
        <p className="min-w-0 break-words font-semibold" data-calendar-pdf-title="true">
          {download.title}
        </p>
      </div>
      <ContentActions
        actions={[download.action]}
        buttonClassNames={{ [download.action.variant]: 'w-full' }}
        className="w-full"
      />
    </div>
  )
}
