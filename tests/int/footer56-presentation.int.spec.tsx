import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Footer56BlockComponent } from '@/blocks/Footer56/Component'

// Footer56Block marks these required, so every render needs them.
const baseProps = {
  appearance: { background: 'none' as const, border: 'none' as const },
  blockType: 'footer56' as const,
  logoMode: 'siteDefault' as const,
  size: 'default' as const,
  copyrightText: '© 2026 SNMIH',
  linkGroups: [
    { title: 'Explore', links: [{ label: 'About', linkType: 'custom' as const, url: '/about' }] },
  ],
  siteName: 'SNMIH',
  siteSocialLinks: { facebook: 'https://facebook.com/x', x: 'https://x.com/x' },
}

describe('Footer56 presentation', () => {
  it('brightens links to the surface foreground rather than --primary', () => {
    const html = renderToStaticMarkup(
      <Footer56BlockComponent {...baseProps} appearance={{ background: 'brand', border: 'none' }} />,
    )

    // --primary IS the background on the brand surface, so hovering to it was
    // invisible there.
    expect(html).toContain('text-current/70 transition-colors hover:text-current')
    expect(html).not.toContain('hover:text-primary')
  })

  it('styles link column headings as eyebrows with the surface accent', () => {
    const html = renderToStaticMarkup(
      <Footer56BlockComponent {...baseProps} appearance={{ background: 'brand', border: 'none' }} />,
    )

    expect(html).toContain('tracking-[0.24em]')
    expect(html).toContain('data-section-eyebrow-surface="brand"')
    // The previous near-miss variant is gone.
    expect(html).not.toContain('tracking-widest')
  })

  it('offers filled tiles for the social icons', () => {
    const plain = renderToStaticMarkup(
      <Footer56BlockComponent {...baseProps} socialIconStyle="plain" />,
    )
    const tile = renderToStaticMarkup(
      <Footer56BlockComponent {...baseProps} socialIconStyle="tile" />,
    )

    expect(tile).toContain('bg-current/10')
    expect(plain).not.toContain('bg-current/10')
    expect(tile).toContain('data-footer56-social-link="facebook"')
    // X now renders, which the old private icon map had no entry for.
    expect(tile).toContain('data-footer56-social-link="x"')
  })

  it('arranges the bottom bar by how many slots are filled', () => {
    const three = renderToStaticMarkup(
      <Footer56BlockComponent
        {...baseProps}
        bottomLinks={[{ label: 'Cookies', linkType: 'custom', url: '/cookies' }]}
        socialPlacement="bottomBar"
      />,
    )
    const two = renderToStaticMarkup(
      <Footer56BlockComponent
        {...baseProps}
        bottomLinks={[{ label: 'Cookies', linkType: 'custom', url: '/cookies' }]}
      />,
    )
    const one = renderToStaticMarkup(
      // Social stays in the brand column and there are no legal links, so the
      // bottom bar carries the copyright alone.
      <Footer56BlockComponent {...baseProps} />,
    )

    expect(three).toContain('data-footer56-bottom-slots="3"')
    expect(three).toContain('md:grid-cols-3')
    expect(three).toContain('md:justify-self-center')
    const socialAt = three.indexOf('data-footer56-social')
    const copyAt = three.indexOf('© 2026 SNMIH')
    const legalAt = three.indexOf('Cookies')
    expect(socialAt).toBeLessThan(copyAt)
    expect(copyAt).toBeLessThan(legalAt)

    expect(two).toContain('data-footer56-bottom-slots="2"')
    expect(two).toContain('md:justify-between')

    expect(one).toContain('data-footer56-bottom-slots="1"')
    expect(one).toContain('md:justify-center')
  })

  it('does not list a legal page the editor already linked by hand', () => {
    const html = renderToStaticMarkup(
      <Footer56BlockComponent
        {...baseProps}
        bottomLinks={[{ label: 'Privacy Policy', linkType: 'custom', url: '/privacy' }]}
        privacyPolicyUrl="/privacy"
      />,
    )

    expect(html.match(/href="\/privacy"/g)).toHaveLength(1)
  })
})
