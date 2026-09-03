import type {
  ArrayField,
  Block,
  CheckboxField,
  Field,
  NumberField,
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

const linkTypeCondition = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'page'

const customUrlCondition = (_data: unknown, siblingData: { linkType?: LinkType | null }) =>
  siblingData?.linkType === 'custom'

const buttonArrowCondition = (_data: unknown, siblingData: { variant?: string | null }) =>
  siblingData?.variant !== 'link'

const customLogoCondition = (_data: unknown, siblingData: { logoMode?: LogoMode | null }) =>
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
      condition: linkTypeCondition,
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

const childLinkFields = createLinkFields()

const sizeField = {
  name: 'size',
  type: 'select',
  defaultValue: 'default',
  options: [
    { label: 'Compact', value: 'compact' },
    { label: 'Default', value: 'default' },
    { label: 'Large', value: 'large' },
  ],
} satisfies SelectField

const navAlignmentField = {
  name: 'navAlignment',
  label: 'Navigation Alignment',
  type: 'select',
  defaultValue: 'center',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
} satisfies SelectField

const logoHeightField = {
  name: 'logoHeight',
  label: 'Logo Height Override (px)',
  type: 'number',
  min: 20,
  admin: {
    components: {
      Field: '/blocks/HeaderNavbar12/LogoHeightField#LogoHeightField',
    },
    description:
      'Changing header size resets this value to match the header height. You can still edit it manually afterward.',
  },
} satisfies NumberField

const menuItemsField = {
  name: 'menuItems',
  label: 'Menu Items',
  type: 'array',
  minRows: 1,
  admin: {
    initCollapsed: true,
  },
  fields: [
    ...createLinkFields(),
    {
      name: 'children',
      type: 'array',
      admin: {
        initCollapsed: true,
      },
      fields: childLinkFields,
    } satisfies ArrayField,
  ],
} satisfies ArrayField

const ctaButtonsField = {
  name: 'ctaButtons',
  label: 'CTA Buttons',
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
      defaultValue: 'default',
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
} satisfies ArrayField

export const HeaderNavbar12Block: Block = {
  slug: 'headerNavbar12',
  interfaceName: 'HeaderNavbar12Block',
  admin: getBlockThumbnailAdmin('headerNavbar12'),
  labels: {
    singular: 'Header Navbar',
    plural: 'Header Navbars',
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
            } satisfies SelectField,
            {
              name: 'customLogoLight',
              label: 'Custom Logo (Light)',
              type: 'upload',
              relationTo: 'media',
              admin: {
                condition: customLogoCondition,
              },
            },
            {
              name: 'customLogoDark',
              label: 'Custom Logo (Dark)',
              type: 'upload',
              relationTo: 'media',
              admin: {
                condition: customLogoCondition,
              },
            },
            logoHeightField,
            menuItemsField,
            ctaButtonsField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields({}),
            {
              name: 'sticky',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            sizeField,
            navAlignmentField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
