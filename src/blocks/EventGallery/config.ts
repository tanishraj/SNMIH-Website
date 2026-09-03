import type { Block, CheckboxField, Condition, SelectField, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import {
  createMediaOverlayCoverageField,
  createMediaOverlayDirectionField,
  createMediaOverlayStrengthField,
  createMediaOverlayToneField,
} from '@/blocks/shared/mediaOverlayFields'
import { createOverlayDisplayField } from '@/blocks/shared/overlayDisplayFields'

const showsCardOverlay: Condition = (_data, siblingData) => siblingData?.showCardOverlay !== false

export const EventGalleryBlock: Block = {
  slug: 'eventGallery',
  interfaceName: 'EventGalleryBlock',
  admin: getBlockThumbnailAdmin('eventGallery'),
  labels: {
    plural: 'Event Galleries',
    singular: 'Event Gallery',
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
            {
              name: 'galleryAlbums',
              label: 'Gallery Albums',
              type: 'relationship',
              relationTo: 'gallery-albums',
              hasMany: true,
              required: true,
              admin: {
                allowCreate: true,
                description:
                  'Select the albums displayed by this block. Create an album here or reorder selected albums for Manual display order.',
                isSortable: true,
              },
            },
            {
              name: 'displayOrder',
              label: 'Display Order',
              type: 'select',
              defaultValue: 'latestEventDate',
              options: [
                {
                  label: 'Latest Event Date',
                  value: 'latestEventDate',
                },
                {
                  label: 'Manual',
                  value: 'manual',
                },
              ],
              required: true,
            } satisfies SelectField,
            {
              name: 'enableAlbumSlideshow',
              label: 'Enable Album Slideshow',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Open the selected album in the full-screen slideshow when a gallery tile is selected.',
              },
            } satisfies CheckboxField,
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
              name: 'showCardOverlay',
              label: 'Show Album Details Overlay',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Show the album title, event date, and image count over each cover image.',
              },
            } satisfies CheckboxField,
            createOverlayDisplayField({
              condition: showsCardOverlay,
              defaultValue: 'always',
            }),
            {
              name: 'showEventDate',
              label: 'Show Event Date',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: showsCardOverlay,
              },
            } satisfies CheckboxField,
            {
              name: 'showImageCount',
              label: 'Show Image Count',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: showsCardOverlay,
              },
            } satisfies CheckboxField,
            {
              name: 'cardTextLayout',
              label: 'Overlay Content Position',
              type: 'select',
              defaultValue: 'split',
              options: [
                { label: 'Bottom Left', value: 'split' },
                { label: 'Bottom Center', value: 'center' },
                { label: 'Center — Vertical & Horizontal', value: 'middleCenter' },
              ],
              required: true,
              admin: {
                condition: showsCardOverlay,
                description:
                  'Every position stacks the image count, event date, and title. Choose where that stack sits and whether it aligns left or center.',
              },
            } satisfies SelectField,
            createMediaOverlayToneField({ condition: showsCardOverlay, defaultValue: 'dark' }),
            createMediaOverlayStrengthField({
              condition: showsCardOverlay,
              defaultValue: 'darker',
            }),
            createMediaOverlayDirectionField({
              condition: showsCardOverlay,
              defaultValue: 'bottomToTop',
            }),
            createMediaOverlayCoverageField({
              condition: showsCardOverlay,
              defaultValue: 'full',
            }),
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
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
