import type { Block, GroupField, NumberField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

type RatingDataSiblingData = {
  dataMode?: 'live' | 'manual' | null
}

const isManualMode = (_data: unknown, siblingData: RatingDataSiblingData) =>
  siblingData?.dataMode === 'manual'

const ratingDataField = {
  name: 'ratingData',
  label: 'Rating Data',
  type: 'group',
  fields: [
    {
      name: 'dataMode',
      label: 'Data Mode',
      type: 'select',
      defaultValue: 'live',
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Manual Override', value: 'manual' },
      ],
      required: true,
    } satisfies SelectField,
    {
      name: 'manualRating',
      label: 'Manual Rating',
      type: 'number',
      min: 0,
      max: 5,
      admin: {
        condition: isManualMode,
      },
      validate: (value: unknown, { siblingData }: { siblingData?: RatingDataSiblingData }) => {
        if (siblingData?.dataMode !== 'manual') {
          return true
        }

        return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 5
          ? true
          : 'Manual rating is required and must be between 0 and 5.'
      },
    } satisfies NumberField,
    {
      name: 'manualReviewCount',
      label: 'Manual Review Count',
      type: 'number',
      min: 0,
      admin: {
        condition: isManualMode,
      },
      validate: (value: unknown, { siblingData }: { siblingData?: RatingDataSiblingData }) => {
        if (siblingData?.dataMode !== 'manual') {
          return true
        }

        return typeof value === 'number' && Number.isInteger(value) && value >= 0
          ? true
          : 'Manual review count is required and must be a non-negative integer.'
      },
    } satisfies NumberField,
  ],
} satisfies GroupField

const contentAlignmentField = {
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
} satisfies SelectField

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

export const RatingSpotlightBlock: Block = {
  slug: 'ratingSpotlight',
  interfaceName: 'RatingSpotlightBlock',
  admin: getBlockThumbnailAdmin('ratingSpotlight'),
  labels: {
    singular: 'Rating Spotlight',
    plural: 'Rating Spotlights',
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
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Action', maxRows: 1 }),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            ratingDataField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            contentAlignmentField,
            sizeField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
