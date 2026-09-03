import type {
  ArrayField,
  ArrayFieldValidation,
  Block,
  CheckboxField,
  Condition,
  RelationshipField,
  RelationshipFieldManyValidation,
  SelectField,
  TabsField,
} from 'payload'

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

const showImageOverlayControls: Condition = (_data, siblingData) =>
  siblingData?.showImageOverlays !== false
const showAlbumOverlayControls: Condition = (_data, siblingData) =>
  (siblingData as { contentSource?: unknown })?.contentSource === 'galleryAlbums' &&
  siblingData?.showImageOverlays !== false
const showManualImages: Condition = (_data, siblingData) =>
  (siblingData as { contentSource?: unknown })?.contentSource !== 'galleryAlbums'
const showGalleryAlbums: Condition = (_data, siblingData) =>
  (siblingData as { contentSource?: unknown })?.contentSource === 'galleryAlbums'

const validateManualItems: ArrayFieldValidation = (value, { siblingData }) =>
  (siblingData as { contentSource?: unknown })?.contentSource === 'galleryAlbums' ||
  (Array.isArray(value) && value.length > 0)
    ? true
    : 'Add at least one image.'

const validateGalleryAlbums: RelationshipFieldManyValidation = (value, { siblingData }) =>
  (siblingData as { contentSource?: unknown })?.contentSource !== 'galleryAlbums' ||
  (Array.isArray(value) && value.length > 0)
    ? true
    : 'Select at least one Gallery Album.'

const itemsField = {
  name: 'items',
  label: 'Images',
  type: 'array',
  minRows: 1,
  maxRows: 8,
  admin: {
    condition: showManualImages,
    initCollapsed: true,
  },
  validate: validateManualItems,
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
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
      name: 'title',
      type: 'text',
    },
    createContentActionsField({
      includeDisplayMode: true,
      label: 'Action',
      maxRows: 1,
      name: 'action',
    }),
  ],
} satisfies ArrayField

export const ImageMosaicBlock: Block = {
  slug: 'imageMosaic',
  interfaceName: 'ImageMosaicBlock',
  admin: getBlockThumbnailAdmin('imageMosaic'),
  labels: {
    singular: 'Image Mosaic',
    plural: 'Image Mosaics',
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
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField(),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            {
              name: 'contentSource',
              label: 'Content Source',
              type: 'select',
              defaultValue: 'manualImages',
              options: [
                { label: 'Manual Images', value: 'manualImages' },
                { label: 'Gallery Albums', value: 'galleryAlbums' },
              ],
              required: true,
            } satisfies SelectField,
            itemsField,
            {
              name: 'galleryAlbums',
              label: 'Gallery Albums',
              type: 'relationship',
              relationTo: 'gallery-albums',
              hasMany: true,
              maxRows: 8,
              admin: {
                allowCreate: true,
                condition: showGalleryAlbums,
                description:
                  'Select up to eight albums. Each album contributes its first usable image to the mosaic.',
                isSortable: true,
              },
              validate: validateGalleryAlbums,
            } satisfies RelationshipField,
            {
              name: 'displayOrder',
              label: 'Display Order',
              type: 'select',
              defaultValue: 'latestEventDate',
              options: [
                { label: 'Latest Event Date', value: 'latestEventDate' },
                { label: 'Manual', value: 'manual' },
              ],
              required: true,
              admin: {
                condition: showGalleryAlbums,
              },
            } satisfies SelectField,
            {
              name: 'enableAlbumSlideshow',
              label: 'Enable Album Slideshow',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: showGalleryAlbums,
                description:
                  'Open all images from the selected album in the full-screen slideshow when its tile is selected.',
              },
            } satisfies CheckboxField,
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
              name: 'showImageOverlays',
              label: 'Show Image Details Overlay',
              type: 'checkbox',
              defaultValue: true,
            } satisfies CheckboxField,
            createOverlayDisplayField({
              condition: showImageOverlayControls,
              defaultValue: 'hover',
            }),
            {
              name: 'showEventDate',
              label: 'Show Event Date',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: showAlbumOverlayControls,
              },
            } satisfies CheckboxField,
            {
              name: 'showImageCount',
              label: 'Show Image Count',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: showAlbumOverlayControls,
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
                condition: showImageOverlayControls,
                description: 'Choose where the image or album details appear over every tile.',
              },
            } satisfies SelectField,
            createMediaOverlayToneField({
              condition: showImageOverlayControls,
              required: false,
            }),
            createMediaOverlayStrengthField({
              condition: showImageOverlayControls,
              required: false,
            }),
            createMediaOverlayDirectionField({
              condition: showImageOverlayControls,
              defaultValue: 'bottomToTop',
              required: false,
            }),
            createMediaOverlayCoverageField({
              condition: showImageOverlayControls,
              required: false,
            }),
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
