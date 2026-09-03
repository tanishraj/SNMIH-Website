import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { ProgramMatrixBlockComponent } from '@/blocks/ProgramMatrix/Component'
import { SectionEyebrow } from '@/components/SectionEyebrow'

const read = (file: string) => fs.readFileSync(path.resolve(process.cwd(), file), 'utf8')

const regularSectionEyebrowFiles = [
  'src/blocks/AboutSection/Component.tsx',
  'src/blocks/AwardsList/Component.tsx',
  'src/blocks/BentoGrid/Component.tsx',
  'src/blocks/DownloadList/Component.tsx',
  'src/blocks/EditorialReasons/Component.tsx',
  'src/blocks/FeatureSpotlight/Component.tsx',
  'src/blocks/TestimonialSpotlight/Component.tsx',
  'src/blocks/GalleryCoverflow/Component.tsx',
  'src/blocks/IconGrid/Component.tsx',
  'src/blocks/LogoStrip/Component.tsx',
  'src/blocks/LeadershipProfiles/Component.tsx',
  'src/blocks/MediaCarousel/MediaCarouselClient.tsx',
  'src/blocks/NumberedSteps/Component.tsx',
  'src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx',
  'src/blocks/AcademicProgrammes/Component.tsx',
  'src/blocks/ProgramMatrix/Component.tsx',
  'src/blocks/QuoteBlock/Component.tsx',
  'src/blocks/ReviewSubmission/Component.tsx',
  'src/blocks/StudentExperience/Component.tsx',
  'src/blocks/TabsContent/Component.tsx',
  'src/blocks/TabsContent/TabsContentClient.tsx',
  'src/blocks/TestimonialGrid/Component.tsx',
  'src/blocks/Timeline/Component.tsx',
  'src/blocks/VideoEmbed/Component.tsx',
  'src/components/contact24.tsx',
  'src/components/contact33.tsx',
  'src/components/content-highlights.tsx',
  'src/components/event-gallery.tsx',
  'src/components/feature-matrix.tsx',
  'src/components/gallery-showcase.tsx',
  'src/components/image-mosaic.tsx',
  'src/components/news-events/NewsEventsFeaturedCarousel.tsx',
  'src/components/profile-carousel.tsx',
  'src/components/rating-spotlight.tsx',
  'src/components/review-feed.tsx',
  'src/components/services21.tsx',
] as const

