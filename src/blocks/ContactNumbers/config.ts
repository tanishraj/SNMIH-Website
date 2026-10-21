import type { ArrayField, Block, CheckboxField, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { DEFAULT_SITE_TIME_ZONE, SUPPORTED_SITE_TIME_ZONES } from '@/lib/siteTimeZone'

import { contactDayValues, isValidContactTime } from './normalizeContactNumbers'

const dayLabels: Record<(typeof contactDayValues)[number], string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

const validateTime = (value: unknown) =>
  !value || isValidContactTime(value) || 'Use 24-hour HH:MM, for example 09:30 or 17:30.'

const contactsField: ArrayField = {
  name: 'contacts',
  label: 'Contact Numbers',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 24,
  admin: {
    initCollapsed: true,
    description: 'Each number becomes a tap-to-call link. Visitors can also copy it.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'phone',
          label: 'Phone Number',
          type: 'text',
          required: true,
          admin: {
            description: 'Shown exactly as typed, e.g. "+91 91990 44557".',
            width: '50%',
          },
        },
        {
          name: 'label',
          label: 'Label',
          type: 'text',
          admin: { description: 'e.g. "Admission Panel"', width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'desk',
          label: 'Desk / Person',
          type: 'text',
          admin: {
            description: 'Optional name shown on cards and in the directory.',
            width: '50%',
          },
        },
        {
          name: 'group',
          label: 'Directory Group',
          type: 'text',
          admin: {
            description:
              'Department Directory layout only: contacts with the same group share a tab.',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          admin: { width: '50%' },
        },
        {
          name: 'whatsapp',
          label: 'Also on WhatsApp',
          type: 'checkbox',
          defaultValue: false,
          admin: { width: '50%' },
        } satisfies CheckboxField,
      ],
    },
    {
      name: 'hours',
      label: 'Hours',
      type: 'group',
      admin: {
        description:
          'Optional. With days and times set, visitors see whether this line is open now.',
      },
      fields: [
        {
          name: 'days',
          label: 'Days',
          type: 'select',
          hasMany: true,
          options: contactDayValues.map((value) => ({ label: dayLabels[value], value })),
        },
        {
          type: 'row',
          fields: [
            {
              name: 'opens',
              label: 'Opens (HH:MM)',
              type: 'text',
              validate: validateTime,
              admin: { placeholder: '09:30', width: '33%' },
            },
            {
              name: 'closes',
              label: 'Closes (HH:MM)',
              type: 'text',
              validate: validateTime,
              admin: { placeholder: '17:30', width: '33%' },
            },
            {
              name: 'summary',
              label: 'Hours Text',
              type: 'text',
              admin: {
                description: 'Optional override, e.g. "Mon–Sat · 9:30 AM – 5:30 PM".',
                width: '34%',
              },
            },
          ],
        },
      ],
    },
  ],
}

export const ContactNumbersBlock: Block = {
  admin: getBlockThumbnailAdmin('contactNumbers'),
  slug: 'contactNumbers',
  interfaceName: 'ContactNumbersBlock',
  labels: {
    singular: 'Contact Numbers',
    plural: 'Contact Numbers',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            contactsField,
            {
              name: 'availabilityNote',
              label: 'Availability Note',
              type: 'text',
              admin: {
                description:
                  'Optional line shown with the numbers, e.g. "Calls are answered in order".',
              },
            },
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'layout',
              label: 'Layout',
              type: 'select',
              defaultValue: 'switchboard',
              required: true,
              options: [
                { label: 'Switchboard (ruled rows with Copy and Call)', value: 'switchboard' },
                { label: 'Call Desk (card of tap-to-call rows)', value: 'callDesk' },
                { label: 'Desk Cards (one card per desk with hours)', value: 'deskCards' },
                { label: 'Help Ribbon (compact strip of number chips)', value: 'ribbon' },
                { label: 'Department Directory (tabbed by group)', value: 'directory' },
              ],
            } satisfies SelectField,
            {
              name: 'contentPosition',
              label: 'Section Content Position',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left of the numbers', value: 'left' },
                { label: 'Right of the numbers', value: 'right' },
                { label: 'Above the numbers', value: 'top' },
              ],
              admin: {
                condition: (_data, siblingData) =>
                  ['switchboard', 'callDesk', 'directory'].includes(
                    siblingData?.layout ?? 'switchboard',
                  ),
                description: 'Compact screens always place section content above the numbers.',
              },
            } satisfies SelectField,
            {
              name: 'tabStyle',
              label: 'Directory Tab Style',
              type: 'select',
              defaultValue: 'underline',
              options: [
                { label: 'Underline', value: 'underline' },
                { label: 'Pill', value: 'pill' },
                { label: 'Contained', value: 'contained' },
              ],
              admin: {
                condition: (_data, siblingData) => siblingData?.layout === 'directory',
                description: 'Tabs appear only when contacts use more than one Directory Group.',
              },
            } satisfies SelectField,
            {
              name: 'cardColumns',
              label: 'Desktop Columns',
              type: 'select',
              defaultValue: '3',
              options: [
                { label: '2 columns', value: '2' },
                { label: '3 columns', value: '3' },
                { label: '4 columns', value: '4' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.layout === 'deskCards' },
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                description:
                  'Aligns the eyebrow, heading, description, and actions within their available width.',
              },
            } satisfies SelectField,
            {
              name: 'showCopyButtons',
              label: 'Show Copy buttons',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'showOpenStatus',
              label: 'Show "Open now" status',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Uses each contact’s days and times.' },
            } satisfies CheckboxField,
            {
              name: 'timeZone',
              label: 'Hours Timezone',
              type: 'select',
              defaultValue: DEFAULT_SITE_TIME_ZONE,
              required: true,
              options: SUPPORTED_SITE_TIME_ZONES.map((value) => ({ label: value, value })),
              admin: {
                condition: (_data, siblingData) => siblingData?.showOpenStatus !== false,
                description:
                  'Opening times are read in this timezone, whatever the visitor’s location.',
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
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
