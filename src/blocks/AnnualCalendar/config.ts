import type { Block, DateField, RelationshipField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import {
  getAnnualCalendarClassificationIDs,
  validateAnnualCalendarCustomPeriod,
  type AnnualCalendarPeriodInput,
} from '@/blocks/AnnualCalendar/annualCalendarShared'
import { CALENDAR_MAX_CLASSIFICATIONS } from '@/blocks/Calendar/calendarShared'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCalendarDownloadPanelFields } from '@/blocks/shared/calendarPdfFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

const customPeriodCondition = (_data: unknown, siblingData?: AnnualCalendarPeriodInput) =>
  siblingData?.periodMode === 'customAcademicYear'

const validateCustomPeriodDate = (
  _value: unknown,
  { siblingData }: { siblingData?: AnnualCalendarPeriodInput },
): true | string =>
  siblingData?.periodMode !== 'customAcademicYear'
    ? true
    : validateAnnualCalendarCustomPeriod(siblingData)

export const AnnualCalendarBlock: Block = {
  admin: getBlockThumbnailAdmin('annualCalendar'),
  slug: 'annualCalendar',
  interfaceName: 'AnnualCalendarBlock',
  labels: { plural: 'Annual Calendars', singular: 'Annual Calendar' },
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
              admin: { description: 'Optional Annual Calendar section heading.' },
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
              name: 'periodMode',
              label: 'Calendar Period',
              type: 'select',
              defaultValue: 'currentYear',
              options: [
                { label: 'Current calendar year', value: 'currentYear' },
                { label: 'Custom academic year', value: 'customAcademicYear' },
              ],
              required: true,
              admin: {
                description:
                  'Use the current January–December year or define one academic year containing exactly 12 months.',
              },
            } satisfies SelectField,
            {
              type: 'row',
              fields: [
                {
                  name: 'periodStartDate',
                  label: 'Academic Year Start Date',
                  type: 'date',
                  validate: validateCustomPeriodDate,
                  admin: {
                    condition: customPeriodCondition,
                    date: { pickerAppearance: 'dayOnly' },
                    description:
                      'The selected day is ignored; its month and year start the period.',
                    width: '50%',
                  },
                } satisfies DateField,
                {
                  name: 'periodEndDate',
                  label: 'Academic Year End Date',
                  type: 'date',
                  validate: validateCustomPeriodDate,
                  admin: {
                    condition: customPeriodCondition,
                    date: { pickerAppearance: 'dayOnly' },
                    description: 'Choose a month that completes exactly 12 consecutive months.',
                    width: '50%',
                  },
                } satisfies DateField,
              ],
            },
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
                const normalized = getAnnualCalendarClassificationIDs(value)
                if (normalized.length !== value.length) {
                  return 'Choose each Event classification only once.'
                }
                return true
              },
              admin: {
                allowCreate: false,
                description:
                  'Choose one to five active Event classifications and drag them into visitor order.',
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
              defaultValue: 'Coming next',
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
