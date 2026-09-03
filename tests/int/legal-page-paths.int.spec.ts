import { describe, expect, it, vi } from 'vitest'

import { resolveLegalPageHrefs } from '@/lib/legalPagePaths'

describe('legal Page path resolution', () => {
  it('resolves top-level Pages without parent lookups', async () => {
    const findByID = vi.fn()

    const result = await resolveLegalPageHrefs(
      {
        privacyPolicyPage: {
          id: 'privacy-page',
          parent: null,
          slug: 'privacy-policy',
        } as never,
        termsAndConditionsPage: {
          id: 'terms-page',
          parent: null,
          slug: 'terms-and-conditions',
        } as never,
      },
      { findByID } as never,
    )

    expect(result).toEqual({
      privacyPolicyUrl: '/privacy-policy',
      termsAndConditionsUrl: '/terms-and-conditions',
    })
    expect(findByID).not.toHaveBeenCalled()
  })

  it('resolves complete ID-backed hierarchies and caches shared parent lookups', async () => {
    const findByID = vi.fn(async ({ id }: { id: string | number }) => {
      if (id === 'legal-page') return { parent: 'company-page', slug: 'legal' }
      if (id === 'company-page') return { parent: null, slug: 'company' }
      throw new Error(`Unexpected Page ID: ${String(id)}`)
    })

    const result = await resolveLegalPageHrefs(
      {
        privacyPolicyPage: {
          id: 'privacy-page',
          parent: 'legal-page',
          slug: 'privacy-policy',
        } as never,
        termsAndConditionsPage: {
          id: 'terms-page',
          parent: 'legal-page',
          slug: 'terms-and-conditions',
        } as never,
      },
      { findByID } as never,
    )

    expect(result).toEqual({
      privacyPolicyUrl: '/company/legal/privacy-policy',
      termsAndConditionsUrl: '/company/legal/terms-and-conditions',
    })
    expect(findByID).toHaveBeenCalledTimes(2)
    expect(findByID).toHaveBeenCalledWith({
      collection: 'pages',
      depth: 0,
      id: 'legal-page',
      select: {
        parent: true,
        slug: true,
      },
    })
  })

  it('omits unpopulated relationships and paths with an unresolved parent', async () => {
    const findByID = vi.fn().mockRejectedValue(new Error('Page not found'))

    const result = await resolveLegalPageHrefs(
      {
        privacyPolicyPage: {
          id: 'privacy-page',
          parent: 'missing-parent',
          slug: 'privacy-policy',
        } as never,
        termsAndConditionsPage: 'terms-page',
      },
      { findByID } as never,
    )

    expect(result).toEqual({
      privacyPolicyUrl: null,
      termsAndConditionsUrl: null,
    })
    expect(findByID).toHaveBeenCalledTimes(1)
  })

  it('omits a populated relationship whose Page slug is missing', async () => {
    const findByID = vi.fn()

    const result = await resolveLegalPageHrefs(
      {
        privacyPolicyPage: {
          id: 'privacy-page',
          parent: null,
          slug: '',
        } as never,
        termsAndConditionsPage: null,
      },
      { findByID } as never,
    )

    expect(result).toEqual({
      privacyPolicyUrl: null,
      termsAndConditionsUrl: null,
    })
    expect(findByID).not.toHaveBeenCalled()
  })
})
