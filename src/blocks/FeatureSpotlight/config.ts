import type { Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

type LayoutMode = 'split' | 'contentOnly'
type MediaFillMode = 'contained' | 'containedFill' | 'edgeToEdge'
type ContentVerticalAlignment = 'bottom' | 'center' | 'top'
type ImagePosition = 'bottom' | 'center' | 'left' | 'right' | 'top'
type FeatureSpotlightSiblingData = {
  contentVerticalAlignment?: ContentVerticalAlignment | null
  layoutMode?: LayoutMode | null
  mediaFillMode?: MediaFillMode | null
  imagePosition?: ImagePosition | null
}

const isSplitMode = (_data: unknown, siblingData: FeatureSpotlightSiblingData) =>
  siblingData?.layoutMode === 'split'

export const FeatureSpotlightBlock: Block = {
  slug: 'featureSpotlight',
  interfaceName: 'FeatureSpotlightBlock',
  admin: getBlockThumbnailAdmin('featureSpotlight'),
  labels: {
    singular: 'Feature Spotlight',
    plural: 'Feature Spotlights',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              validate: (
                value: unknown,
                { siblingData }: { siblingData?: FeatureSpotlightSiblingData },
              ) => {
                if (siblingData?.layoutMode === 'split' && !value) {
                  return 'Image is required when layout mode is 50 / 50 split.'
                }

                return true
              },
            },
            {
              name: 'eyebrow',
              type: 'text',
            },
            {
              name: 'title',
              type: 'text',
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
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'layoutMode',
              label: 'Layout Mode',
              type: 'select',
              defaultValue: 'split',
              options: [
                { label: '50 / 50 Split', value: 'split' },
                { label: 'Centered Content', value: 'contentOnly' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'mediaPosition',
              label: 'Image Placement',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Image Left', value: 'left' },
                { label: 'Image Right', value: 'right' },
              ],
              admin: {
                condition: isSplitMode,
              },
              validate: (
                value: unknown,
                { siblingData }: { siblingData?: FeatureSpotlightSiblingData },
              ) => {
                if (siblingData?.layoutMode === 'split' && !value) {
                  return 'Media position is required when layout mode is 50 / 50 split.'
                }

                return true
              },
            } satisfies SelectField,
            {
              name: 'imagePosition',
              label: 'Background Position',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                condition: isSplitMode,
              },
              required: true,
            } satisfies SelectField,
            {
              name: 'mediaFillMode',
              label: 'Media Fill',
              type: 'select',
              defaultValue: 'contained',
              options: [
                { label: 'Contained', value: 'contained' },
                { label: 'Contained Fill', value: 'containedFill' },
                { label: 'Edge to Edge', value: 'edgeToEdge' },
              ],
              admin: {
                condition: isSplitMode,
              },
              validate: (
                value: unknown,
                { siblingData }: { siblingData?: FeatureSpotlightSiblingData },
              ) => {
                if (siblingData?.layoutMode === 'split' && !value) {
                  return 'Media fill is required when layout mode is 50 / 50 split.'
                }

                return true
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
            {
              name: 'contentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
              admin: {
                condition: (_data: unknown, siblingData: FeatureSpotlightSiblingData) =>
                  siblingData?.layoutMode !== 'split',
              },
            } satisfies SelectField,
            {
              name: 'contentVerticalAlignment',
              label: 'Content Vertical Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitMode,
              },
              required: true,
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
