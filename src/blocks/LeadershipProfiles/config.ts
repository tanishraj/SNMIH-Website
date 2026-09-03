import type { ArrayField, Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardBackgroundField, createCardTabs } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

type CardLayoutSiblingData = {
  cardLayout?: 'imageOverlay' | 'standard' | null
}

const usesStandardCardLayout = (_data: unknown, siblingData: CardLayoutSiblingData) =>
  siblingData?.cardLayout !== 'imageOverlay'

const usesImageOverlayCardLayout = (_data: unknown, siblingData: CardLayoutSiblingData) =>
  siblingData?.cardLayout === 'imageOverlay'

type HeaderLayoutSiblingData = {
  headerLayout?: 'split' | 'stacked' | null
}

const isSplitHeader = (_data: unknown, siblingData: HeaderLayoutSiblingData) =>
  siblingData?.headerLayout !== 'stacked'

const leadershipCardBackgroundField = createCardBackgroundField({
  defaultOptionLabel: 'Default Card',
  adminDescription:
    'Applies one semantic card surface to every Standard leadership profile for a consistent directory.',
})

const profilesField = {
  name: 'profiles',
  label: 'Leadership Profiles',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 24,
  admin: {
    description: 'Leadership cards shown in their displayed order.',
    initCollapsed: true,
  },
  fields: [
    createCardTabs({
      contentFields: [
        {
          name: 'image',
          label: 'Profile Image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'leadershipLabel',
          label: 'Leadership Label',
          type: 'text',
          admin: { description: 'Optional short label, such as Principal.' },
        },
        { name: 'name', type: 'text', required: true },
        { name: 'designation', type: 'text' },
        { name: 'qualification', type: 'text' },
        {
          name: 'expertise',
          label: 'Expertise',
          type: 'array',
          maxRows: 3,
          admin: {
            description: 'Add up to three concise expertise areas in displayed order.',
            initCollapsed: true,
          },
          fields: [{ name: 'item', type: 'text', required: true }],
        } satisfies ArrayField,
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
      ],
      backgroundFieldOptions: {
        adminHidden: true,
        defaultOptionLabel: 'Default Card',
        adminDescription:
          'Legacy compatibility field. New blocks use the shared Card Background setting.',
      },
    }),
  ],
} satisfies ArrayField

export const LeadershipProfilesBlock: Block = {
  admin: getBlockThumbnailAdmin('leadershipProfiles'),
  slug: 'leadershipProfiles',
  interfaceName: 'LeadershipProfilesBlock',
  labels: {
    singular: 'Leadership Profiles',
    plural: 'Leadership Profiles',
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
            { name: 'title', type: 'text' },
            {
              name: 'accentTitle',
              label: 'Accent Title',
              type: 'text',
              admin: { description: 'Optional italic second line of the heading.' },
            },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            profilesField,
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
              name: 'cardLayout',
              label: 'Card Layout',
              type: 'select',
              defaultValue: 'standard',
              required: true,
              options: [
                { label: 'Standard — image above profile details', value: 'standard' },
                {
                  label: 'Image Overlay — portrait image with overlaid identity',
                  value: 'imageOverlay',
                },
              ],
            } satisfies SelectField,
            {
              ...leadershipCardBackgroundField,
              admin: {
                ...leadershipCardBackgroundField.admin,
                condition: usesStandardCardLayout,
              },
            },
            createMediaOverlayToneField({
              condition: usesImageOverlayCardLayout,
              defaultValue: 'dark',
            }),
            createMediaOverlayStrengthField({
              condition: usesImageOverlayCardLayout,
              defaultValue: 'dark',
            }),
            createMediaOverlayDirectionField({
              condition: usesImageOverlayCardLayout,
              defaultValue: 'bottomToTop',
            }),
            createMediaOverlayCoverageField({
              condition: usesImageOverlayCardLayout,
              defaultValue: 'full',
            }),
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
              admin: {
                description:
                  'Aligns the section eyebrow, heading, description, and actions together.',
              },
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
              name: 'descriptionPosition',
              label: 'Description Placement',
              type: 'select',
              defaultValue: 'side',
              required: true,
              options: [
                { label: 'Right Column', value: 'side' },
                { label: 'Under Title', value: 'underTitle' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Moves the section description between the title column and the right column.',
              },
            } satisfies SelectField,
            {
              name: 'sideContentAlignment',
              label: 'Right Column Alignment',
              type: 'select',
              defaultValue: 'bottom',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitHeader,
                description:
                  'Aligns the right-column description and section actions to the top or bottom.',
              },
            } satisfies SelectField,
            {
              name: 'columns',
              label: 'Profile Columns',
              type: 'select',
              defaultValue: '3',
              required: true,
              options: [
                { label: '2 Columns', value: '2' },
                { label: '3 Columns', value: '3' },
                { label: '4 Columns', value: '4' },
              ],
            } satisfies SelectField,
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
