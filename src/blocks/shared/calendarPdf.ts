import {
  DEFAULT_CALENDAR_PDF_LABEL,
  DEFAULT_CALENDAR_PDF_TITLE,
} from '@/blocks/shared/calendarPdfFields'
import { getMediaAbsoluteUrl, isMediaDoc } from '@/lib/media'
import { resolveCmsActions, type CmsActionValue, type ResolvedCmsAction } from '@/lib/cmsLinks'
import type { Media } from '@/payload-types'

export type ResolvedCalendarPdf = {
  filename?: string
  href: string
  label: string
  title: string
}

export type ResolvedCalendarDownloadPanel = {
  action: ResolvedCmsAction
  title: string
}

type CalendarDownloadPanelValue = {
  actions?: CmsActionValue[] | null
  legacyLabel?: string | null
  legacyMedia?: string | number | Media | null
  title?: string | null
}

const isPdfMedia = (media: CmsActionValue['file']): media is Media =>
  isMediaDoc(media) && media.mimeType?.toLowerCase() === 'application/pdf'

export function resolveCalendarPdf(
  media: string | number | Media | null | undefined,
  title?: string | null,
  label?: string | null,
): ResolvedCalendarPdf | undefined {
  if (!isPdfMedia(media)) return undefined

  const href = getMediaAbsoluteUrl(media)
  if (!href) return undefined

  return {
    filename: media.filename?.trim() || undefined,
    href,
    label: label?.trim() || DEFAULT_CALENDAR_PDF_LABEL,
    title: title?.trim() || DEFAULT_CALENDAR_PDF_TITLE,
  }
}

export function resolveCalendarDownloadPanel({
  actions,
  legacyLabel,
  legacyMedia,
  title,
}: CalendarDownloadPanelValue): ResolvedCalendarDownloadPanel | undefined {
  const resolvedTitle = title?.trim() || DEFAULT_CALENDAR_PDF_TITLE

  if ((actions?.length ?? 0) > 0) {
    const action = resolveCmsActions(actions, 'button')[0]
    if (!action) return undefined

    return { action, title: resolvedTitle }
  }

  const legacy = resolveCalendarPdf(legacyMedia, resolvedTitle, legacyLabel)
  if (!legacy) return undefined

  return {
    action: {
      download: legacy.filename || true,
      href: legacy.href,
      indicator: 'download',
      indicatorPosition: 'left',
      label: legacy.label,
      mode: 'button',
      openInNewTab: false,
      showArrow: false,
      variant: 'outline',
    },
    title: legacy.title,
  }
}
