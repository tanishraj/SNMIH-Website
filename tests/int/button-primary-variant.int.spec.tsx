import { readFileSync } from 'node:fs'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Contact24Block } from '@/blocks/Contact24/config'
import { Footer56Block } from '@/blocks/Footer56/config'
import { HeaderNavbar12Block } from '@/blocks/HeaderNavbar12/config'
import { HeroBannerBlockComponent } from '@/blocks/HeroBanner/Component'
import { HeroBannerBlock } from '@/blocks/HeroBanner/config'
import { HeroCarouselBlock } from '@/blocks/HeroCarousel/config'
import { IconGridBlock } from '@/blocks/IconGrid/config'
import { ProgramMatrixBlock } from '@/blocks/ProgramMatrix/config'
import { Services21BlockComponent } from '@/blocks/Services21/Component'
import {
  buttonVariantOptions,
  buttonVariantWithLinkOptions,
  createContentActionsField,
} from '@/blocks/shared/contentActionsFields'
import { ContentActions } from '@/components/ContentActions'
import { ActionButtonContent } from '@/components/ActionButtonContent'
import { BorderButton } from '@/components/shadcnblocks/border-button'
import { Button } from '@/components/ui/button'
import { resolveCmsActions } from '@/lib/cmsLinks'

type TestField = {
  defaultValue?: unknown
  fields?: TestField[]
  label?: string
  name?: string
  options?: Array<string | { label?: string; value?: string }>
  tabs?: Array<{ fields?: TestField[] }>
}

const findFieldsByName = (value: unknown, name: string): TestField[] => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => findFieldsByName(item, name))
  }

  if (!value || typeof value !== 'object') {
    return []
  }

  const node = value as TestField & Record<string, unknown>
  const matches = node.name === name ? [node] : []

  return [...matches, ...Object.values(node).flatMap((item) => findFieldsByName(item, name))]
}

const getOptionPairs = (field: TestField) =>
  (field.options ?? []).map((option) =>
    typeof option === 'string'
      ? { label: option, value: option }
      : { label: option.label, value: option.value },
  )

