import type { ArrayField, Block, CheckboxField, RadioField, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardTabs } from '@/blocks/shared/cardThemeFields'
import {
  buttonVariantDescription,
  buttonVariantOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'
import { createIconField } from '@/blocks/shared/iconField'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'

type BlockSiblingData = {
  backgroundImage?: unknown
  headerLayout?: 'split' | 'stacked' | null
}
type CardSiblingData = {
  actionLabel?: string | null
  actionMode?: 'button' | 'link' | null
  linkType?: 'custom' | 'none' | 'page' | null
}

const hasBackgroundImage = (_data: unknown, siblingData: BlockSiblingData) =>
  Boolean(siblingData?.backgroundImage)
const isSplitHeader = (_data: unknown, siblingData: BlockSiblingData) =>
  siblingData?.headerLayout === 'split'
const isPageLink = (_data: unknown, siblingData: CardSiblingData) =>
  siblingData?.linkType === 'page'
const isCustomLink = (_data: unknown, siblingData: CardSiblingData) =>
  siblingData?.linkType === 'custom'
const hasLink = (_data: unknown, siblingData: CardSiblingData) =>
  siblingData?.linkType === 'page' || siblingData?.linkType === 'custom'
const hasActionLabel = (_data: unknown, siblingData: CardSiblingData) =>
  Boolean(siblingData?.actionLabel?.trim())
const isButtonAction = (_data: unknown, siblingData: CardSiblingData) =>
  hasActionLabel(_data, siblingData) && siblingData?.actionMode === 'button'

const showcaseCardBackgroundValues = [
  'default',
  'subtle',
  'brand',
  'gradient-subtle',
  'gradient-brand',
] as const

type ShowcaseCardBackground = (typeof showcaseCardBackgroundValues)[number]

const normalizeShowcaseCardBackground = (
  value?: string | null,
  fallback: ShowcaseCardBackground | 'inherit' = 'default',
): ShowcaseCardBackground | 'inherit' => {
  if (value === 'inherit') return 'inherit'
  if (showcaseCardBackgroundValues.includes(value as ShowcaseCardBackground)) {
    return value as ShowcaseCardBackground
  }
  if (value === 'primary') return 'brand'
  if (value === 'secondary' || value === 'muted' || value === 'accent') return 'subtle'
  return fallback
}

const cardBackgroundOptions = [
  { label: 'Match Section', value: 'default' },
  { label: 'Subtle', value: 'subtle' },
  { label: 'Brand', value: 'brand' },
  { label: 'Gradient: Subtle', value: 'gradient-subtle' },
  { label: 'Gradient: Brand', value: 'gradient-brand' },
] as const

const cardBackgroundField = {
  name: 'cardBackground',
  label: 'Background Override',
  type: 'select',
  defaultValue: 'inherit',
  required: true,
  options: [{ label: 'Use Showcase Default', value: 'inherit' }, ...cardBackgroundOptions],
  admin: {
    description: 'Override the showcase default for this card only.',
  },
  hooks: {
    afterRead: [({ value }) => normalizeShowcaseCardBackground(value as string | null, 'inherit')],
  },
} satisfies SelectField

const actionModeField = {
  name: 'actionMode',
  label: 'Display Action As',
  type: 'select',
  defaultValue: 'link',
  required: false,
  options: [
    { label: 'Link', value: 'link' },
    { label: 'Button', value: 'button' },
  ],
  admin: { condition: hasActionLabel },
} satisfies SelectField

const actionVariantField = {
  name: 'actionVariant',
  label: 'Button Variant',
  type: 'select',
  defaultValue: 'default',
  required: true,
  options: buttonVariantOptions,
  admin: {
    condition: isButtonAction,
    description: buttonVariantDescription,
  },
} satisfies SelectField

const showArrowField = {
  name: 'showArrow',
  label: 'Show arrow',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    condition: isButtonAction,
    description: 'Adds a trailing arrow to this button action.',
  },
} satisfies CheckboxField

