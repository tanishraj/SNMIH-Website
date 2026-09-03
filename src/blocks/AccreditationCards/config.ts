import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createIconField } from '@/blocks/shared/iconField'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

const accreditationCardBackgroundField = {
  name: 'cardBackground',
  label: 'Background',
  type: 'select',
  defaultValue: 'default',
  required: true,
  options: [
    { label: 'Match Section', value: 'default' },
    { label: 'Subtle', value: 'subtle' },
    { label: 'Brand', value: 'brand' },
    { label: 'Gradient: Subtle', value: 'gradient-subtle' },
    { label: 'Gradient: Brand', value: 'gradient-brand' },
  ],
  admin: {
    description:
      'Match Section creates a lightly elevated card on the current section surface. Other options use the active theme tokens.',
  },
} satisfies SelectField

const accreditationsField = {
  name: 'accreditations',
  label: 'Accreditations',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 12,
  admin: {
    description: 'Accreditation, certification, or recognition cards shown in display order.',
    initCollapsed: true,
  },
  fields: [
    createCardTabs({
      includeBackground: false,
      themeFields: [accreditationCardBackgroundField],
      contentFields: [
        createIconField({ required: true }),
        {
          name: 'title',
          label: 'Short Name',
          type: 'text',
          required: true,
          admin: {
            description: 'Short accreditation name, e.g. “NMC”, “NABH”, “NAAC”, or “ISO”.',
          },
        },
        {
          name: 'description',
          type: 'textarea',
          admin: {
            description: 'Approval, grading, certification, or accreditation detail.',
          },
        },
      ],
    }),
  ],
} satisfies ArrayField

export const AccreditationCardsBlock: Block = {
  admin: getBlockThumbnailAdmin('accreditationCards'),
  slug: 'accreditationCards',
  interfaceName: 'AccreditationCardsBlock',
  labels: {
    singular: 'Accreditation Cards',
    plural: 'Accreditation Cards',
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
              admin: { description: 'Small label shown above the section title.' },
            },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
              admin: { description: 'Optional supporting paragraph below the title.' },
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            accreditationsField,
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
              name: 'columns',
              label: 'Card Columns',
              type: 'select',
              defaultValue: '4',
              required: true,
              options: [
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
              ],
            } satisfies SelectField,
            {
              name: 'cardFrame',
              label: 'Card Frame',
              type: 'select',
              defaultValue: 'stepped',
              required: true,
              options: [
                { label: 'Stepped Rules', value: 'stepped' },
                { label: 'Grouped', value: 'grouped' },
                { label: 'Boxed', value: 'boxed' },
                { label: 'Open', value: 'open' },
              ],
              admin: {
                description:
                  'Stepped Rules alternates connected rules. Grouped uses one outer frame with item dividers. Boxed frames every card. Open uses dividers without an outer frame.',
              },
            } satisfies SelectField,
            {
              name: 'cardSize',
              label: 'Card Size',
              type: 'select',
              defaultValue: 'default',
              required: true,
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
              admin: {
                description: 'Controls the card padding. Height follows the card content.',
              },
            } satisfies SelectField,
            {
              name: 'iconStyle',
              label: 'Icon Style',
              type: 'select',
              defaultValue: 'plain',
              required: true,
              options: [
                { label: 'Plain', value: 'plain' },
                { label: 'Square', value: 'square' },
                { label: 'Circle', value: 'circle' },
                { label: 'Outline', value: 'outline' },
              ],
              admin: {
                description: 'Applies one consistent icon treatment across the cards.',
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
