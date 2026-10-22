import type { CollectionBeforeValidateHook, CollectionConfig, SelectField } from 'payload'

import {
  allowPublishedReadOrFeature,
  deleteFeatureOrAdmin,
  hideUnlessFeature,
  requireFeature,
} from '@/access/featureAccess'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createCollectionAuditHook } from '@/hooks/logOperationalAuditEvent'
import {
  revalidateCelebrationsCache,
  revalidateDeletedCelebrationCache,
} from '@/hooks/revalidateCmsContent'
import {
  CELEBRATION_FREQUENCY_OPTIONS,
  CELEBRATION_STYLE_OPTIONS,
  CONFETTI_MAX_PIECES,
  CONFETTI_MAX_SHOTS,
  CONFETTI_MIN_PIECES,
  DEFAULT_CONFETTI_PIECES,
  DEFAULT_CONFETTI_SHOTS,
  MAX_TIMES_PER_DAY,
} from '@/lib/celebrations/shared'

/** Keeps the hidden `lastDay` in step with the window so the loader can query by it. */
const setLastDay: CollectionBeforeValidateHook = ({ data }) => {
  if (!data) return data
  data.lastDay = data.endDate || data.startDate || null
  return data
}

const validateEndDate = (
  value: unknown,
  { siblingData }: { siblingData: Record<string, unknown> },
) => {
  if (!value || !siblingData?.startDate) return true
  return new Date(String(value)).getTime() >= new Date(String(siblingData.startDate)).getTime()
    ? true
    : 'End date must be on or after the start date.'
}

const validateImageOnly = (
  value: unknown,
  { siblingData }: { siblingData: Record<string, unknown> },
) => (value && !siblingData?.image ? 'Add an image to use image-only mode.' : true)

const validateHeading = (
  value: unknown,
  { siblingData }: { siblingData: Record<string, unknown> },
) =>
  siblingData?.imageOnly || (typeof value === 'string' && value.trim())
    ? true
    : 'Add a heading, or switch on image-only mode.'

