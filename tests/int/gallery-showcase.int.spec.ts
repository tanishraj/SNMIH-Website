// @vitest-environment jsdom
import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { GalleryShowcaseBlockComponent } from '@/blocks/GalleryShowcase/Component'
import { GalleryShowcaseBlock } from '@/blocks/GalleryShowcase/config'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { Pages } from '@/collections/Pages'
import { GalleryShowcase, type GalleryShowcaseImage } from '@/components/gallery-showcase'
import {
  galleryShowcaseMobileVisibilityClasses,
  galleryShowcaseTransforms,
} from '@/components/gallery-showcase-fan'

type TestField = {
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  maxRows?: number
  minRows?: number
  name?: string
  options?: Array<{ value: string }>
  relationTo?: string
  required?: boolean
  type?: string
}

type TestTab = {
  fields: TestField[]
  label: string
}

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

const imageDefinitions = [
  ['one', 'center'],
  ['two', 'top'],
  ['three', 'bottom'],
  ['four', 'left'],
  ['five', 'right'],
] as const

const galleryImages: GalleryShowcaseImage[] = imageDefinitions.map(
  ([name, imagePosition], index) => ({
    alt: `${name} image`,
    height: 900,
    id: index + 1,
    imagePosition,
    src: `/media/${name}.jpg`,
    width: 1200,
  }),
)

