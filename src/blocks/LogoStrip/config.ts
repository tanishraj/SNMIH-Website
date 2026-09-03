import type { ArrayField, Block, CheckboxField, SelectField, TabsField } from 'payload'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'

const logosField: ArrayField = {
  name: 'logos',
  label: 'Logos',
  type: 'array',
  minRows: 1,
  maxRows: 40,
  admin: {
    initCollapsed: true,
    description: 'Upload each accreditation, partner, or employer logo.',
  },
  fields: [
    {
      name: 'image',
      label: 'Logo Image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'label',
      label: 'Label',
      type: 'text',
      admin: {
        description: 'Short label shown below the logo (e.g. NAAC A+, ISO 9001).',
      },
    },
    {
      name: 'url',
      label: 'Link URL',
      type: 'text',
      admin: {
        description: 'Optional — makes the logo a clickable link.',
      },
    },
    {
      name: 'openInNewTab',
      type: 'checkbox',
      defaultValue: true,
    } satisfies CheckboxField,
  ],
}

export const LogoStripBlock: Block = {
  admin: getBlockThumbnailAdmin('logoStrip'),
  slug: 'logoStrip',
  interfaceName: 'LogoStripBlock',
  labels: {
    singular: 'Logo Strip',
    plural: 'Logo Strips',
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
              label: 'Label',
              type: 'text',
              admin: {
                description: 'Short label above the logos (e.g. Accredited By, Our Partners).',
              },
            },
            {
              name: 'title',
              type: 'text',
              admin: {
                description: 'Optional section heading.',
              },
            },
            { name: 'description', type: 'textarea', admin: { description: 'Optional description below the heading.' } },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            logosField,
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
            {
              name: 'displayMode',
              label: 'Display Mode',
              type: 'select',
              defaultValue: 'marquee',
              options: [
                { label: 'Scrolling Marquee', value: 'marquee' },
                { label: 'Static Grid', value: 'grid' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'showLabels',
              label: 'Show Labels',
              type: 'checkbox',
              defaultValue: false,
              admin: {
                description: 'Show the text label below each logo.',
              },
            } satisfies CheckboxField,
            {
              name: 'grayscale',
              label: 'Grayscale Logos',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description: 'Display logos in greyscale — they reveal colour on hover.',
              },
            } satisfies CheckboxField,
            {
              name: 'logoHeight',
              label: 'Logo Height',
              type: 'select',
              defaultValue: 'md',
              options: [
                { label: 'Small (32px)', value: 'sm' },
                { label: 'Medium (48px)', value: 'md' },
                { label: 'Large (64px)', value: 'lg' },
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
