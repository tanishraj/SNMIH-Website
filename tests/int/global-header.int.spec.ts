import fs from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { GlobalHeader } from '@/components/global/GlobalHeader'

describe('global header wiring', () => {
  it('renders nothing without a configured active header layout', () => {
    expect(renderToStaticMarkup(createElement(GlobalHeader, { header: null }))).toBe('')
    expect(
      renderToStaticMarkup(
        createElement(GlobalHeader, {
          header: {
            layout: [],
          },
        }),
      ),
    ).toBe('')
  })

  it('renders the active header preset with a sticky offset', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalHeader, {
        header: {
          layout: [
            {
              blockType: 'headerNavbar12',
              ctaButtons: [
                {
                  label: 'Contact',
                  linkType: 'custom',
                  url: '/contact',
                  variant: 'outline',
                },
              ],
              logoMode: 'siteDefault',
              menuItems: [
                {
                  label: 'Services',
                  linkType: 'custom',
                  url: '/services',
                },
              ],
              navAlignment: 'center',
              size: 'default',
            },
          ],
        } as never,
        siteLogo: null,
        siteName: 'Acme Studio',
        stickyTopOffset: 'calc(3rem + 3rem)',
      }),
    )

    expect(html).toContain('data-global-header="true"')
    expect(html).toContain('position:sticky')
    expect(html).toContain('top:calc(3rem + 3rem)')
    expect(html).toContain('Acme Studio')
    expect(html).toContain('Services')
    expect(html).toContain('Contact')
  })

  it('honors the header preset sticky setting and keeps legacy presets sticky', () => {
    const renderHeader = (sticky?: boolean) =>
      renderToStaticMarkup(
        createElement(GlobalHeader, {
          header: {
            layout: [
              {
                blockType: 'headerNavbar12',
                logoMode: 'siteDefault',
                menuItems: [],
                navAlignment: 'center',
                size: 'default',
                ...(sticky === undefined ? {} : { sticky }),
              },
            ],
          } as never,
          stickyTopOffset: 'calc(3rem + 3rem)',
        }),
      )

    expect(renderHeader()).toContain('data-global-header-sticky="true"')
    expect(renderHeader(true)).toContain('position:sticky')
    expect(renderHeader(false)).toContain('data-global-header-sticky="false"')
    expect(renderHeader(false)).not.toContain('position:sticky')
    expect(renderHeader(false)).not.toContain('top:calc(3rem + 3rem)')
  })

  it('fetches and renders the active header preset in the frontend shell', () => {
    const layoutSource = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/(frontend)/layout.tsx'),
      'utf8',
    )

    expect(layoutSource).toContain(
      "import { GlobalHeader, isGlobalHeaderSticky } from '@/components/global/GlobalHeader'",
    )
    expect(layoutSource).toContain('const activeHeaderID =')
    expect(layoutSource).toContain('const activeHeader =')
    expect(layoutSource).toContain("collection: 'headers'")
    expect(layoutSource).toContain('<GlobalHeader')
    expect(layoutSource).toContain('stickyTopOffset={headerTopOffset}')

    const adminIndex = layoutSource.indexOf('<DeferredAdminSessionBar')
    const announcementIndex = layoutSource.indexOf('<GlobalAnnouncement')
    const headerIndex = layoutSource.indexOf('<GlobalHeader')
    const mainIndex = layoutSource.indexOf('<main id="main-content" data-site-main="true">')

    expect(adminIndex).toBeGreaterThanOrEqual(0)
    expect(announcementIndex).toBeGreaterThan(adminIndex)
    expect(headerIndex).toBeGreaterThan(announcementIndex)
    expect(mainIndex).toBeGreaterThan(headerIndex)
  })
})
