import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { IconCardShowcaseBlockComponent } from '@/blocks/IconCardShowcase/Component'
import { IconCardShowcaseBlock } from '@/blocks/IconCardShowcase/config'

import { getGeneratedPayloadInterface } from './helpers/generatedPayloadInterface'

const findField = (fields: unknown[], name: string): Record<string, unknown> | undefined => {
  for (const field of fields) {
    if (!field || typeof field !== 'object') continue
    if ('name' in field && field.name === name) return field as Record<string, unknown>

    if ('fields' in field && Array.isArray(field.fields)) {
      const nested = findField(field.fields, name)
      if (nested) return nested
    }

    if ('tabs' in field && Array.isArray(field.tabs)) {
      for (const tab of field.tabs) {
        if (tab && typeof tab === 'object' && 'fields' in tab && Array.isArray(tab.fields)) {
          const nested = findField(tab.fields, name)
          if (nested) return nested
        }
      }
    }
  }

  return undefined
}

const optionValues = (field: Record<string, unknown> | undefined) =>
  ((field?.options ?? []) as Array<{ value: string }>).map(({ value }) => value)

const cards = [
  { icon: 'Handshake', title: 'Integrity' },
  { icon: 'Scale', title: 'Compassion' },
  { icon: 'Gem', title: 'Excellence' },
]
const blocksGuideSource = readFileSync('docs/guides/blocks.md', 'utf8')

