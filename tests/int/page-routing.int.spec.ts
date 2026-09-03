import { beforeEach, describe, expect, it, vi } from 'vitest'

const payloadMocks = vi.hoisted(() => {
  return {
    auth: vi.fn(),
    find: vi.fn(),
    findGlobal: vi.fn(),
  }
})

vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({
    auth: payloadMocks.auth,
    find: payloadMocks.find,
    findGlobal: payloadMocks.findGlobal,
  })),
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('next/headers', () => ({
  headers: vi.fn(async () => ({})),
}))

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: (...args: unknown[]) => unknown) => fn),
}))

const loadPageData = async () => {
  vi.resetModules()
  return import('@/app/(frontend)/pageData')
}

describe('page routing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the configured homepage path for a published homepage', async () => {
    payloadMocks.findGlobal.mockResolvedValue({
      homepage: 42,
    })
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          id: 42,
          parent: {
            id: 7,
            parent: null,
            slug: 'parent',
          },
          slug: 'home',
        },
      ],
    })

    const { getHomepagePath } = await loadPageData()

    await expect(getHomepagePath()).resolves.toBe('/parent/home')
  })

  it('returns null when no homepage is configured', async () => {
    payloadMocks.findGlobal.mockResolvedValue({
      homepage: null,
    })

    const { getHomepagePath } = await loadPageData()

    await expect(getHomepagePath()).resolves.toBeNull()
  })

  it('returns an object-shaped render state for starter system modes', async () => {
    payloadMocks.findGlobal.mockResolvedValue({
      bypassForLoggedInAdmins: false,
      comingSoonPage: null,
      maintenancePage: null,
      notFoundPage: null,
      siteMode: 'off',
    })

    const { getSystemPageRenderState } = await loadPageData()
    const result = await getSystemPageRenderState('/anything')

    expect(typeof result).toBe('object')
    expect([null, 'maintenance', 'comingSoon']).toContain(result.mode)
    expect(result.page).toBeNull()
  })

  it('returns the active maintenance mode without authenticating the request', async () => {
    payloadMocks.findGlobal.mockImplementation(async ({ slug }) => {
      if (slug === 'page-settings') {
        return { homepage: 42 }
      }

      if (slug === 'system-mode-settings') {
        return {
          comingSoonPage: null,
          maintenancePage: null,
          notFoundPage: null,
          siteMode: 'maintenance',
        }
      }

      return {
        defaultDescription: 'Global fallback description',
        defaultImage: null,
        defaultTitle: 'Global fallback title',
        robots: 'index,follow',
      }
    })

    const { getHomepageMetadata, getHomepageRenderState } = await loadPageData()

    await expect(getHomepageRenderState()).resolves.toEqual({
      mode: 'maintenance',
      page: null,
    })

    await expect(getHomepageMetadata()).resolves.toMatchObject({
      title: 'Maintenance',
    })
    expect(payloadMocks.auth).not.toHaveBeenCalled()
  })

  it('resolves homepage metadata from the shared canonical and robots contract', async () => {
    payloadMocks.findGlobal.mockImplementation(async ({ slug }) => {
      if (slug === 'page-settings') {
        return { homepage: 42 }
      }

      if (slug === 'system-mode-settings') {
        return {
          bypassForLoggedInAdmins: false,
          comingSoonPage: null,
          maintenancePage: null,
          notFoundPage: null,
          siteMode: 'off',
        }
      }

      return {
        defaultDescription: 'Global fallback description',
        defaultImage: null,
        defaultTitle: 'Global fallback title',
        robots: 'index,follow',
      }
    })
    payloadMocks.find.mockResolvedValue({
      docs: [
        {
          canonicalURL: '/custom-home',
          id: 42,
          metaDescription: null,
          metaTitle: null,
          ogDescription: null,
          ogImage: null,
          ogTitle: null,
          parent: null,
          robotsMode: 'noindex',
          slug: 'home',
          title: 'Homepage Title',
        },
      ],
    })

    const { getHomepageMetadata } = await loadPageData()
    const metadata = await getHomepageMetadata()

    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/custom-home')
    expect(metadata.robots).toEqual({
      follow: true,
      index: false,
    })
    expect(metadata.title).toBe('Homepage Title')
    expect(metadata.description).toBe('Global fallback description')
  })
})
