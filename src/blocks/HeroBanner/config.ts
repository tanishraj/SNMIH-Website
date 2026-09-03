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
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
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
    admin: {
      layout: 'horizontal',
    },
  } satisfies RadioField,
  {
    name: 'page',
    type: 'relationship',
    relationTo: 'pages',
    admin: {
      condition: pageCondition,
    },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    admin: {
      condition: customUrlCondition,
    },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  } satisfies CheckboxField,
]

const horizontalAlignmentField = {
  name: 'horizontalAlignment',
  label: 'Horizontal Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField

const verticalAlignmentField = {
  name: 'verticalAlignment',
  label: 'Vertical Alignment',
  type: 'select',
  defaultValue: 'center',
  options: [
    { label: 'Top', value: 'top' },
    { label: 'Center', value: 'center' },
    { label: 'Bottom', value: 'bottom' },
  ],
  required: true,
} satisfies SelectField

const overlayStyleField = createMediaOverlayStrengthField({ defaultValue: 'dark' })

const overlayDirectionField = createMediaOverlayDirectionField({ defaultValue: 'vertical' })

const overlayCoverageField = createMediaOverlayCoverageField({ required: false })

const enableTextShadowField = {
  name: 'enableTextShadow',
  label: 'Enable Text Shadow',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description: 'Adds a restrained shadow to text and editorial links over dark image overlays.',
  },
} satisfies CheckboxField

const themeModeField = createMediaOverlayToneField({ defaultValue: 'auto' })

const contentWidthField = {
  name: 'contentWidth',
  label: 'Content Width',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'Narrow', value: 'narrow' },
    { label: 'Default', value: 'default' },
    { label: 'Wide', value: 'wide' },
  ],
  required: true,
} satisfies SelectField

const heightField = {
  name: 'height',
  label: 'Height',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Immersive', value: 'immersive' },
  ],
  required: true,
} satisfies SelectField

const buttonsField = {
  name: 'buttons',
  label: 'Buttons',
  type: 'array',
  maxRows: 2,
  admin: {
    initCollapsed: true,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: createLinkFields(),
        },
        {
          label: 'Theme Settings',
          fields: [
            {
              name: 'variant',
              type: 'select',
              defaultValue: 'default',
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
} satisfies ArrayField

export const HeroBannerBlock: Block = {
  slug: 'heroBanner',
  interfaceName: 'HeroBannerBlock',
  admin: getBlockThumbnailAdmin('heroBanner'),
  labels: {
    singular: 'Hero Banner',
    plural: 'Hero Banners',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'backgroundImage',
              label: 'Background Image',
              type: 'upload',
              relationTo: 'media',
              required: true,
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
            buttonsField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            themeModeField,
            overlayStyleField,
            overlayDirectionField,
            overlayCoverageField,
            enableTextShadowField,
            createBlockAppearanceFields(),
            horizontalAlignmentField,
            verticalAlignmentField,
            contentWidthField,
            heightField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
