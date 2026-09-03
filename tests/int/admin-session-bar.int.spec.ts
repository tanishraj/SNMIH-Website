import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AdminSessionBar } from '@/components/admin/AdminSessionBar'

describe('admin session bar', () => {
  it('renders nothing when there is no authenticated CMS user', () => {
    const html = renderToStaticMarkup(
      createElement(AdminSessionBar, {
        user: null,
      }),
    )

    expect(html).toBe('')
  })

  it('renders the toolbar with branding, admin action, and user menu trigger for authenticated CMS users', () => {
    const html = renderToStaticMarkup(
      createElement(AdminSessionBar, {
        user: {
          email: 'operator@example.com',
          role: 'siteManager',
        },
      } as never),
    )

    expect(html).toContain('Payload')
    expect(html).toContain('/brands/payload-icon-white.svg')
    expect(html).toContain('href="/admin"')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noreferrer"')
    expect(html).toContain('Open Admin')
    expect(html).toContain('Site Manager')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('Open user menu')
    expect(html).toContain('fixed')
    expect(html).toContain('max-w-screen-2xl')
  })
})
