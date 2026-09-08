import { describe, expect, it } from 'vitest'
import { stripInternalMediaFields } from '@/lib/stripInternalMediaFields'
import { resolveCmsLink } from '@/lib/cmsLinks'
import type { Page } from '@/payload-types'

const page = {
  id: 'fees',
  slug: 'fee-structure',
  title: 'Fee structure',
  includeInSitemap: true,
  layout: [{ blockType: 'richText', content: 'x'.repeat(2_200_000) }],
}

describe('cache payload cleanup', () => {
  it('removes full layouts from parentless linked pages without stripping header/footer layouts', () => {
    const shell = {
      activeHeader: { slug: 'header', layout: [{ menuItems: [{ page }] }] },
      activeFooter: { slug: 'footer', layout: [{ links: [{ page }] }] },
    }
    const result = stripInternalMediaFields(shell)
    const linkedPage = result.activeHeader.layout[0].menuItems[0].page
    expect(linkedPage).toEqual({ id: 'fees', slug: 'fee-structure', title: 'Fee structure' })
    expect(result.activeFooter.layout[0].links[0].page).toEqual(linkedPage)
    expect(resolveCmsLink({ linkType: 'page', page: linkedPage as unknown as Page }).href).toBe(
      '/fee-structure',
    )
    expect(Buffer.byteLength(JSON.stringify(result))).toBeLessThan(1_000)
    expect(page.layout[0].content.length).toBe(2_200_000)
  })

  it('keeps the root page content while cleaning linked parents and card media', () => {
    const value = {
      ...page,
      parent: { ...page, id: 'admissions', slug: 'admissions' },
      ogImage: {
        mimeType: 'image/png',
        url: '/media/fees.png',
        alt: 'Fees',
        usageDetails: 'internal',
      },
    }
    const nested = stripInternalMediaFields({ page: value }).page
    expect(nested.parent).not.toHaveProperty('layout')
    expect(nested.ogImage).toEqual({ mimeType: 'image/png', url: '/media/fees.png', alt: 'Fees' })
    expect(resolveCmsLink({ linkType: 'page', page: nested as unknown as Page }).href).toBe(
      '/admissions/fee-structure',
    )
    expect(stripInternalMediaFields(value, true).layout).toEqual(page.layout)
  })

  it.each(['parent', 'robotsMode', 'publicUrlPreview'])(
    'recognizes other Page-specific markers: %s',
    (key) => {
      const { includeInSitemap: _unused, ...sparsePage } = page
      expect(
        stripInternalMediaFields({ page: { ...sparsePage, [key]: null } }).page,
      ).not.toHaveProperty('layout')
    },
  )
})
