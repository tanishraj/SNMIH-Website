import type {
  Block,
  CheckboxField,
  GroupField,
  NumberField,
  RadioField,
  SelectField,
  TabsField,
} from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

type FeatureSiblingData = {
  linkType?: 'custom' | 'none' | 'page' | null
}

const isPageLink = (_data: unknown, siblingData: FeatureSiblingData) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: FeatureSiblingData) =>
  siblingData?.linkType === 'custom'

const hasLink = (_data: unknown, siblingData: FeatureSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const featureCardField = {
  name: 'featureCard',
  label: 'Feature Card',
  type: 'group',
  admin: {
    description:
      'An optional editor-authored card that fills the last slot in the grid, over a background image.',
  },
  fields: [
    {
      name: 'enabled',
      label: 'Show the feature card',
      type: 'checkbox',
      defaultValue: false,
    } satisfies CheckboxField,
    {
      name: 'image',
      label: 'Background Image',
      type: 'upload',
      relationTo: 'media',
      admin: { condition: (_data, siblingData) => siblingData?.enabled === true },
    },
    {
      name: 'eyebrow',
      type: 'text',
      admin: { condition: (_data, siblingData) => siblingData?.enabled === true },
    },
    {
      name: 'title',
      type: 'text',
      admin: {
        condition: (_data, siblingData) => siblingData?.enabled === true,
        description: 'Required for the card to render.',
      },
    },
    {
      name: 'actionLabel',
      label: 'Action Label',
      type: 'text',
      defaultValue: 'Explore',
      admin: { condition: (_data, siblingData) => siblingData?.enabled === true },
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
      admin: {
        layout: 'horizontal',
        condition: (_data, siblingData) => siblingData?.enabled === true,
      },
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
} satisfies GroupField

export const NewsGridBlock: Block = {
  admin: getBlockThumbnailAdmin('newsGrid'),
  slug: 'newsGrid',
  interfaceName: 'NewsGridBlock',
  labels: {
    singular: 'News Grid',
    plural: 'News Grids',
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
              admin: { description: 'Small label above the heading.' },
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
            createContentActionsField({ label: 'Header Actions', maxRows: 2 }),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            {
              name: 'totalCards',
              label: 'Total Cards',
              type: 'number',
              defaultValue: 3,
              min: 1,
              max: 6,
              required: true,
              admin: {
                description:
                  'Total visible cards, including the optional feature card. When enabled, the feature uses the final slot.',
              },
            } satisfies NumberField,
            {
              name: 'cardsPerRow',
              label: 'Cards Per Row',
              type: 'radio',
              defaultValue: '3',
              required: true,
              options: [
                { label: '2', value: '2' },
                { label: '3', value: '3' },
                { label: '4', value: '4' },
              ],
              admin: {
                description:
                  'Maximum cards in each desktop row. Additional cards continue on the next row.',
                layout: 'horizontal',
              },
            } satisfies RadioField,
            {
              name: 'newsActionLabel',
              label: 'Default Action Label',
              type: 'text',
              defaultValue: 'Read update',
              admin: {
                description: 'Used by every non-event classification.',
              },
            },
            {
              name: 'eventActionLabel',
              label: 'Event Action Label',
              type: 'text',
              defaultValue: 'View details',
            },
            {
              name: 'emptyStateMessage',
              label: 'Empty State Message',
              type: 'text',
              defaultValue: 'No updates published yet.',
              admin: {
                description: 'Shown when nothing is published and the feature card is off.',
              },
            },
            featureCardField,
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
              admin: {
                description: 'Header actions only sit beside the heading when aligned left.',
              },
            } satisfies SelectField,
            {
              name: 'headerActionAlignment',
              label: 'Header Action Vertical Alignment',
              type: 'radio',
              defaultValue: 'center',
              required: true,
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: (_data, siblingData) => siblingData?.contentAlignment !== 'center',
                description:
                  'Aligns header actions against the content when they appear beside the heading.',
                layout: 'horizontal',
              },
            } satisfies RadioField,
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
