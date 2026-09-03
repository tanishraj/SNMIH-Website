import type { Block, RelationshipField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCalendarDownloadPanelFields } from '@/blocks/shared/calendarPdfFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import {
  CALENDAR_MAX_CLASSIFICATIONS,
  getCalendarClassificationIDs,
} from '@/blocks/Calendar/calendarShared'

export const CalendarBlock: Block = {
  admin: getBlockThumbnailAdmin('calendar'),
  slug: 'calendar',
  interfaceName: 'CalendarBlock',
  labels: { plural: 'Calendars', singular: 'Calendar' },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'eyebrow',
              type: 'text',
              admin: { description: 'Small label above the optional section heading.' },
            },
            {
              name: 'title',
              type: 'text',
              admin: { description: 'Optional Calendar section heading.' },
            },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Header Actions', maxRows: 2 }),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            {
              name: 'classifications',
              label: 'Event Classifications',
              type: 'relationship',
              relationTo: 'news-event-classifications',
              hasMany: true,
              minRows: 1,
              maxRows: CALENDAR_MAX_CLASSIFICATIONS,
              required: true,
              filterOptions: {
                and: [{ active: { equals: true } }, { behavior: { equals: 'event' } }],
              },
              validate: (value) => {
                if (!Array.isArray(value) || value.length === 0) {
                  return 'Select at least one Event classification.'
                }
                const normalized = getCalendarClassificationIDs(value)
                if (normalized.length !== value.length) {
                  return 'Choose each Event classification only once.'
                }
                return true
              },
              admin: {
                allowCreate: false,
                description:
                  'Choose one to five active Event classifications and drag them into visitor legend order.',
                isSortable: true,
              },
            } satisfies RelationshipField,
            {
              name: 'upcomingEyebrow',
              label: 'Upcoming Eyebrow',
              type: 'text',
              defaultValue: 'Up next',
            },
            {
              name: 'upcomingTitle',
              label: 'Upcoming Title',
              type: 'text',
              defaultValue: 'Upcoming',
            },
            ...createCalendarDownloadPanelFields(),
            {
              name: 'emptyStateMessage',
              label: 'Empty State Message',
              type: 'text',
              defaultValue: 'No events are scheduled for this month.',
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'adjacentMonthDates',
              label: 'Adjacent Month Dates',
              type: 'select',
              defaultValue: 'muted',
              options: [
                { label: 'Muted / Disabled', value: 'muted' },
                { label: 'Hidden', value: 'hidden' },
              ],
              required: true,
              admin: {
                description:
                  'Choose whether dates outside the selected month remain faintly visible or are hidden.',
              },
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
              required: true,
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
