import type { ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { BannerCtaBlock } from '@/blocks/BannerCta/config'
import { PageHeaderBlockComponent } from '@/blocks/PageHeader/Component'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'
import { resolveBannerActionPlacement } from '@/blocks/shared/bannerCtaPresentation'

type PageHeaderProps = ComponentProps<typeof PageHeaderBlockComponent>

const getTabs = () => {
  const tabs = PageHeaderBlock.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') {
    throw new Error('Expected Page Header tabs')
  }

  return tabs.tabs
}

const getFieldsByTab = (block: Block) => {
  const tabs = block.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') {
    throw new Error(`Expected ${block.slug} tabs`)
  }

  return tabs.tabs.map((tab) => tab.fields)
}

const namedField = (fields: Field[], name: string) =>
  fields.find((field) => 'name' in field && field.name === name)

const actions = [
  {
    label: 'Explore Admissions',
    linkType: 'custom' as const,
    mode: 'button' as const,
    showArrow: true,
    url: '/admissions',
    variant: 'default' as const,
  },
  {
    label: 'Download Brochure',
    linkType: 'custom' as const,
    mode: 'button' as const,
    showArrow: true,
    url: '/brochure.pdf',
    variant: 'outline' as const,
  },
]

const renderHeader = (overrides: Partial<PageHeaderProps> = {}) =>
  renderToStaticMarkup(
    <PageHeaderBlockComponent
      actions={actions}
      appearance={{ background: 'none', border: 'none' }}
      subtitle="Discover an academic environment built around clinical experience."
      title="Your journey in medicine starts here."
      variant="minimal"
      {...overrides}
    />,
  )

describe('Page Header action layout schema', () => {
  it('normalizes legacy Page Header action placement to the Banner CTA vocabulary', () => {
    expect(resolveBannerActionPlacement('inline')).toBe('below')
    expect(resolveBannerActionPlacement('below')).toBe('below')
    expect(resolveBannerActionPlacement('side')).toBe('side')
    expect(resolveBannerActionPlacement(null)).toBe('side')
  })

  it('hides the retired Key Facts controls without deleting their fields', () => {
    const tabs = getTabs()
    const content = tabs[0]?.fields ?? []
    const theme = tabs[1]?.fields ?? []
    const keyFacts = content.find((field) => 'name' in field && field.name === 'keyFacts')
    const numberPosition = theme.find(
      (field) => 'name' in field && field.name === 'keyFactsNumberPosition',
    )

    expect(keyFacts?.admin).toMatchObject({ hidden: true })
    expect(numberPosition?.admin).toMatchObject({ hidden: true })
  })

  it('offers only Minimal and Banner for new Page Header entries', () => {
    const theme = getFieldsByTab(PageHeaderBlock)[1] ?? []

    expect(namedField(theme, 'variant')).toMatchObject({
      defaultValue: 'minimal',
      options: [
        { label: 'Minimal — theme surface page introduction', value: 'minimal' },
        { label: 'Banner — optional full-bleed background image', value: 'banner' },
      ],
    })
  })

  it.each([
    'actionPlacement',
    'contentAlignment',
    'contentWidth',
    'themeMode',
    'overlayStyle',
    'overlayDirection',
    'height',
    'size',
  ])('matches Banner CTA configuration for %s', (name) => {
    const pageHeaderField = namedField(getFieldsByTab(PageHeaderBlock)[1] ?? [], name)
    const bannerField = namedField(getFieldsByTab(BannerCtaBlock)[1] ?? [], name)

    expect(pageHeaderField).toMatchObject({
      label: bannerField && 'label' in bannerField ? bannerField.label : undefined,
      defaultValue:
        bannerField && 'defaultValue' in bannerField ? bannerField.defaultValue : undefined,
      options: bannerField && 'options' in bannerField ? bannerField.options : undefined,
    })
  })

  it('allows three primary actions and two footer actions', () => {
    const content = getFieldsByTab(PageHeaderBlock)[0] ?? []

    expect(namedField(content, 'actions')).toMatchObject({ maxRows: 3 })
    expect(namedField(content, 'footerActions')).toMatchObject({ maxRows: 2 })
  })

  it('keeps media first in Content and breadcrumb display in Theme Settings', () => {
    const tabs = getTabs()
    const contentNames = (tabs[0]?.fields ?? []).flatMap((field) =>
      'name' in field ? [field.name] : [],
    )
    const themeNames = (tabs[1]?.fields ?? []).flatMap((field) =>
      'name' in field ? [field.name] : [],
    )

    expect(contentNames[0]).toBe('backgroundImage')
    expect(themeNames.slice(0, 2)).toEqual(['variant', 'breadcrumbMode'])
  })
})

