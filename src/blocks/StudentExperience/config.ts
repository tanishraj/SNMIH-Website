import type { ArrayField, Block, CheckboxField, RadioField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

type LinkSiblingData = {
  linkType?: 'custom' | 'none' | 'page' | null
}

const isPageLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'page'

const isCustomLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'custom'

const hasLink = (_data: unknown, siblingData: LinkSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'

const experiencesField = {
  name: 'experiences',
  label: 'Experience Cards',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 5,
  admin: {
    description:
      'Add up to five image cards. On wide screens, the first card spans both rows and the remaining cards form the supporting mosaic.',
    initCollapsed: true,
  },
  fields: [
    createCardTabs({
      includeBackground: false,
      contentFields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'linkType',
          label: 'Card Link',
          type: 'radio',
          defaultValue: 'none',
          options: [
            { label: 'None', value: 'none' },
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
          admin: { condition: hasLink },
        } satisfies CheckboxField,
      ],
      themeFields: [
        {
          name: 'imagePosition',
          label: 'Image Position',
          type: 'select',
          defaultValue: 'center',
          required: true,
          options: [
            { label: 'Center', value: 'center' },
            { label: 'Top', value: 'top' },
            { label: 'Bottom', value: 'bottom' },
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
        } satisfies SelectField,
        createMediaOverlayToneField(),
        createMediaOverlayStrengthField({ name: 'overlayStrength' }),
        createMediaOverlayDirectionField({ defaultValue: 'bottomToTop' }),
        createMediaOverlayCoverageField(),
      ],
    }),
  ],
} satisfies ArrayField

export const StudentExperienceBlock: Block = {
  admin: getBlockThumbnailAdmin('studentExperience'),
  slug: 'studentExperience',
  interfaceName: 'StudentExperienceBlock',
  labels: {
    singular: 'Student Experience',
    plural: 'Student Experiences',
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
              admin: { description: 'Small label above the section title.' },
            },
            {
              name: 'title',
              type: 'text',
            },
            {
              name: 'accentTitle',
              label: 'Accent Title',
              type: 'text',
              admin: { description: 'Optional italic second line of the heading.' },
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            experiencesField,
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
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
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            } satisfies SelectField,
            {
              name: 'headerLayout',
              label: 'Header Layout',
              type: 'select',
              defaultValue: 'split',
              required: true,
              options: [
                { label: 'Split', value: 'split' },
                { label: 'Stacked', value: 'stacked' },
              ],
            } satisfies SelectField,
            {
              name: 'cardHeight',
              label: 'Card Height',
              type: 'select',
              defaultValue: 'default',
              required: true,
              options: [
                { label: 'Compact', value: 'compact' },
                { label: 'Default', value: 'default' },
                { label: 'Comfortable', value: 'comfortable' },
              ],
            } satisfies SelectField,
            {
              name: 'showNumbers',
              label: 'Show Card Numbers',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            {
              name: 'size',
              label: 'Section Padding',
              type: 'select',
              defaultValue: 'default',
              required: true,
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
