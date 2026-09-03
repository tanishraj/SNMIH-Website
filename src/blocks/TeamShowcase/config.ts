import type { ArrayField, Block, CheckboxField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'

const teamShowcaseMembersField = {
  name: 'members',
  label: 'Team Members',
  type: 'array',
  minRows: 1,
  maxRows: 24,
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
          name: 'description',
          type: 'textarea',
        },
      ],
    }),
  ],
} satisfies ArrayField

export const TeamShowcaseBlock: Block = {
  slug: 'teamShowcase',
  admin: getBlockThumbnailAdmin('teamShowcase'),
  labels: {
    singular: 'Team Showcase',
    plural: 'Team Showcases',
  },
  interfaceName: 'TeamShowcaseBlock',
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'title',
              type: 'text',
            },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField(),
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions', maxRows: 2 }),
            teamShowcaseMembersField,
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
              name: 'showHeaderDivider',
              label: 'Show Header Divider',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
} satisfies Block
