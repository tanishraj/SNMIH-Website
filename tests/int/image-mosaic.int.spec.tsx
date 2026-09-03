import { existsSync, readFileSync } from 'node:fs'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getPublishedEventGalleryAlbums: vi.fn(),
}))

vi.mock('@/lib/eventGallery', () => ({
  getPublishedEventGalleryAlbums: mocks.getPublishedEventGalleryAlbums,
}))
vi.mock('@/components/gallery-slideshow-viewer', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/components/gallery-slideshow-viewer')>()

  return {
    ...original,
    GallerySlideshowViewer: ({
      album,
      onClose,
    }: {
      album: { title: string }
      onClose: () => void
    }) => (
      <div data-testid="image-mosaic-viewer">
        {album.title}
        <button onClick={onClose} type="button">
          Close mosaic viewer
        </button>
      </div>
    ),
  }
})

import { ImageMosaicBlockComponent } from '@/blocks/ImageMosaic/Component'
import { ImageMosaicBlock } from '@/blocks/ImageMosaic/config'
import { ImageMosaicBlockPresentation } from '@/blocks/ImageMosaic/Presentation'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { createContentActionsField } from '@/blocks/shared/contentActionsFields'
import { normalizeOverlayDisplayMode } from '@/blocks/shared/overlayDisplayPresentation'
import { Pages } from '@/collections/Pages'
import { ImageMosaic, type ImageMosaicItem } from '@/components/image-mosaic'
import { normalizeImageMosaicContentSource } from '@/components/image-mosaic-presentation'
import type { EventGalleryAlbum } from '@/lib/eventGalleryShared'

type TestField = {
  admin?: { condition?: (data: unknown, siblingData?: Record<string, unknown>) => boolean }
  defaultValue?: unknown
  fields?: TestField[]
  hasMany?: boolean
  label?: string
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  tabs?: TestTab[]
  type?: string
  validate?: (
    value: unknown,
    context: { siblingData?: Record<string, unknown> },
  ) => boolean | string
}

type TestTab = {
  fields: TestField[]
  label: string
}

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

const imagePositions = ['center', 'top', 'bottom', 'left', 'right'] as const

const mosaicItems: ImageMosaicItem[] = Array.from({ length: 8 }, (_, index) => ({
  id: index + 1,
  image: {
    alt: `Mosaic image ${index + 1}`,
    height: 900,
    src: `/media/mosaic-${index + 1}.jpg`,
    width: 1200,
  },
  imagePosition: imagePositions[index % imagePositions.length],
  action: {
    href: `/stories/${index + 1}`,
    label: 'Explore',
    mode: 'link',
    showArrow: false,
    variant: 'default',
  },
  title: `Story ${index + 1}`,
}))

const albumFixtures: EventGalleryAlbum[] = [
  {
    cover: {
      alt: 'Campus life',
      height: 900,
      id: 'album-1-cover',
      src: '/media/album-1.jpg',
      width: 1200,
    },
    createdAt: '2026-08-01T00:00:00.000Z',
    eventDate: '2026-08-10T00:00:00.000Z',
    id: 'album-1',
    imageCount: 2,
    images: [
      {
        alt: 'Campus life',
        height: 900,
        id: 'album-1-cover',
        src: '/media/album-1.jpg',
        width: 1200,
      },
      {
        alt: 'Campus auditorium',
        height: 900,
        id: 'album-1-secondary',
        src: '/media/album-1-secondary.jpg',
        width: 1200,
      },
    ],
    title: 'Campus Life',
  },
  {
    cover: {
      alt: 'Annual day',
      height: 900,
      id: 'album-2-cover',
      src: '/media/album-2.jpg',
      width: 1200,
    },
    createdAt: '2026-08-02T00:00:00.000Z',
    eventDate: '2026-08-18T00:00:00.000Z',
    id: 'album-2',
    imageCount: 1,
    images: [
      {
        alt: 'Annual day',
        height: 900,
        id: 'album-2-cover',
        src: '/media/album-2.jpg',
        width: 1200,
      },
    ],
    title: 'Annual Day',
  },
]

beforeEach(() => {
  mocks.getPublishedEventGalleryAlbums.mockReset()
  mocks.getPublishedEventGalleryAlbums.mockResolvedValue(albumFixtures)
})
afterEach(cleanup)

