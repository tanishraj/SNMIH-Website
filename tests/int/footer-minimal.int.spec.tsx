import { readFileSync } from 'node:fs'

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FooterMinimalBlockComponent } from '@/blocks/FooterMinimal/Component'
import { FooterMinimalBlock } from '@/blocks/FooterMinimal/config'
import { Footers } from '@/collections/Footers'
import { SiteSettings } from '@/globals/SiteSettings'

const social = {
  facebook: 'https://facebook.com/x',
  instagram: 'https://instagram.com/x',
  x: 'https://x.com/x',
  youtube: 'https://youtube.com/@x',
  linkedin: '  ',
}

describe('FooterMinimal', () => {
  it('renders social icons from site settings, skipping blanks', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        appearance={{ background: 'brand', border: 'none' }}
        copyrightText="© 2026 SNMIH"
        linkGroups={[{ title: 'Explore', links: [{ label: 'About', linkType: 'custom', url: '/about' }] }]}
        siteName="SNMIH"
        siteSocialLinks={social}
      />,
    )
    expect(html).toContain('data-footer-minimal-block="true"')
    expect(html).toContain('bg-brand')
    expect(html).toContain('data-footer-minimal-social-link="facebook"')
    expect(html).toContain('data-footer-minimal-social-link="x"')
    expect(html).toContain('data-footer-minimal-social-link="youtube"')
    expect(html).not.toContain('data-footer-minimal-social-link="linkedin"')
    expect(html).toContain('Explore')
    expect(html).toContain('© 2026 SNMIH')
  })

  it('hides social entirely when switched off', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent siteName="SNMIH" siteSocialLinks={social} showSocialLinks={false} />,
    )
    expect(html).not.toContain('data-footer-minimal-social')
  })

  it('falls back to the site address when no description is set', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent siteAddress={'Mahavir Nagar\nSaharsa, Bihar'} siteName="SNMIH" />,
    )
    expect(html).toContain('Mahavir Nagar')
    expect(html).toContain('Saharsa, Bihar')
  })

  it('is registered on the Footers collection and rendered by the footer renderer', () => {
    const layoutField = Footers.fields.find(
      (field) => typeof field === 'object' && 'name' in field && field.name === 'layout',
    ) as { blocks?: Array<{ slug: string }> } | undefined

    expect(layoutField?.blocks?.map((block) => block.slug)).toContain('footerMinimal')
    expect(readFileSync('src/blocks/renderFooterBlocks.tsx', 'utf8')).toContain(
      "case 'footerMinimal'",
    )
    expect(FooterMinimalBlock.interfaceName).toBe('FooterMinimalBlock')
  })

  it('exposes every rendered social platform in Site Settings', () => {
    const tabs = SiteSettings.fields.find(
      (field) => typeof field === 'object' && 'tabs' in field,
    ) as { tabs: Array<{ fields: unknown[]; label: string }> } | undefined
    const socialTab = tabs?.tabs.find((tab) => tab.label === 'Social Links')
    const group = socialTab?.fields[0] as { fields?: Array<{ name?: string }> } | undefined
    const names = group?.fields?.map((field) => field.name) ?? []

    // The footer can only render a platform the admin can actually set.
    for (const platform of ['facebook', 'instagram', 'x', 'youtube', 'linkedin']) {
      expect(names).toContain(platform)
    }
  })

  it('pulls the site phone and email into the contact column as click-to-call and mailto', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        linkGroups={[
          {
            includeSiteContact: true,
            links: [{ label: 'Contact Us', linkType: 'custom', url: '/contact' }],
            title: 'Contact',
          },
          {
            links: [{ label: 'About', linkType: 'custom', url: '/about' }],
            title: 'Explore',
          },
        ]}
        siteEmail="snfsaharsa@gmail.com"
        siteName="SNMIH"
        sitePhone="06-478-299985"
      />,
    )

    // Display keeps the formatting; the href must not.
    expect(html).toContain('>06-478-299985<')
    expect(html).toContain('href="tel:06478299985"')
    expect(html).toContain('href="mailto:snfsaharsa@gmail.com"')
    // Contact details lead, the manual link follows.
    expect(html.indexOf('tel:06478299985')).toBeLessThan(html.indexOf('/contact'))
    // A column without the flag is untouched.
    expect(html).not.toContain('mailto:undefined')
    const explorePos = html.indexOf('Explore')
    expect(html.slice(explorePos)).not.toContain('tel:')
  })

  it('omits contact entries when Site Settings has no phone or email', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        linkGroups={[
          {
            includeSiteContact: true,
            links: [{ label: 'Contact Us', linkType: 'custom', url: '/contact' }],
            title: 'Contact',
          },
        ]}
        siteName="SNMIH"
      />,
    )

    expect(html).toContain('Contact Us')
    expect(html).not.toContain('tel:')
    expect(html).not.toContain('mailto:')
  })

  it('gives every link a working hover, dimming the anchor rather than its parent', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        bottomLinks={[{ label: 'Privacy', linkType: 'custom', url: '/privacy' }]}
        copyrightText="© 2026 SNMIH"
        linkGroups={[
          {
            includeSiteContact: true,
            links: [{ label: 'About', linkType: 'custom', url: '/about' }],
            title: 'Contact',
          },
        ]}
        siteEmail="hello@example.com"
        siteName="SNMIH"
        sitePhone="06-478-299985"
        siteSocialLinks={{ facebook: 'https://facebook.com/x' }}
        socialIconStyle="plain"
      />,
    )

    // The anchor carries its own dimmed colour, so hover has somewhere to go.
    expect(html).toContain('text-current/70 transition-colors hover:text-current')
    // A dimmed parent would make currentColor inside the anchor already dimmed,
    // rendering hover:text-current inert.
    expect(html).not.toContain('flex flex-col gap-3 text-sm text-current/70')
    expect(html).not.toContain('pt-6 text-xs text-current/60')
    // Contact rows are anchors too, so they hover like the rest.
    expect(html).toMatch(/href="tel:06478299985"/)
    expect(html).toContain('text-current/60 transition-colors hover:text-current')
  })

  it('takes both legal links from site identity under fixed labels', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        privacyPolicyUrl="/legal/privacy"
        siteName="SNMIH"
        termsAndConditionsUrl="/legal/terms"
      />,
    )

    // Wording is fixed, so a differently titled page still reads correctly.
    expect(html).toContain('Terms &amp; Conditions')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('href="/legal/terms"')
    expect(html).toContain('href="/legal/privacy"')
  })

  it('does not repeat a legal page an editor already linked by hand', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        bottomLinks={[{ label: 'Privacy Policy', linkType: 'custom', url: '/privacy' }]}
        privacyPolicyUrl="/privacy"
        siteName="SNMIH"
      />,
    )

    expect(html.match(/href="\/privacy"/g)).toHaveLength(1)
  })

  it('promotes a phone or email typed as a plain custom URL, leaving real paths alone', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        linkGroups={[
          {
            links: [
              { label: '06-478-299985', linkType: 'custom', url: '06-478-299985' },
              { label: 'snfsaharsa@gmail.com', linkType: 'custom', url: 'snfsaharsa@gmail.com' },
              { label: 'Contact Us', linkType: 'custom', url: '/contact' },
              { label: 'Partner', linkType: 'custom', url: 'https://example.com' },
            ],
            title: 'Contact',
          },
        ]}
        siteName="SNMIH"
      />,
    )

    // Bare contact details would otherwise resolve as relative links.
    expect(html).toContain('href="tel:06478299985"')
    expect(html).toContain('href="mailto:snfsaharsa@gmail.com"')
    // Display text stays as entered.
    expect(html).toContain('>06-478-299985<')
    // Paths and absolute URLs are left untouched.
    expect(html).toContain('href="/contact"')
    expect(html).toContain('href="https://example.com"')
    expect(html).not.toContain('tel:/contact')
    expect(html).not.toContain('mailto:https')
  })

  it('styles link column headings as eyebrows while keeping heading semantics', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        appearance={{ background: 'brand', border: 'none' }}
        linkGroups={[
          { links: [{ label: 'About', linkType: 'custom', url: '/about' }], title: 'Explore' },
        ]}
        siteName="SNMIH"
      />,
    )

    // Still an h2, so the footer keeps its heading outline.
    expect(html).toMatch(/<h2[^>]*>Explore<\/h2>/)
    expect(html).toContain('font-mono')
    expect(html).toContain('tracking-[0.24em]')
    // Carries the eyebrow surface hook, so it picks up the per-surface accent.
    expect(html).toContain('data-section-eyebrow-surface="brand"')
    // The serif display face the base layer applies to headings is overridden.
    expect(html).not.toMatch(/<h2 class="text-sm font-semibold text-current"/)
  })

  it('makes the logo optional and titles the brand column like a link column', () => {
    const withTitle = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        appearance={{ background: 'brand', border: 'none' }}
        brandTitle="Shree Narayan"
        logoMode="none"
        siteLogo={{ alt: 'Logo', url: '/logo.svg' } as never}
        siteName="SNMIH"
      />,
    )

    // No logo rendered, but the name still anchors the home link.
    expect(withTitle).not.toContain('/logo.svg')
    expect(withTitle).toContain('data-footer-minimal-brand-title="true"')
    // Same treatment as the link column headings.
    expect(withTitle).toContain('font-mono')
    expect(withTitle).toContain('data-section-eyebrow-surface="brand"')
    expect(withTitle).toContain('href="/"')
  })

  it('drops the home link when it would have no logo and no name to announce', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        brandTitle="Shree Narayan"
        logoMode="none"
        showSiteName={false}
        siteName="SNMIH"
      />,
    )

    // An empty <a> would be focusable with no accessible name.
    expect(html).not.toContain('href="/"')
    expect(html).toContain('Shree Narayan')
  })

  it('keeps rendering content saved under the previous nameOnly logo mode', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        logoMode="nameOnly"
        siteLogo={{ alt: 'Logo', url: '/logo.svg' } as never}
        siteName="SNMIH"
      />,
    )

    expect(html).not.toContain('/logo.svg')
    expect(html).toContain('SNMIH')
  })

  it('arranges the bottom bar by how many of the three slots are present', () => {
    const social = { facebook: 'https://facebook.com/x' }
    const three = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        copyrightText="© 2026 SNMIH"
        siteName="SNMIH"
        siteSocialLinks={social}
        socialPlacement="bottomBar"
        termsAndConditionsUrl="/legal/terms"
      />,
    )
    const two = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        copyrightText="© 2026 SNMIH"
        siteName="SNMIH"
        termsAndConditionsUrl="/legal/terms"
      />,
    )
    const one = renderToStaticMarkup(
      <FooterMinimalBlockComponent copyrightText="© 2026 SNMIH" siteName="SNMIH" />,
    )

    // Three: real thirds, so the middle slot is genuinely centred.
    expect(three).toContain('data-footer-minimal-bottom-slots="3"')
    expect(three).toContain('md:grid-cols-3')
    expect(three).toContain('md:justify-self-start')
    expect(three).toContain('md:justify-self-center')
    expect(three).toContain('md:justify-self-end')
    // Order is social, copyright, legal.
    const socialAt = three.indexOf('data-footer-minimal-social')
    const copyAt = three.indexOf('© 2026 SNMIH')
    const legalAt = three.indexOf('Terms &amp; Conditions')
    expect(socialAt).toBeLessThan(copyAt)
    expect(copyAt).toBeLessThan(legalAt)

    // Two: split to the edges.
    expect(two).toContain('data-footer-minimal-bottom-slots="2"')
    expect(two).toContain('md:justify-between')
    expect(two).not.toContain('md:grid-cols-3')

    // One: centred.
    expect(one).toContain('data-footer-minimal-bottom-slots="1"')
    expect(one).toContain('md:justify-center')
    expect(one).not.toContain('md:justify-between')
  })

  it('spaces every column on one shared gap, heading included', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent
        brandTitle="Shree Narayan"
        linkGroups={[
          { links: [{ label: 'About', linkType: 'custom', url: '/about' }], title: 'Explore' },
        ]}
        siteAddress="Mahavir Nagar"
        siteName="SNMIH"
      />,
    )

    const brandClass = html.match(/class="([^"]*)" data-footer-minimal-brand/)?.[1]
    const groupClass = html.match(/class="([^"]*)" data-footer-minimal-group/)?.[1]

    // Assert the columns agree, not what the gap happens to be, so tuning the
    // spacing does not require touching this test.
    expect(brandClass).toBeDefined()
    expect(brandClass).toBe(groupClass)
    expect(brandClass).toMatch(/flex flex-col gap-\d/)
    // Spacing comes from the gap, so no margin sits under a heading.
    expect(html).not.toContain('mt-5')
  })

  it('needs no conditional spacing when a column has no heading', () => {
    const html = renderToStaticMarkup(
      <FooterMinimalBlockComponent siteAddress="Mahavir Nagar" siteName="SNMIH" />,
    )

    // A gap only applies between siblings, so an absent heading leaves no trace.
    expect(html).toMatch(/flex flex-col gap-\d/)
    expect(html).not.toContain('mt-5')
  })
})
