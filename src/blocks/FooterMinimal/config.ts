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

type LinkSiblingData = {
  linkType?: 'custom' | 'page' | null
}

const isPageLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'custom'

const linkFields: Field[] = [
  {
    name: 'label',
    type: 'text',
    required: true,
  },
  {
    name: 'linkType',
    label: 'Link',
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
    admin: { condition: isPageLink },
  },
  {
    name: 'url',
    label: 'Custom URL',
    type: 'text',
    admin: { condition: isCustomLink },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
  } satisfies CheckboxField,
]

const linkGroupsField = {
  name: 'linkGroups',
  label: 'Link Columns',
  type: 'array',
  maxRows: 4,
  admin: {
    initCollapsed: true,
    description: 'Each column renders as a heading with its links beneath.',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'includeSiteContact',
      label: 'Start with the site phone and email',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description:
          'Pulls the contact phone and email from Site Settings and lists them above this column\u2019s links, as a click-to-call and click-to-email.',
      },
    } satisfies CheckboxField,
    {
      name: 'links',
      type: 'array',
      maxRows: 8,
      admin: { initCollapsed: true },
      fields: linkFields,
    } satisfies ArrayField,
  ],
} satisfies ArrayField

const bottomLinksField = {
  name: 'bottomLinks',
  label: 'Bottom Links',
  type: 'array',
  maxRows: 4,
  admin: {
    initCollapsed: true,
    description:
      'Sits opposite the copyright. The Privacy Policy and Terms pages from Site Settings are appended automatically.',
  },
  fields: linkFields,
} satisfies ArrayField

export const FooterMinimalBlock: Block = {
  admin: getBlockThumbnailAdmin('footerMinimal'),
  slug: 'footerMinimal',
  interfaceName: 'FooterMinimalBlock',
  labels: {
    singular: 'Footer Minimal',
    plural: 'Footer Minimals',
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
              label: 'Logo',
              type: 'select',
              defaultValue: 'siteDefault',
              options: [
                { label: 'Site default', value: 'siteDefault' },
                { label: 'Custom logo', value: 'customLogo' },
                { label: 'No logo', value: 'none' },
              ],
              admin: {
                description:
                  'Pair No logo with the site name switch off to drop the brand mark entirely.',
              },
            } satisfies SelectField,
            {
              name: 'customLogo',
              label: 'Custom Logo',
              type: 'upload',
              relationTo: 'media',
              admin: {
                condition: (_data, siblingData) => siblingData?.logoMode === 'customLogo',
              },
            },
            {
              name: 'brandTitle',
              label: 'Brand Column Title',
              type: 'text',
              admin: {
                description:
                  'Optional heading above the logo, styled like the link column headings.',
              },
            },
            {
              name: 'showSiteName',
              label: 'Show site name beside the logo',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'description',
              label: 'Description',
              type: 'textarea',
              admin: {
                description:
                  'Optional copy under the logo. Leave empty to fall back to the address from Site Settings.',
              },
            },
            linkGroupsField,
            bottomLinksField,
            {
              name: 'copyrightText',
              label: 'Copyright Text',
              type: 'text',
              admin: {
                description: 'Leave empty to fall back to the site name.',
              },
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'showSocialLinks',
              label: 'Show social icons',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Icons come from Site Settings › Social Links. Only the platforms with a URL are shown.',
              },
            } satisfies CheckboxField,
            {
              name: 'socialIconStyle',
              label: 'Social Icon Style',
              type: 'select',
              defaultValue: 'tile',
              options: [
                { label: 'Filled tile', value: 'tile' },
                { label: 'Plain glyph', value: 'plain' },
              ],
              admin: {
                condition: (_data, siblingData) => siblingData?.showSocialLinks !== false,
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
                condition: (_data, siblingData) => siblingData?.showSocialLinks !== false,
                description:
                  'The bottom bar places the icons after the divider, on one line with the copyright and legal links.',
              },
            } satisfies SelectField,
            {
              name: 'logoHeight',
              label: 'Logo Height (px)',
              type: 'number',
              defaultValue: 44,
              min: 16,
              max: 120,
            },
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
