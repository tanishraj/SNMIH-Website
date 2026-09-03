import type { ArrayField, Block, CheckboxField, GroupField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { projectEditor } from '@/fields/bodyEditorConfig'

import type { QaAccordionLayoutMode } from './layoutContract'

type QaAccordionBlockSiblingData = {
  layoutMode?: QaAccordionLayoutMode | 'fiftyFifty' | 'fullWidth' | 'oneThird' | null
}

const hasSplitLayout = (_data: unknown, siblingData: QaAccordionBlockSiblingData) =>
  siblingData?.layoutMode !== 'stacked' && siblingData?.layoutMode !== 'fullWidth'

const qaAccordionItemsField = {
  name: 'items',
  label: 'Q&A Items',
  type: 'array',
  minRows: 1,
  admin: {
    initCollapsed: true,
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'richText',
      editor: projectEditor,
      required: true,
    },
  ],
} satisfies ArrayField

const profileGroupField = {
  name: 'profile',
  label: 'Profile',
  type: 'group',
  fields: [
    {
      name: 'image',
      label: 'Profile Image',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'title',
      type: 'text',
    },
  ],
} satisfies GroupField

const contactGroupField = {
  name: 'contact',
  label: 'Contact Prompt',
  type: 'group',
  fields: [
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type: 'textarea',
    },
    createContentActionsField(),
  ],
} satisfies GroupField

const sideColumnField = {
  name: 'sideColumn',
  label: 'Supporting Content',
  type: 'group',
  admin: {
    condition: hasSplitLayout,
  },
  fields: [profileGroupField, contactGroupField],
} satisfies GroupField

export const QaAccordionBlock: Block = {
  slug: 'qaAccordion',
  interfaceName: 'QaAccordionBlock',
  admin: getBlockThumbnailAdmin('qaAccordion'),
  labels: {
    singular: 'Q&A Accordion',
    plural: 'Q&A Accordions',
  },
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
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            qaAccordionItemsField,
            sideColumnField,
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
              name: 'layoutMode',
              label: 'Layout Mode',
              type: 'select',
              defaultValue: 'split',
              options: [
                { label: 'Stacked', value: 'stacked' },
                { label: 'Split', value: 'split' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'splitProportion',
              label: 'Split Proportion',
              type: 'select',
              defaultValue: 'balanced',
              options: [
                { label: 'Balanced (50 / 50)', value: 'balanced' },
                { label: 'Section Content Focus (60 / 40)', value: 'sectionFocus' },
                { label: 'Q&A Focus (40 / 60)', value: 'qaFocus' },
              ],
              admin: {
                condition: hasSplitLayout,
              },
              required: true,
            } satisfies SelectField,
            {
              name: 'accordionPlacement',
              label: 'Q&A Position',
              type: 'select',
              defaultValue: 'right',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                condition: hasSplitLayout,
              },
              required: true,
            } satisfies SelectField,
            {
              name: 'sectionVerticalAlignment',
              label: 'Section Content Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: hasSplitLayout,
              },
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
              name: 'defaultOpenFirst',
              label: 'Open First Item By Default',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
