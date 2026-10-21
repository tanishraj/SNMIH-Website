import type { ArrayField, Block, CheckboxField, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardBackgroundField } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

const itemsField: ArrayField = {
  name: 'items',
  label: 'Checklist Items',
  type: 'array',
  minRows: 1,
  maxRows: 60,
  required: true,
  admin: {
    initCollapsed: true,
    description: 'Items are numbered automatically in the order shown here.',
  },
  fields: [
    {
      name: 'label',
      label: 'Document',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g. "Caste Certificate" or "Mark sheets of MBBS (I, II & III Parts)"',
      },
    },
    {
      name: 'qualifier',
      label: 'Condition Tag',
      type: 'text',
      admin: {
        description: 'Optional short tag shown beside the document, e.g. "If required".',
      },
    },
    {
      name: 'details',
      label: 'Details',
      type: 'textarea',
      admin: {
        description: 'Optional supporting text, e.g. "As per para-7(B) of the prospectus".',
      },
    },
  ],
}

const notesField: ArrayField = {
  name: 'notes',
  label: 'Notes',
  type: 'array',
  maxRows: 6,
  admin: {
    initCollapsed: true,
    description: 'Notes shown in the sidebar beside the checklist.',
  },
  fields: [
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      defaultValue: 'Note',
    },
    {
      name: 'text',
      label: 'Text',
      type: 'textarea',
      required: true,
    },
  ],
}

export const DocumentChecklistBlock: Block = {
  admin: getBlockThumbnailAdmin('documentChecklist'),
  slug: 'documentChecklist',
  interfaceName: 'DocumentChecklistBlock',
  labels: {
    singular: 'Document Checklist',
    plural: 'Document Checklists',
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
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'accentTitle',
              label: 'Accent Title (Italic)',
              type: 'text',
            },
            {
              name: 'description',
              type: 'textarea',
              admin: {
                description: 'Introductory instruction shown above the checklist.',
              },
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            itemsField,
            notesField,
            {
              name: 'progressLabel',
              label: 'Progress Label',
              type: 'text',
              defaultValue: 'Your progress',
              admin: {
                description: 'Heading above the progress count when visitor tracking is enabled.',
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
              name: 'presentation',
              label: 'Presentation',
              type: 'select',
              defaultValue: 'tracker',
              required: true,
              options: [
                { label: 'Tracker (bordered checklist card)', value: 'tracker' },
                { label: 'Editorial Ledger (hairline rules, serif numerals)', value: 'ledger' },
              ],
              admin: {
                description:
                  'Editorial Ledger sits directly on the section with no card. For its calmest look, turn off the progress panel and visitor ticking.',
              },
            } satisfies SelectField,
            {
              name: 'layoutMode',
              label: 'Layout Mode',
              type: 'select',
              defaultValue: 'stacked',
              options: [
                { label: 'Stacked', value: 'stacked' },
                { label: 'Split', value: 'split' },
              ],
              admin: {
                description:
                  'Split places section content, progress, and notes beside the checklist on desktop. Compact screens stack content above the checklist.',
              },
            } satisfies SelectField,
            {
              name: 'splitProportion',
              label: 'Split Proportion',
              type: 'select',
              defaultValue: 'checklistFocus',
              options: [
                { label: 'Balanced (50 / 50)', value: 'balanced' },
                { label: 'Checklist Focus (40 / 60)', value: 'checklistFocus' },
                { label: 'Section Content Focus (60 / 40)', value: 'sectionFocus' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.layoutMode === 'split' },
            } satisfies SelectField,
            {
              name: 'checklistPosition',
              label: 'Checklist Position',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.layoutMode === 'split' },
            } satisfies SelectField,
            {
              name: 'sectionVerticalAlignment',
              label: 'Section Content Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              options: [
                { label: 'Top', value: 'topStatic' },
                // `top` keeps its original sticky meaning so saved content is unchanged.
                { label: 'Top (stays in view while scrolling)', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.layoutMode === 'split' },
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              admin: {
                description:
                  'Aligns the eyebrow, heading, description, and actions within their available width in both layouts.',
              },
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'actionsPosition',
              label: 'Section Actions Position',
              type: 'select',
              defaultValue: 'intro',
              options: [
                { label: 'With the introduction', value: 'intro' },
                { label: 'At the bottom', value: 'bottom' },
              ],
              admin: {
                description:
                  'At the bottom places Section Actions at the foot of the introduction column in Split (level with the end of the checklist), or after the checklist when stacked or on small screens. Footer Actions still appear below the whole section.',
              },
            } satisfies SelectField,
            {
              name: 'enableTracking',
              label: 'Let visitors tick off documents',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Shows checkboxes and a progress count. Ticks are saved only in the visitor’s browser.',
              },
            } satisfies CheckboxField,
            {
              name: 'showProgressPanel',
              label: 'Show progress panel',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'The coloured panel with progress, Print, and notes. When hidden, progress and Print move into the checklist header and notes appear below the checklist.',
              },
            } satisfies CheckboxField,
            {
              name: 'showPrintButton',
              label: 'Show Print button',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              ...createCardBackgroundField({
                name: 'sidebarBackground',
                label: 'Progress Panel Background',
                adminDescription:
                  'Default Card inherits the section background. Other choices use the active theme and automatically adjust contrast.',
              }),
              defaultValue: 'primary',
              admin: {
                condition: (_data, siblingData) => siblingData?.showProgressPanel !== false,
                description:
                  'Default Card inherits the section background. Other choices use the active theme and automatically adjust contrast.',
              },
            } satisfies SelectField,
            {
              name: 'markerStyle',
              label: 'Numbering',
              type: 'select',
              defaultValue: 'lowerRoman',
              options: [
                { label: 'Roman numerals (i, ii, iii)', value: 'lowerRoman' },
                { label: 'Numbers (1, 2, 3)', value: 'decimal' },
                { label: 'Check icons', value: 'check' },
              ],
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Checklist Columns',
              type: 'select',
              defaultValue: 'two',
              options: [
                { label: 'One column', value: 'one' },
                { label: 'Two columns', value: 'two' },
                { label: 'Three columns', value: 'three' },
              ],
              admin: {
                description:
                  'Applies in Stacked and Split layouts. Items read top to bottom in aligned rows; columns are added only when the checklist has room (two from about 576px wide, three from about 768px).',
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
