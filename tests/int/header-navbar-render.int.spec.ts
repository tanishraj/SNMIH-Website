import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { HeaderNavbar12BlockComponent } from '@/blocks/HeaderNavbar12/Component'
import { HeaderMobileMenu } from '@/components/header/HeaderMobileMenu'
import { renderHeaderBlocks } from '@/blocks/renderHeaderBlocks'
import { HeaderNavbar } from '@/components/header/HeaderNavbar'
import { SiteLogo } from '@/components/site/SiteLogo'
import { resolveHeaderLink, resolveHeaderMenuItems } from '@/lib/headerNavigation'

describe('header navigation helpers', () => {
  it('resolves page and custom links and drops invalid entries', () => {
    expect(
      resolveHeaderLink({
        label: ' Work ',
        linkType: 'page',
        openInNewTab: false,
        page: {
          slug: 'work',
        } as never,
      }),
    ).toEqual({
      href: '/work',
      label: 'Work',
      newTab: false,
    })

    expect(
      resolveHeaderLink({
        label: 'Docs',
        linkType: 'custom',
        openInNewTab: true,
        url: 'https://example.com/docs',
      }),
    ).toEqual({
      href: 'https://example.com/docs',
      label: 'Docs',
      newTab: true,
    })

    expect(
      resolveHeaderMenuItems([
        {
          children: [
            {
              label: 'Overview',
              linkType: 'page',
              page: {
                slug: 'overview',
              } as never,
            },
            {
              label: '   ',
              linkType: 'custom',
              url: 'https://example.com/ignored',
            },
          ],
          label: 'Products',
          linkType: 'custom',
          url: '/products',
        },
        {
          label: 'Missing href',
          linkType: 'page',
          page: null,
        },
      ]),
    ).toEqual([
      {
        children: [
          {
            href: '/overview',
            label: 'Overview',
            newTab: false,
          },
        ],
        href: '/products',
        label: 'Products',
        newTab: false,
      },
    ])
  })
})

describe('header logo resolution', () => {
  it('falls back to site name when no media logo is available', () => {
    const html = renderToStaticMarkup(
      createElement(SiteLogo, {
        fallbackText: 'Acme Studio',
        height: 32,
        mode: 'siteDefault',
        siteLogo: null,
      }),
    )

    expect(html).toContain('Acme Studio')
  })

  it('renders light and dark custom logo variants when present', () => {
    const html = renderToStaticMarkup(
      createElement(SiteLogo, {
        customDark: { alt: 'Acme dark', url: '/dark-logo.svg' },
        customLight: { alt: 'Acme light', url: '/light-logo.svg' },
        fallbackText: 'Acme Studio',
        height: 40,
        mode: 'customLogo',
      }),
    )

    expect(html).toContain('dark:hidden')
    expect(html).toContain('hidden h-auto w-auto object-contain dark:block')
    expect(html).toContain('/light-logo.svg')
    expect(html).toContain('/dark-logo.svg')
  })

  it('uses intrinsic dimensions and a rendered pixel width hint', () => {
    const html = renderToStaticMarkup(
      createElement(SiteLogo, {
        fallbackText: 'Acme Studio',
        height: 40,
        mode: 'siteDefault',
        siteLogo: { alt: 'Acme', height: 200, url: '/logo.png', width: 400 },
      }),
    )

    expect(html).toContain('width="400"')
    expect(html).toContain('height="200"')
    expect(html).toContain('sizes="80px"')
    expect(html).not.toContain('sizes="100vw"')
  })

  it('uses a bounded square fallback and deduplicates identical theme URLs', () => {
    const html = renderToStaticMarkup(
      createElement(SiteLogo, {
        customDark: { alt: 'Acme', url: '/same-logo.png' },
        customLight: { alt: 'Acme', url: '/same-logo.png' },
        fallbackText: 'Acme Studio',
        height: 40,
        mode: 'customLogo',
      }),
    )

    expect(html.match(/<img/g)).toHaveLength(1)
    expect(html).toContain('width="40"')
    expect(html).toContain('height="40"')
    expect(html).toContain('sizes="40px"')
  })
})

