import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LogoStripBlockComponent } from '@/blocks/LogoStrip/Component'
import { PageHeaderBlockComponent } from '@/blocks/PageHeader/Component'

const media = {
  alt: 'Northstar logo',
  createdAt: '2026-08-11T00:00:00.000Z',
  height: 64,
  id: 'logo',
  updatedAt: '2026-08-11T00:00:00.000Z',
  url: '/block-thumbnail-assets/brand-mark.svg',
  width: 120,
}

describe('dark-mode media treatments', () => {
  it('keeps dark source logos visible on dark Logo Strip surfaces', () => {
    const html = renderToStaticMarkup(
      <LogoStripBlockComponent displayMode="grid" logos={[{ image: media, label: 'Northstar' }]} />,
    )

    expect(html).toContain('dark:brightness-0')
    expect(html).toContain('dark:invert')
  })

  it('uses the shared neutral dark Page Header overlay treatment', () => {
    const html = renderToStaticMarkup(
      <PageHeaderBlockComponent
        backgroundImage={media}
        eyebrow="Admissions"
        overlayStyle="light"
        title="Admissions"
        variant="banner"
      />,
    )

    expect(html).toContain('bg-linear-to-r from-black/76 via-black/54 to-transparent')
    expect(html).toContain('data-page-header-theme="dark"')
    expect(html).toContain('data-page-header-overlay="light"')
    expect(html).toContain('data-block-surface="darkOverlay"')
    expect(html).toContain('data-section-eyebrow-surface="darkOverlay"')
    expect(html).not.toContain('bg-foreground/20')
  })
})
