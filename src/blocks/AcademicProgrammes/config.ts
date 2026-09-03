import type { ArrayField, Block, CheckboxField, RadioField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createIconField } from '@/blocks/shared/iconField'

type ProgrammeSiblingData = {
  linkType?: 'custom' | 'none' | 'page' | null
}

type AcademicProgrammesLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

type AcademicProgrammesViewSiblingData = {
  viewMode?: 'detailedCards' | 'grid' | 'list' | null
}

const isSplitHeader = (_data: unknown, siblingData: AcademicProgrammesLayoutSiblingData) =>
  siblingData?.headerLayout !== 'stacked'

const usesCardColumns = (_data: unknown, siblingData: AcademicProgrammesViewSiblingData) =>
  siblingData?.viewMode !== 'list'

const usesStandardMetadata = (_data: unknown, siblingData: AcademicProgrammesViewSiblingData) =>
  siblingData?.viewMode !== 'detailedCards'

const isPageLink = (_data: unknown, siblingData: ProgrammeSiblingData) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: ProgrammeSiblingData) =>
  siblingData?.linkType === 'custom'

const hasLink = (_data: unknown, siblingData: ProgrammeSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const programmesField = {
  name: 'programmes',
  label: 'Programmes',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 24,
  admin: {
    description: 'Programme cards shown in their displayed order.',
    initCollapsed: true,
  },
  fields: [
    createCardTabs({
      contentFields: [
        {
          name: 'image',
          label: 'Programme Image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional image used by the Grid and List layouts.',
          },
        },
        createIconField({
          description: 'Optional icon used by the Detailed Cards layout.',
          required: false,
        }),
        {
          name: 'eyebrow',
          label: 'Study Level / Category',
          type: 'text',
        },
        {
          name: 'badge',
          label: 'Badge',
          type: 'text',
          admin: {
            description: 'Optional short marker used by Grid and List, such as Featured or New.',
          },
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'A concise one- or two-sentence programme summary.',
          },
        },
        {
          name: 'durationLabel',
          label: 'Duration Label',
          type: 'text',
          defaultValue: 'Duration',
          admin: {
            description: 'Label shown above the duration value in Grid and List.',
          },
        },
        {
          name: 'duration',
          label: 'Duration Value',
          type: 'text',
          admin: {
            description:
              'Editor-authored duration, such as 3 years. Detailed Cards show this as a top-right pill.',
          },
        },
        {
          name: 'intakeLabel',
          label: 'Intake Label',
          type: 'text',
          defaultValue: 'Intake',
          admin: {
            description: 'Label shown above the intake value in Grid and List.',
          },
        },
        {
          name: 'intake',
          label: 'Intake Value',
          type: 'text',
          admin: {
            description: 'Editor-authored intake used by Grid and List.',
          },
        },
        {
          name: 'facts',
          label: 'Detailed Card Facts',
          type: 'array',
          maxRows: 4,
          admin: {
            description:
              'Optional facts used by Detailed Cards, such as Seats, Eligibility, or Fee. Add up to four.',
            initCollapsed: true,
          },
          fields: [
            createIconField({
              description: 'Optional decorative Lucide icon shown beside this fact label.',
              required: false,
            }),
            { name: 'label', type: 'text', required: true },
            { name: 'value', type: 'text', required: true },
          ],
        } satisfies ArrayField,
        {
          name: 'ctaLabel',
          label: 'Link Label',
          type: 'text',
          defaultValue: 'Explore programme',
        },
        {
          name: 'linkType',
          label: 'Link',
          type: 'radio',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
            { label: 'Page', value: 'page' },
            { label: 'Custom URL', value: 'custom' },
          ],
          admin: { layout: 'horizontal' },
        } satisfies RadioField,
        {
          name: 'page',
          type: 'relationship',
          relationTo: 'pages',
          admin: { condition: isPageLink },
        },
        {
          name: 'url',
          label: 'Custom URL',
          type: 'text',
          admin: { condition: isCustomLink },
        },
        {
          name: 'openInNewTab',
          type: 'checkbox',
          defaultValue: false,
          admin: { condition: hasLink },
        } satisfies CheckboxField,
      ],
    }),
  ],
} satisfies ArrayField

export const AcademicProgrammesBlock: Block = {
  admin: getBlockThumbnailAdmin('academicProgrammes'),
  slug: 'academicProgrammes',
  interfaceName: 'AcademicProgrammesBlock',
  labels: {
    singular: 'Academic Programmes',
    plural: 'Academic Programmes',
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
              admin: { description: 'Small label above the section title.' },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'accentTitle',
              label: 'Accent Title',
              type: 'text',
              admin: { description: 'Optional italic second line of the heading.' },
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            programmesField,
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
                  'Aligns the section eyebrow, heading, description, and actions together.',
              },
            } satisfies SelectField,
            {
              name: 'headerLayout',
              label: 'Header Layout',
              type: 'select',
              defaultValue: 'split',
              required: true,
              options: [
                { label: 'Split', value: 'split' },
                { label: 'Stacked', value: 'stacked' },
              ],
            } satisfies SelectField,
            {
              name: 'viewMode',
              label: 'Programme Layout',
              type: 'select',
              defaultValue: 'grid',
              required: true,
              options: [
                { label: 'Grid', value: 'grid' },
                { label: 'List', value: 'list' },
                { label: 'Detailed Cards', value: 'detailedCards' },
              ],
            } satisfies SelectField,
            {
              name: 'metadataPosition',
              label: 'Programme Details Position',
              type: 'select',
              defaultValue: 'flow',
              required: true,
              options: [
                { label: 'After Description', value: 'flow' },
                { label: 'Bottom of Card', value: 'bottom' },
              ],
              admin: {
                condition: usesStandardMetadata,
                description:
                  'Places programme details after the description or aligns them with the action at the bottom of each card.',
              },
            } satisfies SelectField,
            {
              name: 'showFilter',
              label: 'Show Category Filter',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Uses Study Level / Category values as filters when at least two categories exist.',
              },
            } satisfies CheckboxField,
            {
              name: 'columns',
              label: 'Programme Columns',
              type: 'select',
              defaultValue: '3',
              required: true,
              options: [
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
              ],
              admin: {
                condition: usesCardColumns,
                description: 'Applies to the Grid and Detailed Cards programme layouts.',
              },
            } satisfies SelectField,
            {
              name: 'descriptionPosition',
              label: 'Description Placement',
              type: 'select',
              defaultValue: 'side',
              required: true,
              options: [
                { label: 'Right Column', value: 'side' },
                { label: 'Under Title', value: 'underTitle' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Moves the section description between the title column and the right column.',
              },
            } satisfies SelectField,
            {
              name: 'sideContentAlignment',
              label: 'Right Column Alignment',
              type: 'select',
              defaultValue: 'bottom',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Aligns the right-column description and section actions to the top or bottom.',
              },
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              required: true,
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
