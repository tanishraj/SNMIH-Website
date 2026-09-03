import type { ArrayField, Block, SelectField, TabsField } from 'payload'

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
import { createBreadcrumbModeField, createBreadcrumbsField } from '@/blocks/shared/breadcrumbFields'
import { getBlockThumbnailAdmin } from '@/block-thumbnails/definitions'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { createMediaOverlayCoverageField } from '@/blocks/shared/mediaOverlayFields'

const isBanner = (_data: unknown, siblingData: { variant?: string | null }) =>
  siblingData?.variant === 'banner'

type PageHeaderTopContentSiblings = {
  topContent?: 'breadcrumb' | 'eyebrow' | null
}

const usesBreadcrumbTopContent = (_data: unknown, siblingData: PageHeaderTopContentSiblings) =>
  siblingData?.topContent !== 'eyebrow'

const usesEyebrowTopContent = (_data: unknown, siblingData: PageHeaderTopContentSiblings) =>
  siblingData?.topContent === 'eyebrow'

const breadcrumbModeField = createBreadcrumbModeField({
  condition: usesBreadcrumbTopContent,
  includeHidden: true,
  label: 'Breadcrumb Display',
})

const breadcrumbsField = createBreadcrumbsField({ condition: usesBreadcrumbTopContent })

const keyFactsField: ArrayField = {
  name: 'keyFacts',
  label: 'Key Facts',
  type: 'array',
  maxRows: 6,
  admin: {
    hidden: true,
    initCollapsed: true,
    description: 'Legacy Page Header data retained for backwards compatibility. Not displayed.',
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      admin: {
        hidden: true,
        description: 'Legacy field retained for existing content. It is no longer displayed.',
      },
    },
    {
      name: 'value',
      type: 'text',
      required: true,
      admin: {
        description: 'Primary statement, e.g. Medical education connected with patient care.',
      },
    },
  ],
}

export const PageHeaderBlock: Block = {
  admin: getBlockThumbnailAdmin('pageHeader'),
  slug: 'pageHeader',
  interfaceName: 'PageHeaderBlock',
  labels: {
    singular: 'Page Header',
    plural: 'Page Headers',
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
                description: 'Used as the full-bleed backdrop for the Banner variant.',
              },
            },
            {
              name: 'topContent',
              label: 'Top Content',
              type: 'select',
              defaultValue: 'breadcrumb',
              options: [
                { label: 'Breadcrumb', value: 'breadcrumb' },
                { label: 'Eyebrow', value: 'eyebrow' },
              ],
              required: true,
              admin: {
                description: 'Choose the single element displayed above the page title.',
              },
            } satisfies SelectField,
            breadcrumbsField,
            {
              name: 'eyebrow',
              type: 'text',
              admin: {
                condition: usesEyebrowTopContent,
                description: 'Small label above the page title.',
              },
            },
            {
              name: 'title',
              type: 'text',
            },
            { name: 'accentTitle', label: 'Accent Title (Italic)', type: 'text' },
            {
              name: 'subtitle',
              type: 'textarea',
              admin: { description: 'Supporting line below the title.' },
            },
            createContentActionsField({ label: 'Actions', maxRows: 3 }),
            createContentActionsField({
              name: 'footerActions',
              label: 'Footer Actions',
              maxRows: 2,
            }),
            keyFactsField,
          ],
        },
        {
          label: 'Theme Settings',
          fields: [
            {
              name: 'variant',
              label: 'Variant',
              type: 'select',
              defaultValue: 'minimal',
              options: [
                {
                  label: 'Minimal — theme surface page introduction',
                  value: 'minimal',
                },
                {
                  label: 'Banner — optional full-bleed background image',
                  value: 'banner',
                },
              ],
              required: true,
            } satisfies SelectField,
            breadcrumbModeField,
            {
              name: 'keyFactsNumberPosition',
              label: 'Number Position',
              type: 'select',
              defaultValue: 'inline',
              options: [
                { label: 'Inline with text', value: 'inline' },
                { label: 'Above text', value: 'above' },
              ],
              admin: {
                hidden: true,
                description: 'Legacy Key Facts setting retained for backwards compatibility.',
              },
            } satisfies SelectField,
            createBlockAppearanceFields(),
            createBannerActionPlacementField(),
            createBannerContentAlignmentField(),
            createBannerContentWidthField(),
            createBannerThemeModeField(isBanner),
            createBannerOverlayStyleField(isBanner),
            createBannerOverlayDirectionField(isBanner),
            createMediaOverlayCoverageField({ condition: isBanner, required: false }),
            createBannerHeightField(),
            createBannerSectionPaddingField(),
          ],
        },
      ],
    } satisfies TabsField,
  ],
}