export const Celebrations: CollectionConfig = {
  slug: 'celebrations',
  labels: {
    singular: 'Celebration',
    plural: 'Celebrations',
  },
  admin: {
    group: 'Content',
    hidden: hideUnlessFeature('celebrations'),
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'endDate', 'enabled', '_status'],
    description:
      'Scheduled celebration modals with confetti. Each appears on its own dates, on every page or only where a Celebration block is added.',
    listSearchableFields: ['title', 'heading'],
  },
  access: {
    create: requireFeature('celebrations'),
    delete: deleteFeatureOrAdmin('celebrations'),
    read: allowPublishedReadOrFeature('celebrations'),
    readVersions: requireFeature('celebrations'),
    update: requireFeature('celebrations'),
  },
  hooks: {
    beforeValidate: [setLastDay],
    afterChange: [
      revalidateCelebrationsCache,
      createCollectionAuditHook({
        entityType: 'celebration',
        feature: 'celebrations',
        getSummary: ({ doc }) => `Celebration "${String(doc.title ?? doc.id)}" saved.`,
        titleField: 'title',
      }),
    ],
    afterDelete: [revalidateDeletedCelebrationCache],
  },
  versions: {
    drafts: true,
  },
  timestamps: true,
  fields: [
    {
      name: 'title',
      label: 'Internal Name',
      type: 'text',
      required: true,
      admin: { description: 'For editors only, e.g. "Founder\'s Day 2027".' },
    },
    {
      name: 'enabled',
      label: 'Enabled',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'Switch off to hide this celebration everywhere without deleting it.',
      },
    },
    {
      name: 'placement',
      label: 'Show On',
      type: 'select',
      defaultValue: 'everyPage',
      required: true,
      options: [
        { label: 'Every page', value: 'everyPage' },
        { label: 'Only pages with a Celebration block', value: 'selectedPages' },
      ],
      admin: { position: 'sidebar' },
    } satisfies SelectField,
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          label: 'Start Date',
          type: 'date',
          required: true,
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
            description: 'Read in the site timezone (Site Settings).',
            width: '50%',
          },
        },
        {
          name: 'endDate',
          label: 'End Date',
          type: 'date',
          validate: validateEndDate,
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
            description: 'Leave blank for a single day.',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'lastDay',
      type: 'date',
      index: true,
      admin: { hidden: true },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            {
              name: 'imageOnly',
              label: 'Image only',
              type: 'checkbox',
              defaultValue: false,
              validate: validateImageOnly,
              admin: {
                description:
                  'Show just the image (for example a festival poster). Text below is then used only for screen readers.',
              },
            },
            {
              name: 'image',
              label: 'Image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Portrait for Aurora Halo, picture for Glass Bloom and Ticket, poster for Floating Poster.',
              },
            },
            { name: 'eyebrow', type: 'text', admin: { description: 'e.g. "A warm welcome".' } },
            {
              type: 'row',
              fields: [
                {
                  name: 'heading',
                  type: 'text',
                  validate: validateHeading,
                  admin: { width: '50%' },
                },
                {
                  name: 'accentHeading',
                  label: 'Accent Heading (Italic)',
                  type: 'text',
                  admin: { width: '50%' },
                },
              ],
            },
            { name: 'message', type: 'textarea' },
            {
              name: 'highlight',
              label: 'Highlight',
              type: 'text',
              admin: {
                condition: (_data, siblingData) => siblingData?.style === 'medallion',
                description: 'Large gold text in the Medallion, e.g. "25".',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'signature',
                  type: 'text',
                  admin: { description: 'e.g. "With warm wishes".', width: '50%' },
                },
                {
                  name: 'signatureRole',
                  label: 'Signed By',
                  type: 'text',
                  admin: { description: 'e.g. "The Principal, SNMIH".', width: '50%' },
                },
              ],
            },
            createContentActionsField({ label: 'Button', maxRows: 1 }),
          ],
        },
        {
          label: 'Display',
          fields: [
            {
              name: 'style',
              label: 'Style',
              type: 'select',
              defaultValue: 'aurora',
              required: true,
              options: CELEBRATION_STYLE_OPTIONS,
            } satisfies SelectField,
            {
              name: 'frequency',
              label: 'How Often',
              type: 'select',
              defaultValue: 'oncePerDay',
              required: true,
              options: CELEBRATION_FREQUENCY_OPTIONS,
              admin: {
                description:
                  "Remembered in each visitor's browser. After closing, a small badge lets them reopen it.",
              },
            } satisfies SelectField,
            {
              name: 'timesPerDay',
              label: 'Times Per Day',
              type: 'number',
              defaultValue: 2,
              min: 1,
              max: MAX_TIMES_PER_DAY,
              admin: {
                condition: (_data, siblingData) => siblingData?.frequency === 'timesPerDay',
              },
            },
            {
              name: 'openDelay',
              label: 'Open After (seconds)',
              type: 'number',
              defaultValue: 1,
              min: 0,
              max: 30,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'showReopenBadge',
                  label: 'Show reopen badge after closing',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'badgeLabel',
                  label: 'Badge Label',
                  type: 'text',
                  defaultValue: 'Celebrating today',
                  admin: {
                    condition: (_data, siblingData) => siblingData?.showReopenBadge !== false,
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Confetti',
          fields: [
            {
              name: 'confettiEnabled',
              label: 'Celebrate with confetti',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                description:
                  'Full-screen confetti when the modal opens. Skipped for visitors who prefer reduced motion.',
              },
            },
            {
              type: 'row',
              admin: {
                condition: (_data, siblingData) => siblingData?.confettiEnabled !== false,
              },
              fields: [
                {
                  name: 'confettiShots',
                  label: 'Bursts',
                  type: 'number',
                  defaultValue: DEFAULT_CONFETTI_SHOTS,
                  min: 1,
                  max: CONFETTI_MAX_SHOTS,
                  admin: { description: 'How many times the corners fire.', width: '33%' },
                },
                {
                  name: 'confettiPieces',
                  label: 'Pieces per Burst',
                  type: 'number',
                  defaultValue: DEFAULT_CONFETTI_PIECES,
                  min: CONFETTI_MIN_PIECES,
                  max: CONFETTI_MAX_PIECES,
                  admin: {
                    description: `From each bottom corner, ${CONFETTI_MIN_PIECES}–${CONFETTI_MAX_PIECES}. Larger values make a bigger splash.`,
                    width: '34%',
                  },
                },
                {
                  name: 'confettiSpeed',
                  label: 'Speed',
                  type: 'select',
                  defaultValue: 'medium',
                  options: [
                    { label: 'Very slow', value: 'verySlow' },
                    { label: 'Slow', value: 'slow' },
                    { label: 'Normal', value: 'medium' },
                    { label: 'Lively', value: 'lively' },
                  ],
                  admin: { width: '33%' },
                } satisfies SelectField,
              ],
            },
          ],
        },
      ],
    },
  ],
}