describe('shared CMS button variants', () => {
  it.each([
    [
      'shared content actions',
      createContentActionsField({ includeDisplayMode: false }),
      'variant',
      'default',
    ],
    ['Hero Banner', HeroBannerBlock, 'variant', 'default'],
    ['Hero Carousel', HeroCarouselBlock, 'variant', 'secondary'],
    ['Header Navbar', HeaderNavbar12Block, 'variant', 'default'],
    ['Footer', Footer56Block, 'variant', 'outline'],
    ['Contact map action', Contact24Block, 'mapActionVariant', 'outline'],
    ['Icon Grid item action', IconGridBlock, 'actionVariant', 'default'],
    ['Program Matrix item action', ProgramMatrixBlock, 'actionVariant', 'default'],
  ] as const)(
    'exposes distinct Default and Primary values without changing the %s default',
    (_label, schema, fieldName, expectedDefault) => {
      const fields = findFieldsByName(schema, fieldName)

      expect(fields).toHaveLength(1)

      const field = fields[0]
      const pairs = getOptionPairs(field)

      expect(field.defaultValue).toBe(expectedDefault)
      expect(pairs).toEqual(
        expect.arrayContaining([
          { label: 'Default', value: 'default' },
          { label: 'Primary', value: 'primary' },
          { label: 'White Filled', value: 'white' },
          { label: 'White Outline', value: 'whiteOutline' },
        ]),
      )
      expect(pairs.find((option) => option.label === 'Default')?.value).not.toBe(
        pairs.find((option) => option.label === 'Primary')?.value,
      )
    },
  )

  it('adds fixed white variants to both shared option lists', () => {
    const expected = [
      { label: 'White Filled', value: 'white' },
      { label: 'White Outline', value: 'whiteOutline' },
    ]

    expect(buttonVariantOptions).toEqual(expect.arrayContaining(expected))
    expect(buttonVariantWithLinkOptions).toEqual(expect.arrayContaining(expected))
  })

  it('preserves Primary through action resolution and renders both variant hooks', () => {
    const actions = resolveCmsActions([
      {
        label: 'Apply now',
        linkType: 'custom',
        mode: 'button',
        url: '/apply',
        variant: 'primary',
      },
    ])

    expect(actions).toEqual([
      expect.objectContaining({
        href: '/apply',
        mode: 'button',
        variant: 'primary',
      }),
    ])

    const html = renderToStaticMarkup(createElement(ContentActions, { actions }))

    expect(html).toContain('data-action-variant="primary"')
    expect(html).toContain('data-variant="primary"')
  })

  it('preserves both white variants through action resolution', () => {
    const actions = resolveCmsActions([
      {
        label: 'White filled',
        linkType: 'custom',
        mode: 'button',
        url: '/filled',
        variant: 'white',
      },
      {
        label: 'White outline',
        linkType: 'custom',
        mode: 'button',
        url: '/outline',
        variant: 'whiteOutline',
      },
    ])

    expect(actions.map(({ variant }) => variant)).toEqual(['white', 'whiteOutline'])

    const html = renderToStaticMarkup(createElement(ContentActions, { actions }))

    expect(html).toContain('data-action-variant="white"')
    expect(html).toContain('data-variant="white"')
    expect(html).toContain('data-action-variant="whiteOutline"')
    expect(html).toContain('data-variant="whiteOutline"')
  })

  it('renders fixed white presentation and focus classes', () => {
    const filled = renderToStaticMarkup(createElement(Button, { variant: 'white' }, 'White filled'))
    const outline = renderToStaticMarkup(
      createElement(Button, { variant: 'whiteOutline' }, 'White outline'),
    )

    expect(filled).toContain(
      'border-white bg-white text-primary hover:bg-white/90 focus-visible:border-white focus-visible:ring-white/30 dark:text-primary-foreground',
    )
    expect(filled).not.toContain('text-black')
    expect(filled).toContain('hover:bg-white/90')
    expect(filled).toContain('focus-visible:border-white')
    expect(filled).toContain('focus-visible:ring-white/30')

    expect(outline).toContain('border-white bg-transparent text-white')
    expect(outline).toContain('hover:bg-white/10')
    expect(outline).toContain('focus-visible:border-white')
    expect(outline).toContain('focus-visible:ring-white/30')

    const decorated = renderToStaticMarkup(
      <BorderButton variant="whiteOutline">Decorated white outline</BorderButton>,
    )
    expect(decorated).toContain('data-variant="whiteOutline"')
    expect(decorated).toContain('border-white bg-transparent text-white')

    const withIcon = renderToStaticMarkup(
      <Button variant="white">
        <ActionButtonContent label="Continue" showArrow />
      </Button>,
    )

    expect(withIcon).toContain('data-action-arrow="true"')
    expect(withIcon).toContain('text-primary')
    expect(withIcon).toContain('dark:text-primary-foreground')
    expect(withIcon).not.toMatch(/data-action-arrow="true"[^>]*class="[^"]*text-/)
  })

  it('uses the branded white-filled foreground in decorated service actions', () => {
    const html = renderToStaticMarkup(
      <Services21BlockComponent
        actions={[
          {
            label: 'Explore services',
            linkType: 'custom',
            mode: 'button',
            showArrow: true,
            url: '/services',
            variant: 'white',
          },
        ]}
        services={[
          {
            image: { alt: 'Clinical service', url: '/media/clinical-service.jpg' },
            title: 'Clinical service',
          },
        ]}
        title="Services"
      />,
    )

    expect(html).toContain('data-variant="white"')
    expect(html).toContain('text-primary')
    expect(html).toContain('dark:text-primary-foreground')
    expect(html).not.toContain('text-black')
    expect(html).toContain('data-action-arrow="true"')
  })

  it('includes both white variants in generated Payload action unions', () => {
    const payloadTypes = readFileSync('src/payload-types.ts', 'utf8')

    expect(payloadTypes).toContain("'white'")
    expect(payloadTypes).toContain("'whiteOutline'")
  })

  it('keeps the Dark + Light + Even Hero overlay while distinguishing its actions', () => {
    const html = renderToStaticMarkup(
      createElement(HeroBannerBlockComponent, {
        backgroundImage: { alt: 'Medical laboratory', url: '/media/laboratory.jpg' } as never,
        buttons: [
          { label: 'Default action', linkType: 'custom', url: '/default', variant: 'default' },
          { label: 'Primary action', linkType: 'custom', url: '/primary', variant: 'primary' },
        ],
        overlayCoverage: 'full',
        overlayDirection: 'vertical',
        overlayStyle: 'light',
        themeMode: 'dark',
        title: 'Study medicine.',
      }),
    )

    expect(html).toContain('data-hero-banner-theme="dark"')
    expect(html).toContain('data-block-surface="darkOverlay"')
    expect(html).toContain('data-hero-banner-block="true"')
    expect(html).toContain('data-hero-banner-overlay="light"')
    expect(html).toContain('data-hero-banner-overlay-direction="vertical"')
    expect(html).toContain('data-hero-banner-overlay-coverage="full"')
    expect(html).toContain('absolute inset-0 bg-linear-to-b from-black/56 via-black/42 to-black/62')
    expect(html).toContain('data-variant="default"')
    expect(html).toContain('data-variant="primary"')
  })

  it('does not capture Primary in the overlay-specific Default CSS overrides', () => {
    const css = readFileSync('src/styles/custom.css', 'utf8')
    const selectors = [...css.matchAll(/([^{}]+)\{[^{}]*\}/g)].map((match) => match[1].trim())
    const overlayButtonSelectors = selectors.filter(
      (selector) =>
        selector.includes("[data-slot='button']") &&
        (selector.includes("[data-block-surface='darkOverlay']") ||
          selector.includes("[data-block-surface='lightOverlay']")),
    )

    expect(overlayButtonSelectors).toEqual(
      expect.arrayContaining([expect.stringContaining("[data-variant='default']")]),
    )
    expect(
      overlayButtonSelectors.some((selector) => selector.includes("[data-variant='primary']")),
    ).toBe(false)
    expect(
      overlayButtonSelectors.some(
        (selector) =>
          selector.includes("[data-variant='white']") ||
          selector.includes("[data-variant='whiteOutline']"),
      ),
    ).toBe(false)

    const heroDefaultSelectors = overlayButtonSelectors.filter((selector) =>
      selector.includes("[data-hero-banner-theme='dark']"),
    )

    expect(heroDefaultSelectors).toHaveLength(2)
    expect(
      heroDefaultSelectors.every((selector) => selector.includes("[data-variant='default']")),
    ).toBe(true)

    const compactCss = css.replace(/\s+/g, ' ')

    expect(compactCss).toContain(
      "[data-hero-banner-block='true'][data-block-surface='darkOverlay'][data-hero-banner-theme='dark'] [data-slot='button'][data-variant='default'] { background-color: var(--primary-foreground); color: var(--primary); }",
    )
    expect(compactCss).toContain(
      "[data-hero-banner-block='true'][data-block-surface='darkOverlay'][data-hero-banner-theme='dark'] [data-slot='button'][data-variant='default']:hover { background-color: color-mix(in oklch, var(--primary-foreground) 90%, var(--primary)); }",
    )
  })
})