describe('Icon Card Showcase', () => {
  it('defines the complete Payload schema and defaults', () => {
    expect(IconCardShowcaseBlock).toMatchObject({
      interfaceName: 'IconCardShowcaseBlock',
      slug: 'iconCardShowcase',
    })

    expect(findField(IconCardShowcaseBlock.fields, 'backgroundImage')).toMatchObject({
      relationTo: 'media',
      required: false,
      type: 'upload',
    })
    expect(findField(IconCardShowcaseBlock.fields, 'cards')).toMatchObject({
      maxRows: 12,
      minRows: 1,
      required: true,
      type: 'array',
    })
    expect(findField(IconCardShowcaseBlock.fields, 'icon')).toMatchObject({
      name: 'icon',
      type: 'text',
    })
    expect(findField(IconCardShowcaseBlock.fields, 'icon')).not.toHaveProperty('required', true)
    const cardsSchema = findField(IconCardShowcaseBlock.fields, 'cards')
    expect(findField((cardsSchema?.fields ?? []) as unknown[], 'eyebrow')).toMatchObject({
      type: 'text',
    })
    expect(findField(IconCardShowcaseBlock.fields, 'actionLabel')).toMatchObject({ type: 'text' })
    expect(findField(IconCardShowcaseBlock.fields, 'actionMode')).toMatchObject({
      defaultValue: 'link',
      required: false,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'actionMode'))).toEqual([
      'link',
      'button',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'actionVariant')?.admin).toMatchObject({
      condition: expect.any(Function),
    })
    expect(findField(IconCardShowcaseBlock.fields, 'showArrow')?.admin).toMatchObject({
      condition: expect.any(Function),
    })
    expect(findField(IconCardShowcaseBlock.fields, 'headerLayout')).toMatchObject({
      defaultValue: 'stacked',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'headerLayout'))).toEqual([
      'stacked',
      'split',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'splitContentAlignment')).toMatchObject({
      defaultValue: 'top',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'splitContentAlignment'))).toEqual([
      'top',
      'center',
      'bottom',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'splitContentAlignment')?.admin).toMatchObject({
      condition: expect.any(Function),
    })
    expect(findField(IconCardShowcaseBlock.fields, 'contentAlignment')).toMatchObject({
      defaultValue: 'center',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'contentAlignment'))).toEqual([
      'left',
      'center',
      'right',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'cardContentAlignment')).toMatchObject({
      defaultValue: 'center',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'cardContentAlignment'))).toEqual([
      'left',
      'center',
      'right',
    ])
    const cardWidthField = findField(IconCardShowcaseBlock.fields, 'cardWidth')
    expect(cardWidthField).toMatchObject({
      defaultValue: 'standard',
      label: 'Cards per Row',
      name: 'cardWidth',
      required: true,
      type: 'select',
    })
    expect(cardWidthField?.options).toEqual([
      { label: '2 Cards', value: 'wide' },
      { label: '3 Cards', value: 'standard' },
      { label: '4 Cards', value: 'compact' },
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'cardHeight')).toMatchObject({
      defaultValue: 'standard',
      required: true,
    })
    expect(findField(IconCardShowcaseBlock.fields, 'iconSize')).toMatchObject({
      defaultValue: 'standard',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'iconSize'))).toEqual([
      'small',
      'standard',
      'large',
      'extraLarge',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'defaultCardBackground')).toMatchObject({
      defaultValue: 'brand',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'defaultCardBackground'))).toEqual([
      'default',
      'subtle',
      'brand',
      'gradient-subtle',
      'gradient-brand',
    ])
    expect(findField(IconCardShowcaseBlock.fields, 'cardBackground')).toMatchObject({
      defaultValue: 'inherit',
      required: true,
    })
    expect(optionValues(findField(IconCardShowcaseBlock.fields, 'cardBackground'))).toEqual([
      'inherit',
      'default',
      'subtle',
      'brand',
      'gradient-subtle',
      'gradient-brand',
    ])
    for (const name of ['defaultCardBackground', 'cardBackground']) {
      expect(findField(IconCardShowcaseBlock.fields, name)?.hooks).toMatchObject({
        afterRead: [expect.any(Function)],
      })
    }
    expect(findField(IconCardShowcaseBlock.fields, 'size')).toMatchObject({
      defaultValue: 'default',
      required: true,
    })

    for (const name of ['themeMode', 'overlayStyle', 'overlayDirection', 'overlayCoverage']) {
      expect(findField(IconCardShowcaseBlock.fields, name)?.admin).toMatchObject({
        condition: expect.any(Function),
      })
    }
  })

  it('renders the reference defaults on the Appearance fallback', () => {
    const html = renderToStaticMarkup(<IconCardShowcaseBlockComponent cards={cards} />)

    expect(html).toContain('data-icon-card-showcase="true"')
    expect(html).toContain('data-icon-card-showcase-width="standard"')
    expect(html).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')
    expect(html.match(/data-icon-card-showcase-card="true"/g)).toHaveLength(3)
    expect(html.match(/min-h-72/g)).toHaveLength(3)
    expect(html.match(/size-12/g)).toHaveLength(3)
    expect(html.match(/bg-brand text-primary-foreground/g)).toHaveLength(3)
    expect(html).not.toContain('data-icon-card-showcase-image')
  })

  it('uses the shared section heading font, intro spacing, and size rhythm', () => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        accentTitle="in action"
        cards={[cards[0]]}
        eyebrow="Our values"
        size="compact"
        title="Principles"
      />,
    )

    expect(html).toContain('flex max-w-3xl flex-col gap-4')
    expect(html).toContain('font-[family-name:var(--font-display)]')
    expect(html).toContain('<span class="block font-[family-name:inherit]">Principles</span>')
    expect(html).toContain('<em class="block font-[family-name:inherit]">in action</em>')
    expect(html).toContain('relative z-10 flex flex-col gap-8')
  })

  it.each([
    ['left', 'items-start text-left'],
    ['center', 'mx-auto items-center text-center'],
    ['right', 'ml-auto items-end text-right'],
  ] as const)('positions the entire Stacked header at the %s', (contentAlignment, classes) => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[cards[0]]}
        contentAlignment={contentAlignment}
        title="What drives us every day"
      />,
    )

    expect(html).toContain('data-icon-card-showcase-header="stacked"')
    expect(html).toContain(`flex max-w-3xl flex-col gap-4 ${classes}`)
  })

  it('matches Icon Grid description width in Stacked mode without changing Split mode', () => {
    const stacked = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[cards[0]]}
        description="A long supporting description."
        headerLayout="stacked"
        title="What drives us every day"
      />,
    )
    const split = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[cards[0]]}
        description="A long supporting description."
        headerLayout="split"
        title="What drives us every day"
      />,
    )

    expect(stacked).toContain('flex max-w-3xl flex-col gap-4')
    expect(stacked).not.toContain('max-w-[65ch]')
    expect(split).toContain('max-w-[65ch]')
  })

  it.each([
    ['top', 'lg:self-start'],
    ['center', 'lg:self-center'],
    ['bottom', 'lg:self-end'],
  ] as const)('aligns Split header supporting content to the %s', (alignment, classes) => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[cards[0]]}
        description="What guides us."
        headerLayout="split"
        splitContentAlignment={alignment}
        title="Our values"
      />,
    )

    expect(html).toContain(`data-icon-card-showcase-split-alignment="${alignment}"`)
    expect(html).toContain(classes)
  })

  it.each([
    ['compact', 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4'],
    ['standard', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'],
    ['wide', 'grid-cols-1 md:grid-cols-2'],
  ] as const)('renders %s card width', (cardWidth, classes) => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent cardWidth={cardWidth} cards={cards} />,
    )
    expect(html).toContain(classes)
  })

  it.each([
    ['compact', 'min-h-52'],
    ['standard', 'min-h-72'],
    ['tall', 'min-h-[22rem]'],
  ] as const)('renders %s card height', (cardHeight, classes) => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent cardHeight={cardHeight} cards={[cards[0]]} />,
    )
    expect(html).toContain(classes)
  })

  it.each([
    ['small', 'size-8'],
    ['standard', 'size-12'],
    ['large', 'size-16'],
    ['extraLarge', 'size-20'],
  ] as const)('renders %s icons', (iconSize, classes) => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent cards={[cards[0]]} iconSize={iconSize} />,
    )
    expect(html).toContain(classes)
  })

  it('renders a decorative image, overlay, Split header, overrides, and whole-card links', () => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        appearance={{ background: 'subtle', border: 'topAndBottom' }}
        backgroundImage={{
          alt: 'Campus',
          height: 900,
          id: 'media-1',
          url: '/campus.jpg',
          width: 1600,
        }}
        cards={[
          {
            cardBackground: 'secondary',
            icon: 'Handshake',
            linkType: 'custom',
            openInNewTab: true,
            title: 'Integrity',
            url: '/values/integrity',
          },
        ]}
        description="The principles behind our work."
        headerLayout="split"
        title="Our values"
      />,
    )

    expect(html).toContain('data-icon-card-showcase-image="true"')
    expect(html).toContain('alt=""')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain('data-icon-card-showcase-header="split"')
    expect(html).toContain('lg:grid-cols-[minmax(0,3fr)_minmax(18rem,2fr)]')
    expect(html).toContain('bg-subtle text-foreground')
    expect(html).toContain('href="/values/integrity"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
  })

  it('normalizes stale controls, invalid links, blank cards, and stale icons', () => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cardHeight={'legacy' as never}
        cardWidth={'legacy' as never}
        cards={[
          { icon: 'UnknownIcon', title: 'Fallback icon' },
          { icon: 'Gem', title: '   ' },
          { icon: 'Gem', linkType: 'custom', title: 'No broken link', url: '   ' },
        ]}
        defaultCardBackground={'legacy' as never}
        iconSize={'legacy' as never}
      />,
    )

    expect(html.match(/data-icon-card-showcase-card="true"/g)).toHaveLength(2)
    expect(html).toContain('data-icon-card-showcase-width="standard"')
    expect(html).toContain('data-icon-card-showcase-height="standard"')
    expect(html).toContain('data-icon-card-showcase-icon-size="standard"')
    expect(html).toContain('data-icon-card-showcase-icon="Sparkles"')
    expect(html).not.toContain('href=""')
  })

  it('uses shared backgrounds and normalizes retired values', () => {
    const brand = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent cards={[{ title: 'Brand' }]} />,
    )
    const subtle = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[{ cardBackground: 'secondary' as never, title: 'Legacy subtle' }]}
      />,
    )
    const gradient = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[{ cardBackground: 'gradient-brand', title: 'Gradient' }]}
      />,
    )

    expect(brand).toContain('bg-brand text-primary-foreground')
    expect(subtle).toContain('bg-subtle text-foreground')
    expect(gradient).toContain('bg-gradient-brand text-primary-foreground')
  })

  it('omits missing icons and falls back for invalid supplied icons', () => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[{ title: 'No icon' }, { icon: 'UnknownIcon', title: 'Fallback' }]}
      />,
    )

    expect(html.match(/data-icon-card-showcase-icon=/g)).toHaveLength(1)
    expect(html).toContain('data-icon-card-showcase-icon="Sparkles"')
  })

  it.each([
    ['left', 'items-start text-left'],
    ['center', 'items-center text-center'],
    ['right', 'items-end text-right'],
  ] as const)('aligns card content %s', (cardContentAlignment, classes) => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cardContentAlignment={cardContentAlignment}
        cards={[{ eyebrow: 'Principle', title: 'Integrity' }]}
      />,
    )

    expect(html).toContain(`data-icon-card-showcase-card-alignment="${cardContentAlignment}"`)
    expect(html).toContain(classes)
    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain('data-section-eyebrow-surface="brand"')
  })

  it('renders an explicit shared link without making the card an anchor', () => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[
          {
            actionLabel: 'Read more',
            actionMode: 'link',
            linkType: 'custom',
            openInNewTab: true,
            title: 'Integrity',
            url: '/integrity',
          },
        ]}
      />,
    )

    expect(html).toContain('<article')
    expect(html).toContain('data-icon-card-showcase-action="link"')
    expect(html).toContain('data-content-link="true"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
    expect(html).not.toMatch(/<a(?:\s|>)[^>]*data-icon-card-showcase-card="true"/)
  })

  it('renders a shared button action with variant and arrow', () => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[
          {
            actionLabel: 'Explore',
            actionMode: 'button',
            actionVariant: 'whiteOutline',
            linkType: 'custom',
            showArrow: true,
            title: 'Excellence',
            url: '/excellence',
          },
        ]}
      />,
    )

    expect(html).toContain('data-icon-card-showcase-action="button"')
    expect(html).toContain('data-variant="whiteOutline"')
    expect(html).toContain('data-action-arrow="true"')
  })

  it('keeps legacy whole-card links and omits incomplete actions', () => {
    const html = renderToStaticMarkup(
      <IconCardShowcaseBlockComponent
        cards={[
          { linkType: 'custom', title: 'Legacy', url: '/legacy' },
          { actionLabel: 'Missing destination', title: 'Static' },
        ]}
      />,
    )

    expect(html).toMatch(/<a[^>]*data-icon-card-showcase-card="true"[^>]*href="\/legacy"/)
    expect(html.match(/data-icon-card-showcase-action=/g)).toBeNull()
  })

  it('renders nothing without usable cards', () => {
    expect(IconCardShowcaseBlockComponent({ cards: [{ icon: 'Gem', title: '   ' }] })).toBeNull()
  })

  it('documents the explicit cards-per-row control', () => {
    expect(blocksGuideSource).toMatch(/\| Icon Card Showcase\s+\|/)
    expect(blocksGuideSource).toContain('Cards per Row supports 2–4 desktop columns')
    expect(blocksGuideSource).toContain('collapse responsively')
  })

  it('uses the generated Payload contract', () => {
    const source = readFileSync('src/payload-types.ts', 'utf8')
    const contract = getGeneratedPayloadInterface(source, 'IconCardShowcaseBlock')

    expect(contract).toContain("cardWidth: 'wide' | 'standard' | 'compact'")
    expect(contract).toContain("cardHeight: 'compact' | 'standard' | 'tall'")
    expect(contract).toContain("iconSize: 'small' | 'standard' | 'large' | 'extraLarge'")
    expect(contract).toContain("cardContentAlignment: 'left' | 'center' | 'right'")
    expect(contract).toContain("splitContentAlignment?: ('top' | 'center' | 'bottom') | null")
    expect(contract).toContain(
      "defaultCardBackground: 'default' | 'subtle' | 'brand' | 'gradient-subtle' | 'gradient-brand'",
    )
    expect(contract).toContain('icon?: string | null')
    expect(contract).toContain('eyebrow?: string | null')
    expect(contract).toContain('actionLabel?: string | null')
    expect(contract).toContain("actionMode?: ('link' | 'button') | null")
  })
})
