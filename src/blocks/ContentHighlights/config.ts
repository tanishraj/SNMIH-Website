import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

type MarkerSiblingData = {
  markerMode?: 'custom' | 'hidden' | 'numbered' | null
}

type HeaderLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

type ItemTreatmentSiblingData = {
  itemTreatment?: 'auto' | 'boxed' | 'open' | 'ruled' | null
  layout?: 'editorialRow' | 'highlightsGrid' | 'simpleGrid' | null
}

const isCustomMarker = (_data: unknown, siblingData: MarkerSiblingData) =>
  siblingData?.markerMode === 'custom'

const isStackedHeader = (_data: unknown, siblingData: HeaderLayoutSiblingData) =>
  siblingData?.headerLayout !== 'split'

const isSplitHeader = (_data: unknown, siblingData: HeaderLayoutSiblingData) =>
  siblingData?.headerLayout === 'split'

const usesRuledTreatment = (_data: unknown, siblingData: ItemTreatmentSiblingData) =>
  siblingData?.itemTreatment === 'ruled' ||
  ((siblingData?.itemTreatment === 'auto' || siblingData?.itemTreatment == null) &&
    siblingData?.layout === 'editorialRow')

const itemsField = {
  name: 'items',
  label: 'Items',
  type: 'array',
  minRows: 1,
  maxRows: 6,
  required: true,
  admin: {
    initCollapsed: true,
  },
  fields: [
    createCardTabs({
      contentFields: [
        {
          name: 'markerMode',
          label: 'Card Eyebrow',
          type: 'select',
          defaultValue: 'numbered',
          options: [
            { label: 'Numbered', value: 'numbered' },
            { label: 'Custom Text', value: 'custom' },
            { label: 'Hidden', value: 'hidden' },
          ],
          required: true,
          admin: {
            description: 'Choose how this card is identified before its title.',
          },
        } satisfies SelectField,
        {
          name: 'markerLabel',
          label: 'Custom Eyebrow',
          type: 'text',
          admin: {
            condition: isCustomMarker,
            description: 'Short text such as Clinical, Year 1, or Research.',
          },
        },
        {
          name: 'metadata',
          label: 'Metadata',
          type: 'text',
          admin: {
            description: 'Optional context such as a date, category, duration, or source.',
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
        },
        createContentActionsField({ name: 'cardAction', label: 'Card Action', maxRows: 1 }),
      ],
    }),
  ],
} satisfies ArrayField

export const ContentHighlightsBlock: Block = {
  slug: 'contentHighlights',
  interfaceName: 'ContentHighlightsBlock',
  admin: getBlockThumbnailAdmin('contentHighlights'),
  labels: {
    singular: 'Content Highlights',
    plural: 'Content Highlights',
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
            },
            createContentActionsField(),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            itemsField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'itemsLayout',
              label: 'Items Layout',
              type: 'select',
              defaultValue: '3',
              options: [
                { label: '1 Column', value: '1' },
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'cardStyle',
              label: 'Card Style',
              type: 'select',
              defaultValue: 'open',
              options: [
                { label: 'Open', value: 'open' },
                { label: 'Left Rule', value: 'leftRule' },
                { label: 'Boxed', value: 'boxed' },
                { label: 'Rule', value: 'divided' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'eyebrowPlacement',
              label: 'Eyebrow Placement',
              type: 'select',
              defaultValue: 'stacked',
              options: [
                { label: 'Stacked', value: 'stacked' },
                { label: 'Inline', value: 'inline' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'cardLayout',
              label: 'Card Layout',
              type: 'select',
              defaultValue: 'grid',
              options: [
                { label: 'Grid', value: 'grid' },
                { label: 'List', value: 'list' },
              ],
              required: true,
              admin: {
                hidden: true,
              },
            } satisfies SelectField,
            {
              name: 'gridColumns',
              label: 'Grid Columns',
              type: 'select',
              defaultValue: '3',
              options: [
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
              ],
              required: true,
              admin: {
                hidden: true,
              },
            } satisfies SelectField,
            {
              name: 'layout',
              label: 'Layout',
              type: 'select',
              defaultValue: 'highlightsGrid',
              options: [
                { label: 'Editorial List', value: 'editorialRow' },
                { label: 'Calm Grid', value: 'highlightsGrid' },
                { label: 'Simple Grid', value: 'simpleGrid' },
              ],
              required: true,
              admin: {
                hidden: true,
              },
            } satisfies SelectField,
            {
              name: 'itemTreatment',
              label: 'Item Treatment',
              type: 'select',
              defaultValue: 'auto',
              options: [
                { label: 'Automatic', value: 'auto' },
                { label: 'Open', value: 'open' },
                { label: 'Ruled', value: 'ruled' },
                { label: 'Boxed', value: 'boxed' },
              ],
              required: true,
              admin: {
                description:
                  'Automatic uses Ruled for Editorial List, Boxed for Calm Grid, and Open for Simple Grid.',
                hidden: true,
              },
            } satisfies SelectField,
            {
              name: 'ruledDividers',
              label: 'Ruled Dividers',
              type: 'select',
              defaultValue: 'rows',
              options: [
                { label: 'Rows Only', value: 'rows' },
                { label: 'Full Grid', value: 'grid' },
                { label: 'Individual Items', value: 'individual' },
              ],
              required: true,
              admin: {
                condition: usesRuledTreatment,
                description:
                  'Rows Only draws continuous horizontal rules. Full Grid also divides responsive columns. Individual Items gives every item its own 2px left rule.',
                hidden: true,
              },
            } satisfies SelectField,
            {
              name: 'headerLayout',
              label: 'Header Layout',
              type: 'select',
              defaultValue: 'stacked',
              options: [
                { label: 'Stacked', value: 'stacked' },
                { label: 'Split', value: 'split' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
              admin: {
                condition: isStackedHeader,
              },
            } satisfies SelectField,
            {
              name: 'splitContentAlignment',
              label: 'Content Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              required: true,
              admin: {
                condition: isSplitHeader,
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
