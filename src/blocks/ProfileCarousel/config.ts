import type { ArrayField, Block, Condition, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

const usesImageOverlay: Condition = (_data, siblingData) => siblingData?.cardVariant === 'overlay'

const imagePositionOptions = [
  { label: 'Center', value: 'center' },
  { label: 'Top', value: 'top' },
  { label: 'Bottom', value: 'bottom' },
  { label: 'Left', value: 'left' },
  { label: 'Right', value: 'right' },
]

const profilesField = {
  name: 'profiles',
  label: 'Profiles',
  type: 'array',
  minRows: 1,
  maxRows: 12,
  admin: {
    initCollapsed: true,
  },
  fields: [
    createCardTabs({
      contentFields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'role',
          label: 'Role / Designation',
          type: 'text',
        },
        {
          name: 'department',
          label: 'Department',
          type: 'text',
        },
      ],
      themeFields: [
        {
          name: 'imagePosition',
          label: 'Background Position',
          type: 'select',
          defaultValue: 'center',
          options: imagePositionOptions,
          required: true,
        } satisfies SelectField,
      ],
    }),
  ],
} satisfies ArrayField

export const ProfileCarouselBlock: Block = {
  slug: 'profileCarousel',
  interfaceName: 'ProfileCarouselBlock',
  admin: getBlockThumbnailAdmin('profileCarousel'),
  labels: {
    singular: 'Profile Carousel',
    plural: 'Profile Carousels',
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
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Action', maxRows: 1 }),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            profilesField,
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
                { label: 'Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'cardVariant',
              label: 'Card Variant',
              type: 'select',
              defaultValue: 'stacked',
              options: [
                { label: 'Text Below Image', value: 'stacked' },
                { label: 'Image Overlay', value: 'overlay' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'overlayAlignment',
              label: 'Overlay Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
              admin: {
                condition: usesImageOverlay,
              },
            } satisfies SelectField,
            createMediaOverlayToneField({ condition: usesImageOverlay, required: false }),
            createMediaOverlayStrengthField({ condition: usesImageOverlay, required: false }),
            createMediaOverlayDirectionField({
              condition: usesImageOverlay,
              defaultValue: 'bottomToTop',
              required: false,
            }),
            createMediaOverlayCoverageField({
              condition: usesImageOverlay,
              required: false,
            }),
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
