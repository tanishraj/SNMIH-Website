import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { PageContent } from '@/app/(frontend)/PageContent'
import { AnnouncementBlock } from '@/blocks/Announcement/config'
import { resolveBlockAppearanceClasses } from '@/blocks/shared/blockAppearance'
import { createBlockAppearanceFields } from '@/blocks/shared/blockAppearanceFields'
import { Pages } from '@/collections/Pages'
import { SiteSettings } from '@/globals/SiteSettings'

const getLayoutField = () => {
  const tabsField = Pages.fields.find(
    (field) => typeof field === 'object' && field !== null && 'tabs' in field,
  ) as { tabs: Array<{ label: string; fields: unknown[] }> } | undefined

  const contentTab = tabsField?.tabs.find((tab) => tab.label === 'Content')

  return contentTab?.fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === 'layout',
  ) as { blocks?: Array<{ slug: string }>; type?: string } | undefined
}

const getNamedField = <T>(fields: unknown[], fieldName: string) =>
  fields.find(
    (field) =>
      typeof field === 'object' && field !== null && 'name' in field && field.name === fieldName,
  ) as T | undefined

const expectContentActionsFieldSet = (
  contentFields: unknown[],
  layoutFields: unknown[],
  {
    actionsName = 'actions',
    modeName = 'actionMode',
  }: { actionsName?: string; modeName?: string } = {},
) => {
  const actionPresentationField = getNamedField<{
    defaultValue?: string
    name?: string
    options?: Array<{ value: string }>
    type?: string
  }>(contentFields, 'actionPresentation')
  const actionModeInContent = getNamedField<{ name?: string }>(contentFields, modeName)
  const actionModeInLayout = getNamedField<{ name?: string }>(layoutFields, modeName)
  const actionsField = getNamedField<{
    fields?: unknown[]
    maxRows?: number
    name?: string
    type?: string
  }>(contentFields, actionsName)
  const actionTabsField = actionsField?.fields?.[0] as
    | {
        tabs?: Array<{ fields: unknown[]; label: string }>
        type?: string
      }
    | undefined
  const actionContentTab = actionTabsField?.tabs?.find((tab) => tab.label === 'Content')
  const actionLayoutTab = actionTabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
  const rowModeField = getNamedField<{
    admin?: { condition?: unknown }
    defaultValue?: string
    name?: string
    options?: Array<{ value: string }>
    required?: boolean
    type?: string
  }>(actionLayoutTab?.fields ?? [], 'mode')
  const variantField = getNamedField<{
    admin?: { condition?: unknown }
    defaultValue?: string
    name?: string
    options?: Array<{ value: string }>
    type?: string
  }>(actionLayoutTab?.fields ?? [], 'variant')

  expect(actionPresentationField).toBeUndefined()
  // Display mode is per action: it lives in each action row's own Theme Settings
  // tab, so no block-level mode field survives in either tab.
  expect(actionModeInContent).toBeUndefined()
  expect(actionModeInLayout).toBeUndefined()
  expect(rowModeField?.type).toBe('select')
  expect(rowModeField?.defaultValue).toBe('link')
  expect(rowModeField?.required).toBe(false)
  expect(rowModeField?.options?.map((option) => option.value)).toEqual(['link', 'button'])
  // Variant only means anything once that row renders as a button.
  expect(variantField?.admin?.condition).toBeTypeOf('function')
  expect(actionsField?.type).toBe('array')
  expect(actionsField?.maxRows).toBe(2)
  expect(actionTabsField?.type).toBe('tabs')
  expect(actionTabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
  expect(
    actionContentTab?.fields.map((field) =>
      typeof field === 'object' && field !== null && 'name' in field ? field.name : undefined,
    ),
  ).toEqual([
    'label',
    'linkType',
    'page',
    'url',
    'openInNewTab',
    'file',
    'fileBehavior',
    'openFileInNewTab',
  ])
  expect(variantField?.type).toBe('select')
  expect(variantField?.defaultValue).toBe('default')
  expect(variantField?.options?.map((option) => option.value)).toEqual([
    'default',
    'primary',
    'secondary',
    'outline',
    'white',
    'whiteOutline',
  ])
}

describe('page block pipeline', () => {
  it('defines the shared block appearance schema defaults and options', () => {
    const appearanceField = createBlockAppearanceFields()
    const appearanceFields = ('fields' in appearanceField ? appearanceField.fields : []) as Array<{
      defaultValue?: unknown
      name?: string
      options?: Array<{ value: string }>
    }>

    const appearanceBackgroundField = appearanceFields.find((field) => field.name === 'background')
    const appearanceBorderField = appearanceFields.find((field) => field.name === 'border')

    expect(appearanceField?.type).toBe('group')
    expect(appearanceBackgroundField?.defaultValue).toBe('none')
    expect(appearanceBorderField?.defaultValue).toBe('none')
    expect(appearanceBackgroundField?.options?.map((option) => option.value)).toEqual([
      'none',
      'subtle',
      'brand',
      'gradient-subtle',
      'gradient-brand',
    ])
    expect(appearanceFields.map((field) => field.name)).not.toContain('textColor')
    expect(appearanceBorderField?.options?.map((option) => option.value)).toEqual([
      'none',
      'top',
      'bottom',
      'topAndBottom',
    ])
  })

  it('resolves shared block appearance classes from semantic appearance values', () => {
    expect(resolveBlockAppearanceClasses()).toEqual({
      background: 'none',
      backgroundClassName: '',
      textClassName: '',
      borderClassName: '',
      className: '',
      surface: 'light',
    })

    expect(
      resolveBlockAppearanceClasses({
        background: 'brand',
        border: 'topAndBottom',
      }),
    ).toEqual({
      background: 'brand',
      backgroundClassName: 'bg-brand',
      textClassName: 'text-primary-foreground',
      borderClassName: 'border-y border-border',
      className: 'bg-brand text-primary-foreground border-y border-border',
      surface: 'brand',
    })
  })

  it('registers a general layout blocks field on Pages', () => {
    const layoutField = getLayoutField() as
      | {
          blocks?: Array<{ admin?: { group?: string }; slug: string }>
          type?: string
        }
      | undefined
    const registeredSlugs = layoutField?.blocks?.map((block) => block.slug) ?? []
    const publicRenderer = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')
    const livePreviewRenderer = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')

    expect(layoutField?.type).toBe('blocks')
    expect(layoutField?.blocks?.[0]).toMatchObject({
      admin: { group: 'Start' },
      slug: 'pageHeader',
    })
    expect(layoutField?.blocks?.at(-1)?.admin?.group).toBe('Advanced Library')
    expect(registeredSlugs).toHaveLength(59)
    expect(registeredSlugs).toContain('calendar')
    expect(registeredSlugs).toContain('annualCalendar')
    expect(registeredSlugs).toContain('pgFeeStructure')
    expect(registeredSlugs).toContain('bankDetails')
    expect(registeredSlugs).toContain('academicProgrammes')
    expect(registeredSlugs).toContain('leadershipProfiles')
    expect(registeredSlugs).toContain('departmentProfiles')
    expect(registeredSlugs).not.toContain('programGrid')
    expect(registeredSlugs).toContain('studentExperience')
    expect(registeredSlugs).not.toContain('studyPathways')
    expect(new Set(registeredSlugs).size).toBe(registeredSlugs.length)
    expect(registeredSlugs).toContain('programMatrix')
    expect(registeredSlugs).toContain('feeStructure')
    expect(registeredSlugs).toContain('newsGrid')
    expect(registeredSlugs).toContain('breadcrumb')
    expect(registeredSlugs).toContain('iconCardShowcase')
    expect(registeredSlugs).toContain('testimonialSpotlight')
    expect(registeredSlugs).toContain('galleryAlbumTabs')
    expect(registeredSlugs).not.toContain('feature166')

    for (const slug of registeredSlugs) {
      expect(publicRenderer).toContain(`case '${slug}'`)
      expect(livePreviewRenderer).toContain(`case '${slug}'`)
    }
  })

  it('keeps page renderer boundaries free of explicit any casts', () => {
    const rendererSources = [
      readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8'),
      readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8'),
    ]

    for (const source of rendererSources) {
      expect(source).not.toContain('block as any')
      expect(source).not.toContain('@typescript-eslint/no-explicit-any')
    }
  })

  it('defines the eventGallery album selection, mosaic, and overlay fields', async () => {
    const { EventGalleryBlock } = await import('@/blocks/EventGallery/config')
    const tabsField = EventGalleryBlock.fields[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const galleryAlbums = getNamedField<{
      admin?: {
        allowCreate?: boolean
        isSortable?: boolean
      }
      hasMany?: boolean
      relationTo?: string
      required?: boolean
      type?: string
    }>(contentTab?.fields ?? [], 'galleryAlbums')
    const displayOrder = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      required?: boolean
      type?: string
    }>(contentTab?.fields ?? [], 'displayOrder')
    const enableAlbumSlideshow = getNamedField<{ defaultValue?: boolean; type?: string }>(
      contentTab?.fields ?? [],
      'enableAlbumSlideshow',
    )
    const contentAlignment = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'contentAlignment')
    const size = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'size')
    const cardTextLayout = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      required?: boolean
      type?: string
    }>(layoutTab?.fields ?? [], 'cardTextLayout')
    const cardsPerRow = getNamedField(layoutTab?.fields ?? [], 'cardsPerRow')
    const cardRatio = getNamedField(layoutTab?.fields ?? [], 'cardRatio')
    const showEventDate = getNamedField<{ defaultValue?: boolean; type?: string }>(
      layoutTab?.fields ?? [],
      'showEventDate',
    )
    const showCardOverlay = getNamedField<{ defaultValue?: boolean; type?: string }>(
      layoutTab?.fields ?? [],
      'showCardOverlay',
    )
    const overlayDisplay = getNamedField<{
      admin?: { condition?: (data: unknown, siblingData?: Record<string, unknown>) => boolean }
      defaultValue?: string
      options?: Array<{ label: string; value: string }>
      required?: boolean
      type?: string
    }>(layoutTab?.fields ?? [], 'overlayDisplay')
    const showImageCount = getNamedField<{ defaultValue?: boolean; type?: string }>(
      layoutTab?.fields ?? [],
      'showImageCount',
    )
    const themeMode = getNamedField<{ defaultValue?: string; type?: string }>(
      layoutTab?.fields ?? [],
      'themeMode',
    )
    const overlayStyle = getNamedField<{ defaultValue?: string; type?: string }>(
      layoutTab?.fields ?? [],
      'overlayStyle',
    )
    const overlayDirection = getNamedField<{ defaultValue?: string; type?: string }>(
      layoutTab?.fields ?? [],
      'overlayDirection',
    )
    const overlayCoverage = getNamedField<{ defaultValue?: string; type?: string }>(
      layoutTab?.fields ?? [],
      'overlayCoverage',
    )

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(
      contentTab?.fields.map((field) =>
        typeof field === 'object' && field !== null && 'name' in field ? field.name : undefined,
      ),
    ).toEqual([
      'eyebrow',
      'title',
      'description',
      'actions',
      'galleryAlbums',
      'displayOrder',
      'enableAlbumSlideshow',
      'footerActions',
    ])
    expect(galleryAlbums).toMatchObject({
      admin: {
        allowCreate: true,
        isSortable: true,
      },
      hasMany: true,
      relationTo: 'gallery-albums',
      required: true,
      type: 'relationship',
    })
    expect(displayOrder).toMatchObject({
      defaultValue: 'latestEventDate',
      required: true,
      type: 'select',
    })
    expect(displayOrder?.options?.map((option) => option.value)).toEqual([
      'latestEventDate',
      'manual',
    ])
    expect(enableAlbumSlideshow).toMatchObject({ defaultValue: true, type: 'checkbox' })
    expect(cardTextLayout).toMatchObject({
      defaultValue: 'split',
      required: true,
      type: 'select',
    })
    expect(cardTextLayout?.options?.map((option) => option.value)).toEqual([
      'split',
      'center',
      'middleCenter',
    ])
    expect(cardsPerRow).toBeUndefined()
    expect(cardRatio).toBeUndefined()
    expect(showCardOverlay).toMatchObject({ defaultValue: true, type: 'checkbox' })
    expect(overlayDisplay).toMatchObject({
      defaultValue: 'always',
      options: [
        { label: 'Always Visible', value: 'always' },
        { label: 'Reveal on Hover', value: 'hover' },
      ],
      required: true,
      type: 'select',
    })
    expect(overlayDisplay?.admin?.condition?.({}, { showCardOverlay: true })).toBe(true)
    expect(overlayDisplay?.admin?.condition?.({}, { showCardOverlay: false })).toBe(false)
    expect(showEventDate).toMatchObject({ defaultValue: true, type: 'checkbox' })
    expect(showImageCount).toMatchObject({ defaultValue: true, type: 'checkbox' })
    expect(themeMode).toMatchObject({ defaultValue: 'dark', type: 'select' })
    expect(overlayStyle).toMatchObject({ defaultValue: 'darker', type: 'select' })
    expect(overlayDirection).toMatchObject({ defaultValue: 'bottomToTop', type: 'select' })
    expect(overlayCoverage).toMatchObject({ defaultValue: 'full', type: 'select' })
    expect(contentAlignment).toMatchObject({
      defaultValue: 'center',
      type: 'select',
    })
    expect(contentAlignment?.options?.map((option) => option.value)).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(size).toMatchObject({
      defaultValue: 'default',
      type: 'select',
    })
    expect(size?.options?.map((option) => option.value)).toEqual([
      'none',
      'compact',
      'default',
      'comfortable',
    ])
  })

  it('defines the statsStrip schema with metric items, background, and animation fields', async () => {
    const { StatsStripBlock } = await import('@/blocks/StatsStrip/config')
    const tabsField = StatsStripBlock.fields[0] as
      { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string } | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')

    const itemsField = getNamedField<{
      fields?: Array<{ name?: string; type?: string }>
      minRows?: number
      type?: string
    }>(contentTab?.fields ?? [], 'items')
    const appearanceField = getNamedField<{
      fields?: Array<{ name?: string; type?: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'appearance')

    const animationEnabledField = getNamedField<{ defaultValue?: boolean; type?: string }>(
      layoutTab?.fields ?? [],
      'animationEnabled',
    )

    const animationDurationField = getNamedField<{ defaultValue?: number; type?: string }>(
      layoutTab?.fields ?? [],
      'animationDuration',
    )

    const triggerOnceField = getNamedField<{ defaultValue?: boolean; type?: string }>(
      layoutTab?.fields ?? [],
      'triggerOnce',
    )

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(itemsField?.type).toBe('array')
    expect(itemsField?.minRows).toBe(1)
    expect(itemsField?.fields?.map((field) => field.name).filter((name) => name !== 'id')).toEqual([
      'prefix',
      'value',
      'suffix',
      'label',
    ])
    expect(appearanceField?.type).toBe('group')
    expect(animationEnabledField?.type).toBe('checkbox')
    expect(animationEnabledField?.defaultValue).toBe(true)
    expect(animationDurationField?.type).toBe('number')
    expect(animationDurationField?.defaultValue).toBe(1200)
    expect(triggerOnceField?.type).toBe('checkbox')
    expect(triggerOnceField?.defaultValue).toBe(true)
  })

  it('defines the heroBanner schema with image, overlay, alignment, and CTA fields', async () => {
    const { HeroBannerBlock } = await import('@/blocks/HeroBanner/config')

    const tabsField = HeroBannerBlock.fields[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')

    const appearanceField = getNamedField<{ type?: string }>(layoutTab?.fields ?? [], 'appearance')
    const backgroundImageField = getNamedField<{
      relationTo?: string
      required?: boolean
      type?: string
    }>(contentTab?.fields ?? [], 'backgroundImage')

    const titleField = getNamedField<{ required?: boolean; type?: string }>(
      contentTab?.fields ?? [],
      'title',
    )

    const overlayStyleField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'overlayStyle')
    const overlayCoverageField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      required?: boolean
      type?: string
    }>(layoutTab?.fields ?? [], 'overlayCoverage')
    const themeModeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'themeMode')

    const horizontalAlignmentField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'horizontalAlignment')

    const verticalAlignmentField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'verticalAlignment')

    const buttonsField = getNamedField<{ fields?: unknown[]; maxRows?: number; type?: string }>(
      contentTab?.fields ?? [],
      'buttons',
    )
    const buttonTabsField = buttonsField?.fields?.[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const buttonContentTab = buttonTabsField?.tabs?.find((tab) => tab.label === 'Content')
    const buttonLayoutTab = buttonTabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const buttonLabelField = getNamedField<{ required?: boolean; type?: string }>(
      buttonContentTab?.fields ?? [],
      'label',
    )
    const buttonVariantField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(buttonLayoutTab?.fields ?? [], 'variant')

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(appearanceField?.type).toBe('group')
    expect(backgroundImageField?.type).toBe('upload')
    expect(backgroundImageField?.relationTo).toBe('media')
    expect(backgroundImageField?.required).toBe(true)
    expect(titleField?.type).toBe('text')
    expect(titleField?.required).not.toBe(true)
    expect(overlayStyleField?.type).toBe('select')
    expect(overlayStyleField?.defaultValue).toBe('dark')
    expect(overlayStyleField?.options?.map((option) => option.value)).toEqual([
      'light',
      'dark',
      'darker',
    ])
    expect(overlayCoverageField?.type).toBe('select')
    expect(overlayCoverageField?.defaultValue).toBe('full')
    expect(overlayCoverageField?.required).toBe(false)
    expect(overlayCoverageField?.options?.map((option) => option.value)).toEqual(['full', 'split'])
    expect(themeModeField?.type).toBe('select')
    expect(themeModeField?.defaultValue).toBe('auto')
    expect(themeModeField?.options?.map((option) => option.value)).toEqual([
      'auto',
      'light',
      'dark',
      'brand',
    ])
    expect(horizontalAlignmentField?.options?.map((option) => option.value)).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(verticalAlignmentField?.options?.map((option) => option.value)).toEqual([
      'top',
      'center',
      'bottom',
    ])
    const heightField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'height')

    const contentWidthField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'contentWidth')

    expect(contentWidthField?.type).toBe('select')
    expect(contentWidthField?.defaultValue).toBe('default')
    expect(contentWidthField?.options?.map((option) => option.value)).toEqual([
      'narrow',
      'default',
      'wide',
    ])
    expect(heightField?.type).toBe('select')
    expect(heightField?.defaultValue).toBe('default')
    expect(heightField?.options?.map((option) => option.value)).toEqual([
      'compact',
      'default',
      'immersive',
    ])
    expect(buttonsField?.type).toBe('array')
    expect(buttonsField?.maxRows).toBe(2)
    expect(buttonTabsField?.type).toBe('tabs')
    expect(buttonTabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(buttonLabelField?.type).toBe('text')
    expect(buttonLabelField?.required).toBe(true)
    expect(buttonVariantField?.defaultValue).toBe('default')
    expect(buttonVariantField?.options?.map((option) => option.value)).toEqual([
      'default',
      'primary',
      'secondary',
      'outline',
      'white',
      'whiteOutline',
      'link',
    ])
  })

  it('defines the heroBanner overlay direction presets', async () => {
    const { HeroBannerBlock } = await import('@/blocks/HeroBanner/config')
    const tabsField = HeroBannerBlock.fields[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const overlayDirectionField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      required?: boolean
      type?: string
    }>(layoutTab?.fields ?? [], 'overlayDirection')

    expect(overlayDirectionField?.type).toBe('select')
    expect(overlayDirectionField?.required).toBe(true)
    expect(overlayDirectionField?.defaultValue).toBe('vertical')
    expect(overlayDirectionField?.options?.map((option) => option.value)).toEqual([
      'vertical',
      'leftToRight',
      'rightToLeft',
      'bottomToTop',
      'topToBottom',
    ])
  })

  it('defines the optional heroBanner text-shadow control', async () => {
    const { HeroBannerBlock } = await import('@/blocks/HeroBanner/config')
    const tabsField = HeroBannerBlock.fields[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const enableTextShadowField = getNamedField<{
      defaultValue?: boolean
      type?: string
    }>(layoutTab?.fields ?? [], 'enableTextShadow')

    expect(enableTextShadowField?.type).toBe('checkbox')
    expect(enableTextShadowField?.defaultValue).toBe(false)
  })

  it('orders heroBanner theme and overlay controls consistently', async () => {
    const { HeroBannerBlock } = await import('@/blocks/HeroBanner/config')
    const tabsField = HeroBannerBlock.fields[0] as
      | {
          tabs?: Array<{ fields: Array<{ name?: string; type?: string }>; label: string }>
          type?: string
        }
      | undefined
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const namedFields = (layoutTab?.fields ?? [])
      .map((field) => field.name)
      .filter((name): name is string => Boolean(name))

    expect(namedFields.slice(0, 4)).toEqual([
      'themeMode',
      'overlayStyle',
      'overlayDirection',
      'overlayCoverage',
    ])
    expect(namedFields.indexOf('themeMode')).toBeLessThan(namedFields.indexOf('overlayStyle'))
    expect(namedFields.indexOf('overlayStyle')).toBeLessThan(
      namedFields.indexOf('overlayDirection'),
    )
    expect(namedFields.indexOf('overlayDirection')).toBeLessThan(
      namedFields.indexOf('overlayCoverage'),
    )
    expect(namedFields.indexOf('overlayCoverage')).toBeLessThan(
      namedFields.indexOf('enableTextShadow'),
    )
  })

  it('defines the footer56 schema with branding, link groups, utilities, and shared appearance', async () => {
    const { Footer56Block } = await import('@/blocks/Footer56/config')
    const tabsField = Footer56Block.fields[0] as
      { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string } | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')

    const logoModeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(contentTab?.fields ?? [], 'logoMode')

    const linkGroupsField = getNamedField<{ maxRows?: number; minRows?: number; type?: string }>(
      contentTab?.fields ?? [],
      'linkGroups',
    )

    const ctaButtonsField = getNamedField<{ maxRows?: number; type?: string }>(
      contentTab?.fields ?? [],
      'ctaButtons',
    )

    const logoHeightField = getNamedField<{ min?: number; type?: string }>(
      contentTab?.fields ?? [],
      'logoHeight',
    )

    const socialLinksField = (contentTab?.fields ?? []).find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'socialLinks',
    ) as { type?: string } | undefined

    const appearanceField = getNamedField<{ fields?: Array<{ name?: string }>; type?: string }>(
      layoutTab?.fields ?? [],
      'appearance',
    )

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(logoModeField?.type).toBe('select')
    expect(logoModeField?.defaultValue).toBe('siteDefault')
    expect(logoModeField?.options?.map((option) => option.value)).toEqual([
      'siteDefault',
      'customLogo',
    ])
    expect(linkGroupsField?.type).toBe('array')
    expect(linkGroupsField?.minRows).toBe(1)
    expect(linkGroupsField?.maxRows).toBe(4)
    expect(ctaButtonsField?.type).toBe('array')
    expect(ctaButtonsField?.maxRows).toBe(2)
    expect(logoHeightField?.type).toBe('number')
    expect(logoHeightField?.min).toBe(20)
    expect(socialLinksField).toBeUndefined()
    expect(appearanceField?.type).toBe('group')
    expect(appearanceField?.fields?.map((field) => field.name)).toEqual(['background', 'border'])
  })

  it('defines the site settings legal schema with privacy policy and terms relationships', () => {
    const siteSettingsTabs = SiteSettings.fields.find(
      (field) => typeof field === 'object' && field !== null && 'tabs' in field,
    ) as { tabs: Array<{ fields: unknown[]; label: string }> } | undefined

    const contactTab = siteSettingsTabs?.tabs.find((tab) => tab.label === 'Contact')
    const legalTab = siteSettingsTabs?.tabs.find((tab) => tab.label === 'Legal')

    const privacyPolicyField = legalTab?.fields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'privacyPolicyPage',
    ) as { relationTo?: string; type?: string } | undefined

    const termsField = legalTab?.fields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'termsAndConditionsPage',
    ) as { relationTo?: string; type?: string } | undefined

    const contactPrivacyField = contactTab?.fields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'privacyPolicyPage',
    )

    expect(privacyPolicyField?.type).toBe('relationship')
    expect(privacyPolicyField?.relationTo).toBe('pages')
    expect(termsField?.type).toBe('relationship')
    expect(termsField?.relationTo).toBe('pages')
    expect(contactPrivacyField).toBeUndefined()
  })

  it('defines site settings social links as validated external URLs', () => {
    const siteSettingsTabs = SiteSettings.fields.find(
      (field) => typeof field === 'object' && field !== null && 'tabs' in field,
    ) as { tabs: Array<{ fields: unknown[]; label: string }> } | undefined

    const socialLinksTab = siteSettingsTabs?.tabs.find((tab) => tab.label === 'Social Links')
    const socialLinksGroup = socialLinksTab?.fields.find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'socialLinks',
    ) as
      | {
          fields?: Array<{
            admin?: { description?: string }
            label?: string
            name?: string
            validate?: (value: unknown) => true | string
          }>
        }
      | undefined

    const facebookField = socialLinksGroup?.fields?.find((field) => field.name === 'facebook')

    expect(facebookField?.label).toBe('Facebook External URL')
    expect(facebookField?.admin?.description).toContain('full external URL')
    expect(facebookField?.validate?.('https://facebook.com/example')).toBe(true)
    expect(facebookField?.validate?.('facebook.com/example')).toBe(
      'Enter a valid external URL starting with http:// or https://.',
    )
    expect(facebookField?.validate?.('mailto:test@example.com')).toBe(
      'Enter a full external URL starting with http:// or https://.',
    )
  })

  it('renders nothing for a normal page without layout blocks', () => {
    const result = PageContent({
      page: {
        id: 'page-1',
        slug: 'home',
        title: 'Home',
      } as never,
    })

    expect(result).toBeNull()
  })

  it('defines the page announcement block schema with mode, timing, and rotating items', () => {
    const tabsField = AnnouncementBlock.fields[0] as
      { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string } | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const appearanceField = getNamedField<{ type?: string }>(layoutTab?.fields ?? [], 'appearance')
    const displayModeField = getNamedField<{
      defaultValue?: string
      label?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'displayMode')
    const labelField = getNamedField<{ label?: string; type?: string }>(
      contentTab?.fields ?? [],
      'label',
    )
    const intervalField = getNamedField<{ defaultValue?: number; type?: string }>(
      layoutTab?.fields ?? [],
      'intervalMs',
    )
    const marqueeDurationField = getNamedField<{ defaultValue?: number; type?: string }>(
      layoutTab?.fields ?? [],
      'marqueeDurationMs',
    )
    const itemsField = getNamedField<{ minRows?: number; type?: string }>(
      contentTab?.fields ?? [],
      'items',
    )

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(appearanceField?.type).toBe('group')
    expect(displayModeField?.type).toBe('select')
    expect(displayModeField?.label).toBe('Animation Mode')
    expect(displayModeField?.defaultValue).toBe('vertical')
    expect(displayModeField?.options?.map((option) => option.value)).toEqual([
      'vertical',
      'horizontal',
      'marquee',
    ])
    expect(labelField?.type).toBe('text')
    expect(labelField?.label).toBe('Announcement Label')
    expect(intervalField?.type).toBe('number')
    expect(intervalField?.defaultValue).toBe(4000)
    expect(marqueeDurationField?.type).toBe('number')
    expect(marqueeDurationField?.defaultValue).toBe(18000)
    expect(itemsField?.type).toBe('array')
    expect(itemsField?.minRows).toBe(1)
  })

  it('renders the first announcement item for a page announcement block', () => {
    const result = PageContent({
      page: {
        id: 'page-2',
        layout: [
          {
            appearance: {
              background: 'subtle',
              border: 'topAndBottom',
            },
            blockType: 'announcement',
            intervalMs: 4000,
            id: 'block-1',
            label: 'Urgent Notice',
            items: [
              {
                description: 'Scheduled tonight at 10:00 PM.',
                url: '/maintenance',
              },
              {
                description: 'The second item should not be visible in server markup.',
                title: 'Ignored in static render',
              },
            ],
          },
        ],
        slug: 'updates',
        title: 'Updates',
      } as never,
    })

    const html = renderToStaticMarkup(result)

    expect(html).toContain('lucide-megaphone')
    expect(html).toContain('Urgent Notice')
    expect(html).toContain('Scheduled tonight at 10:00 PM.')
    expect(html).toContain('href="/maintenance"')
    expect(html).toContain('data-announcement-background="subtle"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('text-foreground')
    expect(html).toContain('border-y border-border')
  })

  it('defines the Call to Action schema with title, description, and shared actions', async () => {
    const { Cta39Block } = await import('@/blocks/Cta39/config')
    const tabsField = Cta39Block.fields[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const titleField = getNamedField<{ required?: boolean; type?: string }>(
      contentTab?.fields ?? [],
      'title',
    )
    const descriptionField = getNamedField<{ type?: string }>(
      contentTab?.fields ?? [],
      'description',
    )
    const sizeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'size')
    const contentAlignmentField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'contentAlignment')

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(titleField?.type).toBe('text')
    expect(titleField?.required).toBe(true)
    expect(descriptionField?.type).toBe('textarea')
    expectContentActionsFieldSet(contentTab?.fields ?? [], layoutTab?.fields ?? [])
    expect(sizeField?.type).toBe('select')
    expect(sizeField?.defaultValue).toBe('default')
    expect(sizeField?.options?.map((option) => option.value)).toEqual([
      'none',
      'compact',
      'default',
      'comfortable',
    ])
    expect(contentAlignmentField?.type).toBe('select')
    expect(contentAlignmentField?.defaultValue).toBe('center')
    expect(contentAlignmentField?.options?.map((option) => option.value)).toEqual([
      'left',
      'center',
      'right',
    ])
  })

  it('renders a cta39 page block through PageContent', () => {
    const result = PageContent({
      page: {
        id: 'page-cta-1',
        layout: [
          {
            actionMode: 'button',
            appearance: {
              background: 'accent',
              border: 'topAndBottom',
            },
            actions: [
              { label: 'Get started', linkType: 'custom', url: '/start', variant: 'default' },
            ],
            blockType: 'cta39',
            description: 'Everything you need to launch your next website block.',
            size: 'compact',
            title: 'Ship better experiences faster.',
          },
        ],
        slug: 'cta',
        title: 'Call to Action',
      } as never,
    })

    const html = renderToStaticMarkup(result)

    expect(html).toContain('Ship better experiences faster.')
    expect(html).toContain('Everything you need to launch your next website block.')
    expect(html).toContain('href="/start"')
    expect(html).toContain('Get started')
    expect(html).toContain('data-cta39-background="subtle"')
    expect(html).not.toContain('bg-background')
  })

  it('renders a heroBanner page block through PageContent', () => {
    const result = PageContent({
      page: {
        id: 'page-hero-1',
        layout: [
          {
            appearance: {
              background: 'brand',
              border: 'top',
            },
            backgroundImage: {
              alt: 'Main hall',
              url: '/media/main-hall.jpg',
            },
            blockType: 'heroBanner',
            buttons: [
              { label: 'Apply now', linkType: 'custom', url: '/apply', variant: 'default' },
            ],
            description: 'Train for the work that follows.',
            eyebrow: 'Admissions',
            height: 'default',
            horizontalAlignment: 'left',
            overlayStyle: 'dark',
            title: 'Practice begins before the clinic.',
            verticalAlignment: 'center',
          },
        ],
        slug: 'admissions',
        title: 'Admissions',
      } as never,
    })

    const html = renderToStaticMarkup(result)

    expect(html).toContain('Practice begins before the clinic.')
    expect(html).toContain('Admissions')
    expect(html).toContain('href="/apply"')
    expect(html).toContain('data-hero-banner-background="brand"')
    expect(html).toContain('bg-brand')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('border-t border-border')
  })

  it('defines the featureSpotlight schema with image, layout, and shared actions', async () => {
    const { FeatureSpotlightBlock } = await import('@/blocks/FeatureSpotlight/config')
    const tabsField = FeatureSpotlightBlock.fields[0] as
      { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string } | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')

    const appearanceField = getNamedField<{ type?: string }>(layoutTab?.fields ?? [], 'appearance')
    const imageField = getNamedField<{ relationTo?: string; required?: boolean; type?: string }>(
      contentTab?.fields ?? [],
      'image',
    )
    const titleField = getNamedField<{ required?: boolean; type?: string }>(
      contentTab?.fields ?? [],
      'title',
    )
    const layoutModeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'layoutMode')
    const mediaPositionField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'mediaPosition')
    const imagePositionField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'imagePosition')
    const mediaFillModeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'mediaFillMode')
    const contentVerticalAlignmentField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'contentVerticalAlignment')
    const sizeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'size')
    const backgroundStyleField = (layoutTab?.fields ?? []).find(
      (field) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        field.name === 'backgroundStyle',
    ) as { type?: string } | undefined

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(appearanceField?.type).toBe('group')
    expect(imageField?.type).toBe('upload')
    expect(imageField?.relationTo).toBe('media')
    expect(imageField?.required).not.toBe(true)
    expect(titleField?.type).toBe('text')
    expect(titleField?.required).not.toBe(true)
    expect(layoutModeField?.type).toBe('select')
    expect(layoutModeField?.defaultValue).toBe('split')
    expect(layoutModeField?.options?.map((option) => option.value)).toEqual([
      'split',
      'contentOnly',
    ])
    expect(mediaPositionField?.type).toBe('select')
    expect(mediaPositionField?.defaultValue).toBe('left')
    expect(mediaPositionField?.options?.map((option) => option.value)).toEqual(['left', 'right'])
    expect(imagePositionField?.type).toBe('select')
    expect(imagePositionField?.defaultValue).toBe('center')
    expect(imagePositionField?.options?.map((option) => option.value)).toEqual([
      'center',
      'top',
      'bottom',
      'left',
      'right',
    ])
    expect(mediaFillModeField?.type).toBe('select')
    expect(mediaFillModeField?.defaultValue).toBe('contained')
    expect(mediaFillModeField?.options?.map((option) => option.value)).toEqual([
      'contained',
      'containedFill',
      'edgeToEdge',
    ])
    expect(contentVerticalAlignmentField?.type).toBe('select')
    expect(contentVerticalAlignmentField?.defaultValue).toBe('center')
    expect(contentVerticalAlignmentField?.options?.map((option) => option.value)).toEqual([
      'top',
      'center',
      'bottom',
    ])
    expect(sizeField?.type).toBe('select')
    expect(sizeField?.defaultValue).toBe('default')
    expect(sizeField?.options?.map((option) => option.value)).toEqual([
      'none',
      'compact',
      'default',
      'comfortable',
    ])
    expect(backgroundStyleField).toBeUndefined()
    expect(getNamedField(contentTab?.fields ?? [], 'ctaMode')).toBeUndefined()
    expect(getNamedField(contentTab?.fields ?? [], 'links')).toBeUndefined()
    expect(getNamedField(contentTab?.fields ?? [], 'buttons')).toBeUndefined()
    expectContentActionsFieldSet(contentTab?.fields ?? [], layoutTab?.fields ?? [])
  })

  it('defines the qaAccordion schema with rich-text items, optional side column, and shared appearance', async () => {
    const { QaAccordionBlock } = await import('@/blocks/QaAccordion/config')
    const tabsField = QaAccordionBlock.fields[0] as
      { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string } | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')

    const titleField = getNamedField<{ required?: boolean; type?: string }>(
      contentTab?.fields ?? [],
      'title',
    )
    const itemsField = getNamedField<{
      fields?: Array<{ name?: string; type?: string }>
      minRows?: number
      type?: string
    }>(contentTab?.fields ?? [], 'items')
    const sideColumnEnabledField = getNamedField<{ defaultValue?: boolean; type?: string }>(
      contentTab?.fields ?? [],
      'sideColumnEnabled',
    )
    const sideColumnField = getNamedField<{
      admin?: { condition?: unknown }
      fields?: Array<{ name?: string; type?: string }>
      type?: string
    }>(contentTab?.fields ?? [], 'sideColumn')
    const contactField = getNamedField<{
      fields?: unknown[]
      type?: string
    }>(sideColumnField?.fields ?? [], 'contact')
    const sizeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'size')
    const defaultOpenFirstField = getNamedField<{ defaultValue?: boolean; type?: string }>(
      layoutTab?.fields ?? [],
      'defaultOpenFirst',
    )
    const appearanceField = getNamedField<{ type?: string }>(layoutTab?.fields ?? [], 'appearance')
    const contentAlignmentField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'contentAlignment')
    const layoutModeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'layoutMode')
    const splitProportionField = getNamedField<{
      admin?: { condition?: unknown }
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'splitProportion')
    const accordionPlacementField = getNamedField<{
      admin?: { condition?: unknown }
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'accordionPlacement')
    const sectionVerticalAlignmentField = getNamedField<{
      admin?: { condition?: unknown }
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'sectionVerticalAlignment')
    const contactActionsField = getNamedField<{
      fields?: unknown[]
      maxRows?: number
      type?: string
    }>(contactField?.fields ?? [], 'actions')
    const contactActionTabsField = contactActionsField?.fields?.[0] as
      { tabs?: Array<{ fields: unknown[]; label: string }>; type?: string } | undefined
    const contactActionContentTab = contactActionTabsField?.tabs?.find(
      (tab) => tab.label === 'Content',
    )
    const contactActionLayoutTab = contactActionTabsField?.tabs?.find(
      (tab) => tab.label === 'Theme Settings',
    )
    const contactVariantField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(contactActionLayoutTab?.fields ?? [], 'variant')

    expect(tabsField?.type).toBe('tabs')
    expect(tabsField?.tabs?.map((tab) => tab.label)).toEqual(['Content', 'Theme Settings'])
    expect(
      contentTab?.fields.map((field) =>
        typeof field === 'object' && field !== null && 'name' in field ? field.name : undefined,
      ),
    ).toEqual([
      'title',
      'accentTitle',
      'description',
      'actions',
      'footerActions',
      'items',
      'sideColumn',
    ])
    expect(titleField?.type).toBe('text')
    expect(titleField?.required).not.toBe(true)
    expect(itemsField?.type).toBe('array')
    expect(itemsField?.minRows).toBe(1)
    expect(itemsField?.fields?.map((field) => field.name).filter((name) => name !== 'id')).toEqual([
      'question',
      'answer',
    ])
    expect(
      itemsField?.fields?.filter((field) => field.name !== 'id').map((field) => field.type),
    ).toEqual(['text', 'richText'])
    expect(sideColumnEnabledField).toBeUndefined()
    expect(sideColumnField?.type).toBe('group')
    expect(sideColumnField?.admin?.condition).toBeTypeOf('function')
    expect(sideColumnField?.fields?.map((field) => field.name)).toEqual(['profile', 'contact'])
    expect(getNamedField(contactField?.fields ?? [], 'links')).toBeUndefined()
    expectContentActionsFieldSet(contentTab?.fields ?? [], layoutTab?.fields ?? [])
    // The side column's contact actions carry their own per-row display mode, so
    // the block-level `sideActionMode` that used to govern them is gone entirely.
    const contactRowModeField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      required?: boolean
    }>(contactActionLayoutTab?.fields ?? [], 'mode')

    expect(contactRowModeField?.defaultValue).toBe('link')
    expect(contactRowModeField?.required).toBe(false)
    expect(contactRowModeField?.options?.map((option) => option.value)).toEqual(['link', 'button'])
    expect(getNamedField(contentTab?.fields ?? [], 'sideActionMode')).toBeUndefined()
    expect(getNamedField(layoutTab?.fields ?? [], 'sideActionMode')).toBeUndefined()
    expect(getNamedField(contactField?.fields ?? [], 'sideActionMode')).toBeUndefined()
    expect(contactActionsField?.type).toBe('array')
    expect(contactActionsField?.maxRows).toBe(2)
    expect(contactActionTabsField?.type).toBe('tabs')
    expect(contactActionTabsField?.tabs?.map((tab) => tab.label)).toEqual([
      'Content',
      'Theme Settings',
    ])
    expect(
      contactActionContentTab?.fields.map((field) =>
        typeof field === 'object' && field !== null && 'name' in field ? field.name : undefined,
      ),
    ).toEqual([
      'label',
      'linkType',
      'page',
      'url',
      'openInNewTab',
      'file',
      'fileBehavior',
      'openFileInNewTab',
    ])
    expect(contactVariantField?.defaultValue).toBe('default')
    expect(contactVariantField?.options?.map((option) => option.value)).toEqual([
      'default',
      'primary',
      'secondary',
      'outline',
      'white',
      'whiteOutline',
    ])
    expect(appearanceField?.type).toBe('group')
    expect(contentAlignmentField?.type).toBe('select')
    expect(contentAlignmentField?.defaultValue).toBe('center')
    expect(contentAlignmentField?.options?.map((option) => option.value)).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(layoutModeField?.type).toBe('select')
    expect(layoutModeField?.defaultValue).toBe('split')
    expect(layoutModeField?.options?.map((option) => option.value)).toEqual(['stacked', 'split'])
    expect(splitProportionField?.type).toBe('select')
    expect(splitProportionField?.defaultValue).toBe('balanced')
    expect(splitProportionField?.options?.map((option) => option.value)).toEqual([
      'balanced',
      'sectionFocus',
      'qaFocus',
    ])
    expect(splitProportionField?.admin?.condition).toBeTypeOf('function')
    expect(accordionPlacementField?.type).toBe('select')
    expect(accordionPlacementField?.defaultValue).toBe('right')
    expect(accordionPlacementField?.options?.map((option) => option.value)).toEqual([
      'left',
      'right',
    ])
    expect(accordionPlacementField?.admin?.condition).toBeTypeOf('function')
    expect(sectionVerticalAlignmentField?.type).toBe('select')
    expect(sectionVerticalAlignmentField?.defaultValue).toBe('top')
    expect(sectionVerticalAlignmentField?.options?.map((option) => option.value)).toEqual([
      'top',
      'center',
      'bottom',
    ])
    expect(sectionVerticalAlignmentField?.admin?.condition).toBeTypeOf('function')
    expect(sizeField?.type).toBe('select')
    expect(sizeField?.defaultValue).toBe('default')
    expect(sizeField?.options?.map((option) => option.value)).toEqual([
      'none',
      'compact',
      'default',
      'comfortable',
    ])
    expect(defaultOpenFirstField?.type).toBe('checkbox')
    expect(defaultOpenFirstField?.defaultValue).toBe(true)
  })

  it('defines Review Submission alignment and shared content actions', async () => {
    const { ReviewSubmissionBlock } = await import('@/blocks/ReviewSubmission/config')

    const tabsField = ReviewSubmissionBlock.fields[0] as
      | {
          tabs?: Array<{ fields: unknown[]; label: string }>
          type?: string
        }
      | undefined
    const contentTab = tabsField?.tabs?.find((tab) => tab.label === 'Content')
    const layoutTab = tabsField?.tabs?.find((tab) => tab.label === 'Theme Settings')
    const contentAlignmentField = getNamedField<{
      defaultValue?: string
      options?: Array<{ value: string }>
      type?: string
    }>(layoutTab?.fields ?? [], 'contentAlignment')

    expect(contentAlignmentField?.type).toBe('select')
    expect(contentAlignmentField?.defaultValue).toBe('center')
    expect(contentAlignmentField?.options?.map((option) => option.value)).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(getNamedField(contentTab?.fields ?? [], 'links')).toBeUndefined()
    expectContentActionsFieldSet(contentTab?.fields ?? [], layoutTab?.fields ?? [])
  })

  it('renders a featureSpotlight page block through PageContent', () => {
    const result = PageContent({
      page: {
        id: 'page-spotlight-1',
        layout: [
          {
            appearance: {
              background: 'muted',
              border: 'bottom',
            },
            actionMode: 'link',
            actions: [{ label: 'See all programs', linkType: 'custom', url: '/programs' }],
            blockType: 'featureSpotlight',
            description: 'Choose from MD, MD-PhD, and specialized tracks.',
            eyebrow: 'Programs',
            image: {
              alt: 'Students in clinic',
              url: '/media/programs.jpg',
            },
            layoutMode: 'split',
            imagePosition: 'right',
            mediaPosition: 'right',
            title: 'Four years. Six pathways. One physician.',
          },
        ],
        slug: 'programs',
        title: 'Programs',
      } as never,
    })

    const html = renderToStaticMarkup(result)

    expect(html).toContain('data-page-block-stack="true"')
    expect(html).toContain('flex flex-col')
    expect(html).toContain('data-feature-spotlight-position="right"')
    expect(html).toContain('data-feature-spotlight-image-position="right"')
    expect(html).toContain('data-feature-spotlight-layout="split"')
    expect(html).toContain('data-feature-spotlight-background="muted"')
    expect(html).toContain('href="/programs"')
    expect(html).toContain('See all programs')
    expect(html).toContain('border-b border-border')
  })

  it('renders a statsStrip page block through PageContent', () => {
    const result = PageContent({
      page: {
        id: 'page-stats-1',
        layout: [
          {
            animationDuration: 1200,
            animationEnabled: true,
            appearance: {
              background: 'subtle',
              border: 'top',
            },
            blockType: 'statsStrip',
            id: 'stats-block-1',
            items: [
              { label: 'Years of training physicians', value: 112 },
              { label: 'Student-to-faculty ratio', suffix: ':1', value: 9 },
              { label: 'Annual research funding', prefix: '$', suffix: 'M', value: 186 },
              { label: 'Residency match rate', suffix: '%', value: 96 },
              { label: 'Clinical sites', value: 14 },
            ],
            triggerOnce: true,
          },
        ],
        slug: 'stats',
        title: 'Stats',
      } as never,
    })

    const html = renderToStaticMarkup(result)

    expect(html).toContain('data-stats-strip-background="subtle"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('text-foreground')
    expect(html).toContain('border-t border-border')
    expect(html).toContain('data-stats-strip-row="0"')
    expect(html).toContain('data-stats-strip-row="1"')
    expect(html).toContain('data-stats-strip-row-size="4"')
    expect(html).toContain('data-stats-strip-row-size="1"')
    expect(html).toContain('Years of training physicians')
    expect(html).toContain('Student-to-faculty ratio')
    expect(html).toContain('$0M')
    expect(html).toContain('0%')
  })

  it('renders a contact33 page block through PageContent', () => {
    const result = PageContent({
      page: {
        id: 'page-contact-1',
        layout: [
          {
            appearance: {
              background: 'muted',
              border: 'topAndBottom',
            },
            blockType: 'contact33',
            contentAlignment: 'left',
            description: 'Our advisors are ready to help.',
            eyebrow: 'Contact',
            form: {
              fields: [
                {
                  label: 'Name',
                  name: 'name',
                  required: true,
                  type: 'text',
                },
                {
                  label: 'Email',
                  name: 'email',
                  required: true,
                  type: 'email',
                },
                {
                  label: 'Subject',
                  name: 'subject',
                  options: [{ label: 'General', value: 'general' }],
                  required: false,
                  type: 'select',
                },
                {
                  label: 'Message',
                  name: 'message',
                  required: true,
                  type: 'textarea',
                },
              ],
              slug: 'contact',
              submitButtonLabel: 'Send',
              successMessage: 'Thanks.',
              title: 'Contact',
            },
            image: {
              alt: 'Advisor',
              height: 900,
              url: '/contact.jpg',
              width: 1200,
            },
            imageAlt: 'An advisor speaking with a visitor',
            imagePosition: 'right',
            size: 'default',
            title: 'Start a conversation',
          },
        ],
        slug: 'contact',
        title: 'Contact',
      } as never,
    })
    const html = renderToStaticMarkup(result)

    expect(html).toContain('data-page-block-stack="true"')
    expect(html).toContain('data-contact33-image-position="right"')
    expect(html).toContain('data-contact33-background="muted"')
    expect(html).toContain('Start a conversation')
    expect(html).toContain('border-y border-border')
  })

  it('registers contact33 in live preview rendering', () => {
    const source = readFileSync('src/blocks/renderLivePreviewPageBlocks.tsx', 'utf8')

    expect(source).toContain("import { Contact33BlockComponent } from './Contact33/Component'")
    expect(source).toContain("case 'contact33':")
    expect(source).toContain(
      "import { Contact24PreviewBlockComponent } from './Contact24/PreviewComponent'",
    )
    expect(source).toContain("case 'contact24':")
  })

  it('registers contact24 in public page rendering', () => {
    const source = readFileSync('src/blocks/renderPageBlocks.tsx', 'utf8')

    expect(source).toContain("import { Contact24BlockComponent } from './Contact24/Component'")
    expect(source).toContain("case 'contact24':")
  })
})