const cardsField = {
  name: 'cards',
  type: 'array',
  required: true,
  minRows: 1,
  maxRows: 12,
  admin: {
    initCollapsed: true,
    description: 'Equal-size icon cards arranged using the showcase width setting.',
  },
  fields: [
    createCardTabs({
      includeBackground: false,
      contentFields: [
        createIconField({ required: false }),
        {
          name: 'eyebrow',
          type: 'text',
          admin: { description: 'Optional short label shown above the card title.' },
        },
        { name: 'title', type: 'text', required: true },
        {
          name: 'description',
          type: 'textarea',
          admin: { description: 'Optional short supporting text.' },
        },
        {
          name: 'actionLabel',
          label: 'Action Label',
          type: 'text',
          admin: {
            description: 'Adds a visible action when a valid destination is selected.',
          },
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
      themeFields: [actionModeField, actionVariantField, showArrowField, cardBackgroundField],
    }),
  ],
} satisfies ArrayField

const select = (
  name: string,
  label: string,
  defaultValue: string,
  options: Array<{ label: string; value: string }>,
): SelectField => ({
  name,
  label,
  type: 'select',
  defaultValue,
  options,
  required: true,
})

export const IconCardShowcaseBlock: Block = {
  admin: getBlockThumbnailAdmin('iconCardShowcase'),
  slug: 'iconCardShowcase',
  interfaceName: 'IconCardShowcaseBlock',
  labels: {
    singular: 'Icon Card Showcase',
    plural: 'Icon Card Showcases',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'backgroundImage',
              type: 'upload',
              relationTo: 'media',
              required: false,
              admin: {
                description: 'Optional decorative full-width image behind the header and cards.',
              },
            },
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            cardsField,
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
            createMediaOverlayToneField({
              condition: hasBackgroundImage,
              defaultValue: 'light',
              required: false,
            }),
            createMediaOverlayStrengthField({
              condition: hasBackgroundImage,
              defaultValue: 'light',
              required: false,
            }),
            createMediaOverlayDirectionField({
              condition: hasBackgroundImage,
              defaultValue: 'vertical',
              required: false,
            }),
            createMediaOverlayCoverageField({ condition: hasBackgroundImage, required: false }),
            select('headerLayout', 'Header Layout', 'stacked', [
              { label: 'Stacked', value: 'stacked' },
              { label: 'Split', value: 'split' },
            ]),
            {
              name: 'splitContentAlignment',
              label: 'Content Vertical Alignment',
              type: 'select',
              defaultValue: 'top',
              required: true,
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              admin: {
                condition: isSplitHeader,
                description: 'Aligns the description and actions beside the heading in Split mode.',
              },
            } satisfies SelectField,
            select('contentAlignment', 'Section Content Alignment', 'center', [
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
            ]),
            select('cardContentAlignment', 'Card Content Alignment', 'center', [
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
            ]),
            select('cardWidth', 'Cards per Row', 'standard', [
              { label: '2 Cards', value: 'wide' },
              { label: '3 Cards', value: 'standard' },
              { label: '4 Cards', value: 'compact' },
            ]),
            select('cardHeight', 'Card Height', 'standard', [
              { label: 'Compact', value: 'compact' },
              { label: 'Standard', value: 'standard' },
              { label: 'Tall', value: 'tall' },
            ]),
            select('iconSize', 'Icon Size', 'standard', [
              { label: 'Small', value: 'small' },
              { label: 'Standard', value: 'standard' },
              { label: 'Large', value: 'large' },
              { label: 'Extra Large', value: 'extraLarge' },
            ]),
            {
              name: 'defaultCardBackground',
              label: 'Default Card Background',
              type: 'select',
              defaultValue: 'brand',
              required: true,
              options: [...cardBackgroundOptions],
              admin: {
                description: 'Applied to every card unless that card has an override.',
              },
              hooks: {
                afterRead: [
                  ({ value }) => normalizeShowcaseCardBackground(value as string | null, 'brand'),
                ],
              },
            } satisfies SelectField,
            select('size', 'Section Padding', 'default', [
              { label: 'None', value: 'none' },
              { label: 'Compact', value: 'compact' },
              { label: 'Default', value: 'default' },
              { label: 'Comfortable', value: 'comfortable' },
            ]),
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
