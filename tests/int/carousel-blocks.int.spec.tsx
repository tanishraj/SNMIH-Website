import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

import { getBlockThumbnailDefinition } from '@/block-thumbnails/definitions'
import { getBlockThumbnailFixture } from '@/block-thumbnails/fixtures'
import {
  GalleryCoverflowBlockComponent,
  resolveGalleryCoverflowImages,
} from '@/blocks/GalleryCoverflow/Component'
import { GalleryCoverflowBlock } from '@/blocks/GalleryCoverflow/config'
import { buildCoverflowLoopImages } from '@/blocks/GalleryCoverflow/GalleryCoverflowClient'
import {
  HeroCarouselBlockComponent,
  resolveHeroCarouselSlides,
} from '@/blocks/HeroCarousel/Component'
import { HeroCarouselBlock } from '@/blocks/HeroCarousel/config'
import { renderPageBlocks } from '@/blocks/renderPageBlocks'
import { Pages } from '@/collections/Pages'

type TestField = {
  admin?: { description?: string }
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

const getTabs = (block: typeof HeroCarouselBlock | typeof GalleryCoverflowBlock) =>
  (block.fields[0] as unknown as { tabs: TestTab[] }).tabs

const getField = (fields: TestField[], name: string) => fields.find((field) => field.name === name)

const getPageBlockSlugs = () => {
  const tabs = Pages.fields.find((field) => field.type === 'tabs')
  const contentTab = tabs?.type === 'tabs' ? tabs.tabs[0] : undefined
  const layout = contentTab?.fields.find((field) => 'name' in field && field.name === 'layout')

  return layout?.type === 'blocks' ? layout.blocks.map(({ slug }) => slug) : []
}

describe('carousel block schemas', () => {
  it('keeps Hero Carousel canonical and CMS-compatible', () => {
    expect(HeroCarouselBlock).toMatchObject({
      interfaceName: 'HeroCarouselBlock',
      labels: { plural: 'Hero Carousels', singular: 'Hero Carousel' },
      slug: 'heroCarousel',
    })

    const [slidesTab, layoutTab] = getTabs(HeroCarouselBlock)
    const slides = getField(slidesTab.fields, 'slides')

    expect(slides).toMatchObject({ minRows: 1, maxRows: 8, type: 'array' })
    expect(getField(layoutTab.fields, 'themeMode')).toMatchObject({
      defaultValue: 'auto',
      options: [{ value: 'auto' }, { value: 'light' }, { value: 'dark' }, { value: 'brand' }],
    })
    expect(getField(layoutTab.fields, 'overlayStyle')?.defaultValue).toBe('dark')
    expect(getField(layoutTab.fields, 'overlayDirection')).toMatchObject({
      defaultValue: 'vertical',
      options: [
        { value: 'vertical' },
        { value: 'leftToRight' },
        { value: 'rightToLeft' },
        { value: 'bottomToTop' },
        { value: 'topToBottom' },
      ],
    })
    expect(getField(layoutTab.fields, 'overlayCoverage')).toMatchObject({
      defaultValue: 'full',
      options: [{ value: 'full' }, { value: 'split' }],
      required: false,
    })
    expect(getField(layoutTab.fields, 'height')?.defaultValue).toBe('default')
    expect(getField(layoutTab.fields, 'contentAlignment')).toMatchObject({
      defaultValue: 'left',
      options: [{ value: 'left' }, { value: 'center' }, { value: 'right' }],
      type: 'select',
    })
    expect(getField(layoutTab.fields, 'autoplay')?.defaultValue).toBe(true)
    expect(getField(layoutTab.fields, 'showPauseControl')).toMatchObject({
      admin: {
        description:
          'Shows a centered Pause / Play control on hover or focus and on touch devices. Pause freezes autoplay, background video, and slide navigation.',
      },
      defaultValue: false,
      label: 'Show Pause / Play Control',
      type: 'checkbox',
    })
    expect(getField(layoutTab.fields, 'showArrows')?.defaultValue).toBe(true)
    expect(getField(layoutTab.fields, 'showDots')?.defaultValue).toBe(true)
  })

  it('keeps Gallery Coverflow canonical and CMS-compatible', () => {
    expect(GalleryCoverflowBlock).toMatchObject({
      interfaceName: 'GalleryCoverflowBlock',
      labels: { plural: 'Gallery Coverflows', singular: 'Gallery Coverflow' },
      slug: 'galleryCoverflow',
    })

    const [contentTab, layoutTab] = getTabs(GalleryCoverflowBlock)

    expect(layoutTab.label).toBe('Theme Settings')
    expect(getField(contentTab.fields, 'images')).toMatchObject({
      minRows: 3,
      maxRows: 20,
      type: 'array',
    })
    const actionsField = getField(contentTab.fields, 'actions')
    expect(actionsField?.maxRows).toBe(1)
    const actionsTabsField = actionsField?.fields?.[0] as unknown as
      { tabs: TestTab[]; type: string } | undefined
    const actionsThemeTab = actionsTabsField?.tabs?.find(({ label }) => label === 'Theme Settings')
    expect(getField(actionsThemeTab?.fields ?? [], 'mode')).toMatchObject({
      defaultValue: 'link',
      label: 'Display As',
      required: false,
      type: 'select',
    })
    expect(getField(layoutTab.fields, 'contentAlignment')?.defaultValue).toBe('center')
    expect(getField(layoutTab.fields, 'size')?.defaultValue).toBe('default')
  })

  it('registers both blocks with unique thumbnails', () => {
    expect(getPageBlockSlugs()).toEqual(
      expect.arrayContaining(['heroCarousel', 'galleryCoverflow']),
    )
    expect(getBlockThumbnailDefinition('heroCarousel')).toMatchObject({
      filename: 'hero-carousel.jpg',
      label: 'Hero Carousel',
      slug: 'heroCarousel',
    })
    expect(getBlockThumbnailDefinition('galleryCoverflow')).toMatchObject({
      filename: 'gallery-coverflow.jpg',
      label: 'Gallery Coverflow',
      slug: 'galleryCoverflow',
      stageAlignment: 'top',
    })
  })

  it.each(['heroCarousel', 'galleryCoverflow'] as const)(
    'renders the %s thumbnail fixture',
    (slug) => {
      expect(renderToStaticMarkup(getBlockThumbnailFixture(slug)).length).toBeGreaterThan(100)
    },
  )

  it('normalizes Hero Carousel slides and drops rows without media', () => {
    expect(
      resolveHeroCarouselSlides([
        {
          backgroundImage: { alt: 'Campus', id: 'campus', url: '/campus.jpg' },
          buttons: [
            {
              label: ' Visit ',
              linkType: 'custom',
              showArrow: true,
              url: '/visit',
              variant: 'secondary',
            },
          ],
          title: ' First slide ',
        },
        { backgroundVideoUrl: '  /intro.mp4  ', title: ' Video slide ' },
        { title: 'Missing media' },
      ]),
    ).toEqual([
      expect.objectContaining({
        backgroundImageSrc: '/campus.jpg',
        buttons: [expect.objectContaining({ href: '/visit', label: 'Visit', showArrow: true })],
        title: 'First slide',
      }),
      expect.objectContaining({
        backgroundVideoUrl: '/intro.mp4',
        title: 'Video slide',
      }),
    ])
  })

  it('normalizes Gallery Coverflow media and retains stable ids', () => {
    expect(
      resolveGalleryCoverflowImages([
        {
          image: {
            alt: 'One',
            height: 1200,
            id: 'one',
            url: '/one.jpg',
            width: 900,
          },
        },
        { image: null },
      ]),
    ).toEqual([
      expect.objectContaining({
        alt: 'One',
        height: 1200,
        id: 'one',
        src: '/one.jpg',
        width: 900,
      }),
    ])
  })

  it('composes Hero Carousel from shadcn and Embla Autoplay', () => {
    const source = readFileSync('src/blocks/HeroCarousel/HeroCarouselClient.tsx', 'utf8')

    expect(source).toContain("from 'embla-carousel-autoplay'")
    expect(source).toContain("from '@/components/ui/carousel'")
    expect(source).toContain('<Carousel')
    expect(source).toContain('<CarouselContent')
    expect(source).toContain('<CarouselItem')
    expect(source).not.toContain('useEmblaCarousel')
    expect(source).not.toContain('setInterval')
  })

  it('keeps Hero Carousel controls conditional and accessible', () => {
    const source = readFileSync('src/blocks/HeroCarousel/HeroCarouselClient.tsx', 'utf8')

    expect(source).toContain('showArrows && slides.length > 1')
    expect(source).toContain('showDots && slides.length > 1')
    expect(source).toContain('aria-label="Previous slide"')
    expect(source).toContain('aria-label="Next slide"')
    expect(source).toContain("aria-current={selectedIndex === index ? 'true' : undefined}")
    expect(source).toContain('contextLabel="hero motion"')
    expect(source).toContain('useControllableMotion')
    expect(source).not.toContain('<video\n                      autoPlay')
    expect(source).not.toContain('index % 2')
  })

  it('uses circular slide indicators and the strengthened Hero Carousel title', () => {
    const source = readFileSync('src/blocks/HeroCarousel/HeroCarouselClient.tsx', 'utf8')

    expect(source).toContain("'size-2.5 rounded-full border border-current transition-colors'")
    expect(source).toContain(
      'font-serif font-semibold text-5xl leading-none tracking-tight text-balance',
    )
  })

  it.each([
    ['left', 'justify-start', 'items-start text-left', 'justify-start'],
    ['center', 'justify-center', 'items-center text-center', 'justify-center'],
    ['right', 'justify-end', 'items-end text-right', 'justify-end'],
  ] as const)(
    'renders Hero Carousel content with %s alignment and vertical centering',
    (contentAlignment, containerClass, contentClass, actionClass) => {
      const html = renderToStaticMarkup(
        <HeroCarouselBlockComponent
          contentAlignment={contentAlignment}
          slides={[
            {
              backgroundImage: { alt: 'Campus', id: 'campus', url: '/campus.jpg' },
              buttons: [{ label: 'Visit', linkType: 'custom', url: '/visit' }],
              title: 'Campus life',
            },
          ]}
        />,
      )

      expect(html).toContain(`data-hero-carousel-alignment="${contentAlignment}"`)
      expect(html).toContain('relative flex items-center overflow-hidden')
      expect(html).toContain(containerClass)
      expect(html).toContain(contentClass)
      expect(html).toContain(actionClass)
    },
  )

  it('defaults legacy Hero Carousel documents to left alignment', () => {
    const html = renderToStaticMarkup(
      <HeroCarouselBlockComponent
        slides={[
          {
            backgroundImage: { alt: 'Campus', id: 'campus', url: '/campus.jpg' },
            title: 'Campus life',
          },
        ]}
      />,
    )

    expect(html).toContain('data-hero-carousel-alignment="left"')
  })

  it('keeps the Hero Pause / Play control hidden unless editors enable it', () => {
    const source = readFileSync('src/blocks/HeroCarousel/Component.tsx', 'utf8')

    expect(source).toContain('showPauseControl?: boolean | null')
    expect(source).toContain('showPauseControl = false')
    expect(source).toContain('showPauseControl={showPauseControl ?? false}')
  })

  it('renders Hero Carousel with shared tone, strength, and directional emphasis', () => {
    const html = renderToStaticMarkup(
      <HeroCarouselBlockComponent
        overlayCoverage="split"
        overlayDirection="bottomToTop"
        overlayStyle="darker"
        slides={[
          {
            backgroundImage: { alt: 'Campus', id: 'campus', url: '/campus.jpg' },
            description: 'Learn in a connected environment.',
            eyebrow: 'Experience',
            title: 'Campus life',
          },
        ]}
        themeMode="brand"
      />,
    )

    expect(html).toContain('data-hero-carousel-theme="brand"')
    expect(html).toContain('data-hero-carousel-overlay="darker"')
    expect(html).toContain('data-hero-carousel-overlay-direction="bottomToTop"')
    expect(html).toContain('data-hero-carousel-overlay-coverage="split"')
    expect(html).toContain('inset-x-0 bottom-0 h-1/2')
    expect(html).toContain('bg-linear-to-t from-primary via-primary/82 to-transparent')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('data-section-eyebrow-surface="brand"')
  })

  it('renders arrows only for opted-in Hero Carousel buttons', () => {
    const html = renderToStaticMarkup(
      <HeroCarouselBlockComponent
        slides={[
          {
            backgroundImage: { alt: 'Campus', id: 'campus', url: '/campus.jpg' },
            buttons: [
              {
                label: 'Visit',
                linkType: 'custom',
                showArrow: true,
                url: '/visit',
                variant: 'secondary',
              },
              {
                label: 'Read',
                linkType: 'custom',
                showArrow: true,
                url: '/read',
                variant: 'link',
              },
            ],
            title: 'Campus life',
          },
        ]}
      />,
    )

    expect(html.match(/data-action-arrow="true"/g) ?? []).toHaveLength(1)
    expect(html).toContain('data-content-link="true"')
  })

  it('renders Gallery Coverflow state and action through the server adapter', () => {
    const images = ['one', 'two', 'three'].map((id) => ({
      image: {
        alt: id,
        height: 1200,
        id,
        url: `/${id}.jpg`,
        width: 900,
      },
    }))
    const html = renderToStaticMarkup(
      <GalleryCoverflowBlockComponent
        actions={[
          {
            label: 'Explore',
            linkType: 'custom',
            mode: 'button',
            url: '/gallery',
            variant: 'default',
          },
        ]}
        appearance={{ background: 'subtle', border: 'top' }}
        contentAlignment="right"
        images={images}
        size="compact"
        title="Your photos"
      />,
    )

    expect(html).toContain('data-gallery-coverflow="true"')
    expect(html).toContain('data-gallery-coverflow-alignment="right"')
    expect(html).toContain('data-gallery-coverflow-size="compact"')
    expect(html).toContain('data-gallery-coverflow-stage="true"')
    expect(html).toContain('max-w-4xl')
    expect(html).toContain('md:w-40')
    expect(html).not.toContain('sm:via-muted')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('href="/gallery"')
    expect(html).toContain('[&amp;_[data-slot=button]]:rounded-full')
  })

  it('uses scoped Swiper CSS, Next Image, and reduced motion', () => {
    const source = readFileSync('src/blocks/GalleryCoverflow/GalleryCoverflowClient.tsx', 'utf8')

    expect(source).toContain("import Image from 'next/image'")
    expect(source).toContain('useReducedMotion')
    expect(source).toContain('useSyncExternalStore')
    expect(source).toContain('isHydrated && Boolean(prefersReducedMotion)')
    expect(source).toContain('.gallery-coverflow-swiper .swiper-slide')
    expect(source).not.toContain('.swiper-3d .swiper-slide-shadow')
    expect(source).not.toContain('<img')
    expect(source).toContain('slidesPerView="auto"')
    expect(source).toContain('delay: 1500')
  })

  it('builds enough ordered coverflow slides to fill both sides', () => {
    const fiveImages = ['one', 'two', 'three', 'four', 'five'].map((id) => ({
      alt: id,
      id,
      src: `/${id}.jpg`,
    }))
    const tenImages = buildCoverflowLoopImages(fiveImages)

    expect(tenImages.map(({ id }) => id)).toEqual([
      'one',
      'two',
      'three',
      'four',
      'five',
      'one',
      'two',
      'three',
      'four',
      'five',
    ])
    expect(new Set(tenImages.map(({ renderKey }) => renderKey)).size).toBe(10)

    const nineImages = Array.from({ length: 9 }, (_, index) => ({
      alt: `Image ${index}`,
      id: index,
      src: `/image-${index}.jpg`,
    }))

    expect(buildCoverflowLoopImages(nineImages).map(({ id }) => id)).toEqual(
      nineImages.map(({ id }) => id),
    )
  })

  it('renders both blocks through the page pipeline', () => {
    const html = renderToStaticMarkup(
      renderPageBlocks([
        {
          blockType: 'heroCarousel',
          slides: [
            {
              backgroundImage: { alt: 'Hero', id: 'hero', url: '/hero.jpg' },
              title: 'Hero pipeline',
            },
          ],
        } as never,
        {
          blockType: 'galleryCoverflow',
          images: ['one', 'two', 'three'].map((id) => ({
            image: { alt: id, height: 1200, id, url: `/${id}.jpg`, width: 900 },
          })),
          title: 'Gallery pipeline',
        } as never,
      ]),
    )

    expect(html).toContain('data-hero-carousel="true"')
    expect(html).toContain('Hero pipeline')
    expect(html).toContain('data-gallery-coverflow="true"')
    expect(html).toContain('Gallery pipeline')
  })
})
