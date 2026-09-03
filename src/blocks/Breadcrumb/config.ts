import type { Block, CheckboxField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createBreadcrumbModeField, createBreadcrumbsField } from '@/blocks/shared/breadcrumbFields'

export const BreadcrumbBlock: Block = {
  admin: getBlockThumbnailAdmin('breadcrumb'),
  slug: 'breadcrumb',
  interfaceName: 'BreadcrumbBlock',
  labels: {
    singular: 'Breadcrumb',
    plural: 'Breadcrumbs',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [createBreadcrumbModeField(), createBreadcrumbsField()],
        },
        {
          label: 'Theme Settings',
          fields: [
            createBlockAppearanceFields(),
            {
              name: 'separator',
              label: 'Separator',
              type: 'select',
              defaultValue: 'chevron',
              required: true,
              options: [
                { label: 'Chevron (›)', value: 'chevron' },
                { label: 'Slash (/)', value: 'slash' },
                { label: 'Arrow (→)', value: 'arrow' },
                { label: 'Dot (•)', value: 'dot' },
              ],
            } satisfies SelectField,
            {
              name: 'alignment',
              label: 'Alignment',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            } satisfies SelectField,
            {
              name: 'size',
              label: 'Breadcrumb Size',
              type: 'select',
              defaultValue: 'default',
              required: true,
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
              ],
            } satisfies SelectField,
            {
              name: 'showHome',
              label: 'Show Home',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'showCurrentPage',
              label: 'Show Current Page',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'sectionPadding',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'compact',
              required: true,
              options: [
                { label: 'None', value: 'none' },
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
              ],
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
