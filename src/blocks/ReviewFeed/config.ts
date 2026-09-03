import type { Block, NumberField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { REVIEW_FEED_DEFAULT_PAGE_SIZE, REVIEW_FEED_MAX_PAGE_SIZE } from '@/lib/reviewFeedShared'

const pageSizeField = {
  name: 'pageSize',
  label: 'Reviews Per Load',
  type: 'number',
  defaultValue: REVIEW_FEED_DEFAULT_PAGE_SIZE,
  min: 1,
  max: REVIEW_FEED_MAX_PAGE_SIZE,
  required: true,
  validate: (value: unknown) =>
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= REVIEW_FEED_MAX_PAGE_SIZE
      ? true
      : `Reviews per load must be a whole number between 1 and ${REVIEW_FEED_MAX_PAGE_SIZE}.`,
} satisfies NumberField

const sizeField = {
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
} satisfies SelectField

export const ReviewFeedBlock: Block = {
  slug: 'reviewFeed',
  interfaceName: 'ReviewFeedBlock',
  admin: getBlockThumbnailAdmin('reviewFeed'),
  labels: {
    singular: 'Review Feed',
    plural: 'Review Feeds',
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
            pageSizeField,
            {
              name: 'loadMoreLabel',
              label: 'Load More Label',
              type: 'text',
              defaultValue: 'Load More Reviews',
            },
            {
              name: 'emptyStateMessage',
              label: 'Empty State Message',
              type: 'text',
              defaultValue: 'No published reviews yet.',
            },
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
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
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
            } satisfies SelectField,
            sizeField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
