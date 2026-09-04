import type {
  ArrayField,
  Block,
  CheckboxField,
  Field,
  RadioField,
  SelectField,
  TabsField,
} from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import {
  buttonVariantDescription,
  buttonVariantWithLinkOptions,
} from '@/blocks/shared/contentActionsFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

type LinkType = 'page' | 'custom'

const pageCondition = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'page'

const customUrlCondition = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'custom'

const buttonArrowCondition = (_data: unknown, siblingData: { variant?: string | null }) =>
  siblingData?.variant !== 'link'

const createLinkFields = (): Field[] => [
  {
    name: 'label',
    type: 'text',
    required: true,
  },
  {
    name: 'linkType',
    type: 'radio',
    defaultValue: 'page',
    options: [
      { label: 'Page', value: 'page' },
      { label: 'Custom URL', value: 'custom' },
    ],
    admin: { layout: 'horizontal' },
  } satisfies RadioField,
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    admin: { condition: pageCondition },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    admin: {
      condition: customUrlCondition,
      description:
        'Use #anchor-id for a section on this page or /page-path#anchor-id for a section on another page.',
      placeholder: '#admissions or /programmes#mbbs',
    },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  } satisfies CheckboxField,
]

const buttonsField: ArrayField = {
  name: 'buttons',
  label: 'Buttons',
  type: 'array',
  maxRows: 2,
  admin: { initCollapsed: true },
  fields: [
    {
      type: 'tabs',
      tabs: [
        { label: 'Content', fields: createLinkFields() },
        {
          label: 'Style',
          fields: [
            {
              name: 'variant',
              type: 'select',
              defaultValue: 'secondary',
              options: buttonVariantWithLinkOptions,
              required: true,
              admin: { description: buttonVariantDescription },
            } satisfies SelectField,
            {
              name: 'showArrow',
              label: 'Show arrow',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                condition: buttonArrowCondition,
                description: 'Adds a trailing arrow to this button.',
              },
            } satisfies CheckboxField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}

const slideFields: Field[] = [
  {
    name: 'backgroundImage',
    label: 'Background Image',
    type: 'upload',
    relationTo: 'media',
    admin: {
      description: 'Full-bleed background image for this slide.',
    },
  },
  {
    name: 'backgroundVideoUrl',
    label: 'Background Video URL',
    type: 'text',
    admin: {
      description: 'Optional: direct video URL (.mp4). Overrides the image when set.',
      placeholder: 'https://example.com/video.mp4',
    },
  },
  {
    name: 'eyebrow',
    type: 'text',
    admin: { description: 'Small label above the title.' },
  },
  {
    name: 'title',
    type: 'text',
  },
  {
    name: 'description',
    type: 'textarea',
  },
  buttonsField,
]

export const HeroCarouselBlock: Block = {
  slug: 'heroCarousel',
  interfaceName: 'HeroCarouselBlock',
  admin: getBlockThumbnailAdmin('heroCarousel'),
  labels: {
    singular: 'Hero Carousel',
    plural: 'Hero Carousels',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'slides',
              label: 'Slides',
              type: 'array',
              minRows: 1,
              maxRows: 8,
              admin: {
                description: 'Add one slide for a static hero, or multiple for a carousel.',
                initCollapsed: true,
              },
              fields: slideFields,
            } satisfies ArrayField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createMediaOverlayToneField({ required: false }),
            createMediaOverlayStrengthField(),
            createMediaOverlayDirectionField({ required: false }),
            createMediaOverlayCoverageField({ required: false }),
            {
              name: 'height',
              label: 'Height',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Immersive (full screen)', value: 'immersive' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'contentAlignment',
              label: 'Content Alignment',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            } satisfies SelectField,
            {
              name: 'autoplay',
              label: 'Autoplay',
              type: 'checkbox',
              defaultValue: true,
              admin: { description: 'Automatically advance slides every 6 seconds.' },
            } satisfies CheckboxField,
            {
              name: 'showPauseControl',
              label: 'Show Pause / Play Control',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description:
                  'Shows a centered Pause / Play control on hover or focus and on touch devices. Pause freezes autoplay, background video, and slide navigation.',
              },
            } satisfies CheckboxField,
            {
              name: 'showArrows',
              label: 'Show Navigation Arrows',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'showDots',
              label: 'Show Dot Indicators',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