describe('Image Mosaic', () => {
  it('normalizes legacy and invalid content sources to Manual Images', () => {
    expect(normalizeImageMosaicContentSource(undefined)).toBe('manualImages')
    expect(normalizeImageMosaicContentSource('galleryAlbums')).toBe('galleryAlbums')
    expect(normalizeImageMosaicContentSource('invalid')).toBe('manualImages')
  })

  it('renders selected Gallery Albums with shared metadata and configurable interaction', () => {
    const enabled = renderToStaticMarkup(
      <ImageMosaicBlockPresentation
        albums={albumFixtures}
        cardTextLayout="middleCenter"
        contentSource="galleryAlbums"
        displayOrder="manual"
        enableAlbumSlideshow
        galleryAlbums={['album-2', 'album-1']}
        showEventDate
        showImageCount
        title="Campus albums"
      />,
    )
    const disabled = renderToStaticMarkup(
      <ImageMosaicBlockPresentation
        albums={albumFixtures}
        contentSource="galleryAlbums"
        enableAlbumSlideshow={false}
        galleryAlbums={['album-1']}
        title="Static albums"
      />,
    )

    expect(enabled).toContain('data-image-mosaic-source="galleryAlbums"')
    expect(enabled).toContain('data-gallery-album-image-count="true"')
    expect(enabled).toContain('data-image-mosaic-album-interaction="slideshow"')
    expect(enabled.indexOf('Annual Day')).toBeLessThan(enabled.indexOf('Campus Life'))
    expect(disabled).toContain('data-image-mosaic-album-interaction="static"')
    expect(disabled).not.toContain('<button')
  })

  it('loads only selected published albums in album mode and skips the loader for legacy manual data', async () => {
    const albumElement = await ImageMosaicBlockComponent({
      contentSource: 'galleryAlbums',
      displayOrder: 'manual',
      galleryAlbums: ['album-2', { id: 'album-1' }],
      title: 'Selected albums',
    })
    const albumHtml = renderToStaticMarkup(albumElement)

    expect(mocks.getPublishedEventGalleryAlbums).toHaveBeenCalledOnce()
    expect(mocks.getPublishedEventGalleryAlbums).toHaveBeenCalledWith(['album-2', 'album-1'])
    expect(albumHtml.indexOf('Annual Day')).toBeLessThan(albumHtml.indexOf('Campus Life'))

    mocks.getPublishedEventGalleryAlbums.mockClear()
    const manualElement = await ImageMosaicBlockComponent({
      items: [
        {
          image: {
            alt: 'Legacy image',
            height: 900,
            id: 30,
            url: '/media/legacy.jpg',
            width: 1200,
          },
          title: 'Legacy image',
        },
      ],
      title: 'Legacy mosaic',
    })

    expect(renderToStaticMarkup(manualElement)).toContain('data-image-mosaic-source="manualImages"')
    expect(mocks.getPublishedEventGalleryAlbums).not.toHaveBeenCalled()
  })

  it('opens the selected album, restores focus, and keeps interaction independent from overlays', async () => {
    render(
      <ImageMosaicBlockPresentation
        albums={albumFixtures}
        contentSource="galleryAlbums"
        galleryAlbums={['album-1']}
        showImageOverlays={false}
        title="Campus albums"
      />,
    )

    const opener = screen.getByRole('button', {
      name: 'Open Campus Life gallery with 2 images',
    })
    expect(document.querySelector('[data-image-mosaic-card-content="true"]')).toBeNull()

    fireEvent.click(opener)
    expect(screen.getByTestId('image-mosaic-viewer').textContent).toContain('Campus Life')

    fireEvent.click(screen.getByRole('button', { name: 'Close mosaic viewer' }))
    await waitFor(() => expect(document.activeElement).toBe(opener))
  })

  it('includes the per-action display mode field by default, with an opt-out', () => {
    const defaultField = createContentActionsField()
    const imageActionField = createContentActionsField({
      label: 'Action',
      maxRows: 1,
      name: 'action',
    })
    const noModeField = createContentActionsField({
      includeDisplayMode: false,
      label: 'Action',
      maxRows: 1,
      name: 'action',
    })

    const getLayoutNames = (field: typeof defaultField) => {
      const tabsField = field.fields[0]

      if (tabsField.type !== 'tabs') {
        return []
      }

      return (
        tabsField.tabs
          .find(({ label }) => label === 'Theme Settings')
          ?.fields.flatMap((item) => ('name' in item ? [item.name] : [])) ?? []
      )
    }

    expect(getLayoutNames(defaultField)).toEqual([
      'mode',
      'variant',
      'showArrow',
      'showFileIcon',
      'fileIconPosition',
    ])
    expect(getLayoutNames(imageActionField)).toEqual([
      'mode',
      'variant',
      'showArrow',
      'showFileIcon',
      'fileIconPosition',
    ])
    expect(getLayoutNames(noModeField)).toEqual([
      'variant',
      'showArrow',
      'showFileIcon',
      'fileIconPosition',
    ])

    const tabsField = imageActionField.fields[0]

    if (tabsField.type !== 'tabs') {
      throw new Error('Expected action tabs')
    }

    const layoutFields =
      tabsField.tabs.find(({ label }) => label === 'Theme Settings')?.fields ?? []
    const modeField = layoutFields.find((field) => 'name' in field && field.name === 'mode')
    const variantField = layoutFields.find((field) => 'name' in field && field.name === 'variant')

    expect(imageActionField).toMatchObject({ maxRows: 1, name: 'action', type: 'array' })
    expect(modeField).toMatchObject({
      defaultValue: 'link',
      label: 'Display As',
      required: false,
      type: 'select',
    })
    expect(variantField).toMatchObject({
      admin: { condition: expect.any(Function) },
      type: 'select',
    })
  })

  it('defines manual and Gallery Album sources with source-aware validation', () => {
    expect(ImageMosaicBlock).toMatchObject({
      interfaceName: 'ImageMosaicBlock',
      labels: {
        plural: 'Image Mosaics',
        singular: 'Image Mosaic',
      },
      slug: 'imageMosaic',
    })

    const tabsField = ImageMosaicBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const layoutTab = tabsField.tabs.find(({ label }) => label === 'Theme Settings')
    const contentSourceField = getField(contentTab?.fields ?? [], 'contentSource')
    const itemsField = getField(contentTab?.fields ?? [], 'items')
    const galleryAlbumsField = getField(contentTab?.fields ?? [], 'galleryAlbums')
    const displayOrderField = getField(contentTab?.fields ?? [], 'displayOrder')
    const enableAlbumSlideshowField = getField(contentTab?.fields ?? [], 'enableAlbumSlideshow')

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(getField(contentTab?.fields ?? [], 'title')).toMatchObject({
      type: 'text',
    })
    expect(getField(contentTab?.fields ?? [], 'actions')?.maxRows).toBe(2)
    expect(contentSourceField).toMatchObject({
      defaultValue: 'manualImages',
      options: [{ value: 'manualImages' }, { value: 'galleryAlbums' }],
      required: true,
      type: 'select',
    })
    expect(itemsField).toMatchObject({
      maxRows: 8,
      minRows: 1,
      type: 'array',
    })
    expect(itemsField?.required).not.toBe(true)
    expect(itemsField?.admin?.condition?.({}, { contentSource: 'manualImages' })).toBe(true)
    expect(itemsField?.admin?.condition?.({}, { contentSource: undefined })).toBe(true)
    expect(itemsField?.admin?.condition?.({}, { contentSource: 'galleryAlbums' })).toBe(false)
    expect(itemsField?.validate?.([], { siblingData: { contentSource: 'manualImages' } })).toBe(
      'Add at least one image.',
    )
    expect(itemsField?.validate?.([], { siblingData: { contentSource: 'galleryAlbums' } })).toBe(
      true,
    )
    expect(galleryAlbumsField).toMatchObject({
      hasMany: true,
      maxRows: 8,
      relationTo: 'gallery-albums',
      type: 'relationship',
    })
    expect(galleryAlbumsField?.admin?.condition?.({}, { contentSource: 'galleryAlbums' })).toBe(
      true,
    )
    expect(galleryAlbumsField?.admin?.condition?.({}, { contentSource: 'manualImages' })).toBe(
      false,
    )
    expect(
      galleryAlbumsField?.validate?.([], { siblingData: { contentSource: 'galleryAlbums' } }),
    ).toBe('Select at least one Gallery Album.')
    expect(
      galleryAlbumsField?.validate?.([], { siblingData: { contentSource: 'manualImages' } }),
    ).toBe(true)
    expect(displayOrderField).toMatchObject({
      defaultValue: 'latestEventDate',
      options: [{ value: 'latestEventDate' }, { value: 'manual' }],
      required: true,
      type: 'select',
    })
    expect(displayOrderField?.admin?.condition?.({}, { contentSource: 'galleryAlbums' })).toBe(true)
    expect(enableAlbumSlideshowField).toMatchObject({
      defaultValue: true,
      type: 'checkbox',
    })
    expect(
      enableAlbumSlideshowField?.admin?.condition?.({}, { contentSource: 'galleryAlbums' }),
    ).toBe(true)
    expect(getField(itemsField?.fields ?? [], 'image')).toMatchObject({
      relationTo: 'media',
      required: true,
      type: 'upload',
    })
    expect(getField(itemsField?.fields ?? [], 'imagePosition')).toMatchObject({
      defaultValue: 'center',
      required: true,
      type: 'select',
    })
    expect(
      getField(itemsField?.fields ?? [], 'imagePosition')?.options?.map(({ value }) => value),
    ).toEqual(['center', 'top', 'bottom', 'left', 'right'])
    expect(
      itemsField?.fields?.flatMap(({ name }) => (name && name !== 'id' ? [name] : [])),
    ).toEqual(['image', 'imagePosition', 'title', 'action'])
    expect(getField(itemsField?.fields ?? [], 'action')).toMatchObject({
      maxRows: 1,
      type: 'array',
    })
    expect(getField(itemsField?.fields ?? [], 'action')?.minRows).toBeUndefined()
    expect(getField(itemsField?.fields ?? [], 'linkType')).toBeUndefined()
    expect(getField(itemsField?.fields ?? [], 'linkLabel')).toBeUndefined()
    expect(getField(layoutTab?.fields ?? [], 'appearance')?.type).toBe('group')
    const actionsField = getField(contentTab?.fields ?? [], 'actions')
    const actionsTabsField = actionsField?.fields?.[0]
    const actionsThemeTab =
      actionsTabsField?.type === 'tabs'
        ? actionsTabsField.tabs?.find(({ label }) => label === 'Theme Settings')
        : undefined
    expect(getField(actionsThemeTab?.fields ?? [], 'mode')).toMatchObject({
      defaultValue: 'link',
      label: 'Display As',
      required: false,
      type: 'select',
    })
    expect(getField(layoutTab?.fields ?? [], 'contentAlignment')?.defaultValue).toBe('center')
    expect(getField(layoutTab?.fields ?? [], 'size')?.defaultValue).toBe('default')
    expect(getField(layoutTab?.fields ?? [], 'showImageOverlays')).toMatchObject({
      defaultValue: true,
      type: 'checkbox',
    })
    const overlayDisplayField = getField(layoutTab?.fields ?? [], 'overlayDisplay')
    expect(overlayDisplayField).toMatchObject({
      defaultValue: 'hover',
      options: [{ value: 'always' }, { value: 'hover' }],
      required: true,
      type: 'select',
    })
    expect(overlayDisplayField?.admin?.condition?.({}, { showImageOverlays: true })).toBe(true)
    expect(overlayDisplayField?.admin?.condition?.({}, { showImageOverlays: false })).toBe(false)
    expect(normalizeOverlayDisplayMode(undefined, 'always')).toBe('always')
    expect(normalizeOverlayDisplayMode('invalid', 'hover')).toBe('hover')
    const cardTextLayoutField = getField(layoutTab?.fields ?? [], 'cardTextLayout')
    const showEventDateField = getField(layoutTab?.fields ?? [], 'showEventDate')
    const showImageCountField = getField(layoutTab?.fields ?? [], 'showImageCount')
    expect(cardTextLayoutField).toMatchObject({
      defaultValue: 'split',
      options: [{ value: 'split' }, { value: 'center' }, { value: 'middleCenter' }],
      required: true,
      type: 'select',
    })
    expect(cardTextLayoutField?.admin?.condition?.({}, { showImageOverlays: true })).toBe(true)
    expect(cardTextLayoutField?.admin?.condition?.({}, { showImageOverlays: false })).toBe(false)
    for (const field of [showEventDateField, showImageCountField]) {
      expect(field).toMatchObject({ defaultValue: true, type: 'checkbox' })
      expect(
        field?.admin?.condition?.({}, { contentSource: 'galleryAlbums', showImageOverlays: true }),
      ).toBe(true)
      expect(
        field?.admin?.condition?.({}, { contentSource: 'manualImages', showImageOverlays: true }),
      ).toBe(false)
    }
    const themeModeField = getField(layoutTab?.fields ?? [], 'themeMode')
    const overlayStyleField = getField(layoutTab?.fields ?? [], 'overlayStyle')
    const overlayDirectionField = getField(layoutTab?.fields ?? [], 'overlayDirection')
    const overlayCoverageField = getField(layoutTab?.fields ?? [], 'overlayCoverage')

    expect(themeModeField).toMatchObject({
      defaultValue: 'auto',
      options: [{ value: 'auto' }, { value: 'light' }, { value: 'dark' }, { value: 'brand' }],
      required: false,
      type: 'select',
    })
    expect(overlayStyleField).toMatchObject({
      defaultValue: 'dark',
      options: [{ value: 'light' }, { value: 'dark' }, { value: 'darker' }],
      required: false,
      type: 'select',
    })
    expect(overlayDirectionField).toMatchObject({
      defaultValue: 'bottomToTop',
      options: [
        { value: 'vertical' },
        { value: 'leftToRight' },
        { value: 'rightToLeft' },
        { value: 'bottomToTop' },
        { value: 'topToBottom' },
      ],
      required: false,
      type: 'select',
    })
    expect(overlayCoverageField).toMatchObject({
      defaultValue: 'full',
      options: [{ value: 'full' }, { value: 'split' }],
      required: false,
      type: 'select',
    })

    const layoutNames = (layoutTab?.fields ?? []).flatMap(({ name }) => (name ? [name] : []))
    expect(layoutNames.indexOf('overlayCoverage')).toBe(layoutNames.indexOf('overlayDirection') + 1)

    for (const field of [
      themeModeField,
      overlayStyleField,
      overlayDirectionField,
      overlayCoverageField,
    ]) {
      expect(field?.admin?.condition?.({}, { showImageOverlays: true })).toBe(true)
      expect(field?.admin?.condition?.({}, { showImageOverlays: false })).toBe(false)
    }
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8])('renders %i items without horizontal overflow', (count) => {
    const html = renderToStaticMarkup(
      <ImageMosaic items={mosaicItems.slice(0, count)} title="Campus perspectives" />,
    )

    expect(html).toContain(`data-image-mosaic-count="${count}"`)
    expect(html).toContain('grid-flow-dense')
    expect(html).toContain('grid-cols-1')
    expect(html).toContain('md:grid-cols-2')
    expect(html).toContain('overflow-hidden')
    expect(html.match(/data-image-mosaic-item=/g)).toHaveLength(count)
  })

  it('uses shared typography, spacing, appearance, sizing, and alignment', () => {
    const html = renderToStaticMarkup(
      <ImageMosaic
        actions="Explore the collection"
        alignment="right"
        appearance={{ background: 'subtle', border: 'topAndBottom' }}
        description="A closer look at the people and places in our community."
        eyebrow="Gallery"
        items={mosaicItems.slice(0, 5)}
        size="compact"
        title="Campus perspectives"
      />,
    )

    expect(html).toContain('data-image-mosaic-alignment="right"')
    expect(html).toContain('data-image-mosaic-size="compact"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-y border-border')
    expect(html).toContain('py-8 md:py-10')
    expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
    expect(html).toContain(
      'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(html).toContain('text-base leading-7 text-balance text-current')
    expect(html).toContain('ml-auto items-end text-right')
    expect(html).toContain('Explore the collection')
  })

  it('renders explicit text links only while overlays are enabled', () => {
    const enabledHtml = renderToStaticMarkup(
      <ImageMosaic items={mosaicItems.slice(0, 1)} showImageOverlays title="Gallery" />,
    )
    const disabledHtml = renderToStaticMarkup(
      <ImageMosaic items={mosaicItems.slice(0, 1)} showImageOverlays={false} title="Gallery" />,
    )

    expect(enabledHtml).toContain('data-image-mosaic-overlay="true"')
    expect(enabledHtml).toContain('group/image-mosaic')
    expect(enabledHtml).toContain('image-mosaic-image')
    expect(enabledHtml).toContain('href="/stories/1"')
    expect(enabledHtml).toContain('Story 1')
    expect(disabledHtml).toContain('data-image-mosaic-overlays="hidden"')
    expect(disabledHtml).not.toContain('group/image-mosaic')
    expect(disabledHtml).not.toContain('image-mosaic-image')
    expect(disabledHtml).not.toContain('data-image-mosaic-overlay="true"')
    expect(disabledHtml).not.toContain('href="/stories/1"')
    expect(disabledHtml).not.toContain('Story 1')
  })

  it('supports hover-reveal and always-visible overlay display modes', () => {
    const legacyHtml = renderToStaticMarkup(
      <ImageMosaic items={mosaicItems.slice(0, 1)} title="Legacy gallery" />,
    )
    const alwaysHtml = renderToStaticMarkup(
      <ImageMosaic
        items={mosaicItems.slice(0, 1)}
        overlayDisplay="always"
        title="Always-visible gallery"
      />,
    )
    const hiddenHtml = renderToStaticMarkup(
      <ImageMosaic
        items={mosaicItems.slice(0, 1)}
        showImageOverlays={false}
        title="Image-only gallery"
      />,
    )

    expect(legacyHtml).toContain('data-gallery-overlay-display="hover"')
    expect(alwaysHtml).toContain('data-gallery-overlay-display="always"')
    expect(alwaysHtml).toContain('gallery-overlay-layer')
    expect(hiddenHtml).not.toContain('gallery-overlay-layer')
  })

  it('applies section-level overlay tone, strength, direction, and surface', () => {
    const html = renderToStaticMarkup(
      <ImageMosaic
        items={mosaicItems.slice(0, 1)}
        overlayCoverage="split"
        overlayDirection="topToBottom"
        overlayStyle="darker"
        themeMode="brand"
        title="Gallery"
      />,
    )

    expect(html).toContain('data-image-mosaic-overlay-tone="brand"')
    expect(html).toContain('data-image-mosaic-overlay-strength="darker"')
    expect(html).toContain('data-image-mosaic-overlay-direction="topToBottom"')
    expect(html).toContain('data-image-mosaic-overlay-coverage="split"')
    expect(html).toContain('absolute inset-x-0 top-0 h-1/2 bg-linear-to-b')
    expect(html).toContain('from-primary via-primary/82 to-transparent')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('data-block-surface="brand"')
  })

  it('renders image actions through the shared link and button behavior', () => {
    const html = renderToStaticMarkup(
      <ImageMosaic
        items={[
          mosaicItems[0],
          {
            ...mosaicItems[1],
            action: {
              href: '/apply',
              label: 'Apply now',
              mode: 'button',
              showArrow: false,
              variant: 'outline',
            },
          },
          { ...mosaicItems[2], action: undefined },
        ]}
        title="Gallery"
      />,
    )

    expect(html).toContain('data-action-mode="link"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-variant="outline"')
    expect(html).toContain('href="/apply"')
    expect(html.match(/data-image-mosaic-item-action=/g)).toHaveLength(2)
  })

  it('uses CSS-only zoom and fade with mobile and reduced-motion support', () => {
    const serverSource = readFileSync('src/components/image-mosaic.tsx', 'utf8')
    const customCss = readFileSync('src/styles/custom.css', 'utf8')
    const obsoleteClientPath = 'src/components/ui/direction-aware-hover.tsx'
    const imageRuleStart = customCss.indexOf('.image-mosaic-image')
    const overlayRuleStart = customCss.indexOf('.gallery-overlay-layer')
    const desktopOverlayMediaStart = customCss.indexOf(
      '@media (min-width: 64rem) and (hover: hover) and (pointer: fine)',
    )
    const reducedMotionMediaStart = customCss.indexOf(
      '@media (prefers-reduced-motion: reduce)',
      desktopOverlayMediaStart,
    )
    const baseImageRules = customCss.slice(imageRuleStart, overlayRuleStart)
    const baseOverlayRules = customCss.slice(overlayRuleStart, desktopOverlayMediaStart)
    const desktopHoverRules = customCss.slice(desktopOverlayMediaStart, reducedMotionMediaStart)

    expect(serverSource).not.toContain("'use client'")
    expect(serverSource).not.toContain("from 'framer-motion'")
    expect(serverSource).not.toContain('DirectionAwareHover')
    expect(existsSync(obsoleteClientPath)).toBe(false)
    expect(imageRuleStart).toBeGreaterThan(-1)
    expect(desktopOverlayMediaStart).toBeGreaterThan(overlayRuleStart)
    expect(baseImageRules).toContain('transform: scale(1)')
    expect(baseImageRules).toContain('transition: transform 200ms ease-out')
    expect(baseOverlayRules).toContain('pointer-events: auto')
    expect(baseOverlayRules).toContain('opacity: 1')
    expect(baseOverlayRules).toContain('transition: opacity 200ms ease-out')
    expect(desktopHoverRules).toContain('pointer-events: none')
    expect(desktopHoverRules).toContain('opacity: 0')
    expect(desktopHoverRules).toContain('transform: scale(1.05)')
    expect(customCss).not.toContain('data-image-mosaic-direction')
    expect(customCss).not.toContain('translate3d')
    expect(customCss).not.toContain('@media (hover: none), (pointer: coarse)')
    expect(customCss).toContain('@media (prefers-reduced-motion: reduce)')
    expect(customCss).toContain("[data-gallery-overlay-display='hover'] .gallery-overlay-layer")
    expect(customCss).toContain(':focus-within .gallery-overlay-layer')
  })

  it('resolves Payload media, item actions, section actions, and image positions', () => {
    const html = renderToStaticMarkup(
      <ImageMosaicBlockComponent
        actions={[
          {
            label: 'View all',
            linkType: 'custom',
            mode: 'button',
            url: '/gallery',
            variant: 'outline',
          },
        ]}
        appearance={{ background: 'subtle', border: 'top' }}
        contentAlignment="left"
        items={[
          {
            image: {
              alt: 'Learning space',
              height: 900,
              id: 10,
              url: '/media/space.jpg',
              width: 1200,
            },
            action: [
              {
                label: 'Explore the space',
                linkType: 'custom',
                mode: 'button',
                url: '/spaces',
                variant: 'outline',
              },
            ],
            imagePosition: 'top',
            title: 'Learning spaces',
          },
          {
            action: [
              {
                label: 'Incomplete action',
                linkType: 'custom',
                mode: 'link',
              },
            ],
            image: {
              alt: 'Community',
              height: 900,
              id: 11,
              url: '/media/community.jpg',
              width: 1200,
            },
            title: 'Community',
          },
          {
            image: {
              alt: 'No action',
              height: 900,
              id: 12,
              url: '/media/no-action.jpg',
              width: 1200,
            },
            title: 'No action',
          },
        ]}
        size="comfortable"
        title="Inside our community"
      />,
    )

    expect(html).toContain('data-image-mosaic="true"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-variant="outline"')
    expect(html).toContain('href="/gallery"')
    expect(html).toContain('href="/spaces"')
    expect(html).not.toContain('Incomplete action</a>')
    expect(html.match(/data-image-mosaic-item-action=/g)).toHaveLength(1)
    expect(html).toContain('object-[center_top]')
    expect(html).toContain('width="1200"')
    expect(html).toContain('height="900"')
  })

  it('omits invalid images and renders nothing without a title or valid image', () => {
    const oneValid = renderToStaticMarkup(
      <ImageMosaicBlockComponent
        items={[
          { image: null, title: 'Invalid' },
          {
            image: {
              alt: 'Valid',
              height: 900,
              id: 1,
              url: '/media/valid.jpg',
              width: 1200,
            },
            title: 'Valid',
          },
        ]}
        title="Gallery"
      />,
    )

    expect(oneValid.match(/data-image-mosaic-item=/g)).toHaveLength(1)
    expect(renderToStaticMarkup(<ImageMosaicBlockComponent items={[]} title="Gallery" />)).toBe('')
    expect(
      renderToStaticMarkup(
        <ImageMosaicBlockComponent items={[{ image: { id: 1, url: '/image.jpg' } }]} title="  " />,
      ),
    ).toBe('')
  })

  it('registers and renders through the page block pipeline', () => {
    const tabsField = Pages.fields.find((field) => field.type === 'tabs')
    const contentTab = tabsField?.type === 'tabs' ? tabsField.tabs[0] : undefined
    const layoutField = contentTab?.fields.find(
      (field) => 'name' in field && field.name === 'layout',
    )
    const slugs = layoutField?.type === 'blocks' ? layoutField.blocks.map(({ slug }) => slug) : []

    expect(slugs).toContain('imageMosaic')

    const html = renderToStaticMarkup(
      renderPageBlocks([
        {
          blockType: 'imageMosaic',
          items: [
            {
              image: {
                alt: 'Pipeline image',
                height: 900,
                id: 1,
                url: '/pipeline.jpg',
                width: 1200,
              },
            },
          ],
          title: 'Pipeline mosaic',
        } as never,
      ]),
    )

    expect(html).toContain('data-image-mosaic="true"')
    expect(html).toContain('Pipeline mosaic')
  })
})