describe('header navbar rendering', () => {
  it('renders aligned menu items, dropdown children, and CTA buttons', () => {
    const html = renderToStaticMarkup(
      createElement(HeaderNavbar, {
        appearance: {
          background: 'subtle',
          border: 'bottom',
        },
        ctas: [{ href: '/contact', label: 'Contact', newTab: false, variant: 'outline' }],
        logo: createElement('span', null, 'Acme'),
        menuItems: [
          { href: '/work', label: 'Work', newTab: false },
          {
            children: [
              { href: '/services/child-01', label: 'Child 01', newTab: false },
              { href: '/services/child-02', label: 'Child 02', newTab: false },
              { href: '/services/child-03', label: 'Child 03', newTab: false },
            ],
            href: '/services',
            label: 'Services',
            newTab: false,
          },
        ],
        navAlignment: 'center',
        size: 'default',
      }),
    )

    expect(html).toContain('data-header-navbar="true"')
    expect(html).toContain('data-header-navbar-style="navbar12"')
    expect(html).toContain('data-header-navbar-background="subtle"')
    expect(html).toContain('bg-subtle')
    expect(html).toContain('text-foreground')
    expect(html).toContain('border-b')
    expect(html).toContain('Acme')
    expect(html).toContain('Services')
    expect(html).toContain('Contact')
    expect(html).toContain('data-slot="navigation-menu-trigger"')
    expect(html).toContain('lucide-chevron-down')
  })

  it('adapts block data into the navbar shell with site-name fallback', () => {
    const html = renderToStaticMarkup(
      createElement(HeaderNavbar12BlockComponent, {
        appearance: {
          background: 'subtle',
          border: 'bottom',
        },
        blockType: 'headerNavbar12',
        ctaButtons: [
          {
            label: 'Contact',
            linkType: 'custom',
            showArrow: true,
            url: '/contact',
            variant: 'outline',
          },
        ],
        logoHeight: 36,
        logoMode: 'siteDefault',
        menuItems: [
          {
            children: [
              {
                label: 'Overview',
                linkType: 'custom',
                url: '/services/overview',
              },
            ],
            label: 'Services',
            linkType: 'custom',
            url: '/services',
          },
        ],
        navAlignment: 'left',
        siteLogo: null,
        siteName: 'Acme Studio',
        size: 'compact',
      }),
    )

    expect(html).toContain('Acme Studio')
    expect(html).toContain('data-header-navbar-background="subtle"')
    expect(html).toContain('data-slot="navigation-menu-trigger"')
    expect(html).toContain('lucide-chevron-down')
    expect(html).toContain('/contact')
    expect(html).toContain('data-action-arrow="true"')
    expect(html).not.toContain('data-content-link="true"')
  })

  it('uses size-based logo height defaults when no logo override is set', () => {
    const compactHtml = renderToStaticMarkup(
      createElement(HeaderNavbar12BlockComponent, {
        appearance: { background: 'none', border: 'none' },
        blockType: 'headerNavbar12',
        logoMode: 'siteDefault',
        menuItems: [
          {
            label: 'Home',
            linkType: 'custom',
            url: '/',
          },
        ],
        siteLogo: { alt: 'Acme logo', url: '/logo.svg' } as never,
        siteName: 'Acme Studio',
        size: 'compact',
      }),
    )

    const largeHtml = renderToStaticMarkup(
      createElement(HeaderNavbar12BlockComponent, {
        appearance: { background: 'none', border: 'none' },
        blockType: 'headerNavbar12',
        logoMode: 'siteDefault',
        menuItems: [
          {
            label: 'Home',
            linkType: 'custom',
            url: '/',
          },
        ],
        siteLogo: { alt: 'Acme logo', url: '/logo.svg' } as never,
        siteName: 'Acme Studio',
        size: 'large',
      }),
    )

    expect(compactHtml).toContain('height:56px')
    expect(largeHtml).toContain('height:80px')
  })

  it('renders header layout blocks through the shared renderer', () => {
    const html = renderToStaticMarkup(
      createElement(
        'div',
        null,
        renderHeaderBlocks(
          [
            {
              appearance: {
                background: 'primary',
                border: 'bottom',
              },
              blockType: 'headerNavbar12',
              ctaButtons: [
                {
                  label: 'Book',
                  linkType: 'custom',
                  url: '/book',
                  variant: 'default',
                },
              ],
              logoMode: 'siteDefault',
              menuItems: [
                {
                  label: 'Home',
                  linkType: 'custom',
                  url: '/',
                },
              ],
              navAlignment: 'right',
              size: 'large',
            },
          ] as never,
          { siteLogo: null, siteName: 'Acme Studio' },
        ),
      ),
    )

    expect(html).toContain('Acme Studio')
    expect(html).toContain('data-header-navbar-background="primary"')
    expect(html).toContain('Book')
    expect(html).toContain('Home')
    expect(html).toContain('data-size="lg"')
  })

  it('renders mobile parent items with children as expand controls instead of links', () => {
    const html = renderToStaticMarkup(
      createElement(HeaderMobileMenu, {
        ctas: [],
        menuItems: [
          {
            children: [{ href: '/about/overview', label: 'Overview', newTab: false }],
            href: '/about-parent',
            label: 'About',
            newTab: false,
          },
          {
            href: '/contact',
            label: 'Contact',
            newTab: false,
          },
        ],
      }),
    )

    expect(html).toContain('data-header-mobile-menu="true"')
    expect(html).toContain('data-header-mobile-menu-style="navbar12"')
    expect(html).toContain('Open navigation menu')
  })
})
