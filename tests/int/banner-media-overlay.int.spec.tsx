import { renderToStaticMarkup } from 'react-dom/server'
import type { Block, Field } from 'payload'
import { describe, expect, it } from 'vitest'

import { BannerCtaBlockComponent } from '@/blocks/BannerCta/Component'
import { BannerCtaBlock } from '@/blocks/BannerCta/config'
import { HeroBannerBlock } from '@/blocks/HeroBanner/config'
import { PageHeaderBlock } from '@/blocks/PageHeader/config'

const getThemeFields = (block: Block): Field[] => {
  const tabs = block.fields[0]
  if (tabs.type !== 'tabs' || typeof tabs.tabs === 'function') {
    throw new Error(`Expected ${block.slug} tabs`)
  }

  return tabs.tabs.find((tab) => tab.label === 'Theme Settings')?.fields ?? []
}

const getSelectValues = (fields: Field[], name: string) => {
  const field = fields.find((candidate) => 'name' in candidate && candidate.name === name)
  if (!field || !('options' in field) || !Array.isArray(field.options)) return []

  return field.options.map((option) => (typeof option === 'string' ? option : option.value))
}

const getNamedField = (fields: Field[], name: string) =>
  fields.find((candidate) => 'name' in candidate && candidate.name === name)

describe('full-width banner media overlays', () => {
  it.each([
    ['Banner CTA', BannerCtaBlock],
    ['Page Header', PageHeaderBlock],
    ['Hero Banner', HeroBannerBlock],
  ] as const)('exposes the shared tone, strength, and direction contract for %s', (_, block) => {
    const fields = getThemeFields(block)

    expect(getSelectValues(fields, 'themeMode')).toEqual(['auto', 'light', 'dark', 'brand'])
    expect(getSelectValues(fields, 'overlayStyle')).toEqual(['light', 'dark', 'darker'])
    expect(getSelectValues(fields, 'overlayDirection')).toEqual([
      'vertical',
      'leftToRight',
      'rightToLeft',
      'bottomToTop',
      'topToBottom',
    ])
    expect(getSelectValues(fields, 'overlayCoverage')).toEqual(['full', 'split'])
    expect(getNamedField(fields, 'overlayCoverage')).toMatchObject({
      defaultValue: 'full',
      required: false,
    })

    const fieldNames = fields.flatMap((field) => ('name' in field ? [field.name] : []))
    expect(fieldNames.indexOf('overlayCoverage')).toBe(fieldNames.indexOf('overlayDirection') + 1)
  })

  it('renders Banner CTA brand tone and vertical directions through the shared resolver', () => {
    const html = renderToStaticMarkup(
      <BannerCtaBlockComponent
        backgroundImage={{ alt: 'Campus', url: '/campus.jpg' }}
        overlayCoverage="split"
        overlayDirection="bottomToTop"
        overlayStyle="light"
        themeMode="brand"
        title="Join our community"
      />,
    )

    expect(html).toContain('data-banner-cta-theme="brand"')
    expect(html).toContain('data-banner-cta-overlay="light"')
    expect(html).toContain('data-banner-cta-overlay-direction="bottomToTop"')
    expect(html).toContain('data-banner-cta-overlay-coverage="split"')
    expect(html).toContain(
      'inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-primary/88 via-primary/62 to-transparent',
    )
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('data-block-surface="brand"')
  })

  it('renders Banner CTA Light overlay copy with the selected theme foreground', () => {
    const html = renderToStaticMarkup(
      <BannerCtaBlockComponent
        backgroundImage={{ alt: 'Campus', url: '/campus.jpg' }}
        themeMode="light"
        title="Join our community"
      />,
    )

    expect(html).toContain('data-banner-cta-theme="light"')
    expect(html).toContain('text-light-overlay-foreground')
    expect(html).not.toContain('text-black')
  })
})
