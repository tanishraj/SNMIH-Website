import type { CollapsibleField, Field, UploadField } from 'payload'

import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

export const DEFAULT_CALENDAR_PDF_LABEL = 'Download'
export const DEFAULT_CALENDAR_PDF_TITLE = 'Academic calendar PDF'

export const createCalendarDownloadPanelFields = (): Field[] => [
  {
    type: 'collapsible',
    label: 'Download Panel',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'calendarPdfTitle',
        label: 'PDF Document Label',
        type: 'text',
        defaultValue: DEFAULT_CALENDAR_PDF_TITLE,
      },
      createContentActionsField({
        label: 'Action',
        maxRows: 1,
        name: 'calendarPdfAction',
      }),
      {
        name: 'calendarPdf',
        label: 'Legacy Calendar PDF',
        type: 'upload',
        relationTo: 'media',
        filterOptions: { mimeType: { equals: 'application/pdf' } },
        admin: { hidden: true },
      } satisfies UploadField,
      {
        name: 'calendarPdfLabel',
        label: 'Legacy PDF Button Label',
        type: 'text',
        defaultValue: DEFAULT_CALENDAR_PDF_LABEL,
        admin: { hidden: true },
      },
    ],
  } satisfies CollapsibleField,
]