describe('Page Header action layout renderer', () => {
  it('renders Below actions immediately after the description', () => {
    const html = renderHeader({ actionPlacement: 'below' })

    expect(html).toContain('data-page-header-action-placement="below"')
    expect(html).toContain('data-page-header-actions="below"')
    expect(html.indexOf('data-page-header-description="true"')).toBeLessThan(
      html.indexOf('data-page-header-actions="below"'),
    )
    expect(html).not.toContain('data-page-header-actions="side"')
  })

  it('maps legacy Inline placement to Below', () => {
    const html = renderHeader({ actionPlacement: 'inline' })

    expect(html).toContain('data-page-header-action-placement="below"')
    expect(html).toContain('data-page-header-actions="below"')
  })

  it('renders Side actions after copy in DOM order and stacks them in a desktop rail', () => {
    const html = renderHeader({ actionPlacement: 'side' })

    expect(html).toContain('data-page-header-action-placement="side"')
    expect(html).toContain('data-page-header-actions="side"')
    expect(html).toContain('lg:flex-row')
    expect(html).toContain('lg:min-w-56')
    expect(html).toContain('flex-col gap-3 sm:flex-col [&amp;&gt;*]:w-full')
    expect(html.indexOf('data-page-header-copy="true"')).toBeLessThan(
      html.indexOf('data-page-header-actions="side"'),
    )
  })

  it('maps legacy Split to Side and never renders Key Facts', () => {
    const legacyProps: Partial<PageHeaderProps> & {
      keyFacts: { label: string; value: string }[]
    } = {
      actionPlacement: 'inline',
      keyFacts: [{ label: 'Legacy', value: 'Must not render' }],
      variant: 'split',
    }
    const html = renderHeader(legacyProps)

    expect(html).toContain('data-page-header-action-placement="side"')
    expect(html).not.toContain('data-page-header-key-facts')
    expect(html).not.toContain('Must not render')
  })

  it.each([
    ['left', 'items-start text-left'],
    ['center', 'items-center text-center'],
    ['right', 'items-end text-right'],
  ] as const)('applies %s section content alignment', (alignment, classes) => {
    const html = renderHeader({ contentAlignment: alignment })

    expect(html).toContain(`data-page-header-content-alignment="${alignment}"`)
    expect(html).toContain(classes)
  })

  it('supports Side placement in the image-backed Banner variant', () => {
    const html = renderHeader({ actionPlacement: 'side', variant: 'banner' })

    expect(html).toContain('data-page-header-variant="banner"')
    expect(html).toContain('data-page-header-actions="side"')
  })

  it('applies Banner CTA width, height, padding, tone, strength, and direction', () => {
    const html = renderHeader({
      backgroundImage: {
        alt: 'Medical learning environment',
        height: 900,
        url: '/page-header.jpg',
        width: 1600,
      } as never,
      contentWidth: 'wide',
      height: 'immersive',
      overlayCoverage: 'split',
      overlayDirection: 'rightToLeft',
      overlayStyle: 'darker',
      size: 'comfortable',
      themeMode: 'auto',
      variant: 'banner',
    })

    expect(html).toContain('data-page-header-content-width="wide"')
    expect(html).toContain('max-w-4xl')
    expect(html).toContain('data-page-header-height="immersive"')
    expect(html).toContain('min-h-[68dvh]')
    expect(html).toContain('py-20 md:py-28')
    expect(html).toContain('data-page-header-theme="auto"')
    expect(html).toContain('data-page-header-overlay="darker"')
    expect(html).toContain('data-page-header-overlay-direction="rightToLeft"')
    expect(html).toContain('data-page-header-overlay-coverage="split"')
    expect(html).toContain(
      'inset-y-0 right-0 w-1/2 bg-linear-to-l from-black/96 via-black/76 to-transparent',
    )
  })

  it('keeps footer actions after the primary action layout', () => {
    const html = renderHeader({
      actionPlacement: 'side',
      footerActions: [
        {
          label: 'View policies',
          linkType: 'custom',
          mode: 'link',
          url: '/policies',
        },
      ],
    })

    expect(html.indexOf('data-page-header-actions="side"')).toBeLessThan(
      html.indexOf('View policies'),
    )
  })
})
