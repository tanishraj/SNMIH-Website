import type { ArrayField, Block, SelectField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { resolveLogoRows } from './rows'

const logoRow = (name: string, label: string): ArrayField => ({
  name,
  label,
  type: 'array',
  maxRows: 40,
  labels: { singular: 'Logo', plural: 'Logos' },
  admin: {
    initCollapsed: true,
    components: { RowLabel: '/blocks/Logos20/RowLabels#LogoItemLabel' },
  },
  fields: [
    { name: 'name', label: 'Organisation Name', type: 'text', required: true },
    {
      name: 'image',
      label: 'Logo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: { mimeType: { contains: 'image/' } },
    },
  ],
})

export const Logos20Block: Block = {
  slug: 'logos20',
  interfaceName: 'Logos20Block',
  labels: { singular: 'Logo Marquee', plural: 'Logo Marquees' },
  admin: getBlockThumbnailAdmin('logos20'),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'eyebrow', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            { name: 'description', type: 'textarea' },
            createContentActionsField({ label: 'Section Actions' }),
            {
              name: 'rows',
              label: 'Logo Rows',
              type: 'array',
              labels: { singular: 'Row', plural: 'Rows' },
              admin: {
                initCollapsed: false,
                components: { RowLabel: '/blocks/Logos20/RowLabels#LogoRowLabel' },
                description:
                  'Add a row, then add logos inside it. Drag rows or logos to reorder them. Rows alternate scrolling left and right; empty rows are omitted.',
              },
              hooks: {
                afterRead: [
                  ({ value, siblingData }) => resolveLogoRows({ ...siblingData, rows: value }),
                ],
                beforeValidate: [
                  ({ value, siblingData }) => resolveLogoRows({ ...siblingData, rows: value }),
                ],
              },
              fields: [logoRow('logos', 'Logos')],
            },
            // Retain stored fields for older blocks; editors work only with the unified rows above.
            { ...logoRow('topRow', 'Top Row'), admin: { hidden: true } },
            { ...logoRow('bottomRow', 'Bottom Row'), admin: { hidden: true } },
            {
              name: 'additionalRows',
              type: 'array',
              admin: { hidden: true },
              fields: [logoRow('logos', 'Logos')],
            },
            createContentActionsField({ name: 'footerActions', label: 'Footer Actions' }),
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
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                description:
                  'Aligns the heading, description, and section/footer actions. Logo rows always span the container.',
              },
            } satisfies SelectField,
            {
              name: 'enableMotion',
              label: 'Enable Scrolling',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Rows scroll in opposite directions and pause on hover. Reduced-motion preferences always show static logos.',
              },
            },
            {
              name: 'showPauseControl',
              label: 'Show Pause / Play Control',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: (_data, siblingData) => siblingData?.enableMotion !== false,
                description:
                  'Shows an icon button that pauses or plays all rows. Its size follows Section Padding.',
              },
            },
            {
              name: 'speed',
              label: 'Scroll Speed',
              type: 'select',
              defaultValue: 'normal',
              options: [
                { label: 'Slow', value: 'slow' },
                { label: 'Normal', value: 'normal' },
                { label: 'Fast', value: 'fast' },
              ],
              admin: { condition: (_data, siblingData) => siblingData?.enableMotion !== false },
            } satisfies SelectField,
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
            } satisfies SelectField,
            {
              name: 'showLabels',
              label: 'Show Organisation Names',
              type: 'checkbox',
              defaultValue: false,
            },
            { name: 'grayscale', label: 'Grayscale Logos', type: 'checkbox', defaultValue: false },
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
    },
  ],
}