describe('SNMIH section eyebrows', () => {
  it.each([
    'none',
    'subtle',
    'brand',
    'gradient-subtle',
    'gradient-brand',
    'darkOverlay',
    'lightOverlay',
  ] as const)('renders the %s surface contract with the inherited fallback', (surface) => {
    const html = renderToStaticMarkup(
      <SectionEyebrow className="mb-2" surface={surface}>
        Academics
      </SectionEyebrow>,
    )

    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain(`data-section-eyebrow-surface="${surface}"`)
    expect(html).toContain(
      'font-mono text-xs font-semibold uppercase tracking-[0.24em] text-current mb-2',
    )
    expect(html).toContain('>Academics</p>')
  })

  it('scopes direct eyebrow colors to SNMIH and reuses existing tokens instead of defining a new one', () => {
    const css = read('src/styles/custom.css')

    expect(css).toContain(
      [
        ":root[data-theme-color='snmih-blue']:not(.dark)",
        "  [data-section-eyebrow-surface]:not([data-section-eyebrow-surface='brand']):not(",
        "    [data-section-eyebrow-surface='gradient-brand']",
        "  ):not([data-section-eyebrow-surface='primary']):not(",
        "    [data-section-eyebrow-surface='darkOverlay']",
        '  ) {',
        '  color: var(--success);',
        '}',
      ].join('\n'),
    )
    expect(css).not.toMatch(/--(?:section-)?eyebrow/)
    expect(css).not.toMatch(/--section-accent/)
  })

  it('gives genuinely dark surfaces the ring token, flipping which surfaces qualify per mode', () => {
    const css = read('src/styles/custom.css')
    const ringRule = css.slice(
      css.indexOf(
        ":root[data-theme-color='snmih-blue']:not(.dark) [data-section-eyebrow-surface='brand']",
      ),
    )
    const ringBlock = ringRule.slice(0, ringRule.indexOf('}') + 1)

    expect(ringBlock).toContain('color: var(--ring);')
    // Dark in light mode: the navy brand surface.
    expect(ringBlock).toContain(
      ":root[data-theme-color='snmih-blue']:not(.dark) [data-section-eyebrow-surface='brand']",
    )
    expect(ringBlock).toContain(
      ":root[data-theme-color='snmih-blue']:not(.dark) [data-section-eyebrow-surface='gradient-brand']",
    )
    // Dark in either mode: image overlays.
    expect(ringBlock).toContain(
      ":root[data-theme-color='snmih-blue'] [data-section-eyebrow-surface='darkOverlay']",
    )
    // Dark in dark mode: the page background, but NOT the brand surface, which
    // inverts to a light tint there.
    expect(ringBlock).toContain(":root[data-theme-color='snmih-blue'].dark")
    expect(ringBlock).toContain(":not([data-section-eyebrow-surface='brand'])")
  })

  it('falls back to the surface foreground where the brand surface inverts to a light tint', () => {
    const css = read('src/styles/custom.css')

    // --primary inverts to a light tint in dark mode, so both greens are too
    // pale to read against it. Neither may be used there.
    expect(css).toContain(
      [
        ":root[data-theme-color='snmih-blue'].dark [data-section-eyebrow-surface='brand'],",
        ":root[data-theme-color='snmih-blue'].dark [data-section-eyebrow-surface='gradient-brand'],",
        ":root[data-theme-color='snmih-blue'].dark [data-section-eyebrow-surface='primary'] {",
        '  color: var(--primary-foreground);',
        '}',
      ].join('\n'),
    )
  })

  it('keeps explicit light-overlay eyebrows dark in both site modes', () => {
    const css = read('src/styles/custom.css')

    expect(css).toContain(
      ":root[data-theme-color='snmih-blue'] [data-section-eyebrow-surface='lightOverlay']",
    )
    expect(css).toContain("[data-section-eyebrow-surface='lightOverlay']\n  )")
  })

  it.each(regularSectionEyebrowFiles)('%s consumes the shared section eyebrow', (file) => {
    expect(read(file)).toContain('SectionEyebrow')
  })

  it('does not convert metadata labels into section eyebrows', () => {
    expect(read('src/blocks/AcademicProgrammes/AcademicProgrammesClient.tsx')).toContain(
      'contentItemMetadataClasses',
    )
    const pageHeader = read('src/blocks/PageHeader/Component.tsx')
    expect(pageHeader).toContain('SectionEyebrow')
    expect(pageHeader).not.toContain('sectionEyebrowClasses')
    expect(pageHeader).not.toContain('data-page-header-key-facts')
    expect(read('src/components/contact24.tsx')).toContain('{office.region}')
  })

  it('passes a regular section background to the eyebrow', () => {
    const html = renderToStaticMarkup(
      <ProgramMatrixBlockComponent
        appearance={{ background: 'brand' }}
        eyebrow="Academics"
        items={[{ title: 'MBBS' }]}
        title="Programmes offered"
      />,
    )

    expect(html).toContain('data-section-eyebrow="true"')
    expect(html).toContain('data-section-eyebrow-surface="brand"')
  })

  it('matches Hero Carousel eyebrows to the selected overlay tone', () => {
    const source = read('src/blocks/HeroCarousel/HeroCarouselClient.tsx')

    expect(source).toContain('SectionEyebrow')
    expect(source).toContain('surface={overlay.eyebrowSurface}')
  })
})
