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

type LinkType = 'page' | 'custom'
type LogoMode = 'siteDefault' | 'customLogo'

const isPageLink = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'custom'

const buttonArrowCondition = (_data: unknown, siblingData: { variant?: string | null }) =>
  siblingData?.variant !== 'link'

const isCustomLogo = (_data: unknown, siblingData: { logoMode?: LogoMode | null }) =>
  siblingData?.logoMode === 'customLogo'

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
      condition: isPageLink,
    },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    admin: {
      condition: isCustomLink,
    },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  } satisfies CheckboxField,
]

export const Footer56Block: Block = {
  slug: 'footer56',
  interfaceName: 'Footer56Block',
  admin: getBlockThumbnailAdmin('footer56'),
  labels: {
    singular: 'Footer 56',
    plural: 'Footer 56',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'logoMode',
              label: 'Logo Source',
              type: 'select',
              defaultValue: 'siteDefault',
              options: [
                { label: 'Site Default Logo', value: 'siteDefault' },
                { label: 'Custom Logo Override', value: 'customLogo' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'customLogoLight',
              label: 'Custom Logo (Light)',
              type: 'upload',
              relationTo: 'media',
              admin: {
                condition: isCustomLogo,
              },
            },
            {
              name: 'customLogoDark',
              label: 'Custom Logo (Dark)',
              type: 'upload',
              relationTo: 'media',
              admin: {
                condition: isCustomLogo,
              },
            },
            {
              name: 'logoHeight',
              label: 'Logo Height',
              type: 'number',
              min: 20,
              admin: {
                description: 'Overrides the rendered footer logo height in pixels.',
              },
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'linkGroups',
              type: 'array',
              minRows: 1,
              maxRows: 4,
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                },
                {
                  name: 'links',
                  type: 'array',
                  minRows: 1,
                  admin: {
                    initCollapsed: true,
                  },
                  fields: createLinkFields(),
                } satisfies ArrayField,
              ],
            } satisfies ArrayField,
            {
              name: 'ctaButtons',
              type: 'array',
              maxRows: 2,
              admin: {
                initCollapsed: true,
              },
              fields: [
                ...createLinkFields(),
                {
                  name: 'variant',
                  type: 'select',
                  defaultValue: 'outline',
                  options: buttonVariantWithLinkOptions,
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
            } satisfies ArrayField,
            {
              name: 'bottomLinks',
              type: 'array',
              admin: {
                initCollapsed: true,
              },
              fields: createLinkFields(),
            } satisfies ArrayField,
            {
              name: 'copyrightText',
              type: 'text',
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'socialIconStyle',
              label: 'Social Icon Style',
              type: 'select',
              defaultValue: 'plain',
              options: [
                { label: 'Plain glyph', value: 'plain' },
                { label: 'Filled tile', value: 'tile' },
              ],
              admin: {
                description: 'Icons come from Site Settings \u203a Social Links.',
              },
            } satisfies SelectField,
            {
              name: 'socialPlacement',
              label: 'Social Icon Placement',
              type: 'select',
              defaultValue: 'brand',
              options: [
                { label: 'Under the logo', value: 'brand' },
                { label: 'In the bottom bar, beside the legal links', value: 'bottomBar' },
              ],
              admin: {
                description:
                  'The bottom bar places the icons after the divider, on one line with the copyright and legal links.',
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
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
