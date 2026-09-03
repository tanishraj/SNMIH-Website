import type { Block, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createCardBackgroundField } from '@/blocks/shared/cardThemeFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'

export const TestimonialSpotlightBlock: Block = {
  slug: 'testimonialSpotlight',
  interfaceName: 'TestimonialSpotlightBlock',
  admin: getBlockThumbnailAdmin('testimonialSpotlight'),
  labels: {
    singular: 'Testimonial Spotlight',
    plural: 'Testimonial Spotlights',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'sectionEyebrow',
              label: 'Section Eyebrow',
              type: 'text',
              admin: { description: 'Small label above the section title.' },
            },
            {
              name: 'sectionTitle',
              label: 'Section Title',
              type: 'text',
            },
            {
              name: 'sectionDescription',
              label: 'Section Description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Section Actions', maxRows: 2 }),
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'eyebrow',
              type: 'text',
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'testimonial',
              type: 'textarea',
            },
            {
              name: 'description',
              type: 'textarea',
            },
            {
              name: 'personName',
              label: 'Person Name',
              type: 'text',
              required: true,
            },
            {
              name: 'designation',
              type: 'text',
            },
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
              name: 'sectionContentAlignment',
              label: 'Section Content Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
              ],
              required: true,
            } satisfies SelectField,
            createCardBackgroundField({
              adminDescription:
                'Match Section inherits the section surface. Other choices apply a semantic theme surface to the complete image and content container.',
              defaultOptionLabel: 'Match Section',
              label: 'Container Background',
              name: 'containerBackground',
            }),
            {
              name: 'containerOutline',
              label: 'Container Outline',
              type: 'select',
              defaultValue: 'outline',
              options: [
                { label: 'None', value: 'none' },
                { label: 'Outline', value: 'outline' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'mediaPosition',
              label: 'Image Placement',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Image Left', value: 'left' },
                { label: 'Image Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'imagePosition',
              label: 'Background Position',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Center', value: 'center' },
                { label: 'Top', value: 'top' },
                { label: 'Bottom', value: 'bottom' },
                { label: 'Left', value: 'left' },
                { label: 'Right', value: 'right' },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'mediaFillMode',
              label: 'Media Fill',
              type: 'select',
              defaultValue: 'contained',
              options: [
                { label: 'Contained', value: 'contained' },
                { label: 'Contained Fill', value: 'containedFill' },
                { label: 'Edge to Edge', value: 'edgeToEdge' },
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
              name: 'contentVerticalAlignment',
              label: 'Content Vertical Alignment',
              type: 'select',
              defaultValue: 'center',
              options: [
                { label: 'Top', value: 'top' },
                { label: 'Center', value: 'center' },
                { label: 'Bottom', value: 'bottom' },
              ],
              required: true,
            } satisfies SelectField,
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
