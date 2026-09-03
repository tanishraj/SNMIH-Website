import type {
  Block,
  CheckboxField,
  NumberField,
  RelationshipField,
  SelectField,
  TabsField,
} from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { NEWS_EVENTS_HIGHLIGHTS_MAX_CLASSIFICATIONS } from '@/blocks/NewsEventsHighlights/newsEventsHighlightsShared'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

const imagePositionOptions = [
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
] satisfies SelectField['options']

export const NewsEventsHighlightsBlock: Block = {
  slug: 'newsEventsHighlights',
  interfaceName: 'NewsEventsHighlightsBlock',
  admin: getBlockThumbnailAdmin('newsEventsHighlights'),
  labels: {
    singular: 'News & Events Highlights',
    plural: 'News & Events Highlights',
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
            { name: 'description', type: 'textarea' },
            {
              name: 'classifications',
              label: 'Classifications',
              type: 'relationship',
              relationTo: 'news-event-classifications',
              hasMany: true,
              maxRows: NEWS_EVENTS_HIGHLIGHTS_MAX_CLASSIFICATIONS,
              filterOptions: { active: { equals: true } },
              admin: {
                allowCreate: true,
                description:
                  'Limit the carousel to selected active classifications. Leave empty to include all active classifications. Selection order does not change chronological slide order.',
              },
            } satisfies RelationshipField,
            createContentActionsField({ maxRows: 1 }),
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
            {
              name: 'itemCount',
              label: 'Number of Items',
              type: 'number',
              defaultValue: 3,
              min: 1,
              max: 6,
              required: true,
            } satisfies NumberField,
            {
              name: 'autoplay',
              label: 'Autoplay',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'carouselControlsPosition',
              label: 'Carousel Controls Position',
              type: 'select',
              defaultValue: 'bottom',
              options: [
                { label: 'Bottom', value: 'bottom' },
                { label: 'Top', value: 'top' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'emptyStateMessage',
              label: 'Empty State Message',
              type: 'text',
              admin: {
                description: 'Optional message shown when there are no News & Events entries.',
              },
            },
            {
              name: 'imagePositionOverride',
              label: 'Image Position Override',
              type: 'select',
              defaultValue: 'item',
              options: [{ label: 'Use Item Setting', value: 'item' }, ...imagePositionOptions],
              required: true,
            } satisfies SelectField,
            createMediaOverlayToneField({ defaultValue: 'dark' }),
            createMediaOverlayStrengthField({ defaultValue: 'darker' }),
            createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' }),
            createMediaOverlayCoverageField({ defaultValue: 'full' }),
            createBlockAppearanceFields(),
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
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
