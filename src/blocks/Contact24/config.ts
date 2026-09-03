import type { Block, CheckboxField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  buttonVariantDescription,
  buttonVariantOptions,
  createContentActionModeField,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'

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

const detailsAlignmentField = {
  name: 'detailsAlignment',
  label: 'Details Alignment',
  type: 'select',
  defaultValue: 'left',
  options: [
    { label: 'Left', value: 'left' },
    { label: 'Center', value: 'center' },
    { label: 'Right', value: 'right' },
  ],
  required: true,
} satisfies SelectField

const showAddressDetailsField = {
  name: 'showAddressDetails',
  label: 'Show Location Details',
  type: 'checkbox',
  defaultValue: true,
} satisfies CheckboxField

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

export const Contact24Block: Block = {
  slug: 'contact24',
  interfaceName: 'Contact24Block',
  admin: getBlockThumbnailAdmin('contact24'),
  labels: {
    singular: 'Regional Offices',
    plural: 'Regional Offices',
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
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            {
              name: 'offices',
              label: 'Offices to Show',
              type: 'relationship',
              relationTo: 'office-locations',
              hasMany: true,
              filterOptions: { _status: { equals: 'published' } },
              admin: {
                description:
                  'Leave empty to show all published offices. Select specific offices to show only those, in the order chosen.',
                allowCreate: false,
              },
            },
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            contentAlignmentField,
            detailsAlignmentField,
            showAddressDetailsField,
            sizeField,
            {
              name: 'mapActionLabel',
              label: 'Map Action Label',
              type: 'text',
              defaultValue: 'View on Map',
              admin: {
                description: 'Label for the map link shown on each office card.',
              },
            },
            createContentActionModeField({
              name: 'mapActionMode',
              label: 'Map Action Style',
            }),
            {
              name: 'mapActionVariant',
              label: 'Map Button Variant',
              type: 'select',
              defaultValue: 'outline',
              options: buttonVariantOptions,
              admin: {
                condition: (_, siblingData) => siblingData?.mapActionMode === 'button',
                description: buttonVariantDescription,
              },
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