describe('Gallery Showcase', () => {
  it('defines the canonical five-image schema', () => {
    expect(GalleryShowcaseBlock.slug).toBe('galleryShowcase')
    expect(GalleryShowcaseBlock.interfaceName).toBe('GalleryShowcaseBlock')
    expect(GalleryShowcaseBlock.labels).toEqual({
      plural: 'Gallery Showcases',
      singular: 'Gallery Showcase',
    })

    const tabsField = GalleryShowcaseBlock.fields[0] as unknown as {
      tabs: TestTab[]
      type: string
    }
    const contentTab = tabsField.tabs.find(({ label }) => label === 'Content')
    const layoutTab = tabsField.tabs.find(({ label }) => label === 'Theme Settings')
    const imagesField = getField(contentTab?.fields ?? [], 'images')
    const imageField = getField(imagesField?.fields ?? [], 'image')
    const imagePositionField = getField(imagesField?.fields ?? [], 'imagePosition')
    const contentAlignmentField = getField(layoutTab?.fields ?? [], 'contentAlignment')
    const sizeField = getField(layoutTab?.fields ?? [], 'size')
    const actionsField = getField(contentTab?.fields ?? [], 'actions')
    const actionsTabsField = actionsField?.fields?.[0] as unknown as
      | { tabs: TestTab[]; type: string }
      | undefined
    const actionsThemeTab = actionsTabsField?.tabs?.find(({ label }) => label === 'Theme Settings')
    const actionModeField = getField(actionsThemeTab?.fields ?? [], 'mode')

    expect(tabsField.type).toBe('tabs')
    expect(tabsField.tabs.map(({ label }) => label)).toEqual(['Content', 'Theme Settings'])
    expect(getField(contentTab?.fields ?? [], 'eyebrow')?.type).toBe('text')
    expect(getField(contentTab?.fields ?? [], 'title')).toMatchObject({
      type: 'text',
    })
    expect(getField(contentTab?.fields ?? [], 'description')?.type).toBe('textarea')
    expect(getField(contentTab?.fields ?? [], 'actions')?.maxRows).toBe(1)
    expect(imagesField).toMatchObject({ maxRows: 5, minRows: 5, type: 'array' })
    expect(imageField).toMatchObject({ relationTo: 'media', required: true, type: 'upload' })
    expect(imagePositionField).toMatchObject({
      defaultValue: 'center',
      label: 'Background Position',
      required: true,
      type: 'select',
    })
    expect(imagePositionField?.options?.map(({ value }) => value)).toEqual([
      'center',
      'top',
      'bottom',
      'left',
      'right',
    ])
    expect(getField(layoutTab?.fields ?? [], 'appearance')?.type).toBe('group')
    expect(actionModeField).toMatchObject({
      defaultValue: 'link',
      label: 'Display As',
      required: false,
      type: 'select',
    })
    expect(contentAlignmentField).toMatchObject({ defaultValue: 'center', required: true })
    expect(contentAlignmentField?.options?.map(({ value }) => value)).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(sizeField).toMatchObject({ defaultValue: 'default', required: true })
    expect(sizeField?.options?.map(({ value }) => value)).toEqual([
      'none',
      'compact',
      'default',
      'comfortable',
    ])
  })

  it('renders normalized content, theme appearance, and responsive fan sizing', () => {
    const html = renderToStaticMarkup(
      GalleryShowcase({
        actions: 'Explore the gallery',
        alignment: 'right',
        appearance: { background: 'subtle', border: 'topAndBottom' },
        description: 'Five perspectives from across the community.',
        eyebrow: 'Gallery',
        images: galleryImages,
        size: 'compact',
        title: 'See the experience',
      }),
    )

    expect(html).toContain('data-gallery-showcase="true"')
    expect(html).toContain('data-gallery-showcase-alignment="right"')
    expect(html).toContain('data-gallery-showcase-size="compact"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('border-y border-border')
    expect(html).toContain('py-8 md:py-10')
    expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4')
    expect(html).toContain('h-44 sm:h-56 lg:h-60')
    expect(html).toContain('size-16 sm:size-36 lg:size-40')
    expect(html).toContain('overflow-x-clip')
    expect(html).toContain('mx-auto w-full max-w-screen-2xl px-4 flex flex-col gap-8 sm:gap-10')
    expect(html).not.toContain('mt-5')
    expect(html).toContain(
      'text-3xl font-semibold tracking-tight text-balance text-current sm:text-4xl',
    )
    expect(html).toContain('text-base leading-7 text-balance text-current')
    expect(html).toContain('ml-auto items-end text-right')
    expect(html).toContain('Explore the gallery')
    expect(html.match(/<img[^>]*draggable="false"/g)).toHaveLength(5)
  })

  it('uses the approved immutable percentage geometry and image positions', () => {
    expect(galleryShowcaseTransforms).toEqual([
      { rotate: -19, x: '-120%', y: '0%', zIndex: 1 },
      { rotate: -19, x: '-62%', y: '2%', zIndex: 2 },
      { rotate: 0, x: '0%', y: '-19%', zIndex: 3 },
      { rotate: 12, x: '62%', y: '2%', zIndex: 2 },
      { rotate: 12, x: '120%', y: '0%', zIndex: 1 },
    ])

    const html = renderToStaticMarkup(GalleryShowcase({ images: galleryImages, title: 'Gallery' }))

    for (const position of [
      'center_center',
      'center_top',
      'center_bottom',
      'left_center',
      'right_center',
    ]) {
      expect(html).toContain(`object-[${position}]`)
    }

    expect(html.match(/rounded-card/g)?.length).toBeGreaterThanOrEqual(5)
    expect(html.match(/object-cover/g)).toHaveLength(5)
  })

  it('shows the center three cards on mobile and restores all five at sm', () => {
    expect(galleryShowcaseMobileVisibilityClasses).toEqual([
      'hidden sm:block',
      '',
      '',
      '',
      'hidden sm:block',
    ])

    const html = renderToStaticMarkup(GalleryShowcase({ images: galleryImages, title: 'Gallery' }))
    const clientSource = readFileSync('src/components/gallery-showcase-fan.tsx', 'utf8')

    expect(html.split('hidden sm:block')).toHaveLength(3)
    expect(clientSource).not.toContain('window.matchMedia')
    expect(clientSource).not.toContain('typeof window')
    expect(clientSource).not.toContain('navigator.userAgent')
  })

  it.each([
    ['compact', 'h-44 sm:h-56 lg:h-60', 'size-16 sm:size-36 lg:size-40'],
    ['default', 'h-48 sm:h-60 lg:h-68', 'size-20 sm:size-40 lg:size-44'],
    ['comfortable', 'h-52 sm:h-68 lg:h-72', 'size-24 sm:size-44 lg:size-48'],
  ] as const)('applies %s fan and card sizing', (size, fanClasses, cardClasses) => {
    const html = renderToStaticMarkup(
      GalleryShowcase({ images: galleryImages, size, title: 'Gallery' }),
    )

    expect(html).toContain(fanClasses)
    expect(html.split(cardClasses)).toHaveLength(6)
  })

  it('keeps the Framer Motion boundary client-only and reduced-motion-aware', () => {
    const serverSource = readFileSync('src/components/gallery-showcase.tsx', 'utf8')
    const clientSource = readFileSync('src/components/gallery-showcase-fan.tsx', 'utf8')

    expect(serverSource).not.toContain("from 'framer-motion'")
    expect(serverSource).not.toContain("'use client'")
    expect(clientSource.startsWith("'use client'")).toBe(true)
    expect(clientSource).toContain('useReducedMotion')
    expect(clientSource).toContain('useSyncExternalStore')
    expect(clientSource).toContain('isHydrated && Boolean(prefersReducedMotion)')
    expect(clientSource).toContain('shouldReduceMotion ? false')
    expect(clientSource).toContain('shouldReduceMotion ? undefined')
    expect(clientSource).toContain('dragSnapToOrigin')
  })

  it('resolves exactly five Payload media rows and one shared action', () => {
    const html = renderToStaticMarkup(
      GalleryShowcaseBlockComponent({
        actions: [
          {
            label: 'View gallery',
            linkType: 'custom',
            mode: 'button',
            url: '/gallery',
            variant: 'outline',
          },
        ],
        appearance: { background: 'subtle', border: 'top' },
        contentAlignment: 'left',
        description: 'A closer look at our spaces.',
        eyebrow: 'Inside the campus',
        images: galleryImages.map((image) => ({
          image: {
            alt: image.alt,
            height: image.height,
            id: image.id,
            url: image.src,
            width: image.width,
          },
          imagePosition: image.imagePosition,
        })),
        size: 'comfortable',
        title: 'Explore every angle',
      }),
    )

    expect(html).toContain('data-gallery-showcase="true"')
    expect(html).toContain('data-action-mode="button"')
    expect(html).toContain('data-action-variant="outline"')
    expect(html).toContain('href="/gallery"')
    expect(html).toContain('width="1200"')
    expect(html).toContain('height="900"')
    expect(html.match(/<img/g)).toHaveLength(5)
  })

  it('renders nothing unless the title and all five media rows resolve', () => {
    expect(
      renderToStaticMarkup(GalleryShowcaseBlockComponent({ images: [], title: 'Gallery' })),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        GalleryShowcaseBlockComponent({
          images: galleryImages.slice(0, 4).map((image) => ({
            image: { alt: image.alt, id: image.id, url: image.src },
          })),
          title: 'Gallery',
        }),
      ),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        GalleryShowcaseBlockComponent({
          images: galleryImages.map((image, index) => ({
            image: index === 4 ? null : { alt: image.alt, id: image.id, url: image.src },
          })),
          title: 'Gallery',
        }),
      ),
    ).toBe('')
    expect(
      renderToStaticMarkup(
        GalleryShowcaseBlockComponent({ images: galleryImages as never, title: '  ' }),
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

    expect(slugs).toContain('galleryShowcase')

    const html = renderToStaticMarkup(
      renderPageBlocks([
        {
          blockType: 'galleryShowcase',
          images: galleryImages.map((image) => ({
            image: { alt: image.alt, height: image.height, id: image.id, url: image.src, width: image.width },
            imagePosition: image.imagePosition,
          })),
          title: 'Gallery pipeline',
        } as never,
      ]),
    )

    expect(html).toContain('data-gallery-showcase="true"')
    expect(html).toContain('Gallery pipeline')
  })
})
