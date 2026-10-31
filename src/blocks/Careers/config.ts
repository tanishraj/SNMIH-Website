import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

export const careersLayoutOptions = [
  { label: 'Notice board (centred intro, department badges)', value: 'notice' },
  { label: 'Register (grouped rows with location and posts)', value: 'register' },
  { label: 'Ledger (grouped rows, title and closing date only)', value: 'ledger' },
  { label: 'Departments (group name beside its roles)', value: 'departments' },
] as const

export const careersEmploymentOptions = [
  { label: 'Regular', value: 'regular' },
  { label: 'Contract', value: 'contract' },
  { label: 'Part time', value: 'partTime' },
  { label: 'Visiting', value: 'visiting' },
  { label: 'Internship / training', value: 'training' },
] as const

const groupsField = {
  name: 'groups',
  label: 'Groups',
  type: 'array',
  maxRows: 12,
  admin: {
    components: { RowLabel: '/blocks/Careers/RowLabels#CareersGroupRowLabel' },
    initCollapsed: true,
    description:
      'Headings the openings are listed under, in display order, e.g. Faculty, Residents & nursing, Administration. Openings without a group appear under "Other openings".',
  },
  fields: [
    {
      name: 'name',
      label: 'Group Name',
      type: 'text',
      required: true,
      admin: { placeholder: 'e.g. Faculty' },
    },
  ],
} satisfies ArrayField

const half = { width: '50%' }
const date = { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' } as const

const openingsField = {
  name: 'openings',
  label: 'Openings',
  type: 'array',
  minRows: 1,
  maxRows: 60,
  admin: {
    components: { RowLabel: '/blocks/Careers/RowLabels#CareersOpeningRowLabel' },
    initCollapsed: true,
    description:
      'One row per advertised post. Closed posts stay here for your records but are not shown. The Notice board layout also shows the reference, summary and location; the Register adds location and number of posts.',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'title',
          label: 'Post',
          type: 'text',
          required: true,
          admin: { ...half, placeholder: 'e.g. Professor – General Medicine' },
        },
        {
          name: 'status',
          type: 'select',
          defaultValue: 'open',
          required: true,
          options: [
            { label: 'Open', value: 'open' },
            { label: 'Closed', value: 'closed' },
          ],
          admin: half,
        } satisfies SelectField,
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'group',
          label: 'Group',
          type: 'text',
          admin: {
            ...half,
            components: { Field: '/blocks/Careers/GroupField#CareersGroupField' },
          },
        },
        {
          name: 'department',
          type: 'text',
          admin: { ...half, placeholder: 'e.g. General Medicine' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'employmentType',
          label: 'Employment',
          type: 'select',
          defaultValue: 'regular',
          options: [...careersEmploymentOptions],
          admin: half,
        } satisfies SelectField,
        {
          name: 'employmentNote',
          label: 'Employment Detail',
          type: 'text',
          admin: { ...half, placeholder: 'e.g. 3 years' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'positions',
          label: 'Posts',
          type: 'number',
          min: 1,
          max: 999,
          admin: { ...half, placeholder: 'Number of vacancies' },
        },
        {
          name: 'reference',
          label: 'Reference No.',
          type: 'text',
          admin: { ...half, placeholder: 'e.g. SNMIH/FAC/2026/41' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'publishedOn',
          label: 'Published On',
          type: 'date',
          admin: { ...half, date },
        },
        {
          name: 'applyBy',
          label: 'Apply By',
          type: 'date',
          admin: { ...half, date },
        },
      ],
    },
    {
      name: 'location',
      type: 'text',
      admin: { placeholder: 'e.g. Saharsa campus' },
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 300,
      admin: { placeholder: 'One or two sentences, shown by the Notice board layout.' },
    },
    createContentActionsField({
      name: 'actions',
      label: 'Link',
      maxRows: 1,
    }),
  ],
} satisfies ArrayField

export const CareersBlock: Block = {
  admin: getBlockThumbnailAdmin('careers'),
  slug: 'careers',
  interfaceName: 'CareersBlock',
  labels: {
    singular: 'Careers',
    plural: 'Careers',
  },
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
              admin: { placeholder: 'Optional small label above the title, e.g. Careers at SNMIH' },
            },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            groupsField,
            openingsField,
            {
              name: 'note',
              label: 'Closing Note',
              type: 'textarea',
              maxLength: 300,
              admin: {
                description:
                  'Shown under the list, e.g. how to send an unsolicited application. Web and e-mail addresses become links.',
              },
            },
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            {
              name: 'emptyMessage',
              label: 'Empty Message',
              type: 'text',
              defaultValue: 'There are no open positions at the moment.',
              admin: { description: 'Shown when every post is closed or the list is empty.' },
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'layout',
              type: 'select',
              defaultValue: 'register',
              required: true,
              options: [...careersLayoutOptions],
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
              admin: {
                description: 'The Notice board layout always centres its introduction.',
              },
            } satisfies SelectField,
            {
              name: 'showGroupNumbers',
              label: 'Show Group Numbers',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Numbers group headings 01, 02… in the Register, Ledger and Departments layouts.',
              },
            },
            {
              name: 'showCount',
              label: 'Show Open Position Count',
              type: 'checkbox',
              defaultValue: true,
            },
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
