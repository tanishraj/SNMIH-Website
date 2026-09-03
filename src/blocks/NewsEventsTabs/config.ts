import type { Block, RadioField, RelationshipField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS } from '@/blocks/NewsEventsTabs/newsEventsTabsShared'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

export const NewsEventsTabsBlock: Block = {
  admin: getBlockThumbnailAdmin('newsEventsTabs'),
  slug: 'newsEventsTabs',
  interfaceName: 'NewsEventsTabsBlock',
  labels: {
    singular: 'News & Events Tabs',
    plural: 'News & Events Tabs',
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
              admin: { description: 'Small label above the optional section heading.' },
            },
            {
              name: 'title',
              type: 'text',
              admin: {
                description: 'Optional. The classification tabs can render without a heading.',
              },
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
              name: 'allTabLabel',
              label: 'All Tab Label',
              type: 'text',
              defaultValue: 'All',
              admin: {
                description: 'The mandatory first tab. Leave blank to use “All”.',
              },
            },
            {
              name: 'classifications',
              label: 'Classification Tabs',
              type: 'relationship',
              relationTo: 'news-event-classifications',
              hasMany: true,
              maxRows: NEWS_EVENTS_TABS_MAX_CLASSIFICATIONS,
              filterOptions: { active: { equals: true } },
              admin: {
                allowCreate: true,
                description:
                  'Select and drag classifications into visitor tab order. Leave empty to show only All.',
                isSortable: true,
              },
            } satisfies RelationshipField,
            {
              name: 'itemsPerTab',
              label: 'Items Per Tab',
              type: 'select',
              defaultValue: '6',
              options: [
                { label: '3', value: '3' },
                { label: '6', value: '6' },
                { label: '9', value: '9' },
                { label: '12', value: '12' },
              ],
              required: true,
              admin: {
                description:
                  'Number of published entries shown initially and appended by each Load More request.',
              },
            } satisfies SelectField,
            {
              name: 'loadMoreLabel',
              label: 'Load More Label',
              type: 'text',
              defaultValue: 'Load More',
              admin: {
                description: 'Shown when the selected tab has more published entries.',
              },
            },
            {
              name: 'newsActionLabel',
              label: 'News Action Label',
              type: 'text',
              defaultValue: 'Read update',
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
              defaultValue: 'No entries in this classification.',
              admin: {
                description: 'Shown when the selected classification has no published entries.',
              },
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'tabVariant',
              label: 'Tab Variant',
              type: 'select',
              defaultValue: 'underline',
              options: [
                { label: 'Contained', value: 'contained' },
                { label: 'Pill', value: 'pill' },
                { label: 'Underline', value: 'underline' },
              ],
              required: true,
              admin: {
                description: 'Choose a contained, pill-shaped, or minimal underline tab treatment.',
              },
            } satisfies SelectField,
            {
              name: 'layoutStyle',
              label: 'Layout',
              type: 'select',
              defaultValue: 'cardGrid',
              options: [
                { label: 'Card Grid', value: 'cardGrid' },
                { label: 'Editorial List', value: 'editorialList' },
              ],
              required: true,
              admin: {
                description: 'Choose cards or a full-width editorial list for the tab results.',
              },
            } satisfies SelectField,
            {
              name: 'cardsPerRow',
              label: 'Cards Per Row',
              type: 'radio',
              defaultValue: '3',
              options: [
                { label: '2', value: '2' },
                { label: '3', value: '3' },
                { label: '4', value: '4' },
              ],
              required: true,
              admin: {
                condition: (_data, siblingData) => siblingData?.layoutStyle !== 'editorialList',
                description: 'Maximum cards in each desktop row.',
                layout: 'horizontal',
              },
            } satisfies RadioField,
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
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ],
              required: true,
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
