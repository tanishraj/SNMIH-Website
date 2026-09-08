import type { ArrayField, Block, SelectField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

const logoRow = (name: string, label: string): ArrayField => ({
  name,
  label,
  type: 'array',
  maxRows: 40,
  admin: { initCollapsed: true, description: 'Logos in display order. Empty rows are omitted.' },
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
            logoRow('topRow', 'Top Row — Scrolls Left'),
            logoRow('bottomRow', 'Bottom Row — Scrolls Right'),
            {
              name: 'additionalRows',
              label: 'Additional Rows',
              type: 'array',
              labels: { singular: 'Logo Row', plural: 'Logo Rows' },
              admin: {
                initCollapsed: true,
                description:
                  'Add and reorder more rows below the first two. Directions alternate left, right, left, right. Empty rows are omitted.',
              },
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
                  'Rows scroll in opposite directions and pause on hover. Visitors can pause all rows. Reduced-motion preferences always show static logos.',
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
