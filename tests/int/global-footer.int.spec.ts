import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { renderFooterBlocks } from '@/blocks/renderFooterBlocks'
import { GlobalFooter } from '@/components/global/GlobalFooter'

describe('global footer wiring', () => {
  it('renders nothing without a configured footer layout', () => {
    expect(renderToStaticMarkup(createElement(GlobalFooter, { footer: null }))).toBe('')
    expect(
      renderToStaticMarkup(
        createElement(GlobalFooter, {
          footer: {
            layout: [],
          },
        }),
      ),
    ).toBe('')
  })

  it('renders footer blocks through the shared renderer', () => {
    const html = renderToStaticMarkup(
      createElement(
        'div',
        null,
        renderFooterBlocks(
          [
            {
              appearance: {
                background: 'accent',
                border: 'top',
              },
              blockType: 'footer56',
              bottomLinks: [{ label: 'Terms and Conditions', linkType: 'custom', url: '/terms' }],
              copyrightText: '© 2026 Acme Institute. All rights reserved.',
              ctaButtons: [
                {
                  label: 'Apply now',
                  linkType: 'custom',
                  showArrow: true,
                  url: '/apply',
                  variant: 'outline',
                },
              ],
              description: 'Preparing students for decisive practice and public service.',
              linkGroups: [
                {
                  links: [{ label: 'Programs', linkType: 'custom', url: '/programs' }],
                  title: 'Academics',
                },
              ],
              logoHeight: 44,
              logoMode: 'siteDefault',
            },
          ] as never,
          {
            privacyPolicyUrl: '/legal/privacy-policy',
            siteAddress: '123 Market Street, Suite 400',
            siteEmail: 'hello@acme.edu',
            siteLogo: { alt: 'Acme Institute logo', url: '/media/acme-logo.svg' },
            siteName: 'Acme Institute',
            sitePhone: '+1 (555) 000-0000',
            termsAndConditionsUrl: '/legal/terms-and-conditions',
            siteSocialLinks: {
              linkedin: 'https://example.com/linkedin',
              youtube: 'https://example.com/youtube',
            },
          },
        ),
      ),
    )

    // 'accent' is a legacy background value retired in the palette collapse; it
    // normalizes to 'subtle' for rendered classes, but the raw stored value is
    // still surfaced verbatim on the data attribute (Footer56 reads
    // appearance.background directly, not through resolveBlockAppearanceClasses).
    expect(html).toContain('data-footer56-background="accent"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('text-foreground')
    expect(html).toContain('border-t')
    expect(html).toContain('Acme Institute')
    expect(html).toContain('Programs')
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('Terms and Conditions')
    expect(html).toContain('Apply now')
    expect(html).toContain('data-action-arrow="true"')
    expect(html).toContain('© 2026 Acme Institute. All rights reserved.')
    expect(html).toContain('123 Market Street, Suite 400')
    expect(html).toContain('+1 (555) 000-0000')
    expect(html).toContain('hello@acme.edu')
    expect(html).toContain('linkedin')
    expect(html).toContain('youtube')
    expect(html).toContain('height:44px')
    expect(html).not.toContain('github')

    const descriptionIndex = html.indexOf(
      'Preparing students for decisive practice and public service.',
    )
    const addressIndex = html.indexOf('123 Market Street, Suite 400')
    const phoneIndex = html.indexOf('+1 (555) 000-0000')
    const emailIndex = html.indexOf('hello@acme.edu')
    const linkedInIndex = html.indexOf('linkedin')
    const customBottomLinkIndex = html.indexOf(
      'Terms and Conditions',
      html.indexOf('href="/terms"'),
    )
    // The appended legal link is labelled from Site Settings, so it reads
    // "Terms & Conditions" and is distinct from the editor's own bottom link.
    const legalTermsIndex = html.indexOf('Terms &amp; Conditions')
    const privacyIndex = html.indexOf('Privacy Policy')

    expect(addressIndex).toBeGreaterThan(descriptionIndex)
    expect(phoneIndex).toBeGreaterThan(addressIndex)
    expect(emailIndex).toBeGreaterThan(phoneIndex)
    expect(linkedInIndex).toBeGreaterThan(emailIndex)
    expect(legalTermsIndex).toBeGreaterThan(customBottomLinkIndex)
    expect(privacyIndex).toBeGreaterThan(legalTermsIndex)
  })

  it('renders the active footer preset inside the global footer shell', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalFooter, {
        footer: {
          layout: [
            {
              appearance: {
                background: 'brand',
                border: 'top',
              },
              blockType: 'footer56',
              ctaButtons: [
                { label: 'Contact', linkType: 'custom', url: '/contact', variant: 'outline' },
              ],
              description: 'A quieter institutional footer for public-facing pages.',
              linkGroups: [
                {
                  links: [{ label: 'About', linkType: 'custom', url: '/about' }],
                  title: 'Institute',
                },
              ],
              logoMode: 'siteDefault',
            },
          ],
        } as never,
        siteAddress: '123 Market Street, Suite 400',
        siteEmail: 'hello@acme.edu',
        siteLogo: null,
        siteName: 'Acme Institute',
        sitePhone: '+1 (555) 000-0000',
        siteSocialLinks: { facebook: 'https://example.com/facebook' },
      }),
    )

    // Uses the 'brand' surface (rather than another value that also folds to
    // 'subtle') so this test proves a genuinely different rendered surface
    // than the legacy 'accent' background exercised above.
    expect(html).toContain('data-global-footer="true"')
    expect(html).toContain('data-footer56-background="brand"')
    expect(html).toContain('bg-brand')
    expect(html).toContain('text-primary-foreground')
    expect(html).toContain('Acme Institute')
    expect(html).toContain('123 Market Street, Suite 400')
    expect(html).toContain('hello@acme.edu')
    expect(html).toContain('facebook')
    expect(html).toContain('Contact')
    expect(html).toContain('About')
  })

  it('fetches and renders the active footer preset in the frontend shell', () => {
    const layoutSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'),
      'utf8',
    )

    expect(layoutSource).toContain(
      "import { GlobalFooter } from '@/components/global/GlobalFooter'",
    )
    expect(layoutSource).toContain("import { resolveLegalPageHrefs } from '@/lib/legalPagePaths'")
    expect(layoutSource).toContain('const activeFooterID =')
    expect(layoutSource).toContain('const activeFooter =')
    expect(layoutSource).toContain("collection: 'footers'")
    expect(layoutSource).toContain(
      "payload.findGlobal({ slug: 'site-settings', depth: 1, populate: frontendGlobalsPopulate })",
    )
    expect(layoutSource).toContain(
      'const { privacyPolicyUrl, termsAndConditionsUrl } = await resolveLegalPageHrefs(',
    )
    expect(layoutSource).toContain('<GlobalFooter')
    expect(layoutSource).toContain('privacyPolicyUrl={privacyPolicyUrl}')
    expect(layoutSource).toContain('termsAndConditionsUrl={termsAndConditionsUrl}')
    expect(layoutSource).toContain('siteAddress={siteSettings.address}')
    expect(layoutSource).toContain('sitePhone={siteSettings.contactPhone}')
    expect(layoutSource).toContain('siteEmail={siteSettings.contactEmail}')
    expect(layoutSource).toContain('siteSocialLinks={siteSettings.socialLinks}')
    expect(layoutSource).not.toContain('getPageHref(privacyPolicyPage)')

    const mainIndex = layoutSource.indexOf('<main')
    expect(layoutSource.slice(mainIndex, mainIndex + 120)).toContain('data-site-main="true"')
    const footerIndex = layoutSource.indexOf('<GlobalFooter')

    expect(mainIndex).toBeGreaterThanOrEqual(0)
    expect(footerIndex).toBeGreaterThan(mainIndex)
  })
})
