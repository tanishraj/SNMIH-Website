import type { Block, TabsField } from 'payload'

import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import {
  createBannerActionPlacementField,
  createBannerContentAlignmentField,
  createBannerContentWidthField,
  createBannerHeightField,
  createBannerOverlayDirectionField,
  createBannerOverlayStyleField,
  createBannerSectionPaddingField,
  createBannerThemeModeField,
} from '@/blocks/shared/bannerCtaFields'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createMediaOverlayCoverageField } from '@/blocks/shared/mediaOverlayFields'

export const BannerCtaBlock: Block = {
  admin: getBlockThumbnailAdmin('bannerCta'),
  slug: 'bannerCta',
  interfaceName: 'BannerCtaBlock',
  labels: {
    singular: 'Banner CTA',
    plural: 'Banner CTAs',
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
              label: 'Background Image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Sits behind the overlay. Without one the block falls back to the Appearance background.',
              },
            },
            {
              name: 'eyebrow',
              type: 'text',
              admin: { description: 'Small label above the heading.' },
            },
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'accentTitle',
              label: 'Accent Title (Italic)',
              type: 'text',
              admin: { description: 'Optional emphasized second line of the heading.' },
            },
            {
              name: 'description',
              type: 'textarea',
            },
            createContentActionsField({ label: 'Actions', maxRows: 3 }),
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
            createBannerActionPlacementField(),
            createBannerContentAlignmentField(),
            createBannerContentWidthField(),
            createBannerThemeModeField(),
            createBannerOverlayStyleField(),
            createBannerOverlayDirectionField(),
            createMediaOverlayCoverageField({ required: false }),
            createBannerHeightField(),
            createBannerSectionPaddingField(),
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
